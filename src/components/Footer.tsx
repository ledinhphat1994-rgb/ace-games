import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-gray-500 mt-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center justify-center">
        <span className="text-gray-400 flex items-center gap-1.5 text-xs font-medium tracking-wider">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
        </span>
      </div>
    </footer>
  );
};
