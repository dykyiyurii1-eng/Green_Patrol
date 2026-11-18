import { CellState, TerrainType, EnvironmentState, SimulationConfig } from './types';
import { SimulationGrid } from './grid';
import { DEFAULT_SIMULATION_CONFIG } from './config';

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

export function simulationStep(
  grid: SimulationGrid,
  env: EnvironmentState,
  rng: () => number,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): void {
  const { width, height, size, state, terrain, density, elevation, burnTicks, watchTowers } = grid;

  const nextState = new Uint8Array(state);

  const windAngleRad = ((env.windDirectionDeg - 90) * Math.PI) / 180;
  const windDirX = Math.cos(windAngleRad);
  const windDirY = Math.sin(windAngleRad);
  const windSpeed = Math.max(0, env.windSpeed);

  const normHumidity = Math.max(0, Math.min(100, env.humidity)) / 100;
  const humidityFactor = Math.max(0.01, 1.0 - Math.pow(normHumidity, 1.6) * 0.98);

  const hasTowers = watchTowers.length > 0;

  for (let i = 0; i < size; i++) {
    if (state[i] === CellState.BURNING) {
      const ticks = burnTicks[i] + 1;
      burnTicks[i] = ticks;
      if (ticks >= config.burnDuration) {
        nextState[i] = CellState.BURNED;
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (state[idx] !== CellState.UNBURNED) {
        continue;
      }

      const cellTerrain = terrain[idx];
      const p_veg = config.p_veg[cellTerrain as TerrainType] ?? -1.0;

      if (
        p_veg < 0 ||
        cellTerrain === TerrainType.WATER ||
        cellTerrain === TerrainType.ROAD ||
        cellTerrain === TerrainType.FIREBREAK ||
        cellTerrain === TerrainType.WET_GROUND
      ) {
        continue;
      }

      const cellElev = elevation[idx];
      const cellDensity = density[idx];
      const p_density = config.p_density_scale * (cellDensity - 1.0);

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

      for (let n = 0; n < 8; n++) {
        const neighbor = NEIGHBORS[n];
        const nx = x + neighbor.dx;
        const ny = y + neighbor.dy;

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        const nIdx = ny * width + nx;
        if (state[nIdx] === CellState.BURNING) {
          const spreadDx = -neighbor.dx;
          const spreadDy = -neighbor.dy;
          const dist = neighbor.dist;

          const cosTheta = (spreadDx * windDirX + spreadDy * windDirY) / dist;

          const p_wind =
            windSpeed === 0
              ? 1.0
              : Math.exp(config.c1 * windSpeed) *
                Math.exp(config.c2 * windSpeed * (cosTheta - 1.0));

          const neighborElev = elevation[nIdx];
          const elevationDiff = cellElev - neighborElev;
          const slope = elevationDiff / dist;
          const p_slope = Math.max(0.1, Math.min(3.0, Math.exp(config.a_slope * slope)));

          let p_burn =
            config.p_base *
            (1.0 + p_veg) *
            (1.0 + p_density) *
            p_wind *
            p_slope *
            humidityFactor *
            neighbor.weight *
            towerMitigation;

          p_burn = Math.max(0.0, Math.min(1.0, p_burn));

          if (rng() < p_burn) {
            nextState[idx] = CellState.BURNING;
            burnTicks[idx] = 0;
            break;
          }
        }
      }
    }
  }

  grid.state.set(nextState);
}
