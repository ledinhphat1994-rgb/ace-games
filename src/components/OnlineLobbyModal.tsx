import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  X, 
  Zap, 
  Dices, 
  Users, 
  Copy, 
  Check, 
  ArrowRight,
  Plus,
  Share2
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

  // 1. TẠO PHÒNG MỜI BẠN (Chuẩn Lichess / GitHub)
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

  // 2. VÀO BẰNG MÃ PHÒNG CỦA BẠN BÈ
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

  // 3. GHÉP TRẬN TỰ ĐỘNG (Không ép bot)
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
      {/* Khung cố định chuẩn 480x490px, tuyệt đối không co giãn giật lag */}
      <div
        className="relative w-[92vw] max-w-[480px] h-[490px] min-h-[490px] max-h-[490px] bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-['Orbitron'] tracking-wider">
                CHƠI PVP ONLINE
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

          {/* TRƯỜNG HỢP 1: ĐÃ TẠO PHÒNG & ĐANG CHỜ BẠN BÈ VÀO */}
          {waitingRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/30 text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center animate-pulse">
                  <Users className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
              </div>

              <div>
                <h4 className="text-sm font-black text-white font-['Orbitron'] tracking-wider">
                  ĐANG ĐỢI ĐỐI THỦ VÀO BÀN...
                </h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Mã phòng:</span>
                  <span className="text-amber-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-amber-500/30 text-sm font-mono font-black tracking-widest">
                    {waitingRoom.roomId}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[340px] mx-auto">
                  Gửi link bên dưới cho bạn bè hoặc mở ở trình duyệt thứ 2 để vào bàn đấu ngay lập tức!
                </p>
              </div>

              {/* Nút Sao Chép Link */}
              <button
                onClick={() => copyRoomLink(waitingRoom.roomId)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '✓ ĐÃ SAO CHÉP LINK MỜI!' : '📋 SAO CHÉP LINK MỜI BẠN BÈ'}</span>
              </button>

              {/* Nút Vào Bàn Chờ */}
              <button
                onClick={handlePlayWhileWaiting}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-cyan-300 font-bold text-xs border border-white/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Ra Bàn Cờ Đợi Bạn (Thu Nhỏ)</span>
              </button>

              <button
                onClick={handleCancelWaiting}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer pt-1"
              >
                ✕ Hủy Phòng Chờ
              </button>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: LỰA CHỌN PVP - CHUẨN LICHESS / GITHUB */
            <>
              {/* PHƯƠNG ÁN 1 (CHÍNH): TẠO LINK MỜI BẠN BÈ */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Chơi Với Bạn Bè (Play With Friend)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Tạo phòng và lấy link mời. Bạn bè chỉ cần click vào link là vào bàn đấu ngay.
                </p>
                <button
                  onClick={handleCreateRoom}
                  disabled={isSearching}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/25 transition cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>TẠO PHÒNG & LẤY LINK MỜI</span>
                </button>
              </div>

              {/* PHƯƠNG ÁN 2: VÀO BẰNG MÃ PHÒNG TỪ BẠN BÈ */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-300">Có mã phòng?</span>
                  <span className="text-[10px] text-gray-500">Nhập 4 số từ bạn bè</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                  <input
                    type="text"
                    placeholder="VD: 5829"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value)}
                    maxLength={10}
                    className="w-24 px-2 py-1 bg-transparent text-cyan-300 text-xs font-mono font-bold outline-none placeholder:text-gray-600 text-center"
                  />
                  <button
                    onClick={() => handleJoinWithCode(customRoomCode)}
                    disabled={!customRoomCode.trim()}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition disabled:opacity-40 cursor-pointer"
                  >
                    Vào
                  </button>
                </div>
              </div>

              {/* PHƯƠNG ÁN 3: GHÉP NGẪU NHIÊN & DANH SÁCH BÀN MỞ */}
              <div className="flex-1 flex flex-col space-y-2 min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">
                    BÀN ĐANG MỞ ONLINE ({rooms.length})
                  </span>
                  <button
                    onClick={handleQuickMatch}
                    disabled={isSearching}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>Ghép Tự Động</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
                  {rooms.length === 0 ? (
                    <div className="h-full min-h-[70px] flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-gray-400">
                      <p className="text-xs">Chưa có ai mở bàn.</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Bấm "Tạo Phòng" ở trên để người khác vào chơi cùng bạn!</p>
                    </div>
                  ) : (
                    rooms.map((r) => (
                      <div
                        key={r.roomId}
                        className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-black text-white font-['Orbitron']">
                            {r.hostName}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono">({r.roomId})</span>
                        </div>

                        <button
                          onClick={() => handleJoinWithCode(r.roomId)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-black border border-emerald-500/40 transition cursor-pointer"
                        >
                          <span>Vào Chơi</span>
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

        {/* Footer Bar: Tên của bạn */}
        <div className="h-12 px-5 border-t border-white/10 bg-slate-900/90 flex items-center justify-between gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium">Tên hiển thị:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={14}
              className="w-32 px-2 py-0.5 bg-slate-950 text-cyan-300 text-xs font-bold border border-white/10 rounded-lg outline-none text-center font-['Orbitron']"
            />
            <button
              onClick={handleRandomizeName}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-300 transition cursor-pointer"
              title="Đổi tên ngẫu nhiên"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
