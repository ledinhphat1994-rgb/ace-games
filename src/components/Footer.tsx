import React from 'react';
import { Gamepad2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-md py-6 text-xs text-gray-500 mt-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="font-black text-white font-['Orbitron'] tracking-wider">ACE GAMES</span>
          <span className="text-gray-600">|</span>
          <span>© 2026 Đấu trường Web Game HTML5 Miễn Phí</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-[11px] text-gray-400">
          <a href="#privacy" className="hover:text-cyan-400 transition">Chính Sách Bảo Mật</a>
          <a href="#terms" className="hover:text-cyan-400 transition">Điều Khoản</a>
          <span className="text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Gamers
          </span>
        </div>
      </div>
    </footer>
  );
};
