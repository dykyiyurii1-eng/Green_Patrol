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
