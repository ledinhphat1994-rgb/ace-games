import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Play } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export const GameFlappy: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('acegames_flappy_best') || '0', 10);
  });
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');

  // Widescreen physics state (960 x 540)
  const birdRef = useRef({
    x: 180,
    y: 240,
    velocity: 0,
    radius: 18,
    gravity: 0.42,
    jump: -7.6,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef<number>(0);
  const cloudsRef = useRef<{ x: number; y: number; s: number; speed: number }[]>([
    { x: 100, y: 70, s: 1.2, speed: 0.6 },
    { x: 420, y: 110, s: 0.9, speed: 0.4 },
    { x: 740, y: 80, s: 1.1, speed: 0.5 },
    { x: 920, y: 140, s: 0.8, speed: 0.3 },
  ]);

  // Audio tone generator connected to global soundManager
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundManager.isSoundOn()) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch { }
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
      birdRef.current.velocity = birdRef.current.jump;
      soundManager.playWingFlap();
    } else if (gameState === 'PLAYING') {
      birdRef.current.velocity = birdRef.current.jump;
      soundManager.playWingFlap();
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    birdRef.current.y = 240;
    birdRef.current.velocity = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  }, []);

  // Keyboard space / arrow up listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'GAMEOVER') resetGame();
        else jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, resetGame]);

  // Main 16:9 widescreen arcade loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 960;
    const height = 540;
    const pipeGap = 155;
    const pipeWidth = 72;
    const pipeSpeed = 3.2;
    const groundHeight = 60;

    let animId = 0;

    const loop = () => {
      // 1. Sky Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height - groundHeight);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#7dd3fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Parallax Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      cloudsRef.current.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x < -150) cloud.x = width + 50;

        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 25 * cloud.s, 0, Math.PI * 2);
        ctx.arc(cloud.x + 30 * cloud.s, cloud.y - 10 * cloud.s, 35 * cloud.s, 0, Math.PI * 2);
        ctx.arc(cloud.x + 65 * cloud.s, cloud.y, 25 * cloud.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Distant City / Mountain Silhouette
      ctx.fillStyle = 'rgba(30, 58, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, height - groundHeight);
      ctx.lineTo(80, height - groundHeight - 60);
      ctx.lineTo(160, height - groundHeight);
      ctx.lineTo(280, height - groundHeight - 90);
      ctx.lineTo(400, height - groundHeight);
      ctx.lineTo(540, height - groundHeight - 75);
      ctx.lineTo(680, height - groundHeight);
      ctx.lineTo(800, height - groundHeight - 110);
      ctx.lineTo(960, height - groundHeight);
      ctx.fill();

      // 4. Ground
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, height - groundHeight, width, groundHeight);
      // Grass strip
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, height - groundHeight, width, 14);
      // Ground accents
      ctx.fillStyle = '#15803d';
      for (let gx = 0; gx < width; gx += 40) {
        ctx.fillRect(gx, height - groundHeight + 10, 18, 4);
      }

      const bird = birdRef.current;

      if (gameState === 'PLAYING') {
        // Physics update
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Spawn pipes across widescreen distance
        if (
          pipesRef.current.length === 0 ||
          pipesRef.current[pipesRef.current.length - 1].x < width - 260
        ) {
          const minH = 60;
          const maxH = height - groundHeight - pipeGap - minH;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          const bottomH = height - groundHeight - pipeGap - topH;

          pipesRef.current.push({
            x: width,
            topHeight: topH,
            bottomHeight: bottomH,
            passed: false,
          });
        }

        // Draw and update pipes
        for (let i = 0; i < pipesRef.current.length; i++) {
          const p = pipesRef.current[i];
          p.x -= pipeSpeed;

          // Top Pipe
          const topGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
          topGrad.addColorStop(0, '#22c55e');
          topGrad.addColorStop(0.5, '#4ade80');
          topGrad.addColorStop(1, '#15803d');
          ctx.fillStyle = topGrad;
          ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
          // Top Pipe Lip
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(p.x - 4, p.topHeight - 24, pipeWidth + 8, 24);
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 3;
          ctx.strokeRect(p.x - 4, p.topHeight - 24, pipeWidth + 8, 24);

          // Bottom Pipe
          const bottomY = height - groundHeight - p.bottomHeight;
          ctx.fillStyle = topGrad;
          ctx.fillRect(p.x, bottomY, pipeWidth, p.bottomHeight);
          // Bottom Pipe Lip
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(p.x - 4, bottomY, pipeWidth + 8, 24);
          ctx.strokeRect(p.x - 4, bottomY, pipeWidth + 8, 24);

          // Pass scoring
          if (!p.passed && p.x + pipeWidth < bird.x) {
            p.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            soundManager.playFlappyScore();

            setBestScore(prev => {
              if (scoreRef.current > prev) {
                localStorage.setItem('acegames_flappy_best', scoreRef.current.toString());
                return scoreRef.current;
              }
              return prev;
            });
          }

          // Pipe collision
          if (
            bird.x + bird.radius > p.x &&
            bird.x - bird.radius < p.x + pipeWidth
          ) {
            if (
              bird.y - bird.radius < p.topHeight ||
              bird.y + bird.radius > bottomY
            ) {
              setGameState('GAMEOVER');
              soundManager.playExplosion();
            }
          }
        }

        // Clean off-screen pipes
        pipesRef.current = pipesRef.current.filter(p => p.x + pipeWidth > -20);

        // Ground & Ceiling collision
        if (bird.y + bird.radius >= height - groundHeight) {
          bird.y = height - groundHeight - bird.radius;
          setGameState('GAMEOVER');
          soundManager.playExplosion();
        }
        if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0;
        }
      }

      // Draw Arcade Bird (Yellow round with beak & wings)
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const angle = Math.min(Math.PI / 3.5, Math.max(-Math.PI / 4, (bird.velocity * 3.5 * Math.PI) / 180));
      ctx.rotate(angle);

      // Bird Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-5, 2, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(10, -5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(26, 3);
      ctx.lineTo(14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, playTone]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px đồng bộ tất cả games */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 min-h-[52px] shadow-inner flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6 z-10">
          {/* Cột Điểm Số: Căn giữa hoàn toàn theo trục dọc */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-4 leading-none text-center">
              Điểm Số
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none mt-1 text-center">
              {score}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* Cột Kỷ Lục: Căn giữa hoàn toàn theo trục dọc, con số nằm chính giữa tiêu đề */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 h-4 leading-none text-center">
              <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span>Kỷ Lục</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-yellow-300 font-mono leading-none mt-1 text-center">
              {bestScore}
            </span>
          </div>
        </div>

        {/* Nút Chơi Lại bên phải */}
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              resetGame();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
            title="Chơi Lại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi Lại</span>
          </button>
        </div>
      </div>

      {/* Massive 16:9 Widescreen Arcade Board - Scaled to never exceed container */}
      <div
        className="game-arena-box relative rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.35)] border-4 border-amber-500/40 cursor-pointer w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] flex-shrink min-h-0"
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full block"
        />

        {/* Start / Idle Screen */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4">
            <span className="text-6xl mb-3 animate-bounce">🐥</span>
            <h3 className="text-3xl sm:text-4xl font-black text-amber-400 mb-6 ">FLAPPY BIRD</h3>
            <button
              onClick={e => {
                e.stopPropagation();
                jump();
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-xl transition text-base flex items-center gap-2 transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <span className="text-5xl mb-2">💥</span>
            <h3 className="text-3xl sm:text-4xl font-black text-rose-500 mb-6 ">GAME OVER</h3>

            <button
              onClick={e => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-xl transition text-base flex items-center gap-2 transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

