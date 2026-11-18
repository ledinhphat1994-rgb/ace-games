import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Heart, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 410;

type StageType = 1 | 2 | 3; // 1: Lion & Fire Hoops, 2: Tightrope & Monkeys, 3: Trampoline
type GameState = 'playing' | 'stage_clear' | 'game_over' | 'paused';

interface FireHoop {
  id: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  vx: number;
  hasMoney: boolean;
  moneyCollected: boolean;
  isPot?: boolean;
}

interface Monkey {
  id: number;
  x: number;
  y: number;
  color: 'blue' | 'brown';
  vx: number;
  isJumping: boolean;
  jumpVy: number;
  jumpTimer: number;
}

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

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const GameCircusCharlie: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React UI States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_circuscharlie_highscore') || '20000', 10);
    } catch {
      return 20000;
    }
  });
  const [lives, setLives] = useState<number>(3);
  const [stage, setStage] = useState<StageType>(1);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [metersLeft, setMetersLeft] = useState<number>(100);

  // References for 60 FPS Loop
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const stageRef = useRef(stage);
  const gameStateRef = useRef(gameState);

  // Player Charlie & Mount State
  const playerRef = useRef({
    x: 140, // screen x fixed in scrolling camera
    worldX: 0, // distance travelled in meters (0 to 100m)
    y: GROUND_Y,
    vy: 0,
    isGrounded: true,
    vx: 0,
    runFrame: 0,
    animTimer: 0,
    isDead: false,
    deathTimer: 0,
    celebrateTimer: 0,
  });

  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  // Obstacles
  const hoopsRef = useRef<FireHoop[]>([]);
  const monkeysRef = useRef<Monkey[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);

  // Sync state refs
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const addScore = useCallback((pts: number, x: number, y: number) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      try {
        localStorage.setItem('acegames_circuscharlie_highscore', scoreRef.current.toString());
      } catch {}
    }
    floatersRef.current.push({
      x,
      y,
      text: `+${pts}`,
      color: '#facc15',
      life: 40,
    });
  }, [highScore]);

  // Khởi tạo Màn Chơi (Generate Obstacles for Stage)
  const initStage = useCallback((stg: StageType) => {
    stageRef.current = stg;
    setStage(stg);
    setGameState('playing');
    setMetersLeft(100);

    const p = playerRef.current;
    p.worldX = 0;
    p.y = stg === 2 ? 340 : GROUND_Y;
    p.vy = 0;
    p.vx = 0;
    p.isGrounded = true;
    p.isDead = false;
    p.deathTimer = 0;
    p.celebrateTimer = 0;

    hoopsRef.current = [];
    monkeysRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];

    if (stg === 1) {
      // Stage 1: Cưỡi sư tử nhảy qua vòng lửa và chậu lửa
      // World distance: 0 to 100m. 1 meter = 40 world pixels. Total length = 4000px.
      for (let m = 10; m < 96; m += 7 + Math.random() * 4) {
        const isPot = Math.random() > 0.65;
        if (isPot) {
          // Stationary Fire Pot on ground
          hoopsRef.current.push({
            id: Math.random(),
            x: m * 40,
            y: GROUND_Y,
            radiusX: 14,
            radiusY: 20,
            vx: 0,
            hasMoney: false,
            moneyCollected: false,
            isPot: true,
          });
        } else {
          // Moving Fire Hoop
          const isSmall = Math.random() > 0.45;
          const hasMoney = isSmall && Math.random() > 0.3;
          hoopsRef.current.push({
            id: Math.random(),
            x: m * 40,
            y: GROUND_Y - (isSmall ? 48 : 58),
            radiusX: isSmall ? 18 : 26,
            radiusY: isSmall ? 40 : 54,
            vx: -(1.4 + Math.random() * 0.8),
            hasMoney,
            moneyCollected: false,
            isPot: false,
          });
        }
      }
    } else if (stg === 2) {
      // Stage 2: Đi Dây Vượt Khỉ
      for (let m = 12; m < 96; m += 6 + Math.random() * 5) {
        const isBrown = Math.random() > 0.4;
        monkeysRef.current.push({
          id: Math.random(),
          x: m * 40,
          y: 340,
          color: isBrown ? 'brown' : 'blue',
          vx: -(1.8 + Math.random() * 0.6),
          isJumping: false,
          jumpVy: 0,
          jumpTimer: Math.random() * 2,
        });
      }
    } else if (stg === 3) {
      // Stage 3: Nhảy Bạt Lò Xo
      // Trampolines spaced every 8-12m
      for (let m = 10; m < 95; m += 9 + Math.random() * 4) {
        hoopsRef.current.push({
          id: Math.random(),
          x: m * 40,
          y: GROUND_Y - 45,
          radiusX: 20,
          radiusY: 45,
          vx: -(1.2 + Math.random() * 0.6),
          hasMoney: Math.random() > 0.5,
          moneyCollected: false,
          isPot: false,
        });
      }
    }
  }, []);

  const startNewGame = useCallback((stg: StageType = 1) => {
    soundManager.playButtonClick();
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    livesRef.current = 3;
    initStage(stg);
  }, [initStage]);

  // Xử lý khi Charlie bị bỏng lửa hoặc va chạm chướng ngại vật
  const handlePlayerDeath = useCallback(() => {
    const p = playerRef.current;
    if (p.isDead) return;
    p.isDead = true;
    p.deathTimer = 1.6;
    soundManager.playCircusFail();

    // Fire & Smoke explosion particles
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: p.x + 20,
        y: p.y - 20,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        size: 3 + Math.random() * 4,
        life: 40,
        maxLife: 40,
      });
    }

    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setGameState('game_over');
        soundManager.playDefeat();
      }
      return next;
    });
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'KeyA') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'KeyD') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'Space' || e.key === 'KeyK') {
        keysRef.current.jump = true;
        const p = playerRef.current;
        if (p.isGrounded && !p.isDead && gameStateRef.current === 'playing') {
          p.vy = stageRef.current === 2 ? -10.5 : -12.5;
          p.isGrounded = false;
          soundManager.playCircusJump();
        }
      }
      if (e.key === '1') initStage(1);
      if (e.key === '2') initStage(2);
      if (e.key === '3') initStage(3);
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'KeyA') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'KeyD') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'Space' || e.key === 'KeyK') {
        keysRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initStage]);

  // Main 60 FPS Engine Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const st = gameStateRef.current;
      const p = playerRef.current;
      const stg = stageRef.current;
      const groundLevel = stg === 2 ? 340 : GROUND_Y;

      // ==========================================
      // 1. UPDATE GAME PHYSICS & LOGIC
      // ==========================================
      if (st === 'playing') {
        if (p.isDead) {
          p.deathTimer -= dt;
          if (p.deathTimer <= 0 && livesRef.current > 0) {
            // Respawn slightly back
            p.isDead = false;
            p.worldX = Math.max(0, p.worldX - 80);
            p.y = groundLevel;
            p.vy = 0;
            p.isGrounded = true;
          }
        } else if (p.celebrateTimer > 0) {
          p.celebrateTimer -= dt;
          p.animTimer += dt * 6;
          p.runFrame = Math.floor(p.animTimer) % 2;
        } else {
          // Horizontal running speed
          const runSpeed = 190;
          if (keysRef.current.right) {
            p.vx = runSpeed;
            p.animTimer += dt * 10;
            p.runFrame = Math.floor(p.animTimer) % 4;
          } else if (keysRef.current.left) {
            p.vx = -runSpeed * 0.75;
            p.animTimer += dt * 7;
            p.runFrame = Math.floor(p.animTimer) % 4;
          } else {
            p.vx = 0;
            p.runFrame = 0;
          }

          p.worldX = Math.max(0, p.worldX + p.vx * dt);
          const remainingMeters = Math.max(0, 100 - Math.floor(p.worldX / 40));
          setMetersLeft(remainingMeters);

          // Gravity and jumping
          if (!p.isGrounded) {
            p.vy += 32 * dt;
            p.y += p.vy;
            if (p.y >= groundLevel) {
              p.y = groundLevel;
              p.vy = 0;
              p.isGrounded = true;
            }
          }

          // Stage Finishing Check: Reaching 100m podium
          if (p.worldX >= 3900) {
            p.celebrateTimer = 3.0;
            p.vx = 0;
            p.isGrounded = true;
            p.y = groundLevel - 20; // Jump onto victory podium
            setGameState('stage_clear');
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            soundManager.playCircusStageClear();
            setTimeout(() => {
              if (stageRef.current < 3) {
                initStage((stageRef.current + 1) as StageType);
              } else {
                initStage(1);
              }
            }, 3000);
          }

          // 1.1 Obstacles Update & Collision Detection (Stage 1 & 3: Fire Hoops)
          if (stg === 1 || stg === 3) {
            hoopsRef.current.forEach(h => {
              h.x += h.vx;

              // Screen coordinates for hoop relative to player worldX
              const screenHoopX = h.x - p.worldX + p.x;

              // Only check nearby hoops
              if (screenHoopX > 40 && screenHoopX < CANVAS_WIDTH - 40) {
                // Check Coin / Money Bag collection in hoop center
                if (h.hasMoney && !h.moneyCollected) {
                  const distMoney = Math.hypot(p.x - screenHoopX, (p.y - 30) - h.y);
                  if (distMoney < 28) {
                    h.moneyCollected = true;
                    addScore(500, screenHoopX, h.y - 10);
                    soundManager.playCircusBonus();
                  }
                }

                // Check collision with fire flames
                if (h.isPot) {
                  // Fire Pot collision (trapezoid at ground)
                  const dx = Math.abs(p.x - screenHoopX);
                  const dy = Math.abs((p.y - 12) - h.y);
                  if (dx < 22 && dy < 24) {
                    handlePlayerDeath();
                  }
                } else {
                  // Fire Ring collision
                  // Danger zone: the ring's outer rim
                  const dx = Math.abs(p.x - screenHoopX);
                  const dy = Math.abs((p.y - 28) - h.y);

                  // If inside inner clearing: SAFE! If touching fire rim: HIT!
                  const distFromCenter = Math.hypot(dx / h.radiusX, dy / h.radiusY);
                  if (distFromCenter > 0.72 && distFromCenter < 1.25 && dx < h.radiusX + 8) {
                    handlePlayerDeath();
                  }
                }
              }
            });
          }

          // 1.2 Obstacles Update & Collision Detection (Stage 2: Monkeys)
          if (stg === 2) {
            monkeysRef.current.forEach(m => {
              m.x += m.vx;

              // Jumping Brown Monkeys
              if (m.color === 'brown') {
                m.jumpTimer += dt;
                if (!m.isJumping && m.jumpTimer > 2.0) {
                  m.isJumping = true;
                  m.jumpVy = -9.5;
                  m.jumpTimer = 0;
                }
                if (m.isJumping) {
                  m.jumpVy += 28 * dt;
                  m.y += m.jumpVy;
                  if (m.y >= 340) {
                    m.y = 340;
                    m.isJumping = false;
                  }
                }
              }

              const screenMonkeyX = m.x - p.worldX + p.x;
              if (screenMonkeyX > 50 && screenMonkeyX < CANVAS_WIDTH - 50) {
                const distMonkey = Math.hypot(p.x - screenMonkeyX, p.y - m.y);
                if (distMonkey < 26) {
                  handlePlayerDeath();
                }
              }
            });
          }
        }
      }

      // Update Particles
      particlesRef.current.forEach((pt, idx) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) particlesRef.current.splice(idx, 1);
      });

      // Update Floating Texts
      floatersRef.current.forEach((fl, idx) => {
        fl.y -= 1.2;
        fl.life -= 1;
        if (fl.life <= 0) floatersRef.current.splice(idx, 1);
      });

      // ==========================================
      // 2. RENDER RETRO 8-BIT CIRCUS GRAPHICS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2.1 Circus Big Top Ceiling & Tent Backdrop
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Parallax Circus Tent Stripes
      const stripeOffset = (p.worldX * 0.25) % 80;
      for (let sx = -80; sx < CANVAS_WIDTH + 80; sx += 80) {
        ctx.fillStyle = '#311042';
        ctx.beginPath();
        ctx.moveTo(sx - stripeOffset, 0);
        ctx.lineTo(sx + 40 - stripeOffset, 0);
        ctx.lineTo(sx + 30 - stripeOffset, 280);
        ctx.lineTo(sx - 10 - stripeOffset, 280);
        ctx.fill();
      }

      // Spotlights sweeping through arena
      ctx.save();
      const spotAngle = Math.sin(now / 1200) * 0.35;
      ctx.translate(CANVAS_WIDTH / 2, 0);
      ctx.rotate(spotAngle);
      const spotGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      spotGrad.addColorStop(0, 'rgba(254, 240, 138, 0.2)');
      spotGrad.addColorStop(1, 'rgba(254, 240, 138, 0.01)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-140, CANVAS_HEIGHT);
      ctx.lineTo(140, CANVAS_HEIGHT);
      ctx.lineTo(20, 0);
      ctx.fill();
      ctx.restore();

      // Cheering Spectator Silhouette Benches (Tiered seating)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 260, CANVAS_WIDTH, 45);
      // Spectator silhouettes with animated waving arms
      const crowdOffset = (p.worldX * 0.4) % 36;
      for (let cx = -36; cx < CANVAS_WIDTH + 36; cx += 36) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - crowdOffset, 256, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 8 - crowdOffset, 262, 16, 15);
      }

      // 2.2 Circus Arena Floor (Stage 1 / 3) or Highwire Tightrope (Stage 2)
      if (stg === 2) {
        // Stage 2: Tightrope Arena
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 342);
        ctx.lineTo(CANVAS_WIDTH, 342);
        ctx.stroke();

        // Safety Net below
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let nx = 0; nx < CANVAS_WIDTH; nx += 20) {
          ctx.beginPath();
          ctx.moveTo(nx, 450); ctx.lineTo(nx + 20, 480);
          ctx.moveTo(nx + 20, 450); ctx.lineTo(nx, 480);
          ctx.stroke();
        }
      } else {
        // Stage 1 & 3: Classic Blue/Gold Circus Ring Floor
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // Gold Trim Border with Repeating Star Diamonds
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);

        // Sawdust track line
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(0, GROUND_Y + 45, CANVAS_WIDTH, CANVAS_HEIGHT - (GROUND_Y + 45));

        // Distance meter markers every 10 meters along the track
        for (let m = 0; m <= 100; m += 10) {
          const markerWorldX = m * 40;
          const markerScreenX = markerWorldX - p.worldX + p.x;
          if (markerScreenX > -80 && markerScreenX < CANVAS_WIDTH + 80) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${100 - m}M`, markerScreenX, GROUND_Y + 28);
            ctx.fillRect(markerScreenX - 2, GROUND_Y + 8, 4, 8);
          }
        }

        // Victory Finish Podium at 0m (WorldX = 3920)
        const podiumScreenX = 3920 - p.worldX + p.x;
        if (podiumScreenX > -150 && podiumScreenX < CANVAS_WIDTH + 150) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(podiumScreenX - 45, GROUND_Y - 24, 90, 24);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(podiumScreenX - 50, GROUND_Y - 32, 100, 8);
          ctx.font = '900 13px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText('GOAL', podiumScreenX, GROUND_Y - 8);
        }
      }

      // 2.3 Render Obstacles: Fire Hoops & Fire Pots (Stage 1 & 3)
      if (stg === 1 || stg === 3) {
        hoopsRef.current.forEach(h => {
          const sx = h.x - p.worldX + p.x;
          if (sx < -60 || sx > CANVAS_WIDTH + 60) return;

          if (h.isPot) {
            // Stationary Fire Pot
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(sx - 16, h.y);
            ctx.lineTo(sx + 16, h.y);
            ctx.lineTo(sx + 12, h.y + 18);
            ctx.lineTo(sx - 12, h.y + 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Flickering Pot Fire
            const fH = 22 + Math.sin(now / 80 + h.id) * 6;
            const fireGrad = ctx.createLinearGradient(sx, h.y, sx, h.y - fH);
            fireGrad.addColorStop(0, '#fef08a');
            fireGrad.addColorStop(0.3, '#f97316');
            fireGrad.addColorStop(1, '#dc2626');
            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.moveTo(sx - 12, h.y);
            ctx.quadraticCurveTo(sx - 4, h.y - fH, sx, h.y - fH - 4);
            ctx.quadraticCurveTo(sx + 4, h.y - fH, sx + 12, h.y);
            ctx.fill();
          } else {
            // Moving Flaming Ring
            ctx.save();
            ctx.translate(sx, h.y);

            // Back half of fire hoop
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(0, 0, h.radiusX, h.radiusY, 0, Math.PI / 2, Math.PI * 3 / 2);
            ctx.stroke();

            // Flickering flame bursts around hoop
            for (let f = 0; f < 8; f++) {
              const ang = (f / 8) * Math.PI * 2 + (now / 200);
              const fx = Math.cos(ang) * h.radiusX;
              const fy = Math.sin(ang) * h.radiusY;
              ctx.fillStyle = f % 2 === 0 ? '#fde047' : '#ef4444';
              ctx.beginPath();
              ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
              ctx.fill();
            }

            // Golden Bonus Money Pouch in Center
            if (h.hasMoney && !h.moneyCollected) {
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#b45309';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.fillStyle = '#78350f';
              ctx.font = '900 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('$', 0, 1);
            }

            // Front half of fire hoop
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, h.radiusX, h.radiusY, 0, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();

            ctx.restore();
          }
        });
      }

      // 2.4 Render Monkeys (Stage 2)
      if (stg === 2) {
        monkeysRef.current.forEach(m => {
          const sx = m.x - p.worldX + p.x;
          if (sx < -40 || sx > CANVAS_WIDTH + 40) return;

          ctx.save();
          ctx.translate(sx, m.y);

          // Monkey Body
          ctx.fillStyle = m.color === 'blue' ? '#0284c7' : '#92400e';
          ctx.beginPath();
          ctx.ellipse(0, -10, 10, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Monkey Head
          ctx.beginPath();
          ctx.arc(0, -26, 8, 0, Math.PI * 2);
          ctx.fill();

          // Face & Ears
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.ellipse(0, -25, 5, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.arc(-2, -26, 1, 0, Math.PI * 2);
          ctx.arc(2, -26, 1, 0, Math.PI * 2);

          // Tail curling up
          ctx.strokeStyle = m.color === 'blue' ? '#0284c7' : '#92400e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(8, -10);
          ctx.quadraticCurveTo(18, -25, 12, -35);
          ctx.stroke();

          ctx.restore();
        });
      }

      // 2.5 Render Charlie & Mount (Lion or Tightrope Acrobat)
      if (!p.isDead) {
        ctx.save();
        ctx.translate(p.x, p.y);

        if (stg === 1 || stg === 3) {
          // ===============================
          // 1. GALLOPING LION MOUNT
          // ===============================
          const frame = p.runFrame;

          // Lion Body
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(0, -16, 26, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.ellipse(2, -12, 18, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Lion Legs (Animated Gallop)
          ctx.fillStyle = '#d97706';
          if (!p.isGrounded) {
            // In-flight Jump pose (Paws outstretched)
            ctx.fillRect(16, -12, 18, 8); // Front paws
            ctx.fillRect(-28, -12, 16, 8); // Back paws
          } else if (frame % 2 === 0) {
            ctx.fillRect(8, -8, 8, 16);
            ctx.fillRect(-16, -8, 8, 16);
          } else {
            ctx.fillRect(14, -8, 8, 16);
            ctx.fillRect(-22, -8, 8, 16);
          }

          // Lion Tail
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-24, -18);
          ctx.quadraticCurveTo(-38, -28, -34, -40);
          ctx.stroke();
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(-34, -40, 4, 0, Math.PI * 2);
          ctx.fill();

          // Lion Mane & Head
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(22, -26, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(26, -26, 10, 0, Math.PI * 2);
          ctx.fill();
          // Snout & Eye
          ctx.fillStyle = '#fde68a';
          ctx.beginPath();
          ctx.ellipse(32, -24, 6, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(35, -26, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(27, -29, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // ===============================
          // 2. CHARLIE THE CLOWN RIDING
          // ===============================
          // Circus Pants & Boots
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.ellipse(-4, -28, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Polka Dot Yellow Jumpsuit Torso
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-10, -44, 12, 15);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-6, -38, 1.5, 0, Math.PI * 2);
          ctx.arc(-2, -34, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // White Ruffled Collar
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-4, -44, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Clown Head & Makeup
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, -54, 8, 0, Math.PI * 2);
          ctx.fill();
          // Red Clown Nose
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -54, 2.5, 0, Math.PI * 2);
          ctx.fill();
          // Smile
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(-2, -50, 3, 0, Math.PI);
          ctx.stroke();

          // Red Pointy Clown Hat with Blue Pom-pom
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(-8, -60);
          ctx.lineTo(-4, -72);
          ctx.lineTo(0, -60);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(-4, -73, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Charlie's Waving Hands
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 3;
          ctx.beginPath();
          if (p.celebrateTimer > 0) {
            // Victory hands raised
            ctx.moveTo(-4, -42); ctx.lineTo(-12, -62);
            ctx.moveTo(-4, -42); ctx.lineTo(6, -62);
          } else {
            // Reins holding
            ctx.moveTo(-4, -42); ctx.lineTo(14, -36);
          }
          ctx.stroke();
        } else {
          // Stage 2: Charlie walking on tightrope with balancing umbrella
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-4, -14, 8, 14);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-6, -32, 12, 18);
          // Head
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -40, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(3, -40, 2.5, 0, Math.PI * 2);
          ctx.fill();
          // Balancing Umbrella
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-28, -38);
          ctx.lineTo(28, -38);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 2.6 Render Particles
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2.7 Render Floating Score Texts
      floatersRef.current.forEach(fl => {
        ctx.fillStyle = fl.color;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
      });

      // 2.8 Overlays (Game Over / Stage Clear)
      if (st === 'game_over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'black 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Chú hề Charlie đã hết mạng xiếc biểu diễn!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Tổng điểm của bạn: ${scoreRef.current.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
      } else if (st === 'stage_clear') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#facc15';
        ctx.font = 'black 46px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`MÀN ${stageRef.current} HOÀN THÀNH!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TIẾN VÀO MÀN TIẾP THEO TRONG GIÂY LÁT...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addScore, handlePlayerDeath, initStage, stage]);

  // Start on mount
  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none">
      {/* 3-Column Top HUD Bar chuẩn hệ thống Ace Games */}
      <div className="game-top-hud relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Cột 1: Màn chơi & Chọn màn */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs uppercase font-mono">Màn {stage}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-white/5">
            {[
              { id: 1, label: 'Vòng Lửa' },
              { id: 2, label: 'Dây Khỉ' },
              { id: 3, label: 'Bạt Lò Xo' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => initStage(m.id as StageType)}
                className={`px-2.5 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                  stage === m.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cột 2: Điểm số, Khoảng cách mét, Mạng - CĂN CHÍNH GIỮA */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 font-mono font-bold text-xs sm:text-sm pointer-events-none">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-gray-400 text-xs hidden md:inline">ĐIỂM:</span>
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-cyan-300">
            <span className="text-gray-400 text-xs">CÒN:</span>
            <span>{metersLeft}M</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>{lives} MẠNG</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={gameState === 'paused' ? 'Tiếp tục' : 'Tạm dừng (P)'}
          >
            {gameState === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={() => startNewGame(stage)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Chơi Lại Ván Này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container */}
      <div 
        className="game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-185px)] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center flex-1 min-h-0"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Điều khiển ảo trên Điện thoại Di Động (Virtual D-Pad & Jump Button) */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
          {/* Nút Trái / Phải */}
          <div className="flex items-center gap-2 pointer-events-auto bg-slate-950/70 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onTouchStart={() => { keysRef.current.left = true; }}
              onTouchEnd={() => { keysRef.current.left = false; }}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onTouchStart={() => { keysRef.current.right = true; }}
              onTouchEnd={() => { keysRef.current.right = false; }}
              className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Nút Nhảy Bổng (JUMP) */}
          <button
            onTouchStart={() => {
              keysRef.current.jump = true;
              const p = playerRef.current;
              if (p.isGrounded && !p.isDead && gameStateRef.current === 'playing') {
                p.vy = stageRef.current === 2 ? -10.5 : -12.5;
                p.isGrounded = false;
                soundManager.playCircusJump();
              }
            }}
            onTouchEnd={() => { keysRef.current.jump = false; }}
            className="w-14 h-14 rounded-full bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-sm shadow-lg pointer-events-auto flex items-center justify-center"
          >
            <ArrowUp className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
