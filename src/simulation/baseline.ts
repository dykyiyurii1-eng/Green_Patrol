import { SimulationGrid } from './grid';
import { EnvironmentState, SimulationConfig, TerrainType } from './types';
import { DEFAULT_SIMULATION_CONFIG } from './config';
import { simulationStep } from './step';
import { createMulberry32 } from './rng';

export interface BaselineResult {
  initialForest: number;
  unburnedForest: number;
  burnedForest: number;
  savedPercent: number;
  initialHouses: number;
  unburnedHouses: number;
  housesSavedPercent: number;
  ticks: number;
}

/**
 * Runs a deterministic simulation from the unmodified scenario grid (without any player actions)
 * using the exact same random seed and environment.
 * Provides the objective benchmark to measure player strategy and village defense.
 */
export function runBaselineSimulation(
  cleanGrid: SimulationGrid,
  env: EnvironmentState,
  seed: number,
  maxTicks: number = 300,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): BaselineResult {
  const sim = cleanGrid.clone();
  const rng = createMulberry32(seed);

  const initialForest = sim.countTerrain(TerrainType.FOREST) + sim.countTerrain(TerrainType.BUSHES);
  const initialHouses = sim.countHouses();

  let ticks = 0;
  while (ticks < maxTicks && sim.countBurning() > 0) {
    simulationStep(sim, env, rng, config);
    ticks++;
  }

  const unburnedForest = sim.countUnburnedForest();
  const burnedForest = initialForest - unburnedForest;
  const savedPercent = initialForest > 0 ? (unburnedForest / initialForest) * 100 : 100;

  const unburnedHouses = sim.countUnburnedHouses();
  const housesSavedPercent = initialHouses > 0 ? (unburnedHouses / initialHouses) * 100 : 100;

  return {
    initialForest,
    unburnedForest,
    burnedForest,
    savedPercent,
    initialHouses,
    unburnedHouses,
    housesSavedPercent,
    ticks,
  };
}
