import { SimulationConfig, TerrainType, PlanningBudgetConfig } from './types';

export const DEFAULT_SIMULATION_CONFIG: Readonly<SimulationConfig> = {
  p_base: 0.38,

  p_veg: {
    [TerrainType.FOREST]: 0.45,
    [TerrainType.GRASS]: 0.25,
    [TerrainType.BUSHES]: 0.6,
    [TerrainType.HOUSES]: 0.55,
    [TerrainType.WATER]: -1.0,
    [TerrainType.ROAD]: -1.0,
    [TerrainType.FIREBREAK]: -1.0,
    [TerrainType.WET_GROUND]: -1.0,
  },

  p_density_scale: 0.3,

  c1: 0.045,

  c2: 0.13,

  a_slope: 0.08,

  burnDuration: 3,

  heatDangerRadius: 2,
};

export const DEFAULT_PLANNING_BUDGET: Readonly<PlanningBudgetConfig> = {
  totalBudget: 60,
  firebreakCostPerCell: 2,
  watchTowerCost: 18,
};

export const DEFAULT_WATCH_TOWER_CONFIG = {
  radius: 6,
  mitigationFactor: 0.35,
};
