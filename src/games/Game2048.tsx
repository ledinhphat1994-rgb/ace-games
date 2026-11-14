import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Undo2, Trophy, Award } from 'lucide-react';

type Board = number[][];

export const Game2048: React.FC = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('acegames_2048_best') || '0', 10);
  });
  const [history, setHistory] = useState<{ board: Board; score: number } | null>(null);
  const [won, setWon] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function createEmptyBoard(): Board {
    return Array(4).fill(0).map(() => Array(4).fill(0));
  }

  // Spawn a random tile (2 or 4) in an empty cell
  const addRandomTile = useCallback((currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[randomIndex];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setHistory(null);
    setWon(false);
    setGameOver(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check Game Over
  const checkGameOver = (b: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return false;
        if (c < 3 && b[r][c] === b[r][c + 1]) return false;
        if (r < 3 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Move core logic
  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;

    let hasMoved = false;
    let addedScore = 0;
    const newBoard = board.map(row => [...row]);

    // Save history for Undo
    const prevBoard = board.map(row => [...row]);
    const prevScore = score;

    const slideAndMergeRow = (row: number[]): number[] => {
      let filtered = row.filter(val => val !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          addedScore += filtered[i];
          if (filtered[i] === 2048 && !won) {
            setWon(true);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          }
          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < 4) {
        filtered.push(0);
      }
      return filtered;
    };

    if (direction === 'LEFT') {
      for (let r = 0; r < 4; r++) {
        const originalRow = [...newBoard[r]];
        newBoard[r] = slideAndMergeRow(newBoard[r]);
        if (originalRow.some((val, idx) => val !== newBoard[r][idx])) hasMoved = true;
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const originalRow = [...newBoard[r]];
        const reversed = [...newBoard[r]].reverse();
        const merged = slideAndMergeRow(reversed).reverse();
        newBoard[r] = merged;
        if (originalRow.some((val, idx) => val !== newBoard[r][idx])) hasMoved = true;
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        const merged = slideAndMergeRow(col);
        for (let r = 0; r < 4; r++) {
          if (newBoard[r][c] !== merged[r]) hasMoved = true;
          newBoard[r][c] = merged[r];
        }
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
        const merged = slideAndMergeRow(col);
        for (let r = 0; r < 4; r++) {
          if (newBoard[3 - r][c] !== merged[r]) hasMoved = true;
          newBoard[3 - r][c] = merged[r];
        }
      }
    }

    if (hasMoved) {
      setHistory({ board: prevBoard, score: prevScore });
      const boardWithNewTile = addRandomTile(newBoard);
      const nextScore = score + addedScore;
      setBoard(boardWithNewTile);
      setScore(nextScore);

      if (nextScore > bestScore) {
        setBestScore(nextScore);
        localStorage.setItem('acegames_2048_best', nextScore.toString());
      }

      if (checkGameOver(boardWithNewTile)) {
        setGameOver(true);
      }
    }
  }, [board, score, bestScore, won, gameOver, addRandomTile]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch swipe handler
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const threshold = 30;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        move(dx > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(dy) > threshold) {
        move(dy > 0 ? 'DOWN' : 'UP');
      }
    }
  };

  const handleUndo = () => {
    if (history) {
      setBoard(history.board);
      setScore(history.score);
      setHistory(null);
      setGameOver(false);
    }
  };

  // Color generator for tiles with massive typography
  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-[#EEE4DA] text-[#776E65] text-3xl sm:text-5xl md:text-6xl';
      case 4: return 'bg-[#EDE0C8] text-[#776E65] text-3xl sm:text-5xl md:text-6xl';
      case 8: return 'bg-[#F2B179] text-white shadow-md text-3xl sm:text-5xl md:text-6xl';
      case 16: return 'bg-[#F59563] text-white shadow-md text-2xl sm:text-4xl md:text-5xl';
      case 32: return 'bg-[#F67C5F] text-white shadow-lg text-2xl sm:text-4xl md:text-5xl';
      case 64: return 'bg-[#F65E3B] text-white shadow-lg text-2xl sm:text-4xl md:text-5xl';
      case 128: return 'bg-[#EDCF72] text-white shadow-xl text-xl sm:text-3xl md:text-4xl';
      case 256: return 'bg-[#EDCC61] text-white shadow-xl text-xl sm:text-3xl md:text-4xl';
      case 512: return 'bg-[#EDC850] text-white shadow-xl text-xl sm:text-3xl md:text-4xl';
      case 1024: return 'bg-[#EDC53F] text-white shadow-2xl text-lg sm:text-2xl md:text-3xl';
      case 2048: return 'bg-[#EDC22E] text-white shadow-[0_0_30px_rgba(237,194,46,0.9)] text-lg sm:text-2xl md:text-3xl animate-pulse';
      default: return val > 2048 ? 'bg-[#3C3A32] text-white text-base sm:text-xl md:text-2xl' : 'bg-[#CDC1B4]/20';
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-full max-w-[min(96vw,calc(100vh-80px),960px)] select-none p-1 sm:p-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Score Header */}
      <div className="flex items-center justify-between w-full mb-3 px-3 bg-slate-900/85 border border-white/10 rounded-2xl py-2">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Điểm Số</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">{score}</span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Kỷ Lục</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono leading-none">{bestScore}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleUndo}
            disabled={!history || gameOver}
            className={`p-2 rounded-xl border transition ${
              history && !gameOver
                ? 'bg-slate-800 hover:bg-slate-700 border-white/10 text-cyan-400 cursor-pointer shadow-sm active:scale-95'
                : 'opacity-40 border-transparent text-gray-600 cursor-not-allowed'
            }`}
            title="Đi lại 1 bước (Undo)"
          >
            <Undo2 className="w-4 h-4 text-cyan-400" />
          </button>

          {!gameOver && (
            <button
              onClick={initGame}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-amber-400 hover:text-amber-300 transition shadow-sm cursor-pointer active:scale-95"
              title="Ván mới (Chơi lại)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Massive 4x4 Grid Board - Scaled to never exceed container */}
      <div className="relative bg-[#948171] p-2.5 sm:p-4 rounded-3xl w-full aspect-square max-w-[min(92vw,calc(100dvh-220px),580px)] max-h-[min(92vw,calc(100dvh-220px),580px)] shadow-2xl border-3 sm:border-4 border-[#7a6859] flex-shrink min-h-0">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3.5 w-full h-full">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex items-center justify-center font-black rounded-2xl transition-all duration-100 select-none ${
                  getTileColor(cell)
                }`}
              >
                {cell > 0 ? cell : ''}
              </div>
            ))
          )}
        </div>

        {/* Win Overlay */}
        {won && (
          <div className="absolute inset-0 bg-amber-500/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
            <Award className="w-14 h-14 text-yellow-200 mb-2 animate-bounce" />
            <h3 className="text-2xl font-black mb-1">BẠN ĐÃ ĐẠT 2048!</h3>
            <p className="text-sm text-yellow-100 mb-4 text-center">Chúc mừng bạn đã chinh phục cột mốc huyền thoại!</p>
            <div className="flex gap-2">
              <button
                onClick={() => setWon(false)}
                className="px-4 py-2 bg-white text-amber-700 font-bold rounded-xl shadow hover:bg-gray-100 transition text-sm"
              >
                Tiếp Tục Chơi
              </button>
              <button
                onClick={initGame}
                className="px-4 py-2 bg-amber-800 text-white font-bold rounded-xl shadow hover:bg-amber-900 transition text-sm"
              >
                Ván Mới
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
            <h3 className="text-2xl font-black text-rose-500 mb-1">HẾT NƯỚC ĐI!</h3>
            <p className="text-sm text-gray-300 mb-4 text-center">Không còn ô trống nào có thể kết hợp được.</p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm"
            >
              Thử Lại Ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
