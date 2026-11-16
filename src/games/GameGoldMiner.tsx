import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Bomb, 
  ShoppingBag,
  ArrowRight,
  Clock
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'timed' | 'endless';

type ItemType = 
  | 'gold_small' 
  | 'gold_med' 
  | 'gold_large' 
  | 'diamond' 
  | 'rock_small' 
  | 'rock_large' 
  | 'mystery_bag' 
  | 'tnt';

interface MineItem {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  radius: number;
  value: number;
  weight: number; // 0.5 (rất nhẹ) đến 5.5 (rất nặng)
  isAlive: boolean;
  rotation: number;
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
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

// Cấu hình kích thước Widescreen 16:9 Cinema Arcade
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const WINCH_X = CANVAS_WIDTH / 2; // 480px
const WINCH_Y = 65; // Đỉnh tời kéo thợ mỏ
const BASE_HOOK_LEN = 42;
const MAX_SWING_ANGLE = 1.25; // ~72 độ

// Mục tiêu vàng theo từng cấp độ
const LEVEL_TARGETS = [
  650,   // Màn 1
  1400,  // Màn 2
  2300,  // Màn 3
  3400,  // Màn 4
  4700,  // Màn 5
  6200,  // Màn 6
  7900,  // Màn 7
  9800,  // Màn 8
  12000, // Màn 9
  15000, // Màn 10
];

export const GameGoldMiner: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('acegames_gold_miner_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_gold_miner');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['classic', 'timed', 'endless'].includes(parsed.gameMode)) return parsed.gameMode;
      }
    } catch {}
    return 'classic';
  });

  const [initialTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_gold_miner');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLimit === 'number') return parsed.timeLimit;
      }
    } catch {}
    return 60;
  });

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [dynamiteCount, setDynamiteCount] = useState(2);
  const [hasStrengthPotion, setHasStrengthPotion] = useState(false);
  const [hasDiamondPolish, setHasDiamondPolish] = useState(false);
  const [hasLuckyClover, setHasLuckyClover] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Danh sách quặng mỏ
  const [items, setItems] = useState<MineItem[]>([]);
  const itemsRef = useRef<MineItem[]>([]);
  itemsRef.current = items;

  // Trạng thái móc kéo (Hook State)
  const hookStateRef = useRef<'SWINGING' | 'SHOOTING' | 'RETRACTING'>('SWINGING');
  const hookAngleRef = useRef<number>(0);
  const swingDirRef = useRef<number>(1);
  const hookLengthRef = useRef<number>(BASE_HOOK_LEN);
  const grabbedItemRef = useRef<MineItem | null>(null);

  // Hiệu ứng hạt & chữ bay
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

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

  const playLaunchSound = useCallback(() => {
    playTone(320, 'triangle', 0.12, 0.08);
  }, [playTone]);

  const playLatchSound = useCallback(() => {
    playTone(440, 'square', 0.08, 0.06);
    setTimeout(() => playTone(660, 'sine', 0.08, 0.05), 40);
  }, [playTone]);

  const playCoinSound = useCallback(() => {
    playTone(987, 'triangle', 0.1, 0.1);
    setTimeout(() => playTone(1318, 'sine', 0.15, 0.09), 60);
  }, [playTone]);

  const playDiamondSound = useCallback(() => {
    playTone(1200, 'sine', 0.08, 0.08);
    setTimeout(() => playTone(1600, 'sine', 0.12, 0.09), 50);
    setTimeout(() => playTone(2100, 'sine', 0.16, 0.1), 100);
  }, [playTone]);

  const playExplosionSound = useCallback(() => {
    playTone(90, 'sawtooth', 0.35, 0.18);
    setTimeout(() => playTone(60, 'triangle', 0.4, 0.15), 50);
  }, [playTone]);

  // Sinh quặng mỏ cho từng màn chơi
  const generateLevelItems = useCallback((lvl: number): MineItem[] => {
    const list: MineItem[] = [];
    let idCounter = 1;

    const addItem = (type: ItemType, x: number, y: number) => {
      let radius = 18;
      let value = 100;
      let weight = 1.8;

      switch (type) {
        case 'gold_small':
          radius = 13;
          value = 50;
          weight = 1.0;
          break;
        case 'gold_med':
          radius = 21;
          value = 100;
          weight = 1.9;
          break;
        case 'gold_large':
          radius = 33;
          value = 500;
          weight = 3.8;
          break;
        case 'diamond':
          radius = 11;
          value = hasDiamondPolish ? 800 : 600;
          weight = 0.5;
          break;
        case 'rock_small':
          radius = 18;
          value = 11;
          weight = 3.2;
          break;
        case 'rock_large':
          radius = 30;
          value = 20;
          weight = 5.4;
          break;
        case 'mystery_bag':
          radius = 20;
          value = Math.floor(Math.random() * 500) + 150;
          weight = 1.4;
          break;
        case 'tnt':
          radius = 18;
          value = 2;
          weight = 0.8;
          break;
      }

      list.push({
        id: idCounter++,
        type,
        x,
        y,
        radius,
        value,
        weight,
        isAlive: true,
        rotation: (Math.random() - 0.5) * 0.4,
      });
    };

    // Tạo các quặng ngẫu nhiên không đè lên nhau
    const spawnSlots: { x: number; y: number }[] = [];
    const minX = 70;
    const maxX = CANVAS_WIDTH - 70;
    const minY = 160;
    const maxY = CANVAS_HEIGHT - 60;

    const count = 13 + Math.min(lvl * 2, 10);

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let placed = false;
      while (attempts < 25 && !placed) {
        attempts++;
        const candidateX = Math.random() * (maxX - minX) + minX;
        const candidateY = Math.random() * (maxY - minY) + minY;

        const tooClose = spawnSlots.some(s => Math.hypot(s.x - candidateX, s.y - candidateY) < 55);
        if (!tooClose) {
          spawnSlots.push({ x: candidateX, y: candidateY });
          placed = true;

          // Xác suất loại quặng
          const rand = Math.random();
          if (rand < 0.22) {
            addItem('gold_small', candidateX, candidateY);
          } else if (rand < 0.45) {
            addItem('gold_med', candidateX, candidateY);
          } else if (rand < 0.60) {
            addItem('gold_large', candidateX, candidateY);
          } else if (rand < 0.72) {
            addItem('diamond', candidateX, candidateY);
          } else if (rand < 0.84) {
            addItem('mystery_bag', candidateX, candidateY);
          } else if (rand < 0.93) {
            addItem('rock_small', candidateX, candidateY);
          } else if (rand < 0.97) {
            addItem('tnt', candidateX, candidateY);
          } else {
            addItem('rock_large', candidateX, candidateY);
          }
        }
      }
    }

    return list;
  }, [hasDiamondPolish]);

  // Khởi động lại hoặc vào màn mới
  const startLevel = useCallback((lvl: number) => {
    setLevel(lvl);
    setTimeLeft(initialTime);
    setIsShopOpen(false);
    setIsGameOver(false);
    hookStateRef.current = 'SWINGING';
    hookLengthRef.current = BASE_HOOK_LEN;
    grabbedItemRef.current = null;

    const newItems = generateLevelItems(lvl);
    setItems(newItems);
  }, [generateLevelItems, initialTime]);

  useEffect(() => {
    startLevel(1);
  }, [startLevel]);

  // Đếm ngược thời gian ván chơi (60 giây)
  useEffect(() => {
    if (isPaused || isGameOver || isShopOpen || mode === 'endless') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết giờ: Kiểm tra xem đã đạt mục tiêu vàng chưa
          const target = LEVEL_TARGETS[level - 1] || 15000;
          if (score >= target) {
            // Đạt mục tiêu: Qua màn và mở cửa hàng
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });
            playCoinSound();
            setIsShopOpen(true);
          } else {
            // Thất bại
            setIsGameOver(true);
            playTone(160, 'sawtooth', 0.5, 0.15);
          }
          return 0;
        }

        if (prev <= 10) {
          playTone(600, 'sine', 0.04, 0.03);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isPaused, isShopOpen, level, mode, playCoinSound, playTone, score]);

  // Bắn móc câu (Thả móc)
  const handleLaunchHook = useCallback(() => {
    if (hookStateRef.current !== 'SWINGING' || isPaused || isGameOver || isShopOpen) return;
    hookStateRef.current = 'SHOOTING';
    playLaunchSound();
  }, [isGameOver, isPaused, isShopOpen, playLaunchSound]);

  // Ném thuốc nổ làm nổ quặng đang kéo
  const handleUseDynamite = useCallback(() => {
    if (dynamiteCount <= 0 || hookStateRef.current !== 'RETRACTING' || !grabbedItemRef.current) return;

    setDynamiteCount(d => d - 1);
    playExplosionSound();
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 350);

    const item = grabbedItemRef.current;
    grabbedItemRef.current = null;

    // Hiệu ứng nổ đá/quặng
    const newParticles: Particle[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: item.x,
        y: item.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#f97316',
        size: 3.5 + Math.random() * 4,
        alpha: 1,
      });
    }
    setParticles(prev => [...prev.slice(-40), ...newParticles]);

    // Móc câu thu hồi về cực nhanh sau khi nổ
    hookLengthRef.current = Math.max(BASE_HOOK_LEN, hookLengthRef.current - 15);
  }, [dynamiteCount, playExplosionSound]);

  // Bắt phím Space / Mũi tên xuống để thả móc, Mũi tên lên / Phím W để ném thuốc nổ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleLaunchHook();
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleUseDynamite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunchHook, handleUseDynamite]);

  // Vòng lặp vật lý và render Canvas 60 FPS Retina High-DPI
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
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

      // CẬP NHẬT VẬT LÝ MÓC CÂU (PHYSICS UPDATE)
      if (!isPaused && !isGameOver && !isShopOpen) {
        // 1. Nếu đang đung đưa tự do
        if (hookStateRef.current === 'SWINGING') {
          const swingSpeed = 0.038;
          hookAngleRef.current += swingSpeed * swingDirRef.current;

          if (hookAngleRef.current > MAX_SWING_ANGLE) {
            hookAngleRef.current = MAX_SWING_ANGLE;
            swingDirRef.current = -1;
          } else if (hookAngleRef.current < -MAX_SWING_ANGLE) {
            hookAngleRef.current = -MAX_SWING_ANGLE;
            swingDirRef.current = 1;
          }
        }
        // 2. Nếu đang phóng móc ra ngoài
        else if (hookStateRef.current === 'SHOOTING') {
          const shootSpeed = 16;
          hookLengthRef.current += shootSpeed;

          const hookX = WINCH_X + Math.sin(hookAngleRef.current) * hookLengthRef.current;
          const hookY = WINCH_Y + Math.cos(hookAngleRef.current) * hookLengthRef.current;

          // Kiểm tra va chạm biên màn hình
          if (hookX <= 15 || hookX >= CANVAS_WIDTH - 15 || hookY >= CANVAS_HEIGHT - 20) {
            hookStateRef.current = 'RETRACTING';
          } else {
            // Kiểm tra va chạm với các quặng mỏ
            for (const item of itemsRef.current) {
              if (item.isAlive) {
                const dist = Math.hypot(hookX - item.x, hookY - item.y);
                if (dist <= item.radius + 10) {
                  // Trúng quặng!
                  if (item.type === 'tnt') {
                    // Trúng thùng thuốc nổ TNT: Nổ diện rộng!
                    item.isAlive = false;
                    playExplosionSound();
                    setScreenShake(true);
                    setTimeout(() => setScreenShake(false), 350);

                    // Phá hủy tất cả quặng xung quanh trong bán kính 130px
                    setItems(prev =>
                      prev.map(it => {
                        if (it.isAlive && Math.hypot(it.x - item.x, it.y - item.y) <= 130) {
                          return { ...it, isAlive: false };
                        }
                        return it;
                      })
                    );

                    hookStateRef.current = 'RETRACTING';
                  } else {
                    // Cặp trúng quặng thường: Bắt đầu kéo về
                    item.isAlive = false;
                    grabbedItemRef.current = item;
                    hookStateRef.current = 'RETRACTING';
                    playLatchSound();
                  }
                  break;
                }
              }
            }
          }
        }
        // 3. Nếu đang thu hồi dây kéo về
        else if (hookStateRef.current === 'RETRACTING') {
          let pullSpeed = 16;
          const grabbed = grabbedItemRef.current;

          if (grabbed) {
            // Tốc độ kéo phụ thuộc vào khối lượng quặng và bùa tăng lực
            const speedMod = hasStrengthPotion ? 2.0 : 1.0;
            pullSpeed = Math.max(2.8, (14 / grabbed.weight) * speedMod);
          }

          hookLengthRef.current -= pullSpeed;

          // Khi dây đã thu hồi hoàn toàn về vị trí xuất phát
          if (hookLengthRef.current <= BASE_HOOK_LEN) {
            hookLengthRef.current = BASE_HOOK_LEN;
            hookStateRef.current = 'SWINGING';

            if (grabbed) {
              let earned = grabbed.value;

              // Xử lý túi bí ẩn
              if (grabbed.type === 'mystery_bag') {
                const bagRand = Math.random();
                if (bagRand < 0.25) {
                  setDynamiteCount(d => d + 1);
                  setFloatingTexts(prev => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      x: WINCH_X,
                      y: WINCH_Y + 15,
                      text: '+1 THUỐC NỔ 💣',
                      color: '#f97316',
                    }
                  ]);
                } else if (bagRand < 0.45) {
                  setHasStrengthPotion(true);
                  setFloatingTexts(prev => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      x: WINCH_X,
                      y: WINCH_Y + 15,
                      text: 'BÙA SỨC MẠNH! ⚡',
                      color: '#22d3ee',
                    }
                  ]);
                } else {
                  earned = hasLuckyClover ? Math.floor(earned * 1.5) : earned;
                }
              }

              // Cộng điểm tiền vàng
              if (grabbed.type === 'diamond') {
                playDiamondSound();
              } else {
                playCoinSound();
              }

              setScore(s => {
                const ns = s + earned;
                if (ns > highScore) {
                  setHighScore(ns);
                  try {
                    localStorage.setItem('acegames_gold_miner_highscore', ns.toString());
                  } catch {}
                }
                return ns;
              });

              // Tạo chữ bay cộng tiền vàng
              setFloatingTexts(prev => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  x: WINCH_X,
                  y: WINCH_Y + 10,
                  text: `+$${earned}`,
                  color: grabbed.type === 'diamond' ? '#38bdf8' : '#facc15',
                }
              ]);

              grabbedItemRef.current = null;
            }
          }
        }
      }

      // VẼ TOÀN BỘ ĐỒ HỌA SÂN CHƠI (CANVAS RENDER)
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Nền lòng đất mỏ vàng (Địa tầng phân lớp rực rỡ)
      // Tầng mặt đất phía trên
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 80);

      // Thảm cỏ mặt đất
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 76, CANVAS_WIDTH, 4);

      // Tầng lòng đất sâu
      const dirtGrad = ctx.createLinearGradient(0, 80, 0, CANVAS_HEIGHT);
      dirtGrad.addColorStop(0, '#1c1007');
      dirtGrad.addColorStop(0.5, '#130a04');
      dirtGrad.addColorStop(1, '#080402');
      ctx.fillStyle = dirtGrad;
      ctx.fillRect(0, 80, CANVAS_WIDTH, CANVAS_HEIGHT - 80);

      // Vân đất vi hạt lấp lánh vàng
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      for (let gx = 20; gx < CANVAS_WIDTH; gx += 40) {
        for (let gy = 100; gy < CANVAS_HEIGHT; gy += 40) {
          ctx.beginPath();
          ctx.arc(gx + ((gy % 80 === 0) ? 20 : 0), gy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Vẽ tất cả các quặng mỏ trong lòng đất
      for (const item of items) {
        if (!item.isAlive) continue;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        switch (item.type) {
          case 'gold_small':
          case 'gold_med':
          case 'gold_large': {
            // Vàng khối 3D giác cạnh lấp lánh
            ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
            ctx.shadowBlur = item.radius * 0.6;

            const goldGrad = ctx.createRadialGradient(-item.radius * 0.35, -item.radius * 0.35, 2, 0, 0, item.radius);
            goldGrad.addColorStop(0, '#fffbeb');
            goldGrad.addColorStop(0.35, '#fde047');
            goldGrad.addColorStop(0.75, '#eab308');
            goldGrad.addColorStop(1, '#854d0e');

            ctx.fillStyle = goldGrad;
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;

            // Hình đa giác quặng vàng tự nhiên
            ctx.beginPath();
            const sides = item.type === 'gold_large' ? 8 : 6;
            for (let s = 0; s < sides; s++) {
              const a = (Math.PI * 2 * s) / sides;
              const r = item.radius * (0.85 + ((s % 2 === 0) ? 0.15 : -0.1));
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Điểm lóa sáng kim loại
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(-item.radius * 0.35, -item.radius * 0.35, item.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'diamond': {
            // Kim cương phát quang xanh pha lê
            ctx.shadowColor = 'rgba(6, 182, 212, 0.85)';
            ctx.shadowBlur = 14;

            const diamGrad = ctx.createLinearGradient(-item.radius, -item.radius, item.radius, item.radius);
            diamGrad.addColorStop(0, '#ffffff');
            diamGrad.addColorStop(0.4, '#a5f3fc');
            diamGrad.addColorStop(1, '#0284c7');

            ctx.fillStyle = diamGrad;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;

            ctx.beginPath();
            ctx.moveTo(0, -item.radius);
            ctx.lineTo(item.radius, 0);
            ctx.lineTo(0, item.radius);
            ctx.lineTo(-item.radius, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Giác cắt phản chiếu
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.moveTo(0, -item.radius * 0.5);
            ctx.lineTo(item.radius * 0.5, 0);
            ctx.lineTo(0, item.radius * 0.5);
            ctx.lineTo(-item.radius * 0.5, 0);
            ctx.closePath();
            ctx.fill();
            break;
          }

          case 'rock_small':
          case 'rock_large': {
            // Đá cuội xám gồ ghề
            const rockGrad = ctx.createRadialGradient(-item.radius * 0.3, -item.radius * 0.3, 2, 0, 0, item.radius);
            rockGrad.addColorStop(0, '#94a3b8');
            rockGrad.addColorStop(0.6, '#475569');
            rockGrad.addColorStop(1, '#1e293b');

            ctx.fillStyle = rockGrad;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            const sides = 7;
            for (let s = 0; s < sides; s++) {
              const a = (Math.PI * 2 * s) / sides;
              const r = item.radius * (0.85 + (s % 3 === 0 ? 0.15 : -0.08));
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              if (s === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
          }

          case 'mystery_bag': {
            // Túi vải bí ẩn màu da bò có dấu ?
            ctx.fillStyle = '#b45309';
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(0, 3, item.radius * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Túm thắt miệng bao
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-6, -item.radius * 0.9, 12, 6);

            // Dấu chấm hỏi màu vàng sáng
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 4);
            break;
          }

          case 'tnt': {
            // Thùng thuốc nổ màu đỏ có chữ TNT
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-item.radius * 0.8, -item.radius * 0.8, item.radius * 1.6, item.radius * 1.6, 4);
            ctx.fill();
            ctx.stroke();

            // Chữ TNT
            ctx.fillStyle = '#ffffff';
            ctx.font = 'black 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TNT', 0, 0);

            // Ngòi nổ phía trên
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -item.radius * 0.8);
            ctx.lineTo(4, -item.radius * 1.2);
            ctx.stroke();
            break;
          }
        }

        ctx.restore();
      }

      // 3. Tính toán vị trí đầu móc câu hiện tại
      const hookX = WINCH_X + Math.sin(hookAngleRef.current) * hookLengthRef.current;
      const hookY = WINCH_Y + Math.cos(hookAngleRef.current) * hookLengthRef.current;

      // 4. Vẽ quặng đang bị gắp kéo về (nếu có)
      const grabbed = grabbedItemRef.current;
      if (grabbed) {
        ctx.save();
        ctx.translate(hookX, hookY + grabbed.radius * 0.8);

        switch (grabbed.type) {
          case 'gold_small':
          case 'gold_med':
          case 'gold_large': {
            const goldGrad = ctx.createRadialGradient(-grabbed.radius * 0.35, -grabbed.radius * 0.35, 2, 0, 0, grabbed.radius);
            goldGrad.addColorStop(0, '#fffbeb');
            goldGrad.addColorStop(0.35, '#fde047');
            goldGrad.addColorStop(0.75, '#eab308');
            goldGrad.addColorStop(1, '#854d0e');

            ctx.fillStyle = goldGrad;
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(0, 0, grabbed.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          }
          case 'diamond': {
            ctx.fillStyle = '#a5f3fc';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -grabbed.radius);
            ctx.lineTo(grabbed.radius, 0);
            ctx.lineTo(0, grabbed.radius);
            ctx.lineTo(-grabbed.radius, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
          }
          case 'rock_small':
          case 'rock_large': {
            ctx.fillStyle = '#475569';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, grabbed.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          }
          case 'mystery_bag': {
            ctx.fillStyle = '#b45309';
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, grabbed.radius * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 0);
            break;
          }
          default:
            break;
        }

        ctx.restore();
      }

      // 5. Vẽ sợi dây cáp thép nối từ tời đến đầu móc câu
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(WINCH_X, WINCH_Y);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      // Hiệu ứng tia dây sáng
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 6. Vẽ đầu móc câu bằng thép xoay theo góc dây
      ctx.save();
      ctx.translate(hookX, hookY);
      ctx.rotate(-hookAngleRef.current);

      // Càng móc câu đôi bằng kim loại
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;

      // Móc trái
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(-14, 10, -10, 18);
      ctx.lineTo(-6, 12);
      ctx.quadraticCurveTo(-8, 8, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Móc phải
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(14, 10, 10, 18);
      ctx.lineTo(6, 12);
      ctx.quadraticCurveTo(8, 8, 0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Khuyên tròn nối cáp
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 7. Vẽ Thợ Mỏ và Cỗ Xe Kéo Vàng ở mặt đất (WINCH_X, 42)
      ctx.save();
      ctx.translate(WINCH_X, 42);

      // Thùng xe bằng gỗ
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-28, -14, 56, 26, 6);
      ctx.fill();
      ctx.stroke();

      // Bánh xe sắt
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(-18, 14, 7, 0, Math.PI * 2);
      ctx.arc(18, 14, 7, 0, Math.PI * 2);
      ctx.fill();

      // Thợ mỏ đội mũ bảo hộ vàng
      // Đầu
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -18, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bộ râu trắng huyền thoại của ông lão đào vàng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -14, 8, 0, Math.PI);
      ctx.fill();

      // Mũ bảo hộ vàng có đèn pin
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -22, 11, Math.PI, 0);
      ctx.fill();

      // Đèn pin trên mũ sáng rực
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -23, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 8. Vẽ các hạt vụn nổ
      for (const p of particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Vẽ chữ bay tiền vàng
      for (const f of floatingTexts) {
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      ctx.restore(); // Kết thúc scale dpr

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [hasDiamondPolish, hasLuckyClover, hasStrengthPotion, isGameOver, isPaused, isShopOpen, items, particles, playDiamondSound, playCoinSound, playExplosionSound, playLatchSound]);

  // Cập nhật hạt bụi nổ & chữ bay
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.16,
            alpha: p.alpha - 0.04,
          }))
          .filter(p => p.alpha > 0)
      );

      setFloatingTexts(prev =>
        prev
          .map(t => ({
            ...t,
            y: t.y - 1.3,
          }))
          .slice(-10)
      );
    }, 25);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (floatingTexts.length > 0) {
      const t = setTimeout(() => {
        setFloatingTexts(prev => prev.slice(1));
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [floatingTexts]);

  const targetScore = LEVEL_TARGETS[level - 1] || 15000;

  // Mua hàng trong shop
  const handleBuyItem = (itemType: 'dynamite' | 'strength' | 'polish' | 'clover', price: number) => {
    if (score < price) return;
    soundManager.playButtonClick();
    playCoinSound();
    setScore(s => s - price);

    switch (itemType) {
      case 'dynamite':
        setDynamiteCount(d => d + 1);
        break;
      case 'strength':
        setHasStrengthPotion(true);
        break;
      case 'polish':
        setHasDiamondPolish(true);
        break;
      case 'clover':
        setHasLuckyClover(true);
        break;
    }
  };

  const handleNextLevelFromShop = () => {
    soundManager.playButtonClick();
    startLevel(level + 1);
  };

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setDynamiteCount(2);
    setHasStrengthPotion(false);
    setHasDiamondPolish(false);
    setHasLuckyClover(false);
    startLevel(1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070503]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi & Nút Ném Thuốc Nổ */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['classic', 'timed', 'endless'] as GameMode[]).map(m => (
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
                {m === 'classic' ? 'Cổ Điển' : m === 'timed' ? 'Tính Giờ' : 'Vô Tận'}
              </button>
            ))}
          </div>

          {/* Nút Ném Thuốc Nổ */}
          <button
            onClick={handleUseDynamite}
            disabled={dynamiteCount <= 0 || hookStateRef.current !== 'RETRACTING' || !grabbedItemRef.current}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 shadow-sm ${
              dynamiteCount > 0 && hookStateRef.current === 'RETRACTING' && grabbedItemRef.current
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800 text-gray-400 border-white/10 opacity-70'
            }`}
            title="Ném thuốc nổ phá quặng nặng đang kéo (Phím W hoặc Mũi tên lên)"
          >
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            <span>NỔ ({dynamiteCount})</span>
          </button>
        </div>

        {/* Khối Giữa: TIỀN VÀNG & MỤC TIÊU & THỜI GIAN - CĂN CHÍNH GIỮA 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[380px] sm:w-[480px] h-full flex items-center justify-center z-0 pointer-events-none select-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-gray-500 font-black text-base sm:text-lg select-none">•</span>
          </div>

          <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide">VÀNG:</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono min-w-[50px] text-right">
              ${score.toLocaleString()}
            </span>
          </div>

          <div className="absolute left-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-start gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-bold text-gray-300 font-mono">
              MỤC TIÊU: <span className="text-amber-400 font-black">${targetScore.toLocaleString()}</span>
            </span>
            <span className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Khối Phải: Màn chơi & Tạm Dừng & Ván Mới */}
        <div className="flex items-center gap-2 z-10">
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-black text-cyan-300 font-mono">
            MÀN {level}
          </span>

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
            title="Ván Mới"
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
          onClick={handleLaunchHook}
          onContextMenu={(e) => {
            e.preventDefault();
            handleUseDynamite();
          }}
          className="w-full h-full cursor-pointer block"
        />

        {/* Nút bấm to ảo trên điện thoại để thả móc */}
        <div className="sm:hidden absolute bottom-4 right-4 z-20">
          <button
            onClick={handleLaunchHook}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-2xl active:scale-90 text-sm uppercase"
          >
            THẢ
          </button>
        </div>

        {/* Cửa Hàng Thợ Mỏ Giữa Các Màn (Shop Modal) */}
        {isShopOpen && (
          <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
                  <ShoppingBag className="w-6 h-6" />
                  <span>CỬA HÀNG THỢ MỎ</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 font-black font-mono">
                  TIỀN VÀNG: ${score.toLocaleString()}
                </div>
              </div>

              {/* Danh sách vật phẩm có thể mua */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {/* 1. Thuốc nổ */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-1">💣</div>
                    <span className="text-xs font-bold text-white block">Thuốc Nổ</span>
                    <span className="text-[10px] text-gray-400 block mb-2">Phá đá nặng khi bị kéo nhầm</span>
                  </div>
                  <button
                    onClick={() => handleBuyItem('dynamite', 150)}
                    disabled={score < 150}
                    className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    $150
                  </button>
                </div>

                {/* 2. Nước tăng lực */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-1">⚡</div>
                    <span className="text-xs font-bold text-white block">Nước Tăng Lực</span>
                    <span className="text-[10px] text-gray-400 block mb-2">Kéo quặng nhanh gấp đôi màn sau</span>
                  </div>
                  <button
                    onClick={() => handleBuyItem('strength', 200)}
                    disabled={score < 200 || hasStrengthPotion}
                    className="w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    {hasStrengthPotion ? 'ĐÃ CÓ' : '$200'}
                  </button>
                </div>

                {/* 3. Đánh bóng kim cương */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-1">💎</div>
                    <span className="text-xs font-bold text-white block">Nước Đánh Bóng</span>
                    <span className="text-[10px] text-gray-400 block mb-2">Kim cương tăng thêm +$200</span>
                  </div>
                  <button
                    onClick={() => handleBuyItem('polish', 180)}
                    disabled={score < 180 || hasDiamondPolish}
                    className="w-full py-1.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    {hasDiamondPolish ? 'ĐÃ CÓ' : '$180'}
                  </button>
                </div>

                {/* 4. Cỏ 4 lá may mắn */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-1">🍀</div>
                    <span className="text-xs font-bold text-white block">Cỏ May Mắn</span>
                    <span className="text-[10px] text-gray-400 block mb-2">Túi bí ẩn mở ra phần thưởng xịn</span>
                  </div>
                  <button
                    onClick={() => handleBuyItem('clover', 120)}
                    disabled={score < 120 || hasLuckyClover}
                    className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    {hasLuckyClover ? 'ĐÃ CÓ' : '$120'}
                  </button>
                </div>
              </div>

              {/* Nút sang màn tiếp theo */}
              <div className="pt-2">
                <button
                  onClick={handleNextLevelFromShop}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt Đầu Màn {level + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <span className="text-5xl mb-2 animate-bounce">⛏️</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">CHƯA ĐẠT MỤC TIÊU!</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Mục tiêu màn {level} là ${targetScore.toLocaleString()}, bạn chỉ đào được ${score.toLocaleString()}.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[220px]">
              <span className="text-xs text-gray-400 block mb-1">TIỀN VÀNG CAO NHẤT</span>
              <span className="text-2xl font-black text-amber-400 font-mono">${highScore.toLocaleString()}</span>
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95"
            >
              Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
