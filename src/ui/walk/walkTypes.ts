import Phaser from 'phaser';

export interface WalkOptions {
  parent: HTMLElement;
  stepIndex: number;
  totalSteps: number;
  stepTitle: string;
  locationName: string;
  onNearChange: (near: boolean) => void;
  onStatusChange?: (text: string, canInteract: boolean) => void;
  onInteract: () => void;
}

export interface LandmarkSpot {
  start: { x: number; y: number };
  station: { x: number; y: number };
  thoughtBubble: string;
}

// Маршрут по двору та околицях відповідно до 5 кроків історії
export const ROUTE_SPOTS: LandmarkSpot[] = [
  {
    start: { x: 19, y: 5 }, // Поріг біля вхідних дверей хати
    station: { x: 17, y: 9 },
    thoughtBubble: 'Надворі вже чути тріск гілок. Треба оглянути підхід до двору.',
  },
  {
    start: { x: 17, y: 9 },
    station: { x: 14, y: 9 },
    thoughtBubble: 'Вогонь у лісі набирає сили! Перевірю переправу через річку.',
  },
  {
    start: { x: 14, y: 9 },
    station: { x: 10, y: 6 },
    thoughtBubble: 'Вітер жене іскри на сухе поле. Йду до узлісся.',
  },
  {
    start: { x: 10, y: 6 },
    station: { x: 11, y: 13 },
    thoughtBubble: 'Жар посилюється! Треба знайти безпечний обхід.',
  },
  {
    start: { x: 11, y: 13 },
    station: { x: 18, y: 14 },
    thoughtBubble: 'Прориваюсь до відкритої ділянки біля траси!',
  },
];

// Генерація текстур тайлів через нативний HTML5 Canvas
export function ensureWalkTextures(scene: Phaser.Scene, T: number): void {
  if (scene.textures.exists('tile-grass')) return;

  const makeTex = (
    key: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);
    scene.textures.addCanvas(key, canvas);
  };

  // --- Вуличні тайли ---
  makeTex('tile-grass', T, T, (ctx) => {
    ctx.fillStyle = '#284233';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#345743';
    ctx.fillRect(8, 10, 3, 5);
    ctx.fillRect(32, 28, 3, 5);
    ctx.fillRect(18, 38, 3, 4);
  });

  makeTex('tile-scrub', T, T, (ctx) => {
    ctx.fillStyle = '#4b4729';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#696236';
    ctx.beginPath();
    ctx.arc(14, 16, 6, 0, Math.PI * 2);
    ctx.arc(34, 30, 7, 0, Math.PI * 2);
    ctx.arc(22, 36, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  makeTex('tile-path', T, T, (ctx) => {
    ctx.fillStyle = '#5c4b3b';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#4a3b2e';
    ctx.fillRect(6, 12, 8, 3);
    ctx.fillRect(28, 32, 10, 3);
  });

  for (let f = 0; f < 2; f++) {
    makeTex(`tile-water-${f}`, T, T, (ctx) => {
      ctx.fillStyle = '#285670';
      ctx.fillRect(0, 0, T, T);
      ctx.fillStyle = '#3d7da1';
      ctx.fillRect(f === 0 ? 8 : 16, 14, 18, 2);
      ctx.fillRect(f === 0 ? 18 : 10, 32, 20, 2);
    });
  }

  makeTex('tile-bridge', T, T, (ctx) => {
    ctx.fillStyle = '#6e5036';
    ctx.fillRect(0, 4, T, T - 8);
    ctx.fillStyle = '#4a3523';
    for (let x = 4; x < T; x += 8) ctx.fillRect(x, 4, 2, T - 8);
    ctx.fillStyle = '#8a6646';
    ctx.fillRect(0, 4, T, 3);
    ctx.fillRect(0, T - 7, T, 3);
  });

  makeTex('tile-ash', T, T, (ctx) => {
    ctx.fillStyle = '#1e1d1c';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#2e2b29';
    ctx.fillRect(10, 14, 14, 3);
    ctx.fillRect(24, 30, 12, 3);
  });

  makeTex('tile-tree', T, T, (ctx) => {
    ctx.fillStyle = 'rgba(20, 34, 26, 0.55)';
    ctx.beginPath();
    ctx.ellipse(24, 42, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3523';
    ctx.fillRect(21, 30, 6, 12);

    ctx.fillStyle = '#1f422e';
    ctx.beginPath();
    ctx.moveTo(24, 6);
    ctx.lineTo(6, 34);
    ctx.lineTo(42, 34);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2d5e42';
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.lineTo(10, 24);
    ctx.lineTo(38, 24);
    ctx.closePath();
    ctx.fill();
  });

  makeTex('tile-house', T, T, (ctx) => {
    ctx.fillStyle = '#736353';
    ctx.fillRect(4, 14, T - 8, T - 18);
    ctx.fillStyle = '#8c3f27';
    ctx.beginPath();
    ctx.moveTo(24, 2);
    ctx.lineTo(2, 18);
    ctx.lineTo(46, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2b20';
    ctx.fillRect(20, 28, 8, 16);
  });

  for (let f = 0; f < 3; f++) {
    const shift = f === 1 ? -3 : f === 2 ? 3 : 0;
    makeTex(`fire-${f}`, T, T, (ctx) => {
      ctx.fillStyle = '#b84a27';
      ctx.beginPath();
      ctx.moveTo(24 + shift, 4);
      ctx.lineTo(8, 40);
      ctx.lineTo(40, 40);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d97236';
      ctx.beginPath();
      ctx.moveTo(24 - shift, 12);
      ctx.lineTo(13, 40);
      ctx.lineTo(35, 40);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f0b856';
      ctx.beginPath();
      ctx.moveTo(24, 22);
      ctx.lineTo(18, 40);
      ctx.lineTo(30, 40);
      ctx.closePath();
      ctx.fill();
    });
  }

  makeTex('smoke-particle', 24, 24, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(12, 12, 11, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Тайли інтер'єру хати ---
  makeTex('indoor-floor', T, T, (ctx) => {
    ctx.fillStyle = '#523c2a';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#3d2c1e';
    ctx.fillRect(0, 15, T, 2);
    ctx.fillRect(0, 31, T, 2);
    ctx.fillRect(0, 46, T, 2);
  });

  makeTex('indoor-rug', T, T, (ctx) => {
    ctx.fillStyle = '#325240';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#48785d';
    ctx.fillRect(4, 4, T - 8, T - 8);
  });

  makeTex('indoor-wall', T, T, (ctx) => {
    ctx.fillStyle = '#2b2017';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#3f2f22';
    ctx.fillRect(2, 4, T - 4, 11);
    ctx.fillRect(2, 18, T - 4, 11);
    ctx.fillRect(2, 32, T - 4, 12);
  });

  makeTex('indoor-window', T, T, (ctx) => {
    ctx.fillStyle = '#2b2017';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#b84a27';
    ctx.fillRect(10, 8, T - 20, T - 16);
    ctx.fillStyle = '#e89d4f';
    ctx.fillRect(14, 12, T - 28, T - 24);
    ctx.fillStyle = '#3b2c20';
    ctx.fillRect(23, 8, 3, T - 16);
    ctx.fillRect(10, 23, T - 20, 3);
  });

  makeTex('indoor-door', T, T, (ctx) => {
    ctx.fillStyle = '#523c2a';
    ctx.fillRect(0, 0, T, T);
    ctx.fillStyle = '#755336';
    ctx.fillRect(6, 4, T - 12, T - 6);
    ctx.fillStyle = '#3b7a57';
    ctx.fillRect(10, T - 10, T - 20, 6);
    ctx.fillStyle = '#e2b86b';
    ctx.beginPath();
    ctx.arc(T - 13, 24, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  makeTex('indoor-bed', T, T, (ctx) => {
    ctx.fillStyle = '#3a5a70';
    ctx.fillRect(4, 4, T - 8, T - 8);
    ctx.fillStyle = '#ded7ca';
    ctx.fillRect(8, 8, T - 16, 12);
  });

  makeTex('indoor-table', T, T, (ctx) => {
    ctx.fillStyle = '#6b4c32';
    ctx.fillRect(4, 6, T - 8, T - 12);
    ctx.fillStyle = '#876242';
    ctx.fillRect(7, 9, T - 14, T - 18);
  });

  makeTex('indoor-stove', T, T, (ctx) => {
    ctx.fillStyle = '#7a756e';
    ctx.fillRect(4, 4, T - 8, T - 8);
    ctx.fillStyle = '#242220';
    ctx.fillRect(14, 24, 20, 14);
    ctx.fillStyle = '#d96b38';
    ctx.fillRect(18, 28, 12, 8);
  });
}

// =========================================================================
// ВЕКТОРНА МОДЕЛЬ ПЕРСОНАЖА («ДЯПЧИК»-ЛІСНИК)
// =========================================================================
export interface HeroRig {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  leftLeg: Phaser.GameObjects.Rectangle;
  rightLeg: Phaser.GameObjects.Rectangle;
  leftArm: Phaser.GameObjects.Rectangle;
  rightArm: Phaser.GameObjects.Rectangle;
  eyeL: Phaser.GameObjects.Rectangle;
  eyeR: Phaser.GameObjects.Rectangle;
  walkTimer: number;
}

export function createHeroRig(scene: Phaser.Scene, x: number, y: number): HeroRig {
  const shadow = scene.add
    .ellipse(x, y + 20, 28, 10, 0x000000, 0.45)
    .setDepth(y - 1);

  const leftLeg = scene.add
    .rectangle(-5, 13, 6, 11, 0x253238)
    .setStrokeStyle(1.5, 0x121614);
  const rightLeg = scene.add
    .rectangle(5, 13, 6, 11, 0x253238)
    .setStrokeStyle(1.5, 0x121614);

  const leftArm = scene.add
    .rectangle(-11, 2, 4, 12, 0xd96b27)
    .setStrokeStyle(1.5, 0x121614);
  const rightArm = scene.add
    .rectangle(11, 2, 4, 12, 0xd96b27)
    .setStrokeStyle(1.5, 0x121614);

  const torso = scene.add
    .rectangle(0, 2, 18, 16, 0xe07a2e)
    .setStrokeStyle(1.5, 0x121614);
  const stripe = scene.add.rectangle(0, 5, 16, 3, 0xf5c451);

  const head = scene.add
    .circle(0, -11, 7.5, 0xf2c6a0)
    .setStrokeStyle(1.5, 0x121614);
  const eyeL = scene.add.rectangle(2, -11, 2, 3, 0x121614);
  const eyeR = scene.add.rectangle(6, -11, 2, 3, 0x121614);

  const hatBrim = scene.add
    .ellipse(0, -17, 24, 6, 0xc99e5b)
    .setStrokeStyle(1.5, 0x121614);
  const hatTop = scene.add
    .rectangle(0, -21, 14, 7, 0xb58947)
    .setStrokeStyle(1.5, 0x121614);

  // Плоский Container без вкладених контейнерів для 100% сумісності з Canvas/WebGL
  const container = scene.add.container(x, y, [
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    stripe,
    head,
    eyeL,
    eyeR,
    hatBrim,
    hatTop,
  ]);
  container.setDepth(y);

  scene.physics.add.existing(container);
  const body = container.body as Phaser.Physics.Arcade.Body;
  body.setSize(22, 16);
  body.setOffset(-11, 4);
  body.setCollideWorldBounds(true);

  return {
    container,
    shadow,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    eyeL,
    eyeR,
    walkTimer: 0,
  };
}

export function updateHeroRig(rig: HeroRig, vx: number, vy: number, delta: number): void {
  if (vx !== 0 || vy !== 0) {
    if (vx < -0.05) {
      rig.eyeL.x = -6;
      rig.eyeR.x = -2;
    } else if (vx > 0.05) {
      rig.eyeL.x = 2;
      rig.eyeR.x = 6;
    }

    rig.walkTimer += delta;
    const swing = Math.sin(rig.walkTimer * 0.015) * 3;
    rig.leftLeg.y = 13 + swing;
    rig.rightLeg.y = 13 - swing;
    rig.leftArm.y = 2 - swing * 0.7;
    rig.rightArm.y = 2 + swing * 0.7;
  } else {
    rig.walkTimer = 0;
    rig.leftLeg.y = 13;
    rig.rightLeg.y = 13;
    rig.leftArm.y = 2;
    rig.rightArm.y = 2;
  }

  rig.container.setDepth(rig.container.y);
  rig.shadow
    .setPosition(rig.container.x, rig.container.y + 20)
    .setDepth(rig.container.y - 1);
}