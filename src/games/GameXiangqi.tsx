import React, { useState, useCallback, useRef, useEffect } from 'react';
import { XiangqiPosition, type XiangqiMove, RED, BLACK, GENERAL, ADVISOR, ELEPHANT, HORSE, CHARIOT, CANNON, SOLDIER, typeOf, sideOf } from './xiangqi/xiangqi-engine';
import { findBestXiangqiMove } from './xiangqi/xiangqi-ai';
import { RotateCcw, Bot, Timer, Globe, LogOut } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { OnlineLobbyModal } from '../components/OnlineLobbyModal';
import { multiplayer, type RoomInfo } from '../utils/multiplayer';

const XIANGQI_PIECES: Record<number, Record<number, string>> = {
  [RED]: {
    [GENERAL]: '帥',
    [ADVISOR]: '仕',
    [ELEPHANT]: '相',
    [HORSE]: '傌',
    [CHARIOT]: '俥',
    [CANNON]: '炮',
    [SOLDIER]: '兵',
  },
  [BLACK]: {
    [GENERAL]: '將',
    [ADVISOR]: '士',
    [ELEPHANT]: '象',
    [HORSE]: '馬',
    [CHARIOT]: '車',
    [CANNON]: '砲',
    [SOLDIER]: '卒',
  },
};

export const GameXiangqi: React.FC = () => {
  const [pos, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen());
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<XiangqiMove[]>([]);
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null);
  const mode = 'ai'; // Chế độ chơi offline luôn là Đấu Máy (AI)
  const [aiLevel, setAiLevel] = useState<1 | 2 | 3>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_xiangqi');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.aiLevel) return Number(parsed.aiLevel) as 1 | 2 | 3;
      }
    } catch {}
    return 2;
  });
  const [timeLimit, setTimeLimit] = useState<number>(() => {
    try {
      const s = localStorage.getItem('ace_game_settings_xiangqi');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.timeLimit !== undefined) return Number(parsed.timeLimit);
      }
    } catch {}
    return 60; // 60 giây mặc định
  });
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isThinking, setIsThinking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Lượt đi: Đỏ (Đi trước)');

  // Trạng Thái Chơi Online Nhiều Người (Multiplayer)
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const [isWaitingForFriend, setIsWaitingForFriend] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);
  const [onlineRoom, setOnlineRoom] = useState<RoomInfo | null>(null);
  const [playerRole, setPlayerRole] = useState<'host' | 'guest'>('host');
  const [opponentName, setOpponentName] = useState<string>('Đối thủ');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  // Khi chơi Online với vai trò Đen (guest), xoay bàn cờ để quân Đen nằm ở dưới cho dễ thao tác
  const isFlipped = isOnlineMode && playerRole === 'guest';

  const handleCopyInvite = () => {
    if (!onlineRoom) return;
    soundManager.playButtonClick();
    const cleanId = multiplayer.normalizeRoomId(onlineRoom.roomId);
    const url = `${window.location.origin}${window.location.pathname}?game=xiangqi&room=${cleanId}`;
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
    setPlayerRole('host');
    const newPos = XiangqiPosition.fromFen();
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    updateStatus(newPos);
    setTimeLeft(timeLimit);
  };

  // Đồng bộ cài đặt thời gian thực với GameSettingsModal
  useEffect(() => {
    const handleSetting = (e: any) => {
      if (e.detail?.gameId === 'xiangqi') {
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

  // Bộ đếm thời gian suy nghĩ cho mỗi lượt
  useEffect(() => {
    if (timeLimit <= 0 || isWaitingForFriend) return;
    const outcome = pos.outcome();
    if (outcome.over) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const turnName = pos.turn === RED ? 'Đỏ' : 'Đen';
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

  const updateStatus = useCallback((currentPos: XiangqiPosition) => {
    const outcome = currentPos.outcome();
    if (outcome.over) {
      if (outcome.winner === RED) setStatusMessage('🏆 Chiếu bí! Cờ Đỏ Thắng!');
      else if (outcome.winner === BLACK) setStatusMessage('🏆 Chiếu bí! Cờ Đen Thắng!');
      else setStatusMessage('🤝 Ván cờ hòa!');
    } else {
      const inCheck = currentPos.inCheck();
      const turnStr = currentPos.turn === RED ? 'Đỏ' : 'Đen';
      setStatusMessage(inCheck ? `⚠️ ${turnStr} đang bị CHIẾU TƯỚNG!` : `Lượt đi: ${turnStr}`);
    }
  }, []);

  const resetGame = () => {
    const newPos = XiangqiPosition.fromFen();
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    updateStatus(newPos);
    setTimeLeft(timeLimit);
    if (isOnlineMode && !isWaitingForFriend) {
      multiplayer.sendAction('game_restart');
    }
  };

  const handleSquareClick = (sq: number) => {
    if (isThinking) return;
    const outcome = pos.outcome();
    if (outcome.over || (timeLimit > 0 && timeLeft === 0)) return;

    // Khi đang chờ bạn vào bàn, không cho phép bấm đi quân
    if (isWaitingForFriend) return;

    // Chơi với máy: Lượt quân Đen là của máy
    if (!isOnlineMode && pos.turn === BLACK) return;

    if (isOnlineMode) {
      const isMyTurn = (playerRole === 'host' && pos.turn === RED) || (playerRole === 'guest' && pos.turn === BLACK);
      if (!isMyTurn) return;
    }

    const piece = pos.board[sq];

    // If a piece is already selected, try to execute move to clicked square
    if (selectedSq !== null) {
      const move = validMoves.find(m => m.to === sq);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select piece of current turn
    if (piece && sideOf(piece) === pos.turn) {
      setSelectedSq(sq);
      const moves = pos.legalMoves().filter(m => m.from === sq);
      setValidMoves(moves);
      playTone(420, 0.04);
    } else {
      setSelectedSq(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: XiangqiMove, isRemote: boolean = false) => {
    const isCapture = Boolean(pos.board[move.to]);
    const nextPos = pos.clone();
    nextPos.makeMove(move);
    setPos(nextPos);
    setLastMove(move);
    setSelectedSq(null);
    setValidMoves([]);
    updateStatus(nextPos);
    setTimeLeft(timeLimit);

    if (isCapture) playTone(240, 0.12);
    else playTone(520, 0.06);

    if (!isRemote && isOnlineMode) {
      multiplayer.sendMove(move);
    }

    // AI Turn trigger (khi chơi với máy)
    const isBotTurn = !isOnlineMode && nextPos.turn === BLACK;

    if (isBotTurn && !nextPos.outcome().over) {
      setIsThinking(true);
      setTimeout(() => {
        const levelStr = aiLevel === 1 ? 'easy' : aiLevel === 3 ? 'hard' : 'medium';
        const aiMove = findBestXiangqiMove(nextPos, levelStr);
        if (aiMove) {
          executeMove(aiMove, true);
        }
        setIsThinking(false);
      }, Math.floor(700 + Math.random() * 600));
    }
  };

  // Tự động vào phòng nếu có tham số URL ?game=xiangqi&room=... (Chạy 1 lần duy nhất khi mở trang)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Xóa room khỏi URL ngay lập tức để không bị tự động re-join khi tạo phòng mới
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());

      multiplayer.joinRoom('xiangqi', roomParam).then((ok) => {
        if (ok) {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            setIsOnlineMode(true);
            setIsWaitingForFriend(false);
            setOnlineRoom(room);
            setPlayerRole('guest');
            const newPos = XiangqiPosition.fromFen();
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
        executeMove(data.payload as XiangqiMove, true);
      } else if (data.type === 'game_restart') {
        const newPos = XiangqiPosition.fromFen();
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
        alert('Đối thủ đã rời bàn cờ!');
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
          ) : isOnlineMode ? (
            ((playerRole === 'host' && pos.turn === RED) || (playerRole === 'guest' && pos.turn === BLACK)) ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span>LƯỢT CỦA BẠN</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-cyan-300 font-bold text-xs sm:text-sm">
                <span>ĐỐI THỦ ({opponentName}) ĐANG NGHĨ...</span>
              </div>
            )
          ) : (
            isThinking ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs sm:text-sm animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin" />
                <span>⚡ MÁY ĐANG TÍNH NƯỚC...</span>
              </div>
            ) : pos.outcome().over ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs sm:text-sm">
                {statusMessage}
              </div>
            ) : pos.inCheck() ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/25 border border-rose-500/60 text-rose-300 font-black text-xs sm:text-sm animate-bounce shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                <span>⚠️ ĐANG BỊ CHIẾU TƯỚNG!</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <span>LƯỢT CỦA BẠN</span>
              </div>
            )
          )}

          {/* Đồng hồ đếm ngược to rõ (Chỉ hiển thị khi đang trong trận đấu thực sự, không đếm khi đang chờ vào bàn) */}
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
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#1c0f06] via-[#120904] to-[#070301] rounded-3xl border-4 border-amber-900/60 shadow-[0_0_60px_rgba(180,83,9,0.25)] overflow-hidden flex items-center justify-center p-2.5 sm:p-4 md:p-5 flex-shrink min-h-0">
        
        {/* Center: Massive Xiangqi Board taking full vertical height to rõ ở Vùng 1 */}
        <div className="game-board-inner relative bg-[#2a1306] p-2.5 sm:p-4 rounded-3xl h-full aspect-[9/10] max-h-[calc(100dvh-260px)] border-4 border-[#5a2a0c] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center justify-center">
          {/* Bàn Cờ Gỗ Cổ Điển Tự Nhiên - Tinh Tế & Dịu Mắt */}
          <div 
            className="relative rounded-2xl shadow-inner overflow-hidden w-full h-full border-2 sm:border-3 border-[#421d06]"
            style={{
              background: 'radial-gradient(ellipse at center, #f5dfba 0%, #edd1a4 45%, #deb883 80%, #caa068 100%)',
              boxShadow: 'inset 0 0 50px rgba(92, 46, 11, 0.4), 0 4px 15px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Lớp Đồ Họa SVG Vẽ Đường Lưới Bàn Cờ Chuẩn 100% Cờ Tướng */}
            <svg viewBox="0 0 900 1000" className="absolute inset-0 w-full h-full pointer-events-none select-none">
              {/* Khung viền đôi bao quanh */}
              <rect x="40" y="40" width="820" height="920" rx="8" fill="none" stroke="#5c2e0b" strokeWidth="3" opacity="0.88" />
              <rect x="49" y="49" width="802" height="902" rx="4" fill="none" stroke="#5c2e0b" strokeWidth="1.6" opacity="0.82" />

              {/* 10 Đường Ngang */}
              {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map(y => (
                <line key={`h-${y}`} x1="50" y1={y} x2="850" y2={y} stroke="#5c2e0b" strokeWidth="2" opacity="0.85" />
              ))}

              {/* 2 Đường Dọc Ngoài Cùng (Chạy Suốt Qua Sông) */}
              <line x1="50" y1="50" x2="50" y2="950" stroke="#5c2e0b" strokeWidth="2" opacity="0.85" />
              <line x1="850" y1="50" x2="850" y2="950" stroke="#5c2e0b" strokeWidth="2" opacity="0.85" />

              {/* 7 Đường Dọc Bên Trong (Ngắt Quãng Ở Sông Sở Hà Hán Giới) */}
              {[150, 250, 350, 450, 550, 650, 750].map(x => (
                <g key={`v-${x}`}>
                  <line x1={x} y1="50" x2={x} y2="450" stroke="#5c2e0b" strokeWidth="2" opacity="0.85" />
                  <line x1={x} y1="550" x2={x} y2="950" stroke="#5c2e0b" strokeWidth="2" opacity="0.85" />
                </g>
              ))}

              {/* Đường Chéo Cung Tướng (Cửu Cung) Phía Đen */}
              <line x1="350" y1="50" x2="550" y2="250" stroke="#5c2e0b" strokeWidth="1.8" opacity="0.75" />
              <line x1="550" y1="50" x2="350" y2="250" stroke="#5c2e0b" strokeWidth="1.8" opacity="0.75" />

              {/* Đường Chéo Cung Tướng (Cửu Cung) Phía Đỏ */}
              <line x1="350" y1="750" x2="550" y2="950" stroke="#5c2e0b" strokeWidth="1.8" opacity="0.75" />
              <line x1="550" y1="750" x2="350" y2="950" stroke="#5c2e0b" strokeWidth="1.8" opacity="0.75" />

              {/* Dấu Chữ Thập Vị Trí Pháo và Tốt */}
              {[
                { cx: 150, cy: 250, l: true, r: true },
                { cx: 750, cy: 250, l: true, r: true },
                { cx: 150, cy: 750, l: true, r: true },
                { cx: 750, cy: 750, l: true, r: true },
                { cx: 50, cy: 350, l: false, r: true },
                { cx: 250, cy: 350, l: true, r: true },
                { cx: 450, cy: 350, l: true, r: true },
                { cx: 650, cy: 350, l: true, r: true },
                { cx: 850, cy: 350, l: true, r: false },
                { cx: 50, cy: 650, l: false, r: true },
                { cx: 250, cy: 650, l: true, r: true },
                { cx: 450, cy: 650, l: true, r: true },
                { cx: 650, cy: 650, l: true, r: true },
                { cx: 850, cy: 650, l: true, r: false },
              ].map(({ cx, cy, l, r }, i) => (
                <g key={`star-${i}`} stroke="#5c2e0b" strokeWidth="1.6" opacity="0.8" fill="none">
                  {l && (
                    <>
                      <path d={`M ${cx - 4} ${cy - 12} L ${cx - 4} ${cy - 4} L ${cx - 12} ${cy - 4}`} />
                      <path d={`M ${cx - 4} ${cy + 12} L ${cx - 4} ${cy + 4} L ${cx - 12} ${cy + 4}`} />
                    </>
                  )}
                  {r && (
                    <>
                      <path d={`M ${cx + 4} ${cy - 12} L ${cx + 4} ${cy - 4} L ${cx + 12} ${cy - 4}`} />
                      <path d={`M ${cx + 4} ${cy + 12} L ${cx + 4} ${cy + 4} L ${cx + 12} ${cy + 4}`} />
                    </>
                  )}
                </g>
              ))}

              {/* Chữ Thư Pháp Giữa Dòng Sông (Sở Hà - Hán Giới) Mềm Mại, Dịu Mắt */}
              <text x="250" y="510" textAnchor="middle" fill="#5c2e0b" fontSize="28" fontFamily="'Noto Serif SC', serif" fontWeight="900" letterSpacing="16" opacity="0.75">
                {isFlipped ? '漢界' : '楚河'}
              </text>
              <text x="650" y="510" textAnchor="middle" fill="#5c2e0b" fontSize="28" fontFamily="'Noto Serif SC', serif" fontWeight="900" letterSpacing="16" opacity="0.75">
                {isFlipped ? '楚河' : '漢界'}
              </text>
            </svg>

            {/* 90 Giao Điểm Đặt Quân - Khớp Chuẩn Từng Pixel Với Lưới SVG */}
            <div className="relative z-10 w-full h-full grid grid-cols-9 grid-rows-10">
              {Array.from({ length: 90 }).map((_, idx) => {
                const screenRow = Math.floor(idx / 9);
                const screenCol = idx % 9;
                const r = isFlipped ? screenRow : (9 - screenRow);
                const f = isFlipped ? (8 - screenCol) : screenCol;
                const sq = r * 9 + f;
                const piece = pos.board[sq];
                const isSelected = selectedSq === sq;
                const isTarget = validMoves.some(m => m.to === sq);
                const isLast = lastMove?.from === sq || lastMove?.to === sq;

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className="relative flex items-center justify-center cursor-pointer select-none"
                  >
                    {/* Điểm Nước Đi Hợp Lệ (Ngọc Bích Dịu Mắt) */}
                    {isTarget && (
                      piece ? (
                        <div className="absolute inset-1.5 z-20 rounded-full border-3 border-emerald-400 bg-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-emerald-500/90 border-2 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.85)] z-20 animate-pulse" />
                      )
                    )}

                    {/* Quân Cờ Gỗ 3D Đích Thực - Tinh Xảo, Khắc Chìm & Dịu Mắt */}
                    {piece ? (
                      <div
                        className={`relative z-10 w-[86%] h-[86%] max-w-[62px] max-h-[62px] rounded-full flex items-center justify-center font-serif font-black select-none transition-all duration-150 ${
                          isSelected
                            ? 'scale-115 -translate-y-1.5 ring-4 ring-amber-400/95 shadow-[0_12px_25px_rgba(251,191,36,0.6)] z-30'
                            : isLast
                            ? 'ring-3 ring-amber-500/80 shadow-[0_6px_16px_rgba(245,158,11,0.4)]'
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{
                          background: 'radial-gradient(circle at 35% 35%, #fffdf8 0%, #f7ebd4 42%, #e5c79e 82%, #cb9e68 100%)',
                          border: '2px solid #a67c48',
                          boxShadow: isSelected
                            ? '0 12px 25px rgba(251,191,36,0.55), inset 0 2px 3px rgba(255,255,255,0.9), inset 0 -3px 4px rgba(110,60,20,0.4)'
                            : '0 5px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.8), inset 0 -3px 4px rgba(110,60,20,0.35)'
                        }}
                      >
                        {/* Vòng Chỉ Tròn Khắc Chìm Trên Mặt Gỗ */}
                        <div
                          className={`w-[84%] h-[84%] rounded-full border flex items-center justify-center transition-colors ${
                            sideOf(piece) === RED
                              ? 'border-rose-600/40'
                              : 'border-slate-800/35'
                          }`}
                        >
                          {/* Chữ Hán Thư Pháp Khắc Khảm Sơn Mài */}
                          <span
                            className={`text-lg sm:text-2xl md:text-3xl leading-none font-black ${
                              sideOf(piece) === RED
                                ? 'text-rose-700'
                                : 'text-slate-900'
                            }`}
                            style={{
                              textShadow: sideOf(piece) === RED
                                ? '0 1px 1px rgba(255,255,255,0.7), 0 -1px 1px rgba(136,19,19,0.45)'
                                : '0 1px 1px rgba(255,255,255,0.65), 0 -1px 1px rgba(0,0,0,0.5)'
                            }}
                          >
                            {XIANGQI_PIECES[sideOf(piece)]?.[typeOf(piece)] || ''}
                          </span>
                        </div>
                      </div>
                    ) : null}
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
                <h3 className="text-2xl sm:text-3xl font-black text-rose-500 mb-2 font-['Orbitron']">
                  {pos.outcome().winner === RED
                    ? (isOnlineMode ? (playerRole === 'host' ? 'BẠN ĐÃ CHIẾN THẮNG!' : 'ĐỐI THỦ ĐÃ CHIẾN THẮNG!') : (mode === 'ai' ? 'BẠN ĐÃ CHIẾN THẮNG!' : 'BÊN ĐỎ THẮNG!'))
                    : pos.outcome().winner === BLACK
                    ? (isOnlineMode ? (playerRole === 'guest' ? 'BẠN ĐÃ CHIẾN THẮNG!' : 'ĐỐI THỦ ĐÃ CHIẾN THẮNG!') : (mode === 'ai' ? 'AI ĐÃ CHIẾN THẮNG!' : 'BÊN ĐEN THẮNG!'))
                    : 'VÁN CỜ HÒA!'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mb-6 font-medium">
                  {statusMessage}
                </p>
                <button
                  onClick={resetGame}
                  className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black rounded-2xl shadow-xl transition active:scale-95 cursor-pointer text-sm flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Chơi Ván Mới
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        gameId="xiangqi"
        gameTitle="Cờ Tướng"
        onJoinedMatch={(room, role) => {
          setIsOnlineMode(true);
          setIsWaitingForFriend(false);
          setOnlineRoom(room);
          setPlayerRole(role);
          const oppName = room.options?.isBot ? (room.options.botName || 'Kỳ Thủ') : (role === 'host' ? 'Đối thủ' : room.hostName);
          setOpponentName(oppName);
          const newPos = XiangqiPosition.fromFen();
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
