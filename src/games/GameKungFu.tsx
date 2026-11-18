import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const GROUND_Y = 430;
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
  rollAnim: number;
  isDead: boolean;
  knockbackVx: number;
  knockbackVy: number;
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
  state: 'idle' | 'attack' | 'hurt' | 'dead';
  stateTimer: number;
  attackType: string;
  speed: number;
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
  { floor: 4, name: 'Pháp Sư Ảo Ảnh (Wizard)', hp: 14, maxHp: 14, speed: 2.6 },
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

  // Loop references for 60fps
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const floorRef = useRef(floor);
  const gameStateRef = useRef(gameState);

  // Player Thomas State
  const playerRef = useRef({
    worldX: 180, // position in 0..3500px corridor
    y: GROUND_Y,
    vy: 0,
    isGrounded: true,
    dir: 'right' as Direction,
    action: 'idle' as PlayerAction,
    actionTimer: 0,
    speed: 3.2,
    walkFrame: 0,
    hp: 16,
    maxHp: 16,
    invincibleTimer: 0,
    isDead: false,
    deathTimer: 0,
    grippedCount: 0,
    shakeCount: 0,
    lastShakeKey: '' as string,
  });

  // Camera X
  const cameraXRef = useRef(0);

  // Entities
  const enemiesRef = useRef<Enemy[]>([]);
  const knivesRef = useRef<Knife[]>([]);
  const bossRef = useRef<Boss | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<Floater[]>([]);
  const spawnTimerRef = useRef(0);

  // Keys tracking
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

  // Floating text
  const addFloater = (x: number, y: number, text: string, color = '#facc15') => {
    floatersRef.current.push({
      x,
      y,
      text,
      color,
      life: 45,
    });
  };

  // Particles
  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: 2.5 + Math.random() * 3.5,
        life: 20 + Math.random() * 15,
        maxLife: 35,
      });
    }
  };

  // Init Floor / Stage
  const initFloor = useCallback((targetFloor: number) => {
    const fIdx = Math.max(0, Math.min(4, targetFloor - 1));
    const bData = BOSS_DATA[fIdx];

    playerRef.current = {
      worldX: 180,
      y: GROUND_Y,
      vy: 0,
      isGrounded: true,
      dir: 'right',
      action: 'idle',
      actionTimer: 0,
      speed: 3.2,
      walkFrame: 0,
      hp: 16,
      maxHp: 16,
      invincibleTimer: 60,
      isDead: false,
      deathTimer: 0,
      grippedCount: 0,
      shakeCount: 0,
      lastShakeKey: '',
    };

    setPlayerHp(16);
    setMetersLeft(STAGE_LENGTH_METERS);
    cameraXRef.current = 0;

    // Reset Boss at 92 meters
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
      attackType: 'swing',
      speed: bData.speed,
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
    p.invincibleTimer = 30;
    p.action = 'hurt';
    p.actionTimer = 16;
    soundManager.playKungFuHit();
    spawnParticles(p.worldX - cameraXRef.current, p.y - 30, '#ef4444', 10);

    if (p.hp <= 0) {
      p.isDead = true;
      p.deathTimer = 75;
      soundManager.playKungFuGameOver();
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      const p = playerRef.current;
      const keys = keysRef.current;

      // Shake to break free from grips
      if (p.grippedCount > 0 && (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) {
        if (p.lastShakeKey !== e.code) {
          p.lastShakeKey = e.code;
          p.shakeCount++;
          if (p.shakeCount >= 4) {
            // Break free!
            p.shakeCount = 0;
            p.grippedCount = 0;
            // Knock away grabbing enemies
            for (const en of enemiesRef.current) {
              if (en.isGripping) {
                en.isGripping = false;
                en.isDead = true;
                en.knockbackVx = (Math.random() - 0.5) * 6;
                en.knockbackVy = -5;
                spawnParticles(en.worldX - cameraXRef.current, en.y - 20, '#3b82f6', 8);
              }
            }
          }
        }
      }

      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
      if (e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        keys.up = true;
        // Jump
        if (p.isGrounded && !p.isDead && p.actionTimer <= 0 && p.grippedCount === 0) {
          p.isGrounded = false;
          p.vy = -12.5;
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
  }, [initFloor]);

  // Trigger Punch or Kick
  const triggerAttack = (type: 'punch' | 'kick') => {
    const p = playerRef.current;
    if (p.isDead || gameStateRef.current !== 'playing' || p.grippedCount > 0) return;

    if (!p.isGrounded) {
      // Airborne Jump Kick
      p.action = 'jump_kick';
      p.actionTimer = 16;
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
        p.actionTimer = 14;
        soundManager.playKungFuKick();
        checkAttackHit('crouch_kick');
      }
    } else {
      // Standing Strike
      if (type === 'punch') {
        p.action = 'punch';
        p.actionTimer = 10;
        soundManager.playKungFuPunch();
        checkAttackHit('punch');
      } else {
        p.action = 'kick';
        p.actionTimer = 14;
        soundManager.playKungFuKick();
        checkAttackHit('kick');
      }
    }
  };

  // Hit detection logic for player attacks
  const checkAttackHit = (atkType: PlayerAction) => {
    const p = playerRef.current;
    const isFacingRight = p.dir === 'right';

    // Strike reach and height bounds
    let strikeReach = 45;
    let strikeTop = p.y - 50;
    let strikeBottom = p.y;
    let pts = 100;

    if (atkType === 'punch') {
      strikeReach = 42;
      strikeTop = p.y - 52;
      strikeBottom = p.y - 20;
      pts = 200;
    } else if (atkType === 'kick') {
      strikeReach = 58;
      strikeTop = p.y - 48;
      strikeBottom = p.y - 12;
      pts = 100;
    } else if (atkType === 'jump_kick') {
      strikeReach = 65;
      strikeTop = p.y - 65;
      strikeBottom = p.y - 5;
      pts = 300;
    } else if (atkType === 'crouch_punch' || atkType === 'crouch_kick') {
      strikeReach = 50;
      strikeTop = p.y - 28;
      strikeBottom = p.y;
      pts = atkType === 'crouch_punch' ? 200 : 100;
    }

    const strikeLeft = isFacingRight ? p.worldX : p.worldX - strikeReach;
    const strikeRight = isFacingRight ? p.worldX + strikeReach : p.worldX;

    // 1. Deflect Flying Knives
    for (const kn of knivesRef.current) {
      if (kn.isDeflected) continue;
      if (kn.x >= strikeLeft && kn.x <= strikeRight && kn.y >= strikeTop && kn.y <= strikeBottom) {
        kn.isDeflected = true;
        kn.vx = -kn.vx * 1.5;
        soundManager.playKungFuKick();
        addFloater(kn.x - cameraXRef.current, kn.y - 10, '+500');
        setScore((s) => s + 500);
      }
    }

    // 2. Strike Standard Enemies
    for (const en of enemiesRef.current) {
      if (en.isDead) continue;
      if (
        en.worldX >= strikeLeft - 18 &&
        en.worldX <= strikeRight + 18 &&
        en.y >= strikeTop &&
        en.y <= strikeBottom + 10
      ) {
        en.hp--;
        if (en.hp <= 0) {
          en.isDead = true;
          en.isGripping = false;
          en.knockbackVx = isFacingRight ? 6.5 : -6.5;
          en.knockbackVy = -5.5;

          setScore((s) => s + pts);
          addFloater(en.worldX - cameraXRef.current, en.y - 30, `+${pts}`);
          spawnParticles(
            en.worldX - cameraXRef.current,
            en.y - 25,
            en.type === 'gripper' ? '#3b82f6' : en.type === 'knife_thrower' ? '#ef4444' : '#facc15',
            14
          );
        } else {
          // Hurt stagger
          en.worldX += isFacingRight ? 20 : -20;
          soundManager.playKungFuHit();
        }
      }
    }

    // 3. Strike Boss
    const boss = bossRef.current;
    if (boss && boss.active && boss.hp > 0) {
      if (
        boss.worldX >= strikeLeft - 25 &&
        boss.worldX <= strikeRight + 25 &&
        boss.y >= strikeTop - 10 &&
        boss.y <= strikeBottom + 10
      ) {
        boss.hp--;
        setBossHp(boss.hp);
        boss.state = 'hurt';
        boss.stateTimer = 16;
        soundManager.playKungFuBossHit();
        spawnParticles(boss.worldX - cameraXRef.current, boss.y - 35, '#f59e0b', 16);
        addFloater(boss.worldX - cameraXRef.current, boss.y - 45, '+500', '#fbbf24');
        setScore((s) => s + 500);

        if (boss.hp <= 0) {
          boss.state = 'dead';
          boss.active = false;
          setBossActive(false);
          soundManager.playKungFuStageClear();
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });

          setScore((s) => s + 5000);
          addFloater(boss.worldX - cameraXRef.current, boss.y - 60, '+5,000 BONUS!', '#10b981');

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
          } else {
            setLives(0);
            setGameState('game_over');
          }
        }
        return;
      }

      if (p.invincibleTimer > 0) p.invincibleTimer--;

      // Gravity & Airborne check
      if (!p.isGrounded) {
        p.y += p.vy;
        p.vy += 0.7; // gravity
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

      // Movement if not locked in attack
      const canMove = p.actionTimer <= 0 && p.grippedCount === 0;
      if (canMove && p.isGrounded) {
        if (keys.down) {
          p.action = 'crouch';
        } else if (keys.left) {
          p.worldX = Math.max(40, p.worldX - p.speed);
          p.dir = 'left';
          p.action = 'walk';
          p.walkFrame += 0.2;
        } else if (keys.right) {
          // Limit corridor end
          p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed);
          p.dir = 'right';
          p.action = 'walk';
          p.walkFrame += 0.2;
        } else {
          p.action = 'idle';
        }
      } else if (!p.isGrounded) {
        // Air drift
        if (keys.left) p.worldX = Math.max(40, p.worldX - p.speed * 0.7);
        if (keys.right) p.worldX = Math.min(STAGE_LENGTH_METERS * PX_PER_METER, p.worldX + p.speed * 0.7);
      }

      // Update distance meters
      const distM = Math.max(0, Math.floor(STAGE_LENGTH_METERS - p.worldX / PX_PER_METER));
      setMetersLeft(distM);

      // Camera follows Thomas
      const targetCamX = Math.max(0, p.worldX - CANVAS_WIDTH * 0.4);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;

      // 2. SPAWN ENEMIES
      spawnTimerRef.current++;
      const boss = bossRef.current;
      const canSpawnEnemies = !boss || !boss.active;

      if (canSpawnEnemies && spawnTimerRef.current > 75) {
        spawnTimerRef.current = 0;
        const roll = Math.random();
        const spawnRight = Math.random() < 0.65;
        const spawnX = spawnRight ? p.worldX + CANVAS_WIDTH * 0.6 : p.worldX - CANVAS_WIDTH * 0.55;

        if (spawnX > 20 && spawnX < STAGE_LENGTH_METERS * PX_PER_METER) {
          if (roll < 0.55) {
            // Gripper
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'gripper',
              worldX: spawnX,
              y: GROUND_Y,
              dir: spawnRight ? 'left' : 'right',
              speed: 2.2 + floorRef.current * 0.2,
              hp: 1,
              isGripping: false,
              gripTimer: 0,
              throwCooldown: 0,
              rollAnim: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
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
              throwCooldown: 60,
              rollAnim: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
            });
          } else {
            // Tom Tom acrobat
            enemiesRef.current.push({
              id: Date.now() + Math.random(),
              type: 'tom_tom',
              worldX: spawnX,
              y: GROUND_Y,
              dir: spawnRight ? 'left' : 'right',
              speed: 3.2,
              hp: 1,
              isGripping: false,
              gripTimer: 0,
              throwCooldown: 0,
              rollAnim: 0,
              isDead: false,
              knockbackVx: 0,
              knockbackVy: 0,
            });
          }
        }
      }

      // 3. ACTIVATE BOSS WHEN NEAR END (82 meters)
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
          if (en.y > CANVAS_HEIGHT + 80) {
            enemiesRef.current.splice(i, 1);
          }
          continue;
        }

        // Face player
        en.dir = en.worldX > p.worldX ? 'left' : 'right';

        if (en.type === 'gripper') {
          if (en.isGripping) {
            currentGrippers++;
            en.worldX = p.worldX + (en.dir === 'left' ? 12 : -12);
            en.gripTimer++;
            if (en.gripTimer % 45 === 0) {
              hurtPlayer(1);
            }
          } else {
            // Run toward player
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
            if (Math.abs(en.worldX - p.worldX) < 18 && Math.abs(en.y - p.y) < 20) {
              en.isGripping = true;
              soundManager.playKungFuHit();
            }
          }
        } else if (en.type === 'knife_thrower') {
          const distToP = Math.abs(en.worldX - p.worldX);
          if (distToP > 190) {
            en.worldX += en.dir === 'left' ? -en.speed : en.speed;
          } else {
            // Throw knives at player!
            en.throwCooldown--;
            if (en.throwCooldown <= 0) {
              en.throwCooldown = 90;
              const throwHigh = Math.random() < 0.55;
              knivesRef.current.push({
                id: Date.now() + Math.random(),
                x: en.worldX + (en.dir === 'left' ? -20 : 20),
                y: throwHigh ? GROUND_Y - 42 : GROUND_Y - 14,
                vx: en.dir === 'left' ? -5.5 : 5.5,
                heightType: throwHigh ? 'high' : 'low',
                isDeflected: false,
              });
              soundManager.playKungFuKnife();
            }
          }
        } else if (en.type === 'tom_tom') {
          // Rolling acrobat
          en.worldX += en.dir === 'left' ? -en.speed : en.speed;
          en.rollAnim += 0.3;
          if (Math.abs(en.worldX - p.worldX) < 20 && Math.abs(en.y - p.y) < 20) {
            hurtPlayer(1);
            en.isDead = true;
            en.knockbackVx = en.dir === 'left' ? 4 : -4;
            en.knockbackVy = -5;
          }
        }
      }
      p.grippedCount = currentGrippers;

      // 5. UPDATE FLYING KNIVES
      for (let i = knivesRef.current.length - 1; i >= 0; i--) {
        const kn = knivesRef.current[i];
        kn.x += kn.vx;

        // Check collision with player
        if (!kn.isDeflected && Math.abs(kn.x - p.worldX) < 16) {
          const isCrouching = p.action === 'crouch' || p.action === 'crouch_punch' || p.action === 'crouch_kick';
          const isJumping = !p.isGrounded;

          if (kn.heightType === 'high') {
            // High knife hits player unless crouching!
            if (!isCrouching) {
              hurtPlayer(2);
              knivesRef.current.splice(i, 1);
              continue;
            }
          } else {
            // Low knife hits player unless jumping!
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

        if (boss.state === 'hurt') {
          boss.stateTimer--;
          if (boss.stateTimer <= 0) boss.state = 'idle';
        } else {
          const dist = Math.abs(boss.worldX - p.worldX);
          if (dist > 50) {
            boss.worldX += boss.dir === 'left' ? -boss.speed : boss.speed;
          } else {
            // In attack range
            boss.stateTimer--;
            if (boss.stateTimer <= 0) {
              boss.state = 'attack';
              boss.stateTimer = 40;

              // Strike player
              if (Math.abs(boss.worldX - p.worldX) < 65) {
                hurtPlayer(2);
              }
            }
          }
        }
      }

      // 7. UPDATE PARTICLES & FLOATERS
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const fl = floatersRef.current[i];
        fl.y -= 0.6;
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

      const camX = cameraXRef.current;
      const p = playerRef.current;
      const boss = bossRef.current;

      // A. Dojo Temple Night Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#090d1a');
      bgGrad.addColorStop(0.6, '#1e1b4b');
      bgGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Giant Full Moon in window
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH * 0.7 - camX * 0.1, 120, 50, 0, Math.PI * 2);
      ctx.fill();

      // Dojo Lattice Windows & Pillars
      ctx.fillStyle = '#311042';
      for (let i = 0; i < 20; i++) {
        const winX = i * 220 - (camX * 0.3) % 220;
        ctx.fillRect(winX, 80, 140, 160);
        // Window wooden grills
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(winX + 45, 80, 4, 160);
        ctx.fillRect(winX + 90, 80, 4, 160);
        ctx.fillRect(winX, 130, 140, 4);
        ctx.fillRect(winX, 180, 140, 4);
        ctx.fillStyle = '#311042';
      }

      // Hanging Red Lanterns
      for (let i = 0; i < 15; i++) {
        const lx = i * 260 - (camX * 0.5) % 260;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, 40);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(lx, 55, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b91c1c';
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lx - 8, 40, 16, 4);
        ctx.fillRect(lx - 8, 68, 16, 4);
      }

      // Wooden Pagoda Floor Planks
      ctx.fillStyle = '#5c2c16';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.fillStyle = '#8d4925';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

      // Floor plank lines with perspective
      ctx.strokeStyle = '#3d1d0e';
      ctx.lineWidth = 1;
      for (let y = GROUND_Y + 18; y < CANVAS_HEIGHT; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Stairs at 100 meters (End of floor)
      const stairsScreenX = STAGE_LENGTH_METERS * PX_PER_METER - camX;
      if (stairsScreenX > -200 && stairsScreenX < CANVAS_WIDTH + 200) {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(stairsScreenX, GROUND_Y - 120, 120, 120);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('LỐI LÊN TẦNG', stairsScreenX + 12, GROUND_Y - 90);

        // If Floor 5, show Silvia tied to pillar!
        if (floorRef.current === 5) {
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(stairsScreenX + 50, GROUND_Y - 50, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(stairsScreenX + 42, GROUND_Y - 40, 16, 30);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('SILVIA!', stairsScreenX + 32, GROUND_Y - 65);
        }
      }

      // B. Draw Enemies
      for (const en of enemiesRef.current) {
        const sx = en.worldX - camX;
        if (sx < -60 || sx > CANVAS_WIDTH + 60) continue;

        ctx.save();
        ctx.translate(sx, en.y);
        if (en.dir === 'left') ctx.scale(-1, 1);

        if (en.type === 'gripper') {
          // Blue Uniform Gripper
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(-8, -38, 16, 22);
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-7, -16, 6, 16);
          ctx.fillRect(1, -16, 6, 16);

          // Head
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -44, 7, 0, Math.PI * 2);
          ctx.fill();

          // Gripping Arms reaching forward
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(2, -32);
          ctx.lineTo(16, -28);
          ctx.stroke();
        } else if (en.type === 'knife_thrower') {
          // Red Uniform Knife Thrower
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-9, -40, 18, 24);
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-8, -16, 7, 16);
          ctx.fillRect(1, -16, 7, 16);

          // Head with headband
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(0, -46, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-7, -50, 14, 3);

          // Knife in hand
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(10, -32);
          ctx.lineTo(20, -32);
          ctx.lineTo(15, -35);
          ctx.closePath();
          ctx.fill();
        } else if (en.type === 'tom_tom') {
          // Yellow Acrobat Tom Tom
          ctx.rotate(en.rollAnim);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, -14, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-4, -18, 4, 3);
          ctx.fillRect(2, -18, 4, 3);
        }
        ctx.restore();
      }

      // C. Draw Boss
      if (boss && boss.active && boss.hp > 0) {
        const bsx = boss.worldX - camX;
        ctx.save();
        ctx.translate(bsx, boss.y);
        if (boss.dir === 'left') ctx.scale(-1, 1);

        // Flash when hurt
        if (boss.state === 'hurt' && Math.floor(Date.now() / 60) % 2 === 0) {
          ctx.filter = 'brightness(2.5)';
        }

        // Boss Robe / Armor
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(-12, -55, 24, 34);
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(-10, -21, 9, 21);
        ctx.fillRect(1, -21, 9, 21);

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -64, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-8, -70, 16, 5); // Golden crown/headband

        // Weapon: Long Wooden Bo Staff for Floor 1
        if (boss.floor === 1) {
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-15, -75);
          ctx.lineTo(28, -5);
          ctx.stroke();
        } else {
          // Fist / Strike pose
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(16, -42, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // D. Draw Flying Knives
      for (const kn of knivesRef.current) {
        const ksx = kn.x - camX;
        ctx.save();
        ctx.translate(ksx, kn.y);
        if (kn.vx < 0) ctx.scale(-1, 1);

        ctx.fillStyle = kn.isDeflected ? '#facc15' : '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // E. Draw Player Thomas
      if (!p.isDead) {
        const psx = p.worldX - camX;
        ctx.save();
        ctx.translate(psx, p.y);
        if (p.dir === 'left') ctx.scale(-1, 1);

        // Invincible flash
        if (p.invincibleTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }

        const isCrouching = p.action === 'crouch' || p.action === 'crouch_punch' || p.action === 'crouch_kick';
        const yOffset = isCrouching ? 16 : 0;

        // Legs (Red Martial Pants)
        ctx.fillStyle = '#ef4444';
        if (p.action === 'kick' || p.action === 'crouch_kick') {
          // Extended kick leg
          ctx.fillRect(-6, -18 + yOffset, 6, 18);
          ctx.fillRect(0, -26 + yOffset, 28, 8);
          // White shoe
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(26, -27 + yOffset, 7, 10);
        } else if (p.action === 'jump_kick') {
          // Flying Dragon Kick in air
          ctx.fillRect(-12, -18, 12, 10);
          ctx.fillRect(0, -28, 35, 8);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(33, -29, 8, 10);
        } else {
          // Normal walking legs
          const walkOff = p.action === 'walk' ? Math.sin(p.walkFrame * 4) * 6 : 0;
          ctx.fillRect(-7, -18 + yOffset, 6, 18 - walkOff);
          ctx.fillRect(1, -18 + yOffset, 6, 18 + walkOff);
        }

        // White Gi Body
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-9, -40 + yOffset, 18, 24);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-9, -40 + yOffset, 18, 24);

        // Blue Belt
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-10, -26 + yOffset, 20, 5);

        // Head & Spiky Hair
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, -48 + yOffset, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, -51 + yOffset, 8.5, Math.PI, 0);
        ctx.fill();

        // Punch arm
        if (p.action === 'punch' || p.action === 'crouch_punch') {
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(4, -36 + yOffset, 22, 6);
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(16, -37 + yOffset, 4, 8); // wristband
        }

        ctx.restore();
      }

      // F. Draw Particles
      for (const pt of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // G. Draw Floaters
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
  }, [initFloor]);

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full select-none">
      {/* Top HUD Bar */}
      <div className="game-top-hud relative w-full max-w-[min(96vw,1320px)] flex items-center justify-between px-3 sm:px-4 py-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs sm:text-sm flex-shrink-0">
        {/* Left: Controls & Floor selector */}
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
          {/* Player HP Bar */}
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

          {/* Boss HP Bar (if active) */}
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
            <div className="pointer-events-auto grid grid-cols-3 gap-1 w-32 h-32 bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10">
              <div />
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current.up = true;
                  const p = playerRef.current;
                  if (p.isGrounded && !p.isDead && p.actionTimer <= 0 && p.grippedCount === 0) {
                    p.isGrounded = false;
                    p.vy = -12.5;
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

            {/* Action Buttons Right: Punch (J) & Kick (K) */}
            <div className="pointer-events-auto flex items-center gap-3">
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
