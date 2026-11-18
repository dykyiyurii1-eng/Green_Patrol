import { CellState, TerrainType, WatchTower } from './types';

export class SimulationGrid {
  readonly width: number;
  readonly height: number;
  readonly size: number;

  state: Uint8Array;
<<<<<<< Updated upstream
  /** Static terrain: FOREST, GRASS, WATER, ROAD, FIREBREAK */
=======
>>>>>>> Stashed changes
  terrain: Uint8Array;
  density: Float32Array;
  elevation: Float32Array;
  burnTicks: Uint8Array;
  watchTowers: WatchTower[];

  constructor(width: number = 100, height: number = 100) {
    this.width = width;
    this.height = height;
    this.size = width * height;

    this.state = new Uint8Array(this.size);
    this.terrain = new Uint8Array(this.size);
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

<<<<<<< Updated upstream
  /**
   * Performs an exact deep clone of the grid state and terrain.
   * Crucial for baseline comparisons and resets.
   */
=======
  generateWetShorelines(): void {
    const toWet: number[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.getIndex(x, y);
        if (this.terrain[idx] === TerrainType.WATER) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (this.inBounds(nx, ny)) {
                const nIdx = this.getIndex(nx, ny);
                if (
                  this.terrain[nIdx] !== TerrainType.WATER &&
                  this.terrain[nIdx] !== TerrainType.HOUSES
                ) {
                  toWet.push(nIdx);
                }
              }
            }
          }
        }
      }
    }
    for (let i = 0; i < toWet.length; i++) {
      this.terrain[toWet[i]] = TerrainType.WET_GROUND;
    }
  }

  isNearActiveFire(x: number, y: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.inBounds(nx, ny)) {
          if (this.state[this.getIndex(nx, ny)] === CellState.BURNING) {
            return true;
          }
        }
      }
    }
    return false;
  }

>>>>>>> Stashed changes
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
