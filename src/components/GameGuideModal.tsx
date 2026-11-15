import React, { useEffect } from 'react';
import { X, Monitor, Smartphone, Play } from 'lucide-react';
import type { GameInfo } from '../types/game';
import { soundManager } from '../utils/sound';

interface GameGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameInfo;
}

export const GameGuideModal: React.FC<GameGuideModalProps> = ({
  isOpen,
  onClose,
  game,
}) => {
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

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Gọn gàng, tinh tế */}
        <div className="h-14 px-4 sm:px-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <span className="text-lg">{game.thumbnailIcon}</span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-['Orbitron'] tracking-wider">
                HƯỚNG DẪN
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                {game.title}
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

        {/* Modal Body - Ngắn gọn, súc tích, không rườm rà */}
        <div className="p-4 sm:p-5 space-y-3.5 text-left">
          {/* Thao tác điều khiển - 1 hàng ngang 2 cột siêu gọn */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-2.5 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">PC</span>
                <span className="text-xs text-gray-200 font-semibold truncate block">
                  {game.controls.desktop}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Mobile</span>
                <span className="text-xs text-gray-200 font-semibold truncate block">
                  {game.controls.mobile}
                </span>
              </div>
            </div>
          </div>

          {/* Quy tắc chơi - Tối đa 3 gạch đầu dòng ngắn gọn */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Cách Chơi:
            </span>
            <div className="space-y-1.5">
              {game.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-200"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Nút Vào Chơi ngắn gọn, bắt mắt */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/10 bg-slate-900/90 flex items-center justify-end flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>VÀO CHƠI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
