import React, { useEffect } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
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
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_70px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - To rõ, đậm chất game */}
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

        {/* Modal Body - Giao diện tinh gọn, thoáng đãng, dễ hiểu */}
        <div className="p-5 sm:p-6 space-y-4 text-left">
          {/* Khối Điều Khiển - Gọn gàng 2 cột */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cột Máy Tính */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-sm">
                <Monitor className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-cyan-400 block uppercase tracking-wider mb-0.5">
                  MÁY TÍNH
                </span>
                <span className="text-base sm:text-lg font-bold text-white block truncate leading-snug">
                  {game.controls.desktop}
                </span>
              </div>
            </div>

            {/* Cột Điện Thoại */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-md">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-emerald-400 block uppercase tracking-wider mb-0.5">
                  ĐIỆN THOẠI
                </span>
                <span className="text-base sm:text-lg font-bold text-white block truncate leading-snug">
                  {game.controls.mobile}
                </span>
              </div>
            </div>
          </div>

          {/* Khối Cách Chơi - Liền mạch trong 1 khung, không rời rạc */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
            <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest block">
              CÁCH CHƠI
            </span>
            <div className="space-y-3">
              {game.instructions.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-sm sm:text-base flex items-center justify-center flex-shrink-0 border border-cyan-400/50 shadow-sm">
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

        {/* Footer - Nút ĐÓNG LẠI sắp xếp ở CHÍNH GIỮA thay vì bên phải */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-slate-900/95 flex items-center justify-center flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto min-w-[200px] px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base sm:text-lg shadow-[0_0_35px_rgba(6,182,212,0.5)] transition cursor-pointer active:scale-95 flex items-center justify-center gap-2.5 tracking-wider uppercase"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <span>ĐÓNG LẠI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
