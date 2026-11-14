import React from 'react';
import { Play, Star, Flame, Sparkles, Heart } from 'lucide-react';
import type { GameInfo } from '../types/game';

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
  return (
    <div
      onClick={() => onPlay(game)}
      className={`group relative bg-slate-900/90 hover:bg-slate-800/95 border transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden ${
        isFeatured
          ? 'md:col-span-2 md:row-span-1 border-cyan-500/60 shadow-lg shadow-cyan-500/10 rounded-3xl p-5 sm:p-6'
          : 'border-slate-800 hover:border-cyan-500/50 hover:shadow-cyan-500/10 rounded-2xl p-4'
      }`}
    >
      {/* Top subtle highlight line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-400 opacity-60 transition-opacity" />

      {/* Top Badges & Favorite Button */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-1.5">
          {game.isHot && (
            <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full shadow-sm">
              <Flame className="w-3 h-3 fill-rose-400" /> HOT
            </span>
          )}
          {game.isNew && (
            <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3" /> MỚI
            </span>
          )}
          {isFeatured && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
              👑 NỔI BẬT
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, game.id)}
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-gray-400 hover:text-rose-400 transition-colors"
            title={isFavorite ? 'Bỏ thích' : 'Thêm vào yêu thích'}
          >
            <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Center content */}
      <div className="flex items-start gap-4">
        {/* Game Icon */}
        <div
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${game.accentColor} border border-white/20 shadow-lg text-white group-hover:scale-105 transition-transform duration-300 flex-shrink-0 ${
            isFeatured ? 'w-20 h-20 text-4xl' : 'w-16 h-16 text-3xl'
          }`}
        >
          {game.thumbnailIcon}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-0.5">
            {game.categoryLabel}
          </span>
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors truncate">
            {game.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>
        </div>
      </div>

      {/* Footer stats & Play CTA */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-extrabold text-gray-100">{game.rating}</span>
          </div>
          <span>•</span>
          <span className="font-mono text-gray-400">{game.plays.toLocaleString()} lượt</span>
        </div>

        <button className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 group-hover:from-cyan-300 group-hover:to-sky-300 px-3.5 py-1.5 rounded-xl shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-400/30 transition-all duration-200">
          <Play className="w-3.5 h-3.5 fill-slate-950" /> Chơi Ngay
        </button>
      </div>
    </div>
  );
};
