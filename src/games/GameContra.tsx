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

  // Mặt đất chính (xen kẽ hào nước và cầu nổ)
  list.push({ x: 0, y: 440, width: 920, height: 100 });
  
  // Cầu treo số 1 (Cầu phát nổ khi bước lên)
  list.push({ x: 920, y: 440, width: 320, height: 24, isBridge: true });
  list.push({ x: 920, y: 480, width: 320, height: 60, isWater: true }); // Nước dưới cầu 1

  list.push({ x: 1240, y: 440, width: 880, height: 100 });

  // Cầu treo số 2 qua sông sâu
  list.push({ x: 2120, y: 440, width: 360, height: 24, isBridge: true });
  list.push({ x: 2120, y: 480, width: 360, height: 60, isWater: true }); // Nước dưới cầu 2

  // Tiền đồn và sân trước căn cứ Boss Red Falcon
  list.push({ x: 2480, y: 440, width: 1800, height: 100 });

  // Các mỏm đá tầng 2 và tầng 3 để nhảy bắn ngắm cao
  const ledges = [
    { x: 180, y: 340, width: 190, height: 22 },
    { x: 420, y: 250, width: 230, height: 22 },
    { x: 720, y: 340, width: 180, height: 22 },
    { x: 1350, y: 350, width: 200, height: 22 },
    { x: 1600, y: 260, width: 220, height: 22 },
    { x: 1860, y: 350, width: 180, height: 22 },
    { x: 2580, y: 340, width: 210, height: 22 },
    { x: 2860, y: 250, width: 240, height: 22 },
    { x: 3180, y: 350, width: 220, height: 22 },
    { x: 3480, y: 300, width: 200, height: 22 },
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

  // References độc lập cho game loop 60 FPS (Không gây re-render hay giật lag)
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const weaponRef = useRef<WeaponType>('normal');
  const stageRef = useRef<number>(1);
  const enemiesKilledRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  const isVictoryRef = useRef<boolean>(false);
  const gameModeRef = useRef<GameMode>('classic');

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
    width: 32,
    height: 56,
    vx: 0,
    vy: 0,
    facing: 'right' as 'left' | 'right',
    aimDir: 'right' as 'right' | 'left' | 'up' | 'down' | 'up-right' | 'up-left' | 'down-right' | 'down-left',
    isGrounded: false,
    isJumping: false,
    isProne: false, // Nằm rạp người bắn
    isInWater: false,
    isInvulnerable: false,
    invulnerableTimer: 0,
    barrierTimer: 0,
    shootCooldown: 0,
    spinAngle: 0, // Góc xoay lộn nhào khi nhảy
    runAnimTimer: 0,
    runFrame: 0,
    muzzleFlashTimer: 0,
  });

  // Boss Căn cứ Phòng thủ Red Falcon (Gromaides Stage 1)
  const bossRef = useRef({
    x: BOSS_X,
    y: 160,
    width: 220,
    height: 280,
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
      // Tiếng đạn chùm S dội lửa nặng hạt
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (wType === 'laser') {
      // Tiếng laser năng lượng cao quét
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
      // Súng máy / Rifle thường
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

  // Spawn hiệu ứng hạt nổ rực lửa
  const createExplosion = (x: number, y: number, count: number = 18, colorTheme: 'fire' | 'metal' = 'fire') => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 1.5;
      const colors = colorTheme === 'fire' 
        ? ['#fef08a', '#f97316', '#ef4444', '#dc2626', '#ffffff'] 
        : ['#94a3b8', '#64748b', '#cbd5e1', '#f59e0b'];
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 25 + 20),
        sizeDecay: 0.95,
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

    playerRef.current = {
      x: 80,
      y: 380,
      width: 32,
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
      y: 160,
      width: 220,
      height: 280,
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

    // Khởi tạo các trạm lính canh, tháp pháo và hộp phần thưởng dọc đường
    const initialEnemies: Enemy[] = [
      // 1. Lính bắn tỉa ẩn nấp trên mỏm đá đầu tiên
      { id: 1, type: 'sniper', x: 520, y: 200, width: 34, height: 48, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 1.8, facing: 'left', isAlive: true },
      // 2. Tháp pháo xoay 360 độ trên vách đá
      { id: 2, type: 'turret', x: 820, y: 300, width: 40, height: 40, vx: 0, vy: 0, hp: 12, maxHp: 12, shootCooldown: 2.2, facing: 'left', isAlive: true, aimAngle: Math.PI },
      // 3. Hộp cảm biến vách đá chứa ĐẠN SPREAD (S)
      { id: 3, type: 'wall_pod', x: 680, y: 270, width: 36, height: 36, vx: 0, vy: 0, hp: 4, maxHp: 4, shootCooldown: 999, facing: 'left', itemDrop: 'spread', isAlive: true },
      // 4. Chim ưng bay mang ĐẠN MACHINE (M)
      { id: 4, type: 'flying_capsule', x: 450, y: 150, width: 38, height: 26, vx: 2.2, vy: 0, hp: 1, maxHp: 1, shootCooldown: 999, facing: 'right', itemDrop: 'machine', isAlive: true, sineTime: 0 },
      // 5. Tháp pháo và lính bắn tỉa đoạn giữa
      { id: 5, type: 'sniper', x: 1720, y: 210, width: 34, height: 48, vx: 0, vy: 0, hp: 8, maxHp: 8, shootCooldown: 1.6, facing: 'left', isAlive: true },
      { id: 6, type: 'turret', x: 1940, y: 310, width: 40, height: 40, vx: 0, vy: 0, hp: 14, maxHp: 14, shootCooldown: 2.0, facing: 'left', isAlive: true, aimAngle: Math.PI },
      // 6. Hộp cảm biến chứa LASER (L)
      { id: 7, type: 'wall_pod', x: 1520, y: 280, width: 36, height: 36, vx: 0, vy: 0, hp: 5, maxHp: 5, shootCooldown: 999, facing: 'left', itemDrop: 'laser', isAlive: true },
      // 7. Chim ưng bay mang KHIÊN BẤT TỬ (B)
      { id: 8, type: 'flying_capsule', x: 1650, y: 140, width: 38, height: 26, vx: 2.4, vy: 0, hp: 1, maxHp: 1, shootCooldown: 999, facing: 'right', itemDrop: 'barrier', isAlive: true, sineTime: 1.5 },
      // 8. Tiền đồn trước căn cứ Boss
      { id: 9, type: 'sniper', x: 2980, y: 200, width: 34, height: 48, vx: 0, vy: 0, hp: 10, maxHp: 10, shootCooldown: 1.5, facing: 'left', isAlive: true },
      { id: 10, type: 'turret', x: 3260, y: 310, width: 40, height: 40, vx: 0, vy: 0, hp: 16, maxHp: 16, shootCooldown: 1.8, facing: 'left', isAlive: true, aimAngle: Math.PI },
      { id: 11, type: 'wall_pod', x: 2750, y: 270, width: 36, height: 36, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 999, facing: 'left', itemDrop: 'spread', isAlive: true },
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

  // Sang màn kế tiếp
  const nextStage = useCallback(() => {
    setStage((s) => {
      const nextS = s + 1;
      stageRef.current = nextS;
      return nextS;
    });
    resetGame();
  }, [resetGame]);

  // Hành động Bắn đạn của người chơi
  const handlePlayerShoot = useCallback(() => {
    const p = playerRef.current;
    if (p.shootCooldown > 0 || isPausedRef.current || isGameOverRef.current || isVictoryRef.current) return;

    // Tính vector góc bắn theo hướng ngắm 8 chiều
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

    const startX = p.x + (dirX > 0 ? p.width + 10 : dirX < 0 ? -10 : p.width / 2);
    const startY = p.isProne 
      ? p.y + p.height - 12 
      : p.y + (dirY < 0 ? -6 : dirY > 0 ? p.height + 6 : 22);

    const speed = 15;
    const curWeapon = weaponRef.current;
    playShootSound(curWeapon);
    p.muzzleFlashTimer = 0.08;

    if (curWeapon === 'spread') {
      // ĐẠN HOA CẢI (SPREAD GUN S) 5 TIA TỎA RỰC RỠ VỚI ĐƯỜNG BAY ĐẬM CHẤT CONTRA
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
          radius: 6,
          color: '#ef4444',
          isPlayer: true,
          damage: 2,
          isSpread: true,
        });
      });
      p.shootCooldown = 0.18;
    } else if (curWeapon === 'laser') {
      // SÚNG LASER TIA CHÙM NĂNG LƯỢNG XUYÊN PHÁ ĐA MỤC TIÊU
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: dirX * speed * 1.4,
        vy: dirY * speed * 1.4,
        radius: 5,
        color: '#06b6d4',
        isPlayer: true,
        damage: 4,
        isLaser: true,
        pierce: 3,
      });
      p.shootCooldown = 0.22;
    } else {
      // SÚNG MÁY / RIFLE TIÊU CHUẨN
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: dirX * speed,
        vy: dirY * speed,
        radius: 4,
        color: '#facc15',
        isPlayer: true,
        damage: 1,
      });
      p.shootCooldown = curWeapon === 'machine' ? 0.09 : 0.16;
    }
  }, [playShootSound]);

  // Hành động Nhảy của người chơi (Bấm K, Space hoặc X - KHÔNG BẤM W)
  const handlePlayerJump = useCallback(() => {
    const p = playerRef.current;
    if (isPausedRef.current || isGameOverRef.current || isVictoryRef.current) return;

    const keys = keysPressedRef.current;
    const isHoldingDown = keys['ArrowDown'] || keys['KeyS'];

    if (p.isGrounded) {
      if (isHoldingDown) {
        // Tụt xuống tầng dưới (Drop down platform)
        p.y += 14;
        p.isGrounded = false;
        p.vy = 4;
      } else {
        // Nhảy lộn nhào lên cao
        p.vy = -12.5;
        p.isGrounded = false;
        p.isJumping = true;
        p.spinAngle = 0;
        playJumpSound();
      }
    }
  }, [playJumpSound]);

  // Lắng nghe bàn phím độc lập
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

      // CHỈ NHẢY KHI BẤM PHÍM NHẢY: Space, KeyK, KeyX (Phím W và ArrowUp chỉ để NGẮM BẮN LÊN CAO)
      if (e.code === 'KeyK' || e.code === 'KeyX' || e.code === 'Space') {
        handlePlayerJump();
      }

      // BẮN PHÍM J, Z, C
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

  // Khởi tạo game ban đầu 1 lần
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Main Game Loop 60 FPS Độc Lập - MƯỢT MÀ KHÔNG BỊ KHỞI TẠO LẠI KHI STATE ĐỔI
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

      // Khớp chuẩn Retina High-DPI
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

        // Giảm hồi chiêu bắn & bất tử
        if (p.shootCooldown > 0) p.shootCooldown -= dt;
        if (p.muzzleFlashTimer > 0) p.muzzleFlashTimer -= dt;
        if (p.isInvulnerable) {
          p.invulnerableTimer -= dt;
          if (p.invulnerableTimer <= 0) p.isInvulnerable = false;
        }
        if (p.barrierTimer > 0) p.barrierTimer -= dt;

        // A. XÁC ĐỊNH HƯỚNG NGẮM BẮN (8 Directions Aiming)
        const isLeft = keys['ArrowLeft'] || keys['KeyA'];
        const isRight = keys['ArrowRight'] || keys['KeyD'];
        const isUp = keys['ArrowUp'] || keys['KeyW'];
        const isDown = keys['ArrowDown'] || keys['KeyS'];

        if (isRight) p.facing = 'right';
        if (isLeft) p.facing = 'left';

        // Tư thế nằm rạp người né đạn trên mặt đất (Prone)
        p.isProne = isDown && p.isGrounded && !isLeft && !isRight;

        // Tính toán hướng ngắm nòng súng 8 chiều
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

        // B. DI CHUYỂN NGANG & ANIMATION CHẠY
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

        // Giữ người chơi không lùi quá mép trái của camera
        if (p.x < cameraXRef.current + 10) {
          p.x = cameraXRef.current + 10;
        }

        // BẮN TỰ ĐỘNG KHI GIỮ PHÍM BẮN (Auto-Fire trên J, Z, C)
        if (keys['KeyJ'] || keys['KeyZ'] || keys['KeyC']) {
          handlePlayerShoot();
        }

        // C. TRỌNG LỰC & VA CHẠM ĐỊA HÌNH
        const gravity = 32;
        p.vy += gravity * dt;
        p.y += p.vy;

        p.isGrounded = false;
        p.isInWater = false;

        platformsRef.current.forEach((plat) => {
          if (plat.isDestroyed) return;

          // Va chạm mặt trên của bệ đá (One-way platform)
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

            // Kích hoạt nổ cầu treo khi nhân vật đặt chân lên
            if (plat.isBridge && !plat.isExploding && !plat.isDestroyed) {
              plat.isExploding = true;
              plat.explodeTimer = 0.45;
            }
          }
        });

        // Xử lý nổ sập từng nhịp của cầu treo
        platformsRef.current.forEach((plat) => {
          if (plat.isBridge && plat.isExploding && !plat.isDestroyed) {
            plat.explodeTimer = (plat.explodeTimer || 0) - dt;
            if (plat.explodeTimer <= 0) {
              plat.isDestroyed = true;
              plat.isExploding = false;
              createExplosion(plat.x + plat.width / 2, plat.y + 10, 24, 'fire');
              playExplosionSound();
              triggerShake();
            }
          }
        });

        // Xoay somersault lộn nhào khi đang nhảy
        if (!p.isGrounded && p.isJumping) {
          p.spinAngle += (p.facing === 'right' ? 1 : -1) * 16 * dt;
        }

        // Rơi xuống hố vực sâu mất 1 mạng
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

          // Hồi sinh từ trực thăng nhảy dù trên không
          p.x = cameraXRef.current + 100;
          p.y = 80;
          p.vy = 0;
          p.isInvulnerable = true;
          p.invulnerableTimer = 3.0;
          triggerShake();
        }

        // D. CAMERA CUỘN MÀN HÌNH THEO NHÂN VẬT (Side-scrolling camera)
        const targetCamX = p.x - ARENA_WIDTH * 0.38;
        if (targetCamX > cameraXRef.current) {
          cameraXRef.current = Math.min(targetCamX, BOSS_X - ARENA_WIDTH + 240);
        }

        // E. CẬP NHẬT QUÂN ĐỊCH
        enemiesRef.current.forEach((en) => {
          if (!en.isAlive) return;

          if (en.type === 'runner') {
            // Bộ binh đỏ lao về phía người chơi
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

            // Va chạm cơ thể với người chơi
            if (
              !p.isInvulnerable &&
              p.barrierTimer <= 0 &&
              Math.abs(p.x + p.width / 2 - (en.x + en.width / 2)) < 22 &&
              Math.abs(p.y + p.height / 2 - (en.y + en.height / 2)) < 30
            ) {
              en.isAlive = false;
              createExplosion(en.x + en.width / 2, en.y + en.height / 2, 16, 'fire');
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
            // Lính bắn tỉa ngắm người chơi và bắn định kỳ
            en.facing = p.x < en.x ? 'left' : 'right';
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && Math.abs(en.x - p.x) < 550) {
              en.shootCooldown = 2.2;
              const angle = Math.atan2((p.y + 20) - en.y, (p.x + 10) - en.x);
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: en.x + (en.facing === 'left' ? -6 : en.width + 6),
                y: en.y + 16,
                vx: Math.cos(angle) * 7.5,
                vy: Math.sin(angle) * 7.5,
                radius: 4,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
          } else if (en.type === 'turret') {
            // Tháp pháo xoay 360 độ ngắm thẳng theo Bill Rizer
            const dx = (p.x + p.width / 2) - (en.x + en.width / 2);
            const dy = (p.y + p.height / 2) - (en.y + en.height / 2);
            en.aimAngle = Math.atan2(dy, dx);
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && Math.abs(dx) < 580) {
              en.shootCooldown = 2.0;
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: en.x + en.width / 2 + Math.cos(en.aimAngle) * 20,
                y: en.y + en.height / 2 + Math.sin(en.aimAngle) * 20,
                vx: Math.cos(en.aimAngle) * 8,
                vy: Math.sin(en.aimAngle) * 8,
                radius: 4.5,
                color: '#ef4444',
                isPlayer: false,
                damage: 1,
              });
            }
          } else if (en.type === 'flying_capsule') {
            // Chim ưng bay lượn hình sin mang vũ khí
            en.sineTime = (en.sineTime || 0) + dt * 3.5;
            en.x += en.vx * 60 * dt;
            en.y = 140 + Math.sin(en.sineTime) * 35;
          }
        });

        // Sinh lính bộ binh chạy ngẫu nhiên (Runners)
        if (Math.random() < 0.025 && p.x < BOSS_X - 500) {
          const spawnAhead = Math.random() < 0.7;
          const spawnX = spawnAhead ? cameraXRef.current + ARENA_WIDTH + 30 : cameraXRef.current - 20;
          enemiesRef.current.push({
            id: Date.now() + Math.random(),
            type: 'runner',
            x: spawnX,
            y: 380,
            width: 28,
            height: 48,
            vx: spawnAhead ? -120 : 120,
            vy: 0,
            hp: 2,
            maxHp: 2,
            shootCooldown: 999,
            facing: spawnAhead ? 'left' : 'right',
            isAlive: true,
          });
        }

        // Sinh chim ưng bay mang vũ khí định kỳ
        if (Math.random() < 0.005 && itemsRef.current.length === 0) {
          const wChoices: WeaponType[] = ['spread', 'machine', 'laser', 'barrier'];
          const pickedW = wChoices[Math.floor(Math.random() * wChoices.length)];
          enemiesRef.current.push({
            id: Date.now() + Math.random(),
            type: 'flying_capsule',
            x: cameraXRef.current - 40,
            y: 130,
            width: 38,
            height: 26,
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

        // F. CẬP NHẬT BOSS CĂN CỨ RED FALCON
        const boss = bossRef.current;
        if (boss.isAlive && p.x > BOSS_X - 650) {
          boss.shootTimer += dt;
          boss.pulseTime += dt;

          if (boss.shootTimer > 2.0) {
            boss.shootTimer = 0;
            // Tháp trên bắn loạt đạn pháo
            if (boss.topTurretHp > 0) {
              const ang = Math.atan2((p.y + 20) - (boss.y + 60), (p.x + 10) - (boss.x + 20));
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 60,
                vx: Math.cos(ang) * 9,
                vy: Math.sin(ang) * 9,
                radius: 5,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
            // Tháp dưới bắn
            if (boss.bottomTurretHp > 0) {
              const ang = Math.atan2((p.y + 20) - (boss.y + 190), (p.x + 10) - (boss.x + 20));
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 190,
                vx: Math.cos(ang) * 9,
                vy: Math.sin(ang) * 9,
                radius: 5,
                color: '#f87171',
                isPlayer: false,
                damage: 1,
              });
            }
          }
        }

        // G. CẬP NHẬT VÀ XỬ LÝ VA CHẠM ĐẠN (BULLETS)
        bulletsRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;

          if (b.isPlayer) {
            // Đạn của người chơi va chạm Quân địch
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

                // Tia lửa va chạm
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
                  createExplosion(en.x + en.width / 2, en.y + en.height / 2, 18, 'fire');

                  // Rơi huy hiệu vũ khí nếu có
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
                      vy: -3.5,
                      isAlive: true,
                      letter: letters[en.itemDrop] || 'S',
                    });
                  }
                }
              }
            });

            // Đạn người chơi bắn trúng Boss
            if (
              boss.isAlive &&
              b.damage > 0 &&
              b.x > boss.x &&
              b.x < boss.x + boss.width &&
              b.y > boss.y &&
              b.y < boss.y + boss.height
            ) {
              createExplosion(b.x, b.y, 8, 'metal');

              // Bắn vào Tháp trên
              if (b.y < boss.y + 100 && boss.topTurretHp > 0) {
                boss.topTurretHp -= b.damage;
                b.damage = 0;
                if (boss.topTurretHp <= 0) {
                  setScore((s) => s + 500);
                  scoreRef.current += 500;
                  createExplosion(boss.x + 30, boss.y + 65, 25, 'fire');
                  playExplosionSound();
                }
              }
              // Bắn vào Tháp dưới
              else if (b.y > boss.y + 170 && boss.bottomTurretHp > 0) {
                boss.bottomTurretHp -= b.damage;
                b.damage = 0;
                if (boss.bottomTurretHp <= 0) {
                  setScore((s) => s + 500);
                  scoreRef.current += 500;
                  createExplosion(boss.x + 30, boss.y + 195, 25, 'fire');
                  playExplosionSound();
                }
              }
              // Bắn vào LÕI NĂNG LƯỢNG ĐỎ (Red Core)
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

                  // Chuỗi nổ tung căn cứ trùm
                  createExplosion(boss.x + 30, boss.y + 135, 50, 'fire');
                  createExplosion(boss.x + 60, boss.y + 80, 40, 'fire');
                  createExplosion(boss.x + 60, boss.y + 200, 40, 'fire');
                  confetti({
                    particleCount: 160,
                    spread: 90,
                    origin: { y: 0.6 },
                  });
                  soundManager.playVictory();
                }
              }
            }
          } else {
            // Đạn địch bắn trúng người chơi (Nằm rạp giảm hitbox chỉ còn sát mặt đất)
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
              createExplosion(p.x + p.width / 2, p.y + p.height / 2, 20, 'fire');
            }
          }
        });

        // Dọn dẹp đạn đã chạm hoặc bay ra ngoài
        bulletsRef.current = bulletsRef.current.filter(
          (b) => b.damage > 0 && b.x > cameraXRef.current - 60 && b.x < cameraXRef.current + ARENA_WIDTH + 60 && b.y > -60 && b.y < ARENA_HEIGHT + 60
        );

        // H. CẬP NHẬT VẬT PHẨM VŨ KHÍ RƠI (ITEMS)
        itemsRef.current.forEach((it) => {
          it.y += it.vy;
          it.vy += 0.16; // Rơi chậm xuống nền đá

          // Nhặt vũ khí
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

        // Cập nhật hạt bụi và text nổi
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
      // 2. RENDER ĐỒ HỌA RETRO-MODERN TRÊN CANVAS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const camX = cameraXRef.current;

      // ------------------------------------------
      // A. BẦU TRỜI ĐÊM GALUGA PARALLAX & TRĂNG MÁU
      // ------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
      skyGrad.addColorStop(0, '#040714');
      skyGrad.addColorStop(0.55, '#0b162c');
      skyGrad.addColorStop(1, '#1b2a47');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Mặt trăng khổng lồ với quầng sáng sương mù
      const moonX = 580 - (camX * 0.04) % 900;
      const moonGrad = ctx.createRadialGradient(moonX, 90, 8, moonX, 90, 48);
      moonGrad.addColorStop(0, '#ffffff');
      moonGrad.addColorStop(0.3, '#fef08a');
      moonGrad.addColorStop(0.7, '#f97316');
      moonGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, 90, 48, 0, Math.PI * 2);
      ctx.fill();

      // Dãy núi đá hiểm trở xa cuộn chậm (Parallax 0.15)
      ctx.fillStyle = '#0f172a';
      for (let i = -1; i < 7; i++) {
        const mx = i * 260 - (camX * 0.15) % 260;
        ctx.beginPath();
        ctx.moveTo(mx - 40, 360);
        ctx.lineTo(mx + 90, 160);
        ctx.lineTo(mx + 150, 210);
        ctx.lineTo(mx + 220, 130);
        ctx.lineTo(mx + 300, 360);
        ctx.closePath();
        ctx.fill();
      }

      // Rừng cọ nhiệt đới tầm trung (Parallax 0.45)
      for (let j = -1; j < 12; j++) {
        const tx = j * 140 - (camX * 0.45) % 140;
        // Thân cây cọ uốn lượn
        ctx.strokeStyle = '#062817';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(tx + 40, 410);
        ctx.quadraticCurveTo(tx + 50, 320, tx + 65, 260);
        ctx.stroke();

        // Tán lá dừa xoè rộng phong cách Contra
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.ellipse(tx + 65, 260, 52, 28, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.ellipse(tx + 75, 255, 42, 20, 0.2, 0, Math.PI * 2);
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
          // Dòng nước sông trong xanh biếc với bọt sóng cuộn
          const waterGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
          waterGrad.addColorStop(0, '#0284c7');
          waterGrad.addColorStop(0.5, '#0369a1');
          waterGrad.addColorStop(1, '#082f49');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(screenPlatX, plat.y, plat.width, plat.height);

          // Lớp sóng động lấp lánh
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          for (let w = 0; w < plat.width; w += 35) {
            const waveY = Math.sin(Date.now() / 180 + w * 0.1) * 3;
            ctx.fillRect(screenPlatX + w, plat.y + 4 + waveY, 20, 2);
          }
        } else if (plat.isBridge) {
          // Cầu sắt quân sự có thể nổ
          ctx.fillStyle = plat.isExploding ? '#dc2626' : '#475569';
          ctx.fillRect(screenPlatX, plat.y, plat.width, 10);
          // Các thanh giằng thép chữ X
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.5;
          for (let bx = 0; bx < plat.width; bx += 28) {
            ctx.strokeRect(screenPlatX + bx, plat.y + 10, 28, 14);
            ctx.beginPath();
            ctx.moveTo(screenPlatX + bx, plat.y + 10);
            ctx.lineTo(screenPlatX + bx + 28, plat.y + 24);
            ctx.stroke();
          }
          // Viền cảnh báo vàng đen
          ctx.fillStyle = '#facc15';
          for (let bx = 0; bx < plat.width; bx += 20) {
            ctx.fillRect(screenPlatX + bx, plat.y + 1, 10, 4);
          }
        } else {
          // Mỏm đá vách rừng Contra kinh điển (Lớp đất đá đa tầng)
          const rockGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
          rockGrad.addColorStop(0, '#15803d');
          rockGrad.addColorStop(0.08, '#166534');
          rockGrad.addColorStop(0.18, '#854d0e');
          rockGrad.addColorStop(0.5, '#451a03');
          rockGrad.addColorStop(1, '#1c1917');
          ctx.fillStyle = rockGrad;
          ctx.fillRect(screenPlatX, plat.y, plat.width, plat.height);

          // Cỏ nhung xanh rủ xuống mép đá
          ctx.fillStyle = '#22c55e';
          for (let gx = 0; gx < plat.width; gx += 8) {
            const h = (gx % 16 === 0) ? 9 : 6;
            ctx.fillRect(screenPlatX + gx, plat.y - 1, 6, h);
          }

          // Khối đá nứt và đinh tán địa chất
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 1.5;
          for (let bx = 0; bx < plat.width; bx += 36) {
            ctx.strokeRect(screenPlatX + bx, plat.y + 12, 36, plat.height - 12);
          }
        }
      });

      // ------------------------------------------
      // C. VẼ CĂN CỨ PHÒNG THỦ RED FALCON (BOSS)
      // ------------------------------------------
      const boss = bossRef.current;
      const screenBossX = boss.x - camX;
      if (screenBossX < ARENA_WIDTH + 120 && screenBossX + boss.width > -120) {
        ctx.save();
        ctx.translate(screenBossX, boss.y);

        // Bức tường thép phòng thủ kiên cố có tán đinh
        const wallGrad = ctx.createLinearGradient(0, 0, boss.width, boss.height);
        wallGrad.addColorStop(0, '#475569');
        wallGrad.addColorStop(0.5, '#334155');
        wallGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, boss.width, boss.height);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, boss.width, boss.height);

        // Họa tiết vạch sọc nguy hiểm cảnh báo công nghệ ngoài hành tinh
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(10, 10, boss.width - 20, 8);
        ctx.fillRect(10, boss.height - 18, boss.width - 20, 8);

        // 1. LÔ CỐT PHÁO TRÊN
        if (boss.topTurretHp > 0) {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(36, 60, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Nòng pháo đôi chĩa thẳng ra phía người chơi
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-22, 53, 34, 6);
          ctx.fillRect(-22, 63, 34, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-24, 53, 4, 16);
        } else {
          // Pháo bị nổ tan hoang
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(10, 42, 50, 36);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(16, 50, 12, 10);
        }

        // 2. LÔ CỐT PHÁO DƯỚI
        if (boss.bottomTurretHp > 0) {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(36, 190, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-22, 183, 34, 6);
          ctx.fillRect(-22, 193, 34, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-24, 183, 4, 16);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(10, 172, 50, 36);
        }

        // 3. TRÁI TIM NĂNG LƯỢNG ĐỎ TRUNG TÂM (RED FALCON CORE)
        const coreY = 125;
        const pulse = Math.sin(Date.now() / 120) * 5;
        if (!boss.isCoreDestroyed) {
          // Lớp vỏ sinh học bảo vệ
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.ellipse(36, coreY, 32, 28, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Trái tim năng lượng đập liên tục
          const coreGrad = ctx.createRadialGradient(36, coreY, 2, 36, coreY, 22 + pulse);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, '#fef08a');
          coreGrad.addColorStop(0.7, '#ef4444');
          coreGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(36, coreY, 20 + pulse, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(36, coreY, 26, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ------------------------------------------
      // D. VẼ QUÂN ĐỊCH VÀ CÁC ĐƠN VỊ CHIẾN ĐẤU
      // ------------------------------------------
      enemiesRef.current.forEach((en) => {
        if (!en.isAlive) return;
        const sx = en.x - camX;
        if (sx < -70 || sx > ARENA_WIDTH + 70) return;

        ctx.save();
        ctx.translate(sx, en.y);

        if (en.type === 'runner') {
          // BỘ BINH ĐỎ CHẠY (Red Infantry)
          const runLeg = Math.floor(Date.now() / 80) % 2 === 0;
          // Quần đỏ & Giày chiến đấu đen
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(4, 26, 8, runLeg ? 18 : 12);
          ctx.fillRect(16, 26, 8, runLeg ? 12 : 18);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(3, runLeg ? 42 : 36, 10, 6);
          ctx.fillRect(15, runLeg ? 36 : 42, 10, 6);

          // Áo giáp chiến thuật trắng viền xám
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(4, 12, 20, 15);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(4, 12, 20, 15);

          // Đầu mang mũ sắt đỏ quân sự
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(7, 2, 14, 11);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(5, 0, 18, 6);

          // Súng trường chĩa ra trước
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(en.facing === 'left' ? -6 : 18, 16, 16, 5);
        } else if (en.type === 'sniper') {
          // LÍNH BẮN TỈA NẤP LÙM CÂY / CÁT
          // Lùm cây ngụy trang
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2 + 6, 22, 0, Math.PI * 2);
          ctx.fill();

          // Thân trên và Mũ ngụy trang
          ctx.fillStyle = '#166534';
          ctx.fillRect(8, 6, 18, 18);
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(10, 2, 14, 10);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(8, -1, 18, 5);

          // Nòng súng bắn tỉa dài kèm tia ngắm laser đỏ
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(en.facing === 'left' ? 2 : en.width - 2, 14);
          ctx.lineTo(en.facing === 'left' ? -180 : en.width + 180, 14);
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(en.facing === 'left' ? -14 : 18, 12, 22, 4);
        } else if (en.type === 'turret') {
          // THÁP PHÁO XOAY 360 ĐỘ
          // Bệ đế tháp bọc thép
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Nắp vòm xoay theo hướng góc aimAngle
          ctx.save();
          ctx.translate(en.width / 2, en.height / 2);
          ctx.rotate(en.aimAngle || 0);

          // Đôi nòng pháo vươn dài
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(10, -5, 18, 4);
          ctx.fillRect(10, 1, 18, 4);

          // Mũ vòm pháo
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (en.type === 'wall_pod') {
          // HỘP CẢM BIẾN VÁCH ĐÁ CHỨA VŨ KHÍ
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(0, 0, en.width, en.height, 6);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Mắt cảm biến đỏ nhấp nháy
          const eyePulse = Math.sin(Date.now() / 150) * 3;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 9 + eyePulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(en.width / 2 - 2, en.height / 2 - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (en.type === 'flying_capsule') {
          // CHIM ƯNG KIM LOẠI BAY LƯỢN MANG VŨ KHÍ
          // Đôi cánh cơ khí vỗ nhịp
          const wingFlap = Math.sin(Date.now() / 80) * 8;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(-16, 6);
          ctx.lineTo(0, 14 + wingFlap);
          ctx.lineTo(16, 6);
          ctx.lineTo(0, -6 - wingFlap);
          ctx.closePath();
          ctx.fill();

          // Vỏ nhộng chứa huy hiệu vũ khí phát sáng
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(en.width / 2, en.height / 2, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#78350f';
          ctx.font = 'black 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tag = en.itemDrop === 'spread' ? 'S' : en.itemDrop === 'laser' ? 'L' : en.itemDrop === 'machine' ? 'M' : 'B';
          ctx.fillText(tag, en.width / 2, en.height / 2 + 1);
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

        // Vòng hào quang phát sáng xung quanh phù hiệu
        const halo = Math.sin(Date.now() / 90) * 3;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 16 + halo, 0, Math.PI * 2);
        ctx.fill();

        // Cánh chim ưng bạc hai bên
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(8, -8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();

        // Huy hiệu tròn mang chữ cái vũ khí [S], [M], [L], [B]
        const badgeGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 12);
        badgeGrad.addColorStop(0, '#ffffff');
        badgeGrad.addColorStop(0.4, '#facc15');
        badgeGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = badgeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#7c2d12';
        ctx.font = '900 12px monospace';
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
          // ĐẠN HOA CẢI S: CẦU LỬA PLASMA VỚI QUẦNG NĂNG LƯỢNG RỰC RỠ
          const fGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, b.radius + 3);
          fGrad.addColorStop(0, '#ffffff');
          fGrad.addColorStop(0.3, '#fef08a');
          fGrad.addColorStop(0.65, '#f97316');
          fGrad.addColorStop(1, '#dc2626');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius + 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.isLaser) {
          // TIA LASER L: VẠCH NĂNG LƯỢNG CYAN DÀI SẮC NÉT
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();
        } else {
          // ĐẠN THƯỜNG / ĐẠN ĐỊCH
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-1, -1, b.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // ------------------------------------------
      // G. VẼ BIỆT KÍCH RAMBO BILL RIZER (HERO)
      // ------------------------------------------
      const p = playerRef.current;
      const screenPX = p.x - camX;

      ctx.save();
      ctx.translate(screenPX, p.y);

      // Khiên hộ mệnh bất tử cầu vồng (Barrier B)
      if (p.barrierTimer > 0) {
        const bPulse = Math.sin(Date.now() / 70) * 4;
        const shieldColors = ['#ef4444', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'];
        ctx.strokeStyle = shieldColors[Math.floor(Date.now() / 80) % shieldColors.length];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.width / 2, p.height / 2, 36 + bPulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Nhấp nháy khi vừa hồi sinh bất tử
      if (p.isInvulnerable && Math.floor(Date.now() / 90) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      if (p.isInWater) {
        // ĐANG NGÂM MÌNH DƯỚI NƯỚC: Chỉ nhô đầu, khăn rằn và súng
        // Gợn nước bao quanh cổ
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(-4, p.height - 18, p.width + 8, 3);

        // Đầu và tóc nâu
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(8, p.height - 20, 16, 14);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(6, p.height - 24, 20, 5);

        // Khăn rằn đỏ bay theo sóng
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, p.height - 22, 24, 4);

        // Súng nhô cao trên mặt nước
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.facing === 'right' ? 16 : -8, p.height - 16, 22, 5);
      } else if (!p.isGrounded && p.isJumping) {
        // NHẢY LỘN NHÀO CUỘN TRÒN QUẢ CẦU (SOMERSAULT SPINNING BALL)
        ctx.save();
        ctx.translate(p.width / 2, p.height / 2);
        ctx.rotate(p.spinAngle);

        // Bóng biệt kích cuộn tròn
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Dải khăn rằn đỏ xoay tít
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-16, -4, 32, 6);
        ctx.restore();
      } else if (p.isProne) {
        // NẰM RẠP NGƯỜI XUỐNG ĐẤT (PRONE DUCK)
        // Quần chiến thuật xanh
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(p.facing === 'right' ? 0 : 8, p.height - 14, 26, 12);

        // Cơ bắp ngực trần
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(p.facing === 'right' ? 24 : 0, p.height - 14, 16, 12);

        // Khăn rằn đỏ
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.facing === 'right' ? 32 : -6, p.height - 18, 12, 4);

        // Súng trường kê sát mặt đất bắn thẳng
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.facing === 'right' ? 28 : -14, p.height - 8, 26, 5);
      } else {
        // ĐỨNG & CHẠY BỘ BIỆT KÍCH CHI TIẾT ĐẸP MẮT (RUN & SHOOT)
        const fRight = p.facing === 'right';

        // 1. Đôi chân và giày ủng chiến đấu (Animation 4 khung hình)
        const legOffsets = [
          { l1: -4, l2: 6 },
          { l1: 0, l2: 0 },
          { l1: 6, l2: -4 },
          { l1: 0, l2: 0 },
        ];
        const curLeg = legOffsets[p.runFrame];

        ctx.fillStyle = '#1e3a8a'; // Quần chiến đấu xanh biển
        ctx.fillRect(8 + curLeg.l1, 30, 8, 20);
        ctx.fillRect(16 + curLeg.l2, 30, 8, 20);

        // Ủng bọc thép quân sự
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(6 + curLeg.l1, 48, 11, 8);
        ctx.fillRect(14 + curLeg.l2, 48, 11, 8);

        // 2. Thân người ngực trần cơ bắp vạm vỡ & Đai chiến thuật
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(8, 14, 16, 18);
        // Dây đai đeo đạn chéo qua vai
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 14);
        ctx.lineTo(24, 30);
        ctx.stroke();

        // 3. Đầu, tóc nâu và Khăn Rằn Đỏ đặc trưng
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(10, 4, 14, 12);
        // Tóc nâu phong trần
        ctx.fillStyle = '#78350f';
        ctx.fillRect(8, 0, 18, 5);

        // Khăn đỏ quấn đầu và đuôi khăn bay phấp phới trong gió
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(6, 4, 20, 4);
        const ribbonWiggle = Math.sin(Date.now() / 90) * 3;
        ctx.beginPath();
        ctx.moveTo(fRight ? 6 : 26, 6);
        ctx.lineTo(fRight ? -10 : 42, 6 + ribbonWiggle);
        ctx.lineTo(fRight ? -8 : 40, 10 + ribbonWiggle);
        ctx.lineTo(fRight ? 6 : 26, 8);
        ctx.closePath();
        ctx.fill();

        // 4. Súng trường công nghệ cao theo hướng ngắm 8 chiều
        ctx.fillStyle = '#0f172a';
        if (p.aimDir === 'up') {
          ctx.fillRect(fRight ? 16 : 10, -12, 6, 26);
        } else if (p.aimDir === 'up-right') {
          ctx.save();
          ctx.translate(16, 16);
          ctx.rotate(-Math.PI / 4);
          ctx.fillRect(0, -3, 26, 6);
          ctx.restore();
        } else if (p.aimDir === 'up-left') {
          ctx.save();
          ctx.translate(16, 16);
          ctx.rotate(-Math.PI * 3 / 4);
          ctx.fillRect(0, -3, 26, 6);
          ctx.restore();
        } else if (p.aimDir === 'down-right') {
          ctx.save();
          ctx.translate(16, 18);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(0, -3, 26, 6);
          ctx.restore();
        } else if (p.aimDir === 'down-left') {
          ctx.save();
          ctx.translate(16, 18);
          ctx.rotate(Math.PI * 3 / 4);
          ctx.fillRect(0, -3, 26, 6);
          ctx.restore();
        } else {
          // Bắn thẳng ngang
          ctx.fillRect(fRight ? 16 : -10, 18, 26, 6);
        }

        // Tia lửa đầu nòng khi vừa bắn (Muzzle flash)
        if (p.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          const flashX = fRight ? 44 : -12;
          ctx.arc(flashX, 21, 6, 0, Math.PI * 2);
          ctx.fill();
        }
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

      // Tiêu đề Sidebar
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CONTRA COMMAND', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // 1. HUY HIỆU VŨ KHÍ HIỆN TẠI (Weapon Badge)
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

      // 2. MẠNG SỐNG BIỆT KÍCH (Lives) - CĂN GIỮA CHUẨN XÁC TRỤC TÂM
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

      // 3. TIẾN TRÌNH CHIẾN DỊCH TỚI CĂN CỨ BOSS
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

      // 4. KẺ ĐỊCH TIÊU DIỆT
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`ĐÃ DIỆT: ${enemiesKilledRef.current} ĐỊCH`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 295);

      // 5. ĐIỂM SỐ CHIẾN TRƯỜNG
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

      // Kỷ lục cao nhất
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 425);

      // Máu Trùm nếu đã tới căn cứ
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

  // Lưu điểm cao kỷ lục
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
            {/* D-Pad 4 hướng ảo */}
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

            {/* Cụm Nút BẮN & NHẢY */}
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
