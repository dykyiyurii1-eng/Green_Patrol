import { SimulationConfig, TerrainType, PlanningBudgetConfig } from './types';

/**
 * DEFAULT_SIMULATION_CONFIG
 *
 * NOTE: These mathematical constants and scaling parameters are designed for
 * educational demonstration and balanced gameplay in a 2D cellular automaton.
 * They are inspired by the mathematical formulations in:
 *  - Alexandridis et al. (2008) / Parallel CA Wildfire (Spetses Island 1990)
 *  - Almeida & Macau (2001/2011) stochastic fire spread models
 *  - Cell2Fire (Pais et al., arXiv:1905.09317)
 *  - PyTorchFire (Xia & Cheng)
 *
 * IMPORTANT DISCLAIMER:
 * These parameters are illustrative and educational; they are NOT calibrated
 * for real-world operational wildland fire behaviour prediction or hazard forecasting.
 */
export const DEFAULT_SIMULATION_CONFIG: Readonly<SimulationConfig> = {
  // Base probability of fire catching between adjacent cells under neutral conditions
  p_base: 0.38,

  // Vegetation flammability factor p_veg:
  // Forest is highly combustible; grass is lighter and ignites moderately fast;
  // Water, roads, and firebreaks have flammability = -1 (non-flammable, ignition probability = 0).
  p_veg: {
    [TerrainType.FOREST]: 0.45,
    [TerrainType.GRASS]: 0.25,
    [TerrainType.WATER]: -1.0,
    [TerrainType.ROAD]: -1.0,
    [TerrainType.FIREBREAK]: -1.0,
  },

  // Scaling factor for fuel density contribution (1 + p_density)
  p_density_scale: 0.3,

  // Wind speed factor c1 (Alexandridis et al. 2008)
  c1: 0.045,

  // Wind direction alignment sensitivity c2:
  // Amplifies fire spread downwind and dampens spread upwind
  c2: 0.13,

  // Slope factor coefficient a_slope:
  // Fire spreads faster uphill due to preheating of fuels
  a_slope: 0.08,

  // Number of ticks a cell burns before turning to ash (BURNED)
  burnDuration: 3,
};

export const DEFAULT_PLANNING_BUDGET: Readonly<PlanningBudgetConfig> = {
  totalBudget: 120,
  firebreakCostPerCell: 2,
  watchTowerCost: 20,
};

export const DEFAULT_WATCH_TOWER_CONFIG = {
  radius: 8,
  mitigationFactor: 0.4, // Reduces ignition probability by 60% within coverage
};
