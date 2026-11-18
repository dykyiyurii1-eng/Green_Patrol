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
  ticks: number;
}

<<<<<<< Updated upstream
/**
 * Runs a deterministic simulation from the unmodified scenario grid (without any player actions)
 * using the exact same random seed and environment.
 * Provides the objective benchmark ("saved vs. baseline") to measure player efficacy.
 */
=======
>>>>>>> Stashed changes
export function runBaselineSimulation(
  cleanGrid: SimulationGrid,
  env: EnvironmentState,
  seed: number,
  maxTicks: number = 300,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): BaselineResult {
  const sim = cleanGrid.clone();
  const rng = createMulberry32(seed);

  const initialForest = sim.countTerrain(TerrainType.FOREST);

  let ticks = 0;
  while (ticks < maxTicks && sim.countBurning() > 0) {
    simulationStep(sim, env, rng, config);
    ticks++;
  }

  const unburnedForest = sim.countUnburnedForest();
  const burnedForest = initialForest - unburnedForest;
  const savedPercent = initialForest > 0 ? (unburnedForest / initialForest) * 100 : 100;

  return {
    initialForest,
    unburnedForest,
    burnedForest,
    savedPercent,
    ticks,
  };
}
