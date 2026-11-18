import {
  SimulationGrid,
  CellState,
  TerrainType,
  EnvironmentState,
  simulationStep,
  createMulberry32,
  runBaselineSimulation,
  PlanningManager,
  BaselineResult,
} from '../simulation';
import { SCENARIOS, ScenarioDefinition } from '../content/scenarios';
import { CanvasRenderer } from './renderer';

export type GameMode = 'planning' | 'sandbox';
export type PlanningPhase = 'prepare' | 'fire' | 'results';
export type ToolType = 'firebreak' | 'watchtower' | 'ignite' | 'forest' | 'water';

export class App {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;

  private currentMode: GameMode = 'planning';
  private planningPhase: PlanningPhase = 'prepare';
  private activeTool: ToolType = 'firebreak';

  private currentScenario: ScenarioDefinition;
  private grid: SimulationGrid;
  private cleanGrid: SimulationGrid;
  private planningManager: PlanningManager;
  private baselineResult: BaselineResult | null = null;

  private env: EnvironmentState;
  private seed: number;
  private rng: () => number;

  private isRunning: boolean = false;
  private speedMultiplier: number = 1;
  private ticksElapsed: number = 0;
  private maxSimulationTicks: number = 300;
  private initialForestCount: number = 0;

  private isMouseDown: boolean = false;
  private lastDrawnCell: { x: number; y: number } | null = null;

<<<<<<< Updated upstream
  // DOM Elements
=======
  private introOverlay!: HTMLElement;
  private introLine1El!: HTMLElement;
  private introLine2El!: HTMLElement;
  private skipIntroBtn!: HTMLButtonElement;
  private isIntroFinished: boolean = false;

>>>>>>> Stashed changes
  private modePlanningBtn!: HTMLButtonElement;
  private modeSandboxBtn!: HTMLButtonElement;
  private scenarioSelect!: HTMLSelectElement;
  private scenarioDescEl!: HTMLElement;

  private planningPanel!: HTMLElement;
  private budgetBarEl!: HTMLElement;
  private budgetTextEl!: HTMLElement;
  private toolFirebreakBtn!: HTMLButtonElement;
  private toolWatchtowerBtn!: HTMLButtonElement;
  private undoBtn!: HTMLButtonElement;
  private resetPlanBtn!: HTMLButtonElement;
  private startFireBtn!: HTMLButtonElement;

  private sandboxPanel!: HTMLElement;
  private toolIgniteBtn!: HTMLButtonElement;
  private toolSandboxFirebreakBtn!: HTMLButtonElement;
  private toolForestBtn!: HTMLButtonElement;
  private toolWaterBtn!: HTMLButtonElement;
  private windSpeedSlider!: HTMLInputElement;
  private windSpeedVal!: HTMLElement;
  private windDirSlider!: HTMLInputElement;
  private windDirVal!: HTMLElement;
  private windCompassArrow!: HTMLElement;
  private humiditySlider!: HTMLInputElement;
  private humidityVal!: HTMLElement;
  private sandboxPlayBtn!: HTMLButtonElement;
  private sandboxResetBtn!: HTMLButtonElement;

  private simControlsPanel!: HTMLElement;
  private playPauseBtn!: HTMLButtonElement;
  private speed1Btn!: HTMLButtonElement;
  private speed2Btn!: HTMLButtonElement;
  private speed5Btn!: HTMLButtonElement;
  private stepBtn!: HTMLButtonElement;

  private statSavedEl!: HTMLElement;
  private statBurningEl!: HTMLElement;
  private statBurnedEl!: HTMLElement;
  private statTicksEl!: HTMLElement;

  private resultsModal!: HTMLElement;
  private resultSavedEl!: HTMLElement;
  private resultBaselineEl!: HTMLElement;
  private resultDiffEl!: HTMLElement;
  private resultBudgetEl!: HTMLElement;
  private resultFeedbackEl!: HTMLElement;
  private retryBtn!: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new CanvasRenderer(canvas);

    this.currentScenario = SCENARIOS[0];
    this.seed = this.currentScenario.seed;
    this.rng = createMulberry32(this.seed);
    this.env = { ...this.currentScenario.env };

<<<<<<< Updated upstream
    this.grid = new SimulationGrid(100, 100);
    this.cleanGrid = new SimulationGrid(100, 100);
=======
    this.grid = new SimulationGrid(30, 30);
    this.cleanGrid = new SimulationGrid(30, 30);
>>>>>>> Stashed changes
    this.currentScenario.init(this.cleanGrid);
    this.grid = this.cleanGrid.clone();
    this.initialForestCount = this.cleanGrid.countTerrain(TerrainType.FOREST);

    this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);

    this.initDOMElements();
    this.bindEvents();
    this.computeBaseline();
    this.updateUIState();

<<<<<<< Updated upstream
    // Start animation render loop
=======
    this.playCinematicIntro();

>>>>>>> Stashed changes
    this.startRenderLoop();
  }

  private initDOMElements(): void {
<<<<<<< Updated upstream
=======
    this.introOverlay = document.getElementById('intro-overlay') as HTMLElement;
    this.introLine1El = document.getElementById('intro-line-1') as HTMLElement;
    this.introLine2El = document.getElementById('intro-line-2') as HTMLElement;
    this.skipIntroBtn = document.getElementById('skip-intro-btn') as HTMLButtonElement;

>>>>>>> Stashed changes
    this.modePlanningBtn = document.getElementById('mode-planning-btn') as HTMLButtonElement;
    this.modeSandboxBtn = document.getElementById('mode-sandbox-btn') as HTMLButtonElement;
    this.scenarioSelect = document.getElementById('scenario-select') as HTMLSelectElement;
    this.scenarioDescEl = document.getElementById('scenario-description') as HTMLElement;

    this.planningPanel = document.getElementById('planning-panel') as HTMLElement;
    this.budgetBarEl = document.getElementById('budget-progress') as HTMLElement;
    this.budgetTextEl = document.getElementById('budget-text') as HTMLElement;
    this.toolFirebreakBtn = document.getElementById('tool-firebreak-btn') as HTMLButtonElement;
    this.toolWatchtowerBtn = document.getElementById('tool-watchtower-btn') as HTMLButtonElement;
    this.undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
    this.resetPlanBtn = document.getElementById('reset-plan-btn') as HTMLButtonElement;
    this.startFireBtn = document.getElementById('start-fire-btn') as HTMLButtonElement;

    this.sandboxPanel = document.getElementById('sandbox-panel') as HTMLElement;
    this.toolIgniteBtn = document.getElementById('tool-ignite-btn') as HTMLButtonElement;
    this.toolSandboxFirebreakBtn = document.getElementById(
      'tool-sandbox-firebreak-btn'
    ) as HTMLButtonElement;
    this.toolForestBtn = document.getElementById('tool-forest-btn') as HTMLButtonElement;
    this.toolWaterBtn = document.getElementById('tool-water-btn') as HTMLButtonElement;

    this.windSpeedSlider = document.getElementById('wind-speed-slider') as HTMLInputElement;
    this.windSpeedVal = document.getElementById('wind-speed-val') as HTMLElement;
    this.windDirSlider = document.getElementById('wind-dir-slider') as HTMLInputElement;
    this.windDirVal = document.getElementById('wind-dir-val') as HTMLElement;
    this.windCompassArrow = document.getElementById('compass-arrow') as HTMLElement;
    this.humiditySlider = document.getElementById('humidity-slider') as HTMLInputElement;
    this.humidityVal = document.getElementById('humidity-val') as HTMLElement;
    this.sandboxPlayBtn = document.getElementById('sandbox-play-btn') as HTMLButtonElement;
    this.sandboxResetBtn = document.getElementById('sandbox-reset-btn') as HTMLButtonElement;

    this.simControlsPanel = document.getElementById('sim-controls-panel') as HTMLElement;
    this.playPauseBtn = document.getElementById('play-pause-btn') as HTMLButtonElement;
    this.speed1Btn = document.getElementById('speed-1-btn') as HTMLButtonElement;
    this.speed2Btn = document.getElementById('speed-2-btn') as HTMLButtonElement;
    this.speed5Btn = document.getElementById('speed-5-btn') as HTMLButtonElement;
    this.stepBtn = document.getElementById('step-btn') as HTMLButtonElement;

<<<<<<< Updated upstream
    // Stats
=======
    this.statVillageEl = document.getElementById('stat-village') as HTMLElement;
>>>>>>> Stashed changes
    this.statSavedEl = document.getElementById('stat-saved') as HTMLElement;
    this.statBurningEl = document.getElementById('stat-burning') as HTMLElement;
    this.statBurnedEl = document.getElementById('stat-burned') as HTMLElement;
    this.statTicksEl = document.getElementById('stat-ticks') as HTMLElement;

    this.resultsModal = document.getElementById('results-modal') as HTMLElement;
    this.resultSavedEl = document.getElementById('result-saved-val') as HTMLElement;
    this.resultBaselineEl = document.getElementById('result-baseline-val') as HTMLElement;
    this.resultDiffEl = document.getElementById('result-diff-val') as HTMLElement;
    this.resultBudgetEl = document.getElementById('result-budget-val') as HTMLElement;
    this.resultFeedbackEl = document.getElementById('result-feedback-text') as HTMLElement;
    this.retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
  }

  private bindEvents(): void {
<<<<<<< Updated upstream
    // Mode Switching
=======
    this.skipIntroBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finishIntro();
    });
    this.introOverlay.addEventListener('click', () => {
      this.finishIntro();
    });

>>>>>>> Stashed changes
    this.modePlanningBtn.addEventListener('click', () => this.switchMode('planning'));
    this.modeSandboxBtn.addEventListener('click', () => this.switchMode('sandbox'));

    this.scenarioSelect.addEventListener('change', (e) => {
      const id = (e.target as HTMLSelectElement).value;
      const found = SCENARIOS.find((s) => s.id === id);
      if (found) {
        this.loadScenario(found);
      }
    });

    this.toolFirebreakBtn.addEventListener('click', () => this.setActiveTool('firebreak'));
    this.toolWatchtowerBtn.addEventListener('click', () => this.setActiveTool('watchtower'));
    this.undoBtn.addEventListener('click', () => {
      if (this.planningPhase === 'prepare') {
        this.planningManager.undo();
        this.updateUIState();
      }
    });
    this.resetPlanBtn.addEventListener('click', () => {
      if (this.planningPhase === 'prepare') {
        this.planningManager.reset(this.cleanGrid);
        this.updateUIState();
      }
    });
    this.startFireBtn.addEventListener('click', () => this.startFirePhase());

    this.toolIgniteBtn.addEventListener('click', () => this.setActiveTool('ignite'));
    this.toolSandboxFirebreakBtn.addEventListener('click', () => this.setActiveTool('firebreak'));
    this.toolForestBtn.addEventListener('click', () => this.setActiveTool('forest'));
    this.toolWaterBtn.addEventListener('click', () => this.setActiveTool('water'));

    this.windSpeedSlider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value);
      this.env.windSpeed = v;
      this.windSpeedVal.textContent = `${v.toFixed(1)} м/с`;
    });

    this.windDirSlider.addEventListener('input', (e) => {
      const d = parseInt((e.target as HTMLInputElement).value, 10);
      this.env.windDirectionDeg = d;
      this.windDirVal.textContent = `${d}° (${this.getCompassCardinal(d)})`;
      this.windCompassArrow.style.transform = `rotate(${d}deg)`;
    });

    this.humiditySlider.addEventListener('input', (e) => {
      const h = parseInt((e.target as HTMLInputElement).value, 10);
      this.env.humidity = h;
      this.humidityVal.textContent = `${h}%`;
    });

    this.sandboxPlayBtn.addEventListener('click', () => this.toggleSimulation());
    this.sandboxResetBtn.addEventListener('click', () => this.resetSandbox());

    this.playPauseBtn.addEventListener('click', () => this.toggleSimulation());
    this.speed1Btn.addEventListener('click', () => this.setSpeed(1));
    this.speed2Btn.addEventListener('click', () => this.setSpeed(2));
    this.speed5Btn.addEventListener('click', () => this.setSpeed(5));
    this.stepBtn.addEventListener('click', () => this.stepOnce());

    this.retryBtn.addEventListener('click', () => {
      this.resultsModal.classList.add('hidden');
      this.retryPlanning();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.handleCanvasInteraction(e);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.lastDrawnCell = null;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        this.handleCanvasInteraction(e);
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isMouseDown = true;
      if (e.touches[0]) {
        this.handleTouchInteraction(e.touches[0]);
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.isMouseDown && e.touches[0]) {
        this.handleTouchInteraction(e.touches[0]);
      }
    });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
      this.lastDrawnCell = null;
    });
  }

  private handleTouchInteraction(touch: Touch): void {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = touch.clientX - rect.left;
    const clientY = touch.clientY - rect.top;
    this.applyToolAtCanvasCoords(clientX, clientY, rect.width, rect.height);
  }

  private handleCanvasInteraction(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    this.applyToolAtCanvasCoords(clientX, clientY, rect.width, rect.height);
  }

  private applyToolAtCanvasCoords(cx: number, cy: number, w: number, h: number): void {
    const cellX = Math.floor((cx / w) * this.grid.width);
    const cellY = Math.floor((cy / h) * this.grid.height);

    if (!this.grid.inBounds(cellX, cellY)) {
      return;
    }

    // Debounce to prevent repeatedly triggering on the exact same cell while dragging
    if (this.lastDrawnCell && this.lastDrawnCell.x === cellX && this.lastDrawnCell.y === cellY) {
      return;
    }
    this.lastDrawnCell = { x: cellX, y: cellY };

    if (this.currentMode === 'planning') {
      if (this.planningPhase !== 'prepare') {
        return; // No building during fire or results
      }

      if (this.activeTool === 'firebreak') {
        this.planningManager.placeFirebreak(cellX, cellY);
      } else if (this.activeTool === 'watchtower') {
        this.planningManager.placeWatchTower(cellX, cellY);
      }
      this.updateUIState();
    } else {
      const idx = this.grid.getIndex(cellX, cellY);
      switch (this.activeTool) {
        case 'ignite':
          if (
            this.grid.terrain[idx] === TerrainType.FOREST ||
            this.grid.terrain[idx] === TerrainType.GRASS
          ) {
            this.grid.state[idx] = CellState.BURNING;
            this.grid.burnTicks[idx] = 0;
          }
          break;
        case 'firebreak':
          this.grid.terrain[idx] = TerrainType.FIREBREAK;
          this.grid.state[idx] = CellState.UNBURNED;
          break;
        case 'forest':
          this.grid.terrain[idx] = TerrainType.FOREST;
          this.grid.state[idx] = CellState.UNBURNED;
          break;
        case 'water':
          this.grid.terrain[idx] = TerrainType.WATER;
          this.grid.state[idx] = CellState.UNBURNED;
          break;
      }
      this.updateUIState();
    }
  }

  private switchMode(mode: GameMode): void {
    this.currentMode = mode;
    this.isRunning = false;

    if (mode === 'planning') {
      this.modePlanningBtn.classList.add('active');
      this.modeSandboxBtn.classList.remove('active');
      this.planningPanel.classList.remove('hidden');
      this.sandboxPanel.classList.add('hidden');
      this.simControlsPanel.classList.add('hidden');
      this.planningPhase = 'prepare';
      this.activeTool = 'firebreak';
      this.resetPlanningToScenario();
    } else {
      this.modePlanningBtn.classList.remove('active');
      this.modeSandboxBtn.classList.add('active');
      this.planningPanel.classList.add('hidden');
      this.sandboxPanel.classList.remove('hidden');
      this.simControlsPanel.classList.remove('hidden');
      this.activeTool = 'ignite';
      this.resultsModal.classList.add('hidden');
    }

    this.updateUIState();
  }

  private setActiveTool(tool: ToolType): void {
    this.activeTool = tool;
    this.updateToolButtons();
  }

  private updateToolButtons(): void {
    // Planning buttons
    this.toolFirebreakBtn.classList.toggle('active', this.activeTool === 'firebreak');
    this.toolWatchtowerBtn.classList.toggle('active', this.activeTool === 'watchtower');

    // Sandbox buttons
    this.toolIgniteBtn.classList.toggle('active', this.activeTool === 'ignite');
    this.toolSandboxFirebreakBtn.classList.toggle('active', this.activeTool === 'firebreak');
    this.toolForestBtn.classList.toggle('active', this.activeTool === 'forest');
    this.toolWaterBtn.classList.toggle('active', this.activeTool === 'water');
  }

  private loadScenario(scenario: ScenarioDefinition): void {
    this.currentScenario = scenario;
    this.seed = scenario.seed;
    this.env = { ...scenario.env };

    this.scenarioDescEl.textContent = scenario.description;

    this.cleanGrid = new SimulationGrid(100, 100);
    scenario.init(this.cleanGrid);
    this.initialForestCount = this.cleanGrid.countTerrain(TerrainType.FOREST);

    this.computeBaseline();

    if (this.currentMode === 'planning') {
      this.resetPlanningToScenario();
    } else {
      this.resetSandbox();
    }

    // Sync sandbox sliders
    this.windSpeedSlider.value = this.env.windSpeed.toString();
    this.windSpeedVal.textContent = `${this.env.windSpeed.toFixed(1)} м/с`;
    this.windDirSlider.value = this.env.windDirectionDeg.toString();
    this.windDirVal.textContent = `${this.env.windDirectionDeg}° (${this.getCompassCardinal(this.env.windDirectionDeg)})`;
    this.windCompassArrow.style.transform = `rotate(${this.env.windDirectionDeg}deg)`;
    this.humiditySlider.value = this.env.humidity.toString();
    this.humidityVal.textContent = `${this.env.humidity}%`;

    this.updateUIState();
  }

  private computeBaseline(): void {
    // Run objective baseline on unmodified scenario
    this.baselineResult = runBaselineSimulation(
      this.cleanGrid,
      this.currentScenario.env,
      this.currentScenario.seed,
      this.maxSimulationTicks
    );
  }

  private resetPlanningToScenario(): void {
    this.isRunning = false;
    this.ticksElapsed = 0;
    this.planningPhase = 'prepare';
    this.rng = createMulberry32(this.seed);
    this.grid = this.cleanGrid.clone();
    this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);
    this.simControlsPanel.classList.add('hidden');
    this.startFireBtn.classList.remove('hidden');
    this.resultsModal.classList.add('hidden');
    this.updateUIState();
  }

  private startFirePhase(): void {
    this.planningPhase = 'fire';
    this.isRunning = true;
    this.ticksElapsed = 0;
    this.rng = createMulberry32(this.seed); // Fresh seed for identical stochastic conditions
    this.simControlsPanel.classList.remove('hidden');
    this.startFireBtn.classList.add('hidden');
    this.updateUIState();
  }

  private retryPlanning(): void {
    this.resetPlanningToScenario();
  }

  private resetSandbox(): void {
    this.isRunning = false;
    this.ticksElapsed = 0;
    this.rng = createMulberry32(this.seed);
    this.grid = this.cleanGrid.clone();
    this.updateUIState();
  }

  private toggleSimulation(): void {
    this.isRunning = !this.isRunning;
    this.updatePlayPauseButtons();
  }

  private setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
    this.speed1Btn.classList.toggle('active', multiplier === 1);
    this.speed2Btn.classList.toggle('active', multiplier === 2);
    this.speed5Btn.classList.toggle('active', multiplier === 5);
  }

  private stepOnce(): void {
    this.performSimulationTick();
    this.updateUIState();
  }

  private performSimulationTick(): void {
    if (this.grid.countBurning() === 0) {
      if (this.currentMode === 'planning' && this.planningPhase === 'fire') {
        this.finishPlanningPhase();
      }
      this.isRunning = false;
      this.updatePlayPauseButtons();
      return;
    }

    if (this.ticksElapsed >= this.maxSimulationTicks) {
      if (this.currentMode === 'planning' && this.planningPhase === 'fire') {
        this.finishPlanningPhase();
      }
      this.isRunning = false;
      this.updatePlayPauseButtons();
      return;
    }

    simulationStep(this.grid, this.env, this.rng);
    this.ticksElapsed++;
  }

  private finishPlanningPhase(): void {
    this.planningPhase = 'results';
    this.isRunning = false;

    const unburnedForest = this.grid.countUnburnedForest();
    const savedPercent =
      this.initialForestCount > 0 ? (unburnedForest / this.initialForestCount) * 100 : 100;
    const baselineSaved = this.baselineResult ? this.baselineResult.savedPercent : 0;
    const diff = savedPercent - baselineSaved;

    this.resultSavedEl.textContent = `${savedPercent.toFixed(1)}%`;
    this.resultBaselineEl.textContent = `${baselineSaved.toFixed(1)}%`;

    if (diff >= 0) {
      this.resultDiffEl.textContent = `+${diff.toFixed(1)}% (Покращення)`;
      this.resultDiffEl.className = 'metric-val positive';
    } else {
      this.resultDiffEl.textContent = `${diff.toFixed(1)}%`;
      this.resultDiffEl.className = 'metric-val negative';
    }

    this.resultBudgetEl.textContent = `${this.planningManager.budgetUsed} / ${this.currentScenario.budget.totalBudget} балів`;

<<<<<<< Updated upstream
    // Rule-based feedback in Ukrainian
=======
>>>>>>> Stashed changes
    let feedback = '';
    if (savedPercent >= 85) {
      feedback =
        '🌟 Відмінна стратегія! Ви побудували надійні протипожежні розриви та грамотно врахували напрямок вітру. Завдяки вашим діям вдалося зберегти заповідний лісовий фонд!';
    } else if (savedPercent >= 65) {
      feedback =
        '👍 Хороший результат! Більшу частину лісу врятовано. Проте полум’я частково просочилося крізь фланги. Спробуйте ширше перекривати коридори поширення за вітром.';
    } else if (diff > 5) {
      feedback =
        '⚠️ Вогонь пройшов значну територію, хоча ваша лінія оборони дещо сповільнила його порівняно з повною бездіяльністю. Зверніть увагу на підвітряний сектор та захистіть ключові ділянки заздалегідь.';
    } else {
      feedback =
        '🔥 Пожежа подолала захисні смуги через високу швидкість вітру та сухість повітря. Спробуйте створити подвійні мінералізовані смуги поперек вітрового потоку та розмістити дозорні вежі.';
    }

    this.resultFeedbackEl.textContent = feedback;
    this.resultsModal.classList.remove('hidden');
  }

  private updatePlayPauseButtons(): void {
    const text = this.isRunning ? '⏸️ Пауза' : '▶️ Старт';
    this.playPauseBtn.textContent = text;
    this.sandboxPlayBtn.textContent = text;
  }

  private updateUIState(): void {
    this.updateToolButtons();
    this.updatePlayPauseButtons();

    if (this.currentMode === 'planning') {
      const budget = this.currentScenario.budget.totalBudget;
      const used = this.planningManager.budgetUsed;
      const pct = Math.min(100, (used / budget) * 100);
      this.budgetBarEl.style.width = `${pct}%`;
      this.budgetBarEl.style.backgroundColor =
        pct > 85 ? '#e53935' : pct > 60 ? '#fdd835' : '#43a047';
      this.budgetTextEl.textContent = `${used} / ${budget} балів (залишилось ${budget - used})`;
    }

<<<<<<< Updated upstream
    // Statistics
=======
    const unburnedHouses = this.grid.countUnburnedHouses();
    const totalHouses = this.initialHousesCount;
    const housesPct = totalHouses > 0 ? (unburnedHouses / totalHouses) * 100 : 100;
    this.statVillageEl.textContent = `${unburnedHouses} / ${totalHouses} (${housesPct.toFixed(0)}%)`;

>>>>>>> Stashed changes
    const unburnedForest = this.grid.countUnburnedForest();
    const savedPct =
      this.initialForestCount > 0 ? (unburnedForest / this.initialForestCount) * 100 : 100;
    this.statSavedEl.textContent = `${savedPct.toFixed(1)}%`;
    this.statBurningEl.textContent = this.grid.countBurning().toString();
    this.statBurnedEl.textContent = this.grid.countBurned().toString();
    this.statTicksEl.textContent = this.ticksElapsed.toString();
  }

  private startRenderLoop(): void {
    let lastTickTime = performance.now();

    const loop = (currentTime: number) => {
      if (this.isRunning) {
        // Step according to playback speed
        const interval = 120 / this.speedMultiplier;
        if (currentTime - lastTickTime >= interval) {
          this.performSimulationTick();
          this.updateUIState();
          lastTickTime = currentTime;
        }
      }

      this.renderer.render(this.grid);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private getCompassCardinal(deg: number): string {
    const normalized = ((deg % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return 'Північ';
    if (normalized >= 22.5 && normalized < 67.5) return 'Півн-Схід';
    if (normalized >= 67.5 && normalized < 112.5) return 'Схід';
    if (normalized >= 112.5 && normalized < 157.5) return 'Півд-Схід';
    if (normalized >= 157.5 && normalized < 202.5) return 'Південь';
    if (normalized >= 202.5 && normalized < 247.5) return 'Півд-Захід';
    if (normalized >= 247.5 && normalized < 292.5) return 'Захід';
    return 'Півн-Захід';
  }
}
