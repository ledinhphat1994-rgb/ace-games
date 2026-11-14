import React from 'react';
import { Play, Star, Flame, Sparkles, Heart } from 'lucide-react';
import type { GameInfo } from '../types/game';
import { GameCover } from './GameCover';
import { soundManager } from '../utils/sound';

interface GameCardProps {
  game: GameInfo;
  onPlay: (game: GameInfo) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, gameId: string) => void;
  isFeatured?: boolean;
  size?: 'normal' | 'wide' | 'tall';
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPlay,
  isFavorite = false,
  onToggleFavorite,
  isFeatured = false,
  size = 'normal',
}) => {
  const handleMouseEnter = () => {
    soundManager.playCardHover();
  };

  const handleClick = () => {
    soundManager.playGameLaunch();
    onPlay(game);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playFavorite();
    if (onToggleFavorite) {
      onToggleFavorite(e, game.id);
    }
  };

  // Bento layout column & row classes
  const sizeClasses = isFeatured
    ? 'col-span-1 sm:col-span-2 lg:col-span-2 row-span-2 aspect-[16/11] sm:aspect-[16/10]'
    : size === 'wide'
    ? 'col-span-1 sm:col-span-2 row-span-1 aspect-[16/9]'
    : 'col-span-1 row-span-1 aspect-[4/3]';

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none transition-all duration-300 ease-out border border-slate-800/80 hover:border-cyan-400 hover:shadow-[0_12px_35px_rgba(6,182,212,0.35)] hover:-translate-y-2 hover:scale-[1.02] bg-slate-900 ${sizeClasses}`}
    >
      {/* Visual Game Artwork Cover */}
      <div className="absolute inset-0 w-full h-full transform transition-transform duration-500 ease-out group-hover:scale-108">
        <GameCover gameId={game.id} className="w-full h-full" />
      </div>

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {game.isHot && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/40 animate-pulse">
              <Flame className="w-3 h-3 fill-white" /> HOT
            </span>
          )}
          {game.isNew && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/40">
              <Sparkles className="w-3 h-3 fill-white" /> MỚI
            </span>
          )}
          {isFeatured && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-400/40 font-mono">
              ★ TOP #1
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all duration-200 active:scale-125 shadow-md ${
              isFavorite
                ? 'bg-rose-500/90 text-white shadow-rose-500/50'
                : 'bg-black/50 text-white/80 hover:bg-black/80 hover:text-rose-400'
            }`}
            title={isFavorite ? 'Bỏ thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Center Hover Action (Play Button pops up) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.8)] opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 scale-90 group-hover:scale-100 transition-all duration-200">
          <Play className="w-4 h-4 fill-slate-950" />
          <span>Chơi Ngay</span>
        </div>
      </div>

      {/* Bottom Scrim & Info */}
      <div className="absolute inset-x-0 bottom-0 z-10 pt-16 pb-3 px-3.5 sm:px-4 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent flex flex-col justify-end">
        <span className="text-[10px] font-extrabold text-cyan-400 tracking-wider uppercase drop-shadow-sm mb-0.5 block">
          {game.categoryLabel}
        </span>
        <h3 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors truncate drop-shadow-md">
          {game.title}
        </h3>

        {/* Rating and plays */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-gray-300 font-medium">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{game.rating}</span>
          </div>
          <span className="text-gray-400 text-[10px]">{(game.plays / 1000).toFixed(0)}k lượt chơi</span>
        </div>
      </div>

      {/* Subtle shine rim */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/10 group-hover:ring-cyan-400/40 pointer-events-none transition-colors" />
    </div>
  );
};
