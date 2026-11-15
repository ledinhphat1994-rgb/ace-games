import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  X, 
  Zap, 
  Dices, 
  Users, 
  Copy, 
  Check, 
  ArrowRight
} from 'lucide-react';
import { multiplayer, type RoomInfo } from '../utils/multiplayer';
import { soundManager } from '../utils/sound';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  onJoinedMatch: (room: RoomInfo, role: 'host' | 'guest') => void;
  onWaitingInBackground?: (room: RoomInfo) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onJoinedMatch,
  onWaitingInBackground,
}) => {
  const [playerName, setPlayerName] = useState(() => multiplayer.getPlayerName());
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isQuickMatching, setIsQuickMatching] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [waitingRoom, setWaitingRoom] = useState<RoomInfo | null>(null);
  const [customRoomId, setCustomRoomId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync rooms list from broker
  useEffect(() => {
    if (!isOpen) return;

    multiplayer.listenLobby(gameId, (updatedRooms) => {
      setRooms(updatedRooms);
    });

    const handleStatus = (status: string) => {
      if (status === 'connected') {
        const room = multiplayer.getCurrentRoom();
        const role = multiplayer.getRole();
        if (room && role) {
          setIsQuickMatching(false);
          setWaitingRoom(null);
          onJoinedMatch(room, role);
          onClose();
        }
      } else if (status === 'waiting_opponent') {
        setWaitingRoom(multiplayer.getCurrentRoom());
      }
    };

    multiplayer.onStatusChange(handleStatus);

    return () => {
      multiplayer.stopListeningLobby();
      multiplayer.offStatusChange(handleStatus);
    };
  }, [isOpen, gameId, onJoinedMatch, onClose]);

  // Countdown effect during quick match
  useEffect(() => {
    if (!isQuickMatching) return;

    if (countdown <= 0) {
      // Auto-match with online bot player!
      setIsQuickMatching(false);
      const botMatch = multiplayer.createBotMatch(gameId);
      onJoinedMatch(botMatch.room, botMatch.role);
      onClose();
      soundManager.playGameLaunch();
      return;
    }

    const timer = setInterval(() => {
      // Check if human room appeared
      const existing = multiplayer.findAvailableRoom(gameId);
      if (existing) {
        clearInterval(timer);
        multiplayer.joinRoom(gameId, existing.roomId).then(() => {
          const room = multiplayer.getCurrentRoom();
          if (room) {
            setIsQuickMatching(false);
            onJoinedMatch(room, 'guest');
            onClose();
          }
        });
        return;
      }

      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuickMatching, countdown, gameId, onJoinedMatch, onClose]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (newName: string) => {
    setPlayerName(newName);
    multiplayer.setPlayerName(newName);
  };

  const handleRandomizeName = () => {
    soundManager.playButtonClick();
    const generated = multiplayer.getRandomNewName();
    setPlayerName(generated);
  };

  // 1. TÌM TRẬN NHANH (Tối đa 4s, nếu không có ai thì tự ghép vào chơi ngay)
  const handleStartQuickMatch = async () => {
    soundManager.playButtonClick();
    setIsQuickMatching(true);
    setCountdown(4);

    const existing = multiplayer.findAvailableRoom(gameId);
    if (existing) {
      await multiplayer.joinRoom(gameId, existing.roomId);
      const room = multiplayer.getCurrentRoom();
      if (room) {
        setIsQuickMatching(false);
        onJoinedMatch(room, 'guest');
        onClose();
      }
    }
  };

  // 2. VÀO CHƠI NGAY (0 giây chờ)
  const handleInstantPlayNow = () => {
    soundManager.playButtonClick();
    setIsQuickMatching(false);
    if (waitingRoom) {
      multiplayer.leaveRoom();
      setWaitingRoom(null);
    }
    const botMatch = multiplayer.createBotMatch(gameId);
    onJoinedMatch(botMatch.room, botMatch.role);
    onClose();
    soundManager.playGameLaunch();
  };

  const handleCancelQuickMatch = () => {
    soundManager.playButtonClick();
    setIsQuickMatching(false);
  };

  // 3. RỦ BẠN BÈ QUA LINK (Tạo phòng + Tự động copy link ngay)
  const handleInviteFriend = async () => {
    soundManager.playButtonClick();
    const room = await multiplayer.createRoom(gameId);
    setWaitingRoom(room);
    copyRoomLink(room.roomId);
  };

  const copyRoomLink = (roomId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?game=${gameId}&room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handlePlayWhileWaiting = () => {
    soundManager.playButtonClick();
    if (waitingRoom && onWaitingInBackground) {
      onWaitingInBackground(waitingRoom);
    }
    onClose();
  };

  const handleJoinSpecificRoom = async (roomId: string) => {
    if (!roomId) return;
    soundManager.playButtonClick();
    await multiplayer.joinRoom(gameId, roomId.trim().toUpperCase());
    const room = multiplayer.getCurrentRoom();
    if (room) {
      onJoinedMatch(room, 'guest');
      onClose();
    }
  };

  const handleCancelWaiting = () => {
    soundManager.playButtonClick();
    multiplayer.leaveRoom();
    setWaitingRoom(null);
  };

  const handleClose = () => {
    soundManager.playButtonClick();
    setIsQuickMatching(false);
    if (waitingRoom) {
      multiplayer.leaveRoom();
      setWaitingRoom(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Khung cố định chuẩn 480x490px, tuyệt đối không co giãn nhảy giật */}
      <div
        className="relative w-[92vw] max-w-[480px] h-[490px] min-h-[490px] max-h-[490px] bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-['Orbitron'] tracking-wider">
                CHƠI ONLINE
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                {gameTitle}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col space-y-3 overflow-y-auto custom-scrollbar text-left">
          
          {/* Ô Tên Kỳ Thủ Gọn Gàng */}
          <div className="flex items-center justify-between p-2.5 px-3 rounded-2xl bg-slate-900/90 border border-white/10 flex-shrink-0">
            <span className="text-xs font-bold text-gray-300">Tên của bạn:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={14}
                className="w-32 sm:w-36 px-2.5 py-1 bg-slate-950 text-cyan-300 text-xs font-bold border border-cyan-500/30 rounded-lg outline-none focus:border-cyan-400 text-center font-['Orbitron']"
                placeholder="Nhập tên..."
              />
              <button
                onClick={handleRandomizeName}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-300 transition cursor-pointer"
                title="Đổi tên ngẫu nhiên"
              >
                <Dices className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TRƯỜNG HỢP 1: ĐANG TÌM TRẬN NHANH (Đếm ngược 4s, tự động vào chơi) */}
          {isQuickMatching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/30 text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center animate-spin-slow">
                  <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-25" />
              </div>

              <div>
                <h4 className="text-sm font-black text-white font-['Orbitron'] tracking-wider">
                  ĐANG TÌM ĐỐI THỦ ONLINE...
                </h4>
                <p className="text-xs text-cyan-300 font-mono font-bold mt-1">
                  Tự động vào ván sau: <span className="text-amber-400 text-sm font-black">{countdown}s</span>
                </p>
              </div>

              {/* Nút vào chơi ngay lập tức không cần đợi */}
              <button
                onClick={handleInstantPlayNow}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>VÀO CHƠI NGAY (KHÔNG CHỜ)</span>
              </button>

              <button
                onClick={handleCancelQuickMatch}
                className="text-xs text-gray-400 hover:text-rose-400 font-bold transition cursor-pointer"
              >
                Hủy tìm kiếm
              </button>
            </div>
          ) : waitingRoom ? (
            /* TRƯỜNG HỢP 2: RỦ BẠN BÈ QUA LINK (Không giam người chơi, có thể vừa chơi vừa đợi) */
            <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-amber-500/30 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-400" />
              </div>

              <div>
                <h4 className="text-xs font-black text-white font-['Orbitron'] tracking-wider">
                  MÃ PHÒNG: <span className="text-amber-300 font-mono text-sm">{waitingRoom.roomId}</span>
                </h4>
                <p className="text-[11px] text-emerald-400 font-bold mt-0.5 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Link đã sao chép! Dán (Ctrl+V) gửi qua Zalo/FB
                </p>
              </div>

              <button
                onClick={() => copyRoomLink(waitingRoom.roomId)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-white/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã Sao Chép Lại!' : 'Sao Chép Lại Link Mời'}</span>
              </button>

              {/* Cho phép người chơi vào bàn chơi trước không cần ngồi chờ ngắm màn hình */}
              <button
                onClick={handlePlayWhileWaiting}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>VÀO BÀN CHƠI TRƯỚC (CHỜ BẠN Ở CHẾ ĐỘ NỀN)</span>
              </button>

              <div className="flex items-center justify-between w-full pt-1 px-1">
                <button
                  onClick={handleInstantPlayNow}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  ⚡ Chơi ngay (Ghép đối thủ khác)
                </button>

                <button
                  onClick={handleCancelWaiting}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  Hủy Bàn
                </button>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: GIAO DIỆN CHÍNH - 2 LỰA CHỌN SIÊU RÕ RÀNG */
            <>
              {/* NÚT LỚN 1: TÌM TRẬN NHANH */}
              <button
                onClick={handleStartQuickMatch}
                className="w-full flex items-center justify-center gap-2.5 h-13 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                <span>TÌM TRẬN NHANH (VÀO CHƠI LIỀN)</span>
              </button>

              {/* NÚT LỚN 2: RỦ BẠN BÈ */}
              <button
                onClick={handleInviteFriend}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 font-bold text-xs tracking-wider transition cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>RỦ BẠN BÈ CHƠI CHUNG (TẠO LINK GỬI BẠN)</span>
              </button>

              {/* DANH SÁCH BÀN ĐANG CHỜ */}
              <div className="flex-1 flex flex-col space-y-2 min-h-0">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                  <span>BÀN ĐANG MỞ ({rooms.length})</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Tự động cập nhật</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
                  {rooms.length === 0 ? (
                    <div className="h-full min-h-[90px] flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-gray-400">
                      <p className="text-xs">Hiện tại chưa có người mở bàn chờ.</p>
                      <p className="text-[11px] text-cyan-400 mt-0.5">Bấm "Tìm Trận Nhanh" ở trên để vào chơi liền!</p>
                    </div>
                  ) : (
                    rooms.map((r) => (
                      <div
                        key={r.roomId}
                        className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-black text-white font-['Orbitron']">
                            {r.hostName}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">({r.roomId})</span>
                        </div>

                        <button
                          onClick={() => handleJoinSpecificRoom(r.roomId)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition cursor-pointer"
                        >
                          <span>Vào</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Bar: Nhập mã phòng phụ khi bạn bè gửi mã */}
        {!waitingRoom && !isQuickMatching && (
          <div className="h-14 px-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-between gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium">Có mã phòng từ bạn bè?</span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
              <input
                type="text"
                placeholder="Nhập mã..."
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                className="w-24 px-2 py-1 bg-transparent text-gray-200 text-xs font-mono font-bold outline-none uppercase placeholder:text-gray-600"
                maxLength={10}
              />
              <button
                onClick={() => handleJoinSpecificRoom(customRoomId)}
                disabled={!customRoomId.trim()}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                Vào
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
