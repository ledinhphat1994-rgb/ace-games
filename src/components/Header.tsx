import React, { useState } from 'react';
import { Gamepad2, Search, Volume2, VolumeX, Music, Dices, Maximize, Minimize } from 'lucide-react';
import type { GameCategory } from '../types/game';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: GameCategory;
  onCategoryChange: (cat: GameCategory) => void;
  onRandomGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRandomGame,
}) => {
  const [soundOn, setSoundOn] = useState(() => soundManager.isSoundOn());
  const [musicOn, setMusicOn] = useState(() => soundManager.isMusicOn());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
  };

  const toggleMusic = () => {
    const next = soundManager.toggleMusic();
    setMusicOn(next);
  };

  const toggleFullscreen = () => {
    soundManager.playButtonClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const categories: { id: GameCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả', icon: '🔥' },
    { id: 'favorites', label: 'Yêu Thích', icon: '❤️' },
    { id: 'strategy', label: 'Cờ & Đấu Trí', icon: '♟️' },
    { id: 'arcade', label: 'Arcade & Bắn Súng', icon: '🚀' },
    { id: 'classic', label: 'Kinh Điển', icon: '🕹️' },
    { id: 'puzzle', label: 'Giải Đố & Số', icon: '🧩' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5">
        {/* Main Header Bar - Full width with Logo at Vùng 1+ (Top-Left Corner) */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo - VÙNG 1+ (Góc trên cùng bên trái) */}
          <div
            onClick={() => {
              soundManager.playButtonClick();
              onCategoryChange('all');
            }}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
            title="Ace Games - Trang chủ"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-400/50 transition-all duration-300">
              <Gamepad2 className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300 font-['Orbitron']">
                ACE GAMES
              </span>
            </div>
          </div>

          {/* Search Bar - Center Balanced */}
          <div className="relative flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm trò chơi..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-gray-100 placeholder-gray-500 rounded-2xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
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

          {/* Action Buttons: Sound, Music, Random, Fullscreen */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Random Game Dice Button */}
            <button
              onClick={() => {
                soundManager.playGameLaunch();
                onRandomGame();
              }}
              onMouseEnter={() => soundManager.playCardHover()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition text-xs font-bold"
              title="Chơi ngẫu nhiên 1 game"
            >
              <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden lg:inline">Ngẫu Nhiên</span>
            </button>

            {/* Background Music Toggle */}
            <button
              onClick={toggleMusic}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                musicOn
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 shadow-sm shadow-fuchsia-500/30'
                  : 'bg-slate-900 border-slate-800 text-gray-500 hover:text-gray-300'
              }`}
              title={musicOn ? 'Nhạc nền: ĐANG BẬT' : 'Nhạc nền: TẮT (Bấm để bật)'}
            >
              <Music className={`w-4 h-4 ${musicOn ? 'text-fuchsia-400 animate-bounce' : 'text-gray-500'}`} />
              <span className="hidden md:inline">Nhạc Nền</span>
            </button>

            {/* UI Sound Effects Toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition ${
                soundOn
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-900 border-slate-800 text-gray-500 hover:text-gray-300'
              }`}
              title={soundOn ? 'Âm thanh: ĐANG BẬT' : 'Âm thanh: TẮT (Bấm để bật)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              <span className="hidden md:inline">Âm Thanh</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white transition"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Category Pills Bar (Centered strictly in the Central Content Arena between the 2 vertical lines) */}
        <div className="max-w-[1360px] mx-auto flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
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
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300 scale-102 font-black'
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
