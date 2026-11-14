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
    const saved = localStorage.getItem('playzone_caro_stats');
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
      } else if (winner === 'O') {
        updated.loss += 1;
      } else {
        updated.draw += 1;
      }
      localStorage.setItem('playzone_caro_stats', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-md mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div>
          <h2 className="text-3xl font-extrabold text-indigo-400 font-['Orbitron']">TIC-TAC-TOE</h2>
          <p className="text-xs text-gray-400">Cờ Caro Chiến Thuật</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-arcade-card border border-arcade-border px-2.5 py-1 rounded-lg text-center">
            <span className="text-[10px] text-emerald-400 font-bold block">Thắng</span>
            <span className="text-sm font-bold text-white">{stats.win}</span>
          </div>
          <div className="bg-arcade-card border border-arcade-border px-2.5 py-1 rounded-lg text-center">
            <span className="text-[10px] text-gray-400 font-bold block">Hòa</span>
            <span className="text-sm font-bold text-gray-300">{stats.draw}</span>
          </div>
          <div className="bg-arcade-card border border-arcade-border px-2.5 py-1 rounded-lg text-center">
            <span className="text-[10px] text-rose-400 font-bold block">Thua</span>
            <span className="text-sm font-bold text-rose-300">{stats.loss}</span>
          </div>
        </div>
      </div>

      {/* Mode & Difficulty Selector */}
      <div className="flex items-center justify-between w-full mb-3 gap-2">
        <div className="flex bg-arcade-card p-1 rounded-xl border border-arcade-border">
          <button
            onClick={() => {
              setIsAiMode(true);
              resetGame();
            }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition ${
              isAiMode ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Đấu AI
          </button>
          <button
            onClick={() => {
              setIsAiMode(false);
              resetGame();
            }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition ${
              !isAiMode ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 2 Người
          </button>
        </div>

        {isAiMode && (
          <select
            value={difficulty}
            onChange={e => {
              setDifficulty(e.target.value as Difficulty);
              resetGame();
            }}
            className="bg-arcade-card border border-arcade-border text-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="EASY">Dễ (Tập Chơi)</option>
            <option value="MEDIUM">Vừa (Biết Đỡ)</option>
            <option value="UNBEATABLE">Bất Khả Chiến Bại</option>
          </select>
        )}

        <button
          onClick={resetGame}
          className="p-1.5 bg-arcade-card hover:bg-arcade-hover border border-arcade-border text-gray-200 rounded-xl transition"
          title="Ván mới"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Turn indicator */}
      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
        {winnerInfo ? (
          <span className="text-yellow-400 flex items-center gap-1">
            <Award className="w-4 h-4" />
            {winnerInfo.winner === 'X' ? 'Người chơi (X) Chiến Thắng!' : winnerInfo.winner === 'O' ? (isAiMode ? 'AI (O) Đã Thắng!' : 'Người chơi (O) Thắng!') : 'Trận Đấu Hòa!'}
          </span>
        ) : (
          <span className="text-gray-300">
            Lượt đi: <span className={isXNext ? 'text-indigo-400 font-bold' : 'text-rose-400 font-bold'}>{isXNext ? 'X' : isAiMode ? 'AI (O)...' : 'O'}</span>
          </span>
        )}
      </div>

      {/* 3x3 Board */}
      <div className="relative bg-[#111827] p-3 rounded-2xl w-full aspect-square border-4 border-indigo-500/30 shadow-2xl">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-full h-full">
          {board.map((cell, idx) => {
            const isWinningCell = winnerInfo?.line?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={cell !== null || (isAiMode && !isXNext) || winnerInfo !== null}
                className={`flex items-center justify-center font-['Orbitron'] font-black rounded-xl text-4xl sm:text-5xl transition-all duration-150 ${
                  cell === null
                    ? 'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 active:scale-95'
                    : isWinningCell
                    ? 'bg-emerald-500/25 border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                    : 'bg-slate-800/90 border border-slate-700'
                }`}
              >
                {cell === 'X' && <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]">X</span>}
                {cell === 'O' && <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]">O</span>}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-3">
        💡 <span className="text-gray-300">Luật chơi:</span> Đặt 3 dấu X hoặc O thẳng hàng để chiến thắng!
      </p>
    </div>
  );
};
