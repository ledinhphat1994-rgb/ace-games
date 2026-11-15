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

// Count solutions up to 2 to verify unique solution
function countSolutions(grid: number[][], counter: { count: number }): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            countSolutions(grid, counter);
            grid[r][c] = 0;
            if (counter.count >= 2) return counter.count;
          }
        }
        return counter.count;
      }
    }
  }
  counter.count++;
  return counter.count;
}

// Generate full Sudoku puzzle with target difficulty and GUARANTEED UNIQUE SOLUTION
export function generateSudoku(difficulty: SudokuDifficulty): {
  board: SudokuCell[][];
  solution: number[][];
} {
  const fullSolution = generateFullSolution();
  const puzzleGrid = fullSolution.map(row => [...row]);

  // Target number of holes to remove based on difficulty:
  // Easy: ~40 holes (41 clues left)
  // Medium: ~48 holes (33 clues left)
  // Hard: ~54 holes (27 clues left)
  const targetRemove = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 48 : 54;

  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = shuffle(positions);

  let removed = 0;
  for (const [r, c] of shuffledPositions) {
    const backup = puzzleGrid[r][c];
    puzzleGrid[r][c] = 0;

    // Check if removing keeps exactly 1 unique solution
    const counter = { count: 0 };
    countSolutions(puzzleGrid, counter);
    if (counter.count !== 1) {
      puzzleGrid[r][c] = backup; // Cannot remove, restore
    } else {
      removed++;
      if (removed >= targetRemove) break;
    }
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
