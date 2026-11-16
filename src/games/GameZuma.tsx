import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Heart, 
  Crosshair, 
  Zap,
  Repeat,
  Flame
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'endless';
type BallColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple';
type PowerType = 'none' | 'bomb' | 'slow' | 'reverse' | 'laser';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân đền Aztec chính 756x540px
const ARENA_WIDTH = 756;
const ARENA_HEIGHT = 540;

// Sidebar thông số bên phải (204px)
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

// Bán kính viên bi ngọc
const BALL_RADIUS = 16;
const BALL_DIAMETER = BALL_RADIUS * 2;

// Tọa độ Cóc Đá ở trung tâm
const FROG_X = ARENA_WIDTH / 2;
const FROG_Y = ARENA_HEIGHT / 2 + 10;

// Bảng màu ngọc ma thuật và gradient
const BALL_COLORS: Record<BallColor, { base: string; light: string; dark: string; rune: string }> = {
  red: { base: '#ef4444', light: '#fca5a5', dark: '#991b1b', rune: '▲' },
  blue: { base: '#0ea5e9', light: '#7dd3fc', dark: '#0369a1', rune: '◆' },
  yellow: { base: '#eab308', light: '#fef08a', dark: '#a16207', rune: '★' },
  green: { base: '#10b981', light: '#6ee7b7', dark: '#047857', rune: '●' },
  purple: { base: '#a855f7', light: '#d8b4fe', dark: '#6b21a8', rune: '✦' },
};

const COLOR_KEYS: BallColor[] = ['red', 'blue', 'yellow', 'green', 'purple'];

interface Point {
  x: number;
  y: number;
}

interface TrackPoint {
  x: number;
  y: number;
  distance: number;
}

interface Ball {
  id: number;
  color: BallColor;
  distance: number; // Khoảng cách dọc theo đường ray (0 -> tổng chiều dài)
  power: PowerType;
  scale: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BallColor;
  power: PowerType;
}

interface Coin {
  x: number;
  y: number;
  isAlive: boolean;
  spawnTime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

// Khởi tạo các điểm mẫu tạo đường xoắn ốc mượt mà cho 4 màn chơi
const generateSpiralPath = (stage: number): TrackPoint[] => {
  const points: TrackPoint[] = [];
  const totalSamples = 900;
  let totalDist = 0;

  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples; // 0 (cổng vào) đến 1 (miệng đầu lâu)
    let x = 0;
    let y = 0;

    if (stage === 1) {
      // Màn 1: Xoắn ốc cổ điển elip lớn bao quanh cóc đá
      const theta = 1.2 + t * 3.8 * Math.PI;
      const rX = (1 - t * 0.72) * 310;
      const rY = (1 - t * 0.72) * 205;
      x = FROG_X + Math.cos(theta) * rX;
      y = FROG_Y + Math.sin(theta) * rY;
    } else if (stage === 2) {
      // Màn 2: Đường uốn lượn hình số 8 / đôi cánh bướm
      const theta = t * 4 * Math.PI;
      const rX = 290 * Math.cos(theta * 0.5) * (1 - t * 0.45);
      const rY = 190 * Math.sin(theta) * (1 - t * 0.45);
      x = FROG_X + rX;
      y = FROG_Y + rY;
    } else if (stage === 3) {
      // Màn 3: Đường lượn zic-zac tam giác Maya
      const theta = 0.5 + t * 4.2 * Math.PI;
      const rX = (1 - t * 0.78) * 320;
      const rY = (1 - t * 0.78) * 210;
      x = FROG_X + Math.cos(theta) * rX + Math.sin(theta * 3) * 25;
      y = FROG_Y + Math.sin(theta) * rY + Math.cos(theta * 3) * 20;
    } else {
      // Màn 4: Xoắn ốc kép tử thần hẹp
      const theta = 2.0 + t * 4.6 * Math.PI;
      const rX = (1 - t * 0.8) * 325;
      const rY = (1 - t * 0.8) * 215;
      x = FROG_X + Math.cos(theta) * rX;
      y = FROG_Y + Math.sin(theta) * rY;
    }

    if (i > 0) {
      const dx = x - prevX;
      const dy = y - prevY;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    points.push({ x, y, distance: totalDist });
    prevX = x;
    prevY = y;
  }

  return points;
};

// Tìm tọa độ (x, y) trên đường ray theo khoảng cách distance
const getPointAtDistance = (track: TrackPoint[], distance: number): Point => {
  if (distance <= 0) return { x: track[0].x, y: track[0].y };
  const maxD = track[track.length - 1].distance;
  if (distance >= maxD) {
    const last = track[track.length - 1];
    return { x: last.x, y: last.y };
  }

  // Tìm kiếm nhị phân đoạn chứa distance
  let low = 0;
  let high = track.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (track[mid].distance < distance) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const idx = Math.max(1, low);
  const p0 = track[idx - 1];
  const p1 = track[idx];
  const segDist = p1.distance - p0.distance;
  const ratio = segDist > 0 ? (distance - p0.distance) / segDist : 0;

  return {
    x: p0.x + (p1.x - p0.x) * ratio,
    y: p0.y + (p1.y - p0.y) * ratio,
  };
};

export const GameZuma: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cấu hình game
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [initialLives, setInitialLives] = useState<number>(3);
  const [aimAssist, setAimAssist] = useState<boolean>(true);

  // Trạng thái màn chơi
  const [stage, setStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [zumaMeter, setZumaMeter] = useState<number>(0); // 0 -> 100%
  const [isZumaReached, setIsZumaReached] = useState<boolean>(false);
  const [chainCombo, setChainCombo] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References game state
  const lastTimeRef = useRef<number>(0);
  const frogAngleRef = useRef<number>(0);
  const mousePosRef = useRef<Point>({ x: FROG_X, y: FROG_Y - 100 });
  const trackRef = useRef<TrackPoint[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const bulletRef = useRef<Bullet | null>(null);
  const nextBallRef = useRef<BallColor>('red');
  const currentBallRef = useRef<BallColor>('blue');
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Hiệu ứng bùa chú Power-up
  const slowTimerRef = useRef<number>(0);
  const reverseTimerRef = useRef<number>(0);

  // Web Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load HighScore & Settings
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem('acegames_zuma_highscore');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedSettings = localStorage.getItem('ace_game_settings_zuma');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.gameMode) setGameMode(parsed.gameMode as GameMode);
        if (parsed.initialLives) {
          setInitialLives(parsed.initialLives);
          setLives(parsed.initialLives);
        }
        if (parsed.aimAssist !== undefined) setAimAssist(parsed.aimAssist);
      }
    } catch {
      // ignore
    }
  }, []);

  // Web Audio Procedural Sound Effects
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playShootSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }, [initAudio]);

  const playPopSound = useCallback((combo: number = 0) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const baseFreq = 440 * Math.pow(1.15, Math.min(8, combo));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, [initAudio]);

  const playCoinSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.14);
    });
  }, [initAudio]);

  const playSkullChompSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }, [initAudio]);

  // Sinh màu ngẫu nhiên chỉ từ những màu đang còn tồn tại trong chuỗi bi
  const getRandomAliveColor = useCallback((): BallColor => {
    const existingColors = Array.from(new Set(ballsRef.current.map((b) => b.color)));
    if (existingColors.length > 0) {
      return existingColors[Math.floor(Math.random() * existingColors.length)];
    }
    const colorCount = stage === 1 ? 3 : stage === 2 ? 4 : 5;
    return COLOR_KEYS[Math.floor(Math.random() * colorCount)];
  }, [stage]);

  // Đổi bi giữa miệng và lưng cóc (Swap Ball)
  const swapBalls = useCallback(() => {
    const temp = currentBallRef.current;
    currentBallRef.current = nextBallRef.current;
    nextBallRef.current = temp;
    soundManager.playButtonClick();
  }, []);

  // Khởi tạo màn chơi mới
  const initStage = useCallback((stg: number) => {
    const track = generateSpiralPath(stg);
    trackRef.current = track;

    // Sinh chuỗi bi ban đầu
    const numBalls = 32 + stg * 8;
    const activeColors = COLOR_KEYS.slice(0, stg === 1 ? 3 : stg === 2 ? 4 : 5);
    const initialBalls: Ball[] = [];

    let lastColor: BallColor = activeColors[0];
    let sameColorCount = 0;

    for (let i = 0; i < numBalls; i++) {
      let color = activeColors[Math.floor(Math.random() * activeColors.length)];
      if (color === lastColor) {
        sameColorCount++;
        if (sameColorCount >= 3) {
          const others = activeColors.filter((c) => c !== lastColor);
          color = others[Math.floor(Math.random() * others.length)];
          sameColorCount = 1;
        }
      } else {
        sameColorCount = 1;
      }
      lastColor = color;

      // Xác suất tạo ngọc phép thuật
      let power: PowerType = 'none';
      if (Math.random() < 0.08) {
        const powers: PowerType[] = ['bomb', 'slow', 'reverse', 'laser'];
        power = powers[Math.floor(Math.random() * powers.length)];
      }

      initialBalls.push({
        id: i + 1,
        color,
        distance: -i * BALL_DIAMETER, // Xếp hàng lùi về trước cổng
        power,
        scale: 1,
      });
    }

    ballsRef.current = initialBalls;
    bulletRef.current = null;
    currentBallRef.current = initialBalls[0]?.color || 'red';
    nextBallRef.current = initialBalls[1]?.color || 'blue';

    // Sinh đồng xu tiền cổ ở 2 góc
    coinsRef.current = [
      { x: 90, y: 90, isAlive: true, spawnTime: Date.now() },
      { x: ARENA_WIDTH - 90, y: ARENA_HEIGHT - 90, isAlive: true, spawnTime: Date.now() },
    ];

    setZumaMeter(0);
    setIsZumaReached(false);
    setChainCombo(0);
    setIsVictory(false);
    setIsGameOver(false);
    slowTimerRef.current = 0;
    reverseTimerRef.current = 0;
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    setScore(0);
    setLives(initialLives);
    setStage(1);
    initStage(1);
  }, [initialLives, initStage]);

  // Next Stage
  const nextStage = useCallback(() => {
    const nextSt = (stage % 4) + 1;
    setStage(nextSt);
    initStage(nextSt);
  }, [stage, initStage]);

  // Bắn bi từ miệng Cóc Đá
  const shootBall = useCallback(() => {
    if (bulletRef.current || isPaused || isGameOver || isVictory) return;
    initAudio();

    const angle = frogAngleRef.current;
    const speed = 19; // Tốc độ đạn bay nhanh và mượt

    bulletRef.current = {
      x: FROG_X + Math.cos(angle) * 36,
      y: FROG_Y + Math.sin(angle) * 36,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentBallRef.current,
      power: 'none',
    };

    // Chuẩn bị viên bi tiếp theo
    currentBallRef.current = nextBallRef.current;
    nextBallRef.current = getRandomAliveColor();
    playShootSound();
  }, [isPaused, isGameOver, isVictory, initAudio, playShootSound, getRandomAliveColor]);

  // Lắng nghe chuột và phím Space để đổi bi
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      mousePosRef.current = { x: mx, y: my };
      frogAngleRef.current = Math.atan2(my - FROG_Y, mx - FROG_X);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // Chuột phải: Đổi bi
        e.preventDefault();
        swapBalls();
      } else if (e.button === 0) {
        // Chuột trái: Bắn bi
        shootBall();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio();
      if (e.code === 'Space') {
        e.preventDefault();
        swapBalls();
      } else if (e.code === 'KeyP') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [swapBalls, shootBall, initAudio]);

  // Main Loop Game Engine 60 FPS
  useEffect(() => {
    initStage(stage);
    let animId = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      // Khớp chuẩn Retina High-DPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const track = trackRef.current;
      const maxTrackDist = track.length > 0 ? track[track.length - 1].distance : 1000;

      // 1. CẬP NHẬT VẬT LÝ NẾU KHÔNG TẠM DỪNG / KẾT THÚC
      if (!isPaused && !isGameOver && !isVictory && track.length > 0) {
        // A. Cập nhật bùa chú làm chậm / lùi bước
        if (slowTimerRef.current > 0) slowTimerRef.current -= dt;
        if (reverseTimerRef.current > 0) reverseTimerRef.current -= dt;

        let rollSpeed = 38 + stage * 6; // pixel / giây
        if (slowTimerRef.current > 0) rollSpeed *= 0.35;
        if (reverseTimerRef.current > 0) rollSpeed = -rollSpeed * 1.5;

        // B. Di chuyển chuỗi bi dọc theo rãnh xoắn ốc
        const balls = ballsRef.current;

        // Bi đi đầu tiên tiến lên
        if (balls.length > 0) {
          balls[0].distance += rollSpeed * dt;

          // Các bi phía sau giữ khoảng cách và bị đẩy hoặc kéo lại gần
          for (let i = 1; i < balls.length; i++) {
            const targetDist = balls[i - 1].distance - BALL_DIAMETER;
            // Nếu có khoảng trống ngăn cách do nổ, kiểm tra lực hút từ tính nếu 2 đầu cùng màu
            if (balls[i].distance < targetDist) {
              const gap = targetDist - balls[i].distance;
              if (gap > 4 && balls[i].color === balls[i - 1].color) {
                // Nam châm hút ngược lại để nối liền (Attractive Gap Pull)
                balls[i].distance += Math.min(gap, 240 * dt);
              } else {
                balls[i].distance += rollSpeed * dt;
              }
            } else if (balls[i].distance > targetDist) {
              // Bị bi trước cản lại hoặc đẩy
              balls[i].distance = targetDist;
            }
          }
        }

        // C. Kiểm tra bi rơi vào Miệng Đầu Lâu Vàng (Skull Chomp)
        const leadBall = balls[0];
        if (leadBall && leadBall.distance >= maxTrackDist - 8) {
          // Đầu lâu đớp viên bi
          playSkullChompSound();
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);

          // Trừ mạng
          const nextLives = lives - 1;
          setLives(nextLives);

          if (nextLives <= 0) {
            setIsGameOver(true);
            soundManager.playButtonClick();
          } else {
            // Đẩy lùi toàn bộ chuỗi bi về lại 350px để người chơi tiếp tục
            balls.forEach((b) => {
              b.distance -= 380;
            });
          }
        }

        // D. Di chuyển viên bi đạn (Bullet) và kiểm tra va chạm
        const bullet = bulletRef.current;
        if (bullet) {
          bullet.x += bullet.vx;
          bullet.y += bullet.vy;

          // Bụi lấp lánh đuôi đạn
          if (Math.random() < 0.6) {
            particlesRef.current.push({
              x: bullet.x,
              y: bullet.y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 2 + Math.random() * 3,
              color: BALL_COLORS[bullet.color].light,
              alpha: 0.8,
              life: 0,
              maxLife: 15,
            });
          }

          // Kiểm tra va chạm với Đồng Xu Vàng (Coins)
          coinsRef.current.forEach((coin) => {
            if (coin.isAlive) {
              const distCoin = Math.hypot(bullet.x - coin.x, bullet.y - coin.y);
              if (distCoin < BALL_RADIUS + 18) {
                coin.isAlive = false;
                setScore((s) => s + 500);
                playCoinSound();
                floatingTextsRef.current.push({
                  id: Date.now() + Math.random(),
                  text: '+500 COIN!',
                  x: coin.x,
                  y: coin.y,
                  color: '#facc15',
                  alpha: 1,
                  scale: 1.3,
                });
              }
            }
          });

          // Kiểm tra va chạm với chuỗi bi trên đường ray
          let hitIndex = -1;
          for (let i = 0; i < balls.length; i++) {
            if (balls[i].distance < 0) continue; // Bi chưa ra khỏi cổng
            const pt = getPointAtDistance(track, balls[i].distance);
            const dist = Math.hypot(bullet.x - pt.x, bullet.y - pt.y);

            if (dist < BALL_RADIUS * 1.75) {
              hitIndex = i;
              break;
            }
          }

          if (hitIndex !== -1) {
            // Chèn viên bi vào chuỗi tại vị trí va chạm
            const hitBall = balls[hitIndex];
            const insertDist = hitBall.distance - BALL_RADIUS;

            const newBall: Ball = {
              id: Date.now() + Math.random(),
              color: bullet.color,
              distance: insertDist,
              power: bullet.power,
              scale: 1.2,
            };

            // Đẩy lùi các bi phía sau để nhường chỗ
            for (let j = hitIndex; j < balls.length; j++) {
              balls[j].distance -= BALL_DIAMETER;
            }

            balls.splice(hitIndex, 0, newBall);
            bulletRef.current = null;

            // KIỂM TRA MATCH-3+ VÀ TRIỆT TIÊU
            let matchStart = hitIndex;
            let matchEnd = hitIndex;

            while (matchStart > 0 && balls[matchStart - 1].color === newBall.color) {
              matchStart--;
            }
            while (matchEnd < balls.length - 1 && balls[matchEnd + 1].color === newBall.color) {
              matchEnd++;
            }

            const matchCount = matchEnd - matchStart + 1;
            if (matchCount >= 3) {
              // Tìm thấy chuỗi >= 3 viên cùng màu!
              const eliminatedBalls = balls.slice(matchStart, matchEnd + 1);

              // Kích hoạt bùa phép nếu có ngọc đặc biệt trong chuỗi nổ
              eliminatedBalls.forEach((b) => {
                const pt = getPointAtDistance(track, b.distance);
                if (b.power === 'bomb') {
                  // Nổ bom bán kính
                  for (let i = 0; i < 35; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 6;
                    particlesRef.current.push({
                      x: pt.x,
                      y: pt.y,
                      vx: Math.cos(angle) * spd,
                      vy: Math.sin(angle) * spd,
                      radius: 3 + Math.random() * 5,
                      color: '#ef4444',
                      alpha: 1,
                      life: 0,
                      maxLife: 25,
                    });
                  }
                } else if (b.power === 'slow') {
                  slowTimerRef.current = 6.0;
                } else if (b.power === 'reverse') {
                  reverseTimerRef.current = 4.0;
                }
              });

              // Tạo hạt nổ lấp lánh
              eliminatedBalls.forEach((b) => {
                const pt = getPointAtDistance(track, b.distance);
                for (let k = 0; k < 12; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = 1 + Math.random() * 4;
                  particlesRef.current.push({
                    x: pt.x,
                    y: pt.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    radius: 2 + Math.random() * 3,
                    color: BALL_COLORS[b.color].base,
                    alpha: 1,
                    life: 0,
                    maxLife: 20,
                  });
                }
              });

              // Xóa các bi đã match khỏi chuỗi
              balls.splice(matchStart, matchCount);

              // Tính điểm thưởng combo
              const pointsEarned = matchCount * 100 + (chainCombo > 0 ? chainCombo * 150 : 0);
              setScore((s) => s + pointsEarned);
              setChainCombo((c) => c + 1);
              playPopSound(chainCombo);

              // Tăng thanh tiến trình Zuma
              setZumaMeter((zm) => {
                const newZm = Math.min(100, zm + matchCount * 4);
                if (newZm >= 100 && !isZumaReached) {
                  setIsZumaReached(true);
                  floatingTextsRef.current.push({
                    id: Date.now(),
                    text: '★ ZUMA! ★',
                    x: FROG_X,
                    y: FROG_Y - 70,
                    color: '#facc15',
                    alpha: 1,
                    scale: 2.0,
                  });
                }
                return newZm;
              });

              // Thông báo nổi số điểm
              const hitPt = getPointAtDistance(track, insertDist);
              floatingTextsRef.current.push({
                id: Date.now() + Math.random(),
                text: `+${pointsEarned}`,
                x: hitPt.x,
                y: hitPt.y - 15,
                color: BALL_COLORS[newBall.color].light,
                alpha: 1,
                scale: 1.1,
              });
            } else {
              setChainCombo(0);
            }
          }

          // Nếu đạn bay ra khỏi màn hình
          if (
            bullet.x < -40 ||
            bullet.x > ARENA_WIDTH + 40 ||
            bullet.y < -40 ||
            bullet.y > ARENA_HEIGHT + 40
          ) {
            bulletRef.current = null;
            setChainCombo(0);
          }
        }

        // E. Điều kiện CHIẾN THẮNG MÀN CHƠI: Đạt Zuma 100% và dọn sạch toàn bộ bi
        if (isZumaReached && balls.length === 0) {
          setIsVictory(true);
          confetti({
            particleCount: 120,
            spread: 75,
            origin: { y: 0.6 },
          });
          soundManager.playVictory();
        }

        // Cập nhật hạt bụi và text nổi
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          p.alpha = 1 - p.life / p.maxLife;
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

        floatingTextsRef.current.forEach((ft) => {
          ft.y -= 35 * dt;
          ft.alpha -= dt * 0.9;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);
      }

      // ==========================================
      // 2. RENDER ĐỒ HỌA LÊN RETINA CANVAS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Vẽ nền Đền Đá Cổ Đại Maya Aztec
      ctx.fillStyle = '#181e29';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Hoa văn gạch đá rêu phong
      ctx.strokeStyle = '#222d3d';
      ctx.lineWidth = 1.5;
      const tileSize = 60;
      for (let x = 0; x < ARENA_WIDTH; x += tileSize) {
        for (let y = 0; y < ARENA_HEIGHT; y += tileSize) {
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      // B. Vẽ RÃNH XOẮN ỐC (Spiral Trench Track)
      if (track.length > 1) {
        // Lòng rãnh đá sâu (Drop Shadow)
        ctx.beginPath();
        ctx.moveTo(track[0].x, track[0].y);
        for (let i = 1; i < track.length; i++) {
          ctx.lineTo(track[i].x, track[i].y);
        }
        ctx.strokeStyle = '#0a0d14';
        ctx.lineWidth = BALL_DIAMETER + 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Viền rãnh khắc đá vàng cổ Maya
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = BALL_DIAMETER + 4;
        ctx.stroke();

        ctx.strokeStyle = '#111827';
        ctx.lineWidth = BALL_DIAMETER;
        ctx.stroke();
      }

      // C. Vẽ MIỆNG ĐẦU LÂU VÀNG Ở ĐÍCH (Golden Skull Pit)
      const endPoint = track[track.length - 1];
      if (endPoint) {
        const leadDist = ballsRef.current[0]?.distance || 0;
        const isDanger = leadDist > maxTrackDist * 0.85;

        ctx.save();
        ctx.translate(endPoint.x, endPoint.y);

        // Hào quang cảnh báo đỏ nhấp nháy khi nguy hiểm
        if (isDanger) {
          ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.15)';
          ctx.beginPath();
          ctx.arc(0, 0, 38, 0, Math.PI * 2);
          ctx.fill();
        }

        // Thân đầu lâu vàng
        ctx.fillStyle = isDanger ? '#ef4444' : '#eab308';
        ctx.beginPath();
        ctx.arc(0, -5, 24, 0, Math.PI * 2);
        ctx.fill();

        // Hàm dưới
        ctx.fillRect(-14, 10, 28, 14);

        // Hốc mắt đen
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-8, -6, 6, 0, Math.PI * 2);
        ctx.arc(8, -6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Hốc mũi
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(-3, 8);
        ctx.lineTo(3, 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // D. Vẽ CÁC ĐỒNG XU VÀNG CỔ ĐẠI (Coins)
      coinsRef.current.forEach((coin) => {
        if (!coin.isAlive) return;
        ctx.save();
        ctx.translate(coin.x, coin.y);

        const pulse = Math.sin(Date.now() / 200) * 2;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 16 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#713f12';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        ctx.restore();
      });

      // E. Vẽ CHUỖI BI LĂN TRÊN ĐƯỜNG RAY (Marble Chain)
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.distance < 0 || b.distance > maxTrackDist) continue;

        const pt = getPointAtDistance(track, b.distance);
        const col = BALL_COLORS[b.color];

        ctx.save();
        ctx.translate(pt.x, pt.y);

        // Đổ bóng 3D của bi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(3, 4, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Gradient khối cầu 3D ngọc sáng
        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, BALL_RADIUS);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.5, col.base);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Ký hiệu cổ đại khắc giữa viên ngọc
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(col.rune, 0, 1);

        // Biểu tượng ngọc phép thuật đặc biệt (Power-up badge)
        if (b.power !== 'none') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // F. Vẽ TIA NGẮM ĐỊNH HƯỚNG (Aim Assist Line)
      if (aimAssist && !bulletRef.current) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(FROG_X, FROG_Y);
        const aimDist = 280;
        ctx.lineTo(
          FROG_X + Math.cos(frogAngleRef.current) * aimDist,
          FROG_Y + Math.sin(frogAngleRef.current) * aimDist
        );
        ctx.stroke();
        ctx.restore();
      }

      // G. Vẽ VIÊN BI ĐẠN ĐANG BAY (Bullet)
      const bullet = bulletRef.current;
      if (bullet) {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        const col = BALL_COLORS[bullet.color];

        const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BALL_RADIUS);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.6, col.base);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // H. Vẽ CHÚ CÓC ĐÁ CỔ ĐẠI Ở TRUNG TÂM (Zuma Stone Frog)
      ctx.save();
      ctx.translate(FROG_X, FROG_Y);
      ctx.rotate(frogAngleRef.current);

      // Đổ bóng cóc đá
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(4, 6, 42, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thân cóc đá màu xanh rêu Aztec
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Đôi mắt lồi của cóc
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(24, -20, 11, 0, Math.PI * 2);
      ctx.arc(24, 20, 11, 0, Math.PI * 2);
      ctx.fill();

      // Tròng mắt vàng rực
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(26, -20, 5, 0, Math.PI * 2);
      ctx.arc(26, 20, 5, 0, Math.PI * 2);
      ctx.fill();

      // Viên ngọc dự phòng trên lưng cóc (Next Ball)
      const nextCol = BALL_COLORS[nextBallRef.current];
      ctx.fillStyle = nextCol.base;
      ctx.beginPath();
      ctx.arc(-16, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Viên ngọc trong miệng cóc sẵn sàng bắn (Current Ball)
      const currCol = BALL_COLORS[currentBallRef.current];
      const curGrad = ctx.createRadialGradient(28, -2, 2, 30, 0, 14);
      curGrad.addColorStop(0, currCol.light);
      curGrad.addColorStop(0.6, currCol.base);
      curGrad.addColorStop(1, currCol.dark);
      ctx.fillStyle = curGrad;
      ctx.beginPath();
      ctx.arc(30, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // I. Hạt bụi nổ và Text nổi
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = `black ${Math.round(16 * ft.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // ==========================================
      // J. SIDEBAR BẢNG ĐIỀU KHIỂN & TELEMETRY (204px)
      // ==========================================
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X, 0);
      ctx.lineTo(SIDEBAR_X, CANVAS_HEIGHT);
      ctx.stroke();

      // Tiêu đề Sidebar
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ZUMA TEMPLE', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // 1. THANH TÍCH LŨY ZUMA (Zuma Progress Bar)
      const zbX = SIDEBAR_X + 20;
      const zbY = 50;
      const zbW = SIDEBAR_WIDTH - 40;
      const zbH = 22;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(zbX, zbY, zbW, zbH, 6);
      ctx.fill();

      // Thanh năng lượng Zuma vàng cam
      const zRatio = Math.min(1, Math.max(0, zumaMeter / 100));
      ctx.fillStyle = isZumaReached ? '#22c55e' : '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(zbX, zbY, zbW * zRatio, zbH, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(isZumaReached ? 'ZUMA HOÀN TẤT!' : `TIẾN TRÌNH: ${Math.round(zumaMeter)}%`, SIDEBAR_X + SIDEBAR_WIDTH / 2, zbY + 15);

      // 2. MẠNG SỐNG (Lives)
      const livesY = 100;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('MẠNG CÒN LẠI', SIDEBAR_X + SIDEBAR_WIDTH / 2, livesY);

      for (let i = 0; i < 3; i++) {
        const lx = SIDEBAR_X + 50 + i * 36;
        const ly = livesY + 22;
        ctx.fillStyle = i < lives ? '#ef4444' : '#334155';
        ctx.beginPath();
        ctx.arc(lx, ly, 10, 0, Math.PI * 2);
        ctx.fill();
        if (i < lives) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('♥', lx, ly + 3);
        }
      }

      // 3. SỐ BI CÒN LẠI & MÀN
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, 160, SIDEBAR_WIDTH - 32, 90, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('BI TRÊN ĐƯỜNG RAY', SIDEBAR_X + SIDEBAR_WIDTH / 2, 185);

      ctx.fillStyle = balls.length <= 5 ? '#ef4444' : '#38bdf8';
      ctx.font = 'black 28px monospace';
      ctx.fillText(`${balls.length}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 222);

      // 4. MÀN & ĐIỂM SỐ
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`MÀN: ${stage} • COMBO: ${chainCombo}X`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 285);

      // Khung Điểm số
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, 310, SIDEBAR_WIDTH - 32, 70, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ĐIỂM SỐ', SIDEBAR_X + SIDEBAR_WIDTH / 2, 335);

      ctx.fillStyle = '#facc15';
      ctx.font = 'black 22px monospace';
      ctx.fillText(`${score.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 365);

      // Điểm kỷ lục
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 420);

      // Hướng dẫn nhanh nút đổi bi
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('[SPACE / CHUỘT PHẢI]', SIDEBAR_X + SIDEBAR_WIDTH / 2, 490);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('ĐỔI MÀU BI', SIDEBAR_X + SIDEBAR_WIDTH / 2, 508);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    isPaused, 
    isGameOver, 
    isVictory, 
    stage, 
    score, 
    highScore, 
    lives, 
    zumaMeter, 
    isZumaReached, 
    chainCombo, 
    aimAssist, 
    initStage, 
    playPopSound, 
    playCoinSound, 
    playSkullChompSound
  ]);

  // Lưu điểm cao kỷ lục
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('acegames_zuma_highscore', score.toString());
      } catch {
        // ignore
      }
    }
  }, [score, highScore]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* 3-Column Top HUD Bar */}
      <div className="w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-2 mb-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm">
        {/* Cột 1: Thông tin chế độ */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="capitalize">
              {gameMode === 'classic' ? 'Cổ Điển' : gameMode === 'speed' ? 'Tốc Độ' : 'Vô Tận'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 text-gray-300 font-medium border border-white/5">
            <span>Màn {stage} • Đền Maya</span>
          </div>
        </div>

        {/* Cột 2: Điểm số & Mạng */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-gray-400 text-xs hidden sm:inline">ĐIỂM:</span>
            <span className="text-sm sm:text-base">{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-rose-400">
            <Heart className="w-4 h-4" />
            <span className="text-sm sm:text-base">{lives} MẠNG</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAimAssist((a) => !a)}
            className={`p-2 rounded-xl border border-white/10 transition cursor-pointer active:scale-95 shadow-sm ${
              aimAssist ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : 'bg-slate-800 text-gray-400'
            }`}
            title="Bật/Tắt Tia Ngắm"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
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
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-150px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-1 min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Nút Đổi Bi & Bắn Ảo trên Màn hình Cảm ứng Mobile */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
          <div className="pointer-events-auto">
            <button
              onClick={swapBalls}
              className="w-15 h-15 rounded-2xl bg-slate-800/90 active:bg-amber-500 border border-white/20 text-white font-bold text-xs flex flex-col items-center justify-center shadow-lg"
            >
              <Repeat className="w-5 h-5 mb-0.5 text-amber-400" />
              <span>ĐỔI BI</span>
            </button>
          </div>

          <div className="pointer-events-auto">
            <button
              onClick={shootBall}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30 text-xs flex-col"
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
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              CHIẾN THẮNG ĐỀN THỜ MÀN {stage}!
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              Bạn đã triệt tiêu toàn bộ chuỗi ngọc ma thuật và bảo vệ an toàn kho báu thần bí.
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiến Vào Đền {stage + 1}
            </button>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💀</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              ĐẦU LÂU ĐÃ NUỐT CHỬNG CHUỖI BI!
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-2">
              Chuỗi ngọc ma thuật đã rơi vào miệng đầu lâu thần bí.
            </p>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Điểm số: <span className="font-mono text-amber-400 font-bold">{score.toLocaleString()}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
            >
              Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
