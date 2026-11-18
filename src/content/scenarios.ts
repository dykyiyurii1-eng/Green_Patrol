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
<<<<<<< Updated upstream
      windSpeed: 6.0,
      windDirectionDeg: 90, // Вітер дує на Схід
      humidity: 42,
=======
      windSpeed: 6.5,
      windDirectionDeg: 90,
      humidity: 38,
>>>>>>> Stashed changes
    },
    seed: 104729,
    budget: {
      totalBudget: 120,
      firebreakCostPerCell: 2,
      watchTowerCost: 20,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

<<<<<<< Updated upstream
      // За замовчуванням вся територія - ліс
      grid.terrain.fill(TerrainType.FOREST);

      // Природна річка, що звивається біля x = 65..70
      for (let y = 0; y < height; y++) {
        const riverX = Math.round(65 + Math.sin(y / 8) * 3 + Math.cos(y / 15) * 2);
        for (let dx = -1; dx <= 1; dx++) {
=======
      grid.terrain.fill(TerrainType.FOREST);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < 15; x++) {
          if ((x + y * 2) % 5 === 0) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.BUSHES;
          }
        }
      }

      for (let y = 0; y < height; y++) {
        const riverX = Math.round(17 + Math.sin(y / 3) * 2);
        for (let dx = 0; dx <= 1; dx++) {
>>>>>>> Stashed changes
          const rx = riverX + dx;
          if (grid.inBounds(rx, y)) {
            grid.terrain[grid.getIndex(rx, y)] = TerrainType.WATER;
          }
        }
      }

<<<<<<< Updated upstream
      // Горизонтальна грунтова дорога на y = 50
=======
>>>>>>> Stashed changes
      for (let x = 0; x < width; x++) {
        grid.terrain[grid.getIndex(x, 50)] = TerrainType.ROAD;
      }

<<<<<<< Updated upstream
      // Галявини з травою навколо
      for (let y = 10; y < 30; y++) {
        for (let x = 10; x < 25; x++) {
          if ((x - 17) ** 2 + (y - 20) ** 2 < 36) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.GRASS;
=======
      const villageCoords = [
        { x: 23, y: 10 },
        { x: 25, y: 10 },
        { x: 27, y: 11 },
        { x: 23, y: 13 },
        { x: 26, y: 14 },
        { x: 22, y: 17 },
        { x: 25, y: 18 },
        { x: 27, y: 19 },
        { x: 24, y: 21 },
        { x: 26, y: 22 },
      ];
      for (const pt of villageCoords) {
        if (grid.inBounds(pt.x, pt.y)) {
          grid.terrain[grid.getIndex(pt.x, pt.y)] = TerrainType.HOUSES;
        }
      }

      for (let y = 8; y <= 24; y++) {
        for (let x = 21; x <= 28; x++) {
          const idx = grid.getIndex(x, y);
          if (grid.terrain[idx] !== TerrainType.HOUSES && grid.terrain[idx] !== TerrainType.ROAD) {
            grid.terrain[idx] = TerrainType.GRASS;
>>>>>>> Stashed changes
          }
        }
      }

<<<<<<< Updated upstream
      // Початкове вогнище загоряння
      grid.state[grid.getIndex(20, 40)] = CellState.BURNING;
      grid.state[grid.getIndex(21, 40)] = CellState.BURNING;
      grid.state[grid.getIndex(20, 41)] = CellState.BURNING;
=======
      grid.generateWetShorelines();

      grid.state[grid.getIndex(3, 14)] = CellState.BURNING;
      grid.state[grid.getIndex(3, 15)] = CellState.BURNING;
>>>>>>> Stashed changes
    },
  },
  {
    id: 'steppe-wind',
    name: 'Степовий вітер',
    description:
      'Сухий степовий ландшафт із низькою вологістю та сильним поривчастим південно-східним вітром. Вогонь поширюється з високою швидкістю сухою травою до лісосмуг.',
    env: {
<<<<<<< Updated upstream
      windSpeed: 12.0,
      windDirectionDeg: 135, // Вітер дує на Південний Схід
      humidity: 18,
=======
      windSpeed: 10.0,
      windDirectionDeg: 135,
      humidity: 16,
>>>>>>> Stashed changes
    },
    seed: 582199,
    budget: {
      totalBudget: 140,
      firebreakCostPerCell: 2,
      watchTowerCost: 20,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

<<<<<<< Updated upstream
      // Мозаїчний ландшафт: суха трава та масиви лісу
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      // Невеликий ставок біля центру
      for (let y = 35; y < 45; y++) {
        for (let x = 55; x < 65; x++) {
          if ((x - 60) ** 2 + (y - 40) ** 2 < 16) {
=======
      for (let y = 10; y <= 13; y++) {
        for (let x = 11; x <= 14; x++) {
          if ((x - 12.5) ** 2 + (y - 11.5) ** 2 < 3) {
>>>>>>> Stashed changes
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

<<<<<<< Updated upstream
      // Осередок пожежі на північному заході
      grid.state[grid.getIndex(15, 15)] = CellState.BURNING;
      grid.state[grid.getIndex(16, 15)] = CellState.BURNING;
      grid.state[grid.getIndex(15, 16)] = CellState.BURNING;
=======
      const houses = [
        { x: 22, y: 21 },
        { x: 24, y: 21 },
        { x: 26, y: 22 },
        { x: 21, y: 24 },
        { x: 23, y: 25 },
        { x: 26, y: 25 },
        { x: 24, y: 27 },
        { x: 27, y: 27 },
      ];
      for (const h of houses) {
        if (grid.inBounds(h.x, h.y)) {
          grid.terrain[grid.getIndex(h.x, h.y)] = TerrainType.HOUSES;
        }
      }

      grid.generateWetShorelines();

      grid.state[grid.getIndex(4, 4)] = CellState.BURNING;
      grid.state[grid.getIndex(5, 4)] = CellState.BURNING;
>>>>>>> Stashed changes
    },
  },
  {
    id: 'black-forest-hills',
    name: 'Пагорби Чорного лісу',
    description:
      'Рельєфна місцевість із великим пагорбом у центрі. Демонстрація впливу рельєфу (slope factor): полум’я стрімко підіймається вгору схилом, але сповільнюється на спаді.',
    env: {
      windSpeed: 5.0,
<<<<<<< Updated upstream
      windDirectionDeg: 0, // Вітер дує на Північ
      humidity: 40,
=======
      windDirectionDeg: 0,
      humidity: 35,
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      // Генерація пагорба з піком у центрі (50, 50), висота до 60 метрів
      const centerX = 50;
      const centerY = 50;
      const radius = 35;

=======
      const cx = 15;
      const cy = 13;
>>>>>>> Stashed changes
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distSq = (x - centerX) ** 2 + (y - centerY) ** 2;
          if (distSq < radius ** 2) {
            const h = 60 * Math.exp(-distSq / (2 * 12 ** 2));
            grid.elevation[grid.getIndex(x, y)] = h;
          }
        }
      }

<<<<<<< Updated upstream
      // Невелика водойма біля підніжжя
      for (let y = 15; y < 25; y++) {
        for (let x = 15; x < 25; x++) {
          if ((x - 20) ** 2 + (y - 20) ** 2 < 14) {
=======
      for (let y = 22; y <= 25; y++) {
        for (let x = 6; x <= 9; x++) {
          if ((x - 7.5) ** 2 + (y - 23.5) ** 2 < 3) {
>>>>>>> Stashed changes
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

<<<<<<< Updated upstream
      // Осередок загоряння біля південного підніжжя пагорба
      grid.state[grid.getIndex(50, 75)] = CellState.BURNING;
      grid.state[grid.getIndex(51, 75)] = CellState.BURNING;
      grid.state[grid.getIndex(50, 76)] = CellState.BURNING;
=======
      const farmHouses = [
        { x: 14, y: 12 },
        { x: 16, y: 12 },
        { x: 14, y: 14 },
        { x: 16, y: 14 },
        { x: 15, y: 15 },
        { x: 15, y: 11 },
      ];
      for (const f of farmHouses) {
        if (grid.inBounds(f.x, f.y)) {
          grid.terrain[grid.getIndex(f.x, f.y)] = TerrainType.HOUSES;
        }
      }

      grid.generateWetShorelines();

      grid.state[grid.getIndex(15, 25)] = CellState.BURNING;
      grid.state[grid.getIndex(16, 25)] = CellState.BURNING;
>>>>>>> Stashed changes
    },
  },
];
