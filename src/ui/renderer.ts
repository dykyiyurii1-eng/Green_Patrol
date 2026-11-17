import { SimulationGrid, CellState, TerrainType } from '../simulation';

const COLORS = {
  GRASS: '#689f38',
  GRASS_DETAIL: '#7cb342',
  FOREST_BASE: '#2e7d32',
  BUSH_BASE: '#827717',
  WATER: '#0288d1',
  WATER_RIPPLE: '#81d4fa',
  WET_GROUND: '#5d4037',
  WET_GROUND_SAND: '#795548',
  ROAD: '#616161',
  ROAD_EDGE: '#424242',
  FIREBREAK: '#d7ccc8',
  FIREBREAK_FURROW: '#a1887f',
  HOUSE_WALL: '#d7ccc8',
  HOUSE_ROOF: '#c62828',
  HOUSE_WINDOW: '#fff59d',
  BURNING_CORE: '#fff9c4',
  BURNING_MID: '#ff9800',
  BURNING_OUTER: '#d84315',
  BURNED: '#1c1c1c',
  BURNED_ASH: '#424242',
  GRID_LINE: 'rgba(255, 255, 255, 0.05)',
  TOWER_ZONE: 'rgba(0, 188, 212, 0.16)',
  TOWER_BORDER: 'rgba(0, 151, 167, 0.7)',
  DANGER_ZONE: 'rgba(239, 83, 80, 0.14)',
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

  render(grid: SimulationGrid, showDangerZones: boolean = false): void {
    const { width, height, state, terrain, elevation, watchTowers } = grid;
    const ctx = this.ctx;
    const cw = this.canvas.width / width;
    const ch = this.canvas.height / height;

    this.animTick++;

    // 1. Draw each cell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const s = state[idx];
        const t = terrain[idx];
        const elev = elevation[idx];
        const px = x * cw;
        const py = y * ch;

        if (s === CellState.BURNING) {
          this.drawBurningCell(ctx, px, py, cw, ch, x, y);
        } else if (s === CellState.BURNED) {
          this.drawBurnedCell(ctx, px, py, cw, ch, t);
        } else {
          this.drawTerrainCell(ctx, px, py, cw, ch, t, elev);
        }

        // Subtle cell grid boundary
        ctx.strokeStyle = COLORS.GRID_LINE;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cw, ch);
      }
    }

    // 2. Draw danger heat zone around fire in preparation phase
    if (showDangerZones) {
      ctx.fillStyle = COLORS.DANGER_ZONE;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid.state[grid.getIndex(x, y)] === CellState.BURNING) {
            ctx.beginPath();
            ctx.arc((x + 0.5) * cw, (y + 0.5) * ch, cw * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 3. Draw watchtowers and coverage zones
    for (let i = 0; i < watchTowers.length; i++) {
      const tower = watchTowers[i];
      const cx = (tower.x + 0.5) * cw;
      const cy = (tower.y + 0.5) * ch;
      const r = tower.radius * cw;

      // Protective water zone
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.TOWER_ZONE;
      ctx.fill();
      ctx.strokeStyle = COLORS.TOWER_BORDER;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Watchtower icon
      this.drawTowerIcon(ctx, cx, cy, cw);
    }
  }

  private drawTerrainCell(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    w: number,
    h: number,
    type: TerrainType,
    elev: number
  ): void {
    switch (type) {
      case TerrainType.FOREST: {
        // Deep forest with tree sprite
        const hillOffset = Math.min(25, elev * 0.4);
        ctx.fillStyle = hillOffset > 0 ? '#1b5e20' : COLORS.FOREST_BASE;
        ctx.fillRect(px, py, w, h);

        // Pine tree icon
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(px + w * 0.43, py + h * 0.65, w * 0.14, h * 0.3); // Trunk

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.moveTo(px + w * 0.5, py + h * 0.15);
        ctx.lineTo(px + w * 0.8, py + h * 0.7);
        ctx.lineTo(px + w * 0.2, py + h * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case TerrainType.BUSHES: {
        // Bushy ground with shrub cluster
        ctx.fillStyle = '#827717';
        ctx.fillRect(px, py, w, h);

        ctx.fillStyle = '#9e9d24';
        ctx.beginPath();
        ctx.arc(px + w * 0.35, py + h * 0.55, w * 0.22, 0, Math.PI * 2);
        ctx.arc(px + w * 0.65, py + h * 0.55, w * 0.22, 0, Math.PI * 2);
        ctx.arc(px + w * 0.5, py + h * 0.4, w * 0.24, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TerrainType.HOUSES: {
        // Village house of the farmer
        ctx.fillStyle = '#558b2f'; // Garden grass around house
        ctx.fillRect(px, py, w, h);

        // House walls
        const hw = w * 0.68;
        const hh = h * 0.45;
        const hx = px + (w - hw) / 2;
        const hy = py + h * 0.45;
        ctx.fillStyle = COLORS.HOUSE_WALL;
        ctx.fillRect(hx, hy, hw, hh);

        // Roof
        ctx.fillStyle = COLORS.HOUSE_ROOF;
        ctx.beginPath();
        ctx.moveTo(px + w * 0.5, py + h * 0.18);
        ctx.lineTo(hx + hw + 2, hy);
        ctx.lineTo(hx - 2, hy);
        ctx.closePath();
        ctx.fill();

        // Glowing window
        ctx.fillStyle = COLORS.HOUSE_WINDOW;
        ctx.fillRect(hx + hw * 0.35, hy + hh * 0.25, hw * 0.3, hh * 0.4);
        break;
      }

      case TerrainType.WATER: {
        // Shimmering water
        ctx.fillStyle = COLORS.WATER;
        ctx.fillRect(px, py, w, h);

        // Wave ripple
        ctx.strokeStyle = COLORS.WATER_RIPPLE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const waveY = py + h * 0.5 + Math.sin(this.animTick * 0.08 + px * 0.2) * 1.5;
        ctx.moveTo(px + w * 0.2, waveY);
        ctx.lineTo(px + w * 0.8, waveY);
        ctx.stroke();
        break;
      }

      case TerrainType.WET_GROUND: {
        // Damp shoreline sand/soil (fire cannot burn here)
        ctx.fillStyle = COLORS.WET_GROUND;
        ctx.fillRect(px, py, w, h);

        ctx.fillStyle = COLORS.WET_GROUND_SAND;
        ctx.fillRect(px + w * 0.15, py + h * 0.15, w * 0.7, h * 0.7);

        // Water droplets/damp shine
        ctx.fillStyle = 'rgba(129, 212, 250, 0.4)';
        ctx.beginPath();
        ctx.arc(px + w * 0.4, py + h * 0.4, 2, 0, Math.PI * 2);
        ctx.arc(px + w * 0.7, py + h * 0.65, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case TerrainType.ROAD: {
        ctx.fillStyle = COLORS.ROAD;
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = COLORS.ROAD_EDGE;
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, w, h);
        break;
      }

      case TerrainType.FIREBREAK: {
        // Plowing trench
        ctx.fillStyle = COLORS.FIREBREAK;
        ctx.fillRect(px, py, w, h);

        ctx.strokeStyle = COLORS.FIREBREAK_FURROW;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + w * 0.2, py + 2);
        ctx.lineTo(px + w * 0.2, py + h - 2);
        ctx.moveTo(px + w * 0.5, py + 2);
        ctx.lineTo(px + w * 0.5, py + h - 2);
        ctx.moveTo(px + w * 0.8, py + 2);
        ctx.lineTo(px + w * 0.8, py + h - 2);
        ctx.stroke();
        break;
      }

      default: {
        // Plain grass
        ctx.fillStyle = COLORS.GRASS;
        ctx.fillRect(px, py, w, h);
        break;
      }
    }
  }

  private drawBurningCell(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    w: number,
    h: number,
    gx: number,
    gy: number
  ): void {
    // Red-orange flame background
    ctx.fillStyle = COLORS.BURNING_OUTER;
    ctx.fillRect(px, py, w, h);

    // Animated dancing flame tongues
    const flicker = Math.sin(this.animTick * 0.3 + gx * 2.1 + gy * 1.7) * 2;
    ctx.fillStyle = COLORS.BURNING_MID;
    ctx.beginPath();
    ctx.arc(px + w * 0.5, py + h * 0.6 + flicker * 0.5, w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Hot yellow core
    ctx.fillStyle = COLORS.BURNING_CORE;
    ctx.beginPath();
    ctx.arc(px + w * 0.5, py + h * 0.65, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBurnedCell(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    w: number,
    h: number,
    origTerrain: TerrainType
  ): void {
    ctx.fillStyle = COLORS.BURNED;
    ctx.fillRect(px, py, w, h);

    // Ash and charcoal texture
    ctx.fillStyle = COLORS.BURNED_ASH;
    ctx.fillRect(px + w * 0.2, py + h * 0.3, w * 0.6, h * 0.15);
    ctx.fillRect(px + w * 0.35, py + h * 0.6, w * 0.4, h * 0.15);

    if (origTerrain === TerrainType.HOUSES) {
      // Burnt house ruins
      ctx.strokeStyle = '#e57373';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + w * 0.25, py + h * 0.35, w * 0.5, h * 0.4);
    }
  }

  private drawTowerIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number): void {
    const size = cw * 0.7;
    // Tower base legs
    ctx.strokeStyle = '#006064';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.4, cy + size * 0.4);
    ctx.lineTo(cx, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.4, cy + size * 0.4);
    ctx.moveTo(cx - size * 0.3, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.3, cy + size * 0.1);
    ctx.stroke();

    // Water barrel / beacon platform at top
    ctx.fillStyle = '#00bcd4';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.4, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
