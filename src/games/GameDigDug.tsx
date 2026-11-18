import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trophy, Heart, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Grid Configuration
const TOP_OFFSET = 60; // Top sky & surface boundary
const DIRT_HEIGHT = CANVAS_HEIGHT - TOP_OFFSET;
const GRID_COLS = 24;
const GRID_ROWS = 14;
const CELL_W = CANVAS_WIDTH / GRID_COLS; // 40px
const CELL_H = DIRT_HEIGHT / GRID_ROWS; // ~34.28px

type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'playing' | 'round_clear' | 'game_over' | 'paused';

interface Vegetable {
  active: boolean;
  x: number;
  y: number;
  name: string;
  points: number;
  icon: string;
  timer: number;
}

interface Boulder {
  id: number;
  col: number;
  row: number;
  x: number;
  y: number;
  state: 'idle' | 'wobble' | 'falling' | 'broken';
  wobbleTimer: number;
  vy: number;
  crushedCount: number;
}

interface Enemy {
  id: number;
  type: 'pooka' | 'fygar';
  x: number;
  y: number;
  dir: Direction;
  targetDir: Direction;
  speed: number;
  isGhost: boolean;
  ghostTimer: number;
  // Pumping status
  pumpStage: number; // 0: normal, 1-3: inflated, 4: popped
  pumpTimer: number; // cooldown before deflating
  // Fygar special fire
  fireState: 'none' | 'warning' | 'breathing';
  fireTimer: number;
  fireLength: number;
  fireDir: Direction;
  // Last enemy escape
  isEscaping: boolean;
  isDead: boolean;
  deathAnimTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const VEGETABLE_TIERS = [
  { name: 'Cà Rốt', points: 400, icon: '🥕' },
  { name: 'Củ Cải', points: 600, icon: '🥗' },
  { name: 'Nấm Hương', points: 800, icon: '🍄' },
  { name: 'Dưa Chuột', points: 1000, icon: '🥒' },
  { name: 'Cà Tím', points: 2000, icon: '🍆' },
  { name: 'Ớt Chuông', points: 3000, icon: '🫑' },
  { name: 'Dưa Hấu', points: 4000, icon: '🍉' },
];

export const GameDigDug: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React HUD States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_digdug_highscore') || '25000', 10);
    } catch {
      return 25000;
    }
  });
  const [lives, setLives] = useState<number>(3);
  const [round, setRound] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>('playing');

  // Loop references for 60fps
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const roundRef = useRef(round);
  const gameStateRef = useRef(gameState);

  // Dirt Grid: true = solid dirt, false = hollow tunnel
  const gridRef = useRef<boolean[][]>([]);

  // Player Dig Dug
  const playerRef = useRef({
    x: 480,
    y: 280,
    w: 32,
    h: 32,
    dir: 'right' as Direction,
    moving: false,
    speed: 2.8,
    digAnim: 0,
    isDead: false,
    deathTimer: 0,
    pumpActive: false,
    pumpLength: 0,
    pumpMax: 110,
    hookedEnemyId: null as number | null,
    stepAudioCooldown: 0,
  });

  // Entities
  const enemiesRef = useRef<Enemy[]>([]);
  const bouldersRef = useRef<Boulder[]>([]);
  const vegetableRef = useRef<Vegetable | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const keysRef = useRef<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    pump: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
    pump: false,
  });

  const rocksFallenCountRef = useRef(0);

  // Initialize dirt grid & round tunnels
  const initRound = useCallback((targetRound: number) => {
    // 1. Create full dirt grid
    const g: boolean[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        g[r][c] = true;
      }
    }

    // Carve initial tunnels
    // Starting vertical tunnel for Dig Dug in center
    for (let r = 0; r <= 6; r++) {
      g[r][11] = false;
      g[r][12] = false;
    }
    // Horizontal starting chamber
    for (let c = 10; c <= 13; c++) {
      g[6][c] = false;
    }

    // Tunnel 1: Top Right (for Pooka)
    for (let c = 16; c <= 20; c++) {
      g[2][c] = false;
    }

    // Tunnel 2: Left Middle (for Fygar)
    for (let c = 3; c <= 7; c++) {
      g[5][c] = false;
    }

    // Tunnel 3: Bottom Right (for Fygar)
    for (let c = 15; c <= 20; c++) {
      g[9][c] = false;
    }

    // Tunnel 4: Bottom Left (for Pooka)
    for (let c = 4; c <= 8; c++) {
      g[10][c] = false;
    }

    gridRef.current = g;

    // Reset Player to center chamber
    playerRef.current = {
      x: 12 * CELL_W,
      y: TOP_OFFSET + 6 * CELL_H,
      w: 32,
      h: 32,
      dir: 'right',
      moving: false,
      speed: 2.8,
      digAnim: 0,
      isDead: false,
      deathTimer: 0,
      pumpActive: false,
      pumpLength: 0,
      pumpMax: 110,
      hookedEnemyId: null,
      stepAudioCooldown: 0,
    };

    // 2. Spawn Boulders (3 to 4 rocks)
    const rocks: Boulder[] = [
      {
        id: 1,
        col: 5,
        row: 2,
        x: 5 * CELL_W + CELL_W / 2,
        y: TOP_OFFSET + 2 * CELL_H + CELL_H / 2,
        state: 'idle',
        wobbleTimer: 0,
        vy: 0,
        crushedCount: 0,
      },
      {
        id: 2,
        col: 18,
        row: 1,
        x: 18 * CELL_W + CELL_W / 2,
        y: TOP_OFFSET + 1 * CELL_H + CELL_H / 2,
        state: 'idle',
        wobbleTimer: 0,
        vy: 0,
        crushedCount: 0,
      },
      {
        id: 3,
        col: 9,
        row: 8,
        x: 9 * CELL_W + CELL_W / 2,
        y: TOP_OFFSET + 8 * CELL_H + CELL_H / 2,
        state: 'idle',
        wobbleTimer: 0,
        vy: 0,
        crushedCount: 0,
      },
      {
        id: 4,
        col: 17,
        row: 8,
        x: 17 * CELL_W + CELL_W / 2,
        y: TOP_OFFSET + 8 * CELL_H + CELL_H / 2,
        state: 'idle',
        wobbleTimer: 0,
        vy: 0,
        crushedCount: 0,
      },
    ];
    bouldersRef.current = rocks;
    rocksFallenCountRef.current = 0;
    vegetableRef.current = null;

    // 3. Spawn Enemies based on Round
    const enemyList: Enemy[] = [];
    let enemyId = 1;

    // Pooka 1 (Top-Right)
    enemyList.push({
      id: enemyId++,
      type: 'pooka',
      x: 18 * CELL_W + CELL_W / 2,
      y: TOP_OFFSET + 2 * CELL_H + CELL_H / 2,
      dir: 'left',
      targetDir: 'left',
      speed: 1.6 + targetRound * 0.15,
      isGhost: false,
      ghostTimer: 0,
      pumpStage: 0,
      pumpTimer: 0,
      fireState: 'none',
      fireTimer: 0,
      fireLength: 0,
      fireDir: 'left',
      isEscaping: false,
      isDead: false,
      deathAnimTimer: 0,
    });

    // Fygar 1 (Left-Middle)
    enemyList.push({
      id: enemyId++,
      type: 'fygar',
      x: 5 * CELL_W + CELL_W / 2,
      y: TOP_OFFSET + 5 * CELL_H + CELL_H / 2,
      dir: 'right',
      targetDir: 'right',
      speed: 1.5 + targetRound * 0.12,
      isGhost: false,
      ghostTimer: 0,
      pumpStage: 0,
      pumpTimer: 0,
      fireState: 'none',
      fireTimer: 180,
      fireLength: 0,
      fireDir: 'right',
      isEscaping: false,
      isDead: false,
      deathAnimTimer: 0,
    });

    // Pooka 2 (Bottom-Left)
    enemyList.push({
      id: enemyId++,
      type: 'pooka',
      x: 6 * CELL_W + CELL_W / 2,
      y: TOP_OFFSET + 10 * CELL_H + CELL_H / 2,
      dir: 'right',
      targetDir: 'right',
      speed: 1.6 + targetRound * 0.15,
      isGhost: false,
      ghostTimer: 0,
      pumpStage: 0,
      pumpTimer: 0,
      fireState: 'none',
      fireTimer: 0,
      fireLength: 0,
      fireDir: 'right',
      isEscaping: false,
      isDead: false,
      deathAnimTimer: 0,
    });

    // Fygar 2 (Bottom-Right)
    enemyList.push({
      id: enemyId++,
      type: 'fygar',
      x: 18 * CELL_W + CELL_W / 2,
      y: TOP_OFFSET + 9 * CELL_H + CELL_H / 2,
      dir: 'left',
      targetDir: 'left',
      speed: 1.5 + targetRound * 0.12,
      isGhost: false,
      ghostTimer: 0,
      pumpStage: 0,
      pumpTimer: 0,
      fireState: 'none',
      fireTimer: 240,
      fireLength: 0,
      fireDir: 'left',
      isEscaping: false,
      isDead: false,
      deathAnimTimer: 0,
    });

    // If higher round, add more Pookas
    if (targetRound >= 2) {
      enemyList.push({
        id: enemyId++,
        type: 'pooka',
        x: 16 * CELL_W + CELL_W / 2,
        y: TOP_OFFSET + 9 * CELL_H + CELL_H / 2,
        dir: 'left',
        targetDir: 'left',
        speed: 1.8,
        isGhost: false,
        ghostTimer: 0,
        pumpStage: 0,
        pumpTimer: 0,
        fireState: 'none',
        fireTimer: 0,
        fireLength: 0,
        fireDir: 'left',
        isEscaping: false,
        isDead: false,
        deathAnimTimer: 0,
      });
    }

    enemiesRef.current = enemyList;
    particlesRef.current = [];
    floatersRef.current = [];
    setGameState('playing');
  }, []);

  // Sync references
  useEffect(() => {
    scoreRef.current = score;
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('acegames_digdug_highscore', score.toString());
      } catch {}
    }
  }, [score, highScore]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Carve dirt at world coordinates
  const carveDirtAt = (x: number, y: number, radius = 16) => {
    const grid = gridRef.current;
    if (!grid.length) return false;

    let carvedAny = false;
    const minCol = Math.max(0, Math.floor((x - radius) / CELL_W));
    const maxCol = Math.min(GRID_COLS - 1, Math.floor((x + radius) / CELL_W));
    const minRow = Math.max(0, Math.floor((y - radius - TOP_OFFSET) / CELL_H));
    const maxRow = Math.min(GRID_ROWS - 1, Math.floor((y + radius - TOP_OFFSET) / CELL_H));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (grid[r] && grid[r][c]) {
          grid[r][c] = false;
          carvedAny = true;
        }
      }
    }
    return carvedAny;
  };

  // Add floating points text
  const addFloater = (x: number, y: number, text: string, color = '#facc15') => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      life: 45,
    });
  };

  // Spawn explosion / dirt particles
  const spawnParticles = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 25 + Math.random() * 15,
        maxLife: 40,
      });
    }
  };

  // Handle Player Death
  const killPlayer = () => {
    const p = playerRef.current;
    if (p.isDead || gameStateRef.current !== 'playing') return;

    p.isDead = true;
    p.deathTimer = 60;
    p.pumpActive = false;
    p.hookedEnemyId = null;
    soundManager.playDigDugDeath();

    spawnParticles(p.x, p.y, '#f8fafc', 20);
    spawnParticles(p.x, p.y, '#3b82f6', 15);
  };

  // Initial mount
  useEffect(() => {
    initRound(1);
  }, [initRound]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') keysRef.current.up = true;
      if (e.code === 'ArrowDown' || e.key.toLowerCase() === 's') keysRef.current.down = true;
      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') keysRef.current.right = true;

      // Pump key (Space or K)
      if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
        if (!keysRef.current.pump) {
          keysRef.current.pump = true;
          handlePumpPress();
        }
      }

      if (e.key.toLowerCase() === 'p') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }

      if (e.key.toLowerCase() === 'r') {
        initRound(roundRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') keysRef.current.up = false;
      if (e.code === 'ArrowDown' || e.key.toLowerCase() === 's') keysRef.current.down = false;
      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') keysRef.current.right = false;
      if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
        keysRef.current.pump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Trigger Pump action
  const handlePumpPress = () => {
    const p = playerRef.current;
    if (p.isDead || gameStateRef.current !== 'playing') return;

    soundManager.playDigDugPump();

    // If already hooked to an enemy, pump more air!
    if (p.hookedEnemyId !== null) {
      const target = enemiesRef.current.find((en) => en.id === p.hookedEnemyId && !en.isDead);
      if (target) {
        target.pumpStage = Math.min(4, target.pumpStage + 1);
        target.pumpTimer = 60; // reset deflate timer

        // Check if popped!
        if (target.pumpStage >= 4) {
          target.isDead = true;
          target.deathAnimTimer = 30;
          soundManager.playDigDugPop();

          // Calculate score based on depth (rows 0-13)
          const depthRow = Math.floor((target.y - TOP_OFFSET) / CELL_H);
          let basePoints = 200;
          if (depthRow >= 4 && depthRow < 7) basePoints = 300;
          else if (depthRow >= 7 && depthRow < 10) basePoints = 400;
          else if (depthRow >= 10) basePoints = 500;

          // Fygar horizontal kill double points!
          if (target.type === 'fygar' && (p.dir === 'left' || p.dir === 'right')) {
            basePoints *= 2;
          }

          setScore((s) => s + basePoints);
          addFloater(target.x, target.y - 10, `+${basePoints}`);
          spawnParticles(target.x, target.y, target.type === 'pooka' ? '#ef4444' : '#10b981', 25);

          p.pumpActive = false;
          p.hookedEnemyId = null;
        }
      } else {
        p.pumpActive = false;
        p.hookedEnemyId = null;
      }
    } else {
      // Fire harpoon wire forward
      p.pumpActive = true;
      p.pumpLength = 0;
    }
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;

    const updateGame = () => {
      if (gameStateRef.current !== 'playing') return;

      const p = playerRef.current;
      const keys = keysRef.current;
      const grid = gridRef.current;

      // 1. UPDATE PLAYER
      if (p.isDead) {
        p.deathTimer--;
        if (p.deathTimer <= 0) {
          if (livesRef.current > 1) {
            setLives((l) => l - 1);
            // Respawn player in starting chamber
            p.x = 12 * CELL_W;
            p.y = TOP_OFFSET + 6 * CELL_H;
            p.isDead = false;
            p.dir = 'right';
            p.moving = false;
            p.pumpActive = false;
            p.hookedEnemyId = null;
          } else {
            setLives(0);
            setGameState('game_over');
            soundManager.playDefeat();
          }
        }
      } else {
        // Player Movement
        let dx = 0;
        let dy = 0;
        if (keys.left) {
          dx -= p.speed;
          p.dir = 'left';
        } else if (keys.right) {
          dx += p.speed;
          p.dir = 'right';
        } else if (keys.up) {
          dy -= p.speed;
          p.dir = 'up';
        } else if (keys.down) {
          dy += p.speed;
          p.dir = 'down';
        }

        p.moving = dx !== 0 || dy !== 0;

        if (p.moving) {
          // If moving while hooked, disconnect wire
          if (p.hookedEnemyId !== null) {
            p.hookedEnemyId = null;
            p.pumpActive = false;
          }

          // Move player within screen boundaries
          const nextX = Math.max(16, Math.min(CANVAS_WIDTH - 16, p.x + dx));
          const nextY = Math.max(TOP_OFFSET - 8, Math.min(CANVAS_HEIGHT - 16, p.y + dy));

          p.x = nextX;
          p.y = nextY;
          p.digAnim += 0.2;

          // Carve dirt as Dig Dug walks
          if (nextY >= TOP_OFFSET) {
            const carved = carveDirtAt(p.x, p.y, 16);
            if (carved) {
              // Digging dirt particles
              if (Math.random() < 0.3) {
                spawnParticles(p.x, p.y, '#eab308', 2);
              }
            }
          }

          // Walking audio
          p.stepAudioCooldown--;
          if (p.stepAudioCooldown <= 0) {
            soundManager.playDigDugStep();
            p.stepAudioCooldown = 12; // rhythm
          }
        } else {
          p.stepAudioCooldown = 0;
        }

        // Harpoon Wire Extension
        if (p.pumpActive && p.hookedEnemyId === null) {
          p.pumpLength += 6;
          if (p.pumpLength > p.pumpMax) {
            p.pumpActive = false;
            p.pumpLength = 0;
          } else {
            // Check collision between harpoon tip and enemies
            let tipX = p.x;
            let tipY = p.y;
            if (p.dir === 'left') tipX -= p.pumpLength;
            if (p.dir === 'right') tipX += p.pumpLength;
            if (p.dir === 'up') tipY -= p.pumpLength;
            if (p.dir === 'down') tipY += p.pumpLength;

            for (const en of enemiesRef.current) {
              if (en.isDead) continue;
              const dist = Math.hypot(tipX - en.x, tipY - en.y);
              if (dist < 22) {
                // Hook enemy!
                p.hookedEnemyId = en.id;
                en.pumpStage = Math.max(1, en.pumpStage + 1);
                en.pumpTimer = 60;
                en.isGhost = false; // forced into physical form
                break;
              }
            }
          }
        }
      }

      // 2. UPDATE BOULDERS (ROCKS)
      for (const rock of bouldersRef.current) {
        if (rock.state === 'broken') continue;

        // Check if dirt directly beneath boulder is cleared
        const checkRow = rock.row + 1;
        const col = rock.col;
        const isDirtBelow = checkRow < GRID_ROWS && grid[checkRow] && grid[checkRow][col];

        if (rock.state === 'idle') {
          // If no dirt below, start wobbling!
          if (!isDirtBelow) {
            rock.state = 'wobble';
            rock.wobbleTimer = 45; // ~0.75s wobble
          }
        } else if (rock.state === 'wobble') {
          rock.wobbleTimer--;
          if (rock.wobbleTimer <= 0) {
            rock.state = 'falling';
            rock.vy = 4.5;
            soundManager.playDigDugRockDrop();
          }
        } else if (rock.state === 'falling') {
          rock.y += rock.vy;
          rock.vy = Math.min(8.5, rock.vy + 0.3);

          // Boulder crushes enemies!
          for (const en of enemiesRef.current) {
            if (en.isDead) continue;
            if (Math.hypot(rock.x - en.x, rock.y - en.y) < 24) {
              en.isDead = true;
              en.deathAnimTimer = 30;
              rock.crushedCount++;
              soundManager.playDigDugPop();
              spawnParticles(en.x, en.y, '#ef4444', 20);

              const pts = rock.crushedCount === 1 ? 1000 : rock.crushedCount === 2 ? 2500 : 4000;
              setScore((s) => s + pts);
              addFloater(en.x, en.y - 12, `+${pts}`, '#38bdf8');
            }
          }

          // Boulder crushes player!
          if (!p.isDead && Math.hypot(rock.x - p.x, rock.y - p.y) < 22) {
            killPlayer();
          }

          // Check if rock reaches bottom or solid dirt
          const currentGridRow = Math.floor((rock.y + 14 - TOP_OFFSET) / CELL_H);
          if (
            rock.y + 16 >= CANVAS_HEIGHT ||
            (currentGridRow < GRID_ROWS && currentGridRow >= 0 && grid[currentGridRow][col])
          ) {
            rock.state = 'broken';
            soundManager.playDigDugRockBreak();
            spawnParticles(rock.x, rock.y, '#64748b', 24);

            rocksFallenCountRef.current++;

            // If 2 rocks have fallen, spawn bonus fruit in center!
            if (rocksFallenCountRef.current === 2 && !vegetableRef.current) {
              const tierIndex = Math.min(roundRef.current - 1, VEGETABLE_TIERS.length - 1);
              const tier = VEGETABLE_TIERS[tierIndex];
              vegetableRef.current = {
                active: true,
                x: 12 * CELL_W,
                y: TOP_OFFSET + 6 * CELL_H,
                name: tier.name,
                points: tier.points,
                icon: tier.icon,
                timer: 600, // 10 seconds
              };
            }
          }
        }
      }

      // 3. UPDATE VEGETABLE BONUS
      if (vegetableRef.current && vegetableRef.current.active) {
        const veg = vegetableRef.current;
        veg.timer--;
        if (veg.timer <= 0) {
          veg.active = false;
        } else if (!p.isDead && Math.hypot(p.x - veg.x, p.y - veg.y) < 24) {
          // Player eats bonus fruit!
          veg.active = false;
          setScore((s) => s + veg.points);
          soundManager.playDigDugBonus();
          addFloater(veg.x, veg.y - 14, `+${veg.points}`, '#ec4899');
          spawnParticles(veg.x, veg.y, '#f59e0b', 18);
        }
      }

      // 4. UPDATE ENEMIES
      const aliveEnemies = enemiesRef.current.filter((en) => !en.isDead);

      // Check if last enemy should flee to surface
      if (aliveEnemies.length === 1 && !aliveEnemies[0].isEscaping) {
        aliveEnemies[0].isEscaping = true;
      }

      for (const en of enemiesRef.current) {
        if (en.isDead) continue;

        // If currently hooked/inflated, handle deflate cooldown
        if (en.pumpStage > 0) {
          en.pumpTimer--;
          if (en.pumpTimer <= 0) {
            en.pumpStage--;
            en.pumpTimer = 40;
            // If deflated to 0, completely unhook
            if (en.pumpStage === 0 && p.hookedEnemyId === en.id) {
              p.hookedEnemyId = null;
              p.pumpActive = false;
            }
          }
          // Enemy is immobilized while inflated!
          continue;
        }

        // Fygar Fire Breathing
        if (en.type === 'fygar') {
          en.fireTimer--;
          if (en.fireTimer <= 0 && en.fireState === 'none') {
            en.fireState = 'warning';
            en.fireTimer = 40; // 0.6s warning flash
            en.fireDir = en.dir === 'left' || en.dir === 'right' ? en.dir : 'left';
          } else if (en.fireState === 'warning' && en.fireTimer <= 0) {
            en.fireState = 'breathing';
            en.fireTimer = 50; // 0.8s fire burst
            en.fireLength = 0;
            soundManager.playDigDugFire();
          } else if (en.fireState === 'breathing') {
            en.fireLength = Math.min(CELL_W * 2.8, en.fireLength + 5);

            // Check if fire touches player!
            if (!p.isDead) {
              const fx = en.fireDir === 'left' ? en.x - en.fireLength : en.x;
              const fw = en.fireLength;
              if (
                p.x >= fx &&
                p.x <= fx + fw &&
                Math.abs(p.y - en.y) < 18
              ) {
                killPlayer();
              }
            }

            if (en.fireTimer <= 0) {
              en.fireState = 'none';
              en.fireTimer = 220 + Math.random() * 120;
            }
          }

          if (en.fireState !== 'none') {
            // Cannot move while breathing fire
            continue;
          }
        }

        // Escaping Enemy logic: moves to top-left surface
        if (en.isEscaping) {
          en.isGhost = true; // ghost through to surface
          const targetX = 20;
          const targetY = TOP_OFFSET - 10;
          const angle = Math.atan2(targetY - en.y, targetX - en.x);
          en.x += Math.cos(angle) * (en.speed * 1.1);
          en.y += Math.sin(angle) * (en.speed * 1.1);

          // Escaped off-screen!
          if (en.x <= 25 && en.y <= TOP_OFFSET) {
            en.isDead = true;
          }
          continue;
        }

        // Ghost Mode toggle (pass through solid dirt toward player)
        en.ghostTimer++;
        if (!en.isGhost && en.ghostTimer > 280) {
          en.isGhost = true;
          en.ghostTimer = 0;
        } else if (en.isGhost && en.ghostTimer > 180) {
          // Check if in open tunnel to re-materialize
          const currR = Math.floor((en.y - TOP_OFFSET) / CELL_H);
          const currC = Math.floor(en.x / CELL_W);
          if (currR >= 0 && currR < GRID_ROWS && currC >= 0 && currC < GRID_COLS) {
            if (!grid[currR][currC]) {
              en.isGhost = false;
              en.ghostTimer = 0;
            }
          }
        }

        if (en.isGhost) {
          // Glide directly toward player
          const angle = Math.atan2(p.y - en.y, p.x - en.x);
          en.x += Math.cos(angle) * (en.speed * 0.75);
          en.y += Math.sin(angle) * (en.speed * 0.75);
        } else {
          // Move inside tunnels
          let moveX = 0;
          let moveY = 0;
          if (en.dir === 'left') moveX = -en.speed;
          if (en.dir === 'right') moveX = en.speed;
          if (en.dir === 'up') moveY = -en.speed;
          if (en.dir === 'down') moveY = en.speed;

          const nextX = en.x + moveX;
          const nextY = en.y + moveY;
          const nextR = Math.floor((nextY - TOP_OFFSET) / CELL_H);
          const nextC = Math.floor(nextX / CELL_W);

          // If next cell is solid dirt or wall, change direction
          const canMove =
            nextR >= 0 &&
            nextR < GRID_ROWS &&
            nextC >= 0 &&
            nextC < GRID_COLS &&
            !grid[nextR][nextC];

          if (canMove) {
            en.x = nextX;
            en.y = nextY;
          } else {
            // Pick a new open direction
            const dirs: Direction[] = ['left', 'right', 'up', 'down'];
            const openDirs = dirs.filter((d) => {
              let testR = Math.floor((en.y - TOP_OFFSET) / CELL_H);
              let testC = Math.floor(en.x / CELL_W);
              if (d === 'left') testC--;
              if (d === 'right') testC++;
              if (d === 'up') testR--;
              if (d === 'down') testR++;
              return (
                testR >= 0 &&
                testR < GRID_ROWS &&
                testC >= 0 &&
                testC < GRID_COLS &&
                !grid[testR][testC]
              );
            });

            if (openDirs.length > 0) {
              en.dir = openDirs[Math.floor(Math.random() * openDirs.length)];
            } else {
              // Trapped: turn into ghost immediately
              en.isGhost = true;
              en.ghostTimer = 0;
            }
          }
        }

        // Enemy touches player -> Player dies!
        if (!p.isDead && !en.isGhost && en.pumpStage === 0) {
          if (Math.hypot(p.x - en.x, p.y - en.y) < 20) {
            killPlayer();
          }
        }
      }

      // 5. CHECK ROUND CLEAR
      const remainingEnemies = enemiesRef.current.filter((en) => !en.isDead);
      if (remainingEnemies.length === 0 && !p.isDead) {
        setGameState('round_clear');
        soundManager.playDigDugRoundClear();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          setRound((r) => r + 1);
          initRound(roundRef.current + 1);
        }, 2500);
      }

      // 6. UPDATE PARTICLES & FLOATERS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const fl = floatersRef.current[i];
        fl.y -= 0.6;
        fl.life--;
        if (fl.life <= 0) {
          floatersRef.current.splice(i, 1);
        }
      }
    };

    // Render Canvas
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle Retina / Hi-DPI scaling
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // A. Surface Sky (Top 0 - 60px)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, TOP_OFFSET);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, TOP_OFFSET);

      // Clouds in sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(140, 24, 14, 0, Math.PI * 2);
      ctx.arc(155, 18, 18, 0, Math.PI * 2);
      ctx.arc(172, 24, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(740, 26, 12, 0, Math.PI * 2);
      ctx.arc(755, 20, 16, 0, Math.PI * 2);
      ctx.arc(770, 26, 12, 0, Math.PI * 2);
      ctx.fill();

      // Surface Round Flowers Garden (Indicates current round)
      const currentR = roundRef.current;
      for (let f = 0; f < Math.min(10, currentR); f++) {
        const fx = 820 + f * 13;
        const fy = TOP_OFFSET - 8;
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(fx - 1, fy, 2, 8);
        ctx.fillStyle = f === 0 ? '#f43f5e' : '#facc15';
        ctx.beginPath();
        ctx.arc(fx, fy - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Green Grass Surface line
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, TOP_OFFSET - 5, CANVAS_WIDTH, 5);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, TOP_OFFSET, CANVAS_WIDTH, 3);

      // B. Hollow Tunnels Background (Black / Deep Navy)
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, TOP_OFFSET, CANVAS_WIDTH, DIRT_HEIGHT);

      // C. Draw Dirt Grid
      const grid = gridRef.current;
      for (let r = 0; r < GRID_ROWS; r++) {
        // Strata Color based on depth
        let dirtColor = '#ca8a04'; // Sandy yellow (rows 0-3)
        let dirtStroke = '#a16207';
        if (r >= 4 && r < 7) {
          dirtColor = '#92400e'; // Rich brown (rows 4-6)
          dirtStroke = '#78350f';
        } else if (r >= 7 && r < 10) {
          dirtColor = '#c2410c'; // Clay orange (rows 7-9)
          dirtStroke = '#9a3412';
        } else if (r >= 10) {
          dirtColor = '#881337'; // Crimson bedrock (rows 10-13)
          dirtStroke = '#4c0519';
        }

        const y = TOP_OFFSET + r * CELL_H;

        for (let c = 0; c < GRID_COLS; c++) {
          if (grid[r] && grid[r][c]) {
            const x = c * CELL_W;
            ctx.fillStyle = dirtColor;
            ctx.fillRect(x, y, CELL_W + 0.5, CELL_H + 0.5);

            // Subtle soil texture dots
            ctx.fillStyle = dirtStroke;
            if ((r + c) % 3 === 0) {
              ctx.fillRect(x + 8, y + 8, 3, 3);
              ctx.fillRect(x + 24, y + 20, 3, 3);
            }
          }
        }
      }

      // D. Draw Bonus Vegetable
      if (vegetableRef.current && vegetableRef.current.active) {
        const veg = vegetableRef.current;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(veg.icon, veg.x, veg.y);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#fde047';
        ctx.fillText(`${veg.points}`, veg.x, veg.y + 18);
      }

      // E. Draw Boulders (Rocks)
      for (const rock of bouldersRef.current) {
        if (rock.state === 'broken') continue;

        let rx = rock.x;
        let ry = rock.y;
        if (rock.state === 'wobble') {
          rx += (Math.random() - 0.5) * 4;
        }

        // Draw Granite Rock
        ctx.save();
        ctx.translate(rx, ry);

        const rGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
        rGrad.addColorStop(0, '#94a3b8');
        rGrad.addColorStop(0.7, '#64748b');
        rGrad.addColorStop(1, '#334155');

        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cracks
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-5, 6);
        ctx.moveTo(3, -7);
        ctx.lineTo(6, 1);
        ctx.stroke();

        ctx.restore();
      }

      // F. Draw Harpoon Wire (if active)
      const p = playerRef.current;
      if (p.pumpActive && !p.isDead) {
        let endX = p.x;
        let endY = p.y;
        if (p.dir === 'left') endX -= p.pumpLength;
        if (p.dir === 'right') endX += p.pumpLength;
        if (p.dir === 'up') endY -= p.pumpLength;
        if (p.dir === 'down') endY += p.pumpLength;

        // If hooked to enemy, lock wire to enemy position
        if (p.hookedEnemyId !== null) {
          const hooked = enemiesRef.current.find((en) => en.id === p.hookedEnemyId);
          if (hooked) {
            endX = hooked.x;
            endY = hooked.y;
          }
        }

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wire harpoon tip
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // G. Draw Enemies (Pooka & Fygar)
      for (const en of enemiesRef.current) {
        if (en.isDead) continue;

        ctx.save();
        ctx.translate(en.x, en.y);

        if (en.isGhost) {
          // GHOST FORM: Floating yellow goggles
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.ellipse(-5, 0, 7, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(5, 0, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Black pupils
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-5, 0, 2.5, 0, Math.PI * 2);
          ctx.arc(5, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Scale size based on pump stage (0: normal, 1: 1.25x, 2: 1.55x, 3: 1.9x)
          const scale = 1 + en.pumpStage * 0.28;
          ctx.scale(scale, scale);

          if (en.type === 'pooka') {
            // POOKA: Red ball with yellow goggles
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, 0, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b91c1c';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Yellow goggles
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.ellipse(-4, -2, 5, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(4, -2, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Pupils
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-4, -2, 2, 0, Math.PI * 2);
            ctx.arc(4, -2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Cute yellow feet
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-8, 11, 4, 3);
            ctx.fillRect(4, 11, 4, 3);
          } else {
            // FYGAR: Green dragon
            const flip = en.dir === 'left' ? -1 : 1;
            ctx.scale(flip, 1);

            // Body
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#047857';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Dragon head & eye
            ctx.beginPath();
            ctx.arc(8, -3, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(10, -5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(10, -5, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Orange wing
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-2, -6);
            ctx.lineTo(4, -14);
            ctx.lineTo(8, -5);
            ctx.closePath();
            ctx.fill();

            // Warning flash before breathing fire
            if (en.fireState === 'warning') {
              ctx.fillStyle = Math.floor(Date.now() / 80) % 2 === 0 ? '#facc15' : '#ef4444';
              ctx.beginPath();
              ctx.arc(14, -2, 4, 0, Math.PI * 2);
              ctx.fill();
            }

            // Fire Breath Blast
            if (en.fireState === 'breathing') {
              const fLen = en.fireLength;
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.moveTo(14, -4);
              ctx.lineTo(14 + fLen, -10);
              ctx.lineTo(14 + fLen + 10, -2);
              ctx.lineTo(14 + fLen, 6);
              ctx.lineTo(14, 2);
              ctx.closePath();
              ctx.fill();

              // Inner red core
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(14, -2);
              ctx.lineTo(14 + fLen * 0.7, -5);
              ctx.lineTo(14 + fLen * 0.75, -2);
              ctx.lineTo(14 + fLen * 0.7, 3);
              ctx.lineTo(14, 1);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        ctx.restore();
      }

      // H. Draw Dig Dug (Hero)
      if (!p.isDead) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Direction flip
        if (p.dir === 'left') {
          ctx.scale(-1, 1);
        }

        // White Suit Body
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-8, -8, 16, 16);

        // Blue Helmet
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(0, -11, 8, 0, Math.PI * 2);
        ctx.fill();

        // Red Visor / Goggles
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-2, -14, 9, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -13, 5, 2);

        // Red Backpack Pump Box
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(-12, -7, 4, 12);

        // Digging Boots
        ctx.fillStyle = '#1e3a8a';
        const legOffset = p.moving ? Math.sin(p.digAnim * 4) * 3 : 0;
        ctx.fillRect(-7, 8 + legOffset, 6, 4);
        ctx.fillRect(2, 8 - legOffset, 6, 4);

        // Hand holding pump nozzle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(8, -1, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // I. Draw Particles
      for (const pt of particlesRef.current) {
        const alpha = pt.life / pt.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // J. Draw Floating Score Text
      for (const fl of floatersRef.current) {
        ctx.save();
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = fl.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      }
    };

    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const dt = currentTime - lastTime;
      if (dt >= 1000 / 65) {
        lastTime = currentTime;
        updateGame();
        render();
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [initRound]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none">
      {/* Top HUD Bar */}
      <div className="game-top-hud relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Left: Restart & Pause + Round Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => initRound(round)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Chơi lại vòng này (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev))
            }
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Tạm dừng (P)"
          >
            {gameState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-bold text-amber-400">
            <span>VÒNG {round}</span>
          </div>
        </div>

        {/* Center: Score & High Score */}
        <div className="flex items-center gap-3 sm:gap-6 font-mono font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] sm:text-xs">ĐIỂM:</span>
            <span className="text-amber-300 text-sm sm:text-base">{score.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px] sm:text-xs">KỶ LỤC:</span>
            <span className="text-yellow-400 text-sm sm:text-base">{highScore.toLocaleString()}</span>
          </div>

          {/* Bonus Fruit Indicator */}
          {vegetableRef.current && vegetableRef.current.active && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse text-xs">
              <span>{vegetableRef.current.icon}</span>
              <span>+{vegetableRef.current.points}</span>
            </div>
          )}
        </div>

        {/* Right: Lives indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] sm:text-xs mr-1 hidden sm:inline">MẠNG:</span>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all ${
                idx < lives ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50' : 'bg-slate-800 text-slate-600'
              }`}
            >
              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Box */}
      <div className="game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-185px)] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center flex-1 min-h-0">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Overlay: Paused */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl max-w-sm">
              <span className="text-4xl mb-3">⏸️</span>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">ĐÃ TẠM DỪNG</h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6">
                Nhấn Tiếp tục hoặc bấm phím P để quay lại cuộc đào hầm!
              </p>
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 transition-all"
              >
                Tiếp Tục Chơi
              </button>
            </div>
          </div>
        )}

        {/* Overlay: Game Over */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <div className="bg-slate-900/95 border border-rose-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl max-w-md animate-in fade-in zoom-in-95 duration-200">
              <span className="text-5xl mb-3">💥</span>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-500 mb-1">GAME OVER</h2>
              <p className="text-slate-300 text-xs sm:text-sm mb-4">
                Chàng thợ đào Dig Dug đã cạn sạch mạng!
              </p>

              <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-white/5 mb-6 flex justify-around font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">TỔNG ĐIỂM</div>
                  <div className="text-amber-400 text-lg font-bold">{score.toLocaleString()}</div>
                </div>
                <div className="border-r border-white/10" />
                <div>
                  <div className="text-slate-400 text-[10px]">VÒNG ĐẠT ĐƯỢC</div>
                  <div className="text-sky-400 text-lg font-bold">{round}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setScore(0);
                  setLives(3);
                  setRound(1);
                  initRound(1);
                }}
                className="w-full py-2.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 shadow-lg shadow-rose-500/25 transition-all"
              >
                Chơi Lại Từ Đầu
              </button>
            </div>
          </div>
        )}

        {/* Overlay: Round Clear */}
        {gameState === 'round_clear' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-90 duration-300">
              <span className="text-5xl mb-2">🎉</span>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">XÓA SỔ TOÀN BỘ QUÁI!</h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Chuẩn bị tiến vào Vòng {round + 1}...
              </p>
            </div>
          </div>
        )}

        {/* Mobile On-Screen D-Pad & Action Buttons */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex flex-col justify-end p-3 z-10">
          <div className="flex items-end justify-between w-full">
            {/* D-Pad Left */}
            <div className="pointer-events-auto grid grid-cols-3 gap-1 w-32 h-32 bg-slate-900/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10">
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.up = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.up = false;
                }}
                className="bg-white/10 active:bg-amber-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.left = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.left = false;
                }}
                className="bg-white/10 active:bg-amber-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center text-[10px] text-slate-500">⛏️</div>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.right = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.right = false;
                }}
                className="bg-white/10 active:bg-amber-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.down = true;
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.down = false;
                }}
                className="bg-white/10 active:bg-amber-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            {/* Action Pump Button Right */}
            <div className="pointer-events-auto flex flex-col items-center gap-2">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handlePumpPress();
                }}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black text-sm active:scale-95 shadow-lg shadow-rose-500/40 flex flex-col items-center justify-center border-2 border-white/20"
              >
                <span className="text-xl">💨</span>
                <span className="text-[11px] tracking-wider">BƠM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
