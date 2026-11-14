import React, { useState, useEffect } from 'react';
import { Trophy, X, User, Edit2, Check, Sparkles } from 'lucide-react';
import { getLeaderboard, getPlayerName, setPlayerName, type LeaderboardEntry } from '../utils/leaderboard';
import { soundManager } from '../utils/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [playerName, setLocalPlayerName] = useState(getPlayerName);

  useEffect(() => {
    if (isOpen) {
      setEntries(getLeaderboard(gameId));
      setLocalPlayerName(getPlayerName());
    }
  }, [isOpen, gameId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setLocalPlayerName(nameInput.trim());
      setEntries(getLeaderboard(gameId));
    }
    setIsEditingName(false);
    soundManager.playButtonClick();
  };

  const userEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Orbitron'] flex items-center gap-2">
                <span>BẢNG XẾP HẠNG</span>
              </h3>
              <p className="text-xs text-cyan-400 font-semibold">{gameTitle}</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-gray-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 transition cursor-pointer shadow-sm active:scale-95"
            title="Đóng Bảng Xếp Hạng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Stats & Nickname Banner */}
        <div className="p-4 bg-slate-900/60 border-b border-white/5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={16}
                    placeholder="Nhập tên của bạn"
                    autoFocus
                    className="px-2.5 py-1 text-xs bg-slate-950 border border-cyan-400 rounded-lg text-white font-bold outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{playerName}</span>
                  <button
                    onClick={() => {
                      setNameInput(playerName);
                      setIsEditingName(true);
                      soundManager.playButtonClick();
                    }}
                    className="p-1 rounded-md text-gray-400 hover:text-cyan-300 transition"
                    title="Đổi tên của bạn"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Kỷ lục: <strong className="text-amber-400 font-mono">{userEntry ? userEntry.formattedScore : '0'}</strong></span>
                <span>•</span>
                <span>Hạng: <strong className="text-cyan-400 font-mono">#{userEntry ? userEntry.rank : '-'}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Cột mốc</span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Top 10 Cao Thủ</span>
            </div>
          </div>
        </div>

        {/* Rankings List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 no-scrollbar">
          {entries.map(entry => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  entry.isCurrentUser
                    ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                    : isTop1
                    ? 'bg-amber-950/25 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Rank & Player Info */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm font-mono flex-shrink-0 ${
                      isTop1
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-md shadow-amber-500/40'
                        : isTop2
                        ? 'bg-gradient-to-tr from-slate-400 to-gray-200 text-slate-950 shadow-md shadow-slate-400/30'
                        : isTop3
                        ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white shadow-md shadow-amber-700/30'
                        : 'bg-slate-800 text-gray-400 border border-slate-700/60'
                    }`}
                  >
                    {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${entry.rank}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs sm:text-sm font-extrabold ${entry.isCurrentUser ? 'text-cyan-300' : 'text-gray-200'}`}>
                        {entry.name}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-cyan-400 text-slate-950 rounded-full font-sans">
                          BẠN
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 block">{entry.date}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className={`text-base sm:text-lg font-black font-mono leading-none ${
                    isTop1 ? 'text-amber-400' : entry.isCurrentUser ? 'text-cyan-400' : 'text-gray-100'
                  }`}>
                    {entry.formattedScore}
                  </span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">
                    Điểm Kỷ Lục
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-950/90 text-center flex-shrink-0">
          <p className="text-[11px] text-gray-400">
            🔥 Đạt điểm cao trong trò chơi để tự động ghi danh vào Bảng Xếp Hạng!
          </p>
        </div>
      </div>
    </div>
  );
};
