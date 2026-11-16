import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Crosshair,
  ArrowRightLeft,
  Flame
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'timed' | 'endless';

interface Bubble {
  color: number; // 0..4
  isSpecial?: 'bomb' | 'rainbow';
}

interface MovingProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  isSpecial?: 'bomb' | 'rainbow';
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

interface FloatingBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  rotation: number;
  vRot: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

// Cấu hình kích thước chuẩn Widescreen 16:9 Arcade Canvas
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const COLS_EVEN = 20;
const COLS_ODD = 19;
const MAX_ROWS = 12;
const BUBBLE_RADIUS = 24;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2; // 48px
const ROW_HEIGHT = 42; // Math.round(24 * sqrt(3)) ~ 41.57 -> 42px
const CANNON_X = CANVAS_WIDTH / 2; // 480px
const CANNON_Y = CANVAS_HEIGHT - 45; // 495px
const GAME_OVER_LIMIT_Y = 445; // Ngưỡng trứng chạm đáy tính thua

const BUBBLE_PALETTE = [
  { name: 'Ruby', fill: '#ef4444', light: '#fca5a5', dark: '#991b1b', shadow: 'rgba(239,68,68,0.7)', spot: '#f87171' },
  { name: 'Ice', fill: '#06b6d4', light: '#a5f3fc', dark: '#0e7490', shadow: 'rgba(6,182,212,0.7)', spot: '#38bdf8' },
  { name: 'Emerald', fill: '#10b981', light: '#a7f3d0', dark: '#065f46', shadow: 'rgba(168,85,247,0.7)', spot: '#34d399' },
  { name: 'Solar', fill: '#f59e0b', light: '#fef08a', dark: '#b45309', shadow: 'rgba(245,158,11,0.7)', spot: '#fbbf24' },
  { name: 'Amethyst', fill: '#a855f7', light: '#f5d0fe', dark: '#6b21a8', shadow: 'rgba(168,85,247,0.7)', spot: '#c084fc' },
];

export const GameBubbleShooter: React.FC = () => {
  const [grid, setGrid] = useState<(Bubble | null)[][]>([]);
  const [, setCeilingRows] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('acegames_bubble_shooter_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_bubble_shooter');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['classic', 'timed', 'endless'].includes(parsed.gameMode)) return parsed.gameMode;
      }
    } catch {}
    return 'classic';
  });

  const [aimGuideEnabled, setAimGuideEnabled] = useState(true);
  const [foulCount, setFoulCount] = useState(0); // 5 lần bắn trượt hạ trần
  const [comboStreak, setComboStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Quả trứng hiện tại và quả tiếp theo
  const [currentBubble, setCurrentBubble] = useState<number>(0);
  const [nextBubble, setNextBubble] = useState<number>(1);
  
  // Dùng Ref cho góc ngắm để phản hồi chuột 0ms cực mượt, không kích hoạt re-render
  const aimAngleRef = useRef<number>(-Math.PI / 2);

  // Hiệu ứng hạt & chữ bay
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fallingBubbles, setFallingBubbles] = useState<FloatingBubble[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Đạn đang bay
  const projectileRef = useRef<MovingProjectile | null>(null);
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

  const playShootSound = useCallback(() => {
    playTone(500, 'triangle', 0.08, 0.09);
    setTimeout(() => playTone(380, 'sine', 0.08, 0.05), 30);
  }, [playTone]);

  const playBounceSound = useCallback(() => {
    playTone(580, 'sine', 0.04, 0.04);
  }, [playTone]);

  const playPopSound = useCallback((combo: number) => {
    const baseFreq = 540 + Math.min(combo * 80, 600);
    playTone(baseFreq, 'triangle', 0.12, 0.1);
    setTimeout(() => playTone(baseFreq * 1.25, 'sine', 0.15, 0.08), 50);
  }, [playTone]);

  const playDropSound = useCallback(() => {
    playTone(290, 'sawtooth', 0.18, 0.06);
  }, [playTone]);

  const playWarningRumble = useCallback(() => {
    playTone(110, 'sawtooth', 0.35, 0.12);
  }, [playTone]);

  // Tạo ngẫu nhiên một màu trứng từ các màu hiện đang xuất hiện trên bàn
  const getRandomActiveColor = useCallback((currentGrid: (Bubble | null)[][]): number => {
    const activeColors = new Set<number>();
    for (const row of currentGrid) {
      for (const cell of row) {
        if (cell) activeColors.add(cell.color);
      }
    }
    if (activeColors.size > 0) {
      const arr = Array.from(activeColors);
      return arr[Math.floor(Math.random() * arr.length)];
    }
    return Math.floor(Math.random() * BUBBLE_PALETTE.length);
  }, []);

  // Khởi tạo bàn trứng mới
  const initBoard = useCallback((initialRows: number = 5) => {
    const newGrid: (Bubble | null)[][] = [];
    const numColors = Math.min(3 + level, BUBBLE_PALETTE.length);

    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
      const row: (Bubble | null)[] = [];
      for (let c = 0; c < cols; c++) {
        if (r < initialRows) {
          row.push({ color: Math.floor(Math.random() * numColors) });
        } else {
          row.push(null);
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setCeilingRows(0);
    setFoulCount(0);
    setComboStreak(0);
    setIsGameOver(false);
    setIsVictory(false);
    projectileRef.current = null;

    const firstColor = getRandomActiveColor(newGrid);
    const secondColor = getRandomActiveColor(newGrid);
    setCurrentBubble(firstColor);
    setNextBubble(secondColor);
  }, [getRandomActiveColor, level]);

  useEffect(() => {
    initBoard(5);
  }, [initBoard]);

  // Lấy tọa độ tâm pixel (x, y) của ô (r, c)
  const getBubbleCenter = useCallback((r: number, c: number) => {
    const isEven = r % 2 === 0;
    const x = isEven
      ? c * BUBBLE_DIAMETER + BUBBLE_RADIUS
      : c * BUBBLE_DIAMETER + BUBBLE_DIAMETER;
    const y = r * ROW_HEIGHT + BUBBLE_RADIUS;
    return { x, y };
  }, []);

  // Lấy danh sách ô lân cận trên lưới lục giác
  const getNeighbors = useCallback((r: number, c: number) => {
    const neighbors: { r: number; c: number }[] = [];
    const isEven = r % 2 === 0;

    const deltas = isEven
      ? [
          { r: r - 1, c: c - 1 },
          { r: r - 1, c: c },
          { r: r, c: c - 1 },
          { r: r, c: c + 1 },
          { r: r + 1, c: c - 1 },
          { r: r + 1, c: c },
        ]
      : [
          { r: r - 1, c: c },
          { r: r - 1, c: c + 1 },
          { r: r, c: c - 1 },
          { r: r, c: c + 1 },
          { r: r + 1, c: c },
          { r: r + 1, c: c + 1 },
        ];

    for (const d of deltas) {
      if (d.r >= 0 && d.r < MAX_ROWS) {
        const maxCols = d.r % 2 === 0 ? COLS_EVEN : COLS_ODD;
        if (d.c >= 0 && d.c < maxCols) {
          neighbors.push(d);
        }
      }
    }
    return neighbors;
  }, []);

  // Hoán đổi quả trứng chuẩn bị bắn
  const handleSwapBubbles = useCallback(() => {
    if (projectileRef.current || isPaused || isGameOver || isVictory) return;
    soundManager.playButtonClick();
    playTone(620, 'triangle', 0.05, 0.05);
    setCurrentBubble(prev => {
      const next = nextBubble;
      setNextBubble(prev);
      return next;
    });
  }, [isGameOver, isPaused, isVictory, nextBubble, playTone]);

  // Xử lý nổ bóng và rơi cụm treo lơ lửng
  const handleBubbleSnapped = useCallback((snapRow: number, snapCol: number, snappedColor: number, currentGrid: (Bubble | null)[][]) => {
    const updatedGrid = currentGrid.map(row => [...row]);
    updatedGrid[snapRow][snapCol] = { color: snappedColor };

    // 1. Tìm cụm đồng màu kết nối (Flood fill BFS)
    const matchedCluster: { r: number; c: number }[] = [];
    const visited = new Set<string>();
    const queue: { r: number; c: number }[] = [{ r: snapRow, c: snapCol }];
    visited.add(`${snapRow},${snapCol}`);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      matchedCluster.push(curr);

      const nbs = getNeighbors(curr.r, curr.c);
      for (const nb of nbs) {
        const key = `${nb.r},${nb.c}`;
        if (!visited.has(key)) {
          const neighborTile = updatedGrid[nb.r][nb.c];
          if (neighborTile && neighborTile.color === snappedColor) {
            visited.add(key);
            queue.push(nb);
          }
        }
      }
    }

    if (matchedCluster.length >= 3) {
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);
      playPopSound(newCombo);

      const centerCoord = getBubbleCenter(snapRow, snapCol);

      // Thêm điểm số
      const earned = matchedCluster.length * 40 * Math.max(1, newCombo);
      setScore(s => {
        const newScore = s + earned;
        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem('acegames_bubble_shooter_highscore', newScore.toString());
          } catch {}
        }
        return newScore;
      });

      // Tạo chữ bay điểm số
      setFloatingTexts(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: centerCoord.x,
          y: centerCoord.y,
          text: `+${earned}${newCombo > 1 ? ` (x${newCombo})` : ''}`,
          color: BUBBLE_PALETTE[snappedColor].light,
        }
      ]);

      // Xóa các quả nổ và tạo hạt nổ siêu nét
      const newParticles: Particle[] = [];
      for (const tile of matchedCluster) {
        updatedGrid[tile.r][tile.c] = null;
        const pos = getBubbleCenter(tile.r, tile.c);
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
          const speed = 2.5 + Math.random() * 4;
          newParticles.push({
            id: Date.now() + Math.random() + i,
            x: pos.x,
            y: pos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: BUBBLE_PALETTE[snappedColor].fill,
            size: 3.5 + Math.random() * 3.5,
            alpha: 1,
          });
        }
      }
      setParticles(prev => [...prev.slice(-50), ...newParticles]);

      // 2. Tìm các quả trứng treo lơ lửng mất điểm tựa trần
      const anchored = new Set<string>();
      const anchorQueue: { r: number; c: number }[] = [];

      for (let c = 0; c < COLS_EVEN; c++) {
        if (updatedGrid[0][c] !== null) {
          anchored.add(`0,${c}`);
          anchorQueue.push({ r: 0, c });
        }
      }

      while (anchorQueue.length > 0) {
        const curr = anchorQueue.shift()!;
        const nbs = getNeighbors(curr.r, curr.c);
        for (const nb of nbs) {
          const key = `${nb.r},${nb.c}`;
          if (!anchored.has(key) && updatedGrid[nb.r][nb.c] !== null) {
            anchored.add(key);
            anchorQueue.push(nb);
          }
        }
      }

      // Rơi tất cả các quả không gắn với trần
      const newFalling: FloatingBubble[] = [];
      let droppedCount = 0;
      for (let r = 0; r < MAX_ROWS; r++) {
        const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
        for (let c = 0; c < cols; c++) {
          if (updatedGrid[r][c] !== null && !anchored.has(`${r},${c}`)) {
            const pos = getBubbleCenter(r, c);
            newFalling.push({
              id: Date.now() + Math.random() + droppedCount,
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 5,
              vy: 2 + Math.random() * 2.5,
              color: updatedGrid[r][c]!.color,
              rotation: 0,
              vRot: (Math.random() - 0.5) * 0.2,
            });
            updatedGrid[r][c] = null;
            droppedCount++;
          }
        }
      }

      if (droppedCount > 0) {
        playDropSound();
        const dropBonus = droppedCount * 100 * Math.max(1, newCombo);
        setScore(s => {
          const ns = s + dropBonus;
          if (ns > highScore) {
            setHighScore(ns);
            try {
              localStorage.setItem('acegames_bubble_shooter_highscore', ns.toString());
            } catch {}
          }
          return ns;
        });
        setFallingBubbles(prev => [...prev.slice(-40), ...newFalling]);
        setFloatingTexts(prev => [
          ...prev,
          {
            id: Date.now() + Math.random() + 50,
            x: CANVAS_WIDTH / 2,
            y: 220,
            text: `RỤNG ${droppedCount} QUẢ! +${dropBonus}`,
            color: '#facc15',
          }
        ]);
      }

      // Kiểm tra chiến thắng (Sạch bóng bàn cờ)
      let remainingCount = 0;
      for (const row of updatedGrid) {
        for (const cell of row) {
          if (cell !== null) remainingCount++;
        }
      }

      if (remainingCount === 0) {
        setIsVictory(true);
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setLevel(lvl => lvl + 1);
          initBoard(Math.min(5 + level, 7));
        }, 2200);
      }
    } else {
      setComboStreak(0);
      setFoulCount(f => {
        const nextFoul = f + 1;
        if (nextFoul >= 5) {
          setScreenShake(true);
          playWarningRumble();
          setTimeout(() => setScreenShake(false), 450);

          // Đẩy thêm 1 hàng trứng mới ở trên cùng
          const newRow: (Bubble | null)[] = [];
          const numColors = Math.min(3 + level, BUBBLE_PALETTE.length);
          for (let c = 0; c < COLS_EVEN; c++) {
            newRow.push({ color: Math.floor(Math.random() * numColors) });
          }

          updatedGrid.pop();
          updatedGrid.unshift(newRow);
          setCeilingRows(cr => cr + 1);
          return 0;
        }
        return nextFoul;
      });
    }

    // Kiểm tra thua cuộc: Trứng chạm đáy nguy hiểm
    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
      for (let c = 0; c < cols; c++) {
        if (updatedGrid[r][c] !== null) {
          const pos = getBubbleCenter(r, c);
          if (pos.y + BUBBLE_RADIUS >= GAME_OVER_LIMIT_Y) {
            setIsGameOver(true);
            playTone(180, 'sawtooth', 0.5, 0.15);
            break;
          }
        }
      }
    }

    setGrid(updatedGrid);

    // Chuẩn bị đạn tiếp theo
    setCurrentBubble(nextBubble);
    setNextBubble(getRandomActiveColor(updatedGrid));
    projectileRef.current = null;
  }, [comboStreak, getBubbleCenter, getNeighbors, getRandomActiveColor, highScore, initBoard, level, nextBubble, playDropSound, playPopSound, playWarningRumble, playTone]);

  // Bắn bóng
  const handleShoot = useCallback(() => {
    if (projectileRef.current || isPaused || isGameOver || isVictory) return;

    playShootSound();

    const currentAngle = aimAngleRef.current;
    const speed = 22;
    projectileRef.current = {
      x: CANNON_X + Math.cos(currentAngle) * 35,
      y: CANNON_Y + Math.sin(currentAngle) * 35,
      vx: Math.cos(currentAngle) * speed,
      vy: Math.sin(currentAngle) * speed,
      color: currentBubble,
    };
  }, [currentBubble, isGameOver, isPaused, isVictory, playShootSound]);

  // Cập nhật hướng ngắm theo chuột tức thì 0ms latency (ghi vào Ref, không re-render React)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver || isVictory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const targetX = (e.clientX - rect.left) * scaleX;
    const targetY = (e.clientY - rect.top) * scaleY;

    const dx = targetX - CANNON_X;
    const dy = targetY - CANNON_Y;

    // Giới hạn góc ngắm trong khoảng từ -168 đến -12 độ
    let angle = Math.atan2(dy, dx);
    const minAngle = -Math.PI + 0.18;
    const maxAngle = -0.18;

    if (angle > 0) {
      angle = dx < 0 ? minAngle : maxAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    aimAngleRef.current = angle;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Nhấp chuột phải: đổi trứng
    if (e.button === 2) {
      handleSwapBubbles();
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const targetX = (e.clientX - rect.left) * scaleX;
      const targetY = (e.clientY - rect.top) * scaleY;

      // Nhấp vào quả trứng tiếp theo (Next Bubble) ở bệ đỡ bên trái: đổi trứng
      const distToNext = Math.hypot(targetX - (CANNON_X - 66), targetY - (CANNON_Y + 4));
      if (distToNext <= 30) {
        handleSwapBubbles();
        return;
      }
    }

    handleShoot();
  };

  // Phím tắt bàn phím: Phím Space để đổi trứng hoặc bắn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleSwapBubbles();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwapBubbles]);

  // Hàm vẽ quả trứng 3D siêu sắc nét (Multi-stop High-DPI Radial Gradient & Glass Specular)
  const drawSharpBubble = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number,
    radius: number = BUBBLE_RADIUS,
    shadowBlur: number = 8
  ) => {
    const pal = BUBBLE_PALETTE[colorIndex];
    ctx.save();

    // 1. Ánh sáng dạ quang
    ctx.shadowColor = pal.shadow;
    ctx.shadowBlur = shadowBlur;

    // 2. Thân trứng khối cầu 3D với 5 điểm chuyển màu sắc sảo
    const grad = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.08,
      x,
      y,
      radius
    );
    grad.addColorStop(0, '#ffffff'); // Điểm cực sáng trung tâm
    grad.addColorStop(0.18, pal.light);
    grad.addColorStop(0.65, pal.fill);
    grad.addColorStop(0.92, pal.dark);
    grad.addColorStop(1, '#050814'); // Vòng viền tối ambient occlusion

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Viền phản chiếu pha lê sắc nét
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Các đốm trứng khủng long chân thực
    ctx.fillStyle = pal.spot;
    ctx.beginPath();
    ctx.arc(x + radius * 0.35, y - radius * 0.25, radius * 0.16, 0, Math.PI * 2);
    ctx.arc(x - radius * 0.38, y + radius * 0.28, radius * 0.14, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.15, y + radius * 0.42, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();

    // 5. Vết bóng sáng chính bóng bẩy (Primary Specular Highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.35, y - radius * 0.38, radius * 0.35, radius * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 6. Điểm phản xạ hắt sáng thứ hai ở góc đối diện (Secondary ambient rim bounce)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.35, y + radius * 0.38, radius * 0.22, radius * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  // Vòng lặp vẽ đồ họa Canvas 60 FPS Retina High-DPI Widescreen (Chạy mượt 0ms giật lag)
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Đọc góc ngắm trực tiếp từ Ref giúp xoay nòng pháo tức thời 0ms
      const currentAimAngle = aimAngleRef.current;

      // Hỗ trợ High-DPI Retina (2x buffer) giúp hình ảnh cực kỳ sắc nét
      const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2;
      const targetWidth = CANVAS_WIDTH * dpr;
      const targetHeight = CANVAS_HEIGHT * dpr;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Nền tối sâu sạch sẽ, không rối mắt
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Lưới sao vi điểm tinh tế
      ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
      for (let gx = 16; gx < CANVAS_WIDTH; gx += 32) {
        for (let gy = 16; gy < CANVAS_HEIGHT; gy += 32) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Vẽ tất cả các quả trứng tĩnh trên lưới (siêu sắc nét)
      for (let r = 0; r < MAX_ROWS; r++) {
        const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
        for (let c = 0; c < cols; c++) {
          const cell = grid[r] ? grid[r][c] : null;
          if (!cell) continue;
          const pos = getBubbleCenter(r, c);
          drawSharpBubble(ctx, pos.x, pos.y, cell.color, BUBBLE_RADIUS, 10);
        }
      }

      // 3. Tia ngắm laser dội tường (Phản xạ tức thời theo chuột, không bị giật trễ)
      if (aimGuideEnabled && !projectileRef.current && !isGameOver && !isVictory) {
        ctx.save();

        let startX = CANNON_X;
        let startY = CANNON_Y;
        let dirX = Math.cos(currentAimAngle);
        let dirY = Math.sin(currentAimAngle);
        let maxSegments = 3;

        // Quầng sáng laser ngoài
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        let tempSX = startX;
        let tempSY = startY;
        let tempDX = dirX;
        let tempDY = dirY;

        for (let seg = 0; seg < maxSegments; seg++) {
          let targetX = tempSX + tempDX * 1200;
          let targetY = tempSY + tempDY * 1200;

          if (tempDX < 0 && targetX < BUBBLE_RADIUS) {
            const d = (BUBBLE_RADIUS - tempSX) / tempDX;
            targetX = BUBBLE_RADIUS;
            targetY = tempSY + tempDY * d;
            ctx.lineTo(targetX, targetY);
            tempSX = targetX;
            tempSY = targetY;
            tempDX = -tempDX;
          } else if (tempDX > 0 && targetX > CANVAS_WIDTH - BUBBLE_RADIUS) {
            const d = (CANVAS_WIDTH - BUBBLE_RADIUS - tempSX) / tempDX;
            targetX = CANVAS_WIDTH - BUBBLE_RADIUS;
            targetY = tempSY + tempDY * d;
            ctx.lineTo(targetX, targetY);
            tempSX = targetX;
            tempSY = targetY;
            tempDX = -tempDX;
          } else {
            ctx.lineTo(targetX, targetY);
            break;
          }
        }
        ctx.stroke();

        // Lõi laser trắng sáng bên trong
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();

        // Điểm phản xạ laser ở đầu nòng pháo
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(CANNON_X + Math.cos(currentAimAngle) * 55, CANNON_Y + Math.sin(currentAimAngle) * 55, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Cập nhật và vẽ đạn đang bay
      const proj = projectileRef.current;
      if (proj) {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Dội tường trái
        if (proj.x - BUBBLE_RADIUS <= 0) {
          proj.x = BUBBLE_RADIUS;
          proj.vx = -proj.vx;
          playBounceSound();
        }
        // Dội tường phải
        else if (proj.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
          proj.x = CANVAS_WIDTH - BUBBLE_RADIUS;
          proj.vx = -proj.vx;
          playBounceSound();
        }

        // Kiểm tra va chạm trần hoặc các quả trứng trên lưới
        let hasCollided = false;
        let snapR = 0;
        let snapC = 0;

        if (proj.y - BUBBLE_RADIUS <= 0) {
          hasCollided = true;
          snapR = 0;
          let minDist = Infinity;
          for (let c = 0; c < COLS_EVEN; c++) {
            if (grid[0] && grid[0][c] === null) {
              const pos = getBubbleCenter(0, c);
              const dist = Math.abs(pos.x - proj.x);
              if (dist < minDist) {
                minDist = dist;
                snapC = c;
              }
            }
          }
        } else {
          outerLoop: for (let r = 0; r < MAX_ROWS; r++) {
            const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
            for (let c = 0; c < cols; c++) {
              if (grid[r] && grid[r][c] !== null) {
                const center = getBubbleCenter(r, c);
                const distSq = (proj.x - center.x) ** 2 + (proj.y - center.y) ** 2;
                if (distSq <= (BUBBLE_DIAMETER - 2) ** 2) {
                  hasCollided = true;
                  let bestDist = Infinity;
                  let foundSlot = false;

                  for (let checkR = 0; checkR < MAX_ROWS; checkR++) {
                    const checkCols = checkR % 2 === 0 ? COLS_EVEN : COLS_ODD;
                    for (let checkC = 0; checkC < checkCols; checkC++) {
                      if (grid[checkR] && grid[checkR][checkC] === null) {
                        const emptyPos = getBubbleCenter(checkR, checkC);
                        const d = (proj.x - emptyPos.x) ** 2 + (proj.y - emptyPos.y) ** 2;
                        if (d < bestDist) {
                          bestDist = d;
                          snapR = checkR;
                          snapC = checkC;
                          foundSlot = true;
                        }
                      }
                    }
                  }

                  if (!foundSlot) {
                    snapR = r;
                    snapC = c;
                  }
                  break outerLoop;
                }
              }
            }
          }
        }

        if (hasCollided) {
          handleBubbleSnapped(snapR, snapC, proj.color, grid);
        } else {
          drawSharpBubble(ctx, proj.x, proj.y, proj.color, BUBBLE_RADIUS, 18);
        }
      }

      // 5. Vẽ các quả bóng đang rụng tự do
      for (const fb of fallingBubbles) {
        ctx.save();
        ctx.translate(fb.x, fb.y);
        ctx.rotate(fb.rotation);
        drawSharpBubble(ctx, 0, 0, fb.color, BUBBLE_RADIUS, 6);
        ctx.restore();
      }

      // 6. Vẽ các hạt nổ
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

      // 7. Vẽ chữ bay điểm số (Font to đậm nét)
      for (const f of floatingTexts) {
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.font = '900 17px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      // 8. VẼ KHẨU PHÁO BẰNG ĐỒNG Ở ĐÁY (Vẽ theo thứ tự lớp chuẩn để đạn luôn hiện rõ 100%)
      
      // BƯỚC 8.1: Chân bệ pháo đồng (Vẽ trước tiên làm nền phía dưới)
      ctx.save();
      ctx.translate(CANNON_X, CANNON_Y + 18);

      const baseGrad = ctx.createLinearGradient(-44, 0, 44, 0);
      baseGrad.addColorStop(0, '#361502');
      baseGrad.addColorStop(0.5, '#78350f');
      baseGrad.addColorStop(1, '#361502');

      ctx.fillStyle = baseGrad;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 10, 44, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // 5 Đèn LED báo sập trần tinh xảo trên vành bệ
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI - 0.42 - (i * (Math.PI - 0.84)) / 4;
        const lx = Math.cos(angle) * 34;
        const ly = 10 - Math.sin(angle) * 34;
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        if (i < foulCount) {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }
      ctx.restore();

      // BƯỚC 8.2: Bệ đỡ và quả trứng tiếp theo (NEXT BUBBLE) bên trái bệ pháo
      const nextX = CANNON_X - 66;
      const nextY = CANNON_Y + 4;

      ctx.save();
      // Đĩa đồng đựng trứng tiếp theo
      ctx.fillStyle = '#221105';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nextX, nextY + 12, 22, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Quả trứng tiếp theo (Next Egg)
      drawSharpBubble(ctx, nextX, nextY, nextBubble, 20, 10);
      ctx.restore();

      // BƯỚC 8.3: Nòng pháo xoay (Vẽ theo hướng ngắm currentAimAngle)
      ctx.save();
      ctx.translate(CANNON_X, CANNON_Y);
      ctx.rotate(currentAimAngle + Math.PI / 2);

      // Ống pháo kim loại bằng đồng
      const cannonGrad = ctx.createLinearGradient(-16, 0, 16, 0);
      cannonGrad.addColorStop(0, '#592005');
      cannonGrad.addColorStop(0.35, '#f59e0b');
      cannonGrad.addColorStop(0.7, '#d97706');
      cannonGrad.addColorStop(1, '#592005');

      ctx.fillStyle = cannonGrad;
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -62, 32, 56, [8, 8, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Đai vàng nẹp nòng pháo
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-18, -52, 36, 5);
      ctx.fillRect(-18, -26, 36, 5);

      // Vòng miệng nòng pháo phát sáng
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, -62, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // BƯỚC 8.4: QUẢ TRỨNG SẮP BẮN (LOADED CURRENT BUBBLE) - VẼ Ở LỚP TRÊN CÙNG!
      // Không bị bất kỳ vật thể nào che khuất, phát sáng rõ ràng
      const loadedX = CANNON_X + Math.cos(currentAimAngle) * 12;
      const loadedY = CANNON_Y + Math.sin(currentAimAngle) * 12;

      // Vòng hào quang sáng bao quanh đạn chuẩn bị bắn
      ctx.save();
      ctx.shadowColor = BUBBLE_PALETTE[currentBubble].shadow;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(loadedX, loadedY, BUBBLE_RADIUS + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Vẽ quả trứng đang nạp trong nòng pháo
      drawSharpBubble(ctx, loadedX, loadedY, currentBubble, BUBBLE_RADIUS, 22);

      ctx.restore(); // Kết thúc dpr scale

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [aimGuideEnabled, currentBubble, drawSharpBubble, fallingBubbles, floatingTexts, foulCount, getBubbleCenter, grid, handleBubbleSnapped, isGameOver, isVictory, nextBubble, particles, playBounceSound]);

  // Vòng lặp vật lý hạt & bóng rơi
  useEffect(() => {
    const timer = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.16,
            alpha: p.alpha - 0.035,
          }))
          .filter(p => p.alpha > 0)
      );

      setFallingBubbles(prev =>
        prev
          .map(b => ({
            ...b,
            x: b.x + b.vx,
            y: b.y + b.vy,
            vy: b.vy + 0.45,
            rotation: b.rotation + b.vRot,
          }))
          .filter(b => b.y < CANVAS_HEIGHT + 60)
      );

      setFloatingTexts(prev =>
        prev
          .map(t => ({
            ...t,
            y: t.y - 1.2,
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

  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setLevel(1);
    initBoard(5);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#050914]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi, Nút đổi trứng & Nút bật tắt tia ngắm */}
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

          {/* Nút Đổi Trứng Gọn Gàng Trên Top HUD */}
          <button
            onClick={handleSwapBubbles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm text-xs font-bold"
            title="Đổi quả trứng đang chuẩn bị bắn (hoặc nhấp chuột phải / phím Space)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Đổi Trứng</span>
          </button>

          <button
            onClick={() => setAimGuideEnabled(v => !v)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer active:scale-95 shadow-sm ${
              aimGuideEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                : 'bg-slate-800 text-gray-400 border-white/10'
            }`}
            title="Bật/Tắt đường ngắm dội tường"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Tia Ngắm</span>
          </button>
        </div>

        {/* Khối Giữa: ĐIỂM SỐ & KỶ LỤC - CĂN CHÍNH GIỮA TUYỆT ĐỐI 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-full flex items-center justify-center z-0 pointer-events-none select-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-gray-500 font-black text-base sm:text-lg select-none">•</span>
          </div>

          <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide">ĐIỂM:</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono min-w-[50px] text-right">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="absolute left-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-start gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-sm font-black text-cyan-400 tracking-wide font-mono">
              MÀN: {level}
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">
              (TOP: {highScore.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Khối Phải: Tạm Dừng & Ván Mới */}
        <div className="flex items-center gap-2 z-10">
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

      {/* Sân đấu Widescreen 16:9 Arcade Canvas Container - Sạch sẽ & Sắc nét chuẩn Retina */}
      <div 
        className={`game-arena-box relative w-full aspect-[16/9] max-w-[min(96vw,1320px)] max-h-[calc(100dvh-235px)] bg-slate-950 rounded-3xl overflow-hidden border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] touch-none flex-shrink min-h-0 transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onContextMenu={(e) => {
            e.preventDefault();
            handleSwapBubbles();
          }}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Floating Combo Badge (Chỉ hiện khi nổ chuỗi liên hoàn) */}
        {comboStreak > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/30 border border-amber-500/50 backdrop-blur-md shadow-lg animate-bounce pointer-events-none">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
              COMBO x{comboStreak}!
            </span>
          </div>
        )}

        {/* Modal Thua Cuộc */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <span className="text-5xl mb-2 animate-bounce">💥</span>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1 tracking-wider uppercase">TỔ TRỨNG BỊ ĐÈ!</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">Trứng đã chạm đáy an toàn. Hãy thử lại!</p>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[220px]">
              <span className="text-xs text-gray-400 block mb-1">ĐIỂM ĐẠT ĐƯỢC</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{score.toLocaleString()}</span>
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95"
            >
              Chơi Lại
            </button>
          </div>
        )}

        {/* Modal Chiến Thắng / Qua Màn */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <span className="text-5xl mb-2 animate-bounce">🏆</span>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1 tracking-wider uppercase">SẠCH TỔ TRỨNG!</h3>
            <p className="text-xs sm:text-sm text-emerald-300/80 mb-4">Xuất sắc dọn sạch toàn bộ tổ trứng khủng long!</p>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[220px]">
              <span className="text-xs text-gray-400 block mb-1">ĐIỂM TỔNG CỘNG</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{score.toLocaleString()}</span>
            </div>
            <span className="text-xs text-gray-400 animate-pulse">Đang chuyển tiếp sang Màn {level + 1}...</span>
          </div>
        )}
      </div>
    </div>
  );
};
