import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  ArrowLeft, 
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import { soundManager } from '../utils/sound';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sân khấu chính 760x540px, Sidebar thông số bên phải 200px
const ARENA_WIDTH = 760;
const ARENA_HEIGHT = 540;
const SIDEBAR_X = ARENA_WIDTH;
const SIDEBAR_WIDTH = CANVAS_WIDTH - ARENA_WIDTH;

type MarioForm = 'small' | 'super' | 'fire';

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
  rotation?: number;
  vRot?: number;
  isBrickPiece?: boolean;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

interface Block {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'question' | 'empty' | 'pipe' | 'hard_block';
  content?: 'coin' | 'mushroom' | 'fireflower' | 'star' | '1up';
  isHit?: boolean;
  hitOffsetY?: number;
  coinsLeft?: number;
}

interface Pipe {
  x: number;
  y: number;
  w: number;
  h: number;
  hasPiranha?: boolean;
  piranhaOffset?: number;
  piranhaDir?: number;
  piranhaTimer?: number;
  isWarp?: boolean;
}

interface Item {
  id: number;
  type: 'coin' | 'mushroom' | 'fireflower' | 'star' | '1up';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  emerging?: boolean;
  targetY?: number;
}

interface Enemy {
  id: number;
  type: 'goomba' | 'koopa' | 'piranha' | 'bowser';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  isStomped?: boolean;
  isShell?: boolean;
  shellSpeed?: number;
  facing: 'left' | 'right';
  animTimer: number;
  hp?: number;
  shootCooldown?: number;
}

interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAlive: boolean;
  isEnemy?: boolean;
}

export const GameMario: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trạng thái màn chơi
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'stage_clear' | 'game_over'>('start');
  const currentWorld = 1;
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_mario_highscore') || '15000', 10);
    } catch {
      return 15000;
    }
  });
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [marioForm, setMarioForm] = useState<MarioForm>('small');
  const [isStarInvincible, setIsStarInvincible] = useState<boolean>(false);

  // Refs độc lập cho game loop 60 FPS
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const coinsRef = useRef(coins);
  const livesRef = useRef(lives);
  const marioFormRef = useRef<MarioForm>('small');
  const isStarRef = useRef(false);
  const starTimerRef = useRef(0);
  const invulnerableTimerRef = useRef(0);
  const cameraXRef = useRef(0);
  const worldLengthRef = useRef(3800);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { marioFormRef.current = marioForm; }, [marioForm]);
  useEffect(() => { isStarRef.current = isStarInvincible; }, [isStarInvincible]);

  // Player Mario Ref
  const marioRef = useRef({
    x: 80,
    y: 360,
    w: 28,
    h: 38,
    vx: 0,
    vy: 0,
    isGrounded: false,
    facing: 'right' as 'left' | 'right',
    isCrouching: false,
    isSkidding: false,
    isRunning: false,
    isDead: false,
    deathVy: 0,
    animFrame: 0,
    animTimer: 0,
    isFlagpoleSliding: false,
    flagSlideY: 0,
    walkToCastle: false,
  });

  // World objects
  const blocksRef = useRef<Block[]>([]);
  const pipesRef = useRef<Pipe[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const fireballsRef = useRef<Fireball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const flagpoleRef = useRef({ x: 3400, y: 140, h: 280, flagY: 150 });
  const castleRef = useRef({ x: 3540, y: 260, w: 160, h: 160, hasFlag: false, castleFlagY: 260 });
  const axeRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const bridgeBlocksRef = useRef<Block[]>([]);

  // Key tracking
  const keysRef = useRef({
    left: false,
    right: false,
    down: false,
    up: false,
    jump: false,
    dash: false,
  });

  // Helper sinh hiệu ứng hạt
  const addParticles = (x: number, y: number, count: number, color: string, isBrick: boolean = false) => {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = isBrick ? Math.random() * 6 + 2 : Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (isBrick ? 4 : 2),
        radius: isBrick ? Math.random() * 4 + 4 : Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: isBrick ? 45 : 30,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 0.2,
        isBrickPiece: isBrick,
      });
    }
  };

  // Helper sinh chữ nổi bay lên (+100, +200, 1-UP)
  const addFloater = (x: number, y: number, text: string, color: string = '#fef08a') => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.6,
      life: 0,
    });
  };

  // Thêm điểm
  const addScore = useCallback((pts: number, x?: number, y?: number) => {
    scoreRef.current += pts;
    setScore(scoreRef.current);
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      try {
        localStorage.setItem('acegames_mario_highscore', scoreRef.current.toString());
      } catch {}
    }
    if (x !== undefined && y !== undefined) {
      addFloater(x, y, `+${pts}`);
    }
  }, [highScore]);

  // Nhặt xu vàng
  const addCoin = useCallback((x: number, y: number) => {
    coinsRef.current += 1;
    setCoins(coinsRef.current);
    soundManager.playMarioCoin();
    addScore(200, x, y);
    addParticles(x, y, 8, '#fef08a');

    // 100 Xu thưởng 1 Mạng
    if (coinsRef.current % 100 === 0) {
      livesRef.current += 1;
      setLives(livesRef.current);
      addFloater(x, y - 20, '1-UP!', '#4ade80');
      soundManager.playMarioPowerup();
    }
  }, [addScore]);

  // Xây dựng bản đồ cho từng Màn chơi
  const buildLevel = useCallback((stage: number) => {
    blocksRef.current = [];
    pipesRef.current = [];
    enemiesRef.current = [];
    itemsRef.current = [];
    fireballsRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];

    const groundY = 420;
    const levelLen = stage === 4 ? 3200 : 3600;
    worldLengthRef.current = levelLen;

    // 1. Tạo mặt đất liên tục kèm các khe hố (pits)
    let curX = 0;
    while (curX < levelLen) {
      // Khe hở (hố vực) ngẫu nhiên sau quãng đường
      const isPit = (stage === 1 && (curX >= 1100 && curX <= 1180 || curX >= 2100 && curX <= 2220)) ||
                    (stage === 2 && (curX >= 800 && curX <= 920 || curX >= 1800 && curX <= 1960)) ||
                    (stage === 3 && (curX >= 600 && curX <= 750 || curX >= 1400 && curX <= 1600 || curX >= 2400 && curX <= 2600)) ||
                    (stage === 4 && (curX >= 1200 && curX <= 1380 || curX >= 2200 && curX <= 2500));

      const segLen = isPit ? 100 : 200;
      if (!isPit) {
        // Tạo các ô đất 40x40
        for (let bx = curX; bx < curX + segLen; bx += 40) {
          blocksRef.current.push({
            id: Math.random(),
            x: bx,
            y: groundY,
            w: 40,
            h: 120,
            type: 'ground',
          });
        }
      }
      curX += segLen;
    }

    // 2. Tạo đường ống nước xanh (Pipes)
    if (stage !== 4) {
      const pipeLocs = [
        { x: 520, h: 60, hasPiranha: true },
        { x: 940, h: 80, hasPiranha: true },
        { x: 1400, h: 100, hasPiranha: true },
        { x: 2360, h: 70, hasPiranha: true },
        { x: 2800, h: 90, hasPiranha: true },
      ];
      pipeLocs.forEach(p => {
        pipesRef.current.push({
          x: p.x,
          y: groundY - p.h,
          w: 52,
          h: p.h,
          hasPiranha: p.hasPiranha,
          piranhaOffset: 0,
          piranhaDir: 1,
          piranhaTimer: Math.random() * 2,
        });
      });
    }

    // 3. Khối gạch & Khối Hỏi Chấm [?]
    const blockLayouts: Array<{ x: number; y: number; type: 'brick' | 'question'; content?: 'coin' | 'mushroom' | 'fireflower' | 'star' }> = [
      // Nhóm khối đầu tiên
      { x: 320, y: 300, type: 'question', content: 'coin' },
      { x: 360, y: 300, type: 'brick' },
      { x: 400, y: 300, type: 'question', content: 'mushroom' },
      { x: 440, y: 300, type: 'brick' },
      { x: 480, y: 300, type: 'question', content: 'coin' },

      // Cầu gạch trên cao
      { x: 680, y: 220, type: 'brick' },
      { x: 720, y: 220, type: 'question', content: 'star' },
      { x: 760, y: 220, type: 'brick' },
      { x: 800, y: 220, type: 'brick' },

      // Nhóm khối giữa màn
      { x: 1260, y: 300, type: 'brick' },
      { x: 1300, y: 300, type: 'question', content: 'fireflower' },
      { x: 1340, y: 300, type: 'brick' },

      // Dãy gạch vượt hố
      { x: 1600, y: 260, type: 'question', content: 'coin' },
      { x: 1640, y: 260, type: 'question', content: 'coin' },
      { x: 1680, y: 260, type: 'question', content: 'mushroom' },

      // Kim tự tháp bậc thang cuối màn
      { x: 2900, y: 380, type: 'hard_block' as any },
      { x: 2940, y: 380, type: 'hard_block' as any },
      { x: 2940, y: 340, type: 'hard_block' as any },
      { x: 2980, y: 380, type: 'hard_block' as any },
      { x: 2980, y: 340, type: 'hard_block' as any },
      { x: 2980, y: 300, type: 'hard_block' as any },
      { x: 3020, y: 380, type: 'hard_block' as any },
      { x: 3020, y: 340, type: 'hard_block' as any },
      { x: 3020, y: 300, type: 'hard_block' as any },
      { x: 3020, y: 260, type: 'hard_block' as any },
    ];

    blockLayouts.forEach(b => {
      blocksRef.current.push({
        id: Math.random(),
        x: b.x,
        y: b.y,
        w: 40,
        h: 40,
        type: b.type,
        content: b.content,
        coinsLeft: b.content === 'coin' ? 1 : undefined,
      });
    });

    // 4. Kẻ địch kinh điển (Goomba & Koopa)
    if (stage !== 4) {
      const enemySpawns = [
        { type: 'goomba' as const, x: 420 },
        { type: 'goomba' as const, x: 740 },
        { type: 'koopa' as const, x: 1040 },
        { type: 'goomba' as const, x: 1220 },
        { type: 'goomba' as const, x: 1280 },
        { type: 'koopa' as const, x: 1750 },
        { type: 'goomba' as const, x: 2200 },
        { type: 'koopa' as const, x: 2650 },
      ];
      enemySpawns.forEach(e => {
        enemiesRef.current.push({
          id: Math.random(),
          type: e.type,
          x: e.x,
          y: groundY - (e.type === 'koopa' ? 44 : 32),
          w: e.type === 'koopa' ? 30 : 32,
          h: e.type === 'koopa' ? 44 : 32,
          vx: -1.2,
          vy: 0,
          isAlive: true,
          facing: 'left',
          animTimer: 0,
        });
      });
    } else {
      // Màn 4: Bowser's Castle & Lava Bridge
      const bridgeStartX = 2300;
      const bridgeLen = 320;
      bridgeBlocksRef.current = [];
      for (let bx = bridgeStartX; bx < bridgeStartX + bridgeLen; bx += 40) {
        const blk: Block = {
          id: Math.random(),
          x: bx,
          y: groundY,
          w: 40,
          h: 30,
          type: 'brick',
        };
        blocksRef.current.push(blk);
        bridgeBlocksRef.current.push(blk);
      }

      // Rìu giật cầu ở cuối cầu
      axeRef.current = {
        x: bridgeStartX + bridgeLen + 20,
        y: groundY - 50,
        active: true,
      };

      // Đặt Boss Bowser canh giữ cầu
      enemiesRef.current.push({
        id: 999,
        type: 'bowser',
        x: bridgeStartX + 140,
        y: groundY - 80,
        w: 68,
        h: 76,
        vx: -0.6,
        vy: 0,
        isAlive: true,
        facing: 'left',
        animTimer: 0,
        hp: 5,
        shootCooldown: 2.0,
      });
    }

    // 5. Cột cờ và Lâu đài đích đến
    flagpoleRef.current = {
      x: levelLen - 300,
      y: groundY - 260,
      h: 260,
      flagY: groundY - 250,
    };
    castleRef.current = {
      x: levelLen - 160,
      y: groundY - 140,
      w: 140,
      h: 140,
      hasFlag: false,
      castleFlagY: groundY - 140,
    };

    // Reset vị trí Mario
    const isSuper = marioFormRef.current !== 'small';
    marioRef.current = {
      x: 80,
      y: groundY - (isSuper ? 58 : 38),
      w: 28,
      h: isSuper ? 58 : 38,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      isCrouching: false,
      isSkidding: false,
      isRunning: false,
      isDead: false,
      deathVy: 0,
      animFrame: 0,
      animTimer: 0,
      isFlagpoleSliding: false,
      flagSlideY: 0,
      walkToCastle: false,
    };

    cameraXRef.current = 0;
    setTimeLeft(300);
  }, []);

  // Khởi động ván chơi mới
  const startNewGame = useCallback((stageOverride?: number) => {
    let initLives = 3;
    let initStage = 1;
    let initForm: MarioForm = 'small';

    try {
      const saved = localStorage.getItem('ace_game_settings_mario');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.initialLives) initLives = parsed.initialLives;
        if (parsed.initialStage) initStage = parsed.initialStage;
        if (parsed.initialForm) initForm = parsed.initialForm;
      }
    } catch {}

    const targetStage = stageOverride !== undefined ? stageOverride : initStage;
    setCurrentStage(targetStage);
    setScore(0);
    setCoins(0);
    setLives(initLives);
    livesRef.current = initLives;
    setMarioForm(initForm);
    marioFormRef.current = initForm;
    setIsStarInvincible(false);
    invulnerableTimerRef.current = 0;
    setGameState('playing');
    buildLevel(targetStage);
  }, [buildLevel]);

  // Hồi sinh tại chỗ khi mất mạng
  const respawnMario = useCallback(() => {
    if (livesRef.current <= 1) {
      setGameState('game_over');
      soundManager.playDefeat();
      return;
    }
    livesRef.current -= 1;
    setLives(livesRef.current);
    setMarioForm('small');
    marioFormRef.current = 'small';
    setIsStarInvincible(false);
    invulnerableTimerRef.current = 2.5; // Bất tử 2.5 giây khi hồi sinh

    const groundY = 420;
    marioRef.current.x = Math.max(80, cameraXRef.current + 60);
    marioRef.current.y = groundY - 38;
    marioRef.current.vx = 0;
    marioRef.current.vy = 0;
    marioRef.current.isDead = false;
    marioRef.current.isGrounded = true;
  }, []);

  // Xử lý biến đổi hình dạng Mario
  const upgradeMario = (newForm: MarioForm) => {
    setMarioForm(newForm);
    marioFormRef.current = newForm;
    soundManager.playMarioPowerup();
    if (newForm !== 'small') {
      marioRef.current.h = 58;
      marioRef.current.y -= 20;
    }
    addFloater(marioRef.current.x, marioRef.current.y - 20, newForm === 'fire' ? 'FIRE MARIO!' : 'SUPER MARIO!', '#fbbf24');
  };

  const damageMario = () => {
    if (invulnerableTimerRef.current > 0 || isStarRef.current) return;

    if (marioFormRef.current === 'fire') {
      upgradeMario('super');
      invulnerableTimerRef.current = 2.0;
      soundManager.playMarioPowerdown();
    } else if (marioFormRef.current === 'super') {
      setMarioForm('small');
      marioFormRef.current = 'small';
      marioRef.current.h = 38;
      invulnerableTimerRef.current = 2.0;
      soundManager.playMarioPowerdown();
    } else {
      // Chết
      marioRef.current.isDead = true;
      marioRef.current.deathVy = -11;
      soundManager.playMarioDie();
      setTimeout(respawnMario, 2200);
    }
  };

  // Mario bắn cầu lửa (Fireball)
  const shootFireball = () => {
    if (marioFormRef.current !== 'fire' || marioRef.current.isDead) return;
    const activeFireballs = fireballsRef.current.filter(f => !f.isEnemy && f.isAlive).length;
    if (activeFireballs >= 2) return; // Tối đa 2 cầu lửa cùng lúc như nguyên bản

    soundManager.playMarioFireball();
    const isRight = marioRef.current.facing === 'right';
    fireballsRef.current.push({
      x: marioRef.current.x + (isRight ? marioRef.current.w + 4 : -10),
      y: marioRef.current.y + 20,
      vx: isRight ? 8.5 : -8.5,
      vy: 3,
      radius: 6,
      isAlive: true,
      isEnemy: false,
    });
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = true;
      }
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = true;
      }
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        if (!keysRef.current.jump && marioRef.current.isGrounded && !marioRef.current.isDead) {
          marioRef.current.vy = -13.5;
          marioRef.current.isGrounded = false;
          soundManager.playMarioJump(marioFormRef.current !== 'small');
          addParticles(marioRef.current.x + marioRef.current.w / 2, marioRef.current.y + marioRef.current.h, 4, '#cbd5e1');
        }
        keysRef.current.jump = true;
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.dash = true;
        shootFireball();
      }
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = false;
      }
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.up = false;
      }
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        keysRef.current.jump = false;
        // Cắt bớt lực nhảy nếu thả phím sớm (Variable Jump Height)
        if (marioRef.current.vy < -5) {
          marioRef.current.vy = -5;
        }
      }
      if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        keysRef.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS Game Engine Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const m = marioRef.current;

      // 1. UPDATE PHYSICS & LOGIC WHEN PLAYING
      if (gameStateRef.current === 'playing') {
        // Star Invincibility Timer
        if (isStarRef.current) {
          starTimerRef.current -= dt;
          if (starTimerRef.current <= 0) {
            setIsStarInvincible(false);
          }
        }
        if (invulnerableTimerRef.current > 0) {
          invulnerableTimerRef.current -= dt;
        }

        // Mario Death Physics
        if (m.isDead) {
          m.deathVy += 28 * dt;
          m.y += m.deathVy;
        } else if (m.isFlagpoleSliding) {
          // Slide down flagpole
          if (m.y < flagpoleRef.current.y + flagpoleRef.current.h - m.h) {
            m.y += 180 * dt;
          } else {
            m.isFlagpoleSliding = false;
            m.walkToCastle = true;
            m.facing = 'right';
          }
        } else if (m.walkToCastle) {
          // Mario tự động đi bộ vào lâu đài
          m.x += 120 * dt;
          m.animTimer += dt * 10;
          m.animFrame = Math.floor(m.animTimer) % 3;
          if (m.x >= castleRef.current.x + castleRef.current.w / 2 - m.w / 2) {
            m.walkToCastle = false;
            castleRef.current.hasFlag = true;
            setGameState('stage_clear');
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            soundManager.playMarioStageClear();
          }
        } else {
          // Di chuyển theo người chơi
          const maxSpeed = keysRef.current.dash ? 6.2 : 4.4;
          const accel = keysRef.current.dash ? 18 : 14;
          const friction = 12;

          m.isCrouching = keysRef.current.down && marioFormRef.current !== 'small';

          if (keysRef.current.left && !m.isCrouching) {
            m.vx = Math.max(m.vx - accel * dt, -maxSpeed);
            m.facing = 'left';
            m.isSkidding = m.vx > 0.8;
          } else if (keysRef.current.right && !m.isCrouching) {
            m.vx = Math.min(m.vx + accel * dt, maxSpeed);
            m.facing = 'right';
            m.isSkidding = m.vx < -0.8;
          } else {
            // Giảm tốc quán tính
            if (m.vx > 0) {
              m.vx = Math.max(0, m.vx - friction * dt);
            } else if (m.vx < 0) {
              m.vx = Math.min(0, m.vx + friction * dt);
            }
            m.isSkidding = false;
          }

          // Trọng lực rơi
          m.vy += 32 * dt;
          if (m.vy > 14) m.vy = 14;

          // Cập nhật vị trí X và kiểm tra va chạm
          m.x += m.vx;

          // Giới hạn Mario không đi lùi quá màn hình
          if (m.x < cameraXRef.current) {
            m.x = cameraXRef.current;
            m.vx = 0;
          }

          // Va chạm X với các khối gạch & ống nước
          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x && m.x < b.x + b.w && m.y + m.h > b.y && m.y < b.y + b.h) {
              if (m.vx > 0) {
                m.x = b.x - m.w;
                m.vx = 0;
              } else if (m.vx < 0) {
                m.x = b.x + b.w;
                m.vx = 0;
              }
            }
          });

          pipesRef.current.forEach(p => {
            if (m.x + m.w > p.x && m.x < p.x + p.w && m.y + m.h > p.y && m.y < p.y + p.h) {
              if (m.vx > 0) {
                m.x = p.x - m.w;
                m.vx = 0;
              } else if (m.vx < 0) {
                m.x = p.x + p.w;
                m.vx = 0;
              }
            }
          });

          // Cập nhật vị trí Y và kiểm tra va chạm
          m.y += m.vy;
          m.isGrounded = false;

          // Va chạm Y với các khối gạch
          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x + 3 && m.x < b.x + b.w - 3) {
              // Rơi xuống trên đầu khối
              if (m.vy >= 0 && m.y + m.h >= b.y && m.y + m.h <= b.y + 16) {
                m.y = b.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              }
              // Húc đầu từ dưới lên (Hit from below)
              else if (m.vy < 0 && m.y <= b.y + b.h && m.y >= b.y + b.h - 16) {
                m.y = b.y + b.h;
                m.vy = 2; // Nảy xuống
                b.isHit = true;
                b.hitOffsetY = -8;

                if (b.type === 'question') {
                  b.type = 'empty';
                  soundManager.playMarioBrick();
                  if (b.content === 'coin') {
                    addCoin(b.x + b.w / 2, b.y);
                  } else if (b.content === 'mushroom' || b.content === 'fireflower' || b.content === 'star') {
                    // Sinh vật phẩm nhô lên từ khối
                    itemsRef.current.push({
                      id: Math.random(),
                      type: b.content === 'mushroom' && marioFormRef.current !== 'small' ? 'fireflower' : b.content,
                      x: b.x + 4,
                      y: b.y - 28,
                      w: 32,
                      h: 32,
                      vx: 1.6,
                      vy: -3,
                      isAlive: true,
                    });
                    soundManager.playPowerup();
                  }
                } else if (b.type === 'brick') {
                  if (marioFormRef.current !== 'small') {
                    // Phá vỡ khối gạch thành 4 mảnh
                    b.y = 9999; // Xóa khối
                    soundManager.playMarioBrick();
                    addParticles(b.x + b.w / 2, b.y + b.h / 2, 8, '#b45309', true);
                    addScore(50);
                  } else {
                    soundManager.playMarioBrick();
                  }
                }
              }
            }
          });

          // Va chạm Y với đường ống nước
          pipesRef.current.forEach(p => {
            if (m.x + m.w > p.x + 2 && m.x < p.x + p.w - 2) {
              if (m.vy >= 0 && m.y + m.h >= p.y && m.y + m.h <= p.y + 16) {
                m.y = p.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              }
            }
          });

          // Rơi xuống vực sâu
          if (m.y > CANVAS_HEIGHT + 40) {
            damageMario();
          }

          // Kiểm tra chạm Cột Cờ Chiến Thắng
          const fp = flagpoleRef.current;
          if (m.x + m.w >= fp.x && m.x <= fp.x + 12 && m.y + m.h >= fp.y && m.y <= fp.y + fp.h) {
            m.isFlagpoleSliding = true;
            m.vx = 0;
            m.vy = 0;
            m.x = fp.x - 8;
            soundManager.playMarioFlag();
            const poleHeightRatio = Math.max(0, (fp.y + fp.h - m.y) / fp.h);
            const flagPts = Math.round(poleHeightRatio * 4000 + 400);
            addScore(flagPts, fp.x, m.y);
          }

          // Kiểm tra Rìu cắt cầu Boss (Màn 4)
          if (axeRef.current && axeRef.current.active) {
            const ax = axeRef.current;
            if (m.x + m.w >= ax.x && m.x <= ax.x + 30 && m.y + m.h >= ax.y && m.y <= ax.y + 40) {
              ax.active = false;
              // Rút sập toàn bộ cầu dung nham
              bridgeBlocksRef.current.forEach((blk, idx) => {
                setTimeout(() => {
                  blk.y = 9999;
                  soundManager.playMarioBrick();
                  addParticles(blk.x + 20, 420, 6, '#ea580c');
                }, idx * 80);
              });
              // Bowser rơi xuống dung nham
              const bowser = enemiesRef.current.find(e => e.type === 'bowser');
              if (bowser) {
                setTimeout(() => {
                  bowser.vy = 8;
                  soundManager.playMarioDie();
                  addScore(5000, bowser.x, bowser.y);
                  confetti({ particleCount: 100, spread: 80 });
                  setGameState('stage_clear');
                }, bridgeBlocksRef.current.length * 80 + 300);
              }
            }
          }

          // Animation Frames
          if (!m.isGrounded) {
            m.animFrame = 3; // Nhảy
          } else if (Math.abs(m.vx) > 0.2) {
            m.animTimer += dt * (Math.abs(m.vx) * 3);
            m.animFrame = Math.floor(m.animTimer) % 3; // 0, 1, 2 chạy
          } else {
            m.animFrame = 0; // Đứng yên
          }

          // Camera cuộn mượt theo Mario (Scroll horizontally)
          const targetCamX = m.x - ARENA_WIDTH * 0.38;
          if (targetCamX > cameraXRef.current) {
            cameraXRef.current = targetCamX;
          }
          if (cameraXRef.current > worldLengthRef.current - ARENA_WIDTH) {
            cameraXRef.current = worldLengthRef.current - ARENA_WIDTH;
          }
        }

        // 2. UPDATE ITEMS (Nấm, Hoa Lửa, Sao)
        itemsRef.current.forEach(item => {
          if (!item.isAlive) return;
          item.vy += 24 * dt;
          item.x += item.vx;
          item.y += item.vy;

          // Va chạm mặt đất
          if (item.y + item.h >= 420) {
            item.y = 420 - item.h;
            if (item.type === 'star') {
              item.vy = -7.5; // Sao nảy tưng tưng
            } else {
              item.vy = 0;
            }
          }

          // Mario nhặt vật phẩm
          if (m.x + m.w > item.x && m.x < item.x + item.w && m.y + m.h > item.y && m.y < item.y + item.h) {
            item.isAlive = false;
            if (item.type === 'mushroom') {
              if (marioFormRef.current === 'small') upgradeMario('super');
              addScore(1000, item.x, item.y);
            } else if (item.type === 'fireflower') {
              upgradeMario('fire');
              addScore(1000, item.x, item.y);
            } else if (item.type === 'star') {
              setIsStarInvincible(true);
              isStarRef.current = true;
              starTimerRef.current = 12; // 12 giây bất tử
              soundManager.playPowerup();
              addFloater(m.x, m.y - 20, 'INVINCIBLE STAR!', '#fde047');
              addScore(1000, item.x, item.y);
            }
          }
        });

        // 3. UPDATE ENEMIES
        enemiesRef.current.forEach(en => {
          if (!en.isAlive) return;

          // Chỉ kích hoạt khi kẻ địch ở gần màn hình
          if (en.x > cameraXRef.current + ARENA_WIDTH + 100 || en.x < cameraXRef.current - 200) return;

          if (en.type === 'goomba' || en.type === 'koopa') {
            if (!en.isStomped) {
              en.vy += 24 * dt;
              en.x += en.vx;
              en.y += en.vy;

              if (en.y + en.h >= 420) {
                en.y = 420 - en.h;
                en.vy = 0;
              }

              // Đổi hướng khi chạm ống nước
              pipesRef.current.forEach(p => {
                if (en.x + en.w > p.x && en.x < p.x + p.w && en.y + en.h > p.y) {
                  en.vx = -en.vx;
                  en.facing = en.vx > 0 ? 'right' : 'left';
                }
              });

              // Va chạm giữa Mario và Kẻ Địch
              if (!m.isDead && m.x + m.w > en.x + 4 && m.x < en.x + en.w - 4 && m.y + m.h > en.y + 4 && m.y < en.y + en.h) {
                // Mario có Sao Bất Tử -> Diệt ngay kẻ địch
                if (isStarRef.current) {
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 10, '#f59e0b');
                  addScore(400, en.x, en.y);
                }
                // Mario nhảy lên đầu dẫm bẹp (Stomp)
                else if (m.vy > 0 && m.y + m.h <= en.y + 18) {
                  m.vy = -9.5; // Mario nảy lên cao
                  soundManager.playMarioStomp();
                  if (en.type === 'goomba') {
                    en.isStomped = true;
                    en.h = 10;
                    en.y += 22;
                    addScore(200, en.x, en.y);
                    setTimeout(() => { en.isAlive = false; }, 400);
                  } else if (en.type === 'koopa') {
                    if (!en.isShell) {
                      en.isShell = true;
                      en.h = 28;
                      en.y += 16;
                      en.vx = 0;
                      addScore(200, en.x, en.y);
                    } else if (en.vx === 0) {
                      // Sút mai rùa
                      en.vx = m.facing === 'right' ? 9.0 : -9.0;
                      soundManager.playMarioKick();
                    } else {
                      en.vx = 0; // Dừng mai rùa
                    }
                  }
                }
                // Va chạm trực diện -> Mất máu/mạng
                else {
                  if (en.isShell && en.vx === 0) {
                    // Chạm nhẹ mai rùa đứng yên -> Sút mai rùa đi
                    en.vx = m.x < en.x ? 9.0 : -9.0;
                    soundManager.playMarioKick();
                  } else {
                    damageMario();
                  }
                }
              }
            } else if (en.isShell && Math.abs(en.vx) > 0.1) {
              en.x += en.vx;
              // Mai rùa đè bẹp các kẻ địch khác
              enemiesRef.current.forEach(other => {
                if (other.id !== en.id && other.isAlive && !other.isStomped) {
                  if (en.x + en.w > other.x && en.x < other.x + other.w && en.y + en.h > other.y && en.y < other.y + other.h) {
                    other.isAlive = false;
                    soundManager.playMarioKick();
                    addParticles(other.x + other.w / 2, other.y + other.h / 2, 8, '#ef4444');
                    addScore(400, other.x, other.y);
                  }
                }
              });
            }
          } else if (en.type === 'bowser') {
            // Boss Bowser AI
            en.animTimer += dt;
            en.shootCooldown = (en.shootCooldown || 2.0) - dt;
            if (en.shootCooldown <= 0) {
              en.shootCooldown = 2.4;
              // Khạc cầu lửa đỏ
              fireballsRef.current.push({
                x: en.x - 10,
                y: en.y + 24,
                vx: -6.5,
                vy: 0,
                radius: 10,
                isAlive: true,
                isEnemy: true,
              });
              soundManager.playMarioFireball();
            }

            // Nhảy dậm
            if (Math.sin(en.animTimer * 2) > 0.8 && en.y >= 420 - en.h) {
              en.vy = -6;
            }
            en.vy += 24 * dt;
            en.y += en.vy;
            if (en.y + en.h >= 420) {
              en.y = 420 - en.h;
              en.vy = 0;
            }

            // Va chạm Mario
            if (!m.isDead && m.x + m.w > en.x && m.x < en.x + en.w && m.y + m.h > en.y && m.y < en.y + en.h) {
              if (isStarRef.current) {
                en.hp = (en.hp || 5) - 1;
                soundManager.playMarioKick();
                if (en.hp <= 0) {
                  en.isAlive = false;
                  addScore(5000, en.x, en.y);
                }
              } else {
                damageMario();
              }
            }
          }
        });

        // 4. UPDATE FIREBALLS
        fireballsRef.current.forEach(fb => {
          if (!fb.isAlive) return;
          fb.x += fb.vx;
          fb.vy += 24 * dt;
          fb.y += fb.vy;

          if (fb.y + fb.radius >= 420) {
            fb.y = 420 - fb.radius;
            fb.vy = -6.5; // Nảy đất
          }

          if (fb.x > cameraXRef.current + ARENA_WIDTH + 40 || fb.x < cameraXRef.current - 40) {
            fb.isAlive = false;
          }

          // Cầu lửa tiêu diệt kẻ địch
          if (!fb.isEnemy) {
            enemiesRef.current.forEach(en => {
              if (en.isAlive && !en.isStomped) {
                if (fb.x + fb.radius > en.x && fb.x - fb.radius < en.x + en.w && fb.y + fb.radius > en.y && fb.y - fb.radius < en.y + en.h) {
                  fb.isAlive = false;
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 8, '#f97316');
                  addScore(200, en.x, en.y);
                }
              }
            });
          } else {
            // Cầu lửa của Bowser trúng Mario
            if (!m.isDead && fb.x + fb.radius > m.x && fb.x - fb.radius < m.x + m.w && fb.y + fb.radius > m.y && fb.y - fb.radius < m.y + m.h) {
              fb.isAlive = false;
              damageMario();
            }
          }
        });

        // Đếm ngược thời gian
        setTimeLeft(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0 && !m.isDead) {
            damageMario();
          }
          return next;
        });
      }

      // 2. RENDER GRAPHICS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // ARENA VIEWPORT CLIPPING (760x540)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      ctx.clip();

      // Bầu trời & Hậu cảnh Parallax
      const camX = cameraXRef.current;
      if (currentStage === 4) {
        // Lâu đài rực lửa đen/đỏ
        const bgGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
        bgGrad.addColorStop(0, '#09050d');
        bgGrad.addColorStop(0.6, '#1a0b16');
        bgGrad.addColorStop(1, '#3b0a0a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      } else if (currentStage === 2) {
        // Hang ngầm xanh đậm
        ctx.fillStyle = '#060c18';
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      } else {
        // Bầu trời xanh nhiệt đới trong vắt
        const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.7, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

        // Mây trắng hoạt hình bồng bềnh
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 12; i++) {
          const cloudX = (i * 380 - camX * 0.25) % (worldLengthRef.current + 400);
          const cloudY = 60 + (i % 3) * 45;
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, 26, 0, Math.PI * 2);
          ctx.arc(cloudX + 24, cloudY - 10, 32, 0, Math.PI * 2);
          ctx.arc(cloudX + 54, cloudY, 26, 0, Math.PI * 2);
          ctx.fill();
        }

        // Đồi cỏ xa xanh mướt (Parallax Hill)
        ctx.fillStyle = '#16a34a';
        for (let i = 0; i < 8; i++) {
          const hillX = (i * 540 - camX * 0.45) % (worldLengthRef.current + 300);
          ctx.beginPath();
          ctx.ellipse(hillX, 420, 110, 75, 0, Math.PI, 0);
          ctx.fill();
          // Chấm cỏ sẫm màu
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(hillX - 20, 380, 15, 8, 0, 0, Math.PI * 2);
          ctx.ellipse(hillX + 25, 395, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16a34a';
        }
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // Vẽ Khối Mặt Đất & Khối Gạch
      blocksRef.current.forEach(b => {
        if (b.x + b.w < camX - 40 || b.x > camX + ARENA_WIDTH + 40) return;

        const renderY = b.y + (b.hitOffsetY || 0);
        if (b.hitOffsetY && b.hitOffsetY < 0) {
          b.hitOffsetY += 0.8;
          if (b.hitOffsetY > 0) b.hitOffsetY = 0;
        }

        if (b.type === 'ground') {
          // Khối đất mặt đường
          ctx.fillStyle = currentStage === 4 ? '#262626' : currentStage === 2 ? '#1e293b' : '#b45309';
          ctx.fillRect(b.x, renderY, b.w, b.h);

          // Lớp cỏ xanh trên mặt (Màn 1)
          if (currentStage === 1) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(b.x, renderY, b.w, 10);
            ctx.fillStyle = '#16a34a';
            for (let cx = b.x; cx < b.x + b.w; cx += 8) {
              ctx.fillRect(cx, renderY + 10, 4, 4);
            }
          }
          // Rãnh đá 3D
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
        } else if (b.type === 'question') {
          // Khối hỏi chấm [?] phát sáng
          const qGrad = ctx.createLinearGradient(b.x, renderY, b.x + b.w, renderY + b.h);
          qGrad.addColorStop(0, '#fef08a');
          qGrad.addColorStop(0.5, '#eab308');
          qGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = qGrad;
          ctx.fillRect(b.x, renderY, b.w, b.h);

          // Khung viền và đinh tán 4 góc
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.fillStyle = '#713f12';
          ctx.fillRect(b.x + 3, renderY + 3, 3, 3);
          ctx.fillRect(b.x + b.w - 6, renderY + 3, 3, 3);
          ctx.fillRect(b.x + 3, renderY + b.h - 6, 3, 3);
          ctx.fillRect(b.x + b.w - 6, renderY + b.h - 6, 3, 3);

          // Dấu hỏi màu nâu đậm nổi khối
          ctx.fillStyle = '#78350f';
          ctx.font = 'black 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', b.x + b.w / 2, renderY + b.h / 2 + 1);
        } else if (b.type === 'brick') {
          // Khối gạch nâu
          ctx.fillStyle = currentStage === 4 ? '#7f1d1d' : currentStage === 2 ? '#334155' : '#b45309';
          ctx.fillRect(b.x, renderY, b.w, b.h);
          // Vân gạch chữ T
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.beginPath();
          ctx.moveTo(b.x, renderY + 20);
          ctx.lineTo(b.x + b.w, renderY + 20);
          ctx.moveTo(b.x + 20, renderY);
          ctx.lineTo(b.x + 20, renderY + 20);
          ctx.moveTo(b.x + 10, renderY + 20);
          ctx.lineTo(b.x + 10, renderY + b.h);
          ctx.moveTo(b.x + 30, renderY + 20);
          ctx.lineTo(b.x + 30, renderY + b.h);
          ctx.stroke();
        } else if (b.type === 'empty') {
          // Khối sắt đã ăn hết vật phẩm
          ctx.fillStyle = '#78716c';
          ctx.fillRect(b.x, renderY, b.w, b.h);
          ctx.strokeStyle = '#44403c';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.fillStyle = '#292524';
          ctx.fillRect(b.x + 4, renderY + 4, 3, 3);
          ctx.fillRect(b.x + b.w - 7, renderY + 4, 3, 3);
          ctx.fillRect(b.x + 4, renderY + b.h - 7, 3, 3);
          ctx.fillRect(b.x + b.w - 7, renderY + b.h - 7, 3, 3);
        }
      });

      // Vẽ Đường Ống Nước (Pipes)
      pipesRef.current.forEach(p => {
        if (p.x + p.w < camX - 40 || p.x > camX + ARENA_WIDTH + 40) return;

        // Cây ăn thịt nhô lên từ ống nước
        if (p.hasPiranha) {
          const plantY = p.y - 32 + (Math.sin(p.piranhaTimer || 0) > 0 ? 0 : 36);
          p.piranhaTimer = (p.piranhaTimer || 0) + 0.05;

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, plantY + 12, 14, 0, Math.PI * 2);
          ctx.fill();
          // Chấm trắng trên đầu
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2 - 5, plantY + 8, 3, 0, Math.PI * 2);
          ctx.arc(p.x + p.w / 2 + 5, plantY + 14, 2.5, 0, Math.PI * 2);
          ctx.fill();
          // Hàm răng trắng
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x + p.w / 2 - 8, plantY + 16, 16, 4);
        }

        // Thân ống nước màu xanh
        const pGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
        pGrad.addColorStop(0, '#15803d');
        pGrad.addColorStop(0.3, '#4ade80');
        pGrad.addColorStop(0.7, '#22c55e');
        pGrad.addColorStop(1, '#166534');
        ctx.fillStyle = pGrad;
        ctx.fillRect(p.x + 3, p.y + 16, p.w - 6, p.h - 16);

        // Vành miệng ống nước 3D
        ctx.fillRect(p.x, p.y, p.w, 18);
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(p.x, p.y, p.w, 18);
        ctx.strokeRect(p.x + 3, p.y + 18, p.w - 6, p.h - 18);
      });

      // Vẽ Rìu cắt cầu (Màn 4)
      if (axeRef.current && axeRef.current.active) {
        const ax = axeRef.current;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ax.x + 15, ax.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ax.x + 12, ax.y + 20, 6, 20);
      }

      // Vẽ Cột Cờ Chiến Thắng & Lâu Đài
      const fp = flagpoleRef.current;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(fp.x + 4, fp.y, 4, fp.h);
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(fp.x + 6, fp.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Lá cờ xanh/đỏ tụt xuống khi chạm
      const flagY = m.isFlagpoleSliding || m.walkToCastle ? fp.y + fp.h - 40 : fp.flagY;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(fp.x + 8, flagY);
      ctx.lineTo(fp.x + 42, flagY + 16);
      ctx.lineTo(fp.x + 8, flagY + 32);
      ctx.closePath();
      ctx.fill();

      // Lâu đài đích đến
      const cst = castleRef.current;
      ctx.fillStyle = currentStage === 4 ? '#450a0a' : '#64748b';
      ctx.fillRect(cst.x, cst.y, cst.w, cst.h);
      // Cửa tò vò màu đen
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cst.x + cst.w / 2, cst.y + cst.h - 35, 24, Math.PI, 0);
      ctx.fillRect(cst.x + cst.w / 2 - 24, cst.y + cst.h - 35, 48, 35);
      ctx.fill();
      // Răng cưa pháo đài
      for (let bx = cst.x; bx < cst.x + cst.w; bx += 28) {
        ctx.fillRect(bx, cst.y - 14, 18, 14);
      }

      // Vẽ Vật Phẩm (Nấm, Hoa Lửa, Sao)
      itemsRef.current.forEach(item => {
        if (!item.isAlive) return;
        if (item.type === 'mushroom') {
          // Nấm đỏ Super Mushroom
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 14, 14, Math.PI, 0);
          ctx.fill();
          // Chấm tròn trắng
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 7, 4, 0, Math.PI * 2);
          ctx.arc(item.x + 5, item.y + 12, 3, 0, Math.PI * 2);
          ctx.arc(item.x + item.w - 5, item.y + 12, 3, 0, Math.PI * 2);
          ctx.fill();
          // Thân nấm màu kem & 2 mắt
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(item.x + 8, item.y + 14, item.w - 16, 14);
          ctx.fillStyle = '#000000';
          ctx.fillRect(item.x + 11, item.y + 17, 2.5, 6);
          ctx.fillRect(item.x + item.w - 13.5, item.y + 17, 2.5, 6);
        } else if (item.type === 'fireflower') {
          // Hoa Lửa Fire Flower
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 12, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(item.x + item.w / 2 - 2, item.y + 20, 4, 10);
        } else if (item.type === 'star') {
          // Ngôi sao Starman
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          const cx = item.x + item.w / 2;
          const cy = item.y + item.h / 2;
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 14 + cx, -Math.sin((18 + i * 72) * Math.PI / 180) * 14 + cy);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 6 + cx, -Math.sin((54 + i * 72) * Math.PI / 180) * 6 + cy);
          }
          ctx.closePath();
          ctx.fill();
          // 2 mắt đen thẳng đứng
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx - 3, cy - 3, 2, 6);
          ctx.fillRect(cx + 1, cy - 3, 2, 6);
        }
      });

      // Vẽ Kẻ Địch
      enemiesRef.current.forEach(en => {
        if (!en.isAlive) return;

        if (en.type === 'goomba') {
          if (en.isStomped) {
            // Nấm bị dẫm bẹp
            ctx.fillStyle = '#78350f';
            ctx.fillRect(en.x, en.y, en.w, 10);
          } else {
            // Nấm Goomba hoàn chỉnh
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(en.x + en.w / 2, en.y + 14, 15, Math.PI, 0);
            ctx.lineTo(en.x + en.w, en.y + 24);
            ctx.lineTo(en.x, en.y + 24);
            ctx.closePath();
            ctx.fill();

            // Thân màu kem
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(en.x + 6, en.y + 20, en.w - 12, 8);

            // Mắt giận dữ & lông mày xếch
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(en.x + 7, en.y + 10, 5, 8);
            ctx.fillRect(en.x + en.w - 12, en.y + 10, 5, 8);
            ctx.fillStyle = '#000000';
            ctx.fillRect(en.x + 9, en.y + 12, 3, 6);
            ctx.fillRect(en.x + en.w - 11, en.y + 12, 3, 6);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(en.x + 6, en.y + 9);
            ctx.lineTo(en.x + 12, en.y + 12);
            ctx.moveTo(en.x + en.w - 6, en.y + 9);
            ctx.lineTo(en.x + en.w - 12, en.y + 12);
            ctx.stroke();

            // 2 bàn chân lúc lắc
            ctx.fillStyle = '#000000';
            ctx.fillRect(en.x + 2, en.y + 26, 10, 6);
            ctx.fillRect(en.x + en.w - 12, en.y + 26, 10, 6);
          }
        } else if (en.type === 'koopa') {
          if (en.isShell) {
            // Mai rùa Koopa màu xanh
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.arc(en.x + en.w / 2, en.y + 14, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Rùa Koopa đi tuần tra
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(en.x + en.w / 2, en.y + 24, 13, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Đầu rùa vàng
            ctx.fillStyle = '#facc15';
            const headX = en.facing === 'left' ? en.x + 4 : en.x + en.w - 4;
            ctx.beginPath();
            ctx.arc(headX, en.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            // Mắt
            ctx.fillStyle = '#000000';
            ctx.fillRect(headX + (en.facing === 'left' ? -4 : 2), en.y + 8, 3, 5);

            // Bốt chân đi nhịp nhàng
            ctx.fillStyle = '#f97316';
            ctx.fillRect(en.x + 2, en.y + 38, 10, 6);
            ctx.fillRect(en.x + en.w - 12, en.y + 38, 10, 6);
          }
        } else if (en.type === 'bowser') {
          // Boss Bowser rực lửa
          ctx.fillStyle = '#15803d';
          ctx.fillRect(en.x + 12, en.y + 14, 44, 50);
          // Gai nhọn mai rùa
          ctx.fillStyle = '#ffffff';
          for (let sp = 0; sp < 4; sp++) {
            ctx.beginPath();
            ctx.moveTo(en.x + 56, en.y + 18 + sp * 12);
            ctx.lineTo(en.x + 66, en.y + 22 + sp * 12);
            ctx.lineTo(en.x + 56, en.y + 26 + sp * 12);
            ctx.fill();
          }
          // Đầu rồng hung tợn & sừng vàng
          ctx.fillStyle = '#eab308';
          ctx.fillRect(en.x, en.y + 10, 26, 26);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(en.x + 2, en.y, 6, 12); // Sừng
          // Mắt đỏ rực
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(en.x + 8, en.y + 16, 5, 5);
          // Bờm tóc đỏ
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(en.x + 18, en.y + 4, 18, 12);
        }
      });

      // Vẽ Cầu Lửa
      fireballsRef.current.forEach(fb => {
        if (!fb.isAlive) return;
        ctx.fillStyle = fb.isEnemy ? '#dc2626' : '#f97316';
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, fb.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vẽ NHÂN VẬT MARIO CHÂN THỰC
      if (!m.isDead || (m.isDead && m.y < CANVAS_HEIGHT + 60)) {
        // Nhấp nháy khi vừa hồi sinh hoặc ăn Sao
        const isFlickering = (invulnerableTimerRef.current > 0 && Math.floor(now / 50) % 2 === 0);
        if (!isFlickering) {
          ctx.save();
          ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
          if (m.facing === 'left') ctx.scale(-1, 1);

          // Starman Rainbow Palette
          const starHue = isStarRef.current ? (Math.floor(now / 40) * 60) % 360 : null;
          const shirtColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#ffffff' : '#dc2626';
          const overallsColor = starHue !== null ? `hsl(${(starHue + 180) % 360}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#dc2626' : '#2563eb';
          const capColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#ffffff' : '#dc2626';

          const isSuper = marioFormRef.current !== 'small';
          const bodyYOffset = isSuper ? -6 : 0;

          // 1. Mũ đỏ & Vành mũ
          ctx.fillStyle = capColor;
          ctx.beginPath();
          ctx.ellipse(0, -m.h / 2 + 8, isSuper ? 12 : 9, isSuper ? 9 : 7, 0, 0, Math.PI * 2);
          ctx.fill();
          // Vành mũ nhô ra phía trước
          ctx.fillRect(0, -m.h / 2 + 10, isSuper ? 14 : 11, 4);
          // Huy hiệu tròn chữ M
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-2, -m.h / 2 + 6, isSuper ? 4 : 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.font = `bold ${isSuper ? 6 : 5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('M', -2, -m.h / 2 + 8);

          // 2. Khuôn mặt & Mắt & Mũi & Ria mép đặc trưng
          ctx.fillStyle = '#fed7aa'; // Làn da sáng
          ctx.beginPath();
          ctx.arc(0, -m.h / 2 + 16 + bodyYOffset, isSuper ? 9 : 7, 0, Math.PI * 2);
          ctx.fill();

          // Mũi tròn to
          ctx.beginPath();
          ctx.arc(isSuper ? 8 : 6, -m.h / 2 + 16 + bodyYOffset, isSuper ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Mắt xanh biếc
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(isSuper ? 3 : 2, -m.h / 2 + 13 + bodyYOffset, 2.5, 4);

          // Ria mép rậm rạp màu đen huyền thoại
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(isSuper ? 6 : 4, -m.h / 2 + 19 + bodyYOffset, isSuper ? 6.5 : 5, isSuper ? 3.5 : 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tóc mai nâu sẫm phía sau đầu
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-m.h / 4, -m.h / 2 + 14 + bodyYOffset, 4, 8);

          // 3. Thân người: Áo đỏ & Quần yếm xanh
          ctx.fillStyle = shirtColor;
          ctx.fillRect(-m.w / 2 + 4, -m.h / 2 + 22 + bodyYOffset, m.w - 8, isSuper ? 16 : 10);

          // Quần yếm xanh
          ctx.fillStyle = overallsColor;
          ctx.fillRect(-m.w / 2 + 5, -m.h / 2 + 26 + bodyYOffset, m.w - 10, isSuper ? 18 : 12);

          // 2 Nút quai yếm màu vàng đồng
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(-m.w / 4, -m.h / 2 + 28 + bodyYOffset, 2, 0, Math.PI * 2);
          ctx.arc(m.w / 4 - 2, -m.h / 2 + 28 + bodyYOffset, 2, 0, Math.PI * 2);
          ctx.fill();

          // 4. Bàn tay đeo găng trắng
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          if (m.animFrame === 3) {
            // Tư thế nhảy: 1 tay vươn lên cao
            ctx.arc(m.w / 2 - 2, -m.h / 2 + 4, 4, 0, Math.PI * 2);
            ctx.arc(-m.w / 2 + 4, -m.h / 2 + 26, 4, 0, Math.PI * 2);
          } else {
            ctx.arc(m.w / 2 - 2, -m.h / 2 + 28 + bodyYOffset, 4, 0, Math.PI * 2);
            ctx.arc(-m.w / 2 + 4, -m.h / 2 + 28 + bodyYOffset, 4, 0, Math.PI * 2);
          }
          ctx.fill();

          // 5. Đôi ủng nâu da bò
          ctx.fillStyle = '#78350f';
          if (m.animFrame === 1) {
            ctx.fillRect(-m.w / 2 + 2, m.h / 2 - 8, 10, 8);
            ctx.fillRect(m.w / 2 - 10, m.h / 2 - 5, 10, 5);
          } else if (m.animFrame === 2) {
            ctx.fillRect(-m.w / 2 + 4, m.h / 2 - 5, 10, 5);
            ctx.fillRect(m.w / 2 - 8, m.h / 2 - 8, 10, 8);
          } else {
            ctx.fillRect(-m.w / 2 + 2, m.h / 2 - 7, 10, 7);
            ctx.fillRect(m.w / 2 - 12, m.h / 2 - 7, 10, 7);
          }

          ctx.restore();
        }
      }

      // Vẽ Hiệu Ứng Hạt Nổ & Bụi
      particlesRef.current.forEach((pt, pIdx) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.3;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.alpha <= 0) {
          particlesRef.current.splice(pIdx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        if (pt.isBrickPiece) {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rotation || 0);
          ctx.fillRect(-pt.radius, -pt.radius, pt.radius * 2, pt.radius * 2);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Vẽ Chữ Nổi Bay (+100, +200)
      floatersRef.current.forEach((fl, fIdx) => {
        fl.y += fl.vy;
        fl.life++;
        fl.alpha = 1 - fl.life / 40;
        if (fl.alpha <= 0) {
          floatersRef.current.splice(fIdx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = fl.alpha;
        ctx.fillStyle = fl.color;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      });

      ctx.restore(); // Kết thúc dịch chuyển Camera

      // Banner HUD phía trên màn hình chơi (Retro Header)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, ARENA_WIDTH, 36);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MARIO', 24, 23);
      ctx.fillStyle = '#facc15';
      ctx.fillText(`${scoreRef.current.toString().padStart(6, '0')}`, 75, 23);

      ctx.fillStyle = '#facc15';
      ctx.fillText(`🪙 x${coinsRef.current.toString().padStart(2, '0')}`, 200, 23);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('WORLD', 340, 23);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${currentWorld}-${currentStage}`, 390, 23);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('TIME', 500, 23);
      ctx.fillStyle = timeLeft < 50 ? '#ef4444' : '#f8fafc';
      ctx.fillText(`${Math.ceil(timeLeft)}`, 540, 23);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`♥ x ${livesRef.current}`, 660, 23);

      ctx.restore(); // Hết clip Arena

      // 3. SIDEBAR THÔNG SỐ BÊN PHẢI (200px)
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(SIDEBAR_X, 0, SIDEBAR_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(SIDEBAR_X, 0);
      ctx.lineTo(SIDEBAR_X, CANVAS_HEIGHT);
      ctx.stroke();

      // Tiêu đề Sidebar
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUPER MARIO BROS', SIDEBAR_X + SIDEBAR_WIDTH / 2, 28);

      // Card Hình Dạng Mario
      const cardY = 46;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, cardY, SIDEBAR_WIDTH - 32, 64, 12);
      ctx.fill();
      ctx.strokeStyle = isStarRef.current ? '#facc15' : marioFormRef.current === 'fire' ? '#ef4444' : marioFormRef.current === 'super' ? '#3b82f6' : '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '22px sans-serif';
      const formIcon = isStarRef.current ? '⭐' : marioFormRef.current === 'fire' ? '🔥' : marioFormRef.current === 'super' ? '🍄' : '👨';
      ctx.fillText(formIcon, SIDEBAR_X + 44, cardY + 38);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      const formText = isStarRef.current ? 'BẤT TỬ' : marioFormRef.current === 'fire' ? 'MARIO LỬA' : marioFormRef.current === 'super' ? 'SIÊU MARIO' : 'MARIO NHỎ';
      ctx.fillText(formText, SIDEBAR_X + 70, cardY + 32);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(isStarRef.current ? `${Math.ceil(starTimerRef.current)}s còn lại` : marioFormRef.current === 'fire' ? 'Phím J: Bắn lửa' : 'Húc gạch tìm nấm', SIDEBAR_X + 70, cardY + 48);

      // Tiến Trình Màn Chơi (World Progress)
      const progY = 126;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, progY, SIDEBAR_WIDTH - 32, 70, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TIẾN ĐỘ VƯỢNG QUỐC', SIDEBAR_X + SIDEBAR_WIDTH / 2, progY + 22);

      const progRatio = Math.min(1, Math.max(0, m.x / (worldLengthRef.current - 200)));
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(SIDEBAR_X + 28, progY + 34, SIDEBAR_WIDTH - 56, 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(SIDEBAR_X + 28, progY + 34, (SIDEBAR_WIDTH - 56) * progRatio, 10);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`MÀN ${currentWorld}-${currentStage} • ${Math.round(progRatio * 100)}%`, SIDEBAR_X + SIDEBAR_WIDTH / 2, progY + 58);

      // Điểm Số Chiến Trường
      const scoreBoxY = 212;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, scoreBoxY, SIDEBAR_WIDTH - 32, 64, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐIỂM SỐ', SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 22);

      ctx.fillStyle = '#facc15';
      ctx.font = 'black 20px monospace';
      ctx.fillText(`${scoreRef.current.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, scoreBoxY + 48);

      // Kỷ Lục Cao Nhất
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`KỶ LỤC: ${highScore.toLocaleString()}`, SIDEBAR_X + SIDEBAR_WIDTH / 2, 305);

      // Hướng Dẫn Nhanh Phím Bấm
      const keyGuideY = 330;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(SIDEBAR_X + 16, keyGuideY, SIDEBAR_WIDTH - 32, 180, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('PHÍM ĐIỀU KHIỂN', SIDEBAR_X + SIDEBAR_WIDTH / 2, keyGuideY + 24);

      const guides = [
        { key: 'A / D', action: 'Chạy sang Trái / Phải' },
        { key: 'S', action: 'Cúi người / Xuống ống' },
        { key: 'K / Space', action: 'Nhảy bổng' },
        { key: 'J / Z', action: 'Bắn lửa / Chạy nhanh' },
      ];

      guides.forEach((g, idx) => {
        const rowY = keyGuideY + 50 + idx * 30;
        ctx.fillStyle = '#334155';
        ctx.fillRect(SIDEBAR_X + 24, rowY - 12, 54, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(g.key, SIDEBAR_X + 51, rowY + 1);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(g.action, SIDEBAR_X + 84, rowY + 1);
      });

      // Màn hình Game Over / Stage Clear Overlay
      if (gameStateRef.current === 'game_over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'black 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Bấm nút Thử Lại bên dưới để chơi ván mới', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 25);
      } else if (gameStateRef.current === 'stage_clear') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'black 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 30);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`Chúc mừng bạn đã hoàn thành Màn ${currentWorld}-${currentStage}!`, ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 10);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addCoin, addScore, currentStage, currentWorld, damageMario, highScore, timeLeft]);

  // Khởi động level đầu tiên
  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-slate-950 overflow-hidden">
      {/* Khung Canvas Trò Chơi Widescreen 960x540 */}
      <div className="relative w-full max-w-[960px] aspect-[16/9] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-white/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain bg-black"
        />

        {/* Nút Điều Khiển Cảm Ứng Ảo Trên Thiết Bị Di Động */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:hidden z-30">
          <div />
          <div className="flex items-end justify-between w-full pointer-events-auto">
            {/* D-Pad 3 Hướng (Trái, Phải, Cúi) */}
            <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                onTouchStart={() => { keysRef.current.left = true; }}
                onTouchEnd={() => { keysRef.current.left = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onTouchStart={() => { keysRef.current.down = true; }}
                onTouchEnd={() => { keysRef.current.down = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
              <button
                onTouchStart={() => { keysRef.current.right = true; }}
                onTouchEnd={() => { keysRef.current.right = false; }}
                className="w-12 h-12 rounded-xl bg-slate-800 active:bg-cyan-500 text-white flex items-center justify-center font-bold text-lg"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Cụm Nút B (Bắn/Chạy) & A (Nhảy) */}
            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => {
                  keysRef.current.dash = true;
                  shootFireball();
                }}
                onTouchEnd={() => { keysRef.current.dash = false; }}
                className="w-14 h-14 rounded-full bg-orange-600/90 active:bg-orange-500 text-white font-black text-lg border-2 border-orange-400/50 shadow-lg flex items-center justify-center"
              >
                B
              </button>
              <button
                onTouchStart={() => {
                  if (marioRef.current.isGrounded && !marioRef.current.isDead) {
                    marioRef.current.vy = -13.5;
                    marioRef.current.isGrounded = false;
                    soundManager.playMarioJump(marioFormRef.current !== 'small');
                  }
                  keysRef.current.jump = true;
                }}
                onTouchEnd={() => { keysRef.current.jump = false; }}
                className="w-14 h-14 rounded-full bg-emerald-600/90 active:bg-emerald-500 text-white font-black text-lg border-2 border-emerald-400/50 shadow-lg flex items-center justify-center"
              >
                A
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Điều Khiển Phụ Dưới Canvas */}
      <div className="w-full max-w-[960px] flex items-center justify-between px-3 py-2 mt-2 bg-slate-900/60 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => startNewGame(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-gray-200 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chơi Lại</span>
          </button>
          <button
            onClick={() => setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-gray-200 transition active:scale-95 cursor-pointer"
          >
            {gameState === 'paused' ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tiếp Tục</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Tạm Dừng</span>
              </>
            )}
          </button>
        </div>

        {/* Chuyển Màn Chơi Nhanh */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-gray-400 mr-1.5 hidden sm:inline">Chọn Màn:</span>
          {[1, 2, 3, 4].map(stg => (
            <button
              key={stg}
              onClick={() => {
                soundManager.playButtonClick();
                startNewGame(stg);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                currentStage === stg
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              1-{stg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
