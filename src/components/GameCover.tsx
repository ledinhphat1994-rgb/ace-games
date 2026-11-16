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

    default:
      return (
        <div className={`w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center ${className}`}>
          <span className="text-5xl">🎮</span>
        </div>
      );
  }
};
