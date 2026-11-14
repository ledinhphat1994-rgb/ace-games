import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, Search, Volume2, VolumeX, Music, Dices, Settings } from 'lucide-react';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Synchronize sound and music states
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundOn(soundManager.isSoundOn());
      setMusicOn(soundManager.isMusicOn());
    });
    return unsubscribe;
  }, []);

  const toggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
  };

  const toggleMusic = () => {
    const next = soundManager.toggleMusic();
    setMusicOn(next);
  };

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories: { id: GameCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả', icon: '🔥' },
    { id: 'favorites', label: 'Yêu Thích', icon: '❤️' },
    { id: 'strategy', label: 'Cờ & Đấu Trí', icon: '♟️' },
    { id: 'arcade', label: 'Arcade & Bắn Súng', icon: '🚀' },
    { id: 'classic', label: 'Kinh Điển', icon: '🕹️' },
    { id: 'puzzle', label: 'Giải Đố & Số', icon: '🧩' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
      {/* Top Bar: Logo (Vùng 1+), Search Bar, and Settings Button (Vùng 2) */}
      <div className="w-full px-3 sm:px-6 py-2.5">
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

          {/* VÙNG 2: Settings Icon Button (Gộp toàn bộ cài đặt âm thanh, nhạc nền vào 1 icon) */}
          <div className="relative flex-shrink-0" ref={settingsRef}>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setSettingsOpen(prev => !prev);
              }}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-md ${
                settingsOpen || musicOn || soundOn
                  ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
              }`}
              title="Cài đặt âm thanh & nhạc nền"
            >
              <Settings className={`w-5 h-5 transition-transform duration-300 ${settingsOpen ? 'rotate-90 text-cyan-400' : ''}`} />
            </button>

            {/* Cyberpunk Settings Popover Menu */}
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl shadow-cyan-500/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider">
                  <span>Cài Đặt Âm Thanh</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Audio Hub</span>
                </div>

                {/* Sound FX Toggle */}
                <div className="flex items-center justify-between py-2 px-1">
                  <div className="flex items-center gap-2">
                    {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                    <span className="text-xs font-semibold text-gray-200">Hiệu Ứng Game</span>
                  </div>
                  <button
                    onClick={toggleSound}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                      soundOn
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-800 text-gray-500 border border-slate-700'
                    }`}
                  >
                    {soundOn ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Music Toggle */}
                <div className="flex items-center justify-between py-2 px-1">
                  <div className="flex items-center gap-2">
                    <Music className={`w-4 h-4 ${musicOn ? 'text-fuchsia-400 animate-bounce' : 'text-gray-500'}`} />
                    <span className="text-xs font-semibold text-gray-200">Nhạc Nền Arcade</span>
                  </div>
                  <button
                    onClick={toggleMusic}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition ${
                      musicOn
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/20'
                        : 'bg-slate-800 text-gray-500 border border-slate-700'
                    }`}
                  >
                    {musicOn ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Bar with VÙNG 1 moved into VÙNG 2 right beside the last category button */}
      <div className="w-full border-t border-white/5 bg-slate-950/50">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 ${
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

          {/* VÙNG 1 ĐƯA VÀO VÙNG 2 SÁT BÊN: Nút Ngẫu Nhiên nằm ngay sau nút Giải Đố & Số */}
          <button
            onClick={() => {
              soundManager.playGameLaunch();
              onRandomGame();
            }}
            onMouseEnter={() => soundManager.playCardHover()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition flex-shrink-0 cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 whitespace-nowrap"
            title="Chơi ngẫu nhiên 1 trò chơi"
          >
            <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-extrabold">Ngẫu Nhiên</span>
          </button>
        </div>
      </div>
    </header>
  );
};
