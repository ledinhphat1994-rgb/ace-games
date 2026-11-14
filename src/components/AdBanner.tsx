import React from 'react';
import { Sparkles, Gamepad2 } from 'lucide-react';

interface AdBannerProps {
  format?: 'leaderboard' | 'rectangle' | 'banner';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ format = 'leaderboard', className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center my-3 ${className}`}>
      {format === 'leaderboard' && (
        <div className="w-full max-w-[728px] h-[72px] sm:h-[80px] bg-gradient-to-r from-cyan-950/40 via-indigo-950/50 to-purple-950/40 border border-cyan-500/20 rounded-2xl flex items-center justify-between px-4 sm:px-6 shadow-lg shadow-indigo-950/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <span className="text-cyan-400">ACE GAMES PRO</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 rounded-full">100% MIỄN PHÍ</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400">Không cần tải về • Không giật lag • Tối ưu âm thanh vòm</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 z-10">
            <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Web Arcade
            </span>
          </div>
        </div>
      )}

      {format === 'rectangle' && (
        <div className="w-[300px] h-[250px] bg-gradient-to-b from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center text-center p-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-500/30">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <p className="font-extrabold text-white text-sm">Chơi Game Đỉnh Cao</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Trải nghiệm hàng chục tựa game HTML5 tốc độ cao</p>
        </div>
      )}

      {format === 'banner' && (
        <div className="w-full max-w-[320px] sm:max-w-[468px] h-[50px] bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-center text-xs text-gray-400">
          <span className="text-cyan-400 font-bold">Ace Games</span>
          <span className="mx-2">•</span>
          <span>Đấu trường trực tuyến</span>
        </div>
      )}
    </div>
  );
};
