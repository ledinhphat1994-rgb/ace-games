import React from 'react';

interface GameCoverProps {
  gameId: string;
  className?: string;
}

export const GameCover: React.FC<GameCoverProps> = ({ gameId, className = '' }) => {
  switch (gameId) {
    case 'tetris':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 ${className}`}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow-t" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* T-Piece (Purple) */}
            <g filter="url(#glow-t)" transform="translate(45, 25) rotate(-10)">
              <rect x="0" y="20" width="22" height="22" rx="3" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1.5" />
              <rect x="22" y="20" width="22" height="22" rx="3" fill="#9333ea" stroke="#e9d5ff" strokeWidth="1.5" />
              <rect x="44" y="20" width="22" height="22" rx="3" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1.5" />
              <rect x="22" y="0" width="22" height="22" rx="3" fill="#c084fc" stroke="#e9d5ff" strokeWidth="1.5" />
            </g>
            {/* I-Piece (Cyan) */}
            <g filter="url(#glow-t)" transform="translate(130, 15) rotate(25)">
              <rect x="0" y="0" width="18" height="18" rx="2.5" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.2" />
              <rect x="0" y="18" width="18" height="18" rx="2.5" fill="#0891b2" stroke="#a5f3fc" strokeWidth="1.2" />
              <rect x="0" y="36" width="18" height="18" rx="2.5" fill="#22d3ee" stroke="#a5f3fc" strokeWidth="1.2" />
              <rect x="0" y="54" width="18" height="18" rx="2.5" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.2" />
            </g>
            {/* O-Piece (Yellow) */}
            <g filter="url(#glow-t)" transform="translate(20, 75)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
              <rect x="20" y="0" width="20" height="20" rx="3" fill="#facc15" stroke="#fef08a" strokeWidth="1.2" />
              <rect x="0" y="20" width="20" height="20" rx="3" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.2" />
              <rect x="20" y="20" width="20" height="20" rx="3" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
            </g>
            {/* L-Piece (Orange) */}
            <g filter="url(#glow-t)" transform="translate(100, 65)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#f97316" stroke="#fed7aa" strokeWidth="1.2" />
              <rect x="0" y="20" width="20" height="20" rx="3" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.2" />
              <rect x="0" y="40" width="20" height="20" rx="3" fill="#f97316" stroke="#fed7aa" strokeWidth="1.2" />
              <rect x="20" y="40" width="20" height="20" rx="3" fill="#fb923c" stroke="#fed7aa" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      );

    case 'chess':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-amber-950 via-slate-900 to-stone-900 ${className}`}>
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#f59e0b_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b_1px,transparent_1px)] bg-[size:24px_24px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="70" r="50" fill="url(#chess-glow)" opacity="0.25" />
            <defs>
              <radialGradient id="chess-glow">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            {/* Chess board perspective */}
            <path d="M20 120 L70 85 L130 85 L180 120 Z" fill="#292524" stroke="#78716c" strokeWidth="1" />
            {/* Golden King Piece */}
            <g transform="translate(68, 30)">
              <path d="M25 15 L35 15 L35 5 L45 5 L45 15 L55 15 L55 25 L45 25 L45 35 L35 35 L35 25 L25 25 Z" fill="#fbbf24" opacity="0.9" />
              <path d="M20 38 Q40 32 60 38 L54 68 Q40 64 26 68 Z" fill="url(#gold-grad)" stroke="#fef08a" strokeWidth="1.5" />
              <path d="M15 68 L65 68 L60 76 L20 76 Z" fill="#d97706" />
            </g>
            {/* Dark Knight Piece */}
            <g transform="translate(108, 45)">
              <path d="M15 60 Q20 30 35 20 Q48 16 46 30 Q52 28 54 36 Q50 48 45 58 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M10 60 L50 60 L46 68 L14 68 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            </g>
            <defs>
              <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'xiangqi':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-rose-950 via-neutral-900 to-amber-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Board lines & River */}
            <line x1="20" y1="70" x2="180" y2="70" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
            <text x="100" y="74" fill="#fb7185" fontSize="10" fontWeight="bold" textAnchor="middle" opacity="0.6" letterSpacing="4">楚河 • 漢界</text>
            {/* Red General Piece (帥) */}
            <g transform="translate(60, 65)">
              <circle cx="0" cy="0" r="30" fill="#fff1f2" stroke="#e11d48" strokeWidth="3.5" />
              <circle cx="0" cy="0" r="26" fill="none" stroke="#e11d48" strokeWidth="1" opacity="0.5" />
              <text x="0" y="11" fill="#be123c" fontSize="28" fontWeight="bold" textAnchor="middle" fontFamily="serif">帥</text>
            </g>
            {/* Black Cannon Piece (砲) */}
            <g transform="translate(140, 50)">
              <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="0" cy="0" r="23" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
              <text x="0" y="10" fill="#38bdf8" fontSize="24" fontWeight="bold" textAnchor="middle" fontFamily="serif">砲</text>
            </g>
          </svg>
        </div>
      );

    case 'breakout':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Rainbow brick rows */}
            <g transform="translate(20, 18)">
              {/* Row 1 - Red */}
              <rect x="0" y="0" width="36" height="10" rx="2" fill="#ef4444" />
              <rect x="41" y="0" width="36" height="10" rx="2" fill="#ef4444" />
              <rect x="82" y="0" width="36" height="10" rx="2" fill="#ef4444" />
              <rect x="123" y="0" width="36" height="10" rx="2" fill="#ef4444" />
              {/* Row 2 - Orange */}
              <rect x="0" y="14" width="36" height="10" rx="2" fill="#f97316" />
              <rect x="41" y="14" width="36" height="10" rx="2" fill="#f97316" />
              <rect x="82" y="14" width="36" height="10" rx="2" fill="#f97316" />
              <rect x="123" y="14" width="36" height="10" rx="2" fill="#f97316" />
              {/* Row 3 - Yellow */}
              <rect x="0" y="28" width="36" height="10" rx="2" fill="#eab308" />
              <rect x="41" y="28" width="36" height="10" rx="2" fill="#eab308" />
              <rect x="82" y="28" width="36" height="10" rx="2" fill="#eab308" />
              <rect x="123" y="28" width="36" height="10" rx="2" fill="#eab308" />
              {/* Row 4 - Cyan */}
              <rect x="0" y="42" width="36" height="10" rx="2" fill="#06b6d4" />
              <rect x="82" y="42" width="36" height="10" rx="2" fill="#06b6d4" />
              <rect x="123" y="42" width="36" height="10" rx="2" fill="#06b6d4" />
            </g>
            {/* Shattered brick particles */}
            <circle cx="80" cy="65" r="2" fill="#06b6d4" />
            <circle cx="85" cy="70" r="3" fill="#38bdf8" />
            <circle cx="72" cy="72" r="2.5" fill="#eab308" />
            <circle cx="92" cy="68" r="2" fill="#f97316" />
            {/* Laser energy ball with trail */}
            <line x1="80" y1="65" x2="110" y2="105" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="82" cy="68" r="7" fill="#ffffff" stroke="#38bdf8" strokeWidth="3" />
            {/* Paddle */}
            <rect x="80" y="112" width="65" height="11" rx="5" fill="url(#paddle-g)" stroke="#38bdf8" strokeWidth="1.5" />
            <defs>
              <linearGradient id="paddle-g" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case '2048':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Floating small cubes */}
            <g transform="translate(25, 20) rotate(-12)">
              <rect width="42" height="42" rx="8" fill="#f97316" />
              <text x="21" y="27" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">1024</text>
            </g>
            <g transform="translate(135, 15) rotate(15)">
              <rect width="38" height="38" rx="7" fill="#eab308" />
              <text x="19" y="24" fill="#ffffff" fontSize="15" fontWeight="900" textAnchor="middle">512</text>
            </g>
            {/* Big center 2048 golden cube */}
            <g transform="translate(58, 48)">
              <rect width="84" height="74" rx="14" fill="url(#gold-2048)" stroke="#fef08a" strokeWidth="2.5" />
              <text x="42" y="47" fill="#ffffff" fontSize="30" fontWeight="900" textAnchor="middle" letterSpacing="-1">2048</text>
              <circle cx="70" cy="16" r="3" fill="#ffffff" opacity="0.8" />
            </g>
            <defs>
              <linearGradient id="gold-2048" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'snake':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-green-950 ${className}`}>
          {/* Cyber grid */}
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:14px_14px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Snake glowing body */}
            <path
              d="M30 100 L80 100 L80 60 L140 60 L140 35 L160 35"
              stroke="#10b981"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M30 100 L80 100 L80 60 L140 60 L140 35 L160 35"
              stroke="#6ee7b7"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Snake Head with eyes */}
            <circle cx="160" cy="35" r="9" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
            <circle cx="163" cy="32" r="2.5" fill="#ffffff" />
            <circle cx="163" cy="38" r="2.5" fill="#ffffff" />
            {/* Glowing Apple */}
            <circle cx="180" cy="35" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="2" />
            <path d="M180 28 Q182 23 186 24" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'flappy':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-sky-900 via-cyan-900 to-amber-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Distant Clouds */}
            <ellipse cx="60" cy="35" rx="30" ry="12" fill="#ffffff" opacity="0.15" />
            <ellipse cx="150" cy="25" rx="24" ry="10" fill="#ffffff" opacity="0.15" />
            {/* Pipes */}
            <g transform="translate(135, 0)">
              {/* Top pipe */}
              <rect x="4" y="0" width="32" height="45" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              <rect x="0" y="45" width="40" height="12" rx="2" fill="#16a34a" stroke="#15803d" strokeWidth="2" />
              {/* Bottom pipe */}
              <rect x="0" y="95" width="40" height="12" rx="2" fill="#16a34a" stroke="#15803d" strokeWidth="2" />
              <rect x="4" y="107" width="32" height="35" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
            </g>
            {/* Flappy Bird */}
            <g transform="translate(65, 62)">
              <circle cx="16" cy="16" r="15" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
              <ellipse cx="10" cy="18" rx="8" ry="5" fill="#f59e0b" />
              <circle cx="21" cy="12" r="5" fill="#ffffff" />
              <circle cx="23" cy="12" r="2" fill="#000000" />
              <path d="M22 17 L33 21 L22 25 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
            </g>
          </svg>
        </div>
      );

    case 'caro':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 ${className}`}>
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] bg-[size:20px_20px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Glowing X (Cyan) */}
            <g transform="translate(55, 65)">
              <line x1="-28" y1="-28" x2="28" y2="28" stroke="#06b6d4" strokeWidth="9" strokeLinecap="round" />
              <line x1="28" y1="-28" x2="-28" y2="28" stroke="#06b6d4" strokeWidth="9" strokeLinecap="round" />
              <line x1="-28" y1="-28" x2="28" y2="28" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" />
              <line x1="28" y1="-28" x2="-28" y2="28" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* Glowing O (Hot Pink / Magenta) */}
            <g transform="translate(145, 65)">
              <circle cx="0" cy="0" r="28" stroke="#ec4899" strokeWidth="9" fill="none" />
              <circle cx="0" cy="0" r="28" stroke="#fbcfe8" strokeWidth="3" fill="none" />
            </g>
          </svg>
        </div>
      );

    case 'minesweeper':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-red-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Hazard diagonal stripes on top right */}
            <g opacity="0.15">
              {[-40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map(x => (
                <line key={x} x1={x} y1="0" x2={x + 50} y2="140" stroke="#ef4444" strokeWidth="8" />
              ))}
            </g>
            {/* High-tech Naval Mine */}
            <g transform="translate(100, 70)">
              {/* Spikes */}
              {[-60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270].map(angle => (
                <line
                  key={angle}
                  x1="0"
                  y1="0"
                  x2={Math.cos((angle * Math.PI) / 180) * 44}
                  y2={Math.sin((angle * Math.PI) / 180) * 44}
                  stroke="#71717a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              ))}
              <circle cx="0" cy="0" r="32" fill="#18181b" stroke="#ef4444" strokeWidth="3" />
              <circle cx="0" cy="0" r="20" fill="#27272a" />
              {/* Blinking Red Center Diode */}
              <circle cx="0" cy="0" r="9" fill="#ef4444" />
              <circle cx="-3" cy="-3" r="3" fill="#fca5a5" />
            </g>
            {/* Red Digital LED display */}
            <g transform="translate(18, 20)">
              <rect width="44" height="20" rx="3" fill="#09090b" stroke="#3f3f46" strokeWidth="1" />
              <text x="22" y="15" fill="#ef4444" fontSize="13" fontWeight="900" fontFamily="monospace" textAnchor="middle">088</text>
            </g>
          </svg>
        </div>
      );

    case 'memory':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-pink-950 via-purple-950 to-indigo-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Card 1 - Back */}
            <g transform="translate(48, 25) rotate(-10)">
              <rect width="48" height="70" rx="8" fill="#4c1d95" stroke="#c084fc" strokeWidth="2" />
              <rect x="4" y="4" width="40" height="62" rx="5" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="24" cy="35" r="10" fill="#7e22ce" stroke="#e9d5ff" strokeWidth="1.5" />
              <text x="24" y="39" fill="#f5d0fe" fontSize="12" textAnchor="middle">✦</text>
            </g>
            {/* Card 2 - Front matching Diamond */}
            <g transform="translate(105, 35) rotate(14)">
              <rect width="48" height="70" rx="8" fill="#fdf4ff" stroke="#ec4899" strokeWidth="2.5" />
              <rect x="4" y="4" width="40" height="62" rx="5" fill="#fae8ff" />
              <text x="24" y="43" fill="#db2777" fontSize="24" textAnchor="middle">💎</text>
            </g>
            {/* Sparkles */}
            <circle cx="40" cy="110" r="2" fill="#f472b6" />
            <circle cx="165" cy="115" r="3" fill="#c084fc" />
            <circle cx="175" cy="40" r="2" fill="#fbcfe8" />
          </svg>
        </div>
      );

    default:
      return (
        <div className={`w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center ${className}`}>
          <span className="text-5xl">🎮</span>
        </div>
      );
  }
};
