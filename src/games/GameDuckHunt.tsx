import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Play, Pause, RotateCcw, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

type GameMode = 'one_duck' | 'two_ducks' | 'clay';
type GameState = 'intro' | 'hunting' | 'duck_hit' | 'dog_result' | 'round_clear' | 'game_over' | 'paused';
type DuckColor = 'green' | 'blue' | 'red';

interface Duck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: DuckColor;
  points: number;
  state: 'flying' | 'shot_pause' | 'falling' | 'escaped';
  shotPauseTimer: number;
  flapTimer: number;
  flapFrame: number;
  facing: 'left' | 'right';
  fallAngle: number;
}

interface Clay {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  state: 'flying' | 'shattered';
  points: number;
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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const GameDuckHunt: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React HUD States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_duckhunt_highscore') || '15000', 10);
    } catch {
      return 15000;
    }
  });
  const [round, setRound] = useState<number>(1);
  const [bullets, setBullets] = useState<number>(3);
  const [gameMode, setGameMode] = useState<GameMode>('one_duck');
  const [gameState, setGameState] = useState<GameState>('intro');
  const [hitHistory, setHitHistory] = useState<boolean[]>([]); // 10 ducks per round
  const [currentWave, setCurrentWave] = useState<number>(1); // 1..10 in 1-duck or 1..5 in 2-duck

  // Game Engine Refs
  const scoreRef = useRef(score);
  const bulletsRef = useRef(bullets);
  const gameStateRef = useRef(gameState);
  const gameModeRef = useRef(gameMode);
  const roundRef = useRef(round);
  const hitHistoryRef = useRef<boolean[]>([]);

  const ducksRef = useRef<Duck[]>([]);
  const claysRef = useRef<Clay[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingText[]>([]);

  // Crosshair coordinates
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 480, y: 270, isDown: false });

  // Dog Animation Ref
  const dogRef = useRef<{
    x: number;
    y: number;
    action: 'walk' | 'sniff' | 'alert' | 'jump' | 'hidden' | 'duck_single' | 'duck_double' | 'laugh';
    animTimer: number;
    frame: number;
    targetY: number;
  }>({
    x: 100,
    y: 380,
    action: 'walk',
    animTimer: 0,
    frame: 0,
    targetY: 380,
  });

  // Screen Flash effect on shot
  const flashTimerRef = useRef<number>(0);
  const waveTimerRef = useRef<number>(0);
  const resultTimerRef = useRef<number>(0);

  // Sync refs with states
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { bulletsRef.current = bullets; }, [bullets]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { hitHistoryRef.current = hitHistory; }, [hitHistory]);

  const addScore = useCallback((pts: number, x: number, y: number) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      try {
        localStorage.setItem('acegames_duckhunt_highscore', scoreRef.current.toString());
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

  // Spawn Ducks based on current wave
  const spawnWave = useCallback(() => {
    ducksRef.current = [];
    claysRef.current = [];
    bulletsRef.current = 3;
    setBullets(3);
    waveTimerRef.current = 0;

    const currentRnd = roundRef.current;
    const baseSpeed = 3.6 + Math.min(currentRnd * 0.35, 4.5);

    if (gameModeRef.current === 'clay') {
      // Spawn 1 or 2 Clay Discs
      const count = Math.random() > 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const fromLeft = i === 0 ? Math.random() > 0.5 : Math.random() > 0.5;
        const startX = fromLeft ? 80 : CANVAS_WIDTH - 80;
        const dir = fromLeft ? 1 : -1;
        claysRef.current.push({
          id: Math.random(),
          x: startX,
          y: 410,
          vx: dir * (baseSpeed * (1.2 + Math.random() * 0.4)),
          vy: -(8.5 + Math.random() * 2.5),
          gravity: 0.22,
          radius: 18,
          state: 'flying',
          points: 800 + currentRnd * 100,
        });
      }
      soundManager.playDuckHuntClayLaunch();
      setGameState('hunting');
      return;
    }

    const count = gameModeRef.current === 'two_ducks' ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const colRand = Math.random();
      const color: DuckColor = colRand < 0.5 ? 'green' : colRand < 0.85 ? 'blue' : 'red';
      const speedMult = color === 'green' ? 1.0 : color === 'blue' ? 1.25 : 1.5;
      const pts = color === 'green' ? 500 : color === 'blue' ? 1000 : 1500;

      const startX = 200 + Math.random() * (CANVAS_WIDTH - 400);
      const angle = (Math.PI / 6) + Math.random() * (Math.PI * 2 / 3); // upward angles
      const speed = baseSpeed * speedMult;
      const vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
      const vy = -Math.sin(angle) * speed;

      ducksRef.current.push({
        id: Math.random(),
        x: startX,
        y: 410,
        vx,
        vy,
        color,
        points: pts + (currentRnd - 1) * 100,
        state: 'flying',
        shotPauseTimer: 0,
        flapTimer: 0,
        flapFrame: 0,
        facing: vx >= 0 ? 'right' : 'left',
        fallAngle: 0,
      });
    }

    soundManager.playDuckHuntFlap();
    soundManager.playDuckHuntQuack();
    setGameState('hunting');
  }, []);

  // Bắt đầu một vòng chơi mới (Round)
  const startNewRound = useCallback((newRnd: number) => {
    roundRef.current = newRnd;
    setRound(newRnd);
    setCurrentWave(1);
    setHitHistory([]);
    hitHistoryRef.current = [];

    // Dog Intro sequence
    dogRef.current = {
      x: 60,
      y: 380,
      action: 'walk',
      animTimer: 0,
      frame: 0,
      targetY: 380,
    };
    setGameState('intro');
  }, []);

  const startNewGame = useCallback((mode: GameMode = 'one_duck') => {
    soundManager.playButtonClick();
    setGameMode(mode);
    gameModeRef.current = mode;
    setScore(0);
    scoreRef.current = 0;
    startNewRound(1);
  }, [startNewRound]);

  // Xử lý bắn súng (Player fires Shotgun)
  const shootGun = useCallback((targetX: number, targetY: number) => {
    if (gameStateRef.current !== 'hunting') return;
    if (bulletsRef.current <= 0) return;

    bulletsRef.current -= 1;
    setBullets(bulletsRef.current);
    flashTimerRef.current = 0.08;
    soundManager.playDuckHuntShot();

    // Check hit on Clay Discs
    if (gameModeRef.current === 'clay') {
      let hitClay = false;
      claysRef.current.forEach(c => {
        if (c.state === 'flying') {
          const dist = Math.hypot(targetX - c.x, targetY - c.y);
          if (dist <= c.radius + 24) {
            c.state = 'shattered';
            hitClay = true;
            addScore(c.points, c.x, c.y);
            soundManager.playDuckHuntHit();
            // Clay fragment particles
            for (let i = 0; i < 14; i++) {
              const pAng = Math.random() * Math.PI * 2;
              const pSpd = 2 + Math.random() * 5;
              particlesRef.current.push({
                x: c.x,
                y: c.y,
                vx: Math.cos(pAng) * pSpd,
                vy: Math.sin(pAng) * pSpd,
                color: '#ef4444',
                size: 3 + Math.random() * 3,
                life: 30,
                maxLife: 30,
              });
            }
          }
        }
      });

      if (hitClay) {
        setHitHistory(prev => [...prev, true]);
      }
      return;
    }

    // Check hit on Ducks
    let hitAny = false;
    ducksRef.current.forEach(d => {
      if (d.state === 'flying') {
        const dist = Math.hypot(targetX - d.x, targetY - d.y);
        if (dist <= 48) {
          d.state = 'shot_pause';
          d.shotPauseTimer = 0.35;
          hitAny = true;
          addScore(d.points, d.x, d.y);
          soundManager.playDuckHuntHit();

          // Feather explosion particles
          const pColor = d.color === 'green' ? '#22c55e' : d.color === 'blue' ? '#38bdf8' : '#ef4444';
          for (let i = 0; i < 12; i++) {
            const pAng = Math.random() * Math.PI * 2;
            const pSpd = 1.5 + Math.random() * 4;
            particlesRef.current.push({
              x: d.x,
              y: d.y,
              vx: Math.cos(pAng) * pSpd,
              vy: Math.sin(pAng) * pSpd,
              color: pColor,
              size: 2.5 + Math.random() * 2.5,
              life: 35,
              maxLife: 35,
            });
          }
        }
      }
    });

    if (hitAny) {
      setHitHistory(prev => [...prev, true]);
    }
  }, [addScore]);

  // Precise Canvas Coordinate Converter (Bulletproof for all screens and fullscreen)
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, y)),
    };
  }, []);

  // Handle Pointer Movement & Shot (Mouse & Touch with 0ms latency)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) {
      mousePosRef.current.x = coords.x;
      mousePosRef.current.y = coords.y;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords) {
      mousePosRef.current = { x: coords.x, y: coords.y, isDown: true };
      shootGun(coords.x, coords.y);
    }
  };

  // Keyboard Shortcuts (1/2/3 change mode, Space shoot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') startNewGame('one_duck');
      if (e.key === '2') startNewGame('two_ducks');
      if (e.key === '3') startNewGame('clay');
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev === 'hunting' ? 'paused' : prev === 'paused' ? 'hunting' : prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewGame]);

  // Main Game Loop 60 FPS
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

      // Flash timer countdown
      if (flashTimerRef.current > 0) {
        flashTimerRef.current -= dt;
      }

      // ==========================================
      // 1. UPDATE GAME LOGIC
      // ==========================================
      const st = gameStateRef.current;

      // 1.1 Intro Dog Walking & Jumping Sequence
      if (st === 'intro') {
        const dog = dogRef.current;
        dog.animTimer += dt;

        if (dog.action === 'walk') {
          dog.x += 110 * dt;
          dog.frame = Math.floor(dog.animTimer * 6) % 4;
          if (dog.x > 320) {
            dog.action = 'sniff';
            dog.animTimer = 0;
          }
        } else if (dog.action === 'sniff') {
          dog.frame = Math.floor(dog.animTimer * 4) % 2;
          if (dog.animTimer > 0.9) {
            dog.action = 'alert';
            dog.animTimer = 0;
            soundManager.playDuckHuntDogBark();
          }
        } else if (dog.action === 'alert') {
          if (dog.animTimer > 0.5) {
            dog.action = 'jump';
            dog.animTimer = 0;
          }
        } else if (dog.action === 'jump') {
          const t = dog.animTimer / 0.8;
          dog.y = 380 - Math.sin(t * Math.PI) * 110;
          dog.x += 80 * dt;
          if (t >= 1) {
            dog.action = 'hidden';
            spawnWave();
          }
        }
      }

      // 1.2 Hunting Active Wave
      if (st === 'hunting') {
        waveTimerRef.current += dt;

        // Update Ducks
        let allDone = true;
        let hitsCount = 0;
        let missedCount = 0;

        ducksRef.current.forEach(d => {
          if (d.state === 'flying') {
            allDone = false;
            d.flapTimer += dt;
            d.flapFrame = Math.floor(d.flapTimer * 8) % 3;

            // Random direction change
            if (Math.random() < 0.015) {
              d.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.abs(d.vx) * (0.8 + Math.random() * 0.4));
              d.vy = (Math.random() > 0.5 ? 1 : -1) * (Math.abs(d.vy) * (0.8 + Math.random() * 0.4));
              d.facing = d.vx >= 0 ? 'right' : 'left';
            }

            d.x += d.vx;
            d.y += d.vy;

            // Screen edge bounce
            if (d.x < 50) { d.x = 50; d.vx = Math.abs(d.vx); d.facing = 'right'; }
            if (d.x > CANVAS_WIDTH - 50) { d.x = CANVAS_WIDTH - 50; d.vx = -Math.abs(d.vx); d.facing = 'left'; }
            if (d.y < 40) { d.y = 40; d.vy = Math.abs(d.vy); }
            if (d.y > 410) { d.y = 410; d.vy = -Math.abs(d.vy); }

            // Fly away timeout (7.5s or out of bullets)
            if (waveTimerRef.current > 7.5 || bulletsRef.current === 0) {
              d.state = 'escaped';
              d.vy = -6;
              d.vx = 0;
            }
          } else if (d.state === 'shot_pause') {
            allDone = false;
            d.shotPauseTimer -= dt;
            if (d.shotPauseTimer <= 0) {
              d.state = 'falling';
              soundManager.playDuckHuntFall();
            }
          } else if (d.state === 'falling') {
            d.y += 320 * dt;
            d.fallAngle += 8 * dt;
            if (d.y < 440) {
              allDone = false;
            } else {
              hitsCount++;
            }
          } else if (d.state === 'escaped') {
            d.y += d.vy;
            if (d.y > -60) {
              allDone = false;
            } else {
              missedCount++;
            }
          }
        });

        // Update Clays
        if (gameModeRef.current === 'clay') {
          claysRef.current.forEach(c => {
            if (c.state === 'flying') {
              c.vy += c.gravity;
              c.x += c.vx;
              c.y += c.vy;
              if (c.y < 460 && c.x > -40 && c.x < CANVAS_WIDTH + 40) {
                allDone = false;
              } else {
                missedCount++;
              }
            }
          });
        }

        // When all targets in wave are resolved
        if (allDone && (ducksRef.current.length > 0 || claysRef.current.length > 0)) {
          // If missed without hitting
          if (hitsCount === 0) {
            setHitHistory(prev => [...prev, false]);
          }

          // Trigger Dog Result
          const totalHits = ducksRef.current.filter(d => d.state === 'falling').length;
          const dog = dogRef.current;
          dog.x = ducksRef.current[0] ? ducksRef.current[0].x : CANVAS_WIDTH / 2;
          dog.animTimer = 0;
          resultTimerRef.current = 1.6;

          if (totalHits > 0) {
            dog.action = totalHits >= 2 ? 'duck_double' : 'duck_single';
            dog.y = 440;
            dog.targetY = 340;
            soundManager.playDuckHuntRoundClear();
          } else {
            dog.action = 'laugh';
            dog.y = 440;
            dog.targetY = 340;
            soundManager.playDuckHuntDogLaugh();
          }

          setGameState('dog_result');
        }
      }

      // 1.3 Dog Pop-up Result Sequence
      if (st === 'dog_result') {
        const dog = dogRef.current;
        dog.animTimer += dt;
        resultTimerRef.current -= dt;

        // Smooth pop-up and down
        if (dog.y > dog.targetY && resultTimerRef.current > 0.5) {
          dog.y -= 180 * dt;
        } else if (resultTimerRef.current <= 0.5) {
          dog.y += 180 * dt;
        }

        if (resultTimerRef.current <= 0) {
          // Wave complete, check if round ended (10 targets hit check)
          const targetTotal = gameModeRef.current === 'two_ducks' ? 5 : 10;
          const nextWave = currentWave + 1;

          if (nextWave <= targetTotal) {
            setCurrentWave(nextWave);
            spawnWave();
          } else {
            // Round Complete! Check qualification
            const totalHits = hitHistoryRef.current.filter(h => h).length;
            const passReq = Math.min(6 + Math.floor(roundRef.current / 3), 9);

            if (totalHits >= passReq) {
              setGameState('round_clear');
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
              soundManager.playVictory();
              setTimeout(() => {
                startNewRound(roundRef.current + 1);
              }, 2500);
            } else {
              setGameState('game_over');
              soundManager.playDefeat();
            }
          }
        }
      }

      // Update Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // Update Floating Texts
      floatersRef.current.forEach((fl, idx) => {
        fl.y -= 1.2;
        fl.life -= 1;
        if (fl.life <= 0) {
          floatersRef.current.splice(idx, 1);
        }
      });

      // ==========================================
      // 2. RENDER GRAPHICS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2.1 Dynamic Retro Sky (Vibrant 8-Bit NES Colors)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.75);
      const isDusk = round % 3 === 0;
      if (isDusk) {
        skyGrad.addColorStop(0, '#f97316');
        skyGrad.addColorStop(0.5, '#fb923c');
        skyGrad.addColorStop(1, '#fed7aa');
      } else {
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.65, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant rolling mountain ridges
      ctx.fillStyle = isDusk ? '#7c2d12' : '#65a30d';
      ctx.beginPath();
      ctx.moveTo(0, 390);
      ctx.quadraticCurveTo(240, 340, 480, 370);
      ctx.quadraticCurveTo(720, 330, CANVAS_WIDTH, 380);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.lineTo(0, CANVAS_HEIGHT);
      ctx.fill();

      // 2.2 Distant Fluffy Clouds
      ctx.fillStyle = '#ffffff';
      [ { x: 120, y: 70, s: 1.2 }, { x: 460, y: 50, s: 1.5 }, { x: 780, y: 85, s: 1.0 } ].forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 22 * c.s, 0, Math.PI * 2);
        ctx.arc(c.x + 22 * c.s, c.y - 8 * c.s, 28 * c.s, 0, Math.PI * 2);
        ctx.arc(c.x + 46 * c.s, c.y, 20 * c.s, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2.3 Iconic Big Tree on Left
      ctx.save();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(70, 440);
      ctx.bezierCurveTo(75, 340, 50, 240, 60, 160);
      ctx.lineTo(95, 160);
      ctx.bezierCurveTo(90, 240, 115, 340, 120, 440);
      ctx.fill();
      // Branches
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(75, 230);
      ctx.quadraticCurveTo(120, 210, 150, 180);
      ctx.moveTo(65, 280);
      ctx.quadraticCurveTo(20, 250, 0, 240);
      ctx.stroke();
      // Foliage
      ctx.fillStyle = isDusk ? '#166534' : '#15803d';
      [
        { x: 75, y: 130, r: 52 },
        { x: 40, y: 150, r: 42 },
        { x: 120, y: 140, r: 46 },
        { x: 150, y: 180, r: 35 },
        { x: 20, y: 230, r: 32 },
        { x: 80, y: 90, r: 42 },
      ].forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 2.4 Render Clay Targets (Game C)
      claysRef.current.forEach(c => {
        if (c.state === 'flying') {
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(0, 0, c.radius, c.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Highlight
          ctx.fillStyle = '#fca5a5';
          ctx.beginPath();
          ctx.ellipse(0, -2, c.radius * 0.7, c.radius * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 2.5 Render Ducks
      ducksRef.current.forEach(d => {
        if (d.state === 'flying' || d.state === 'escaped') {
          ctx.save();
          ctx.translate(d.x, d.y);
          if (d.facing === 'left') ctx.scale(-1, 1);

          // Duck Body
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2);
          ctx.fill();

          // White Neck Ring
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(8, -8, 4, 10);

          // Emerald Green Head
          ctx.fillStyle = d.color === 'green' ? '#15803d' : d.color === 'blue' ? '#0369a1' : '#dc2626';
          ctx.beginPath();
          ctx.arc(16, -9, 9, 0, Math.PI * 2);
          ctx.fill();

          // Duck Eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(18, -11, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(19, -11, 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Yellow Bill
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(23, -10);
          ctx.lineTo(34, -8);
          ctx.lineTo(23, -5);
          ctx.closePath();
          ctx.fill();

          // Flapping Wings (3 Frame Cycle)
          const wingColor = d.color === 'green' ? '#0284c7' : d.color === 'blue' ? '#38bdf8' : '#f97316';
          ctx.fillStyle = wingColor;
          ctx.beginPath();
          if (d.flapFrame === 0) {
            // High Wing Up
            ctx.moveTo(-6, -6);
            ctx.quadraticCurveTo(0, -32, 14, -8);
          } else if (d.flapFrame === 1) {
            // Mid Wing Level
            ctx.moveTo(-10, -2);
            ctx.quadraticCurveTo(-4, -18, 12, 0);
          } else {
            // Low Wing Down
            ctx.moveTo(-6, 2);
            ctx.quadraticCurveTo(0, 20, 14, 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Tail Feathers
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(-20, -3);
          ctx.lineTo(-28, -7);
          ctx.lineTo(-23, 3);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else if (d.state === 'shot_pause') {
          // Stunned shot frame
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('💥', 0, 8);
          ctx.restore();
        } else if (d.state === 'falling') {
          // Falling head-first spinning duck
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.fallAngle);
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(0, 16, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 2.6 Render Dog (Results / Intro)
      const dog = dogRef.current;
      if (dog.action !== 'hidden') {
        ctx.save();
        ctx.translate(dog.x, dog.y);

        if (dog.action === 'duck_single' || dog.action === 'duck_double') {
          // Dog holding duck(s) up from grass!
          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.ellipse(0, 0, 28, 36, 0, 0, Math.PI * 2);
          ctx.fill();
          // Dog Head
          ctx.beginPath();
          ctx.ellipse(0, -28, 22, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          // Floppy Ears
          ctx.fillStyle = '#713f12';
          ctx.beginPath();
          ctx.ellipse(-20, -24, 7, 18, -0.2, 0, Math.PI * 2);
          ctx.ellipse(20, -24, 7, 18, 0.2, 0, Math.PI * 2);
          ctx.fill();
          // Cute Eyes & Smile
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(-8, -32, 3, 0, Math.PI * 2);
          ctx.arc(8, -32, 3, 0, Math.PI * 2);
          ctx.arc(0, -22, 4, 0, Math.PI * 2);
          ctx.fill();

          // Caught Duck(s) Held in Dog Paws
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(-24, -10, 10, 0, Math.PI * 2);
          if (dog.action === 'duck_double') {
            ctx.arc(24, -10, 10, 0, Math.PI * 2);
          }
          ctx.fill();
        } else if (dog.action === 'laugh') {
          // Dog Laughing at Missed Shot!
          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.ellipse(0, 0, 28, 36, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -26, 22, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#713f12';
          ctx.beginPath();
          ctx.ellipse(-18, -22, 7, 18, -0.3, 0, Math.PI * 2);
          ctx.ellipse(18, -22, 7, 18, 0.3, 0, Math.PI * 2);
          ctx.fill();
          // Laughing Mouth
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(0, -18, 8, 0, Math.PI);
          ctx.fill();
          // Closed Laughing Eyes
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(-8, -30, 4, Math.PI, 0);
          ctx.arc(8, -30, 4, Math.PI, 0);
          ctx.stroke();
        } else {
          // Intro Walking & Sniffing Dog
          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(18, -10, 14, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // Ears & Nose
          ctx.fillStyle = '#713f12';
          ctx.beginPath();
          ctx.ellipse(12, -12, 5, 12, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(30, -8, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2.7 Foreground Lush Tall Grass (Layered in Front of Dog & Water)
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 420, CANVAS_WIDTH, CANVAS_HEIGHT - 420);
      // Grass Blades Fringe
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      for (let gx = 0; gx < CANVAS_WIDTH; gx += 16) {
        ctx.moveTo(gx, 422);
        ctx.lineTo(gx + 8, 404);
        ctx.lineTo(gx + 16, 422);
      }
      ctx.fill();

      // 2.8 Particles Rendering
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2.9 Floating Points Text
      floatersRef.current.forEach(fl => {
        ctx.fillStyle = fl.color;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
      });

      // 2.10 Gunshot Flash Effect (Full retro screen flash)
      if (flashTimerRef.current > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2.10.1 "FLY AWAY" Banner (Khi vịt bay thoát)
      const hasEscaping = ducksRef.current.some(d => d.state === 'escaped');
      if (hasEscaping && st === 'hunting') {
        ctx.save();
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 100, 130, 200, 44, 12);
        ctx.fill();
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FLY AWAY', CANVAS_WIDTH / 2, 152);
        ctx.restore();
      }

      // 2.11 Animated NES Zapper Crosshair Reticle (Follows Cursor)
      const mouse = mousePosRef.current;
      ctx.save();
      ctx.translate(mouse.x, mouse.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-24, 0); ctx.lineTo(-12, 0);
      ctx.moveTo(12, 0); ctx.lineTo(24, 0);
      ctx.moveTo(0, -24); ctx.lineTo(0, -12);
      ctx.moveTo(0, 12); ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.restore();

      // 2.12 Bottom Hit Status Bar (10 targets per round)
      const barY = CANVAS_HEIGHT - 32;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 190, barY - 10, 380, 32, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('HIT:', CANVAS_WIDTH / 2 - 175, barY + 11);

      // 10 Duck Silhouettes
      for (let i = 0; i < 10; i++) {
        const dx = CANVAS_WIDTH / 2 - 130 + i * 28;
        const hit = hitHistoryRef.current[i];
        if (hit === true) {
          ctx.fillStyle = '#ffffff'; // White = Hit
        } else if (hit === false) {
          ctx.fillStyle = '#ef4444'; // Red = Missed
        } else {
          ctx.fillStyle = '#475569'; // Gray = Pending
        }
        ctx.beginPath();
        ctx.arc(dx, barY + 6, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2.13 Game Over & Stage Clear Overlays
      if (st === 'game_over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'black 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Chưa đạt đủ chỉ tiêu số vịt bắn hạ vòng này!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Tổng điểm của bạn: ${scoreRef.current.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
      } else if (st === 'round_clear') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'black 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`VÒNG ${roundRef.current} HOÀN THÀNH!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('XUẤT SẮC! TIẾN VÀO VÒNG TIẾP THEO...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [round, spawnWave, startNewRound]);

  // Start game on initial mount
  useEffect(() => {
    startNewGame('one_duck');
  }, [startNewGame]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none">
      {/* 3-Column Top HUD Bar chuẩn hệ thống Ace Games */}
      <div className="game-top-hud relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Cột 1: Chế độ chơi & Vòng */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs uppercase font-mono">Vòng {round}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-white/5">
            {[
              { id: 'one_duck', label: '1 Vịt' },
              { id: 'two_ducks', label: '2 Vịt' },
              { id: 'clay', label: 'Bắn Đĩa' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => startNewGame(m.id as GameMode)}
                className={`px-2.5 py-0.5 rounded text-xs font-bold transition cursor-pointer ${
                  gameMode === m.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cột 2: Điểm số, Đạn, Kỷ lục - CĂN CHÍNH GIỮA */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 font-mono font-bold text-xs sm:text-sm pointer-events-none">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-gray-400 text-xs hidden md:inline">ĐIỂM:</span>
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-400">
            <Target className="w-3.5 h-3.5" />
            <span>ĐẠN:</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map(bIdx => (
                <div
                  key={bIdx}
                  className={`w-2 h-4 rounded-sm transition-all ${
                    bIdx < bullets ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 text-cyan-300">
            <span className="text-gray-400 text-xs">KỶ LỤC:</span>
            <span>{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setGameState(prev => prev === 'hunting' ? 'paused' : prev === 'paused' ? 'hunting' : prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={gameState === 'paused' ? 'Tiếp tục' : 'Tạm dừng (P)'}
          >
            {gameState === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={() => startNewGame(gameMode)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Chơi Lại Ván Này"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container */}
      <div 
        className="game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-185px)] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center flex-1 min-h-0 cursor-none"
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className="w-full h-full block cursor-none touch-none select-none"
        />
      </div>
    </div>
  );
};
