import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Heart, Trophy, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  points: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export const GameBreakout: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('acegames_breakout_best') || 0);
  });
  const [lives, setLives] = useState(3);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play sound via soundManager state
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
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  // Game state refs for 60fps loop
  const stateRef = useRef({
    cw: 960,
    ch: 540,
    paddle: { x: 405, y: 500, w: 150, h: 16, speed: 10 },
    ball: { x: 480, y: 488, vx: 4.5, vy: -5.5, radius: 8, stuck: true },
    bricks: [] as Brick[],
    particles: [] as Particle[],
    keys: { left: false, right: false },
    score: 0,
    lives: 3,
    running: false,
  });

  const initBricks = () => {
    const rows = 5;
    const cols = 12;
    const bw = 70;
    const bh = 22;
    const pad = 8;
    const leftOffset = 16;
    const topOffset = 50;
    const colors = [
      { color: '#ef4444', pts: 50 }, // red
      { color: '#f97316', pts: 40 }, // orange
      { color: '#eab308', pts: 30 }, // yellow
      { color: '#10b981', pts: 20 }, // green
      { color: '#3b82f6', pts: 10 }, // blue
    ];

    const bricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: leftOffset + c * (bw + pad),
          y: topOffset + r * (bh + pad),
          w: bw,
          h: bh,
          color: colors[r].color,
          points: colors[r].pts,
          alive: true,
        });
      }
    }
    return bricks;
  };

  const resetGame = () => {
    const s = stateRef.current;
    s.paddle.x = (s.cw - s.paddle.w) / 2;
    s.ball.x = s.paddle.x + s.paddle.w / 2;
    s.ball.y = s.paddle.y - s.ball.radius - 2;
    s.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
    s.ball.vy = -4.5;
    s.ball.stuck = true;
    s.bricks = initBricks();
    s.particles = [];
    s.score = 0;
    s.lives = 3;
    s.running = true;

    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsWon(false);
    setIsPlaying(true);
  };

  const launchBall = () => {
    const s = stateRef.current;
    if (s.ball.stuck) {
      s.ball.stuck = false;
      playTone(550, 'triangle', 0.1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stateRef.current.bricks = initBricks();

    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        launchBall();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main animation loop
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      const { cw, ch, paddle, ball } = s;

      // Update paddle
      if (s.keys.left) paddle.x = Math.max(0, paddle.x - paddle.speed);
      if (s.keys.right) paddle.x = Math.min(cw - paddle.w, paddle.x + paddle.speed);

      // Update ball
      if (s.running && !ball.stuck) {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx;
          playTone(400, 'sine', 0.05);
        } else if (ball.x + ball.radius >= cw) {
          ball.x = cw - ball.radius;
          ball.vx = -ball.vx;
          playTone(400, 'sine', 0.05);
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy;
          playTone(450, 'sine', 0.05);
        }

        // Paddle collision
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.h &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.w &&
          ball.vy > 0
        ) {
          // Angle based on hit location
          const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const maxAngle = Math.PI / 3; // 60 degrees
          const angle = hitPos * maxAngle;
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = speed * Math.sin(angle);
          ball.vy = -speed * Math.cos(angle);
          ball.y = paddle.y - ball.radius - 1;
          soundManager.playBreakoutPaddle();
        }

        // Brick collision
        let remainingBricks = 0;
        for (const b of s.bricks) {
          if (!b.alive) continue;
          remainingBricks++;

          if (
            ball.x + ball.radius >= b.x &&
            ball.x - ball.radius <= b.x + b.w &&
            ball.y + ball.radius >= b.y &&
            ball.y - ball.radius <= b.y + b.h
          ) {
            b.alive = false;
            remainingBricks--;
            s.score += b.points;
            setScore(s.score);
            if (s.score > highScore) {
              setHighScore(s.score);
              localStorage.setItem('acegames_breakout_best', String(s.score));
            }

            // Particles
            for (let i = 0; i < 6; i++) {
              s.particles.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: b.color,
                life: 18,
                maxLife: 18,
              });
            }

            soundManager.playBreakoutBrick();

            // Determine bounce direction
            const prevX = ball.x - ball.vx;
            const prevY = ball.y - ball.vy;
            if (prevX <= b.x || prevX >= b.x + b.w) ball.vx = -ball.vx;
            if (prevY <= b.y || prevY >= b.y + b.h) ball.vy = -ball.vy;
            break;
          }
        }

        // Win check
        if (remainingBricks === 0) {
          s.running = false;
          setIsWon(true);
          setIsPlaying(false);
          soundManager.playVictory();
        }

        // Ball fell down
        if (ball.y - ball.radius > ch) {
          s.lives--;
          setLives(s.lives);
          soundManager.playExplosion();

          if (s.lives <= 0) {
            s.running = false;
            setIsGameOver(true);
            soundManager.playDefeat();
            setIsPlaying(false);
          } else {
            // Reset ball onto paddle
            ball.stuck = true;
            ball.x = paddle.x + paddle.w / 2;
            ball.y = paddle.y - ball.radius - 2;
            ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
            ball.vy = -4.5;
          }
        }
      } else if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.radius - 2;
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // DRAWING
      ctx.clearRect(0, 0, cw, ch);

      // Background grid subtle effect
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, cw, ch);

      // Top ceiling line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, cw, ch);

      // Draw bricks
      for (const b of s.bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        // Highlight top border
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, 3);
      }
      ctx.shadowBlur = 0;

      // Draw particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;

      // Draw paddle
      const paddleGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
      paddleGrad.addColorStop(0, '#38bdf8');
      paddleGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = paddleGrad;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [highScore, playTone]);

  // Touch / mouse dragging on canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = stateRef.current.cw / rect.width;
    const clientX = e.clientX - rect.left;
    const canvasX = clientX * scale;
    const p = stateRef.current.paddle;
    p.x = Math.max(0, Math.min(stateRef.current.cw - p.w, canvasX - p.w / 2));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    launchBall();
  };

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center select-none w-full h-full max-w-[min(96vw,1320px)] mx-auto p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px đồng bộ tất cả games */}
      <div className="game-top-hud w-full max-w-[min(96vw,1320px)] flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-2 mb-2 shadow-inner flex-shrink-0">
        {/* Left: Điểm Số & Kỷ Lục - Căn giữa tiêu đề và số liệu */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              Điểm Số
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono leading-none mt-1 text-center">
              {score}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 h-4 leading-none text-center">
              <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              <span>Kỷ Lục</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-yellow-400 font-mono leading-none mt-1 text-center">
              {highScore}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hearts */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 rounded-xl border border-white/5">
            {[1, 2, 3].map(i => (
              <Heart
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${i <= lives ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Massive 16:9 Widescreen Arcade Canvas container - Scaled to never exceed viewport */}
      <div className="game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-235px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] touch-none flex-shrink min-h-0">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className="w-full h-full cursor-pointer block"
        />

        {/* Start screen overlay */}
        {!isPlaying && !isGameOver && !isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-6 tracking-tight">Phá Gạch Classic</h3>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-5xl mb-2">💥</span>
            <h3 className="text-3xl font-black text-red-500 mb-6 ">HẾT LƯỢT!</h3>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-base shadow-xl shadow-red-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Lại
            </button>
          </div>
        )}

        {/* Won overlay */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-5xl mb-2">🏆</span>
            <h3 className="text-3xl font-black text-emerald-400 mb-6 ">CHIẾN THẮNG TUYỆT ĐỐI!</h3>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Chơi Ván Mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
