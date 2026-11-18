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
import { SurvivalMode } from './survivalMode';

export type GameMode = 'planning' | 'sandbox' | 'survival';
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
  private maxSimulationTicks: number = 250;
  private initialForestCount: number = 0;
  private initialHousesCount: number = 0;

  private isMouseDown: boolean = false;
  private lastDrawnCell: { x: number; y: number } | null = null;

  // Intro Elements
  private introOverlay!: HTMLElement;
  private introLine1El!: HTMLElement;
  private introLine2El!: HTMLElement;
  private skipIntroBtn!: HTMLButtonElement;
  private isIntroFinished: boolean = false;

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
  private modeSurvivalBtn!: HTMLButtonElement;
  private survivalContainer!: HTMLElement;
  private viewportContainer!: HTMLElement;
  private sidebarEl!: HTMLElement;
  private survivalMode!: SurvivalMode;
  private scenarioSelect!: HTMLSelectElement;
  private scenarioDescEl!: HTMLElement;

  private planningPanel!: HTMLElement;
  private budgetBarEl!: HTMLElement;
  private budgetTextEl!: HTMLElement;
  private planningErrorEl!: HTMLElement;
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

  private statVillageEl!: HTMLElement;
  private statSavedEl!: HTMLElement;
  private statBurningEl!: HTMLElement;
  private statBurnedEl!: HTMLElement;

  private resultsModal!: HTMLElement;
  private resultVillageEl!: HTMLElement;
  private resultSavedEl!: HTMLElement;
  private resultBaselineEl!: HTMLElement;
  private resultDiffEl!: HTMLElement;
  private resultBudgetEl!: HTMLElement;
  private resultFeedbackEl!: HTMLElement;
  private retryBtn!: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new CanvasRenderer(canvas);
    this.createZoomControls();

    this.currentScenario = SCENARIOS[0];
    this.seed = this.currentScenario.seed;
    this.rng = createMulberry32(this.seed);
    this.env = { ...this.currentScenario.env };

    // 30x30 tactical grid
    this.grid = new SimulationGrid(30, 30);
    this.cleanGrid = new SimulationGrid(30, 30);
    this.currentScenario.init(this.cleanGrid);
    this.grid = this.cleanGrid.clone();
    this.initialForestCount =
      this.cleanGrid.countTerrain(TerrainType.FOREST) +
      this.cleanGrid.countTerrain(TerrainType.BUSHES);
    this.initialHousesCount = this.cleanGrid.countHouses();

    this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);

    this.initDOMElements();
    this.bindEvents();
    this.computeBaseline();
    this.updateUIState();

    // Start intro sequence
    this.playCinematicIntro();

    // Start render loop
    this.startRenderLoop();
  }

  private createZoomControls(): void {
    const host = this.canvas.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    const box = document.createElement('div');
    box.style.cssText =
      'position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:6px;z-index:5;';
    const add = (label: string, title: string, action: () => void): void => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.style.cssText =
        'width:38px;height:38px;font:700 18px/1 sans-serif;color:#e8f5e9;' +
        'background:rgba(18,48,31,0.92);border:2px solid #c9a24a;border-radius:8px;cursor:pointer;';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        action();
      });
      box.appendChild(b);
    };
    add('+', 'Збільшити', () => this.renderer.zoomBy(1.3));
    add('−', 'Зменшити', () => this.renderer.zoomBy(1 / 1.3));
    add('⌂', 'Скинути вигляд', () => this.renderer.resetView());
    host.appendChild(box);
  }

  private initDOMElements(): void {
    // Intro
    this.introOverlay = document.getElementById('intro-overlay') as HTMLElement;
    this.introLine1El = document.getElementById('intro-line-1') as HTMLElement;
    this.introLine2El = document.getElementById('intro-line-2') as HTMLElement;
    this.skipIntroBtn = document.getElementById('skip-intro-btn') as HTMLButtonElement;

    this.modePlanningBtn = document.getElementById('mode-planning-btn') as HTMLButtonElement;
    this.modeSandboxBtn = document.getElementById('mode-sandbox-btn') as HTMLButtonElement;
    this.modeSurvivalBtn = document.getElementById('mode-survival-btn') as HTMLButtonElement;
    this.survivalContainer = document.getElementById('survival-container') as HTMLElement;
    this.viewportContainer = document.querySelector('.viewport-container') as HTMLElement;
    this.sidebarEl = document.querySelector('.sidebar') as HTMLElement;
    this.survivalMode = new SurvivalMode(this.survivalContainer, () => this.switchMode('planning'));
    this.scenarioSelect = document.getElementById('scenario-select') as HTMLSelectElement;
    this.scenarioDescEl = document.getElementById('scenario-description') as HTMLElement;

    this.planningPanel = document.getElementById('planning-panel') as HTMLElement;
    this.budgetBarEl = document.getElementById('budget-progress') as HTMLElement;
    this.budgetTextEl = document.getElementById('budget-text') as HTMLElement;
    this.planningErrorEl = document.getElementById('planning-error-msg') as HTMLElement;
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
    this.statVillageEl = document.getElementById('stat-village') as HTMLElement;
    this.statSavedEl = document.getElementById('stat-saved') as HTMLElement;
    this.statBurningEl = document.getElementById('stat-burning') as HTMLElement;
    this.statBurnedEl = document.getElementById('stat-burned') as HTMLElement;

    this.resultsModal = document.getElementById('results-modal') as HTMLElement;
    this.resultVillageEl = document.getElementById('result-village-val') as HTMLElement;
    this.resultSavedEl = document.getElementById('result-saved-val') as HTMLElement;
    this.resultBaselineEl = document.getElementById('result-baseline-val') as HTMLElement;
    this.resultDiffEl = document.getElementById('result-diff-val') as HTMLElement;
    this.resultBudgetEl = document.getElementById('result-budget-val') as HTMLElement;
    this.resultFeedbackEl = document.getElementById('result-feedback-text') as HTMLElement;
    this.retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
  }

  private playCinematicIntro(): void {
    const text1 = 'Ти — фермер...';
    const text2 = 'Не дай своєму селищу згоріти!';

    let charIdx = 0;
    this.introLine1El.classList.add('cursor-blink');

    const typeLine1 = () => {
      if (this.isIntroFinished) return;
      if (charIdx < text1.length) {
        this.introLine1El.textContent = text1.slice(0, charIdx + 1);
        charIdx++;
        setTimeout(typeLine1, 65);
      } else {
        this.introLine1El.classList.remove('cursor-blink');
        setTimeout(() => {
          charIdx = 0;
          this.introLine2El.classList.add('cursor-blink');
          typeLine2();
        }, 500);
      }
    };

    const typeLine2 = () => {
      if (this.isIntroFinished) return;
      if (charIdx < text2.length) {
        this.introLine2El.textContent = text2.slice(0, charIdx + 1);
        charIdx++;
        setTimeout(typeLine2, 65);
      } else {
        setTimeout(() => {
          this.finishIntro();
        }, 1200);
      }
    };

    setTimeout(typeLine1, 300);
  }

  private finishIntro(): void {
    if (this.isIntroFinished) return;
    this.isIntroFinished = true;
    this.introOverlay.classList.add('fade-out');
    setTimeout(() => {
      this.introOverlay.classList.add('hidden');
    }, 1500);
  }

  private bindEvents(): void {
    // Skip intro button & click
    this.skipIntroBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finishIntro();
    });
    this.introOverlay.addEventListener('click', () => {
      this.finishIntro();
    });

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
    this.modeSurvivalBtn.addEventListener('click', () => this.switchMode('survival'));

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
        this.planningErrorEl.classList.add('hidden');
        this.updateUIState();
      }
    });
    this.resetPlanBtn.addEventListener('click', () => {
      if (this.planningPhase === 'prepare') {
        this.planningManager.reset(this.cleanGrid);
        this.planningErrorEl.classList.add('hidden');
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
      if (e.button !== 0 || this.renderer.isPanGesture) return;
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
    this.applyToolAtClientCoords(touch.clientX, touch.clientY);
  }

  private handleCanvasInteraction(e: MouseEvent): void {
    this.applyToolAtClientCoords(e.clientX, e.clientY);
  }

  private applyToolAtClientCoords(clientX: number, clientY: number): void {
    const cell = this.renderer.screenToCell(clientX, clientY);
    if (!cell) {
      return;
    }
    const cellX = cell.x;
    const cellY = cell.y;

    if (!this.grid.inBounds(cellX, cellY)) {
      return;
    }

    if (this.lastDrawnCell && this.lastDrawnCell.x === cellX && this.lastDrawnCell.y === cellY) {
      return;
    }
    this.lastDrawnCell = { x: cellX, y: cellY };

    if (this.currentMode === 'planning') {
      if (this.planningPhase !== 'prepare') {
        return;
      }

      let success = false;
      if (this.activeTool === 'firebreak') {
        success = this.planningManager.placeFirebreak(cellX, cellY);
      } else if (this.activeTool === 'watchtower') {
        success = this.planningManager.placeWatchTower(cellX, cellY);
      }

      if (!success && this.planningManager.lastErrorMessage) {
        this.planningErrorEl.textContent = `⚠️ ${this.planningManager.lastErrorMessage}`;
        this.planningErrorEl.classList.remove('hidden');
      } else {
        this.planningErrorEl.classList.add('hidden');
      }

      this.updateUIState();
    } else {
      const idx = this.grid.getIndex(cellX, cellY);
      switch (this.activeTool) {
        case 'ignite':
          if (
            this.grid.terrain[idx] === TerrainType.FOREST ||
            this.grid.terrain[idx] === TerrainType.GRASS ||
            this.grid.terrain[idx] === TerrainType.BUSHES ||
            this.grid.terrain[idx] === TerrainType.HOUSES
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
          this.grid.generateWetShorelines();
          break;
      }
      this.updateUIState();
    }
  }

  private switchMode(mode: GameMode): void {
    this.currentMode = mode;
    this.isRunning = false;

    this.modePlanningBtn.classList.toggle('active', mode === 'planning');
    this.modeSandboxBtn.classList.toggle('active', mode === 'sandbox');
    this.modeSurvivalBtn.classList.toggle('active', mode === 'survival');

    if (mode === 'survival') {
      this.viewportContainer.classList.add('hidden');
      this.sidebarEl.classList.add('hidden');
      this.survivalContainer.classList.remove('hidden');
      this.resultsModal.classList.add('hidden');
      this.survivalMode.start();
    } else {
      this.viewportContainer.classList.remove('hidden');
      this.sidebarEl.classList.remove('hidden');
      this.survivalContainer.classList.add('hidden');

      if (mode === 'planning') {
        this.planningPanel.classList.remove('hidden');
        this.sandboxPanel.classList.add('hidden');
        this.simControlsPanel.classList.add('hidden');
        this.planningPhase = 'prepare';
        this.activeTool = 'firebreak';
        this.resetPlanningToScenario();
      } else {
        this.planningPanel.classList.add('hidden');
        this.sandboxPanel.classList.remove('hidden');
        this.simControlsPanel.classList.remove('hidden');
        this.activeTool = 'ignite';
        this.resultsModal.classList.add('hidden');
      }
    }

    this.updateUIState();
  }

  private setActiveTool(tool: ToolType): void {
    this.activeTool = tool;
    this.updateToolButtons();
  }

  private updateToolButtons(): void {
    this.toolFirebreakBtn.classList.toggle('active', this.activeTool === 'firebreak');
    this.toolWatchtowerBtn.classList.toggle('active', this.activeTool === 'watchtower');

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

    this.cleanGrid = new SimulationGrid(30, 30);
    scenario.init(this.cleanGrid);
    this.initialForestCount =
      this.cleanGrid.countTerrain(TerrainType.FOREST) +
      this.cleanGrid.countTerrain(TerrainType.BUSHES);
    this.initialHousesCount = this.cleanGrid.countHouses();

    this.computeBaseline();

    if (this.currentMode === 'planning') {
      this.resetPlanningToScenario();
    } else {
      this.resetSandbox();
    }

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
    this.planningErrorEl.classList.add('hidden');
    this.resultsModal.classList.add('hidden');
    this.updateUIState();
  }

  private startFirePhase(): void {
    this.planningPhase = 'fire';
    this.isRunning = true;
    this.ticksElapsed = 0;
    this.rng = createMulberry32(this.seed);
    this.simControlsPanel.classList.remove('hidden');
    this.startFireBtn.classList.add('hidden');
    this.planningErrorEl.classList.add('hidden');
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

    const unburnedHouses = this.grid.countUnburnedHouses();
    const totalHouses = this.initialHousesCount;
    const housesPercent = totalHouses > 0 ? (unburnedHouses / totalHouses) * 100 : 100;

    this.resultVillageEl.textContent = `${unburnedHouses} / ${totalHouses} (${housesPercent.toFixed(0)}% вціліло)`;
    this.resultVillageEl.className =
      housesPercent === 100 ? 'metric-val positive' : 'metric-val negative';

    this.resultSavedEl.textContent = `${savedPercent.toFixed(1)}%`;
    this.resultBaselineEl.textContent = `${baselineSaved.toFixed(1)}%`;

    if (diff >= 0) {
      this.resultDiffEl.textContent = `+${diff.toFixed(1)}% (Краще за бездіяльність)`;
      this.resultDiffEl.className = 'metric-val positive';
    } else {
      this.resultDiffEl.textContent = `${diff.toFixed(1)}%`;
      this.resultDiffEl.className = 'metric-val negative';
    }

    this.resultBudgetEl.textContent = `${this.planningManager.budgetUsed} / ${this.currentScenario.budget.totalBudget} балів`;

    // Ukrainian feedback tailored to farmer's mission
    let feedback = '';
    if (housesPercent === 100 && savedPercent >= 75) {
      feedback =
        '🏆 Тріумф фермера! Ваше селище повністю вціліло, а захисні смуги та вежі вберегли також більшу частину лісу. Мешканці селища у безпеці!';
    } else if (housesPercent === 100) {
      feedback =
        '🏡 Головна мета досягнута! Всі хатинки селища врятовано від нищівного вогню. Ліс довкола частково постраждав, але селище стоїть!';
    } else if (housesPercent >= 50) {
      feedback =
        '⚠️ Вогонь дістався околиць селища! Частину хатинок вдалося відстояти, але полум’я прорвало фланги. Спробуйте створити глибший периметр оборони або встановити вежу ближче до житла.';
    } else {
      feedback =
        '🔥 Трагедія для селища! Вогонь знищив більшість будівель. Сухі чагарники та вітер швидко донесли полум’я. Обов’язково використовуйте річку з мокрими берегами та не давайте вогню коридорів!';
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
    const unburnedHouses = this.grid.countUnburnedHouses();
    const totalHouses = this.initialHousesCount;
    const housesPct = totalHouses > 0 ? (unburnedHouses / totalHouses) * 100 : 100;
    this.statVillageEl.textContent = `${unburnedHouses} / ${totalHouses} (${housesPct.toFixed(0)}%)`;

    const unburnedForest = this.grid.countUnburnedForest();
    const savedPct =
      this.initialForestCount > 0 ? (unburnedForest / this.initialForestCount) * 100 : 100;
    this.statSavedEl.textContent = `${savedPct.toFixed(1)}%`;
    this.statBurningEl.textContent = this.grid.countBurning().toString();
    this.statBurnedEl.textContent = this.grid.countBurned().toString();
  }

  private startRenderLoop(): void {
    let lastTickTime = performance.now();

    const loop = (currentTime: number) => {
      if (this.isRunning) {
        const interval = 160 / this.speedMultiplier;
        if (currentTime - lastTickTime >= interval) {
          this.performSimulationTick();
          this.updateUIState();
          lastTickTime = currentTime;
        }
      }

      const showDanger = this.currentMode === 'planning' && this.planningPhase === 'prepare';
      this.renderer.render(this.grid, showDanger);
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
