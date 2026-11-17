import { describe, it, expect } from 'vitest';
import {
  SimulationGrid,
  CellState,
  TerrainType,
  EnvironmentState,
  simulationStep,
  createMulberry32,
  runBaselineSimulation,
  PlanningManager,
} from '../src/simulation';

describe('Wildfire Simulation Core Tests', () => {
  const defaultEnv: EnvironmentState = {
    windSpeed: 0,
    windDirectionDeg: 90,
    humidity: 30,
  };

  it('fire never spreads onto water', () => {
    const grid = new SimulationGrid(10, 10);
    // Fill with water
    grid.terrain.fill(TerrainType.WATER);

    // Ignite center cell
    const centerIdx = grid.getIndex(5, 5);
    grid.state[centerIdx] = CellState.BURNING;

    const rng = createMulberry32(12345);

    // Run 10 ticks
    for (let t = 0; t < 10; t++) {
      simulationStep(grid, defaultEnv, rng);
    }

    // Check that no other water cells caught fire
    for (let i = 0; i < grid.size; i++) {
      if (i !== centerIdx) {
        expect(grid.state[i]).toBe(CellState.UNBURNED);
      }
    }
  });

  it('same seed gives the same result', () => {
    const seed = 987654321;

    const createSim = () => {
      const g = new SimulationGrid(20, 20);
      g.terrain.fill(TerrainType.FOREST);
      g.state[g.getIndex(10, 10)] = CellState.BURNING;
      const rng = createMulberry32(seed);
      const env: EnvironmentState = { windSpeed: 8, windDirectionDeg: 90, humidity: 35 };

      for (let t = 0; t < 15; t++) {
        simulationStep(g, env, rng);
      }
      return g;
    };

    const run1 = createSim();
    const run2 = createSim();

    // The states in both runs must match byte-for-byte
    expect(Array.from(run1.state)).toEqual(Array.from(run2.state));
    expect(run1.countUnburnedForest()).toBe(run2.countUnburnedForest());
  });

  it('stronger wind -> farther downwind spread', () => {
    const runWindExperiment = (windSpeed: number) => {
      const grid = new SimulationGrid(40, 25);
      grid.terrain.fill(TerrainType.FOREST);

      // Ignite at left side (x=5, y=12)
      const startX = 5;
      const startY = 12;
      grid.state[grid.getIndex(startX, startY)] = CellState.BURNING;

      // Wind blowing East (windDirectionDeg = 90), moderate humidity
      const env: EnvironmentState = {
        windSpeed,
        windDirectionDeg: 90,
        humidity: 55,
      };

      const rng = createMulberry32(101);

      // Run 5 ticks
      for (let t = 0; t < 5; t++) {
        simulationStep(grid, env, rng);
      }

      // Measure max downwind distance reached (x - startX)
      let maxX = startX;
      for (let y = 0; y < grid.height; y++) {
        for (let x = startX + 1; x < grid.width; x++) {
          const s = grid.state[grid.getIndex(x, y)];
          if (s === CellState.BURNING || s === CellState.BURNED) {
            if (x > maxX) {
              maxX = x;
            }
          }
        }
      }
      return maxX - startX;
    };

    const spreadNoWind = runWindExperiment(0);
    const spreadStrongWind = runWindExperiment(16);

    expect(spreadStrongWind).toBeGreaterThan(spreadNoWind);
  });

  it('a complete firebreak line stops the fire', () => {
    const grid = new SimulationGrid(20, 20);
    grid.terrain.fill(TerrainType.FOREST);

    // Build vertical firebreak line at x = 10 from top to bottom
    for (let y = 0; y < grid.height; y++) {
      grid.terrain[grid.getIndex(10, y)] = TerrainType.FIREBREAK;
    }

    // Ignite fire on the left side (x = 4, y = 10)
    grid.state[grid.getIndex(4, 10)] = CellState.BURNING;

    // Strong wind blowing East towards the firebreak
    const env: EnvironmentState = {
      windSpeed: 12,
      windDirectionDeg: 90,
      humidity: 20,
    };

    const rng = createMulberry32(777);

    // Run until fire completely burns out on the left side
    for (let t = 0; t < 50; t++) {
      simulationStep(grid, env, rng);
    }

    // Verify: no fire has crossed the firebreak to x > 10
    for (let y = 0; y < grid.height; y++) {
      for (let x = 11; x < grid.width; x++) {
        expect(grid.state[grid.getIndex(x, y)]).toBe(CellState.UNBURNED);
      }
    }
  });

  it('humidity 100% sharply reduces spread', () => {
    const runHumiditySim = (humidity: number) => {
      const grid = new SimulationGrid(20, 20);
      grid.terrain.fill(TerrainType.FOREST);
      grid.state[grid.getIndex(10, 10)] = CellState.BURNING;

      const env: EnvironmentState = {
        windSpeed: 0,
        windDirectionDeg: 90,
        humidity,
      };

      const rng = createMulberry32(999);

      for (let t = 0; t < 10; t++) {
        simulationStep(grid, env, rng);
      }

      // Count burned + burning cells
      let burnedCount = 0;
      for (let i = 0; i < grid.size; i++) {
        if (grid.state[i] === CellState.BURNING || grid.state[i] === CellState.BURNED) {
          burnedCount++;
        }
      }
      return burnedCount;
    };

    const burnedAtDry = runHumiditySim(15);
    const burnedAtMaxHumidity = runHumiditySim(100);

    // At 100% humidity, spread is strongly suppressed compared to dry air
    expect(burnedAtDry).toBeGreaterThan(burnedAtMaxHumidity);
    // At 100% humidity, spread should be minimal (typically only the initial cell or 1-2 neighbors at most)
    expect(burnedAtMaxHumidity).toBeLessThanOrEqual(2);
  });

  it('baseline run with no actions is deterministic', () => {
    const grid = new SimulationGrid(25, 25);
    grid.terrain.fill(TerrainType.FOREST);
    grid.state[grid.getIndex(12, 12)] = CellState.BURNING;

    const env: EnvironmentState = {
      windSpeed: 5,
      windDirectionDeg: 45,
      humidity: 35,
    };

    const seed = 54321;

    const result1 = runBaselineSimulation(grid, env, seed, 50);
    const result2 = runBaselineSimulation(grid, env, seed, 50);

    expect(result1.savedPercent).toBe(result2.savedPercent);
    expect(result1.unburnedForest).toBe(result2.unburnedForest);
    expect(result1.ticks).toBe(result2.ticks);
  });

  it('budget limit is enforced in planning mode', () => {
    const grid = new SimulationGrid(15, 15);
    grid.terrain.fill(TerrainType.FOREST);

    const budget = {
      totalBudget: 10,
      firebreakCostPerCell: 3,
      watchTowerCost: 10,
    };

    const planner = new PlanningManager(grid, budget);

    // Place 3 firebreaks: 3 * 3 = 9 budget used (1 remaining)
    expect(planner.placeFirebreak(1, 1)).toBe(true);
    expect(planner.placeFirebreak(1, 2)).toBe(true);
    expect(planner.placeFirebreak(1, 3)).toBe(true);
    expect(planner.budgetUsed).toBe(9);
    expect(planner.remainingBudget).toBe(1);

    // Attempting to place a 4th firebreak (cost 3) must be rejected because 9 + 3 > 10
    expect(planner.placeFirebreak(1, 4)).toBe(false);
    expect(planner.budgetUsed).toBe(9);

    // Attempting to place a watchtower (cost 10) must be rejected
    expect(planner.placeWatchTower(5, 5)).toBe(false);

    // Undo 1 firebreak: refunds 3 points -> budgetUsed becomes 6
    expect(planner.undo()).toBe(true);
    expect(planner.budgetUsed).toBe(6);
    expect(planner.remainingBudget).toBe(4);

    // Now we can place another firebreak (cost 3)
    expect(planner.placeFirebreak(1, 4)).toBe(true);
    expect(planner.budgetUsed).toBe(9);
  });
});
