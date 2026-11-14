import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Heart, Trophy, Sparkles } from 'lucide-react';

interface Bullet {
  x: number;
  y: number;
  vy: number;
  isEnemy: boolean;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
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

export const GameSpaceShooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('acegames_space_best') || 0);
  });
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'laser' | 'hit' | 'boom' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'boom') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
      }
    } catch {}
  }, [soundEnabled]);

  const stateRef = useRef({
    cw: 440,
    ch: 560,
    player: { x: 200, y: 500, w: 36, h: 36, speed: 6 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as { x: number; y: number; s: number; v: number }[],
    keys: { left: false, right: false, up: false, down: false, fire: false },
    score: 0,
    lives: 3,
    wave: 1,
    running: false,
    lastFire: 0,
    enemyDir: 1,
  });

  const initEnemies = (currWave: number) => {
    const enemies: Enemy[] = [];
    const rows = Math.min(5, 2 + currWave);
    const cols = 6;
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#38bdf8', '#34d399'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({
          x: 40 + c * 60,
          y: 40 + r * 42,
          w: 36,
          h: 26,
          hp: r === 0 ? 2 : 1,
          maxHp: r === 0 ? 2 : 1,
          color: colors[r % colors.length],
          points: (rows - r) * 50,
        });
      }
    }
    return enemies;
  };

  const resetGame = () => {
    const s = stateRef.current;
    s.player.x = (s.cw - s.player.w) / 2;
    s.player.y = 500;
    s.bullets = [];
    s.enemies = initEnemies(1);
    s.particles = [];
    s.score = 0;
    s.lives = 3;
    s.wave = 1;
    s.running = true;

    setScore(0);
    setLives(3);
    setWave(1);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Init background stars
    const stars: { x: number; y: number; s: number; v: number }[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 440,
        y: Math.random() * 560,
        s: Math.random() * 2 + 0.5,
        v: Math.random() * 1.5 + 0.5,
      });
    }
    stateRef.current.stars = stars;
    stateRef.current.enemies = initEnemies(1);

    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) stateRef.current.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) stateRef.current.keys.down = true;
      if (e.code === 'Space') {
        e.preventDefault();
        stateRef.current.keys.fire = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) stateRef.current.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) stateRef.current.keys.down = false;
      if (e.code === 'Space') stateRef.current.keys.fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main 60fps loop
    const loop = () => {
      animId = requestAnimationFrame(loop);
      const s = stateRef.current;
      const { cw, ch, player } = s;

      // Update stars
      for (const st of s.stars) {
        st.y += st.v;
        if (st.y > ch) {
          st.y = 0;
          st.x = Math.random() * cw;
        }
      }

      if (s.running) {
        // Player movement
        if (s.keys.left) player.x = Math.max(10, player.x - player.speed);
        if (s.keys.right) player.x = Math.min(cw - player.w - 10, player.x + player.speed);
        if (s.keys.up) player.y = Math.max(300, player.y - player.speed);
        if (s.keys.down) player.y = Math.min(ch - player.h - 15, player.y + player.speed);

        // Player shooting
        const now = Date.now();
        if (s.keys.fire && now - s.lastFire > 180) {
          s.lastFire = now;
          s.bullets.push({ x: player.x + player.w / 2, y: player.y, vy: -9, isEnemy: false });
          playSound('laser');
        }

        // Enemy movement
        let hitEdge = false;
        for (const en of s.enemies) {
          en.x += s.enemyDir * (1 + s.wave * 0.3);
          if (en.x <= 15 || en.x + en.w >= cw - 15) hitEdge = true;
        }
        if (hitEdge) {
          s.enemyDir = -s.enemyDir;
          for (const en of s.enemies) en.y += 14;
        }

        // Enemy random firing
        if (Math.random() < 0.02 + s.wave * 0.005 && s.enemies.length > 0) {
          const shooter = s.enemies[Math.floor(Math.random() * s.enemies.length)];
          s.bullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, vy: 4 + s.wave * 0.5, isEnemy: true });
        }

        // Update bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.y += b.vy;

          if (b.y < -10 || b.y > ch + 10) {
            s.bullets.splice(i, 1);
            continue;
          }

          // Player bullet hitting enemy
          if (!b.isEnemy) {
            for (let j = s.enemies.length - 1; j >= 0; j--) {
              const en = s.enemies[j];
              if (b.x >= en.x && b.x <= en.x + en.w && b.y >= en.y && b.y <= en.y + en.h) {
                en.hp--;
                s.bullets.splice(i, 1);

                if (en.hp <= 0) {
                  // Explosion
                  for (let p = 0; p < 8; p++) {
                    s.particles.push({
                      x: en.x + en.w / 2,
                      y: en.y + en.h / 2,
                      vx: (Math.random() - 0.5) * 6,
                      vy: (Math.random() - 0.5) * 6,
                      color: en.color,
                      life: 20,
                      maxLife: 20,
                    });
                  }
                  s.score += en.points;
                  setScore(s.score);
                  if (s.score > highScore) {
                    setHighScore(s.score);
                    localStorage.setItem('acegames_space_best', String(s.score));
                  }
                  s.enemies.splice(j, 1);
                  playSound('boom');
                } else {
                  playSound('hit');
                }
                break;
              }
            }
          } else {
            // Enemy bullet hitting player
            if (
              b.x >= player.x &&
              b.x <= player.x + player.w &&
              b.y >= player.y &&
              b.y <= player.y + player.h
            ) {
              s.bullets.splice(i, 1);
              s.lives--;
              setLives(s.lives);
              playSound('hit');

              // Player damage sparks
              for (let p = 0; p < 10; p++) {
                s.particles.push({
                  x: player.x + player.w / 2,
                  y: player.y + player.h / 2,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  color: '#38bdf8',
                  life: 22,
                  maxLife: 22,
                });
              }

              if (s.lives <= 0) {
                s.running = false;
                setIsGameOver(true);
                setIsPlaying(false);
                playSound('gameover');
              }
            }
          }
        }

        // Wave clear -> next wave
        if (s.enemies.length === 0) {
          s.wave++;
          setWave(s.wave);
          s.enemies = initEnemies(s.wave);
        }

        // Enemies reached bottom
        for (const en of s.enemies) {
          if (en.y + en.h >= player.y) {
            s.running = false;
            setIsGameOver(true);
            setIsPlaying(false);
            playSound('gameover');
            break;
          }
        }
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // RENDER
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, cw, ch);

      // Draw stars
      for (const st of s.stars) {
        ctx.fillStyle = `rgba(255,255,255,${st.s * 0.4})`;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      }

      // Draw enemies
      for (const en of s.enemies) {
        ctx.fillStyle = en.color;
        ctx.shadowColor = en.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(en.x, en.y, en.w, en.h, 5);
        ctx.fill();

        // Eye lights
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(en.x + 8, en.y + 7, 5, 5);
        ctx.fillRect(en.x + en.w - 13, en.y + 7, 5, 5);
      }
      ctx.shadowBlur = 0;

      // Draw bullets
      for (const b of s.bullets) {
        if (!b.isEnemy) {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x - 2, b.y, 4, 12);
        } else {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      // Draw player spaceship
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(player.x + player.w / 2, player.y);
      ctx.lineTo(player.x + player.w, player.y + player.h);
      ctx.lineTo(player.x + player.w / 2, player.y + player.h - 8);
      ctx.lineTo(player.x, player.y + player.h);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Engine flame
      if (s.running) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(player.x + 12, player.y + player.h - 6);
        ctx.lineTo(player.x + player.w - 12, player.y + player.h - 6);
        ctx.lineTo(player.x + player.w / 2, player.y + player.h + 8 + Math.random() * 6);
        ctx.closePath();
        ctx.fill();
      }

      // Draw particles
      for (const p of s.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [highScore, playSound]);

  // Touch and drag support for mobile
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = stateRef.current.cw / rect.width;
    const clientX = e.clientX - rect.left;
    const canvasX = clientX * scale;
    const p = stateRef.current.player;
    p.x = Math.max(10, Math.min(stateRef.current.cw - p.w - 10, canvasX - p.w / 2));
    stateRef.current.keys.fire = true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    stateRef.current.keys.fire = true;
  };

  const handlePointerUp = () => {
    stateRef.current.keys.fire = false;
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full h-full max-w-[min(96vw,calc((100vh-140px)*440/560),820px)] mx-auto p-1">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-2 mb-2 shadow-inner">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Điểm số</div>
            <div className="text-2xl font-black text-amber-400 font-mono leading-none">{score}</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Kỷ lục</div>
              <div className="text-base font-bold text-yellow-400 font-mono leading-none">{highScore}</div>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Đợt (Wave)</div>
            <div className="text-sm font-bold text-cyan-400 font-mono leading-none">#{wave}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(i => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-colors ${i <= lives ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300"
            title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Massive Canvas */}
      <div className="relative w-full aspect-[440/560] max-h-[min(96vw*560/440,calc(100vh-160px),880px)] bg-[#060814] rounded-3xl overflow-hidden border-4 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] touch-none">
        <canvas
          ref={canvasRef}
          width={440}
          height={560}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Start screen overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Chiến Cơ Không Gian</h3>
            <p className="text-xs text-gray-400 max-w-xs mb-6">
              Bắn hạ các hạm đội ngoài hành tinh! Né đạn la-de và sống sót qua các đợt tấn công dồn dập.
            </p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Xuất Kích Ngay
            </button>
          </div>
        )}

        {/* Game Over overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-4xl mb-2">🚀💥</span>
            <h3 className="text-2xl font-black text-rose-500 mb-1">Chiến Cơ Bị Phá Hủy!</h3>
            <p className="text-sm text-gray-300 mb-2">Điểm số của bạn:</p>
            <p className="text-3xl font-black text-amber-400 font-mono mb-6">{score}</p>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Thử Lại Ngay
            </button>
          </div>
        )}
      </div>

      {/* Control Tips */}
      <div className="w-full max-w-[440px] mt-2 flex items-center justify-between text-xs text-gray-400 px-2">
        <span>🎮 Dùng phím A/D, ←/→ hoặc Kéo chuột/ngón tay để bắn</span>
        <button
          onClick={resetGame}
          className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80"
        >
          <RotateCcw className="w-3 h-3" /> Đặt lại
        </button>
      </div>
    </div>
  );
};
