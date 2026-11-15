import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Sparkles,
  Bot,
  Users
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

type PongMode = '1p' | '2p';
type PongDifficulty = 'easy' | 'medium' | 'hard';

export const GamePong: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  // Settings from localStorage or defaults
  const [mode, setMode] = useState<PongMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pong');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode === '1p' || parsed.mode === '2p') return parsed.mode;
      }
    } catch {}
    return '1p';
  });
  const [difficulty, setDifficulty] = useState<PongDifficulty>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pong');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['easy', 'medium', 'hard'].includes(parsed.difficulty)) return parsed.difficulty;
      }
    } catch {}
    return 'medium';
  });
  const [targetScore, setTargetScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pong');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.targetScore === 'number') return parsed.targetScore;
      }
    } catch {}
    return 5;
  });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('ace_game_settings_pong', JSON.stringify({ mode, difficulty, targetScore }));
    } catch {}
  }, [mode, difficulty, targetScore]);

  // Scores
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [rallyCount, setRallyCount] = useState(0);

  // Audio synthesizer ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.08) => {
    if (!soundManager.isSoundOn()) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  // Game state ref for 60fps canvas loop
  const stateRef = useRef({
    cw: 960,
    ch: 540,
    p1: { x: 30, y: 225, w: 14, h: 90, speed: 9, targetY: 225 },
    p2: { x: 916, y: 225, w: 14, h: 90, speed: 6.5, targetY: 225 },
    ball: { 
      x: 480, 
      y: 270, 
      vx: 6.5, 
      vy: 0, 
      speed: 7.0, 
      radius: 8,
      trail: [] as TrailPoint[] 
    },
    particles: [] as Particle[],
    shake: 0,
    keys: {
      w: false,
      s: false,
      up: false,
      down: false,
    },
    p1Score: 0,
    p2Score: 0,
    rally: 0,
    targetScore: 5,
    mode: '1p' as PongMode,
    difficulty: 'medium' as PongDifficulty,
    isPlaying: false,
    isPaused: false,
  });

  // Sync state refs with React state
  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.difficulty = difficulty;
    stateRef.current.targetScore = targetScore;
    stateRef.current.isPaused = isPaused;
    stateRef.current.isPlaying = isPlaying;
    
    // Set AI speed based on difficulty
    if (difficulty === 'easy') stateRef.current.p2.speed = 4.8;
    else if (difficulty === 'medium') stateRef.current.p2.speed = 6.8;
    else stateRef.current.p2.speed = 8.6;
  }, [mode, difficulty, targetScore, isPaused, isPlaying]);

  // Reset ball to center
  const resetBall = useCallback((towardsP1: boolean) => {
    const s = stateRef.current;
    s.ball.x = s.cw / 2;
    s.ball.y = s.ch / 2;
    s.ball.speed = 7.0;
    s.ball.trail = [];
    const angle = (Math.random() * 0.6 - 0.3); // slight initial angle
    const dir = towardsP1 ? -1 : 1;
    s.ball.vx = dir * s.ball.speed * Math.cos(angle);
    s.ball.vy = s.ball.speed * Math.sin(angle);
    s.rally = 0;
    setRallyCount(0);
  }, []);

  // Spawn spark particles
  const spawnSparks = (x: number, y: number, color: string, count: number = 10) => {
    const particles = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 15,
      });
    }
  };

  // Start / Restart Game
  const resetGame = useCallback(() => {
    soundManager.playButtonClick();
    const s = stateRef.current;
    s.p1.y = s.ch / 2 - s.p1.h / 2;
    s.p2.y = s.ch / 2 - s.p2.h / 2;
    s.p1Score = 0;
    s.p2Score = 0;
    s.particles = [];
    s.shake = 0;
    setP1Score(0);
    setP2Score(0);
    setWinner(null);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    resetBall(Math.random() < 0.5);
  }, [resetBall]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'w' || e.key === 'W') k.w = true;
      if (e.key === 's' || e.key === 'S') k.s = true;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        k.up = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        k.down = true;
      }
      if (e.key === ' ' && !stateRef.current.isPlaying) {
        e.preventDefault();
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.key === 'w' || e.key === 'W') k.w = false;
      if (e.key === 's' || e.key === 'S') k.s = false;
      if (e.key === 'ArrowUp') k.up = false;
      if (e.key === 'ArrowDown') k.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame]);

  // Pointer controls on canvas (Mouse & Touch)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = stateRef.current.ch / rect.height;
    const scaleX = stateRef.current.cw / rect.width;
    const pointerY = (e.clientY - rect.top) * scaleY;
    const pointerX = (e.clientX - rect.left) * scaleX;

    const s = stateRef.current;
    if (s.mode === '1p') {
      // 1P: Pointer controls Left Paddle (P1)
      s.p1.targetY = Math.max(0, Math.min(s.ch - s.p1.h, pointerY - s.p1.h / 2));
      s.p1.y = s.p1.targetY;
    } else {
      // 2P: Left half controls P1, Right half controls P2
      if (pointerX < s.cw / 2) {
        s.p1.targetY = Math.max(0, Math.min(s.ch - s.p1.h, pointerY - s.p1.h / 2));
        s.p1.y = s.p1.targetY;
      } else {
        s.p2.targetY = Math.max(0, Math.min(s.ch - s.p2.h, pointerY - s.p2.h / 2));
        s.p2.y = s.p2.targetY;
      }
    }
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;
      const { cw, ch, p1, p2, ball } = s;

      // Update positions if playing and not paused
      if (s.isPlaying && !s.isPaused) {
        // --- 1. Paddle 1 (Keyboard support) ---
        if (s.keys.w) p1.y = Math.max(0, p1.y - p1.speed);
        if (s.keys.s) p1.y = Math.min(ch - p1.h, p1.y + p1.speed);

        // --- 2. Paddle 2 (AI or 2P Keyboard) ---
        if (s.mode === '2p') {
          if (s.keys.up) p2.y = Math.max(0, p2.y - p1.speed);
          if (s.keys.down) p2.y = Math.min(ch - p2.h, p2.y + p1.speed);
        } else {
          // AI Logic with difficulty-adjusted reaction and slight human-like delay
          const targetY = ball.y - p2.h / 2;
          const diffY = targetY - p2.y;
          // Only track if ball is moving towards AI or nearby
          if (ball.vx > 0 || ball.x > cw * 0.45) {
            if (Math.abs(diffY) > 8) {
              p2.y += Math.sign(diffY) * Math.min(Math.abs(diffY), p2.speed);
            }
          }
          p2.y = Math.max(0, Math.min(ch - p2.h, p2.y));
        }

        // --- 3. Ball Motion & Trail ---
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Add trail point
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        // Top & Bottom Wall Bounce
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          playTone(420, 'sine', 0.05);
          spawnSparks(ball.x, ball.y, '#38bdf8', 6);
        } else if (ball.y + ball.radius >= ch) {
          ball.y = ch - ball.radius;
          ball.vy = -Math.abs(ball.vy);
          playTone(420, 'sine', 0.05);
          spawnSparks(ball.x, ball.y, '#38bdf8', 6);
        }

        // --- 4. Paddle 1 Collision (Left - Cyan) ---
        if (
          ball.vx < 0 &&
          ball.x - ball.radius <= p1.x + p1.w &&
          ball.x + ball.radius >= p1.x &&
          ball.y >= p1.y - 6 &&
          ball.y <= p1.y + p1.h + 6
        ) {
          ball.x = p1.x + p1.w + ball.radius;
          // Calculate angle based on where ball hits paddle (-1 to 1)
          const hitOffset = (ball.y - (p1.y + p1.h / 2)) / (p1.h / 2);
          const angle = hitOffset * (Math.PI / 3); // Max 60 deg
          ball.speed = Math.min(15.0, ball.speed + 0.35); // Gradually speed up rally!
          ball.vx = ball.speed * Math.cos(angle);
          ball.vy = ball.speed * Math.sin(angle);

          s.rally++;
          setRallyCount(s.rally);
          playTone(580 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
          spawnSparks(ball.x, ball.y, '#22d3ee', 12);
        }

        // --- 5. Paddle 2 Collision (Right - Rose/Red) ---
        if (
          ball.vx > 0 &&
          ball.x + ball.radius >= p2.x &&
          ball.x - ball.radius <= p2.x + p2.w &&
          ball.y >= p2.y - 6 &&
          ball.y <= p2.y + p2.h + 6
        ) {
          ball.x = p2.x - ball.radius;
          const hitOffset = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
          const angle = hitOffset * (Math.PI / 3);
          ball.speed = Math.min(15.0, ball.speed + 0.35);
          ball.vx = -ball.speed * Math.cos(angle);
          ball.vy = ball.speed * Math.sin(angle);

          s.rally++;
          setRallyCount(s.rally);
          playTone(520 + Math.min(s.rally * 30, 400), 'triangle', 0.08);
          spawnSparks(ball.x, ball.y, '#f43f5e', 12);
        }

        // --- 6. Goal Scored (Left / Right boundary) ---
        if (ball.x + ball.radius < 0) {
          // Player 2 Scores!
          s.p2Score++;
          setP2Score(s.p2Score);
          s.shake = 12;
          playTone(180, 'sawtooth', 0.25);
          spawnSparks(ball.x, ball.y, '#f43f5e', 30);

          if (s.p2Score >= s.targetScore) {
            s.isPlaying = false;
            setIsPlaying(false);
            setWinner('p2');
            setIsGameOver(true);
            if (s.mode === '1p') soundManager.playDefeat();
            else soundManager.playVictory();
          } else {
            resetBall(true);
          }
        } else if (ball.x - ball.radius > cw) {
          // Player 1 Scores!
          s.p1Score++;
          setP1Score(s.p1Score);
          s.shake = 12;
          playTone(680, 'sawtooth', 0.25);
          spawnSparks(ball.x, ball.y, '#22d3ee', 30);

          if (s.p1Score >= s.targetScore) {
            s.isPlaying = false;
            setIsPlaying(false);
            setWinner('p1');
            setIsGameOver(true);
            soundManager.playVictory();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          } else {
            resetBall(false);
          }
        }

        // Update particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life >= p.maxLife) {
            s.particles.splice(i, 1);
          }
        }

        if (s.shake > 0) s.shake--;
      }

      // --- RENDERING CANVAS ---
      ctx.save();

      // Screen Shake
      if (s.shake > 0) {
        const dx = (Math.random() - 0.5) * s.shake;
        const dy = (Math.random() - 0.5) * s.shake;
        ctx.translate(dx, dy);
      }

      // Background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, cw, ch);

      // Cyberpunk Grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < cw; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 0; y < ch; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Center Divider Neon Line
      ctx.setLineDash([12, 14]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cw / 2, 0);
      ctx.lineTo(cw / 2, ch);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Giant Neon Scores in the background
      ctx.font = '900 110px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // P1 Score (Left - Cyan)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillText(s.p1Score.toString(), cw / 4, ch / 2);
      
      // P2 Score (Right - Rose)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
      ctx.fillText(s.p2Score.toString(), (3 * cw) / 4, ch / 2);

      // Draw Ball Trail
      if (s.isPlaying) {
        for (let i = 0; i < ball.trail.length; i++) {
          const pt = ball.trail[i];
          const alpha = (i + 1) / (ball.trail.length * 2.5);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ball.radius * (0.4 + 0.6 * (i / ball.trail.length)), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.fill();
        }
      }

      // Draw Ball with Outer Glow
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // Draw Paddle 1 (Left - Cyan Neon)
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(p1.x, p1.y, p1.w, p1.h, 6);
      ctx.fill();
      // Inner highlight
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.roundRect(p1.x + 2, p1.y + 4, p1.w - 4, p1.h - 8, 3);
      ctx.fill();
      ctx.restore();

      // Draw Paddle 2 (Right - Rose Neon)
      ctx.save();
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.roundRect(p2.x, p2.y, p2.w, p2.h, 6);
      ctx.fill();
      // Inner highlight
      ctx.fillStyle = '#fecdd3';
      ctx.beginPath();
      ctx.roundRect(p2.x + 2, p2.y + 4, p2.w - 4, p2.h - 8, 3);
      ctx.fill();
      ctx.restore();

      // Draw Particles
      for (const p of s.particles) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [playTone, resetBall]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070b14]">
      {/* Top HUD: Mode, Difficulty, Target Score, Pause, Restart */}
      <div className="game-top-hud flex items-center justify-between w-full max-w-[min(98vw,1440px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2">
        {/* Left: Mode & Difficulty */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                if (mode !== '1p') {
                  setMode('1p');
                  resetGame();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                mode === '1p'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Đấu Máy</span>
            </button>
            <button
              onClick={() => {
                if (mode !== '2p') {
                  setMode('2p');
                  resetGame();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                mode === '2p'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2 Người</span>
            </button>
          </div>

          {/* Difficulty selector (Only in 1P mode) */}
          {mode === '1p' && (
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
              {(['easy', 'medium', 'hard'] as PongDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    resetGame();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                    difficulty === d
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Live Match Score Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
            <span className="text-xs sm:text-sm font-black text-cyan-400">P1</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{p1Score}</span>
          </div>

          <span className="text-gray-500 font-black text-base sm:text-lg">:</span>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{p2Score}</span>
            <span className="text-xs sm:text-sm font-black text-rose-400">{mode === '1p' ? 'AI' : 'P2'}</span>
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
          </div>

          {rallyCount > 2 && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-bold text-cyan-300 animate-pulse">
              <span>Đường bóng:</span>
              <span className="font-mono">{rallyCount}</span>
            </div>
          )}
        </div>

        {/* Right: Target score, Pause, Restart */}
        <div className="flex items-center gap-2">
          {/* Target Score Selector */}
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {[5, 7, 11].map((pts) => (
              <button
                key={pts}
                onClick={() => {
                  setTargetScore(pts);
                  resetGame();
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  targetScore === pts
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={`Chạm ${pts} điểm để thắng`}
              >
                {pts}đ
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena Box */}
      <div className="game-arena-box relative w-full aspect-[16/9] max-w-[min(98vw,1440px)] max-h-[calc(100dvh-130px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-cyan-500/50 shadow-[0_0_60px_rgba(6,182,212,0.35)] touch-none flex-1 min-h-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerMove={handlePointerMove}
          className="w-full h-full block cursor-pointer"
        />

        {/* Start Game Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-wider mb-2">BÓNG BÀN ARCADE</h3>
            <p className="text-sm text-cyan-300 font-semibold mb-6 max-w-sm">
              {mode === '1p' ? 'Di chuyển chuột để đón bóng đấu với AI.' : 'P1 dùng W/S, P2 dùng phím Mũi tên.'}
            </p>
            <button
              onClick={resetGame}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-lg shadow-[0_0_35px_rgba(6,182,212,0.6)] transition cursor-pointer active:scale-95 flex items-center gap-2.5 tracking-wider uppercase"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU CHƠI</span>
            </button>
          </div>
        )}

        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30">
            <Pause className="w-14 h-14 text-cyan-400 animate-pulse" />
            <span className="text-2xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
            <button
              onClick={() => setIsPaused(false)}
              className="px-8 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-base uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/40"
            >
              Tiếp Tục
            </button>
          </div>
        )}

        {/* Match Finished Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in">
            <div className="w-full max-w-sm bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(6,182,212,0.35)] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Trophy className={`w-8 h-8 ${winner === 'p1' ? 'text-cyan-400' : 'text-rose-400'} animate-bounce`} />
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                  {mode === '1p' 
                    ? (winner === 'p1' ? 'BẠN CHIẾN THẮNG!' : 'MÁY CHIẾN THẮNG!')
                    : (winner === 'p1' ? 'NGƯỜI CHƠI 1 THẮNG!' : 'NGƯỜI CHƠI 2 THẮNG!')
                  }
                </h3>
                <p className="text-sm text-gray-300 font-semibold mt-1">
                  Tỷ số chung cuộc: <strong className="text-cyan-400 font-mono text-base">{p1Score}</strong> - <strong className="text-rose-400 font-mono text-base">{p2Score}</strong>
                </p>
              </div>

              <button
                onClick={resetGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
              >
                Chơi Ván Mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
