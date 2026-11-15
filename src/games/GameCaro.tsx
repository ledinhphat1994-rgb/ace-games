import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Users, Bot, Award, Grid3X3, Grid } from 'lucide-react';
import { soundManager } from '../utils/sound';

type Player = 'X' | 'O' | null;
type Difficulty = 'EASY' | 'MEDIUM' | 'UNBEATABLE';

export const GameCaro: React.FC = () => {
  // Board size: 10 (10x10, 5 in a row - Cờ Caro Việt Nam) or 3 (3x3 - Tic Tac Toe nhanh)
  const [boardSize, setBoardSize] = useState<10 | 3>(10);
  const winStreak = useMemo(() => (boardSize === 10 ? 5 : 3), [boardSize]);

  const [board, setBoard] = useState<Player[]>(() => Array(100).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [isAiMode, setIsAiMode] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('UNBEATABLE');
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player | 'DRAW'; line?: number[] } | null>(null);

  const [stats, setStats] = useState<{ win: number; loss: number; draw: number }>(() => {
    const saved = localStorage.getItem('acegames_caro_stats');
    return saved ? JSON.parse(saved) : { win: 0, loss: 0, draw: 0 };
  });

  // Check winner on arbitrary NxN board with streak target
  const checkWinner = useCallback((squares: Player[], size: number, target: number) => {
    // Check horizontal, vertical, diagonal \, diagonal /
    const getIndex = (r: number, c: number) => r * size + c;

    // Horizontal
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - target; c++) {
        const first = squares[getIndex(r, c)];
        if (first) {
          let match = true;
          const line: number[] = [];
          for (let k = 0; k < target; k++) {
            const idx = getIndex(r, c + k);
            line.push(idx);
            if (squares[idx] !== first) {
              match = false;
              break;
            }
          }
          if (match) return { winner: first, line };
        }
      }
    }

    // Vertical
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - target; r++) {
        const first = squares[getIndex(r, c)];
        if (first) {
          let match = true;
          const line: number[] = [];
          for (let k = 0; k < target; k++) {
            const idx = getIndex(r + k, c);
            line.push(idx);
            if (squares[idx] !== first) {
              match = false;
              break;
            }
          }
          if (match) return { winner: first, line };
        }
      }
    }

    // Diagonal (\)
    for (let r = 0; r <= size - target; r++) {
      for (let c = 0; c <= size - target; c++) {
        const first = squares[getIndex(r, c)];
        if (first) {
          let match = true;
          const line: number[] = [];
          for (let k = 0; k < target; k++) {
            const idx = getIndex(r + k, c + k);
            line.push(idx);
            if (squares[idx] !== first) {
              match = false;
              break;
            }
          }
          if (match) return { winner: first, line };
        }
      }
    }

    // Diagonal (/)
    for (let r = 0; r <= size - target; r++) {
      for (let c = target - 1; c < size; c++) {
        const first = squares[getIndex(r, c)];
        if (first) {
          let match = true;
          const line: number[] = [];
          for (let k = 0; k < target; k++) {
            const idx = getIndex(r + k, c - k);
            line.push(idx);
            if (squares[idx] !== first) {
              match = false;
              break;
            }
          }
          if (match) return { winner: first, line };
        }
      }
    }

    // Draw check
    if (squares.every(s => s !== null)) {
      return { winner: 'DRAW' as const };
    }

    return null;
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
  }, [boardSize]);

  // Handle board size switch
  const handleSizeChange = (newSize: 10 | 3) => {
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
    soundManager.playButtonClick();
  };

  // Minimax for 3x3
  const find3x3Move = useCallback((currentBoard: Player[], diff: Difficulty): number => {
    const minimax = (newBoard: Player[], depth: number, isMaximizing: boolean): number => {
      const res = checkWinner(newBoard, 3, 3);
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

    if (diff === 'EASY') {
      const empty = currentBoard.map((v, i) => (v === null ? i : null)).filter((v): v is number => v !== null);
      return empty[Math.floor(Math.random() * empty.length)];
    }

    if (diff === 'MEDIUM') {
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const test = [...currentBoard];
          test[i] = 'O';
          if (checkWinner(test, 3, 3)?.winner === 'O') return i;
        }
      }
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const test = [...currentBoard];
          test[i] = 'X';
          if (checkWinner(test, 3, 3)?.winner === 'X') return i;
        }
      }
    }

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
  }, [checkWinner]);

  // Fast Heuristic AI for 10x10 Caro (Gomoku)
  const find10x10Move = useCallback((currentBoard: Player[], diff: Difficulty): number => {
    const size = 10;
    const target = 5;

    // Evaluate cell score for a player
    const evaluatePoint = (idx: number, player: Player): number => {
      const r = Math.floor(idx / size);
      const c = idx % size;
      const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal \
        [1, -1],  // diagonal /
      ];

      let totalScore = 0;

      for (const [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        // Positive direction
        let step = 1;
        while (step < target) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          const cell = currentBoard[nr * size + nc];
          if (cell === player) {
            count++;
          } else if (cell === null) {
            openEnds++;
            break;
          } else {
            break; // opponent
          }
          step++;
        }

        // Negative direction
        step = 1;
        while (step < target) {
          const nr = r - dr * step;
          const nc = c - dc * step;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          const cell = currentBoard[nr * size + nc];
          if (cell === player) {
            count++;
          } else if (cell === null) {
            openEnds++;
            break;
          } else {
            break; // opponent
          }
          step++;
        }

        if (count >= 5) totalScore += 1000000;
        else if (count === 4) totalScore += openEnds === 2 ? 100000 : 8000;
        else if (count === 3) totalScore += openEnds === 2 ? 5000 : 500;
        else if (count === 2) totalScore += openEnds === 2 ? 200 : 20;
      }

      return totalScore;
    };

    // Find all candidate empty spots adjacent to placed stones
    const candidates: { idx: number; score: number }[] = [];
    const isOccupiedAny = currentBoard.some(c => c !== null);

    if (!isOccupiedAny) {
      // First move: center spot
      return Math.floor(size / 2) * size + Math.floor(size / 2);
    }

    for (let idx = 0; idx < size * size; idx++) {
      if (currentBoard[idx] !== null) continue;

      const r = Math.floor(idx / size);
      const c = idx % size;

      // Check if adjacent to any existing piece (radius 2)
      let hasNeighbor = false;
      for (let dr = -2; dr <= 2 && !hasNeighbor; dr++) {
        for (let dc = -2; dc <= 2 && !hasNeighbor; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (currentBoard[nr * size + nc] !== null) {
              hasNeighbor = true;
            }
          }
        }
      }

      if (!hasNeighbor) continue;

      // Calculate Attack score (O) and Defense score (block X)
      const attackScore = evaluatePoint(idx, 'O');
      const defenseScore = evaluatePoint(idx, 'X');

      let combinedScore = attackScore * 1.1 + defenseScore * 1.0;

      // Center proximity bonus
      const distFromCenter = Math.abs(r - size / 2) + Math.abs(c - size / 2);
      combinedScore += (10 - distFromCenter);

      if (diff === 'EASY') {
        combinedScore += Math.random() * 2000;
      }

      candidates.push({ idx, score: combinedScore });
    }

    if (candidates.length === 0) return 0;

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].idx;
  }, []);

  const findBestMove = useCallback((currentBoard: Player[]): number => {
    if (boardSize === 3) {
      return find3x3Move(currentBoard, difficulty);
    } else {
      return find10x10Move(currentBoard, difficulty);
    }
  }, [boardSize, difficulty, find3x3Move, find10x10Move]);

  // Handle cell click
  const handleClick = (index: number) => {
    if (board[index] || winnerInfo) return;

    soundManager.playButtonClick();

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const result = checkWinner(newBoard, boardSize, winStreak);
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
          soundManager.playButtonClick();
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);

          const result = checkWinner(newBoard, boardSize, winStreak);
          if (result) {
            setWinnerInfo(result);
            updateStats(result.winner);
          } else {
            setIsXNext(true);
          }
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isAiMode, isXNext, winnerInfo, board, findBestMove, boardSize, winStreak, checkWinner]);

  const updateStats = (winner: Player | 'DRAW') => {
    setStats(prev => {
      const updated = { ...prev };
      if (winner === 'X') {
        updated.win += 1;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        soundManager.playGameLaunch();
        localStorage.setItem('acegames_caro_wins', updated.win.toString());
      } else if (winner === 'O') {
        updated.loss += 1;
        soundManager.playButtonClick();
      } else {
        updated.draw += 1;
        soundManager.playButtonClick();
      }
      localStorage.setItem('acegames_caro_stats', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Top HUD - Đầy đủ điều khiển và tỷ số */}
      <div className="game-top-hud flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 shadow-inner flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              TRẠNG THÁI
            </span>
            <div className="mt-1 h-6 flex items-center">
              {winnerInfo ? (
                <span className="text-amber-400 font-black text-xs sm:text-sm flex items-center gap-1 leading-none animate-pulse">
                  <Award className="w-4 h-4 text-amber-400" />
                  {winnerInfo.winner === 'X' ? 'X Thắng!' : winnerInfo.winner === 'O' ? (isAiMode ? 'AI Thắng!' : 'O Thắng!') : 'Hòa Nhau!'}
                </span>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-gray-200 flex items-center gap-1.5 leading-none">
                  Lượt đi: <strong className={isXNext ? 'text-cyan-400 font-black text-sm' : 'text-rose-400 font-black text-sm'}>{isXNext ? 'X (Bạn)' : isAiMode ? 'O (AI)' : 'O (Người 2)'}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              TỶ SỐ
            </span>
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold mt-1">
              <span className="text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">W:{stats.win}</span>
              <span className="text-gray-400 px-1.5 py-0.5 rounded bg-slate-800">D:{stats.draw}</span>
              <span className="text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10">L:{stats.loss}</span>
            </div>
          </div>
        </div>

        {/* Right actions: Chọn Bàn Cờ, Đấu Máy / 2 Người, Độ khó, Ván Mới */}
        <div className="flex items-center gap-2">
          {/* Nút Chọn Bàn Cờ 10x10 hoặc 3x3 */}
          <button
            onClick={() => handleSizeChange(boardSize === 10 ? 3 : 10)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-white/5 transition cursor-pointer"
            title={boardSize === 10 ? 'Đang chơi bàn 10x10 (5 ô thắng). Bấm để đổi sang 3x3' : 'Đang chơi bàn 3x3 (3 ô thắng). Bấm để đổi sang 10x10'}
          >
            {boardSize === 10 ? <Grid className="w-4 h-4 text-cyan-400" /> : <Grid3X3 className="w-4 h-4 text-amber-400" />}
            <span>{boardSize === 10 ? 'Bàn 10x10 (5 ô)' : 'Bàn 3x3 (Nhanh)'}</span>
          </button>

          {/* Đấu Máy / 2 Người */}
          <button
            onClick={() => {
              setIsAiMode(prev => !prev);
              resetGame();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold text-xs border border-white/5 transition"
            title={isAiMode ? 'Chế độ: Đấu Máy (Bấm để đổi 2 người)' : 'Chế độ: 2 Người (Bấm để đổi đấu máy)'}
          >
            {isAiMode ? <Bot className="w-4 h-4 text-cyan-400" /> : <Users className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isAiMode ? 'Đấu Máy' : '2 Người'}</span>
          </button>

          {isAiMode && (
            <select
              value={difficulty}
              onChange={e => {
                setDifficulty(e.target.value as Difficulty);
                resetGame();
              }}
              className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Vừa</option>
              <option value="UNBEATABLE">Khó (AI)</option>
            </select>
          )}

          <button
            onClick={resetGame}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-gray-200 rounded-xl transition cursor-pointer active:scale-95"
            title="Chơi lại ván mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena */}
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#0c1022] via-[#080b18] to-[#04060d] rounded-3xl border-4 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.35)] overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-5 flex-shrink min-h-0">
        
        {/* Center: Board Container */}
        <div className="game-board-inner relative bg-[#070b16] p-2.5 sm:p-4 rounded-3xl h-full aspect-square max-h-[calc(100dvh-260px)] border-4 border-indigo-500/50 shadow-2xl flex items-center justify-center">
          
          {/* 10x10 Grid or 3x3 Grid */}
          <div
            className={`grid w-full h-full ${
              boardSize === 10
                ? 'grid-cols-10 grid-rows-10 gap-1 sm:gap-1.5'
                : 'grid-cols-3 grid-rows-3 gap-2.5 sm:gap-4'
            }`}
          >
            {board.map((cell, idx) => {
              const isWinningCell = winnerInfo?.line?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleClick(idx)}
                  disabled={cell !== null || (isAiMode && !isXNext) || winnerInfo !== null}
                  className={`flex items-center justify-center font-['Orbitron'] font-black rounded-lg sm:rounded-xl transition-all duration-150 select-none ${
                    boardSize === 10
                      ? 'text-lg sm:text-2xl md:text-3xl'
                      : 'text-5xl sm:text-7xl md:text-8xl'
                  } ${
                    cell === null
                      ? 'bg-slate-900/85 hover:bg-slate-800/90 border border-white/5 active:scale-95 cursor-pointer shadow-inner'
                      : isWinningCell
                      ? 'bg-emerald-500/35 border-2 sm:border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)] scale-105 animate-pulse'
                      : 'bg-slate-900 border border-white/10'
                  }`}
                >
                  {cell === 'X' && (
                    <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">X</span>
                  )}
                  {cell === 'O' && (
                    <span className="text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">O</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* RÕ RÀNG MINH BẠCH: Bảng Thông Báo Kết Quả Khi Hết Nước / Có Thắng Thua */}
          {winnerInfo && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
              <span className="text-6xl mb-3 animate-bounce">
                {winnerInfo.winner === 'DRAW'
                  ? '🤝'
                  : winnerInfo.winner === 'X'
                  ? '🏆'
                  : isAiMode
                  ? '🤖'
                  : '🎉'}
              </span>

              <h3
                className={`text-2xl sm:text-4xl font-black mb-2 font-['Orbitron'] ${
                  winnerInfo.winner === 'X'
                    ? 'text-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]'
                    : winnerInfo.winner === 'O'
                    ? 'text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]'
                    : 'text-amber-400'
                }`}
              >
                {winnerInfo.winner === 'X'
                  ? isAiMode
                    ? 'BẠN ĐÃ CHIẾN THẮNG!'
                    : 'QUÂN X CHIẾN THẮNG!'
                  : winnerInfo.winner === 'O'
                  ? isAiMode
                    ? 'AI ĐÃ CHIẾN THẮNG!'
                    : 'QUÂN O CHIẾN THẮNG!'
                  : 'HAI BÊN HÒA NHAU!'}
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 mb-6 font-medium max-w-xs">
                {winnerInfo.winner === 'DRAW'
                  ? 'Đã đánh kín bàn cờ mà không có bên nào tạo đủ hàng thắng.'
                  : `${winnerInfo.winner === 'X' ? 'Quân X' : 'Quân O'} đã tạo thành công chuỗi ${winStreak} ô thẳng hàng!`}
              </p>

              <button
                onClick={resetGame}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(6,182,212,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" /> Chơi Ván Mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
