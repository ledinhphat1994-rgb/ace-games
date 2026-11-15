import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Flag, Clock } from 'lucide-react';
import { soundManager } from '../utils/sound';

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
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false); // for mobile touch
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Initialize board (Trống, sẵn sàng chờ nước đầu tiên an toàn tuyệt đối)
  const initBoard = useCallback(() => {
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

    setGrid(newGrid);
    setMinesPlaced(false);
    setGameOver(false);
    setGameWon(false);
    setTimer(0);
    setTimerActive(false);
  }, [rows, cols]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Rải mìn đảm bảo an toàn tuyệt đối cho ô click đầu tiên và các ô liền kề
  const placeMines = (board: Cell[][], safeR: number, safeC: number) => {
    let placedMines = 0;
    while (placedMines < minesCount) {
      const rr = Math.floor(Math.random() * rows);
      const cc = Math.floor(Math.random() * cols);
      // Không đặt mìn vào ô click đầu tiên và 8 ô xung quanh
      const isAroundSafe = Math.abs(rr - safeR) <= 1 && Math.abs(cc - safeC) <= 1;
      if (!board[rr][cc].isMine && !isAroundSafe) {
        board[rr][cc].isMine = true;
        placedMines++;
      }
    }

    // Tính toán số mìn xung quanh từng ô
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                count++;
              }
            }
          }
          board[r][c].neighborMines = count;
        }
      }
    }
  };

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

    if (flagMode) {
      // Toggle flag
      const target = newGrid[r][c];
      if (!target.isOpen) {
        target.isFlagged = !target.isFlagged;
        soundManager.playMinesweeperFlag();
        setGrid(newGrid);
      }
      return;
    }

    if (newGrid[r][c].isFlagged || newGrid[r][c].isOpen) return;

    // First click safe: nếu chưa rải mìn, sinh mìn tránh xa ô này
    if (!minesPlaced) {
      placeMines(newGrid, r, c);
      setMinesPlaced(true);
    }

    const target = newGrid[r][c];

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
      soundManager.playExplosion();
      soundManager.playDefeat();
      return;
    }

    // Safe cell
    target.isOpen = true;
    soundManager.playMinesweeperClick();
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
      setTimerActive(false);
      soundManager.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      try {
        const curBest = parseInt(localStorage.getItem('acegames_minesweeper_best') || '0', 10);
        if (curBest === 0 || timer < curBest) {
          localStorage.setItem('acegames_minesweeper_best', Math.max(1, timer).toString());
        }
      } catch {}
    }
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || gameWon) return;
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const target = newGrid[r][c];
    if (!target.isOpen) {
      target.isFlagged = !target.isFlagged;
      soundManager.playMinesweeperFlag();
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
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px như màn hình mặc định */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 min-h-[52px] shadow-inner flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              MÌN CÒN LẠI
            </span>
            <div className="flex items-center gap-1.5 text-rose-400 font-mono font-black text-xl sm:text-2xl mt-1 leading-none">
              <span>💣</span>
              <span>{Math.max(0, minesCount - flagsUsed)}</span>
            </div>
          </div>
        </div>

        {/* Căn chính giữa tuyệt đối: Đồng hồ thời gian */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center text-center z-0 pointer-events-none">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 h-4 leading-none text-center">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>THỜI GIAN</span>
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-none mt-1 text-center">
            {timer}s
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 z-10">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setFlagMode(!flagMode);
            }}
            disabled={gameOver || gameWon}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
              flagMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-md animate-pulse'
                : 'bg-slate-800 border-white/10 text-gray-300 hover:text-white'
            }`}
            title={flagMode ? 'Cắm Cờ: Đang Bật' : 'Cắm Cờ: Đang Tắt'}
          >
            <Flag className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">{flagMode ? 'Cắm Cờ: BẬT' : 'Cắm Cờ: TẮT'}</span>
          </button>

          {!gameOver && !gameWon && (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                initBoard();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-gray-200 transition cursor-pointer"
              title="Ván mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena - Vùng 1 CHỈ hiển thị game to rõ, không để thẻ người và máy */}
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#18080c] via-[#0e0407] to-[#040102] rounded-3xl border-4 border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden flex items-center justify-center p-3 sm:p-5 md:p-6 flex-shrink min-h-0">
        
        {/* Center: Massive 8x8 Grid Board taking full vertical height to rõ ở Vùng 1 */}
        <div className="game-board-inner relative bg-[#070204] p-2.5 sm:p-4 rounded-3xl h-full aspect-square max-h-[calc(100dvh-260px)] border-4 border-rose-600/50 shadow-2xl flex items-center justify-center">
          <div className="grid grid-cols-8 grid-rows-8 gap-1.5 sm:gap-2.5 w-full h-full">
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
              <h3 className="text-3xl font-black text-emerald-400 mb-1 ">CHIẾN THẮNG!</h3>
              <p className="text-sm text-emerald-200 mb-4">Rà phá an toàn toàn bộ 10 quả mìn trong {timer} giây!</p>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  initBoard();
                }}
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
              <h3 className="text-3xl font-black text-rose-500 mb-1 ">NỔ MÌN!</h3>
              <p className="text-sm text-gray-300 mb-4">Bạn đã kích nổ quả mìn ẩn!</p>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  initBoard();
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 font-bold rounded-xl text-sm transition cursor-pointer shadow-lg"
              >
                Thử Lại Ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

