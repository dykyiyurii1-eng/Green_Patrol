import Phaser from 'phaser';
import {
  WalkOptions,
  LandmarkSpot,
  HeroRig,
  ROUTE_SPOTS,
  ensureWalkTextures,
  createHeroRig,
  updateHeroRig,
} from './walkTypes';

const OUTDOOR_BASE_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 7, 7, 0, 0, 3, 3, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 7, 7, 7, 0, 0, 0, 3, 3, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 7, 7, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 7, 7, 0, 0, 7, 7, 0, 0, 3, 3, 0, 0, 0, 5, 5, 5, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 7, 7, 0, 0, 7, 7, 0, 0, 0, 3, 3, 0, 0, 0, 5, 5, 5, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 7, 7, 0, 7, 7, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 2, 0, 5, 5, 0, 1, 1],
  [1, 1, 1, 7, 0, 0, 7, 0, 0, 0, 2, 2, 2, 3, 3, 0, 0, 0, 0, 2, 0, 5, 5, 0, 1, 1],
  [1, 1, 1, 7, 0, 0, 0, 0, 2, 2, 2, 0, 0, 3, 3, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 2, 4, 4, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 7, 0, 2, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 7, 7, 0, 0, 1, 1],
  [1, 1, 1, 7, 7, 2, 0, 7, 7, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 7, 7, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 7, 0, 0, 7, 7, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 7, 7, 0, 0, 0, 7, 7, 0, 3, 3, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 7, 7, 0, 0, 7, 0, 0, 3, 3, 0, 0, 2, 0, 0, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class OutdoorScene extends Phaser.Scene {
  private opts: WalkOptions;
  private readonly TILE = 48;
  private currentMap!: number[][];

  private hero!: HeroRig;
  private bubbleContainer!: Phaser.GameObjects.Container;
  private bubbleText!: Phaser.GameObjects.Text;
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private compassArrow!: Phaser.GameObjects.Triangle;

  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private minimapPlayerDot!: Phaser.GameObjects.Arc;
  private minimapStationDot!: Phaser.GameObjects.Arc;
  private readonly MM_SCALE = 6;
  private mmOriginX = 0;
  private mmOriginY = 0;

  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetMarker!: Phaser.GameObjects.Arc;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private eKey!: Phaser.Input.Keyboard.Key;

  private stationPos!: Phaser.Math.Vector2;
  private near = false;

  constructor(opts: WalkOptions) {
    super('outdoor');
    this.opts = opts;
  }

  create(): void {
    ensureWalkTextures(this, this.TILE);
    this.cameras.main.fadeIn(250, 18, 22, 20);

    const spot = ROUTE_SPOTS[this.opts.stepIndex % ROUTE_SPOTS.length];
    this.currentMap = this.buildMapForStep(this.opts.stepIndex, spot);

    const rows = this.currentMap.length;
    const cols = this.currentMap[0].length;
    const worldW = cols * this.TILE;
    const worldH = rows * this.TILE;

    this.physics.world.setBounds(0, 0, worldW, worldH);

    const walls = this.physics.add.staticGroup();
    const fireSprites: Phaser.GameObjects.Sprite[] = [];
    const waterSprites: Phaser.GameObjects.Image[] = [];

    this.currentMap.forEach((row, y) => {
      row.forEach((tileId, x) => {
        const cx = x * this.TILE + this.TILE / 2;
        const cy = y * this.TILE + this.TILE / 2;

        if (tileId === 2) {
          this.add.image(cx, cy, 'tile-path');
        } else if (tileId === 3) {
          const w = this.add.image(cx, cy, 'tile-water-0');
          waterSprites.push(w);
          const col = this.add.rectangle(cx, cy, this.TILE, this.TILE);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (tileId === 4) {
          this.add.image(cx, cy, 'tile-water-0');
          this.add.image(cx, cy, 'tile-bridge');
        } else if (tileId === 8) {
          this.add.image(cx, cy, 'tile-ash');
        } else if (tileId === 7) {
          this.add.image(cx, cy, 'tile-scrub');
        } else {
          this.add.image(cx, cy, 'tile-grass');
        }

        if (tileId === 1) {
          this.add.image(cx, cy - 4, 'tile-tree').setDepth(cy);
          const col = this.add.rectangle(cx, cy + 4, this.TILE * 0.72, this.TILE * 0.65);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (tileId === 5) {
          this.add.image(cx, cy - 4, 'tile-house').setDepth(cy);
          const col = this.add.rectangle(cx, cy, this.TILE * 0.92, this.TILE * 0.85);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (tileId === 6) {
          this.add.image(cx, cy, 'tile-ash');
          const fire = this.add.sprite(cx, cy - 4, 'fire-0').setDepth(cy + 2);
          fireSprites.push(fire);
          const col = this.add.rectangle(cx, cy, this.TILE * 0.8, this.TILE * 0.8);
          this.physics.add.existing(col, true);
          walls.add(col);
        }
      });
    });

    let animTick = 0;
    this.time.addEvent({
      delay: 240,
      loop: true,
      callback: () => {
        animTick++;
        const waterKey = animTick % 2 === 0 ? 'tile-water-0' : 'tile-water-1';
        waterSprites.forEach((w) => w.setTexture(waterKey));
        fireSprites.forEach((f, idx) => {
          f.setTexture(`fire-${(animTick + idx) % 3}`);
        });
      },
    });

    // Дим та іскри за вітром із заходу на схід
    const fireEdgeX = (2 + this.opts.stepIndex * 2) * this.TILE;
    this.add
      .particles(fireEdgeX, worldH * 0.5, 'smoke-particle', {
        y: { min: -worldH * 0.42, max: worldH * 0.42 },
        x: { min: -40, max: 30 },
        speedX: { min: 60, max: 120 },
        speedY: { min: -20, max: 12 },
        scale: { start: 0.45, end: 1.5 },
        alpha: { start: 0.32, end: 0 },
        lifespan: { min: 2600, max: 4400 },
        frequency: 110,
        tint: [0x2a2623, 0x4a3f38, 0xb84a27],
      })
      .setDepth(900);

    // Зона завдання (точка огляду)
    this.stationPos = new Phaser.Math.Vector2(
      spot.station.x * this.TILE + this.TILE / 2,
      spot.station.y * this.TILE + this.TILE / 2
    );

    const pulseRing = this.add
      .circle(this.stationPos.x, this.stationPos.y, 20, 0x3b7a57, 0.25)
      .setStrokeStyle(2, 0x6ec293, 0.95)
      .setDepth(5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.near) this.opts.onInteract();
      });

    this.tweens.add({
      targets: pulseRing,
      scale: { from: 0.85, to: 1.28 },
      alpha: { from: 0.9, to: 0.25 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .rectangle(this.stationPos.x, this.stationPos.y - 30, 92, 20, 0x181e1b, 0.95)
      .setStrokeStyle(1, 0x3b7a57)
      .setDepth(950)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.near) this.opts.onInteract();
      });

    this.add
      .text(this.stationPos.x, this.stationPos.y - 30, 'ТОЧКА ОГЛЯДУ', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d6ece0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(951);

    this.targetMarker = this.add
      .circle(0, 0, 9, 0x6ec293, 0.2)
      .setStrokeStyle(1.5, 0x9ed4b5)
      .setVisible(false)
      .setDepth(6);

    const startX = spot.start.x * this.TILE + this.TILE / 2;
    const startY = spot.start.y * this.TILE + this.TILE / 2;

    this.hero = createHeroRig(this, startX, startY);

    this.physics.add.collider(this.hero.container, walls, () => {
      this.moveTarget = null;
      this.targetMarker.setVisible(false);
    });

    this.compassArrow = this.add
      .triangle(startX, startY, 0, -8, 6, 6, -6, 6, 0xe2b86b, 0.9)
      .setDepth(960);

    this.createSpeechBubble(spot.thoughtBubble);

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.hero.container, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor('#121614');

    this.createWindHud();
    this.createMinimapHud(spot);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as OutdoorScene['wasd'];
    this.eKey = kb.addKey('E');

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.targetMarker.setPosition(pointer.worldX, pointer.worldY).setVisible(true);
    });

    this.opts.onStatusChange?.(
      `Прямуйте за стрілкою до точки огляду: ${this.opts.locationName}`,
      false
    );
  }

  private createWindHud(): void {
    const x = 12;
    const y = 12;

    this.add
      .rectangle(x, y, 160, 42, 0x181e1b, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3e4e47)
      .setScrollFactor(0)
      .setDepth(1100);

    this.add
      .text(x + 10, y + 7, 'ВІТЕР: ЗХ → СХ', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e2b86b',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(1101);

    this.add
      .text(x + 10, y + 22, '7.5 м/с · Вогонь іде на схід', {
        fontFamily: 'Inter, Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#939e98',
      })
      .setScrollFactor(0)
      .setDepth(1101);
  }

  private createMinimapHud(spot: LandmarkSpot): void {
    const rows = this.currentMap.length;
    const cols = this.currentMap[0].length;
    const mmW = cols * this.MM_SCALE;
    const mmH = rows * this.MM_SCALE;
    const pad = 6;

    const boxX = this.cameras.main.width - mmW - pad * 2 - 12;
    const boxY = 12;
    this.mmOriginX = boxX + pad;
    this.mmOriginY = boxY + pad + 14;

    this.add
      .rectangle(boxX, boxY, mmW + pad * 2, mmH + pad * 2 + 14, 0x181e1b, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3e4e47)
      .setScrollFactor(0)
      .setDepth(1100);

    this.add
      .text(this.mmOriginX, boxY + 4, 'КАРТА ЛОКАЦІЇ', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#939e98',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(1101);

    this.minimapGraphics = this.add.graphics().setScrollFactor(0).setDepth(1101);

    const palette: Record<number, number> = {
      0: 0x284233,
      1: 0x1a3324,
      2: 0x5c4b3b,
      3: 0x2b6280,
      4: 0x8a6646,
      5: 0x8c7a6b,
      6: 0xd9532f,
      7: 0x4b4729,
      8: 0x1c1b1a,
    };

    this.currentMap.forEach((row, y) => {
      row.forEach((id, x) => {
        this.minimapGraphics.fillStyle(palette[id] ?? 0x284233, 1);
        this.minimapGraphics.fillRect(
          this.mmOriginX + x * this.MM_SCALE,
          this.mmOriginY + y * this.MM_SCALE,
          this.MM_SCALE,
          this.MM_SCALE
        );
      });
    });

    this.minimapStationDot = this.add
      .circle(
        this.mmOriginX + (spot.station.x + 0.5) * this.MM_SCALE,
        this.mmOriginY + (spot.station.y + 0.5) * this.MM_SCALE,
        3.5,
        0x6ec293
      )
      .setScrollFactor(0)
      .setDepth(1102);

    this.tweens.add({
      targets: this.minimapStationDot,
      alpha: { from: 1, to: 0.25 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.minimapPlayerDot = this.add
      .circle(this.mmOriginX, this.mmOriginY, 3.2, 0xf5efe6)
      .setStrokeStyle(1, 0x121614)
      .setScrollFactor(0)
      .setDepth(1103);
  }

  private buildMapForStep(stepIndex: number, spot: LandmarkSpot): number[][] {
    const map = OUTDOOR_BASE_MAP.map((row) => [...row]);
    const fireReachX = Math.min(11, 2 + stepIndex * 2);

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x <= fireReachX; x++) {
        const isStart = Math.abs(x - spot.start.x) <= 1 && Math.abs(y - spot.start.y) <= 1;
        const isStation = Math.abs(x - spot.station.x) <= 1 && Math.abs(y - spot.station.y) <= 1;
        if (isStart || isStation) continue;

        if (x < fireReachX - 1 && (map[y][x] === 1 || map[y][x] === 7)) {
          map[y][x] = 8;
        } else if (
          x >= fireReachX - 1 &&
          (map[y][x] === 1 || map[y][x] === 7 || (x <= 4 && map[y][x] === 0))
        ) {
          map[y][x] = 6;
        }
      }
    }
    return map;
  }

  private createSpeechBubble(initialText: string): void {
    const player = this.hero.container;
    this.bubbleBg = this.add.graphics();
    this.bubbleText = this.add
      .text(0, 0, initialText, {
        fontFamily: 'Inter, Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#efece6',
        align: 'center',
        wordWrap: { width: 215 },
      })
      .setOrigin(0.5);

    this.bubbleContainer = this.add
      .container(player.x, player.y - 52, [this.bubbleBg, this.bubbleText])
      .setDepth(1000);
    this.redrawBubble(initialText, false);
  }

  private redrawBubble(text: string, highlight: boolean): void {
    this.bubbleText.setText(text);
    const padX = 10;
    const padY = 6;
    const w = Math.max(96, this.bubbleText.width + padX * 2);
    const h = this.bubbleText.height + padY * 2;

    this.bubbleBg.clear();
    this.bubbleBg.fillStyle(highlight ? 0x1c3326 : 0x181e1b, 0.96);
    this.bubbleBg.lineStyle(1, highlight ? 0x468f66 : 0x3e4e47, 1);
    this.bubbleBg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    this.bubbleBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
    this.bubbleBg.fillTriangle(-5, h / 2, 5, h / 2, 0, h / 2 + 5);
  }

  update(_time: number, delta: number): void {
    const player = this.hero.container;
    const body = player.body as Phaser.Physics.Arcade.Body;
    const speed = 185;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    let vx = 0;
    let vy = 0;

    if (left || right || up || down) {
      this.moveTarget = null;
      this.targetMarker.setVisible(false);
      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
    } else if (this.moveTarget) {
      const distToTarget = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.moveTarget.x,
        this.moveTarget.y
      );
      if (distToTarget > 6) {
        const angle = Phaser.Math.Angle.Between(
          player.x,
          player.y,
          this.moveTarget.x,
          this.moveTarget.y
        );
        vx = Math.cos(angle);
        vy = Math.sin(angle);
      } else {
        this.moveTarget = null;
        this.targetMarker.setVisible(false);
      }
    }

    body.setVelocity(vx, vy);
    if (vx !== 0 || vy !== 0) {
      body.velocity.normalize().scale(speed);
    }

    updateHeroRig(this.hero, vx, vy, delta);
    this.bubbleContainer.setPosition(player.x, player.y - 52);

    // Оновлення позиції на міні-карті
    const tileX = player.x / this.TILE;
    const tileY = player.y / this.TILE;
    this.minimapPlayerDot.setPosition(
      this.mmOriginX + tileX * this.MM_SCALE,
      this.mmOriginY + tileY * this.MM_SCALE
    );

    // Стрілка-орієнтир до точки огляду
    const distToStation = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.stationPos.x,
      this.stationPos.y
    );

    if (distToStation > this.TILE * 1.6) {
      const angle = Phaser.Math.Angle.Between(
        player.x,
        player.y,
        this.stationPos.x,
        this.stationPos.y
      );
      this.compassArrow
        .setVisible(true)
        .setPosition(
          player.x + Math.cos(angle) * 28,
          player.y + Math.sin(angle) * 28
        )
        .setRotation(angle + Math.PI / 2);
    } else {
      this.compassArrow.setVisible(false);
    }

    const near = distToStation < this.TILE * 1.35;
    if (near !== this.near) {
      this.near = near;
      this.opts.onNearChange(near);
      const spot = ROUTE_SPOTS[this.opts.stepIndex % ROUTE_SPOTS.length];
      this.redrawBubble(near ? '[E] Оцінити обстановку' : spot.thoughtBubble, near);
    }

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.opts.onInteract();
    }
  }
}