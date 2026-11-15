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
  const [customRoomId, setCustomRoomId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Lắng nghe sảnh phòng từ Broker MQTT thời gian thực
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

  // 1. TÌM TRẬN NHANH:
  // Nếu có phòng người khác đang mở -> Vào ngay!
  // Nếu chưa có phòng -> Mở bàn chờ và đợi người thứ 2 vào!
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

  // 2. MỞ BÀN MỚI / TẠO PHÒNG CÔNG KHAI
  const handleCreateRoom = async () => {
    soundManager.playButtonClick();
    setIsSearching(true);
    const room = await multiplayer.createRoom(gameId);
    setIsSearching(false);
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

  // 3. VÀO BÀN ĐANG CHỜ CỦA NGƯỜI KHÁC
  const handleJoinSpecificRoom = async (roomId: string) => {
    if (!roomId) return;
    soundManager.playButtonClick();
    setIsSearching(true);
    await multiplayer.joinRoom(gameId, roomId.trim().toUpperCase());
    setIsSearching(false);
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
          
          {/* Ô Tên Người Chơi Gọn Gàng */}
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

          {/* TRƯỜNG HỢP 1: BẠN ĐÃ MỞ PHÒNG & ĐANG CHỜ NGƯỜI CHƠI KHÁC VÀO */}
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
                <p className="text-xs text-amber-300 font-mono font-bold mt-0.5">
                  Mã phòng: <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-white/10 text-sm font-black">{waitingRoom.roomId}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Mở trình duyệt thứ 2 chọn bàn này hoặc mở link để vào chơi!
                </p>
              </div>

              <button
                onClick={() => copyRoomLink(waitingRoom.roomId)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-white/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '✓ Đã Sao Chép Link Mời!' : 'Sao Chép Link Mời Bạn Bè'}</span>
              </button>

              <button
                onClick={handlePlayWhileWaiting}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Vào Bàn Chơi Trước Trong Khi Chờ</span>
              </button>

              <button
                onClick={handleCancelWaiting}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer pt-1"
              >
                Hủy Phòng Chờ
              </button>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: SẢNH CHỜ - TÌM TRẬN & DANH SÁCH BÀN ĐANG MỞ */
            <>
              {/* NÚT LỚN: TÌM TRẬN NHANH */}
              <button
                onClick={handleQuickMatch}
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2.5 h-13 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95 flex-shrink-0"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ĐANG KẾT NỐI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                    <span>TÌM TRẬN NHANH (TỰ GHÉP)</span>
                  </>
                )}
              </button>

              {/* NÚT MỞ BÀN MỚI */}
              <button
                onClick={handleCreateRoom}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-bold text-xs tracking-wider transition cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>MỞ BÀN MỚI (CHỦ PHÒNG)</span>
              </button>

              {/* DANH SÁCH BÀN ĐANG MỞ CỦA NGƯỜI CHƠI KHÁC */}
              <div className="flex-1 flex flex-col space-y-2 min-h-0">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                  <span>BÀN ĐANG CHỜ ({rooms.length})</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Tự cập nhật</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
                  {rooms.length === 0 ? (
                    <div className="h-full min-h-[90px] flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-slate-900/40 border border-white/5 text-gray-400">
                      <p className="text-xs">Chưa có ai mở bàn.</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Bấm "Mở Bàn Mới" để người khác vào chơi cùng bạn!</p>
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
                          <span className="text-[10px] text-amber-300 font-mono">({r.roomId})</span>
                        </div>

                        <button
                          onClick={() => handleJoinSpecificRoom(r.roomId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-black border border-emerald-500/40 transition cursor-pointer"
                        >
                          <span>Vào Chơi</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Bar: Nhập mã phòng phụ */}
        {!waitingRoom && (
          <div className="h-14 px-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-between gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium">Nhập mã phòng:</span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
              <input
                type="text"
                placeholder="PHONG-..."
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                className="w-28 px-2 py-1 bg-transparent text-gray-200 text-xs font-mono font-bold outline-none uppercase placeholder:text-gray-600"
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
