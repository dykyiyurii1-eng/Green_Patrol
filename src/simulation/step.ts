import { CellState, TerrainType, EnvironmentState, SimulationConfig } from './types';
import { SimulationGrid } from './grid';
import { DEFAULT_SIMULATION_CONFIG } from './config';

// 8 neighbor offsets: dx, dy, and precomputed distance
const NEIGHBORS = [
  { dx: -1, dy: -1, dist: Math.SQRT2, weight: 1 / Math.SQRT2 },
  { dx: 0, dy: -1, dist: 1.0, weight: 1.0 },
  { dx: 1, dy: -1, dist: Math.SQRT2, weight: 1 / Math.SQRT2 },
  { dx: -1, dy: 0, dist: 1.0, weight: 1.0 },
  { dx: 1, dy: 0, dist: 1.0, weight: 1.0 },
  { dx: -1, dy: 1, dist: Math.SQRT2, weight: 1 / Math.SQRT2 },
  { dx: 0, dy: 1, dist: 1.0, weight: 1.0 },
  { dx: 1, dy: 1, dist: Math.SQRT2, weight: 1 / Math.SQRT2 },
];

/**
 * Executes a single discrete time tick of the probabilistic cellular automaton.
 *
 * Implements the multiplicative fire spread formula:
 *   p_burn = p_base * (1 + p_veg) * (1 + p_density) * p_wind * p_slope
 *            * humidityFactor * distanceWeight * towerMitigation
 *
 * Based on:
 *   - Alexandridis et al. (2008) CA model (Spetses Island 1990)
 *   - Almeida & Macau (2001/2011) stochastic 3-state cellular automata
 *   - Cell2Fire (Pais et al., arXiv:1905.09317)
 */
export function simulationStep(
  grid: SimulationGrid,
  env: EnvironmentState,
  rng: () => number,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): void {
  const { width, height, size, state, terrain, density, elevation, burnTicks, watchTowers } = grid;

  // Next state buffer to ensure pure synchronous CA transitions
  const nextState = new Uint8Array(state);

  // Precompute wind unit vector (0 deg = North blowing, 90 deg = East blowing)
  const windAngleRad = ((env.windDirectionDeg - 90) * Math.PI) / 180;
  // Normalized direction vector of where wind blows
  const windDirX = Math.cos(windAngleRad);
  const windDirY = Math.sin(windAngleRad);
  const windSpeed = Math.max(0, env.windSpeed);

  // Precompute humidity factor: at 100% humidity, spread is sharply suppressed (98% reduction)
  const normHumidity = Math.max(0, Math.min(100, env.humidity)) / 100;
  const humidityFactor = Math.max(0.01, 1.0 - Math.pow(normHumidity, 1.6) * 0.98);

  // Precompute watchtower coverage grid lookup or bounding check
  const hasTowers = watchTowers.length > 0;

  // 1. First pass: Handle burning duration of currently burning cells
  for (let i = 0; i < size; i++) {
    if (state[i] === CellState.BURNING) {
      const ticks = burnTicks[i] + 1;
      burnTicks[i] = ticks;
      if (ticks >= config.burnDuration) {
        nextState[i] = CellState.BURNED;
      }
    }
  }

  // 2. Second pass: Check unburned cells for potential ignition from adjacent burning cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Only unburned cells can catch fire
      if (state[idx] !== CellState.UNBURNED) {
        continue;
      }

      const cellTerrain = terrain[idx];
      const p_veg = config.p_veg[cellTerrain as TerrainType] ?? -1.0;

      // Water, roads, and firebreaks have negative flammability and NEVER ignite
      if (
        p_veg < 0 ||
        cellTerrain === TerrainType.WATER ||
        cellTerrain === TerrainType.ROAD ||
        cellTerrain === TerrainType.FIREBREAK
      ) {
        continue;
      }

      const cellElev = elevation[idx];
      const cellDensity = density[idx];
      const p_density = config.p_density_scale * (cellDensity - 1.0);

      // Check watchtower mitigation
      let towerMitigation = 1.0;
      if (hasTowers) {
        for (let t = 0; t < watchTowers.length; t++) {
          const tower = watchTowers[t];
          const distSq = (x - tower.x) ** 2 + (y - tower.y) ** 2;
          if (distSq <= tower.radius ** 2) {
            towerMitigation = Math.min(towerMitigation, tower.mitigationFactor);
          }
        }
      }

      // Check all 8 neighbors: if neighbor is BURNING in the current state, compute ignition chance
      for (let n = 0; n < 8; n++) {
        const neighbor = NEIGHBORS[n];
        const nx = x + neighbor.dx;
        const ny = y + neighbor.dy;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const nIdx = ny * width + nx;
        // Burning neighbor attempting to ignite this cell (dx, dy from neighbor to cell: -neighbor.dx, -neighbor.dy)
        if (state[nIdx] === CellState.BURNING) {
          // Direction vector from burning neighbor to current unburned cell
          const spreadDx = -neighbor.dx;
          const spreadDy = -neighbor.dy;
          const dist = neighbor.dist;

          // Cosine of angle between wind direction vector and spread direction vector
          // dot product: (spreadDx * windDirX + spreadDy * windDirY) / dist
          const cosTheta = (spreadDx * windDirX + spreadDy * windDirY) / dist;

          // Wind factor pw: exponential in wind speed and directional alignment (Alexandridis et al. 2008)
          // Downwind (cosTheta = 1) -> pw = exp(c1 * V)
          // Upwind (cosTheta = -1) -> pw = exp(c1 * V) * exp(-2 * c2 * V)
          const p_wind =
            windSpeed === 0
              ? 1.0
              : Math.exp(config.c1 * windSpeed) *
                Math.exp(config.c2 * windSpeed * (cosTheta - 1.0));

          // Slope factor ps: depends on elevation difference (uphill spread faster)
          const neighborElev = elevation[nIdx];
          const elevationDiff = cellElev - neighborElev; // positive if fire spreading uphill
          const slope = elevationDiff / dist;
          const p_slope = Math.max(0.1, Math.min(3.0, Math.exp(config.a_slope * slope)));

          // Multiplicative probability calculation
          let p_burn =
            config.p_base *
            (1.0 + p_veg) *
            (1.0 + p_density) *
            p_wind *
            p_slope *
            humidityFactor *
            neighbor.weight *
            towerMitigation;

          // Clamp probability within [0, 1]
          p_burn = Math.max(0.0, Math.min(1.0, p_burn));

          // Stochastic trial using seeded PRNG
          if (rng() < p_burn) {
            nextState[idx] = CellState.BURNING;
            burnTicks[idx] = 0;
            break; // Cell is ignited, no need to check other neighbors this tick
          }
        }
      }
    }
  }

  // Synchronously update the grid state
  grid.state.set(nextState);
}
