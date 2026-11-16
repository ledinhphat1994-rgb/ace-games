import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Heart, 
  Crosshair, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'endless';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Các loại địa hình
const TILE_EMPTY = 0;
const TILE_BRICK = 1;
const TILE_STEEL = 2;
const TILE_FOREST = 3;
const TILE_WATER = 4;
const TILE_ICE = 5;

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Chiến trường 26 cột x 16 hàng (mỗi ô 32x32px, tổng 832x512px)
const GRID_COLS = 26;
const GRID_ROWS = 16;
const TILE_SIZE = 32;
const ARENA_WIDTH = GRID_COLS * TILE_SIZE; // 832px
const ARENA_HEIGHT = GRID_ROWS * TILE_SIZE; // 512px
const OFFSET_X = (CANVAS_WIDTH - ARENA_WIDTH) / 2; // 64px
const OFFSET_Y = (CANVAS_HEIGHT - ARENA_HEIGHT) / 2; // 14px

// Kích thước xe tăng: 28x28px
const TANK_SIZE = 28;

type TankType = 'player' | 'basic' | 'fast' | 'power' | 'armor';
type PowerUpType = 'star' | 'grenade' | 'helmet' | 'clock' | 'shovel' | 'tank';

interface Bullet {
  id: number;
  x: number;
  y: number;
  dir: Direction;
  speed: number;
  isPlayer: boolean;
  canBreakSteel: boolean;
  isAlive: boolean;
}

interface Tank {
  id: number;
  x: number;
  y: number;
  dir: Direction;
  speed: number;
  type: TankType;
  level: number; // 1..4 cho xe tăng người chơi
  hp: number;
  maxHp: number;
  shieldTime: number; // thời gian khiên bảo vệ bất tử (ms)
  shootCooldown: number; // thời gian giãn cách giữa các phát bắn (ms)
  isAlive: boolean;
  isBonus?: boolean; // xe tăng đỏ nhấp nháy mang item
  moveTimer?: number; // AI đổi hướng
  shootTimer?: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  duration: number; // ms tồn tại trên map
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
  life: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

// Map mẫu cho từng màn chơi
const LEVEL_MAPS: Record<number, number[][]> = {
  1: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,2,2,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,2,2,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,2,2,2,2,1,1,0,0,1,1,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,0,1,1,0,0,1,1,2,2,2,2,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  ],
  2: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,3,3,0,1,1,0,4,4,0,0,4,4,0,1,1,0,3,3,0,1,1,0],
    [0,1,1,0,3,3,0,1,1,0,4,4,0,0,4,4,0,1,1,0,3,3,0,1,1,0],
    [0,2,2,0,1,1,0,2,2,0,4,4,0,0,4,4,0,2,2,0,1,1,0,2,2,0],
    [0,2,2,0,1,1,0,2,2,0,0,0,2,2,0,0,0,2,2,0,1,1,0,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,0,0,4,4,4,4,0,0,0,0,0,0,4,4,4,4,0,0,1,1,1,1],
    [1,1,1,1,0,0,4,4,4,4,0,0,0,0,0,0,4,4,4,4,0,0,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,3,3,0,1,1,0,0,2,2,2,2,0,0,1,1,0,3,3,0,1,1,0],
    [0,1,1,0,3,3,0,1,1,0,0,0,0,0,0,0,0,1,1,0,3,3,0,1,1,0],
    [0,2,2,0,1,1,0,2,2,0,1,1,0,0,1,1,0,2,2,0,1,1,0,2,2,0],
    [0,2,2,0,1,1,0,2,2,0,1,1,0,0,1,1,0,2,2,0,1,1,0,2,2,0],
    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
  ],
  3: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,2,0,0,1,1,0,0,3,3,0,0,0,0,3,3,0,0,1,1,0,0,2,2,0],
    [0,2,2,0,0,1,1,0,0,3,3,0,2,2,0,3,3,0,0,1,1,0,0,2,2,0],
    [0,1,1,5,5,1,1,5,5,1,1,0,2,2,0,1,1,5,5,1,1,5,5,1,1,0],
    [0,1,1,5,5,1,1,5,5,1,1,0,0,0,0,1,1,5,5,1,1,5,5,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,3,3,0,0,4,4,0,0,2,2,1,1,1,1,2,2,0,0,4,4,0,0,3,3,0],
    [0,3,3,0,0,4,4,0,0,2,2,0,0,0,0,2,2,0,0,4,4,0,0,3,3,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,0,2,2,0,0,1,1,2,2,2,2,1,1,0,0,2,2,0,0,1,1,0],
    [0,1,1,0,0,2,2,0,0,1,1,2,2,2,2,1,1,0,0,2,2,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  ]
};

export const GameTank1990: React.FC = () => {
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('acegames_tank_1990_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_tank_1990');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['classic', 'speed', 'endless'].includes(parsed.gameMode)) return parsed.gameMode;
      }
    } catch {}
    return 'classic';
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [enemiesRemaining, setEnemiesRemaining] = useState(20);
  const [screenShake, setScreenShake] = useState(false);

  // Trạng thái thế giới game
  const mapGridRef = useRef<number[][]>([]);
  const playerTankRef = useRef<Tank>({
    id: 1,
    x: OFFSET_X + 9 * TILE_SIZE,
    y: OFFSET_Y + 14 * TILE_SIZE,
    dir: 'UP',
    speed: 3.2,
    type: 'player',
    level: 1,
    hp: 1,
    maxHp: 1,
    shieldTime: 3500, // khiên bảo vệ lúc xuất hiện
    shootCooldown: 0,
    isAlive: true,
  });

  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Trạng thái căn cứ đại bàng
  const isBaseDestroyedRef = useRef<boolean>(false);
  const shovelTimerRef = useRef<number>(0); // thời gian tường thép quanh đại bàng
  const freezeTimerRef = useRef<number>(0); // thời gian đóng băng địch

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Âm thanh Web Audio API
  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1, gain: number = 0.08) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const playShootSound = useCallback(() => {
    playTone(520, 'square', 0.08, 0.06);
  }, [playTone]);

  const playHitSteelSound = useCallback(() => {
    playTone(850, 'triangle', 0.06, 0.08);
  }, [playTone]);

  const playBrickBreakSound = useCallback(() => {
    playTone(220, 'sawtooth', 0.12, 0.09);
  }, [playTone]);

  const playExplosionSound = useCallback(() => {
    playTone(85, 'sawtooth', 0.35, 0.18);
    setTimeout(() => playTone(60, 'triangle', 0.4, 0.14), 40);
  }, [playTone]);

  const playPowerUpSound = useCallback(() => {
    playTone(587, 'triangle', 0.08, 0.1);
    setTimeout(() => playTone(880, 'sine', 0.12, 0.1), 60);
    setTimeout(() => playTone(1174, 'sine', 0.18, 0.1), 120);
  }, [playTone]);

  // Khởi tạo bản đồ theo màn chơi
  const initMap = useCallback((stg: number) => {
    const mapTemplate = LEVEL_MAPS[stg] || LEVEL_MAPS[1];
    mapGridRef.current = mapTemplate.map(row => [...row]);
    isBaseDestroyedRef.current = false;
    shovelTimerRef.current = 0;
    freezeTimerRef.current = 0;
  }, []);

  // Khởi động màn chơi
  const startStage = useCallback((stg: number) => {
    setStage(stg);
    initMap(stg);
    setEnemiesRemaining(20);
    setIsGameOver(false);
    setIsVictory(false);

    // Đặt lại vị trí xe tăng người chơi
    playerTankRef.current = {
      id: 1,
      x: OFFSET_X + 9 * TILE_SIZE,
      y: OFFSET_Y + 14 * TILE_SIZE,
      dir: 'UP',
      speed: mode === 'speed' ? 4.0 : 3.2,
      type: 'player',
      level: playerTankRef.current.level || 1,
      hp: 1,
      maxHp: 1,
      shieldTime: 4000,
      shootCooldown: 0,
      isAlive: true,
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
  }, [initMap, mode]);

  useEffect(() => {
    startStage(1);
  }, [startStage]);

  // Kiểm tra va chạm hộp (AABB)
  const isColliding = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Kiểm tra xe tăng có thể đi vào vị trí (x, y) không
  const canMoveTo = (tankId: number, nextX: number, nextY: number, size: number) => {
    // 1. Biên chiến trường
    if (
      nextX < OFFSET_X ||
      nextX + size > OFFSET_X + ARENA_WIDTH ||
      nextY < OFFSET_Y ||
      nextY + size > OFFSET_Y + ARENA_HEIGHT
    ) {
      return false;
    }

    // 2. Va chạm với căn cứ đại bàng (Cột 12-13, hàng 14-15)
    const baseBox = {
      x: OFFSET_X + 12 * TILE_SIZE,
      y: OFFSET_Y + 14 * TILE_SIZE,
      w: TILE_SIZE * 2,
      h: TILE_SIZE * 2,
    };
    if (isColliding(nextX, nextY, size, size, baseBox.x, baseBox.y, baseBox.w, baseBox.h)) {
      return false;
    }

    // 3. Va chạm với các ô địa hình (Gạch, Thép, Sông nước)
    const startCol = Math.floor((nextX - OFFSET_X) / TILE_SIZE);
    const endCol = Math.floor((nextX + size - 1 - OFFSET_X) / TILE_SIZE);
    const startRow = Math.floor((nextY - OFFSET_Y) / TILE_SIZE);
    const endRow = Math.floor((nextY + size - 1 - OFFSET_Y) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          const tile = mapGridRef.current[r][c];
          if (tile === TILE_BRICK || tile === TILE_STEEL || tile === TILE_WATER) {
            return false;
          }
        }
      }
    }

    // 4. Va chạm với xe tăng khác
    // Người chơi với địch
    if (tankId === 1) {
      for (const e of enemiesRef.current) {
        if (e.isAlive && isColliding(nextX, nextY, size, size, e.x, e.y, TANK_SIZE, TANK_SIZE)) {
          return false;
        }
      }
    } else {
      // Địch với người chơi
      const p = playerTankRef.current;
      if (p.isAlive && isColliding(nextX, nextY, size, size, p.x, p.y, TANK_SIZE, TANK_SIZE)) {
        return false;
      }
      // Địch với địch khác
      for (const other of enemiesRef.current) {
        if (other.id !== tankId && other.isAlive && isColliding(nextX, nextY, size, size, other.x, other.y, TANK_SIZE, TANK_SIZE)) {
          return false;
        }
      }
    }

    return true;
  };

  // Người chơi bắn đạn
  const handlePlayerShoot = useCallback(() => {
    const p = playerTankRef.current;
    if (!p.isAlive || isPaused || isGameOver || isVictory || p.shootCooldown > 0) return;

    // Giới hạn số lượng đạn cùng lúc: cấp 3-4 bắn 2 viên, cấp 1-2 bắn 1 viên
    const maxPlayerBullets = p.level >= 3 ? 2 : 1;
    const currentBullets = bulletsRef.current.filter(b => b.isAlive && b.isPlayer).length;
    if (currentBullets >= maxPlayerBullets) return;

    let bulletX = p.x + TANK_SIZE / 2;
    let bulletY = p.y + TANK_SIZE / 2;
    const bulletSpeed = p.level >= 2 ? 9.5 : 7.2;

    switch (p.dir) {
      case 'UP': bulletY = p.y - 4; break;
      case 'DOWN': bulletY = p.y + TANK_SIZE + 4; break;
      case 'LEFT': bulletX = p.x - 4; break;
      case 'RIGHT': bulletX = p.x + TANK_SIZE + 4; break;
    }

    bulletsRef.current.push({
      id: Date.now() + Math.random(),
      x: bulletX,
      y: bulletY,
      dir: p.dir,
      speed: bulletSpeed,
      isPlayer: true,
      canBreakSteel: p.level >= 4,
      isAlive: true,
    });

    p.shootCooldown = 220; // 220ms
    playShootSound();
  }, [isGameOver, isPaused, isVictory, playShootSound]);

  // Địch bắn đạn
  const handleEnemyShoot = (enemy: Tank) => {
    if (!enemy.isAlive) return;
    let bulletX = enemy.x + TANK_SIZE / 2;
    let bulletY = enemy.y + TANK_SIZE / 2;
    const bulletSpeed = enemy.type === 'power' ? 9.0 : 6.0;

    switch (enemy.dir) {
      case 'UP': bulletY = enemy.y - 4; break;
      case 'DOWN': bulletY = enemy.y + TANK_SIZE + 4; break;
      case 'LEFT': bulletX = enemy.x - 4; break;
      case 'RIGHT': bulletX = enemy.x + TANK_SIZE + 4; break;
    }

    bulletsRef.current.push({
      id: Date.now() + Math.random(),
      x: bulletX,
      y: bulletY,
      dir: enemy.dir,
      speed: bulletSpeed,
      isPlayer: false,
      canBreakSteel: false,
      isAlive: true,
    });
  };

  // Sinh xe tăng địch mới tại 1 trong 3 điểm spawn trên đỉnh bản đồ
  const spawnEnemy = useCallback(() => {
    if (enemiesRemaining <= 0 || enemiesRef.current.filter(e => e.isAlive).length >= 5) return;

    const spawnPoints = [
      { col: 1, row: 1 },
      { col: 12, row: 1 },
      { col: 24, row: 1 },
    ];
    const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const spawnX = OFFSET_X + sp.col * TILE_SIZE;
    const spawnY = OFFSET_Y + sp.row * TILE_SIZE;

    // Kiểm tra điểm spawn có bị xe khác chặn không
    for (const e of enemiesRef.current) {
      if (e.isAlive && Math.hypot(e.x - spawnX, e.y - spawnY) < 32) return;
    }

    const rand = Math.random();
    let type: TankType = 'basic';
    let hp = 1;
    let speed = 2.0;

    if (rand < 0.4) {
      type = 'basic';
      hp = 1;
      speed = 2.2;
    } else if (rand < 0.7) {
      type = 'fast';
      hp = 1;
      speed = 3.6;
    } else if (rand < 0.88) {
      type = 'power';
      hp = 1;
      speed = 2.4;
    } else {
      type = 'armor';
      hp = 4;
      speed = 1.8;
    }

    // 25% cơ hội xe mang quà viện trợ (nhấp nháy đỏ)
    const isBonus = Math.random() < 0.25;

    enemiesRef.current.push({
      id: Date.now() + Math.random(),
      x: spawnX,
      y: spawnY,
      dir: 'DOWN',
      speed,
      type,
      level: 1,
      hp,
      maxHp: hp,
      shieldTime: 0,
      shootCooldown: 0,
      isAlive: true,
      isBonus,
      moveTimer: 0,
      shootTimer: Math.random() * 80 + 30,
    });

    setEnemiesRemaining(r => r - 1);
  }, [enemiesRemaining]);

  // Sinh vật phẩm viện trợ ngẫu nhiên
  const dropPowerUp = (x: number, y: number) => {
    const types: PowerUpType[] = ['star', 'grenade', 'helmet', 'clock', 'shovel', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      type,
      duration: 15000, // 15 giây
    });
  };

  // Kích hoạt tác dụng của vật phẩm viện trợ
  const applyPowerUp = (type: PowerUpType) => {
    playPowerUpSound();
    const p = playerTankRef.current;

    switch (type) {
      case 'star':
        p.level = Math.min(4, p.level + 1);
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: `NÂNG CẤP CẤP ${p.level}! 🌟`,
          color: '#facc15',
          alpha: 1,
        });
        break;

      case 'grenade':
        // Tiêu diệt toàn bộ địch trên sân
        enemiesRef.current.forEach(e => {
          if (e.isAlive) {
            e.isAlive = false;
            setScore(s => s + 200);
          }
        });
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
        playExplosionSound();
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: 'BOM NỔ TOÀN BẢN ĐỒ! 💣',
          color: '#ef4444',
          alpha: 1,
        });
        break;

      case 'helmet':
        p.shieldTime = 12000; // 12 giây bất tử
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: 'KHIÊN BẤT TỬ! 🛡️',
          color: '#38bdf8',
          alpha: 1,
        });
        break;

      case 'clock':
        freezeTimerRef.current = 8000; // 8 giây đóng băng
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: 'ĐÓNG BĂNG ĐỊCH! ⏱️',
          color: '#22d3ee',
          alpha: 1,
        });
        break;

      case 'shovel':
        // Đổi tường gạch quanh đại bàng thành thép 15 giây
        shovelTimerRef.current = 15000;
        setBaseProtection(TILE_STEEL);
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: 'TƯỜNG THÉP BẢO VỆ! 🧱',
          color: '#e2e8f0',
          alpha: 1,
        });
        break;

      case 'tank':
        setLives(l => l + 1);
        floatingTextsRef.current.push({
          id: Date.now(),
          x: p.x,
          y: p.y - 10,
          text: '+1 MẠNG! 💖',
          color: '#f43f5e',
          alpha: 1,
        });
        break;
    }
  };

  // Đổi vật liệu tường bảo vệ đại bàng (Gạch hoặc Thép)
  const setBaseProtection = (tileType: number) => {
    const grid = mapGridRef.current;
    if (!grid || grid.length < 16) return;
    const coords = [
      [13, 11], [13, 12], [13, 13], [13, 14],
      [14, 11], [14, 14],
      [15, 11], [15, 14],
    ];
    coords.forEach(([r, c]) => {
      if (grid[r] && grid[r][c] !== undefined) {
        grid[r][c] = tileType;
      }
    });
  };

  // Bắt phím điều khiển từ bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'KeyJ') {
        e.preventDefault();
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
  }, [handlePlayerShoot]);

  // Vòng lặp chính của Game (60 FPS Physics & Render Loop)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min(currentTime - lastTime, 40); // clamp delta time
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2;
      const targetWidth = CANVAS_WIDTH * dpr;
      const targetHeight = CANVAS_HEIGHT * dpr;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- 1. CẬP NHẬT VẬT LÝ & LOGIC ---
      if (!isPaused && !isGameOver && !isVictory) {
        // Sinh xe tăng địch định kỳ
        spawnTimer += dt;
        if (spawnTimer >= 2200) {
          spawnTimer = 0;
          spawnEnemy();
        }

        // Đếm lùi xẻng công binh
        if (shovelTimerRef.current > 0) {
          shovelTimerRef.current -= dt;
          if (shovelTimerRef.current <= 0) {
            setBaseProtection(TILE_BRICK);
          }
        }

        // Đếm lùi đóng băng địch
        if (freezeTimerRef.current > 0) {
          freezeTimerRef.current -= dt;
        }

        // Cập nhật người chơi (Player Tank)
        const p = playerTankRef.current;
        if (p.isAlive) {
          if (p.shieldTime > 0) p.shieldTime -= dt;
          if (p.shootCooldown > 0) p.shootCooldown -= dt;

          const keys = keysPressedRef.current;
          let moveDir: Direction | null = null;
          if (keys['KeyW'] || keys['ArrowUp']) moveDir = 'UP';
          else if (keys['KeyS'] || keys['ArrowDown']) moveDir = 'DOWN';
          else if (keys['KeyA'] || keys['ArrowLeft']) moveDir = 'LEFT';
          else if (keys['KeyD'] || keys['ArrowRight']) moveDir = 'RIGHT';

          if (moveDir) {
            p.dir = moveDir;
            let nx = p.x;
            let ny = p.y;
            switch (moveDir) {
              case 'UP': ny -= p.speed; break;
              case 'DOWN': ny += p.speed; break;
              case 'LEFT': nx -= p.speed; break;
              case 'RIGHT': nx += p.speed; break;
            }

            if (canMoveTo(1, nx, ny, TANK_SIZE)) {
              p.x = nx;
              p.y = ny;
            } else {
              // Căn chỉnh trục khi rẽ góc hẹp (Auto Align)
              if (moveDir === 'UP' || moveDir === 'DOWN') {
                const alignCol = Math.round((p.x - OFFSET_X) / (TILE_SIZE / 2)) * (TILE_SIZE / 2) + OFFSET_X;
                if (Math.abs(p.x - alignCol) < 6) p.x = alignCol;
              } else {
                const alignRow = Math.round((p.y - OFFSET_Y) / (TILE_SIZE / 2)) * (TILE_SIZE / 2) + OFFSET_Y;
                if (Math.abs(p.y - alignRow) < 6) p.y = alignRow;
              }
            }
          }

          // Kiểm tra nhặt Power-Up
          powerUpsRef.current = powerUpsRef.current.filter(pu => {
            if (isColliding(p.x, p.y, TANK_SIZE, TANK_SIZE, pu.x, pu.y, 26, 26)) {
              applyPowerUp(pu.type);
              setScore(s => s + 500);
              return false;
            }
            return true;
          });
        }

        // Cập nhật xe tăng địch (Enemy Tanks)
        const isFrozen = freezeTimerRef.current > 0;
        for (const e of enemiesRef.current) {
          if (!e.isAlive) continue;

          if (!isFrozen) {
            e.moveTimer = (e.moveTimer || 0) + 1;
            e.shootTimer = (e.shootTimer || 0) - 1;

            if (e.shootTimer <= 0) {
              handleEnemyShoot(e);
              e.shootTimer = Math.random() * 80 + 40;
            }

            // Đổi hướng AI khi gặp vật cản hoặc định kỳ
            if (e.moveTimer >= 70 || Math.random() < 0.02) {
              e.moveTimer = 0;
              const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
              // Ưu tiên hướng DOWN để công phá đại bàng
              if (Math.random() < 0.4) {
                e.dir = 'DOWN';
              } else {
                e.dir = dirs[Math.floor(Math.random() * dirs.length)];
              }
            }

            let enx = e.x;
            let eny = e.y;
            switch (e.dir) {
              case 'UP': eny -= e.speed; break;
              case 'DOWN': eny += e.speed; break;
              case 'LEFT': enx -= e.speed; break;
              case 'RIGHT': enx += e.speed; break;
            }

            if (canMoveTo(e.id, enx, eny, TANK_SIZE)) {
              e.x = enx;
              e.y = eny;
            } else {
              // Bị cản: đổi hướng ngẫu nhiên
              const otherDirs: Direction[] = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter(d => d !== e.dir);
              e.dir = otherDirs[Math.floor(Math.random() * otherDirs.length)];
            }
          }
        }

        // Cập nhật đạn bay (Bullets Physics)
        for (const b of bulletsRef.current) {
          if (!b.isAlive) continue;

          switch (b.dir) {
            case 'UP': b.y -= b.speed; break;
            case 'DOWN': b.y += b.speed; break;
            case 'LEFT': b.x -= b.speed; break;
            case 'RIGHT': b.x += b.speed; break;
          }

          // 1. Đạn bay ra ngoài biên
          if (
            b.x < OFFSET_X ||
            b.x > OFFSET_X + ARENA_WIDTH ||
            b.y < OFFSET_Y ||
            b.y > OFFSET_Y + ARENA_HEIGHT
          ) {
            b.isAlive = false;
            continue;
          }

          // 2. Đạn bắn trúng căn cứ Đại Bàng
          const baseBox = {
            x: OFFSET_X + 12 * TILE_SIZE,
            y: OFFSET_Y + 14 * TILE_SIZE,
            w: TILE_SIZE * 2,
            h: TILE_SIZE * 2,
          };
          if (isColliding(b.x - 3, b.y - 3, 6, 6, baseBox.x, baseBox.y, baseBox.w, baseBox.h)) {
            b.isAlive = false;
            isBaseDestroyedRef.current = true;
            playExplosionSound();
            setIsGameOver(true);
            continue;
          }

          // 3. Đạn va chạm địa hình gạch/thép
          const col = Math.floor((b.x - OFFSET_X) / TILE_SIZE);
          const row = Math.floor((b.y - OFFSET_Y) / TILE_SIZE);

          if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
            const tile = mapGridRef.current[row][col];
            if (tile === TILE_BRICK) {
              b.isAlive = false;
              mapGridRef.current[row][col] = TILE_EMPTY; // phá gạch
              playBrickBreakSound();
              // Hạt bụi gạch văng ra
              for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                  id: Date.now() + Math.random(),
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#b91c1c',
                  size: 2.5,
                  alpha: 1,
                  life: 15,
                });
              }
              continue;
            } else if (tile === TILE_STEEL) {
              b.isAlive = false;
              if (b.canBreakSteel) {
                mapGridRef.current[row][col] = TILE_EMPTY; // xe cấp 4 phá được thép
                playBrickBreakSound();
              } else {
                playHitSteelSound();
              }
              continue;
            }
          }

          // 4. Đạn người chơi bắn trúng xe tăng địch
          if (b.isPlayer) {
            for (const e of enemiesRef.current) {
              if (e.isAlive && isColliding(b.x - 3, b.y - 3, 6, 6, e.x, e.y, TANK_SIZE, TANK_SIZE)) {
                b.isAlive = false;
                e.hp -= 1;

                if (e.hp <= 0) {
                  e.isAlive = false;
                  playExplosionSound();
                  setScore(s => {
                    const ns = s + (e.type === 'armor' ? 400 : e.type === 'power' ? 300 : 200);
                    if (ns > highScore) {
                      setHighScore(ns);
                      try {
                        localStorage.setItem('acegames_tank_1990_highscore', ns.toString());
                      } catch {}
                    }
                    return ns;
                  });

                  // Hiệu ứng nổ lớn
                  for (let i = 0; i < 16; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 1.5 + Math.random() * 4;
                    particlesRef.current.push({
                      id: Date.now() + Math.random(),
                      x: e.x + TANK_SIZE / 2,
                      y: e.y + TANK_SIZE / 2,
                      vx: Math.cos(ang) * spd,
                      vy: Math.sin(ang) * spd,
                      color: i % 2 === 0 ? '#f59e0b' : '#ef4444',
                      size: 3.5,
                      alpha: 1,
                      life: 25,
                    });
                  }

                  // Rơi vật phẩm viện trợ nếu là xe bonus
                  if (e.isBonus) {
                    dropPowerUp(e.x, e.y);
                  }
                } else {
                  playHitSteelSound(); // trúng giáp dày
                }
                break;
              }
            }
          } else {
            // 5. Đạn địch bắn trúng người chơi
            const p = playerTankRef.current;
            if (p.isAlive && p.shieldTime <= 0 && isColliding(b.x - 3, b.y - 3, 6, 6, p.x, p.y, TANK_SIZE, TANK_SIZE)) {
              b.isAlive = false;
              playExplosionSound();
              setScreenShake(true);
              setTimeout(() => setScreenShake(false), 300);

              // Giảm cấp độ hoặc mất mạng
              if (p.level > 1) {
                p.level = 1;
                p.shieldTime = 3000;
              } else {
                setLives(l => {
                  const nl = l - 1;
                  if (nl <= 0) {
                    p.isAlive = false;
                    setIsGameOver(true);
                  } else {
                    // Hồi sinh xe tại điểm xuất phát
                    p.x = OFFSET_X + 9 * TILE_SIZE;
                    p.y = OFFSET_Y + 14 * TILE_SIZE;
                    p.dir = 'UP';
                    p.shieldTime = 4000;
                  }
                  return nl;
                });
              }
            }
          }
        }

        // Dọn đạn chết
        bulletsRef.current = bulletsRef.current.filter(b => b.isAlive);

        // Kiểm tra chiến thắng màn chơi
        const remainingLivingEnemies = enemiesRef.current.filter(e => e.isAlive).length;
        if (enemiesRemaining <= 0 && remainingLivingEnemies === 0 && !isGameOver) {
          setIsVictory(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      }

      // --- 2. VẼ TOÀN BỘ ĐỒ HỌA SÂN ĐẤU BATTLE CITY ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Nền tổng thể khung Arcade
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // B. Bảng điều khiển quân sự hai bên lề (Military Side Panels)
      // Panel bên trái
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, OFFSET_X, CANVAS_HEIGHT);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, OFFSET_X, CANVAS_HEIGHT);

      // Panel bên phải
      ctx.fillRect(OFFSET_X + ARENA_WIDTH, 0, OFFSET_X, CANVAS_HEIGHT);
      ctx.strokeRect(OFFSET_X + ARENA_WIDTH, 0, OFFSET_X, CANVAS_HEIGHT);

      // Vẽ icon số lượng xe tăng địch còn lại bên phải
      const enemyIconCols = 2;
      const startDrawX = OFFSET_X + ARENA_WIDTH + 14;
      for (let i = 0; i < enemiesRemaining; i++) {
        const ix = startDrawX + (i % enemyIconCols) * 18;
        const iy = 30 + Math.floor(i / enemyIconCols) * 20;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ix, iy, 12, 12);
        ctx.fillStyle = '#475569';
        ctx.fillRect(ix + 4, iy - 3, 4, 3); // nòng pháo
      }

      // C. Nền sân đấu chính (Battle Arena Surface)
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(OFFSET_X, OFFSET_Y, ARENA_WIDTH, ARENA_HEIGHT);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(OFFSET_X, OFFSET_Y, ARENA_WIDTH, ARENA_HEIGHT);

      // D. Vẽ Địa hình Bản đồ
      const grid = mapGridRef.current;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = grid[r]?.[c];
          if (!tile) continue;

          const tx = OFFSET_X + c * TILE_SIZE;
          const ty = OFFSET_Y + r * TILE_SIZE;

          switch (tile) {
            case TILE_BRICK: {
              // Tường gạch nung đỏ 3D sắc nét
              ctx.fillStyle = '#b91c1c';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              // Rãnh vữa gạch
              ctx.strokeStyle = '#450a0a';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.beginPath();
              ctx.moveTo(tx, ty + TILE_SIZE / 2);
              ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE / 2);
              ctx.moveTo(tx + TILE_SIZE / 2, ty);
              ctx.lineTo(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2);
              ctx.moveTo(tx + TILE_SIZE / 4, ty + TILE_SIZE / 2);
              ctx.lineTo(tx + TILE_SIZE / 4, ty + TILE_SIZE);
              ctx.moveTo(tx + (TILE_SIZE * 3) / 4, ty + TILE_SIZE / 2);
              ctx.lineTo(tx + (TILE_SIZE * 3) / 4, ty + TILE_SIZE);
              ctx.stroke();
              break;
            }

            case TILE_STEEL: {
              // Tường thép trắng bạc kiên cố
              const steelGrad = ctx.createLinearGradient(tx, ty, tx + TILE_SIZE, ty + TILE_SIZE);
              steelGrad.addColorStop(0, '#f8fafc');
              steelGrad.addColorStop(0.5, '#cbd5e1');
              steelGrad.addColorStop(1, '#64748b');
              ctx.fillStyle = steelGrad;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

              // Đinh tán 4 góc
              ctx.fillStyle = '#334155';
              [[4, 4], [28, 4], [4, 28], [28, 28]].forEach(([dx, dy]) => {
                ctx.beginPath();
                ctx.arc(tx + dx, ty + dy, 1.5, 0, Math.PI * 2);
                ctx.fill();
              });
              break;
            }

            case TILE_WATER: {
              // Sông nước xanh biếc có sóng gợn
              const waterGrad = ctx.createLinearGradient(tx, ty, tx, ty + TILE_SIZE);
              waterGrad.addColorStop(0, '#0284c7');
              waterGrad.addColorStop(1, '#0369a1');
              ctx.fillStyle = waterGrad;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              // Gợn sóng lăn tăn
              const waveOff = Math.sin(currentTime * 0.005 + r) * 3;
              ctx.strokeStyle = '#bae6fd';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(tx + 4, ty + 10 + waveOff);
              ctx.lineTo(tx + 28, ty + 10 + waveOff);
              ctx.moveTo(tx + 4, ty + 22 - waveOff);
              ctx.lineTo(tx + 28, ty + 22 - waveOff);
              ctx.stroke();
              break;
            }

            case TILE_ICE: {
              // Băng trượt xanh ngọc
              ctx.fillStyle = '#e0f2fe';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#7dd3fc';
              ctx.lineWidth = 1;
              ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
              break;
            }
          }
        }
      }

      // E. Vẽ Căn cứ Đại Bàng (Eagle Base) tại cột 12-13, hàng 14-15
      const eagleX = OFFSET_X + 12 * TILE_SIZE;
      const eagleY = OFFSET_Y + 14 * TILE_SIZE;
      const isDestroyed = isBaseDestroyedRef.current;

      ctx.save();
      ctx.translate(eagleX, eagleY);

      if (!isDestroyed) {
        // Biểu tượng Đại Bàng Vàng Kiêu Hãnh
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE * 2);

        // Đôi cánh vàng
        ctx.fillStyle = '#eab308';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 48);
        ctx.lineTo(24, 16);
        ctx.lineTo(32, 26);
        ctx.lineTo(40, 16);
        ctx.lineTo(58, 48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đầu chim đại bàng
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, 22, 10, 0, Math.PI * 2);
        ctx.fill();

        // Mỏ vàng nhọn
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(32, 20);
        ctx.lineTo(44, 25);
        ctx.lineTo(32, 30);
        ctx.closePath();
        ctx.fill();

        // Mắt đại bàng
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(36, 21, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Đại bàng bị bắn phá: Đống tro tàn đổ nát
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE * 2);
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☠', 32, 40);
      }
      ctx.restore();

      // F. Vẽ Vật Phẩm Viện Trợ (Power-Ups)
      for (const pu of powerUpsRef.current) {
        const pulse = 1 + Math.sin(currentTime * 0.008) * 0.12;
        ctx.save();
        ctx.translate(pu.x + 13, pu.y + 13);
        ctx.scale(pulse, pulse);

        // Hào quang vật phẩm
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-13, -13, 26, 26, 6);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icon = '🌟';
        if (pu.type === 'grenade') icon = '💣';
        else if (pu.type === 'helmet') icon = '🛡️';
        else if (pu.type === 'clock') icon = '⏱️';
        else if (pu.type === 'shovel') icon = '🧱';
        else if (pu.type === 'tank') icon = '💖';
        ctx.fillText(icon, 0, 1);
        ctx.restore();
      }

      // G. Hàm phụ vẽ xe tăng chi tiết (Player & Enemies)
      const drawTank = (tank: Tank) => {
        if (!tank.isAlive) return;

        ctx.save();
        ctx.translate(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2);

        // Xoay hướng nòng pháo
        let rot = 0;
        if (tank.dir === 'RIGHT') rot = Math.PI / 2;
        else if (tank.dir === 'DOWN') rot = Math.PI;
        else if (tank.dir === 'LEFT') rot = -Math.PI / 2;
        ctx.rotate(rot);

        const isPlayer = tank.type === 'player';

        // 1. Màu sắc xe tăng
        let bodyColor = '#eab308'; // Vàng người chơi
        let treadColor = '#713f12';
        let turretColor = '#ca8a04';

        if (!isPlayer) {
          if (tank.isBonus && Math.floor(currentTime / 150) % 2 === 0) {
            bodyColor = '#ef4444'; // Xe mang quà nhấp nháy đỏ
            turretColor = '#dc2626';
          } else if (tank.type === 'armor') {
            // Giáp dày đổi màu theo máu
            bodyColor = tank.hp === 4 ? '#15803d' : tank.hp === 3 ? '#eab308' : '#ef4444';
            turretColor = '#0f172a';
          } else if (tank.type === 'power') {
            bodyColor = '#0284c7'; // Xe pháo kích xanh
            turretColor = '#0369a1';
          } else if (tank.type === 'fast') {
            bodyColor = '#8b5cf6'; // Xe cơ động tím
            turretColor = '#7c3aed';
          } else {
            bodyColor = '#94a3b8'; // Xe cơ bản xám
            turretColor = '#64748b';
          }
          treadColor = '#1e293b';
        }

        // 2. Hai dải xích xe tăng (Tank Treads)
        ctx.fillStyle = treadColor;
        ctx.fillRect(-14, -14, 6, 28);
        ctx.fillRect(8, -14, 6, 28);

        // Gân bánh xích chuyển động
        const treadOffset = (currentTime * 0.05) % 4;
        ctx.fillStyle = '#0f172a';
        for (let ty = -12 + treadOffset; ty < 12; ty += 5) {
          ctx.fillRect(-14, ty, 6, 1.5);
          ctx.fillRect(8, ty, 6, 1.5);
        }

        // 3. Thân xe tăng (Hull)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-8, -11, 16, 22);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-8, -11, 16, 22);

        // 4. Tháp pháo và Nòng pháo (Turret & Cannon)
        ctx.fillStyle = turretColor;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nòng pháo vươn dài
        const cannonLen = isPlayer && tank.level >= 2 ? 16 : 12;
        const cannonW = isPlayer && tank.level >= 4 ? 4.5 : 3;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-cannonW / 2, -cannonLen, cannonW, cannonLen);

        // Nòng đôi cho người chơi cấp 3
        if (isPlayer && tank.level === 3) {
          ctx.fillRect(-cannonW - 2, -cannonLen + 2, cannonW, cannonLen - 2);
          ctx.fillRect(2, -cannonLen + 2, cannonW, cannonLen - 2);
        }

        ctx.restore();

        // 5. Khiên năng lượng bảo vệ bất tử (Force Shield)
        if (tank.shieldTime > 0) {
          ctx.save();
          ctx.translate(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2);
          ctx.rotate(currentTime * 0.008);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 12;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, TANK_SIZE * 0.75, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      };

      // H. Vẽ xe tăng địch và người chơi
      enemiesRef.current.forEach(drawTank);
      drawTank(playerTankRef.current);

      // I. Vẽ Rừng Cây (FOREST) đè lên xe tăng để tạo hiệu ứng ẩn nấp
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (grid[r]?.[c] === TILE_FOREST) {
            const tx = OFFSET_X + c * TILE_SIZE;
            const ty = OFFSET_Y + r * TILE_SIZE;
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            // Tán lá rậm rạp
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(tx + 8, ty + 8, 6, 0, Math.PI * 2);
            ctx.arc(tx + 24, ty + 10, 7, 0, Math.PI * 2);
            ctx.arc(tx + 12, ty + 24, 7, 0, Math.PI * 2);
            ctx.arc(tx + 24, ty + 24, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // J. Vẽ Đạn (Bullets)
      for (const b of bulletsRef.current) {
        if (!b.isAlive) continue;
        ctx.save();
        ctx.fillStyle = b.isPlayer ? '#fde047' : '#ffffff';
        ctx.shadowColor = b.isPlayer ? '#f59e0b' : '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.canBreakSteel ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // K. Vẽ Hạt nổ (Particles)
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      particlesRef.current = particlesRef.current.filter(pt => pt.alpha > 0);

      // L. Vẽ Chữ bay (Floating Texts)
      for (const ft of floatingTextsRef.current) {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
        ctx.save();
        ctx.font = '900 14px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.alpha > 0);

      ctx.restore(); // scale dpr

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPaused, isVictory, mode, playBrickBreakSound, playExplosionSound, playHitSteelSound, spawnEnemy]);

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setLives(3);
    playerTankRef.current.level = 1;
    startStage(1);
  };

  const nextStage = () => {
    soundManager.playButtonClick();
    startStage(stage + 1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#05070a]">
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
            <span className="text-rose-400 font-mono font-black">{enemiesRemaining}</span>
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
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-235px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-shrink min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Điều khiển ảo trên Điện thoại (Virtual D-Pad & Fire Button) */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-4 z-20">
          {/* D-Pad 4 hướng */}
          <div className="relative w-28 h-28 pointer-events-auto">
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowUp'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowUp'] = false; }}
              className="absolute top-0 left-9 w-10 h-10 bg-slate-800/80 active:bg-amber-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowDown'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowDown'] = false; }}
              className="absolute bottom-0 left-9 w-10 h-10 bg-slate-800/80 active:bg-amber-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowLeft'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowLeft'] = false; }}
              className="absolute top-9 left-0 w-10 h-10 bg-slate-800/80 active:bg-amber-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onTouchStart={() => { keysPressedRef.current['ArrowRight'] = true; }}
              onTouchEnd={() => { keysPressedRef.current['ArrowRight'] = false; }}
              className="absolute top-9 right-0 w-10 h-10 bg-slate-800/80 active:bg-amber-500 rounded-xl border border-white/20 flex items-center justify-center text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Nút Bắn ảo */}
          <div className="pointer-events-auto">
            <button
              onTouchStart={handlePlayerShoot}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 text-white font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30"
            >
              BẮN
            </button>
          </div>
        </div>

        {/* Modal Thắng Màn */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">HOÀN THÀNH MÀN {stage}!</h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              Bạn đã tiêu diệt toàn bộ lực lượng xe tăng địch và bảo vệ căn cứ thành công.
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
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
              {isBaseDestroyedRef.current ? 'CĂN CỨ ĐÃ BỊ PHÁ HỦY!' : 'XE TĂNG ĐÃ BỊ TIÊU DIỆT!'}
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
