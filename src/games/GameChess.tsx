import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChessPosition, type ChessMove, WHITE, BLACK, colorOf, typeOf, ROOK, KNIGHT, BISHOP, QUEEN, KING, PAWN } from './chess/chess-engine';
import { findBestChessMove } from './chess/chess-ai';
import { RotateCcw, Bot, Users, Timer, Globe, Copy, Check, LogOut } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';
import { multiplayer, type RoomInfo } from '../utils/multiplayer';

const PIECE_SYMBOLS: Record<number, Record<number, string>> = {
  [WHITE]: {
    [KING]: '♔',
    [QUEEN]: '♕',
    [ROOK]: '♖',
    [BISHOP]: '♗',
    [KNIGHT]: '♘',
    [PAWN]: '♙',
  },
  [BLACK]: {
    [KING]: '♚',
    [QUEEN]: '♛',
    [ROOK]: '♜',
    [BISHOP]: '♝',
    [KNIGHT]: '♞',
    [PAWN]: '♟',
  },
};

export const GameChess: React.FC = () => {
  const [pos, setPos] = useState<ChessPosition>(() => ChessPosition.fromFen());
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
  const [mode, setMode] = useState<'ai' | 'pvp'>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_chess');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.mode) return parsed.mode;
      }
    } catch {}
    return 'ai';
  });
  const [aiLevel, setAiLevel] = useState<1 | 2 | 3>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_chess');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.aiLevel) return Number(parsed.aiLevel) as 1 | 2 | 3;
      }
    } catch {}
    return 2;
  });
  const [timeLimit, setTimeLimit] = useState<number>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_chess');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.timeLimit !== undefined) return Number(parsed.timeLimit);
      }
    } catch {}
    return 60; // 60s mặc định
  });
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isThinking, setIsThinking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Lượt đi: Trắng');

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
    const url = `${window.location.origin}${window.location.pathname}?game=chess&room=${cleanId}`;
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

  // Đồng bộ cài đặt thời gian thực với GameSettingsModal
  useEffect(() => {
    const handleSetting = (e: any) => {
      if (e.detail?.gameId === 'chess') {
        if (e.detail.key === 'mode') setMode(e.detail.value);
        if (e.detail.key === 'aiLevel') setAiLevel(Number(e.detail.value) as 1 | 2 | 3);
        if (e.detail.key === 'timeLimit') {
          const newLimit = Number(e.detail.value);
          setTimeLimit(newLimit);
          setTimeLeft(newLimit);
        }
      }
    };
    window.addEventListener('ace-game-setting-changed', handleSetting);
    return () => window.removeEventListener('ace-game-setting-changed', handleSetting);
  }, []);

  // Bộ đếm thời gian suy nghĩ cho mỗi lượt cờ vua
  useEffect(() => {
    if (timeLimit <= 0) return;
    const outcome = pos.outcome();
    if (outcome.over) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const turnName = pos.turn === WHITE ? 'Trắng' : 'Đen';
          setStatusMessage(`⏱️ Hết giờ suy nghĩ! Bên ${turnName} bị xử thua.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, pos, pos.turn]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, duration: number = 0.1) => {
    if (!soundManager.isSoundOn()) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const updateStatus = useCallback((currentPos: ChessPosition) => {
    const outcome = currentPos.outcome();
    if (outcome.over) {
      if (outcome.winner === WHITE) setStatusMessage('🏆 Chiếu bí! Quân Trắng Thắng!');
      else if (outcome.winner === BLACK) setStatusMessage('🏆 Chiếu bí! Quân Đen Thắng!');
      else setStatusMessage('🤝 Ván cờ hòa!');
    } else {
      const inCheck = currentPos.inCheck();
      const turnStr = currentPos.turn === WHITE ? 'Trắng' : 'Đen';
      setStatusMessage(inCheck ? `⚠️ ${turnStr} đang bị CHIẾU!` : `Lượt đi: ${turnStr}`);
    }
  }, []);

  const resetGame = () => {
    const newPos = ChessPosition.fromFen();
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    updateStatus(newPos);
    setTimeLeft(timeLimit);
    if (isOnlineMode) {
      multiplayer.sendAction('game_restart');
    }
  };

  const handleSquareClick = (sq: number) => {
    if (isThinking) return;
    const outcome = pos.outcome();
    if (outcome.over || (timeLimit > 0 && timeLeft === 0)) return;

    if (!isOnlineMode && mode === 'ai' && pos.turn === BLACK) return;

    if (isOnlineMode) {
      const isMyTurn = (playerRole === 'host' && pos.turn === WHITE) || (playerRole === 'guest' && pos.turn === BLACK);
      if (!isMyTurn) return;
    }

    const piece = pos.board[sq];

    // If already selected, check if clicked square is a valid target move
    if (selectedSq !== null) {
      const move = validMoves.find(m => m.to === sq);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select piece of current turn's color
    if (piece && colorOf(piece) === pos.turn) {
      setSelectedSq(sq);
      const moves = pos.legalMoves().filter(m => m.from === sq);
      setValidMoves(moves);
      playTone(400, 0.04);
    } else {
      setSelectedSq(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: ChessMove, isRemote: boolean = false) => {
    const isCapture = Boolean(pos.board[move.to]);
    const nextPos = pos.clone();
    nextPos.makeMove(move);
    setPos(nextPos);
    setLastMove(move);
    setSelectedSq(null);
    setValidMoves([]);
    updateStatus(nextPos);
    setTimeLeft(timeLimit);

    if (isCapture) playTone(250, 0.12);
    else playTone(500, 0.06);

    if (!isRemote && isOnlineMode) {
      multiplayer.sendMove(move);
    }

    // AI / Online Bot Turn trigger
    const isBotTurn = (isOnlineMode && multiplayer.isBotMatch() && ((playerRole === 'host' && nextPos.turn === BLACK) || (playerRole === 'guest' && nextPos.turn === WHITE))) || (!isOnlineMode && mode === 'ai' && nextPos.turn === BLACK);

    if (isBotTurn && !nextPos.outcome().over) {
      setIsThinking(true);
      setTimeout(() => {
        const levelStr = aiLevel === 1 ? 'easy' : aiLevel === 3 ? 'hard' : 'medium';
        const aiMove = findBestChessMove(nextPos, levelStr);
        if (aiMove) {
          executeMove(aiMove, true);
        }
        setIsThinking(false);
      }, Math.floor(900 + Math.random() * 800));
    }
  };

  // Tự động vào phòng nếu có tham số URL ?game=chess&room=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      multiplayer.joinRoom('chess', roomParam).then((ok) => {
        if (ok) {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            setIsOnlineMode(true);
            setIsWaitingForFriend(false);
            setOnlineRoom(room);
            setPlayerRole('guest');
            const newPos = ChessPosition.fromFen();
            setPos(newPos);
            setSelectedSq(null);
            setValidMoves([]);
            setLastMove(null);
            setIsThinking(false);
            updateStatus(newPos);
            setTimeLeft(timeLimit);
          }
        }
      });
    }
  }, [timeLimit, updateStatus]);

  // Nhận nước đi và hành động từ đối thủ online
  useEffect(() => {
    if (!isOnlineMode && !isWaitingForFriend) return;

    const handleOpponentMove = (data: any) => {
      if (data.type === 'game_move' && data.payload) {
        executeMove(data.payload as ChessMove, true);
      } else if (data.type === 'game_restart') {
        const newPos = ChessPosition.fromFen();
        setPos(newPos);
        setSelectedSq(null);
        setValidMoves([]);
        setLastMove(null);
        setIsThinking(false);
        updateStatus(newPos);
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
        alert('Đối thủ đã rời ván cờ!');
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
  }, [isOnlineMode, isWaitingForFriend, timeLimit, updateStatus]);

  useEffect(() => {
    return () => {
      if (isOnlineMode) multiplayer.leaveRoom();
    };
  }, [isOnlineMode]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px như màn hình mặc định */}
      <div className="game-top-hud flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 shadow-inner flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              TRẠNG THÁI
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isOnlineMode ? (
                <span className="font-bold text-xs sm:text-sm leading-none flex items-center gap-1.5">
                  {((playerRole === 'host' && pos.turn === WHITE) || (playerRole === 'guest' && pos.turn === BLACK)) ? (
                    <span className="text-emerald-400 font-black animate-pulse">
                      👉 Lượt của BẠN ({playerRole === 'host' ? 'Trắng' : 'Đen'})
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Chờ {opponentName} ({playerRole === 'host' ? 'Đen' : 'Trắng'})...
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <span className="font-black text-amber-400 font-mono text-xs sm:text-sm leading-none">{statusMessage}</span>
                  {isThinking && (
                    <span className="text-[11px] text-cyan-400 animate-pulse font-bold leading-none">
                      (AI đang tính...)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="h-7 w-px bg-white/10" />

          {/* Cột Thời Gian Chờ Suy Nghĩ */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              THỜI GIAN
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Timer className={`w-3.5 h-3.5 ${timeLimit > 0 && timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`} />
              <span className={`font-mono text-xs sm:text-sm font-black ${
                timeLimit === 0 
                  ? 'text-gray-400' 
                  : timeLeft <= 10 
                    ? 'text-rose-400 animate-pulse' 
                    : 'text-purple-300'
              }`}>
                {timeLimit === 0 ? 'Vô hạn' : `${timeLeft}s`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isWaitingForFriend ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Đang đợi bạn vào ({onlineRoom?.roomId})...</span>
              <button
                onClick={handleCopyInvite}
                className="px-2 py-0.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-bold border border-amber-500/40 transition cursor-pointer"
              >
                {copiedInvite ? '✓ Đã chép' : 'Copy link'}
              </button>
              <button
                onClick={handleLeaveRoom}
                className="text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer ml-1"
              >
                ✕ Hủy
              </button>
            </div>
          ) : isOnlineMode ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                {onlineRoom?.roomId}
              </span>
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                title="Sao chép link mời bạn bè"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span className="hidden sm:inline">{copiedInvite ? 'Đã chép' : 'Mời'}</span>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
                title="Rời bàn đấu online"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rời</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-white/10">
              {/* Đấu Máy */}
              <button
                onClick={() => {
                  setMode('ai');
                  resetGame();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  mode === 'ai'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Đấu với máy tính (AI)"
              >
                <Bot size={14} className={mode === 'ai' ? 'text-cyan-400' : 'text-gray-400'} />
                <span>Đấu Máy</span>
              </button>

              {mode === 'ai' && (
                <select
                  value={aiLevel}
                  onChange={e => setAiLevel(Number(e.target.value) as 1 | 2 | 3)}
                  className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                >
                  <option value={1}>Dễ</option>
                  <option value={2}>Vừa</option>
                  <option value={3}>Khó</option>
                </select>
              )}

              {/* 2 Người Chung Màn Hình */}
              <button
                onClick={() => {
                  setMode('pvp');
                  resetGame();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  mode === 'pvp'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Hai người ngồi cạnh nhau chơi chung trên màn hình này (Không cần mạng)"
              >
                <Users size={14} className={mode === 'pvp' ? 'text-emerald-400' : 'text-gray-400'} />
                <span>Chung Màn Hình</span>
              </button>

              {/* Đấu Online Qua Mạng */}
              <button
                onClick={() => setIsLobbyOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer active:scale-95"
                title="Tạo link mời bạn bè hoặc chơi qua mạng giữa 2 máy"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Đấu Online</span>
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

      {/* Massive 16:9 Widescreen Theater Arena - Vùng 1 CHỈ hiển thị game to rõ, không để thẻ người và máy */}
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#1c1208] via-[#0f0904] to-[#050301] rounded-3xl border-4 border-amber-600/50 shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex items-center justify-center p-3 sm:p-5 md:p-6 flex-shrink min-h-0">
        
        {/* Center: Massive 8x8 Chessboard taking full vertical height to rõ ở Vùng 1 */}
        <div className="game-board-inner relative bg-[#0c0804] p-2.5 sm:p-4 rounded-3xl h-full aspect-square max-h-[calc(100dvh-260px)] border-4 border-amber-600/60 shadow-2xl flex items-center justify-center">
          <div className="grid grid-cols-8 grid-rows-8 rounded-2xl overflow-hidden border-2 border-slate-950 shadow-inner w-full h-full">
            {Array.from({ length: 64 }).map((_, idx) => {
              const row = Math.floor(idx / 8);
              const col = idx % 8;
              const sq = (7 - row) * 8 + col;
              const piece = pos.board[sq];
              const isLight = (row + col) % 2 === 0;
              const isSelected = selectedSq === sq;
              const isTarget = validMoves.some(m => m.to === sq);
              const isLastFrom = lastMove?.from === sq;
              const isLastTo = lastMove?.to === sq;

              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              if (isSelected) bgColor = '#facc15';
              else if (isLastFrom || isLastTo) bgColor = isLight ? '#ced887' : '#aaa23a';

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className="relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Target move dot indicator */}
                  {isTarget && (
                    <div className={`absolute z-10 rounded-full ${piece ? 'w-full h-full border-3 border-emerald-500/90 bg-emerald-500/25' : 'w-3 h-3 sm:w-5 sm:h-5 bg-emerald-600/80 shadow-md'}`} />
                  )}

                  {/* Massive Chess piece icon */}
                  {piece && (
                    <span
                      className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-none transition-transform active:scale-90 ${colorOf(piece) === WHITE ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]' : 'text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'}`}
                    >
                      {PIECE_SYMBOLS[colorOf(piece)]?.[typeOf(piece)] || ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Game Over / Result Overlay */}
          {pos.outcome().over && (
            <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
              <span className="text-6xl mb-3 animate-bounce">
                {pos.outcome().winner ? '🏆' : '🤝'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-2 font-['Orbitron']">
                {pos.outcome().winner === WHITE
                  ? (mode === 'ai' ? 'BẠN ĐÃ THẮNG!' : 'QUÂN TRẮNG THẮNG!')
                  : pos.outcome().winner === BLACK
                  ? (mode === 'ai' ? 'AI ĐÃ THẮNG!' : 'QUÂN ĐEN THẮNG!')
                  : 'VÁN CỜ HÒA!'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 mb-6 font-medium">
                {statusMessage}
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl shadow-xl transition active:scale-95 cursor-pointer text-sm flex items-center gap-2"
              >
                <RotateCcw size={16} /> Chơi Ván Mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        gameId="chess"
        gameTitle="Cờ Vua"
        onJoinedMatch={(room, role) => {
          setIsOnlineMode(true);
          setIsWaitingForFriend(false);
          setOnlineRoom(room);
          setPlayerRole(role);
          const oppName = room.options?.isBot ? (room.options.botName || 'Kỳ Thủ') : (role === 'host' ? 'Đối thủ' : room.hostName);
          setOpponentName(oppName);
          const newPos = ChessPosition.fromFen();
          setPos(newPos);
          setSelectedSq(null);
          setValidMoves([]);
          setLastMove(null);
          setIsThinking(false);
          updateStatus(newPos);
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
