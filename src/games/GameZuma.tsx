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
  Flame,
  Sparkles
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

// Tọa độ Cóc Đá ở trung tâm điện thờ
const FROG_X = 378;
const FROG_Y = 270;

// Bảng màu ngọc ma thuật và gradient
const BALL_COLORS: Record<BallColor, { base: string; light: string; dark: string; glow: string; rune: string; name: string }> = {
  red: { base: '#ef4444', light: '#fca5a5', dark: '#7f1d1d', glow: '#f87171', rune: '▲', name: 'Ruby Đỏ' },
  blue: { base: '#0284c7', light: '#7dd3fc', dark: '#0c4a6e', glow: '#38bdf8', rune: '◆', name: 'Sapphire Lam' },
  yellow: { base: '#eab308', light: '#fef08a', dark: '#713f12', glow: '#facc15', rune: '★', name: 'Topaz Vàng' },
  green: { base: '#10b981', light: '#6ee7b7', dark: '#064e3b', glow: '#34d399', rune: '●', name: 'Emerald Lục' },
  purple: { base: '#a855f7', light: '#e9d5ff', dark: '#581c87', glow: '#c084fc', rune: '✦', name: 'Amethyst Tím' },
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
  isExploding?: boolean;
  explodeAlpha?: number;
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
  pulseTimer: number;
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

// Xây dựng đường ray xoắn ốc tuyệt mỹ cho các màn chơi
const generateTrackSpline = (stage: number): TrackPoint[] => {
  // Điểm kiểm soát Bézier cong mượt mà ôm quanh Cóc đá mà không đè lên cóc
  let controlPoints: Point[] = [];

  if (stage === 1) {
    // Màn 1: Thung Lũng Rắn Thần Maya - Vòng xoắn đôi uy nghi
    controlPoints = [
      { x: 50, y: 490 },   // Cổng vào góc dưới trái
      { x: 220, y: 500 },
      { x: 450, y: 500 },
      { x: 670, y: 460 },
      { x: 710, y: 350 },
      { x: 710, y: 180 },
      { x: 660, y: 70 },
      { x: 490, y: 45 },
      { x: 280, y: 45 },
      { x: 100, y: 80 },
      { x: 60, y: 190 },
      { x: 70, y: 330 },
      { x: 130, y: 410 },
      { x: 240, y: 440 },
      { x: 430, y: 440 },
      { x: 580, y: 390 },
      { x: 630, y: 280 },
      { x: 610, y: 160 },
      { x: 500, y: 125 },  // Miệng Đầu Lâu Vàng ở (500, 125)
    ];
  } else if (stage === 2) {
    // Màn 2: Đền Thờ Mặt Trời - Đường cánh bướm kép
    controlPoints = [
      { x: 50, y: 70 },    // Cổng vào góc trên trái
      { x: 200, y: 50 },
      { x: 380, y: 80 },
      { x: 550, y: 50 },
      { x: 700, y: 90 },
      { x: 720, y: 240 },
      { x: 660, y: 380 },
      { x: 540, y: 470 },
      { x: 380, y: 480 },
      { x: 200, y: 470 },
      { x: 70, y: 400 },
      { x: 60, y: 260 },
      { x: 130, y: 170 },
      { x: 250, y: 140 },
      { x: 380, y: 160 },
      { x: 520, y: 180 },
      { x: 600, y: 280 },
      { x: 550, y: 380 },
      { x: 420, y: 400 },
      { x: 280, y: 380 },  // Đầu lâu ở góc dưới bên trái
    ];
  } else if (stage === 3) {
    // Màn 3: Kim Tự Tháp Thần Bí - Zic-zac Aztec
    controlPoints = [
      { x: 700, y: 50 },   // Cổng vào góc trên phải
      { x: 520, y: 60 },
      { x: 300, y: 60 },
      { x: 80, y: 90 },
      { x: 60, y: 240 },
      { x: 100, y: 390 },
      { x: 280, y: 470 },
      { x: 520, y: 480 },
      { x: 700, y: 420 },
      { x: 710, y: 260 },
      { x: 640, y: 150 },
      { x: 480, y: 130 },
      { x: 270, y: 140 },
      { x: 160, y: 220 },
      { x: 160, y: 340 },
      { x: 270, y: 400 },
      { x: 450, y: 400 },
      { x: 560, y: 330 },
      { x: 540, y: 200 },
      { x: 400, y: 150 },
    ];
  } else {
    // Màn 4: Núi Lửa Quỷ - Xoắn ốc lửa tử thần
    controlPoints = [
      { x: 60, y: 480 },
      { x: 260, y: 490 },
      { x: 500, y: 490 },
      { x: 700, y: 440 },
      { x: 720, y: 280 },
      { x: 680, y: 120 },
      { x: 500, y: 60 },
      { x: 260, y: 60 },
      { x: 80, y: 120 },
      { x: 60, y: 270 },
      { x: 100, y: 390 },
      { x: 220, y: 430 },
      { x: 420, y: 430 },
      { x: 580, y: 370 },
      { x: 630, y: 250 },
      { x: 590, y: 150 },
      { x: 480, y: 120 },
      { x: 320, y: 130 },
      { x: 210, y: 210 },
      { x: 220, y: 330 },
      { x: 340, y: 380 },
      { x: 480, y: 360 },
      { x: 530, y: 270 },
    ];
  }

  // Nội suy spline Catmull-Rom mượt mà qua các điểm kiểm soát
  const points: TrackPoint[] = [];
  const samplesPerSegment = 40;
  let totalDist = 0;
  let prevX = controlPoints[0].x;
  let prevY = controlPoints[0].y;

  points.push({ x: prevX, y: prevY, distance: 0 });

  for (let i = 0; i < controlPoints.length - 1; i++) {
    const p0 = i > 0 ? controlPoints[i - 1] : controlPoints[i];
    const p1 = controlPoints[i];
    const p2 = controlPoints[i + 1];
    const p3 = i + 2 < controlPoints.length ? controlPoints[i + 2] : p2;

    for (let s = 1; s <= samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      // Công thức Catmull-Rom
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

      const dx = x - prevX;
      const dy = y - prevY;
      totalDist += Math.sqrt(dx * dx + dy * dy);

      points.push({ x, y, distance: totalDist });
      prevX = x;
      prevY = y;
    }
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

  // Binary search tìm phân đoạn
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
  const [ballsOnTrackCount, setBallsOnTrackCount] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References game loop & state
  const lastTimeRef = useRef<number>(0);
  const frogAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const mousePosRef = useRef<Point>({ x: FROG_X, y: FROG_Y - 120 });
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
  const dangerWarningTimerRef = useRef<number>(0);

  // Web Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load Highscore & Settings
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
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }, [initAudio]);

  const playPopSound = useCallback((combo: number = 0) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const baseFreq = 440 * Math.pow(1.18, Math.min(8, combo));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }, [initAudio]);

  const playMagneticClack = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, [initAudio]);

  const playCoinSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    [987.77, 1318.51, 1567.98].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.14);
    });
  }, [initAudio]);

  const playSkullChompSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(35, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, [initAudio]);

  // Sinh màu ngẫu nhiên từ những màu đang có trên đường ray
  const getRandomAliveColor = useCallback((): BallColor => {
    const existing = Array.from(new Set(ballsRef.current.filter((b) => b.distance >= 0).map((b) => b.color)));
    if (existing.length > 0) {
      return existing[Math.floor(Math.random() * existing.length)];
    }
    const colorCount = stage === 1 ? 3 : stage === 2 ? 4 : 5;
    return COLOR_KEYS[Math.floor(Math.random() * colorCount)];
  }, [stage]);

  // Đổi bi giữa miệng và lưng cóc
  const swapBalls = useCallback(() => {
    const temp = currentBallRef.current;
    currentBallRef.current = nextBallRef.current;
    nextBallRef.current = temp;
    soundManager.playButtonClick();
  }, []);

  // Khởi tạo màn chơi mới
  const initStage = useCallback((stg: number) => {
    const track = generateTrackSpline(stg);
    trackRef.current = track;

    const activeColors = COLOR_KEYS.slice(0, stg === 1 ? 3 : stg === 2 ? 4 : 5);
    const initialBalls: Ball[] = [];
    const totalStageBalls = 34 + stg * 6;

    // QUAN TRỌNG: KHỞI TẠO CHUỖI BI XUẤT HIỆN SẴN TRÊN ĐƯỜNG RAY!
    // Khoảng 22 viên bi đầu tiên đã uốn lượn sẵn trên đường ray từ cổng vào (distance: 100 đến 800)
    const initialLeadDist = 22 * BALL_DIAMETER + 80;

    let lastCol: BallColor = activeColors[0];
    let sameCount = 0;

    for (let i = 0; i < totalStageBalls; i++) {
      let color = activeColors[Math.floor(Math.random() * activeColors.length)];
      if (color === lastCol) {
        sameCount++;
        if (sameCount >= 3) {
          const others = activeColors.filter((c) => c !== lastCol);
          color = others[Math.floor(Math.random() * others.length)];
          sameCount = 1;
        }
      } else {
        sameCount = 1;
      }
      lastCol = color;

      // Xác suất tạo ngọc phép thuật (Bomb, Slow, Reverse, Laser)
      let power: PowerType = 'none';
      if (Math.random() < 0.1) {
        const powers: PowerType[] = ['bomb', 'slow', 'reverse', 'laser'];
        power = powers[Math.floor(Math.random() * powers.length)];
      }

      initialBalls.push({
        id: i + 1,
        color,
        distance: initialLeadDist - i * BALL_DIAMETER,
        power,
        scale: 1,
      });
    }

    ballsRef.current = initialBalls;
    bulletRef.current = null;
    currentBallRef.current = initialBalls[0]?.color || 'red';
    nextBallRef.current = initialBalls[1]?.color || 'blue';

    // Tạo các đồng tiền vàng cổ Aztec ở góc chiến lược
    coinsRef.current = [
      { x: 120, y: 140, isAlive: true, pulseTimer: 0 },
      { x: ARENA_WIDTH - 120, y: ARENA_HEIGHT - 130, isAlive: true, pulseTimer: 0 },
    ];

    setZumaMeter(0);
    setIsZumaReached(false);
    setChainCombo(0);
    setIsVictory(false);
    setIsGameOver(false);
    setBallsOnTrackCount(initialBalls.length);
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
    const speed = 23; // Tốc độ đạn bay nhanh và mượt

    bulletRef.current = {
      x: FROG_X + Math.cos(angle) * 36,
      y: FROG_Y + Math.sin(angle) * 36,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentBallRef.current,
      power: 'none',
    };

    // Nạp bi tiếp theo vào miệng
    currentBallRef.current = nextBallRef.current;
    nextBallRef.current = getRandomAliveColor();
    playShootSound();
  }, [isPaused, isGameOver, isVictory, initAudio, playShootSound, getRandomAliveColor]);

  // Lắng nghe chuột và phím điều khiển
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
      targetAngleRef.current = Math.atan2(my - FROG_Y, mx - FROG_X);
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

  // Main Game Loop 60 FPS
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
      const maxTrackDist = track.length > 0 ? track[track.length - 1].distance : 1500;

      // Xoay cóc mượt mà theo hướng con trỏ chuột (Smooth angle tracking)
      let angleDiff = targetAngleRef.current - frogAngleRef.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      frogAngleRef.current += angleDiff * Math.min(1, 16 * dt);

      // ==========================================
      // 1. CẬP NHẬT VẬT LÝ NẾU ĐANG CHƠI
      // ==========================================
      if (!isPaused && !isGameOver && !isVictory && track.length > 0) {
        // Cập nhật bùa chú
        if (slowTimerRef.current > 0) slowTimerRef.current -= dt;
        if (reverseTimerRef.current > 0) reverseTimerRef.current -= dt;

        let baseRollSpeed = (48 + stage * 7); // pixel / giây
        if (gameMode === 'speed') baseRollSpeed *= 1.35;
        if (slowTimerRef.current > 0) baseRollSpeed *= 0.32;
        if (reverseTimerRef.current > 0) baseRollSpeed = -baseRollSpeed * 1.6;

        const balls = ballsRef.current;

        // DI CHUYỂN CHUỖI BI VÀ LỰC HÚT NAM CHÂM LÙI KHI CÓ KHOẢNG TRỐNG
        if (balls.length > 0) {
          // Viên bi đầu đàn tiến lên
          balls[0].distance += baseRollSpeed * dt;

          // Các bi phía sau giữ khoảng cách và kiểm tra lực hút nam châm
          for (let i = 1; i < balls.length; i++) {
            const targetDist = balls[i - 1].distance - BALL_DIAMETER;
            const currentDist = balls[i].distance;

            if (currentDist < targetDist) {
              const gap = targetDist - currentDist;
              // Nếu 2 đầu hở cùng màu: KÍCH HOẠT LỰC HÚT TỪ TÍNH LÙI LẠI (Magnetic Gap Pull)
              if (gap > 4 && balls[i].color === balls[i - 1].color) {
                const pullSpeed = 320 * dt;
                balls[i].distance += Math.min(gap, pullSpeed);
                if (gap <= pullSpeed) {
                  // Hai đầu va chạm vào nhau: Phát âm thanh tiếp xúc bi
                  playMagneticClack();
                }
              } else {
                balls[i].distance += baseRollSpeed * dt;
              }
            } else if (currentDist > targetDist) {
              // Bị cản lại hoặc đẩy
              balls[i].distance = targetDist;
            }
          }
        }

        setBallsOnTrackCount(balls.filter((b) => b.distance >= 0).length);

        // KIỂM TRA ĐẦU LÂU NUỐT CHỬNG CHUỖI BI (Skull Pit Chomp)
        const leadBall = balls[0];
        if (leadBall && leadBall.distance >= maxTrackDist - 10) {
          playSkullChompSound();
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 350);

          const nextLives = lives - 1;
          setLives(nextLives);

          if (nextLives <= 0) {
            setIsGameOver(true);
            soundManager.playButtonClick();
          } else {
            // Đẩy lùi chuỗi bi về lại 420px để người chơi tiếp tục giải cứu
            balls.forEach((b) => {
              b.distance -= 420;
            });
          }
        }

        // CẢNH BÁO NGUY HIỂM KHI BI ÁP SÁT ĐẦU LÂU (> 82% chiều dài)
        if (leadBall && leadBall.distance > maxTrackDist * 0.82) {
          dangerWarningTimerRef.current += dt;
          if (dangerWarningTimerRef.current >= 0.8) {
            dangerWarningTimerRef.current = 0;
            // Nhịp tim cảnh báo nguy hiểm
            playMagneticClack();
          }
        }

        // DI CHUYỂN VIÊN BI ĐẠN VÀ VA CHẠM
        const bullet = bulletRef.current;
        if (bullet) {
          bullet.x += bullet.vx;
          bullet.y += bullet.vy;

          // Hạt bụi năng lượng phát sáng sau đuôi đạn
          particlesRef.current.push({
            x: bullet.x,
            y: bullet.y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            radius: 2 + Math.random() * 3,
            color: BALL_COLORS[bullet.color].light,
            alpha: 0.85,
            life: 0,
            maxLife: 14,
          });

          // Va chạm với Đồng Tiền Vàng Cổ Aztec
          coinsRef.current.forEach((coin) => {
            if (coin.isAlive) {
              const distCoin = Math.hypot(bullet.x - coin.x, bullet.y - coin.y);
              if (distCoin < BALL_RADIUS + 18) {
                coin.isAlive = false;
                setScore((s) => s + 500);
                playCoinSound();
                floatingTextsRef.current.push({
                  id: Date.now() + Math.random(),
                  text: '+500 TIỀN VÀNG!',
                  x: coin.x,
                  y: coin.y - 10,
                  color: '#facc15',
                  alpha: 1,
                  scale: 1.3,
                });
              }
            }
          });

          // Va chạm với chuỗi bi trên đường ray
          let hitIndex = -1;
          for (let i = 0; i < balls.length; i++) {
            if (balls[i].distance < 0) continue;
            const pt = getPointAtDistance(track, balls[i].distance);
            const dist = Math.hypot(bullet.x - pt.x, bullet.y - pt.y);

            if (dist < BALL_RADIUS * 1.8) {
              hitIndex = i;
              break;
            }
          }

          if (hitIndex !== -1) {
            const hitBall = balls[hitIndex];
            const insertDist = hitBall.distance - BALL_RADIUS;

            const newBall: Ball = {
              id: Date.now() + Math.random(),
              color: bullet.color,
              distance: insertDist,
              power: bullet.power,
              scale: 1.2,
            };

            // Đẩy lùi các bi phía sau để chèn vào giữa
            for (let j = hitIndex; j < balls.length; j++) {
              balls[j].distance -= BALL_DIAMETER;
            }

            balls.splice(hitIndex, 0, newBall);
            bulletRef.current = null;
            playMagneticClack();

            // KIỂM TRA MATCH-3+ VÀ KÍCH NỔ
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
              const eliminatedBalls = balls.slice(matchStart, matchEnd + 1);

              // Xử lý bùa chú Power-up nếu có viên ngọc đặc biệt
              eliminatedBalls.forEach((b) => {
                const pt = getPointAtDistance(track, b.distance);
                if (b.power === 'bomb') {
                  // Nổ bom bán kính
                  for (let i = 0; i < 40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 6;
                    particlesRef.current.push({
                      x: pt.x,
                      y: pt.y,
                      vx: Math.cos(angle) * spd,
                      vy: Math.sin(angle) * spd,
                      radius: 3 + Math.random() * 5,
                      color: ['#ef4444', '#f97316', '#facc15'][Math.floor(Math.random() * 3)],
                      alpha: 1,
                      life: 0,
                      maxLife: 26,
                    });
                  }
                  // Phá thêm 2 viên bi liền kề
                  if (matchStart > 0) balls.splice(matchStart - 1, 1);
                } else if (b.power === 'slow') {
                  slowTimerRef.current = 6.0;
                } else if (b.power === 'reverse') {
                  reverseTimerRef.current = 4.0;
                }
              });

              // Tạo pháo hoa hạt ngọc nổ
              eliminatedBalls.forEach((b) => {
                const pt = getPointAtDistance(track, b.distance);
                for (let k = 0; k < 14; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const spd = 1.5 + Math.random() * 4.5;
                  particlesRef.current.push({
                    x: pt.x,
                    y: pt.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    radius: 2 + Math.random() * 3.5,
                    color: BALL_COLORS[b.color].glow,
                    alpha: 1,
                    life: 0,
                    maxLife: 22,
                  });
                }
              });

              // Xóa các viên bi đã nổ
              balls.splice(matchStart, matchCount);

              // Tính điểm thưởng combo
              const pointsEarned = matchCount * 100 + (chainCombo > 0 ? chainCombo * 180 : 0);
              setScore((s) => s + pointsEarned);
              setChainCombo((c) => c + 1);
              playPopSound(chainCombo);

              // Tăng thanh tiến trình Zuma
              setZumaMeter((zm) => {
                const newZm = Math.min(100, zm + matchCount * 3.5);
                if (newZm >= 100 && !isZumaReached) {
                  setIsZumaReached(true);
                  floatingTextsRef.current.push({
                    id: Date.now(),
                    text: '★ ZUMA! ★',
                    x: FROG_X,
                    y: FROG_Y - 75,
                    color: '#facc15',
                    alpha: 1,
                    scale: 2.2,
                  });
                  soundManager.playButtonClick();
                }
                return newZm;
              });

              // Thông báo nổi điểm số
              const hitPt = getPointAtDistance(track, insertDist);
              floatingTextsRef.current.push({
                id: Date.now() + Math.random(),
                text: chainCombo > 0 ? `COMBO x${chainCombo + 1} +${pointsEarned}` : `+${pointsEarned}`,
                x: hitPt.x,
                y: hitPt.y - 18,
                color: chainCombo > 0 ? '#facc15' : BALL_COLORS[newBall.color].light,
                alpha: 1,
                scale: chainCombo > 0 ? 1.4 : 1.1,
              });
            } else {
              setChainCombo(0);
            }
          }

          // Đạn bay ra khỏi màn chơi
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

        // ĐIỀU KIỆN THẮNG: Đạt Zuma 100% và dọn sạch toàn bộ bi
        if (isZumaReached && balls.length === 0) {
          setIsVictory(true);
          confetti({
            particleCount: 140,
            spread: 80,
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
          ft.y -= 36 * dt;
          ft.alpha -= dt * 0.85;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);
      }

      // ==========================================
      // 2. RENDER ĐỒ HỌA TUYỆT ĐẸP LÊN RETINA CANVAS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. NỀN ĐỀN THỜ AZTEC CỔ ĐẠI (Ancient Mayan Stone Temple)
      const templeGrad = ctx.createRadialGradient(FROG_X, FROG_Y, 80, FROG_X, FROG_Y, 440);
      templeGrad.addColorStop(0, '#1c2838');
      templeGrad.addColorStop(0.65, '#0f172a');
      templeGrad.addColorStop(1, '#070b14');
      ctx.fillStyle = templeGrad;
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Gạch đá phiến cổ chạm khắc hoa văn (Ancient Stone Flags)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const tileSize = 64;
      for (let x = 0; x < ARENA_WIDTH; x += tileSize) {
        for (let y = 0; y < ARENA_HEIGHT; y += tileSize) {
          ctx.strokeRect(x, y, tileSize, tileSize);
          // Vết nứt đá phong trần ngẫu nhiên
          if ((x + y) % 192 === 0) {
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 15);
            ctx.lineTo(x + 24, y + 28);
            ctx.lineTo(x + 38, y + 24);
            ctx.strokeStyle = '#334155';
            ctx.stroke();
          }
        }
      }

      // 4 ĐUỐC LỬA THẦN Ở 4 GÓC (Ancient Temple Fire Braziers)
      const torches = [
        { x: 35, y: 35 },
        { x: ARENA_WIDTH - 35, y: 35 },
        { x: 35, y: ARENA_HEIGHT - 35 },
        { x: ARENA_WIDTH - 35, y: ARENA_HEIGHT - 35 },
      ];

      torches.forEach((tc) => {
        // Ánh lửa lan tỏa
        const fireGrad = ctx.createRadialGradient(tc.x, tc.y, 4, tc.x, tc.y, 75);
        fireGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
        fireGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.08)');
        fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(tc.x, tc.y, 75, 0, Math.PI * 2);
        ctx.fill();

        // Bệ đuốc đá
        ctx.fillStyle = '#334155';
        ctx.fillRect(tc.x - 8, tc.y - 8, 16, 16);
        // Ngọn lửa
        const flameOffset = Math.sin(Date.now() / 150 + tc.x) * 2;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(tc.x, tc.y + flameOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tc.x, tc.y + flameOffset - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // B. BỆ THỜ ĐÁ CHẠM KHẮC TRUNG TÂM (Sacred Altar Pedestal)
      ctx.save();
      ctx.translate(FROG_X, FROG_Y);
      // Vòng tròn bệ đá ngoài
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Vòng khắc hoa văn vàng Maya
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bệ đá nổi
      const altGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
      altGrad.addColorStop(0, '#1e293b');
      altGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = altGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // C. VẼ RÃNH ĐÁ XOẮN ỐC (Carved Stone Spiral Trench)
      if (track.length > 1) {
        // Viền đá đắp nổi hai bên rãnh
        ctx.beginPath();
        ctx.moveTo(track[0].x, track[0].y);
        for (let i = 1; i < track.length; i++) {
          ctx.lineTo(track[i].x, track[i].y);
        }
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = BALL_DIAMETER + 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Lòng rãnh khoét sâu bóng đen
        ctx.strokeStyle = '#05080f';
        ctx.lineWidth = BALL_DIAMETER + 6;
        ctx.stroke();

        // Lòng rãnh nhựa ngọc
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = BALL_DIAMETER;
        ctx.stroke();

        // Đường ray dẫn hướng ánh sáng thần bí
        ctx.strokeStyle = slowTimerRef.current > 0 ? '#38bdf8' : reverseTimerRef.current > 0 ? '#c084fc' : 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // D. CỔNG RẮN XUẤT HIỆN BI (Serpent Entrance Gate)
      if (track.length > 0) {
        const startPt = track[0];
        ctx.save();
        ctx.translate(startPt.x, startPt.y);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // E. MIỆNG ĐẦU LÂU VÀNG MA QUÁI (Aztec Golden Skull Pit of Doom)
      const endPoint = track[track.length - 1];
      if (endPoint) {
        const leadDist = ballsRef.current[0]?.distance || 0;
        const isDanger = leadDist > maxTrackDist * 0.8;

        ctx.save();
        ctx.translate(endPoint.x, endPoint.y);

        // Hào quang cảnh báo đỏ bùng nổ khi chuỗi bi tới gần
        if (isDanger) {
          const auraPulse = Math.sin(Date.now() / 100) * 8;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 48 + auraPulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bệ thờ đầu lâu bằng đá đen
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDanger ? '#ef4444' : '#b45309';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hộp sọ vàng chạm khắc Aztec (Golden Skull)
        const skullGrad = ctx.createLinearGradient(-20, -20, 20, 20);
        skullGrad.addColorStop(0, isDanger ? '#f87171' : '#fef08a');
        skullGrad.addColorStop(0.5, isDanger ? '#dc2626' : '#eab308');
        skullGrad.addColorStop(1, isDanger ? '#7f1d1d' : '#854d0e');
        ctx.fillStyle = skullGrad;
        ctx.beginPath();
        ctx.arc(0, -6, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hàm răng vàng
        ctx.fillRect(-12, 8, 24, 14);
        // Kẽ răng
        ctx.fillStyle = '#0f172a';
        for (let t = -8; t <= 8; t += 4) {
          ctx.fillRect(t, 10, 1.5, 10);
        }

        // Hốc mắt ma quỷ phát sáng
        ctx.fillStyle = isDanger ? '#fef08a' : '#05080f';
        ctx.beginPath();
        ctx.arc(-7, -7, 5, 0, Math.PI * 2);
        ctx.arc(7, -7, 5, 0, Math.PI * 2);
        ctx.fill();

        // Đồng tử đỏ rực nếu nguy hiểm
        if (isDanger) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-7, -7, 2.5, 0, Math.PI * 2);
          ctx.arc(7, -7, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Hốc mũi
        ctx.fillStyle = '#05080f';
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.lineTo(-3, 6);
        ctx.lineTo(3, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // F. ĐỒNG XU VÀNG CỔ ĐẠI (Ancient Aztec Coins)
      coinsRef.current.forEach((coin) => {
        if (!coin.isAlive) return;
        ctx.save();
        ctx.translate(coin.x, coin.y);

        const pulse = Math.sin(Date.now() / 180) * 2;
        // Hào quang tỏa sáng
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Đồng xu vàng kim
        const coinGrad = ctx.createLinearGradient(-14, -14, 14, 14);
        coinGrad.addColorStop(0, '#fef08a');
        coinGrad.addColorStop(0.5, '#eab308');
        coinGrad.addColorStop(1, '#a16207');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#713f12';
        ctx.font = 'black 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        ctx.restore();
      });

      // G. VẼ CHUỖI BI NGỌC THẦN (Luscious 3D Gem Marbles)
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.distance < 0 || b.distance > maxTrackDist) continue;

        const pt = getPointAtDistance(track, b.distance);
        const col = BALL_COLORS[b.color];

        ctx.save();
        ctx.translate(pt.x, pt.y);

        // Đổ bóng 3D viên bi xuống rãnh
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.arc(3, 4, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Khối cầu 3D ngọc sáng đa lớp (Multi-layer Radial Gradient)
        const gemGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, BALL_RADIUS);
        gemGrad.addColorStop(0, col.light);
        gemGrad.addColorStop(0.35, col.base);
        gemGrad.addColorStop(0.85, col.dark);
        gemGrad.addColorStop(1, '#05080f');
        ctx.fillStyle = gemGrad;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Ký hiệu cổ tự khắc chìm (Engraved Rune)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(col.rune, 0, 1);

        // Biểu tượng Ngọc Phép Thuật Đặc Biệt (Power-Up Emblems)
        if (b.power === 'bomb') {
          // Bùa nổ đỏ chớp sáng
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('💣', 0, 1);
        } else if (b.power === 'slow') {
          // Bùa làm chậm băng tuyết
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('❄', 0, 1);
        } else if (b.power === 'reverse') {
          // Bùa lùi bước tím
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('⏪', 0, 1);
        } else if (b.power === 'laser') {
          // Bùa tia ngắm vàng
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // H. TIA NGẮM ĐỊNH HƯỚNG LASER (Aim Assist Laser Line)
      if (aimAssist && !bulletRef.current) {
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(FROG_X, FROG_Y);
        const aimDist = 320;
        ctx.lineTo(
          FROG_X + Math.cos(frogAngleRef.current) * aimDist,
          FROG_Y + Math.sin(frogAngleRef.current) * aimDist
        );
        ctx.stroke();

        // Hồng tâm ngắm ở đầu tia
        const retX = FROG_X + Math.cos(frogAngleRef.current) * aimDist;
        const retY = FROG_Y + Math.sin(frogAngleRef.current) * aimDist;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(retX, retY, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // I. VIÊN BI ĐẠN ĐANG BAY (Flying Bullet)
      const bullet = bulletRef.current;
      if (bullet) {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        const col = BALL_COLORS[bullet.color];

        // Hào quang bao quanh đạn
        ctx.fillStyle = col.glow;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS + 4, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, BALL_RADIUS);
        grad.addColorStop(0, col.light);
        grad.addColorStop(0.4, col.base);
        grad.addColorStop(1, col.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(col.rune, 0, 1);
        ctx.restore();
      }

      // J. CHÚ CÓC ĐÁ CỔ ĐẠI MAYA (Sacred Aztec Stone Frog Idol)
      ctx.save();
      ctx.translate(FROG_X, FROG_Y);
      ctx.rotate(frogAngleRef.current);

      // Đổ bóng cóc đá 3D
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(4, 8, 44, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thân cóc đá màu ngọc bích rêu phong (Jade Aztec Stone)
      const frogBodyGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 42);
      frogBodyGrad.addColorStop(0, '#047857');
      frogBodyGrad.addColorStop(0.7, '#064e3b');
      frogBodyGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = frogBodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Hai chân trước co lại bám bệ đá
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(22, -26, 10, 7, Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(22, 26, 10, 7, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Vương miện / Phù điêu Mặt Trời Aztec trên đầu cóc
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(8, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(8, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Hai mắt lồi đá ngọc
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(26, -20, 12, 0, Math.PI * 2);
      ctx.arc(26, 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tròng mắt vàng rực hổ phách
      const eyeGrad = ctx.createRadialGradient(28, -20, 1, 28, -20, 6);
      eyeGrad.addColorStop(0, '#fef08a');
      eyeGrad.addColorStop(0.7, '#eab308');
      eyeGrad.addColorStop(1, '#713f12');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(28, -20, 6, 0, Math.PI * 2);
      ctx.arc(28, 20, 6, 0, Math.PI * 2);
      ctx.fill();

      // Con ngươi mắt mèo đen
      ctx.fillStyle = '#05080f';
      ctx.beginPath();
      ctx.ellipse(29, -20, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(29, 20, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // KHAY CHỨA VIÊN NGỌC DỰ PHÒNG TRÊN LƯNG CÓC (Next Ball Receptacle)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-16, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Viên ngọc dự phòng trên lưng (Next Ball)
      const nextCol = BALL_COLORS[nextBallRef.current];
      const nextGrad = ctx.createRadialGradient(-18, -2, 2, -16, 0, 11);
      nextGrad.addColorStop(0, nextCol.light);
      nextGrad.addColorStop(0.5, nextCol.base);
      nextGrad.addColorStop(1, nextCol.dark);
      ctx.fillStyle = nextGrad;
      ctx.beginPath();
      ctx.arc(-16, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // VIÊN NGỌC SẴN SÀNG BẮN TRONG MIỆNG CÓC (Active Ball in Mouth)
      const currCol = BALL_COLORS[currentBallRef.current];
      // Vòng hào quang miệng
      ctx.fillStyle = currCol.glow;
      ctx.beginPath();
      ctx.arc(32, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      const curGrad = ctx.createRadialGradient(30, -2, 2, 32, 0, 14);
      curGrad.addColorStop(0, currCol.light);
      curGrad.addColorStop(0.5, currCol.base);
      curGrad.addColorStop(1, currCol.dark);
      ctx.fillStyle = curGrad;
      ctx.beginPath();
      ctx.arc(32, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // K. HẠT PHÁO HOA & TEXT NỔI (Particles & Floating Popups)
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
        ctx.font = `black ${Math.round(18 * ft.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // ==========================================
      // L. SIDEBAR BẢNG ĐIỀU KHIỂN & HUYỀN THOẠI AZTEC (204px)
      // ==========================================
      ctx.fillStyle = '#080d1a';
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
      ctx.fillText('AZTEC ZUMA IDOL', SIDEBAR_X + SIDEBAR_WIDTH / 2, 26);

      // 1. THANH TÍCH LŨY NĂNG LƯỢNG ZUMA (Golden Zuma Tube)
      const zbX = SIDEBAR_X + 16;
      const zbY = 46;
      const zbW = SIDEBAR_WIDTH - 32;
      const zbH = 24;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(zbX, zbY, zbW, zbH, 8);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      const zRatio = Math.min(1, Math.max(0, zumaMeter / 100));
      const zumaGrad = ctx.createLinearGradient(zbX, zbY, zbX + zbW, zbY);
      zumaGrad.addColorStop(0, '#f59e0b');
      zumaGrad.addColorStop(0.5, '#eab308');
      zumaGrad.addColorStop(1, '#22c55e');

      ctx.fillStyle = isZumaReached ? '#22c55e' : zumaGrad;
      ctx.beginPath();
      ctx.roundRect(zbX, zbY, zbW * zRatio, zbH, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(isZumaReached ? '★ ZUMA COMPLETE ★' : `ZUMA: ${Math.round(zumaMeter)}%`, SIDEBAR_X + SIDEBAR_WIDTH / 2, zbY + 16);

      // 2. MẠNG SỐNG CÓC ĐÁ (3 Sacred Frog Idols)
      const livesY = 96;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('MẠNG CÓC THẦN', SIDEBAR_X + SIDEBAR_WIDTH / 2, livesY);

      for (let i = 0; i < 3; i++) {
        const lx = SIDEBAR_X + 52 + i * 36;
        const ly = livesY + 22;
        const hasLife = i < lives;

        ctx.fillStyle = hasLife ? '#059669' : '#1e293b';
        ctx.beginPath();
        ctx.arc(lx, ly, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hasLife ? '#34d399' : '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = hasLife ? '#fef08a' : '#64748b';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🐸', lx, ly + 3.5);
      }

      // 3. SỐ BI TRÊN ĐƯỜNG RAY & MÀN
      const ballBoxY = 155;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, ballBoxY, SIDEBAR_WIDTH - 32, 85, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('BI TRÊN ĐƯỜNG RAY', SIDEBAR_X + SIDEBAR_WIDTH / 2, ballBoxY + 22);

      const remainingBalls = balls.filter((b) => b.distance >= 0).length;
      ctx.fillStyle = remainingBalls <= 5 ? '#ef4444' : '#38bdf8';
      ctx.font = 'black 30px monospace';
      ctx.fillText(`${remainingBalls}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, ballBoxY + 58);

      // 4. COMBO MULTIPLIER & BÙA CHÚ
      ctx.fillStyle = chainCombo > 1 ? '#f59e0b' : '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(chainCombo > 1 ? `🔥 COMBO X${chainCombo}!` : `MÀN: ${stage} / 4`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 268);

      // 5. BẢNG ĐIỂM SỐ (Golden Score Vault)
      const scoreBoxY = 290;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, scoreBoxY, SIDEBAR_WIDTH - 32, 75, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ĐIỂM SỐ', SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 22);

      ctx.fillStyle = '#facc15';
      ctx.font = 'black 22px monospace';
      ctx.fillText(`${score.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 54);

      // Kỷ lục cao nhất
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 395);

      // Bùa chú kích hoạt
      if (slowTimerRef.current > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`❄ LÀM CHẬM: ${slowTimerRef.current.toFixed(1)}S`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 435);
      } else if (reverseTimerRef.current > 0) {
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`⏪ LÙI BƯỚC: ${reverseTimerRef.current.toFixed(1)}S`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 435);
      }

      // Hướng dẫn đổi bi nổi bật
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('[SPACE / CHUỘT PHẢI]', SIDEBAR_X + SIDEBAR_WIDTH / 2, 485);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('ĐỔI MÀU BI', SIDEBAR_X + SIDEBAR_WIDTH / 2, 505);

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
    gameMode, 
    initStage, 
    playPopSound, 
    playMagneticClack, 
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

        {/* Cột 2: Điểm số & Mạng & Số bi */}
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

          <div className="hidden sm:flex items-center gap-1 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm sm:text-base">{ballsOnTrackCount} BI</span>
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
