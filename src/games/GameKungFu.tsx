import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 430; // Polished wooden floor baseline
const STAGE_LENGTH_METERS = 100;
const PX_PER_METER = 35; // 3500px total corridor length

type Direction = 'left' | 'right';
type GameState = 'playing' | 'stage_clear' | 'game_over' | 'paused';
type PlayerAction =
  | 'idle'
  | 'walk'
  | 'crouch'
  | 'jump'
  | 'punch'
  | 'kick'
  | 'jump_kick'
  | 'crouch_punch'
  | 'crouch_kick'
  | 'hurt';

interface Knife {
  id: number;
  x: number;
  y: number;
  vx: number;
  angle: number;
  heightType: 'high' | 'low';
  isDeflected: boolean;
}

interface Enemy {
  id: number;
  type: 'gripper' | 'knife_thrower' | 'tom_tom';
  worldX: number;
  y: number;
  dir: Direction;
  speed: number;
  hp: number;
  isGripping: boolean;
  gripTimer: number;
  throwCooldown: number;
  animTimer: number;
  isDead: boolean;
  knockbackVx: number;
  knockbackVy: number;
  rotation: number;
}

interface Boss {
  active: boolean;
  floor: number;
  name: string;
  worldX: number;
  y: number;
  dir: Direction;
  hp: number;
  maxHp: number;
  state: 'idle' | 'walk' | 'attack' | 'hurt' | 'dead';
  stateTimer: number;
  speed: number;
  animTimer: number;
  staffAngle: number;
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

const BOSS_DATA = [
  { floor: 1, name: 'Gậy Thiết Côn (Stick Master)', hp: 8, maxHp: 8, speed: 2.2 },
  { floor: 2, name: 'Boomerang Sát Thủ', hp: 10, maxHp: 10, speed: 2.4 },
  { floor: 3, name: 'Đô Vật Khổng Lồ (Giant)', hp: 12, maxHp: 12, speed: 1.8 },
  { floor: 4, name: 'Pháp Sư Phù Thủy (Wizard)', hp: 14, maxHp: 14, speed: 2.6 },
  { floor: 5, name: 'Chưởng Môn Mr. X', hp: 16, maxHp: 16, speed: 3.0 },
];

export const GameKungFu: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React UI States
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('acegames_kungfu_highscore') || '30000', 10);
    } catch {
      return 30000;
    }
  });
  const [lives, setLives] = useState<number>(3);
  const [floor, setFloor] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(16);
  const [bossHp, setBossHp] = useState<number>(8);
  const [bossMaxHp, setBossMaxHp] = useState<number>(8);
  const [bossName, setBossName] = useState<string>(BOSS_DATA[0].name);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [metersLeft, setMetersLeft] = useState<number>(100);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [isGripped, setIsGripped] = useState<boolean>(false);

  // 60 FPS Loop References
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const floorRef = useRef(floor);
  const gameStateRef = useRef(gameState);

  // Player Thomas State
  const playerRef = useRef({
    worldX: 200,
    y: GROUND_Y,
    vy: 0,
    isGrounded: true,
    dir: 'right' as Direction,
    action: 'idle' as PlayerAction,
    actionTimer: 0,
    maxActionTimer: 0,
    speed: 3.5,
    animTimer: 0,
    hp: 16,
    maxHp: 16,
    invincibleTimer: 0,
    isDead: false,
    deathTimer: 0,
    grippedCount: 0,
    shakeCount: 0,
    lastShakeDir: '' as string,
    // Hit tracking to prevent multiple hits on same enemy per attack swing
    hitEnemiesThisSwing: new Set<number>(),
    hitBossThisSwing: false,
  });

  // Camera & Screen Shake
  const cameraXRef = useRef(0);
  const screenShakeRef = useRef(0);

  // Entities
  const enemiesRef = useRef<Enemy[]>([]);
  const knivesRef = useRef<Knife[]>([]);
  const bossRef = useRef<Boss | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const spawnTimerRef = useRef(0);

  // Keys Tracking
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    punch: boolean;
    kick: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false,
  });

  // Sync references
  useEffect(() => {
    scoreRef.current = score;
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('acegames_kungfu_highscore', score.toString());
      } catch {}
    }
  }, [score, highScore]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    floorRef.current = floor;
  }, [floor]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Floating score text
  const addFloater = (x: number, y: number, text: string, color = '#facc15') => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      life: 45,
    });
  };

  // Combat Particles
  const spawnParticles = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        color,
        size: 3 + Math.random() * 4.5,
        life: 20 + Math.random() * 15,
        maxLife: 35,
      });
    }
  };

  // Break free from grips
  const shakeOffGrips = useCallback(() => {
    const p = playerRef.current;
    if (p.grippedCount === 0) return;

    p.shakeCount++;
    screenShakeRef.current = 6;
    soundManager.playKungFuHit();

    if (p.shakeCount >= 3) {
      // Violent Martial Arts Shockwave
      p.shakeCount = 0;
      p.grippedCount = 0;
      setIsGripped(false);
      soundManager.playKungFuKick();
      screenShakeRef.current = 12;

      // Knock all grabbing enemies away!
      for (const en of enemiesRef.current) {
        if (en.isGripping) {
          en.isGripping = false;
          en.isDead = true;
          en.knockbackVx = Math.random() > 0.5 ? 8.5 : -8.5;
          en.knockbackVy = -8;
          spawnParticles(en.worldX - cameraXRef.current, en.y - 45, '#3b82f6', 20);
          addFloater(en.worldX - cameraXRef.current, en.y - 65, 'HẤT VĂNG!', '#38bdf8');
        }
      }
    }
  }, []);

  // Initialize Floor
  const initFloor = useCallback((targetFloor: number) => {
    const fIdx = Math.max(0, Math.min(4, targetFloor - 1));
    const bData = BOSS_DATA[fIdx];

    playerRef.current = {
      worldX: 200,
      y: GROUND_Y,
      vy: 0,
      isGrounded: true,
      dir: 'right',
      action: 'idle',
      actionTimer: 0,
      maxActionTimer: 0,
      speed: 3.5,
      animTimer: 0,
      hp: 16,
      maxHp: 16,
      invincibleTimer: 60,
      isDead: false,
      deathTimer: 0,
      grippedCount: 0,
      shakeCount: 0,
      lastShakeDir: '',
      hitEnemiesThisSwing: new Set(),
      hitBossThisSwing: false,
    };

    setPlayerHp(16);
    setMetersLeft(STAGE_LENGTH_METERS);
    cameraXRef.current = 0;
    setIsGripped(false);

    // Boss waits at 92 meters
    bossRef.current = {
      active: false,
      floor: targetFloor,
      name: bData.name,
      worldX: 92 * PX_PER_METER,
      y: GROUND_Y,
      dir: 'left',
      hp: bData.hp,
      maxHp: bData.maxHp,
      state: 'idle',
      stateTimer: 0,
      speed: bData.speed,
      animTimer: 0,
      staffAngle: 0,
    };

    setBossHp(bData.hp);
    setBossMaxHp(bData.maxHp);
    setBossName(bData.name);
    setBossActive(false);

    enemiesRef.current = [];
    knivesRef.current = [];
    particlesRef.current = [];
    floatersRef.current = [];
    spawnTimerRef.current = 0;
    setGameState('playing');
  }, []);

  // Player takes damage
  const hurtPlayer = (dmg = 1) => {
    const p = playerRef.current;
    if (p.isDead || p.invincibleTimer > 0 || gameStateRef.current !== 'playing') return;

    p.hp = Math.max(0, p.hp - dmg);
    setPlayerHp(p.hp);
    p.invincibleTimer = 35;
    p.action = 'hurt';
    p.actionTimer = 16;
    screenShakeRef.current = 8;
    soundManager.playKungFuHit();
    spawnParticles(p.worldX - cameraXRef.current, p.y - 50, '#ef4444', 18);

    if (p.hp <= 0) {
      p.isDead = true;
      p.deathTimer = 75;
      soundManager.playKungFuGameOver();
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      const p = playerRef.current;
      const keys = keysRef.current;

      // Shake mechanic on Left/Right
      if (p.grippedCount > 0 && (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) {
        const curDir = e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a' ? 'left' : 'right';
        if (p.lastShakeDir !== curDir) {
          p.lastShakeDir = curDir;
          shakeOffGrips();
        }
      }

      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
      if (e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        keys.up = true;
        // Jump
        if (p.isGrounded && !p.isDead && p.actionTimer <= 0 && p.grippedCount === 0) {
          p.isGrounded = false;
          p.vy = -14;
          p.action = 'jump';
          soundManager.playKungFuJump();
        }
      }
      if (e.code === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = true;

      // Punch: J or Z
      if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'z') {
        if (!keys.punch) {
          keys.punch = true;
          triggerAttack('punch');
        }
      }

      // Kick: K or Space
      if (e.key.toLowerCase() === 'k' || e.code === 'Space') {
        if (!keys.kick) {
          keys.kick = true;
          triggerAttack('kick');
        }
      }

      if (e.key.toLowerCase() === 'p') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }

      if (e.key.toLowerCase() === 'r') {
        initFloor(floorRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = keysRef.current;
      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
      if (e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = false;
      if (e.code === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = false;
      if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'z') keys.punch = false;
      if (e.key.toLowerCase() === 'k' || e.code === 'Space') keys.kick = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initFloor, shakeOffGrips]);

  // Execute Punch or Kick Strike
  const triggerAttack = (type: 'punch' | 'kick') => {
    const p = playerRef.current;
    if (p.isDead || gameStateRef.current !== 'playing' || p.grippedCount > 0) return;

    // Reset swing hit tracking
    p.hitEnemiesThisSwing.clear();
    p.hitBossThisSwing = false;

    if (!p.isGrounded) {
      // Mid-Air Flying Dragon Kick
      p.action = 'jump_kick';
      p.actionTimer = 22;
      p.maxActionTimer = 22;
      soundManager.playKungFuKick();
      checkActiveHitbox();
    } else if (keysRef.current.down) {
      // Low Crouch Strike
      if (type === 'punch') {
        p.action = 'crouch_punch';
        p.actionTimer = 12;
        p.maxActionTimer = 12;
        soundManager.playKungFuPunch();
        checkActiveHitbox();
      } else {
        p.action = 'crouch_kick';
        p.actionTimer = 15;
        p.maxActionTimer = 15;
        soundManager.playKungFuKick();
        checkActiveHitbox();
      }
    } else {
      // Standing Strike
      if (type === 'punch') {
        p.action = 'punch';
        p.actionTimer = 11;
        p.maxActionTimer = 11;
        soundManager.playKungFuPunch();
        checkActiveHitbox();
      } else {
        p.action = 'kick';
        p.actionTimer = 15;
        p.maxActionTimer = 15;
        soundManager.playKungFuKick();
        checkActiveHitbox();
      }
    }
  };

  // Continuous Hitbox Checking while attack is active
  const checkActiveHitbox = () => {
    const p = playerRef.current;
    if (
      p.action !== 'punch' &&
      p.action !== 'kick' &&
      p.action !== 'jump_kick' &&
      p.action !== 'crouch_punch' &&
      p.action !== 'crouch_kick'
    ) {
      return;
    }

    const isFacingRight = p.dir === 'right';

    // Reach and height bounds calibrated to 96px character model
    let reach = 70;
    let topY = p.y - 85;
    let bottomY = p.y;
    let pts = 100;

    if (p.action === 'punch') {
      reach = 68;
      topY = p.y - 88;
      bottomY = p.y - 40;
      pts = 200;
    } else if (p.action === 'kick') {
      reach = 92;
      topY = p.y - 80;
      bottomY = p.y - 20;
      pts = 100;
    } else if (p.action === 'jump_kick') {
      reach = 100;
      topY = p.y - 100;
      bottomY = p.y - 10;
      pts = 300;
    } else if (p.action === 'crouch_punch') {
      reach = 72;
      topY = p.y - 50;
      bottomY = p.y;
      pts = 200;
    } else if (p.action === 'crouch_kick') {
      reach = 90;
      topY = p.y - 45;
      bottomY = p.y;
      pts = 100;
    }

    const strikeLeft = isFacingRight ? p.worldX : p.worldX - reach;
    const strikeRight = isFacingRight ? p.worldX + reach : p.worldX;

    // 1. Deflect Flying Knives in mid-air
    for (const kn of knivesRef.current) {
      if (kn.isDeflected) continue;
      if (kn.x >= strikeLeft && kn.x <= strikeRight && kn.y >= topY && kn.y <= bottomY) {
        kn.isDeflected = true;
        kn.vx = -kn.vx * 1.8;
        soundManager.playKungFuKick();
        screenShakeRef.current = 4;
        addFloater(kn.x - cameraXRef.current, kn.y - 15, '+500 PHẢN ĐÒN!', '#fde047');
        spawnParticles(kn.x - cameraXRef.current, kn.y, '#facc15', 12);
        setScore((s) => s + 500);
      }
    }

    // 2. Strike Standard Enemies
    for (const en of enemiesRef.current) {
      if (en.isDead || p.hitEnemiesThisSwing.has(en.id)) continue;

      if (
        en.worldX >= strikeLeft - 30 &&
        en.worldX <= strikeRight + 30 &&
        en.y >= topY - 10 &&
        en.y <= bottomY + 15
      ) {
        p.hitEnemiesThisSwing.add(en.id);
        en.hp--;

        if (en.hp <= 0) {
          en.isDead = true;
          en.isGripping = false;
          en.knockbackVx = isFacingRight ? 9 : -9;
          en.knockbackVy = -8;
          screenShakeRef.current = 6;

          setScore((s) => s + pts);
          addFloater(en.worldX - cameraXRef.current, en.y - 55, `+${pts}`);
          spawnParticles(
            en.worldX - cameraXRef.current,
            en.y - 45,
            en.type === 'gripper' ? '#3b82f6' : en.type === 'knife_thrower' ? '#ef4444' : '#facc15',
            20
          );
        } else {
          // Hurt stagger
          en.worldX += isFacingRight ? 35 : -35;
          soundManager.playKungFuHit();
        }
      }
    }

    // 3. Strike Boss
    const boss = bossRef.current;
    if (boss && boss.active && boss.hp > 0 && !p.hitBossThisSwing) {
      if (
        boss.worldX >= strikeLeft - 40 &&
        boss.worldX <= strikeRight + 40 &&
        boss.y >= topY - 20 &&
        boss.y <= bottomY + 20
      ) {
        p.hitBossThisSwing = true;
        boss.hp--;
        setBossHp(boss.hp);
        boss.state = 'hurt';
        boss.stateTimer = 18;
        screenShakeRef.current = 10;
        soundManager.playKungFuBossHit();
        spawnParticles(boss.worldX - cameraXRef.current, boss.y - 60, '#f59e0b', 25);
        addFloater(boss.worldX - cameraXRef.current, boss.y - 80, '+500', '#fbbf24');
        setScore((s) => s + 500);

        if (boss.hp <= 0) {
          boss.state = 'dead';
          boss.active = false;
          setBossActive(false);
          soundManager.playKungFuStageClear();
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
          });

          setScore((s) => s + 5000);
          addFloater(boss.worldX - cameraXRef.current, boss.y - 100, '+5,000 ĐIỂM THƯỞNG!', '#10b981');

          setGameState('stage_clear');
          setTimeout(() => {
            if (floorRef.current < 5) {
              setFloor((f) => f + 1);
              initFloor(floorRef.current + 1);
            } else {
              // Final Victory: Sylvia Rescued!
              setFloor(1);
              initFloor(1);
            }
          }, 3500);
        }
      }
    }
  };

  // Mount init
  useEffect(() => {
    initFloor(1);
  }, [initFloor]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;

    const updateGame = () => {
      if (gameStateRef.current !== 'playing') return;

      const p = playerRef.current;
      const keys = keysRef.current;

      // Screen shake decay
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.7);
      }

      // 1. UPDATE PLAYER
      if (p.isDead) {
        p.deathTimer--;
        if (p.deathTimer <= 0) {
          if (livesRef.current > 1) {
            setLives((l) => l - 1);
            // Respawn player
            p.hp = 16;
            setPlayerHp(16);
            p.isDead = false;
            p.action = 'idle';
            p.invincibleTimer = 90;
            p.grippedCount = 0;
            p.shakeCount = 0;
            setIsGripped(false);
          } else {
            setLives(0);
            setGameState('game_over');
          }
        }
        return;
      }

      if (p.invincibleTimer > 0) p.invincibleTimer--;

      // Gravity & Jump Physics
      if (!p.isGrounded) {
        p.y += p.vy;
        p.vy += 0.8; // crisp gravity
        if (p.y >= GROUND_Y) {
          p.y = GROUND_Y;
          p.vy = 0;
          p.isGrounded = true;
          if (p.action === 'jump' || p.action === 'jump_kick') {
            p.action = 'idle';
            p.actionTimer = 0;
          }
        }
      }

      // Active attack frame checks
      if (p.actionTimer > 0) {
        p.actionTimer--;
        checkActiveHitbox(); // Active hitbox on every frame!
        if (p.actionTimer <= 0) {
          if (p.isGrounded) {
            p.action = keys.down ? 'crouch' : 'idle';
          }
        }
      }

      // Ground Movement
      const canMove = p.actionTimer <= 0 && p.grippedCount === 0;
      if (canMove && p.isGrounded) {
        if (keys.down) {
          p.action = 'crouch';
        } else if (keys.left) {
          p.worldX = Math.max(50, p.worldX - p.speed);
          p.dir = 'left';
          p.action = 'walk';
          p.animTimer += 0.28;
        } else if (keys.right) {
          p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed);
          p.dir = 'right';
          p.action = 'walk';
          p.animTimer += 0.28;
        } else {
          p.action = 'idle';
          p.animTimer += 0.05;
        }
      } else if (!p.isGrounded) {
        // Air Drift
        if (keys.left) p.worldX = Math.max(50, p.worldX - p.speed * 0.7);
        if (keys.right) p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed * 0.7);
        if (p.action === 'jump_kick') {
          checkActiveHitbox(); // Flying kick stays active while in mid-air!
        }
      }

      // Update distance to stairs
      const distM = Math.max(0, Math.floor(STAGE_LENGTH_METERS - p.worldX / PX_PER_METER));
      setMetersLeft(distM);

      // Camera smoothly tracks player
      const targetCamX = Math.max(0, p.worldX - CANVAS_WIDTH * 0.38);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.14;

      // 2. SPAWN ENEMIES
      spawnTimerRef.current++;
      const boss = bossRef.current;
      const canSpawn = !boss || !boss.active;
      const activeEnemiesCount = enemiesRef.current.filter((en) => !en.isDead).length;

      if (canSpawn && activeEnemiesCount < 4 && spawnTimerRef.current > 85) {
        spawnTimerRef.current = 0;
        const roll = Math.random();
        const spawnRight = Math.random() < 0.65;
        const spawnX = spawnRight ? p.worldX + CANVAS_WIDTH * 0.65 : p.worldX - CANVAS_WIDTH * 0.55;

        if (spawnX > 50 && spawnX < STAGE_LENGTH_METERS * PX_PER_METER) {
          if (roll < 0.55) {
            // Gripper
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'gripper',
              worldX: spawnX,
              y: GROUND_Y,
              dir: spawnRight ? 'left' : 'right',
              speed: 2.3 + floorRef.current * 0.15,
              hp: 1,
              isGripping: false,
              gripTimer: 0,
              throwCooldown: 0,
              animTimer: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
              rotation: 0,
            });
          } else if (roll < 0.85) {
            // Knife Thrower
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'knife_thrower',
              worldX: spawnX,
              y: GROUND_Y,
              dir: spawnRight ? 'left' : 'right',
              speed: 1.8,
              hp: 2,
              isGripping: false,
              gripTimer: 0,
              throwCooldown: 55,
              animTimer: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
              rotation: 0,
            });
          } else {
            // Tom Tom acrobat
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'tom_tom',
              worldX: spawnX,
              y: GROUND_Y,
              dir: spawnRight ? 'left' : 'right',
              speed: 3.6,
              hp: 1,
              isGripping: false,
              gripTimer: 0,
              throwCooldown: 0,
              animTimer: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
              rotation: 0,
            });
          }
        }
      }

      // 3. ACTIVATE BOSS (80 meters)
      if (boss && !boss.active && p.worldX >= 80 * PX_PER_METER) {
        boss.active = true;
        setBossActive(true);
      }

      // 4. UPDATE ENEMIES
      let currentGrippers = 0;
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const en = enemiesRef.current[i];

        if (en.isDead) {
          en.worldX += en.knockbackVx;
          en.y += en.knockbackVy;
          en.knockbackVy += 0.5; // gravity
          en.rotation += 0.22;
          if (en.y > CANVAS_HEIGHT + 100) {
            enemiesRef.current.splice(i, 1);
          }
          continue;
        }

        // Face player
        en.dir = en.worldX > p.worldX ? 'left' : 'right';
        en.animTimer += 0.22;

        if (en.type === 'gripper') {
          if (en.isGripping) {
            currentGrippers++;
            en.worldX = p.worldX + (en.dir === 'left' ? 16 : -16);
            en.gripTimer++;
            if (en.gripTimer % 50 === 0) {
              hurtPlayer(1);
            }
          } else {
            // Run toward player
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
            if (Math.abs(en.worldX - p.worldX) < 26 && Math.abs(en.y - p.y) < 25) {
              en.isGripping = true;
              soundManager.playKungFuHit();
            }
          }
        } else if (en.type === 'knife_thrower') {
          const distToP = Math.abs(en.worldX - p.worldX);
          if (distToP > 240) {
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
          } else {
            // Throw knives at player!
            en.throwCooldown--;
            if (en.throwCooldown <= 0) {
              en.throwCooldown = 85;
              const throwHigh = Math.random() < 0.6;
              knivesRef.current.push({
                id: Date.now() + Math.random(),
                x: en.worldX + (en.dir === 'left' ? -28 : 28),
                // High knife at 368px (head/chest height when standing, dodged by crouch)
                // Low knife at 420px (knee height, dodged by jumping)
                y: throwHigh ? 368 : 420,
                vx: en.dir === 'left' ? -5.8 : 5.8,
                angle: 0,
                heightType: throwHigh ? 'high' : 'low',
                isDeflected: false,
              });
              soundManager.playKungFuKnife();
            }
          }
        } else if (en.type === 'tom_tom') {
          // Rolling acrobat
          en.worldX += en.dir === 'left' ? -en.speed : en.speed;
          if (Math.abs(en.worldX - p.worldX) < 28 && Math.abs(en.y - p.y) < 25) {
            hurtPlayer(1);
            en.isDead = true;
            en.knockbackVx = en.dir === 'left' ? 6 : -6;
            en.knockbackVy = -7;
          }
        }
      }
      p.grippedCount = currentGrippers;
      setIsGripped(currentGrippers > 0);

      // 5. UPDATE FLYING KNIVES
      for (let i = knivesRef.current.length - 1; i >= 0; i--) {
        const kn = knivesRef.current[i];
        kn.x += kn.vx;
        kn.angle += kn.vx > 0 ? 0.35 : -0.35;

        // Collision with player
        if (!kn.isDeflected && Math.abs(kn.x - p.worldX) < 24) {
          const isCrouching = p.action === 'crouch' || p.action === 'crouch_punch' || p.action === 'crouch_kick';
          const isJumping = !p.isGrounded;

          if (kn.heightType === 'high') {
            // High knife hits unless crouching!
            if (!isCrouching) {
              hurtPlayer(2);
              knivesRef.current.splice(i, 1);
              continue;
            }
          } else {
            // Low knife hits unless jumping!
            if (!isJumping) {
              hurtPlayer(2);
              knivesRef.current.splice(i, 1);
              continue;
            }
          }
        }

        // Knife offscreen
        if (Math.abs(kn.x - p.worldX) > CANVAS_WIDTH) {
          knivesRef.current.splice(i, 1);
        }
      }

      // 6. UPDATE BOSS AI
      if (boss && boss.active && boss.hp > 0) {
        boss.dir = boss.worldX > p.worldX ? 'left' : 'right';
        boss.animTimer += 0.22;

        if (boss.state === 'hurt') {
          boss.stateTimer--;
          if (boss.stateTimer <= 0) boss.state = 'idle';
        } else {
          const dist = Math.abs(boss.worldX - p.worldX);
          if (dist > 80) {
            boss.worldX += boss.dir === 'left' ? -boss.speed : boss.speed;
          } else {
            // In attack range: swing bo staff or strike
            boss.stateTimer--;
            if (boss.stateTimer <= 0) {
              boss.state = 'attack';
              boss.stateTimer = 45;
              soundManager.playKungFuKick();

              // Hit player
              if (Math.abs(boss.worldX - p.worldX) < 90) {
                hurtPlayer(2);
              }
            }
          }
        }
      }

      // 7. PARTICLES & FLOATERS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const fl = floatersRef.current[i];
        fl.y -= 0.8;
        fl.life--;
        if (fl.life <= 0) floatersRef.current.splice(i, 1);
      }
    };

    // Render Canvas
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Camera & Shake Transform
      ctx.save();
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      const camX = cameraXRef.current;
      const p = playerRef.current;
      const boss = bossRef.current;

      // ==========================================
      // A. DOJO TEMPLE ARCHITECTURE & BACKGROUND
      // ==========================================

      // 1. Deep Midnight Twilight Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#040711');
      skyGrad.addColorStop(0.5, '#0f1026');
      skyGrad.addColorStop(1, '#1e0c38');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Giant Luminous Full Moon
      const moonX = CANVAS_WIDTH * 0.72 - (camX * 0.08) % CANVAS_WIDTH;
      const moonGrad = ctx.createRadialGradient(moonX, 130, 10, moonX, 130, 70);
      moonGrad.addColorStop(0, '#ffffff');
      moonGrad.addColorStop(0.35, '#fef08a');
      moonGrad.addColorStop(0.8, '#facc15');
      moonGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, 130, 70, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Wispy Cloud Drift
      ctx.fillStyle = 'rgba(24, 20, 50, 0.45)';
      ctx.beginPath();
      ctx.ellipse(moonX - 30, 145, 65, 14, -0.1, 0, Math.PI * 2);
      ctx.ellipse(moonX + 40, 115, 55, 12, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Pine Bonsai Tree Silhouette on Veranda
      ctx.strokeStyle = '#080b18';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(moonX - 110, GROUND_Y);
      ctx.quadraticCurveTo(moonX - 95, GROUND_Y - 90, moonX - 60, GROUND_Y - 140);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(moonX - 75, GROUND_Y - 115);
      ctx.quadraticCurveTo(moonX - 40, GROUND_Y - 120, moonX - 25, GROUND_Y - 135);
      ctx.stroke();
      // Pine needles tufts
      ctx.fillStyle = '#080b18';
      ctx.beginPath();
      ctx.arc(moonX - 60, GROUND_Y - 142, 22, 0, Math.PI * 2);
      ctx.arc(moonX - 25, GROUND_Y - 137, 18, 0, Math.PI * 2);
      ctx.fill();

      // 3. Traditional Japanese Shoji Screen Lattice Panels
      for (let i = 0; i < 18; i++) {
        const winX = i * 210 - (camX * 0.35) % 210;

        // Rice paper warm glow
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(winX, 80, 120, 220);

        // Mahogany wooden frames & delicate lattice
        ctx.fillStyle = '#3a1700';
        ctx.fillRect(winX, 80, 6, 220);
        ctx.fillRect(winX + 38, 80, 4, 220);
        ctx.fillRect(winX + 76, 80, 4, 220);
        ctx.fillRect(winX + 114, 80, 6, 220);

        ctx.fillRect(winX, 80, 120, 6);
        ctx.fillRect(winX, 125, 120, 3);
        ctx.fillRect(winX, 170, 120, 3);
        ctx.fillRect(winX, 215, 120, 3);
        ctx.fillRect(winX, 260, 120, 3);
        ctx.fillRect(winX, 294, 120, 6);
      }

      // 4. Heavy Red Lacquered Temple Pillars
      for (let i = 0; i < 15; i++) {
        const pilX = i * 280 - (camX * 0.5) % 280;
        const pilGrad = ctx.createLinearGradient(pilX, 0, pilX + 24, 0);
        pilGrad.addColorStop(0, '#3f0707');
        pilGrad.addColorStop(0.35, '#991b1b');
        pilGrad.addColorStop(0.75, '#b91c1c');
        pilGrad.addColorStop(1, '#3f0707');
        ctx.fillStyle = pilGrad;
        ctx.fillRect(pilX, 0, 24, GROUND_Y);

        // Polished brass fixtures
        ctx.fillStyle = '#d97706';
        ctx.fillRect(pilX - 2, 45, 28, 6);
        ctx.fillRect(pilX - 2, 310, 28, 6);
      }

      // 5. Ornate Chinese Palace Lanterns (Rich glow & calligraphy)
      for (let i = 0; i < 14; i++) {
        const lx = i * 280 + 130 - (camX * 0.5) % 280;

        // Lantern Hanging Cord
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, 42);
        ctx.stroke();

        // Warm radial light aura
        const glow = ctx.createRadialGradient(lx, 70, 4, lx, 70, 60);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, 70, 60, 0, Math.PI * 2);
        ctx.fill();

        // Hexagonal / Oval Red Silk Lantern Body
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.ellipse(lx, 70, 17, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Golden calligraphy symbol "武" (Martial)
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('武', lx, 70);

        // Brass Top & Bottom caps
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lx - 11, 46, 22, 6);
        ctx.fillRect(lx - 11, 88, 22, 6);

        // Swaying golden silk tassel
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 94);
        ctx.lineTo(lx, 115);
        ctx.stroke();
      }

      // 6. Pagoda Rafter Eaves (Top 0 - 36px)
      ctx.fillStyle = '#1e0505';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 36);
      const eaveGrad = ctx.createLinearGradient(0, 0, 0, 36);
      eaveGrad.addColorStop(0, '#7f1d1d');
      eaveGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = eaveGrad;
      ctx.fillRect(0, 22, CANVAS_WIDTH, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 32, CANVAS_WIDTH, 4); // Imperial gold trim

      // 7. Polished Mahogany Floor (GROUND_Y = 430 to 540)
      const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      floorGrad.addColorStop(0, '#451a03');
      floorGrad.addColorStop(0.25, '#2e1002');
      floorGrad.addColorStop(1, '#170801');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Floor polished gloss reflection line
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

      // Floor wooden planks with perspective
      ctx.strokeStyle = '#1c0a02';
      ctx.lineWidth = 1.5;
      for (let y = GROUND_Y + 24; y < CANVAS_HEIGHT; y += 26) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // 8. Stairs & Finish Line at 100 Meters
      const stairsScreenX = STAGE_LENGTH_METERS * PX_PER_METER - camX;
      if (stairsScreenX > -250 && stairsScreenX < CANVAS_WIDTH + 250) {
        // Red carpet steps
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(stairsScreenX, GROUND_Y - 145, 170, 145);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(stairsScreenX + 35, GROUND_Y - 145, 100, 145);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(stairsScreenX + 33, GROUND_Y - 145, 4, 145);
        ctx.fillRect(stairsScreenX + 133, GROUND_Y - 145, 4, 145);

        // Signboard
        ctx.fillStyle = '#030712';
        ctx.fillRect(stairsScreenX + 15, GROUND_Y - 135, 140, 30);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stairsScreenX + 15, GROUND_Y - 135, 140, 30);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`LỐI LÊN TẦNG ${floorRef.current + 1}`, stairsScreenX + 85, GROUND_Y - 118);

        // Floor 5: Silvia in pink silk tied to pillar
        if (floorRef.current === 5) {
          ctx.save();
          ctx.translate(stairsScreenX + 85, GROUND_Y - 65);

          // Pillar
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-16, -50, 32, 115);

          // Silvia in Pink Cheongsam
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(-12, -28, 24, 55);
          ctx.fillStyle = '#db2777';
          ctx.fillRect(-12, 0, 24, 5);

          // Head & Hair
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -40, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -44, 12, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.fillRect(6, -48, 8, 3); // Hairpin

          // Speech bubble
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-40, -82, 80, 24);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('THOMAS CỨU!', 0, -68);
          ctx.restore();
        }
      }

      // ==========================================
      // B. DRAW ENEMIES (ANATOMICAL & DETAILED)
      // ==========================================
      for (const en of enemiesRef.current) {
        const sx = en.worldX - camX;
        if (sx < -90 || sx > CANVAS_WIDTH + 90) continue;

        ctx.save();
        ctx.translate(sx, en.y);

        if (en.isDead) {
          ctx.rotate(en.rotation);
        } else if (en.dir === 'left') {
          ctx.scale(-1, 1);
        }

        if (en.type === 'gripper') {
          // --- GRIPPER (LÍNH QUẤN LẤY - ÁO XANH) ---
          // Height: 85px
          const legSwing = Math.sin(en.animTimer * 4.5) * 10;

          // Baggy Blue Martial Trousers
          ctx.fillStyle = '#1e40af';
          ctx.fillRect(-11, -34, 10, 34 - legSwing);
          ctx.fillRect(1, -34, 10, 34 + legSwing);
          // Black Kung Fu shoes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-13, -5 - legSwing, 12, 6);
          ctx.fillRect(1, -5 + legSwing, 12, 6);

          // Blue Vest Torso with Shading
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-15, -72, 30, 40);
          ctx.strokeStyle = '#1d4ed8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-15, -72, 30, 40);

          // Yellow Martial Sash
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-16, -48, 32, 7);

          // Muscular Arms Reaching to Grab
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(8, -65, 30, 9);
          // Yellow wristband
          ctx.fillStyle = '#facc15';
          ctx.fillRect(24, -66, 5, 11);
          // Open claw hand
          ctx.beginPath();
          ctx.arc(38, -60, 6, 0, Math.PI * 2);
          ctx.fill();

          // Head & Facial Expression
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -82, 12, 0, Math.PI * 2);
          ctx.fill();
          // Black Shaved Topknot Hair
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -87, 12.5, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(-3, -100, 6, 6); // Topknot tuft

          // Fierce Aggressive Face
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(3, -83, 4, 3); // Grimacing eye
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(2, -76, 6, 2); // Mouth
        } else if (en.type === 'knife_thrower') {
          // --- KNIFE THROWER (LÍNH NÉM DAO - ÁO ĐỎ) ---
          // Height: 88px
          // Red Martial Robes with Shading
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-12, -35, 11, 35);
          ctx.fillRect(1, -35, 11, 35);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-16, -74, 32, 42);

          // White Sash
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-17, -50, 34, 7);

          // Head with White Bandana
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -84, 12, 0, Math.PI * 2);
          ctx.fill();
          // White Headband wrapped on UPPER forehead
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-13, -92, 26, 6);
          // Black Hair
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -94, 12.5, Math.PI, 0);
          ctx.fill();

          // Eyes & Face
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(3, -84, 4, 3);

          // Throwing Arm with Dagger
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(8, -66, 24, 9);
          // Gleaming Silver Kunai Dagger
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(32, -61);
          ctx.lineTo(48, -61);
          ctx.lineTo(38, -68);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (en.type === 'tom_tom') {
          // --- TOM TOM (KẺ LÙN NHÀO LỘN) ---
          ctx.rotate(en.animTimer * 6);
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, -22, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ninja Mask & Eyes
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-18, -28, 36, 12);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(3, -26, 6, 5);
        }

        ctx.restore();
      }

      // ==========================================
      // C. DRAW BOSS (MAGNIFICENT SPREAD)
      // ==========================================
      if (boss && boss.active && boss.hp > 0) {
        const bsx = boss.worldX - camX;
        ctx.save();
        ctx.translate(bsx, boss.y);
        if (boss.dir === 'left') ctx.scale(-1, 1);

        // Hurt flash
        if (boss.state === 'hurt' && Math.floor(Date.now() / 60) % 2 === 0) {
          ctx.filter = 'brightness(3)';
        }

        // TẦNG 1: STICK MASTER (GẬY THIẾT CÔN)
        if (boss.floor === 1) {
          // Imperial Violet Robe with Embroidered Gold
          ctx.fillStyle = '#4c1d95';
          ctx.fillRect(-20, -42, 18, 42);
          ctx.fillRect(2, -42, 18, 42);
          ctx.fillStyle = '#6d28d9';
          ctx.fillRect(-24, -92, 48, 54);

          // Imperial Gold Dragon Embroidered Sash
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-26, -64, 52, 9);

          // Master's Head & Face
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -104, 15, 0, Math.PI * 2);
          ctx.fill();
          // White Flowing Beard
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-11, -100);
          ctx.lineTo(0, -75);
          ctx.lineTo(11, -100);
          ctx.closePath();
          ctx.fill();

          // Heavy Wooden Bo Staff Weapon
          ctx.save();
          if (boss.state === 'attack') {
            ctx.rotate(0.55);
          }
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-24, -135);
          ctx.lineTo(44, 5);
          ctx.stroke();
          // Brass Ferrules on Bo Staff Ends
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-28, -138, 8, 9);
          ctx.fillRect(40, 2, 8, 9);
          ctx.restore();
        } else {
          // General Boss Body
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-22, -92, 44, 92);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-24, -60, 48, 9);
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -104, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ==========================================
      // D. DRAW FLYING KNIVES (ROTATING SILVER KUNAI)
      // ==========================================
      for (const kn of knivesRef.current) {
        const ksx = kn.x - camX;
        ctx.save();
        ctx.translate(ksx, kn.y);
        ctx.rotate(kn.angle);

        // Motion Trail
        ctx.fillStyle = kn.isDeflected ? 'rgba(250, 204, 21, 0.45)' : 'rgba(248, 250, 252, 0.4)';
        ctx.fillRect(-26, -3, 26, 6);

        // Gleaming Silver Blade
        ctx.fillStyle = kn.isDeflected ? '#facc15' : '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-7, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Red ring handle
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, -3, 7, 6);

        ctx.restore();
      }

      // ==========================================
      // E. DRAW PLAYER THOMAS (HEROIC ARCADE MARTIAL ARTIST)
      // ==========================================
      if (!p.isDead) {
        const psx = p.worldX - camX;
        ctx.save();
        ctx.translate(psx, p.y);

        if (p.dir === 'left') {
          ctx.scale(-1, 1);
        }

        // Invincible flash
        if (p.invincibleTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
          ctx.globalAlpha = 0.35;
        }

        const isCrouching = p.action === 'crouch' || p.action === 'crouch_punch' || p.action === 'crouch_kick';
        const yOff = isCrouching ? 32 : 0; // Deep martial crouch

        // 1. LEGS (VIVID SCARLET RED MARTIAL PANTS)
        ctx.fillStyle = '#dc2626';
        if (p.action === 'kick' || p.action === 'crouch_kick') {
          // Razor Sharp High Side Kick
          ctx.fillRect(-11, -36 + yOff, 12, 36);
          // Extended Kicking Leg
          ctx.fillRect(0, -56 + yOff, 62, 16);
          // White Kung Fu Shoe with red trim
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(58, -58 + yOff, 18, 20);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(58, -40 + yOff, 18, 4);
          // Dynamic Strike Shockwave
          ctx.fillStyle = '#facc15';
          ctx.fillRect(78, -54 + yOff, 14, 5);
          ctx.fillRect(76, -46 + yOff, 10, 4);
        } else if (p.action === 'jump_kick') {
          // Legendary Bruce Lee Mid-Air Flying Kick!
          ctx.fillRect(-20, -34, 18, 16); // Tucked back leg
          ctx.fillRect(0, -56, 72, 18); // Fully thrust leg
          // White Kung Fu Shoe
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(68, -58, 18, 22);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(68, -38, 18, 4);
          // Strike speed sparks
          ctx.fillStyle = '#facc15';
          ctx.fillRect(88, -52, 16, 5);
          ctx.fillRect(86, -44, 12, 4);
        } else if (isCrouching) {
          // Deep Tiger Crouch on Ground
          ctx.fillRect(-16, -26 + yOff, 30, 26);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-18, -8 + yOff, 16, 8);
          ctx.fillRect(6, -8 + yOff, 16, 8);
        } else {
          // Walking or Idle footwork
          const walkSwing = p.action === 'walk' ? Math.sin(p.animTimer * 5) * 11 : 0;
          ctx.fillRect(-12, -36, 11, 36 - walkSwing);
          ctx.fillRect(1, -36, 11, 36 + walkSwing);
          // White Shoes with black soles
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-14, -6 - walkSwing, 14, 7);
          ctx.fillRect(1, -6 + walkSwing, 14, 7);
        }

        // 2. WHITE SLEEVELESS GI (DOGI) TORSO
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -78 + yOff, 32, 44);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-16, -78 + yOff, 32, 44);

        // Muscular V-Neck Chest
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.moveTo(-7, -78 + yOff);
        ctx.lineTo(0, -60 + yOff);
        ctx.lineTo(7, -78 + yOff);
        ctx.closePath();
        ctx.fill();

        // 3. SAPPHIRE BLUE SASH BELT & TRAILING RIBBONS
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-18, -52 + yOff, 36, 9);
        // Belt knot & trailing ribbons
        ctx.beginPath();
        ctx.moveTo(-4, -43 + yOff);
        ctx.lineTo(-9, -24 + yOff);
        ctx.lineTo(-2, -24 + yOff);
        ctx.closePath();
        ctx.fill();

        // 4. SCULPTED ANIME HEAD, BANDANA & HAIR
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -90 + yOff, 14, 0, Math.PI * 2);
        ctx.fill();

        // Determined Martial Artist Eyes & Brows (PROPERLY VISIBLE!)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(3, -92 + yOff, 5, 4); // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, -92 + yOff, 2, 2); // Glint
        // Fierce Brow
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1, -95 + yOff);
        ctx.lineTo(9, -93 + yOff);
        ctx.stroke();

        // Mouth & Chin
        ctx.fillStyle = '#b45309';
        ctx.fillRect(3, -83 + yOff, 4, 2);

        // CRIMSON HEADBAND (Wrapped on UPPER Forehead: -103 to -97, WELL ABOVE EYES!)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-15, -103 + yOff, 30, 7);
        // Flowing Headband Tails Fluttering Behind
        ctx.beginPath();
        ctx.moveTo(-15, -100 + yOff);
        ctx.lineTo(-32, -108 + yOff);
        ctx.lineTo(-30, -96 + yOff);
        ctx.closePath();
        ctx.fill();

        // Spiky Black Anime Hair on Top
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -104 + yOff, 14.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-16, -104 + yOff, 10, 5); // Hair spiky fringe

        // 5. ARMS, PUNCH & GUARD
        if (p.action === 'punch' || p.action === 'crouch_punch') {
          // Explosive Straight Punch Strike!
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(6, -72 + yOff, 46, 12);
          // Blue Wristband
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(32, -73 + yOff, 7, 14);
          // Anatomical Clenched Fist
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(52, -66 + yOff, 8.5, 0, Math.PI * 2);
          ctx.fill();
          // Speed wind trail
          ctx.fillStyle = '#facc15';
          ctx.fillRect(62, -67 + yOff, 14, 4);
        } else if (p.action !== 'kick' && p.action !== 'jump_kick' && p.action !== 'crouch_kick') {
          // Dynamic Martial Ready Guard (Jeet Kune Do style)
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(4, -72 + yOff, 20, 11);
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(16, -73 + yOff, 6, 13);
        }

        ctx.restore();

        // 6. Shake Off Floating Alert if Gripped
        if (p.grippedCount > 0) {
          ctx.save();
          ctx.translate(psx, p.y - 120);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-75, -15, 150, 24);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.strokeRect(-75, -15, 150, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`LẮC PHÍM ◀ ▶ ĐỂ HẤT VĂNG! (${p.shakeCount}/3)`, 0, 2);
          ctx.restore();
        }
      }

      // ==========================================
      // F. COMBAT PARTICLES & FLOATERS
      // ==========================================
      for (const pt of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const fl of floatersRef.current) {
        ctx.save();
        ctx.font = '900 16px monospace';
        ctx.fillStyle = fl.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      }

      ctx.restore(); // Restore camera shake
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
  }, [initFloor]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none">
      {/* Top HUD Bar */}
      <div className="game-top-hud relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Left: Controls & Floor indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => initFloor(floor)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Chơi lại tầng này (R)"
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

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 font-bold text-rose-400">
            <span>TẦNG {floor}/5</span>
          </div>
        </div>

        {/* Center: Health Bars & Score */}
        <div className="flex items-center gap-3 sm:gap-6 font-mono font-bold tracking-wider">
          {/* Player HP */}
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-[10px] sm:text-xs">THOMAS:</span>
            <div className="flex gap-0.5 bg-slate-950 p-1 rounded-md border border-white/10">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 sm:w-2 h-2.5 rounded-sm ${
                    i < playerHp ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Boss HP (if active) */}
          {bossActive && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <span className="text-rose-400 text-[10px] sm:text-xs max-w-[120px] truncate" title={bossName}>
                {bossName}:
              </span>
              <div className="flex gap-0.5 bg-slate-950 p-1 rounded-md border border-white/10">
                {Array.from({ length: bossMaxHp }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 sm:w-2 h-2.5 rounded-sm ${
                      i < bossHp ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Score */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] sm:text-xs">ĐIỂM:</span>
            <span className="text-amber-300 text-sm sm:text-base">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Right: Distance & Lives */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] sm:text-xs font-mono font-bold text-slate-300">
            CÒN: <span className="text-amber-400">{metersLeft}M</span>
          </div>

          <div className="flex items-center gap-1">
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
                Bấm Tiếp tục hoặc phím P để tiếp tục trận chiến cứu Silvia!
              </p>
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-rose-500/25 transition-all"
              >
                Tiếp Tục Đấu
              </button>
            </div>
          </div>
        )}

        {/* Overlay: Game Over */}
        {gameState === 'game_over' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <div className="bg-slate-900/95 border border-rose-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl max-w-md animate-in fade-in zoom-in-95 duration-200">
              <span className="text-5xl mb-3">🥋</span>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-500 mb-1">GAME OVER</h2>
              <p className="text-slate-300 text-xs sm:text-sm mb-4">
                Thomas đã kiệt sức tại Tầng {floor}!
              </p>

              <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-white/5 mb-6 flex justify-around font-mono">
                <div>
                  <div className="text-slate-400 text-[10px]">TỔNG ĐIỂM</div>
                  <div className="text-amber-400 text-lg font-bold">{score.toLocaleString()}</div>
                </div>
                <div className="border-r border-white/10" />
                <div>
                  <div className="text-slate-400 text-[10px]">TẦNG ĐẠT ĐƯỢC</div>
                  <div className="text-rose-400 text-lg font-bold">TẦNG {floor}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setScore(0);
                  setLives(3);
                  setFloor(1);
                  initFloor(1);
                }}
                className="w-full py-2.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-rose-500/25 transition-all"
              >
                Tái Đấu Từ Tầng 1
              </button>
            </div>
          </div>
        )}

        {/* Overlay: Stage Clear */}
        {gameState === 'stage_clear' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none">
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-90 duration-300">
              <span className="text-5xl mb-2">🏆</span>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
                {floor === 5 ? 'GIẢI CỨU SILVIA THÀNH CÔNG!' : `ĐÁNH BẠI TRÙM TẦNG ${floor}!`}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                {floor === 5 ? 'Chúc mừng bạn đã phá đảo huyền thoại Kung Fu!' : `Đang tiến lên Tầng ${floor + 1}...`}
              </p>
            </div>
          </div>
        )}

        {/* Mobile On-Screen D-Pad & Attack Action Buttons */}
        <div className="sm:hidden absolute inset-0 pointer-events-none flex flex-col justify-end p-3 z-10">
          <div className="flex items-end justify-between w-full">
            {/* D-Pad Left */}
            <div className="pointer-events-auto grid grid-cols-3 gap-1 w-32 h-32 bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10">
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.up = true;
                  const p = playerRef.current;
                  if (p.isGrounded && !p.isDead && p.actionTimer <= 0 && p.grippedCount === 0) {
                    p.isGrounded = false;
                    p.vy = -14;
                    p.action = 'jump';
                    soundManager.playKungFuJump();
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.up = false;
                }}
                className="bg-white/10 active:bg-rose-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.left = true;
                  if (playerRef.current.grippedCount > 0) shakeOffGrips();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.left = false;
                }}
                className="bg-white/10 active:bg-rose-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center text-[10px] text-slate-500">🥋</div>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.right = true;
                  if (playerRef.current.grippedCount > 0) shakeOffGrips();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  keysRef.current.right = false;
                }}
                className="bg-white/10 active:bg-rose-500/40 rounded-lg flex items-center justify-center text-white"
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
                className="bg-white/10 active:bg-rose-500/40 rounded-lg flex items-center justify-center text-white"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            {/* Action Buttons Right: Punch (J), Kick (K), Shake Off if gripped */}
            <div className="pointer-events-auto flex items-center gap-2">
              {isGripped && (
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    shakeOffGrips();
                  }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 text-white font-black text-xs active:scale-95 shadow-lg shadow-rose-500/50 flex flex-col items-center justify-center border-2 border-white/40 animate-bounce"
                >
                  <span className="text-base">⚡</span>
                  <span className="text-[9px] font-black tracking-tighter">HẤT VĂNG</span>
                </button>
              )}

              {/* Punch Button */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerAttack('punch');
                }}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-black text-xs active:scale-95 shadow-lg shadow-blue-500/40 flex flex-col items-center justify-center border-2 border-white/20"
              >
                <span className="text-lg">👊</span>
                <span className="text-[10px] tracking-wider">ĐẤM</span>
              </button>

              {/* Kick Button */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerAttack('kick');
                }}
                className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black text-xs active:scale-95 shadow-lg shadow-rose-500/40 flex flex-col items-center justify-center border-2 border-white/20"
              >
                <span className="text-xl">🦶</span>
                <span className="text-[11px] tracking-wider">ĐÁ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
