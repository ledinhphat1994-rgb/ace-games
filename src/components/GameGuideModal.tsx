import React, { useEffect } from 'react';
import { HelpCircle, X, Monitor, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <HelpCircle className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Orbitron'] flex items-center gap-2">
                <span>HƯỚNG DẪN CHƠI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {game.title}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                Cách điều khiển & quy luật trò chơi
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-left">
          {/* Overview / Giới thiệu */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3.5 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{game.thumbnailIcon}</span>
            <div>
              <h4 className="text-xs font-black uppercase text-cyan-300 tracking-wider mb-1">
                Giới Thiệu Trò Chơi
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {game.description}
              </p>
            </div>
          </div>

          {/* Phím Điều Khiển (Desktop & Mobile) */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-['Orbitron']">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Thao Tác Điều Khiển</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Desktop */}
              <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Monitor className="w-4 h-4" />
                  <span>Máy Tính (PC / Laptop)</span>
                </div>
                <p className="text-xs text-gray-200 font-medium">
                  {game.controls.desktop}
                </p>
              </div>

              {/* Mobile */}
              <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Điện Thoại / Cảm Ứng</span>
                </div>
                <p className="text-xs text-gray-200 font-medium">
                  {game.controls.mobile}
                </p>
              </div>
            </div>
          </div>

          {/* Luật Chơi Chi Tiết */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-['Orbitron']">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quy Tắc & Cách Chơi</span>
            </h4>

            <div className="space-y-2">
              {game.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-slate-900/60 border border-white/5 rounded-xl p-2.5 text-xs sm:text-sm text-gray-300"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-cyan-500/30">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-slate-900/90 flex items-center justify-end flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95"
          >
            ĐÃ HIỂU, CHIẾN THÔI!
          </button>
        </div>
      </div>
    </div>
  );
};
