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
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPlay,
  isFavorite = false,
  onToggleFavorite,
  isFeatured = false,
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

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer select-none transition-all duration-300 ease-out border border-white/10 hover:border-cyan-400 hover:shadow-[0_10px_35px_rgba(6,182,212,0.45)] hover:-translate-y-2 hover:scale-[1.04] bg-slate-900 aspect-[4/3] ${
        isFeatured ? 'col-span-2 row-span-2 aspect-square sm:aspect-[16/10]' : 'col-span-1 row-span-1'
      }`}
    >
      {/* Visual Game Artwork Cover */}
      <div className="absolute inset-0 w-full h-full transform transition-transform duration-500 ease-out group-hover:scale-110">
        <GameCover gameId={game.id} className="w-full h-full" />
      </div>

      {/* Shimmer Light Reflection on Hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      </div>

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {game.isHot && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-rose-500/50 animate-pulse">
              <Flame className="w-3 h-3 fill-white" /> HOT
            </span>
          )}
          {game.isNew && (
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-emerald-500/50">
              <Sparkles className="w-3 h-3 fill-white" /> MỚI
            </span>
          )}
          {isFeatured && (
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-400/50 font-mono">
              ★ NỔI BẬT
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
                ? 'bg-rose-500 text-white shadow-rose-500/60 scale-110'
                : 'bg-black/50 text-white/80 hover:bg-black/80 hover:text-rose-400'
            }`}
            title={isFavorite ? 'Bỏ thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Center Hover Action (Glowing Play Button) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.8)] opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0 scale-75 group-hover:scale-100 transition-all duration-200">
          <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
        </div>
      </div>

      {/* Bottom Title Scrim (Clean & Focused on Game Visuals) */}
      <div className="absolute inset-x-0 bottom-0 z-10 pt-10 pb-2.5 px-3 sm:px-3.5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition-colors truncate drop-shadow-md">
            {game.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 flex-shrink-0 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/5">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{game.rating}</span>
        </div>
      </div>

      {/* Glowing Neon Bezel */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/10 group-hover:ring-cyan-400/60 pointer-events-none transition-colors" />
    </div>
  );
};
