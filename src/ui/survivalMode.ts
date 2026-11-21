import { SURVIVAL_SCENARIO, SurvivalScenario, StoryStep } from '../content/survivalStory';
import { WalkGame } from './WalkGame';

type Phase = 'intro' | 'walk' | 'step' | 'fail' | 'victory';

export class SurvivalMode {
  private container: HTMLElement;
  private scenario: SurvivalScenario;
  private currentStepIndex: number = 0;
  private phase: Phase = 'intro';
  private onReturnToSim?: () => void;
  private walkGame: WalkGame | null = null;

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

  // ---------- Клавіатура ----------
  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
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

  // ---------- Логіка ----------
  private advanceFromIntro(): void {
    if (this.phase !== 'intro') return;
    this.phase = 'walk';
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
        this.phase = 'walk';
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

  // ---------- Рендер ----------
  private render(): void {
    this.walkGame?.destroy();
    this.walkGame = null;
    this.container.innerHTML = '';

    if (this.phase === 'intro') {
      this.renderIntro();
    } else if (this.phase === 'walk') {
      this.renderWalk();
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
      <div class="survival-intro-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e2b86b" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c.5 3-1.5 4.8-1.5 7.2 0 1.4 1 2.3 2.2 2.3 1.5 0 2.3-1.3 2.3-3 1.8 1.5 2.5 3.6 2.5 5.5a5.5 5.5 0 1 1-11 0c0-3.6 2.5-6.7 5.5-12Z"/></svg>
      </div>
      <h1 class="survival-intro-title">${this.scenario.introTitle}</h1>
      <p class="survival-intro-subtitle">Навколо починається лісова пожежа. Дослідіть місцевість, дістаньтеся точок огляду та ухваліть правильні рішення, щоб вижити.</p>
      <div class="survival-intro-prompt">
        <span>${this.scenario.introPrompt}</span>
        <span class="pulsing-arrow">→</span>
      </div>
    `;

    introWrapper.addEventListener('click', () => {
      this.advanceFromIntro();
    });

    this.container.appendChild(introWrapper);
  }

  // ---------- Прогулянка картою (WorkAdventure-формат) ----------
  private renderWalk(): void {
    const step = this.scenario.steps[this.currentStepIndex];
    const total = this.scenario.steps.length;

    this.container.innerHTML = `
      <div class="walk-shell">
        <div class="walk-hud-top">
          <div class="walk-hud-left">
            <span class="walk-badge">ЕТАП ${this.currentStepIndex + 1} / ${total}</span>
            <span class="walk-location">${step.location}</span>
          </div>
          <div class="progress-dots">
            ${this.scenario.steps
              .map(
                (_, idx) =>
                  `<span class="dot ${idx === this.currentStepIndex ? 'active' : idx < this.currentStepIndex ? 'completed' : ''}"></span>`
              )
              .join('')}
          </div>
        </div>

        <div class="walk-viewport">
          <div id="walk-host"></div>

          <div id="walk-guide-bar" class="walk-guide-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>
            <span id="walk-guide-text"></span>
            <button type="button" id="walk-interact-btn" class="walk-interact-btn hidden">
              Оглянути <kbd>E</kbd>
            </button>
          </div>
        </div>

        <div class="walk-controls-bar">
          <span>Рух: <kbd>WASD</kbd> / <kbd>Стрілки</kbd> або клік по землі</span>
          <span>Взаємодія біля точки: <kbd>E</kbd></span>
        </div>
      </div>
    `;

    this.updateGuideText(false);

    const interactBtn = this.container.querySelector('#walk-interact-btn');
    interactBtn?.addEventListener('click', () => {
      this.phase = 'step';
      this.render();
    });

    const host = this.container.querySelector<HTMLElement>('#walk-host');
    if (host) {
      this.walkGame = new WalkGame({
        parent: host,
        stepIndex: this.currentStepIndex,
        totalSteps: total,
        stepTitle: step.title,
        locationName: step.location,
        onNearChange: (near) => this.updateGuideText(near),
        onStatusChange: (text, canInteract) => {
          const el = document.getElementById('walk-guide-text');
          if (el && text) el.textContent = text;
          const btn = document.getElementById('walk-interact-btn');
          if (btn) btn.classList.toggle('hidden', !canInteract);
        },
        onInteract: () => {
          this.phase = 'step';
          this.render();
        },
      });
    }
  }

  private updateGuideText(near: boolean): void {
    const el = document.getElementById('walk-guide-text');
    const bar = document.getElementById('walk-guide-bar');
    const btn = document.getElementById('walk-interact-btn');
    if (!el) return;

    if (this.currentStepIndex === 0 && !near) {
      el.textContent = 'Ти вдома. Підійди до вихідних дверей внизу кімнати, щоб вийти на двір.';
      bar?.classList.remove('is-near');
      btn?.classList.add('hidden');
      return;
    }

    const s = this.scenario.steps[this.currentStepIndex];
    if (near) {
      el.textContent = `Ви на місці (${s.location}). Оцініть ситуацію!`;
      bar?.classList.add('is-near');
      btn?.classList.remove('hidden');
    } else {
      el.textContent = `Прямуйте за стрілкою до точки огляду: ${s.location}`;
      bar?.classList.remove('is-near');
      btn?.classList.add('hidden');
    }
  }

  // ---------- Екран вибору ----------
  private renderStep(): void {
    const step: StoryStep = this.scenario.steps[this.currentStepIndex];
    const totalSteps = this.scenario.steps.length;

    const stepWrapper = document.createElement('div');
    stepWrapper.className = 'survival-step-view';

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

    const narrativeCard = document.createElement('div');
    narrativeCard.className = 'survival-narrative-card';
    narrativeCard.innerHTML = `
      <div class="narrative-visual-icon ${step.visualDirection ? 'wind-' + step.visualDirection : ''}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e2a96b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 19h18L12 4Zm0 6v4m0 3h.01"/></svg>
      </div>
      <div class="narrative-content">
        <div class="narrative-label">Оцінка обстановки</div>
        <p class="narrative-text">${step.thoughts}</p>
      </div>
    `;

    const splitContainer = document.createElement('div');
    splitContainer.className = 'survival-split-container';

    const choiceA = step.choices[0];
    const choiceB = step.choices[1];

    const leftHalf = document.createElement('div');
    leftHalf.className = 'survival-half left-half';
    leftHalf.innerHTML = `
      <div class="half-watermark">А</div>
      <div class="half-header">
        <span class="choice-tag">Варіант [А]</span>
        <span class="keyboard-key">A</span>
      </div>
      <div class="half-body">
        <p class="choice-description">${choiceA.text}</p>
      </div>
      <button type="button" class="half-action-btn btn-choice-a">Обрати [А]</button>
    `;
    leftHalf.addEventListener('click', () => this.makeChoice('A'));

    const rightHalf = document.createElement('div');
    rightHalf.className = 'survival-half right-half';
    rightHalf.innerHTML = `
      <div class="half-watermark">Б</div>
      <div class="half-header">
        <span class="choice-tag">Варіант [Б]</span>
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

    const tipEl = document.createElement('div');
    tipEl.className = 'survival-control-hint';
    tipEl.innerHTML =
      'Натисніть на картку рішення або скористайтеся клавішами <b>A</b> / <b>B</b>.';

    stepWrapper.appendChild(headerEl);
    stepWrapper.appendChild(narrativeCard);
    stepWrapper.appendChild(splitContainer);
    stepWrapper.appendChild(tipEl);

    this.container.appendChild(stepWrapper);
  }

  private renderFail(reason: string): void {
    this.walkGame?.destroy();
    this.walkGame = null;
    this.container.innerHTML = '';

    const failCard = document.createElement('div');
    failCard.className = 'survival-fail-card';
    failCard.innerHTML = `
      <div class="fail-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8958e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 19h18L12 4Zm0 6v4m0 3h.01"/></svg>
      </div>
      <h2 class="fail-title">Критична помилка</h2>
      <div class="fail-reason-box">
        <p class="fail-reason-text">${reason}</p>
      </div>
      <div class="fail-actions">
        <button type="button" id="retry-step-btn" class="btn btn-primary btn-large">Спробувати цей крок знову</button>
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
        <div class="victory-badge-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#82b898" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7v6c0 5 3.5 7.5 8 8 4.5-.5 8-3 8-8V7l-8-4Z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h1 class="victory-title">${this.scenario.victoryTitle}</h1>
        <p class="victory-subtitle">${this.scenario.victorySubtitle}</p>
      </div>

      <div class="victory-narrative-box">
        <div class="narrative-label">Фінал маршруту</div>
        <p class="narrative-text">
          «Вогонь пройшов повз, навколо лише дим і згарище, але ви дісталися відкритої ділянки біля траси, де вже працюють рятувальники.»
        </p>
      </div>

      <div class="rules-section">
        <h2 class="rules-section-title">Пам'ятка дій під час лісової пожежі</h2>
        <div class="rules-grid">
          ${this.scenario.rules
            .map(
              (r, idx) => `
            <div class="rule-card">
              <div class="rule-icon">0${idx + 1}</div>
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
          Пройти маршрут ще раз
        </button>
        <button type="button" id="back-to-sim-btn" class="btn btn-secondary btn-large">
          Повернутися до тактичної карти
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