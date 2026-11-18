import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 440; // Ground floor level
const STAGE_LENGTH_METERS = 100;
const PX_PER_METER = 35; // Total corridor length = 3500px

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
    speed: 3.4,
    animTimer: 0,
    hp: 16,
    maxHp: 16,
    invincibleTimer: 0,
    isDead: false,
    deathTimer: 0,
    grippedCount: 0,
    shakeCount: 0,
    lastShakeDir: '' as string,
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
  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: 3 + Math.random() * 4,
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
      // Violent Kung Fu Burst!
      p.shakeCount = 0;
      p.grippedCount = 0;
      setIsGripped(false);
      soundManager.playKungFuKick();
      screenShakeRef.current = 10;

      // Knock all grabbing enemies away!
      for (const en of enemiesRef.current) {
        if (en.isGripping) {
          en.isGripping = false;
          en.isDead = true;
          en.knockbackVx = Math.random() > 0.5 ? 7 : -7;
          en.knockbackVy = -7;
          spawnParticles(en.worldX - cameraXRef.current, en.y - 40, '#3b82f6', 16);
          addFloater(en.worldX - cameraXRef.current, en.y - 60, 'HẤT VĂNG!', '#38bdf8');
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
      speed: 3.4,
      animTimer: 0,
      hp: 16,
      maxHp: 16,
      invincibleTimer: 60,
      isDead: false,
      deathTimer: 0,
      grippedCount: 0,
      shakeCount: 0,
      lastShakeDir: '',
    };

    setPlayerHp(16);
    setMetersLeft(STAGE_LENGTH_METERS);
    cameraXRef.current = 0;
    setIsGripped(false);

    // Boss waits at 92 meters (before the stairs)
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
    spawnParticles(p.worldX - cameraXRef.current, p.y - 45, '#ef4444', 16);

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
          p.vy = -13.5;
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

    if (!p.isGrounded) {
      // Flying Dragon Kick in Mid-Air!
      p.action = 'jump_kick';
      p.actionTimer = 18;
      soundManager.playKungFuKick();
      checkAttackHit('jump_kick');
    } else if (keysRef.current.down) {
      // Crouch Strike
      if (type === 'punch') {
        p.action = 'crouch_punch';
        p.actionTimer = 12;
        soundManager.playKungFuPunch();
        checkAttackHit('crouch_punch');
      } else {
        p.action = 'crouch_kick';
        p.actionTimer = 15;
        soundManager.playKungFuKick();
        checkAttackHit('crouch_kick');
      }
    } else {
      // Standing Strike
      if (type === 'punch') {
        p.action = 'punch';
        p.actionTimer = 11;
        soundManager.playKungFuPunch();
        checkAttackHit('punch');
      } else {
        p.action = 'kick';
        p.actionTimer = 15;
        soundManager.playKungFuKick();
        checkAttackHit('kick');
      }
    }
  };

  // Combat Hit Detection
  const checkAttackHit = (atkType: PlayerAction) => {
    const p = playerRef.current;
    const isFacingRight = p.dir === 'right';

    // Strike reach and bounds (scaled for 80px tall Thomas)
    let strikeReach = 65;
    let strikeTop = p.y - 75;
    let strikeBottom = p.y;
    let pts = 100;

    if (atkType === 'punch') {
      strikeReach = 60;
      strikeTop = p.y - 75;
      strikeBottom = p.y - 35;
      pts = 200;
    } else if (atkType === 'kick') {
      strikeReach = 85;
      strikeTop = p.y - 65;
      strikeBottom = p.y - 20;
      pts = 100;
    } else if (atkType === 'jump_kick') {
      strikeReach = 90;
      strikeTop = p.y - 90;
      strikeBottom = p.y - 10;
      pts = 300;
    } else if (atkType === 'crouch_punch') {
      strikeReach = 65;
      strikeTop = p.y - 45;
      strikeBottom = p.y;
      pts = 200;
    } else if (atkType === 'crouch_kick') {
      strikeReach = 80;
      strikeTop = p.y - 40;
      strikeBottom = p.y;
      pts = 100;
    }

    const strikeLeft = isFacingRight ? p.worldX : p.worldX - strikeReach;
    const strikeRight = isFacingRight ? p.worldX + strikeReach : p.worldX;

    // 1. Deflect Flying Knives in mid-air!
    for (const kn of knivesRef.current) {
      if (kn.isDeflected) continue;
      if (kn.x >= strikeLeft && kn.x <= strikeRight && kn.y >= strikeTop && kn.y <= strikeBottom) {
        kn.isDeflected = true;
        kn.vx = -kn.vx * 1.8;
        soundManager.playKungFuKick();
        screenShakeRef.current = 4;
        addFloater(kn.x - cameraXRef.current, kn.y - 15, '+500 KENG!', '#fde047');
        spawnParticles(kn.x - cameraXRef.current, kn.y, '#facc15', 10);
        setScore((s) => s + 500);
      }
    }

    // 2. Strike Standard Enemies
    for (const en of enemiesRef.current) {
      if (en.isDead) continue;
      if (
        en.worldX >= strikeLeft - 25 &&
        en.worldX <= strikeRight + 25 &&
        en.y >= strikeTop &&
        en.y <= strikeBottom + 10
      ) {
        en.hp--;
        if (en.hp <= 0) {
          en.isDead = true;
          en.isGripping = false;
          en.knockbackVx = isFacingRight ? 8.5 : -8.5;
          en.knockbackVy = -7.5;
          screenShakeRef.current = 6;

          setScore((s) => s + pts);
          addFloater(en.worldX - cameraXRef.current, en.y - 50, `+${pts}`);
          spawnParticles(
            en.worldX - cameraXRef.current,
            en.y - 40,
            en.type === 'gripper' ? '#3b82f6' : en.type === 'knife_thrower' ? '#ef4444' : '#facc15',
            18
          );
        } else {
          // Hurt stagger
          en.worldX += isFacingRight ? 30 : -30;
          soundManager.playKungFuHit();
        }
      }
    }

    // 3. Strike Boss
    const boss = bossRef.current;
    if (boss && boss.active && boss.hp > 0) {
      if (
        boss.worldX >= strikeLeft - 35 &&
        boss.worldX <= strikeRight + 35 &&
        boss.y >= strikeTop - 15 &&
        boss.y <= strikeBottom + 15
      ) {
        boss.hp--;
        setBossHp(boss.hp);
        boss.state = 'hurt';
        boss.stateTimer = 18;
        screenShakeRef.current = 9;
        soundManager.playKungFuBossHit();
        spawnParticles(boss.worldX - cameraXRef.current, boss.y - 50, '#f59e0b', 22);
        addFloater(boss.worldX - cameraXRef.current, boss.y - 70, '+500', '#fbbf24');
        setScore((s) => s + 500);

        if (boss.hp <= 0) {
          boss.state = 'dead';
          boss.active = false;
          setBossActive(false);
          soundManager.playKungFuStageClear();
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 },
          });

          setScore((s) => s + 5000);
          addFloater(boss.worldX - cameraXRef.current, boss.y - 90, '+5,000 ĐIỂM THƯỞNG!', '#10b981');

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
        p.vy += 0.75; // gravity
        if (p.y >= GROUND_Y) {
          p.y = GROUND_Y;
          p.vy = 0;
          p.isGrounded = true;
          if (p.action === 'jump' || p.action === 'jump_kick') {
            p.action = 'idle';
          }
        }
      }

      // Action Timer
      if (p.actionTimer > 0) {
        p.actionTimer--;
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
          p.animTimer += 0.25;
        } else if (keys.right) {
          p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed);
          p.dir = 'right';
          p.action = 'walk';
          p.animTimer += 0.25;
        } else {
          p.action = 'idle';
          p.animTimer += 0.05;
        }
      } else if (!p.isGrounded) {
        // Air Drift
        if (keys.left) p.worldX = Math.max(50, p.worldX - p.speed * 0.7);
        if (keys.right) p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed * 0.7);
      }

      // Update distance to stairs
      const distM = Math.max(0, Math.floor(STAGE_LENGTH_METERS - p.worldX / PX_PER_METER));
      setMetersLeft(distM);

      // Camera smoothly tracks player
      const targetCamX = Math.max(0, p.worldX - CANVAS_WIDTH * 0.4);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.12;

      // 2. SPAWN ENEMIES
      spawnTimerRef.current++;
      const boss = bossRef.current;
      const canSpawn = !boss || !boss.active;

      // Ensure at most 4 enemies on screen at once
      const activeEnemiesCount = enemiesRef.current.filter((en) => !en.isDead).length;

      if (canSpawn && activeEnemiesCount < 4 && spawnTimerRef.current > 80) {
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
              speed: 2.4 + floorRef.current * 0.15,
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
              throwCooldown: 50,
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
              speed: 3.5,
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
          en.rotation += 0.2;
          if (en.y > CANVAS_HEIGHT + 100) {
            enemiesRef.current.splice(i, 1);
          }
          continue;
        }

        // Face player
        en.dir = en.worldX > p.worldX ? 'left' : 'right';
        en.animTimer += 0.2;

        if (en.type === 'gripper') {
          if (en.isGripping) {
            currentGrippers++;
            en.worldX = p.worldX + (en.dir === 'left' ? 14 : -14);
            en.gripTimer++;
            if (en.gripTimer % 50 === 0) {
              hurtPlayer(1);
            }
          } else {
            // Run toward player
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
            if (Math.abs(en.worldX - p.worldX) < 24 && Math.abs(en.y - p.y) < 25) {
              en.isGripping = true;
              soundManager.playKungFuHit();
            }
          }
        } else if (en.type === 'knife_thrower') {
          const distToP = Math.abs(en.worldX - p.worldX);
          if (distToP > 230) {
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
          } else {
            // Throw knives at player!
            en.throwCooldown--;
            if (en.throwCooldown <= 0) {
              en.throwCooldown = 85;
              const throwHigh = Math.random() < 0.6;
              knivesRef.current.push({
                id: Date.now() + Math.random(),
                x: en.worldX + (en.dir === 'left' ? -25 : 25),
                // High knife at 380px (head height when standing, dodged by crouch)
                // Low knife at 425px (knee height, dodged by jumping)
                y: throwHigh ? 380 : 425,
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
          if (Math.abs(en.worldX - p.worldX) < 26 && Math.abs(en.y - p.y) < 25) {
            hurtPlayer(1);
            en.isDead = true;
            en.knockbackVx = en.dir === 'left' ? 5 : -5;
            en.knockbackVy = -6;
          }
        }
      }
      p.grippedCount = currentGrippers;
      setIsGripped(currentGrippers > 0);

      // 5. UPDATE FLYING KNIVES
      for (let i = knivesRef.current.length - 1; i >= 0; i--) {
        const kn = knivesRef.current[i];
        kn.x += kn.vx;
        kn.angle += kn.vx > 0 ? 0.3 : -0.3;

        // Collision with player
        if (!kn.isDeflected && Math.abs(kn.x - p.worldX) < 22) {
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
        boss.animTimer += 0.2;

        if (boss.state === 'hurt') {
          boss.stateTimer--;
          if (boss.stateTimer <= 0) boss.state = 'idle';
        } else {
          const dist = Math.abs(boss.worldX - p.worldX);
          if (dist > 75) {
            boss.worldX += boss.dir === 'left' ? -boss.speed : boss.speed;
          } else {
            // In attack range: swing bo staff or strike
            boss.stateTimer--;
            if (boss.stateTimer <= 0) {
              boss.state = 'attack';
              boss.stateTimer = 45;
              soundManager.playKungFuKick();

              // Hit player
              if (Math.abs(boss.worldX - p.worldX) < 85) {
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
      skyGrad.addColorStop(0, '#060913');
      skyGrad.addColorStop(0.5, '#131238');
      skyGrad.addColorStop(1, '#2c0b4d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Giant Luminous Full Moon
      const moonX = CANVAS_WIDTH * 0.72 - (camX * 0.08) % CANVAS_WIDTH;
      const moonGrad = ctx.createRadialGradient(moonX, 130, 10, moonX, 130, 65);
      moonGrad.addColorStop(0, '#ffffff');
      moonGrad.addColorStop(0.3, '#fef08a');
      moonGrad.addColorStop(0.8, '#facc15');
      moonGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, 130, 65, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Cloud Drift across the Moon
      ctx.fillStyle = 'rgba(30, 27, 75, 0.45)';
      ctx.beginPath();
      ctx.ellipse(moonX - 25, 145, 55, 14, -0.1, 0, Math.PI * 2);
      ctx.ellipse(moonX + 35, 115, 45, 11, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Distant Pagoda Rooftops Silhouette
      ctx.fillStyle = '#0a0d1d';
      for (let i = 0; i < 12; i++) {
        const rx = i * 280 - (camX * 0.15) % 280;
        ctx.beginPath();
        ctx.moveTo(rx, 260);
        ctx.lineTo(rx + 40, 210);
        ctx.lineTo(rx + 80, 260);
        ctx.fill();
        // Spire
        ctx.fillRect(rx + 38, 180, 4, 30);
      }

      // 3. Traditional Japanese/Chinese Shoji Screen Windows
      for (let i = 0; i < 18; i++) {
        const winX = i * 210 - (camX * 0.35) % 210;

        // Rice paper translucent warm glow
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(winX, 85, 130, 200);

        // Mahogany wooden lattice grill
        ctx.fillStyle = '#451a03';
        // Vertical frames
        ctx.fillRect(winX, 85, 6, 200);
        ctx.fillRect(winX + 42, 85, 4, 200);
        ctx.fillRect(winX + 84, 85, 4, 200);
        ctx.fillRect(winX + 126, 85, 6, 200);
        // Horizontal frames
        ctx.fillRect(winX, 85, 130, 6);
        ctx.fillRect(winX, 135, 130, 4);
        ctx.fillRect(winX, 185, 130, 4);
        ctx.fillRect(winX, 235, 130, 4);
        ctx.fillRect(winX, 280, 130, 6);
      }

      // 4. Massive Red Temple Pillars
      for (let i = 0; i < 15; i++) {
        const pilX = i * 280 - (camX * 0.5) % 280;
        const pilGrad = ctx.createLinearGradient(pilX, 0, pilX + 24, 0);
        pilGrad.addColorStop(0, '#450a0a');
        pilGrad.addColorStop(0.4, '#b91c1c');
        pilGrad.addColorStop(0.8, '#dc2626');
        pilGrad.addColorStop(1, '#450a0a');
        ctx.fillStyle = pilGrad;
        ctx.fillRect(pilX, 0, 24, GROUND_Y);

        // Gold brass bands on pillar
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(pilX - 2, 45, 28, 6);
        ctx.fillRect(pilX - 2, 290, 28, 6);
      }

      // 5. Ornate Chinese Red Hanging Lanterns
      for (let i = 0; i < 14; i++) {
        const lx = i * 280 + 130 - (camX * 0.5) % 280;

        // Lantern Hanging Cord
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, 42);
        ctx.stroke();

        // Warm radial light aura
        const glow = ctx.createRadialGradient(lx, 70, 5, lx, 70, 55);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lx, 70, 55, 0, Math.PI * 2);
        ctx.fill();

        // Red Oval Silk Lantern Body
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(lx, 70, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Golden calligraphy symbol "武" (Martial)
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('武', lx, 70);

        // Brass Top & Bottom caps
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lx - 10, 48, 20, 5);
        ctx.fillRect(lx - 10, 87, 20, 5);

        // Golden hanging silk tassel
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 92);
        ctx.lineTo(lx, 112);
        ctx.stroke();
      }

      // 6. Pagoda Ceiling Eaves & Carved Rafters (Top 0 - 35px)
      ctx.fillStyle = '#260404';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 35);
      const eaveGrad = ctx.createLinearGradient(0, 0, 0, 35);
      eaveGrad.addColorStop(0, '#7f1d1d');
      eaveGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = eaveGrad;
      ctx.fillRect(0, 24, CANVAS_WIDTH, 11);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 32, CANVAS_WIDTH, 3); // Golden trim line

      // 7. Polished Wooden Dojo Floor (GROUND_Y = 440 to 540)
      const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      floorGrad.addColorStop(0, '#5c2411');
      floorGrad.addColorStop(0.2, '#431407');
      floorGrad.addColorStop(1, '#240a04');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Floor polished surface gloss line
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

      // Floor wooden plank lines with perspective
      ctx.strokeStyle = '#2b0e06';
      ctx.lineWidth = 1.5;
      for (let y = GROUND_Y + 22; y < CANVAS_HEIGHT; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // 8. Temple Stairs at 100 Meters
      const stairsScreenX = STAGE_LENGTH_METERS * PX_PER_METER - camX;
      if (stairsScreenX > -200 && stairsScreenX < CANVAS_WIDTH + 200) {
        // Red carpeted steps
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(stairsScreenX, GROUND_Y - 140, 160, 140);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(stairsScreenX + 30, GROUND_Y - 140, 100, 140); // Red carpet runner
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(stairsScreenX + 28, GROUND_Y - 140, 4, 140);
        ctx.fillRect(stairsScreenX + 128, GROUND_Y - 140, 4, 140);

        // Signboard
        ctx.fillStyle = '#030712';
        ctx.fillRect(stairsScreenX + 10, GROUND_Y - 130, 140, 28);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stairsScreenX + 10, GROUND_Y - 130, 140, 28);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`LỐI LÊN TẦNG ${floorRef.current + 1}`, stairsScreenX + 80, GROUND_Y - 116);

        // Floor 5: Silvia in pink cheongsam tied to sacred pillar!
        if (floorRef.current === 5) {
          ctx.save();
          ctx.translate(stairsScreenX + 80, GROUND_Y - 60);

          // Sacred wooden pillar
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-15, -45, 30, 105);

          // Silvia in Pink Cheongsam
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(-10, -25, 20, 50);
          ctx.fillStyle = '#db2777';
          ctx.fillRect(-10, 0, 20, 4); // Sash

          // Head & Hair
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -35, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(0, -38, 11, Math.PI, 0);
          ctx.fill();
          // Golden hairpin
          ctx.fillStyle = '#facc15';
          ctx.fillRect(6, -42, 6, 2);

          // Calling speech bubble
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-35, -75, 70, 22);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('THOMAS CỨU!', 0, -64);
          ctx.restore();
        }
      }

      // ==========================================
      // B. DRAW ENEMIES (SCALED UP & DETAILED)
      // ==========================================
      for (const en of enemiesRef.current) {
        const sx = en.worldX - camX;
        if (sx < -80 || sx > CANVAS_WIDTH + 80) continue;

        ctx.save();
        ctx.translate(sx, en.y);

        if (en.isDead) {
          ctx.rotate(en.rotation);
        } else if (en.dir === 'left') {
          ctx.scale(-1, 1);
        }

        if (en.type === 'gripper') {
          // --- GRIPPER (LÍNH ÁO XANH) ---
          // Height: ~76px
          const legSwing = Math.sin(en.animTimer * 4) * 8;

          // Blue Kung Fu Baggy Pants
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-10, -28, 9, 28 - legSwing);
          ctx.fillRect(1, -28, 9, 28 + legSwing);
          // Black Kung Fu shoes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-11, -4 - legSwing, 10, 5);
          ctx.fillRect(1, -4 + legSwing, 10, 5);

          // Blue Martial Vest
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-14, -62, 28, 36);
          ctx.strokeStyle = '#1d4ed8';
          ctx.lineWidth = 1;
          ctx.strokeRect(-14, -62, 28, 36);

          // Yellow Martial Belt
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-15, -42, 30, 6);

          // Head & Face
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -72, 11, 0, Math.PI * 2);
          ctx.fill();
          // Black Shaved / Topknot Hair
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -76, 11, Math.PI, 0);
          ctx.fill();
          // Menacing eyes
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(2, -73, 4, 2);

          // Outstretched Grabbing Arms
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(6, -56, 26, 8);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(20, -57, 4, 10); // Wristband
        } else if (en.type === 'knife_thrower') {
          // --- KNIFE THROWER (LÍNH NÉM DAO - ÁO ĐỎ) ---
          // Height: ~78px
          // Red Martial Robes
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-11, -30, 10, 30);
          ctx.fillRect(1, -30, 10, 30);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-15, -64, 30, 36);

          // White Sash
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-16, -44, 32, 6);

          // Head with White Headband
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -74, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-12, -80, 24, 5);
          // Hair
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-11, -84, 22, 5);

          // Throwing Arm holding Dagger
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(8, -58, 22, 8);
          // Steel Kunai / Dagger in hand
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(30, -54);
          ctx.lineTo(44, -54);
          ctx.lineTo(36, -60);
          ctx.closePath();
          ctx.fill();
        } else if (en.type === 'tom_tom') {
          // --- TOM TOM (KẺ LÙN NHÀO LỘN) ---
          ctx.rotate(en.animTimer * 5);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, -20, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Ninja Mask
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-16, -26, 32, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, -24, 5, 4);
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
          // Height: ~95px
          // Purple Master Robes with Gold Trim
          ctx.fillStyle = '#581c87';
          ctx.fillRect(-18, -40, 16, 40);
          ctx.fillRect(2, -40, 16, 40);
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(-22, -85, 44, 50);

          // Gold Imperial Embroidery
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-24, -58, 48, 8);

          // Head with White Beard
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -98, 14, 0, Math.PI * 2);
          ctx.fill();
          // Long White Beard
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-10, -94);
          ctx.lineTo(0, -72);
          ctx.lineTo(10, -94);
          ctx.closePath();
          ctx.fill();

          // Wooden Bo Staff Weapon
          ctx.save();
          if (boss.state === 'attack') {
            ctx.rotate(0.5);
          }
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(-20, -125);
          ctx.lineTo(38, 0);
          ctx.stroke();
          // Gold staff ends
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-23, -128, 6, 8);
          ctx.fillRect(35, -4, 6, 8);
          ctx.restore();
        } else {
          // General Boss Body
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-20, -85, 40, 85);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-22, -55, 44, 8);
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -98, 14, 0, Math.PI * 2);
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
        ctx.fillStyle = kn.isDeflected ? 'rgba(250, 204, 21, 0.4)' : 'rgba(248, 250, 252, 0.35)';
        ctx.fillRect(-24, -3, 24, 6);

        // Silver Blade
        ctx.fillStyle = kn.isDeflected ? '#facc15' : '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Kunai ring handle
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -2, 6, 4);

        ctx.restore();
      }

      // ==========================================
      // E. DRAW PLAYER THOMAS (MARTIAL ARTS MASTER)
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
        const yOff = isCrouching ? 28 : 0; // Low crouch drop

        // 1. LEGS (VIVID SCARLET RED TROUSERS)
        ctx.fillStyle = '#ef4444';
        if (p.action === 'kick' || p.action === 'crouch_kick') {
          // Razor High Side Kick
          ctx.fillRect(-10, -32 + yOff, 11, 32);
          ctx.fillRect(0, -48 + yOff, 52, 14); // Extended kicking leg
          // White shoe with red sole
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(48, -50 + yOff, 15, 18);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(48, -34 + yOff, 15, 3);
        } else if (p.action === 'jump_kick') {
          // Legendary Bruce Lee Mid-Air Flying Kick!
          ctx.fillRect(-18, -30, 16, 14); // Tucked back leg
          ctx.fillRect(0, -48, 62, 16); // Extended dragon kick
          // White shoe striking forward
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(58, -50, 16, 20);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(58, -32, 16, 4);
          // Speed trail sparks
          ctx.fillStyle = '#facc15';
          ctx.fillRect(74, -45, 10, 4);
          ctx.fillRect(72, -38, 8, 3);
        } else if (isCrouching) {
          // Low Dragon Crouch on one knee
          ctx.fillRect(-14, -22 + yOff, 26, 22);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-16, -6 + yOff, 14, 6);
          ctx.fillRect(6, -6 + yOff, 14, 6);
        } else {
          // Walking / Idle stance
          const walkSwing = p.action === 'walk' ? Math.sin(p.animTimer * 5) * 10 : 0;
          ctx.fillRect(-11, -32, 10, 32 - walkSwing);
          ctx.fillRect(1, -32, 10, 32 + walkSwing);
          // White shoes with black soles
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-13, -5 - walkSwing, 13, 6);
          ctx.fillRect(1, -5 + walkSwing, 13, 6);
        }

        // 2. WHITE SLEEVELESS GI TORSO
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -68 + yOff, 28, 38);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-14, -68 + yOff, 28, 38);

        // V-Neck Muscular Chest
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.moveTo(-6, -68 + yOff);
        ctx.lineTo(0, -54 + yOff);
        ctx.lineTo(6, -68 + yOff);
        ctx.closePath();
        ctx.fill();

        // 3. ROYAL BLUE SASH BELT
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-16, -46 + yOff, 32, 8);
        // Belt knot & trailing ribbons
        ctx.beginPath();
        ctx.moveTo(-4, -38 + yOff);
        ctx.lineTo(-8, -20 + yOff);
        ctx.lineTo(-2, -20 + yOff);
        ctx.closePath();
        ctx.fill();

        // 4. HEAD, HEADBAND & SPIKY ANIME HAIR
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -78 + yOff, 13, 0, Math.PI * 2);
        ctx.fill();

        // Red Martial Bandana / Headband
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-14, -84 + yOff, 28, 6);
        // Headband tails fluttering behind
        ctx.beginPath();
        ctx.moveTo(-14, -82 + yOff);
        ctx.lineTo(-26, -88 + yOff);
        ctx.lineTo(-24, -78 + yOff);
        ctx.closePath();
        ctx.fill();

        // Black Spiky Hair
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -88 + yOff, 13.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-14, -88 + yOff, 8, 4);

        // Determined Martial Artist Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(3, -79 + yOff, 4, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, -79 + yOff, 2, 2);

        // 5. PUNCH / GUARD ARMS
        if (p.action === 'punch' || p.action === 'crouch_punch') {
          // Powerful Straight Jab Strike!
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(6, -62 + yOff, 38, 10);
          // Blue Wristband
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(26, -63 + yOff, 6, 12);
          // Clenched Striking Fist
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(42, -57 + yOff, 7, 0, Math.PI * 2);
          ctx.fill();
          // Speed strike lines
          ctx.fillStyle = '#facc15';
          ctx.fillRect(49, -58 + yOff, 10, 3);
        } else if (p.action !== 'kick' && p.action !== 'jump_kick' && p.action !== 'crouch_kick') {
          // Guard Arms
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(4, -62 + yOff, 16, 9);
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(14, -63 + yOff, 5, 11);
        }

        ctx.restore();

        // 6. Shake Off Floating Alert if Gripped
        if (p.grippedCount > 0) {
          ctx.save();
          ctx.translate(psx, p.y - 105);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-70, -14, 140, 22);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-70, -14, 140, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`LẮC PHÍM ◀ ▶ ĐỂ HẤT VĂNG! (${p.shakeCount}/3)`, 0, 1);
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

      ctx.restore(); // Restore shake
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
                    p.vy = -13.5;
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
