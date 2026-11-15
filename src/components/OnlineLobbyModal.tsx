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
  Loader2, 
  User, 
  Users 
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
  const [waitingRoom, setWaitingRoom] = useState<RoomInfo | null>(() => {
    const current = multiplayer.getCurrentRoom();
    return (current && current.status === 'waiting' && multiplayer.getRole() === 'host') ? current : null;
  });
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Khôi phục phòng đang đợi khi mở lại modal
  useEffect(() => {
    if (isOpen) {
      const current = multiplayer.getCurrentRoom();
      if (current && current.status === 'waiting' && multiplayer.getRole() === 'host') {
        setWaitingRoom(current);
      }
    }
  }, [isOpen]);

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

  // 1. TẠO BÀN MỚI
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

  // 2. VÀO BẰNG MÃ PHÒNG
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

  // 3. GHÉP NHANH (Tự động vào bàn đang chờ hoặc tạo mới)
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

  // Danh sách bàn của NGƯỜI KHÁC (tuyệt đối không hiển thị bàn của chính mình)
  const otherRooms = rooms.filter(
    (r) => r.hostId !== multiplayer.getPlayerId() && r.hostName !== playerName
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-[92vw] max-w-[460px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/10 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-['Orbitron'] tracking-wider leading-tight">
                SẢNH PVP ONLINE
              </h3>
              <span className="text-[11px] text-cyan-400 font-semibold">
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

        {/* TRƯỜNG HỢP 1: BÀN CỦA BẠN ĐANG MỞ (ĐANG CHỜ ĐỐI THỦ) */}
        {waitingRoom ? (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            {/* Radar xung nhịp */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-cyan-500/15 border-2 border-cyan-400/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.35)]">
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-30" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                BÀN ĐẤU CỦA BẠN ĐÃ MỞ
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Mã số bàn đấu:</p>
              <h2 className="text-4xl font-black text-amber-300 font-mono tracking-widest mt-1 drop-shadow-[0_0_20px_rgba(252,211,77,0.5)]">
                #{waitingRoom.roomId}
              </h2>
            </div>

            {/* Nút Sao Chép Link (Nổi Bật Nhất) */}
            <div className="w-full space-y-1.5">
              <button
                onClick={() => copyRoomLink(waitingRoom.roomId)}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                <span>{copiedLink ? 'ĐÃ SAO CHÉP LINK MỜI!' : 'SAO CHÉP LINK GỬI BẠN'}</span>
              </button>
              {copiedLink && (
                <p className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                  ✓ Gửi link cho bạn bè qua Zalo / Facebook để vào đấu ngay!
                </p>
              )}
            </div>

            {/* Nút Vào Bàn Ngồi Đợi & Hủy Bàn */}
            <div className="w-full flex items-center gap-2.5 pt-1">
              <button
                onClick={handlePlayWhileWaiting}
                className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Vào Bàn Ngồi Đợi</span>
              </button>

              <button
                onClick={handleCancelWaiting}
                className="h-10 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 transition cursor-pointer"
              >
                ✕ Hủy Bàn
              </button>
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: SẢNH CHỜ CHUẨN MỰC (LOBBY VIEW) */
          <>
            {/* Hồ Sơ Người Chơi (Hiển thị tên rõ ràng trên đầu) */}
            <div className="px-5 py-2.5 bg-slate-950/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tên bạn:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={14}
                  className="w-32 px-2.5 py-1 bg-slate-900 text-cyan-300 text-xs font-bold border border-cyan-500/30 rounded-lg outline-none text-center focus:border-cyan-400"
                />
                <button
                  onClick={handleRandomizeName}
                  title="Đổi tên ngẫu nhiên"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2 Nút Hành Động Chính (Cân đối, To rõ) */}
            <div className="grid grid-cols-2 gap-2.5 px-5 pt-4">
              <button
                onClick={handleCreateRoom}
                disabled={isSearching}
                className="h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tạo Bàn Mới</span>
              </button>

              <button
                onClick={handleQuickMatch}
                disabled={isSearching}
                className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                )}
                <span>Ghép Nhanh</span>
              </button>
            </div>

            {/* Khu Vực Trọng Tâm: DANH SÁCH BÀN ĐANG ĐỢI */}
            <div className="px-5 py-3.5 flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  BÀN ĐANG ĐỢI NGƯỜI CHƠI ({otherRooms.length})
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Trực tuyến" />
              </div>

              {otherRooms.length > 0 ? (
                <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {otherRooms.map((r) => (
                    <div
                      key={r.roomId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-cyan-500/40 transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
                          #{r.roomId}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-white group-hover:text-cyan-300 transition">
                            {r.hostName}
                          </p>
                          <p className="text-[10px] text-gray-400">Đang đợi đối thủ...</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinWithCode(r.roomId)}
                        disabled={isSearching}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span>Vào Chơi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-gray-400 border border-dashed border-white/10 rounded-2xl bg-slate-950/30">
                  <Users className="w-7 h-7 text-gray-500 mb-1.5 opacity-60" />
                  <p className="text-xs font-medium text-gray-300">Chưa có ai mở bàn</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Bấm <span className="text-cyan-400 font-bold">"Tạo Bàn Mới"</span> ở trên để làm chủ phòng!
                  </p>
                </div>
              )}
            </div>

            {/* Chân Trang: Vào Bằng Mã Số Riêng */}
            <div className="px-5 py-3 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-400">Có mã phòng?</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mã 4 số..."
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value)}
                  maxLength={10}
                  className="w-28 px-2.5 py-1 bg-slate-900 text-cyan-300 text-xs font-mono font-bold outline-none placeholder:text-gray-500 rounded-lg border border-white/10 text-center focus:border-cyan-400"
                />
                <button
                  onClick={() => handleJoinWithCode(customRoomCode)}
                  disabled={!customRoomCode.trim() || isSearching}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition disabled:opacity-40 cursor-pointer"
                >
                  Vào
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
