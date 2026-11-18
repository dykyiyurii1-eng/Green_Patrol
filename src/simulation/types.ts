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
<<<<<<< Updated upstream
=======
  BUSHES = 5,
  HOUSES = 6,
  WET_GROUND = 7,
>>>>>>> Stashed changes
}

export interface WatchTower {
  x: number;
  y: number;
  radius: number;
  mitigationFactor: number;
}

export interface EnvironmentState {
  windSpeed: number;
  windDirectionDeg: number;
  humidity: number;
}

export interface SimulationConfig {
  p_base: number;
  p_veg: Record<TerrainType, number>;
  p_density_scale: number;
  c1: number;
  c2: number;
  a_slope: number;
  burnDuration: number;
<<<<<<< Updated upstream
=======
  heatDangerRadius: number;
>>>>>>> Stashed changes
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
