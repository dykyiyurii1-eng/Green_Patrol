import { describe, it, expect } from 'vitest';
import { SURVIVAL_SCENARIO } from '../src/content/survivalStory';

describe('Survival Mode (Interactive Wildfire Escape Story)', () => {
  it('scenario contains 5 decision steps and 5 final rules', () => {
    expect(SURVIVAL_SCENARIO.steps.length).toBe(5);
    expect(SURVIVAL_SCENARIO.rules.length).toBe(5);
    expect(SURVIVAL_SCENARIO.introTitle).toContain('Ти — фермер');
  });

  it('Step 1 (Clothing): cotton is correct, synthetic is fatal', () => {
    const step1 = SURVIVAL_SCENARIO.steps[0];
    const synthetic = step1.choices.find((c) => c.key === 'A');
    const cotton = step1.choices.find((c) => c.key === 'B');

    expect(synthetic?.isCorrect).toBe(false);
    expect(synthetic?.failReason).toContain('Синтетика на жарі плавиться');
    expect(cotton?.isCorrect).toBe(true);
  });

  it('Step 2 (Smoke Corridor): crawl low is correct, standing is fatal', () => {
    const step2 = SURVIVAL_SCENARIO.steps[1];
    const stand = step2.choices.find((c) => c.key === 'A');
    const crawl = step2.choices.find((c) => c.key === 'B');

    expect(stand?.isCorrect).toBe(false);
    expect(stand?.failReason).toContain('дим збирається наверху');
    expect(crawl?.isCorrect).toBe(true);
  });

  it('Step 3 (Wind Direction): moving perpendicular is correct, running downwind is fatal', () => {
    const step3 = SURVIVAL_SCENARIO.steps[2];
    const runDownwind = step3.choices.find((c) => c.key === 'A');
    const runPerpendicular = step3.choices.find((c) => c.key === 'B');

    expect(runDownwind?.isCorrect).toBe(false);
    expect(runDownwind?.failReason).toContain('За вітром вогонь бігає');
    expect(runPerpendicular?.isCorrect).toBe(true);
  });

  it('Step 4 (Hill Slope): staying low across slope is correct, running uphill is fatal', () => {
    const step4 = SURVIVAL_SCENARIO.steps[3];
    const runUphill = step4.choices.find((c) => c.key === 'A');
    const acrossSlope = step4.choices.find((c) => c.key === 'B');

    expect(runUphill?.isCorrect).toBe(false);
    expect(runUphill?.failReason).toContain('Гаряче повітря');
    expect(acrossSlope?.isCorrect).toBe(true);
  });

  it('Step 5 (Last Chance): plowed land is safe, green bushes are fatal', () => {
    const step5 = SURVIVAL_SCENARIO.steps[4];
    const hideBushes = step5.choices.find((c) => c.key === 'A');
    const plowedLand = step5.choices.find((c) => c.key === 'B');

    expect(hideBushes?.isCorrect).toBe(false);
    expect(hideBushes?.failReason).toContain('кущі від такого жару спалахнули');
    expect(plowedLand?.isCorrect).toBe(true);
  });

  it('all 5 vital survival rules are clearly documented', () => {
    const rules = SURVIVAL_SCENARIO.rules;
    const ruleTitles = rules.map((r) => r.title);

    expect(ruleTitles).toContain('Ніякої синтетики');
    expect(ruleTitles).toContain('Падай на карачки');
    expect(ruleTitles).toContain('Не біжи за вітром');
    expect(ruleTitles).toContain('Не лізь на гору від вогню');
    expect(ruleTitles).toContain('Ховайся там, де нічому горіти');
  });
});
