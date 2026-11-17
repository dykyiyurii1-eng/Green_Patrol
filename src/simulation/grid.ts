import { CellState, TerrainType, WatchTower } from './types';

export class SimulationGrid {
  readonly width: number;
  readonly height: number;
  readonly size: number;

  /** Cell dynamic state: UNBURNED (0), BURNING (1), BURNED (2) */
  state: Uint8Array;
  /** Static terrain: FOREST, GRASS, WATER, ROAD, FIREBREAK */
  terrain: Uint8Array;
  /** Fuel density factor between 0.0 and 1.0 (default 1.0) */
  density: Float32Array;
  /** Elevation in meters (default 0.0) */
  elevation: Float32Array;
  /** Counter of how many ticks a cell has been actively burning */
  burnTicks: Uint8Array;
  /** Active watchtowers / water mitigation points */
  watchTowers: WatchTower[];

  constructor(width: number = 100, height: number = 100) {
    this.width = width;
    this.height = height;
    this.size = width * height;

    this.state = new Uint8Array(this.size);
    this.terrain = new Uint8Array(this.size); // Defaults to FOREST (0)
    this.density = new Float32Array(this.size);
    this.density.fill(1.0);
    this.elevation = new Float32Array(this.size);
    this.elevation.fill(0.0);
    this.burnTicks = new Uint8Array(this.size);
    this.watchTowers = [];
  }

  getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  getCoords(index: number): { x: number; y: number } {
    return {
      x: index % this.width,
      y: Math.floor(index / this.width),
    };
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Performs an exact deep clone of the grid state and terrain.
   * Crucial for baseline comparisons and resets.
   */
  clone(): SimulationGrid {
    const copy = new SimulationGrid(this.width, this.height);
    copy.state.set(this.state);
    copy.terrain.set(this.terrain);
    copy.density.set(this.density);
    copy.elevation.set(this.elevation);
    copy.burnTicks.set(this.burnTicks);
    copy.watchTowers = this.watchTowers.map((t) => ({ ...t }));
    return copy;
  }

  /**
   * Count total cells of a specific terrain type.
   */
  countTerrain(type: TerrainType): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.terrain[i] === type) {
        count++;
      }
    }
    return count;
  }

  /**
   * Count how many FOREST cells are still unburned.
   */
  countUnburnedForest(): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.terrain[i] === TerrainType.FOREST && this.state[i] === CellState.UNBURNED) {
        count++;
      }
    }
    return count;
  }

  countBurning(): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.state[i] === CellState.BURNING) {
        count++;
      }
    }
    return count;
  }

  countBurned(): number {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.state[i] === CellState.BURNED) {
        count++;
      }
    }
    return count;
  }
}
