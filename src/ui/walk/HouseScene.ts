import Phaser from 'phaser';
import {
  WalkOptions,
  HeroRig,
  ensureWalkTextures,
  createHeroRig,
  updateHeroRig,
} from './walkTypes';

const HOUSE_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 4, 4, 0, 0, 0, 0, 5, 5, 0, 1],
  [1, 4, 4, 0, 0, 0, 0, 5, 5, 0, 1],
  [2, 0, 0, 0, 7, 7, 7, 0, 0, 0, 1],
  [2, 0, 0, 0, 7, 7, 7, 0, 0, 0, 1],
  [1, 0, 0, 0, 7, 7, 7, 0, 0, 0, 1],
  [1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1],
];

export class HouseScene extends Phaser.Scene {
  private opts: WalkOptions;
  private readonly TILE = 48;

  private hero!: HeroRig;
  private bubbleContainer!: Phaser.GameObjects.Container;
  private doorPos!: Phaser.Math.Vector2;

  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetMarker!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private eKey!: Phaser.Input.Keyboard.Key;
  private exiting = false;

  constructor(opts: WalkOptions) {
    super('house');
    this.opts = opts;
  }

  create(): void {
    ensureWalkTextures(this, this.TILE);
    this.exiting = false;

    const rows = HOUSE_MAP.length;
    const cols = HOUSE_MAP[0].length;
    const worldW = cols * this.TILE;
    const worldH = rows * this.TILE;

    const viewW = this.cameras.main.width;
    const viewH = this.cameras.main.height;
    const offsetX = Math.floor((viewW - worldW) / 2);
    const offsetY = Math.floor((viewH - worldH) / 2);

    this.cameras.main.setBackgroundColor('#121614');
    const walls = this.physics.add.staticGroup();

    HOUSE_MAP.forEach((row, y) => {
      row.forEach((id, x) => {
        const cx = offsetX + x * this.TILE + this.TILE / 2;
        const cy = offsetY + y * this.TILE + this.TILE / 2;

        if (id === 7) {
          this.add.image(cx, cy, 'indoor-rug').setDepth(1);
        } else {
          this.add.image(cx, cy, 'indoor-floor').setDepth(1);
        }

        if (id === 1) {
          this.add.image(cx, cy, 'indoor-wall').setDepth(5);
          const col = this.add.rectangle(cx, cy, this.TILE, this.TILE);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (id === 2) {
          this.add.image(cx, cy, 'indoor-window').setDepth(5);
          const col = this.add.rectangle(cx, cy, this.TILE, this.TILE);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (id === 3) {
          this.add.image(cx, cy, 'indoor-door').setDepth(5);
          this.doorPos = new Phaser.Math.Vector2(cx, cy - 8);

          const doorPulse = this.add
            .circle(cx, cy - 16, 14, 0x3b7a57, 0.28)
            .setStrokeStyle(1.5, 0x6ec293)
            .setDepth(6);
          this.tweens.add({
            targets: doorPulse,
            scale: { from: 0.85, to: 1.25 },
            alpha: { from: 0.9, to: 0.2 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
          });

          this.add
            .rectangle(cx, cy + 28, 124, 20, 0x1c3326, 0.96)
            .setStrokeStyle(1, 0x3b7a57)
            .setDepth(900)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
              this.moveTarget = this.doorPos.clone();
            });

          this.add
            .text(cx, cy + 28, 'ВИХІД НА ДВІР [E]', {
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#d6ece0',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setDepth(901);
        } else if (id === 4) {
          this.add.image(cx, cy, 'indoor-bed').setDepth(5);
          const col = this.add.rectangle(cx, cy, this.TILE * 0.9, this.TILE * 0.9);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (id === 5) {
          this.add.image(cx, cy, 'indoor-table').setDepth(5);
          const col = this.add.rectangle(cx, cy, this.TILE * 0.9, this.TILE * 0.85);
          this.physics.add.existing(col, true);
          walls.add(col);
        } else if (id === 6) {
          this.add.image(cx, cy, 'indoor-stove').setDepth(5);
          const col = this.add.rectangle(cx, cy, this.TILE * 0.9, this.TILE * 0.9);
          this.physics.add.existing(col, true);
          walls.add(col);
        }
      });
    });

    this.add
      .text(viewW / 2, Math.max(14, offsetY - 14), 'ХАТА ФЕРМЕРА · ІНТЕР’ЄР', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#939e98',
      })
      .setOrigin(0.5)
      .setDepth(900);

    this.targetMarker = this.add
      .circle(0, 0, 8, 0x6ec293, 0.25)
      .setStrokeStyle(1.5, 0x9ed4b5)
      .setVisible(false)
      .setDepth(10);

    const startX = offsetX + 5 * this.TILE + this.TILE / 2;
    const startY = offsetY + 4 * this.TILE + this.TILE / 2;

    this.hero = createHeroRig(this, startX, startY);

    this.physics.add.collider(this.hero.container, walls, () => {
      this.moveTarget = null;
      this.targetMarker.setVisible(false);
    });

    const bg = this.add.graphics();
    const txt = this.add
      .text(0, 0, 'Із вікна видно дим! Вийду на двір подивитися.', {
        fontFamily: 'Inter, Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#efece6',
        align: 'center',
        wordWrap: { width: 205 },
      })
      .setOrigin(0.5);
    const w = txt.width + 20;
    const h = txt.height + 12;
    bg.fillStyle(0x181e1b, 0.96);
    bg.lineStyle(1, 0x3e4e47, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
    bg.fillTriangle(-5, h / 2, 5, h / 2, 0, h / 2 + 5);

    this.bubbleContainer = this.add.container(startX, startY - 52, [bg, txt]).setDepth(1000);

    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as HouseScene['wasd'];
    this.eKey = kb.addKey('E');

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || this.exiting) return;
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
      this.targetMarker.setPosition(pointer.worldX, pointer.worldY).setVisible(true);
    });

    this.opts.onStatusChange?.(
      'Ти вдома. Підійди до вихідних дверей внизу кімнати, щоб вийти на двір.',
      false
    );
  }

  private exitToYard(): void {
    if (this.exiting) return;
    this.exiting = true;
    (this.hero.container.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.opts.onStatusChange?.('Вихід на подвір’я...', false);

    this.cameras.main.fadeOut(250, 18, 22, 20);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('outdoor');
    });
  }

  update(_time: number, delta: number): void {
    if (this.exiting) return;

    const player = this.hero.container;
    const body = player.body as Phaser.Physics.Arcade.Body;
    const speed = 175;

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
      const dist = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        this.moveTarget.x,
        this.moveTarget.y
      );
      if (dist > 6) {
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

    const distToDoor = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.doorPos.x,
      this.doorPos.y
    );

    if (
      distToDoor < this.TILE * 0.95 ||
      (distToDoor < this.TILE * 1.4 && Phaser.Input.Keyboard.JustDown(this.eKey))
    ) {
      this.exitToYard();
    }
  }
}