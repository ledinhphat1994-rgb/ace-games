import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Bot, Grid3X3, Grid, Timer, Globe, LogOut } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';
import { multiplayer, type RoomInfo } from '../utils/multiplayer';

type Player = 'X' | 'O' | null;
type Difficulty = 'EASY' | 'MEDIUM' | 'UNBEATABLE';

// Check winner on arbitrary NxN board with streak target
const checkWinner = (squares: Player[], size: number, target: number): { winner: Player | 'DRAW'; line?: number[] } | null => {
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
};

export const GameCaro: React.FC = () => {
  // Board size: 10 (10x10, 5 in a row - Cờ Caro Việt Nam) or 3 (3x3 - Tic Tac Toe nhanh)
  const [boardSize, setBoardSize] = useState<10 | 3>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_caro');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.boardSize) return Number(parsed.boardSize) as 10 | 3;
      }
    } catch {}
    return 10;
  });
  const winStreak = useMemo(() => (boardSize === 10 ? 5 : 3), [boardSize]);

  const [board, setBoard] = useState<Player[]>(() => Array(boardSize === 10 ? 100 : 9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_caro');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.mode) return parsed.mode === 'ai';
      }
    } catch {}
    return true;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_caro');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.difficulty) return parsed.difficulty as Difficulty;
      }
    } catch {}
    return 'UNBEATABLE';
  });
  const [timeLimit, setTimeLimit] = useState<number>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_caro');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.timeLimit !== undefined) return Number(parsed.timeLimit);
      }
    } catch {}
    return 60; // 60s mặc định
  });
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player | 'DRAW'; line?: number[] } | null>(null);

  // Trạng Thái Chơi Online Nhiều Người (Multiplayer)
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const [isWaitingForFriend, setIsWaitingForFriend] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [onlineRoom, setOnlineRoom] = useState<RoomInfo | null>(null);
  const [playerRole, setPlayerRole] = useState<'host' | 'guest'>('host');
  const [opponentName, setOpponentName] = useState<string>('Đối thủ');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  const handleCopyInvite = () => {
    if (!onlineRoom) return;
    soundManager.playButtonClick();
    const cleanId = multiplayer.normalizeRoomId(onlineRoom.roomId);
    const url = `${window.location.origin}${window.location.pathname}?game=caro&room=${cleanId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    });
  };

  const handleLeaveRoom = () => {
    soundManager.playButtonClick();
    multiplayer.leaveRoom();
    setIsOnlineMode(false);
    setIsWaitingForFriend(false);
    setOnlineRoom(null);
    resetGame();
  };

  // Tự động vào phòng nếu có tham số URL ?game=caro&room=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      multiplayer.joinRoom('caro', roomParam).then((ok) => {
        if (ok) {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            setIsOnlineMode(true);
            setIsWaitingForFriend(false);
            setOnlineRoom(room);
            setPlayerRole('guest');
            setBoard(Array(boardSize * boardSize).fill(null));
            setIsXNext(true);
          }
        }
      });
    }
  }, [boardSize]);

  // Nhận nước đi và hành động từ đối thủ online qua WebSockets
  useEffect(() => {
    if (!isOnlineMode && !isWaitingForFriend) return;

    const handleOpponentMove = (data: any) => {
      if (data.type === 'game_move' && data.payload) {
        soundManager.playButtonClick();
        const { index, piece } = data.payload;
        setBoard(prev => {
          const updated = [...prev];
          updated[index] = piece;
          const result = checkWinner(updated, boardSize, winStreak);
          if (result) {
            setWinnerInfo(result);
            updateStats(result.winner);
          }
          return updated;
        });
        setTimeLeft(timeLimit);
        setIsXNext(piece === 'X' ? false : true);
      } else if (data.type === 'game_restart') {
        setBoard(Array(boardSize * boardSize).fill(null));
        setIsXNext(true);
        setWinnerInfo(null);
        setTimeLeft(timeLimit);
      }
    };

    const handleStatus = (status: string) => {
      if (status === 'connected') {
        const opp = multiplayer.getOpponent();
        if (opp?.name) setOpponentName(opp.name);
        setIsWaitingForFriend(false);
        setIsOnlineMode(true);
        resetGame();
        soundManager.playGameLaunch();
      } else if (status === 'disconnected') {
        alert('Đối thủ đã rời bàn đấu!');
        setIsOnlineMode(false);
        setIsWaitingForFriend(false);
        setOnlineRoom(null);
      }
    };

    multiplayer.onMove(handleOpponentMove);
    multiplayer.onStatusChange(handleStatus);

    return () => {
      multiplayer.offMove(handleOpponentMove);
      multiplayer.offStatusChange(handleStatus);
    };
  }, [isOnlineMode, isWaitingForFriend, boardSize, winStreak, timeLimit, checkWinner]);

  // Rời phòng khi component unmount
  useEffect(() => {
    return () => {
      if (isOnlineMode) {
        multiplayer.leaveRoom();
      }
    };
  }, [isOnlineMode]);

  // Đồng bộ cài đặt thời gian thực với GameSettingsModal
  useEffect(() => {
    const handleSetting = (e: any) => {
      if (e.detail?.gameId === 'caro') {
        if (e.detail.key === 'mode') setIsAiMode(e.detail.value === 'ai');
        if (e.detail.key === 'difficulty') setDifficulty(e.detail.value as Difficulty);
        if (e.detail.key === 'boardSize') {
          const newSize = Number(e.detail.value) as 10 | 3;
          setBoardSize(newSize);
          setBoard(Array(newSize === 10 ? 100 : 9).fill(null));
          setIsXNext(true);
          setWinnerInfo(null);
          setTimeLeft(timeLimit);
        }
        if (e.detail.key === 'timeLimit') {
          const newLimit = Number(e.detail.value);
          setTimeLimit(newLimit);
          setTimeLeft(newLimit);
        }
      }
    };
    window.addEventListener('ace-game-setting-changed', handleSetting);
    return () => window.removeEventListener('ace-game-setting-changed', handleSetting);
  }, [timeLimit]);

  // Bộ đếm thời gian suy nghĩ cho mỗi lượt Cờ Caro
  useEffect(() => {
    if (timeLimit <= 0) return;
    if (winnerInfo) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const winner: Player = isXNext ? 'O' : 'X';
          const result = { winner, line: [] };
          setWinnerInfo(result);
          updateStats(winner);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, winnerInfo, isXNext]);

  const [stats, setStats] = useState<{ win: number; loss: number; draw: number }>(() => {
    const saved = localStorage.getItem('acegames_caro_stats');
    return saved ? JSON.parse(saved) : { win: 0, loss: 0, draw: 0 };
  });

  const resetGame = useCallback(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
    setTimeLeft(timeLimit);
    if (isOnlineMode) {
      multiplayer.sendAction('game_restart');
    }
  }, [boardSize, timeLimit, isOnlineMode]);

  // Handle board size switch
  const handleSizeChange = (newSize: 10 | 3) => {
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
    setTimeLeft(timeLimit);
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
    if (board[index] || winnerInfo || (timeLimit > 0 && timeLeft === 0)) return;

    if (!isOnlineMode && isAiMode && !isXNext) return;
    if (isOnlineMode) {
      if (isWaitingForFriend) return;
      const isMyTurn = (playerRole === 'host' && isXNext) || (playerRole === 'guest' && !isXNext);
      if (!isMyTurn) return;
    }

    soundManager.playButtonClick();

    const myPiece: Player = isOnlineMode 
      ? (playerRole === 'host' ? 'X' : 'O') 
      : (isXNext ? 'X' : 'O');

    const newBoard = [...board];
    newBoard[index] = myPiece;
    setBoard(newBoard);
    setTimeLeft(timeLimit);

    if (isOnlineMode) {
      multiplayer.sendMove({ index, piece: myPiece });
    }

    const result = checkWinner(newBoard, boardSize, winStreak);
    if (result) {
      setWinnerInfo(result);
      updateStats(result.winner);
      return;
    }

    setIsXNext(!isXNext);
  };

  // AI / Online Bot Turn effect
  useEffect(() => {
    const isBotTurn = (isOnlineMode && multiplayer.isBotMatch() && ((playerRole === 'host' && !isXNext) || (playerRole === 'guest' && isXNext))) || (!isOnlineMode && isAiMode && !isXNext);

    if (isBotTurn && !winnerInfo) {
      const timer = setTimeout(() => {
        const aiMove = findBestMove(board);
        if (aiMove !== -1) {
          soundManager.playButtonClick();
          const botPiece: Player = isOnlineMode ? (playerRole === 'host' ? 'O' : 'X') : 'O';
          const newBoard = [...board];
          newBoard[aiMove] = botPiece;
          setBoard(newBoard);
          setTimeLeft(timeLimit);

          const result = checkWinner(newBoard, boardSize, winStreak);
          if (result) {
            setWinnerInfo(result);
            updateStats(result.winner);
          } else {
            setIsXNext(botPiece === 'X' ? false : true);
          }
        }
      }, Math.floor(700 + Math.random() * 800));

      return () => clearTimeout(timer);
    }
  }, [isOnlineMode, isAiMode, isXNext, winnerInfo, board, findBestMove, boardSize, winStreak, timeLimit, playerRole]);

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
        {/* VÙNG 2: TRẠNG THÁI & ĐỒNG HỒ (To rõ, ngắn gọn, thẩm mỹ, animated) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Huy hiệu lượt đi / Kết quả */}
          {winnerInfo ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {winnerInfo.winner === 'DRAW' ? '🤝 VÁN CỜ HÒA!' : `🏆 CHIẾN THẮNG: ${winnerInfo.winner}!`}
            </div>
          ) : isWaitingForFriend ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>⏳ ĐANG CHỜ ĐỐI THỦ VÀO BÀN...</span>
            </div>
          ) : isOnlineMode ? (
            ((playerRole === 'host' && isXNext) || (playerRole === 'guest' && !isXNext)) ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
                <span>👉 LƯỢT CỦA BẠN ({playerRole === 'host' ? 'X' : 'O'})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-cyan-300 font-bold text-xs sm:text-sm animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>⏳ ĐỐI THỦ ({opponentName}) ĐANG NGHĨ...</span>
              </div>
            )
          ) : (
            isXNext ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-black text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                <span>LƯỢT ĐI: X (BẠN)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-spin" />
                <span>⚡ MÁY ĐANG TÍNH...</span>
              </div>
            )
          )}

          {/* Cột Tỷ số */}
          <div className="flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/5">
            <span className="text-emerald-400 px-1 rounded bg-emerald-500/10">W:{stats.win}</span>
            <span className="text-gray-400 px-1 rounded bg-slate-800">D:{stats.draw}</span>
            <span className="text-rose-400 px-1 rounded bg-rose-500/10">L:{stats.loss}</span>
          </div>

          {/* Đồng hồ đếm ngược to rõ */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-300 font-mono text-xs sm:text-sm font-black shadow-inner">
            <Timer className={`w-3.5 h-3.5 ${timeLimit > 0 && timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-purple-400'}`} />
            <span className={timeLeft <= 10 && timeLimit > 0 ? 'text-rose-400 animate-pulse drop-shadow-[0_0_8px_#f43f5e]' : ''}>
              {timeLimit === 0 ? '∞' : `${timeLeft}s`}
            </span>
          </div>
        </div>

        {/* VÙNG 3: CỤM ĐIỀU KHIỂN (Đã xóa "Cùng Máy", to rõ, tinh gọn, không rối) */}
        <div className="flex items-center gap-2">
          {/* Nút Chọn Bàn Cờ 10x10 hoặc 3x3 */}
          {!isOnlineMode && (
            <button
              onClick={() => handleSizeChange(boardSize === 10 ? 3 : 10)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-white/5 transition cursor-pointer"
              title={boardSize === 10 ? 'Bàn 10x10 (5 ô thắng). Bấm đổi 3x3' : 'Bàn 3x3 (3 ô thắng). Bấm đổi 10x10'}
            >
              {boardSize === 10 ? <Grid className="w-4 h-4 text-cyan-400" /> : <Grid3X3 className="w-4 h-4 text-amber-400" />}
              <span>{boardSize === 10 ? 'Bàn 10x10' : 'Bàn 3x3'}</span>
            </button>
          )}

          {isOnlineMode || isWaitingForFriend ? (
            /* Khi đang trong trận Online: Bấm vào tên phòng là copy ngay, không rườm rà */
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-black text-xs transition cursor-pointer active:scale-95 shadow-sm"
                title="Bấm để sao chép link mời"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span>{copiedInvite ? '✓ ĐÃ COPY!' : `PHÒNG: ${onlineRoom?.roomId || ''}`}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 shadow-sm transition cursor-pointer active:scale-95"
                title="Rời khỏi phòng đấu"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Rời Bàn</span>
              </button>
            </div>
          ) : (
            /* Khi chơi bình thường (Đấu Máy) */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-cyan-300 font-bold text-xs">
                  <Bot size={15} className="text-cyan-400" />
                  <span>Đấu Máy:</span>
                </div>
                <select
                  value={difficulty}
                  onChange={e => {
                    setDifficulty(e.target.value as Difficulty);
                    resetGame();
                  }}
                  className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-cyan-500/40"
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Vừa</option>
                  <option value="UNBEATABLE">Khó (AI)</option>
                </select>
              </div>

              <button
                onClick={() => setIsLobbyOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer active:scale-95 shadow-sm"
                title="Tạo phòng mời bạn bè hoặc chơi online qua mạng"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Chơi Online</span>
              </button>
            </div>
          )}

          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
            title="Ván mới"
          >
            <RotateCcw size={16} />
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
              const isTurnDisabled = isOnlineMode
                ? (playerRole === 'host' ? !isXNext : isXNext)
                : (isAiMode && !isXNext);

              return (
                <button
                  key={idx}
                  onClick={() => handleClick(idx)}
                  disabled={cell !== null || isTurnDisabled || winnerInfo !== null}
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

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        gameId="caro"
        gameTitle="Cờ Caro"
        onJoinedMatch={(room, role) => {
          setIsOnlineMode(true);
          setIsWaitingForFriend(false);
          setOnlineRoom(room);
          setPlayerRole(role);
          const oppName = room.options?.isBot ? (room.options.botName || 'Kỳ Thủ') : (role === 'host' ? 'Đối thủ' : room.hostName);
          setOpponentName(oppName);
          setBoard(Array(boardSize * boardSize).fill(null));
          setIsXNext(true);
          setWinnerInfo(null);
          setTimeLeft(timeLimit);
        }}
        onWaitingInBackground={(room) => {
          setIsWaitingForFriend(true);
          setIsOnlineMode(true);
          setOnlineRoom(room);
          setPlayerRole('host');
        }}
      />
    </div>
  );
};
