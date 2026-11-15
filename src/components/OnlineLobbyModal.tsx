import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  X, 
  Zap, 
  Dices, 
  Copy, 
  Check, 
  ArrowRight,
  Plus,
  Loader2
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
  const [isSearching, setIsSearching] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState<RoomInfo | null>(null);
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Lắng nghe sảnh phòng từ MQTT Broker thời gian thực
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
          setIsSearching(false);
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

  // 1. TẠO PHÒNG (1-Click)
  const handleCreateRoom = async () => {
    soundManager.playButtonClick();
    setIsSearching(true);
    const room = await multiplayer.createRoom(gameId);
    setIsSearching(false);
    setWaitingRoom(room);
    copyRoomLink(room.roomId);
  };

  const copyRoomLink = (roomId: string) => {
    const cleanId = multiplayer.normalizeRoomId(roomId);
    const url = `${window.location.origin}${window.location.pathname}?game=${gameId}&room=${cleanId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // 2. VÀO BẰNG MÃ
  const handleJoinWithCode = async (code: string) => {
    const cleanId = multiplayer.normalizeRoomId(code);
    if (!cleanId) return;
    soundManager.playButtonClick();
    setIsSearching(true);
    const ok = await multiplayer.joinRoom(gameId, cleanId);
    setIsSearching(false);
    if (ok) {
      const room = multiplayer.getCurrentRoom();
      if (room) {
        onJoinedMatch(room, 'guest');
        onClose();
      }
    }
  };

  // 3. GHÉP TỰ ĐỘNG
  const handleQuickMatch = async () => {
    soundManager.playButtonClick();
    setIsSearching(true);
    const result = await multiplayer.quickMatch(gameId);
    setIsSearching(false);
    if (result.action === 'joined') {
      onJoinedMatch(result.room, 'guest');
      onClose();
    } else {
      setWaitingRoom(result.room);
    }
  };

  const handlePlayWhileWaiting = () => {
    soundManager.playButtonClick();
    if (waitingRoom && onWaitingInBackground) {
      onWaitingInBackground(waitingRoom);
    }
    onClose();
  };

  const handleCancelWaiting = () => {
    soundManager.playButtonClick();
    multiplayer.leaveRoom();
    setWaitingRoom(null);
  };

  const handleClose = () => {
    soundManager.playButtonClick();
    if (waitingRoom) {
      multiplayer.leaveRoom();
      setWaitingRoom(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Khung gọn gàng, thẩm mỹ cao, ít chữ, to rõ */}
      <div
        className="relative w-[92vw] max-w-[420px] bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
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
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col space-y-3.5 text-left">

          {/* TRƯỜNG HỢP 1: ĐANG CHỜ BẠN VÀO */}
          {waitingRoom ? (
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3.5">
              {/* Radar pulse animation */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center animate-pulse shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                  <Globe className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-40" />
              </div>

              {/* Mã phòng to rõ */}
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">MÃ PHÒNG CỦA BẠN</p>
                <h2 className="text-3xl font-black text-amber-300 font-mono tracking-widest mt-0.5 drop-shadow-[0_0_15px_rgba(252,211,77,0.5)]">
                  {waitingRoom.roomId}
                </h2>
              </div>

              {/* Nút Sao Chép Link (Nổi Bật Nhất) */}
              <button
                onClick={() => copyRoomLink(waitingRoom.roomId)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                <span>{copiedLink ? 'ĐÃ SAO CHÉP LINK!' : 'SAO CHÉP LINK GỬI BẠN'}</span>
              </button>

              {/* Nút Vào Bàn Chờ & Hủy */}
              <div className="w-full flex items-center gap-2 pt-1">
                <button
                  onClick={handlePlayWhileWaiting}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 font-bold text-xs border border-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Ra Bàn Đợi</span>
                </button>

                <button
                  onClick={handleCancelWaiting}
                  className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 transition cursor-pointer"
                >
                  ✕ Hủy
                </button>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: LỰA CHỌN ĐƠN GIẢN, ÍT CHỮ NHẤT */
            <>
              {/* NÚT 1: TẠO PHÒNG LẤY LINK (LỚN, NỔI BẬT) */}
              <button
                onClick={handleCreateRoom}
                disabled={isSearching}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>TẠO PHÒNG MỜI BẠN</span>
              </button>

              {/* NÚT 2: NHẬP MÃ PHÒNG (GỌN GÀNG) */}
              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-white/10">
                <input
                  type="text"
                  placeholder="Nhập mã 4 số..."
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value)}
                  maxLength={10}
                  className="flex-1 px-3 py-1.5 bg-slate-950 text-cyan-300 text-xs sm:text-sm font-mono font-bold outline-none placeholder:text-gray-500 rounded-xl border border-white/5 text-center"
                />
                <button
                  onClick={() => handleJoinWithCode(customRoomCode)}
                  disabled={!customRoomCode.trim() || isSearching}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition disabled:opacity-40 cursor-pointer flex-shrink-0"
                >
                  Vào Bàn
                </button>
              </div>

              {/* NÚT 3: GHÉP NGẪU NHIÊN */}
              <button
                onClick={handleQuickMatch}
                disabled={isSearching}
                className="w-full h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/30 hover:border-amber-500/50 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                )}
                <span>Ghép Trận Ngẫu Nhiên</span>
              </button>

              {/* DANH SÁCH BÀN ĐANG MỞ (CHỈ HIỆN KHI CÓ NGƯỜI MỞ) */}
              {rooms.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-400">
                    BÀN ĐANG CHỜ ({rooms.length}):
                  </span>
                  <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {rooms.map((r) => (
                      <div
                        key={r.roomId}
                        className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-900 border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-white">
                            {r.hostName}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono">({r.roomId})</span>
                        </div>
                        <button
                          onClick={() => handleJoinWithCode(r.roomId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition cursor-pointer"
                        >
                          Vào
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Bar: Tên hiển thị (Tối giản 1 dòng) */}
        <div className="h-11 px-5 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">Tên bạn:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={14}
              className="w-28 px-2 py-0.5 bg-slate-950 text-cyan-300 text-xs font-bold border border-white/10 rounded-lg outline-none text-center"
            />
            <button
              onClick={handleRandomizeName}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-cyan-300 transition cursor-pointer"
              title="Đổi tên"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
