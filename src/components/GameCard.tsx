import React from 'react';
import { Play, Star, Flame, Sparkles } from 'lucide-react';
import type { GameInfo } from '../types/game';

interface GameCardProps {
  game: GameInfo;
  onPlay: (game: GameInfo) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  return (
    <div
      onClick={() => onPlay(game)}
      className="group relative bg-arcade-card hover:bg-arcade-hover border border-arcade-border/70 hover:border-indigo-500/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        {game.isHot && (
          <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full shadow-sm">
            <Flame className="w-3 h-3 fill-rose-400" /> HOT
          </span>
        )}
        {game.isNew && (
          <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-3 h-3" /> MỚI
          </span>
        )}
      </div>

      {/* Icon & Category */}
      <div>
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 text-3xl mb-3 shadow-inner group-hover:scale-105 transition-transform duration-200">
          {game.thumbnailIcon}
        </div>

        <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
          {game.categoryLabel}
        </span>
        <h3 className="text-base font-bold text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
          {game.title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Footer info: Rating, Plays count & Play Button */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-arcade-border/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span className="font-bold text-gray-200">{game.rating}</span>
          </div>
          <span>•</span>
          <span>{game.plays.toLocaleString()} lượt</span>
        </div>

        <button className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 group-hover:bg-indigo-500 px-3 py-1.5 rounded-xl shadow-md group-hover:shadow-indigo-500/25 transition">
          <Play className="w-3 h-3 fill-white" /> Chơi
        </button>
      </div>
    </div>
  );
};
