import {
  SimulationGrid,
  TerrainType,
  CellState,
  EnvironmentState,
  PlanningBudgetConfig,
} from '../simulation';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  env: EnvironmentState;
  seed: number;
  budget: PlanningBudgetConfig;
  init: (grid: SimulationGrid) => void;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'pine-forest',
    name: 'Сосновий бір',
    description:
      'Рівнинний густий сосновий масив із річкою та дорогою. Помірний західний вітер штовхає полум’я на схід. Завдання: локалізувати пожежу до того, як вона перекинеться на заповідні ділянки.',
    env: {
      windSpeed: 6.0,
      windDirectionDeg: 90, // Вітер дує на Схід
      humidity: 42,
    },
    seed: 104729,
    budget: {
      totalBudget: 120,
      firebreakCostPerCell: 2,
      watchTowerCost: 20,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

      // За замовчуванням вся територія - ліс
      grid.terrain.fill(TerrainType.FOREST);

      // Природна річка, що звивається біля x = 65..70
      for (let y = 0; y < height; y++) {
        const riverX = Math.round(65 + Math.sin(y / 8) * 3 + Math.cos(y / 15) * 2);
        for (let dx = -1; dx <= 1; dx++) {
          const rx = riverX + dx;
          if (grid.inBounds(rx, y)) {
            grid.terrain[grid.getIndex(rx, y)] = TerrainType.WATER;
          }
        }
      }

      // Горизонтальна грунтова дорога на y = 50
      for (let x = 0; x < width; x++) {
        grid.terrain[grid.getIndex(x, 50)] = TerrainType.ROAD;
      }

      // Галявини з травою навколо
      for (let y = 10; y < 30; y++) {
        for (let x = 10; x < 25; x++) {
          if ((x - 17) ** 2 + (y - 20) ** 2 < 36) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.GRASS;
          }
        }
      }

      // Початкове вогнище загоряння
      grid.state[grid.getIndex(20, 40)] = CellState.BURNING;
      grid.state[grid.getIndex(21, 40)] = CellState.BURNING;
      grid.state[grid.getIndex(20, 41)] = CellState.BURNING;
    },
  },
  {
    id: 'steppe-wind',
    name: 'Степовий вітер',
    description:
      'Сухий степовий ландшафт із низькою вологістю та сильним поривчастим південно-східним вітром. Вогонь поширюється з високою швидкістю сухою травою до лісосмуг.',
    env: {
      windSpeed: 12.0,
      windDirectionDeg: 135, // Вітер дує на Південний Схід
      humidity: 18,
    },
    seed: 582199,
    budget: {
      totalBudget: 140,
      firebreakCostPerCell: 2,
      watchTowerCost: 20,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

      // Мозаїчний ландшафт: суха трава та масиви лісу
      grid.terrain.fill(TerrainType.GRASS);

      // Острівці лісу та лісопосадки
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const inForest1 = (x - 45) ** 2 + (y - 45) ** 2 < 200;
          const inForest2 = (x - 70) ** 2 + (y - 70) ** 2 < 320;
          const inForestBelt = y % 25 >= 10 && y % 25 <= 14 && x > 20;

          if (inForest1 || inForest2 || inForestBelt) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.FOREST;
          }
        }
      }

      // Невеликий ставок біля центру
      for (let y = 35; y < 45; y++) {
        for (let x = 55; x < 65; x++) {
          if ((x - 60) ** 2 + (y - 40) ** 2 < 16) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

      // Осередок пожежі на північному заході
      grid.state[grid.getIndex(15, 15)] = CellState.BURNING;
      grid.state[grid.getIndex(16, 15)] = CellState.BURNING;
      grid.state[grid.getIndex(15, 16)] = CellState.BURNING;
    },
  },
  {
    id: 'black-forest-hills',
    name: 'Пагорби Чорного лісу',
    description:
      'Рельєфна місцевість із великим пагорбом у центрі. Демонстрація впливу рельєфу (slope factor): полум’я стрімко підіймається вгору схилом, але сповільнюється на спаді.',
    env: {
      windSpeed: 5.0,
      windDirectionDeg: 0, // Вітер дує на Північ
      humidity: 40,
    },
    seed: 902831,
    budget: {
      totalBudget: 130,
      firebreakCostPerCell: 2,
      watchTowerCost: 20,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

      grid.terrain.fill(TerrainType.FOREST);

      // Генерація пагорба з піком у центрі (50, 50), висота до 60 метрів
      const centerX = 50;
      const centerY = 50;
      const radius = 35;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;
          if (distSq < radius ** 2) {
            const h = 60 * Math.exp(-distSq / (2 * 12 ** 2));
            grid.elevation[grid.getIndex(x, y)] = h;
          }
        }
      }

      // Невелика водойма біля підніжжя
      for (let y = 15; y < 25; y++) {
        for (let x = 15; x < 25; x++) {
          if ((x - 20) ** 2 + (y - 20) ** 2 < 14) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

      // Осередок загоряння біля південного підніжжя пагорба
      grid.state[grid.getIndex(50, 75)] = CellState.BURNING;
      grid.state[grid.getIndex(51, 75)] = CellState.BURNING;
      grid.state[grid.getIndex(50, 76)] = CellState.BURNING;
    },
  },
];
