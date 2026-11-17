import { SimulationGrid, CellState, TerrainType } from '../simulation';

// Visual color palette for terrain and fire states
const COLORS = {
  FOREST: '#2e7d32',
  FOREST_HIGH: '#1b5e20',
  GRASS: '#8bc34a',
  WATER: '#0288d1',
  ROAD: '#757575',
  FIREBREAK: '#d7ccc8',
  BURNING_CORE: '#fff176',
  BURNING_OUTER: '#f4511e',
  BURNED: '#212121',
  GRID_LINE: 'rgba(0, 0, 0, 0.04)',
  TOWER_ZONE: 'rgba(0, 188, 212, 0.18)',
  TOWER_BORDER: 'rgba(0, 151, 167, 0.6)',
  TOWER_ICON: '#006064',
};

export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private animTick: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
  }

  render(grid: SimulationGrid, showGridLines: boolean = false): void {
    const { width, height, state, terrain, elevation, watchTowers } = grid;
    const ctx = this.ctx;
    const cellW = this.canvas.width / width;
    const cellH = this.canvas.height / height;

    this.animTick++;

    // 1. Draw each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const s = state[idx];
        const t = terrain[idx];
        const elev = elevation[idx];

        let fillColor: string;

        if (s === CellState.BURNING) {
          // Animated pulsating fire
          const pulse = (Math.sin(this.animTick * 0.2 + x * 0.5 + y * 0.3) + 1) / 2;
          fillColor = pulse > 0.5 ? COLORS.BURNING_CORE : COLORS.BURNING_OUTER;
        } else if (s === CellState.BURNED) {
          fillColor = COLORS.BURNED;
        } else {
          // Unburned terrain
          switch (t) {
            case TerrainType.FOREST:
              // Darker green if high elevation
              fillColor = elev > 20 ? COLORS.FOREST_HIGH : COLORS.FOREST;
              break;
            case TerrainType.GRASS:
              fillColor = COLORS.GRASS;
              break;
            case TerrainType.WATER:
              fillColor = COLORS.WATER;
              break;
            case TerrainType.ROAD:
              fillColor = COLORS.ROAD;
              break;
            case TerrainType.FIREBREAK:
              fillColor = COLORS.FIREBREAK;
              break;
            default:
              fillColor = COLORS.FOREST;
          }
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.3, cellH + 0.3);
      }
    }

    // 2. Draw watchtowers and coverage radii
    for (let i = 0; i < watchTowers.length; i++) {
      const tower = watchTowers[i];
      const cx = (tower.x + 0.5) * cellW;
      const cy = (tower.y + 0.5) * cellH;
      const r = tower.radius * cellW;

      // Draw mitigation circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.TOWER_ZONE;
      ctx.fill();
      ctx.strokeStyle = COLORS.TOWER_BORDER;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw tower center marker
      ctx.beginPath();
      ctx.arc(cx, cy, cellW * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.TOWER_ICON;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Optional subtle grid lines
    if (showGridLines && cellW > 4) {
      ctx.strokeStyle = COLORS.GRID_LINE;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 5) {
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, this.canvas.height);
      }
      for (let y = 0; y <= height; y += 5) {
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(this.canvas.width, y * cellH);
      }
      ctx.stroke();
    }
  }
}
