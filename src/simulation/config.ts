import { SimulationConfig, TerrainType, PlanningBudgetConfig } from './types';

/**
 * DEFAULT_SIMULATION_CONFIG
 *
 * NOTE: These mathematical constants and scaling parameters are designed for
 * educational demonstration and balanced tactical gameplay on a 30x30 grid.
 * Inspired by:
 *  - Alexandridis et al. (2008) / Spetses Island CA
 *  - Almeida & Macau (2001/2011) stochastic fire spread models
 *  - Cell2Fire (Pais et al., arXiv:1905.09317)
 */
export const DEFAULT_SIMULATION_CONFIG: Readonly<SimulationConfig> = {
  // Base probability of fire catching between adjacent cells under neutral conditions
  p_base: 0.38,

  // Vegetation flammability factor p_veg:
  // Water, roads, firebreaks, and wet soil/sand have negative flammability and NEVER burn.
  p_veg: {
    [TerrainType.FOREST]: 0.45,
    [TerrainType.GRASS]: 0.25,
    [TerrainType.BUSHES]: 0.6, // Dry bushes ignite very easily
    [TerrainType.HOUSES]: 0.55, // Wooden village houses are vulnerable to fire
    [TerrainType.WATER]: -1.0, // Water body
    [TerrainType.ROAD]: -1.0, // Dirt road
    [TerrainType.FIREBREAK]: -1.0, // Cleared fire barrier trench
    [TerrainType.WET_GROUND]: -1.0, // Wet soil / shore sand around water (never burns)
  },

  // Scaling factor for fuel density contribution
  p_density_scale: 0.3,

  // Wind speed factor c1 (Alexandridis et al. 2008)
  c1: 0.045,

  // Wind direction alignment sensitivity c2
  c2: 0.13,

  // Slope factor coefficient a_slope
  a_slope: 0.08,

  // Number of ticks a cell burns before turning to ash
  burnDuration: 3,

  // Heat & smoke danger radius around active fire where building firebreaks is prohibited
  // Prevents the trivial exploit of cheesing/boxing the fire at point-blank range
  heatDangerRadius: 2,
};

export const DEFAULT_PLANNING_BUDGET: Readonly<PlanningBudgetConfig> = {
  totalBudget: 60,
  firebreakCostPerCell: 2,
  watchTowerCost: 18,
};

export const DEFAULT_WATCH_TOWER_CONFIG = {
  radius: 6,
  mitigationFactor: 0.35, // Reduces ignition probability by 65% within coverage
};
