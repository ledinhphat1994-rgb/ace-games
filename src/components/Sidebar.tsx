import React from 'react';
import {
  Home,
  Dices,
  Heart,
  Gamepad2,
  Sword,
  Puzzle,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { GameCategory } from '../types/game';
import { soundManager } from '../utils/sound';

interface SidebarProps {
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
  onRandomGame: () => void;
  favoritesCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  onRandomGame,
  favoritesCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const mainNav = [
    { id: 'all' as GameCategory, label: 'Trang Chủ', icon: Home },
    { id: 'favorites' as GameCategory, label: 'Yêu Thích', icon: Heart, count: favoritesCount, countColor: 'bg-rose-500' },
  ];

  const categoriesNav = [
    { id: 'strategy' as GameCategory, label: 'Cờ & Đấu Trí', icon: Sword, badge: 'AI' },
    { id: 'classic' as GameCategory, label: 'Arcade Cổ Điển', icon: Gamepad2, badge: 'Hot' },
    { id: 'arcade' as GameCategory, label: 'Bắn Súng & Phản Xạ', icon: Rocket },
    { id: 'puzzle' as GameCategory, label: 'Trí Tuệ & Số Học', icon: Puzzle },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 z-30 sticky top-16 h-[calc(100vh-4rem)] bg-[#090d1a]/95 border-r border-white/10 backdrop-blur-xl ${
        isCollapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Top Collapse Button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        {!isCollapsed && (
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Danh Mục
          </span>
        )}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onToggleCollapse();
          }}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white transition mx-auto border border-white/5"
          title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
        {/* Main Nav */}
        {mainNav.map(item => {
          const Icon = item.icon;
          const isActive = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              onMouseEnter={() => soundManager.playCardHover()}
              onClick={() => {
                soundManager.playButtonClick();
                onSelectCategory(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-slate-900/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && typeof item.count === 'number' && item.count > 0 && (
                <span className={`ml-auto text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${item.countColor || 'bg-slate-700'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Random Game Action Button (CrazyGames Feature) */}
        <button
          onMouseEnter={() => soundManager.playCardHover()}
          onClick={() => {
            soundManager.playGameLaunch();
            onRandomGame();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-extrabold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all duration-200 group ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Chọn ngẫu nhiên 1 game"
        >
          <Dices className="w-5 h-5 text-amber-400 group-hover:rotate-180 transition-transform duration-500 flex-shrink-0" />
          {!isCollapsed && <span>Game Ngẫu Nhiên</span>}
        </button>

        {/* Divider */}
        <div className="pt-3 pb-1 px-3">
          <div className="h-px bg-white/10" />
        </div>

        {/* Categories Section */}
        {!isCollapsed && (
          <div className="px-3 py-1">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Thể Loại</span>
          </div>
        )}

        {categoriesNav.map(item => {
          const Icon = item.icon;
          const isActive = selectedCategory === item.id;
          return (
            <button
              key={item.id}
              onMouseEnter={() => soundManager.playCardHover()}
              onClick={() => {
                soundManager.playButtonClick();
                onSelectCategory(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-slate-900/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-400/15 border border-cyan-400/30 px-1.5 py-0.2 rounded-md">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-white/5 bg-slate-950/60 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>2,530 Người Chơi</span>
          </div>
          <p className="text-[10px] text-gray-500">Ace Games v2.0 • CrazyGames Mode</p>
        </div>
      ) : (
        <div className="p-2 border-t border-white/5 text-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" title="2,530 Online" />
        </div>
      )}
    </aside>
  );
};
