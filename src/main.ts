import { App } from './ui/app';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('sim-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #sim-canvas not found');
  }

  // Initialize application
  new App(canvas);
});
