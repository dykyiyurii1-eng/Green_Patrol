import { SURVIVAL_SCENARIO, SurvivalScenario, StoryStep } from '../content/survivalStory';

export class SurvivalMode {
  private container: HTMLElement;
  private scenario: SurvivalScenario;
  private currentStepIndex: number = 0;
  private phase: 'intro' | 'step' | 'fail' | 'victory' = 'intro';
  private onReturnToSim?: () => void;

  constructor(container: HTMLElement, onReturnToSim?: () => void) {
    this.container = container;
    this.scenario = SURVIVAL_SCENARIO;
    this.onReturnToSim = onReturnToSim;
    this.bindKeyboard();
  }

  public start(): void {
    this.currentStepIndex = 0;
    this.phase = 'intro';
    this.render();
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Only process when survival container is visible
      if (this.container.classList.contains('hidden')) return;

      if (this.phase === 'intro') {
        this.advanceFromIntro();
        return;
      }

      if (this.phase === 'step') {
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'ф' || key === '1') {
          this.makeChoice('A');
        } else if (key === 'b' || key === 'и' || key === '2') {
          this.makeChoice('B');
        }
      }
    });
  }

  private advanceFromIntro(): void {
    if (this.phase !== 'intro') return;
    this.phase = 'step';
    this.currentStepIndex = 0;
    this.render();
  }

  private makeChoice(choiceKey: 'A' | 'B'): void {
    if (this.phase !== 'step') return;

    const step = this.scenario.steps[this.currentStepIndex];
    const choice = step.choices.find((c) => c.key === choiceKey);
    if (!choice) return;

    if (choice.isCorrect) {
      if (this.currentStepIndex + 1 < this.scenario.steps.length) {
        this.currentStepIndex++;
        this.render();
      } else {
        this.phase = 'victory';
        this.render();
      }
    } else {
      this.phase = 'fail';
      this.renderFail(choice.failReason || 'Неправильний вибір призвів до трагедії.');
    }
  }

  private render(): void {
    this.container.innerHTML = '';

    if (this.phase === 'intro') {
      this.renderIntro();
    } else if (this.phase === 'step') {
      this.renderStep();
    } else if (this.phase === 'victory') {
      this.renderVictory();
    }
  }

  private renderIntro(): void {
    const introWrapper = document.createElement('div');
    introWrapper.className = 'survival-intro-card';

    introWrapper.innerHTML = `
      <div class="survival-intro-icon">👨‍🌾🔥</div>
      <h1 class="survival-intro-title">${this.scenario.introTitle}</h1>
      <p class="survival-intro-subtitle">Навколо починається пожежа. Тільки твої швидкі та правильні рішення врятують тобі життя.</p>
      <div class="survival-intro-prompt">
        <span class="pulsing-arrow">👉</span> ${this.scenario.introPrompt}
      </div>
    `;

    // Click anywhere on screen advances to step 1
    introWrapper.addEventListener('click', () => {
      this.advanceFromIntro();
    });

    this.container.appendChild(introWrapper);
  }

  private renderStep(): void {
    const step: StoryStep = this.scenario.steps[this.currentStepIndex];
    const totalSteps = this.scenario.steps.length;

    const stepWrapper = document.createElement('div');
    stepWrapper.className = 'survival-step-view';

    // Header strip with scenario title, location badge, progress
    const headerEl = document.createElement('div');
    headerEl.className = 'survival-header-strip';
    headerEl.innerHTML = `
      <div class="survival-badge scenario-badge">${this.scenario.title}</div>
      <div class="survival-progress">
        <span class="step-num">${step.title} (${this.currentStepIndex + 1} з ${totalSteps})</span>
        <div class="progress-dots">
          ${this.scenario.steps
            .map(
              (_, idx) =>
                `<span class="dot ${idx === this.currentStepIndex ? 'active' : idx < this.currentStepIndex ? 'completed' : ''}"></span>`
            )
            .join('')}
        </div>
      </div>
      <div class="survival-badge location-badge">${step.location}</div>
    `;

    // Dramatic narrative thoughts box
    const narrativeCard = document.createElement('div');
    narrativeCard.className = 'survival-narrative-card';
    narrativeCard.innerHTML = `
      <div class="narrative-visual-icon ${step.visualDirection ? 'wind-' + step.visualDirection : ''}">
        ${step.visualIcon}
      </div>
      <div class="narrative-content">
        <div class="narrative-label">Думки в голові:</div>
        <p class="narrative-text">${step.thoughts}</p>
      </div>
    `;

    // Split-Screen Interactive Halves
    const splitContainer = document.createElement('div');
    splitContainer.className = 'survival-split-container';

    const choiceA = step.choices[0];
    const choiceB = step.choices[1];

    // Left Half (Option A)
    const leftHalf = document.createElement('div');
    leftHalf.className = 'survival-half left-half';
    leftHalf.innerHTML = `
      <div class="half-watermark">А</div>
      <div class="half-header">
        <span class="choice-tag">[А] Ліва половина екрана</span>
        <span class="keyboard-key">A</span>
      </div>
      <div class="half-body">
        <p class="choice-description">${choiceA.text}</p>
      </div>
      <button type="button" class="half-action-btn btn-choice-a">Обрати [А]</button>
    `;
    leftHalf.addEventListener('click', () => this.makeChoice('A'));

    // Right Half (Option B)
    const rightHalf = document.createElement('div');
    rightHalf.className = 'survival-half right-half';
    rightHalf.innerHTML = `
      <div class="half-watermark">Б</div>
      <div class="half-header">
        <span class="choice-tag">[Б] Права половина екрана</span>
        <span class="keyboard-key">B</span>
      </div>
      <div class="half-body">
        <p class="choice-description">${choiceB.text}</p>
      </div>
      <button type="button" class="half-action-btn btn-choice-b">Обрати [Б]</button>
    `;
    rightHalf.addEventListener('click', () => this.makeChoice('B'));

    splitContainer.appendChild(leftHalf);
    splitContainer.appendChild(rightHalf);

    // Tip at bottom
    const tipEl = document.createElement('div');
    tipEl.className = 'survival-control-hint';
    tipEl.innerHTML =
      '💡 Ви можете натиснути на відповідну кнопку, клавішу <b>A</b> / <b>B</b> або прямо на ліву чи праву половину екрана.';

    stepWrapper.appendChild(headerEl);
    stepWrapper.appendChild(narrativeCard);
    stepWrapper.appendChild(splitContainer);
    stepWrapper.appendChild(tipEl);

    this.container.appendChild(stepWrapper);
  }

  private renderFail(reason: string): void {
    this.container.innerHTML = '';

    const failCard = document.createElement('div');
    failCard.className = 'survival-fail-card';
    failCard.innerHTML = `
      <div class="fail-icon">💀🔥</div>
      <h2 class="fail-title">Кінець...</h2>
      <div class="fail-reason-box">
        <p class="fail-reason-text">${reason}</p>
      </div>
      <div class="fail-actions">
        <button type="button" id="retry-step-btn" class="btn btn-accent btn-large">🔄 Спробувати цей крок знову</button>
        <button type="button" id="restart-story-btn" class="btn btn-secondary">Почати історію спочатку</button>
      </div>
    `;

    failCard.querySelector('#retry-step-btn')?.addEventListener('click', () => {
      this.phase = 'step';
      this.render();
    });

    failCard.querySelector('#restart-story-btn')?.addEventListener('click', () => {
      this.start();
    });

    this.container.appendChild(failCard);
  }

  private renderVictory(): void {
    this.container.innerHTML = '';

    const victoryCard = document.createElement('div');
    victoryCard.className = 'survival-victory-card';

    victoryCard.innerHTML = `
      <div class="victory-header">
        <div class="victory-badge-icon">🎖️</div>
        <h1 class="victory-title">${this.scenario.victoryTitle}</h1>
        <p class="victory-subtitle">${this.scenario.victorySubtitle}</p>
      </div>

      <div class="victory-narrative-box">
        <div class="narrative-label">Крок 6: Фінал (Успіх)</div>
        <p class="narrative-text">
          «Ну все, слава Богу... Вогонь пролетів повз, кругом одні головешки і дим стовпом, але я живий. Он уже й траса видніється, і наші рятувальники є!»
        </p>
      </div>

      <div class="rules-section">
        <h2 class="rules-section-title">🛡️ Короткі правила на кінець (Щоб зуби не з'їли):</h2>
        <div class="rules-grid">
          ${this.scenario.rules
            .map(
              (r) => `
            <div class="rule-card">
              <div class="rule-icon">${r.icon}</div>
              <div class="rule-content">
                <h3 class="rule-title">${r.title}</h3>
                <p class="rule-text">${r.text}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="victory-actions">
        <button type="button" id="replay-survival-btn" class="btn btn-primary btn-large">
          🔄 Пройти історію ще раз
        </button>
        <button type="button" id="back-to-sim-btn" class="btn btn-secondary btn-large">
          🗺️ Повернутися до тактичної карти
        </button>
      </div>
    `;

    victoryCard.querySelector('#replay-survival-btn')?.addEventListener('click', () => {
      this.start();
    });

    victoryCard.querySelector('#back-to-sim-btn')?.addEventListener('click', () => {
      if (this.onReturnToSim) {
        this.onReturnToSim();
      }
    });

    this.container.appendChild(victoryCard);
  }
}
