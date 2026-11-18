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

describe('Wildfire Simulation Core Tests (30x30 Tactical Grid)', () => {
  const defaultEnv: EnvironmentState = {
    windSpeed: 0,
    windDirectionDeg: 90,
    humidity: 30,
  };

  it('fire never spreads onto water', () => {
    const grid = new SimulationGrid(10, 10);
    grid.terrain.fill(TerrainType.WATER);

    const centerIdx = grid.getIndex(5, 5);
    grid.state[centerIdx] = CellState.BURNING;

    const rng = createMulberry32(12345);

    for (let t = 0; t < 10; t++) {
      simulationStep(grid, defaultEnv, rng);
    }

    for (let i = 0; i < grid.size; i++) {
      if (i !== centerIdx) {
        expect(grid.state[i]).toBe(CellState.UNBURNED);
      }
    }
  });

  it('fire never spreads onto wet ground/shoreline sand', () => {
    const grid = new SimulationGrid(10, 10);
    grid.terrain.fill(TerrainType.WET_GROUND);

    const centerIdx = grid.getIndex(5, 5);
    grid.state[centerIdx] = CellState.BURNING;

    const rng = createMulberry32(54321);

    for (let t = 0; t < 10; t++) {
      simulationStep(grid, defaultEnv, rng);
    }

<<<<<<< HEAD
=======
    // Verify wet ground/sand cells around burning source never ignite
>>>>>>> feat/yurii-ui
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

    expect(Array.from(run1.state)).toEqual(Array.from(run2.state));
    expect(run1.countUnburnedForest()).toBe(run2.countUnburnedForest());
  });

  it('stronger wind -> farther downwind spread', () => {
    const runWindExperiment = (windSpeed: number) => {
      const grid = new SimulationGrid(30, 20);
      grid.terrain.fill(TerrainType.FOREST);

      const startX = 4;
      const startY = 10;
      grid.state[grid.getIndex(startX, startY)] = CellState.BURNING;

      const env: EnvironmentState = {
        windSpeed,
<<<<<<< HEAD
        windDirectionDeg: 90,
=======
        windDirectionDeg: 90, // Blowing East
>>>>>>> feat/yurii-ui
        humidity: 50,
      };

      const rng = createMulberry32(101);

      for (let t = 0; t < 5; t++) {
        simulationStep(grid, env, rng);
      }

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

<<<<<<< HEAD
=======
    // Build vertical firebreak line at x = 10
>>>>>>> feat/yurii-ui
    for (let y = 0; y < grid.height; y++) {
      grid.terrain[grid.getIndex(10, y)] = TerrainType.FIREBREAK;
    }

    grid.state[grid.getIndex(4, 10)] = CellState.BURNING;

    const env: EnvironmentState = {
      windSpeed: 12,
      windDirectionDeg: 90,
      humidity: 20,
    };

    const rng = createMulberry32(777);

    for (let t = 0; t < 40; t++) {
      simulationStep(grid, env, rng);
    }

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

    expect(burnedAtDry).toBeGreaterThan(burnedAtMaxHumidity);
    expect(burnedAtMaxHumidity).toBeLessThanOrEqual(2);
  });

  it('baseline run with no actions is deterministic', () => {
    const grid = new SimulationGrid(20, 20);
    grid.terrain.fill(TerrainType.FOREST);
    grid.state[grid.getIndex(10, 10)] = CellState.BURNING;

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

    expect(planner.placeFirebreak(1, 1)).toBe(true);
    expect(planner.placeFirebreak(1, 2)).toBe(true);
    expect(planner.placeFirebreak(1, 3)).toBe(true);
    expect(planner.budgetUsed).toBe(9);
    expect(planner.remainingBudget).toBe(1);

    expect(planner.placeFirebreak(1, 4)).toBe(false);
    expect(planner.placeWatchTower(5, 5)).toBe(false);

    expect(planner.undo()).toBe(true);
    expect(planner.budgetUsed).toBe(6);
    expect(planner.remainingBudget).toBe(4);

    expect(planner.placeFirebreak(1, 4)).toBe(true);
  });

  it('cannot place firebreak inside heat danger zone next to active fire', () => {
    const grid = new SimulationGrid(15, 15);
    grid.terrain.fill(TerrainType.FOREST);

<<<<<<< HEAD
=======
    // Ignite fire at (5, 5)
>>>>>>> feat/yurii-ui
    grid.state[grid.getIndex(5, 5)] = CellState.BURNING;

    const budget = {
      totalBudget: 50,
      firebreakCostPerCell: 2,
      watchTowerCost: 15,
    };

    const planner = new PlanningManager(grid, budget);

<<<<<<< HEAD
    expect(planner.placeFirebreak(5, 6)).toBe(false);
    expect(planner.lastErrorMessage).toContain('Занадто близько до полум’я');

=======
    // Heat danger radius is 2: placing at (5, 6) or (6, 5) or (7, 5) must be rejected
    expect(planner.placeFirebreak(5, 6)).toBe(false);
    expect(planner.lastErrorMessage).toContain('Занадто близько до полум’я');

    // Placing outside danger radius (e.g. distance > 2: at x=5, y=9) must be allowed
>>>>>>> feat/yurii-ui
    expect(planner.placeFirebreak(5, 9)).toBe(true);
  });
});
