import { SimulationGrid, CellState, TerrainType } from '../simulation';

const TW = 64;
const TH = 32;
const THICK = 9;
const ELEV = 0.45;

const BG = '#0e2217';
const SIDE_L = '#6b4a2f';
const SIDE_R = '#533823';

const shadeCache = new Map<string, string>();
function shade(hex: string, f: number): string {
  const key = hex + '|' + f;
  let v = shadeCache.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  v = `rgb(${r},${g},${b})`;
  shadeCache.set(key, v);
  return v;
}

function rnd(x: number, y: number, k: number): number {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(k + 1, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

interface FireSpot {
  sx: number;
  sy: number;
  gx: number;
  gy: number;
}

export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  hoverCell: { x: number; y: number } | null = null;

  private animTick = 0;

  private zoom = 1;
  private offX = 0;
  private offY = 0;
  private fitZoom = 1;
  private userMoved = false;

  private dpr = 1;
  private cssW = 0;
  private cssH = 0;

  private lastGrid: SimulationGrid | null = null;
  private lastDanger = false;
  private redrawQueued = false;

  private pressed = false;
  private panning = false;
  private spaceHeld = false;
  private dragMoved = false;
  private pointerId = -1;
  private downX = 0;
  private downY = 0;
  private lastX = 0;
  private lastY = 0;
  private prevCursor = '';

  private readonly resizeObserver: ResizeObserver | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;

    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';

    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    const target = canvas.parentElement ?? canvas;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.requestRedraw());
      this.resizeObserver.observe(target);
    } else {
      this.resizeObserver = null;
    }
  }

  dispose(): void {
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.resizeObserver?.disconnect();
  }

  get isPanGesture(): boolean {
    return this.panning;
  }

  get wasDragged(): boolean {
    return this.dragMoved;
  }

  zoomBy(factor: number, clientX?: number, clientY?: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const my = (clientY ?? rect.top + rect.height / 2) - rect.top;
    const nz = clamp(this.zoom * factor, this.minZoom(), this.maxZoom());
    const k = nz / this.zoom;
    this.offX = mx - (mx - this.offX) * k;
    this.offY = my - (my - this.offY) * k;
    this.zoom = nz;
    this.userMoved = true;
    this.clampOffset();
    this.requestRedraw();
  }

  resetView(): void {
    this.userMoved = false;
    this.requestRedraw();
  }

  get relativeZoom(): number {
    return this.fitZoom > 0 ? this.zoom / this.fitZoom : 1;
  }

  screenToCell(clientX: number, clientY: number): { x: number; y: number } | null {
    const grid = this.lastGrid;
    if (!grid) return null;
    const rect = this.canvas.getBoundingClientRect();
    const wx = (clientX - rect.left - this.offX) / this.zoom;
    const wy = (clientY - rect.top - this.offY) / this.zoom;

    const toCell = (sx: number, sy: number): { x: number; y: number } => {
      const a = sx / (TW / 2);
      const b = sy / (TH / 2);
      return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) };
    };

    const g = toCell(wx, wy);
    for (let k = 3; k >= 0; k--) {
      const cx = g.x + k;
      const cy = g.y + k;
      if (!grid.inBounds(cx, cy)) continue;
      const lift = this.liftAt(grid, cx, cy);
      const c = toCell(wx, wy + lift);
      if (c.x === cx && c.y === cy) return { x: cx, y: cy };
    }
    return grid.inBounds(g.x, g.y) ? g : null;
  }

  private minZoom(): number {
    return this.fitZoom * 0.7;
  }

  private maxZoom(): number {
    return Math.max(this.fitZoom * 6, 2.5);
  }

  private bounds(grid: SimulationGrid): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: (-grid.height * TW) / 2,
      maxX: (grid.width * TW) / 2,
      minY: -60,
      maxY: ((grid.width + grid.height) * TH) / 2 + THICK + 20,
    };
  }

  private computeFit(grid: SimulationGrid): void {
    const b = this.bounds(grid);
    const pad = 24;
    const z = Math.min(
      (this.cssW - pad * 2) / (b.maxX - b.minX),
      (this.cssH - pad * 2) / (b.maxY - b.minY)
    );
    this.fitZoom = clamp(z, 0.05, 4);
    if (!this.userMoved) {
      this.zoom = this.fitZoom;
      this.offX = this.cssW / 2 - (this.zoom * (b.minX + b.maxX)) / 2;
      this.offY = this.cssH / 2 - (this.zoom * (b.minY + b.maxY)) / 2;
    }
  }

  private clampOffset(): void {
    const grid = this.lastGrid;
    if (!grid) return;
    const b = this.bounds(grid);
    const m = 80;
    this.offX = clamp(this.offX, m - b.maxX * this.zoom, this.cssW - m - b.minX * this.zoom);
    this.offY = clamp(this.offY, m - b.maxY * this.zoom, this.cssH - m - b.minY * this.zoom);
  }

  private syncSize(): boolean {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(4096, Math.round(rect.width * dpr));
    const h = Math.min(4096, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
    this.cssW = rect.width;
    this.cssH = rect.height;
    return true;
  }

  private requestRedraw(): void {
    if (this.redrawQueued) return;
    this.redrawQueued = true;
    requestAnimationFrame(() => {
      this.redrawQueued = false;
      if (this.lastGrid) this.render(this.lastGrid, this.lastDanger);
    });
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    this.zoomBy(Math.exp(-e.deltaY * unit * 0.0015), e.clientX, e.clientY);
  };

  private onPointerDown = (e: PointerEvent): void => {
    const wantsPan = e.button === 1 || e.button === 2 || (e.button === 0 && this.spaceHeld);
    if (!wantsPan) {
      this.pressed = false;
      return;
    }
    if (e.button === 1) e.preventDefault();
    this.pressed = true;
    this.panning = true;
    this.dragMoved = false;
    this.pointerId = e.pointerId;
    this.downX = this.lastX = e.clientX;
    this.downY = this.lastY = e.clientY;
    this.prevCursor = this.canvas.style.cursor;
    this.canvas.style.cursor = 'grabbing';
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (_err) {}
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.pressed || e.pointerId !== this.pointerId) {
      this.updateHover(e.clientX, e.clientY);
      return;
    }
    if (Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 3) this.dragMoved = true;
    this.offX += e.clientX - this.lastX;
    this.offY += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.userMoved = true;
    this.clampOffset();
    this.requestRedraw();
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId || !this.pressed) return;
    this.pressed = false;
    this.panning = false;
    this.canvas.style.cursor = this.spaceHeld ? 'grab' : this.prevCursor;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch (_err) {}
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== 'Space' || this.spaceHeld) return;
    const el = e.target as HTMLElement | null;
    const tag = el?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
    this.spaceHeld = true;
    e.preventDefault();
    if (!this.panning) {
      this.prevCursor = this.canvas.style.cursor;
      this.canvas.style.cursor = 'grab';
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code !== 'Space' || !this.spaceHeld) return;
    this.spaceHeld = false;
    if (!this.panning) this.canvas.style.cursor = this.prevCursor;
  };

  private onPointerLeave = (): void => {
    if (this.hoverCell) {
      this.hoverCell = null;
      this.requestRedraw();
    }
  };

  private updateHover(clientX: number, clientY: number): void {
    const c = this.screenToCell(clientX, clientY);
    const prev = this.hoverCell;
    const changed = (c?.x ?? -1) !== (prev?.x ?? -1) || (c?.y ?? -1) !== (prev?.y ?? -1);
    if (changed) {
      this.hoverCell = c;
      this.requestRedraw();
    }
  }

  render(grid: SimulationGrid, showDangerZones: boolean = false): void {
    this.lastGrid = grid;
    this.lastDanger = showDangerZones;
    if (!this.syncSize()) return;
    this.computeFit(grid);
    this.clampOffset();

    const { width, height, state, terrain, watchTowers } = grid;
    const ctx = this.ctx;
    const z = this.zoom;
    const d = this.dpr;
    this.animTick++;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(d * z, 0, 0, d * z, d * this.offX, d * this.offY);

    const vx0 = -this.offX / z;
    const vy0 = -this.offY / z;
    const vx1 = (this.cssW - this.offX) / z;
    const vy1 = (this.cssH - this.offY) / z;

    const lod = z < 0.65 ? 0 : z < 1.3 ? 1 : 2;

    const towerAt = new Map<number, number>();
    for (let i = 0; i < watchTowers.length; i++) {
      towerAt.set(watchTowers[i].y * width + watchTowers[i].x, i);
    }

    const fires: FireSpot[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cx = ((x - y) * TW) / 2;
        const cy = ((x + y) * TH) / 2;
        const lift = this.liftAt(grid, x, y);

        if (cx < vx0 - TW || cx > vx1 + TW) continue;
        if (cy + TH + THICK + 20 < vy0 || cy - lift - 80 > vy1) continue;

        const s = state[idx];
        const t = terrain[idx];
        const burning = s === CellState.BURNING;
        const burned = s === CellState.BURNED;

        this.drawCell(ctx, x, y, cx, cy, lift, t, burning, burned, lod);

        if (burning) {
          const sx = cx;
          const sy = cy + TH / 2 - lift;
          this.drawFire(ctx, sx, sy, x, y, lod);
          fires.push({ sx, sy, gx: x, gy: y });
        }

        const ti = towerAt.get(idx);
        if (ti !== undefined) {
          this.drawTower(ctx, cx, cy + TH / 2 - lift);
        }
      }
    }

    if (showDangerZones) {
      ctx.fillStyle = 'rgba(239, 83, 80, 0.16)';
      for (const f of fires) {
        const r = 2.5;
        ctx.beginPath();
        ctx.ellipse(
          f.sx,
          f.sy,
          r * (TW / 2) * Math.SQRT2,
          r * (TH / 2) * Math.SQRT2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    for (let i = 0; i < watchTowers.length; i++) {
      const tw = watchTowers[i];
      const sx = ((tw.x - tw.y) * TW) / 2;
      const sy = ((tw.x + tw.y) * TH) / 2 + TH / 2 - this.liftAt(grid, tw.x, tw.y);
      ctx.beginPath();
      ctx.ellipse(
        sx,
        sy,
        tw.radius * (TW / 2) * Math.SQRT2,
        tw.radius * (TH / 2) * Math.SQRT2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(0, 188, 212, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
      ctx.lineWidth = 1.5 / z;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.drawSmoke(ctx, fires);

    const hc = this.hoverCell;
    if (hc && grid.inBounds(hc.x, hc.y)) {
      const hx = ((hc.x - hc.y) * TW) / 2;
      const hy = ((hc.x + hc.y) * TH) / 2 - this.liftAt(grid, hc.x, hc.y);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + TW / 2, hy + TH / 2);
      ctx.lineTo(hx, hy + TH);
      ctx.lineTo(hx - TW / 2, hy + TH / 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 235, 59, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 2 / z;
      ctx.stroke();
    }
  }

  private liftAt(grid: SimulationGrid, x: number, y: number): number {
    const e = grid.elevation[y * grid.width + x];
    return e > 0 ? Math.min(40, e * ELEV) : 0;
  }

  private groundColor(t: TerrainType): string {
    switch (t) {
      case TerrainType.FOREST:
        return '#2f7d35';
      case TerrainType.BUSHES:
        return '#9aa63a';
      case TerrainType.HOUSES:
        return '#86b84a';
      case TerrainType.WATER:
        return '#1e9be0';
      case TerrainType.WET_GROUND:
        return '#6d4c41';
      case TerrainType.ROAD:
        return '#707070';
      case TerrainType.FIREBREAK:
        return '#e2d2ab';
      default:
        return '#86b84a';
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    cx: number,
    cy: number,
    lift: number,
    t: TerrainType,
    burning: boolean,
    burned: boolean,
    lod: number
  ): void {
    const isWater = t === TerrainType.WATER && !burned;
    const topLift = isWater ? lift - 3 : lift;

    let f = 0.94 + Math.floor(rnd(gx, gy, 1) * 7) * 0.02;
    f *= 1 + Math.min(0.2, lift * 0.012);
    f = Math.round(f * 50) / 50;
    let top = shade(burned ? '#2a2522' : this.groundColor(t), burned ? 1 : f);
    if (burning) top = shade(this.groundColor(t), 0.6);

    this.drawBlock(ctx, cx, cy, lift, topLift, top);

    const bx = cx;
    const by = cy + TH / 2 - topLift;

    if (burned) {
      this.drawBurnedDecor(ctx, bx, by, gx, gy, t, lod);
      return;
    }

    switch (t) {
      case TerrainType.FOREST:
        this.drawForest(ctx, bx, by, gx, gy, lod, burning);
        break;
      case TerrainType.BUSHES:
        this.drawBushes(ctx, bx, by, gx, gy, lod);
        break;
      case TerrainType.HOUSES:
        this.drawHouse(ctx, bx, by, false);
        break;
      case TerrainType.WATER:
        this.drawWater(ctx, bx, by, gx, gy, lod);
        break;
      case TerrainType.WET_GROUND:
        this.drawWetGround(ctx, bx, by, gx, gy);
        break;
      case TerrainType.ROAD:
        this.drawRoad(ctx, bx, by, lod);
        break;
      case TerrainType.FIREBREAK:
        this.drawFirebreak(ctx, bx, by);
        break;
      default:
        this.drawGrass(ctx, bx, by, gx, gy, lod);
        break;
    }

    if (burning) {
      ctx.fillStyle = 'rgba(255, 90, 0, 0.3)';
      this.diamond(ctx, bx, by, 1);
      ctx.fill();
    }
  }

  private diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, k: number): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy - (TH / 2) * k);
    ctx.lineTo(cx + (TW / 2) * k, cy);
    ctx.lineTo(cx, cy + (TH / 2) * k);
    ctx.lineTo(cx - (TW / 2) * k, cy);
    ctx.closePath();
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    lift: number,
    topLift: number,
    top: string
  ): void {
    const depth = THICK + lift;
    const y0 = cy - lift;

    ctx.fillStyle = SIDE_L;
    ctx.beginPath();
    ctx.moveTo(cx - TW / 2, y0 + TH / 2);
    ctx.lineTo(cx, y0 + TH);
    ctx.lineTo(cx, y0 + TH + depth);
    ctx.lineTo(cx - TW / 2, y0 + TH / 2 + depth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = SIDE_R;
    ctx.beginPath();
    ctx.moveTo(cx + TW / 2, y0 + TH / 2);
    ctx.lineTo(cx, y0 + TH);
    ctx.lineTo(cx, y0 + TH + depth);
    ctx.lineTo(cx + TW / 2, y0 + TH / 2 + depth);
    ctx.closePath();
    ctx.fill();

    const ty = cy - topLift;
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(cx, ty);
    ctx.lineTo(cx + TW / 2, ty + TH / 2);
    ctx.lineTo(cx, ty + TH);
    ctx.lineTo(cx - TW / 2, ty + TH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  private drawGrass(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number,
    lod: number
  ): void {
    if (lod < 2) return;
    ctx.strokeStyle = '#a5d36a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ax = 0.15 + rnd(gx, gy, 60 + i) * 0.7;
      const ay = 0.15 + rnd(gx, gy, 70 + i) * 0.7;
      const px = bx + ((ax - ay) * TW) / 2;
      const py = by - TH / 2 + ((ax + ay) * TH) / 2;
      ctx.moveTo(px, py);
      ctx.lineTo(px - 1, py - 3);
      ctx.moveTo(px, py);
      ctx.lineTo(px + 1.5, py - 3.5);
    }
    ctx.stroke();
  }

  private drawForest(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number,
    lod: number,
    burning: boolean
  ): void {
    const count = lod === 0 ? 1 : lod === 1 ? 2 : 3;
    const pts: Array<{ ax: number; ay: number; k: number }> = [];
    for (let i = 0; i < count; i++) {
      const base = count === 1 ? 0.5 : 0.28 + (0.44 * i) / Math.max(1, count - 1);
      pts.push({
        ax: clamp(base + (rnd(gx, gy, 80 + i) - 0.5) * 0.35, 0.18, 0.82),
        ay: clamp(base + (rnd(gx, gy, 90 + i) - 0.5) * 0.5, 0.18, 0.82),
        k: i,
      });
    }
    pts.sort((a, b) => a.ax + a.ay - (b.ax + b.ay));
    for (const p of pts) {
      const sx = bx + ((p.ax - p.ay) * TW) / 2;
      const sy = by - TH / 2 + ((p.ax + p.ay) * TH) / 2;
      this.drawPine(ctx, sx, sy, gx, gy, p.k, lod, burning);
    }
  }

  private drawPine(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    gx: number,
    gy: number,
    k: number,
    lod: number,
    burning: boolean
  ): void {
    const H = (lod === 0 ? 34 : 28) + rnd(gx, gy, 100 + k) * 8;
    const sway = lod >= 1 ? Math.sin(this.animTick * 0.04 + gx * 0.7 + gy * 0.5 + k) * 1.2 : 0;
    const dark = burning ? '#2a3a22' : '#1f6b2a';
    const light = burning ? '#3a4a2c' : '#2f8a3a';

    if (lod >= 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(sx + 4, sy + 1, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#4e342e';
    ctx.fillRect(sx - 1.6, sy - 5, 3.2, 6);

    const layers = lod === 0 ? 2 : 3;
    for (let i = 0; i < layers; i++) {
      const w = 12 * (1 - i * 0.27);
      const baseY = sy - 4 - i * (H * 0.27);
      const tipY = baseY - H * 0.5;
      const tipX = sx + sway * (1 + i * 0.4);
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(sx - w, baseY);
      ctx.lineTo(sx + w, baseY);
      ctx.lineTo(tipX, tipY);
      ctx.closePath();
      ctx.fill();
      if (lod >= 1) {
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(sx - w, baseY);
        ctx.lineTo(sx, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawBushes(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number,
    lod: number
  ): void {
    const n = lod === 0 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const ox = (rnd(gx, gy, 110 + i) - 0.5) * 26;
      const oy = (rnd(gx, gy, 120 + i) - 0.5) * 8;
      const r = 6 + rnd(gx, gy, 130 + i) * 3;
      ctx.fillStyle = '#6f7a1f';
      ctx.beginPath();
      ctx.ellipse(bx + ox, by + oy + 1, r + 1, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a4b03a';
      ctx.beginPath();
      ctx.ellipse(bx + ox - 1, by + oy - 2, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (lod >= 2) {
        ctx.fillStyle = '#c0ca55';
        ctx.beginPath();
        ctx.arc(bx + ox - 2.5, by + oy - 4, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawWater(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number,
    lod: number
  ): void {
    if (lod === 0) return;
    ctx.strokeStyle = 'rgba(191, 230, 251, 0.75)';
    ctx.lineWidth = 1;
    const wave = Math.sin(this.animTick * 0.06 + gx * 0.9 + gy * 0.6);
    ctx.beginPath();
    ctx.moveTo(bx - 12 + wave * 2, by - 2);
    ctx.lineTo(bx - 2 + wave * 2, by - 2);
    ctx.moveTo(bx + 2 - wave * 2, by + 3);
    ctx.lineTo(bx + 12 - wave * 2, by + 3);
    ctx.stroke();
  }

  private drawWetGround(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number
  ): void {
    ctx.fillStyle = '#8d6e63';
    this.diamond(ctx, bx, by, 0.7);
    ctx.fill();
    ctx.fillStyle = 'rgba(129, 212, 250, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bx - 6 + rnd(gx, gy, 140) * 4, by - 1, 3.5, 1.6, 0, 0, Math.PI * 2);
    ctx.ellipse(bx + 7, by + 2, 2.5, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRoad(ctx: CanvasRenderingContext2D, bx: number, by: number, lod: number): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.diamond(ctx, bx, by, 0.72);
    ctx.fill();
    if (lod >= 1) {
      ctx.strokeStyle = 'rgba(255, 224, 130, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx - TW / 4 + 4, by - TH / 4 + 2);
      ctx.lineTo(bx + TW / 4 - 4, by + TH / 4 - 2);
      ctx.stroke();
    }
  }

  private drawFirebreak(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
    ctx.strokeStyle = '#a1887f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const a of [0.3, 0.5, 0.7]) {
      const p0x = bx + ((0.15 - a) * TW) / 2;
      const p0y = by - TH / 2 + ((0.15 + a) * TH) / 2;
      const p1x = bx + ((0.85 - a) * TW) / 2;
      const p1y = by - TH / 2 + ((0.85 + a) * TH) / 2;
      ctx.moveTo(p0x, p0y);
      ctx.lineTo(p1x, p1y);
    }
    ctx.stroke();
  }

  private poly(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>, fill: string): void {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  private drawHouse(ctx: CanvasRenderingContext2D, bx: number, by: number, ruin: boolean): void {
    const h = 0.3;
    const wallH = ruin ? 4 : 13;
    const roofH = 12;
    const P = (ax: number, ay: number, zz: number): [number, number] => [
      bx + ((ax - ay) * TW) / 2,
      by + ((ax + ay) * TH) / 2 - zz,
    ];

    const L0 = P(-h, h, 0);
    const B0 = P(h, h, 0);
    const R0 = P(h, -h, 0);
    const L1 = P(-h, h, wallH);
    const B1 = P(h, h, wallH);
    const R1 = P(h, -h, wallH);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(bx + 3, by + 3, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    this.poly(ctx, [L0, B0, B1, L1], ruin ? '#4a3a32' : '#eadfca');
    this.poly(ctx, [B0, R0, R1, B1], ruin ? '#33271f' : '#cdbfa6');

    if (ruin) {
      ctx.strokeStyle = '#e57373';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(L1[0], L1[1]);
      ctx.lineTo(B1[0], B1[1]);
      ctx.lineTo(R1[0], R1[1]);
      ctx.stroke();
      return;
    }

    const w0 = P(-h + 2 * h * 0.35, h, 4);
    const w1 = P(-h + 2 * h * 0.65, h, 4);
    const w2 = P(-h + 2 * h * 0.65, h, 9);
    const w3 = P(-h + 2 * h * 0.35, h, 9);
    this.poly(ctx, [w0, w1, w2, w3], '#fff59d');

    const o = 1.18;
    const L1o = P(-h * o, h * o, wallH);
    const B1o = P(h * o, h * o, wallH);
    const R1o = P(h * o, -h * o, wallH);
    const A = P(0, 0, wallH + roofH);
    this.poly(ctx, [L1o, B1o, A], '#d03232');
    this.poly(ctx, [B1o, R1o, A], '#a82222');
  }

  private drawTower(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy + 2, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy + 3);
    ctx.lineTo(sx - 5, sy - 30);
    ctx.moveTo(sx + 10, sy + 3);
    ctx.lineTo(sx + 5, sy - 30);
    ctx.moveTo(sx - 8, sy - 6);
    ctx.lineTo(sx + 7, sy - 20);
    ctx.moveTo(sx + 8, sy - 6);
    ctx.lineTo(sx - 7, sy - 20);
    ctx.stroke();

    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(sx - 9, sy - 35, 18, 5);

    ctx.fillStyle = '#00acc1';
    ctx.fillRect(sx - 6, sy - 48, 12, 13);
    ctx.fillStyle = '#4dd0e1';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 48, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  private drawBurnedDecor(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    gx: number,
    gy: number,
    orig: TerrainType,
    lod: number
  ): void {
    ctx.fillStyle = '#4a4440';
    ctx.beginPath();
    ctx.ellipse(bx - 8, by - 1, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(bx + 6, by + 3, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (orig === TerrainType.HOUSES) {
      this.drawHouse(ctx, bx, by, true);
    } else if (orig === TerrainType.FOREST) {
      ctx.strokeStyle = '#1a1512';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const n = lod === 0 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const ox = (rnd(gx, gy, 150 + i) - 0.5) * 20;
        ctx.moveTo(bx + ox, by + 2);
        ctx.lineTo(bx + ox + 1, by - 10 - rnd(gx, gy, 160 + i) * 6);
      }
      ctx.stroke();
    }
  }

  private drawFire(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    gx: number,
    gy: number,
    lod: number
  ): void {
    const t = this.animTick;
    ctx.fillStyle = 'rgba(255, 120, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 26, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const n = lod === 0 ? 2 : 4;
    for (let i = 0; i < n; i++) {
      const ox = (rnd(gx, gy, 10 + i) - 0.5) * 26;
      const oy = (rnd(gx, gy, 20 + i) - 0.5) * 10;
      const ph = t * 0.22 + rnd(gx, gy, 30 + i) * 6.28;
      const h = 18 + rnd(gx, gy, 40 + i) * 12 + Math.sin(ph) * 4;
      const w = 7 + Math.sin(ph * 1.3) * 1.5;
      this.flame(ctx, sx + ox, sy + oy, w, h, '#e8412c');
      this.flame(ctx, sx + ox, sy + oy, w * 0.68, h * 0.72, '#ff9800');
      this.flame(ctx, sx + ox, sy + oy, w * 0.36, h * 0.45, '#fff59d');
    }
  }

  private flame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(
      x - w * 1.1,
      y - h * 0.55,
      x + Math.sin(this.animTick * 0.2 + x) * 2,
      y - h
    );
    ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.55, x + w, y);
    ctx.quadraticCurveTo(x, y + w * 0.5, x - w, y);
    ctx.closePath();
    ctx.fill();
  }

  private drawSmoke(ctx: CanvasRenderingContext2D, fires: FireSpot[]): void {
    for (const f of fires) {
      for (let i = 0; i < 3; i++) {
        const t = (this.animTick * 0.012 + rnd(f.gx, f.gy, 50 + i) + i / 3) % 1;
        const r = 6 + t * 12;
        const px = f.sx + Math.sin(t * 5 + i) * 6 + t * 14;
        const py = f.sy - 22 - t * 55;
        ctx.fillStyle = `rgba(55, 55, 55, ${(0.5 * (1 - t)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
