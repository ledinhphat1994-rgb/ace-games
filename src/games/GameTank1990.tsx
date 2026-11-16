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

// Chiến trường 24 cột x 15 hàng (mỗi ô 36x36px = 864x540px)
// Vừa khít 100% chiều cao CANVAS_HEIGHT (15 * 36 = 540), KHÔNG CÓ KHE HỞ TRÊN / DƯỚI!
const GRID_COLS = 24;
const GRID_ROWS = 15;
const TILE_SIZE = 36;
const ARENA_WIDTH = GRID_COLS * TILE_SIZE; // 864px
const ARENA_HEIGHT = GRID_ROWS * TILE_SIZE; // 540px

// Sidebar quân sự bên phải (96px)
const SIDEBAR_X = ARENA_WIDTH; // 864px
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH; // 96px

// Kích thước xe tăng: 30x30px (lọt lòng hành lang 36px cực kỳ mượt mà)
const TANK_SIZE = 30;

type TankType = 'player' | 'basic' | 'fast' | 'power' | 'armor';
type PowerUpType = 'star' | 'grenade' | 'helmet' | 'clock' | 'shovel' | 'tank' | 'boat' | 'pistol';

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
  level: number; // 1..4 cho người chơi
  hp: number;
  maxHp: number;
  shieldTime: number; // ms
  isBonus?: boolean; // Xe đỏ mang viện trợ
  isAlive: boolean;
  shootCooldown: number;
  hasBoat?: boolean; // Có thuyền vượt sông
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  blinkTimer: number;
}

interface SpawningEnemy {
  id: number;
  col: number;
  row: number;
  type: TankType;
  isBonus: boolean;
  timeLeft: number; // ms
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

export const GameTank1990: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_tank_1990_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [stage, setStage] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [enemiesRemaining, setEnemiesRemaining] = useState<number>(20);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('classic');
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ma trận địa hình 15 hàng x 24 cột
  const mapGridRef = useRef<number[][]>([]);
  // Mặt nạ 4 góc cho tường gạch (bit 0: TL, bit 1: TR, bit 2: BL, bit 3: BR, 15 = nguyên vẹn)
  const brickMasksRef = useRef<number[][]>([]);

  // Xe tăng người chơi
  const playerTankRef = useRef<Tank>({
    id: 1,
    x: 8 * TILE_SIZE + 3,
    y: 13 * TILE_SIZE + 3,
    dir: 'UP',
    speed: 3.2,
    type: 'player',
    level: 1,
    hp: 1,
    maxHp: 1,
    shieldTime: 4000,
    isAlive: true,
    shootCooldown: 0,
    hasBoat: false
  });

  const enemiesRef = useRef<Tank[]>([]);
  const spawningEnemiesRef = useRef<SpawningEnemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Căn cứ đại bàng (tại ô cột 11-12, hàng 13-14)
  const isBaseDestroyedRef = useRef<boolean>(false);
  const shovelTimerRef = useRef<number>(0); // Tường thép bảo vệ
  const freezeTimerRef = useRef<number>(0); // Đóng băng địch

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastTimeRef = useRef<number>(0);
  const enemySpawnTimerRef = useRef<number>(0);
  const totalEnemiesToSpawnRef = useRef<number>(20);

  // Âm thanh Web Audio API
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

  const playShootSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, [getAudioContext]);

  const playBrickBreakSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getAudioContext]);

  const playHitSteelSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [getAudioContext]);

  const playExplosionSound = useCallback((isBig: boolean = false) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isBig ? 90 : 150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + (isBig ? 0.45 : 0.25));
      gain.gain.setValueAtTime(isBig ? 0.4 : 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isBig ? 0.45 : 0.25));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isBig ? 0.45 : 0.25));
    } catch {}
  }, [getAudioContext]);

  const playPowerUpSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [392, 523, 659, 784, 1046];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + (idx + 1) * 0.06);
      });
    } catch {}
  }, [getAudioContext]);

  // Thiết lập lớp tường bảo vệ căn cứ đại bàng (cột 10..13, hàng 12..14)
  const setBaseProtection = useCallback((tileType: number) => {
    const baseCoords = [
      { r: 12, c: 10 }, { r: 12, c: 11 }, { r: 12, c: 12 }, { r: 12, c: 13 },
      { r: 13, c: 10 }, { r: 13, c: 13 },
      { r: 14, c: 10 }, { r: 14, c: 13 },
    ];
    baseCoords.forEach(({ r, c }) => {
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        mapGridRef.current[r][c] = tileType;
        if (tileType === TILE_BRICK) {
          brickMasksRef.current[r][c] = 15; // 4 góc nguyên vẹn
        }
      }
    });
  }, []);

  // Khởi tạo bản đồ 24 cột x 15 hàng cho từng Màn chơi
  const initMap = useCallback((stg: number) => {
    const grid: number[][] = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(TILE_EMPTY));
    const masks: number[][] = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(15));

    // A. Căn cứ Đại Bàng tại đáy trung tâm (cột 11-12, hàng 13-14)
    // Tường gạch bảo vệ bao quanh
    const baseCoords = [
      { r: 12, c: 10 }, { r: 12, c: 11 }, { r: 12, c: 12 }, { r: 12, c: 13 },
      { r: 13, c: 10 }, { r: 13, c: 13 },
      { r: 14, c: 10 }, { r: 14, c: 13 },
    ];
    baseCoords.forEach(({ r, c }) => {
      grid[r][c] = TILE_BRICK;
    });

    // B. Địa hình đặc trưng theo màn chơi
    const mapType = (stg - 1) % 5;

    if (mapType === 0) {
      // Màn 1: Cổ điển đối xứng cột gạch, hầm thép trung tâm và hồ nước
      for (let r = 2; r <= 10; r++) {
        if (r === 6) continue;
        grid[r][2] = TILE_BRICK;
        grid[r][3] = TILE_BRICK;
        grid[r][5] = TILE_BRICK;
        grid[r][6] = TILE_BRICK;
        grid[r][17] = TILE_BRICK;
        grid[r][18] = TILE_BRICK;
        grid[r][20] = TILE_BRICK;
        grid[r][21] = TILE_BRICK;
      }
      // Pháo đài thép trung tâm
      grid[2][11] = TILE_STEEL;
      grid[2][12] = TILE_STEEL;
      grid[3][11] = TILE_STEEL;
      grid[3][12] = TILE_STEEL;

      // Hào nước ngang
      grid[6][9] = TILE_WATER;
      grid[6][10] = TILE_WATER;
      grid[6][13] = TILE_WATER;
      grid[6][14] = TILE_WATER;

      // Rừng cây ẩn nấp
      grid[7][11] = TILE_FOREST;
      grid[7][12] = TILE_FOREST;
      grid[8][11] = TILE_FOREST;
      grid[8][12] = TILE_FOREST;
    } else if (mapType === 1) {
      // Màn 2: Rừng rậm Amazon & Sông lớn chia cắt
      for (let c = 0; c < GRID_COLS; c++) {
        if (c !== 5 && c !== 11 && c !== 18) {
          grid[7][c] = TILE_WATER;
        }
      }
      for (let r = 1; r < 6; r++) {
        grid[r][3] = TILE_FOREST;
        grid[r][8] = TILE_FOREST;
        grid[r][15] = TILE_FOREST;
        grid[r][20] = TILE_FOREST;
      }
      for (let r = 9; r < 12; r++) {
        grid[r][4] = TILE_BRICK;
        grid[r][7] = TILE_BRICK;
        grid[r][16] = TILE_BRICK;
        grid[r][19] = TILE_BRICK;
      }
    } else if (mapType === 2) {
      // Màn 3: Băng trơn Bắc Cực & Thép khối
      for (let r = 2; r <= 10; r++) {
        for (let c = 7; c <= 16; c++) {
          if (r === 6 && (c === 11 || c === 12)) continue;
          if ((r + c) % 3 === 0) grid[r][c] = TILE_ICE;
        }
      }
      grid[4][4] = TILE_STEEL;
      grid[4][5] = TILE_STEEL;
      grid[4][18] = TILE_STEEL;
      grid[4][19] = TILE_STEEL;
      grid[8][4] = TILE_BRICK;
      grid[8][5] = TILE_BRICK;
      grid[8][18] = TILE_BRICK;
      grid[8][19] = TILE_BRICK;
    } else if (mapType === 3) {
      // Màn 4: Mê cung gạch và pháo đài thép
      for (let r = 1; r <= 11; r += 2) {
        for (let c = 1; c < GRID_COLS - 1; c += 2) {
          if (c >= 9 && c <= 14 && r >= 11) continue;
          grid[r][c] = (r + c) % 4 === 0 ? TILE_STEEL : TILE_BRICK;
        }
      }
    } else {
      // Màn 5: Thử thách tổng hợp
      for (let c = 2; c < GRID_COLS - 2; c += 3) {
        grid[3][c] = TILE_STEEL;
        grid[5][c] = TILE_WATER;
        grid[7][c] = TILE_FOREST;
        grid[9][c] = TILE_BRICK;
      }
    }

    mapGridRef.current = grid;
    brickMasksRef.current = masks;
  }, []);

  // Khởi động màn chơi
  const startStage = useCallback((stg: number) => {
    setStage(stg);
    setIsGameOver(false);
    setIsVictory(false);
    isBaseDestroyedRef.current = false;
    shovelTimerRef.current = 0;
    freezeTimerRef.current = 0;

    initMap(stg);

    // Cấu hình số lượng xe địch
    const enemyCount = mode === 'endless' ? 30 + stg * 5 : 20;
    totalEnemiesToSpawnRef.current = enemyCount;
    setEnemiesRemaining(enemyCount);

    // Đặt lại người chơi
    playerTankRef.current = {
      id: 1,
      x: 8 * TILE_SIZE + 3,
      y: 13 * TILE_SIZE + 3,
      dir: 'UP',
      speed: mode === 'speed' ? 4.2 : 3.4,
      type: 'player',
      level: playerTankRef.current.level || 1,
      hp: 1,
      maxHp: 1,
      shieldTime: 4000,
      isAlive: true,
      shootCooldown: 0,
      hasBoat: false
    };

    enemiesRef.current = [];
    spawningEnemiesRef.current = [];
    bulletsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    enemySpawnTimerRef.current = 800; // Địch xuất hiện nhanh sau khi bắt đầu
  }, [initMap, mode]);

  useEffect(() => {
    startStage(1);
  }, [startStage]);

  // Kiểm tra va chạm hộp (AABB)
  const isColliding = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Kiểm tra xe tăng di chuyển có hợp lệ không
  const canMoveTo = (tank: Tank, nextX: number, nextY: number): boolean => {
    const size = TANK_SIZE;

    // 1. Biên sân đấu (0 đến ARENA_WIDTH = 864, 0 đến ARENA_HEIGHT = 540)
    if (nextX < 0 || nextX + size > ARENA_WIDTH || nextY < 0 || nextY + size > ARENA_HEIGHT) {
      return false;
    }

    // 2. Va chạm với Căn cứ Đại Bàng (cột 11..12, hàng 13..14)
    const baseBox = { x: 11 * TILE_SIZE, y: 13 * TILE_SIZE, w: TILE_SIZE * 2, h: TILE_SIZE * 2 };
    if (isColliding(nextX, nextY, size, size, baseBox.x, baseBox.y, baseBox.w, baseBox.h)) {
      return false;
    }

    // 3. Va chạm với các ô địa hình
    const startCol = Math.floor(nextX / TILE_SIZE);
    const endCol = Math.floor((nextX + size - 1) / TILE_SIZE);
    const startRow = Math.floor(nextY / TILE_SIZE);
    const endRow = Math.floor((nextY + size - 1) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          const tile = mapGridRef.current[r][c];

          // Nước cản đường nếu không có thuyền
          if (tile === TILE_WATER) {
            if (tank.type === 'player' && tank.hasBoat) {
              // Đi trên nước
              continue;
            }
            return false;
          }

          // Thép cản đường
          if (tile === TILE_STEEL) {
            return false;
          }

          // Gạch cản đường theo từng góc (sub-mask)
          if (tile === TILE_BRICK) {
            const mask = brickMasksRef.current[r]?.[c] ?? 15;
            if (mask === 0) continue; // Đã vỡ hết

            const half = TILE_SIZE / 2;
            const subBoxes = [
              { x: c * TILE_SIZE, y: r * TILE_SIZE, bit: 1 },
              { x: c * TILE_SIZE + half, y: r * TILE_SIZE, bit: 2 },
              { x: c * TILE_SIZE, y: r * TILE_SIZE + half, bit: 4 },
              { x: c * TILE_SIZE + half, y: r * TILE_SIZE + half, bit: 8 },
            ];

            for (const sb of subBoxes) {
              if ((mask & sb.bit) !== 0) {
                if (isColliding(nextX, nextY, size, size, sb.x, sb.y, half, half)) {
                  return false;
                }
              }
            }
          }
        }
      }
    }

    // 4. Va chạm với xe khác
    if (tank.type === 'player') {
      for (const e of enemiesRef.current) {
        if (e.isAlive && isColliding(nextX, nextY, size, size, e.x, e.y, TANK_SIZE, TANK_SIZE)) {
          return false;
        }
      }
    } else {
      // Địch va chạm người chơi
      const p = playerTankRef.current;
      if (p.isAlive && isColliding(nextX, nextY, size, size, p.x, p.y, TANK_SIZE, TANK_SIZE)) {
        return false;
      }
      // Địch va chạm địch khác
      for (const other of enemiesRef.current) {
        if (other.id !== tank.id && other.isAlive && isColliding(nextX, nextY, size, size, other.x, other.y, TANK_SIZE, TANK_SIZE)) {
          return false;
        }
      }
    }

    return true;
  };

  // Người chơi bắn đạn
  const handlePlayerShoot = useCallback(() => {
    const p = playerTankRef.current;
    if (!p.isAlive || isPaused || isGameOver || isVictory) return;

    // Tối đa số đạn cùng lúc: cấp 3-4 bắn 2 viên, cấp 1-2 bắn 1 viên
    const maxBullets = p.level >= 3 ? 2 : 1;
    const activePlayerBullets = bulletsRef.current.filter(b => b.isAlive && b.isPlayer).length;
    if (activePlayerBullets >= maxBullets) return;

    let bx = p.x + TANK_SIZE / 2;
    let by = p.y + TANK_SIZE / 2;
    const speed = p.level >= 2 ? 10.5 : 8.0;

    switch (p.dir) {
      case 'UP': by = p.y - 4; break;
      case 'DOWN': by = p.y + TANK_SIZE + 4; break;
      case 'LEFT': bx = p.x - 4; break;
      case 'RIGHT': bx = p.x + TANK_SIZE + 4; break;
    }

    bulletsRef.current.push({
      id: Date.now() + Math.random(),
      x: bx,
      y: by,
      dir: p.dir,
      speed,
      isPlayer: true,
      canBreakSteel: p.level >= 4,
      isAlive: true
    });

    playShootSound();
  }, [isGameOver, isPaused, isVictory, playShootSound]);

  // Địch bắn đạn
  const enemyShoot = (enemy: Tank) => {
    let bx = enemy.x + TANK_SIZE / 2;
    let by = enemy.y + TANK_SIZE / 2;
    const speed = enemy.type === 'power' ? 9.5 : 6.5;

    switch (enemy.dir) {
      case 'UP': by = enemy.y - 4; break;
      case 'DOWN': by = enemy.y + TANK_SIZE + 4; break;
      case 'LEFT': bx = enemy.x - 4; break;
      case 'RIGHT': bx = enemy.x + TANK_SIZE + 4; break;
    }

    bulletsRef.current.push({
      id: Date.now() + Math.random(),
      x: bx,
      y: by,
      dir: enemy.dir,
      speed,
      isPlayer: false,
      canBreakSteel: false,
      isAlive: true
    });
  };

  // Tạo hiệu ứng ngôi sao xuất hiện trước khi địch xuất hiện
  const spawnEnemy = useCallback(() => {
    if (totalEnemiesToSpawnRef.current <= 0) return;
    if (enemiesRef.current.filter(e => e.isAlive).length >= 5) return; // Tối đa 5 xe cùng lúc trên màn

    // 3 vị trí xuất phát ở mép trên cùng (hàng 0: cột 0, cột 11, cột 22)
    const spawnSlots = [
      { col: 0, row: 0 },
      { col: 11, row: 0 },
      { col: 22, row: 0 }
    ];
    const availableSlots = spawnSlots.filter(slot => {
      const sx = slot.col * TILE_SIZE;
      const sy = slot.row * TILE_SIZE;
      // Tránh trùng vị trí xe đang có hoặc đang spawn
      return !enemiesRef.current.some(e => e.isAlive && isColliding(sx, sy, TANK_SIZE, TANK_SIZE, e.x, e.y, TANK_SIZE, TANK_SIZE)) &&
             !spawningEnemiesRef.current.some(se => se.col === slot.col && se.row === slot.row);
    });

    if (availableSlots.length === 0) return;
    const sp = availableSlots[Math.floor(Math.random() * availableSlots.length)];

    // Xác định loại xe
    const types: TankType[] = ['basic', 'basic', 'fast', 'power', 'armor'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    // Tỉ lệ 20% là xe mang viện trợ nhấp nháy đỏ
    const isBonus = Math.random() < 0.22;

    spawningEnemiesRef.current.push({
      id: Date.now() + Math.random(),
      col: sp.col,
      row: sp.row,
      type: chosenType,
      isBonus,
      timeLeft: 1200 // 1.2s nhấp nháy sao cảnh báo
    });

    totalEnemiesToSpawnRef.current -= 1;
    setEnemiesRemaining(totalEnemiesToSpawnRef.current);
  }, []);

  // Bắt đầu game over
  const triggerGameOver = useCallback((dueToBase: boolean) => {
    setIsGameOver(true);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
    playExplosionSound(true);

    if (dueToBase) {
      isBaseDestroyedRef.current = true;
    }
  }, [playExplosionSound]);

  // Xử lý bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true;
      if (['Space', ' ', 'j', 'J'].includes(e.key)) {
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
        // A. Cập nhật thời gian bảo vệ căn cứ và đóng băng địch
        if (shovelTimerRef.current > 0) {
          shovelTimerRef.current -= dt;
          if (shovelTimerRef.current <= 0) {
            setBaseProtection(TILE_BRICK);
          }
        }
        if (freezeTimerRef.current > 0) {
          freezeTimerRef.current -= dt;
        }

        // B. Cập nhật xe tăng đang chuẩn bị xuất hiện (Spawning Enemies)
        for (const se of spawningEnemiesRef.current) {
          se.timeLeft -= dt;
          if (se.timeLeft <= 0) {
            // Biến hình thành xe thật
            const speedMap: Record<TankType, number> = {
              player: 3.4,
              basic: 2.1,
              fast: 3.8,
              power: 2.4,
              armor: 1.8
            };
            const hpMap: Record<TankType, number> = {
              player: 1,
              basic: 1,
              fast: 1,
              power: 1,
              armor: 4
            };
            enemiesRef.current.push({
              id: se.id,
              x: se.col * TILE_SIZE + 3,
              y: se.row * TILE_SIZE + 3,
              dir: 'DOWN',
              speed: speedMap[se.type],
              type: se.type,
              level: 1,
              hp: hpMap[se.type],
              maxHp: hpMap[se.type],
              shieldTime: 0,
              isBonus: se.isBonus,
              isAlive: true,
              shootCooldown: 600 + Math.random() * 800
            });
          }
        }
        spawningEnemiesRef.current = spawningEnemiesRef.current.filter(se => se.timeLeft > 0);

        // Sinh thêm địch nếu cần
        enemySpawnTimerRef.current -= dt;
        if (enemySpawnTimerRef.current <= 0) {
          spawnEnemy();
          enemySpawnTimerRef.current = 2400 + Math.random() * 1000;
        }

        // C. Điều khiển người chơi
        const p = playerTankRef.current;
        if (p.isAlive) {
          if (p.shieldTime > 0) p.shieldTime -= dt;

          let moveX = 0;
          let moveY = 0;
          let desiredDir: Direction | null = null;

          if (keysPressedRef.current['ArrowUp'] || keysPressedRef.current['w'] || keysPressedRef.current['W']) {
            desiredDir = 'UP';
            moveY = -p.speed;
          } else if (keysPressedRef.current['ArrowDown'] || keysPressedRef.current['s'] || keysPressedRef.current['S']) {
            desiredDir = 'DOWN';
            moveY = p.speed;
          } else if (keysPressedRef.current['ArrowLeft'] || keysPressedRef.current['a'] || keysPressedRef.current['A']) {
            desiredDir = 'LEFT';
            moveX = -p.speed;
          } else if (keysPressedRef.current['ArrowRight'] || keysPressedRef.current['d'] || keysPressedRef.current['D']) {
            desiredDir = 'RIGHT';
            moveX = p.speed;
          }

          if (desiredDir) {
            p.dir = desiredDir;

            // Hỗ trợ tự căn chỉnh làn (Lane Snapping) giúp rẽ cua 90 độ mượt mà
            if (desiredDir === 'UP' || desiredDir === 'DOWN') {
              const alignCol = Math.round(p.x / (TILE_SIZE / 2)) * (TILE_SIZE / 2);
              if (Math.abs(p.x - alignCol) < 7) p.x = alignCol;
            } else {
              const alignRow = Math.round(p.y / (TILE_SIZE / 2)) * (TILE_SIZE / 2);
              if (Math.abs(p.y - alignRow) < 7) p.y = alignRow;
            }

            const targetX = p.x + moveX;
            const targetY = p.y + moveY;
            if (canMoveTo(p, targetX, targetY)) {
              p.x = targetX;
              p.y = targetY;
            }
          }
        }

        // D. Trí tuệ nhân tạo xe tăng địch (Enemy AI)
        if (freezeTimerRef.current <= 0) {
          for (const e of enemiesRef.current) {
            if (!e.isAlive) continue;

            // Bắn đạn
            e.shootCooldown -= dt;
            if (e.shootCooldown <= 0) {
              enemyShoot(e);
              e.shootCooldown = 1100 + Math.random() * 1200;
            }

            // Di chuyển
            let mx = 0;
            let my = 0;
            if (e.dir === 'UP') my = -e.speed;
            else if (e.dir === 'DOWN') my = e.speed;
            else if (e.dir === 'LEFT') mx = -e.speed;
            else if (e.dir === 'RIGHT') mx = e.speed;

            if (canMoveTo(e, e.x + mx, e.y + my)) {
              e.x += mx;
              e.y += my;
              // Xác suất rẽ ngẫu nhiên
              if (Math.random() < 0.02) {
                const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                e.dir = dirs[Math.floor(Math.random() * dirs.length)];
              }
            } else {
              // Đụng tường -> Đổi hướng ưu tiên hướng xuống căn cứ đại bàng
              const dirs: Direction[] = ['DOWN', 'DOWN', 'LEFT', 'RIGHT', 'UP'];
              e.dir = dirs[Math.floor(Math.random() * dirs.length)];
            }
          }
        }

        // E. Cập nhật đạn bay & va chạm
        for (const b of bulletsRef.current) {
          if (!b.isAlive) continue;

          switch (b.dir) {
            case 'UP': b.y -= b.speed; break;
            case 'DOWN': b.y += b.speed; break;
            case 'LEFT': b.x -= b.speed; break;
            case 'RIGHT': b.x += b.speed; break;
          }

          // 1. Bay ra khỏi biên sân đấu
          if (b.x < 0 || b.x > ARENA_WIDTH || b.y < 0 || b.y > ARENA_HEIGHT) {
            b.isAlive = false;
            playHitSteelSound();
            continue;
          }

          // 2. Va chạm với Căn cứ Đại Bàng
          const baseBox = { x: 11 * TILE_SIZE, y: 13 * TILE_SIZE, w: TILE_SIZE * 2, h: TILE_SIZE * 2 };
          if (isColliding(b.x - 3, b.y - 3, 6, 6, baseBox.x, baseBox.y, baseBox.w, baseBox.h)) {
            b.isAlive = false;
            triggerGameOver(true);
            continue;
          }

          // 3. Va chạm với các ô địa hình
          const col = Math.floor(b.x / TILE_SIZE);
          const row = Math.floor(b.y / TILE_SIZE);

          if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
            const tile = mapGridRef.current[row][col];

            // Tường gạch: Phá hủy từng góc (Sub-Tile destruction)
            if (tile === TILE_BRICK) {
              b.isAlive = false;
              playBrickBreakSound();

              let mask = brickMasksRef.current[row]?.[col] ?? 15;
              // Tùy theo hướng bắn phá hủy phần tương ứng
              if (b.dir === 'UP') {
                if ((mask & 12) !== 0) mask &= ~12; // Phá 2 góc dưới (BL:4, BR:8)
                else mask &= ~3; // Phá tiếp 2 góc trên
              } else if (b.dir === 'DOWN') {
                if ((mask & 3) !== 0) mask &= ~3; // Phá 2 góc trên (TL:1, TR:2)
                else mask &= ~12; // Phá tiếp 2 góc dưới
              } else if (b.dir === 'LEFT') {
                if ((mask & 10) !== 0) mask &= ~10; // Phá 2 góc phải (TR:2, BR:8)
                else mask &= ~5; // Phá tiếp 2 góc trái
              } else if (b.dir === 'RIGHT') {
                if ((mask & 5) !== 0) mask &= ~5; // Phá 2 góc trái (TL:1, BL:4)
                else mask &= ~10; // Phá tiếp 2 góc phải
              }

              brickMasksRef.current[row][col] = mask;
              if (mask === 0) {
                mapGridRef.current[row][col] = TILE_EMPTY;
              }

              // Hạt bụi gạch văng tung tóe
              for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                  id: Date.now() + Math.random(),
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#ef4444',
                  size: 2.5,
                  alpha: 1,
                  decay: 0.05
                });
              }
              continue;
            }

            // Tường thép
            if (tile === TILE_STEEL) {
              b.isAlive = false;
              if (b.canBreakSteel) {
                // Đạn cấp 4 phá hủy tường thép
                mapGridRef.current[row][col] = TILE_EMPTY;
                playBrickBreakSound();
                for (let i = 0; i < 6; i++) {
                  particlesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    color: '#94a3b8',
                    size: 3,
                    alpha: 1,
                    decay: 0.04
                  });
                }
              } else {
                playHitSteelSound();
                // Tia lửa kim loại tóe ra
                for (let i = 0; i < 4; i++) {
                  particlesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    color: '#38bdf8',
                    size: 2,
                    alpha: 1,
                    decay: 0.08
                  });
                }
              }
              continue;
            }

            // Tán cây rừng: Xe cấp 4 có thể chặt cây dọn đường
            if (tile === TILE_FOREST && b.canBreakSteel) {
              mapGridRef.current[row][col] = TILE_EMPTY;
              b.isAlive = false;
              playBrickBreakSound();
              continue;
            }
          }

          // 4. Va chạm đạn người chơi với xe tăng địch
          if (b.isPlayer) {
            for (const e of enemiesRef.current) {
              if (e.isAlive && isColliding(b.x - 3, b.y - 3, 6, 6, e.x, e.y, TANK_SIZE, TANK_SIZE)) {
                b.isAlive = false;
                e.hp -= 1;

                if (e.hp <= 0) {
                  e.isAlive = false;
                  playExplosionSound(true);

                  // Thưởng điểm
                  const pts = e.type === 'armor' ? 400 : e.type === 'power' ? 300 : e.type === 'fast' ? 200 : 100;
                  setScore(s => {
                    const newS = s + pts;
                    if (newS > highScore) {
                      setHighScore(newS);
                      try { localStorage.setItem('acegames_tank_1990_highscore', String(newS)); } catch {}
                    }
                    return newS;
                  });

                  floatingTextsRef.current.push({
                    id: Date.now() + Math.random(),
                    x: e.x + TANK_SIZE / 2,
                    y: e.y,
                    text: `+${pts}`,
                    color: '#f59e0b',
                    alpha: 1
                  });

                  // Hiệu ứng nổ hoành tráng
                  for (let i = 0; i < 16; i++) {
                    particlesRef.current.push({
                      id: Date.now() + Math.random(),
                      x: e.x + TANK_SIZE / 2,
                      y: e.y + TANK_SIZE / 2,
                      vx: (Math.random() - 0.5) * 8,
                      vy: (Math.random() - 0.5) * 8,
                      color: i % 2 === 0 ? '#ef4444' : '#f59e0b',
                      size: Math.random() * 4 + 2,
                      alpha: 1,
                      decay: 0.03
                    });
                  }

                  // Nếu là xe tăng đỏ mang viện trợ -> rơi Power-Up
                  if (e.isBonus) {
                    const allTypes: PowerUpType[] = ['star', 'grenade', 'helmet', 'clock', 'shovel', 'tank', 'boat', 'pistol'];
                    const picked = allTypes[Math.floor(Math.random() * allTypes.length)];
                    powerUpsRef.current.push({
                      id: Date.now() + Math.random(),
                      x: e.x + 2,
                      y: e.y + 2,
                      type: picked,
                      blinkTimer: 0
                    });
                  }
                } else {
                  playHitSteelSound();
                }
                break;
              }
            }
          }

          // 5. Va chạm đạn địch với xe tăng người chơi
          if (!b.isPlayer) {
            if (p.isAlive && p.shieldTime <= 0 && isColliding(b.x - 3, b.y - 3, 6, 6, p.x, p.y, TANK_SIZE, TANK_SIZE)) {
              b.isAlive = false;
              playExplosionSound(true);

              setLives(l => {
                const nl = l - 1;
                if (nl <= 0) {
                  p.isAlive = false;
                  triggerGameOver(false);
                } else {
                  // Hồi sinh tại điểm xuất phát với khiên bảo vệ
                  p.x = 8 * TILE_SIZE + 3;
                  p.y = 13 * TILE_SIZE + 3;
                  p.dir = 'UP';
                  p.shieldTime = 4000;
                  p.level = Math.max(1, p.level - 1);
                }
                return nl;
              });
              break;
            }
          }
        }

        // F. Cơ chế triệt tiêu 2 viên đạn đối đầu (Bullet vs Bullet Cancellation)
        for (let i = 0; i < bulletsRef.current.length; i++) {
          const b1 = bulletsRef.current[i];
          if (!b1.isAlive) continue;
          for (let j = i + 1; j < bulletsRef.current.length; j++) {
            const b2 = bulletsRef.current[j];
            if (!b2.isAlive) continue;
            if (b1.isPlayer !== b2.isPlayer) {
              const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
              if (dist < 10) {
                b1.isAlive = false;
                b2.isAlive = false;
                playHitSteelSound();
                // Tia lửa triệt tiêu
                for (let k = 0; k < 6; k++) {
                  particlesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: (b1.x + b2.x) / 2,
                    y: (b1.y + b2.y) / 2,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    color: '#fbbf24',
                    size: 2,
                    alpha: 1,
                    decay: 0.08
                  });
                }
              }
            }
          }
        }

        // Dọn đạn chết
        bulletsRef.current = bulletsRef.current.filter(b => b.isAlive);

        // G. Người chơi nhặt Power-Up
        for (const pu of powerUpsRef.current) {
          if (p.isAlive && isColliding(p.x, p.y, TANK_SIZE, TANK_SIZE, pu.x, pu.y, 28, 28)) {
            playPowerUpSound();

            let txt = '';
            switch (pu.type) {
              case 'star':
                p.level = Math.min(4, p.level + 1);
                txt = `CẤP ${p.level}! ⭐`;
                break;
              case 'pistol':
                p.level = 4;
                p.shieldTime = 5000;
                txt = 'MAX CẤP 4! 🔫';
                break;
              case 'helmet':
                p.shieldTime = 12000;
                txt = 'KHIÊN BẤT TỬ 12S 🛡️';
                break;
              case 'clock':
                freezeTimerRef.current = 10000;
                txt = 'ĐÓNG BĂNG ĐỊCH 10S ⏱️';
                break;
              case 'shovel':
                shovelTimerRef.current = 20000;
                setBaseProtection(TILE_STEEL);
                txt = 'TƯỜNG THÉP 20S 🧱';
                break;
              case 'tank':
                setLives(l => l + 1);
                txt = '+1 MẠNG 💖';
                break;
              case 'boat':
                p.hasBoat = true;
                txt = 'THUYỀN VƯỢT SÔNG ⛵';
                break;
              case 'grenade':
                txt = 'QUÉT SẠCH ĐỊCH 💣';
                // Tiêu diệt toàn bộ địch trên màn hình
                for (const e of enemiesRef.current) {
                  if (e.isAlive) {
                    e.isAlive = false;
                    setScore(s => s + 500);
                    for (let i = 0; i < 12; i++) {
                      particlesRef.current.push({
                        id: Date.now() + Math.random(),
                        x: e.x + TANK_SIZE / 2,
                        y: e.y + TANK_SIZE / 2,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        color: '#f97316',
                        size: 3,
                        alpha: 1,
                        decay: 0.04
                      });
                    }
                  }
                }
                playExplosionSound(true);
                break;
            }

            floatingTextsRef.current.push({
              id: Date.now() + Math.random(),
              x: pu.x + 14,
              y: pu.y,
              text: txt,
              color: '#38bdf8',
              alpha: 1
            });

            // Xóa item
            powerUpsRef.current = powerUpsRef.current.filter(it => it.id !== pu.id);
            break;
          }
        }

        // H. Kiểm tra Chiến Thắng màn chơi
        const remainingLivingEnemies = enemiesRef.current.filter(e => e.isAlive).length;
        if (totalEnemiesToSpawnRef.current <= 0 && remainingLivingEnemies === 0 && spawningEnemiesRef.current.length === 0 && !isGameOver) {
          setIsVictory(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      }

      // --- 2. VẼ TOÀN BỘ ĐỒ HỌA SÂN ĐẤU BATTLE CITY ---
      // A. Nền tổng thể sân đấu Arcade
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // B. Nền chiến trường chính (0 đến 864px, 0 đến 540px)
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Đường kẻ biên giới ngăn cách sân đấu và sidebar
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH, 0);
      ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT);
      ctx.stroke();

      // C. Vẽ Địa hình Sân đấu
      const currentTime = Date.now();

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = mapGridRef.current[r]?.[c] ?? TILE_EMPTY;
          const tx = c * TILE_SIZE;
          const ty = r * TILE_SIZE;

          switch (tile) {
            case TILE_BRICK: {
              const mask = brickMasksRef.current[r]?.[c] ?? 15;
              const half = TILE_SIZE / 2;
              const subTiles = [
                { x: tx, y: ty, bit: 1 },
                { x: tx + half, y: ty, bit: 2 },
                { x: tx, y: ty + half, bit: 4 },
                { x: tx + half, y: ty + half, bit: 8 },
              ];

              for (const st of subTiles) {
                if ((mask & st.bit) !== 0) {
                  // Khối gạch nung đỏ 3D
                  ctx.fillStyle = '#b91c1c';
                  ctx.fillRect(st.x, st.y, half, half);
                  ctx.strokeStyle = '#450a0a';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(st.x, st.y, half, half);

                  // Rãnh vữa nằm ngang
                  ctx.fillStyle = '#fca5a5';
                  ctx.fillRect(st.x + 1, st.y + 1, half - 2, 2);
                  ctx.fillStyle = '#7f1d1d';
                  ctx.fillRect(st.x + 1, st.y + half - 3, half - 2, 2);
                }
              }
              break;
            }

            case TILE_STEEL: {
              const steelGrad = ctx.createLinearGradient(tx, ty, tx + TILE_SIZE, ty + TILE_SIZE);
              steelGrad.addColorStop(0, '#f8fafc');
              steelGrad.addColorStop(0.3, '#94a3b8');
              steelGrad.addColorStop(1, '#475569');
              ctx.fillStyle = steelGrad;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

              // 4 đinh tán thép góc
              ctx.fillStyle = '#cbd5e1';
              ctx.beginPath();
              ctx.arc(tx + 5, ty + 5, 2, 0, Math.PI * 2);
              ctx.arc(tx + TILE_SIZE - 5, ty + 5, 2, 0, Math.PI * 2);
              ctx.arc(tx + 5, ty + TILE_SIZE - 5, 2, 0, Math.PI * 2);
              ctx.arc(tx + TILE_SIZE - 5, ty + TILE_SIZE - 5, 2, 0, Math.PI * 2);
              ctx.fill();
              break;
            }

            case TILE_WATER: {
              const waterGrad = ctx.createLinearGradient(tx, ty, tx, ty + TILE_SIZE);
              waterGrad.addColorStop(0, '#0284c7');
              waterGrad.addColorStop(1, '#0369a1');
              ctx.fillStyle = waterGrad;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

              // Sóng nước chuyển động
              const waveOff = Math.sin(currentTime * 0.005 + r) * 3;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.fillRect(tx + 4, ty + 8 + waveOff, TILE_SIZE - 8, 2);
              ctx.fillRect(tx + 8, ty + 20 - waveOff, TILE_SIZE - 16, 2);
              break;
            }

            case TILE_ICE: {
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

      // D. Căn cứ Đại Bàng (Eagle Base) tại cột 11..12, hàng 13..14
      const bx = 11 * TILE_SIZE;
      const by = 13 * TILE_SIZE;
      const bSize = TILE_SIZE * 2; // 72x72px

      ctx.save();
      ctx.translate(bx, by);

      if (!isBaseDestroyedRef.current) {
        // Đại bàng sống: Nền kim loại & Biểu tượng Phượng Hoàng / Đại Bàng Vàng
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, bSize, bSize);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, bSize, bSize);

        // Đôi cánh vàng
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(bSize * 0.5, bSize * 0.15);
        ctx.lineTo(bSize * 0.85, bSize * 0.45);
        ctx.lineTo(bSize * 0.7, bSize * 0.75);
        ctx.lineTo(bSize * 0.5, bSize * 0.6);
        ctx.lineTo(bSize * 0.3, bSize * 0.75);
        ctx.lineTo(bSize * 0.15, bSize * 0.45);
        ctx.closePath();
        ctx.fill();

        // Mắt và đầu đại bàng
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bSize * 0.5, bSize * 0.35, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bSize * 0.5, bSize * 0.35, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Mỏ đại bàng
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(bSize * 0.5, bSize * 0.42);
        ctx.lineTo(bSize * 0.45, bSize * 0.52);
        ctx.lineTo(bSize * 0.55, bSize * 0.52);
        ctx.closePath();
        ctx.fill();
      } else {
        // Đại bàng bị phá hủy: Đống đổ nát
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, bSize, bSize);
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠️', bSize / 2, bSize / 2);
      }
      ctx.restore();

      // E. Vẽ Hiệu ứng Ngôi Sao đang sinh địch (Spawning Stars)
      for (const se of spawningEnemiesRef.current) {
        const sx = se.col * TILE_SIZE + TILE_SIZE / 2;
        const sy = se.row * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.abs(Math.sin(currentTime * 0.015)) * 14 + 6;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(currentTime * 0.008);
        ctx.fillStyle = se.isBonus ? '#ef4444' : '#38bdf8';
        ctx.shadowColor = se.isBonus ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 12;

        // Ngôi sao 4 cánh
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(pulse, 0);
          ctx.lineTo(pulse * 0.3, pulse * 0.3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // F. Vẽ Xe Tăng (Hàm vẽ chuẩn chung)
      const drawTankSprite = (tank: Tank, isPlayer: boolean) => {
        if (!tank.isAlive) return;

        ctx.save();
        const centerX = tank.x + TANK_SIZE / 2;
        const centerY = tank.y + TANK_SIZE / 2;
        ctx.translate(centerX, centerY);

        // Xoay hướng
        switch (tank.dir) {
          case 'UP': ctx.rotate(0); break;
          case 'RIGHT': ctx.rotate(Math.PI / 2); break;
          case 'DOWN': ctx.rotate(Math.PI); break;
          case 'LEFT': ctx.rotate(-Math.PI / 2); break;
        }

        // Màu sắc
        let bodyColor = '#f59e0b';
        let treadColor = '#475569';

        if (isPlayer) {
          if (tank.level === 1) bodyColor = '#facc15';
          else if (tank.level === 2) bodyColor = '#38bdf8';
          else if (tank.level === 3) bodyColor = '#a855f7';
          else bodyColor = '#10b981'; // Cấp 4 pháo đài thép
        } else {
          // Xe địch
          if (tank.isBonus && Math.floor(currentTime / 150) % 2 === 0) {
            bodyColor = '#ef4444'; // Nhấp nháy đỏ
          } else {
            if (tank.type === 'basic') bodyColor = '#cbd5e1';
            else if (tank.type === 'fast') bodyColor = '#3b82f6';
            else if (tank.type === 'power') bodyColor = '#ec4899';
            else {
              // Xe bọc thép nhiều máu (đổi màu theo hp)
              bodyColor = tank.hp >= 4 ? '#22c55e' : tank.hp === 3 ? '#eab308' : tank.hp === 2 ? '#f97316' : '#ef4444';
            }
          }
        }

        // Nếu xe đang trên nước (có thuyền), vẽ phao cứu sinh bao quanh
        if (isPlayer && tank.hasBoat) {
          ctx.save();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.strokeRect(-17, -17, 34, 34);
          ctx.restore();
        }

        // Bánh xích hai bên
        ctx.fillStyle = treadColor;
        ctx.fillRect(-15, -15, 6, 30);
        ctx.fillRect(9, -15, 6, 30);

        // Thân xe
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-9, -12, 18, 24);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-9, -12, 18, 24);

        // Tháp pháo và Nòng pháo
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        const cannonW = isPlayer && tank.level >= 4 ? 5 : 3.5;
        const cannonLen = isPlayer && tank.level >= 4 ? 18 : 14;
        ctx.fillRect(-cannonW / 2, -cannonLen, cannonW, cannonLen);

        // Nòng kép cho xe cấp 3
        if (isPlayer && tank.level === 3) {
          ctx.fillRect(-cannonW - 2, -cannonLen + 2, cannonW, cannonLen - 2);
          ctx.fillRect(2, -cannonLen + 2, cannonW, cannonLen - 2);
        }

        // Khiên bảo vệ bất tử
        if (tank.shieldTime > 0) {
          const shieldRadius = 20;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Vòng sáng xoay tròn
          ctx.save();
          ctx.rotate(currentTime * 0.01);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-shieldRadius, -shieldRadius, shieldRadius * 2, shieldRadius * 2);
          ctx.restore();
        }

        ctx.restore();
      };

      // Vẽ toàn bộ xe địch
      for (const e of enemiesRef.current) {
        drawTankSprite(e, false);
      }

      // Vẽ xe người chơi
      drawTankSprite(playerTankRef.current, true);

      // G. Vẽ Viện Trợ (Power-Ups)
      for (const pu of powerUpsRef.current) {
        pu.blinkTimer += dt;
        if (Math.floor(pu.blinkTimer / 150) % 2 === 0) {
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pu.x, pu.y, 28, 28);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(pu.x, pu.y, 28, 28);

          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let icon = '⭐';
          if (pu.type === 'grenade') icon = '💣';
          else if (pu.type === 'helmet') icon = '🛡️';
          else if (pu.type === 'clock') icon = '⏱️';
          else if (pu.type === 'shovel') icon = '🧱';
          else if (pu.type === 'tank') icon = '💖';
          else if (pu.type === 'boat') icon = '⛵';
          else if (pu.type === 'pistol') icon = '🔫';

          ctx.fillText(icon, pu.x + 14, pu.y + 14);
          ctx.restore();
        }
      }

      // H. Vẽ Đạn (Bullets)
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

      // I. Vẽ Tán Cây Rừng (Lớp phủ trên xe tăng và đạn)
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (mapGridRef.current[r]?.[c] === TILE_FOREST) {
            const tx = c * TILE_SIZE;
            const ty = r * TILE_SIZE;
            ctx.fillStyle = '#15803d';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(tx + 3, ty + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          }
        }
      }

      // J. Vẽ Hiệu ứng Hạt nổ (Particles)
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

      // K. Vẽ Chữ Điểm bay (Floating Texts)
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

      // --- 3. BẢNG ĐIỀU KHIỂN QUÂN SỰ BÊN PHẢI (SIDEBAR 96PX) ---
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      // Tiêu đề radar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐỊCH CÒN', SIDEBAR_X + SIDEBAR_WIDTH / 2, 24);

      // Lưới 20 icon xe tăng địch (2 cột x 10 hàng)
      const enemyIconsLeft = totalEnemiesToSpawnRef.current + enemiesRef.current.filter(e => e.isAlive).length;
      for (let i = 0; i < 20; i++) {
        const colIdx = i % 2;
        const rowIdx = Math.floor(i / 2);
        const ix = SIDEBAR_X + 22 + colIdx * 28;
        const iy = 38 + rowIdx * 19;

        if (i < enemyIconsLeft) {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(ix, iy, 12, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix + 4, iy - 3, 4, 3); // nòng súng
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(ix, iy, 12, 10);
        }
      }

      // Vạch phân cách
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X + 12, 240);
      ctx.lineTo(SIDEBAR_X + SIDEBAR_WIDTH - 12, 240);
      ctx.stroke();

      // Thông tin Người chơi (Player Status)
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NGƯỜI CHƠI', SIDEBAR_X + SIDEBAR_WIDTH / 2, 260);

      // Cấp độ sao (Stars)
      const plvl = playerTankRef.current.level || 1;
      let starStr = '⭐';
      if (plvl === 2) starStr = '⭐⭐';
      else if (plvl === 3) starStr = '⭐⭐⭐';
      else if (plvl >= 4) starStr = '⭐⭐⭐⭐';
      ctx.font = '14px sans-serif';
      ctx.fillText(starStr, SIDEBAR_X + SIDEBAR_WIDTH / 2, 282);

      // Số mạng còn lại
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.fillText(`❤️ x ${lives}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 306);

      // Trạng thái hiệu lực Buffs
      let buffY = 335;
      if (playerTankRef.current.shieldTime > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`🛡️ BẤT TỬ`, SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }
      if (freezeTimerRef.current > 0) {
        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`⏱️ ĐÓNG BĂNG`, SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }
      if (shovelTimerRef.current > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`🧱 THÉP CĂN CỨ`, SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }
      if (playerTankRef.current.hasBoat) {
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`⛵ THUYỀN`, SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }

      // Cờ màn chơi ở góc dưới sidebar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '900 11px sans-serif';
      ctx.fillText('CHIẾN DỊCH', SIDEBAR_X + SIDEBAR_WIDTH / 2, 480);
      ctx.font = '900 20px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`🚩 ${stage}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 510);

      ctx.restore(); // Kết thúc scale dpr

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isGameOver, isPaused, isVictory, mode, playBrickBreakSound, playExplosionSound, playHitSteelSound, playPowerUpSound, setBaseProtection, spawnEnemy, triggerGameOver]);

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
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-150px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-1 min-h-0 transition-transform duration-100 ${
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