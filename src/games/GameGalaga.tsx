import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Heart, 
  Crosshair, 
  ArrowLeft, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'endless';
type AlienType = 'boss' | 'butterfly' | 'bee';
type AlienState = 'entering' | 'grid' | 'diving' | 'capturing' | 'captured_holding';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân đấu chiến đấu không gian 756x540px
const ARENA_WIDTH = 756;
const ARENA_HEIGHT = 540;

// Sidebar radar cánh phải (204px)
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
  isPlayer: boolean;
  isAlive: boolean;
}

interface Alien {
  id: number;
  type: AlienType;
  gridRow: number;
  gridCol: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: AlienState;
  hp: number;
  maxHp: number;
  diveAngle: number;
  diveTimer: number;
  isAlive: boolean;
  scoreValue: number;
  isCapturing?: boolean;
}

interface TractorBeam {
  bossId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  active: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const GameGalaga: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_galaga_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [stage, setStage] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('classic');
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Thống kê độ chính xác (Accuracy Stats)
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [isDualFighter, setIsDualFighter] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Tàu chiến của người chơi (Fighter Ship)
  const playerRef = useRef({
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT - 48,
    width: 32, // Tàu đơn 32px, tàu đôi 64px
    speed: 5.5,
    isAlive: true,
    isDual: false,
    respawnTimer: 0,
    captured: false,
    captureProgress: 0,
    hasCapturedBuddy: false // Có tàu chiến hữu đang bị bắt bởi boss
  });

  const aliensRef = useRef<Alien[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const tractorBeamRef = useRef<TractorBeam | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastTimeRef = useRef<number>(0);
  const alienAttackTimerRef = useRef<number>(2000);

  // Âm thanh Web Audio API Galaga Retro Arcade
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playLaserSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getAudioContext]);

  const playAlienHitSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, [getAudioContext]);

  const playExplosionSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [getAudioContext]);

  const playBeamSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [getAudioContext]);

  const playDualFighterFanfare = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [440, 554, 659, 880, 1108];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + (idx + 1) * 0.08);
      });
    } catch {}
  }, [getAudioContext]);

  // Khởi tạo Starfield vũ trụ
  useEffect(() => {
    const stars: Star[] = [];
    const colors = ['#ffffff', '#38bdf8', '#fde047', '#f43f5e', '#a855f7'];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    starsRef.current = stars;
  }, []);

  // Khởi tạo Đội hình Quái Galaga cho Màn chơi
  const initStage = useCallback((stg: number) => {
    setStage(stg);
    setIsGameOver(false);
    setIsVictory(false);
    tractorBeamRef.current = null;

    // Đặt lại vị trí người chơi
    const isDual = isDualFighter;
    playerRef.current = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 48,
      width: isDual ? 56 : 30,
      speed: mode === 'speed' ? 6.5 : 5.2,
      isAlive: true,
      isDual,
      respawnTimer: 0,
      captured: false,
      captureProgress: 0,
      hasCapturedBuddy: false
    };

    // Đội hình 40 con ruồi chuẩn Galaga (5 hàng x 8 cột)
    // Hàng 0: 4 con Boss Galaga
    // Hàng 1..2: 16 con Bướm đỏ (Butterfly)
    // Hàng 3..4: 20 con Ong vàng (Bee)
    const newAliens: Alien[] = [];
    const startX = ARENA_WIDTH / 2 - (8 * 42) / 2 + 21;
    const startY = 65;

    // 1. Boss Galaga (Hàng 0, 4 con)
    for (let c = 2; c <= 5; c++) {
      const tx = startX + c * 42;
      const ty = startY;
      newAliens.push({
        id: Date.now() + Math.random(),
        type: 'boss',
        gridRow: 0,
        gridCol: c,
        x: tx,
        y: -50 - Math.random() * 100, // Bay vào từ ngoài màn hình
        targetX: tx,
        targetY: ty,
        state: 'entering',
        hp: 2,
        maxHp: 2,
        diveAngle: 0,
        diveTimer: 0,
        isAlive: true,
        scoreValue: 400
      });
    }

    // 2. Bướm Đỏ (Hàng 1 & 2, 8 con mỗi hàng)
    for (let r = 1; r <= 2; r++) {
      for (let c = 0; c < 8; c++) {
        const tx = startX + c * 42;
        const ty = startY + r * 34;
        newAliens.push({
          id: Date.now() + Math.random(),
          type: 'butterfly',
          gridRow: r,
          gridCol: c,
          x: tx,
          y: -60 - Math.random() * 150,
          targetX: tx,
          targetY: ty,
          state: 'entering',
          hp: 1,
          maxHp: 1,
          diveAngle: 0,
          diveTimer: 0,
          isAlive: true,
          scoreValue: 160
        });
      }
    }

    // 3. Ong Vàng (Hàng 3 & 4, 8 con mỗi hàng)
    for (let r = 3; r <= 4; r++) {
      for (let c = 0; c < 8; c++) {
        const tx = startX + c * 42;
        const ty = startY + r * 34;
        newAliens.push({
          id: Date.now() + Math.random(),
          type: 'bee',
          gridRow: r,
          gridCol: c,
          x: tx,
          y: -70 - Math.random() * 200,
          targetX: tx,
          targetY: ty,
          state: 'entering',
          hp: 1,
          maxHp: 1,
          diveAngle: 0,
          diveTimer: 0,
          isAlive: true,
          scoreValue: 100
        });
      }
    }

    aliensRef.current = newAliens;
    bulletsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    alienAttackTimerRef.current = 1800;
  }, [isDualFighter, mode]);

  useEffect(() => {
    initStage(1);
  }, [initStage]);

  // Bắn đạn Laser người chơi
  const handlePlayerShoot = useCallback(() => {
    const p = playerRef.current;
    if (!p.isAlive || p.captured || isPaused || isGameOver || isVictory) return;

    // Giới hạn số lượng đạn trên màn hình
    const maxActiveBullets = p.isDual ? 4 : 2;
    const currentBullets = bulletsRef.current.filter(b => b.isAlive && b.isPlayer).length;
    if (currentBullets >= maxActiveBullets) return;

    setShotsFired(f => f + (p.isDual ? 2 : 1));

    if (p.isDual) {
      // 2 viên đạn song song
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: p.x - 14,
        y: p.y - 12,
        speed: 12,
        isPlayer: true,
        isAlive: true
      });
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: p.x + 14,
        y: p.y - 12,
        speed: 12,
        isPlayer: true,
        isAlive: true
      });
    } else {
      // 1 viên đạn đơn giữa
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: p.x,
        y: p.y - 12,
        speed: 12,
        isPlayer: true,
        isAlive: true
      });
    }

    playLaserSound();
  }, [isGameOver, isPaused, isVictory, playLaserSound]);

  // Xử lý bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true;
      if (['Space', ' ', 'j', 'J', 'Enter'].includes(e.key)) {
        e.preventDefault();
        handlePlayerShoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePlayerShoot]);

  // VÒNG LẶP CHÍNH (GAME LOOP 60 FPS)
  useEffect(() => {
    let animId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const targetWidth = CANVAS_WIDTH * dpr;
      const targetHeight = CANVAS_HEIGHT * dpr;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- 1. CẬP NHẬT LOGIC GAME ---
      if (!isPaused && !isGameOver && !isVictory) {
        // A. Cập nhật nền sao Starfield chuyển động
        for (const star of starsRef.current) {
          star.y += star.speed;
          if (star.y > ARENA_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * ARENA_WIDTH;
          }
        }

        // B. Di chuyển người chơi
        const p = playerRef.current;
        if (p.isAlive && !p.captured) {
          let moveX = 0;
          if (keysPressedRef.current['ArrowLeft'] || keysPressedRef.current['a'] || keysPressedRef.current['A']) {
            moveX = -p.speed;
          } else if (keysPressedRef.current['ArrowRight'] || keysPressedRef.current['d'] || keysPressedRef.current['D']) {
            moveX = p.speed;
          }

          p.x = Math.max(p.width / 2 + 8, Math.min(ARENA_WIDTH - p.width / 2 - 8, p.x + moveX));
        }

        // C. Cập nhật đạn bay
        for (const b of bulletsRef.current) {
          if (!b.isAlive) continue;

          if (b.isPlayer) {
            b.y -= b.speed;
            if (b.y < -10) b.isAlive = false;
          } else {
            b.y += b.speed;
            if (b.y > ARENA_HEIGHT + 10) b.isAlive = false;

            // Đạn địch trúng người chơi
            if (p.isAlive && !p.captured) {
              const dist = Math.hypot(b.x - p.x, b.y - p.y);
              if (dist < p.width / 2) {
                b.isAlive = false;
                playExplosionSound();

                // Nếu đang là tàu đôi thì mất 1 bên, trở lại tàu đơn
                if (p.isDual) {
                  p.isDual = false;
                  p.width = 30;
                  setIsDualFighter(false);
                  for (let i = 0; i < 12; i++) {
                    particlesRef.current.push({
                      id: Date.now() + Math.random(),
                      x: p.x,
                      y: p.y,
                      vx: (Math.random() - 0.5) * 6,
                      vy: (Math.random() - 0.5) * 6,
                      color: '#f43f5e',
                      size: 3,
                      alpha: 1,
                      decay: 0.05
                    });
                  }
                } else {
                  // Mất mạng
                  p.isAlive = false;
                  setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) {
                      setIsGameOver(true);
                      setScreenShake(true);
                      setTimeout(() => setScreenShake(false), 500);
                    } else {
                      setTimeout(() => {
                        p.x = ARENA_WIDTH / 2;
                        p.isAlive = true;
                      }, 1000);
                    }
                    return nl;
                  });
                }
              }
            }
          }

          // Đạn người chơi trúng Alien
          if (b.isPlayer && b.isAlive) {
            for (const a of aliensRef.current) {
              if (a.isAlive && Math.hypot(b.x - a.x, b.y - a.y) < 18) {
                b.isAlive = false;
                a.hp -= 1;
                setShotsHit(h => h + 1);

                if (a.hp <= 0) {
                  a.isAlive = false;
                  playExplosionSound();

                  // Thưởng điểm (gấp đôi nếu bắn hạ khi quái đang sà xuống)
                  const multiplier = a.state === 'diving' || a.state === 'capturing' ? 2 : 1;
                  const pts = a.scoreValue * multiplier;

                  setScore(s => {
                    const newS = s + pts;
                    if (newS > highScore) {
                      setHighScore(newS);
                      try { localStorage.setItem('acegames_galaga_highscore', String(newS)); } catch {}
                    }
                    return newS;
                  });

                  floatingTextsRef.current.push({
                    id: Date.now() + Math.random(),
                    x: a.x,
                    y: a.y,
                    text: `+${pts}`,
                    color: '#facc15',
                    alpha: 1
                  });

                  // Nếu bắn hạ Boss đang bắt giữ tàu -> Giải cứu tạo Chiến Cơ Kép (Dual Fighter)!
                  if (a.type === 'boss' && p.hasCapturedBuddy && (a.state === 'diving' || a.state === 'capturing')) {
                    p.hasCapturedBuddy = false;
                    p.isDual = true;
                    p.width = 56;
                    setIsDualFighter(true);
                    playDualFighterFanfare();
                    confetti({ particleCount: 120, spread: 70, origin: { y: 0.8 } });

                    floatingTextsRef.current.push({
                      id: Date.now() + Math.random(),
                      x: p.x,
                      y: p.y - 25,
                      text: 'CHIẾN CƠ KÉP x2! ⭐',
                      color: '#38bdf8',
                      alpha: 1
                    });
                  }

                  // Hạt nổ bùng
                  for (let i = 0; i < 14; i++) {
                    particlesRef.current.push({
                      id: Date.now() + Math.random(),
                      x: a.x,
                      y: a.y,
                      vx: (Math.random() - 0.5) * 7,
                      vy: (Math.random() - 0.5) * 7,
                      color: a.type === 'boss' ? '#38bdf8' : a.type === 'butterfly' ? '#f43f5e' : '#facc15',
                      size: Math.random() * 3.5 + 2,
                      alpha: 1,
                      decay: 0.04
                    });
                  }
                } else {
                  // Boss trúng 1 phát -> đổi màu nhấp nháy cảnh báo
                  playAlienHitSound();
                }
                break;
              }
            }
          }
        }
        bulletsRef.current = bulletsRef.current.filter(b => b.isAlive);

        // D. Cập nhật Bầy Ruồi Ngoài Hành Tinh (Alien Swarms)
        const now = Date.now();
        // Hiệu ứng thở / nhún nhảy đội hình
        const breathingOffset = Math.sin(now * 0.004) * 8;

        for (const a of aliensRef.current) {
          if (!a.isAlive) continue;

          // 1. Giai đoạn bay vào đội hình lúc bắt đầu (Entering)
          if (a.state === 'entering') {
            const dx = a.targetX - a.x;
            const dy = a.targetY - a.y;
            a.x += dx * 0.05;
            a.y += dy * 0.05;
            if (Math.hypot(dx, dy) < 4) {
              a.x = a.targetX;
              a.y = a.targetY;
              a.state = 'grid';
            }
          }

          // 2. Giai đoạn đứng trong đội hình (Grid formation)
          if (a.state === 'grid') {
            a.x = a.targetX + breathingOffset;
          }

          // 3. Giai đoạn Sà xuống tấn công (Diving Attack)
          if (a.state === 'diving') {
            a.diveTimer += dt;
            a.y += 4.5;
            a.x += Math.sin(a.diveTimer * 0.006) * 4.5;

            // Địch thỉnh thoảng xả đạn
            if (Math.random() < 0.015 && bulletsRef.current.filter(b => !b.isPlayer).length < 6) {
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: a.x,
                y: a.y + 12,
                speed: 6.5,
                isPlayer: false,
                isAlive: true
              });
            }

            // Bay vượt qua mép dưới -> Vòng lại từ trên xuống đội hình
            if (a.y > ARENA_HEIGHT + 30) {
              a.y = -30;
              a.state = 'entering';
            }

            // Đâm sầm vào tàu người chơi
            if (p.isAlive && !p.captured && Math.hypot(a.x - p.x, a.y - p.y) < p.width / 2 + 12) {
              a.isAlive = false;
              playExplosionSound();
              if (p.isDual) {
                p.isDual = false;
                p.width = 30;
                setIsDualFighter(false);
              } else {
                p.isAlive = false;
                setLives(l => {
                  const nl = l - 1;
                  if (nl <= 0) {
                    setIsGameOver(true);
                  } else {
                    setTimeout(() => { p.x = ARENA_WIDTH / 2; p.isAlive = true; }, 1000);
                  }
                  return nl;
                });
              }
            }
          }

          // 4. Cơ chế Boss phát tia hút bắt giữ (Tractor Beam)
          if (a.state === 'capturing' && a.type === 'boss') {
            a.y = Math.min(220, a.y + 2.5); // Sà xuống tầm cao 220px rồi dừng phát tia

            if (a.y >= 215) {
              // Bật tia hút
              if (!tractorBeamRef.current) {
                playBeamSound();
                tractorBeamRef.current = {
                  bossId: a.id,
                  x: a.x,
                  y: a.y + 16,
                  width: 50,
                  height: ARENA_HEIGHT - (a.y + 16),
                  alpha: 0.6,
                  active: true
                };
              } else {
                tractorBeamRef.current.x = a.x;
                tractorBeamRef.current.y = a.y + 16;
              }

              // Kiểm tra người chơi có bị lọt vào vùng tia hút không
              if (p.isAlive && !p.captured && Math.abs(p.x - a.x) < 25) {
                p.captured = true;
                p.hasCapturedBuddy = true;
              }

              // Nếu người chơi bị hút -> Kéo tàu từ từ lên trên
              if (p.captured) {
                p.y -= 2.5;
                p.x += (a.x - p.x) * 0.1;
                if (p.y <= a.y + 30) {
                  // Đã bắt thành công tàu!
                  tractorBeamRef.current = null;
                  a.state = 'diving';
                  p.captured = false;
                  p.isAlive = false;
                  setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) {
                      setIsGameOver(true);
                    } else {
                      setTimeout(() => { p.x = ARENA_WIDTH / 2; p.y = ARENA_HEIGHT - 48; p.isAlive = true; }, 1000);
                    }
                    return nl;
                  });
                }
              }
            }
          }
        }

        // E. Điều phối quái vật sà xuống tấn công ngẫu nhiên
        alienAttackTimerRef.current -= dt;
        if (alienAttackTimerRef.current <= 0) {
          alienAttackTimerRef.current = 1500 + Math.random() * 1200;

          const gridAliens = aliensRef.current.filter(a => a.isAlive && a.state === 'grid');
          if (gridAliens.length > 0) {
            // Xác suất 20% Boss kích hoạt Tractor Beam
            const boss = gridAliens.find(a => a.type === 'boss');
            if (boss && Math.random() < 0.25 && !playerRef.current.hasCapturedBuddy) {
              boss.state = 'capturing';
            } else {
              // Chọn 1-2 quái bất kỳ sà xuống
              const diveCandidate = gridAliens[Math.floor(Math.random() * gridAliens.length)];
              diveCandidate.state = 'diving';
              diveCandidate.diveTimer = 0;
            }
          }
        }

        // F. Kiểm tra Chiến Thắng màn chơi
        const livingAliens = aliensRef.current.filter(a => a.isAlive).length;
        if (livingAliens === 0 && !isGameOver && !isVictory) {
          setIsVictory(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          soundManager.playVictory();
        }
      }

      // --- 2. VẼ TOÀN BỘ ĐỒ HỌA GALAGA ARCADE ---
      // A. Nền không gian sâu thẳm
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // B. Nền chiến đấu vũ trụ (0 đến 756px, 0 đến 540px)
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Vẽ Starfield các vì sao lung linh
      for (const s of starsRef.current) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Đường ranh giới ngăn cách sân đấu và sidebar
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH, 0);
      ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT);
      ctx.stroke();

      // C. Vẽ Tia Hút Bắt Giữ (Tractor Beam)
      if (tractorBeamRef.current && tractorBeamRef.current.active) {
        const tb = tractorBeamRef.current;
        const now = Date.now();
        const beamGrad = ctx.createLinearGradient(tb.x, tb.y, tb.x, tb.y + tb.height);
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
        beamGrad.addColorStop(1, 'rgba(14, 165, 233, 0.05)');

        ctx.save();
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(tb.x - 12, tb.y);
        ctx.lineTo(tb.x + 12, tb.y);
        ctx.lineTo(tb.x + tb.width, tb.y + tb.height);
        ctx.lineTo(tb.x - tb.width, tb.y + tb.height);
        ctx.closePath();
        ctx.fill();

        // Các vòng xoáy sóng năng lượng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        for (let y = tb.y + 20; y < tb.y + tb.height; y += 35) {
          const waveOff = Math.sin(now * 0.01 + y * 0.05) * 10;
          const w = ((y - tb.y) / tb.height) * tb.width;
          ctx.beginPath();
          ctx.ellipse(tb.x + waveOff, y, w, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // D. Vẽ Quái Vật Không Gian Galaga (Aliens)
      const now = Date.now();
      for (const a of aliensRef.current) {
        if (!a.isAlive) continue;

        ctx.save();
        ctx.translate(a.x, a.y);

        // Hiệu ứng đập cánh
        const wingFlap = Math.sin(now * 0.012 + a.id) * 3;

        if (a.type === 'boss') {
          // Boss Galaga: Xanh dương & Vàng (Đổi màu đỏ khi bị bắn 1 phát)
          const isHit = a.hp === 1;
          const mainColor = isHit ? '#ef4444' : '#0284c7';
          const subColor = isHit ? '#facc15' : '#38bdf8';

          // Đôi cánh cơ khí
          ctx.fillStyle = mainColor;
          ctx.beginPath();
          ctx.moveTo(-16 - wingFlap, 4);
          ctx.lineTo(-4, -10);
          ctx.lineTo(-4, 10);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(16 + wingFlap, 4);
          ctx.lineTo(4, -10);
          ctx.lineTo(4, 10);
          ctx.closePath();
          ctx.fill();

          // Thân trung tâm
          ctx.fillStyle = subColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sừng kẹp chỉ huy
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-5, -10);
          ctx.lineTo(-8, -16);
          ctx.lineTo(-3, -12);
          ctx.moveTo(5, -10);
          ctx.lineTo(8, -16);
          ctx.lineTo(3, -12);
          ctx.fill();
        } else if (a.type === 'butterfly') {
          // Bướm Đỏ (Red Butterfly / Goei)
          ctx.fillStyle = '#ef4444';
          // Cánh trái
          ctx.beginPath();
          ctx.ellipse(-8, 0, 7 + wingFlap, 11, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          // Cánh phải
          ctx.beginPath();
          ctx.ellipse(8, 0, 7 + wingFlap, 11, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Thân và đầu
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-2, -8, 4, 16);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, -9, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Ong Vàng (Yellow Bee / Zako)
          ctx.fillStyle = '#eab308';
          // Cánh nhọn
          ctx.beginPath();
          ctx.moveTo(-12 - wingFlap, -4);
          ctx.lineTo(-2, -6);
          ctx.lineTo(-4, 6);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(12 + wingFlap, -4);
          ctx.lineTo(2, -6);
          ctx.lineTo(4, 6);
          ctx.closePath();
          ctx.fill();

          // Thân tròn có sọc
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-4, -1, 8, 2);
          ctx.fillRect(-3, 3, 6, 2);
        }

        ctx.restore();
      }

      // E. Vẽ Tàu Chiến Người Chơi (Fighter / Dual Fighter)
      const p = playerRef.current;
      if (p.isAlive) {
        ctx.save();
        ctx.translate(p.x, p.y);

        const drawSingleShip = (offsetX: number) => {
          ctx.save();
          ctx.translate(offsetX, 0);

          // Thân tàu trắng
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, -16);
          ctx.lineTo(12, 12);
          ctx.lineTo(-12, 12);
          ctx.closePath();
          ctx.fill();

          // Cánh đỏ hai bên
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-15, 4, 5, 10);
          ctx.fillRect(10, 4, 5, 10);

          // Mũi nhọn xanh
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-2, -14, 4, 10);

          // Động cơ phản lực phun lửa
          const thruster = Math.sin(now * 0.02) * 3 + 6;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(-4, 12);
          ctx.lineTo(0, 12 + thruster);
          ctx.lineTo(4, 12);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        };

        if (p.isDual) {
          // Vẽ 2 chiếc tàu nối liền nhau
          drawSingleShip(-14);
          drawSingleShip(14);
          // Thanh nối cơ khí giữa 2 tàu
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-10, 4, 20, 4);
        } else {
          // Tàu đơn chuẩn
          drawSingleShip(0);
        }

        ctx.restore();
      }

      // F. Vẽ Đạn Laser (Bullets)
      for (const b of bulletsRef.current) {
        if (!b.isAlive) continue;
        ctx.save();
        if (b.isPlayer) {
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x - 1.5, b.y - 8, 3, 16);
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // G. Vẽ Hiệu ứng Hạt nổ (Particles)
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      particlesRef.current = particlesRef.current.filter(pt => pt.alpha > 0);

      // H. Vẽ Điểm số bay (Floating Texts)
      for (const ft of floatingTextsRef.current) {
        ft.y -= 1.2;
        ft.alpha -= 0.02;

        ctx.save();
        ctx.font = '900 13px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 5;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.alpha > 0);

      // --- 3. BẢNG ĐIỀU KHIỂN CHIẾN ĐẤU CÁNH PHẢI (SIDEBAR 204PX) ---
      ctx.fillStyle = '#070b14';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      const cardX = SIDEBAR_X + 12;
      const cardW = SIDEBAR_WIDTH - 24; // 180px

      const roundRect = (rx: number, ry: number, rw: number, rh: number, rad: number, fill: string, stroke?: string) => {
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, rad);
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      };

      // 1. Thẻ Chiến Cơ (Fighter Status Card)
      roundRect(
        cardX, 
        14, 
        cardW, 
        52, 
        12, 
        isDualFighter ? 'rgba(56, 189, 248, 0.15)' : '#0f172a', 
        isDualFighter ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'
      );

      ctx.fillStyle = isDualFighter ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CHIẾN CƠ', cardX + 12, 34);

      ctx.fillStyle = isDualFighter ? '#facc15' : '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isDualFighter ? '⭐ CHIẾN CƠ KÉP' : '🚀 CHIẾN CƠ ĐƠN', cardX + 12, 52);

      // 2. Thẻ Thống Kê Độ Chính Xác (Accuracy Card)
      roundRect(cardX, 74, cardW, 160, 14, '#0f172a', 'rgba(255, 255, 255, 0.06)');

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ĐỘ CHÍNH XÁC', cardX + 14, 96);

      const accuracyPct = shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : '100.0';
      const statRows = [
        { label: '🎯 Đã bắn:', val: `${shotsFired}`, color: '#ffffff' },
        { label: '💥 Trúng đích:', val: `${shotsHit}`, color: '#38bdf8' },
        { label: '⚡ Tỷ lệ trúng:', val: `${accuracyPct}%`, color: '#34d399' },
      ];

      let rowY = 126;
      statRows.forEach((r, idx) => {
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.moveTo(cardX + 12, rowY - 16);
          ctx.lineTo(cardX + cardW - 12, rowY - 16);
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.label, cardX + 14, rowY);

        ctx.fillStyle = r.color;
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.val, cardX + cardW - 14, rowY);

        rowY += 36;
      });

      // 3. Thẻ Radar Quân Địch (Alien Radar Card)
      const bossCount = aliensRef.current.filter(a => a.isAlive && a.type === 'boss').length;
      const flyCount = aliensRef.current.filter(a => a.isAlive && a.type === 'butterfly').length;
      const beeCount = aliensRef.current.filter(a => a.isAlive && a.type === 'bee').length;
      const totalRemaining = bossCount + flyCount + beeCount;

      roundRect(cardX, 242, cardW, 148, 14, '#0f172a', 'rgba(255, 255, 255, 0.06)');

      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RADAR ĐỊCH', cardX + 14, 264);

      const enemyRows = [
        { label: '👑 Boss Galaga:', val: `${bossCount}`, color: '#38bdf8' },
        { label: '🦋 Bướm đỏ:', val: `${flyCount}`, color: '#f43f5e' },
        { label: '🐝 Ong vàng:', val: `${beeCount}`, color: '#facc15' },
      ];

      let eY = 294;
      enemyRows.forEach((r, idx) => {
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.moveTo(cardX + 12, eY - 16);
          ctx.lineTo(cardX + cardW - 12, eY - 16);
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.label, cardX + 14, eY);

        ctx.fillStyle = r.color;
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.val, cardX + cardW - 14, eY);

        eY += 34;
      });

      // 4. Thẻ Cảnh báo Tàu Bị Bắt (Captured Buddy Alert)
      if (playerRef.current.hasCapturedBuddy) {
        roundRect(cardX, 398, cardW, 66, 12, 'rgba(239, 68, 68, 0.15)', '#ef4444');
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ TÀU ĐANG BỊ BẮT!', cardX + cardW / 2, 420);
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Bắn hạ Boss để cứu tàu!', cardX + cardW / 2, 442);
      } else {
        roundRect(cardX, 398, cardW, 66, 12, '#0f172a', 'rgba(255, 255, 255, 0.04)');
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TỔNG QUÂN ĐỊCH CÒN', cardX + cardW / 2, 420);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 22px monospace';
        ctx.fillText(`${totalRemaining}`, cardX + cardW / 2, 448);
      }

      // 5. Thẻ Màn Chơi (Stage Card)
      roundRect(cardX, 474, cardW, 52, 12, '#0f172a', 'rgba(245, 158, 11, 0.25)');
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHIẾN DỊCH', cardX + cardW / 2, 493);
      ctx.fillStyle = '#facc15';
      ctx.font = '900 18px sans-serif';
      ctx.fillText(`MÀN ${stage}`, cardX + cardW / 2, 514);

      ctx.restore(); // scale dpr

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isDualFighter, isGameOver, isPaused, isVictory, playAlienHitSound, playBeamSound, playDualFighterFanfare, playExplosionSound, shotsFired, shotsHit, stage]);

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setLives(3);
    setShotsFired(0);
    setShotsHit(0);
    setIsDualFighter(false);
    initStage(1);
  };

  const nextStage = () => {
    soundManager.playButtonClick();
    initStage(stage + 1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start p-2 sm:p-4 select-none overflow-hidden bg-[#05070a]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['classic', 'speed', 'endless'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetGame();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === m
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'classic' ? 'Cổ Điển' : m === 'speed' ? 'Tốc Độ' : 'Vô Tận'}
              </button>
            ))}
          </div>
        </div>

        {/* Khối Giữa: Căn giữa tuyệt đối 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-gray-400">ĐIỂM:</span>
            <span className="text-sm sm:text-lg font-black text-amber-400 font-mono tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-300">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <span className="text-gray-400">ĐỊCH:</span>
            <span className="text-rose-400 font-mono font-black">
              {aliensRef.current.filter(a => a.isAlive).length}
            </span>
          </div>

          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-300">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-gray-400">MẠNG:</span>
            <span className="text-emerald-400 font-mono font-black">{lives}</span>
          </div>
        </div>

        {/* Khối Phải: Cấp độ, Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-2 z-10">
          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-black text-cyan-400 font-mono">
            MÀN {stage}
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Chơi Lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container */}
      <div 
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-150px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] touch-none flex-1 min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Điều khiển ảo trên Điện thoại (Virtual Buttons) */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
          {/* Nút điều hướng Trái / Phải */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowLeft'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowLeft'] = false; }}
              className="w-14 h-14 bg-slate-800/80 active:bg-cyan-500 rounded-2xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowRight'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowRight'] = false; }}
              className="w-14 h-14 bg-slate-800/80 active:bg-cyan-500 rounded-2xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Nút Bắn pháo */}
          <div className="pointer-events-auto">
            <button
              onTouchStart={handlePlayerShoot}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30 text-xs flex-col"
            >
              <Zap className="w-6 h-6 mb-0.5 fill-slate-950" />
              <span>BẮN</span>
            </button>
          </div>
        </div>

        {/* Modal Thắng Màn */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1 tracking-wider uppercase">HOÀN THÀNH MÀN {stage}!</h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              Bạn đã tiêu diệt toàn bộ bầy ruồi ngoài hành tinh và bảo vệ an toàn vũ trụ.
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiếp Tục Màn {stage + 1}
            </button>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💥</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              PHI THUYỀN ĐÃ BỊ PHÁ HỦY!
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Điểm số chung cuộc: <span className="font-mono text-amber-400 font-bold">{score.toLocaleString()}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
            >
              Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};