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
    id: 'river-village',
    name: 'Рідне селище та річковий бір',
    description:
      'На заході у лісовому масиві спалахнула пожежа. Помірний вітер жене вогонь через сухі кущі прямо до селища фермера на сході. Використайте річку з вологими берегами як природний бар’єр та створіть просіки, щоб захистити хатинки!',
    env: {
      windSpeed: 6.5,
      windDirectionDeg: 90,
      humidity: 38,
    },
    seed: 104729,
    budget: {
      totalBudget: 50,
      firebreakCostPerCell: 2,
      watchTowerCost: 18,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

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
          const rx = riverX + dx;
          if (grid.inBounds(rx, y)) {
            grid.terrain[grid.getIndex(rx, y)] = TerrainType.WATER;
          }
        }
      }

      for (let x = 0; x < width; x++) {
        grid.terrain[grid.getIndex(x, 15)] = TerrainType.ROAD;
      }

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
          }
        }
      }

      grid.generateWetShorelines();

      grid.state[grid.getIndex(3, 14)] = CellState.BURNING;
      grid.state[grid.getIndex(3, 15)] = CellState.BURNING;
    },
  },
  {
    id: 'dry-steppe-farm',
    name: 'Сухий степовий хутір',
    description:
      'Екстремальна літня сухість. Сильний південно-східний вітер підхопив вогонь у сухостої та чагарниках. Створіть міцне захисне півколо навколо будівель хутора до того, як вогонь перекриє шлях!',
    env: {
      windSpeed: 10.0,
      windDirectionDeg: 135,
      humidity: 16,
    },
    seed: 582199,
    budget: {
      totalBudget: 60,
      firebreakCostPerCell: 2,
      watchTowerCost: 18,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

      grid.terrain.fill(TerrainType.GRASS);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if ((x * 3 + y * 7) % 7 === 0 || (x + y) % 6 === 0) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.BUSHES;
          } else if ((x - 10) ** 2 + (y - 12) ** 2 < 12) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.FOREST;
          }
        }
      }

      for (let y = 10; y <= 13; y++) {
        for (let x = 11; x <= 14; x++) {
          if ((x - 12.5) ** 2 + (y - 11.5) ** 2 < 3) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

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
    },
  },
  {
    id: 'hill-farmstead',
    name: 'Пагорб із садибою та вітряком',
    description:
      'Садиба фермера розташована на вершині пагорба. Вогонь рухається з підніжжя. Оскільки полум’я підіймається вгору значно швидше за рахунок теплового схилу, звичайна лінія не втримає натиск — встановіть водонапірну вежу та просіки!',
    env: {
      windSpeed: 5.0,
      windDirectionDeg: 0,
      humidity: 35,
    },
    seed: 902831,
    budget: {
      totalBudget: 54,
      firebreakCostPerCell: 2,
      watchTowerCost: 18,
    },
    init: (grid: SimulationGrid) => {
      const { width, height } = grid;

      grid.terrain.fill(TerrainType.FOREST);

      const cx = 15;
      const cy = 13;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const distSq = (x - cx) ** 2 + (y - cy) ** 2;
          if (distSq < 14 ** 2) {
            grid.elevation[grid.getIndex(x, y)] = 50 * Math.exp(-distSq / (2 * 5 ** 2));
          }
          if ((x * 2 + y * 5) % 8 === 0) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.BUSHES;
          }
        }
      }

      for (let y = 22; y <= 25; y++) {
        for (let x = 6; x <= 9; x++) {
          if ((x - 7.5) ** 2 + (y - 23.5) ** 2 < 3) {
            grid.terrain[grid.getIndex(x, y)] = TerrainType.WATER;
          }
        }
      }

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
    },
  },
];
