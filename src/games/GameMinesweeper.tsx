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
    <div className="flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px như màn hình mặc định */}
      <div className="flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 shadow-inner flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              MÌN CÒN LẠI
            </span>
            <div className="flex items-center gap-1.5 text-rose-400 font-mono font-black text-xl sm:text-2xl mt-1 leading-none">
              <span>💣</span>
              <span>{Math.max(0, minesCount - flagsUsed)}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 h-4 leading-none text-center">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>THỜI GIAN</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-none mt-1 text-center">
              {timer}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setFlagMode(!flagMode)}
            disabled={gameOver || gameWon}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
              flagMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-md animate-pulse'
                : 'bg-slate-800 border-white/10 text-gray-300 hover:text-white'
            }`}
            title={flagMode ? 'Chế độ cắm cờ (Đang BẬT)' : 'Chế độ cắm cờ (TẮT)'}
          >
            <Flag className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">{flagMode ? 'Cắm Cờ: BẬT' : 'Cắm Cờ: TẮT'}</span>
          </button>

          {!gameOver && !gameWon && (
            <button
              onClick={initBoard}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-gray-200 transition cursor-pointer"
              title="Ván mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena - To rộng hoàn toàn như Flappy Bird & Màn hình mặc định */}
      <div className="relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#18080c] via-[#0e0407] to-[#040102] rounded-3xl border-4 border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden flex items-center justify-center sm:justify-between p-3 sm:p-6 md:p-8 flex-shrink min-h-0">
        
        {/* Left Side: Radar Dashboard Card */}
        <div className="hidden lg:flex flex-col items-center justify-center w-52 xl:w-60 p-5 rounded-2xl bg-slate-900/60 border border-rose-500/30 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            💣
          </div>
          <h4 className="font-extrabold text-white text-base font-['Orbitron'] mb-1">RADAR QUÂN SỰ</h4>
          <span className="text-rose-400 font-mono text-xs font-bold mb-3">8x8 • 10 QUẢ MÌN</span>
          
          <div className="w-full space-y-2 text-xs">
            <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/5">
              <span className="text-gray-400">Mìn Còn:</span>
              <strong className="text-rose-400 font-mono font-black text-sm">{Math.max(0, minesCount - flagsUsed)}</strong>
            </div>
            <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/5">
              <span className="text-gray-400">Cờ Đã Cắm:</span>
              <strong className="text-amber-400 font-mono font-black text-sm">{flagsUsed} / 10</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 w-full text-[11px] text-gray-400 space-y-1 text-left">
            <div>• <strong className="text-gray-300">Chuột Trái</strong>: Mở ô</div>
            <div>• <strong className="text-gray-300">Chuột Phải</strong>: Cắm cờ 🚩</div>
          </div>
        </div>

        {/* Center: Massive 8x8 Grid Board filling vertical height */}
        <div className="relative bg-[#070204] p-2.5 sm:p-3.5 rounded-3xl h-full aspect-square max-h-[calc(100dvh-280px)] border-4 border-rose-600/50 shadow-2xl flex items-center justify-center">
          <div className="grid grid-cols-8 grid-rows-8 gap-1.5 sm:gap-2 w-full h-full">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={e => handleContextMenu(e, r, c)}
                  className={`w-full h-full rounded-xl sm:rounded-2xl font-black text-base sm:text-2xl md:text-3xl flex items-center justify-center transition-all select-none ${
                    cell.isOpen
                      ? cell.isMine
                        ? 'bg-rose-600 text-white animate-bounce shadow-lg'
                        : 'bg-slate-900/90 text-gray-100 border border-white/5 shadow-inner'
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
            <div className="absolute inset-0 bg-emerald-950/92 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
              <span className="text-5xl mb-2 animate-bounce">🏆</span>
              <h3 className="text-3xl font-black text-emerald-400 mb-1 font-['Orbitron']">CHIẾN THẮNG!</h3>
              <p className="text-sm text-emerald-200 mb-4">Rà phá an toàn toàn bộ 10 quả mìn trong {timer} giây!</p>
              <button
                onClick={initBoard}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-sm transition cursor-pointer shadow-lg"
              >
                Chơi Ván Mới
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
              <span className="text-5xl mb-2">💥</span>
              <h3 className="text-3xl font-black text-rose-500 mb-1 font-['Orbitron']">NỔ MÌN!</h3>
              <p className="text-sm text-gray-300 mb-4">Bạn đã kích nổ quả mìn ẩn!</p>
              <button
                onClick={initBoard}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 font-bold rounded-xl text-sm transition cursor-pointer shadow-lg"
              >
                Thử Lại Ngay
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Mission Actions Card */}
        <div className="hidden lg:flex flex-col items-center justify-center w-52 xl:w-60 p-5 rounded-2xl bg-slate-900/60 border border-rose-500/30 backdrop-blur-md shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400/40 flex items-center justify-center text-3xl mb-3 shadow-inner">
            ⏱
          </div>
          <h4 className="font-extrabold text-white text-base font-['Orbitron'] mb-1">ĐỒNG HỒ</h4>
          <span className="text-amber-400 font-mono text-2xl font-black mb-3">{timer}s</span>
          
          <div className="w-full space-y-2">
            <button
              onClick={() => setFlagMode(!flagMode)}
              className={`w-full py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                flagMode
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-gray-300'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>{flagMode ? 'Cắm Cờ: BẬT' : 'Cắm Cờ: TẮT'}</span>
            </button>
            <button
              onClick={initBoard}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-gray-200 font-bold text-xs transition cursor-pointer"
            >
              Làm Mới Bãi Mìn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
