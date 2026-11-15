import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  X, 
  Zap, 
  Dices, 
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
  const [customRoomCode, setCustomRoomCode] = useState('');

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
          onJoinedMatch(room, role);
          onClose();
        }
      }
    };

    multiplayer.onStatusChange(handleStatus);

    return () => {
      multiplayer.stopListeningLobby();
      multiplayer.offStatusChange(handleStatus);
    };
  }, [isOpen, gameId, onJoinedMatch, onClose]);

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

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

  const copyRoomLink = (roomId: string) => {
    const cleanId = multiplayer.normalizeRoomId(roomId);
    const url = `${window.location.origin}${window.location.pathname}?game=${gameId}&room=${cleanId}`;
    try {
      navigator.clipboard.writeText(url);
    } catch {}
  };

  // 1. TẠO BÀN MỚI (Tạo bàn & đi thẳng vào bàn đấu luôn)
  const handleCreateRoom = async () => {
    soundManager.playButtonClick();
    setIsSearching(true);
    const room = await multiplayer.createRoom(gameId);
    setIsSearching(false);
    copyRoomLink(room.roomId);
    if (onWaitingInBackground) {
      onWaitingInBackground(room);
    }
    onClose();
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

  // 3. GHÉP NHANH (Vào bàn đang chờ hoặc tự tạo bàn rồi vào thẳng bàn đấu)
  const handleQuickMatch = async () => {
    soundManager.playButtonClick();
    setIsSearching(true);
    const result = await multiplayer.quickMatch(gameId);
    setIsSearching(false);
    if (result.action === 'joined') {
      onJoinedMatch(result.room, 'guest');
    } else {
      copyRoomLink(result.room.roomId);
      if (onWaitingInBackground) {
        onWaitingInBackground(result.room);
      }
    }
    onClose();
  };

  // Danh sách bàn của NGƯỜI KHÁC (tuyệt đối không hiển thị bàn của chính mình)
  const otherRooms = rooms.filter(
    (r) => r.hostId !== multiplayer.getPlayerId() && r.hostName !== playerName
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Khung Sảnh Màu Sắc Đồng Bộ Sang Trọng (Theme Cyber-Cyan & Deep Navy) */}
      <div
        className="relative w-[92vw] max-w-[460px] bg-[#090e1a] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/5 bg-[#0d1527]/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wider leading-tight">
                SẢNH PVP ONLINE
              </h3>
              <span className="text-[11px] text-cyan-400 font-semibold">
                {gameTitle}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Nút Hành Động Chính (Phối màu Cyan - Electric Blue đồng bộ, không rối mắt) */}
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          <button
            onClick={handleCreateRoom}
            disabled={isSearching}
            className="h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Bàn Mới</span>
          </button>

          <button
            onClick={handleQuickMatch}
            disabled={isSearching}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/10 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            )}
            <span>Ghép Nhanh</span>
          </button>
        </div>

        {/* Khu Vực Trọng Tâm: DANH SÁCH BÀN ĐANG ĐỢI */}
        <div className="px-5 py-3.5 flex-1 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              BÀN ĐANG ĐỢI NGƯỜI CHƠI ({otherRooms.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" title="Trực tuyến" />
          </div>

          {otherRooms.length > 0 ? (
            <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {otherRooms.map((r) => (
                <div
                  key={r.roomId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    {/* Badge số phòng: Rộng rãi, min-w 62px, tuyệt đối không bị tràn viền */}
                    <div className="px-3 py-1 min-w-[62px] h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs tracking-wider shadow-inner flex-shrink-0">
                      #{r.roomId}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {r.hostName}
                      </p>
                      <p className="text-[10px] text-slate-400">Đang đợi đối thủ...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinWithCode(r.roomId)}
                    disabled={isSearching}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Vào Chơi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/30">
              <Users className="w-7 h-7 text-slate-500 mb-1.5 opacity-60" />
              <p className="text-xs font-medium text-slate-300">Chưa có ai mở bàn</p>
            </div>
          )}
        </div>

        {/* Chân Trang: Vùng 3 (Tên Bạn) & Vùng 2 (Mã Phòng) - Tông màu trầm, hài hòa */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#0d1527]/90 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Vùng 3: Tên người chơi */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={14}
              placeholder="Tên bạn..."
              className="w-28 px-2.5 py-1.5 bg-slate-950 text-cyan-300 text-xs font-bold border border-slate-800 focus:border-cyan-500/60 rounded-xl outline-none text-center"
            />
            <button
              onClick={handleRandomizeName}
              title="Đổi tên ngẫu nhiên"
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer flex-shrink-0"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Vùng 2: Nhập mã phòng */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Mã 4 số..."
              value={customRoomCode}
              onChange={(e) => setCustomRoomCode(e.target.value)}
              maxLength={10}
              className="w-24 px-2.5 py-1.5 bg-slate-950 text-cyan-300 text-xs font-mono font-bold outline-none placeholder:text-slate-600 rounded-xl border border-slate-800 focus:border-cyan-500/60 text-center"
            />
            <button
              onClick={() => handleJoinWithCode(customRoomCode)}
              disabled={!customRoomCode.trim() || isSearching}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold border border-slate-700 hover:border-cyan-400 transition disabled:opacity-40 cursor-pointer flex-shrink-0"
            >
              Vào
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
