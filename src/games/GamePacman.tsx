import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

interface Ghost {
  id: 'blinky' | 'pinky' | 'inky' | 'clyde';
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  homeX: number;
  homeY: number;
  isFrightened: boolean;
  isEaten: boolean;
  respawnTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

// 19 Cột x 21 Hàng - Mê cung Pac-Man Cyberpunk Neon cân đối
// 0: Trống, 1: Tường, 2: Hạt Đậu (10đ), 3: Hạt Năng Lượng (50đ), 4: Cổng Nhà Ma, 5: Trong Nhà Ma, 6: Đường Hầm Xuyên Màn
const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [6, 0, 0, 0, 2, 0, 0, 1, 5, 5, 5, 1, 0, 0, 2, 0, 0, 0, 6],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const COLS = 19;
const ROWS = 21;
const TILE_SIZE = 26;
const CANVAS_WIDTH = COLS * TILE_SIZE;  // 494
const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 546

export const GamePacman: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_pacman_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [initialLives] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pacman');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.initialLives === 'number') return parsed.initialLives;
      }
    } catch {}
    return 3;
  });

  const [speedMode, setSpeedMode] = useState<'normal' | 'fast' | 'turbo'>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_pacman');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['normal', 'fast', 'turbo'].includes(parsed.speedMode)) return parsed.speedMode;
      }
    } catch {}
    return 'normal';
  });

  const [lives, setLives] = useState<number>(initialLives);
  const [level, setLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Lưu cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ace_game_settings_pacman', JSON.stringify({ speedMode, initialLives }));
    } catch {}
  }, [speedMode, initialLives]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynth = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.08, vol: number = 0.06) => {
    if (!soundManager.isSoundOn()) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const playWakaTone = useCallback((step: number) => {
    const f = step % 2 === 0 ? 320 : 480;
    playSynth(f, 'triangle', 0.06, 0.04);
  }, [playSynth]);

  const playEatGhostSound = useCallback(() => {
    playSynth(600, 'sawtooth', 0.08, 0.08);
    setTimeout(() => playSynth(900, 'sawtooth', 0.1, 0.08), 80);
    setTimeout(() => playSynth(1200, 'sine', 0.15, 0.1), 160);
  }, [playSynth]);

  const playDeathSound = useCallback(() => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playSynth(600 - i * 60, 'sawtooth', 0.09, 0.07);
      }, i * 70);
    }
  }, [playSynth]);

  // Game Mutable State Ref for 60 FPS Canvas Loop
  const stateRef = useRef({
    maze: INITIAL_MAZE.map(row => [...row]),
    pacman: {
      x: 9 * TILE_SIZE + TILE_SIZE / 2,
      y: 16 * TILE_SIZE + TILE_SIZE / 2,
      dir: 'NONE' as Direction,
      nextDir: 'NONE' as Direction,
      speed: 2.2,
      mouthAngle: 0.25,
      mouthSpeed: 0.08,
      wakaStep: 0,
      radius: 10,
    },
    ghosts: [] as Ghost[],
    ghostEatMultiplier: 1,
    frightenedTimeRemaining: 0,
    frightenedDuration: 8.0,
    fruit: null as { x: number; y: number; active: boolean; points: number; timer: number } | null,
    totalDots: 0,
    dotsRemaining: 0,
    particles: [] as Particle[],
    popups: [] as ScorePopup[],
    speedMultiplier: 1.0,
    level: 1,
    score: 0,
    lives: 3,
    isPaused: false,
    isPlaying: false,
    isGameOver: false,
    shake: 0,
  });

  // Khởi tạo các bóng ma
  const createGhosts = useCallback((): Ghost[] => {
    return [
      {
        id: 'blinky',
        name: 'Blinky',
        color: '#f43f5e', // Đỏ Rose
        x: 9 * TILE_SIZE + TILE_SIZE / 2,
        y: 8 * TILE_SIZE + TILE_SIZE / 2,
        dir: 'LEFT',
        nextDir: 'LEFT',
        speed: 1.95,
        homeX: 9,
        homeY: 8,
        isFrightened: false,
        isEaten: false,
        respawnTimer: 0,
      },
      {
        id: 'pinky',
        name: 'Pinky',
        color: '#ec4899', // Hồng Pink
        x: 9 * TILE_SIZE + TILE_SIZE / 2,
        y: 10 * TILE_SIZE + TILE_SIZE / 2,
        dir: 'UP',
        nextDir: 'UP',
        speed: 1.85,
        homeX: 9,
        homeY: 10,
        isFrightened: false,
        isEaten: false,
        respawnTimer: 0,
      },
      {
        id: 'inky',
        name: 'Inky',
        color: '#06b6d4', // Xanh Cyan
        x: 8 * TILE_SIZE + TILE_SIZE / 2,
        y: 10 * TILE_SIZE + TILE_SIZE / 2,
        dir: 'UP',
        nextDir: 'UP',
        speed: 1.8,
        homeX: 8,
        homeY: 10,
        isFrightened: false,
        isEaten: false,
        respawnTimer: 0,
      },
      {
        id: 'clyde',
        name: 'Clyde',
        color: '#f97316', // Cam Orange
        x: 10 * TILE_SIZE + TILE_SIZE / 2,
        y: 10 * TILE_SIZE + TILE_SIZE / 2,
        dir: 'UP',
        nextDir: 'UP',
        speed: 1.75,
        homeX: 10,
        homeY: 10,
        isFrightened: false,
        isEaten: false,
        respawnTimer: 0,
      },
    ];
  }, []);

  // Đếm tổng số hạt đậu trên mê cung
  const countDots = useCallback((grid: number[][]) => {
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 2 || grid[r][c] === 3) count++;
      }
    }
    return count;
  }, []);

  // Khởi động lại toàn bộ ván đấu
  const resetGame = useCallback((nextLvl: boolean = false) => {
    soundManager.playButtonClick();
    const s = stateRef.current;
    const newLvl = nextLvl ? s.level + 1 : 1;
    const freshMaze = INITIAL_MAZE.map(row => [...row]);
    const dotCount = countDots(freshMaze);

    s.maze = freshMaze;
    s.totalDots = dotCount;
    s.dotsRemaining = dotCount;
    s.ghosts = createGhosts();
    s.ghostEatMultiplier = 1;
    s.frightenedTimeRemaining = 0;
    s.frightenedDuration = Math.max(3.5, 8.0 - (newLvl - 1) * 1.0);
    s.fruit = null;
    s.particles = [];
    s.popups = [];
    s.level = newLvl;
    s.isPaused = false;
    s.isGameOver = false;
    s.isPlaying = true;
    s.shake = 0;

    // Reset vị trí Pac-Man
    s.pacman.x = 9 * TILE_SIZE + TILE_SIZE / 2;
    s.pacman.y = 16 * TILE_SIZE + TILE_SIZE / 2;
    s.pacman.dir = 'NONE';
    s.pacman.nextDir = 'NONE';
    s.pacman.speed = 2.2 + (newLvl - 1) * 0.15;

    if (!nextLvl) {
      s.score = 0;
      s.lives = initialLives;
      setScore(0);
      setLives(initialLives);
    }

    setLevel(newLvl);
    setIsPlaying(true);
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
  }, [countDots, createGhosts, initialLives]);

  // Tạo hiệu ứng hạt nổ neon
  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const list = stateRef.current.particles;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3 + 1;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 3 + 1.5,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 15 + 10,
      });
    }
  }, []);

  // Popup điểm bay
  const spawnScorePopup = useCallback((x: number, y: number, text: string, color: string = '#38bdf8') => {
    stateRef.current.popups.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
    });
  }, []);

  // Lưu điểm kỷ lục
  const updateHighScore = useCallback((newScore: number) => {
    setHighScore(prev => {
      if (newScore > prev) {
        try {
          localStorage.setItem('acegames_pacman_highscore', newScore.toString());
        } catch {}
        return newScore;
      }
      return prev;
    });
  }, []);

  // Kiểm tra ô có đi qua được không
  const isWalkable = useCallback((tileX: number, tileY: number, isGhost: boolean = false): boolean => {
    if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
      // Đường hầm xuyên màn hình
      if (tileY === 10) return true;
      return false;
    }
    const val = stateRef.current.maze[tileY][tileX];
    if (val === 1) return false;
    if (val === 4 && !isGhost) return false; // Chỉ Ghost mới đi qua cổng nhà ma
    return true;
  }, []);

  // Di chuyển một nhân vật theo hướng
  const getNextTile = (tx: number, ty: number, dir: Direction) => {
    if (dir === 'UP') return { tx, ty: ty - 1 };
    if (dir === 'DOWN') return { tx, ty: ty + 1 };
    if (dir === 'LEFT') return { tx: tx - 1, ty };
    if (dir === 'RIGHT') return { tx: tx + 1, ty };
    return { tx, ty };
  };

  // Cập nhật phím bấm điều khiển
  const requestDirection = useCallback((dir: Direction) => {
    if (!stateRef.current.isPlaying) {
      resetGame();
    }
    stateRef.current.pacman.nextDir = dir;
  }, [resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        requestDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        requestDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        requestDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        requestDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestDirection]);

  // Điều khiển chế độ tốc độ
  useEffect(() => {
    const s = stateRef.current;
    if (speedMode === 'normal') s.speedMultiplier = 1.0;
    else if (speedMode === 'fast') s.speedMultiplier = 1.25;
    else s.speedMultiplier = 1.5;
  }, [speedMode]);

  useEffect(() => {
    stateRef.current.isPaused = isPaused;
  }, [isPaused]);

  // Vòng lặp vật lý & Logic Pac-Man 60 FPS
  const updateGamePhysics = useCallback(() => {
    const s = stateRef.current;
    if (!s.isPlaying || s.isPaused || s.isGameOver) return;

    const mult = s.speedMultiplier;
    const pac = s.pacman;

    // --- 1. Pac-Man Di Chuyển & Căn Giữa Ô Lưới ---
    const curTileX = Math.floor(pac.x / TILE_SIZE);
    const curTileY = Math.floor(pac.y / TILE_SIZE);
    const centerTileX = curTileX * TILE_SIZE + TILE_SIZE / 2;
    const centerTileY = curTileY * TILE_SIZE + TILE_SIZE / 2;

    // Kiểm tra đổi hướng dự định
    if (pac.nextDir !== pac.dir && pac.nextDir !== 'NONE') {
      const nextTarget = getNextTile(curTileX, curTileY, pac.nextDir);
      // Đổi hướng ngược lại ngay lập tức mà không cần chờ tâm ô
      const isOpposite = 
        (pac.dir === 'LEFT' && pac.nextDir === 'RIGHT') ||
        (pac.dir === 'RIGHT' && pac.nextDir === 'LEFT') ||
        (pac.dir === 'UP' && pac.nextDir === 'DOWN') ||
        (pac.dir === 'DOWN' && pac.nextDir === 'UP');

      if (isOpposite) {
        pac.dir = pac.nextDir;
      } else if (isWalkable(nextTarget.tx, nextTarget.ty)) {
        // Căn chuyển hướng khi gần tâm ô trong bán kính 6px
        const distToCenter = Math.hypot(pac.x - centerTileX, pac.y - centerTileY);
        if (distToCenter < 7) {
          pac.x = centerTileX;
          pac.y = centerTileY;
          pac.dir = pac.nextDir;
        }
      }
    }

    // Di chuyển Pac-Man theo hướng hiện tại
    if (pac.dir !== 'NONE') {
      const spd = pac.speed * mult;
      let nextX = pac.x;
      let nextY = pac.y;

      if (pac.dir === 'UP') nextY -= spd;
      if (pac.dir === 'DOWN') nextY += spd;
      if (pac.dir === 'LEFT') nextX -= spd;
      if (pac.dir === 'RIGHT') nextX += spd;

      // Xử lý đường hầm xuyên màn hình (Row 10)
      if (curTileY === 10) {
        if (nextX < -TILE_SIZE / 2) nextX = CANVAS_WIDTH + TILE_SIZE / 2;
        else if (nextX > CANVAS_WIDTH + TILE_SIZE / 2) nextX = -TILE_SIZE / 2;
      }

      const testTileX = Math.floor((nextX + (pac.dir === 'RIGHT' ? pac.radius : pac.dir === 'LEFT' ? -pac.radius : 0)) / TILE_SIZE);
      const testTileY = Math.floor((nextY + (pac.dir === 'DOWN' ? pac.radius : pac.dir === 'UP' ? -pac.radius : 0)) / TILE_SIZE);

      if (isWalkable(testTileX, testTileY)) {
        pac.x = nextX;
        pac.y = nextY;

        // Hoạt hình đóng mở miệng
        pac.mouthAngle += pac.mouthSpeed;
        if (pac.mouthAngle > 0.45 || pac.mouthAngle < 0.05) {
          pac.mouthSpeed = -pac.mouthSpeed;
        }
      } else {
        // Chặn lại ở tâm ô khi gặp tường
        if (pac.dir === 'LEFT' || pac.dir === 'RIGHT') pac.x = centerTileX;
        if (pac.dir === 'UP' || pac.dir === 'DOWN') pac.y = centerTileY;
      }
    }

    // --- 2. Ăn Hạt Đậu (Pellet) & Hạt Năng Lượng (Power Pellet) ---
    const pacTileX = Math.floor(pac.x / TILE_SIZE);
    const pacTileY = Math.floor(pac.y / TILE_SIZE);

    if (pacTileX >= 0 && pacTileX < COLS && pacTileY >= 0 && pacTileY < ROWS) {
      const tileVal = s.maze[pacTileY][pacTileX];

      if (tileVal === 2) {
        // Ăn hạt đậu nhỏ: 10 điểm
        s.maze[pacTileY][pacTileX] = 0;
        s.score += 10;
        s.dotsRemaining--;
        setScore(s.score);
        updateHighScore(s.score);
        pac.wakaStep++;
        playWakaTone(pac.wakaStep);
        spawnParticles(pac.x, pac.y, '#fef08a', 4);

        // Xuất hiện quả thưởng khi ăn được 50% hoặc 80% hạt đậu
        if (s.dotsRemaining === Math.floor(s.totalDots * 0.5) || s.dotsRemaining === Math.floor(s.totalDots * 0.2)) {
          s.fruit = { x: 9 * TILE_SIZE + TILE_SIZE / 2, y: 12 * TILE_SIZE + TILE_SIZE / 2, active: true, points: 200 * s.level, timer: 600 };
        }
      } else if (tileVal === 3) {
        // Ăn hạt năng lượng lớn: 50 điểm + Kích hoạt Frightened Mode
        s.maze[pacTileY][pacTileX] = 0;
        s.score += 50;
        s.dotsRemaining--;
        setScore(s.score);
        updateHighScore(s.score);
        playSynth(880, 'sawtooth', 0.2, 0.1);
        spawnParticles(pac.x, pac.y, '#38bdf8', 16);

        // Bật trạng thái sợ hãi cho toàn bộ Ghost chưa bị ăn
        s.frightenedTimeRemaining = s.frightenedDuration;
        s.ghostEatMultiplier = 1;
        s.ghosts.forEach(g => {
          if (!g.isEaten) {
            g.isFrightened = true;
          }
        });
      }
    }

    // --- 3. Đếm ngược Frightened Mode ---
    if (s.frightenedTimeRemaining > 0) {
      s.frightenedTimeRemaining -= 1 / 60;
      if (s.frightenedTimeRemaining <= 0) {
        s.frightenedTimeRemaining = 0;
        s.ghosts.forEach(g => g.isFrightened = false);
      }
    }

    // --- 4. Cập nhật quả thưởng (Fruit) ---
    if (s.fruit && s.fruit.active) {
      s.fruit.timer--;
      if (s.fruit.timer <= 0) {
        s.fruit.active = false;
      } else {
        const distFruit = Math.hypot(pac.x - s.fruit.x, pac.y - s.fruit.y);
        if (distFruit < pac.radius + 10) {
          s.score += s.fruit.points;
          setScore(s.score);
          updateHighScore(s.score);
          spawnScorePopup(s.fruit.x, s.fruit.y, `+${s.fruit.points}`, '#fbbf24');
          playSynth(1040, 'triangle', 0.2, 0.1);
          s.fruit.active = false;
        }
      }
    }

    // --- 5. Cập nhật AI 4 Bóng Ma (Blinky, Pinky, Inky, Clyde) ---
    s.ghosts.forEach(ghost => {
      // Hồi sinh nếu đã bị ăn và quay về nhà
      if (ghost.isEaten) {
        const distHome = Math.hypot(ghost.x - (ghost.homeX * TILE_SIZE + TILE_SIZE / 2), ghost.y - (ghost.homeY * TILE_SIZE + TILE_SIZE / 2));
        if (distHome < 8) {
          ghost.isEaten = false;
          ghost.isFrightened = false;
          ghost.dir = 'UP';
        }
      }

      const gTileX = Math.floor(ghost.x / TILE_SIZE);
      const gTileY = Math.floor(ghost.y / TILE_SIZE);
      const gCenterX = gTileX * TILE_SIZE + TILE_SIZE / 2;
      const gCenterY = gTileY * TILE_SIZE + TILE_SIZE / 2;
      const distCenter = Math.hypot(ghost.x - gCenterX, ghost.y - gCenterY);

      let targetX = pac.x;
      let targetY = pac.y;

      if (ghost.isEaten) {
        // Đã bị ăn: Chạy nhanh về nhà ma để hồi sinh
        targetX = ghost.homeX * TILE_SIZE + TILE_SIZE / 2;
        targetY = ghost.homeY * TILE_SIZE + TILE_SIZE / 2;
      } else if (ghost.isFrightened) {
        // Đang sợ hãi: Điểm đến ngẫu nhiên
        targetX = (COLS - gTileX) * TILE_SIZE;
        targetY = (ROWS - gTileY) * TILE_SIZE;
      } else {
        // Tính toán chiến thuật theo tính cách từng con
        if (ghost.id === 'blinky') {
          // Blinky: Truy đuổi trực diện Pac-Man
          targetX = pac.x;
          targetY = pac.y;
        } else if (ghost.id === 'pinky') {
          // Pinky: Phục kích trước đầu Pac-Man 4 ô
          const ahead = getNextTile(pacTileX, pacTileY, pac.dir);
          targetX = ahead.tx * TILE_SIZE;
          targetY = ahead.ty * TILE_SIZE;
        } else if (ghost.id === 'inky') {
          // Inky: Đánh gọng kìm
          targetX = pac.x + (Math.random() - 0.5) * 80;
          targetY = pac.y + (Math.random() - 0.5) * 80;
        } else if (ghost.id === 'clyde') {
          // Clyde: Lại gần thì chạy ra góc, xa thì đuổi
          const distToPac = Math.hypot(ghost.x - pac.x, ghost.y - pac.y);
          if (distToPac < 120) {
            targetX = 1 * TILE_SIZE;
            targetY = (ROWS - 2) * TILE_SIZE;
          }
        }
      }

      // Đổi hướng thông minh tại các ngã tư
      if (distCenter < 3.5) {
        ghost.x = gCenterX;
        ghost.y = gCenterY;

        const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const validDirs = possibleDirs.filter(d => {
          // Không đi lùi ngược lại hướng vừa đi trừ phi cùng đường
          const isReverse = 
            (ghost.dir === 'LEFT' && d === 'RIGHT') ||
            (ghost.dir === 'RIGHT' && d === 'LEFT') ||
            (ghost.dir === 'UP' && d === 'DOWN') ||
            (ghost.dir === 'DOWN' && d === 'UP');
          if (isReverse && !ghost.isEaten) return false;

          const nxt = getNextTile(gTileX, gTileY, d);
          return isWalkable(nxt.tx, nxt.ty, true);
        });

        if (validDirs.length > 0) {
          // Chọn hướng đưa Ghost đến gần mục tiêu nhất
          let bestDir = validDirs[0];
          let bestDist = Infinity;

          validDirs.forEach(d => {
            const nxt = getNextTile(gTileX, gTileY, d);
            const nxtPixelX = nxt.tx * TILE_SIZE + TILE_SIZE / 2;
            const nxtPixelY = nxt.ty * TILE_SIZE + TILE_SIZE / 2;
            const dist = Math.hypot(nxtPixelX - targetX, nxtPixelY - targetY);

            // Nếu đang Frightened thì chọn ngẫu nhiên
            if (ghost.isFrightened) {
              if (Math.random() < 0.35) bestDir = d;
            } else if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          });

          ghost.dir = bestDir;
        }
      }

      // Di chuyển Ghost
      const gSpeed = ghost.isEaten ? 4.0 : (ghost.isFrightened ? 1.2 : ghost.speed) * mult;
      if (ghost.dir === 'UP') ghost.y -= gSpeed;
      if (ghost.dir === 'DOWN') ghost.y += gSpeed;
      if (ghost.dir === 'LEFT') ghost.x -= gSpeed;
      if (ghost.dir === 'RIGHT') ghost.x += gSpeed;

      // Xuyên hầm màn hình
      if (gTileY === 10) {
        if (ghost.x < -TILE_SIZE / 2) ghost.x = CANVAS_WIDTH + TILE_SIZE / 2;
        else if (ghost.x > CANVAS_WIDTH + TILE_SIZE / 2) ghost.x = -TILE_SIZE / 2;
      }

      // --- 6. Xử lý va chạm giữa Pac-Man và Ghost ---
      const distToPac = Math.hypot(pac.x - ghost.x, pac.y - ghost.y);
      if (distToPac < pac.radius + 8) {
        if (ghost.isFrightened && !ghost.isEaten) {
          // Pac-Man ăn Ghost: cộng điểm theo chuỗi combo (200, 400, 800, 1600)
          ghost.isEaten = true;
          ghost.isFrightened = false;
          const pts = 200 * s.ghostEatMultiplier;
          s.score += pts;
          s.ghostEatMultiplier = Math.min(8, s.ghostEatMultiplier * 2);
          setScore(s.score);
          updateHighScore(s.score);
          playEatGhostSound();
          spawnScorePopup(ghost.x, ghost.y, `+${pts}`, '#38bdf8');
          spawnParticles(ghost.x, ghost.y, ghost.color, 24);
        } else if (!ghost.isEaten && !ghost.isFrightened) {
          // Pac-Man bị Ghost bắt
          s.lives--;
          setLives(s.lives);
          s.shake = 15;
          playDeathSound();
          spawnParticles(pac.x, pac.y, '#facc15', 30);

          if (s.lives <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            setIsPlaying(false);
            soundManager.playDefeat();
          } else {
            // Hồi sinh Pac-Man và Ghost về vị trí ban đầu
            pac.x = 9 * TILE_SIZE + TILE_SIZE / 2;
            pac.y = 16 * TILE_SIZE + TILE_SIZE / 2;
            pac.dir = 'NONE';
            pac.nextDir = 'NONE';
            s.ghosts = createGhosts();
          }
        }
      }
    });

    // --- 7. Kiểm tra Qua Màn (Victory Level Clear) ---
    if (s.dotsRemaining <= 0) {
      s.isPlaying = false;
      setIsVictory(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      soundManager.playVictory();
      setTimeout(() => {
        resetGame(true);
      }, 2000);
    }

    // --- 8. Hạt bụi & Popups ---
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) s.particles.splice(i, 1);
    }

    for (let i = s.popups.length - 1; i >= 0; i--) {
      const pop = s.popups[i];
      pop.y -= 0.6;
      pop.alpha -= 0.02;
      if (pop.alpha <= 0) s.popups.splice(i, 1);
    }

    if (s.shake > 0) s.shake--;
  }, [
    isWalkable,
    updateHighScore,
    playWakaTone,
    playSynth,
    playEatGhostSound,
    playDeathSound,
    spawnParticles,
    spawnScorePopup,
    createGhosts,
    resetGame,
  ]);

  // Vẽ Canvas Cyberpunk Neon 60 FPS
  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;

    ctx.save();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Rung màn hình khi bị bắt
    if (s.shake > 0) {
      const dx = (Math.random() - 0.5) * s.shake;
      const dy = (Math.random() - 0.5) * s.shake;
      ctx.translate(dx, dy);
    }

    // Nền tối Cyberpunk
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Vẽ Mê Cung (Neon Grid Walls)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = s.maze[r][c];
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (val === 1) {
          // Tường Neon Cyberpunk Xanh Lam phát sáng
          ctx.save();
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#082f49';
          ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.restore();
        } else if (val === 4) {
          // Cổng nhà ma
          ctx.fillStyle = 'rgba(236, 72, 153, 0.6)';
          ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
        } else if (val === 2) {
          // Hạt đậu nhỏ
          ctx.save();
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.restore();
        } else if (val === 3) {
          // Hạt năng lượng lớn (Power Pellet nhấp nháy tỏa sáng)
          const pulse = (Math.sin(Date.now() / 150) + 1) * 0.5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6.5 + pulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 14 + pulse * 6;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // 2. Vẽ quả thưởng nếu có
    if (s.fruit && s.fruit.active) {
      ctx.save();
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍒', s.fruit.x, s.fruit.y);
      ctx.restore();
    }

    // 3. Vẽ Pac-Man
    const pac = s.pacman;
    ctx.save();
    ctx.translate(pac.x, pac.y);

    let rot = 0;
    if (pac.dir === 'UP') rot = 1.5 * Math.PI;
    else if (pac.dir === 'DOWN') rot = 0.5 * Math.PI;
    else if (pac.dir === 'LEFT') rot = Math.PI;
    else if (pac.dir === 'RIGHT') rot = 0;
    ctx.rotate(rot);

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    const mouth = pac.mouthAngle * Math.PI;
    ctx.arc(0, 0, pac.radius, mouth, Math.PI * 2 - mouth);
    ctx.lineTo(0, 0);
    ctx.fillStyle = '#facc15';
    ctx.fill();

    // Mắt Pac-Man
    ctx.beginPath();
    ctx.arc(pac.radius * 0.15, -pac.radius * 0.55, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.restore();

    // 4. Vẽ 4 Con Ma (Ghosts)
    s.ghosts.forEach(ghost => {
      ctx.save();
      ctx.translate(ghost.x, ghost.y);

      if (ghost.isEaten) {
        // Chỉ vẽ cặp mắt khi bị ăn đang chạy về nhà
        ctx.beginPath();
        ctx.arc(-4, -2, 4, 0, Math.PI * 2);
        ctx.arc(4, -2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
      } else {
        const isFlashing = ghost.isFrightened && s.frightenedTimeRemaining < 2.5 && Math.floor(Date.now() / 150) % 2 === 0;
        const ghostColor = ghost.isFrightened ? (isFlashing ? '#ffffff' : '#2563eb') : ghost.color;

        ctx.shadowColor = ghostColor;
        ctx.shadowBlur = 14;

        // Thân trên tròn
        ctx.beginPath();
        ctx.arc(0, -2, 10, Math.PI, 0, false);
        ctx.lineTo(10, 8);
        // Chân váy dập dềnh
        const wave = Math.sin(Date.now() / 100) * 2;
        ctx.lineTo(6, 6 + wave);
        ctx.lineTo(2, 8);
        ctx.lineTo(-2, 6 - wave);
        ctx.lineTo(-6, 8);
        ctx.lineTo(-10, 6 + wave);
        ctx.lineTo(-10, -2);
        ctx.closePath();
        ctx.fillStyle = ghostColor;
        ctx.fill();

        // Mắt Ghost
        if (!ghost.isFrightened) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, -3, 3.2, 0, Math.PI * 2);
          ctx.arc(4, -3, 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Con ngươi nhìn theo hướng
          let lookX = 0;
          let lookY = 0;
          if (ghost.dir === 'LEFT') lookX = -1.5;
          if (ghost.dir === 'RIGHT') lookX = 1.5;
          if (ghost.dir === 'UP') lookY = -1.5;
          if (ghost.dir === 'DOWN') lookY = 1.5;

          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(-4 + lookX, -3 + lookY, 1.6, 0, Math.PI * 2);
          ctx.arc(4 + lookX, -3 + lookY, 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Mắt sợ hãi
          ctx.fillStyle = isFlashing ? '#f43f5e' : '#fef08a';
          ctx.beginPath();
          ctx.arc(-4, -3, 2, 0, Math.PI * 2);
          ctx.arc(4, -3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });

    // 5. Vẽ Hạt Bụi Tia Lửa
    s.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });

    // 6. Vẽ Popups Điểm Bay
    s.popups.forEach(pop => {
      ctx.save();
      ctx.globalAlpha = pop.alpha;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = pop.color;
      ctx.shadowColor = pop.color;
      ctx.shadowBlur = 8;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();
  }, []);

  // Vòng lặp Render V-Sync 60 FPS
  useEffect(() => {
    let animId: number;
    const loop = () => {
      updateGamePhysics();
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderCanvas(ctx);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updateGamePhysics, renderCanvas]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070b14]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(98vw,1440px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Tốc độ & Màn chơi */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            <span className="px-2 py-0.5 text-yellow-400 font-bold text-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Màn</span> {level}
            </span>
          </div>

          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['normal', 'fast', 'turbo'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSpeedMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  speedMode === mode
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode === 'normal' ? 'Chuẩn' : mode === 'fast' ? 'Nhanh' : 'Siêu Tốc'}
              </button>
            ))}
          </div>
        </div>

        {/* Khối Giữa: ĐIỂM SỐ & KỶ LỤC - CĂN CHÍNH GIỮA TUYỆT ĐỐI 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-full flex items-center justify-center z-0 pointer-events-none select-none">
          {/* Dấu hai chấm neo tuyệt đối 50% */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-gray-500 font-black text-base sm:text-lg select-none">•</span>
          </div>

          {/* Bên Trái: Điểm Số Hiện Tại */}
          <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-yellow-400 tracking-wide">ĐIỂM:</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono min-w-[50px] text-right">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Bên Phải: Kỷ Lục & Số Mạng (Lives) */}
          <div className="absolute left-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-start gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-black text-cyan-400 tracking-wide">TOP:</span>
            <span className="text-base sm:text-lg font-black text-white font-mono">
              {highScore.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm transition-opacity ${i < lives ? 'opacity-100 scale-105' : 'opacity-20'}`}
                >
                  🟡
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Khối Phải: Tạm dừng & Ván mới */}
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => resetGame()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-400 hover:text-yellow-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sân đấu Canvas Pac-Man Neon Cyberpunk */}
      <div 
        className="game-arena-box relative bg-slate-950 p-2 rounded-3xl w-full max-w-[min(96vw,540px)] max-h-[calc(100dvh-170px)] border-4 border-yellow-500/40 shadow-[0_0_50px_rgba(234,179,8,0.25)] overflow-hidden flex items-center justify-center flex-1 min-h-0"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block rounded-2xl cursor-pointer"
        />

        {/* Màn hình Bắt Đầu */}
        {!isPlaying && !isGameOver && !isVictory && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-6xl mb-3 animate-bounce">🟡</span>
            <h3 className="text-3xl font-black text-yellow-400 mb-2 tracking-wider">PAC-MAN</h3>
            <p className="text-sm text-gray-300 mb-6 font-semibold">Ăn hạt đậu, né 4 con ma & nuốt hạt năng lượng!</p>
            <button
              onClick={() => resetGame()}
              className="px-8 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(234,179,8,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-slate-950" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Màn hình Tạm Dừng */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-30">
            <Pause className="w-14 h-14 text-yellow-400 animate-pulse" />
            <span className="text-2xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
            <button
              onClick={() => setIsPaused(false)}
              className="px-8 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-base uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-yellow-500/40"
            >
              Tiếp Tục
            </button>
          </div>
        )}

        {/* Màn hình Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
            <span className="text-6xl mb-2">👻</span>
            <h3 className="text-3xl font-black text-rose-500 mb-2 tracking-wider">GAME OVER!</h3>
            <p className="text-sm text-gray-300 font-semibold mb-6">
              Điểm đạt được: <strong className="text-yellow-400 font-mono text-lg">{score.toLocaleString()}</strong>
            </p>
            <button
              onClick={() => resetGame()}
              className="px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(234,179,8,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại
            </button>
          </div>
        )}

        {/* Màn hình Qua Màn (Victory) */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
            <Sparkles className="w-16 h-16 text-yellow-400 animate-spin mb-3" />
            <h3 className="text-3xl font-black text-yellow-400 mb-2 tracking-wider">XUẤT SẮC!</h3>
            <p className="text-sm text-gray-300 font-semibold mb-4">Đã xóa sạch mê cung! Chuẩn bị lên Màn {level + 1}...</p>
          </div>
        )}
      </div>

      {/* D-Pad Ảo Cho Thiết Bị Cảm Ứng & Điện Thoại Di Động */}
      <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 z-10">
        <button
          onClick={() => requestDirection('LEFT')}
          className="p-3 bg-slate-800/90 active:bg-yellow-500 text-yellow-400 active:text-slate-950 rounded-2xl border border-white/10 shadow-md cursor-pointer transition active:scale-95"
          aria-label="Trái"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => requestDirection('UP')}
            className="p-3 bg-slate-800/90 active:bg-yellow-500 text-yellow-400 active:text-slate-950 rounded-2xl border border-white/10 shadow-md cursor-pointer transition active:scale-95"
            aria-label="Lên"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => requestDirection('DOWN')}
            className="p-3 bg-slate-800/90 active:bg-yellow-500 text-yellow-400 active:text-slate-950 rounded-2xl border border-white/10 shadow-md cursor-pointer transition active:scale-95"
            aria-label="Xuống"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => requestDirection('RIGHT')}
          className="p-3 bg-slate-800/90 active:bg-yellow-500 text-yellow-400 active:text-slate-950 rounded-2xl border border-white/10 shadow-md cursor-pointer transition active:scale-95"
          aria-label="Phải"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
