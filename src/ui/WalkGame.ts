import Phaser from 'phaser';
import { WalkOptions } from './walk/walkTypes';
import { HouseScene } from './walk/HouseScene';
import { OutdoorScene } from './walk/OutdoorScene';

export type { WalkOptions };

export class WalkGame {
  private game: Phaser.Game | null = null;

  constructor(opts: WalkOptions) {
    if (!opts.parent) {
      console.error('WalkGame: контейнер #walk-host не знайдено');
      return;
    }

    const maxW = Math.min(960, Math.max(680, window.innerWidth - 80));
    const maxH = Math.min(500, Math.max(440, window.innerHeight - 210));

    const scenes =
      opts.stepIndex === 0
        ? [new HouseScene(opts), new OutdoorScene(opts)]
        : [new OutdoorScene(opts)];

    try {
      this.game = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: opts.parent,
        width: maxW,
        height: maxH,
        pixelArt: true,
        backgroundColor: '#121614',
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: scenes,
      });
    } catch (err) {
      opts.parent.innerHTML = `<div style="color:#e8958e;padding:20px;font-family:monospace;">Помилка запуску сцени: ${String(err)}</div>`;
    }
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}