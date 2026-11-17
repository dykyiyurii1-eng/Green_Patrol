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
  FOREST = 0, // Густі дерева
  GRASS = 1, // Звичайна трава
  WATER = 2, // Водойма (річка, озеро, ставок)
  ROAD = 3, // Дорога
  FIREBREAK = 4, // Мінералізована протипожежна смуга (рів)
  BUSHES = 5, // Сухі кущі (швидко займаються)
  HOUSES = 6, // Хатинки селища фермера (ціль оборони!)
  WET_GROUND = 7, // Мокра земля / пісок біля води (не горить)
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
  /** Radius around active fire where building is prohibited (danger heat zone) */
  heatDangerRadius: number;
}

export interface SimulationMetrics {
  totalCells: number;
  initialForestCells: number;
  currentUnburnedForest: number;
  initialHouseCells: number;
  currentUnburnedHouses: number;
  currentBurning: number;
  currentBurned: number;
  forestSavedPercent: number;
  villageSavedPercent: number;
  ticks: number;
  isComplete: boolean;
}

export interface PlanningBudgetConfig {
  totalBudget: number;
  firebreakCostPerCell: number;
  watchTowerCost: number;
}
