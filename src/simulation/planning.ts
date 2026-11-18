import { SimulationGrid } from './grid';
import { TerrainType, WatchTower, PlanningBudgetConfig } from './types';
import { DEFAULT_WATCH_TOWER_CONFIG, DEFAULT_SIMULATION_CONFIG } from './config';

export interface PlayerAction {
  type: 'firebreak' | 'watchtower';
  x: number;
  y: number;
  cost: number;
  originalTerrain?: TerrainType;
}

export class PlanningManager {
  readonly grid: SimulationGrid;
  readonly budgetConfig: PlanningBudgetConfig;
  readonly actions: PlayerAction[];
  budgetUsed: number;
  lastErrorMessage: string = '';

  constructor(grid: SimulationGrid, budgetConfig: PlanningBudgetConfig) {
    this.grid = grid;
    this.budgetConfig = budgetConfig;
    this.actions = [];
    this.budgetUsed = 0;
  }

  get remainingBudget(): number {
    return this.budgetConfig.totalBudget - this.budgetUsed;
  }

  canAfford(cost: number): boolean {
    return this.budgetUsed + cost <= this.budgetConfig.totalBudget;
  }

  placeFirebreak(
    x: number,
    y: number,
    heatRadius: number = DEFAULT_SIMULATION_CONFIG.heatDangerRadius
  ): boolean {
    if (!this.grid.inBounds(x, y)) {
      this.lastErrorMessage = 'Поза межами карти';
      return false;
    }

    const idx = this.grid.getIndex(x, y);
    const currentTerrain = this.grid.terrain[idx];

    // Cannot build on water, wet ground, roads or houses
    if (
      currentTerrain === TerrainType.WATER ||
      currentTerrain === TerrainType.WET_GROUND ||
      currentTerrain === TerrainType.FIREBREAK ||
      currentTerrain === TerrainType.HOUSES
    ) {
      this.lastErrorMessage = 'Тут не можна копати смугу';
      return false;
    }

    // Heat & smoke danger zone check: cannot cheese by walling fire at point blank range
    if (this.grid.isNearActiveFire(x, y, heatRadius)) {
      this.lastErrorMessage =
        'Занадто близько до полум’я! Спека та їдкий дим не дозволяють працювати впритул до вогню.';
      return false;
    }

    const cost = this.budgetConfig.firebreakCostPerCell;
    if (!this.canAfford(cost)) {
      this.lastErrorMessage = 'Вичерпано запас часу та ресурсів фермера';
      return false;
    }

    this.budgetUsed += cost;
    this.actions.push({
      type: 'firebreak',
      x,
      y,
      cost,
      originalTerrain: currentTerrain,
    });

    this.grid.terrain[idx] = TerrainType.FIREBREAK;
    this.lastErrorMessage = '';
    return true;
  }

  placeWatchTower(
    x: number,
    y: number,
    radius: number = DEFAULT_WATCH_TOWER_CONFIG.radius,
    mitigationFactor: number = DEFAULT_WATCH_TOWER_CONFIG.mitigationFactor
  ): boolean {
    if (!this.grid.inBounds(x, y)) {
      this.lastErrorMessage = 'Поза межами карти';
      return false;
    }

    const idx = this.grid.getIndex(x, y);
    if (this.grid.terrain[idx] === TerrainType.WATER) {
      this.lastErrorMessage = 'Не можна будувати вежу на воді';
      return false;
    }

    if (this.grid.isNearActiveFire(x, y, DEFAULT_SIMULATION_CONFIG.heatDangerRadius)) {
      this.lastErrorMessage = 'Занадто близько до вогню!';
      return false;
    }

    const cost = this.budgetConfig.watchTowerCost;
    if (!this.canAfford(cost)) {
      this.lastErrorMessage = 'Недостатньо ресурсів для побудови вежі';
      return false;
    }

    const alreadyExists = this.grid.watchTowers.some((t) => t.x === x && t.y === y);
    if (alreadyExists) {
      this.lastErrorMessage = 'Вежа тут уже встановлена';
      return false;
    }

    const tower: WatchTower = { x, y, radius, mitigationFactor };
    this.budgetUsed += cost;
    this.actions.push({
      type: 'watchtower',
      x,
      y,
      cost,
    });

    this.grid.watchTowers.push(tower);
    this.lastErrorMessage = '';
    return true;
  }

  undo(): boolean {
    const lastAction = this.actions.pop();
    if (!lastAction) {
      return false;
    }

    this.budgetUsed = Math.max(0, this.budgetUsed - lastAction.cost);

    if (lastAction.type === 'firebreak' && lastAction.originalTerrain !== undefined) {
      const idx = this.grid.getIndex(lastAction.x, lastAction.y);
      this.grid.terrain[idx] = lastAction.originalTerrain;
    } else if (lastAction.type === 'watchtower') {
      const towerIdx = this.grid.watchTowers.findIndex(
        (t) => t.x === lastAction.x && t.y === lastAction.y
      );
      if (towerIdx !== -1) {
        this.grid.watchTowers.splice(towerIdx, 1);
      }
    }

    this.lastErrorMessage = '';
    return true;
  }

  reset(originalGrid: SimulationGrid): void {
    this.actions.length = 0;
    this.budgetUsed = 0;
    this.grid.terrain.set(originalGrid.terrain);
    this.grid.state.set(originalGrid.state);
    this.grid.watchTowers = originalGrid.watchTowers.map((t) => ({ ...t }));
    this.lastErrorMessage = '';
  }
}
