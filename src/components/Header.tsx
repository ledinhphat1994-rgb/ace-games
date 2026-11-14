import React, { useState } from 'react';
import { Gamepad2, Search, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import type { GameCategory } from '../types/game';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: GameCategory;
  onCategoryChange: (cat: GameCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    const nextState = soundManager.toggle();
    setSoundEnabled(nextState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const categories: { id: GameCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả Game', icon: '🔥' },
    { id: 'favorites', label: 'Yêu Thích', icon: '❤️' },
    { id: 'classic', label: 'Kinh Điển', icon: '🕹️' },
    { id: 'strategy', label: 'Cờ & Đấu Trí', icon: '♟️' },
    { id: 'arcade', label: 'Arcade & Phản Xạ', icon: '⚡' },
    { id: 'puzzle', label: 'Trí Tuệ & Số Học', icon: '🧩' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div
            onClick={() => onCategoryChange('all')}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-400/50 transition-all duration-300">
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300 font-['Orbitron']">
                  ACE GAMES
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-1.5 py-0.2 rounded-md shadow-sm">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-400 font-medium">
                <span className="hidden sm:inline">Cổng Game HTML5 Không Cần Cài Đặt</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  1,840 Online
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-md mx-2">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm game: cờ vua, tetris, rắn..."
              className="w-full pl-9 sm:pl-10 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-gray-100 placeholder-gray-500 rounded-2xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Action Controls: Audio Toggle & Fullscreen */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                soundEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-gray-500 hover:text-gray-300'
              }`}
              title={soundEnabled ? 'Âm thanh: ĐANG BẬT' : 'Âm thanh: ĐANG TẮT'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="hidden md:inline">Âm thanh</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-500" />
                  <span className="hidden md:inline">Tắt tiếng</span>
                </>
              )}
            </button>

            {/* Fullscreen Portal */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white transition"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Category Pills Slider (Visible on Mobile & Tablet) */}
        <div className="flex md:hidden items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onMouseEnter={() => soundManager.playCardHover()}
                onClick={() => {
                  soundManager.playButtonClick();
                  onCategoryChange(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 scale-102'
                    : 'bg-slate-900/90 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
