import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  ArrowLeft, 
  ArrowRight,
  ArrowDown,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { soundManager } from '../utils/sound';

// Kích thước chuẩn Widescreen 16:9 Cinema Arcade Full Viewport
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Sử dụng toàn bộ 960px chiều ngang cho sân khấu phiêu lưu, tầm nhìn rộng mở tối đa
const ARENA_WIDTH = CANVAS_WIDTH;
const ARENA_HEIGHT = CANVAS_HEIGHT;

// Kích thước khối địa hình chuẩn (48x48) & Cao độ mặt đất (y = 468 để có 468px không gian bay nhảy)
const BLOCK_SIZE = 48;
const GROUND_Y = 468;

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
  type: 'ground' | 'brick' | 'question' | 'empty' | 'hard_block';
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
}

interface Enemy {
  id: number;
  type: 'goomba' | 'koopa' | 'bowser';
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
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'stage_clear' | 'game_over'>('playing');
  const currentWorld = 1;
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_mario_highscore') || '25000', 10);
    } catch {
      return 25000;
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

  // Player Mario Ref (Kích thước lớn sắc sảo: Small 38x54, Super 46x76)
  const marioRef = useRef({
    x: 100,
    y: GROUND_Y - 54,
    w: 38,
    h: 54,
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
  const flagpoleRef = useRef({ x: 3400, y: 140, h: 328, flagY: 150 });
  const castleRef = useRef({ x: 3560, y: 228, w: 240, h: 240, hasFlag: false, castleFlagY: 228 });
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
      const spd = isBrick ? Math.random() * 7 + 3 : Math.random() * 5 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (isBrick ? 5 : 2.5),
        radius: isBrick ? Math.random() * 5 + 4 : Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: isBrick ? 50 : 35,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
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
      vy: -1.8,
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
    addParticles(x, y, 10, '#facc15');

    // 100 Xu thưởng 1 Mạng
    if (coinsRef.current % 100 === 0) {
      livesRef.current += 1;
      setLives(livesRef.current);
      addFloater(x, y - 24, '1-UP!', '#4ade80');
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

    const levelLen = stage === 4 ? 3400 : 3800;
    worldLengthRef.current = levelLen;

    // 1. Tạo mặt đất liên tục kèm các khe hố
    let curX = 0;
    while (curX < levelLen) {
      const isPit = (stage === 1 && (curX >= 1152 && curX <= 1248 || curX >= 2208 && curX <= 2352)) ||
                    (stage === 2 && (curX >= 864 && curX <= 1008 || curX >= 1920 && curX <= 2112)) ||
                    (stage === 3 && (curX >= 672 && curX <= 864 || curX >= 1536 && curX <= 1776 || curX >= 2592 && curX <= 2832)) ||
                    (stage === 4 && (curX >= 1296 && curX <= 1536 || curX >= 2352 && curX <= 2688));

      const segLen = isPit ? 144 : 288;
      if (!isPit) {
        for (let bx = curX; bx < curX + segLen; bx += BLOCK_SIZE) {
          blocksRef.current.push({
            id: Math.random(),
            x: bx,
            y: GROUND_Y,
            w: BLOCK_SIZE,
            h: 72,
            type: 'ground',
          });
        }
      }
      curX += segLen;
    }

    // 2. Tạo đường ống nước xanh 3D (Pipes)
    if (stage !== 4) {
      const pipeLocs = [
        { x: 576, h: 72, hasPiranha: true },
        { x: 1008, h: 96, hasPiranha: true },
        { x: 1536, h: 120, hasPiranha: true },
        { x: 2544, h: 84, hasPiranha: true },
        { x: 3024, h: 108, hasPiranha: true },
      ];
      pipeLocs.forEach(p => {
        pipesRef.current.push({
          x: p.x,
          y: GROUND_Y - p.h,
          w: 68,
          h: p.h,
          hasPiranha: p.hasPiranha,
          piranhaOffset: 0,
          piranhaDir: 1,
          piranhaTimer: Math.random() * 2,
        });
      });
    }

    // 3. Khối gạch & Khối Hỏi Chấm [?] (Kích thước 48x48)
    const blockLayouts: Array<{ x: number; y: number; type: 'brick' | 'question'; content?: 'coin' | 'mushroom' | 'fireflower' | 'star' }> = [
      // Nhóm khối đầu tiên
      { x: 384, y: 312, type: 'question', content: 'coin' },
      { x: 432, y: 312, type: 'brick' },
      { x: 480, y: 312, type: 'question', content: 'mushroom' },
      { x: 528, y: 312, type: 'brick' },
      { x: 576, y: 312, type: 'question', content: 'coin' },

      // Cầu gạch trên cao
      { x: 768, y: 216, type: 'brick' },
      { x: 816, y: 216, type: 'question', content: 'star' },
      { x: 864, y: 216, type: 'brick' },
      { x: 912, y: 216, type: 'brick' },

      // Nhóm khối giữa màn
      { x: 1392, y: 312, type: 'brick' },
      { x: 1440, y: 312, type: 'question', content: 'fireflower' },
      { x: 1488, y: 312, type: 'brick' },

      // Dãy gạch vượt hố
      { x: 1776, y: 264, type: 'question', content: 'coin' },
      { x: 1824, y: 264, type: 'question', content: 'coin' },
      { x: 1872, y: 264, type: 'question', content: 'mushroom' },

      // Bậc thang kim tự tháp cuối màn
      { x: 3120, y: 420, type: 'hard_block' as any },
      { x: 3168, y: 420, type: 'hard_block' as any },
      { x: 3168, y: 372, type: 'hard_block' as any },
      { x: 3216, y: 420, type: 'hard_block' as any },
      { x: 3216, y: 372, type: 'hard_block' as any },
      { x: 3216, y: 324, type: 'hard_block' as any },
      { x: 3264, y: 420, type: 'hard_block' as any },
      { x: 3264, y: 372, type: 'hard_block' as any },
      { x: 3264, y: 324, type: 'hard_block' as any },
      { x: 3264, y: 276, type: 'hard_block' as any },
    ];

    blockLayouts.forEach(b => {
      blocksRef.current.push({
        id: Math.random(),
        x: b.x,
        y: b.y,
        w: BLOCK_SIZE,
        h: BLOCK_SIZE,
        type: b.type,
        content: b.content,
        coinsLeft: b.content === 'coin' ? 1 : undefined,
      });
    });

    // 4. Kẻ địch kinh điển (Kích thước lớn: Goomba 44x44, Koopa 44x62)
    if (stage !== 4) {
      const enemySpawns = [
        { type: 'goomba' as const, x: 480 },
        { type: 'goomba' as const, x: 864 },
        { type: 'koopa' as const, x: 1200 },
        { type: 'goomba' as const, x: 1440 },
        { type: 'goomba' as const, x: 1500 },
        { type: 'koopa' as const, x: 1968 },
        { type: 'goomba' as const, x: 2496 },
        { type: 'koopa' as const, x: 2928 },
      ];
      enemySpawns.forEach(e => {
        enemiesRef.current.push({
          id: Math.random(),
          type: e.type,
          x: e.x,
          y: GROUND_Y - (e.type === 'koopa' ? 62 : 44),
          w: 44,
          h: e.type === 'koopa' ? 62 : 44,
          vx: -1.3,
          vy: 0,
          isAlive: true,
          facing: 'left',
          animTimer: 0,
        });
      });
    } else {
      // Màn 4: Bowser's Castle & Lava Bridge
      const bridgeStartX = 2450;
      const bridgeLen = 384;
      bridgeBlocksRef.current = [];
      for (let bx = bridgeStartX; bx < bridgeStartX + bridgeLen; bx += BLOCK_SIZE) {
        const blk: Block = {
          id: Math.random(),
          x: bx,
          y: GROUND_Y,
          w: BLOCK_SIZE,
          h: 36,
          type: 'brick',
        };
        blocksRef.current.push(blk);
        bridgeBlocksRef.current.push(blk);
      }

      // Rìu giật cầu ở cuối cầu
      axeRef.current = {
        x: bridgeStartX + bridgeLen + 24,
        y: GROUND_Y - 60,
        active: true,
      };

      // Đặt Boss Bowser canh giữ cầu (Kích thước khổng lồ 96x104)
      enemiesRef.current.push({
        id: 999,
        type: 'bowser',
        x: bridgeStartX + 160,
        y: GROUND_Y - 104,
        w: 96,
        h: 104,
        vx: -0.8,
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
      x: levelLen - 340,
      y: GROUND_Y - 328,
      h: 328,
      flagY: GROUND_Y - 318,
    };
    castleRef.current = {
      x: levelLen - 180,
      y: GROUND_Y - 240,
      w: 240,
      h: 240,
      hasFlag: false,
      castleFlagY: GROUND_Y - 240,
    };

    // Reset vị trí Mario
    const isSuper = marioFormRef.current !== 'small';
    const initH = isSuper ? 76 : 54;
    const initW = isSuper ? 44 : 38;
    marioRef.current = {
      x: 100,
      y: GROUND_Y - initH,
      w: initW,
      h: initH,
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
    invulnerableTimerRef.current = 2.5;

    marioRef.current.x = Math.max(100, cameraXRef.current + 80);
    marioRef.current.y = GROUND_Y - 54;
    marioRef.current.w = 38;
    marioRef.current.h = 54;
    marioRef.current.vx = 0;
    marioRef.current.vy = 0;
    marioRef.current.isDead = false;
    marioRef.current.isGrounded = true;
  }, []);

  // Xử lý biến đổi hình thái Mario
  const upgradeMario = (newForm: MarioForm) => {
    setMarioForm(newForm);
    marioFormRef.current = newForm;
    soundManager.playMarioPowerup();
    if (newForm !== 'small') {
      marioRef.current.w = 44;
      marioRef.current.h = 76;
      marioRef.current.y -= 22;
    }
    addFloater(marioRef.current.x + marioRef.current.w / 2, marioRef.current.y - 20, newForm === 'fire' ? 'FIRE MARIO!' : 'SUPER MARIO!', '#fbbf24');
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
      marioRef.current.w = 38;
      marioRef.current.h = 54;
      invulnerableTimerRef.current = 2.0;
      soundManager.playMarioPowerdown();
    } else {
      marioRef.current.isDead = true;
      marioRef.current.deathVy = -12;
      soundManager.playMarioDie();
      setTimeout(respawnMario, 2200);
    }
  };

  // Mario bắn cầu lửa
  const shootFireball = () => {
    if (marioFormRef.current !== 'fire' || marioRef.current.isDead) return;
    const activeFireballs = fireballsRef.current.filter(f => !f.isEnemy && f.isAlive).length;
    if (activeFireballs >= 2) return;

    soundManager.playMarioFireball();
    const isRight = marioRef.current.facing === 'right';
    fireballsRef.current.push({
      x: marioRef.current.x + (isRight ? marioRef.current.w + 6 : -12),
      y: marioRef.current.y + 26,
      vx: isRight ? 9.5 : -9.5,
      vy: 3.5,
      radius: 8,
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

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        if (!keysRef.current.jump && marioRef.current.isGrounded && !marioRef.current.isDead) {
          marioRef.current.vy = -14.2;
          marioRef.current.isGrounded = false;
          soundManager.playMarioJump(marioFormRef.current !== 'small');
          addParticles(marioRef.current.x + marioRef.current.w / 2, marioRef.current.y + marioRef.current.h, 6, '#cbd5e1');
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
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        keysRef.current.jump = false;
        if (marioRef.current.vy < -5.5) {
          marioRef.current.vy = -5.5;
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

      // Hỗ trợ High-DPI (Retina) cho đồ họa sắc nét gấp đôi
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      const m = marioRef.current;

      // 1. UPDATE LOGIC KHI ĐANG CHƠI
      if (gameStateRef.current === 'playing') {
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
          if (m.y < flagpoleRef.current.y + flagpoleRef.current.h - m.h) {
            m.y += 200 * dt;
          } else {
            m.isFlagpoleSliding = false;
            m.walkToCastle = true;
            m.facing = 'right';
          }
        } else if (m.walkToCastle) {
          m.x += 140 * dt;
          m.animTimer += dt * 10;
          m.animFrame = Math.floor(m.animTimer) % 3;
          if (m.x >= castleRef.current.x + castleRef.current.w / 2 - m.w / 2) {
            m.walkToCastle = false;
            castleRef.current.hasFlag = true;
            setGameState('stage_clear');
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            soundManager.playMarioStageClear();
          }
        } else {
          // Điều khiển di chuyển
          const maxSpeed = keysRef.current.dash ? 6.8 : 4.8;
          const accel = keysRef.current.dash ? 19 : 15;
          const friction = 13;

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
            if (m.vx > 0) m.vx = Math.max(0, m.vx - friction * dt);
            else if (m.vx < 0) m.vx = Math.min(0, m.vx + friction * dt);
            m.isSkidding = false;
          }

          // Trọng lực rơi
          m.vy += 34 * dt;
          if (m.vy > 15) m.vy = 15;

          // Cập nhật X & Va chạm
          m.x += m.vx;
          if (m.x < cameraXRef.current) {
            m.x = cameraXRef.current;
            m.vx = 0;
          }

          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x && m.x < b.x + b.w && m.y + m.h > b.y && m.y < b.y + b.h) {
              if (m.vx > 0) { m.x = b.x - m.w; m.vx = 0; }
              else if (m.vx < 0) { m.x = b.x + b.w; m.vx = 0; }
            }
          });

          pipesRef.current.forEach(p => {
            if (m.x + m.w > p.x && m.x < p.x + p.w && m.y + m.h > p.y && m.y < p.y + p.h) {
              if (m.vx > 0) { m.x = p.x - m.w; m.vx = 0; }
              else if (m.vx < 0) { m.x = p.x + p.w; m.vx = 0; }
            }
          });

          // Cập nhật Y & Va chạm
          m.y += m.vy;
          m.isGrounded = false;

          blocksRef.current.forEach(b => {
            if (m.x + m.w > b.x + 4 && m.x < b.x + b.w - 4) {
              // Tiếp đất trên đỉnh khối
              if (m.vy >= 0 && m.y + m.h >= b.y && m.y + m.h <= b.y + 20) {
                m.y = b.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              }
              // Húc đầu từ dưới lên
              else if (m.vy < 0 && m.y <= b.y + b.h && m.y >= b.y + b.h - 20) {
                m.y = b.y + b.h;
                m.vy = 2.5;
                b.isHit = true;
                b.hitOffsetY = -10;

                if (b.type === 'question') {
                  b.type = 'empty';
                  soundManager.playMarioBrick();
                  if (b.content === 'coin') {
                    addCoin(b.x + b.w / 2, b.y);
                  } else if (b.content === 'mushroom' || b.content === 'fireflower' || b.content === 'star') {
                    itemsRef.current.push({
                      id: Math.random(),
                      type: b.content === 'mushroom' && marioFormRef.current !== 'small' ? 'fireflower' : b.content,
                      x: b.x + 6,
                      y: b.y - 36,
                      w: 36,
                      h: 36,
                      vx: 1.8,
                      vy: -3.5,
                      isAlive: true,
                    });
                    soundManager.playPowerup();
                  }
                } else if (b.type === 'brick') {
                  if (marioFormRef.current !== 'small') {
                    b.y = 9999;
                    soundManager.playMarioBrick();
                    addParticles(b.x + b.w / 2, b.y + b.h / 2, 10, '#b45309', true);
                    addScore(50);
                  } else {
                    soundManager.playMarioBrick();
                  }
                }
              }
            }
          });

          pipesRef.current.forEach(p => {
            if (m.x + m.w > p.x + 3 && m.x < p.x + p.w - 3) {
              if (m.vy >= 0 && m.y + m.h >= p.y && m.y + m.h <= p.y + 20) {
                m.y = p.y - m.h;
                m.vy = 0;
                m.isGrounded = true;
              }
            }
          });

          // Rơi xuống vực
          if (m.y > CANVAS_HEIGHT + 60) {
            damageMario();
          }

          // Cột cờ chiến thắng
          const fp = flagpoleRef.current;
          if (m.x + m.w >= fp.x && m.x <= fp.x + 18 && m.y + m.h >= fp.y && m.y <= fp.y + fp.h) {
            m.isFlagpoleSliding = true;
            m.vx = 0;
            m.vy = 0;
            m.x = fp.x - 12;
            soundManager.playMarioFlag();
            const poleHeightRatio = Math.max(0, (fp.y + fp.h - m.y) / fp.h);
            const flagPts = Math.round(poleHeightRatio * 5000 + 500);
            addScore(flagPts, fp.x, m.y);
          }

          // Rìu cắt cầu Boss (Màn 4)
          if (axeRef.current && axeRef.current.active) {
            const ax = axeRef.current;
            if (m.x + m.w >= ax.x && m.x <= ax.x + 36 && m.y + m.h >= ax.y && m.y <= ax.y + 50) {
              ax.active = false;
              bridgeBlocksRef.current.forEach((blk, idx) => {
                setTimeout(() => {
                  blk.y = 9999;
                  soundManager.playMarioBrick();
                  addParticles(blk.x + 24, GROUND_Y, 8, '#ea580c');
                }, idx * 75);
              });
              const bowser = enemiesRef.current.find(e => e.type === 'bowser');
              if (bowser) {
                setTimeout(() => {
                  bowser.vy = 9;
                  soundManager.playMarioDie();
                  addScore(8000, bowser.x, bowser.y);
                  confetti({ particleCount: 120, spread: 90 });
                  setGameState('stage_clear');
                }, bridgeBlocksRef.current.length * 75 + 300);
              }
            }
          }

          // Animation Frames
          if (!m.isGrounded) {
            m.animFrame = 3;
          } else if (Math.abs(m.vx) > 0.2) {
            m.animTimer += dt * (Math.abs(m.vx) * 3);
            m.animFrame = Math.floor(m.animTimer) % 3;
          } else {
            m.animFrame = 0;
          }

          // Camera cuộn mượt (Sử dụng tỷ lệ 0.38 của ARENA_WIDTH 960px)
          const targetCamX = m.x - ARENA_WIDTH * 0.38;
          if (targetCamX > cameraXRef.current) {
            cameraXRef.current = targetCamX;
          }
          if (cameraXRef.current > worldLengthRef.current - ARENA_WIDTH) {
            cameraXRef.current = worldLengthRef.current - ARENA_WIDTH;
          }
        }

        // 2. UPDATE ITEMS
        itemsRef.current.forEach(item => {
          if (!item.isAlive) return;
          item.vy += 26 * dt;
          item.x += item.vx;
          item.y += item.vy;

          if (item.y + item.h >= GROUND_Y) {
            item.y = GROUND_Y - item.h;
            item.vy = item.type === 'star' ? -8.5 : 0;
          }

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
              starTimerRef.current = 12;
              soundManager.playPowerup();
              addFloater(m.x + m.w / 2, m.y - 20, 'INVINCIBLE STAR!', '#fde047');
              addScore(1000, item.x, item.y);
            }
          }
        });

        // 3. UPDATE ENEMIES
        enemiesRef.current.forEach(en => {
          if (!en.isAlive) return;
          if (en.x > cameraXRef.current + ARENA_WIDTH + 150 || en.x < cameraXRef.current - 200) return;

          if (en.type === 'goomba' || en.type === 'koopa') {
            if (!en.isStomped) {
              en.vy += 26 * dt;
              en.x += en.vx;
              en.y += en.vy;

              if (en.y + en.h >= GROUND_Y) {
                en.y = GROUND_Y - en.h;
                en.vy = 0;
              }

              pipesRef.current.forEach(p => {
                if (en.x + en.w > p.x && en.x < p.x + p.w && en.y + en.h > p.y) {
                  en.vx = -en.vx;
                  en.facing = en.vx > 0 ? 'right' : 'left';
                }
              });

              if (!m.isDead && m.x + m.w > en.x + 4 && m.x < en.x + en.w - 4 && m.y + m.h > en.y + 4 && m.y < en.y + en.h) {
                if (isStarRef.current) {
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 12, '#f59e0b');
                  addScore(400, en.x, en.y);
                } else if (m.vy > 0 && m.y + m.h <= en.y + 24) {
                  m.vy = -10.5;
                  soundManager.playMarioStomp();
                  if (en.type === 'goomba') {
                    en.isStomped = true;
                    en.h = 14;
                    en.y += 30;
                    addScore(200, en.x, en.y);
                    setTimeout(() => { en.isAlive = false; }, 400);
                  } else if (en.type === 'koopa') {
                    if (!en.isShell) {
                      en.isShell = true;
                      en.h = 36;
                      en.y += 26;
                      en.vx = 0;
                      addScore(200, en.x, en.y);
                    } else if (en.vx === 0) {
                      en.vx = m.facing === 'right' ? 9.5 : -9.5;
                      soundManager.playMarioKick();
                    } else {
                      en.vx = 0;
                    }
                  }
                } else {
                  if (en.isShell && en.vx === 0) {
                    en.vx = m.x < en.x ? 9.5 : -9.5;
                    soundManager.playMarioKick();
                  } else {
                    damageMario();
                  }
                }
              }
            } else if (en.isShell && Math.abs(en.vx) > 0.1) {
              en.x += en.vx;
              enemiesRef.current.forEach(other => {
                if (other.id !== en.id && other.isAlive && !other.isStomped) {
                  if (en.x + en.w > other.x && en.x < other.x + other.w && en.y + en.h > other.y && en.y < other.y + other.h) {
                    other.isAlive = false;
                    soundManager.playMarioKick();
                    addParticles(other.x + other.w / 2, other.y + other.h / 2, 10, '#ef4444');
                    addScore(400, other.x, other.y);
                  }
                }
              });
            }
          } else if (en.type === 'bowser') {
            en.animTimer += dt;
            en.shootCooldown = (en.shootCooldown || 2.0) - dt;
            if (en.shootCooldown <= 0) {
              en.shootCooldown = 2.4;
              fireballsRef.current.push({
                x: en.x - 12,
                y: en.y + 36,
                vx: -7.2,
                vy: 0,
                radius: 12,
                isAlive: true,
                isEnemy: true,
              });
              soundManager.playMarioFireball();
            }

            if (Math.sin(en.animTimer * 2) > 0.8 && en.y >= GROUND_Y - en.h) {
              en.vy = -7.5;
            }
            en.vy += 26 * dt;
            en.y += en.vy;
            if (en.y + en.h >= GROUND_Y) {
              en.y = GROUND_Y - en.h;
              en.vy = 0;
            }

            if (!m.isDead && m.x + m.w > en.x && m.x < en.x + en.w && m.y + m.h > en.y && m.y < en.y + en.h) {
              if (isStarRef.current) {
                en.hp = (en.hp || 5) - 1;
                soundManager.playMarioKick();
                if (en.hp <= 0) {
                  en.isAlive = false;
                  addScore(8000, en.x, en.y);
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
          fb.vy += 26 * dt;
          fb.y += fb.vy;

          if (fb.y + fb.radius >= GROUND_Y) {
            fb.y = GROUND_Y - fb.radius;
            fb.vy = -7.2;
          }

          if (fb.x > cameraXRef.current + ARENA_WIDTH + 40 || fb.x < cameraXRef.current - 40) {
            fb.isAlive = false;
          }

          if (!fb.isEnemy) {
            enemiesRef.current.forEach(en => {
              if (en.isAlive && !en.isStomped) {
                if (fb.x + fb.radius > en.x && fb.x - fb.radius < en.x + en.w && fb.y + fb.radius > en.y && fb.y - fb.radius < en.y + en.h) {
                  fb.isAlive = false;
                  en.isAlive = false;
                  soundManager.playMarioKick();
                  addParticles(en.x + en.w / 2, en.y + en.h / 2, 10, '#f97316');
                  addScore(200, en.x, en.y);
                }
              }
            });
          } else {
            if (!m.isDead && fb.x + fb.radius > m.x && fb.x - fb.radius < m.x + m.w && fb.y + fb.radius > m.y && fb.y - fb.radius < m.y + m.h) {
              fb.isAlive = false;
              damageMario();
            }
          }
        });

        setTimeLeft(prev => {
          const next = Math.max(0, prev - dt);
          if (next <= 0 && !m.isDead) damageMario();
          return next;
        });
      }

      // 2. RENDER GRAPHICS
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const camX = cameraXRef.current;

      // HẬU CẢNH CHI TIẾT SỐNG ĐỘNG TOÀN MÀN HÌNH WIDESCREEN
      if (currentStage === 4) {
        // Lâu đài dung nham Bowser
        const lavaSky = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
        lavaSky.addColorStop(0, '#09050e');
        lavaSky.addColorStop(0.5, '#1e0816');
        lavaSky.addColorStop(1, '#450a0a');
        ctx.fillStyle = lavaSky;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

        // Vách đá nham thạch đen
        ctx.fillStyle = '#170b14';
        for (let i = 0; i < 10; i++) {
          const hX = (i * 380 - camX * 0.3) % (worldLengthRef.current + 200);
          ctx.beginPath();
          ctx.moveTo(hX, GROUND_Y);
          ctx.lineTo(hX + 120, 180);
          ctx.lineTo(hX + 240, GROUND_Y);
          ctx.fill();
        }
      } else if (currentStage === 2) {
        // Hang đá ngầm xanh ngọc
        const caveGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
        caveGrad.addColorStop(0, '#040b17');
        caveGrad.addColorStop(0.7, '#07162c');
        caveGrad.addColorStop(1, '#0c274c');
        ctx.fillStyle = caveGrad;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

        // Tinh thể pha lê lấp lánh trên trần hang
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 20; i++) {
          const cx = (i * 240 - camX * 0.2) % (worldLengthRef.current + 200);
          ctx.beginPath();
          ctx.moveTo(cx, 0);
          ctx.lineTo(cx + 12, 45);
          ctx.lineTo(cx + 24, 0);
          ctx.fill();
        }
      } else {
        // Màn 1 & 3: Bầu trời xanh nhiệt đới rực rỡ nắng vàng
        const skyGrad = ctx.createLinearGradient(0, 0, 0, ARENA_HEIGHT);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.35, '#38bdf8');
        skyGrad.addColorStop(0.75, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

        // Dãy núi xa xăm tuyết phủ (Distant Snowy Mountains - Parallax cực đẹp)
        for (let i = 0; i < 7; i++) {
          const mX = (i * 540 - camX * 0.12) % (worldLengthRef.current + 400);
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(mX - 120, GROUND_Y);
          ctx.lineTo(mX + 60, 140);
          ctx.lineTo(mX + 240, GROUND_Y);
          ctx.fill();

          // Chóp tuyết trắng đỉnh núi
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(mX + 60, 140);
          ctx.lineTo(mX + 18, 205);
          ctx.lineTo(mX + 45, 195);
          ctx.lineTo(mX + 60, 215);
          ctx.lineTo(mX + 80, 195);
          ctx.lineTo(mX + 102, 205);
          ctx.closePath();
          ctx.fill();
        }

        // Đồi cỏ xanh nhiều tầng Super Mario có sọc bóng & mắt cười ngộ nghĩnh
        for (let i = 0; i < 8; i++) {
          const hillX = (i * 520 - camX * 0.28) % (worldLengthRef.current + 400);
          // Đồi lớn
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.ellipse(hillX, GROUND_Y, 150, 110, 0, Math.PI, 0);
          ctx.fill();

          // Sọc đổ bóng xanh đậm
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(hillX - 30, GROUND_Y - 25, 22, 12, 0, 0, Math.PI * 2);
          ctx.ellipse(hillX + 40, GROUND_Y - 45, 18, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mắt đồi hoạt hình Super Mario
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(hillX - 10, GROUND_Y - 75, 5, 12);
          ctx.fillRect(hillX + 5, GROUND_Y - 75, 5, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(hillX - 9, GROUND_Y - 74, 2, 4);
          ctx.fillRect(hillX + 6, GROUND_Y - 74, 2, 4);
        }

        // Mây trắng hoạt hình Super Mario có mắt cười
        for (let i = 0; i < 10; i++) {
          const cX = (i * 420 - camX * 0.2) % (worldLengthRef.current + 400);
          const cY = 70 + (i % 3) * 45;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cX, cY, 34, 0, Math.PI * 2);
          ctx.arc(cX + 30, cY - 16, 42, 0, Math.PI * 2);
          ctx.arc(cX + 68, cY, 34, 0, Math.PI * 2);
          ctx.fill();

          // 2 Mắt đen tròn có chấm phản quang
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cX + 22, cY - 8, 4.5, 12);
          ctx.fillRect(cX + 42, cY - 8, 4.5, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cX + 23, cY - 7, 2, 4);
          ctx.fillRect(cX + 43, cY - 7, 2, 4);
        }

        // Bụi cây xanh ven đường có chùm quả đỏ
        for (let i = 0; i < 12; i++) {
          const bushX = (i * 360 - camX * 0.5) % (worldLengthRef.current + 300);
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(bushX, GROUND_Y - 8, 22, 0, Math.PI * 2);
          ctx.arc(bushX + 24, GROUND_Y - 14, 26, 0, Math.PI * 2);
          ctx.arc(bushX + 48, GROUND_Y - 8, 22, 0, Math.PI * 2);
          ctx.fill();
          // Chùm quả mọng đỏ
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(bushX + 16, GROUND_Y - 16, 3.5, 0, Math.PI * 2);
          ctx.arc(bushX + 32, GROUND_Y - 20, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(-camX, 0);

      // VẼ MẶT ĐẤT VÀ KHỐI ĐỊA HÌNH 3D CHI TIẾT
      blocksRef.current.forEach(b => {
        if (b.x + b.w < camX - 60 || b.x > camX + ARENA_WIDTH + 60) return;

        const renderY = b.y + (b.hitOffsetY || 0);
        if (b.hitOffsetY && b.hitOffsetY < 0) {
          b.hitOffsetY += 1.2;
          if (b.hitOffsetY > 0) b.hitOffsetY = 0;
        }

        if (b.type === 'ground') {
          // Lớp đất modular 3D nhiều sắc độ
          const gGrad = ctx.createLinearGradient(b.x, renderY, b.x, renderY + b.h);
          gGrad.addColorStop(0, currentStage === 4 ? '#27272a' : currentStage === 2 ? '#1e293b' : '#b45309');
          gGrad.addColorStop(1, currentStage === 4 ? '#09090b' : currentStage === 2 ? '#0f172a' : '#78350f');
          ctx.fillStyle = gGrad;
          ctx.fillRect(b.x, renderY, b.w, b.h);

          // Thảm cỏ xanh mượt mà trên mặt có hoa cúc dại
          if (currentStage === 1 || currentStage === 3) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(b.x, renderY, b.w, 14);
            // Từng khóm cỏ nhọn
            ctx.fillStyle = '#16a34a';
            for (let cx = b.x; cx < b.x + b.w; cx += 12) {
              ctx.beginPath();
              ctx.moveTo(cx, renderY + 14);
              ctx.lineTo(cx + 6, renderY + 22);
              ctx.lineTo(cx + 12, renderY + 14);
              ctx.fill();
            }
            // Hoa cúc vàng nhỏ trên thảm cỏ
            if (Math.floor(b.x) % 96 === 0) {
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(b.x + 24, renderY + 5, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(b.x + 24, renderY + 5, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Viền đá nứt phong trần 3D
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
        } else if (b.type === 'question') {
          // KHỐI HỎI CHẤM [?] MẠ VÀNG 3D RỰC RỠ CỰC ĐẸP
          const qGrad = ctx.createLinearGradient(b.x, renderY, b.x + b.w, renderY + b.h);
          qGrad.addColorStop(0, '#fef08a');
          qGrad.addColorStop(0.3, '#facc15');
          qGrad.addColorStop(0.7, '#eab308');
          qGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = qGrad;
          ctx.fillRect(b.x, renderY, b.w, b.h);

          // Khung viền vát 3D dập nổi
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 3;
          ctx.strokeRect(b.x, renderY, b.w, b.h);

          // Vệt sáng chéo kim loại phản quang (Metallic Shimmer)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.moveTo(b.x + 4, renderY + 4);
          ctx.lineTo(b.x + 18, renderY + 4);
          ctx.lineTo(b.x + 4, renderY + 18);
          ctx.closePath();
          ctx.fill();

          // 4 Đinh tán đồng 4 góc
          ctx.fillStyle = '#713f12';
          ctx.fillRect(b.x + 4, renderY + 4, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + 4, 4, 4);
          ctx.fillRect(b.x + 4, renderY + b.h - 8, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + b.h - 8, 4, 4);

          // Dấu hỏi màu nâu đậm nổi khối 3D rõ nét
          ctx.fillStyle = '#78350f';
          ctx.font = 'black 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', b.x + b.w / 2, renderY + b.h / 2 + 1);
        } else if (b.type === 'brick') {
          // Khối gạch nâu đất nung cổ điển có vân nổi
          ctx.fillStyle = currentStage === 4 ? '#991b1b' : currentStage === 2 ? '#334155' : '#b45309';
          ctx.fillRect(b.x, renderY, b.w, b.h);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.beginPath();
          ctx.moveTo(b.x, renderY + b.h / 2);
          ctx.lineTo(b.x + b.w, renderY + b.h / 2);
          ctx.moveTo(b.x + b.w / 2, renderY);
          ctx.lineTo(b.x + b.w / 2, renderY + b.h / 2);
          ctx.moveTo(b.x + b.w / 4, renderY + b.h / 2);
          ctx.lineTo(b.x + b.w / 4, renderY + b.h);
          ctx.moveTo(b.x + (b.w * 3) / 4, renderY + b.h / 2);
          ctx.lineTo(b.x + (b.w * 3) / 4, renderY + b.h);
          ctx.stroke();
        } else if (b.type === 'empty') {
          // Khối sắt xám đã ăn hết đồ
          ctx.fillStyle = '#71717a';
          ctx.fillRect(b.x, renderY, b.w, b.h);
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x, renderY, b.w, b.h);
          ctx.fillStyle = '#27272a';
          ctx.fillRect(b.x + 4, renderY + 4, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + 4, 4, 4);
          ctx.fillRect(b.x + 4, renderY + b.h - 8, 4, 4);
          ctx.fillRect(b.x + b.w - 8, renderY + b.h - 8, 4, 4);
        }
      });

      // VẼ ĐƯỜNG ỐNG NƯỚC XANH 3D CỰC ĐẸP (Glossy Warp Pipes)
      pipesRef.current.forEach(p => {
        if (p.x + p.w < camX - 60 || p.x > camX + ARENA_WIDTH + 60) return;

        // Cây ăn thịt Piranha
        if (p.hasPiranha) {
          const plantY = p.y - 40 + (Math.sin(p.piranhaTimer || 0) > 0 ? 0 : 44);
          p.piranhaTimer = (p.piranhaTimer || 0) + 0.05;

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, plantY + 16, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2 - 6, plantY + 10, 4, 0, Math.PI * 2);
          ctx.arc(p.x + p.w / 2 + 6, plantY + 18, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x + p.w / 2 - 10, plantY + 22, 20, 5);
        }

        // Thân ống nước đổ bóng trụ tròn 3D
        const pGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
        pGrad.addColorStop(0, '#15803d');
        pGrad.addColorStop(0.22, '#4ade80');
        pGrad.addColorStop(0.7, '#22c55e');
        pGrad.addColorStop(1, '#14532d');
        ctx.fillStyle = pGrad;
        ctx.fillRect(p.x + 4, p.y + 22, p.w - 8, p.h - 22);

        // Miệng vành ống nước 3D có gờ nổi
        ctx.fillRect(p.x, p.y, p.w, 24);
        ctx.strokeStyle = '#052e16';
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.w, 24);
        ctx.strokeRect(p.x + 4, p.y + 24, p.w - 8, p.h - 24);
      });

      // VẼ RÌU CẮT CẦU (MÀN 4)
      if (axeRef.current && axeRef.current.active) {
        const ax = axeRef.current;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(ax.x + 18, ax.y + 18, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ax.x + 14, ax.y + 24, 8, 26);
      }

      // VẼ CỘT CỜ CHIẾN THẮNG & LÂU ĐÀI NGUY NGA TRÁNG LỆ
      const fp = flagpoleRef.current;
      // Bệ đá 3 tầng đỡ cột cờ
      ctx.fillStyle = '#64748b';
      ctx.fillRect(fp.x - 14, GROUND_Y - 14, 36, 14);
      ctx.fillRect(fp.x - 8, GROUND_Y - 24, 24, 10);

      // Thân cột cờ đồng thau 3D ánh kim
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(fp.x + 2, fp.y, 6, fp.h - 24);

      // Quả cầu vàng đỉnh cột cờ
      const orbGrad = ctx.createRadialGradient(fp.x + 5, fp.y, 2, fp.x + 5, fp.y, 14);
      orbGrad.addColorStop(0, '#fef08a');
      orbGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(fp.x + 5, fp.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Lá cờ xanh uốn lượn mượt mà khi trượt
      const flagY = m.isFlagpoleSliding || m.walkToCastle ? fp.y + fp.h - 60 : fp.flagY;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(fp.x + 8, flagY);
      ctx.lineTo(fp.x + 58, flagY + 22);
      ctx.lineTo(fp.x + 8, flagY + 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // LÂU ĐÀI ĐÍCH ĐẾN NGUY NGA TRUNG CỔ
      const cst = castleRef.current;
      const castleGrad = ctx.createLinearGradient(cst.x, cst.y, cst.x + cst.w, cst.y + cst.h);
      castleGrad.addColorStop(0, currentStage === 4 ? '#450a0a' : '#64748b');
      castleGrad.addColorStop(1, currentStage === 4 ? '#1a0404' : '#334155');
      ctx.fillStyle = castleGrad;
      ctx.fillRect(cst.x, cst.y, cst.w, cst.h);

      // Tháp canh 2 bên có chóp nón đỏ rực
      const towerW = 50;
      ctx.fillRect(cst.x - 22, cst.y - 36, towerW, cst.h + 36);
      ctx.fillRect(cst.x + cst.w - 28, cst.y - 36, towerW, cst.h + 36);

      // Mái nón chóp tháp đỏ
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(cst.x - 26, cst.y - 36);
      ctx.lineTo(cst.x + 3, cst.y - 88);
      ctx.lineTo(cst.x + 32, cst.y - 36);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cst.x + cst.w - 32, cst.y - 36);
      ctx.lineTo(cst.x + cst.w - 3, cst.y - 88);
      ctx.lineTo(cst.x + cst.w + 26, cst.y - 36);
      ctx.closePath();
      ctx.fill();

      // Cờ đỏ tung bay trên đỉnh tháp
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cst.x + 2, cst.y - 110, 2.5, 22);
      ctx.beginPath();
      ctx.moveTo(cst.x + 4.5, cst.y - 110);
      ctx.lineTo(cst.x + 28, cst.y - 98);
      ctx.lineTo(cst.x + 4.5, cst.y - 88);
      ctx.fill();

      // Răng cưa pháo đài trung tâm
      ctx.fillStyle = castleGrad;
      for (let bx = cst.x + 32; bx < cst.x + cst.w - 32; bx += 32) {
        ctx.fillRect(bx, cst.y - 20, 20, 20);
      }

      // Cổng vòm gỗ kiên cố của Lâu Đài
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cst.x + cst.w / 2, cst.y + cst.h - 60, 36, Math.PI, 0);
      ctx.fillRect(cst.x + cst.w / 2 - 36, cst.y + cst.h - 60, 72, 60);
      ctx.fill();

      // Đèn đuốc phát sáng lung linh 2 bên cổng
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cst.x + cst.w / 2 - 48, cst.y + cst.h - 50, 7, 0, Math.PI * 2);
      ctx.arc(cst.x + cst.w / 2 + 48, cst.y + cst.h - 50, 7, 0, Math.PI * 2);
      ctx.fill();

      // VẼ VẬT PHẨM (NẤM, HOA LỬA, SAO)
      itemsRef.current.forEach(item => {
        if (!item.isAlive) return;
        if (item.type === 'mushroom') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 16, 17, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 8, 5, 0, Math.PI * 2);
          ctx.arc(item.x + 6, item.y + 14, 4, 0, Math.PI * 2);
          ctx.arc(item.x + item.w - 6, item.y + 14, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(item.x + 9, item.y + 16, item.w - 18, 16);
          ctx.fillStyle = '#000000';
          ctx.fillRect(item.x + 13, item.y + 19, 3, 7);
          ctx.fillRect(item.x + item.w - 16, item.y + 19, 3, 7);
        } else if (item.type === 'fireflower') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 14, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(item.x + item.w / 2, item.y + 14, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(item.x + item.w / 2 - 3, item.y + 24, 6, 12);
        } else if (item.type === 'star') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          const cx = item.x + item.w / 2;
          const cy = item.y + item.h / 2;
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 17 + cx, -Math.sin((18 + i * 72) * Math.PI / 180) * 17 + cy);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 7.5 + cx, -Math.sin((54 + i * 72) * Math.PI / 180) * 7.5 + cy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx - 3.5, cy - 4, 2.5, 8);
          ctx.fillRect(cx + 1, cy - 4, 2.5, 8);
        }
      });

      // VẼ KẺ ĐỊCH (GOOMBA, KOOPA, BOWSER)
      enemiesRef.current.forEach(en => {
        if (!en.isAlive) return;

        if (en.type === 'goomba') {
          if (en.isStomped) {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(en.x, en.y, en.w, 14);
          } else {
            // Nấm Goomba to tròn có nanh nhọn & mắt giận dữ
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(en.x + en.w / 2, en.y + 18, 20, Math.PI, 0);
            ctx.lineTo(en.x + en.w, en.y + 32);
            ctx.lineTo(en.x, en.y + 32);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(en.x + 8, en.y + 28, en.w - 16, 10);

            // Mắt to dữ dằn & Lông mày xếch
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(en.x + 9, en.y + 14, 7, 11);
            ctx.fillRect(en.x + en.w - 16, en.y + 14, 7, 11);
            ctx.fillStyle = '#000000';
            ctx.fillRect(en.x + 12, en.y + 16, 4, 9);
            ctx.fillRect(en.x + en.w - 15, en.y + 16, 4, 9);

            // 2 Nanh trắng nhọn
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(en.x + 11, en.y + 32);
            ctx.lineTo(en.x + 14, en.y + 26);
            ctx.lineTo(en.x + 17, en.y + 32);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(en.x + en.w - 17, en.y + 32);
            ctx.lineTo(en.x + en.w - 14, en.y + 26);
            ctx.lineTo(en.x + en.w - 11, en.y + 32);
            ctx.fill();

            // 2 Chân bước
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(en.x + 3, en.y + 36, 14, 8);
            ctx.fillRect(en.x + en.w - 17, en.y + 36, 14, 8);
          }
        } else if (en.type === 'koopa') {
          if (en.isShell) {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.arc(en.x + en.w / 2, en.y + 18, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(en.x + en.w / 2, en.y + 32, 17, 21, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#facc15';
            const headX = en.facing === 'left' ? en.x + 6 : en.x + en.w - 6;
            ctx.beginPath();
            ctx.arc(headX, en.y + 14, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.fillRect(headX + (en.facing === 'left' ? -5 : 3), en.y + 10, 4, 7);

            ctx.fillStyle = '#f97316';
            ctx.fillRect(en.x + 3, en.y + 52, 14, 10);
            ctx.fillRect(en.x + en.w - 17, en.y + 52, 14, 10);
          }
        } else if (en.type === 'bowser') {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(en.x + 18, en.y + 20, 60, 68);
          ctx.fillStyle = '#ffffff';
          for (let sp = 0; sp < 4; sp++) {
            ctx.beginPath();
            ctx.moveTo(en.x + 78, en.y + 24 + sp * 16);
            ctx.lineTo(en.x + 94, sp * 16 + 30 + en.y);
            ctx.lineTo(en.x + 78, sp * 16 + 36 + en.y);
            ctx.fill();
          }
          ctx.fillStyle = '#eab308';
          ctx.fillRect(en.x, en.y + 14, 38, 38);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(en.x + 4, en.y, 8, 16);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(en.x + 10, en.y + 22, 7, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(en.x + 24, en.y + 6, 26, 16);
        }
      });

      // VẼ CẦU LỬA
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

      // VẼ NHÂN VẬT MARIO CHÂN THỰC, SẮC NÉT, CỠ LỚN
      if (!m.isDead || (m.isDead && m.y < CANVAS_HEIGHT + 80)) {
        const isFlickering = (invulnerableTimerRef.current > 0 && Math.floor(now / 50) % 2 === 0);
        if (!isFlickering) {
          ctx.save();
          ctx.translate(m.x + m.w / 2, m.y + m.h / 2);
          if (m.facing === 'left') ctx.scale(-1, 1);

          const starHue = isStarRef.current ? (Math.floor(now / 40) * 60) % 360 : null;
          const shirtColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#ffffff' : '#dc2626';
          const overallsColor = starHue !== null ? `hsl(${(starHue + 180) % 360}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#dc2626' : '#2563eb';
          const capColor = starHue !== null ? `hsl(${starHue}, 100%, 50%)` : marioFormRef.current === 'fire' ? '#ffffff' : '#dc2626';

          const isSuper = marioFormRef.current !== 'small';
          const bodyYOffset = isSuper ? -8 : 0;

          // 1. Mũ đỏ & Vành mũ
          ctx.fillStyle = capColor;
          ctx.beginPath();
          ctx.ellipse(0, -m.h / 2 + 11, isSuper ? 16 : 13, isSuper ? 12 : 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(0, -m.h / 2 + 14, isSuper ? 18 : 15, 6);
          // Huy hiệu tròn trắng chữ M
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-2, -m.h / 2 + 9, isSuper ? 5.5 : 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.font = `bold ${isSuper ? 8 : 7}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('M', -2, -m.h / 2 + 12);

          // 2. Khuôn mặt, Mũi to tròn, Ria mép rậm & Mắt xanh
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -m.h / 2 + 22 + bodyYOffset, isSuper ? 12 : 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(isSuper ? 11 : 9, -m.h / 2 + 22 + bodyYOffset, isSuper ? 6 : 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2563eb';
          ctx.fillRect(isSuper ? 4 : 3, -m.h / 2 + 18 + bodyYOffset, 3.5, 6);

          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(isSuper ? 8 : 6, -m.h / 2 + 27 + bodyYOffset, isSuper ? 9 : 7.5, isSuper ? 5 : 4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#78350f';
          ctx.fillRect(-m.h / 4, -m.h / 2 + 20 + bodyYOffset, 5, 11);

          // 3. Áo & Quần yếm xanh
          ctx.fillStyle = shirtColor;
          ctx.fillRect(-m.w / 2 + 5, -m.h / 2 + 30 + bodyYOffset, m.w - 10, isSuper ? 22 : 14);

          ctx.fillStyle = overallsColor;
          ctx.fillRect(-m.w / 2 + 6, -m.h / 2 + 36 + bodyYOffset, m.w - 12, isSuper ? 24 : 16);

          // 2 Nút yếm vàng đồng
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(-m.w / 4, -m.h / 2 + 39 + bodyYOffset, 2.8, 0, Math.PI * 2);
          ctx.arc(m.w / 4 - 3, -m.h / 2 + 39 + bodyYOffset, 2.8, 0, Math.PI * 2);
          ctx.fill();

          // 4. Bàn tay đeo găng trắng
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          if (m.animFrame === 3) {
            ctx.arc(m.w / 2 - 2, -m.h / 2 + 6, 6, 0, Math.PI * 2);
            ctx.arc(-m.w / 2 + 6, -m.h / 2 + 36, 6, 0, Math.PI * 2);
          } else {
            ctx.arc(m.w / 2 - 2, -m.h / 2 + 38 + bodyYOffset, 6, 0, Math.PI * 2);
            ctx.arc(-m.w / 2 + 6, -m.h / 2 + 38 + bodyYOffset, 6, 0, Math.PI * 2);
          }
          ctx.fill();

          // 5. Đôi ủng da nâu
          ctx.fillStyle = '#78350f';
          if (m.animFrame === 1) {
            ctx.fillRect(-m.w / 2 + 2, m.h / 2 - 11, 14, 11);
            ctx.fillRect(m.w / 2 - 14, m.h / 2 - 7, 14, 7);
          } else if (m.animFrame === 2) {
            ctx.fillRect(-m.w / 2 + 6, m.h / 2 - 7, 14, 7);
            ctx.fillRect(m.w / 2 - 11, m.h / 2 - 11, 14, 11);
          } else {
            ctx.fillRect(-m.w / 2 + 3, m.h / 2 - 10, 14, 10);
            ctx.fillRect(m.w / 2 - 16, m.h / 2 - 10, 14, 10);
          }

          ctx.restore();
        }
      }

      // VẼ HIỆU ỨNG HẠT VÀ CHỮ NỔI
      particlesRef.current.forEach((pt, pIdx) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.35;
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
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      });

      ctx.restore(); // Kết thúc dịch chuyển Camera

      // BANNER HUD ARCADE ĐẲNG CẤP TRÊN ĐẦU TOÀN MÀN HÌNH WIDESCREEN
      ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
      ctx.fillRect(0, 0, ARENA_WIDTH, 42);

      // Điểm số & Tên nhân vật
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'black 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MARIO', 30, 26);
      ctx.fillStyle = '#facc15';
      ctx.fillText(`${scoreRef.current.toString().padStart(6, '0')}`, 95, 26);

      // Tiền xu vàng
      ctx.fillStyle = '#facc15';
      ctx.fillText(`🪙 x${coinsRef.current.toString().padStart(2, '0')}`, 235, 26);

      // Màn chơi
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('WORLD', 380, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${currentWorld}-${currentStage}`, 445, 26);

      // Thời gian còn lại
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('TIME', 560, 26);
      ctx.fillStyle = timeLeft < 50 ? '#ef4444' : '#f8fafc';
      ctx.fillText(`${Math.ceil(timeLeft)}`, 610, 26);

      // Số mạng sống
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`♥ x ${livesRef.current}`, 715, 26);

      // Huy hiệu hình thái Mario
      const curForm = isStarRef.current ? '⭐ STAR' : marioFormRef.current === 'fire' ? '🔥 FIRE' : marioFormRef.current === 'super' ? '🍄 SUPER' : '👨 SMALL';
      const formColor = isStarRef.current ? '#facc15' : marioFormRef.current === 'fire' ? '#ef4444' : marioFormRef.current === 'super' ? '#38bdf8' : '#94a3b8';
      ctx.fillStyle = formColor;
      ctx.font = 'black 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(curForm, ARENA_WIDTH - 30, 26);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addCoin, addScore, currentStage, currentWorld, damageMario, highScore, timeLeft]);

  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-slate-950 overflow-hidden p-1 sm:p-2">
      {/* Khung Canvas Trò Chơi Widescreen 16:9 Maximize Toàn Vùng Viewport */}
      <div className="relative w-full max-w-[min(98vw,1340px)] aspect-[16/9] bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Thanh Điều Khiển Tiện Ích Trong Trận Đấu */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-slate-950/75 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => startNewGame(currentStage)}
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-gray-300 hover:text-white transition active:scale-90 cursor-pointer"
            title="Chơi lại ván này"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev)}
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-gray-300 hover:text-white transition active:scale-90 cursor-pointer"
            title={gameState === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {gameState === 'paused' ? (
              <Play className="w-4 h-4 text-emerald-400" />
            ) : (
              <Pause className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>

        {/* Chọn Màn Chơi Nhanh Trong Trận Đấu */}
        <div className="absolute top-2 right-24 z-20 hidden md:flex items-center gap-1 bg-slate-950/75 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {[1, 2, 3, 4].map(stg => (
            <button
              key={stg}
              onClick={() => {
                soundManager.playButtonClick();
                startNewGame(stg);
              }}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentStage === stg
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              1-{stg}
            </button>
          ))}
        </div>

        {/* Nút Điều Khiển Cảm Ứng Ảo Trên Thiết Bị Di Động */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:hidden z-30">
          <div />
          <div className="flex items-end justify-between w-full pointer-events-auto">
            {/* D-Pad 3 Hướng (Trái, Cúi, Phải) */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
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

            {/* Nút B (Bắn/Chạy) & A (Nhảy) */}
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
                    marioRef.current.vy = -14.2;
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

        {/* MODAL CHIẾN THẮNG MÀN CHƠI (STAGE CLEAR) CAO CẤP */}
        {gameState === 'stage_clear' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-400 mb-3 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              STAGE CLEAR!
            </h3>
            <p className="text-sm sm:text-base text-gray-200 font-bold mb-2">
              Chúc mừng bạn đã hoàn thành Màn {currentWorld}-{currentStage}!
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 font-mono">
              Điểm số: <span className="text-amber-300 font-bold">{score.toLocaleString()}</span> • Tiền xu: <span className="text-cyan-300 font-bold">{coins}</span>
            </p>
            <button
              onClick={() => {
                const nextStg = currentStage < 4 ? currentStage + 1 : 1;
                startNewGame(nextStg);
              }}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <span>{currentStage < 4 ? `Tiến Vào Màn 1-${currentStage + 1}` : 'Chơi Lại Từ Đầu'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* MODAL THUA CUỘC (GAME OVER) */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-5xl mb-2 animate-bounce">💀</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">
              GAME OVER
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-5">
              Bạn đã hết mạng sống trong hành trình khám phá Vương quốc Nấm!
            </p>
            <button
              onClick={() => startNewGame(1)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
            >
              Thử Lại Từ Màn 1-1
            </button>
          </div>
        )}

        {/* MODAL TẠM DỪNG (PAUSED) */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-4xl mb-2">⏸️</span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-400 mb-1 tracking-wider uppercase">
              TẠM DỪNG TRÒ CHƠI
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mb-5">
              Bấm [P] hoặc nút Tiếp Tục để quay trở lại Vương quốc Nấm
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
