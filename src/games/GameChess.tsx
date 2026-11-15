import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChessPosition, type ChessMove, type Color, WHITE, BLACK, colorOf, typeOf, ROOK, KNIGHT, BISHOP, QUEEN, KING, PAWN } from './chess/chess-engine';
import { findBestChessMove } from './chess/chess-ai';
import { RotateCcw, Bot, Timer, Globe, LogOut } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';
import { OpponentLeftModal } from '../components/OpponentLeftModal';
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
  const posRef = useRef<ChessPosition>(pos);
  posRef.current = pos;
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: number; to: number } | null>(null);
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
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
  const [opponentName, setOpponentName] = useState<string>('ĐỐI THỦ');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [isOpponentLeftModalOpen, setIsOpponentLeftModalOpen] = useState<boolean>(false);
  const [checkBanner, setCheckBanner] = useState<string | null>(null);
  const [timeoutOutcome, setTimeoutOutcome] = useState<{
    loser: Color;
    winner: Color;
    isTimeout: boolean;
  } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCheckBanner = useCallback((text: string) => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setCheckBanner(text);
    bannerTimerRef.current = setTimeout(() => {
      setCheckBanner(null);
    }, 1600);
  }, []);

  // Quản lý timeout AI để hủy ngay lập tức khi đổi phòng, chơi lại hoặc rời bàn cờ
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAiTimeout = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setIsThinking(false);
  }, []);

  // Hủy timeout khi unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Khi chơi Online với vai trò Đen (guest), xoay bàn cờ để quân Đen nằm ở dưới cho dễ thao tác
  const isFlipped = isOnlineMode && playerRole === 'guest';

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
    clearAiTimeout();
    multiplayer.leaveRoom();
    setIsOnlineMode(false);
    setIsWaitingForFriend(false);
    setOnlineRoom(null);
    setPlayerRole('host');
    setOpponentName('ĐỐI THỦ');
    const newPos = ChessPosition.fromFen();
    posRef.current = newPos;
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setPendingPromotion(null);
    setLastMove(null);
    setIsThinking(false);
    setTimeoutOutcome(null);
    updateStatus(newPos);
    setTimeLeft(timeLimit);
  };

  // Đồng bộ cài đặt thời gian thực với GameSettingsModal
  useEffect(() => {
    const handleSetting = (e: any) => {
      if (e.detail?.gameId === 'chess') {
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
    if (timeLimit <= 0 || isWaitingForFriend) return;
    const outcome = pos.outcome();
    if (outcome.over || timeoutOutcome !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const currentTurn = pos.turn;
          const loserColor = currentTurn;
          const winnerColor = currentTurn === WHITE ? BLACK : WHITE;
          setTimeoutOutcome({
            loser: loserColor,
            winner: winnerColor,
            isTimeout: true,
          });

          const isMeLoser = (isOnlineMode && ((playerRole === 'host' && loserColor === WHITE) || (playerRole === 'guest' && loserColor === BLACK))) || (!isOnlineMode && loserColor === WHITE);
          if (isMeLoser) {
            soundManager.playDefeat();
          } else {
            soundManager.playVictory();
          }

          if (isOnlineMode && !isWaitingForFriend) {
            multiplayer.sendAction('timeout', { loser: loserColor, winner: winnerColor });
          }

          const turnName = currentTurn === WHITE ? 'Trắng' : 'Đen';
          setStatusMessage(`⏱️ Hết giờ suy nghĩ! Bên ${turnName} bị xử thua.`);
          return 0;
        }
        if (prev <= 11) {
          soundManager.playLowTime();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimit, pos, pos.turn, timeoutOutcome, isOnlineMode, playerRole, isWaitingForFriend]);

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

  const resetGame = useCallback((notifyRemote: boolean | React.MouseEvent = true) => {
    clearAiTimeout();
    const shouldNotify = typeof notifyRemote === 'boolean' ? notifyRemote : true;
    const newPos = ChessPosition.fromFen();
    posRef.current = newPos;
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setPendingPromotion(null);
    setLastMove(null);
    setIsThinking(false);
    setTimeoutOutcome(null);
    updateStatus(newPos);
    setTimeLeft(timeLimit);
    if (shouldNotify && isOnlineMode && !isWaitingForFriend) {
      multiplayer.sendAction('game_restart');
    }
  }, [clearAiTimeout, timeLimit, isOnlineMode, isWaitingForFriend, updateStatus]);

  const executeMove = useCallback((move: ChessMove, isRemote: boolean = false) => {
    const currentPos = posRef.current;
    const isCapture = Boolean(currentPos.board[move.to]);
    const nextPos = currentPos.clone();
    nextPos.makeMove(move);
    
    posRef.current = nextPos;
    setPos(nextPos);
    setLastMove(move);
    setSelectedSq(null);
    setValidMoves([]);
    updateStatus(nextPos);
    setTimeLeft(timeLimit);

    const outcome = nextPos.outcome();
    const inCheck = nextPos.inCheck();

    if (outcome.over) {
      const isWinner = (isOnlineMode && ((playerRole === 'host' && outcome.winner === WHITE) || (playerRole === 'guest' && outcome.winner === BLACK))) || (!isOnlineMode && outcome.winner === WHITE);
      const isLoser = (isOnlineMode && ((playerRole === 'host' && outcome.winner === BLACK) || (playerRole === 'guest' && outcome.winner === WHITE))) || (!isOnlineMode && outcome.winner === BLACK);
      if (isWinner) soundManager.playVictory();
      else if (isLoser) soundManager.playDefeat();
      else soundManager.playDraw();
    } else if (inCheck) {
      soundManager.playCheck();
      const isMeInCheck = (isOnlineMode && ((playerRole === 'host' && nextPos.turn === WHITE) || (playerRole === 'guest' && nextPos.turn === BLACK))) || (!isOnlineMode && nextPos.turn === WHITE);
      triggerCheckBanner(isMeInCheck ? 'BẠN ĐANG BỊ CHIẾU VUA!' : 'CHIẾU VUA!');
    } else if (isCapture) {
      soundManager.playChessCapture();
    } else {
      soundManager.playChessMove();
    }

    if (!isRemote && isOnlineMode) {
      multiplayer.sendMove(move);
    }
  }, [isOnlineMode, playerRole, timeLimit, triggerCheckBanner, updateStatus]);

  // Tự động kích hoạt nước đi của máy (AI) khi chơi offline
  useEffect(() => {
    if (isOnlineMode || isWaitingForFriend) return;
    if (pos.turn !== BLACK) return;
    if (pos.outcome().over) return;

    setIsThinking(true);
    const timer = setTimeout(() => {
      if (posRef.current.turn === BLACK) {
        const levelStr = aiLevel === 1 ? 'easy' : aiLevel === 3 ? 'hard' : 'medium';
        const aiMove = findBestChessMove(posRef.current, levelStr);
        if (aiMove) {
          executeMove(aiMove, true);
        }
      }
      setIsThinking(false);
    }, Math.floor(500 + Math.random() * 400));

    return () => {
      clearTimeout(timer);
      setIsThinking(false);
    };
  }, [pos, isOnlineMode, isWaitingForFriend, aiLevel, executeMove]);

  const handleSquareClick = (sq: number) => {
    if (isThinking) return;
    const currentPos = posRef.current;
    const outcome = currentPos.outcome();
    if (outcome.over || (timeLimit > 0 && timeLeft === 0) || timeoutOutcome !== null) return;

    // Khi đang chờ bạn vào bàn, không cho phép bấm đi quân
    if (isWaitingForFriend) return;

    // Chơi với máy: Lượt quân Đen là của máy
    if (!isOnlineMode && currentPos.turn === BLACK) return;

    if (isOnlineMode) {
      const isMyTurn = (playerRole === 'host' && currentPos.turn === WHITE) || (playerRole === 'guest' && currentPos.turn === BLACK);
      if (!isMyTurn) return;
    }

    const piece = currentPos.board[sq];

    // If already selected, check if clicked square is a valid target move
    if (selectedSq !== null) {
      const promoMoves = validMoves.filter(m => m.to === sq && m.promo);
      if (promoMoves.length > 0) {
        setPendingPromotion({ from: selectedSq, to: sq });
        return;
      }
      const move = validMoves.find(m => m.to === sq);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select piece of current turn's color
    if (piece && colorOf(piece) === currentPos.turn) {
      setSelectedSq(sq);
      const moves = currentPos.legalMoves().filter(m => m.from === sq);
      setValidMoves(moves);
      playTone(400, 0.04);
    } else {
      setSelectedSq(null);
      setValidMoves([]);
    }
  };

  // Tự động vào phòng nếu có tham số URL ?game=chess&room=... (Chạy 1 lần duy nhất khi mở trang)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Xóa room khỏi URL ngay lập tức để không bị tự động re-join khi tạo phòng mới
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());

      multiplayer.joinRoom('chess', roomParam).then((ok) => {
        if (ok) {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            setIsOnlineMode(true);
            setIsWaitingForFriend(false);
            setOnlineRoom(room);
            setPlayerRole('guest');
            const opp = multiplayer.getOpponent();
            if (opp?.name) setOpponentName(opp.name);
            else if (room.hostName) setOpponentName(room.hostName);
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
  }, []);

  // Nhận nước đi và hành động từ đối thủ online
  useEffect(() => {
    if (!isOnlineMode && !isWaitingForFriend) return;

    const handleOpponentMove = (data: any) => {
      if (data.type === 'game_move' && data.payload) {
        if (data.senderName) setOpponentName(data.senderName);
        executeMove(data.payload as ChessMove, true);
      } else if (data.type === 'game_restart') {
        clearAiTimeout();
        const newPos = ChessPosition.fromFen();
        posRef.current = newPos;
        setPos(newPos);
        setSelectedSq(null);
        setValidMoves([]);
        setLastMove(null);
        setTimeoutOutcome(null);
        updateStatus(newPos);
        setTimeLeft(timeLimit);
      } else if (data.type === 'timeout' && data.payload) {
        setTimeoutOutcome({
          loser: data.payload.loser,
          winner: data.payload.winner,
          isTimeout: true,
        });
        const isMeLoser = (playerRole === 'host' && data.payload.loser === WHITE) || (playerRole === 'guest' && data.payload.loser === BLACK);
        if (isMeLoser) soundManager.playDefeat();
        else soundManager.playVictory();
      }
    };

    const handleStatus = (status: string) => {
      if (status === 'connected') {
        const opp = multiplayer.getOpponent();
        if (opp?.name) setOpponentName(opp.name);
        setIsWaitingForFriend(false);
        setIsOnlineMode(true);
        resetGame(false);
        soundManager.playGameLaunch();
      } else if (status === 'disconnected') {
        clearAiTimeout();
        const opp = multiplayer.getOpponent();
        if (opp?.name) setOpponentName(opp.name);
        setIsOpponentLeftModalOpen(true);
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
        
        {/* VÙNG 2: TRẠNG THÁI & ĐỒNG HỒ (To rõ, ngắn gọn, thẩm mỹ, animated) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Huy hiệu trạng thái / Lượt đi */}
          {isWaitingForFriend ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Timer className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="tracking-wide">CHỜ ĐỐI THỦ...</span>
            </div>
          ) : timeoutOutcome !== null ? (
            timeoutOutcome.loser === (isOnlineMode ? (playerRole === 'host' ? WHITE : BLACK) : WHITE) ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/25 border border-rose-500/70 text-rose-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                <span>⏱️ BẠN ĐÃ THUA (HẾT GIỜ)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-500/70 text-emerald-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <span>🏆 BẠN ĐÃ THẮNG (ĐỐI THỦ HẾT GIỜ)</span>
              </div>
            )
          ) : pos.outcome().over ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs sm:text-sm">
              {statusMessage}
            </div>
          ) : isOnlineMode ? (
            pos.inCheck() ? (
              ((playerRole === 'host' && pos.turn === WHITE) || (playerRole === 'guest' && pos.turn === BLACK)) ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/25 border border-rose-500/70 text-rose-300 font-black text-xs sm:text-sm animate-bounce shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                  <span>⚠️ BẠN ĐANG BỊ CHIẾU VUA!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/25 border border-amber-500/70 text-amber-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <span>⚔️ ĐANG CHIẾU VUA {opponentName.toUpperCase()}!</span>
                </div>
              )
            ) : ((playerRole === 'host' && pos.turn === WHITE) || (playerRole === 'guest' && pos.turn === BLACK)) ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span>LƯỢT CỦA BẠN</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-cyan-300 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span>LƯỢT CỦA {opponentName.toUpperCase()}</span>
              </div>
            )
          ) : (
            isThinking ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin" />
                <span>⚡ MÁY ĐANG TÍNH...</span>
              </div>
            ) : pos.inCheck() ? (
              pos.turn === WHITE ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/25 border border-rose-500/70 text-rose-300 font-black text-xs sm:text-sm animate-bounce shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                  <span>⚠️ BẠN ĐANG BỊ CHIẾU VUA!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/25 border border-amber-500/70 text-amber-300 font-black text-xs sm:text-sm animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <span>⚔️ ĐANG CHIẾU VUA MÁY!</span>
                </div>
              )
            ) : pos.turn === WHITE ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span>LƯỢT CỦA BẠN</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-cyan-300 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span>LƯỢT CỦA MÁY</span>
              </div>
            )
          )}

          {/* Đồng hồ đếm ngược to rõ (Chỉ hiển thị khi đang trong trận đấu) */}
          {!isWaitingForFriend && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-300 font-mono text-xs sm:text-sm font-black shadow-inner">
              <Timer className={`w-3.5 h-3.5 ${timeLimit > 0 && timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-purple-400'}`} />
              <span className={timeLeft <= 10 && timeLimit > 0 ? 'text-rose-400 animate-pulse drop-shadow-[0_0_8px_#f43f5e]' : ''}>
                {timeLimit === 0 ? '∞' : `${timeLeft}s`}
              </span>
            </div>
          )}
        </div>

        {/* VÙNG 3: CỤM ĐIỀU KHIỂN (Đã xóa "Cùng Máy", to rõ, tinh gọn, không rối) */}
        <div className="flex items-center gap-2">
          {isOnlineMode || isWaitingForFriend ? (
            /* Khi đang trong trận Online: Bấm vào tên phòng là copy ngay, không rườm rà */
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono font-black text-xs transition cursor-pointer active:scale-95 shadow-sm"
                title="Bấm để sao chép link mời"
              >
                {isOnlineMode && !isWaitingForFriend ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400/40" />
                )}
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
                  value={aiLevel}
                  onChange={e => setAiLevel(Number(e.target.value) as 1 | 2 | 3)}
                  className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-cyan-500/40"
                >
                  <option value={1}>Dễ</option>
                  <option value={2}>Vừa</option>
                  <option value={3}>Khó</option>
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

              <button
                onClick={resetGame}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
                title="Ván Mới"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena - Vùng 1 CHỈ hiển thị game to rõ, không để thẻ người và máy */}
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#1c1208] via-[#0f0904] to-[#050301] rounded-3xl border-4 border-amber-600/50 shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex items-center justify-center p-3 sm:p-5 md:p-6 flex-shrink min-h-0">
        
        {/* Center: Massive 8x8 Chessboard taking full vertical height to rõ ở Vùng 1 */}
        <div className="game-board-inner relative bg-[#0c0804] p-2.5 sm:p-4 rounded-3xl h-full aspect-square max-h-[calc(100dvh-260px)] border-4 border-amber-600/60 shadow-2xl flex items-center justify-center">
          <div className="grid grid-cols-8 grid-rows-8 rounded-2xl overflow-hidden border-2 border-slate-950 shadow-inner w-full h-full">
            {Array.from({ length: 64 }).map((_, idx) => {
              const screenRow = Math.floor(idx / 8);
              const screenCol = idx % 8;
              const rank = isFlipped ? screenRow : (7 - screenRow);
              const file = isFlipped ? (7 - screenCol) : screenCol;
              const sq = rank * 8 + file;
              const piece = pos.board[sq];
              const isLight = (rank + file) % 2 !== 0;
              const isSelected = selectedSq === sq;
              const isTarget = validMoves.some(m => m.to === sq);
              const isLastFrom = lastMove?.from === sq;
              const isLastTo = lastMove?.to === sq;
              const isKingInCheck = Boolean(piece && typeOf(piece) === KING && colorOf(piece) === pos.turn && pos.inCheck());

              let bgColor = isLight ? '#f0d9b5' : '#b58863';
              if (isKingInCheck) bgColor = '#f43f5e';
              else if (isSelected) bgColor = '#06b6d4';
              else if (isLastFrom || isLastTo) bgColor = isLight ? '#ced887' : '#aaa23a';

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative flex items-center justify-center cursor-pointer select-none transition-all duration-150 ${isSelected ? 'ring-4 ring-cyan-400 z-20 shadow-[0_0_25px_#06b6d4]' : isKingInCheck ? 'animate-pulse ring-4 ring-rose-400 z-20 shadow-[0_0_30px_#f43f5e]' : ''}`}
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Target move dot indicator */}
                  {isTarget && (
                    <div className={`absolute z-10 rounded-full ${piece ? 'w-full h-full border-3 border-emerald-500/90 bg-emerald-500/25' : 'w-3 h-3 sm:w-5 sm:h-5 bg-emerald-600/80 shadow-md'}`} />
                  )}

                  {/* Massive Chess piece icon */}
                  {piece ? (
                    <span
                      className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-none transition-transform active:scale-90 ${colorOf(piece) === WHITE ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]' : 'text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'} ${isKingInCheck ? 'drop-shadow-[0_0_15px_#fff]' : ''} ${isSelected ? 'scale-115 -translate-y-1.5 drop-shadow-[0_0_18px_#22d3ee]' : ''}`}
                    >
                      {PIECE_SYMBOLS[colorOf(piece)]?.[typeOf(piece)] || ''}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Modal Phong Cấp Tốt (Pawn Promotion) Chuẩn Luật Quốc Tế */}
          {pendingPromotion && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col items-center text-center max-w-xs w-full">
                <h4 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider mb-1 font-['Orbitron']">
                  Phong Cấp Cho Tốt
                </h4>
                <p className="text-xs text-gray-300 mb-4 font-medium">
                  Chọn quân cờ bạn muốn nâng cấp:
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[
                    { type: QUEEN, label: 'Hậu', desc: 'Mạnh nhất' },
                    { type: KNIGHT, label: 'Mã', desc: 'Nhảy góc' },
                    { type: ROOK, label: 'Xe', desc: 'Thẳng hàng' },
                    { type: BISHOP, label: 'Tượng', desc: 'Đường chéo' },
                  ].map(item => {
                    const myColor = pos.turn;
                    const symbol = PIECE_SYMBOLS[myColor]?.[item.type] || '';
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          soundManager.playButtonClick();
                          executeMove({
                            from: pendingPromotion.from,
                            to: pendingPromotion.to,
                            promo: item.type,
                          });
                          setPendingPromotion(null);
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/70 transition-all active:scale-95 cursor-pointer shadow-md group"
                      >
                        <span className="text-3xl sm:text-4xl leading-none mb-1 group-hover:scale-110 transition-transform drop-shadow">
                          {symbol}
                        </span>
                        <span className="text-xs font-black text-amber-200">{item.label}</span>
                        <span className="text-[10px] text-gray-400">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    soundManager.playButtonClick();
                    setPendingPromotion(null);
                    setSelectedSq(null);
                    setValidMoves([]);
                  }}
                  className="mt-4 text-xs text-gray-400 hover:text-white transition underline cursor-pointer"
                >
                  Hủy chọn nước đi
                </button>
              </div>
            </div>
          )}

          {/* Hiệu Ứng Chiếu Vua Nổi Bật (Splash Banner) */}
          {checkBanner && (
            <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center p-4 animate-in zoom-in-75 fade-in duration-200">
              <div className="px-5 py-3 sm:px-7 sm:py-4 rounded-3xl bg-rose-600/95 border-2 border-rose-300 text-white font-black text-lg sm:text-2xl tracking-widest shadow-[0_0_50px_rgba(244,63,94,0.95)] backdrop-blur-md flex items-center gap-3 animate-pulse">
                <span className="text-2xl sm:text-3xl">⚠️</span>
                <span className="font-['Orbitron'] font-black">{checkBanner}</span>
                <span className="text-2xl sm:text-3xl">⚔️</span>
              </div>
            </div>
          )}

          {/* Game Over / Result Overlay */}
          {(pos.outcome().over || timeoutOutcome !== null) && (() => {
            const outcome = pos.outcome();
            const isTimeout = timeoutOutcome !== null;
            const winner = isTimeout ? timeoutOutcome.winner : outcome.winner;

            const isWinner = (isOnlineMode && ((playerRole === 'host' && winner === WHITE) || (playerRole === 'guest' && winner === BLACK))) || (!isOnlineMode && winner === WHITE);
            const isLoser = (isOnlineMode && ((playerRole === 'host' && winner === BLACK) || (playerRole === 'guest' && winner === WHITE))) || (!isOnlineMode && winner === BLACK);

            const title = isWinner
              ? 'CHIẾN THẮNG!'
              : isLoser
              ? 'THẤT BẠI!'
              : 'VÁN CỜ HÒA!';

            const desc = isTimeout
              ? (isLoser 
                  ? 'Bạn đã hết thời gian suy nghĩ và bị xử thua.' 
                  : `${isOnlineMode ? (opponentName || 'Đối thủ') : 'Máy'} đã hết thời gian suy nghĩ và bị xử thua.`)
              : isWinner
              ? 'Chúc mừng! Bạn đã chiếu bí đối thủ xuất sắc.'
              : isLoser
              ? 'Bạn đã bị đối thủ chiếu bí.'
              : outcome.reason === 'repetition'
              ? 'Thế cờ lặp lại 3 lần liên tiếp.'
              : outcome.reason === 'fifty_move'
              ? 'Đã qua 50 nước cờ không bên nào ăn quân hay đẩy tốt.'
              : 'Ván cờ kết thúc bất phân thắng bại.';

            const titleColor = isWinner
              ? 'text-emerald-400'
              : isLoser
              ? 'text-rose-500'
              : 'text-amber-400';

            const icon = isWinner ? '🏆' : isLoser ? (isTimeout ? '⏱️' : '⚔️') : '🤝';

            const btnGradient = isWinner
              ? 'from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-950/50'
              : isLoser
              ? 'from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-950/50'
              : 'from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-amber-950/50 font-black';

            return (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-20 animate-in fade-in duration-200">
                <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-950/95 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center text-center">
                  <span className="text-5xl sm:text-6xl mb-3 drop-shadow-lg">
                    {icon}
                  </span>
                  <h3 className={`text-2xl sm:text-3xl font-black mb-2 tracking-wide font-['Orbitron'] ${titleColor}`}>
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mb-6 font-medium leading-relaxed">
                    {desc}
                  </p>
                  <button
                    onClick={resetGame}
                    className={`px-7 py-3 rounded-2xl font-black text-sm shadow-xl transition active:scale-95 cursor-pointer flex items-center gap-2 bg-gradient-to-r ${btnGradient}`}
                  >
                    <RotateCcw size={16} /> Chơi Ván Mới
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        gameId="chess"
        gameTitle="Cờ Vua"
        onJoinedMatch={(room, role) => {
          clearAiTimeout();
          setIsOnlineMode(true);
          setIsWaitingForFriend(false);
          setOnlineRoom(room);
          setPlayerRole(role);
          setOpponentName(role === 'guest' ? (room.hostName || 'ĐỐI THỦ') : 'ĐỐI THỦ');
          const newPos = ChessPosition.fromFen();
          posRef.current = newPos;
          setPos(newPos);
          setSelectedSq(null);
          setValidMoves([]);
          setLastMove(null);
          setIsThinking(false);
          updateStatus(newPos);
          setTimeLeft(timeLimit);
        }}
        onWaitingInBackground={(room) => {
          clearAiTimeout();
          setIsWaitingForFriend(true);
          setIsOnlineMode(true);
          setOnlineRoom(room);
          setPlayerRole('host');
          setOpponentName('ĐỐI THỦ');
          const newPos = ChessPosition.fromFen();
          posRef.current = newPos;
          setPos(newPos);
          setSelectedSq(null);
          setValidMoves([]);
          setLastMove(null);
          setIsThinking(false);
          updateStatus(newPos);
          setTimeLeft(timeLimit);
        }}
      />

      {/* Thông báo đối thủ rời phòng */}
      <OpponentLeftModal
        isOpen={isOpponentLeftModalOpen}
        opponentName={opponentName}
        onClose={() => setIsOpponentLeftModalOpen(false)}
        onFindNewMatch={() => setIsLobbyOpen(true)}
      />
    </div>
  );
};
