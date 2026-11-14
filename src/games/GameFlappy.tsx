import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Play } from 'lucide-react';

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

  // Game physics state
  const birdRef = useRef({
    x: 60,
    y: 180,
    velocity: 0,
    radius: 14,
    gravity: 0.38,
    jump: -6.8,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const frameIdRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // Play simple sound with Web Audio API
  const playBeep = useCallback((freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext muted/blocked by browser
    }
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
      birdRef.current.velocity = birdRef.current.jump;
      playBeep(450, 0.1);
    } else if (gameState === 'PLAYING') {
      birdRef.current.velocity = birdRef.current.jump;
      playBeep(450, 0.1);
    }
  }, [gameState, playBeep]);

  const resetGame = useCallback(() => {
    birdRef.current.y = 180;
    birdRef.current.velocity = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const pipeGap = 115;
    const pipeWidth = 52;
    const pipeSpeed = 2.4;

    const loop = () => {
      // 1. Clear background (Sky)
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(0, 0, width, height);

      // Clouds decoration
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(80, 70, 25, 0, Math.PI * 2);
      ctx.arc(115, 65, 35, 0, Math.PI * 2);
      ctx.arc(150, 70, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(260, 110, 20, 0, Math.PI * 2);
      ctx.arc(290, 105, 30, 0, Math.PI * 2);
      ctx.arc(320, 110, 20, 0, Math.PI * 2);
      ctx.fill();

      // Ground
      const groundHeight = 50;
      ctx.fillStyle = '#D97706';
      ctx.fillRect(0, height - groundHeight, width, groundHeight);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(0, height - groundHeight, width, 12);

      const bird = birdRef.current;

      if (gameState === 'PLAYING') {
        // Apply physics
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Spawn pipes
        if (
          pipesRef.current.length === 0 ||
          pipesRef.current[pipesRef.current.length - 1].x < width - 170
        ) {
          const minHeight = 45;
          const maxHeight = height - groundHeight - pipeGap - minHeight;
          const topH = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          const bottomH = height - groundHeight - pipeGap - topH;

          pipesRef.current.push({
            x: width,
            topHeight: topH,
            bottomHeight: bottomH,
            passed: false,
          });
        }

        // Move and draw pipes
        for (let i = 0; i < pipesRef.current.length; i++) {
          const p = pipesRef.current[i];
          p.x -= pipeSpeed;

          // Draw Top Pipe
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
          // Pipe cap
          ctx.fillStyle = '#16A34A';
          ctx.fillRect(p.x - 3, p.topHeight - 20, pipeWidth + 6, 20);

          // Draw Bottom Pipe
          const bottomY = height - groundHeight - p.bottomHeight;
          ctx.fillStyle = '#22C55E';
          ctx.fillRect(p.x, bottomY, pipeWidth, p.bottomHeight);
          // Pipe cap
          ctx.fillStyle = '#16A34A';
          ctx.fillRect(p.x - 3, bottomY, pipeWidth + 6, 20);

          // Check score pass
          if (!p.passed && p.x + pipeWidth < bird.x) {
            p.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            playBeep(650, 0.12);

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
              bird.y + bird.radius > height - groundHeight - p.bottomHeight
            ) {
              setGameState('GAMEOVER');
              playBeep(180, 0.3);
            }
          }
        }

        // Remove off-screen pipes
        pipesRef.current = pipesRef.current.filter(p => p.x + pipeWidth > -10);

        // Ground / Ceiling collision
        if (bird.y + bird.radius >= height - groundHeight) {
          bird.y = height - groundHeight - bird.radius;
          setGameState('GAMEOVER');
          playBeep(180, 0.3);
        }
        if (bird.y - bird.radius <= 0) {
          bird.y = bird.radius;
          bird.velocity = 0;
        }
      }

      // Draw Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 4 * Math.PI) / 180));
      ctx.rotate(angle);

      // Body (Yellow)
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#D97706';
      ctx.stroke();

      // Wing
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(6, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak (Orange)
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(11, -2);
      ctx.lineTo(21, 2);
      ctx.lineTo(11, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Loop frame
      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [gameState, playBeep]);

  // Keyboard Space to jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-[min(94vw,540px)] mx-auto select-none p-1 sm:p-2">
      {/* Score Header */}
      <div className="flex items-center justify-between w-full mb-2 px-3 py-2 bg-slate-900/90 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Điểm</span>
            <span className="text-2xl font-black text-amber-400 font-mono leading-none">{score}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Kỷ Lục</span>
              <span className="text-base font-bold text-amber-300 font-mono leading-none">{bestScore}</span>
            </div>
          </div>
        </div>

        {gameState !== 'GAMEOVER' && (
          <button
            onClick={e => {
              e.stopPropagation();
              resetGame();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl transition"
            title="Chơi lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Massive Canvas Container */}
      <div 
        className="relative rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] border-4 border-amber-500/40 cursor-pointer w-full max-w-[min(96vw,calc((100vh-140px)*3/4),720px)] max-h-[min(96vw*4/3,calc(100vh-150px),880px)] aspect-[3/4]"
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={480}
          className="w-full h-full block"
        />

        {/* Start / Idle Screen */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4">
            <span className="text-5xl mb-3 animate-bounce">🐥</span>
            <h3 className="text-2xl font-black text-amber-300 mb-2">FLAPPY BIRD</h3>
            <p className="text-xs text-white/90 mb-4 text-center">Chạm vào màn hình hoặc bấm phím Space để chim bay lên!</p>
            <button
              onClick={e => {
                e.stopPropagation();
                jump();
              }}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-900" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <h3 className="text-3xl font-black text-rose-500 mb-6 font-['Orbitron']">GAME OVER</h3>
            
            <button
              onClick={e => {
                e.stopPropagation();
                resetGame();
              }}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-2xl shadow-xl transition text-base flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại (Phím Space)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
