import React from 'react';
import { Gamepad2, Search } from 'lucide-react';
import type { GameCategory } from '../types/game';

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
  const categories: { id: GameCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả Game', icon: '🔥' },
    { id: 'favorites', label: 'Yêu Thích', icon: '❤️' },
    { id: 'strategy', label: 'Cờ & Chiến Thuật', icon: '♟️' },
    { id: 'classic', label: 'Kinh Điển Arcade', icon: '🕹️' },
    { id: 'puzzle', label: 'Trí Tuệ & Số', icon: '🧩' },
    { id: 'arcade', label: 'Phản Xạ Nhanh', icon: '⚡' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-arcade-bg/95 backdrop-blur-md border-b border-arcade-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar: Logo & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 font-['Orbitron']">
                  ACE GAMES
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                  VIP
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Đấu Trường Game Trực Tuyến Đỉnh Cao</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm tựa game yêu thích..."
              className="w-full pl-10 pr-4 py-2 bg-arcade-card/90 border border-arcade-border text-sm text-gray-200 placeholder-gray-500 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
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
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 scale-100'
                    : 'bg-arcade-card text-gray-400 hover:text-gray-200 hover:bg-arcade-hover border border-arcade-border/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
