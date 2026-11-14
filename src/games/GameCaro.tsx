import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Users, Bot, Award } from 'lucide-react';

type Player = 'X' | 'O' | null;
type Difficulty = 'EASY' | 'MEDIUM' | 'UNBEATABLE';

export const GameCaro: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [isAiMode, setIsAiMode] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('UNBEATABLE');
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player | 'DRAW'; line?: number[] } | null>(null);

  const [stats, setStats] = useState<{ win: number; loss: number; draw: number }>(() => {
    const saved = localStorage.getItem('acegames_caro_stats');
    return saved ? JSON.parse(saved) : { win: 0, loss: 0, draw: 0 };
  });

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }

    if (squares.every(s => s !== null)) {
      return { winner: 'DRAW' as const };
    }

    return null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
  };

  // Minimax Algorithm for unbeatable AI
  const findBestMove = useCallback((currentBoard: Player[]): number => {
    const minimax = (
      newBoard: Player[],
      depth: number,
      isMaximizing: boolean
    ): number => {
      const res = checkWinner(newBoard);
      if (res?.winner === 'O') return 10 - depth;
      if (res?.winner === 'X') return depth - 10;
      if (res?.winner === 'DRAW') return 0;

      if (isMaximizing) {
        let bestVal = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (newBoard[i] === null) {
            newBoard[i] = 'O';
            bestVal = Math.max(bestVal, minimax(newBoard, depth + 1, false));
            newBoard[i] = null;
          }
        }
        return bestVal;
      } else {
        let bestVal = Infinity;
        for (let i = 0; i < 9; i++) {
          if (newBoard[i] === null) {
            newBoard[i] = 'X';
            bestVal = Math.min(bestVal, minimax(newBoard, depth + 1, true));
            newBoard[i] = null;
          }
        }
        return bestVal;
      }
    };

    // Medium: 50% random, 50% minimax or simple check
    if (difficulty === 'EASY') {
      const emptyIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    if (difficulty === 'MEDIUM') {
      // Check if AI can win immediately
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const test = [...currentBoard];
          test[i] = 'O';
          if (checkWinner(test)?.winner === 'O') return i;
        }
      }
      // Check if Player is about to win and block
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const test = [...currentBoard];
          test[i] = 'X';
          if (checkWinner(test)?.winner === 'X') return i;
        }
      }
    }

    // Unbeatable Minimax
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = 'O';
        const score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }, [difficulty]);

  // Handle cell click
  const handleClick = (index: number) => {
    if (board[index] || winnerInfo) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinnerInfo(result);
      updateStats(result.winner);
      return;
    }

    setIsXNext(!isXNext);
  };

  // AI Turn effect
  useEffect(() => {
    if (isAiMode && !isXNext && !winnerInfo) {
      const timer = setTimeout(() => {
        const aiMove = findBestMove(board);
        if (aiMove !== -1) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);

          const result = checkWinner(newBoard);
          if (result) {
            setWinnerInfo(result);
            updateStats(result.winner);
          } else {
            setIsXNext(true);
          }
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isAiMode, isXNext, winnerInfo, board, findBestMove]);

  const updateStats = (winner: Player | 'DRAW') => {
    setStats(prev => {
      const updated = { ...prev };
      if (winner === 'X') {
        updated.win += 1;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        localStorage.setItem('acegames_caro_wins', updated.win.toString());
      } else if (winner === 'O') {
        updated.loss += 1;
      } else {
        updated.draw += 1;
      }
      localStorage.setItem('acegames_caro_stats', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Unified Compact HUD */}
      <div className="flex items-center justify-between w-full max-w-[min(94vw,560px)] mb-2 px-3 py-1.5 bg-slate-900/90 border border-white/10 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-2">
          {winnerInfo ? (
            <span className="text-amber-400 font-black text-xs sm:text-sm flex items-center gap-1">
              <Award className="w-4 h-4" />
              {winnerInfo.winner === 'X' ? 'X Thắng!' : winnerInfo.winner === 'O' ? (isAiMode ? 'AI Thắng!' : 'O Thắng!') : 'Hòa!'}
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-300">
              Lượt: <span className={isXNext ? 'text-cyan-400 font-black' : 'text-rose-400 font-black'}>{isXNext ? 'X' : isAiMode ? 'AI' : 'O'}</span>
            </span>
          )}
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">W:{stats.win}</span>
            <span className="text-gray-400 font-bold px-1.5 py-0.5 rounded bg-slate-800">D:{stats.draw}</span>
            <span className="text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10">L:{stats.loss}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsAiMode(prev => !prev);
              resetGame();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition"
            title={isAiMode ? 'Chế độ: Đấu Máy (Bấm để đổi 2 người)' : 'Chế độ: 2 Người (Bấm để đổi đấu máy)'}
          >
            {isAiMode ? <Bot className="w-4 h-4 text-cyan-400" /> : <Users className="w-4 h-4 text-emerald-400" />}
          </button>

          {isAiMode && (
            <select
              value={difficulty}
              onChange={e => {
                setDifficulty(e.target.value as Difficulty);
                resetGame();
              }}
              className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Vừa</option>
              <option value="UNBEATABLE">Khó</option>
            </select>
          )}

          <button
            onClick={resetGame}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-gray-200 rounded-xl transition"
            title="Ván mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Massive 3x3 Board - Scaled to never exceed container */}
      <div className="relative bg-[#0d1222] p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl w-full aspect-square max-w-[min(92vw,calc(100dvh-200px),560px)] max-h-[min(92vw,calc(100dvh-200px),560px)] border-3 sm:border-4 border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.25)] flex-shrink min-h-0">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-4 w-full h-full">
          {board.map((cell, idx) => {
            const isWinningCell = winnerInfo?.line?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={cell !== null || (isAiMode && !isXNext) || winnerInfo !== null}
                className={`flex items-center justify-center font-['Orbitron'] font-black rounded-2xl text-7xl sm:text-9xl md:text-[10rem] transition-all duration-150 select-none ${
                  cell === null
                    ? 'bg-slate-900/80 hover:bg-slate-800/80 border border-white/5 active:scale-95 cursor-pointer'
                    : isWinningCell
                    ? 'bg-emerald-500/25 border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.7)] scale-105'
                    : 'bg-slate-900 border border-white/10'
                }`}
              >
                {cell === 'X' && <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">X</span>}
                {cell === 'O' && <span className="text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">O</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
