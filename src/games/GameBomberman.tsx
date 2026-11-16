import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Heart, 
  Bomb, 
  Timer, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'speed' | 'endless';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Các loại ô địa hình
const TILE_EMPTY = 0;
const TILE_SOLID = 1; // Trụ đá/thép không thể phá hủy
const TILE_BRICK = 2; // Gạch mềm có thể đặt bom phá hủy

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân đấu 21 cột x 15 hàng (mỗi ô 36x36px = 756x540px)
// Vừa khít 100% chiều cao CANVAS_HEIGHT (15 * 36 = 540), KHÔNG CÓ KHE HỞ TRÊN / DƯỚI!
const GRID_COLS = 21;
const GRID_ROWS = 15;
const TILE_SIZE = 36;
const ARENA_WIDTH = GRID_COLS * TILE_SIZE; // 756px
const ARENA_HEIGHT = GRID_ROWS * TILE_SIZE; // 540px

// Sidebar thông tin chiến thuật cánh phải (204px)
const SIDEBAR_X = ARENA_WIDTH; // 756px
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH; // 204px

// Kích thước nhân vật & quái vật
const PLAYER_SIZE = 28;
const MONSTER_SIZE = 28;

// Các loại vật phẩm ẩn giấu trong gạch mềm
type ItemType = 'extra_bomb' | 'fire_up' | 'speed_up' | 'shield' | 'clock' | 'kick' | 'heart' | 'portal';

interface HiddenItem {
  col: number;
  row: number;
  type: ItemType;
  revealed: boolean;
}

interface ActiveBomb {
  id: number;
  col: number;
  row: number;
  timer: number; // ms còn lại đến khi nổ (mặc định 2500ms)
  range: number;
  ownerIsPlayer: boolean;
  vx: number; // Tốc độ trượt khi bị đá
  vy: number;
  x: number; // Tọa độ pixel thực tế
  y: number;
}

interface FireFlame {
  col: number;
  row: number;
  timer: number; // ms tồn tại tia lửa (mặc định 450ms)
  isCenter: boolean;
  dir?: Direction;
}

type MonsterType = 'valcom' | 'oneal' | 'dahl' | 'minvo';

interface Monster {
  id: number;
  x: number;
  y: number;
  col: number;
  row: number;
  type: MonsterType;
  dir: Direction;
  speed: number;
  isAlive: boolean;
  scoreValue: number;
  changeDirTimer: number;
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

export const GameBomberman: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_bomberman_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [stage, setStage] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 phút mỗi màn
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('classic');
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Thuộc tính nâng cấp của người chơi
  const [maxBombs, setMaxBombs] = useState<number>(1);
  const [fireRange, setFireRange] = useState<number>(2);
  const [playerSpeedLevel, setPlayerSpeedLevel] = useState<number>(1);
  const [hasKick, setHasKick] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ma trận địa hình 15 hàng x 21 cột
  const mapGridRef = useRef<number[][]>([]);
  const hiddenItemsRef = useRef<HiddenItem[]>([]);
  const portalFoundRef = useRef<boolean>(false);

  // Người chơi
  const playerRef = useRef({
    x: TILE_SIZE + 4,
    y: TILE_SIZE + 4,
    dir: 'DOWN' as Direction,
    speed: 3.2,
    shieldTime: 4000, // 4s bất tử lúc bắt đầu
    isAlive: true,
    moving: false,
    walkFrame: 0
  });

  const bombsRef = useRef<ActiveBomb[]>([]);
  const flamesRef = useRef<FireFlame[]>([]);
  const monstersRef = useRef<Monster[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const freezeTimerRef = useRef<number>(0);
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastTimeRef = useRef<number>(0);

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

  const playPlaceBombSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, [getAudioContext]);

  const playExplosionSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [getAudioContext]);

  const playItemSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (idx + 1) * 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + (idx + 1) * 0.05);
      });
    } catch {}
  }, [getAudioContext]);

  const playKickSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getAudioContext]);

  // Khởi tạo bản đồ Bomberman 21 cột x 15 hàng
  const initMap = useCallback((stg: number) => {
    const grid: number[][] = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(TILE_EMPTY));
    const items: HiddenItem[] = [];

    // 1. Viền bao quanh là tường kiên cố không thể phá hủy
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r][0] = TILE_SOLID;
      grid[r][GRID_COLS - 1] = TILE_SOLID;
    }
    for (let c = 0; c < GRID_COLS; c++) {
      grid[0][c] = TILE_SOLID;
      grid[GRID_ROWS - 1][c] = TILE_SOLID;
    }

    // 2. Các cột trụ đá/thép cách đều (ở mọi vị trí chẵn r và c)
    for (let r = 2; r < GRID_ROWS - 1; r += 2) {
      for (let c = 2; c < GRID_COLS - 1; c += 2) {
        grid[r][c] = TILE_SOLID;
      }
    }

    // 3. Vùng xuất phát an toàn của người chơi tại góc trên trái (1,1), (1,2), (2,1)
    const playerSafeZone = new Set(['1,1', '1,2', '2,1']);

    // 4. Sinh ngẫu nhiên các khối gạch mềm (destructible bricks) với mật độ 65%
    const brickCandidates: { r: number; c: number }[] = [];
    for (let r = 1; r < GRID_ROWS - 1; r++) {
      for (let c = 1; c < GRID_COLS - 1; c++) {
        if (grid[r][c] === TILE_EMPTY && !playerSafeZone.has(`${r},${c}`)) {
          // Tỉ lệ sinh gạch 60%
          if (Math.random() < 0.62) {
            grid[r][c] = TILE_BRICK;
            brickCandidates.push({ r, c });
          }
        }
      }
    }

    // 5. Giấu Cổng Qua Màn (Portal) và các Vật Phẩm (Power-Ups) vào dưới các viên gạch
    // Xáo trộn các vị trí gạch
    for (let i = brickCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [brickCandidates[i], brickCandidates[j]] = [brickCandidates[j], brickCandidates[i]];
    }

    // Luôn có 1 Cổng Qua Màn
    if (brickCandidates.length > 0) {
      const portalCell = brickCandidates.pop()!;
      items.push({ col: portalCell.c, row: portalCell.r, type: 'portal', revealed: false });
    }

    // Danh sách vật phẩm rải theo tỉ lệ
    const itemPool: ItemType[] = [
      'extra_bomb', 'extra_bomb', 'extra_bomb',
      'fire_up', 'fire_up', 'fire_up',
      'speed_up', 'speed_up',
      'shield', 'clock', 'kick', 'heart'
    ];

    itemPool.forEach(type => {
      if (brickCandidates.length > 0) {
        const cell = brickCandidates.pop()!;
        items.push({ col: cell.c, row: cell.r, type, revealed: false });
      }
    });

    mapGridRef.current = grid;
    hiddenItemsRef.current = items;
    portalFoundRef.current = false;

    // 6. Sinh quái vật mê cung
    const monList: Monster[] = [];
    const monCount = Math.min(10, 4 + stg);

    // Tìm các ô trống không thuộc vùng an toàn
    const openCells: { r: number; c: number }[] = [];
    for (let r = 3; r < GRID_ROWS - 1; r++) {
      for (let c = 3; c < GRID_COLS - 1; c++) {
        if (grid[r][c] === TILE_EMPTY) {
          openCells.push({ r, c });
        }
      }
    }

    for (let i = 0; i < monCount && openCells.length > 0; i++) {
      const idx = Math.floor(Math.random() * openCells.length);
      const cell = openCells.splice(idx, 1)[0];

      let mType: MonsterType = 'valcom';
      let spd = 2.0;
      let val = 100;

      if (stg >= 2 && Math.random() < 0.35) {
        mType = 'oneal';
        spd = 2.6;
        val = 200;
      } else if (stg >= 3 && Math.random() < 0.3) {
        mType = 'dahl';
        spd = 3.0;
        val = 300;
      } else if (stg >= 4 && Math.random() < 0.25) {
        mType = 'minvo';
        spd = 3.2;
        val = 400;
      }

      const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      monList.push({
        id: Date.now() + Math.random(),
        x: cell.c * TILE_SIZE + (TILE_SIZE - MONSTER_SIZE) / 2,
        y: cell.r * TILE_SIZE + (TILE_SIZE - MONSTER_SIZE) / 2,
        col: cell.c,
        row: cell.r,
        type: mType,
        dir: dirs[Math.floor(Math.random() * dirs.length)],
        speed: spd,
        isAlive: true,
        scoreValue: val,
        changeDirTimer: 800 + Math.random() * 1200
      });
    }

    monstersRef.current = monList;
  }, []);

  // Bắt đầu màn chơi
  const startStage = useCallback((stg: number) => {
    setStage(stg);
    setTimeLeft(180);
    setIsGameOver(false);
    setIsVictory(false);
    freezeTimerRef.current = 0;

    initMap(stg);

    // Đặt lại người chơi tại (1, 1)
    const baseSpeed = mode === 'speed' ? 3.8 : 3.2;
    playerRef.current = {
      x: TILE_SIZE + 4,
      y: TILE_SIZE + 4,
      dir: 'DOWN',
      speed: baseSpeed + (playerSpeedLevel - 1) * 0.4,
      shieldTime: 4000,
      isAlive: true,
      moving: false,
      walkFrame: 0
    };

    bombsRef.current = [];
    flamesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
  }, [initMap, mode, playerSpeedLevel]);

  useEffect(() => {
    startStage(1);
  }, [startStage]);

  // Kiểm tra va chạm hộp (AABB)
  const isColliding = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Kiểm tra di chuyển có bị cản trở bởi tường hay bom không
  const canMoveTo = (x: number, y: number, size: number, isMonster: boolean = false): boolean => {
    // 1. Biên ngoài
    if (x < 0 || x + size > ARENA_WIDTH || y < 0 || y + size > ARENA_HEIGHT) return false;

    // 2. Va chạm các ô địa hình
    const startCol = Math.floor(x / TILE_SIZE);
    const endCol = Math.floor((x + size - 1) / TILE_SIZE);
    const startRow = Math.floor(y / TILE_SIZE);
    const endRow = Math.floor((y + size - 1) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          const tile = mapGridRef.current[r][c];
          if (tile === TILE_SOLID || tile === TILE_BRICK) {
            return false;
          }
        }
      }
    }

    // 3. Va chạm với quả bom
    for (const b of bombsRef.current) {
      const bx = b.col * TILE_SIZE;
      const by = b.row * TILE_SIZE;
      if (isColliding(x, y, size, size, bx, by, TILE_SIZE, TILE_SIZE)) {
        // Nếu người chơi đang đứng sẵn trên ô bom vừa đặt thì cho phép bước ra ngoài
        if (!isMonster) {
          const p = playerRef.current;
          const insideBefore = isColliding(p.x, p.y, size, size, bx, by, TILE_SIZE, TILE_SIZE);
          if (insideBefore) {
            continue; // Cho phép đi ra
          }

          // Nếu có kỹ năng Đá Bom (Kick), kích hoạt đá quả bom
          if (hasKick && b.vx === 0 && b.vy === 0) {
            const pCenterCol = Math.floor((p.x + size / 2) / TILE_SIZE);
            const pCenterRow = Math.floor((p.y + size / 2) / TILE_SIZE);
            if (pCenterRow === b.row && pCenterCol === b.col - 1 && p.dir === 'RIGHT') {
              b.vx = 6;
              playKickSound();
            } else if (pCenterRow === b.row && pCenterCol === b.col + 1 && p.dir === 'LEFT') {
              b.vx = -6;
              playKickSound();
            } else if (pCenterCol === b.col && pCenterRow === b.row - 1 && p.dir === 'DOWN') {
              b.vy = 6;
              playKickSound();
            } else if (pCenterCol === b.col && pCenterRow === b.row + 1 && p.dir === 'UP') {
              b.vy = -6;
              playKickSound();
            }
          }
        }
        return false;
      }
    }

    return true;
  };

  // Người chơi Đặt Bom
  const handlePlaceBomb = useCallback(() => {
    const p = playerRef.current;
    if (!p.isAlive || isPaused || isGameOver || isVictory) return;

    // Giới hạn số bom cùng lúc
    const activeBombs = bombsRef.current.filter(b => b.ownerIsPlayer).length;
    if (activeBombs >= maxBombs) return;

    // Tìm tâm ô người chơi đang đứng
    const centerCol = Math.floor((p.x + PLAYER_SIZE / 2) / TILE_SIZE);
    const centerRow = Math.floor((p.y + PLAYER_SIZE / 2) / TILE_SIZE);

    // Không được đặt đè lên quả bom khác
    const alreadyHasBomb = bombsRef.current.some(b => b.col === centerCol && b.row === centerRow);
    if (alreadyHasBomb) return;

    bombsRef.current.push({
      id: Date.now() + Math.random(),
      col: centerCol,
      row: centerRow,
      timer: 2500, // 2.5s đếm ngược nổ
      range: fireRange,
      ownerIsPlayer: true,
      vx: 0,
      vy: 0,
      x: centerCol * TILE_SIZE,
      y: centerRow * TILE_SIZE
    });

    playPlaceBombSound();
  }, [fireRange, isGameOver, isPaused, isVictory, maxBombs, playPlaceBombSound]);

  // Kích nổ quả bom và lan tỏa tia lửa chữ thập (Crossfire Blast)
  const triggerBombExplosion = useCallback((bomb: ActiveBomb) => {
    playExplosionSound();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);

    const bCol = bomb.col;
    const bRow = bomb.row;

    // Tạo tia lửa tâm
    flamesRef.current.push({
      col: bCol,
      row: bRow,
      timer: 450,
      isCenter: true
    });

    // Tạo bụi khói nổ
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: bCol * TILE_SIZE + TILE_SIZE / 2,
        y: bRow * TILE_SIZE + TILE_SIZE / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: i % 2 === 0 ? '#ef4444' : '#f59e0b',
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: 0.04
      });
    }

    // Lan tỏa 4 hướng: Lên, Xuống, Trái, Phải
    const directions: { dir: Direction; dc: number; dr: number }[] = [
      { dir: 'UP', dc: 0, dr: -1 },
      { dir: 'DOWN', dc: 0, dr: 1 },
      { dir: 'LEFT', dc: -1, dr: 0 },
      { dir: 'RIGHT', dc: 1, dr: 0 }
    ];

    directions.forEach(({ dir, dc, dr }) => {
      for (let step = 1; step <= bomb.range; step++) {
        const fc = bCol + dc * step;
        const fr = bRow + dr * step;

        if (fr < 0 || fr >= GRID_ROWS || fc < 0 || fc >= GRID_COLS) break;

        const tile = mapGridRef.current[fr][fc];

        // 1. Gặp trụ thép kiên cố -> Dừng tia lửa ngay lập tức
        if (tile === TILE_SOLID) break;

        // 2. Gặp gạch mềm -> Phá gạch, hiện vật phẩm (nếu có) và dừng tia lửa
        if (tile === TILE_BRICK) {
          mapGridRef.current[fr][fc] = TILE_EMPTY;

          // Kiểm tra xem ô này có vật phẩm không
          const hiddenItem = hiddenItemsRef.current.find(it => it.col === fc && it.row === fr);
          if (hiddenItem) {
            hiddenItem.revealed = true;
            if (hiddenItem.type === 'portal') {
              portalFoundRef.current = true;
            }
          }

          flamesRef.current.push({
            col: fc,
            row: fr,
            timer: 450,
            isCenter: false,
            dir
          });

          // Hạt vụn gạch văng tung tóe
          for (let p = 0; p < 8; p++) {
            particlesRef.current.push({
              id: Date.now() + Math.random(),
              x: fc * TILE_SIZE + TILE_SIZE / 2,
              y: fr * TILE_SIZE + TILE_SIZE / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#d97706',
              size: 3,
              alpha: 1,
              decay: 0.05
            });
          }
          break;
        }

        // 3. Ô trống -> Tia lửa tiếp tục lan tỏa
        flamesRef.current.push({
          col: fc,
          row: fr,
          timer: 450,
          isCenter: false,
          dir
        });

        // Kích nổ dây chuyền quả bom khác nếu dính lửa
        const chainBomb = bombsRef.current.find(b => b.id !== bomb.id && b.col === fc && b.row === fr);
        if (chainBomb) {
          chainBomb.timer = 0; // Kích nổ tức thì
        }
      }
    });
  }, [playExplosionSound]);

  // Bắt đầu Game Over
  const triggerGameOver = useCallback((_dueToTime: boolean = false) => {
    setIsGameOver(true);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
    playExplosionSound();
  }, [playExplosionSound]);

  // Xử lý bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = true;
      if (['Space', ' ', 'j', 'J', 'Enter'].includes(e.key)) {
        e.preventDefault();
        handlePlaceBomb();
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
  }, [handlePlaceBomb]);

  // Đếm ngược thời gian màn chơi
  useEffect(() => {
    if (isPaused || isGameOver || isVictory) return;
    const timerInterval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          triggerGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isGameOver, isPaused, isVictory, triggerGameOver]);

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
        // A. Cập nhật thời gian đóng băng quái vật
        if (freezeTimerRef.current > 0) {
          freezeTimerRef.current -= dt;
        }

        // B. Cập nhật người chơi
        const p = playerRef.current;
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
            p.moving = true;
            p.walkFrame += 0.2;

            // Hỗ trợ tự căn chỉnh tim đường góc rẽ (Corner Aligning Helper)
            if (desiredDir === 'UP' || desiredDir === 'DOWN') {
              const alignCol = Math.round((p.x - 4) / TILE_SIZE) * TILE_SIZE + 4;
              if (Math.abs(p.x - alignCol) < 9) p.x = alignCol;
            } else {
              const alignRow = Math.round((p.y - 4) / TILE_SIZE) * TILE_SIZE + 4;
              if (Math.abs(p.y - alignRow) < 9) p.y = alignRow;
            }

            const nextX = p.x + moveX;
            const nextY = p.y + moveY;
            if (canMoveTo(nextX, nextY, PLAYER_SIZE, false)) {
              p.x = nextX;
              p.y = nextY;
            }
          } else {
            p.moving = false;
          }

          // Kiểm tra nhặt vật phẩm
          for (const item of hiddenItemsRef.current) {
            if (item.revealed) {
              const ix = item.col * TILE_SIZE;
              const iy = item.row * TILE_SIZE;
              if (isColliding(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, ix, iy, TILE_SIZE, TILE_SIZE)) {
                // Nhặt vật phẩm
                if (item.type === 'portal') {
                  // Cổng qua màn chỉ mở khi đã tiêu diệt hết toàn bộ quái vật
                  const monstersRemaining = monstersRef.current.filter(m => m.isAlive).length;
                  if (monstersRemaining === 0) {
                    setIsVictory(true);
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                    soundManager.playVictory();
                  }
                } else {
                  playItemSound();
                  let txt = '';
                  switch (item.type) {
                    case 'extra_bomb':
                      setMaxBombs(b => Math.min(6, b + 1));
                      txt = '+1 BOM! 💣';
                      break;
                    case 'fire_up':
                      setFireRange(r => Math.min(6, r + 1));
                      txt = '+1 TẦM LỬA! 🔥';
                      break;
                    case 'speed_up':
                      setPlayerSpeedLevel(s => Math.min(4, s + 1));
                      p.speed += 0.4;
                      txt = 'TĂNG TỐC! 👟';
                      break;
                    case 'shield':
                      p.shieldTime = 15000; // 15 giây bất tử
                      txt = 'KHIÊN BẤT TỬ 15S! 🛡️';
                      break;
                    case 'clock':
                      freezeTimerRef.current = 8000; // 8 giây đóng băng
                      txt = 'ĐÓNG BĂNG 8S! ⏱️';
                      break;
                    case 'kick':
                      setHasKick(true);
                      txt = 'ĐÁ BOM! 🥊';
                      break;
                    case 'heart':
                      setLives(l => l + 1);
                      txt = '+1 MẠNG! 💖';
                      break;
                  }

                  // Cộng điểm
                  setScore(s => {
                    const newS = s + 200;
                    if (newS > highScore) {
                      setHighScore(newS);
                      try { localStorage.setItem('acegames_bomberman_highscore', String(newS)); } catch {}
                    }
                    return newS;
                  });

                  floatingTextsRef.current.push({
                    id: Date.now() + Math.random(),
                    x: ix + TILE_SIZE / 2,
                    y: iy,
                    text: txt,
                    color: '#38bdf8',
                    alpha: 1
                  });

                  // Xóa vật phẩm đã nhặt
                  hiddenItemsRef.current = hiddenItemsRef.current.filter(it => !(it.col === item.col && it.row === item.row));
                  break;
                }
              }
            }
          }
        }

        // C. Cập nhật bom & kích nổ
        for (const bomb of bombsRef.current) {
          // Xử lý đá bom trượt
          if (bomb.vx !== 0 || bomb.vy !== 0) {
            const nextBX = bomb.x + bomb.vx;
            const nextBY = bomb.y + bomb.vy;
            const testCol = Math.floor((nextBX + TILE_SIZE / 2) / TILE_SIZE);
            const testRow = Math.floor((nextBY + TILE_SIZE / 2) / TILE_SIZE);

            if (testCol >= 1 && testCol < GRID_COLS - 1 && testRow >= 1 && testRow < GRID_ROWS - 1) {
              const tile = mapGridRef.current[testRow][testCol];
              if (tile === TILE_EMPTY) {
                bomb.x = nextBX;
                bomb.y = nextBY;
                bomb.col = testCol;
                bomb.row = testRow;
              } else {
                // Đụng chướng ngại vật -> dừng lại
                bomb.vx = 0;
                bomb.vy = 0;
                bomb.x = bomb.col * TILE_SIZE;
                bomb.y = bomb.row * TILE_SIZE;
              }
            } else {
              bomb.vx = 0;
              bomb.vy = 0;
            }
          }

          bomb.timer -= dt;
          if (bomb.timer <= 0) {
            triggerBombExplosion(bomb);
          }
        }
        bombsRef.current = bombsRef.current.filter(b => b.timer > 0);

        // D. Cập nhật tia lửa nổ & sát thương
        for (const flame of flamesRef.current) {
          flame.timer -= dt;

          const fx = flame.col * TILE_SIZE;
          const fy = flame.row * TILE_SIZE;

          // Sát thương lên người chơi nếu không có khiên bất tử
          if (p.isAlive && p.shieldTime <= 0 && isColliding(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, fx, fy, TILE_SIZE, TILE_SIZE)) {
            p.isAlive = false;
            setLives(l => {
              const nl = l - 1;
              if (nl <= 0) {
                triggerGameOver(false);
              } else {
                // Hồi sinh tại góc an toàn
                setTimeout(() => {
                  p.x = TILE_SIZE + 4;
                  p.y = TILE_SIZE + 4;
                  p.dir = 'DOWN';
                  p.shieldTime = 4000;
                  p.isAlive = true;
                }, 600);
              }
              return nl;
            });
          }

          // Sát thương lên quái vật
          for (const m of monstersRef.current) {
            if (m.isAlive && isColliding(m.x, m.y, MONSTER_SIZE, MONSTER_SIZE, fx, fy, TILE_SIZE, TILE_SIZE)) {
              m.isAlive = false;
              playExplosionSound();

              setScore(s => {
                const newS = s + m.scoreValue;
                if (newS > highScore) {
                  setHighScore(newS);
                  try { localStorage.setItem('acegames_bomberman_highscore', String(newS)); } catch {}
                }
                return newS;
              });

              floatingTextsRef.current.push({
                id: Date.now() + Math.random(),
                x: m.x + MONSTER_SIZE / 2,
                y: m.y,
                text: `+${m.scoreValue}`,
                color: '#f59e0b',
                alpha: 1
              });

              for (let i = 0; i < 10; i++) {
                particlesRef.current.push({
                  id: Date.now() + Math.random(),
                  x: m.x + MONSTER_SIZE / 2,
                  y: m.y + MONSTER_SIZE / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#ef4444',
                  size: 3,
                  alpha: 1,
                  decay: 0.05
                });
              }
            }
          }
        }
        flamesRef.current = flamesRef.current.filter(f => f.timer > 0);

        // E. Cập nhật AI Quái vật (Monsters AI)
        if (freezeTimerRef.current <= 0) {
          for (const m of monstersRef.current) {
            if (!m.isAlive) continue;

            m.changeDirTimer -= dt;
            let mx = 0;
            let my = 0;

            if (m.dir === 'UP') my = -m.speed;
            else if (m.dir === 'DOWN') my = m.speed;
            else if (m.dir === 'LEFT') mx = -m.speed;
            else if (m.dir === 'RIGHT') mx = m.speed;

            const nextMX = m.x + mx;
            const nextMY = m.y + my;

            if (canMoveTo(nextMX, nextMY, MONSTER_SIZE, true) && m.changeDirTimer > 0) {
              m.x = nextMX;
              m.y = nextMY;
            } else {
              // Đổi hướng ngẫu nhiên khi đụng tường
              const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
              m.dir = dirs[Math.floor(Math.random() * dirs.length)];
              m.changeDirTimer = 600 + Math.random() * 1200;
            }

            // Quái vật cắn người chơi
            if (p.isAlive && p.shieldTime <= 0 && isColliding(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE, m.x, m.y, MONSTER_SIZE, MONSTER_SIZE)) {
              p.isAlive = false;
              playExplosionSound();

              setLives(l => {
                const nl = l - 1;
                if (nl <= 0) {
                  triggerGameOver(false);
                } else {
                  setTimeout(() => {
                    p.x = TILE_SIZE + 4;
                    p.y = TILE_SIZE + 4;
                    p.dir = 'DOWN';
                    p.shieldTime = 4000;
                    p.isAlive = true;
                  }, 600);
                }
                return nl;
              });
            }
          }
        }
      }

      // --- 2. VẼ TOÀN BỘ ĐỒ HỌA BOMBERMAN ARCADE ---
      // A. Nền tổng thể sân đấu
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // B. Nền mê cung sân đấu (0 đến 756px, 0 đến 540px)
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Lưới gạch sàn tinh tế
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // Đường ranh giới ngăn cách sân đấu và sidebar
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH, 0);
      ctx.lineTo(ARENA_WIDTH, ARENA_HEIGHT);
      ctx.stroke();

      // C. Vẽ Địa hình Sân đấu
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = mapGridRef.current[r]?.[c] ?? TILE_EMPTY;
          const tx = c * TILE_SIZE;
          const ty = r * TILE_SIZE;

          if (tile === TILE_SOLID) {
            // Trụ đá/thép không thể phá hủy 3D
            const solidGrad = ctx.createLinearGradient(tx, ty, tx + TILE_SIZE, ty + TILE_SIZE);
            solidGrad.addColorStop(0, '#64748b');
            solidGrad.addColorStop(0.5, '#334155');
            solidGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = solidGrad;
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

            // Viền 3D nổi khối
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Tâm chữ X kim loại
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx + 8, ty + 8);
            ctx.lineTo(tx + TILE_SIZE - 8, ty + TILE_SIZE - 8);
            ctx.moveTo(tx + TILE_SIZE - 8, ty + 8);
            ctx.lineTo(tx + 8, ty + TILE_SIZE - 8);
            ctx.stroke();
          } else if (tile === TILE_BRICK) {
            // Gạch mềm nung nâu đỏ phá hủy được
            const brickGrad = ctx.createLinearGradient(tx, ty, tx, ty + TILE_SIZE);
            brickGrad.addColorStop(0, '#d97706');
            brickGrad.addColorStop(1, '#b45309');
            ctx.fillStyle = brickGrad;
            ctx.fillRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Viền rãnh vữa gạch
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Họa tiết vết nứt gạch
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(tx + 4, ty + 6, TILE_SIZE - 8, 3);
            ctx.fillRect(tx + 4, ty + 18, TILE_SIZE - 8, 3);
            ctx.fillRect(tx + 4, ty + 28, TILE_SIZE - 8, 3);
          }
        }
      }

      // D. Vẽ Vật Phẩm và Cổng Qua Màn (đã lộ diện)
      const monstersRemaining = monstersRef.current.filter(m => m.isAlive).length;
      for (const item of hiddenItemsRef.current) {
        if (item.revealed) {
          const ix = item.col * TILE_SIZE;
          const iy = item.row * TILE_SIZE;

          ctx.save();
          if (item.type === 'portal') {
            // Cổng qua màn: Nhấp nháy hào quang neon khi quái đã bị quét sạch
            const isPortalOpen = monstersRemaining === 0;
            ctx.fillStyle = isPortalOpen ? '#10b981' : '#475569';
            ctx.fillRect(ix + 2, iy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.strokeStyle = isPortalOpen ? '#34d399' : '#64748b';
            ctx.lineWidth = 2;
            ctx.strokeRect(ix + 2, iy + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isPortalOpen ? '🌀' : '🚪', ix + TILE_SIZE / 2, iy + TILE_SIZE / 2);
          } else {
            // Hộp vật phẩm
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(ix + 3, iy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(ix + 3, iy + 3, TILE_SIZE - 6, TILE_SIZE - 6);

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let icon = '💣';
            if (item.type === 'fire_up') icon = '🔥';
            else if (item.type === 'speed_up') icon = '👟';
            else if (item.type === 'shield') icon = '🛡️';
            else if (item.type === 'clock') icon = '⏱️';
            else if (item.type === 'kick') icon = '🥊';
            else if (item.type === 'heart') icon = '💖';

            ctx.fillText(icon, ix + TILE_SIZE / 2, iy + TILE_SIZE / 2);
          }
          ctx.restore();
        }
      }

      // E. Vẽ Quả Bom (Active Bombs)
      const now = Date.now();
      for (const b of bombsRef.current) {
        const bx = b.vx !== 0 || b.vy !== 0 ? b.x : b.col * TILE_SIZE;
        const by = b.vx !== 0 || b.vy !== 0 ? b.y : b.row * TILE_SIZE;
        const pulse = Math.sin(now * 0.015) * 2;

        ctx.save();
        ctx.translate(bx + TILE_SIZE / 2, by + TILE_SIZE / 2);

        // Bóng quả bom
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thân bom tròn bóng loáng
        const bombGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14 + pulse);
        bombGrad.addColorStop(0, '#475569');
        bombGrad.addColorStop(0.4, '#1e293b');
        bombGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 13 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cổ ngòi nổ kim loại
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -16, 6, 4);

        // Dây cháy và tia lửa chớp nháy
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.quadraticCurveTo(4, -20, 2, -23);
        ctx.stroke();

        // Tia lửa ngòi nổ
        ctx.fillStyle = Math.floor(now / 80) % 2 === 0 ? '#ef4444' : '#facc15';
        ctx.beginPath();
        ctx.arc(2, -23, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // F. Vẽ Tia Lửa Nổ Chữ Thập (Fire Flames)
      for (const f of flamesRef.current) {
        const fx = f.col * TILE_SIZE;
        const fy = f.row * TILE_SIZE;

        ctx.save();
        const flameGrad = ctx.createRadialGradient(
          fx + TILE_SIZE / 2, fy + TILE_SIZE / 2, 2,
          fx + TILE_SIZE / 2, fy + TILE_SIZE / 2, TILE_SIZE / 2
        );
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#fde047');
        flameGrad.addColorStop(0.7, '#f97316');
        flameGrad.addColorStop(1, '#ef4444');

        ctx.fillStyle = flameGrad;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(fx + TILE_SIZE / 2, fy + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // G. Vẽ Quái Vật Mê Cung (Monsters)
      for (const m of monstersRef.current) {
        if (!m.isAlive) continue;

        ctx.save();
        ctx.translate(m.x + MONSTER_SIZE / 2, m.y + MONSTER_SIZE / 2);

        // Màu sắc và hình thái quái vật
        let mColor = '#ef4444';
        if (m.type === 'oneal') mColor = '#10b981';
        else if (m.type === 'dahl') mColor = '#eab308';
        else if (m.type === 'minvo') mColor = '#a855f7';

        // Thân quái vật nhấp nhô
        const bob = Math.sin(now * 0.01 + m.id) * 2;
        ctx.fillStyle = mColor;
        ctx.beginPath();
        ctx.arc(0, bob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Đôi mắt to tròn ngộ nghĩnh
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, bob - 2, 4, 0, Math.PI * 2);
        ctx.arc(4, bob - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Đồng tử mắt nhìn theo hướng
        ctx.fillStyle = '#0f172a';
        let eyeDx = 0;
        let eyeDy = 0;
        if (m.dir === 'LEFT') eyeDx = -1.5;
        else if (m.dir === 'RIGHT') eyeDx = 1.5;
        else if (m.dir === 'UP') eyeDy = -1.5;
        else if (m.dir === 'DOWN') eyeDy = 1.5;

        ctx.beginPath();
        ctx.arc(-4 + eyeDx, bob - 2 + eyeDy, 2, 0, Math.PI * 2);
        ctx.arc(4 + eyeDx, bob - 2 + eyeDy, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // H. Vẽ Nhân Vật Bomberman
      const p = playerRef.current;
      if (p.isAlive) {
        ctx.save();
        ctx.translate(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2);

        // Bóng chân
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 11, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bước chân hoạt họa
        const legBob = p.moving ? Math.sin(p.walkFrame * 5) * 2.5 : 0;

        // Đôi giày hồng
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-7, 7 + legBob, 5, 4);
        ctx.fillRect(2, 7 - legBob, 5, 4);

        // Thân áo xanh dương
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-7, -2, 14, 11);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-7, -2, 14, 11);

        // Đầu và mũ bảo hiểm trắng
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -7, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Kính mặt nạ màu hồng phấn
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(-5, -8, 10, 5);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(-5, -8, 10, 5);

        // 2 Mắt đen tròn
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -7, 2, 3);
        ctx.fillRect(1, -7, 2, 3);

        // Núm ăng-ten hồng trên đỉnh đầu
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, -17);
        ctx.stroke();

        // Khiên bảo vệ bất tử (Shield Forcefield)
        if (p.shieldTime > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, 19, 0, Math.PI * 2);
          ctx.stroke();

          // Vòng quay năng lượng
          ctx.save();
          ctx.rotate(now * 0.008);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-18, -18, 36, 36);
          ctx.restore();
        }

        ctx.restore();
      }

      // I. Vẽ Hiệu ứng Hạt nổ (Particles)
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

      // J. Vẽ Chữ Điểm Bay (Floating Texts)
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

      // --- 3. BẢNG ĐIỀU KHIỂN ARCADE CÁNH PHẢI (SIDEBAR 204PX) ---
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      // Tiêu đề
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHIẾN THUẬT BOMBER', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // Thời gian còn lại
      ctx.fillStyle = timeLeft < 30 ? '#ef4444' : '#38bdf8';
      ctx.font = '900 18px monospace';
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      ctx.fillText(`⏱️ ${mins}:${secs < 10 ? '0' : ''}${secs}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 56);

      // Vạch phân cách
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X + 16, 70);
      ctx.lineTo(SIDEBAR_X + SIDEBAR_WIDTH - 16, 70);
      ctx.stroke();

      // Chỉ số nâng cấp
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';

      let statY = 96;
      ctx.fillText('💣 Số Bom Tối Đa:', SIDEBAR_X + 18, statY);
      ctx.fillStyle = '#fde047';
      ctx.font = '900 13px monospace';
      ctx.fillText(`${maxBombs} quả`, SIDEBAR_X + 135, statY);

      statY += 28;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🔥 Tầm Xa Nổ:', SIDEBAR_X + 18, statY);
      ctx.fillStyle = '#f97316';
      ctx.font = '900 13px monospace';
      ctx.fillText(`${fireRange} ô`, SIDEBAR_X + 135, statY);

      statY += 28;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('👟 Tốc Độ Chạy:', SIDEBAR_X + 18, statY);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 13px monospace';
      ctx.fillText(`Cấp ${playerSpeedLevel}`, SIDEBAR_X + 135, statY);

      statY += 28;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🥊 Kỹ Năng Đá Bom:', SIDEBAR_X + 18, statY);
      ctx.fillStyle = hasKick ? '#34d399' : '#64748b';
      ctx.font = '900 12px sans-serif';
      ctx.fillText(hasKick ? 'ĐÃ CÓ' : 'CHƯA', SIDEBAR_X + 135, statY);

      statY += 28;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('👾 Quái Vật Còn:', SIDEBAR_X + 18, statY);
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 14px monospace';
      ctx.fillText(`${monstersRemaining}`, SIDEBAR_X + 135, statY);

      // Vạch phân cách 2
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X + 16, statY + 16);
      ctx.lineTo(SIDEBAR_X + SIDEBAR_WIDTH - 16, statY + 16);
      ctx.stroke();

      // Trạng thái Cổng Qua Màn (Portal Status)
      ctx.textAlign = 'center';
      const portalY = statY + 45;
      if (monstersRemaining > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🔒 CỔNG QUA MÀN KHÓA', SIDEBAR_X + SIDEBAR_WIDTH / 2, portalY);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.fillText('Tiêu diệt hết quái để mở!', SIDEBAR_X + SIDEBAR_WIDTH / 2, portalY + 16);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.font = '900 12px sans-serif';
        ctx.fillText('🔓 CỔNG QUA MÀN ĐÃ MỞ!', SIDEBAR_X + SIDEBAR_WIDTH / 2, portalY);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Bước vào cổng để qua màn ➔', SIDEBAR_X + SIDEBAR_WIDTH / 2, portalY + 16);
      }

      // Trạng thái Buffs
      let buffY = portalY + 46;
      if (playerRef.current.shieldTime > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🛡️ KHIÊN BẤT TỬ', SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }
      if (freezeTimerRef.current > 0) {
        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('⏱️ ĐÓNG BĂNG QUÁI', SIDEBAR_X + SIDEBAR_WIDTH / 2, buffY);
        buffY += 20;
      }

      // Cờ màn chơi ở góc dưới
      ctx.fillStyle = '#94a3b8';
      ctx.font = '900 11px sans-serif';
      ctx.fillText('CHIẾN DỊCH', SIDEBAR_X + SIDEBAR_WIDTH / 2, 490);
      ctx.font = '900 22px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`MÀN ${stage}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 516);

      ctx.restore(); // scale dpr

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [fireRange, hasKick, highScore, isGameOver, isPaused, isVictory, maxBombs, playExplosionSound, playItemSound, playerSpeedLevel, stage, timeLeft, triggerBombExplosion, triggerGameOver]);

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setLives(3);
    setMaxBombs(1);
    setFireRange(2);
    setPlayerSpeedLevel(1);
    setHasKick(false);
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
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400">THỜI GIAN:</span>
            <span className="text-cyan-400 font-mono font-black">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-150px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-1 min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Điều khiển ảo trên Điện thoại (Virtual D-Pad & Bomb Button) */}
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

          {/* Nút Đặt Bom ảo */}
          <div className="pointer-events-auto">
            <button
              onTouchStart={handlePlaceBomb}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-2xl active:scale-90 border-2 border-white/30 text-xs flex-col"
            >
              <Bomb className="w-6 h-6 mb-0.5" />
              <span>ĐẶT BOM</span>
            </button>
          </div>
        </div>

        {/* Modal Thắng Màn */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">HOÀN THÀNH MÀN {stage}!</h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-6">
              Bạn đã tiêu diệt toàn bộ quái vật mê cung và bước qua Cổng Thành Công an toàn.
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
              {timeLeft <= 0 ? 'HẾT THỜI GIAN MÀN CHƠI!' : 'BOMBERMAN ĐÃ BỊ HẠ GỤC!'}
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