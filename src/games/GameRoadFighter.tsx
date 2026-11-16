import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Fuel, 
  Gauge, 
  ArrowLeft, 
  ArrowRight,
  Flame,
  ShieldAlert,
  Flag
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'endless';
type TrafficType = 'yellow' | 'blue' | 'truck' | 'bonus' | 'oil';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân khấu đường đua chính 756x540px
const ARENA_WIDTH = 756;
const ARENA_HEIGHT = 540;

// Sidebar thông số bên phải (204px)
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

// Chiều rộng mặt đường chính giữa (450px)
const ROAD_LEFT = 153;
const ROAD_WIDTH = 450;
const ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH;

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

interface SkidMark {
  x: number;
  y: number;
  width: number;
  alpha: number;
}

interface TrafficCar {
  id: number;
  type: TrafficType;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lane: number;
  targetLane: number;
  laneChangeTimer: number;
  isAlive: boolean;
  color: string;
}

interface SceneryObject {
  id: number;
  x: number;
  y: number;
  type: 'tree' | 'bush' | 'light' | 'rock' | 'sign';
  side: 'left' | 'right';
  scale: number;
}

interface StageTheme {
  name: string;
  groundLeft: string;
  groundRight: string;
  roadColor: string;
  curbColor1: string;
  curbColor2: string;
  sceneryType: 'forest' | 'coastal' | 'canyon' | 'city';
}

const STAGE_THEMES: StageTheme[] = [
  {
    name: 'Đường Cao Tốc Rừng Ven Biển',
    groundLeft: '#1e3a1e',
    groundRight: '#0c2e3a',
    roadColor: '#1e293b',
    curbColor1: '#ef4444',
    curbColor2: '#f8fafc',
    sceneryType: 'forest',
  },
  {
    name: 'Cầu Vượt Biển Xanh Đại Dương',
    groundLeft: '#0284c7',
    groundRight: '#0284c7',
    roadColor: '#334155',
    curbColor1: '#0ea5e9',
    curbColor2: '#ffffff',
    sceneryType: 'coastal',
  },
  {
    name: 'Đèo Hẻm Núi Sa Mạc',
    groundLeft: '#78350f',
    groundRight: '#7c2d12',
    roadColor: '#262626',
    curbColor1: '#f59e0b',
    curbColor2: '#ffffff',
    sceneryType: 'canyon',
  },
  {
    name: 'Cao Tốc Thành Phố Đêm Neon',
    groundLeft: '#090d16',
    groundRight: '#090d16',
    roadColor: '#0f172a',
    curbColor1: '#ec4899',
    curbColor2: '#06b6d4',
    sceneryType: 'city',
  },
];

export const GameRoadFighter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cấu hình game
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [initialFuel, setInitialFuel] = useState<number>(100);

  // Trạng thái màn chơi
  const [stage, setStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [fuel, setFuel] = useState<number>(100);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(3000);
  const [carsPassed, setCarsPassed] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References cho game loop và physics
  const lastTimeRef = useRef<number>(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Physics người chơi
  const playerRef = useRef({
    x: ROAD_LEFT + ROAD_WIDTH / 2 - 17,
    y: ARENA_HEIGHT - 120,
    width: 34,
    height: 64,
    vx: 0,
    speed: 0, // 0 to 400 km/h
    targetSpeed: 0,
    gear: 'LOW' as 'LOW' | 'HIGH' | 'TURBO',
    fuel: 100,
    maxFuel: 100,
    distanceTraveled: 0,
    stageDistance: 3000,
    isSkidding: false,
    skidAngle: 0,
    skidDir: 1, // 1: right, -1: left
    skidRecoverTimer: 0,
    isInvulnerable: false,
    invulnerableTimer: 0,
    crashTimer: 0,
    isCrashed: false,
  });

  const trafficCarsRef = useRef<TrafficCar[]>([]);
  const sceneryObjectsRef = useRef<SceneryObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const skidMarksRef = useRef<SkidMark[]>([]);
  const roadOffsetRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  // Load saved highscore and settings
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem('acegames_road_fighter_highscore');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedSettings = localStorage.getItem('ace_game_settings_road-fighter');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.gameMode) setGameMode(parsed.gameMode as GameMode);
        if (parsed.initialFuel) setInitialFuel(parsed.initialFuel);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Web Audio procedural sound synth
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(45, ctx.currentTime);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          engineOscRef.current = osc;
          engineGainRef.current = gain;
        } catch {
          // ignore
        }
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const updateEngineSound = useCallback((speed: number, isSkidding: boolean, isCrashed: boolean) => {
    if (!audioCtxRef.current || !engineOscRef.current || !engineGainRef.current) return;
    const ctx = audioCtxRef.current;

    if (isCrashed || isPaused || isGameOver || isVictory || speed <= 5) {
      engineGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      return;
    }

    // Tần số động cơ tăng theo tốc độ từ 55Hz đến 380Hz
    const freq = 55 + (speed / 400) * 320 + (isSkidding ? Math.sin(Date.now() / 20) * 40 : 0);
    const vol = Math.min(0.08, 0.02 + (speed / 400) * 0.06);

    engineOscRef.current.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
    engineGainRef.current.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
  }, [isPaused, isGameOver, isVictory]);

  const playCrashSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }, [initAudio]);

  const playSkidSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }, [initAudio]);

  const playFuelPickupSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.15);
    });
  }, [initAudio]);

  const playWarningBeep = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }, [initAudio]);

  // Khởi tạo cảnh quan cây cối ven đường
  const initScenery = useCallback(() => {
    const list: SceneryObject[] = [];
    for (let i = 0; i < 28; i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const x = side === 'left' ? 20 + Math.random() * 95 : ROAD_RIGHT + 25 + Math.random() * 85;
      const y = -100 + i * 28;
      list.push({
        id: i,
        x,
        y,
        type: i % 4 === 0 ? 'light' : i % 3 === 0 ? 'bush' : 'tree',
        side,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    sceneryObjectsRef.current = list;
  }, []);

  // Khởi động lại toàn bộ game
  const resetGame = useCallback(() => {
    const startFuel = initialFuel;
    playerRef.current = {
      x: ROAD_LEFT + ROAD_WIDTH / 2 - 17,
      y: ARENA_HEIGHT - 120,
      width: 34,
      height: 64,
      vx: 0,
      speed: 0,
      targetSpeed: 0,
      gear: 'LOW',
      fuel: startFuel,
      maxFuel: startFuel,
      distanceTraveled: 0,
      stageDistance: gameMode === 'speed' ? 3500 : 3000,
      isSkidding: false,
      skidAngle: 0,
      skidDir: 1,
      skidRecoverTimer: 0,
      isInvulnerable: false,
      invulnerableTimer: 0,
      crashTimer: 0,
      isCrashed: false,
    };

    trafficCarsRef.current = [];
    particlesRef.current = [];
    skidMarksRef.current = [];
    roadOffsetRef.current = 0;

    setFuel(startFuel);
    setSpeedKmh(0);
    setDistanceRemaining(playerRef.current.stageDistance);
    setCarsPassed(0);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    initScenery();
  }, [initialFuel, gameMode, initScenery]);

  // Sang màn kế tiếp
  const nextStage = useCallback(() => {
    const nextSt = (stage % STAGE_THEMES.length) + 1;
    setStage(nextSt);
    setIsVictory(false);

    // Thưởng nhiên liệu khi hoàn thành màn
    const newFuel = Math.min(playerRef.current.maxFuel, playerRef.current.fuel + 40);
    playerRef.current.fuel = newFuel;
    playerRef.current.distanceTraveled = 0;
    playerRef.current.stageDistance = 3000 + nextSt * 500;
    playerRef.current.isCrashed = false;
    playerRef.current.speed = 100;
    playerRef.current.x = ROAD_LEFT + ROAD_WIDTH / 2 - 17;

    trafficCarsRef.current = [];
    particlesRef.current = [];
    skidMarksRef.current = [];

    setFuel(newFuel);
    setDistanceRemaining(playerRef.current.stageDistance);
    initScenery();
  }, [stage, initScenery]);

  // Sinh xe lưu thông NPC
  const spawnTraffic = useCallback(() => {
    if (trafficCarsRef.current.length >= 8) return;

    // Chọn làn ngẫu nhiên (1 trong 4 làn)
    const laneWidth = ROAD_WIDTH / 4;
    const lane = Math.floor(Math.random() * 4);
    const laneX = ROAD_LEFT + lane * laneWidth + (laneWidth - 34) / 2;

    // Kiểm tra xem vị trí xuất hiện (y: -100 đến -150) có bị trùng xe nào không
    const isCrowded = trafficCarsRef.current.some(
      (c) => Math.abs(c.x - laneX) < 40 && c.y < 50
    );
    if (isCrowded) return;

    // Tỷ lệ loại xe
    const rand = Math.random();
    let type: TrafficType = 'yellow';
    let width = 34;
    let height = 62;
    let speed = 120 + Math.random() * 40;
    let color = '#facc15'; // Xe vàng

    if (rand < 0.35) {
      type = 'yellow';
      color = '#eab308';
      speed = 130 + Math.random() * 30;
    } else if (rand < 0.65) {
      type = 'blue';
      color = '#38bdf8';
      speed = 180 + Math.random() * 40; // Xe xanh chuyển làn
    } else if (rand < 0.82) {
      type = 'truck';
      width = 42;
      height = 98;
      color = '#ef4444'; // Xe tải khổng lồ
      speed = 90 + Math.random() * 20;
    } else if (rand < 0.93) {
      type = 'oil';
      width = 46;
      height = 30;
      color = '#18181b'; // Vũng dầu loang
      speed = 0;
    } else {
      type = 'bonus';
      width = 32;
      height = 58;
      color = '#ec4899'; // Xe thưởng nạp xăng
      speed = 150 + Math.random() * 30;
    }

    trafficCarsRef.current.push({
      id: Date.now() + Math.random(),
      type,
      x: type === 'oil' ? laneX - 6 : laneX,
      y: -120,
      width,
      height,
      speed,
      lane,
      targetLane: lane,
      laneChangeTimer: 0,
      isAlive: true,
      color,
    });
  }, []);

  // Kích hoạt văng đuôi / mất lái (Skidding)
  const triggerSkid = useCallback((direction: number) => {
    const p = playerRef.current;
    if (p.isSkidding || p.isCrashed) return;
    p.isSkidding = true;
    p.skidDir = direction;
    p.skidAngle = direction * 15;
    p.skidRecoverTimer = 1.4; // 1.4s để counter-steer
    playSkidSound();
  }, [playSkidSound]);

  // Vụ nổ đâm xe (Crash)
  const triggerCrash = useCallback(() => {
    const p = playerRef.current;
    if (p.isCrashed || p.isInvulnerable) return;

    p.isCrashed = true;
    p.speed = 0;
    p.vx = 0;
    p.isSkidding = false;
    p.crashTimer = 1.6; // Đứng hình nổ 1.6s
    p.fuel = Math.max(0, p.fuel - 16); // Mất xăng khi nổ
    setFuel(Math.round(p.fuel));

    // Hiệu ứng nổ lửa & khói
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particlesRef.current.push({
        x: p.x + p.width / 2,
        y: p.y + p.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color: ['#ef4444', '#f97316', '#facc15', '#ffffff', '#71717a'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 25,
      });
    }

    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 350);
    playCrashSound();
  }, [playCrashSound]);

  // Lắng nghe bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      // Nút P tạm dừng
      if (e.code === 'KeyP') {
        setIsPaused((p) => !p);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initAudio]);

  // Main Game Loop (Vòng lặp vật lý và render 60 FPS)
  useEffect(() => {
    initScenery();
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

      // 1. CẬP NHẬT VẬT LÝ NẾU KHÔNG TẠM DỪNG / KẾT THÚC
      if (!isPaused && !isGameOver && !isVictory) {
        const p = playerRef.current;
        const keys = keysPressedRef.current;

        // Xử lý sau khi bị nổ đâm xe
        if (p.isCrashed) {
          p.crashTimer -= dt;
          if (p.crashTimer <= 0) {
            p.isCrashed = false;
            p.isInvulnerable = true;
            p.invulnerableTimer = 2.0; // 2 giây nhấp nháy bất tử
            p.x = ROAD_LEFT + ROAD_WIDTH / 2 - 17;
            p.speed = 0;

            if (p.fuel <= 0) {
              setIsGameOver(true);
              playCrashSound();
            }
          }
        } else {
          // Bất tử nhấp nháy đếm ngược
          if (p.isInvulnerable) {
            p.invulnerableTimer -= dt;
            if (p.invulnerableTimer <= 0) {
              p.isInvulnerable = false;
            }
          }

          // Điều khiển TĂNG TỐC & SỐ XE (Gear / Acceleration)
          const isAcceleratingLow = keys['ArrowUp'] || keys['KeyW'];
          const isAcceleratingHigh = keys['Space'] || keys['ShiftLeft'] || keys['KeyJ'];
          const isBraking = keys['ArrowDown'] || keys['KeyS'];

          const maxLowSpeed = 196;
          const maxHighSpeed = gameMode === 'speed' ? 440 : 400;

          if (isAcceleratingHigh) {
            p.gear = 'TURBO';
            p.targetSpeed = maxHighSpeed;
            // Tăng tốc mãnh liệt
            p.speed = Math.min(maxHighSpeed, p.speed + 160 * dt);
          } else if (isAcceleratingLow) {
            p.gear = 'LOW';
            p.targetSpeed = maxLowSpeed;
            if (p.speed < maxLowSpeed) {
              p.speed = Math.min(maxLowSpeed, p.speed + 130 * dt);
            } else {
              // Thả ga cao về số thấp
              p.speed = Math.max(maxLowSpeed, p.speed - 60 * dt);
            }
          } else if (isBraking) {
            p.gear = 'LOW';
            p.speed = Math.max(0, p.speed - 260 * dt);
          } else {
            p.gear = 'LOW';
            // Lực ma sát tự nhiên hãm xe
            p.speed = Math.max(0, p.speed - 50 * dt);
          }

          // Tiêu thụ nhiên liệu theo thời gian và tốc độ
          if (p.speed > 0) {
            const fuelDrainRate = 1.3 + (p.speed / 400) * 0.8;
            p.fuel = Math.max(0, p.fuel - fuelDrainRate * dt);
            setFuel(Math.round(p.fuel));

            if (p.fuel <= 0 && p.speed <= 5) {
              setIsGameOver(true);
              playCrashSound();
            }
          }

          // Tính quãng đường chạy được
          const metersThisFrame = (p.speed * 1000 / 3600) * dt;
          p.distanceTraveled += metersThisFrame;
          const remaining = Math.max(0, p.stageDistance - p.distanceTraveled);
          setDistanceRemaining(Math.round(remaining));
          setSpeedKmh(Math.round(p.speed));

          // Đạt mốc đích chặng đua (FINISH GOAL)
          if (remaining <= 0) {
            setIsVictory(true);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            soundManager.playVictory();
          }

          // Điều khiển LÁI TRÁI / PHẢI
          const isSteerLeft = keys['ArrowLeft'] || keys['KeyA'];
          const isSteerRight = keys['ArrowRight'] || keys['KeyD'];
          const steerSpeed = 260 + (p.speed / 400) * 80;

          if (p.isSkidding) {
            // Xử lý cơ chế mất lái xoay đuôi (Fishtail / Counter-steer)
            p.skidRecoverTimer -= dt;
            p.x += p.skidDir * 180 * dt;
            p.skidAngle = Math.sin(Date.now() / 60) * 22 * p.skidDir;

            // Thêm vệt bánh xe trượt trên đường
            if (Math.random() < 0.6) {
              skidMarksRef.current.push({
                x: p.x + p.width / 2,
                y: p.y + p.height - 8,
                width: 24,
                alpha: 0.8,
              });
            }

            // Người chơi phản xạ bẻ lái ngược chiều để lấy lại thăng bằng
            if ((p.skidDir > 0 && isSteerLeft) || (p.skidDir < 0 && isSteerRight)) {
              p.skidRecoverTimer -= dt * 1.5;
            }

            if (p.skidRecoverTimer <= 0) {
              p.isSkidding = false;
              p.skidAngle = 0;
            }
          } else {
            if (isSteerLeft) {
              p.x -= steerSpeed * dt;
            }
            if (isSteerRight) {
              p.x += steerSpeed * dt;
            }
          }

          // Kiểm tra va chạm dải phân cách / lề đường
          if (p.x < ROAD_LEFT || p.x + p.width > ROAD_RIGHT) {
            if (p.isSkidding || p.speed > 160) {
              triggerCrash();
            } else {
              // Bị cản chậm lại nếu chỉ lấn nhẹ lề cỏ
              p.speed = Math.max(0, p.speed - 150 * dt);
              p.x = Math.max(ROAD_LEFT - 4, Math.min(ROAD_RIGHT - p.width + 4, p.x));
            }
          }

          // Cuộn mặt đường và cảnh quan
          const scrollSpeed = p.speed * 2.2 * dt;
          roadOffsetRef.current = (roadOffsetRef.current + scrollSpeed) % 80;

          sceneryObjectsRef.current.forEach((obj) => {
            obj.y += scrollSpeed;
            if (obj.y > ARENA_HEIGHT + 60) {
              obj.y = -80;
              obj.x = obj.side === 'left' ? 20 + Math.random() * 95 : ROAD_RIGHT + 25 + Math.random() * 85;
            }
          });

          // Sinh xe giao thông định kỳ
          if (Math.random() < 0.045 && p.speed > 40) {
            spawnTraffic();
          }

          // Cập nhật các xe NPC giao thông
          trafficCarsRef.current.forEach((c) => {
            // Tốc độ tương đối so với người chơi
            const relativeSpeed = (p.speed - c.speed) * 2.2 * dt;
            c.y += relativeSpeed;

            // Xe xanh đổi làn khi người chơi đến gần
            if (c.type === 'blue' && Math.abs(c.y - p.y) < 220 && c.y < p.y) {
              c.laneChangeTimer += dt;
              if (c.laneChangeTimer > 0.4 && c.targetLane === c.lane) {
                // Đổi sang làn bên cạnh
                c.targetLane = c.lane === 0 ? 1 : c.lane === 3 ? 2 : Math.random() < 0.5 ? c.lane - 1 : c.lane + 1;
              }
            }

            // Di chuyển chuyển làn mượt mà
            if (c.targetLane !== c.lane) {
              const laneWidth = ROAD_WIDTH / 4;
              const targetX = ROAD_LEFT + c.targetLane * laneWidth + (laneWidth - c.width) / 2;
              const diff = targetX - c.x;
              c.x += Math.sign(diff) * Math.min(Math.abs(diff), 80 * dt);
              if (Math.abs(c.x - targetX) < 2) {
                c.lane = c.targetLane;
              }
            }

            // Đếm số xe đã vượt qua
            if (c.isAlive && c.y > p.y + p.height && c.y - relativeSpeed <= p.y + p.height) {
              setCarsPassed((count) => count + 1);
              setScore((s) => s + 50);
            }

            // Kiểm tra va chạm giữa người chơi và xe NPC
            if (c.isAlive && !p.isCrashed && !p.isInvulnerable) {
              const hitBoxPadX = 6;
              const hitBoxPadY = 8;
              const isOverlap = 
                p.x + hitBoxPadX < c.x + c.width - hitBoxPadX &&
                p.x + p.width - hitBoxPadX > c.x + hitBoxPadX &&
                p.y + hitBoxPadY < c.y + c.height - hitBoxPadY &&
                p.y + p.height - hitBoxPadY > c.y + hitBoxPadY;

              if (isOverlap) {
                if (c.type === 'bonus') {
                  // Nhặt xe nạp xăng
                  c.isAlive = false;
                  p.fuel = Math.min(p.maxFuel, p.fuel + 24);
                  setFuel(Math.round(p.fuel));
                  setScore((s) => s + 1000);
                  playFuelPickupSound();
                } else if (c.type === 'oil') {
                  // Cán vũng dầu loang -> trượt xoay đuôi
                  c.isAlive = false;
                  triggerSkid(Math.random() < 0.5 ? -1 : 1);
                } else if (c.type === 'truck') {
                  // Đâm trực diện xe tải lớn -> nổ ngay lập tức
                  triggerCrash();
                } else {
                  // Quẹt xe du lịch vàng hoặc xanh -> lạng đuôi
                  const collisionDir = p.x < c.x ? -1 : 1;
                  p.x += collisionDir * 18;
                  triggerSkid(collisionDir);
                }
              }
            }
          });

          // Dọn dẹp xe ra khỏi màn hình
          trafficCarsRef.current = trafficCarsRef.current.filter((c) => c.y < ARENA_HEIGHT + 140 && c.y > -250 && c.isAlive);

          // Cập nhật âm thanh động cơ
          updateEngineSound(p.speed, p.isSkidding, p.isCrashed);
        }

        // Cập nhật vệt trượt và bụi hạt
        skidMarksRef.current.forEach((sm) => {
          sm.alpha -= dt * 0.35;
        });
        skidMarksRef.current = skidMarksRef.current.filter((sm) => sm.alpha > 0);

        particlesRef.current.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life += 1;
          pt.alpha = 1 - pt.life / pt.maxLife;
        });
        particlesRef.current = particlesRef.current.filter((pt) => pt.life < pt.maxLife);
      }

      // 2. RENDER GRAPHICS LÊN CANVAS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const currentTheme = STAGE_THEMES[(stage - 1) % STAGE_THEMES.length];

      // A. Vẽ hai bên lề đường (Ground / Scenery)
      ctx.fillStyle = currentTheme.groundLeft;
      ctx.fillRect(0, 0, ROAD_LEFT, ARENA_HEIGHT);

      ctx.fillStyle = currentTheme.groundRight;
      ctx.fillRect(ROAD_RIGHT, 0, ARENA_WIDTH - ROAD_RIGHT, ARENA_HEIGHT);

      // Hiệu ứng sóng biển dập dềnh nếu là màn cầu vượt biển
      if (currentTheme.sceneryType === 'coastal') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 8; i++) {
          const waveY = (roadOffsetRef.current * 4 + i * 75) % ARENA_HEIGHT;
          ctx.fillRect(15, waveY, 70, 3);
          ctx.fillRect(ROAD_RIGHT + 35, (waveY + 30) % ARENA_HEIGHT, 85, 3);
        }
      }

      // B. Vẽ vật thể cảnh quan hai bên đường
      sceneryObjectsRef.current.forEach((obj) => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.scale(obj.scale, obj.scale);

        if (obj.type === 'tree') {
          // Cây thông xanh
          ctx.fillStyle = '#451a03';
          ctx.fillRect(-3, 0, 6, 16);
          ctx.beginPath();
          ctx.moveTo(0, -22);
          ctx.lineTo(14, 4);
          ctx.lineTo(-14, 4);
          ctx.closePath();
          ctx.fillStyle = '#15803d';
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, -32);
          ctx.lineTo(10, -10);
          ctx.lineTo(-10, -10);
          ctx.closePath();
          ctx.fillStyle = '#16a34a';
          ctx.fill();
        } else if (obj.type === 'bush') {
          // Bụi cỏ hoa
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#059669';
          ctx.fill();
        } else if (obj.type === 'light') {
          // Cột đèn đường
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-2, -18, 4, 30);
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        }
        ctx.restore();
      });

      // C. Vẽ dải phân cách sỏi & viền kẻ sọc đỏ trắng (Rumble Strips)
      const stripHeight = 36;
      const numStrips = Math.ceil(ARENA_HEIGHT / stripHeight) + 2;
      const stripOffset = roadOffsetRef.current % (stripHeight * 2);

      for (let i = -1; i < numStrips; i++) {
        const y = i * stripHeight - stripOffset;
        const isColor1 = (Math.floor((y + stripOffset) / stripHeight) % 2 === 0);
        ctx.fillStyle = isColor1 ? currentTheme.curbColor1 : currentTheme.curbColor2;

        // Viền trái
        ctx.fillRect(ROAD_LEFT - 14, y, 14, stripHeight);
        // Viền phải
        ctx.fillRect(ROAD_RIGHT, y, 14, stripHeight);
      }

      // D. Mặt đường nhựa đen Asphalt
      ctx.fillStyle = currentTheme.roadColor;
      ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, ARENA_HEIGHT);

      // Vạch kẻ 4 làn đường (3 đường đứt khúc màu trắng/vàng)
      const laneWidth = ROAD_WIDTH / 4;
      const dashLength = 40;
      const dashGap = 35;
      const totalDash = dashLength + dashGap;
      const dashOffset = roadOffsetRef.current % totalDash;

      ctx.fillStyle = '#f8fafc';
      for (let l = 1; l <= 3; l++) {
        const laneLineX = ROAD_LEFT + l * laneWidth;
        for (let y = -totalDash; y < ARENA_HEIGHT + totalDash; y += totalDash) {
          ctx.fillRect(laneLineX - 2, y + dashOffset, 4, dashLength);
        }
      }

      // Đường kẻ vạch đích xuất hiện khi còn dưới 300 mét
      const p = playerRef.current;
      const rem = Math.max(0, p.stageDistance - p.distanceTraveled);
      if (rem < 280) {
        const finishY = ARENA_HEIGHT - 120 - (rem * 2.2);
        if (finishY > -80 && finishY < ARENA_HEIGHT + 40) {
          // Vạch ca rô trắng đen chuẩn đích đua
          const checkSize = 16;
          for (let cx = ROAD_LEFT; cx < ROAD_RIGHT; cx += checkSize) {
            for (let cy = 0; cy < 2; cy++) {
              const isBlack = (Math.floor((cx - ROAD_LEFT) / checkSize) + cy) % 2 === 0;
              ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
              ctx.fillRect(cx, finishY + cy * checkSize, checkSize, checkSize);
            }
          }
        }
      }

      // E. Vẽ các vệt bánh xe trượt (Skid Marks)
      skidMarksRef.current.forEach((sm) => {
        ctx.fillStyle = `rgba(15, 23, 42, ${sm.alpha * 0.7})`;
        ctx.fillRect(sm.x - sm.width / 2, sm.y, sm.width, 10);
      });

      // F. Vẽ các phương tiện giao thông (Traffic Cars)
      trafficCarsRef.current.forEach((c) => {
        if (!c.isAlive) return;

        ctx.save();
        ctx.translate(c.x, c.y);

        if (c.type === 'oil') {
          // Vũng dầu loang đen bóng
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (c.type === 'truck') {
          // Xe tải lớn 18 bánh
          // Thân rơ-moóc chở hàng
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(0, 0, c.width, c.height - 24);
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, c.width, c.height - 24);

          // Đầu kéo xe tải
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(2, c.height - 24, c.width - 4, 24);
          // Kính chắn gió trước
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(6, c.height - 10, c.width - 12, 6);
          // Đèn pha đỏ sau
          ctx.fillStyle = '#f87171';
          ctx.fillRect(3, 2, 6, 4);
          ctx.fillRect(c.width - 9, 2, 6, 4);
        } else if (c.type === 'bonus') {
          // Xe nạp xăng màu hồng neon rực rỡ
          ctx.shadowColor = '#ec4899';
          ctx.shadowBlur = 12;

          ctx.fillStyle = '#db2777';
          ctx.beginPath();
          ctx.roundRect(0, 0, c.width, c.height, 8);
          ctx.fill();

          // Biểu tượng trái tim nạp xăng giữa xe
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FUEL', c.width / 2, c.height / 2 + 4);
        } else {
          // Xe du lịch sedan (Vàng hoặc Xanh)
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.roundRect(0, 0, c.width, c.height, 6);
          ctx.fill();

          // Mui xe & kính xe
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(4, 14, c.width - 8, 22);
          // Kính trước & sau
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(6, 16, c.width - 12, 6);
          ctx.fillRect(6, 28, c.width - 12, 5);

          // Đèn hậu
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(2, 2, 6, 3);
          ctx.fillRect(c.width - 8, 2, 6, 3);

          // Đèn xi nhan nhấp nháy nếu đang chuyển làn
          if (c.type === 'blue' && c.targetLane !== c.lane && Math.floor(Date.now() / 150) % 2 === 0) {
            const isLeft = c.targetLane < c.lane;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(isLeft ? 1 : c.width - 5, 2, 4, 4);
          }
        }

        ctx.restore();
      });

      // G. Vẽ XE NGƯỜI CHƠI (Player Red Sports Car)
      if (!p.isCrashed) {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        if (p.isSkidding) {
          ctx.rotate((p.skidAngle * Math.PI) / 180);
        }

        // Nhấp nháy khi đang bất tử
        if (p.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
          ctx.globalAlpha = 0.35;
        }

        // Đổ bóng xe
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(-p.width / 2 + 2, -p.height / 2 + 4, p.width, p.height, 8);
        ctx.fill();

        // Thân xe thể thao màu đỏ bóng bẩy
        const carGrad = ctx.createLinearGradient(-p.width / 2, 0, p.width / 2, 0);
        carGrad.addColorStop(0, '#dc2626');
        carGrad.addColorStop(0.5, '#ef4444');
        carGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = carGrad;
        ctx.beginPath();
        ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 8);
        ctx.fill();

        // Cánh lướt gió phía sau xe (Rear Spoiler)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-p.width / 2 + 2, p.height / 2 - 8, p.width - 4, 5);

        // Kính chắn gió mui trước màu xanh bóng
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-p.width / 2 + 5, -p.height / 2 + 12, p.width - 10, 14);

        // Mui xe màu đen carbon
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-p.width / 2 + 6, -p.height / 2 + 26, p.width - 12, 12);

        // Kính chắn gió sau
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(-p.width / 2 + 5, -p.height / 2 + 38, p.width - 10, 8);

        // Đèn pha trước màu vàng neon sáng
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-p.width / 2 + 4, -p.height / 2 + 2, 6, 3);
        ctx.fillRect(p.width / 2 - 10, -p.height / 2 + 2, 6, 3);

        // Ngọn lửa Nitro rực sáng phía ống xả khi chạy số TURBO
        if (p.gear === 'TURBO' && p.speed > 200) {
          ctx.save();
          ctx.fillStyle = '#f97316';
          const flameH = 14 + Math.random() * 12;
          ctx.beginPath();
          ctx.moveTo(-8, p.height / 2);
          ctx.lineTo(-4, p.height / 2 + flameH);
          ctx.lineTo(0, p.height / 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, p.height / 2);
          ctx.lineTo(4, p.height / 2 + flameH);
          ctx.lineTo(8, p.height / 2);
          ctx.fill();

          // Lõi lửa xanh
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-6, p.height / 2, 4, flameH * 0.5);
          ctx.fillRect(2, p.height / 2, 4, flameH * 0.5);
          ctx.restore();
        }

        ctx.restore();
      }

      // H. Hạt nổ và mảnh vỡ khi crash
      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // I. SIDEBAR BẢNG ĐIỀU KHIỂN & TELEMETRY (204px)
      // ==========================================
      ctx.fillStyle = '#090d16';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      // Đường viền ngăn cách sàn đấu
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X, 0);
      ctx.lineTo(SIDEBAR_X, CANVAS_HEIGHT);
      ctx.stroke();

      // Tiêu đề đồng hồ
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ROAD TELEMETRY', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // 1. ĐỒNG HỒ TỐC ĐỘ (Speedometer)
      const currentSpeed = Math.round(p.speed);
      ctx.fillStyle = currentSpeed > 320 ? '#ef4444' : currentSpeed > 200 ? '#f59e0b' : '#38bdf8';
      ctx.font = 'black 34px monospace';
      ctx.fillText(`${currentSpeed}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 68);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('KM / H', SIDEBAR_X + SIDEBAR_WIDTH / 2, 84);

      // Badge Gear
      ctx.fillStyle = p.gear === 'TURBO' ? '#ef4444' : '#0284c7';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 45, 94, SIDEBAR_WIDTH - 90, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 11px sans-serif';
      ctx.fillText(`GEAR: ${p.gear}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 109);

      // 2. THANH TIẾN TRÌNH CHẶNG ĐUA (Course Progress Column)
      const progBarX = SIDEBAR_X + 28;
      const progBarY = 135;
      const progBarW = 14;
      const progBarH = 220;

      // Nền thanh tiến trình
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(progBarX, progBarY, progBarW, progBarH, 7);
      ctx.fill();

      // Điểm mốc G (Goal) ở đỉnh
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('G [ĐÍCH]', progBarX + 24, progBarY + 12);

      // Điểm mốc S (Start) ở đáy
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('S [XUẤT PHÁT]', progBarX + 24, progBarY + progBarH);

      // Khoảng cách còn lại
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`CÒN: ${Math.round(rem)}M`, progBarX + 24, progBarY + progBarH / 2);

      // Biểu tượng mini xe đỏ di chuyển dọc theo chặng đua
      const progressRatio = Math.min(1, Math.max(0, p.distanceTraveled / p.stageDistance));
      const miniCarY = progBarY + progBarH - (progressRatio * progBarH);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(progBarX - 4, miniCarY - 6, progBarW + 8, 12, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(progBarX - 4, miniCarY - 6, progBarW + 8, 12);

      // 3. ĐỒNG HỒ NHIÊN LIỆU (Fuel Gauge)
      const fuelBoxY = 380;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, fuelBoxY, SIDEBAR_WIDTH - 32, 70, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('NHIÊN LIỆU (FUEL)', SIDEBAR_X + 26, fuelBoxY + 20);

      const fuelRatio = Math.max(0, Math.min(1, p.fuel / p.maxFuel));
      const fuelBarW = SIDEBAR_WIDTH - 52;
      ctx.fillStyle = '#334155';
      ctx.fillRect(SIDEBAR_X + 26, fuelBoxY + 28, fuelBarW, 14);

      // Màu thanh xăng: Xanh lá -> Vàng -> Đỏ cảnh báo
      const isLowFuel = p.fuel <= 20;
      ctx.fillStyle = isLowFuel ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#7f1d1d') : fuelRatio > 0.4 ? '#22c55e' : '#f59e0b';
      ctx.fillRect(SIDEBAR_X + 26, fuelBoxY + 28, fuelBarW * fuelRatio, 14);

      ctx.fillStyle = isLowFuel ? '#ef4444' : '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${Math.round(p.fuel)}%`, SIDEBAR_X + 26, fuelBoxY + 58);

      // 4. MÀN & SỐ XE VƯỢT
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`MÀN: ${stage} • ĐÃ VƯỢT: ${carsPassed}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 475);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`ĐIỂM: ${score.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 505);

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
    carsPassed, 
    gameMode, 
    initScenery, 
    spawnTraffic, 
    triggerCrash, 
    triggerSkid, 
    playFuelPickupSound, 
    updateEngineSound
  ]);

  // Lưu điểm cao kỷ lục
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('acegames_road_fighter_highscore', score.toString());
      } catch {
        // ignore
      }
    }
  }, [score, highScore]);

  // Cảnh báo âm thanh khi sắp hết xăng
  useEffect(() => {
    if (fuel > 0 && fuel <= 20 && !isGameOver && !isVictory && !isPaused) {
      const timer = setInterval(() => {
        playWarningBeep();
      }, 1400);
      return () => clearInterval(timer);
    }
  }, [fuel, isGameOver, isVictory, isPaused, playWarningBeep]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* 3-Column Top HUD Bar */}
      <div className="w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-2 mb-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm">
        {/* Cột 1: Thông tin chế độ */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 font-bold border border-red-500/30">
            <Flame className="w-4 h-4 text-red-400" />
            <span className="capitalize">
              {gameMode === 'classic' ? 'Cổ Điển' : gameMode === 'speed' ? 'Tốc Độ' : 'Vô Tận'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 text-gray-300 font-medium border border-white/5">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Màn {stage} • Còn {distanceRemaining.toLocaleString()}m</span>
          </div>
        </div>

        {/* Cột 2: Điểm số & Tốc độ & Nhiên liệu */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-gray-400 text-xs hidden sm:inline">ĐIỂM:</span>
            <span className="text-sm sm:text-base">{score.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-cyan-400">
            <Gauge className="w-4 h-4" />
            <span className="text-sm sm:text-base">{speedKmh} KM/H</span>
          </div>

          <div className={`flex items-center gap-1 ${fuel <= 20 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            <Fuel className="w-4 h-4" />
            <span className="text-sm sm:text-base">{fuel}%</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-1.5">
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
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-150px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-red-500/40 shadow-[0_0_60px_rgba(239,68,68,0.25)] touch-none flex-1 min-h-0 transition-transform duration-100 ${
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
              className="w-14 h-14 bg-slate-800/80 active:bg-red-500 rounded-2xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowRight'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowRight'] = false; }}
              className="w-14 h-14 bg-slate-800/80 active:bg-red-500 rounded-2xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Cụm Phanh và Tăng Tốc Turbo */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowDown'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowDown'] = false; }}
              className="w-13 h-13 rounded-2xl bg-slate-800/80 active:bg-amber-500 border border-white/20 text-white font-bold text-xs flex flex-col items-center justify-center"
            >
              <ShieldAlert className="w-5 h-5 mb-0.5 text-amber-400" />
              <span>PHANH</span>
            </button>

            <button
              onTouchStart={() => { keysPressedRef.current['Space'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['Space'] = false; }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30 text-xs flex-col"
            >
              <Flame className="w-6 h-6 mb-0.5 fill-white" />
              <span>TURBO</span>
            </button>
          </div>
        </div>

        {/* Modal Thắng Màn (Về đích thành công) */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">🏁</span>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              CÁN ĐÍCH THÀNH CÔNG MÀN {stage}!
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-2">
              Bạn đã vượt qua chặng đua ngoạn mục với tốc độ cao.
            </p>
            <p className="text-xs text-emerald-400 font-bold mb-6">
              +40% Nhiên liệu thưởng cho chặng đua tiếp theo
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-red-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiếp Tục Màn {stage + 1}
            </button>
          </div>
        )}

        {/* Modal Thua Cuộc (Hết xăng hoặc nổ xe) */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💥</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              HẾT NHIÊN LIỆU!
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-2">
              Xe đã dừng lại vì cạn kiệt bình xăng. Hãy chú ý nhặt các xe thưởng trên đường.
            </p>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Điểm số: <span className="font-mono text-amber-400 font-bold">{score.toLocaleString()}</span> • Xe đã vượt: <span className="font-mono text-cyan-400 font-bold">{carsPassed}</span>
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
