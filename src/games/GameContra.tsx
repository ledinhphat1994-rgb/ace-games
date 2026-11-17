import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Heart, 
  Shield, 
  Flame, 
  Target,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'hardcore';
type WeaponType = 'normal' | 'machine' | 'spread' | 'laser' | 'flame' | 'barrier';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân khấu chiến trường 756x540px
const ARENA_WIDTH = 756;
const ARENA_HEIGHT = 540;

// Sidebar radar chiến thuật (204px)
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

// Chiều dài bản đồ màn 1 (Rừng nhiệt đới Galuga): 4200px
const LEVEL_LENGTH = 4200;
const BOSS_X = LEVEL_LENGTH - 460;

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isWater?: boolean;
  isBridge?: boolean;
  isExploding?: boolean;
  explodeTimer?: number;
  isDestroyed?: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPlayer: boolean;
  damage: number;
  isSpread?: boolean;
  isLaser?: boolean;
  isFlame?: boolean;
  angle?: number;
  pierce?: number;
}

interface Enemy {
  id: number;
  type: 'runner' | 'sniper' | 'turret' | 'wall_pod' | 'flying_capsule';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  facing: 'left' | 'right';
  itemDrop?: WeaponType;
  isAlive: boolean;
  aimAngle?: number;
  sineTime?: number;
  animFrame?: number;
}

interface WeaponItem {
  id: number;
  type: WeaponType;
  x: number;
  y: number;
  vy: number;
  isAlive: boolean;
  letter: string;
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
  sizeDecay?: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}

// Khởi tạo địa hình các mỏm đá, cầu treo và hào nước dọc màn 1
const generatePlatforms = (): Platform[] => {
  const list: Platform[] = [];

  // Mặt đất chính xen kẽ hào nước và cầu nổ
  list.push({ x: 0, y: 440, width: 920, height: 100 });
  
  // Cầu treo số 1 (Cầu phát nổ khi bước lên)
  list.push({ x: 920, y: 440, width: 320, height: 26, isBridge: true });
  list.push({ x: 920, y: 480, width: 320, height: 60, isWater: true }); // Nước dưới cầu 1

  list.push({ x: 1240, y: 440, width: 880, height: 100 });

  // Cầu treo số 2 qua sông sâu
  list.push({ x: 2120, y: 440, width: 360, height: 26, isBridge: true });
  list.push({ x: 2120, y: 480, width: 360, height: 60, isWater: true }); // Nước dưới cầu 2

  // Tiền đồn và sân trước căn cứ Boss Red Falcon
  list.push({ x: 2480, y: 440, width: 1800, height: 100 });

  // Các mỏm đá tầng 2 và tầng 3 để nhảy bắn ngắm cao
  const ledges = [
    { x: 180, y: 340, width: 190, height: 24 },
    { x: 420, y: 250, width: 230, height: 24 },
    { x: 720, y: 340, width: 180, height: 24 },
    { x: 1350, y: 350, width: 200, height: 24 },
    { x: 1600, y: 260, width: 220, height: 24 },
    { x: 1860, y: 350, width: 180, height: 24 },
    { x: 2580, y: 340, width: 210, height: 24 },
    { x: 2860, y: 250, width: 240, height: 24 },
    { x: 3180, y: 350, width: 220, height: 24 },
    { x: 3480, y: 300, width: 200, height: 24 },
  ];

  ledges.forEach((lg) => {
    list.push({ x: lg.x, y: lg.y, width: lg.width, height: lg.height });
  });

  return list;
};

export const GameContra: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái hiển thị giao diện React
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [initialLives, setInitialLives] = useState<number>(3);
  const [stage, setStage] = useState<number>(1);
  const [weapon, setWeapon] = useState<WeaponType>('normal');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [enemiesKilled, setEnemiesKilled] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References độc lập cho game loop 60 FPS
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const weaponRef = useRef<WeaponType>('normal');
  const stageRef = useRef<number>(1);
  const enemiesKilledRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const isVictoryRef = useRef<boolean>(false);
  const gameModeRef = useRef<GameMode>('classic');
  const runnerSpawnCooldownRef = useRef<number>(2.0);

  // Đồng bộ refs với state
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { weaponRef.current = weapon; }, [weapon]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { enemiesKilledRef.current = enemiesKilled; }, [enemiesKilled]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { isVictoryRef.current = isVictory; }, [isVictory]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const lastTimeRef = useRef<number>(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const cameraXRef = useRef<number>(0);
  const platformsRef = useRef<Platform[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<WeaponItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Nhân vật chính: Biệt kích Bill Rizer
  const playerRef = useRef({
    x: 80,
    y: 380,
    width: 34,
    height: 56,
    vx: 0,
    vy: 0,
    facing: 'right' as 'left' | 'right',
    aimDir: 'right' as 'right' | 'left' | 'up' | 'down' | 'up-right' | 'up-left' | 'down-right' | 'down-left',
    isGrounded: false,
    isJumping: false,
    isProne: false,
    isInWater: false,
    isInvulnerable: false,
    invulnerableTimer: 0,
    barrierTimer: 0,
    shootCooldown: 0,
    spinAngle: 0,
    runAnimTimer: 0,
    runFrame: 0,
    muzzleFlashTimer: 0,
  });

  // Boss Căn cứ Phòng thủ Red Falcon (Gromaides Stage 1)
  const bossRef = useRef({
    x: BOSS_X,
    y: 150,
    width: 230,
    height: 290,
    topTurretHp: 60,
    maxTopTurretHp: 60,
    bottomTurretHp: 60,
    maxBottomTurretHp: 60,
    coreHp: 160,
    maxCoreHp: 160,
    isCoreDestroyed: false,
    isAlive: true,
    shootTimer: 0,
    pulseTime: 0,
  });

  // Load HighScore & Settings
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem('acegames_contra_highscore');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedSettings = localStorage.getItem('ace_game_settings_contra');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.gameMode) {
          setGameMode(parsed.gameMode as GameMode);
          gameModeRef.current = parsed.gameMode as GameMode;
        }
        if (parsed.initialLives) {
          setInitialLives(parsed.initialLives);
          setLives(parsed.initialLives);
          livesRef.current = parsed.initialLives;
        }
        if (parsed.initialWeapon) {
          setWeapon(parsed.initialWeapon as WeaponType);
          weaponRef.current = parsed.initialWeapon as WeaponType;
        }
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
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const playShootSound = useCallback((wType: WeaponType) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    if (wType === 'spread') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (wType === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  }, [initAudio]);

  const playJumpSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }, [initAudio]);

  const playExplosionSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.32);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }, [initAudio]);

  const playPowerupSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.1);
    });
  }, [initAudio]);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 240);
  }, []);

  const createExplosion = (x: number, y: number, count: number = 22, colorTheme: 'fire' | 'metal' = 'fire') => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6.5 + 1.5;
      const colors = colorTheme === 'fire' 
        ? ['#fef08a', '#f97316', '#ef4444', '#dc2626', '#ffffff'] 
        : ['#94a3b8', '#64748b', '#cbd5e1', '#f59e0b'];
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        radius: Math.random() * 4.5 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 25 + 20),
        sizeDecay: 0.94,
      });
    }
  };

  // Khởi tạo lại toàn bộ màn chơi
  const resetGame = useCallback(() => {
    platformsRef.current = generatePlatforms();
    bulletsRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    cameraXRef.current = 0;
    runnerSpawnCooldownRef.current = 2.0;

    playerRef.current = {
      x: 80,
      y: 380,
      width: 34,
      height: 56,
      vx: 0,
      vy: 0,
      facing: 'right',
      aimDir: 'right',
      isGrounded: false,
      isJumping: false,
      isProne: false,
      isInWater: false,
      isInvulnerable: false,
      invulnerableTimer: 0,
      barrierTimer: 0,
      shootCooldown: 0,
      spinAngle: 0,
      runAnimTimer: 0,
      runFrame: 0,
      muzzleFlashTimer: 0,
    };

    bossRef.current = {
      x: BOSS_X,
      y: 150,
      width: 230,
      height: 290,
      topTurretHp: 60,
      maxTopTurretHp: 60,
      bottomTurretHp: 60,
      maxBottomTurretHp: 60,
      coreHp: 160,
      maxCoreHp: 160,
      isCoreDestroyed: false,
      isAlive: true,
      shootTimer: 0,
      pulseTime: 0,
    };

    const initialEnemies: Enemy[] = [
      { id: 1, type: 'sniper', x: 520, y: 200, width: 44, height: 48, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 1.8, facing: 'left', isAlive: true },
      { id: 2, type: 'turret', x: 820, y: 295, width: 46, height: 46, vx: 0, vy: 0, hp: 12, maxHp: 12, shootCooldown: 2.2, facing: 'left', isAlive: true, aimAngle: Math.PI },
      { id: 3, type: 'wall_pod', x: 680, y: 265, width: 40, height: 40, vx: 0, vy: 0, hp: 4, maxHp: 4, shootCooldown: 999, facing: 'left', itemDrop: 'spread', isAlive: true },
      { id: 4, type: 'flying_capsule', x: 450, y: 150, width: 44, height: 30, vx: 2.2, vy: 0, hp: 1, maxHp: 1, shootCooldown: 999, facing: 'right', itemDrop: 'machine', isAlive: true, sineTime: 0 },
      { id: 5, type: 'sniper', x: 1720, y: 210, width: 44, height: 48, vx: 0, vy: 0, hp: 8, maxHp: 8, shootCooldown: 1.6, facing: 'left', isAlive: true },
      { id: 6, type: 'turret', x: 1940, y: 305, width: 46, height: 46, vx: 0, vy: 0, hp: 14, maxHp: 14, shootCooldown: 2.0, facing: 'left', isAlive: true, aimAngle: Math.PI },
      { id: 7, type: 'wall_pod', x: 1520, y: 275, width: 40, height: 40, vx: 0, vy: 0, hp: 5, maxHp: 5, shootCooldown: 999, facing: 'left', itemDrop: 'laser', isAlive: true },
      { id: 8, type: 'flying_capsule', x: 1650, y: 140, width: 44, height: 30, vx: 2.4, vy: 0, hp: 1, maxHp: 1, shootCooldown: 999, facing: 'right', itemDrop: 'barrier', isAlive: true, sineTime: 1.5 },
      { id: 9, type: 'sniper', x: 2980, y: 200, width: 44, height: 48, vx: 0, vy: 0, hp: 10, maxHp: 10, shootCooldown: 1.5, facing: 'left', isAlive: true },
      { id: 10, type: 'turret', x: 3260, y: 305, width: 46, height: 46, vx: 0, vy: 0, hp: 16, maxHp: 16, shootCooldown: 1.8, facing: 'left', isAlive: true, aimAngle: Math.PI },
      { id: 11, type: 'wall_pod', x: 2750, y: 265, width: 40, height: 40, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 999, facing: 'left', itemDrop: 'spread', isAlive: true },
    ];
    enemiesRef.current = initialEnemies;

    setScore(0);
    scoreRef.current = 0;
    setLives(initialLives);
    livesRef.current = initialLives;
    setEnemiesKilled(0);
    enemiesKilledRef.current = 0;
    setIsGameOver(false);
    isGameOverRef.current = false;
    setIsVictory(false);
    isVictoryRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
  }, [initialLives]);

  const nextStage = useCallback(() => {
    setStage((s) => {
      const nextS = s + 1;
      stageRef.current = nextS;
      return nextS;
    });
    resetGame();
  }, [resetGame]);

  const handlePlayerShoot = useCallback(() => {
    const p = playerRef.current;
    if (p.shootCooldown > 0 || isPausedRef.current || isGameOverRef.current || isVictoryRef.current) return;

    let dirX = p.facing === 'right' ? 1 : -1;
    let dirY = 0;

    if (p.aimDir === 'up') {
      dirX = 0;
      dirY = -1;
    } else if (p.aimDir === 'up-right') {
      dirX = 0.707;
      dirY = -0.707;
    } else if (p.aimDir === 'up-left') {
      dirX = -0.707;
      dirY = -0.707;
    } else if (p.aimDir === 'down-right') {
      dirX = 0.707;
      dirY = 0.707;
    } else if (p.aimDir === 'down-left') {
      dirX = -0.707;
      dirY = 0.707;
    } else if (p.aimDir === 'down') {
      if (!p.isGrounded) {
        dirX = 0;
        dirY = 1;
      }
    }

    const startX = p.x + (dirX > 0 ? p.width + 12 : dirX < 0 ? -12 : p.width / 2);
    const startY = p.isProne 
      ? p.y + p.height - 12 
      : p.y + (dirY < 0 ? -8 : dirY > 0 ? p.height + 8 : 22);

    const speed = 15;
    const curWeapon = weaponRef.current;
    playShootSound(curWeapon);
    p.muzzleFlashTimer = 0.08;

    if (curWeapon === 'spread') {
      const baseAngle = Math.atan2(dirY, dirX);
      const spreadAngles = [-0.30, -0.15, 0, 0.15, 0.30];

      spreadAngles.forEach((angOffset) => {
        const finalAng = baseAngle + angOffset;
        bulletsRef.current.push({
          id: Date.now() + Math.random(),
          x: startX,
          y: startY,
          vx: Math.cos(finalAng) * speed,
          vy: Math.sin(finalAng) * speed,
          radius: 7,
          color: '#ef4444',
          isPlayer: true,
          damage: 2,
          isSpread: true,
        });
      });
      p.shootCooldown = 0.18;
    } else if (curWeapon === 'laser') {
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: dirX * speed * 1.45,
        vy: dirY * speed * 1.45,
        radius: 5,
        color: '#06b6d4',
        isPlayer: true,
        damage: 4,
        isLaser: true,
        pierce: 3,
      });
      p.shootCooldown = 0.22;
    } else {
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: dirX * speed,
        vy: dirY * speed,
        radius: 4.5,
        color: '#facc15',
        isPlayer: true,
        damage: 1,
      });
      p.shootCooldown = curWeapon === 'machine' ? 0.09 : 0.16;
    }
  }, [playShootSound]);

  const handlePlayerJump = useCallback(() => {
    const p = playerRef.current;
    if (isPausedRef.current || isGameOverRef.current || isVictoryRef.current) return;

    const keys = keysPressedRef.current;
    const isHoldingDown = keys['ArrowDown'] || keys['KeyS'];

    if (p.isGrounded) {
      if (isHoldingDown) {
        p.y += 14;
        p.isGrounded = false;
        p.vy = 4;
      } else {
        p.vy = -12.5;
        p.isGrounded = false;
        p.isJumping = true;
        p.spinAngle = 0;
        playJumpSound();
      }
    }
  }, [playJumpSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      if (e.code === 'KeyP') {
        setIsPaused((p) => {
          isPausedRef.current = !p;
          return !p;
        });
      }

      if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') {
        handlePlayerJump();
      }

      if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyC') {
        handlePlayerShoot();
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
  }, [handlePlayerJump, handlePlayerShoot, initAudio]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Main Game Loop 60 FPS
  useEffect(() => {
    let animId = 0;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
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

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      // ==========================================
      // 1. CẬP NHẬT VẬT LÝ VÀ LOGIC GAME
      // ==========================================
      if (!isPausedRef.current && !isGameOverRef.current && !isVictoryRef.current) {
        const p = playerRef.current;
        const keys = keysPressedRef.current;

        if (p.shootCooldown > 0) p.shootCooldown -= dt;
        if (p.muzzleFlashTimer > 0) p.muzzleFlashTimer -= dt;
        if (p.isInvulnerable) {
          p.invulnerableTimer -= dt;
          if (p.invulnerableTimer <= 0) p.isInvulnerable = false;
        }
        if (p.barrierTimer > 0) p.barrierTimer -= dt;

        const isLeft = keys['ArrowLeft'] || keys['KeyA'];
        const isRight = keys['ArrowRight'] || keys['KeyD'];
        const isUp = keys['ArrowUp'] || keys['KeyW'];
        const isDown = keys['ArrowDown'] || keys['KeyS'];

        if (isRight) p.facing = 'right';
        if (isLeft) p.facing = 'left';

        p.isProne = isDown && p.isGrounded && !isLeft && !isRight;

        if (p.isProne) {
          p.aimDir = p.facing;
        } else if (isUp && !isLeft && !isRight) {
          p.aimDir = 'up';
        } else if (isUp && isRight) {
          p.aimDir = 'up-right';
        } else if (isUp && isLeft) {
          p.aimDir = 'up-left';
        } else if (isDown && isRight) {
          p.aimDir = 'down-right';
        } else if (isDown && isLeft) {
          p.aimDir = 'down-left';
        } else if (isDown && !p.isGrounded) {
          p.aimDir = 'down';
        } else {
          p.aimDir = p.facing;
        }

        const moveSpeed = gameModeRef.current === 'speed' ? 240 : 185;
        if (isRight && !p.isProne) {
          p.vx = moveSpeed;
          p.runAnimTimer += dt * 10;
          p.runFrame = Math.floor(p.runAnimTimer) % 4;
        } else if (isLeft && !p.isProne) {
          p.vx = -moveSpeed;
          p.runAnimTimer += dt * 10;
          p.runFrame = Math.floor(p.runAnimTimer) % 4;
        } else {
          p.vx = 0;
          p.runFrame = 0;
        }

        p.x += p.vx * dt;

        if (p.x < cameraXRef.current + 10) {
          p.x = cameraXRef.current + 10;
        }

        if (keys['KeyJ'] || keys['KeyZ'] || keys['KeyC']) {
          handlePlayerShoot();
        }

        const gravity = 32;
        p.vy += gravity * dt;
        p.y += p.vy;

        p.isGrounded = false;
        p.isInWater = false;

        platformsRef.current.forEach((plat) => {
          if (plat.isDestroyed) return;

          const isAbove = p.y + p.height - p.vy <= plat.y + 12;
          const isHitting = p.y + p.height >= plat.y && p.y + p.height <= plat.y + plat.height;
          const isWithinX = p.x + p.width > plat.x && p.x < plat.x + plat.width;

          if (isAbove && isHitting && isWithinX && p.vy >= 0) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.isJumping = false;
            p.spinAngle = 0;

            if (plat.isWater) {
              p.isInWater = true;
            }

            if (plat.isBridge && !plat.isExploding && !plat.isDestroyed) {
              plat.isExploding = true;
              plat.explodeTimer = 0.55;
            }
          }
        });

        platformsRef.current.forEach((plat) => {
          if (plat.isBridge && plat.isExploding && !plat.isDestroyed) {
            plat.explodeTimer = (plat.explodeTimer || 0) - dt;
            if (plat.explodeTimer <= 0) {
              plat.isDestroyed = true;
              plat.isExploding = false;
              createExplosion(plat.x + plat.width / 2, plat.y + 10, 30, 'fire');
              playExplosionSound();
              triggerShake();
            }
          }
        });

        if (!p.isGrounded && p.isJumping) {
          p.spinAngle += (p.facing === 'right' ? 1 : -1) * 16 * dt;
        }

        if (p.y > ARENA_HEIGHT + 20) {
          setLives((l) => {
            const nextL = l - 1;
            livesRef.current = nextL;
            if (nextL <= 0) {
              setIsGameOver(true);
              isGameOverRef.current = true;
              soundManager.playButtonClick();
            }
            return nextL;
          });

          p.x = cameraXRef.current + 100;
          p.y = 80;
          p.vy = 0;
          p.isInvulnerable = true;
          p.invulnerableTimer = 3.0;
          triggerShake();
        }

        const targetCamX = p.x - ARENA_WIDTH * 0.38;
        if (targetCamX > cameraXRef.current) {
          cameraXRef.current = Math.min(targetCamX, BOSS_X - ARENA_WIDTH + 240);
        }

        // Cập nhật quân địch
        enemiesRef.current.forEach((en) => {
          if (!en.isAlive) return;

          if (en.type === 'runner') {
            en.x += en.vx * dt;
            en.vy += gravity * dt;
            en.y += en.vy;

            platformsRef.current.forEach((plat) => {
              if (plat.isDestroyed) return;
              if (
                en.x + en.width > plat.x &&
                en.x < plat.x + plat.width &&
                en.y + en.height >= plat.y &&
                en.y + en.height <= plat.y + plat.height &&
                en.vy >= 0
              ) {
                en.y = plat.y - en.height;
                en.vy = 0;
              }
            });

            if (
              !p.isInvulnerable &&
              p.barrierTimer <= 0 &&
              Math.abs(p.x + p.width / 2 - (en.x + en.width / 2)) < 24 &&
              Math.abs(p.y + p.height / 2 - (en.y + en.height / 2)) < 30
            ) {
              en.isAlive = false;
              createExplosion(en.x + en.width / 2, en.y + en.height / 2, 20, 'fire');
              setLives((l) => {
                const nextL = l - 1;
                livesRef.current = nextL;
                if (nextL <= 0) {
                  setIsGameOver(true);
                  isGameOverRef.current = true;
                }
                return nextL;
              });
              p.isInvulnerable = true;
              p.invulnerableTimer = 2.5;
              playExplosionSound();
              triggerShake();
            }
          } else if (en.type === 'sniper') {
            en.facing = p.x < en.x ? 'left' : 'right';
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && Math.abs(en.x - p.x) < 560) {
              en.shootCooldown = 2.4;
              const angle = Math.atan2((p.y + 20) - en.y, (p.x + 10) - en.x);
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: en.x + (en.facing === 'left' ? -6 : en.width + 6),
                y: en.y + 16,
                vx: Math.cos(angle) * 7.5,
                vy: Math.sin(angle) * 7.5,
                radius: 4.5,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
          } else if (en.type === 'turret') {
            const dx = (p.x + p.width / 2) - (en.x + en.width / 2);
            const dy = (p.y + p.height / 2) - (en.y + en.height / 2);
            en.aimAngle = Math.atan2(dy, dx);
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && Math.abs(dx) < 600) {
              en.shootCooldown = 2.0;
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: en.x + en.width / 2 + Math.cos(en.aimAngle) * 22,
                y: en.y + en.height / 2 + Math.sin(en.aimAngle) * 22,
                vx: Math.cos(en.aimAngle) * 8.5,
                vy: Math.sin(en.aimAngle) * 8.5,
                radius: 5,
                color: '#ef4444',
                isPlayer: false,
                damage: 1,
              });
            }
          } else if (en.type === 'flying_capsule') {
            en.sineTime = (en.sineTime || 0) + dt * 3.5;
            en.x += en.vx * 60 * dt;
            en.y = 135 + Math.sin(en.sineTime) * 35;
          }
        });

        // Điều tiết nhịp sinh lính bộ binh (Runners) tối đa 2 lính trên màn hình
        runnerSpawnCooldownRef.current -= dt;
        if (runnerSpawnCooldownRef.current <= 0 && p.x < BOSS_X - 500) {
          const activeRunners = enemiesRef.current.filter(
            (en) => en.isAlive && en.type === 'runner' && Math.abs(en.x - p.x) < ARENA_WIDTH
          ).length;

          if (activeRunners < 2) {
            runnerSpawnCooldownRef.current = Math.random() * 1.5 + 2.5;
            const spawnAhead = Math.random() < 0.8;
            const spawnX = spawnAhead ? cameraXRef.current + ARENA_WIDTH + 30 : cameraXRef.current - 20;
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'runner',
              x: spawnX,
              y: 380,
              width: 32,
              height: 52,
              vx: spawnAhead ? -125 : 125,
              vy: 0,
              hp: 2,
              maxHp: 2,
              shootCooldown: 999,
              facing: spawnAhead ? 'left' : 'right',
              isAlive: true,
            });
          }
        }

        if (Math.random() < 0.005 && itemsRef.current.length === 0) {
          const wChoices: WeaponType[] = ['spread', 'machine', 'laser', 'barrier'];
          const pickedW = wChoices[Math.floor(Math.random() * wChoices.length)];
          enemiesRef.current.push({
            id: Date.now() + Math.random(),
            type: 'flying_capsule',
            x: cameraXRef.current - 40,
            y: 130,
            width: 44,
            height: 30,
            vx: 2.5,
            vy: 0,
            hp: 1,
            maxHp: 1,
            shootCooldown: 999,
            facing: 'right',
            itemDrop: pickedW,
            isAlive: true,
            sineTime: 0,
          });
        }

        const boss = bossRef.current;
        if (boss.isAlive && p.x > BOSS_X - 650) {
          boss.shootTimer += dt;
          boss.pulseTime += dt;

          if (boss.shootTimer > 2.0) {
            boss.shootTimer = 0;
            if (boss.topTurretHp > 0) {
              const ang = Math.atan2((p.y + 20) - (boss.y + 60), (p.x + 10) - (boss.x + 20));
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 60,
                vx: Math.cos(ang) * 9,
                vy: Math.sin(ang) * 9,
                radius: 5.5,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
            if (boss.bottomTurretHp > 0) {
              const ang = Math.atan2((p.y + 20) - (boss.y + 190), (p.x + 10) - (boss.x + 20));
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 190,
                vx: Math.cos(ang) * 9,
                vy: Math.sin(ang) * 9,
                radius: 5.5,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
          }
        }

        bulletsRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;

          if (b.isPlayer) {
            enemiesRef.current.forEach((en) => {
              if (
                en.isAlive &&
                b.damage > 0 &&
                b.x > en.x &&
                b.x < en.x + en.width &&
                b.y > en.y &&
                b.y < en.y + en.height
              ) {
                en.hp -= b.damage;
                if (!b.pierce) b.damage = 0;
                else b.pierce--;

                createExplosion(b.x, b.y, 6, 'fire');

                if (en.hp <= 0) {
                  en.isAlive = false;
                  setScore((s) => {
                    const nextS = s + 200;
                    scoreRef.current = nextS;
                    return nextS;
                  });
                  setEnemiesKilled((k) => {
                    const nextK = k + 1;
                    enemiesKilledRef.current = nextK;
                    return nextK;
                  });
                  playExplosionSound();
                  createExplosion(en.x + en.width / 2, en.y + en.height / 2, 22, 'fire');

                  if (en.itemDrop) {
                    const letters: Record<WeaponType, string> = {
                      spread: 'S',
                      machine: 'M',
                      laser: 'L',
                      flame: 'F',
                      barrier: 'B',
                      normal: 'R'
                    };
                    itemsRef.current.push({
                      id: Date.now(),
                      type: en.itemDrop,
                      x: en.x + en.width / 2,
                      y: en.y,
                      vy: -3.8,
                      isAlive: true,
                      letter: letters[en.itemDrop] || 'S',
                    });
                  }
                }
              }
            });

            if (
              boss.isAlive &&
              b.damage > 0 &&
              b.x > boss.x &&
              b.x < boss.x + boss.width &&
              b.y > boss.y &&
              b.y < boss.y + boss.height
            ) {
              createExplosion(b.x, b.y, 8, 'metal');

              if (b.y < boss.y + 100 && boss.topTurretHp > 0) {
                boss.topTurretHp -= b.damage;
                b.damage = 0;
                if (boss.topTurretHp <= 0) {
                  setScore((s) => s + 500);
                  scoreRef.current += 500;
                  createExplosion(boss.x + 30, boss.y + 65, 30, 'fire');
                  playExplosionSound();
                }
              }
              else if (b.y > boss.y + 170 && boss.bottomTurretHp > 0) {
                boss.bottomTurretHp -= b.damage;
                b.damage = 0;
                if (boss.bottomTurretHp <= 0) {
                  setScore((s) => s + 500);
                  scoreRef.current += 500;
                  createExplosion(boss.x + 30, boss.y + 195, 30, 'fire');
                  playExplosionSound();
                }
              }
              else if (b.y >= boss.y + 100 && b.y <= boss.y + 170) {
                boss.coreHp -= b.damage;
                b.damage = 0;

                if (boss.coreHp <= 0 && !boss.isCoreDestroyed) {
                  boss.isCoreDestroyed = true;
                  boss.isAlive = false;
                  setScore((s) => {
                    const nextS = s + 5000;
                    scoreRef.current = nextS;
                    return nextS;
                  });
                  setIsVictory(true);
                  isVictoryRef.current = true;
                  triggerShake();

                  createExplosion(boss.x + 30, boss.y + 135, 60, 'fire');
                  createExplosion(boss.x + 60, boss.y + 80, 45, 'fire');
                  createExplosion(boss.x + 60, boss.y + 200, 45, 'fire');
                  confetti({
                    particleCount: 180,
                    spread: 95,
                    origin: { y: 0.6 },
                  });
                  soundManager.playVictory();
                }
              }
            }
          } else {
            const hitPad = p.isProne ? 8 : 16;
            const isHitPlayer = 
              !p.isInvulnerable &&
              p.barrierTimer <= 0 &&
              b.x > p.x &&
              b.x < p.x + p.width &&
              b.y > p.y + (p.isProne ? p.height - hitPad : 0) &&
              b.y < p.y + p.height - (p.isInWater ? 22 : 0);

            if (isHitPlayer) {
              b.damage = 0;
              triggerShake();
              setLives((l) => {
                const nextL = l - 1;
                livesRef.current = nextL;
                if (nextL <= 0) {
                  setIsGameOver(true);
                  isGameOverRef.current = true;
                  soundManager.playButtonClick();
                }
                return nextL;
              });
              p.isInvulnerable = true;
              p.invulnerableTimer = 2.5;
              playExplosionSound();
              createExplosion(p.x + p.width / 2, p.y + p.height / 2, 22, 'fire');
            }
          }
        });

        bulletsRef.current = bulletsRef.current.filter(
          (b) => b.damage > 0 && b.x > cameraXRef.current - 60 && b.x < cameraXRef.current + ARENA_WIDTH + 60 && b.y > -60 && b.y < ARENA_HEIGHT + 60
        );

        itemsRef.current.forEach((it) => {
          it.y += it.vy;
          it.vy += 0.16;

          if (
            it.isAlive &&
            Math.abs(p.x + p.width / 2 - it.x) < 32 &&
            Math.abs(p.y + p.height / 2 - it.y) < 36
          ) {
            it.isAlive = false;
            setScore((s) => {
              const nextS = s + 1000;
              scoreRef.current = nextS;
              return nextS;
            });
            playPowerupSound();

            if (it.type === 'barrier') {
              p.barrierTimer = 10.0;
              floatingTextsRef.current.push({
                id: Date.now(),
                text: 'KHIÊN BẤT TỬ [B]!',
                x: it.x,
                y: it.y - 18,
                color: '#38bdf8',
                alpha: 1,
              });
            } else {
              setWeapon(it.type);
              weaponRef.current = it.type;
              const names: Record<WeaponType, string> = {
                spread: 'ĐẠN HOA CẢI [S]!',
                machine: 'SÚNG MÁY [M]!',
                laser: 'LASER NĂNG LƯỢNG [L]!',
                flame: 'CẦU LỬA [F]!',
                barrier: 'KHIÊN B!',
                normal: 'RIFLE!'
              };
              floatingTextsRef.current.push({
                id: Date.now(),
                text: names[it.type] || 'VŨ KHÍ MỚI!',
                x: it.x,
                y: it.y - 18,
                color: '#facc15',
                alpha: 1,
              });
            }
          }
        });
        itemsRef.current = itemsRef.current.filter((it) => it.isAlive && it.y < ARENA_HEIGHT + 50);

        particlesRef.current.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life++;
          if (pt.sizeDecay) pt.radius *= pt.sizeDecay;
          pt.alpha = 1 - pt.life / pt.maxLife;
        });
        particlesRef.current = particlesRef.current.filter((pt) => pt.life < pt.maxLife);

        floatingTextsRef.current.forEach((ft) => {
          ft.y -= 30 * dt;
          ft.alpha -= dt * 0.9;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);
      }

      // ==========================================
      // 2. RENDER ĐỒ HỌA RETRO-ARCADE ĐỈNH CAO
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const camX = cameraXRef.current;

      // ------------------------------------------
      // A. BẦU TRỜI ĐÊM GALUGA PARALLAX & TRĂNG MÁU
      // ------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
      skyGrad.addColorStop(0, '#02050f');
      skyGrad.addColorStop(0.4, '#081427');
      skyGrad.addColorStop(0.75, '#0e233d');
      skyGrad.addColorStop(1, '#153252');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Các vì sao lấp lánh (Starfield)
      for (let s = 0; s < 45; s++) {
        const starX = (s * 197 + 43) % ARENA_WIDTH;
        const starY = (s * 131 + 17) % 220;
        const starBrightness = (Math.sin(Date.now() / 400 + s) + 1) * 0.4 + 0.2;
        ctx.fillStyle = s % 4 === 0 ? `rgba(254, 240, 138, ${starBrightness})` : `rgba(224, 242, 254, ${starBrightness})`;
        ctx.fillRect(starX, starY, (s % 7 === 0) ? 2.5 : 1.5, (s % 7 === 0) ? 2.5 : 1.5);
      }

      // Mặt trăng khổng lồ với quầng sáng sương mù và hố thiên thạch
      const moonX = 560 - (camX * 0.04) % 860;
      const moonY = 85;
      const moonAura = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 75);
      moonAura.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
      moonAura.addColorStop(0.5, 'rgba(249, 115, 22, 0.15)');
      moonAura.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = moonAura;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 75, 0, Math.PI * 2);
      ctx.fill();

      const moonGrad = ctx.createRadialGradient(moonX - 8, moonY - 8, 4, moonX, moonY, 34);
      moonGrad.addColorStop(0, '#ffffff');
      moonGrad.addColorStop(0.4, '#fef08a');
      moonGrad.addColorStop(0.8, '#f59e0b');
      moonGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.beginPath();
      ctx.arc(moonX - 10, moonY - 6, 7, 0, Math.PI * 2);
      ctx.arc(moonX + 12, moonY + 8, 9, 0, Math.PI * 2);
      ctx.arc(moonX + 4, moonY - 14, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.beginPath();
      ctx.ellipse(moonX - 25, moonY + 16, 45, 8, -0.08, 0, Math.PI * 2);
      ctx.ellipse(moonX + 20, moonY + 22, 50, 10, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Dãy núi đá lửa phương xa (Parallax 0.12)
      ctx.fillStyle = '#060d17';
      for (let i = -1; i < 7; i++) {
        const mx = i * 280 - (camX * 0.12) % 280;
        ctx.beginPath();
        ctx.moveTo(mx - 40, 360);
        ctx.lineTo(mx + 80, 140);
        ctx.lineTo(mx + 130, 200);
        ctx.lineTo(mx + 210, 120);
        ctx.lineTo(mx + 320, 360);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(147, 197, 253, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx + 80, 140);
        ctx.lineTo(mx + 130, 200);
        ctx.lineTo(mx + 210, 120);
        ctx.stroke();
      }

      // Thác nước chảy từ hẻm núi xa
      for (let i = -1; i < 5; i++) {
        const wfx = i * 360 - (camX * 0.12) % 360 + 130;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const shimmer = Math.sin(Date.now() / 120 + i) * 1.5;
        ctx.fillRect(wfx + shimmer, 200, 3, 110);
      }

      // Rừng nhiệt đới Galuga hùng vĩ (Parallax 0.38)
      // Loại bỏ hoàn toàn hình khối tròn/mút xốp đơn điệu, vẽ cây cọ và thảm thực vật nhiệt đới
      for (let j = -1; j < 14; j++) {
        const px = j * 160 - (camX * 0.38) % 160;
        const trunkBaseX = px + 60;
        const trunkTopX = px + 80;
        const trunkTopY = 240;

        // Thân cây cọ rừng vân gỗ gồ ghề tự nhiên
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(trunkBaseX, 420);
        ctx.quadraticCurveTo(trunkBaseX + 12, 330, trunkTopX, trunkTopY);
        ctx.stroke();

        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(trunkBaseX, 420);
        ctx.quadraticCurveTo(trunkBaseX + 12, 330, trunkTopX, trunkTopY);
        ctx.stroke();

        // Tán lá cọ xoè 7 nhánh tự nhiên với phiến lá vươn cong mềm mại
        const frondAngles = [-1.3, -0.9, -0.5, -0.1, 0.3, 0.7, 1.1];
        frondAngles.forEach((fAng, idx) => {
          const frondLen = 65 + (idx % 3) * 10;
          const endX = trunkTopX + Math.cos(fAng) * frondLen;
          const endY = trunkTopY + Math.sin(fAng) * (frondLen * 0.6) + 10;
          const ctrlX = trunkTopX + Math.cos(fAng) * (frondLen * 0.5);
          const ctrlY = trunkTopY + Math.sin(fAng) * (frondLen * 0.3) - 15;

          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(trunkTopX, trunkTopY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.stroke();

          ctx.fillStyle = idx % 2 === 0 ? '#047857' : '#065f46';
          ctx.beginPath();
          ctx.moveTo(trunkTopX, trunkTopY);
          ctx.quadraticCurveTo(ctrlX - 6, ctrlY - 8, endX, endY);
          ctx.quadraticCurveTo(ctrlX + 6, ctrlY + 6, trunkTopX, trunkTopY);
          ctx.fill();
        });

        // Dây leo rừng rủ xuống đung đưa
        const vineSwing = Math.sin(Date.now() / 500 + j) * 8;
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(px + 65, 300);
        ctx.quadraticCurveTo(px + 65 + vineSwing, 360, px + 68 + vineSwing * 1.5, 410);
        ctx.stroke();

        // Hoa rừng đỏ tươi trên dây leo
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + 66 + vineSwing * 0.7, 350, 3, 0, Math.PI * 2);
        ctx.arc(px + 68 + vineSwing * 1.2, 385, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ------------------------------------------
      // B. VẼ ĐỊA HÌNH, MỎM ĐÁ, CẦU VÀ NƯỚC SÔNG
      // ------------------------------------------
      platformsRef.current.forEach((plat) => {
        if (plat.isDestroyed) return;
        const screenPlatX = plat.x - camX;
        if (screenPlatX + plat.width < -60 || screenPlatX > ARENA_WIDTH + 60) return;

        if (plat.isWater) {
          const waterGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
          waterGrad.addColorStop(0, '#0284c7');
          waterGrad.addColorStop(0.35, '#0369a1');
          waterGrad.addColorStop(0.8, '#082f49');
          waterGrad.addColorStop(1, '#021e33');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(screenPlatX, plat.y, plat.width, plat.height);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          for (let w = 0; w < plat.width; w += 28) {
            const waveY = Math.sin(Date.now() / 160 + w * 0.12) * 3.5;
            ctx.fillRect(screenPlatX + w, plat.y + 3 + waveY, 18, 2.5);
          }
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          for (let w = 14; w < plat.width; w += 32) {
            const waveY = Math.cos(Date.now() / 200 + w * 0.1) * 3;
            ctx.fillRect(screenPlatX + w, plat.y + 12 + waveY, 22, 2);
          }
        } else if (plat.isBridge) {
          ctx.fillStyle = plat.isExploding ? '#dc2626' : '#334155';
          ctx.fillRect(screenPlatX, plat.y, plat.width, 10);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          for (let bx = 0; bx < plat.width; bx += 28) {
            ctx.strokeRect(screenPlatX + bx, plat.y + 10, 28, 14);
            ctx.beginPath();
            ctx.moveTo(screenPlatX + bx, plat.y + 10);
            ctx.lineTo(screenPlatX + bx + 28, plat.y + 24);
            ctx.stroke();
          }
          ctx.fillStyle = '#facc15';
          for (let bx = 0; bx < plat.width; bx += 20) {
            ctx.fillRect(screenPlatX + bx, plat.y + 1, 10, 4);
          }

          if (plat.isExploding) {
            const fuseX = screenPlatX + Math.random() * plat.width;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(fuseX, plat.y - 4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(fuseX, plat.y - 4, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Mỏm vách đá núi lửa Galuga đích thực
          const rockGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
          rockGrad.addColorStop(0, '#3f2517');
          rockGrad.addColorStop(0.2, '#2d1a10');
          rockGrad.addColorStop(0.6, '#1e110a');
          rockGrad.addColorStop(1, '#100905');
          ctx.fillStyle = rockGrad;
          ctx.fillRect(screenPlatX, plat.y + 6, plat.width, plat.height - 6);

          ctx.strokeStyle = '#4a2c1b';
          ctx.lineWidth = 1.5;
          for (let bx = 0; bx < plat.width; bx += 32) {
            ctx.beginPath();
            ctx.moveTo(screenPlatX + bx, plat.y + 10);
            ctx.lineTo(screenPlatX + bx + 16, plat.y + 26);
            ctx.lineTo(screenPlatX + bx + 8, plat.y + plat.height);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.strokeRect(screenPlatX + bx + 2, plat.y + 12, 28, 18);
          }

          ctx.fillStyle = '#14532d';
          ctx.fillRect(screenPlatX, plat.y, plat.width, 8);

          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.moveTo(screenPlatX, plat.y);
          for (let gx = 0; gx <= plat.width; gx += 6) {
            const bladeH = ((gx * 7) % 5) + 3;
            ctx.lineTo(screenPlatX + gx, plat.y - bladeH);
            ctx.lineTo(screenPlatX + gx + 3, plat.y + 2);
          }
          ctx.lineTo(screenPlatX + plat.width, plat.y + 6);
          ctx.lineTo(screenPlatX, plat.y + 6);
          ctx.closePath();
          ctx.fill();

          for (let rx = 10; rx < plat.width - 10; rx += 24) {
            const rootLen = ((rx * 13) % 14) + 6;
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(screenPlatX + rx, plat.y + 6);
            ctx.quadraticCurveTo(screenPlatX + rx + 2, plat.y + 6 + rootLen / 2, screenPlatX + rx - 2, plat.y + 6 + rootLen);
            ctx.stroke();
          }
        }
      });

      // ------------------------------------------
      // C. VẼ CĂN CỨ PHÒNG THỦ RED FALCON (BOSS)
      // ------------------------------------------
      const boss = bossRef.current;
      const screenBossX = boss.x - camX;
      if (screenBossX < ARENA_WIDTH + 140 && screenBossX + boss.width > -140) {
        ctx.save();
        ctx.translate(screenBossX, boss.y);

        const wallGrad = ctx.createLinearGradient(0, 0, boss.width, boss.height);
        wallGrad.addColorStop(0, '#475569');
        wallGrad.addColorStop(0.5, '#334155');
        wallGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, boss.width, boss.height);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, boss.width, boss.height);

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        for (let py = 40; py < boss.height; py += 55) {
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(boss.width, py);
          ctx.stroke();

          for (let px = 20; px < boss.width; px += 40) {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(px, py - 4, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(10, 10, boss.width - 20, 8);
        ctx.fillRect(10, boss.height - 18, boss.width - 20, 8);

        if (boss.topTurretHp > 0) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(36, 60, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-24, 52, 36, 7);
          ctx.fillRect(-24, 63, 36, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-26, 52, 4, 18);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(8, 40, 56, 40);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(16, 50, 14, 12);
        }

        if (boss.bottomTurretHp > 0) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(36, 190, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-24, 182, 36, 7);
          ctx.fillRect(-24, 193, 36, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-26, 182, 4, 18);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(8, 170, 56, 40);
        }

        const coreY = 125;
        const pulse = Math.sin(Date.now() / 120) * 5;
        if (!boss.isCoreDestroyed) {
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.ellipse(36, coreY, 34, 30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();

          const coreGrad = ctx.createRadialGradient(36, coreY, 2, 36, coreY, 24 + pulse);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, '#fef08a');
          coreGrad.addColorStop(0.7, '#ef4444');
          coreGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(36, coreY, 22 + pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(36 - 15, coreY - 10);
          ctx.lineTo(36 - 5, coreY + 5);
          ctx.lineTo(36 + 15, coreY - 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(36, coreY, 28, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ------------------------------------------
      // D. VẼ QUÂN ĐỊCH - HÌNH THỂ NGƯỜI THẬT SỐNG ĐỘNG
      // ------------------------------------------
      enemiesRef.current.forEach((en) => {
        if (!en.isAlive) return;
        const sx = en.x - camX;
        if (sx < -70 || sx > ARENA_WIDTH + 70) return;

        ctx.save();
        ctx.translate(sx, en.y);

        if (en.type === 'runner') {
          // --- 1. BỘ BINH ĐỎ NGƯỜI THẬT SPRINT (HUMAN INFANTRY RUNNER) ---
          const isLeft = en.facing === 'left';
          const runLeg = Math.floor(Date.now() / 90) % 2 === 0;

          ctx.save();
          if (!isLeft) {
            ctx.scale(-1, 1);
            ctx.translate(-en.width, 0);
          }

          // Chân sau
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.moveTo(18, 28);
          ctx.lineTo(runLeg ? 26 : 10, 38);
          ctx.lineTo(runLeg ? 28 : 8, 46);
          ctx.lineTo(runLeg ? 22 : 4, 46);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(runLeg ? 22 : 4, 45, 11, 6);

          // Chân trước
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(14, 28);
          ctx.lineTo(runLeg ? 6 : 22, 38);
          ctx.lineTo(runLeg ? 4 : 26, 46);
          ctx.lineTo(runLeg ? 9 : 30, 46);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(runLeg ? 2 : 24, 45, 11, 6);

          // Thân người nghiêng lao về phía trước
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(10, 12);
          ctx.lineTo(24, 14);
          ctx.lineTo(20, 29);
          ctx.lineTo(9, 28);
          ctx.closePath();
          ctx.fill();

          // Dây đai trang bị chéo ngực & Túi đạn
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(11, 13);
          ctx.lineTo(21, 28);
          ctx.stroke();

          // Đầu & Mũ bảo hiểm quân sự đỏ có quai
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.ellipse(14, 6, 6, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(8, 6, 2, 2);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(6, 8, 2, 1.5);

          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.arc(14, 4, 7.5, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(6, 3, 14, 3);

          // Cánh tay và súng trường tiến công
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(12, 16, 5, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-6, 17, 22, 5);
          ctx.fillStyle = '#475569';
          ctx.fillRect(-10, 18, 6, 3);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(2, 22, 4, 6);

          ctx.restore();
        } else if (en.type === 'sniper') {
          // --- 2. LÍNH BẮN TỈA NGƯỜI THẬT TRONG CÔNG SỰ BAO CÁT (HOÀN TOÀN KHÔNG DÙNG HÌNH TRÒN KHỐI) ---
          const isFacingLeft = en.facing === 'left';

          // A. CÔNG SỰ BAO CÁT CHIẾN ĐẤU (Burlap Sandbags)
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.roundRect(0, 24, 22, 14, 5);
          ctx.roundRect(18, 24, 22, 14, 5);
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.roundRect(8, 14, 26, 13, 5);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.moveTo(12, 20); ctx.lineTo(30, 20);
          ctx.moveTo(4, 30); ctx.lineTo(18, 30);
          ctx.moveTo(22, 30); ctx.lineTo(36, 30);
          ctx.stroke();

          // B. NGƯỜI LÍNH BẮN TỈA QUỲ NGẮM BẮN
          ctx.save();
          if (!isFacingLeft) {
            ctx.scale(-1, 1);
            ctx.translate(-en.width, 0);
          }

          // Vai & Áo lính rằn ri ngụy trang
          ctx.fillStyle = '#14532d';
          ctx.beginPath();
          ctx.ellipse(22, 10, 9, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#166534';
          ctx.fillRect(16, 8, 5, 4);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(21, 11, 4, 3);

          // Cánh tay tì chắc súng
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.moveTo(20, 8);
          ctx.lineTo(8, 11);
          ctx.lineTo(6, 15);
          ctx.lineTo(18, 15);
          ctx.closePath();
          ctx.fill();

          // Đầu người lính & Kính ngắm quang học chuyên dụng
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(20, 3, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(12, 1, 6, 3.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(13, 1.5, 2, 1.5);

          // Mũ sắt ngụy trang lá cây
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(20, 1, 7.5, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#15803d';
          ctx.fillRect(14, -4, 4, 3);
          ctx.fillRect(20, -5, 5, 3);

          // C. SÚNG BẮN TỈA HẠNG NẶNG GÁC CHÂN TRÊN BAO CÁT
          // Giá 2 chân (Bipod)
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(8, 13); ctx.lineTo(4, 20);
          ctx.moveTo(8, 13); ctx.lineTo(12, 20);
          ctx.stroke();

          // Thân súng & Nòng súng giảm thanh dài
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(4, 9, 18, 5);
          ctx.fillStyle = '#334155';
          ctx.fillRect(-14, 10, 20, 3.5);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-18, 9, 5, 5.5);

          // Kính ngắm to phía trên
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(6, 5, 12, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, 6, 2.5, 2);

          // D. TIA LAZER ĐỊNH VỊ MỤC TIÊU
          const laserPulse = (Math.sin(Date.now() / 100) + 1) * 0.35 + 0.3;
          ctx.strokeStyle = `rgba(239, 68, 68, ${laserPulse})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-18, 11.5);
          ctx.lineTo(-450, 11.5);
          ctx.stroke();

          ctx.restore();
        } else if (en.type === 'turret') {
          // --- 3. THÁP PHÁO CƠ KHÍ XOAY 360 ĐỘ ---
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.strokeRect(en.width / 2 - 16, en.height / 2 - 16, 32, 32);

          ctx.save();
          ctx.translate(en.width / 2, en.height / 2);
          ctx.rotate(en.aimAngle || 0);

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(12, -6, 22, 5);
          ctx.fillRect(12, 1, 22, 5);

          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (en.type === 'wall_pod') {
          // --- 4. HỘP CẢM BIẾN VÁCH ĐÁ CHỨA VŨ KHÍ ---
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(0, 0, en.width, en.height, 8);
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          const eyePulse = Math.sin(Date.now() / 140) * 3.5;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 10 + eyePulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(en.width / 2 - 3, en.height / 2 - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (en.type === 'flying_capsule') {
          // --- 5. CHIM ƯNG KIM LOẠI ROBOT CƠ KHÍ BAY VỖ CÁNH (CYBER FALCON) ---
          const wingAngle = Math.sin(Date.now() / 70) * 0.45;

          ctx.save();
          ctx.translate(en.width / 2, en.height / 2);

          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1.5;

          ctx.save();
          ctx.rotate(wingAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-24, -14);
          ctx.lineTo(-20, 4);
          ctx.lineTo(-8, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.rotate(-wingAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(24, -14);
          ctx.lineTo(20, 4);
          ctx.lineTo(8, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(8, -2);
          ctx.lineTo(16, 0);
          ctx.lineTo(8, 3);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, -2, 2.5, 2);

          const jetPulse = Math.sin(Date.now() / 40) * 4;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-10, -2);
          ctx.lineTo(-18 - jetPulse, 0);
          ctx.lineTo(-10, 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 12, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#78350f';
          ctx.font = '900 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tag = en.itemDrop === 'spread' ? 'S' : en.itemDrop === 'laser' ? 'L' : en.itemDrop === 'machine' ? 'M' : 'B';
          ctx.fillText(tag, 0, 13);

          ctx.restore();
        }

        ctx.restore();
      });

      // ------------------------------------------
      // E. VẼ VẬT PHẨM VŨ KHÍ RƠI (WEAPON BADGES)
      // ------------------------------------------
      itemsRef.current.forEach((it) => {
        const sx = it.x - camX;
        ctx.save();
        ctx.translate(sx, it.y);

        const halo = Math.sin(Date.now() / 80) * 4;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 18 + halo, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(-9, -9);
        ctx.lineTo(-9, 9);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(9, -9);
        ctx.lineTo(9, 9);
        ctx.closePath();
        ctx.fill();

        const badgeGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 13);
        badgeGrad.addColorStop(0, '#ffffff');
        badgeGrad.addColorStop(0.35, '#facc15');
        badgeGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = badgeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#7c2d12';
        ctx.font = '900 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.letter, 0, 1);

        ctx.restore();
      });

      // ------------------------------------------
      // F. VẼ ĐẠN BAY VÀ HIỆU ỨNG ÁNH SÁNG
      // ------------------------------------------
      bulletsRef.current.forEach((b) => {
        const sx = b.x - camX;
        ctx.save();
        ctx.translate(sx, b.y);

        if (b.isSpread) {
          const fGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, b.radius + 4);
          fGrad.addColorStop(0, '#ffffff');
          fGrad.addColorStop(0.3, '#fef08a');
          fGrad.addColorStop(0.65, '#f97316');
          fGrad.addColorStop(1, '#dc2626');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius + 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.fillRect(-b.vx * 1.2, -b.vy * 1.2, 3, 3);
        } else if (b.isLaser) {
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-1, -1, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // ------------------------------------------
      // G. VẼ BIỆT KÍCH RAMBO BILL RIZER - HÌNH THỂ NGƯỜI THẬT GIẢI PHẪU CHUẨN XÁC
      // ------------------------------------------
      const p = playerRef.current;
      const screenPX = p.x - camX;

      ctx.save();
      ctx.translate(screenPX, p.y);

      if (p.barrierTimer > 0) {
        const bPulse = Math.sin(Date.now() / 70) * 5;
        const shieldColors = ['#ef4444', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'];
        ctx.strokeStyle = shieldColors[Math.floor(Date.now() / 80) % shieldColors.length];
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p.width / 2, p.height / 2, 38 + bPulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (p.isInvulnerable && Math.floor(Date.now() / 90) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      const fRight = p.facing === 'right';

      if (p.isInWater) {
        // --- 1. TƯ THẾ BƠI LẶN DƯỚI NƯỚC (SWIMMING) ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(p.width / 2, p.height - 16, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(16, p.height - 24, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? 18 : 12, p.height - 26, 2.5, 2.5);

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(16, p.height - 28, 8, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(11, p.height - 32, 10, 4);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(8, p.height - 27, 16, 4);
        ctx.beginPath();
        ctx.moveTo(fRight ? 8 : 24, p.height - 25);
        ctx.lineTo(fRight ? -6 : 38, p.height - 23 + Math.sin(Date.now() / 90) * 3);
        ctx.lineTo(fRight ? 8 : 24, p.height - 22);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? 18 : -10, p.height - 28, 24, 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(fRight ? 22 : -6, p.height - 30, 10, 3);
      } else if (!p.isGrounded && p.isJumping) {
        // --- 2. NHẢY LỘN NHÀO CUỘN TRÒN QUẢ CẦU (SOMERSAULT SPINNING BALL) ---
        ctx.save();
        ctx.translate(p.width / 2, p.height / 2);
        ctx.rotate(p.spinAngle);

        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(6, -2, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(8, -6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-4, -14);
        ctx.quadraticCurveTo(-18, -12, -26, 0);
        ctx.lineTo(-20, 0);
        ctx.quadraticCurveTo(-14, -8, -2, -10);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, 6, 16, 6);

        ctx.restore();
      } else if (p.isProne) {
        // --- 3. TƯ THẾ NẰM RẠP BẮN SÁT MẶT ĐẤT (PRONE CRAWL) ---
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.ellipse(fRight ? 8 : 24, p.height - 9, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? -6 : 32, p.height - 13, 8, 8);

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(fRight ? 22 : 10, p.height - 11, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(fRight ? 20 : 8, p.height - 12, 5, 4);

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(fRight ? 28 : 4, p.height - 17, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? 31 : 3, p.height - 18, 2, 2);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(fRight ? 24 : 0, p.height - 20, 10, 3.5);
        ctx.beginPath();
        ctx.moveTo(fRight ? 24 : 10, p.height - 19);
        ctx.lineTo(fRight ? 12 : 22, p.height - 17);
        ctx.lineTo(fRight ? 24 : 10, p.height - 15);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? 26 : -18, p.height - 9, 26, 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(fRight ? 30 : -14, p.height - 11, 10, 3);

        if (p.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fRight ? 54 : -20, p.height - 6, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // --- 4. TƯ THẾ ĐỨNG VÀ CHẠY CHI TIẾT NGƯỜI THẬT (RUN & SHOOT) ---
        // A. CHÂN & ỦNG CHIẾN ĐẤU (Articulated Human Legs)
        const legOffsets = [
          { hip1: -6, hip2: 8, k1: -4, k2: 12, f1: -8, f2: 16 },
          { hip1: 0, hip2: 0, k1: 0, k2: 0, f1: 0, f2: 0 },
          { hip1: 8, hip2: -6, k1: 12, k2: -4, f1: 16, f2: -8 },
          { hip1: 0, hip2: 0, k1: 0, k2: 0, f1: 0, f2: 0 },
        ];
        const anim = legOffsets[p.runFrame];

        // Chân sau
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(18, 30);
        ctx.lineTo(19 + anim.hip2, 40);
        ctx.lineTo(19 + anim.k2, 48);
        ctx.lineTo(17 + anim.k2, 48);
        ctx.lineTo(15 + anim.hip2, 40);
        ctx.lineTo(15, 30);
        ctx.closePath();
        ctx.fill();

        // Ủng chân sau
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(14 + anim.f2, 48, 12, 8);
        ctx.fillStyle = '#334155';
        ctx.fillRect(14 + anim.f2, 54, 12, 2);

        // Chân trước
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(13, 30);
        ctx.lineTo(13 + anim.hip1, 40);
        ctx.lineTo(13 + anim.k1, 48);
        ctx.lineTo(9 + anim.k1, 48);
        ctx.lineTo(9 + anim.hip1, 40);
        ctx.lineTo(10, 30);
        ctx.closePath();
        ctx.fill();

        // Miếng đệm đầu gối (Kneepad)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(11 + anim.hip1, 40, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ủng chân trước
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(8 + anim.f1, 48, 12, 8);
        ctx.fillStyle = '#475569';
        ctx.fillRect(8 + anim.f1, 48, 12, 2.5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(8 + anim.f1, 54, 12, 2);

        // B. HÔNG & THẮT LƯNG QUÂN SỰ
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(9, 28, 16, 5);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(15, 29, 4, 3);

        // C. CƠ BẮP NGỰC TRẦN & ĐAI ĐẠN CHIẾN THUẬT
        const torsoGrad = ctx.createLinearGradient(9, 12, 25, 28);
        torsoGrad.addColorStop(0, '#ffedd5');
        torsoGrad.addColorStop(0.5, '#fed7aa');
        torsoGrad.addColorStop(1, '#fba86b');
        ctx.fillStyle = torsoGrad;
        ctx.beginPath();
        ctx.moveTo(9, 14);
        ctx.lineTo(25, 14);
        ctx.lineTo(23, 28);
        ctx.lineTo(11, 28);
        ctx.closePath();
        ctx.fill();

        // Rãnh ngực & cơ bụng 6 múi
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(17, 14);
        ctx.lineTo(17, 24);
        ctx.moveTo(11, 19);
        ctx.quadraticCurveTo(14, 21, 17, 19);
        ctx.quadraticCurveTo(20, 21, 23, 19);
        ctx.moveTo(13, 22);
        ctx.lineTo(21, 22);
        ctx.moveTo(13, 25);
        ctx.lineTo(21, 25);
        ctx.stroke();

        // Dây đai đeo đạn chéo qua vai
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(10, 13);
        ctx.lineTo(24, 29);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.fillRect(16, 20, 3, 4);

        // D. ĐẦU, KHUÔN MẶT, TÓC & BĂNG ĐÔ ĐỎ
        ctx.fillStyle = '#fba86b';
        ctx.fillRect(15, 11, 4, 4);

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.moveTo(11, 6);
        ctx.lineTo(23, 6);
        ctx.lineTo(21, 14);
        ctx.quadraticCurveTo(17, 16, 13, 14);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.fillRect(fRight ? 19 : 13, 8, 3, 1.5);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fRight ? 20 : 13, 9.5, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fRight ? 19 : 14, 9.5, 1, 1);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(fRight ? 22 : 11, 11, 2, 1.5);

        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.lineTo(8, 2);
        ctx.lineTo(13, -2);
        ctx.lineTo(17, 0);
        ctx.lineTo(21, -2);
        ctx.lineTo(25, 3);
        ctx.lineTo(23, 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.fillRect(12, 0, 7, 3);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(9, 5, 15, 3.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 5.5, 10, 1);

        // Đuôi khăn rằn đỏ bay phấp phới trong gió
        const ribW1 = Math.sin(Date.now() / 70) * 4.5;
        const ribW2 = Math.cos(Date.now() / 90) * 3;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(fRight ? 9 : 25, 6);
        ctx.quadraticCurveTo(fRight ? 0 : 34, 6 + ribW1, fRight ? -14 : 48, 6 + ribW1 + ribW2);
        ctx.lineTo(fRight ? -12 : 46, 10 + ribW1 + ribW2);
        ctx.quadraticCurveTo(fRight ? 0 : 34, 9 + ribW1, fRight ? 9 : 25, 8.5);
        ctx.closePath();
        ctx.fill();

        // E. CÁNH TAY CƠ BẮP & SÚNG TRƯỜNG TẤN CÔNG (Assault Rifle)
        ctx.save();
        const pivotX = fRight ? 16 : 18;
        const pivotY = 18;
        ctx.translate(pivotX, pivotY);

        let gunAngle = 0;
        if (p.aimDir === 'up') gunAngle = -Math.PI / 2;
        else if (p.aimDir === 'up-right') gunAngle = -Math.PI / 4;
        else if (p.aimDir === 'up-left') gunAngle = -Math.PI * 3 / 4;
        else if (p.aimDir === 'down-right') gunAngle = Math.PI / 4;
        else if (p.aimDir === 'down-left') gunAngle = Math.PI * 3 / 4;
        else gunAngle = fRight ? 0 : Math.PI;

        ctx.rotate(gunAngle);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, -3, 14, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, -2.5, 16, 5);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(20, -1.5, 10, 3);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(28, -2.5, 3, 5);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, -6, 8, 3.5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(14, -5.5, 2, 2);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(6, 3);
        ctx.lineTo(10, 11);
        ctx.lineTo(6, 12);
        ctx.lineTo(3, 3);
        ctx.closePath();
        ctx.fill();

        if (p.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(36, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(36, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(31, -2, 10, 4);
        }

        ctx.restore();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(14, 18, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fba86b';
        ctx.beginPath();
        ctx.ellipse(fRight ? 20 : 8, 20, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(fRight ? 22 : 6, 18, 4, 4);
      }

      ctx.restore();

      // H. HẠT NỔ & CHỮ NỔI
      particlesRef.current.forEach((pt) => {
        const sx = pt.x - camX;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(sx, pt.y, Math.max(1, pt.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      floatingTextsRef.current.forEach((ft) => {
        const sx = ft.x - camX;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = '900 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, sx, ft.y);
        ctx.globalAlpha = 1.0;
      });

      // ==========================================
      // I. SIDEBAR RADAR CHIẾN THUẬT (204px)
      // ==========================================
      ctx.fillStyle = '#090d16';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X, 0);
      ctx.lineTo(SIDEBAR_X, CANVAS_HEIGHT);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CONTRA COMMAND', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // 1. Huy hiệu vũ khí
      const wbX = SIDEBAR_X + 16;
      const wbY = 46;
      const wbW = SIDEBAR_WIDTH - 32;
      const wbH = 50;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(wbX, wbY, wbW, wbH, 10);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      const curW = weaponRef.current;
      ctx.fillStyle = curW === 'spread' ? '#ef4444' : curW === 'laser' ? '#38bdf8' : curW === 'machine' ? '#facc15' : '#e2e8f0';
      ctx.font = 'black 20px monospace';
      const wLabel = curW === 'spread' ? '[ S ] SPREAD' : curW === 'laser' ? '[ L ] LASER' : curW === 'machine' ? '[ M ] MACHINE' : '[ R ] RIFLE';
      ctx.fillText(wLabel, SIDEBAR_X + SIDEBAR_WIDTH / 2, wbY + 32);

      // 2. Mạng biệt kích (Lives) - Căn giữa chuẩn xác trục tâm
      const livesY = 120;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('QUÂN SỐ MẠNG', SIDEBAR_X + SIDEBAR_WIDTH / 2, livesY);

      const spacing = 36;
      const centerX = SIDEBAR_X + SIDEBAR_WIDTH / 2;
      const curLives = livesRef.current;
      for (let i = 0; i < 3; i++) {
        const lx = centerX + (i - 1) * spacing;
        const ly = livesY + 24;
        const hasLife = i < curLives;

        ctx.fillStyle = hasLife ? '#dc2626' : '#1e293b';
        ctx.beginPath();
        ctx.arc(lx, ly, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hasLife ? '#f87171' : '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = hasLife ? '#ffffff' : '#64748b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(hasLife ? '♥' : '✕', lx, ly);
      }

      // 3. Tiến độ chiến dịch
      const progBoxY = 180;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, progBoxY, SIDEBAR_WIDTH - 32, 85, 10);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('TIẾN ĐỘ CHIẾN DỊCH', SIDEBAR_X + SIDEBAR_WIDTH / 2, progBoxY + 22);

      const progRatio = Math.min(1, Math.max(0, p.x / BOSS_X));
      ctx.fillStyle = '#334155';
      ctx.fillRect(SIDEBAR_X + 26, progBoxY + 36, SIDEBAR_WIDTH - 52, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(SIDEBAR_X + 26, progBoxY + 36, (SIDEBAR_WIDTH - 52) * progRatio, 14);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${Math.round(progRatio * 100)}% [BOSS]`, SIDEBAR_X + SIDEBAR_WIDTH / 2, progBoxY + 68);

      // 4. Kẻ địch tiêu diệt
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`ĐÃ DIỆT: ${enemiesKilledRef.current} ĐỊCH`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 295);

      // 5. Điểm số chiến trường
      const scoreBoxY = 320;
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
      ctx.fillText(`${scoreRef.current.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 54);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 425);

      if (boss.isAlive && p.x > BOSS_X - 600) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`LÕI TRÙM: ${Math.round((boss.coreHp / boss.maxCoreHp) * 100)}%`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 470);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [handlePlayerShoot, highScore, playExplosionSound, playPowerupSound, triggerShake]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('acegames_contra_highscore', score.toString());
      } catch {
        // ignore
      }
    }
  }, [score, highScore]);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* 3-Column Top HUD Bar */}
      <div className="relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-2 mb-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm">
        {/* Cột 1: Thông tin chế độ */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 font-bold border border-red-500/30">
            <Flame className="w-4 h-4 text-red-400" />
            <span className="capitalize">
              {gameMode === 'classic' ? 'Cổ Điển' : gameMode === 'speed' ? 'Tốc Độ' : 'Chiến Tướng'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 text-gray-300 font-medium border border-white/5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Màn {stage} • Rừng Galuga</span>
          </div>
        </div>

        {/* Cột 2: Điểm số & Mạng - CĂN CHÍNH GIỮA TUYỆT ĐỐI 50% THANH HUD */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-6 font-mono font-bold pointer-events-none">
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
            <Shield className="w-4 h-4" />
            <span className="text-sm sm:text-base uppercase">{weapon}</span>
          </div>
        </div>

        {/* Cột 3: Nút điều khiển Tạm dừng & Chơi lại */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsPaused((p) => {
                isPausedRef.current = !p;
                return !p;
              });
            }}
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
        className={`relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center transition-transform duration-75 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Cụm nút ảo Mobile D-Pad & Nút Bắn / Nhảy */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:hidden z-30">
          <div />
          <div className="flex items-end justify-between w-full pointer-events-auto">
            <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <div />
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowUp'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowUp'] = false; }}
                className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 flex items-center justify-center text-white"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onTouchStart={() => { keysPressedRef.current['ArrowLeft'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowLeft'] = false; }}
                className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div />
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowRight'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowRight'] = false; }}
                className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 flex items-center justify-center text-white"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowDown'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowDown'] = false; }}
                className="w-11 h-11 rounded-xl bg-slate-800/90 active:bg-cyan-600 flex items-center justify-center text-white"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            <div className="flex items-center gap-3">
              <button
                onTouchStart={handlePlayerJump}
                className="w-14 h-14 rounded-full bg-blue-600/90 active:bg-blue-500 border-2 border-blue-400 flex items-center justify-center text-white font-black text-sm shadow-lg active:scale-95"
              >
                NHẢY
              </button>
              <button
                onTouchStart={handlePlayerShoot}
                className="w-16 h-16 rounded-full bg-red-600/90 active:bg-red-500 border-2 border-red-400 flex items-center justify-center text-white font-black text-base shadow-lg active:scale-95"
              >
                BẮN
              </button>
            </div>
          </div>
        </div>

        {/* Màn hình Tạm dừng */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in duration-150">
            <span className="text-4xl mb-3">⏸️</span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              TẠM DỪNG CHIẾN DỊCH
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Bấm [P] hoặc nút Tiếp tục để trở lại trận địa Galuga
            </p>
            <button
              onClick={() => {
                setIsPaused(false);
                isPausedRef.current = false;
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiếp Tục
            </button>
          </div>
        )}

        {/* Modal Chiến Thắng (Phá hủy căn cứ) */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl sm:text-3xl font-black text-red-400 mb-1 tracking-wider uppercase">
              CĂN CỨ RED FALCON ĐÃ BỊ PHÁ HỦY!
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              Bạn đã tiêu diệt pháo đài phòng thủ đảo Galuga và hoàn thành xuất sắc chiến dịch.
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-red-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiến Vào Màn {stage + 1}
            </button>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💥</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              BIỆT KÍCH ĐÃ HY SINH!
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Điểm số: <span className="font-mono text-amber-400 font-bold">{score.toLocaleString()}</span> • Địch đã diệt: <span className="font-mono text-cyan-400 font-bold">{enemiesKilled}</span>
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
