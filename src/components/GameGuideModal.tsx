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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_70px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - To, rõ ràng, đậm chất game */}
        <div className="h-16 px-5 sm:px-6 border-b border-white/10 bg-slate-900/95 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-2xl">{game.thumbnailIcon}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h3 className="text-lg sm:text-2xl font-black text-white tracking-wider">
                HƯỚNG DẪN
              </h3>
              <span className="text-sm sm:text-base font-black px-3.5 py-1 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-md">
                {game.title}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 sm:p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer active:scale-90"
            title="Đóng"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Modal Body - Chữ to, bự, rõ nét, cực kỳ dễ đọc */}
        <div className="p-5 sm:p-6 space-y-5 text-left">
          {/* Thao tác điều khiển - 2 thẻ to rõ cho PC & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cột PC */}
            <div className="bg-slate-900/90 border-2 border-cyan-500/40 hover:border-cyan-400/70 rounded-2xl p-4 flex items-center gap-4 transition shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-md">
                <Monitor className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-black text-cyan-400 block uppercase tracking-wider mb-0.5">
                  MÁY TÍNH
                </span>
                <span className="text-base sm:text-lg font-bold text-white block leading-snug">
                  {game.controls.desktop}
                </span>
              </div>
            </div>

            {/* Cột Mobile */}
            <div className="bg-slate-900/90 border-2 border-emerald-500/40 hover:border-emerald-400/70 rounded-2xl p-4 flex items-center gap-4 transition shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-md">
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-black text-emerald-400 block uppercase tracking-wider mb-0.5">
                  ĐIỆN THOẠI
                </span>
                <span className="text-base sm:text-lg font-bold text-white block leading-snug">
                  {game.controls.mobile}
                </span>
              </div>
            </div>
          </div>

          {/* Quy tắc chơi - Chữ to, bự, rõ từng gạch đầu dòng */}
          <div className="space-y-3">
            <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest block">
              CÁCH CHƠI:
            </span>
            <div className="space-y-2.5">
              {game.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 bg-slate-900/90 border-2 border-white/10 hover:border-cyan-500/50 rounded-2xl p-3.5 sm:p-4 transition shadow-md"
                >
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/25 text-cyan-300 font-black text-base sm:text-lg flex items-center justify-center flex-shrink-0 border border-cyan-400/60 shadow-md">
                    {idx + 1}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-white leading-relaxed flex-1">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer - Nút Vào Chơi to bự, hiệu ứng neon rực rỡ */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-slate-900/95 flex items-center justify-end flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_35px_rgba(6,182,212,0.6)] transition cursor-pointer active:scale-95 flex items-center justify-center gap-3 tracking-wider uppercase"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            <span>VÀO CHƠI NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
