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
  ArrowLeft, 
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Shield,
  Flame,
  Target
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'hardcore';
type WeaponType = 'normal' | 'machine' | 'spread' | 'laser' | 'barrier';

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
const BOSS_X = LEVEL_LENGTH - 480;

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isWater?: boolean;
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
}

interface Enemy {
  id: number;
  type: 'runner' | 'sniper' | 'turret' | 'capsule';
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
}

interface WeaponItem {
  id: number;
  type: WeaponType;
  x: number;
  y: number;
  vy: number;
  isAlive: boolean;
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
}

// Khởi tạo địa hình các mỏm đá, cầu treo và hào nước dọc màn 1
const generatePlatforms = (): Platform[] => {
  const list: Platform[] = [];

  // Mặt đất chính (có đoạn ngắt quãng qua sông)
  list.push({ x: 0, y: 440, width: 900, height: 100 });
  list.push({ x: 900, y: 480, width: 350, height: 60, isWater: true }); // Đoạn sông nước
  list.push({ x: 1250, y: 440, width: 850, height: 100 });
  list.push({ x: 2100, y: 480, width: 380, height: 60, isWater: true }); // Đoạn sông nước 2
  list.push({ x: 2480, y: 440, width: 1800, height: 100 }); // Sân trước căn cứ Boss

  // Các mỏm đá tầng 2 và tầng 3 để nhảy bắn
  const highLedges = [
    { x: 200, y: 340, width: 180, height: 20 },
    { x: 450, y: 260, width: 220, height: 20 },
    { x: 750, y: 350, width: 160, height: 20 },
    // Cầu treo qua sông 1
    { x: 920, y: 420, width: 300, height: 16 },
    { x: 1350, y: 340, width: 200, height: 20 },
    { x: 1600, y: 250, width: 220, height: 20 },
    { x: 1880, y: 330, width: 200, height: 20 },
    // Cầu treo qua sông 2
    { x: 2120, y: 420, width: 320, height: 16 },
    { x: 2550, y: 350, width: 200, height: 20 },
    { x: 2800, y: 260, width: 240, height: 20 },
    { x: 3100, y: 340, width: 220, height: 20 },
    { x: 3400, y: 260, width: 260, height: 20 },
  ];

  highLedges.forEach((l) => list.push(l));
  return list;
};

export const GameContra: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cấu hình game
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [initialLives, setInitialLives] = useState<number>(3);

  // Trạng thái màn chơi
  const [stage, setStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [weapon, setWeapon] = useState<WeaponType>('spread');
  const [enemiesKilled, setEnemiesKilled] = useState<number>(0);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References cho physics & game loop
  const lastTimeRef = useRef<number>(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const cameraXRef = useRef<number>(0);
  const platformsRef = useRef<Platform[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<WeaponItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Nhân vật chính: Biệt kích Bill Rizer
  const playerRef = useRef({
    x: 80,
    y: 380,
    width: 28,
    height: 52,
    vx: 0,
    vy: 0,
    facing: 'right' as 'left' | 'right',
    aimDir: 'right' as 'right' | 'left' | 'up' | 'down' | 'up-right' | 'up-left' | 'down-right' | 'down-left',
    isGrounded: false,
    isJumping: false,
    isProne: false, // Nằm rạp người bắn
    isInWater: false,
    jumpTimer: 0,
    shootCooldown: 0,
    isInvulnerable: false,
    invulnerableTimer: 0,
    barrierTimer: 0, // Bùa hộ mệnh bất tử
  });

  // Trùm Màn 1: Căn Cứ Hỏa Lực Đảo Galuga (Defense Wall Base)
  const bossRef = useRef({
    x: BOSS_X,
    y: 180,
    width: 220,
    height: 260,
    coreHp: 65,
    maxCoreHp: 65,
    topTurretHp: 20,
    bottomTurretHp: 20,
    isAlive: true,
    isCoreDestroyed: false,
    shootTimer: 0,
  });

  // Web Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load HighScore & Settings
  useEffect(() => {
    try {
      const savedHigh = localStorage.getItem('acegames_contra_highscore');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      const savedSettings = localStorage.getItem('ace_game_settings_contra');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.gameMode) setGameMode(parsed.gameMode as GameMode);
        if (parsed.initialLives) {
          setInitialLives(parsed.initialLives);
          setLives(parsed.initialLives);
        }
        if (parsed.initialWeapon) setWeapon(parsed.initialWeapon as WeaponType);
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

  const playShootSound = useCallback((wType: WeaponType) => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (wType === 'spread') {
      // Tiếng đạn hoa cải S vang dội bùng nổ
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    } else if (wType === 'laser') {
      // Tiếng tia laser sắc bén
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    } else {
      // Tiếng súng thường / súng máy
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [initAudio]);

  const playJumpSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(460, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }, [initAudio]);

  const playExplosionSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }, [initAudio]);

  const playPowerupSound = useCallback(() => {
    initAudio();
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.12);
    });
  }, [initAudio]);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 220);
  }, []);

  // Khởi tạo lại toàn bộ màn chơi
  const resetGame = useCallback(() => {
    platformsRef.current = generatePlatforms();
    bulletsRef.current = [];
    enemiesRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    cameraXRef.current = 0;

    playerRef.current = {
      x: 80,
      y: 380,
      width: 28,
      height: 52,
      vx: 0,
      vy: 0,
      facing: 'right',
      aimDir: 'right',
      isGrounded: true,
      isJumping: false,
      isProne: false,
      isInWater: false,
      jumpTimer: 0,
      shootCooldown: 0,
      isInvulnerable: false,
      invulnerableTimer: 0,
      barrierTimer: 0,
    };

    bossRef.current = {
      x: BOSS_X,
      y: 180,
      width: 220,
      height: 260,
      coreHp: 65,
      maxCoreHp: 65,
      topTurretHp: 20,
      bottomTurretHp: 20,
      isAlive: true,
      isCoreDestroyed: false,
      shootTimer: 0,
    };

    // Sinh các hỏa điểm và xạ thủ địch ban đầu
    const initialEnemies: Enemy[] = [
      { id: 1, type: 'turret', x: 480, y: 225, width: 34, height: 34, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 2, facing: 'left', isAlive: true },
      { id: 2, type: 'sniper', x: 780, y: 315, width: 28, height: 42, vx: 0, vy: 0, hp: 4, maxHp: 4, shootCooldown: 1.5, facing: 'left', isAlive: true },
      { id: 3, type: 'capsule', x: 300, y: 160, width: 32, height: 24, vx: 1.5, vy: 0, hp: 1, maxHp: 1, shootCooldown: 0, facing: 'right', itemDrop: 'spread', isAlive: true },
      { id: 4, type: 'capsule', x: 800, y: 140, width: 32, height: 24, vx: 1.5, vy: 0, hp: 1, maxHp: 1, shootCooldown: 0, facing: 'right', itemDrop: 'laser', isAlive: true },
      { id: 5, type: 'capsule', x: 1400, y: 150, width: 32, height: 24, vx: 1.5, vy: 0, hp: 1, maxHp: 1, shootCooldown: 0, facing: 'right', itemDrop: 'barrier', isAlive: true },
      { id: 6, type: 'turret', x: 1650, y: 215, width: 34, height: 34, vx: 0, vy: 0, hp: 8, maxHp: 8, shootCooldown: 1.8, facing: 'left', isAlive: true },
      { id: 7, type: 'sniper', x: 1920, y: 295, width: 28, height: 42, vx: 0, vy: 0, hp: 5, maxHp: 5, shootCooldown: 1.6, facing: 'left', isAlive: true },
      { id: 8, type: 'capsule', x: 2200, y: 150, width: 32, height: 24, vx: 1.5, vy: 0, hp: 1, maxHp: 1, shootCooldown: 0, facing: 'right', itemDrop: 'machine', isAlive: true },
      { id: 9, type: 'turret', x: 2850, y: 225, width: 34, height: 34, vx: 0, vy: 0, hp: 10, maxHp: 10, shootCooldown: 1.5, facing: 'left', isAlive: true },
      { id: 10, type: 'sniper', x: 3450, y: 225, width: 28, height: 42, vx: 0, vy: 0, hp: 6, maxHp: 6, shootCooldown: 1.4, facing: 'left', isAlive: true },
    ];
    enemiesRef.current = initialEnemies;

    setScore(0);
    setLives(initialLives);
    setEnemiesKilled(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
  }, [initialLives]);

  // Sang màn kế tiếp
  const nextStage = useCallback(() => {
    setStage((s) => s + 1);
    resetGame();
  }, [resetGame]);

  // Hành động BẮN SÚNG của người chơi
  const handlePlayerShoot = useCallback(() => {
    const p = playerRef.current;
    if (p.shootCooldown > 0 || isPaused || isGameOver || isVictory) return;
    initAudio();

    // Hướng bắn theo tư thế di chuyển và ngắm
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
      // Khi đang nhảy trên không có thể bắn thẳng xuống
      if (!p.isGrounded) {
        dirX = 0;
        dirY = 1;
      }
    }

    const startX = p.x + (dirX > 0 ? p.width + 6 : dirX < 0 ? -6 : p.width / 2);
    const startY = p.isProne ? p.y + p.height - 12 : p.y + (dirY < 0 ? -4 : dirY > 0 ? p.height + 4 : 20);

    const speed = 14;

    if (weapon === 'spread') {
      // ĐẠN HOA CẢI (SPREAD GUN S) HUYỀN THOẠI BẮN 5 TIA TỎA HÌNH QUẠT
      const baseAngle = Math.atan2(dirY, dirX);
      const spreadAngles = [-0.28, -0.14, 0, 0.14, 0.28]; // 5 tia tỏa đều

      spreadAngles.forEach((angOffset) => {
        const finalAng = baseAngle + angOffset;
        bulletsRef.current.push({
          id: Date.now() + Math.random(),
          x: startX,
          y: startY,
          vx: Math.cos(finalAng) * speed,
          vy: Math.sin(finalAng) * speed,
          radius: 5,
          color: '#ef4444',
          isPlayer: true,
          damage: 2,
          isSpread: true,
        });
      });
      p.shootCooldown = 0.18; // Giãn cách bắn
    } else if (weapon === 'laser') {
      // SÚNG LASER TIA NĂNG LƯỢNG
      bulletsRef.current.push({
        id: Date.now() + Math.random(),
        x: startX,
        y: startY,
        vx: dirX * speed * 1.3,
        vy: dirY * speed * 1.3,
        radius: 4,
        color: '#06b6d4',
        isPlayer: true,
        damage: 4,
        isLaser: true,
      });
      p.shootCooldown = 0.22;
    } else {
      // SÚNG MÁY / SÚNG THƯỜNG
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
      p.shootCooldown = weapon === 'machine' ? 0.09 : 0.16;
    }

    playShootSound(weapon);
  }, [weapon, isPaused, isGameOver, isVictory, initAudio, playShootSound]);

  // Hành động NHẢY của người chơi
  const handlePlayerJump = useCallback(() => {
    const p = playerRef.current;
    if (p.isGrounded && !p.isProne && !isPaused && !isGameOver && !isVictory) {
      p.vy = -13.5;
      p.isGrounded = false;
      p.isJumping = true;
      playJumpSound();
    }
  }, [isPaused, isGameOver, isVictory, playJumpSound]);

  // Lắng nghe bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      if (e.code === 'KeyP') {
        setIsPaused((p) => !p);
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyK') {
        handlePlayerJump();
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
  }, [handlePlayerJump, initAudio]);

  // Main Game Loop 60 FPS
  useEffect(() => {
    resetGame();
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

      // ==========================================
      // 1. CẬP NHẬT VẬT LÝ VÀ LOGIC
      // ==========================================
      if (!isPaused && !isGameOver && !isVictory) {
        const p = playerRef.current;
        const keys = keysPressedRef.current;

        // Giảm hồi chiêu bắn & bất tử
        if (p.shootCooldown > 0) p.shootCooldown -= dt;
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

        // Tư thế nằm rạp người né đạn
        p.isProne = isDown && p.isGrounded && !isLeft && !isRight;

        if (isUp && isRight) p.aimDir = 'up-right';
        else if (isUp && isLeft) p.aimDir = 'up-left';
        else if (isDown && isRight) p.aimDir = 'down-right';
        else if (isDown && isLeft) p.aimDir = 'down-left';
        else if (isUp) p.aimDir = 'up';
        else if (isDown && !p.isGrounded) p.aimDir = 'down';
        else p.aimDir = p.facing;

        // B. DI CHUYỂN TRỤC NGANG (X-AXIS)
        const moveSpeed = p.isProne ? 0 : 210;
        if (isRight) p.vx = moveSpeed;
        else if (isLeft) p.vx = -moveSpeed;
        else p.vx = 0;

        p.x += p.vx * dt;

        // Giữ người chơi không lùi quá mép trái của camera
        if (p.x < cameraXRef.current + 10) {
          p.x = cameraXRef.current + 10;
        }

        // BẮN LIÊN THANH KHI GIỮ PHÍM SPACE / PHÍM J
        if (keys['Space'] || keys['KeyJ']) {
          handlePlayerShoot();
        }

        // C. TRỌNG LỰC & VA CHẠM ĐỊA HÌNH (GRAVITY & PLATFORMS)
        const gravity = 32;
        p.vy += gravity * dt;
        p.y += p.vy;

        p.isGrounded = false;
        p.isInWater = false;

        platformsRef.current.forEach((plat) => {
          // Va chạm mặt trên của bệ đá (One-way platform)
          const isAbove = p.y + p.height - p.vy <= plat.y + 12;
          const isHitting = p.y + p.height >= plat.y && p.y + p.height <= plat.y + plat.height;
          const isWithinX = p.x + p.width > plat.x && p.x < plat.x + plat.width;

          if (isAbove && isHitting && isWithinX && p.vy >= 0) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.isJumping = false;
            if (plat.isWater) {
              p.isInWater = true;
            }
          }
        });

        // Rơi xuống vực sâu
        if (p.y > ARENA_HEIGHT + 60) {
          // Mất 1 mạng và hồi sinh ở mỏm đá gần nhất
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setIsGameOver(true);
              soundManager.playButtonClick();
            }
            return nextL;
          });
          p.x = cameraXRef.current + 80;
          p.y = 100;
          p.vy = 0;
          p.isInvulnerable = true;
          p.invulnerableTimer = 2.5;
          playExplosionSound();
        }

        // D. CUỘN CAMERA THEO BƯỚC TIẾN CỦA BIỆT KÍCH (Smooth Side-scrolling)
        const targetCamX = Math.max(0, p.x - 240);
        if (targetCamX > cameraXRef.current) {
          cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;
        }
        // Giới hạn camera không vượt quá căn cứ Boss
        cameraXRef.current = Math.min(LEVEL_LENGTH - ARENA_WIDTH, cameraXRef.current);

        // SINH QUÂN ĐỊCH BỘ BINH CHẠY (Enemy Runners) ĐỊNH KỲ
        if (Math.random() < 0.025 && p.x < BOSS_X - 100) {
          const spawnRight = cameraXRef.current + ARENA_WIDTH + 30;
          enemiesRef.current.push({
            id: Date.now() + Math.random(),
            type: 'runner',
            x: spawnRight,
            y: 390,
            width: 26,
            height: 48,
            vx: -130 - Math.random() * 40,
            vy: 0,
            hp: 1,
            maxHp: 1,
            shootCooldown: 0,
            facing: 'left',
            isAlive: true,
          });
        }

        // CẬP NHẬT QUÂN ĐỊCH (ENEMIES)
        enemiesRef.current.forEach((en) => {
          if (!en.isAlive) return;

          if (en.type === 'runner') {
            en.x += en.vx * dt;
          } else if (en.type === 'capsule') {
            en.x += en.vx;
            en.y += Math.sin(Date.now() / 250 + en.id) * 1.5;
          } else if (en.type === 'sniper' || en.type === 'turret') {
            // Ngắm và bắn về phía người chơi
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && Math.abs(en.x - p.x) < 550) {
              en.shootCooldown = 2.2 + Math.random() * 0.8;
              const angle = Math.atan2(p.y - en.y, p.x - en.x);
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: en.x + en.width / 2,
                y: en.y + en.height / 2,
                vx: Math.cos(angle) * 7.5,
                vy: Math.sin(angle) * 7.5,
                radius: 4,
                color: '#f97316',
                isPlayer: false,
                damage: 1,
              });
            }
          }

          // Kiểm tra va chạm giữa người chơi và bộ binh địch
          if (
            !p.isInvulnerable &&
            p.barrierTimer <= 0 &&
            Math.abs(p.x - en.x) < 22 &&
            Math.abs(p.y - en.y) < 32 &&
            en.type === 'runner'
          ) {
            // Mất mạng do va chạm
            setLives((l) => {
              const nextL = l - 1;
              if (nextL <= 0) {
                setIsGameOver(true);
                soundManager.playButtonClick();
              }
              return nextL;
            });
            p.isInvulnerable = true;
            p.invulnerableTimer = 2.5;
            playExplosionSound();
          }
        });

        // Dọn dẹp địch ra xa khỏi màn hình
        enemiesRef.current = enemiesRef.current.filter(
          (en) => en.isAlive && en.x > cameraXRef.current - 120 && en.x < cameraXRef.current + ARENA_WIDTH + 180
        );

        // CẬP NHẬT CĂN CỨ BOSS MÀN 1 (DEFENSE WALL BASE)
        const boss = bossRef.current;
        if (boss.isAlive && cameraXRef.current > BOSS_X - ARENA_WIDTH - 50) {
          boss.shootTimer += dt;
          if (boss.shootTimer >= 1.6 && !boss.isCoreDestroyed) {
            boss.shootTimer = 0;
            // Bắn từ 2 lô cốt pháo
            if (boss.topTurretHp > 0) {
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 60,
                vx: -8,
                vy: (p.y - (boss.y + 60)) * 0.015,
                radius: 5,
                color: '#ef4444',
                isPlayer: false,
                damage: 1,
              });
            }
            if (boss.bottomTurretHp > 0) {
              bulletsRef.current.push({
                id: Date.now() + Math.random(),
                x: boss.x + 20,
                y: boss.y + 190,
                vx: -8,
                vy: (p.y - (boss.y + 190)) * 0.015,
                radius: 5,
                color: '#ef4444',
                isPlayer: false,
                damage: 1,
              });
            }
          }
        }

        // CẬP NHẬT ĐẠN BAY & VA CHẠM (BULLETS & COLLISIONS)
        bulletsRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;

          if (b.isPlayer) {
            // Đạn người chơi bắn trúng quân địch
            enemiesRef.current.forEach((en) => {
              if (
                en.isAlive &&
                b.x > en.x &&
                b.x < en.x + en.width &&
                b.y > en.y &&
                b.y < en.y + en.height
              ) {
                en.hp -= b.damage;
                b.damage = 0; // Hủy đạn sau va chạm

                if (en.hp <= 0) {
                  en.isAlive = false;
                  setScore((s) => s + (en.type === 'turret' ? 300 : en.type === 'sniper' ? 200 : 100));
                  setEnemiesKilled((k) => k + 1);

                  // Rơi vật phẩm vũ khí nếu là viên nang bay
                  if (en.itemDrop) {
                    itemsRef.current.push({
                      id: Date.now(),
                      type: en.itemDrop,
                      x: en.x,
                      y: en.y,
                      vy: -3.5,
                      isAlive: true,
                    });
                  }

                  // Hiệu ứng nổ quân địch
                  for (let i = 0; i < 16; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 1 + Math.random() * 4;
                    particlesRef.current.push({
                      x: en.x + en.width / 2,
                      y: en.y + en.height / 2,
                      vx: Math.cos(ang) * spd,
                      vy: Math.sin(ang) * spd,
                      radius: 2 + Math.random() * 3,
                      color: ['#ef4444', '#f97316', '#facc15'][Math.floor(Math.random() * 3)],
                      alpha: 1,
                      life: 0,
                      maxLife: 18,
                    });
                  }
                  playExplosionSound();
                }
              }
            });

            // Đạn bắn trúng các bộ phận Căn cứ Boss
            if (boss.isAlive && b.x > boss.x && b.x < boss.x + boss.width) {
              // Bắn trúng pháo trên
              if (boss.topTurretHp > 0 && b.y > boss.y + 40 && b.y < boss.y + 90) {
                boss.topTurretHp -= b.damage;
                b.damage = 0;
                if (boss.topTurretHp <= 0) {
                  setScore((s) => s + 500);
                  playExplosionSound();
                }
              }
              // Bắn trúng pháo dưới
              else if (boss.bottomTurretHp > 0 && b.y > boss.y + 170 && b.y < boss.y + 220) {
                boss.bottomTurretHp -= b.damage;
                b.damage = 0;
                if (boss.bottomTurretHp <= 0) {
                  setScore((s) => s + 500);
                  playExplosionSound();
                }
              }
              // Bắn trực diện vào LÕI NĂNG LƯỢNG ĐỎ (Red Core)
              else if (b.y > boss.y + 105 && b.y < boss.y + 165) {
                boss.coreHp -= b.damage;
                b.damage = 0;

                if (boss.coreHp <= 0 && !boss.isCoreDestroyed) {
                  boss.isCoreDestroyed = true;
                  boss.isAlive = false;
                  setScore((s) => s + 5000);
                  setIsVictory(true);
                  triggerShake();

                  // Chuỗi nổ tung căn cứ trùm
                  confetti({
                    particleCount: 150,
                    spread: 85,
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
              b.y < p.y + p.height - (p.isInWater ? 20 : 0);

            if (isHitPlayer) {
              b.damage = 0;
              triggerShake();
              setLives((l) => {
                const nextL = l - 1;
                if (nextL <= 0) {
                  setIsGameOver(true);
                  soundManager.playButtonClick();
                }
                return nextL;
              });
              p.isInvulnerable = true;
              p.invulnerableTimer = 2.5;
              playExplosionSound();
            }
          }
        });

        // Dọn dẹp đạn đã va chạm hoặc bay ra ngoài
        bulletsRef.current = bulletsRef.current.filter(
          (b) => b.damage > 0 && b.x > cameraXRef.current - 50 && b.x < cameraXRef.current + ARENA_WIDTH + 50 && b.y > -50 && b.y < ARENA_HEIGHT + 50
        );

        // CẬP NHẬT VẬT PHẨM VŨ KHÍ RƠI (WEAPON ITEMS)
        itemsRef.current.forEach((it) => {
          it.y += it.vy;
          it.vy += 0.15; // Rơi chậm xuống mặt đất

          // Nhặt vũ khí
          if (
            it.isAlive &&
            Math.abs(p.x + p.width / 2 - it.x) < 28 &&
            Math.abs(p.y + p.height / 2 - it.y) < 34
          ) {
            it.isAlive = false;
            setScore((s) => s + 1000);
            playPowerupSound();

            if (it.type === 'barrier') {
              p.barrierTimer = 10.0; // 10 giây khiên bất tử
              floatingTextsRef.current.push({
                id: Date.now(),
                text: 'KHIÊN BẤT TỬ B!',
                x: it.x,
                y: it.y - 15,
                color: '#38bdf8',
                alpha: 1,
              });
            } else {
              setWeapon(it.type);
              floatingTextsRef.current.push({
                id: Date.now(),
                text: it.type === 'spread' ? 'ĐẠN HOA CẢI S!' : it.type === 'laser' ? 'LASER L!' : 'SÚNG MÁY M!',
                x: it.x,
                y: it.y - 15,
                color: '#facc15',
                alpha: 1,
              });
            }
          }
        });
        itemsRef.current = itemsRef.current.filter((it) => it.isAlive && it.y < ARENA_HEIGHT + 40);

        // Cập nhật hạt bụi và text nổi
        particlesRef.current.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life++;
          pt.alpha = 1 - pt.life / pt.maxLife;
        });
        particlesRef.current = particlesRef.current.filter((pt) => pt.life < pt.maxLife);

        floatingTextsRef.current.forEach((ft) => {
          ft.y -= 25 * dt;
          ft.alpha -= dt * 0.9;
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.alpha > 0);
      }

      // ==========================================
      // 2. RENDER GRAPHICS LÊN RETINA CANVAS
      // ==========================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const camX = cameraXRef.current;

      // A. BẦU TRỜI & NÚI NON GALUGA PARALLAX (Distant Mountains & Jungle Sky)
      ctx.fillStyle = '#070f1e';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Núi xa cuộn chậm (Parallax factor 0.2)
      ctx.fillStyle = '#10223b';
      for (let i = 0; i < 8; i++) {
        const mx = i * 280 - (camX * 0.2) % 280;
        ctx.beginPath();
        ctx.moveTo(mx, 360);
        ctx.lineTo(mx + 140, 160);
        ctx.lineTo(mx + 280, 360);
        ctx.closePath();
        ctx.fill();
      }

      // Rặng cây nhiệt đới tầm trung (Parallax factor 0.5)
      ctx.fillStyle = '#0f3822';
      for (let j = 0; j < 14; j++) {
        const tx = j * 160 - (camX * 0.5) % 160;
        ctx.beginPath();
        ctx.arc(tx + 80, 370, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. VẼ ĐỊA HÌNH, MỎM ĐÁ & SÔNG NƯỚC (Platforms & Rivers)
      platformsRef.current.forEach((plat) => {
        const screenPlatX = plat.x - camX;
        // Bỏ qua nếu nằm ngoài màn hình
        if (screenPlatX + plat.width < -50 || screenPlatX > ARENA_WIDTH + 50) return;

        if (plat.isWater) {
          // Dòng nước sông xanh biếc
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(screenPlatX, plat.y, plat.width, plat.height);
          // Gợn sóng nhấp nhô
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          for (let w = 0; w < plat.width; w += 40) {
            const waveOffset = Math.sin(Date.now() / 200 + w) * 3;
            ctx.fillRect(screenPlatX + w, plat.y + 6 + waveOffset, 24, 2);
          }
        } else {
          // Mỏm đá vách rừng phong cách Contra kinh điển
          // Mặt cỏ xanh trên cùng
          ctx.fillStyle = '#15803d';
          ctx.fillRect(screenPlatX, plat.y, plat.width, 8);
          // Thân đất đá nâu đỏ
          ctx.fillStyle = '#78350f';
          ctx.fillRect(screenPlatX, plat.y + 8, plat.width, plat.height - 8);

          // Hoa văn khối đá xếp tầng
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          for (let bx = 0; bx < plat.width; bx += 32) {
            ctx.strokeRect(screenPlatX + bx, plat.y + 8, 32, plat.height - 8);
          }
        }
      });

      // C. VẼ CĂN CỨ BOSS MÀN 1 (Defense Wall Base)
      const boss = bossRef.current;
      const screenBossX = boss.x - camX;
      if (screenBossX < ARENA_WIDTH + 100 && screenBossX + boss.width > -100) {
        ctx.save();
        ctx.translate(screenBossX, boss.y);

        // Bức tường thép phòng thủ kiên cố
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, boss.width, boss.height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, boss.width, boss.height);

        // LÔ CỐT PHÁO TRÊN
        if (boss.topTurretHp > 0) {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(30, 65, 20, 0, Math.PI * 2);
          ctx.fill();
          // Nòng súng pháo đen hướng về người chơi
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-15, 61, 30, 8);
        } else {
          // Pháo bị phá hủy
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(10, 50, 40, 30);
        }

        // LÔ CỐT PHÁO DƯỚI
        if (boss.bottomTurretHp > 0) {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(30, 195, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-15, 191, 30, 8);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(10, 180, 40, 30);
        }

        // TRÁI TIM NĂNG LƯỢNG ĐỎ TRUNG TÂM (RED CORE)
        const coreY = 135;
        const pulse = Math.sin(Date.now() / 150) * 4;
        ctx.fillStyle = boss.isCoreDestroyed ? '#1e293b' : '#ef4444';
        ctx.beginPath();
        ctx.arc(30, coreY, 22 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // D. VẼ QUÂN ĐỊCH (ENEMIES)
      enemiesRef.current.forEach((en) => {
        if (!en.isAlive) return;
        const sx = en.x - camX;
        if (sx < -60 || sx > ARENA_WIDTH + 60) return;

        ctx.save();
        ctx.translate(sx, en.y);

        if (en.type === 'runner') {
          // Bộ binh địch chạy (Quần đỏ, áo trắng)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, 26, 18, 22); // Quần đỏ
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(4, 12, 18, 14); // Áo trắng
          // Đầu và mũ sắt
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(6, 2, 14, 10);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, 0, 18, 4);
          // Súng trường
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-4, 18, 12, 4);
        } else if (en.type === 'sniper') {
          // Xạ thủ bắn tỉa nấp trong lùm cây
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, 10, 18, 18);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-8, 16, 16, 4);
        } else if (en.type === 'turret') {
          // Tháp pháo xoay ẩn trong vách núi
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(en.width / 2, en.height / 2, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Nòng súng đen
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-6, en.height / 2 - 3, 12, 6);
        } else if (en.type === 'capsule') {
          // Viên nang bay Falcon chứa vũ khí
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(en.width / 2, en.height / 2, 16, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Chữ cái huy hiệu
          ctx.fillStyle = '#ffffff';
          ctx.font = 'black 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(en.itemDrop === 'spread' ? 'S' : en.itemDrop === 'laser' ? 'L' : en.itemDrop === 'barrier' ? 'B' : 'M', en.width / 2, en.height / 2 + 4);
        }

        ctx.restore();
      });

      // E. VẼ VẬT PHẨM VŨ KHÍ RƠI TRÊN MẶT ĐẤT
      itemsRef.current.forEach((it) => {
        if (!it.isAlive) return;
        const sx = it.x - camX;
        ctx.save();
        ctx.translate(sx, it.y);

        // Hào quang chớp sáng
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.type === 'spread' ? 'S' : it.type === 'laser' ? 'L' : it.type === 'barrier' ? 'B' : 'M', 0, 0);
        ctx.restore();
      });

      // F. VẼ VIÊN ĐẠN BAY TRÊN MÀN HÌNH
      bulletsRef.current.forEach((b) => {
        const sx = b.x - camX;
        ctx.save();
        ctx.translate(sx, b.y);

        if (b.isSpread) {
          // Đạn hoa cải S màu đỏ cam rực lửa
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.isLaser) {
          // Tia laser dài xanh neon
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-12, -2, 24, 4);
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // G. VẼ BIỆT KÍCH RAMBO BILL RIZER (PLAYER HERO)
      const p = playerRef.current;
      const screenPX = p.x - camX;

      ctx.save();
      ctx.translate(screenPX, p.y);

      // Khiên hộ mệnh bất tử cầu vồng (Barrier B)
      if (p.barrierTimer > 0) {
        const bPulse = Math.sin(Date.now() / 80) * 3;
        ctx.strokeStyle = ['#ef4444', '#f59e0b', '#38bdf8', '#a855f7'][Math.floor(Date.now() / 100) % 4];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.width / 2, p.height / 2, 34 + bPulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Nhấp nháy khi vừa hồi sinh bất tử
      if (p.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      if (p.isInWater) {
        // Đang ngâm mình dưới nước: Chỉ nhô đầu và súng lên
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(6, p.height - 18, 16, 12);
        // Khăn rằn đỏ đặc trưng
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, p.height - 20, 20, 4);
        // Súng nhô lên mặt nước
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.facing === 'right' ? 14 : -6, p.height - 14, 18, 4);
      } else if (p.isProne) {
        // Nằm rạp người xuống đất
        // Thân người nằm dài
        ctx.fillStyle = '#1e3a8a'; // Quần xanh
        ctx.fillRect(p.facing === 'right' ? 0 : 10, p.height - 14, 26, 12);
        // Ngực trần cơ bắp
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(p.facing === 'right' ? 24 : 0, p.height - 14, 16, 12);
        // Khăn đỏ
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.facing === 'right' ? 34 : 0, p.height - 16, 8, 4);
        // Súng chĩa ngang mặt đất
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.facing === 'right' ? 38 : -14, p.height - 8, 20, 4);
      } else if (p.isJumping) {
        // Động tác nhảy lộn nhào thành quả cầu lửa xoay tròn kinh điển
        const spinAngle = (Date.now() / 80) * (p.facing === 'right' ? 1 : -1);
        ctx.save();
        ctx.translate(p.width / 2, p.height / 2);
        ctx.rotate(spinAngle);
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-6, -10, 12, 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-8, -12, 16, 4);
        ctx.restore();
      } else {
        // Đứng hoặc chạy bình thường
        // Chân & Quần xanh quân đội
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(4, 28, 9, 24);
        ctx.fillRect(15, 28, 9, 24);

        // Thân người & Ngực trần cơ bắp
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(4, 12, 20, 16);

        // Dây đạn chéo qua vai
        ctx.fillStyle = '#facc15';
        ctx.fillRect(6, 12, 4, 16);

        // Đầu & Tóc nâu
        ctx.fillStyle = '#78350f';
        ctx.fillRect(6, 2, 16, 10);
        // Khăn rằn đỏ quấn trán
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, 3, 20, 4);
        // Đuôi khăn bay sau đầu
        ctx.fillRect(p.facing === 'right' ? 0 : 20, 4, 6, 2);

        // Khẩu súng lớn chĩa theo hướng ngắm
        ctx.fillStyle = '#0f172a';
        if (p.aimDir === 'up') {
          ctx.fillRect(p.width / 2 - 3, -12, 6, 24);
        } else if (p.aimDir === 'up-right') {
          ctx.save();
          ctx.translate(14, 16);
          ctx.rotate(-Math.PI / 4);
          ctx.fillRect(0, -3, 22, 6);
          ctx.restore();
        } else if (p.aimDir === 'up-left') {
          ctx.save();
          ctx.translate(14, 16);
          ctx.rotate(-3 * Math.PI / 4);
          ctx.fillRect(0, -3, 22, 6);
          ctx.restore();
        } else {
          ctx.fillRect(p.facing === 'right' ? 14 : -12, 18, 26, 6);
        }
      }

      ctx.restore();

      // H. HẠT BỤI NỔ & TEXT NỔI (Particles & Floating Texts)
      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x - camX, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x - camX, ft.y);
        ctx.restore();
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
      ctx.fillText('CONTRA COMMAND', SIDEBAR_X + SIDEBAR_WIDTH / 2, 26);

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

      ctx.fillStyle = weapon === 'spread' ? '#ef4444' : weapon === 'laser' ? '#38bdf8' : '#facc15';
      ctx.font = 'black 22px monospace';
      const wLabel = weapon === 'spread' ? '[ S ] SPREAD' : weapon === 'laser' ? '[ L ] LASER' : weapon === 'machine' ? '[ M ] MACHINE' : '[ R ] RIFLE';
      ctx.fillText(wLabel, SIDEBAR_X + SIDEBAR_WIDTH / 2, wbY + 32);

      // 2. MẠNG SỐNG BIỆT KÍCH (Lives)
      const livesY = 120;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('QUÂN SỐ MẠNG', SIDEBAR_X + SIDEBAR_WIDTH / 2, livesY);

      const spacing = 34;
      const centerX = SIDEBAR_X + SIDEBAR_WIDTH / 2;
      for (let i = 0; i < 3; i++) {
        const lx = centerX + (i - 1) * spacing;
        const ly = livesY + 24;
        const hasLife = i < lives;

        ctx.fillStyle = hasLife ? '#dc2626' : '#1e293b';
        ctx.beginPath();
        ctx.arc(lx, ly, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hasLife ? '#f87171' : '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = hasLife ? '#ffffff' : '#64748b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(hasLife ? '♥' : '✖', lx, ly);
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
      ctx.fillText(`ĐÃ DIỆT: ${enemiesKilled} ĐỊCH`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 295);

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
      ctx.fillText(`${score.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 54);

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
  }, [
    isPaused, 
    isGameOver, 
    isVictory, 
    stage, 
    score, 
    highScore, 
    lives, 
    weapon, 
    enemiesKilled, 
    gameMode, 
    resetGame, 
    handlePlayerShoot, 
    playExplosionSound, 
    playPowerupSound,
    triggerShake
  ]);

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

        {/* Điều khiển ảo trên Điện thoại Mobile */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
          {/* Cụm D-Pad ảo (Trái, Phải, Ngắm Lên, Nằm Xuống) */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex justify-center">
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowUp'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowUp'] = false; }}
                className="w-12 h-12 bg-slate-800/80 active:bg-red-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowLeft'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowLeft'] = false; }}
                className="w-12 h-12 bg-slate-800/80 active:bg-red-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowDown'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowDown'] = false; }}
                className="w-12 h-12 bg-slate-800/80 active:bg-red-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                onTouchStart={() => { keysPressedRef.current['ArrowRight'] = true; }}
                onTouchEnd={() => { keysPressedRef.current['ArrowRight'] = false; }}
                className="w-12 h-12 bg-slate-800/80 active:bg-red-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cụm Nút NHẢY và BẮN */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onTouchStart={handlePlayerJump}
              className="w-14 h-14 rounded-2xl bg-slate-800/90 active:bg-amber-500 border border-white/20 text-white font-bold text-xs flex flex-col items-center justify-center"
            >
              <Crosshair className="w-5 h-5 mb-0.5 text-amber-400" />
              <span>NHẢY</span>
            </button>

            <button
              onTouchStart={handlePlayerShoot}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30 text-xs flex-col"
            >
              <Zap className="w-6 h-6 mb-0.5 fill-white" />
              <span>BẮN</span>
            </button>
          </div>
        </div>

        {/* Modal Thắng Màn */}
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
