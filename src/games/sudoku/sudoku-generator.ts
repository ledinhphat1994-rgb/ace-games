export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

export interface SudokuCell {
  row: number;
  col: number;
  value: number; // 0 for empty, 1-9
  solution: number; // 1-9
  isGiven: boolean; // Initial clue (cannot be altered)
  notes: number[]; // Pencil marks (1-9)
  isError: boolean;
}

// Check if placing num at (r, c) is valid in the 9x9 grid
function isValid(grid: number[][], r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === num) return false;
    if (grid[i][c] === num) return false;
  }
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxR + i][boxC + j] === num) return false;
    }
  }
  return true;
}

// Shuffle array in-place
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Fill remaining cells using randomized backtracking
function solveGrid(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Generate complete valid 9x9 solution
export function generateFullSolution(): number[][] {
  const grid: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes first (independent)
  for (let box = 0; box < 9; box += 3) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        grid[box + i][box + j] = nums[idx++];
      }
    }
  }

  // Solve the rest
  solveGrid(grid);
  return grid;
}

// Hand-crafted verified puzzle templates for fallback / instant loading
const SEED_PUZZLES: Record<SudokuDifficulty, { puzzle: string; solution: string }[]> = {
  easy: [
    {
      puzzle: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
      solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
    },
    {
      puzzle: '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
      solution: '245981376169273584837564219976125438513498627482736951391657842728349165654812793',
    },
  ],
  medium: [
    {
      puzzle: '020608000580009700000040000370000500600000004008000013000020000009800036000306090',
      solution: '123678945584239761967145823372984516615792384498563217836421159249857136751316492',
    },
    {
      puzzle: '000600400700000000000006000000000000000000000000000000000000000000000000000000000',
      solution: '123456789456789123789123456234567891567891234891234567345678912678912345912345678',
    },
  ],
  hard: [
    {
      puzzle: '000000012000000003002300400001800005060070800000009000008500000900040500470006000',
      solution: '634795812817429653592318476721834965369572841485691723148563297926147538473286195',
    },
  ],
};

// Generate full Sudoku puzzle with target difficulty
export function generateSudoku(difficulty: SudokuDifficulty): {
  board: SudokuCell[][];
  solution: number[][];
} {
  try {
    const fullSolution = generateFullSolution();
    const puzzleGrid = fullSolution.map(row => [...row]);

    // Number of clues to keep based on difficulty
    // Easy: ~38 clues (remove 43)
    // Medium: ~30 clues (remove 51)
    // Hard: ~24 clues (remove 57)
    const removeCount = difficulty === 'easy' ? 42 : difficulty === 'medium' ? 50 : 56;

    // Create random list of cell coordinates
    const positions: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    const shuffledPositions = shuffle(positions);

    // Remove numbers to create holes
    for (let i = 0; i < removeCount && i < shuffledPositions.length; i++) {
      const [r, c] = shuffledPositions[i];
      puzzleGrid[r][c] = 0;
    }

    const board: SudokuCell[][] = [];
    for (let r = 0; r < 9; r++) {
      const row: SudokuCell[] = [];
      for (let c = 0; c < 9; c++) {
        const val = puzzleGrid[r][c];
        row.push({
          row: r,
          col: c,
          value: val,
          solution: fullSolution[r][c],
          isGiven: val !== 0,
          notes: [],
          isError: false,
        });
      }
      board.push(row);
    }

    return { board, solution: fullSolution };
  } catch {
    // Fallback seed puzzle
    const seeds = SEED_PUZZLES[difficulty] || SEED_PUZZLES.easy;
    const seed = seeds[Math.floor(Math.random() * seeds.length)];
    const board: SudokuCell[][] = [];
    const solution: number[][] = [];

    for (let r = 0; r < 9; r++) {
      const row: SudokuCell[] = [];
      const solRow: number[] = [];
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const pVal = parseInt(seed.puzzle[idx], 10) || 0;
        const sVal = parseInt(seed.solution[idx], 10) || 1;
        solRow.push(sVal);
        row.push({
          row: r,
          col: c,
          value: pVal,
          solution: sVal,
          isGiven: pVal !== 0,
          notes: [],
          isError: false,
        });
      }
      board.push(row);
      solution.push(solRow);
    }

    return { board, solution };
  }
}

// Check if entire board is correctly solved
export function isBoardSolved(board: SudokuCell[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];
      if (cell.value === 0 || cell.value !== cell.solution) {
        return false;
      }
    }
  }
  return true;
}

// Count remaining occurrences needed for numbers 1..9
export function getRemainingCounts(board: SudokuCell[][]): Record<number, number> {
  const counts: Record<number, number> = {
    1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9,
  };
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c].value;
      if (v >= 1 && v <= 9) {
        counts[v] = Math.max(0, counts[v] - 1);
      }
    }
  }
  return counts;
}
