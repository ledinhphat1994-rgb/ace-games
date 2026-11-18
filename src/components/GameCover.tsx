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

    case 'space-shooter':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950 ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stars */}
            <circle cx="30" cy="20" r="1" fill="#ffffff" opacity="0.6" />
            <circle cx="170" cy="30" r="1.5" fill="#38bdf8" opacity="0.8" />
            <circle cx="80" cy="80" r="1" fill="#ffffff" opacity="0.4" />
            <circle cx="150" cy="90" r="1.2" fill="#ffffff" opacity="0.5" />
            {/* Enemy Alien ships */}
            <g transform="translate(40, 25)">
              <rect width="24" height="16" rx="4" fill="#f43f5e" stroke="#fda4af" strokeWidth="1" />
              <circle cx="7" cy="8" r="2" fill="#ffffff" />
              <circle cx="17" cy="8" r="2" fill="#ffffff" />
            </g>
            <g transform="translate(85, 20)">
              <rect width="30" height="18" rx="4" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1" />
              <circle cx="9" cy="9" r="2.5" fill="#ffffff" />
              <circle cx="21" cy="9" r="2.5" fill="#ffffff" />
            </g>
            <g transform="translate(135, 25)">
              <rect width="24" height="16" rx="4" fill="#ec4899" stroke="#fbcfe8" strokeWidth="1" />
              <circle cx="7" cy="8" r="2" fill="#ffffff" />
              <circle cx="17" cy="8" r="2" fill="#ffffff" />
            </g>
            {/* Cyan Laser Blasts */}
            <rect x="98" y="55" width="4" height="16" rx="2" fill="#38bdf8" />
            <rect x="106" y="50" width="4" height="16" rx="2" fill="#38bdf8" />
            {/* Hero Spaceship */}
            <g transform="translate(82, 85)">
              <polygon points="20,0 40,35 20,28 0,35" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5" />
              <polygon points="20,10 26,26 14,26" fill="#0284c7" />
              {/* Thrust fire */}
              <polygon points="15,29 25,29 20,40" fill="#f97316" />
            </g>
          </svg>
        </div>
      );

    case 'sudoku':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 ${className}`}>
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:14px_14px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="sudoku-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Sudoku 3x3 block visual */}
            <g transform="translate(50, 20)">
              {/* Outer block container */}
              <rect x="0" y="0" width="100" height="100" rx="16" fill="#0b1120" stroke="#06b6d4" strokeWidth="2.5" opacity="0.9" />
              {/* Inner grid lines */}
              <line x1="33" y1="4" x2="33" y2="96" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
              <line x1="67" y1="4" x2="67" y2="96" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
              <line x1="4" y1="33" x2="96" y2="33" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
              <line x1="4" y1="67" x2="96" y2="67" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
              {/* Highlight active cell */}
              <rect x="36" y="36" width="28" height="28" rx="8" fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.5" />
              {/* Numbers inside cells */}
              <text x="17" y="24" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">5</text>
              <text x="50" y="24" fill="#67e8f9" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">3</text>
              <text x="83" y="24" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">8</text>
              
              <text x="17" y="57" fill="#67e8f9" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">9</text>
              <text x="50" y="57" fill="#facc15" fontSize="20" fontWeight="900" fontFamily="monospace" textAnchor="middle" filter="url(#sudoku-glow)">7</text>
              <text x="83" y="57" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">1</text>
              
              <text x="17" y="90" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">2</text>
              <text x="50" y="90" fill="#67e8f9" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">6</text>
              <text x="83" y="90" fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="monospace" textAnchor="middle">4</text>
            </g>
          </svg>
        </div>
      );

    case 'pong':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-rose-950 ${className}`}>
          {/* Cyberpunk grid */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="pong-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pong-glow-rose" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pong-ball-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background scoreboard numbers */}
            <text x="60" y="78" fill="#06b6d4" opacity="0.12" fontSize="56" fontWeight="900" fontFamily="monospace" textAnchor="middle">3</text>
            <text x="140" y="78" fill="#f43f5e" opacity="0.12" fontSize="56" fontWeight="900" fontFamily="monospace" textAnchor="middle">5</text>

            {/* Center dashed neon line */}
            <line x1="100" y1="0" x2="100" y2="140" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6 6" opacity="0.35" />

            {/* Left Paddle (Cyan) */}
            <g filter="url(#pong-glow-cyan)">
              <rect x="18" y="45" width="6" height="42" rx="3" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1" />
            </g>

            {/* Right Paddle (Rose) */}
            <g filter="url(#pong-glow-rose)">
              <rect x="176" y="55" width="6" height="42" rx="3" fill="#f43f5e" stroke="#fecdd3" strokeWidth="1" />
            </g>

            {/* Ball Motion Trail */}
            <circle cx="72" cy="74" r="2.5" fill="#38bdf8" opacity="0.25" />
            <circle cx="85" cy="70" r="3.5" fill="#38bdf8" opacity="0.45" />
            <circle cx="102" cy="65" r="4.5" fill="#38bdf8" opacity="0.65" />
            <circle cx="120" cy="60" r="5.5" fill="#38bdf8" opacity="0.85" />

            {/* Ball Glowing */}
            <g filter="url(#pong-ball-glow)">
              <circle cx="138" cy="56" r="6.5" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
            </g>

            {/* Sparks near collision */}
            <circle cx="148" cy="50" r="1.5" fill="#f43f5e" opacity="0.8" />
            <circle cx="152" cy="58" r="1.5" fill="#22d3ee" opacity="0.8" />
            <circle cx="145" cy="65" r="1.5" fill="#f59e0b" opacity="0.8" />
          </svg>
        </div>
      );

    case 'onet':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-teal-950 via-slate-900 to-emerald-950 ${className}`}>
          {/* Subtle Grid Dot Matrix */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] bg-[size:14px_14px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="onet-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="onet-tile-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="onet-card-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#134e4a" />
                <stop offset="100%" stopColor="#042f2e" />
              </linearGradient>
            </defs>

            {/* Inactive background tiles */}
            <g opacity="0.35">
              <rect x="25" y="20" width="32" height="32" rx="8" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
              <text x="41" y="42" fill="#5eead4" fontSize="16" textAnchor="middle">🦊</text>

              <rect x="145" y="20" width="32" height="32" rx="8" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
              <text x="161" y="42" fill="#5eead4" fontSize="16" textAnchor="middle">🐸</text>

              <rect x="25" y="88" width="32" height="32" rx="8" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
              <text x="41" y="110" fill="#5eead4" fontSize="16" textAnchor="middle">🐯</text>

              <rect x="145" y="88" width="32" height="32" rx="8" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
              <text x="161" y="110" fill="#5eead4" fontSize="16" textAnchor="middle">🐰</text>
            </g>

            {/* Neon Connection Line (3 segments with 2 corner turns) */}
            <g filter="url(#onet-glow)">
              <path
                d="M 52 48 L 52 70 L 148 70 L 148 48"
                stroke="#14b8a6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
              <path
                d="M 52 48 L 52 70 L 148 70 L 148 48"
                stroke="#5eead4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="52" cy="70" r="4.5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="148" cy="70" r="4.5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
            </g>

            {/* Electric pulses & sparkles along line */}
            <circle cx="100" cy="70" r="3" fill="#ffffff" filter="url(#onet-glow)" />
            <circle cx="85" cy="70" r="1.5" fill="#fde047" />
            <circle cx="115" cy="70" r="1.5" fill="#fde047" />

            {/* Matching Pair Tile 1 (Left Panda) */}
            <g transform="translate(34, 16)" filter="url(#onet-tile-glow)">
              <rect width="36" height="36" rx="9" fill="url(#onet-card-bg)" stroke="#2dd4bf" strokeWidth="2" />
              <rect x="2.5" y="2.5" width="31" height="31" rx="7" fill="none" stroke="#5eead4" strokeWidth="0.8" opacity="0.6" />
              <text x="18" y="25" fontSize="20" textAnchor="middle" className="select-none">🐼</text>
            </g>

            {/* Matching Pair Tile 2 (Right Panda) */}
            <g transform="translate(130, 16)" filter="url(#onet-tile-glow)">
              <rect width="36" height="36" rx="9" fill="url(#onet-card-bg)" stroke="#2dd4bf" strokeWidth="2" />
              <rect x="2.5" y="2.5" width="31" height="31" rx="7" fill="none" stroke="#5eead4" strokeWidth="0.8" opacity="0.6" />
              <text x="18" y="25" fontSize="20" textAnchor="middle" className="select-none">🐼</text>
            </g>

            {/* Floating Sparkles & Connection Badge */}
            <circle cx="82" cy="30" r="2" fill="#5eead4" opacity="0.8" />
            <circle cx="118" cy="30" r="1.5" fill="#facc15" opacity="0.8" />
            <circle cx="100" cy="98" r="2" fill="#2dd4bf" opacity="0.6" />

            <g transform="translate(76, 102)">
              <rect width="48" height="18" rx="9" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1" opacity="0.9" />
              <text x="24" y="13" fill="#ccfbf1" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">MATCH!</text>
            </g>
          </svg>
        </div>
      );

    case 'pacman':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 ${className}`}>
          {/* Retro Arcade Grid Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#1d4ed8_1px,transparent_1px),linear-gradient(to_bottom,#1d4ed8_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="pac-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ghost-glow-red" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pellet-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Neon Blue Maze Borders */}
            <rect x="14" y="14" width="172" height="112" rx="10" fill="none" stroke="#1d4ed8" strokeWidth="2.5" opacity="0.7" />
            <rect x="16" y="16" width="168" height="108" rx="8" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />

            {/* Top & Bottom Obstacle Blocks */}
            <rect x="36" y="30" width="34" height="16" rx="4" fill="#090d16" stroke="#2563eb" strokeWidth="1.5" />
            <rect x="130" y="30" width="34" height="16" rx="4" fill="#090d16" stroke="#2563eb" strokeWidth="1.5" />
            <rect x="85" y="14" width="30" height="20" rx="3" fill="#090d16" stroke="#2563eb" strokeWidth="1.5" />

            <rect x="36" y="94" width="34" height="16" rx="4" fill="#090d16" stroke="#2563eb" strokeWidth="1.5" />
            <rect x="130" y="94" width="34" height="16" rx="4" fill="#090d16" stroke="#2563eb" strokeWidth="1.5" />

            {/* Chasing Ghost (Blinky - Red) */}
            <g transform="translate(24, 56)" filter="url(#ghost-glow-red)">
              <path
                d="M 2 24 L 2 12 A 11 11 0 0 1 24 12 L 24 24 L 20.5 21 L 17 24 L 13.5 21 L 10 24 L 6.5 21 L 2 24 Z"
                fill="#ef4444"
              />
              <circle cx="8" cy="11" r="3.5" fill="#ffffff" />
              <circle cx="10" cy="11" r="1.8" fill="#1d4ed8" />
              <circle cx="17" cy="11" r="3.5" fill="#ffffff" />
              <circle cx="19" cy="11" r="1.8" fill="#1d4ed8" />
            </g>

            {/* Pac-Man (Yellow Chomper) */}
            <g transform="translate(68, 53)" filter="url(#pac-glow)">
              <path
                d="M 17 17 L 31 6 A 17 17 0 1 0 31 28 Z"
                fill="#facc15"
                stroke="#fef08a"
                strokeWidth="1"
              />
              <circle cx="17" cy="8" r="2" fill="#090d16" />
            </g>

            {/* Dots Pac-Man is eating */}
            <circle cx="118" cy="70" r="3" fill="#fef08a" />
            <circle cx="134" cy="70" r="3" fill="#fef08a" />
            <circle cx="150" cy="70" r="3" fill="#fef08a" />

            {/* Big Glowing Power Pellet */}
            <g filter="url(#pellet-glow)">
              <circle cx="168" cy="70" r="6" fill="#fde047" stroke="#ffffff" strokeWidth="1" />
            </g>

            {/* Retro Cherry Fruit Bonus at Bottom */}
            <g transform="translate(94, 96)">
              <path d="M 6 12 Q 10 3 17 3 Q 12 3 13 12" stroke="#22c55e" strokeWidth="1.5" fill="none" />
              <circle cx="7" cy="14" r="4.5" fill="#e11d48" />
              <circle cx="5.5" cy="12.5" r="1.2" fill="#fda4af" />
              <circle cx="14" cy="14" r="4.5" fill="#e11d48" />
              <circle cx="12.5" cy="12.5" r="1.2" fill="#fda4af" />
            </g>
          </svg>
        </div>
      );

    case 'jewels':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-fuchsia-950 via-slate-950 to-purple-950 ${className}`}>
          {/* Diamond Lattice Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d946ef_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="jewel-glow-beam" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="gem-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="ruby-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>

              <linearGradient id="diamond-cyan-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#cffafe" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#164e63" />
              </linearGradient>

              <linearGradient id="sapphire-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>

              <linearGradient id="emerald-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>

              <linearGradient id="citrine-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="amethyst-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d0fe" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>

            {/* Background Grid Squares */}
            <g opacity="0.25">
              {[46, 82, 118, 154].map((x) =>
                [18, 54, 90].map((y) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x - 16}
                    y={y - 16}
                    width="32"
                    height="32"
                    rx="6"
                    fill="#1e1b4b"
                    stroke="#a855f7"
                    strokeWidth="0.8"
                  />
                ))
              )}
            </g>

            {/* Surrounding Non-matching Gems */}
            <g transform="translate(46, 18)" filter="url(#gem-glow)">
              <polygon points="0,-11 11,0 0,11 -11,0" fill="url(#citrine-grad)" stroke="#fef08a" strokeWidth="1" />
              <polygon points="0,-6 6,0 0,6 -6,0" fill="#fef08a" opacity="0.6" />
            </g>

            <g transform="translate(82, 18)" filter="url(#gem-glow)">
              <polygon points="-8,-10 8,-10 12,0 8,10 -8,10 -12,0" fill="url(#emerald-grad)" stroke="#a7f3d0" strokeWidth="1" />
            </g>

            <g transform="translate(154, 18)" filter="url(#gem-glow)">
              <polygon points="0,-12 10,2 7,11 -7,11 -10,2" fill="url(#amethyst-grad)" stroke="#f5d0fe" strokeWidth="1" />
            </g>

            <g transform="translate(46, 90)" filter="url(#gem-glow)">
              <polygon points="-8,-10 8,-10 12,0 8,10 -8,10 -12,0" fill="url(#emerald-grad)" stroke="#a7f3d0" strokeWidth="1" />
            </g>

            <g transform="translate(118, 90)" filter="url(#gem-glow)">
              <polygon points="0,-11 11,0 0,11 -11,0" fill="url(#citrine-grad)" stroke="#fef08a" strokeWidth="1" />
            </g>

            <g transform="translate(154, 90)" filter="url(#gem-glow)">
              <polygon points="-9,-9 9,-9 12,0 9,9 -9,9 -12,0" fill="url(#sapphire-grad)" stroke="#bfdbfe" strokeWidth="1" />
            </g>

            {/* MATCH-3 ROW: Three Glowing Rubies aligned horizontally at y=54 */}
            <g filter="url(#jewel-glow-beam)">
              <line x1="28" y1="54" x2="172" y2="54" stroke="#f43f5e" strokeWidth="8" opacity="0.4" strokeLinecap="round" />
              <line x1="38" y1="54" x2="162" y2="54" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="48" y1="54" x2="152" y2="54" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Gem 1 (Ruby) */}
            <g transform="translate(46, 54)" filter="url(#gem-glow)">
              <circle cx="0" cy="0" r="14" fill="#fda4af" opacity="0.3" filter="url(#jewel-glow-beam)" />
              <polygon points="-8,-12 8,-12 13,-4 13,4 8,12 -8,12 -13,4 -13,-4" fill="url(#ruby-grad)" stroke="#ffffff" strokeWidth="1.2" />
              <polygon points="-4,-6 4,-6 7,-2 7,2 4,6 -4,6 -7,2 -7,-2" fill="#fda4af" opacity="0.6" />
              <circle cx="-3" cy="-4" r="1.5" fill="#ffffff" />
            </g>

            {/* Gem 2 (Ruby - Center Explosion) */}
            <g transform="translate(82, 54)" filter="url(#jewel-glow-beam)">
              <circle cx="0" cy="0" r="17" fill="#fb7185" opacity="0.4" />
              <polygon points="-9,-14 9,-14 15,-5 15,5 9,14 -9,14 -15,5 -15,-5" fill="url(#ruby-grad)" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="-5,-7 5,-7 8,-2 8,2 5,7 -5,7 -8,2 -8,-2" fill="#fff1f2" opacity="0.8" />
              <circle cx="-4" cy="-5" r="2" fill="#ffffff" />
            </g>

            {/* Gem 3 (Ruby) */}
            <g transform="translate(118, 54)" filter="url(#gem-glow)">
              <circle cx="0" cy="0" r="14" fill="#fda4af" opacity="0.3" filter="url(#jewel-glow-beam)" />
              <polygon points="-8,-12 8,-12 13,-4 13,4 8,12 -8,12 -13,4 -13,-4" fill="url(#ruby-grad)" stroke="#ffffff" strokeWidth="1.2" />
              <polygon points="-4,-6 4,-6 7,-2 7,2 4,6 -4,6 -7,2 -7,-2" fill="#fda4af" opacity="0.6" />
              <circle cx="-3" cy="-4" r="1.5" fill="#ffffff" />
            </g>

            {/* Falling Diamond Cyan at (82, 90) */}
            <g transform="translate(82, 90)" filter="url(#gem-glow)">
              <polygon points="0,-13 12,0 0,13 -12,0" fill="url(#diamond-cyan-grad)" stroke="#cffafe" strokeWidth="1.2" />
              <polygon points="0,-6 6,0 0,6 -6,0" fill="#ffffff" opacity="0.6" />
            </g>

            {/* Sparkle Stars & Combo Burst */}
            <g filter="url(#jewel-glow-beam)">
              <path d="M 82 44 L 84 52 L 92 54 L 84 56 L 82 64 L 80 56 L 72 54 L 80 52 Z" fill="#ffffff" />
              <path d="M 142 42 L 143 46 L 147 47 L 143 48 L 142 52 L 141 48 L 137 47 L 141 46 Z" fill="#fde047" />
              <path d="M 28 42 L 29 46 L 33 47 L 29 48 L 28 52 L 27 48 L 23 47 L 27 46 Z" fill="#fde047" />
            </g>

            {/* Glowing Combo Tag */}
            <g transform="translate(62, 114)">
              <rect width="76" height="18" rx="9" fill="#701a75" stroke="#f472b6" strokeWidth="1" opacity="0.9" />
              <text x="38" y="13" fill="#fdf4ff" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.8">COMBO x3!</text>
            </g>
          </svg>
        </div>
      );

    case 'bubble-shooter':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-amber-950 via-slate-950 to-emerald-950 ${className}`}>
          {/* Hexagonal Dot Matrix Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="egg-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pop-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="egg-red" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </radialGradient>
              <radialGradient id="egg-cyan" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0e7490" />
              </radialGradient>
              <radialGradient id="egg-green" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="60%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#065f46" />
              </radialGradient>
              <radialGradient id="egg-yellow" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
              <radialGradient id="egg-purple" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#f5d0fe" />
                <stop offset="60%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6b21a8" />
              </radialGradient>
            </defs>

            {/* Ceiling Danger Frame */}
            <line x1="20" y1="12" x2="180" y2="12" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />

            {/* Top Cluster Row 1 */}
            <circle cx="35" cy="24" r="11" fill="url(#egg-red)" stroke="#fca5a5" strokeWidth="0.8" />
            <circle cx="57" cy="24" r="11" fill="url(#egg-red)" stroke="#fca5a5" strokeWidth="0.8" />
            <circle cx="79" cy="24" r="11" fill="url(#egg-green)" stroke="#a7f3d0" strokeWidth="0.8" />
            <circle cx="101" cy="24" r="11" fill="url(#egg-green)" stroke="#a7f3d0" strokeWidth="0.8" />
            <circle cx="123" cy="24" r="11" fill="url(#egg-cyan)" stroke="#a5f3fc" strokeWidth="0.8" />
            <circle cx="145" cy="24" r="11" fill="url(#egg-yellow)" stroke="#fef08a" strokeWidth="0.8" />
            <circle cx="167" cy="24" r="11" fill="url(#egg-purple)" stroke="#f5d0fe" strokeWidth="0.8" />

            {/* Top Cluster Row 2 (Staggered) */}
            <circle cx="46" cy="42" r="11" fill="url(#egg-red)" stroke="#fca5a5" strokeWidth="1" filter="url(#egg-glow)" />
            <circle cx="68" cy="42" r="11" fill="url(#egg-green)" stroke="#a7f3d0" strokeWidth="0.8" />
            <circle cx="90" cy="42" r="11" fill="url(#egg-cyan)" stroke="#a5f3fc" strokeWidth="0.8" />
            <circle cx="112" cy="42" r="11" fill="url(#egg-cyan)" stroke="#a5f3fc" strokeWidth="0.8" />
            <circle cx="134" cy="42" r="11" fill="url(#egg-yellow)" stroke="#fef08a" strokeWidth="0.8" />
            <circle cx="156" cy="42" r="11" fill="url(#egg-purple)" stroke="#f5d0fe" strokeWidth="0.8" />

            {/* Matching Cluster 3: Glowing Red Hit Burst */}
            <g filter="url(#pop-glow)" transform="translate(46, 42)">
              <circle cx="0" cy="0" r="15" fill="#ef4444" opacity="0.3" />
              <path d="M 0 -16 L 3 -4 L 15 0 L 3 4 L 0 16 L -3 4 L -15 0 L -3 -4 Z" fill="#ffffff" />
            </g>

            {/* Popping shards and sparks */}
            <circle cx="36" cy="36" r="2" fill="#fca5a5" />
            <circle cx="56" cy="48" r="2.5" fill="#ef4444" />
            <circle cx="42" cy="54" r="1.5" fill="#fef08a" />
            <circle cx="28" cy="46" r="2" fill="#ffffff" />

            {/* Floating Pop Score */}
            <text x="56" y="66" fill="#fef08a" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle" filter="url(#egg-glow)">+120!</text>

            {/* Aiming Laser Line (Bouncing off wall) */}
            <path
              d="M 100 120 L 40 76 L 46 44"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Wall bounce reflection dot */}
            <circle cx="40" cy="76" r="3.5" fill="#22d3ee" filter="url(#egg-glow)" />

            {/* Flying Egg Projectile with Motion Trail */}
            <circle cx="65" cy="94" r="7" fill="#ef4444" opacity="0.3" />
            <circle cx="76" cy="102" r="9" fill="#ef4444" opacity="0.5" />
            <g transform="translate(54, 86)" filter="url(#egg-glow)">
              <circle cx="0" cy="0" r="11" fill="url(#egg-red)" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="-3" cy="-4" r="2.5" fill="#ffffff" opacity="0.8" />
            </g>

            {/* Brass Cannon Base at Bottom */}
            <g transform="translate(100, 126)">
              {/* Rotating Barrel */}
              <g transform="rotate(-38)">
                <rect x="-6" y="-30" width="12" height="28" rx="4" fill="#d97706" stroke="#fde68a" strokeWidth="1.2" />
                <circle cx="0" cy="-28" r="4" fill="#fbbf24" />
              </g>
              {/* Cannon Turret Mount */}
              <circle cx="0" cy="0" r="16" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="0" cy="0" r="9" fill="#b45309" />
              <circle cx="0" cy="0" r="4" fill="#fde68a" />
            </g>

            {/* Next Bubble Preview Indicator at Bottom Left */}
            <g transform="translate(148, 124)">
              <rect x="-14" y="-12" width="28" height="24" rx="8" fill="#090d16" stroke="#22d3ee" strokeWidth="1" opacity="0.8" />
              <circle cx="0" cy="0" r="8" fill="url(#egg-cyan)" stroke="#a5f3fc" strokeWidth="0.8" />
            </g>
          </svg>
        </div>
      );

    case 'gold-miner':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-amber-950 via-[#1a0f05] to-[#0c0602] ${className}`}>
          {/* Earth Grid Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="diamond-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="nugget-grad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="35%" stopColor="#fde047" />
                <stop offset="75%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </radialGradient>
              <linearGradient id="diamond-grad-miner" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Surface Grass Line */}
            <rect x="0" y="24" width="200" height="3" fill="#10b981" />

            {/* Underground Earth Strata */}
            <line x1="0" y1="55" x2="200" y2="55" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="6 8" opacity="0.2" />
            <line x1="0" y1="95" x2="200" y2="95" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="8 10" opacity="0.2" />

            {/* Miner and Cart on Top Surface */}
            <g transform="translate(100, 16)">
              {/* Mine Cart */}
              <rect x="-16" y="0" width="32" height="14" rx="3" fill="#78350f" stroke="#d97706" strokeWidth="1" />
              <circle cx="-10" cy="14" r="3.5" fill="#334155" />
              <circle cx="10" cy="14" r="3.5" fill="#334155" />
              {/* Miner Head */}
              <circle cx="0" cy="-4" r="6" fill="#fed7aa" />
              {/* White Beard */}
              <path d="M -5 -2 Q 0 5 5 -2 Z" fill="#ffffff" />
              {/* Miner Helmet */}
              <path d="M -7 -4 Q 0 -13 7 -4 Z" fill="#f59e0b" />
              {/* Headlamp */}
              <circle cx="0" cy="-6" r="2.5" fill="#fef08a" filter="url(#gold-glow)" />
            </g>

            {/* Steel Winch Cable */}
            <line x1="100" y1="28" x2="68" y2="78" stroke="#cbd5e1" strokeWidth="1.8" />
            <line x1="100" y1="28" x2="68" y2="78" stroke="#38bdf8" strokeWidth="0.8" opacity="0.7" />

            {/* Steel Hook Grabbing Giant Gold Nugget */}
            <g transform="translate(68, 78) rotate(32)">
              {/* Steel Claws */}
              <path d="M -2 0 Q -10 6 -7 12 L -4 8 Q -5 5 0 1 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
              <path d="M 2 0 Q 10 6 7 12 L 4 8 Q 5 5 0 1 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            </g>

            {/* Giant Gold Nugget being reeled in */}
            <g transform="translate(62, 94)" filter="url(#gold-glow)">
              <polygon
                points="-18,-8 -8,-20 12,-18 22,-4 18,16 -2,22 -18,12"
                fill="url(#nugget-grad)"
                stroke="#fef08a"
                strokeWidth="1.5"
              />
              <circle cx="-5" cy="-6" r="4" fill="#ffffff" opacity="0.8" />
              {/* Shiny facets */}
              <line x1="-8" y1="-20" x2="0" y2="0" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
              <line x1="12" y1="-18" x2="0" y2="0" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
              <line x1="-2" y1="22" x2="0" y2="0" stroke="#854d0e" strokeWidth="1" opacity="0.6" />
            </g>

            {/* Sparkling Cyan Diamond on the Right */}
            <g transform="translate(145, 68)" filter="url(#diamond-glow)">
              <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#diamond-grad-miner)" stroke="#ffffff" strokeWidth="1.2" />
              <polygon points="0,-6 6,0 0,6 -6,0" fill="#ffffff" opacity="0.7" />
              {/* Sparkle star */}
              <path d="M 0 -16 L 2 -4 L 14 0 L 2 4 L 0 16 L -2 4 L -14 0 L -2 -4 Z" fill="#ffffff" opacity="0.9" />
            </g>

            {/* Mystery Grab Bag on Lower Right */}
            <g transform="translate(155, 110)">
              <circle cx="0" cy="2" r="14" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" />
              <rect x="-4" y="-14" width="8" height="5" rx="1.5" fill="#78350f" />
              <text x="0" y="7" fill="#fef08a" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">?</text>
            </g>

            {/* Dynamite Sticks on Lower Left */}
            <g transform="translate(26, 112)">
              {/* Dynamite 1 */}
              <rect x="0" y="-12" width="6" height="24" rx="2" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
              {/* Dynamite 2 */}
              <rect x="7" y="-12" width="6" height="24" rx="2" fill="#dc2626" stroke="#fca5a5" strokeWidth="0.8" />
              {/* Dynamite 3 */}
              <rect x="14" y="-12" width="6" height="24" rx="2" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
              {/* Fuse with burning spark */}
              <path d="M 10 -12 Q 12 -20 18 -18" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
              <circle cx="18" cy="-18" r="2.5" fill="#fde047" filter="url(#gold-glow)" />
            </g>

            {/* Floating Cash Win Popup */}
            <text x="64" y="66" fill="#fde047" fontSize="13" fontWeight="900" fontFamily="monospace" textAnchor="middle" filter="url(#gold-glow)">+$500</text>
          </svg>
        </div>
      );

    case 'tank-1990':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1410] to-[#040806] ${className}`}>
          {/* Tactical Grid */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22c55e_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="tank-fire-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="star-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="tank-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="brick-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Brick walls on the sides */}
            <g opacity="0.85">
              {/* Left Brick Wall */}
              <rect x="12" y="24" width="22" height="12" rx="1.5" fill="url(#brick-grad)" stroke="#450a0a" strokeWidth="1" />
              <rect x="12" y="38" width="22" height="12" rx="1.5" fill="url(#brick-grad)" stroke="#450a0a" strokeWidth="1" />
              <rect x="12" y="52" width="14" height="12" rx="1.5" fill="url(#brick-grad)" stroke="#450a0a" strokeWidth="1" />

              {/* Right Steel Wall */}
              <rect x="166" y="24" width="22" height="26" rx="2" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
              <circle cx="170" cy="28" r="1.5" fill="#334155" />
              <circle cx="184" cy="28" r="1.5" fill="#334155" />
              <circle cx="170" cy="46" r="1.5" fill="#334155" />
              <circle cx="184" cy="46" r="1.5" fill="#334155" />
            </g>

            {/* Exploding Enemy Tank in Background */}
            <g transform="translate(145, 36)">
              {/* Explosion flash */}
              <circle cx="0" cy="0" r="14" fill="#f59e0b" opacity="0.6" filter="url(#tank-fire-glow)" />
              <circle cx="0" cy="0" r="8" fill="#fef08a" opacity="0.8" />
              {/* Shattered metal bits */}
              <rect x="-12" y="-8" width="8" height="14" rx="2" fill="#475569" transform="rotate(-25)" />
              <circle cx="8" cy="-10" r="2" fill="#ef4444" />
              <circle cx="-6" cy="12" r="2.5" fill="#f97316" />
            </g>

            {/* Main Player Tank in Forefront (Yellow Commander Tank) */}
            <g transform="translate(90, 72)">
              {/* Left Tread */}
              <rect x="-24" y="-22" width="10" height="44" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="-24" y1="-14" x2="-14" y2="-14" stroke="#475569" strokeWidth="1.5" />
              <line x1="-24" y1="-4" x2="-14" y2="-4" stroke="#475569" strokeWidth="1.5" />
              <line x1="-24" y1="6" x2="-14" y2="6" stroke="#475569" strokeWidth="1.5" />
              <line x1="-24" y1="16" x2="-14" y2="16" stroke="#475569" strokeWidth="1.5" />

              {/* Right Tread */}
              <rect x="14" y="-22" width="10" height="44" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="14" y1="-14" x2="24" y2="-14" stroke="#475569" strokeWidth="1.5" />
              <line x1="14" y1="-4" x2="24" y2="-4" stroke="#475569" strokeWidth="1.5" />
              <line x1="14" y1="6" x2="24" y2="6" stroke="#475569" strokeWidth="1.5" />
              <line x1="14" y1="16" x2="24" y2="16" stroke="#475569" strokeWidth="1.5" />

              {/* Main Hull */}
              <rect x="-15" y="-18" width="30" height="36" rx="4" fill="url(#tank-gold)" stroke="#713f12" strokeWidth="1.8" />
              <rect x="-11" y="-14" width="22" height="28" rx="2" fill="#ca8a04" opacity="0.4" />

              {/* Turret */}
              <circle cx="0" cy="0" r="10" fill="#eab308" stroke="#713f12" strokeWidth="1.8" />
              <circle cx="0" cy="0" r="6" fill="#fef08a" opacity="0.6" />

              {/* Double Heavy Cannon */}
              <rect x="-4" y="-30" width="8" height="20" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
              <rect x="-5" y="-32" width="10" height="3" rx="1" fill="#475569" />

              {/* Muzzle Flash Blast */}
              <g transform="translate(0, -38)" filter="url(#tank-fire-glow)">
                <path d="M 0 -8 L 4 0 L 10 2 L 4 5 L 0 12 L -4 5 L -10 2 L -4 0 Z" fill="#fef08a" />
                <circle cx="0" cy="2" r="3" fill="#ffffff" />
              </g>

              {/* Protective Energy Shield Ring */}
              <circle cx="0" cy="0" r="32" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.75" />
            </g>

            {/* Golden Star Power-Up on Upper Left */}
            <g transform="translate(42, 48)" filter="url(#star-glow)">
              <polygon
                points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5"
                fill="#fde047"
                stroke="#ca8a04"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="3" fill="#ffffff" />
            </g>

            {/* Base Eagle Protected at Bottom Center */}
            <g transform="translate(90, 126)">
              {/* Protective Wall */}
              <rect x="-18" y="-12" width="36" height="12" fill="url(#brick-grad)" stroke="#450a0a" strokeWidth="1" />
              {/* Golden Eagle Head */}
              <circle cx="0" cy="-6" r="6" fill="#eab308" />
              <polygon points="0,-10 6,-6 0,-2" fill="#ffffff" />
              <polygon points="2,-7 8,-5 2,-3" fill="#f59e0b" />
            </g>
          </svg>
        </div>
      );

    case 'bomberman':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0c0a1a] via-[#1a0f2e] to-[#080512] ${className}`}>
          {/* Labyrinth Grid Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#a855f7_1px,transparent_1px)] bg-[size:16px_16px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="bomb-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="fire-blast-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="bomb-body-grad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="35%" stopColor="#334155" />
                <stop offset="70%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
              <radialGradient id="flame-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="65%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </radialGradient>
              <linearGradient id="pillar-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="softbrick-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Background Labyrinth Blocks */}
            <g opacity="0.6">
              {/* Indestructible Steel Pillars */}
              <rect x="15" y="15" width="22" height="22" rx="4" fill="url(#pillar-grad)" stroke="#94a3b8" strokeWidth="1" />
              <rect x="65" y="15" width="22" height="22" rx="4" fill="url(#pillar-grad)" stroke="#94a3b8" strokeWidth="1" />
              <rect x="165" y="15" width="22" height="22" rx="4" fill="url(#pillar-grad)" stroke="#94a3b8" strokeWidth="1" />
              <rect x="15" y="105" width="22" height="22" rx="4" fill="url(#pillar-grad)" stroke="#94a3b8" strokeWidth="1" />
              <rect x="165" y="105" width="22" height="22" rx="4" fill="url(#pillar-grad)" stroke="#94a3b8" strokeWidth="1" />

              {/* Destructible Soft Bricks */}
              <rect x="40" y="15" width="22" height="22" rx="3" fill="url(#softbrick-grad)" stroke="#92400e" strokeWidth="1" />
              <rect x="140" y="15" width="22" height="22" rx="3" fill="url(#softbrick-grad)" stroke="#92400e" strokeWidth="1" />
              <rect x="15" y="40" width="22" height="22" rx="3" fill="url(#softbrick-grad)" stroke="#92400e" strokeWidth="1" />
              <rect x="15" y="65" width="22" height="22" rx="3" fill="url(#softbrick-grad)" stroke="#92400e" strokeWidth="1" />
              <rect x="165" y="40" width="22" height="22" rx="3" fill="url(#softbrick-grad)" stroke="#92400e" strokeWidth="1" />
            </g>

            {/* Crossfire Blast Flames behind */}
            <g filter="url(#fire-blast-glow)">
              {/* Horizontal blast */}
              <path d="M 60 76 Q 80 68 115 68 Q 150 68 170 76 Q 150 84 115 84 Q 80 84 60 76 Z" fill="url(#flame-core-grad)" />
              {/* Vertical blast */}
              <path d="M 115 25 Q 123 45 123 76 Q 123 105 115 125 Q 107 105 107 76 Q 107 45 115 25 Z" fill="url(#flame-core-grad)" />
            </g>

            {/* Giant Mega Bomb */}
            <g transform="translate(115, 76)" filter="url(#bomb-glow)">
              {/* Bomb Shadow */}
              <ellipse cx="0" cy="22" rx="20" ry="7" fill="rgba(0,0,0,0.5)" />
              {/* Bomb Spherical Body */}
              <circle cx="0" cy="0" r="23" fill="url(#bomb-body-grad)" stroke="#f43f5e" strokeWidth="1.5" />
              {/* Metallic Neck */}
              <rect x="-6" y="-28" width="12" height="7" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
              {/* Sparking Fuse */}
              <path d="M 0 -28 Q 8 -36 5 -42" stroke="#fef08a" strokeWidth="2.5" fill="none" />
              {/* Fuse Spark */}
              <circle cx="5" cy="-42" r="5" fill="#facc15" />
              <polygon points="5,-47 8,-42 5,-37 2,-42" fill="#ef4444" />
              {/* Bomb skull emblem */}
              <circle cx="0" cy="-2" r="6" fill="#f43f5e" />
              <rect x="-4" y="3" width="8" height="3" rx="1" fill="#f43f5e" />
              <circle cx="-2" cy="-3" r="1.5" fill="#0f172a" />
              <circle cx="2" cy="-3" r="1.5" fill="#0f172a" />
            </g>

            {/* Bomberman Hero on Left */}
            <g transform="translate(56, 85)">
              {/* Shadow */}
              <ellipse cx="0" cy="28" rx="14" ry="5" fill="rgba(0,0,0,0.4)" />
              {/* Pink Boots */}
              <rect x="-10" y="20" width="7" height="8" rx="3" fill="#f43f5e" stroke="#881337" strokeWidth="1" />
              <rect x="3" y="18" width="7" height="9" rx="3" fill="#f43f5e" stroke="#881337" strokeWidth="1" />
              {/* Blue Suit Body */}
              <rect x="-10" y="4" width="20" height="17" rx="5" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
              {/* Belt */}
              <rect x="-10" y="14" width="20" height="3.5" fill="#020617" />
              <rect x="-3" y="13.5" width="6" height="4.5" rx="1" fill="#facc15" />
              {/* White Hands */}
              <circle cx="-13" cy="11" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
              <circle cx="13" cy="9" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
              {/* White Helmet Head */}
              <circle cx="0" cy="-6" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              {/* Pink Visor Face */}
              <rect x="-8" y="-9" width="16" height="9" rx="3" fill="#fbcfe8" stroke="#0f172a" strokeWidth="1.2" />
              {/* Cute Eyes */}
              <rect x="-5" y="-8" width="2.5" height="5" rx="1" fill="#0f172a" />
              <rect x="2.5" y="-8" width="2.5" height="5" rx="1" fill="#0f172a" />
              {/* Pink Pom-pom Antenna */}
              <line x1="0" y1="-22" x2="0" y2="-27" stroke="#0f172a" strokeWidth="2" />
              <circle cx="0" cy="-29" r="5" fill="#f43f5e" stroke="#0f172a" strokeWidth="1.2" />
            </g>

            {/* Valcom Red Monster on Right */}
            <g transform="translate(165, 88)">
              {/* Shadow */}
              <ellipse cx="0" cy="16" rx="12" ry="4" fill="rgba(0,0,0,0.4)" />
              {/* Round Red Jelly Body */}
              <circle cx="0" cy="0" r="15" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
              {/* Large White Eyes */}
              <circle cx="-5" cy="-2" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
              <circle cx="5" cy="-2" r="5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
              <circle cx="-7" cy="-2" r="2.5" fill="#0f172a" />
              <circle cx="3" cy="-2" r="2.5" fill="#0f172a" />
              {/* Funny Mouth */}
              <ellipse cx="0" cy="7" rx="4" ry="2" fill="#7f1d1d" />
            </g>

            {/* Floating Power-Ups */}
            {/* Fire Up Badge */}
            <g transform="translate(30, 42)">
              <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#1e293b" stroke="#f97316" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="12">🔥</text>
            </g>
            {/* Extra Bomb Badge */}
            <g transform="translate(170, 42)">
              <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#1e293b" stroke="#facc15" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="12">💣</text>
            </g>
          </svg>
        </div>
      );

    case 'galaga':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#02040a] via-[#080d1a] to-[#04060d] ${className}`}>
          {/* Deep Space Starfield */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] bg-[size:14px_14px]" />
          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="galaga-laser-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="tractor-beam-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="beam-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#0284c7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Glowing Stars */}
            <circle cx="25" cy="20" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="45" cy="55" r="1" fill="#38bdf8" opacity="0.7" />
            <circle cx="85" cy="15" r="1.5" fill="#facc15" opacity="0.9" />
            <circle cx="175" cy="35" r="1.5" fill="#ef4444" opacity="0.8" />
            <circle cx="150" cy="70" r="1" fill="#ffffff" opacity="0.6" />
            <circle cx="30" cy="110" r="1.5" fill="#a855f7" opacity="0.7" />
            <circle cx="180" cy="115" r="1" fill="#38bdf8" opacity="0.8" />

            {/* Tractor Beam from Top Boss */}
            <g filter="url(#tractor-beam-glow)">
              <polygon points="100,28 85,95 115,95" fill="url(#beam-grad)" />
              <ellipse cx="100" cy="50" rx="12" ry="4" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.6" />
              <ellipse cx="100" cy="72" rx="18" ry="5" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.4" />
            </g>

            {/* Boss Galaga at Top Center */}
            <g transform="translate(100, 20)">
              {/* Blue Wings */}
              <polygon points="-18,4 -5,-10 -5,8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="18,4 5,-10 5,8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
              {/* Yellow Core Body */}
              <ellipse cx="0" cy="0" rx="7" ry="9" fill="#facc15" />
              {/* Mandibles */}
              <polygon points="-6,-10 -9,-16 -4,-12" fill="#f59e0b" />
              <polygon points="6,-10 9,-16 4,-12" fill="#f59e0b" />
              <circle cx="0" cy="0" r="3" fill="#0369a1" />
            </g>

            {/* Red Butterfly Goei on Left */}
            <g transform="translate(42, 38) rotate(20)">
              <ellipse cx="-7" cy="0" rx="6" ry="10" fill="#ef4444" transform="rotate(25 -7 0)" />
              <ellipse cx="7" cy="0" rx="6" ry="10" fill="#ef4444" transform="rotate(-25 7 0)" />
              <rect x="-2" y="-7" width="4" height="14" fill="#ffffff" rx="1" />
              <circle cx="0" cy="-8" r="3" fill="#facc15" />
            </g>

            {/* Yellow Bee Zako on Right */}
            <g transform="translate(158, 42) rotate(-20)">
              <polygon points="-12,-4 -2,-6 -4,6" fill="#eab308" />
              <polygon points="12,-4 2,-6 4,6" fill="#eab308" />
              <ellipse cx="0" cy="0" rx="5" ry="7" fill="#facc15" />
              <rect x="-4" y="-1" width="8" height="2" fill="#0f172a" />
              <rect x="-3" y="3" width="6" height="2" fill="#0f172a" />
            </g>

            {/* Dual Twin Lasers */}
            <g filter="url(#galaga-laser-glow)">
              <rect x="87" y="65" width="2" height="20" rx="1" fill="#fde047" />
              <rect x="111" y="65" width="2" height="20" rx="1" fill="#fde047" />
            </g>

            {/* Iconic Dual Fighter at Bottom Center */}
            <g transform="translate(100, 115)">
              {/* Connecting Bar */}
              <rect x="-12" y="2" width="24" height="4" rx="1" fill="#38bdf8" />

              {/* Left Fighter Ship */}
              <g transform="translate(-13, 0)">
                <polygon points="0,-16 11,10 -11,10" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                <rect x="-13" y="2" width="4" height="8" fill="#ef4444" />
                <rect x="9" y="2" width="4" height="8" fill="#ef4444" />
                <rect x="-2" y="-12" width="4" height="8" fill="#0284c7" />
                {/* Thruster Flame */}
                <polygon points="-3,10 0,16 3,10" fill="#f59e0b" />
              </g>

              {/* Right Fighter Ship */}
              <g transform="translate(13, 0)">
                <polygon points="0,-16 11,10 -11,10" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                <rect x="-13" y="2" width="4" height="8" fill="#ef4444" />
                <rect x="9" y="2" width="4" height="8" fill="#ef4444" />
                <rect x="-2" y="-12" width="4" height="8" fill="#0284c7" />
                {/* Thruster Flame */}
                <polygon points="-3,10 0,16 3,10" fill="#f59e0b" />
              </g>
            </g>
          </svg>
        </div>
      );

    case 'road-fighter':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-b from-[#0a192f] via-[#111827] to-[#030712] ${className}`}>
          {/* Speed Streaks Overlay */}
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_10px,#ffffff_10px,#ffffff_12px)]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rf-road-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="rf-sky-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="rf-flame-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="rf-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sky & Distant Mountains */}
            <rect x="0" y="0" width="200" height="45" fill="url(#rf-sky-grad)" />
            <polygon points="0,45 35,28 75,45 125,25 170,45 200,32 200,45" fill="#1e3a8a" opacity="0.6" />

            {/* Roadside Ground (Left & Right Grass) */}
            <rect x="0" y="45" width="200" height="95" fill="#14532d" />
            <rect x="0" y="45" width="30" height="95" fill="#166534" />
            <rect x="170" y="45" width="30" height="95" fill="#166534" />

            {/* Highway Road with Perspective */}
            <polygon points="65,45 135,45 170,140 30,140" fill="url(#rf-road-grad)" />

            {/* Red & White Curbs (Rumble Strips) */}
            <polygon points="61,45 65,45 30,140 24,140" fill="#ef4444" />
            <polygon points="135,45 139,45 176,140 170,140" fill="#ef4444" />
            {/* White curb dashes */}
            <polygon points="56,60 59,60 50,78 47,78" fill="#ffffff" />
            <polygon points="44,88 47,88 36,108 33,108" fill="#ffffff" />
            <polygon points="30,120 33,120 25,138 22,138" fill="#ffffff" />
            <polygon points="141,60 144,60 150,78 147,78" fill="#ffffff" />
            <polygon points="153,88 156,88 164,108 161,108" fill="#ffffff" />
            <polygon points="167,120 170,120 175,138 172,138" fill="#ffffff" />

            {/* Road Center Dashed Line */}
            <line x1="100" y1="46" x2="100" y2="56" stroke="#f8fafc" strokeWidth="1.5" />
            <line x1="100" y1="64" x2="100" y2="78" stroke="#f8fafc" strokeWidth="2" />
            <line x1="100" y1="88" x2="100" y2="108" stroke="#f8fafc" strokeWidth="2.5" />
            <line x1="100" y1="120" x2="100" y2="140" stroke="#f8fafc" strokeWidth="3" />

            {/* Left & Right Lane Guides */}
            <line x1="82" y1="46" x2="65" y2="140" stroke="#facc15" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
            <line x1="118" y1="46" x2="135" y2="140" stroke="#facc15" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

            {/* Roadside Trees */}
            <polygon points="15,42 8,58 22,58" fill="#15803d" />
            <polygon points="18,65 7,85 29,85" fill="#16a34a" />
            <polygon points="185,42 178,58 192,58" fill="#15803d" />
            <polygon points="182,65 171,85 193,85" fill="#16a34a" />

            {/* Ahead Traffic Cars */}
            {/* Yellow Sedan in Far Distance */}
            <g transform="translate(108, 54) scale(0.4)">
              <rect x="-8" y="-14" width="16" height="28" rx="3" fill="#facc15" />
              <rect x="-6" y="-6" width="12" height="12" fill="#0f172a" />
              <rect x="-7" y="11" width="4" height="2" fill="#ef4444" />
              <rect x="3" y="11" width="4" height="2" fill="#ef4444" />
            </g>

            {/* Blue Sedan in Mid Distance */}
            <g transform="translate(76, 72) scale(0.65)">
              <rect x="-10" y="-16" width="20" height="32" rx="4" fill="#38bdf8" />
              <rect x="-8" y="-8" width="16" height="14" fill="#0f172a" />
              <rect x="-9" y="13" width="5" height="3" fill="#ef4444" />
              <rect x="4" y="13" width="5" height="3" fill="#ef4444" />
              {/* Blinker */}
              <circle cx="8" cy="14" r="2" fill="#f59e0b" />
            </g>

            {/* Pink Bonus Fuel Car on Right */}
            <g transform="translate(132, 86) scale(0.75)" filter="url(#rf-glow)">
              <rect x="-9" y="-15" width="18" height="30" rx="4" fill="#db2777" />
              <rect x="-7" y="-7" width="14" height="12" fill="#831843" />
              <circle cx="0" cy="-1" r="3" fill="#ffffff" />
            </g>

            {/* PLAYER'S RED RACING SPORTS CAR AT BOTTOM CENTER */}
            <g transform="translate(100, 114)">
              {/* Turbo Exhaust Flame */}
              <g filter="url(#rf-glow)">
                <polygon points="-7,16 -4,26 -1,16" fill="url(#rf-flame-grad)" />
                <polygon points="1,16 4,26 7,16" fill="url(#rf-flame-grad)" />
              </g>

              {/* Shadow */}
              <rect x="-15" y="-18" width="30" height="36" rx="6" fill="#000000" opacity="0.5" />

              {/* Red Body */}
              <rect x="-14" y="-20" width="28" height="36" rx="6" fill="#dc2626" />
              {/* Highlighting */}
              <rect x="-12" y="-18" width="5" height="32" rx="2" fill="#ef4444" />

              {/* Rear Spoiler */}
              <rect x="-14" y="12" width="28" height="4" rx="1" fill="#7f1d1d" />

              {/* Windshields & Cockpit */}
              <rect x="-10" y="-14" width="20" height="10" rx="2" fill="#0284c7" />
              <rect x="-8" y="-4" width="16" height="8" rx="1" fill="#0f172a" />
              <rect x="-9" y="4" width="18" height="6" rx="1" fill="#0369a1" />

              {/* Headlights & Taillights */}
              <rect x="-12" y="-20" width="5" height="2" fill="#fef08a" />
              <rect x="7" y="-20" width="5" height="2" fill="#fef08a" />
              <rect x="-12" y="14" width="6" height="2" fill="#fee2e2" />
              <rect x="6" y="14" width="6" height="2" fill="#fee2e2" />
            </g>
          </svg>
        </div>
      );

    case 'zuma':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0c131f] via-[#111c2e] to-[#070b12] ${className}`}>
          {/* Ancient Aztec Stone Pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:16px_16px]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="zuma-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="zuma-ball-red" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </radialGradient>
              <radialGradient id="zuma-ball-blue" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </radialGradient>
              <radialGradient id="zuma-ball-yellow" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </radialGradient>
              <radialGradient id="zuma-ball-green" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#065f46" />
              </radialGradient>
              <radialGradient id="zuma-ball-purple" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </radialGradient>
            </defs>

            {/* Ancient Stone Spiral Trench */}
            <path
              d="M 25,20 C 120,-10 185,30 185,85 C 185,130 115,138 65,115 C 30,95 40,55 85,50 C 130,45 150,85 130,105"
              stroke="#0f172a"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 25,20 C 120,-10 185,30 185,85 C 185,130 115,138 65,115 C 30,95 40,55 85,50 C 130,45 150,85 130,105"
              stroke="#334155"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 25,20 C 120,-10 185,30 185,85 C 185,130 115,138 65,115 C 30,95 40,55 85,50 C 130,45 150,85 130,105"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />

            {/* Golden Skull Pit at Endpoint */}
            <g transform="translate(130, 105)">
              <circle cx="0" cy="0" r="14" fill="#eab308" filter="url(#zuma-glow)" opacity="0.6" />
              <circle cx="0" cy="-2" r="11" fill="#facc15" />
              <rect x="-6" y="5" width="12" height="7" rx="2" fill="#ca8a04" />
              <circle cx="-4" cy="-3" r="3" fill="#0f172a" />
              <circle cx="4" cy="-3" r="3" fill="#0f172a" />
            </g>

            {/* Rolling Marble Chain Along The Trench */}
            {/* Red */}
            <circle cx="35" cy="22" r="7" fill="url(#zuma-ball-red)" />
            <circle cx="50" cy="18" r="7" fill="url(#zuma-ball-red)" />
            <circle cx="65" cy="16" r="7" fill="url(#zuma-ball-blue)" />
            {/* Blue */}
            <circle cx="80" cy="16" r="7" fill="url(#zuma-ball-blue)" />
            <circle cx="95" cy="18" r="7" fill="url(#zuma-ball-yellow)" />
            {/* Yellow */}
            <circle cx="110" cy="22" r="7" fill="url(#zuma-ball-yellow)" />
            <circle cx="125" cy="28" r="7" fill="url(#zuma-ball-green)" />
            {/* Green */}
            <circle cx="140" cy="36" r="7" fill="url(#zuma-ball-green)" />
            <circle cx="155" cy="48" r="7" fill="url(#zuma-ball-purple)" />
            {/* Outer curve */}
            <circle cx="175" cy="70" r="7" fill="url(#zuma-ball-purple)" />
            <circle cx="180" cy="85" r="7" fill="url(#zuma-ball-red)" />
            <circle cx="175" cy="100" r="7" fill="url(#zuma-ball-red)" />
            <circle cx="160" cy="115" r="7" fill="url(#zuma-ball-yellow)" />
            <circle cx="140" cy="125" r="7" fill="url(#zuma-ball-blue)" />
            <circle cx="120" cy="128" r="7" fill="url(#zuma-ball-blue)" />
            <circle cx="100" cy="125" r="7" fill="url(#zuma-ball-green)" />
            <circle cx="80" cy="120" r="7" fill="url(#zuma-ball-green)" />
            <circle cx="62" cy="110" r="7" fill="url(#zuma-ball-red)" />

            {/* Flying Bullet Ball towards Match */}
            <g transform="translate(94, 62)" filter="url(#zuma-glow)">
              <circle cx="0" cy="0" r="7" fill="url(#zuma-ball-yellow)" />
              {/* Sparkle Trail */}
              <circle cx="-8" cy="8" r="2.5" fill="#fef08a" opacity="0.8" />
              <circle cx="-16" cy="15" r="1.5" fill="#fef08a" opacity="0.5" />
            </g>

            {/* Central Zuma Stone Frog */}
            <g transform="translate(100, 78) rotate(-45)">
              {/* Shadow */}
              <ellipse cx="2" cy="3" rx="20" ry="17" fill="#000000" opacity="0.5" />

              {/* Stone Body */}
              <ellipse cx="0" cy="0" rx="19" ry="16" fill="#065f46" stroke="#047857" strokeWidth="1.5" />

              {/* Big Eyes */}
              <circle cx="11" cy="-10" r="6" fill="#047857" />
              <circle cx="11" cy="10" r="6" fill="#047857" />
              <circle cx="12" cy="-10" r="2.5" fill="#facc15" />
              <circle cx="12" cy="10" r="2.5" fill="#facc15" />

              {/* Next Ball on Frog Back */}
              <circle cx="-9" cy="0" r="5" fill="url(#zuma-ball-purple)" />

              {/* Current Ball in Mouth */}
              <circle cx="15" cy="0" r="6.5" fill="url(#zuma-ball-yellow)" filter="url(#zuma-glow)" />
            </g>

            {/* Golden Coin Target */}
            <g transform="translate(24, 115)" filter="url(#zuma-glow)">
              <circle cx="0" cy="0" r="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
              <text x="0" y="3" fill="#78350f" fontSize="8" fontWeight="bold" textAnchor="middle">$</text>
            </g>
          </svg>
        </div>
      );

    case 'contra':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#1c0808] via-[#2d0e14] to-[#0a0408] ${className}`}>
          {/* Volcanic Ember Particles & Grid */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ef4444_1px,transparent_1px)] bg-[size:14px_14px]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="contra-fire-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="contra-fire" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="65%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </radialGradient>
              <linearGradient id="contra-metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="contra-title-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>

            {/* Distant Volcanic Mountains & Blood Moon */}
            <circle cx="165" cy="30" r="18" fill="#dc2626" opacity="0.3" filter="url(#contra-fire-glow)" />
            <path d="M120 140 L145 65 L175 140 Z" fill="#2d151d" />
            <path d="M150 140 L175 75 L200 140 Z" fill="#1f0d14" />

            {/* Jungle Cliff Ground Platform */}
            <path d="M0 108 L95 108 L115 125 L200 125 L200 140 L0 140 Z" fill="#0f172a" />
            <path d="M0 108 L95 108" stroke="#15803d" strokeWidth="3" />
            <path d="M115 125 L200 125" stroke="#15803d" strokeWidth="2.5" />
            {/* Rock Strata Details */}
            <rect x="15" y="116" width="22" height="6" rx="2" fill="#1e293b" />
            <rect x="52" y="118" width="30" height="7" rx="2" fill="#1e293b" />
            <rect x="135" y="130" width="35" height="5" rx="2" fill="#1e293b" />

            {/* Red Falcon Defense Fortress Wall on Right */}
            <rect x="160" y="80" width="40" height="45" rx="3" fill="url(#contra-metal)" stroke="#334155" strokeWidth="1.5" />
            <circle cx="178" cy="98" r="8" fill="#450a0a" stroke="#dc2626" strokeWidth="2" filter="url(#contra-fire-glow)" />
            <circle cx="178" cy="98" r="4.5" fill="#ef4444" />
            {/* Cannon Barrel */}
            <rect x="150" y="96" width="12" height="4" rx="1" fill="#64748b" />
            <circle cx="149" cy="98" r="2.5" fill="#f87171" filter="url(#contra-fire-glow)" />

            {/* Flying Falcon Power-Up Capsule */}
            <g transform="translate(100, 32)">
              {/* Wings */}
              <path d="M-14 -1 L-6 4 L-14 9 Z" fill="#ef4444" />
              <path d="M14 -1 L6 4 L14 9 Z" fill="#ef4444" />
              {/* Capsule Pod */}
              <rect x="-7" y="-1" width="14" height="10" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" filter="url(#contra-fire-glow)" />
              <text x="0" y="7" fill="#78350f" fontSize="7" fontWeight="900" fontFamily="monospace" textAnchor="middle">S</text>
            </g>

            {/* Commando Hero (Bill Rizer) in Action Stance */}
            <g transform="translate(48, 78)">
              {/* Dynamic Shadow */}
              <ellipse cx="0" cy="30" rx="14" ry="4" fill="#000000" opacity="0.6" />

              {/* Red Headband Streaming Wind */}
              <path d="M-10 -15 C-18 -18 -22 -14 -30 -16" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M-10 -13 C-16 -14 -20 -11 -27 -12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />

              {/* Head & Face */}
              <circle cx="-5" cy="-14" r="5" fill="#fed7aa" />
              <rect x="-8" y="-16" width="7" height="2.5" fill="#ef4444" /> {/* Headband knot */}
              <rect x="-6" y="-19" width="6" height="3.5" rx="1" fill="#78350f" /> {/* Spiky Brown Hair */}

              {/* Muscular Torso with Blue Combat Vest */}
              <path d="M-8 -9 L2 -9 L0 5 L-7 5 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
              {/* Bare Muscular Shoulders / Arms */}
              <circle cx="-8" cy="-6" r="3" fill="#fed7aa" />
              <path d="M-8 -5 L-3 2 L8 -4" stroke="#fed7aa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

              {/* Heavy Assault Rifle */}
              <rect x="0" y="-7" width="22" height="4.5" rx="1" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
              <rect x="6" y="-2" width="4" height="6" fill="#1e293b" />
              <rect x="18" y="-9" width="3" height="2" fill="#ef4444" /> {/* Laser Sight */}

              {/* Combat Pants & Boots */}
              <rect x="-7" y="5" width="5" height="15" rx="2" fill="#1e40af" />
              <rect x="-1" y="5" width="5" height="15" rx="2" fill="#1e3a8a" />
              <rect x="-9" y="19" width="7" height="5" rx="1.5" fill="#0f172a" />
              <rect x="-2" y="19" width="7" height="5" rx="1.5" fill="#0f172a" />

              {/* Spread Gun Fireballs [S] - 5 Multi-angle Projectiles */}
              <g transform="translate(24, -5)" filter="url(#contra-fire-glow)">
                {/* Center Shot */}
                <circle cx="12" cy="0" r="4.5" fill="url(#contra-fire)" />
                {/* Up Diagonal */}
                <circle cx="11" cy="-7" r="4" fill="url(#contra-fire)" />
                <circle cx="9" cy="-14" r="3.5" fill="url(#contra-fire)" />
                {/* Down Diagonal */}
                <circle cx="11" cy="7" r="4" fill="url(#contra-fire)" />
                <circle cx="9" cy="14" r="3.5" fill="url(#contra-fire)" />
              </g>
            </g>

            {/* Retro Metallic CONTRA Title Badge */}
            <g transform="translate(18, 22)">
              <rect x="-4" y="-12" width="68" height="18" rx="4" fill="#030712" opacity="0.85" stroke="#ef4444" strokeWidth="1" />
              <text x="30" y="2" fill="url(#contra-title-grad)" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5" textAnchor="middle">
                CONTRA
              </text>
            </g>
          </svg>
        </div>
      );

    case 'mario':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] ${className}`}>
          {/* Subtle Cyber Arcade Scanline & Particle Dots */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] bg-[size:14px_14px]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="mario-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="mario-coin-shine" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="mario-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="55%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="mario-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#facc15" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="mario-pipe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="25%" stopColor="#22c55e" />
                <stop offset="60%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <linearGradient id="mario-brick" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="mario-title-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect width="200" height="140" fill="url(#mario-sky)" />

            {/* Radiant Sun Glow */}
            <circle cx="165" cy="25" r="32" fill="#fef08a" opacity="0.25" filter="url(#mario-glow)" />
            <circle cx="165" cy="25" r="14" fill="#ffffff" opacity="0.6" />

            {/* Super Mario Smiling Clouds */}
            <g transform="translate(18, 16)">
              <rect x="6" y="8" width="28" height="12" rx="6" fill="#ffffff" />
              <circle cx="14" cy="9" r="7" fill="#ffffff" />
              <circle cx="24" cy="7" r="9" fill="#ffffff" />
              {/* Cute oval black eyes */}
              <ellipse cx="17" cy="11" rx="1" ry="2.2" fill="#000000" />
              <ellipse cx="23" cy="11" rx="1" ry="2.2" fill="#000000" />
            </g>
            <g transform="translate(135, 32) scale(0.75)">
              <rect x="6" y="8" width="28" height="12" rx="6" fill="#ffffff" opacity="0.9" />
              <circle cx="14" cy="9" r="7" fill="#ffffff" />
              <circle cx="24" cy="7" r="9" fill="#ffffff" />
              <ellipse cx="17" cy="11" rx="1" ry="2.2" fill="#000000" />
              <ellipse cx="23" cy="11" rx="1" ry="2.2" fill="#000000" />
            </g>

            {/* Distant Snowcap Mountain */}
            <path d="M10 115 L45 55 L80 115 Z" fill="#475569" />
            <path d="M35 72 L45 55 L55 72 L50 68 L45 74 L40 68 Z" fill="#f8fafc" />

            {/* Classic Super Mario Rounded Green Hill with Eyes */}
            <ellipse cx="80" cy="115" rx="46" ry="38" fill="#16a34a" />
            <ellipse cx="80" cy="115" rx="40" ry="32" fill="#22c55e" opacity="0.4" />
            <ellipse cx="73" cy="90" rx="1.5" ry="3.5" fill="#0f172a" />
            <ellipse cx="87" cy="90" rx="1.5" ry="3.5" fill="#0f172a" />

            {/* Super Mario Ground with Grass Layer */}
            <rect x="0" y="115" width="200" height="25" fill="#92400e" />
            {/* Ground Brick Texture */}
            <line x1="0" y1="127" x2="200" y2="127" stroke="#78350f" strokeWidth="1" />
            <line x1="25" y1="115" x2="25" y2="127" stroke="#78350f" strokeWidth="1" />
            <line x1="75" y1="115" x2="75" y2="127" stroke="#78350f" strokeWidth="1" />
            <line x1="125" y1="115" x2="125" y2="127" stroke="#78350f" strokeWidth="1" />
            <line x1="175" y1="115" x2="175" y2="127" stroke="#78350f" strokeWidth="1" />
            <line x1="50" y1="127" x2="50" y2="140" stroke="#78350f" strokeWidth="1" />
            <line x1="100" y1="127" x2="100" y2="140" stroke="#78350f" strokeWidth="1" />
            <line x1="150" y1="127" x2="150" y2="140" stroke="#78350f" strokeWidth="1" />
            {/* Top Grass Strip with Frills */}
            <rect x="0" y="115" width="200" height="4" fill="#15803d" />
            <path d="M0 119 Q5 122 10 119 Q15 122 20 119 Q25 122 30 119 Q35 122 40 119 Q45 122 50 119 Q55 122 60 119 Q65 122 70 119 Q75 122 80 119 Q85 122 90 119 Q95 122 100 119 Q105 122 110 119 Q115 122 120 119 Q125 122 130 119 Q135 122 140 119 Q145 122 150 119 Q155 122 160 119 Q165 122 170 119 Q175 122 180 119 Q185 122 190 119 Q195 122 200 119" stroke="#16a34a" strokeWidth="1.5" fill="none" />

            {/* Iconic Green Warp Pipe on Right */}
            <rect x="156" y="85" width="30" height="30" fill="url(#mario-pipe)" stroke="#052e16" strokeWidth="1.2" />
            <rect x="152" y="72" width="38" height="14" rx="2" fill="url(#mario-pipe)" stroke="#052e16" strokeWidth="1.5" />
            {/* Pipe Highlight & Shadow */}
            <rect x="156" y="74" width="5" height="10" fill="#86efac" opacity="0.6" />
            <rect x="160" y="87" width="4" height="28" fill="#86efac" opacity="0.6" />

            {/* Brick Blocks & Golden [?] Question Block */}
            {/* Left Brick */}
            <rect x="52" y="52" width="18" height="18" rx="2" fill="url(#mario-brick)" stroke="#451a03" strokeWidth="1" />
            <line x1="52" y1="61" x2="70" y2="61" stroke="#78350f" strokeWidth="1" />
            <line x1="61" y1="52" x2="61" y2="61" stroke="#78350f" strokeWidth="0.8" />

            {/* Center [?] Question Block (Golden Glowing) */}
            <g filter="url(#mario-glow)">
              <rect x="74" y="50" width="20" height="20" rx="3" fill="url(#mario-gold)" stroke="#78350f" strokeWidth="1.2" />
              {/* Corner Screws */}
              <circle cx="77" cy="53" r="1" fill="#78350f" />
              <circle cx="91" cy="53" r="1" fill="#78350f" />
              <circle cx="77" cy="67" r="1" fill="#78350f" />
              <circle cx="91" cy="67" r="1" fill="#78350f" />
              {/* Bold [?] Question Mark */}
              <text x="84" y="66" fill="#78350f" fontSize="14" fontWeight="900" fontFamily="monospace" textAnchor="middle">?</text>
              <text x="83.5" y="65.5" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="monospace" textAnchor="middle">?</text>
            </g>

            {/* Right Brick */}
            <rect x="98" y="52" width="18" height="18" rx="2" fill="url(#mario-brick)" stroke="#451a03" strokeWidth="1" />
            <line x1="98" y1="61" x2="116" y2="61" stroke="#78350f" strokeWidth="1" />
            <line x1="107" y1="61" x2="107" y2="70" stroke="#78350f" strokeWidth="0.8" />

            {/* Bursting Golden Coin Popping Out */}
            <g transform="translate(84, 25)" filter="url(#mario-coin-shine)">
              <ellipse cx="0" cy="0" rx="6" ry="8" fill="url(#mario-gold)" stroke="#78350f" strokeWidth="1" />
              <ellipse cx="0" cy="0" rx="3.5" ry="5.5" stroke="#fef08a" strokeWidth="0.8" fill="none" />
              <rect x="-0.8" y="-4" width="1.6" height="8" fill="#ca8a04" />
              {/* Sparkle burst rays */}
              <line x1="-10" y1="-10" x2="-6" y2="-6" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="-10" x2="6" y2="-6" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="-12" x2="0" y2="-8" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Super Mushroom Sitting on Left Brick */}
            <g transform="translate(61, 40)">
              {/* Stem */}
              <rect x="-4" y="2" width="8" height="10" rx="2" fill="#fef3c7" />
              <rect x="-2" y="5" width="1.5" height="4" fill="#000000" />
              <rect x="0.5" y="5" width="1.5" height="4" fill="#000000" />
              {/* Red Dome */}
              <path d="M-8 3 Q0 -7 8 3 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
              {/* White Spots */}
              <circle cx="0" cy="-0.5" r="2.8" fill="#ffffff" />
              <circle cx="-6" cy="1" r="1.8" fill="#ffffff" />
              <circle cx="6" cy="1" r="1.8" fill="#ffffff" />
            </g>

            {/* Jumping Mario Figure in Action! */}
            <g transform="translate(82, 80)">
              {/* Raised Punching Fist (Top Right) */}
              <circle cx="12" cy="-26" r="4.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />

              {/* Red Mario Cap */}
              <path d="M-7 -22 C-7 -28 6 -30 9 -23 L14 -22 L8 -18 L-7 -18 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
              {/* White Cap Emblem with Red M */}
              <circle cx="2" cy="-22" r="3" fill="#ffffff" />
              <text x="2" y="-20" fill="#dc2626" fontSize="3.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">M</text>

              {/* Head & Face */}
              <circle cx="-1" cy="-14" r="5.5" fill="#fed7aa" />
              <circle cx="4" cy="-14" r="2.2" fill="#fed7aa" /> {/* Big round nose */}
              {/* Eye */}
              <ellipse cx="2" cy="-16" rx="0.9" ry="1.4" fill="#0f172a" />
              {/* Mustache */}
              <path d="M-2 -12 Q3 -13 6 -11 Q3 -10 0 -11 Z" fill="#451a03" />
              {/* Brown Hair & Sideburn */}
              <rect x="-6" y="-17" width="3" height="4" rx="1" fill="#451a03" />

              {/* Red Shirt Torso */}
              <rect x="-5" y="-9" width="9" height="10" rx="2" fill="#dc2626" />

              {/* Left Arm (Behind) */}
              <circle cx="-8" cy="-6" r="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

              {/* Blue Overalls */}
              <path d="M-5 -4 L4 -4 L3 6 L-4 6 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="0.8" />
              {/* Yellow Overall Button */}
              <circle cx="1.5" cy="-2.5" r="1.2" fill="#facc15" />

              {/* Kicking Legs in Jump Pose */}
              {/* Forward Leg */}
              <rect x="1" y="5" width="4.5" height="7" rx="1" fill="#1d4ed8" transform="rotate(-25 1 5)" />
              {/* Brown Shoe Forward */}
              <ellipse cx="6" cy="13" rx="4.5" ry="2.8" fill="#78350f" />

              {/* Back Leg Bent */}
              <rect x="-6" y="5" width="4.5" height="6" rx="1" fill="#1e40af" transform="rotate(30 -6 5)" />
              {/* Brown Shoe Back */}
              <ellipse cx="-8" cy="11" rx="4" ry="2.5" fill="#78350f" />
            </g>

            {/* Retro SUPER MARIO Title Badge */}
            <g transform="translate(14, 126)">
              <rect x="-4" y="-13" width="84" height="18" rx="4" fill="#030712" opacity="0.9" stroke="#ef4444" strokeWidth="1" />
              <text x="38" y="0" fill="url(#mario-title-grad)" fontSize="10.5" fontWeight="900" fontFamily="monospace" letterSpacing="1" textAnchor="middle">
                SUPER MARIO
              </text>
            </g>
          </svg>
        </div>
      );

    case 'duck-hunt':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#0369a1] ${className}`}>
          {/* Retro Radar Dots & CRT Lines */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22c55e_1px,transparent_1px)] bg-[size:14px_14px]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="dh-reticle-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="dh-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="65%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
              <linearGradient id="dh-title-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect width="200" height="140" fill="url(#dh-sky)" />

            {/* Distant Hills */}
            <path d="M0 100 Q60 85 120 95 Q170 88 200 95 L200 140 L0 140 Z" fill="#65a30d" opacity="0.6" />

            {/* Iconic Big Twisted Tree on the Left */}
            <g transform="translate(16, 30)">
              {/* Tree Canopy Foliage */}
              <circle cx="2" cy="0" r="18" fill="#15803d" />
              <circle cx="-10" cy="-6" r="14" fill="#166534" />
              <circle cx="12" cy="-4" r="15" fill="#15803d" />
              <circle cx="0" cy="-14" r="16" fill="#16a34a" />
              <circle cx="8" cy="-12" r="12" fill="#22c55e" opacity="0.7" />
              {/* Trunk */}
              <path d="M-2 15 C-4 35 -10 50 -12 70 L6 70 C4 50 1 35 0 15 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              {/* Branch */}
              <path d="M-1 28 Q12 25 18 20" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Foreground Lush Grass with Bush */}
            <rect x="0" y="105" width="200" height="35" fill="#15803d" />
            <path d="M0 105 Q10 98 20 105 Q30 96 40 105 Q50 97 60 105 Q70 95 80 105 Q90 96 100 105 Q110 98 120 105 Q130 95 140 105 Q150 97 160 105 Q170 95 180 105 Q190 98 200 105 L200 140 L0 140 Z" fill="#16a34a" />

            {/* Flying Clay Skeet Disc (Top Right) */}
            <g transform="translate(170, 32) rotate(-15)">
              <ellipse cx="0" cy="0" rx="14" ry="4" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
              <ellipse cx="0" cy="-0.5" rx="10" ry="2" fill="#fca5a5" />
              <line x1="-18" y1="6" x2="-26" y2="9" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Iconic Mallard Duck in Rapid Flight! */}
            <g transform="translate(112, 48)">
              {/* Wing Flap Speed Wind Lines */}
              <line x1="-24" y1="6" x2="-12" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="-22" y1="-4" x2="-10" y2="-2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

              {/* Body */}
              <ellipse cx="0" cy="0" rx="13" ry="8" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              {/* White Neck Ring */}
              <rect x="6" y="-6" width="3" height="6" rx="1" fill="#ffffff" />
              {/* Emerald Green Duck Head */}
              <circle cx="11" cy="-7" r="6" fill="#15803d" stroke="#052e16" strokeWidth="1" />
              {/* Eye */}
              <circle cx="12" cy="-8" r="1.5" fill="#ffffff" />
              <circle cx="12.5" cy="-8" r="0.8" fill="#000000" />
              {/* Yellow Bill */}
              <path d="M16 -7 L22 -6 L16 -4 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />

              {/* Upper Wing Flapping High */}
              <path d="M-4 -4 C-6 -22 6 -20 12 -6 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
              <path d="M0 -8 L8 -6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

              {/* Tail Feathers */}
              <path d="M-13 -2 L-18 -5 L-15 2 Z" fill="#451a03" />

              {/* Orange Webbed Feet */}
              <path d="M-4 6 L-2 11 L-6 11 Z" fill="#f97316" />
            </g>

            {/* NES Zapper Gun Crosshair Reticle Locked on Duck */}
            <g transform="translate(118, 44)" filter="url(#dh-reticle-glow)">
              <circle cx="0" cy="0" r="16" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.85" />
              <circle cx="0" cy="0" r="2.5" fill="#ef4444" />
              <line x1="-22" y1="0" x2="-10" y2="0" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="0" x2="22" y2="0" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="-22" x2="0" y2="-10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="10" x2="0" y2="22" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* The Famous Duck Hunt Dog Peeking from Grass */}
            <g transform="translate(68, 106)">
              {/* Brown Dog Head */}
              <ellipse cx="0" cy="-6" rx="9" ry="10" fill="#a16207" stroke="#713f12" strokeWidth="1" />
              {/* Snout */}
              <ellipse cx="0" cy="-3" rx="5" ry="4" fill="#fed7aa" />
              {/* Black Nose */}
              <circle cx="0" cy="-5" r="2" fill="#000000" />
              {/* Happy Eyes */}
              <path d="M-4 -9 Q-2 -12 0 -9" stroke="#000000" strokeWidth="1.2" fill="none" />
              <path d="M0 -9 Q2 -12 4 -9" stroke="#000000" strokeWidth="1.2" fill="none" />
              {/* Floppy Brown Ears */}
              <ellipse cx="-9" cy="-5" rx="3.5" ry="8" fill="#713f12" transform="rotate(15 -9 -5)" />
              <ellipse cx="9" cy="-5" rx="3.5" ry="8" fill="#713f12" transform="rotate(-15 9 -5)" />
              {/* Paws Resting on Grass */}
              <ellipse cx="-6" cy="4" rx="4" ry="3" fill="#fed7aa" stroke="#a16207" strokeWidth="1" />
              <ellipse cx="6" cy="4" rx="4" ry="3" fill="#fed7aa" stroke="#a16207" strokeWidth="1" />
            </g>

            {/* Retro DUCK HUNT Arcade Title Badge */}
            <g transform="translate(14, 126)">
              <rect x="-4" y="-13" width="76" height="18" rx="4" fill="#030712" opacity="0.9" stroke="#f59e0b" strokeWidth="1" />
              <text x="34" y="0" fill="url(#dh-title-grad)" fontSize="10.5" fontWeight="900" fontFamily="monospace" letterSpacing="1" textAnchor="middle">
                DUCK HUNT
              </text>
            </g>
          </svg>
        </div>
      );

    case 'circus-charlie':
      return (
        <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f172a] ${className}`}>
          {/* Subtle Circus Spotlight Glow */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:14px_14px]" />

          <svg className="w-full h-full" viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="circus-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="circus-fire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="circus-title-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>

            {/* Circus Big Top Tent Stripes Background */}
            <path d="M0 0 L200 0 L200 85 L0 85 Z" fill="#1e1b4b" />
            <path d="M20 0 L40 0 L35 85 L15 85 Z" fill="#431407" opacity="0.6" />
            <path d="M60 0 L80 0 L75 85 L55 85 Z" fill="#431407" opacity="0.6" />
            <path d="M100 0 L120 0 L115 85 L95 85 Z" fill="#431407" opacity="0.6" />
            <path d="M140 0 L160 0 L155 85 L135 85 Z" fill="#431407" opacity="0.6" />
            <path d="M180 0 L200 0 L195 85 L175 85 Z" fill="#431407" opacity="0.6" />

            {/* Glowing Spotlight Cone from Ceiling */}
            <polygon points="100,0 20,140 180,140" fill="#fef08a" opacity="0.12" filter="url(#circus-glow)" />

            {/* Cheering Spectator Silhouette Benches */}
            <path d="M0 72 Q50 68 100 72 Q150 68 200 72 L200 86 L0 86 Z" fill="#090d16" />
            {/* Silhouettes of heads */}
            {[10, 25, 40, 58, 72, 88, 105, 122, 138, 155, 172, 188].map(hx => (
              <circle key={hx} cx={hx} cy={70} r={3.5} fill="#090d16" />
            ))}

            {/* Circus Arena Floor with Star Trim */}
            <rect x="0" y="86" width="200" height="54" fill="#0284c7" />
            <rect x="0" y="86" width="200" height="5" fill="#f59e0b" />
            <rect x="0" y="118" width="200" height="22" fill="#0369a1" />

            {/* Flaming Fire Pot on Ground (Right) */}
            <g transform="translate(162, 110)">
              <rect x="-8" y="0" width="16" height="8" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              {/* Flames rising from pot */}
              <path d="M-6 0 Q-2 -16 0 0 Q2 -20 6 0 Z" fill="url(#circus-fire)" filter="url(#circus-glow)" />
            </g>

            {/* Flaming Fire Hoop (Center-Right) */}
            <g transform="translate(142, 68)" filter="url(#circus-glow)">
              {/* Outer Flaming Ring */}
              <ellipse cx="0" cy="0" rx="14" ry="32" stroke="url(#circus-fire)" strokeWidth="4.5" fill="none" />
              <ellipse cx="0" cy="0" rx="14" ry="32" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              {/* Fire Flame Licks along the Ring */}
              <path d="M-13 -18 Q-20 -24 -12 -12" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M13 -18 Q20 -24 12 -12" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M-13 18 Q-20 24 -12 12" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M13 18 Q20 24 12 12" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M0 -32 Q-4 -42 0 -36" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 32 Q4 42 0 36" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />

              {/* Bonus Money Pouch Hanging in Center of Hoop */}
              <g transform="translate(0, 0)">
                <ellipse cx="0" cy="2" rx="4" ry="4.5" fill="#facc15" stroke="#a16207" strokeWidth="0.8" />
                <text x="0" y="4.5" fill="#78350f" fontSize="5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">$</text>
              </g>
            </g>

            {/* Charlie the Clown Riding the Galloping Lion! */}
            <g transform="translate(70, 78)">
              {/* 1. Galloping Lion */}
              {/* Lion Body */}
              <ellipse cx="0" cy="18" rx="22" ry="12" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              {/* Lion White Belly */}
              <ellipse cx="0" cy="21" rx="16" ry="7" fill="#fde68a" />

              {/* Lion Back Legs (Galloping Back) */}
              <path d="M-14 20 L-26 30 L-22 34 L-12 24" fill="#d97706" />
              <path d="M-18 18 L-30 26 L-27 30 L-14 22" fill="#b45309" />

              {/* Lion Front Legs (Leaping Forward) */}
              <path d="M12 22 L26 32 L22 35 L10 26" fill="#d97706" />
              <path d="M16 20 L30 28 L27 31 L14 23" fill="#b45309" />

              {/* Lion Tail */}
              <path d="M-20 14 C-28 6 -32 18 -36 12" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="-37" cy="12" r="3" fill="#78350f" />

              {/* Lion Brown Fluffy Mane */}
              <circle cx="16" cy="10" r="14" fill="#78350f" />
              <circle cx="12" cy="4" r="9" fill="#92400e" />
              <circle cx="22" cy="12" r="8" fill="#92400e" />

              {/* Lion Head */}
              <circle cx="20" cy="10" r="8" fill="#f59e0b" />
              {/* Lion Snout */}
              <ellipse cx="25" cy="12" rx="4" ry="3.5" fill="#fde68a" />
              <circle cx="26" cy="10" r="1.5" fill="#451a03" />
              {/* Lion Fierce/Friendly Eye */}
              <circle cx="21" cy="7" r="1.5" fill="#ffffff" />
              <circle cx="21.5" cy="7" r="0.8" fill="#000000" />
              {/* Lion Ears */}
              <circle cx="14" cy="2" r="2.5" fill="#f59e0b" />

              {/* 2. Charlie the Clown Riding on Top */}
              {/* Blue Circus Pants */}
              <ellipse cx="-4" cy="11" rx="6" ry="5" fill="#2563eb" />
              {/* Red Circus Boots */}
              <ellipse cx="-4" cy="17" rx="3.5" ry="2" fill="#ef4444" />

              {/* Charlie's Torso (Yellow Circus Jumpsuit with Red Polka Dots) */}
              <rect x="-8" y="-3" width="9" height="11" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
              <circle cx="-5" cy="0" r="1" fill="#ef4444" />
              <circle cx="-2" cy="4" r="1" fill="#ef4444" />

              {/* Ruffled White Clown Collar */}
              <ellipse cx="-4" cy="-3" rx="6" ry="2.5" fill="#ffffff" />

              {/* Charlie's Head (White Clown Makeup) */}
              <circle cx="-4" cy="-10" r="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
              {/* Red Clown Nose */}
              <circle cx="-1" cy="-10" r="2" fill="#ef4444" />
              {/* Clown Smiling Painted Mouth */}
              <path d="M-3 -7 Q-1 -5 1 -7" stroke="#dc2626" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Happy Eye */}
              <circle cx="-2" cy="-12" r="1" fill="#0f172a" />
              {/* Red Clown Hair Tufts on Sides */}
              <circle cx="-10" cy="-10" r="2.5" fill="#f97316" />
              <circle cx="-9" cy="-13" r="2" fill="#f97316" />

              {/* Pointy Red Clown Party Hat with Blue Pom-Pom */}
              <path d="M-7 -15 L-3 -23 L0 -15 Z" fill="#ef4444" />
              <circle cx="-3" cy="-24" r="2" fill="#38bdf8" />

              {/* Charlie's Arms Waving to Crowd */}
              <path d="M-1 -2 L8 -7 L12 -12" stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="-12" r="2" fill="#ffffff" />
            </g>

            {/* Retro CIRCUS CHARLIE Arcade Title Badge */}
            <g transform="translate(14, 126)">
              <rect x="-4" y="-13" width="98" height="18" rx="4" fill="#030712" opacity="0.92" stroke="#f59e0b" strokeWidth="1" />
              <text x="45" y="0" fill="url(#circus-title-grad)" fontSize="10" fontWeight="900" fontFamily="monospace" letterSpacing="0.8" textAnchor="middle">
                CIRCUS CHARLIE
              </text>
            </g>
          </svg>
        </div>
      );

    case 'dig-dug':
      return (
        <div className={`w-full h-full relative overflow-hidden bg-slate-950 ${className}`}>
          <svg viewBox="0 0 240 140" className="w-full h-full block select-none">
            <defs>
              <linearGradient id="sky-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="dig-title-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="pooka-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
              <linearGradient id="fygar-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="60%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
              <linearGradient id="rock-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <filter id="flame-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Surface Sky (0 - 22) */}
            <rect x="0" y="0" width="240" height="20" fill="url(#sky-band)" />
            {/* Green Grass Border (20 - 26) */}
            <rect x="0" y="20" width="240" height="6" fill="#16a34a" />
            <path d="M0 26 L240 26" stroke="#22c55e" strokeWidth="1.5" />
            {/* Flowers on surface */}
            <circle cx="25" cy="18" r="2.5" fill="#f43f5e" />
            <circle cx="25" cy="18" r="1" fill="#facc15" />
            <circle cx="210" cy="18" r="2.5" fill="#eab308" />
            <circle cx="210" cy="18" r="1" fill="#ffffff" />
            <circle cx="225" cy="17" r="3" fill="#ec4899" />

            {/* Dirt Strata 1: Golden Sand (26 - 54) */}
            <rect x="0" y="26" width="240" height="28" fill="#ca8a04" />
            <line x1="0" y1="26" x2="240" y2="26" stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" />

            {/* Dirt Strata 2: Warm Brown (54 - 82) */}
            <rect x="0" y="54" width="240" height="28" fill="#a16207" />
            <line x1="0" y1="54" x2="240" y2="54" stroke="#d97706" strokeWidth="1" strokeDasharray="4 2" />

            {/* Dirt Strata 3: Orange Clay (82 - 110) */}
            <rect x="0" y="82" width="240" height="28" fill="#c2410c" />
            <line x1="0" y1="82" x2="240" y2="82" stroke="#ea580c" strokeWidth="1" strokeDasharray="5 3" />

            {/* Dirt Strata 4: Deep Crimson (110 - 140) */}
            <rect x="0" y="110" width="240" height="30" fill="#881337" />
            <line x1="0" y1="110" x2="240" y2="110" stroke="#be123c" strokeWidth="1" strokeDasharray="4 4" />

            {/* Underground Tunnels (Excavated Darkness #050811) */}
            {/* Vertical Tunnel Left */}
            <rect x="36" y="26" width="26" height="74" rx="4" fill="#050811" />
            {/* Horizontal Tunnel Middle */}
            <rect x="36" y="74" width="130" height="24" rx="4" fill="#050811" />
            {/* Vertical Shaft Right */}
            <rect x="144" y="44" width="24" height="60" rx="4" fill="#050811" />
            {/* Bottom Chamber */}
            <rect x="80" y="114" width="140" height="22" rx="4" fill="#050811" />

            {/* Falling Boulder Rock in Right Shaft */}
            <g transform="translate(156, 44)">
              <circle cx="0" cy="0" r="10" fill="url(#rock-grad)" stroke="#475569" strokeWidth="1.2" />
              {/* Rock Texture Cracks */}
              <path d="M-5 -4 L-1 -1 L-4 5" stroke="#1e293b" strokeWidth="1" fill="none" />
              <path d="M2 -6 L5 1 L1 6" stroke="#1e293b" strokeWidth="0.8" fill="none" />
              {/* Wobble / Speed lines */}
              <line x1="-12" y1="-5" x2="-12" y2="6" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <line x1="12" y1="-5" x2="12" y2="6" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            </g>

            {/* Dig Dug (Hero) in Middle Tunnel */}
            <g transform="translate(56, 86)">
              {/* White Suit Body */}
              <rect x="-8" y="-9" width="16" height="15" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              {/* Blue Helmet */}
              <circle cx="0" cy="-12" r="7.5" fill="#2563eb" />
              <path d="M-6 -12 C-6 -17 6 -17 6 -12 Z" fill="#3b82f6" />
              {/* Red Visor / Goggles */}
              <rect x="-5" y="-14" width="11" height="5" rx="2" fill="#ef4444" />
              <rect x="-3" y="-13" width="7" height="2.5" rx="1" fill="#ffffff" opacity="0.8" />
              {/* Feet (Digging boots) */}
              <rect x="-7" y="6" width="6" height="4" rx="1.5" fill="#1e3a8a" />
              <rect x="1" y="6" width="6" height="4" rx="1.5" fill="#1e3a8a" />
              {/* Shovel / Pump Unit on Back */}
              <rect x="-11" y="-7" width="4" height="11" rx="1" fill="#e11d48" />
              {/* Arm holding Pump Handle */}
              <path d="M3 -3 L9 -1" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
              <circle cx="9" cy="-1" r="2.5" fill="#f59e0b" />
            </g>

            {/* Pump Hose Wire Stretching to Monster */}
            <path
              d="M66 85 C80 84 95 85 106 85"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              fill="none"
            />
            {/* Harpoon Needle Point Stuck in Pooka */}
            <polygon points="106,82 112,85 106,88" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />

            {/* Pooka (Inflating Big Red Balloon Monster!) */}
            <g transform="translate(126, 86)">
              {/* Inflated Round Body with Pulse */}
              <circle cx="0" cy="0" r="14" fill="url(#pooka-grad)" stroke="#dc2626" strokeWidth="1.5" />
              {/* Big Yellow Goggles */}
              <ellipse cx="-4" cy="-3" rx="5" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              <ellipse cx="6" cy="-3" rx="5" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              {/* Bulging Black Eyes (Strained expression) */}
              <circle cx="-3" cy="-3" r="2" fill="#0f172a" />
              <circle cx="5" cy="-3" r="2" fill="#0f172a" />
              {/* Cute Little Yellow Feet */}
              <ellipse cx="-7" cy="13" rx="3.5" ry="2" fill="#facc15" />
              <ellipse cx="6" cy="13" rx="3.5" ry="2" fill="#facc15" />
              {/* Inflation Air Pressure Sparks */}
              <text x="-16" y="-12" fill="#facc15" fontSize="8" fontWeight="bold">💨</text>
              <text x="10" y="-12" fill="#facc15" fontSize="8" fontWeight="bold">💢</text>
            </g>

            {/* Fygar (Green Dragon in Bottom Chamber) */}
            <g transform="translate(160, 125)">
              {/* Green Dragon Body */}
              <ellipse cx="0" cy="0" rx="10" ry="7" fill="url(#fygar-grad)" stroke="#047857" strokeWidth="1" />
              {/* Dragon Head */}
              <circle cx="-8" cy="-2" r="5" fill="#10b981" />
              <circle cx="-10" cy="-3" r="1.5" fill="#fef08a" />
              <circle cx="-10" cy="-3" r="0.8" fill="#0f172a" />
              {/* Orange Wing */}
              <polygon points="0,-4 8,-12 4,-2" fill="#f97316" />
              {/* Tail with spike */}
              <path d="M10 0 Q14 -2 16 -6" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Fire Breath Burst */}
              <path
                d="M-13 -2 L-28 -8 L-24 -2 L-34 0 L-24 2 L-28 8 Z"
                fill="#f59e0b"
                filter="url(#flame-glow)"
              />
              <path
                d="M-13 -2 L-22 -4 L-20 -2 L-26 0 L-20 2 L-22 4 Z"
                fill="#ef4444"
              />
            </g>

            {/* Bonus Fruit (Carrot in Chamber) */}
            <g transform="translate(95, 125)">
              <polygon points="0,-5 8,0 0,5 -3,0" fill="#f97316" />
              <path d="M-3 0 L-7 -3 M-3 0 L-7 3" stroke="#22c55e" strokeWidth="1.5" />
            </g>

            {/* Retro DIG DUG Title Badge */}
            <g transform="translate(12, 128)">
              <rect x="-4" y="-14" width="68" height="19" rx="4" fill="#030712" opacity="0.94" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="30" y="0" fill="url(#dig-title-grad)" fontSize="11" fontWeight="900" fontFamily="monospace" letterSpacing="1.2" textAnchor="middle">
                DIG DUG
              </text>
            </g>
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
