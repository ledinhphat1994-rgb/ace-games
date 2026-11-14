import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Flag, Clock } from 'lucide-react';

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export const GameMinesweeper: React.FC = () => {
  const [rows] = useState(8);
  const [cols] = useState(8);
  const [minesCount] = useState(10);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false); // for mobile touch
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Initialize board
  const initBoard = useCallback(() => {
    // 1. Create empty cells
    const newGrid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isOpen: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    // 2. Place random mines
    let placedMines = 0;
    while (placedMines < minesCount) {
      const rr = Math.floor(Math.random() * rows);
      const cc = Math.floor(Math.random() * cols);
      if (!newGrid[rr][cc].isMine) {
        newGrid[rr][cc].isMine = true;
        placedMines++;
      }
    }

    // 3. Calculate neighbor mine numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    setGrid(newGrid);
    setGameOver(false);
    setGameWon(false);
    setTimer(0);
    setTimerActive(false);
  }, [rows, cols, minesCount]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameOver, gameWon]);

  // Reveal empty zero neighbors recursively
  const revealEmpty = (board: Cell[][], r: number, c: number) => {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          !board[nr][nc].isOpen &&
          !board[nr][nc].isFlagged
        ) {
          board[nr][nc].isOpen = true;
          if (board[nr][nc].neighborMines === 0 && !board[nr][nc].isMine) {
            revealEmpty(board, nr, nc);
          }
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || gameWon) return;

    if (!timerActive) setTimerActive(true);

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const target = newGrid[r][c];

    if (flagMode) {
      // Toggle flag
      if (!target.isOpen) {
        target.isFlagged = !target.isFlagged;
        setGrid(newGrid);
      }
      return;
    }

    if (target.isFlagged || target.isOpen) return;

    // Step on mine
    if (target.isMine) {
      target.isOpen = true;
      // Reveal all mines
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newGrid[i][j].isMine) newGrid[i][j].isOpen = true;
        }
      }
      setGrid(newGrid);
      setGameOver(true);
      return;
    }

    // Safe cell
    target.isOpen = true;
    if (target.neighborMines === 0) {
      revealEmpty(newGrid, r, c);
    }

    setGrid(newGrid);

    // Check Win
    let openCount = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (newGrid[i][j].isOpen && !newGrid[i][j].isMine) openCount++;
      }
    }

    if (openCount === rows * cols - minesCount) {
      setGameWon(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || gameWon) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const target = newGrid[r][c];
    if (!target.isOpen) {
      target.isFlagged = !target.isFlagged;
      setGrid(newGrid);
    }
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-blue-400';
      case 2: return 'text-green-400';
      case 3: return 'text-red-400';
      case 4: return 'text-purple-400';
      case 5: return 'text-amber-400';
      default: return 'text-rose-400';
    }
  };

  const flagsUsed = grid.reduce((acc, row) => acc + row.filter(c => c.isFlagged).length, 0);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-[min(94vw,600px)] mx-auto select-none p-1 sm:p-2">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2 px-3 py-2 bg-slate-900/90 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-base">
            <span className="text-xl">💣</span>
            <span>{minesCount - flagsUsed}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-base">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{timer}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition ${
              flagMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                : 'bg-slate-800 border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" /> Cắm Cờ: {flagMode ? 'BẬT' : 'TẮT'}
          </button>

          <button
            onClick={initBoard}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-gray-200 transition"
          >
            <RotateCcw className="w-4 h-4" /> Ván Mới
          </button>
        </div>
      </div>

      {/* Massive Grid Board */}
      <div className="relative bg-[#0b1120] p-3 sm:p-4 rounded-3xl border-4 border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)]">
        <div 
          className="grid gap-1.5 sm:gap-2.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={e => handleContextMenu(e, r, c)}
                className={`w-11 h-11 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl font-black text-xl sm:text-3xl flex items-center justify-center transition-all select-none ${
                  cell.isOpen
                    ? cell.isMine
                      ? 'bg-rose-600 text-white animate-bounce shadow-lg'
                      : 'bg-slate-900/90 text-gray-100 border border-white/5'
                    : 'bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-slate-700/80 shadow-md cursor-pointer'
                }`}
              >
                {cell.isOpen ? (
                  cell.isMine ? (
                    '💣'
                  ) : cell.neighborMines > 0 ? (
                    <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                  ) : (
                    ''
                  )
                ) : cell.isFlagged ? (
                  '🚩'
                ) : (
                  ''
                )}
              </button>
            ))
          )}
        </div>

        {/* Win Overlay */}
        {gameWon && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
            <span className="text-4xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl font-black text-emerald-400 mb-1">CHIẾN THẮNG!</h3>
            <p className="text-xs text-emerald-200 mb-3">Bạn đã rà phá toàn bộ 10 quả mìn trong {timer} giây!</p>
            <button
              onClick={initBoard}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-xs transition"
            >
              Chơi Ván Khác
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
            <span className="text-4xl mb-2">💥</span>
            <h3 className="text-2xl font-black text-rose-500 mb-1">NỔ MÌN!</h3>
            <p className="text-xs text-gray-300 mb-3">Rất tiếc, bạn đã đạp trúng một quả mìn!</p>
            <button
              onClick={initBoard}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl text-xs transition"
            >
              Thử Lại Ngay
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-3">
        💡 <span className="text-gray-300">Mẹo trên điện thoại:</span> Bấm nút "Chế độ cắm cờ" để cắm cờ đánh dấu ô có mìn!
      </p>
    </div>
  );
};
