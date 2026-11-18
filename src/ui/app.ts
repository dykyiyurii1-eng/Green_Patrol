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
  private maxSimulationTicks: number = 250;
  private initialForestCount: number = 0;
  private initialHousesCount: number = 0;

  private isMouseDown: boolean = false;
  private lastDrawnCell: { x: number; y: number } | null = null;

<<<<<<< HEAD
  private selectedCell: { x: number; y: number } | null = null;
  private cellActionMenu!: HTMLElement;
  private cellInfoCard!: HTMLElement;
  private cellInfoTitle!: HTMLElement;
  private cellInfoDesc!: HTMLElement;
  private cellInfoBadge!: HTMLElement;
  private cellInfoRisk!: HTMLElement;
  private cellInfoDefense!: HTMLElement;
  private mainMenuOverlay!: HTMLElement;

=======
  // Intro Elements
>>>>>>> feat/yurii-ui
  private introOverlay!: HTMLElement;
  private introLine1El!: HTMLElement;
  private introLine2El!: HTMLElement;
  private skipIntroBtn!: HTMLButtonElement;
  private isIntroFinished: boolean = false;

<<<<<<< HEAD
=======
  // DOM Elements
>>>>>>> feat/yurii-ui
  private modePlanningBtn!: HTMLButtonElement;
  private modeSandboxBtn!: HTMLButtonElement;
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

<<<<<<< HEAD
=======
    // 30x30 tactical grid
>>>>>>> feat/yurii-ui
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

<<<<<<< HEAD
    this.playCinematicIntro();
=======
    // Start intro sequence
    this.playCinematicIntro();

    // Start render loop
>>>>>>> feat/yurii-ui
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
<<<<<<< HEAD
        'width:38px;height:38px;font:700 18px/1 sans-serif;color:#243842;' +
        'background:#ffffff;border:1.5px solid #b8d4e0;border-radius:10px;cursor:pointer;box-shadow:0 2px 6px rgba(36,56,66,0.1);';
=======
        'width:38px;height:38px;font:700 18px/1 sans-serif;color:#e8f5e9;' +
        'background:rgba(18,48,31,0.92);border:2px solid #c9a24a;border-radius:8px;cursor:pointer;';
>>>>>>> feat/yurii-ui
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
<<<<<<< HEAD
    this.mainMenuOverlay = document.getElementById('main-menu-overlay') as HTMLElement;
    this.cellActionMenu = document.getElementById('cell-action-menu') as HTMLElement;
    this.cellInfoCard = document.getElementById('cell-info-card') as HTMLElement;
    this.cellInfoTitle = document.getElementById('cell-info-title') as HTMLElement;
    this.cellInfoDesc = document.getElementById('cell-info-desc') as HTMLElement;
    this.cellInfoBadge = document.getElementById('cell-info-badge') as HTMLElement;
    this.cellInfoRisk = document.getElementById('cell-info-risk') as HTMLElement;
    this.cellInfoDefense = document.getElementById('cell-info-defense') as HTMLElement;

=======
    // Intro
>>>>>>> feat/yurii-ui
    this.introOverlay = document.getElementById('intro-overlay') as HTMLElement;
    this.introLine1El = document.getElementById('intro-line-1') as HTMLElement;
    this.introLine2El = document.getElementById('intro-line-2') as HTMLElement;
    this.skipIntroBtn = document.getElementById('skip-intro-btn') as HTMLButtonElement;

    this.modePlanningBtn = document.getElementById('mode-planning-btn') as HTMLButtonElement;
    this.modeSandboxBtn = document.getElementById('mode-sandbox-btn') as HTMLButtonElement;
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

<<<<<<< HEAD
=======
    // Stats
>>>>>>> feat/yurii-ui
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
<<<<<<< HEAD
        this.introLine1El.textContent += text1[charIdx];
        charIdx++;
        setTimeout(typeLine1, 75);
      } else {
        this.introLine1El.classList.remove('cursor-blink');
        setTimeout(() => {
          if (this.isIntroFinished) return;
=======
        this.introLine1El.textContent = text1.slice(0, charIdx + 1);
        charIdx++;
        setTimeout(typeLine1, 65);
      } else {
        this.introLine1El.classList.remove('cursor-blink');
        setTimeout(() => {
>>>>>>> feat/yurii-ui
          charIdx = 0;
          this.introLine2El.classList.add('cursor-blink');
          typeLine2();
        }, 500);
      }
    };

    const typeLine2 = () => {
      if (this.isIntroFinished) return;
      if (charIdx < text2.length) {
<<<<<<< HEAD
        this.introLine2El.textContent += text2[charIdx];
        charIdx++;
        setTimeout(typeLine2, 60);
      } else {
        setTimeout(() => {
          if (!this.isIntroFinished) {
            this.finishIntro();
          }
        }, 2200);
      }
    };

    setTimeout(typeLine1, 400);
=======
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
>>>>>>> feat/yurii-ui
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
<<<<<<< HEAD
    document.getElementById('main-menu-play-btn')?.addEventListener('click', () => {
      this.mainMenuOverlay?.classList.add('hidden');
    });

    document.getElementById('cell-btn-cancel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cellActionMenu.classList.add('hidden');
    });

    document.getElementById('cell-info-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cellInfoCard.classList.add('hidden');
    });

    document.getElementById('cell-btn-build')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selectedCell) {
        const success = this.planningManager.placeWatchTower(
          this.selectedCell.x,
          this.selectedCell.y
        );
        if (!success && this.planningManager.lastErrorMessage) {
          this.planningErrorEl.textContent = `⚠️ ${this.planningManager.lastErrorMessage}`;
          this.planningErrorEl.classList.remove('hidden');
        } else {
          this.planningErrorEl.classList.add('hidden');
        }
        this.cellActionMenu.classList.add('hidden');
        this.updateUIState();
      }
    });

    document.getElementById('cell-btn-info')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.selectedCell) return;
      const cell = this.selectedCell;
      const idx = this.grid.getIndex(cell.x, cell.y);
      const terrain = this.grid.terrain[idx];

      const infoMap: Record<number, { name: string; desc: string; risk: string; defense: string }> =
        {
          0: {
            name: 'Ліс',
            desc: 'Густий лісовий масив. Легко розповсюджує вогонь, особливо за сильного вітру.',
            risk: '75%',
            defense: '0%',
          },
          1: {
            name: 'Трава',
            desc: 'Відкрите пасовище. Швидкість прогорання висока, але вогонь не тримається довго.',
            risk: '45%',
            defense: '0%',
          },
          2: {
            name: 'Водойма',
            desc: 'Природна річка чи ставок. Абсолютний барʼєр: вода ніколи не горить та блокує пожежу.',
            risk: '0%',
            defense: '100%',
          },
          3: {
            name: 'Дорога',
            desc: 'Ґрунтова дорога слугує природною смугою безпеки проти низового полумʼя.',
            risk: '0%',
            defense: '80%',
          },
          4: {
            name: 'Протипожежна смуга',
            desc: 'Очищена мінералізована смуга. Зупиняє просування вогню по землі.',
            risk: '0%',
            defense: '100%',
          },
          5: {
            name: 'Сухі кущі',
            desc: 'Сухостій та чагарники. Займаються миттєво від першої іскри!',
            risk: '95%',
            defense: '0%',
          },
          6: {
            name: 'Селище фермера',
            desc: 'Житлові хатинки фермера. Головна ціль оборони вашої місії!',
            risk: '60%',
            defense: 'Захистити!',
          },
          7: {
            name: 'Вологий берег',
            desc: 'Зволожений пісок і ґрунт біля води. Захищає берег від перекидання вогню.',
            risk: '0%',
            defense: '100%',
          },
        };

      const data = infoMap[terrain] || {
        name: 'Ділянка',
        desc: 'Звичайна територія.',
        risk: '0%',
        defense: '0%',
      };
      this.cellInfoBadge.textContent = String(terrain);
      this.cellInfoTitle.textContent = data.name;
      this.cellInfoDesc.textContent = data.desc;
      this.cellInfoRisk.textContent = `⚠️ Небезпека: ${data.risk}`;
      this.cellInfoDefense.textContent = `🛡️ Захист: ${data.defense}`;

      this.cellActionMenu.classList.add('hidden');
      this.cellInfoCard.classList.remove('hidden');
    });

=======
    // Skip intro button & click
>>>>>>> feat/yurii-ui
    this.skipIntroBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finishIntro();
    });
    this.introOverlay.addEventListener('click', () => {
      this.finishIntro();
    });

<<<<<<< HEAD
=======
    // Mode Switching
>>>>>>> feat/yurii-ui
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

    this.canvas.addEventListener('click', (e) => {
      if (this.renderer.wasDragged || this.renderer.isPanGesture) return;
      const cell = this.renderer.screenToCell(e.clientX, e.clientY);
      if (!cell) {
        this.cellActionMenu.classList.add('hidden');
        return;
      }
      const wrapper = this.canvas.parentElement;
      if (wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        this.cellActionMenu.style.left = `${e.clientX - wrapperRect.left}px`;
        this.cellActionMenu.style.top = `${e.clientY - wrapperRect.top}px`;
        this.selectedCell = { x: cell.x, y: cell.y };
        this.cellActionMenu.classList.remove('hidden');
        this.cellInfoCard.classList.add('hidden');
      }
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
    }
  }

  private switchMode(mode: GameMode): void {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    this.isRunning = false;

    if (mode === 'planning') {
      this.modePlanningBtn.classList.add('active');
      this.modeSandboxBtn.classList.remove('active');
      this.planningPanel.classList.remove('hidden');
      this.sandboxPanel.classList.add('hidden');
      this.simControlsPanel.classList.add('hidden');
      this.activeTool = 'firebreak';
      this.planningPhase = 'prepare';
      this.grid = this.cleanGrid.clone();
      this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);
    } else {
      this.modeSandboxBtn.classList.add('active');
      this.modePlanningBtn.classList.remove('active');
      this.sandboxPanel.classList.remove('hidden');
      this.planningPanel.classList.add('hidden');
      this.simControlsPanel.classList.remove('hidden');
      this.activeTool = 'ignite';
    }

    this.updateUIState();
  }

<<<<<<< HEAD
=======
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

>>>>>>> feat/yurii-ui
  private loadScenario(scenario: ScenarioDefinition): void {
    this.currentScenario = scenario;
    this.seed = scenario.seed;
    this.rng = createMulberry32(this.seed);
    this.env = { ...scenario.env };

    this.cleanGrid = new SimulationGrid(30, 30);
    this.currentScenario.init(this.cleanGrid);
    this.grid = this.cleanGrid.clone();
    this.initialForestCount =
      this.cleanGrid.countTerrain(TerrainType.FOREST) +
      this.cleanGrid.countTerrain(TerrainType.BUSHES);
    this.initialHousesCount = this.cleanGrid.countHouses();

    this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);
    this.planningPhase = 'prepare';
    this.isRunning = false;
    this.ticksElapsed = 0;

    this.scenarioDescEl.textContent = scenario.description;
    this.scenarioDescEl.classList.add('hidden');

<<<<<<< HEAD
=======
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

>>>>>>> feat/yurii-ui
    this.windSpeedSlider.value = this.env.windSpeed.toString();
    this.windSpeedVal.textContent = `${this.env.windSpeed.toFixed(1)} м/с`;
    this.windDirSlider.value = this.env.windDirectionDeg.toString();
    this.windDirVal.textContent = `${this.env.windDirectionDeg}° (${this.getCompassCardinal(this.env.windDirectionDeg)})`;
    this.windCompassArrow.style.transform = `rotate(${this.env.windDirectionDeg}deg)`;
    this.humiditySlider.value = this.env.humidity.toString();
    this.humidityVal.textContent = `${this.env.humidity}%`;

    this.computeBaseline();
    this.updateUIState();
    this.renderer.resetView();
  }

<<<<<<< HEAD
  private setActiveTool(tool: ToolType): void {
    this.activeTool = tool;
    this.updateToolButtons();
  }

  private updateToolButtons(): void {
    const isPlan = this.currentMode === 'planning';
    this.toolFirebreakBtn.classList.toggle('active', isPlan && this.activeTool === 'firebreak');
    this.toolWatchtowerBtn.classList.toggle('active', isPlan && this.activeTool === 'watchtower');

    if (!isPlan) {
      this.toolIgniteBtn.classList.toggle('active', this.activeTool === 'ignite');
      this.toolSandboxFirebreakBtn.classList.toggle('active', this.activeTool === 'firebreak');
      this.toolForestBtn.classList.toggle('active', this.activeTool === 'forest');
      this.toolWaterBtn.classList.toggle('active', this.activeTool === 'water');
    }
=======
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
>>>>>>> feat/yurii-ui
  }

  private startFirePhase(): void {
    if (this.planningPhase !== 'prepare') return;

    this.planningPhase = 'fire';
<<<<<<< HEAD
    this.planningErrorEl.classList.add('hidden');
    this.simControlsPanel.classList.remove('hidden');
    this.startFireBtn.classList.add('hidden');
    this.isRunning = true;
=======
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
>>>>>>> feat/yurii-ui
    this.ticksElapsed = 0;
    this.updateUIState();
  }

  private toggleSimulation(): void {
    this.isRunning = !this.isRunning;
    this.updatePlayPauseButtons();
  }

  private setSpeed(speed: number): void {
    this.speedMultiplier = speed;
    this.speed1Btn.classList.toggle('active', speed === 1);
    this.speed2Btn.classList.toggle('active', speed === 2);
    this.speed5Btn.classList.toggle('active', speed === 5);
  }

  private stepOnce(): void {
    this.isRunning = false;
    this.performSimulationTick();
    this.updateUIState();
  }

  private resetSandbox(): void {
    this.isRunning = false;
    this.grid = this.cleanGrid.clone();
    this.ticksElapsed = 0;
    this.updateUIState();
  }

  private retryPlanning(): void {
    this.planningPhase = 'prepare';
    this.isRunning = false;
    this.ticksElapsed = 0;
    this.simControlsPanel.classList.add('hidden');
    this.startFireBtn.classList.remove('hidden');
    this.grid = this.cleanGrid.clone();
    this.planningManager = new PlanningManager(this.grid, this.currentScenario.budget);
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

  private performSimulationTick(): void {
    simulationStep(this.grid, this.env, this.rng);
    this.ticksElapsed++;

    const burning = this.grid.countBurning();
    const isOut = burning === 0;
    const isLimit = this.ticksElapsed >= this.maxSimulationTicks;

    if (this.currentMode === 'planning' && this.planningPhase === 'fire') {
      if (isOut || isLimit) {
        this.isRunning = false;
        this.planningPhase = 'results';
        this.showResultsModal();
      }
    } else if (isOut || isLimit) {
      this.isRunning = false;
      this.updatePlayPauseButtons();
    }
  }

  private showResultsModal(): void {
    const unburnedForest = this.grid.countUnburnedForest();
    const initialForest = this.initialForestCount;
    const savedPercent = initialForest > 0 ? (unburnedForest / initialForest) * 100 : 100;

    const unburnedHouses = this.grid.countUnburnedHouses();
    const totalHouses = this.initialHousesCount;
    const housesPercent = totalHouses > 0 ? (unburnedHouses / totalHouses) * 100 : 100;

    const baselineSaved = this.baselineResult ? this.baselineResult.savedPercent : 0;
    const diff = savedPercent - baselineSaved;

<<<<<<< HEAD
    this.resultVillageEl.textContent = `${unburnedHouses} / ${totalHouses} (${housesPercent.toFixed(0)}% врятовано)`;
=======
    const unburnedHouses = this.grid.countUnburnedHouses();
    const totalHouses = this.initialHousesCount;
    const housesPercent = totalHouses > 0 ? (unburnedHouses / totalHouses) * 100 : 100;

    this.resultVillageEl.textContent = `${unburnedHouses} / ${totalHouses} (${housesPercent.toFixed(0)}% вціліло)`;
>>>>>>> feat/yurii-ui
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

<<<<<<< HEAD
=======
    // Ukrainian feedback tailored to farmer's mission
>>>>>>> feat/yurii-ui
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
        pct > 85 ? '#e53935' : pct > 60 ? '#fdd835' : '#458f62';
      this.budgetTextEl.textContent = `${used} / ${budget} балів (залишилось ${budget - used})`;
    }

<<<<<<< HEAD
=======
    // Statistics
>>>>>>> feat/yurii-ui
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