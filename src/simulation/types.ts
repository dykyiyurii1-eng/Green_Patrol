/**
 * Core type definitions for the Green Patrol wildfire simulation.
 * Pure logic types - no DOM or browser-specific dependencies.
 */

export enum CellState {
  UNBURNED = 0,
  BURNING = 1,
  BURNED = 2,
}

export enum TerrainType {
  FOREST = 0,
  GRASS = 1,
  WATER = 2,
  ROAD = 3,
  FIREBREAK = 4,
}

export interface WatchTower {
  x: number;
  y: number;
  radius: number;
  mitigationFactor: number; // e.g., 0.4 means 60% probability reduction
}

export interface EnvironmentState {
  /** Wind speed in meters per second (0 to 25 m/s) */
  windSpeed: number;
  /** Wind direction in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  windDirectionDeg: number;
  /** Relative humidity in percent (0% to 100%) */
  humidity: number;
}

export interface SimulationConfig {
  /** Base ignition probability under neutral flat & calm conditions (Alexandridis et al. 2008) */
  p_base: number;
  /** Vegetation flammability addition by terrain type */
  p_veg: Record<TerrainType, number>;
  /** Fuel density coefficient scale */
  p_density_scale: number;
  /** Wind speed coefficient (Alexandridis c1) */
  c1: number;
  /** Wind direction alignment coefficient (Alexandridis c2) */
  c2: number;
  /** Slope / altitude difference coefficient */
  a_slope: number;
  /** How many simulation ticks a cell stays in BURNING state before transitioning to BURNED */
  burnDuration: number;
}

export interface SimulationMetrics {
  totalCells: number;
  initialForestCells: number;
  currentUnburnedForest: number;
  currentBurning: number;
  currentBurned: number;
  forestSavedPercent: number;
  ticks: number;
  isComplete: boolean;
}

export interface PlanningBudgetConfig {
  totalBudget: number;
  firebreakCostPerCell: number;
  watchTowerCost: number;
}
