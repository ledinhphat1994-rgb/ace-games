import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Sparkles, 
  Flame, 
  Crosshair,
  ArrowRightLeft
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

// Cấu hình kích thước bàn chơi
const COLS_EVEN = 10;
const COLS_ODD = 9;
const BUBBLE_RADIUS = 18;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROW_HEIGHT = Math.floor(BUBBLE_RADIUS * Math.sqrt(3)); // ~31px
const ARENA_WIDTH = COLS_EVEN * BUBBLE_DIAMETER; // 360px
const ARENA_HEIGHT = 560; // Chiều cao sân bắn
const CANNON_X = ARENA_WIDTH / 2; // 180px
const CANNON_Y = ARENA_HEIGHT - 45; // 515px
const DANGER_LINE_Y = ARENA_HEIGHT - 90; // 470px

const BUBBLE_PALETTE = [
  { name: 'Ruby', fill: '#ef4444', light: '#fca5a5', dark: '#991b1b', shadow: 'rgba(239,68,68,0.7)', grad: 'from-rose-500 to-red-600', spot: '#f87171' },
  { name: 'Ice', fill: '#06b6d4', light: '#a5f3fc', dark: '#0e7490', shadow: 'rgba(6,182,212,0.7)', grad: 'from-cyan-400 to-blue-600', spot: '#38bdf8' },
  { name: 'Emerald', fill: '#10b981', light: '#a7f3d0', dark: '#065f46', shadow: 'rgba(16,185,129,0.7)', grad: 'from-emerald-400 to-teal-600', spot: '#34d399' },
  { name: 'Solar', fill: '#f59e0b', light: '#fef08a', dark: '#b45309', shadow: 'rgba(245,158,11,0.7)', grad: 'from-amber-400 to-orange-500', spot: '#fbbf24' },
  { name: 'Amethyst', fill: '#a855f7', light: '#f5d0fe', dark: '#6b21a8', shadow: 'rgba(168,85,247,0.7)', grad: 'from-purple-400 to-fuchsia-600', spot: '#c084fc' },
];

export const GameBubbleShooter: React.FC = () => {
  // Lưới trứng trên bàn cờ (Row x Col)
  const [grid, setGrid] = useState<(Bubble | null)[][]>([]);
  const [, setCeilingRows] = useState(0); // Số hàng trần đã hạ xuống
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
  const [foulCount, setFoulCount] = useState(0); // Đếm số lần bắn trượt (5 lần hạ trần)
  const [comboStreak, setComboStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Quả trứng hiện tại và quả tiếp theo
  const [currentBubble, setCurrentBubble] = useState<number>(0);
  const [nextBubble, setNextBubble] = useState<number>(1);
  const [aimAngle, setAimAngle] = useState<number>(-Math.PI / 2); // Hướng thẳng đứng lên (-90 deg)

  // Hiệu ứng hạt & chữ bay
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fallingBubbles, setFallingBubbles] = useState<FloatingBubble[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Đạn đang bay
  const projectileRef = useRef<MovingProjectile | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Khởi tạo Audio Web API cho hiệu ứng âm thanh bắn trứng
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
    playTone(480, 'triangle', 0.08, 0.09);
    setTimeout(() => playTone(360, 'sine', 0.08, 0.05), 30);
  }, [playTone]);

  const playBounceSound = useCallback(() => {
    playTone(550, 'sine', 0.04, 0.04);
  }, [playTone]);

  const playPopSound = useCallback((combo: number) => {
    const baseFreq = 520 + Math.min(combo * 90, 600);
    playTone(baseFreq, 'triangle', 0.12, 0.1);
    setTimeout(() => playTone(baseFreq * 1.25, 'sine', 0.15, 0.08), 50);
  }, [playTone]);

  const playDropSound = useCallback(() => {
    playTone(280, 'sawtooth', 0.18, 0.06);
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

    for (let r = 0; r < 14; r++) {
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

  // Bắt đầu game khi mount
  useEffect(() => {
    initBoard(5);
  }, [initBoard]);

  // Lấy tọa độ tâm pixel (x, y) của ô (r, c)
  const getBubbleCenter = useCallback((r: number, c: number, ceilingOffsetRows: number = 0) => {
    const effectiveRow = r + ceilingOffsetRows;
    const isEven = effectiveRow % 2 === 0;
    const x = isEven
      ? c * BUBBLE_DIAMETER + BUBBLE_RADIUS
      : c * BUBBLE_DIAMETER + BUBBLE_RADIUS + BUBBLE_RADIUS;
    const y = effectiveRow * ROW_HEIGHT + BUBBLE_RADIUS;
    return { x, y };
  }, []);

  // Lấy danh sách các ô lân cận của (r, c) trên lưới lục giác
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
      if (d.r >= 0 && d.r < 14) {
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
    playTone(600, 'triangle', 0.05, 0.05);
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
      // Đủ từ 3 quả cùng màu: Nổ cụm!
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);
      playPopSound(newCombo);

      const centerCoord = getBubbleCenter(snapRow, snapCol, 0);

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

      // Xóa các quả nổ và tạo hạt nổ
      const newParticles: Particle[] = [];
      for (const tile of matchedCluster) {
        updatedGrid[tile.r][tile.c] = null;
        const pos = getBubbleCenter(tile.r, tile.c, 0);
        for (let i = 0; i < 7; i++) {
          const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.5;
          const speed = 2 + Math.random() * 3.5;
          newParticles.push({
            id: Date.now() + Math.random() + i,
            x: pos.x,
            y: pos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: BUBBLE_PALETTE[snappedColor].fill,
            size: 3 + Math.random() * 3,
            alpha: 1,
          });
        }
      }
      setParticles(prev => [...prev.slice(-40), ...newParticles]);

      // 2. Tìm các quả trứng treo lơ lửng mất điểm tựa trần
      const anchored = new Set<string>();
      const anchorQueue: { r: number; c: number }[] = [];

      // Tất cả quả ở hàng 0 được xem là gắn chặt vào trần
      const topCols = COLS_EVEN;
      for (let c = 0; c < topCols; c++) {
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
      for (let r = 0; r < 14; r++) {
        const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
        for (let c = 0; c < cols; c++) {
          if (updatedGrid[r][c] !== null && !anchored.has(`${r},${c}`)) {
            const pos = getBubbleCenter(r, c, 0);
            newFalling.push({
              id: Date.now() + Math.random() + droppedCount,
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 4,
              vy: 2 + Math.random() * 2,
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
        setFallingBubbles(prev => [...prev.slice(-30), ...newFalling]);
        setFloatingTexts(prev => [
          ...prev,
          {
            id: Date.now() + Math.random() + 50,
            x: ARENA_WIDTH / 2,
            y: 200,
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
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setLevel(lvl => lvl + 1);
          initBoard(Math.min(5 + level, 8));
        }, 2200);
      }
    } else {
      // Bắn trượt (không tạo được chuỗi nổ 3 quả): Reset combo và tăng đếm lỗi
      setComboStreak(0);
      setFoulCount(f => {
        const nextFoul = f + 1;
        if (nextFoul >= 5) {
          // Cứ 5 lần bắn trượt -> Hạ trần xuống 1 nấc!
          setScreenShake(true);
          playWarningRumble();
          setTimeout(() => setScreenShake(false), 450);

          // Đẩy thêm 1 hàng trứng ngẫu nhiên ở trên cùng
          const newRow: (Bubble | null)[] = [];
          const numColors = Math.min(3 + level, BUBBLE_PALETTE.length);
          for (let c = 0; c < COLS_EVEN; c++) {
            newRow.push({ color: Math.floor(Math.random() * numColors) });
          }

          // Dịch chuyển các hàng xuống
          updatedGrid.pop();
          updatedGrid.unshift(newRow);
          setCeilingRows(cr => cr + 1);
          return 0;
        }
        return nextFoul;
      });
    }

    // Kiểm tra thua cuộc: Có bất kỳ quả trứng nào chạm vạch nguy hiểm DANGER_LINE_Y không?
    for (let r = 0; r < 14; r++) {
      const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
      for (let c = 0; c < cols; c++) {
        if (updatedGrid[r][c] !== null) {
          const pos = getBubbleCenter(r, c, 0);
          if (pos.y + BUBBLE_RADIUS >= DANGER_LINE_Y) {
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

    const speed = 18;
    projectileRef.current = {
      x: CANNON_X,
      y: CANNON_Y,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      color: currentBubble,
    };
  }, [aimAngle, currentBubble, isGameOver, isPaused, isVictory, playShootSound]);

  // Cập nhật hướng ngắm theo chuột / vuốt ngón tay
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPaused || isGameOver || isVictory) return;
    const arenaRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - arenaRect.left;
    const clientY = e.clientY - arenaRect.top;

    const scaleX = ARENA_WIDTH / arenaRect.width;
    const scaleY = ARENA_HEIGHT / arenaRect.height;
    const targetX = clientX * scaleX;
    const targetY = clientY * scaleY;

    const dx = targetX - CANNON_X;
    const dy = targetY - CANNON_Y;

    // Giới hạn góc ngắm trong khoảng từ -165 đến -15 độ (không được bắn ngang hoặc xuống)
    let angle = Math.atan2(dy, dx);
    const minAngle = -Math.PI + 0.22; // ~ -167 deg
    const maxAngle = -0.22; // ~ -13 deg

    if (angle > 0) {
      angle = dx < 0 ? minAngle : maxAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    setAimAngle(angle);
  };

  // Vòng lặp vật lý Canvas (Render đạn bay, tia laze, hạt nổ, bóng rơi)
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // 1. Vẽ tia ngắm phản xạ dội tường (Aim Guide Laser)
      if (aimGuideEnabled && !projectileRef.current && !isGameOver && !isVictory) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);

        let startX = CANNON_X;
        let startY = CANNON_Y;
        let dirX = Math.cos(aimAngle);
        let dirY = Math.sin(aimAngle);
        let maxSegments = 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        for (let seg = 0; seg < maxSegments; seg++) {
          let targetX = startX + dirX * 600;
          let targetY = startY + dirY * 600;

          // Kiểm tra va chạm tường trái / phải
          if (dirX < 0 && targetX < BUBBLE_RADIUS) {
            const d = (BUBBLE_RADIUS - startX) / dirX;
            targetX = BUBBLE_RADIUS;
            targetY = startY + dirY * d;
            ctx.lineTo(targetX, targetY);
            startX = targetX;
            startY = targetY;
            dirX = -dirX;
          } else if (dirX > 0 && targetX > ARENA_WIDTH - BUBBLE_RADIUS) {
            const d = (ARENA_WIDTH - BUBBLE_RADIUS - startX) / dirX;
            targetX = ARENA_WIDTH - BUBBLE_RADIUS;
            targetY = startY + dirY * d;
            ctx.lineTo(targetX, targetY);
            startX = targetX;
            startY = targetY;
            dirX = -dirX;
          } else {
            ctx.lineTo(targetX, targetY);
            break;
          }
        }
        ctx.stroke();

        // Vẽ vòng ngắm nhỏ ở đầu nòng pháo
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(CANNON_X + Math.cos(aimAngle) * 45, CANNON_Y + Math.sin(aimAngle) * 45, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 2. Cập nhật và vẽ đạn đang bay
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
        else if (proj.x + BUBBLE_RADIUS >= ARENA_WIDTH) {
          proj.x = ARENA_WIDTH - BUBBLE_RADIUS;
          proj.vx = -proj.vx;
          playBounceSound();
        }

        // Kiểm tra va chạm trần nhà
        let hasCollided = false;
        let snapR = 0;
        let snapC = 0;

        if (proj.y - BUBBLE_RADIUS <= 0) {
          // Va vào trần -> Snap vào ô trống gần nhất ở hàng 0
          hasCollided = true;
          snapR = 0;
          let minDist = Infinity;
          for (let c = 0; c < COLS_EVEN; c++) {
            if (grid[0] && grid[0][c] === null) {
              const pos = getBubbleCenter(0, c, 0);
              const dist = Math.abs(pos.x - proj.x);
              if (dist < minDist) {
                minDist = dist;
                snapC = c;
              }
            }
          }
        } else {
          // Kiểm tra va chạm với các quả trứng đang có trên lưới
          outerLoop: for (let r = 0; r < 14; r++) {
            const cols = r % 2 === 0 ? COLS_EVEN : COLS_ODD;
            for (let c = 0; c < cols; c++) {
              if (grid[r] && grid[r][c] !== null) {
                const center = getBubbleCenter(r, c, 0);
                const distSq = (proj.x - center.x) ** 2 + (proj.y - center.y) ** 2;
                // Bán kính va chạm 2 quả trứng: d <= 2*R
                if (distSq <= (BUBBLE_DIAMETER - 2) ** 2) {
                  hasCollided = true;
                  // Tìm ô trống lân cận gần tâm đạn nhất để đính bóng
                  let bestDist = Infinity;
                  let foundSlot = false;

                  for (let checkR = 0; checkR < 14; checkR++) {
                    const checkCols = checkR % 2 === 0 ? COLS_EVEN : COLS_ODD;
                    for (let checkC = 0; checkC < checkCols; checkC++) {
                      if (grid[checkR] && grid[checkR][checkC] === null) {
                        const emptyPos = getBubbleCenter(checkR, checkC, 0);
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
          // Vẽ quả trứng đang bay
          ctx.save();
          const pal = BUBBLE_PALETTE[proj.color];
          ctx.shadowColor = pal.shadow;
          ctx.shadowBlur = 12;

          const grad = ctx.createRadialGradient(
            proj.x - BUBBLE_RADIUS * 0.3,
            proj.y - BUBBLE_RADIUS * 0.3,
            BUBBLE_RADIUS * 0.1,
            proj.x,
            proj.y,
            BUBBLE_RADIUS
          );
          grad.addColorStop(0, pal.light);
          grad.addColorStop(0.6, pal.fill);
          grad.addColorStop(1, pal.dark);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, BUBBLE_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          // Chấm đốm vỏ trứng
          ctx.fillStyle = pal.spot;
          ctx.beginPath();
          ctx.arc(proj.x + 5, proj.y - 4, 3, 0, Math.PI * 2);
          ctx.arc(proj.x - 6, proj.y + 4, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Ánh sáng phản chiếu
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(proj.x - 5, proj.y - 6, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [aimAngle, aimGuideEnabled, getBubbleCenter, grid, handleBubbleSnapped, isGameOver, isVictory, playBounceSound]);

  // Vòng lặp cập nhật các hạt nổ và bóng rơi
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Cập nhật hạt
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // Trọng lực
            alpha: p.alpha - 0.035,
          }))
          .filter(p => p.alpha > 0)
      );

      // 2. Cập nhật bóng rụng tự do
      setFallingBubbles(prev =>
        prev
          .map(b => ({
            ...b,
            x: b.x + b.vx,
            y: b.y + b.vy,
            vy: b.vy + 0.4,
            rotation: b.rotation + b.vRot,
          }))
          .filter(b => b.y < ARENA_HEIGHT + 50)
      );

      // 3. Cập nhật chữ bay
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

  // Xóa bớt chữ bay sau 1.2s
  useEffect(() => {
    if (floatingTexts.length > 0) {
      const t = setTimeout(() => {
        setFloatingTexts(prev => prev.slice(1));
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [floatingTexts]);

  // Khởi động lại ván chơi
  const resetGame = () => {
    soundManager.playButtonClick();
    setScore(0);
    setLevel(1);
    initBoard(5);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#050914]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% ngang bằng Arena */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(98vw,1280px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi & Nút bật tắt tia ngắm */}
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

          {/* Nút bật/tắt tia laze ngắm */}
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

          {/* Bên Trái: Điểm Số */}
          <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide">ĐIỂM:</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono min-w-[50px] text-right">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Bên Phải: Màn hoặc Kỷ Lục */}
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

      {/* Sân đấu Widescreen 16:9 Cinema Theater Arena */}
      <div 
        className={`game-arena-box relative bg-slate-950/90 rounded-3xl w-full max-w-[min(98vw,1280px)] max-h-[calc(100dvh-150px)] border-4 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] flex items-center justify-between p-3 sm:p-6 flex-1 min-h-0 overflow-hidden transition-transform duration-100 ${
          screenShake ? 'scale-[0.99] translate-y-1 animate-pulse' : ''
        }`}
      >
        {/* Bảng Thông Tin Bên Trái (Left Jurassic Panel) */}
        <div className="hidden lg:flex flex-col justify-between w-64 h-full p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
              <span>🦖 TỔ KHỦNG LONG</span>
            </div>

            {/* Trứng tiếp theo & Nút Đổi */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col items-center gap-2.5">
              <span className="text-xs font-bold text-gray-400">TRỨNG TIẾP THEO</span>
              <div 
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${BUBBLE_PALETTE[nextBubble].grad} shadow-lg flex items-center justify-center border-2 border-white/40`}
                style={{ boxShadow: `0 0 15px ${BUBBLE_PALETTE[nextBubble].shadow}` }}
              >
                <span className="text-lg">🥚</span>
              </div>

              <button
                onClick={handleSwapBubbles}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Đổi Trứng (Phải chuột)</span>
              </button>
            </div>

            {/* Cảnh Báo Trần Sập (Foul meter) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>CẢNH BÁO TRẦN:</span>
                <span className="text-rose-400 font-mono">{5 - foulCount} lượt bắn</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                      idx < foulCount
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chuỗi Combo */}
          {comboStreak > 1 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-center animate-bounce">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>COMBO BẮN LIÊN TIẾP</span>
              </div>
              <span className="text-2xl font-black text-white font-mono">x{comboStreak}</span>
            </div>
          )}
        </div>

        {/* Khung Bắn Bóng Trung Tâm (Central Bubble Shooter Box) */}
        <div 
          onPointerMove={handlePointerMove}
          onClick={handleShoot}
          onContextMenu={(e) => {
            e.preventDefault();
            handleSwapBubbles();
          }}
          className="relative mx-auto flex flex-col items-center justify-center select-none cursor-crosshair touch-none"
          style={{ width: `${ARENA_WIDTH}px`, height: `${ARENA_HEIGHT}px` }}
        >
          {/* Nền Đấu Trường Lục Giác */}
          <div className="absolute inset-0 rounded-2xl bg-slate-950 border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
            {/* Lưới Hexagon Mờ */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:16px_16px]" />

            {/* Vạch Nguy Hiểm Danger Line */}
            <div 
              className="absolute inset-x-0 border-b-2 border-dashed border-rose-500/50 flex items-center justify-center pointer-events-none"
              style={{ top: `${DANGER_LINE_Y}px` }}
            >
              <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase bg-slate-950/80 px-2 py-0.5 rounded">
                ⚠ VẠCH NGUY HIỂM ⚠
              </span>
            </div>

            {/* Canvas vẽ đạn bay và tia ngắm */}
            <canvas 
              ref={canvasRef}
              width={ARENA_WIDTH}
              height={ARENA_HEIGHT}
              className="absolute inset-0 z-20 pointer-events-none"
            />

            {/* Lưới các quả trứng tĩnh trên bàn */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {grid.map((row, r) => {
                return row.map((cell, c) => {
                  if (!cell) return null;
                  const pos = getBubbleCenter(r, c, 0);
                  const pal = BUBBLE_PALETTE[cell.color];

                  return (
                    <div
                      key={`${r}-${c}`}
                      className="absolute rounded-full transition-transform duration-100 flex items-center justify-center"
                      style={{
                        left: `${pos.x - BUBBLE_RADIUS}px`,
                        top: `${pos.y - BUBBLE_RADIUS}px`,
                        width: `${BUBBLE_DIAMETER}px`,
                        height: `${BUBBLE_DIAMETER}px`,
                        background: `radial-gradient(circle at 35% 35%, ${pal.light} 0%, ${pal.fill} 60%, ${pal.dark} 100%)`,
                        boxShadow: `0 0 10px ${pal.shadow}, inset -2px -2px 6px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {/* Đốm trứng khủng long */}
                      <div 
                        className="w-1.5 h-1.5 rounded-full absolute top-1.5 right-2 opacity-60"
                        style={{ backgroundColor: pal.spot }}
                      />
                      <div 
                        className="w-1.5 h-1.5 rounded-full absolute bottom-2 left-2 opacity-50"
                        style={{ backgroundColor: pal.spot }}
                      />
                      {/* Điểm bóng sáng */}
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-2 left-2" />
                    </div>
                  );
                });
              })}
            </div>

            {/* Các quả trứng đang rơi tự do */}
            {fallingBubbles.map(fb => {
              const pal = BUBBLE_PALETTE[fb.color];
              return (
                <div
                  key={fb.id}
                  className="absolute rounded-full pointer-events-none z-15"
                  style={{
                    left: `${fb.x - BUBBLE_RADIUS}px`,
                    top: `${fb.y - BUBBLE_RADIUS}px`,
                    width: `${BUBBLE_DIAMETER}px`,
                    height: `${BUBBLE_DIAMETER}px`,
                    background: `radial-gradient(circle at 35% 35%, ${pal.light} 0%, ${pal.fill} 60%, ${pal.dark} 100%)`,
                    boxShadow: `0 0 12px ${pal.shadow}`,
                    transform: `rotate(${fb.rotation}rad)`,
                  }}
                />
              );
            })}

            {/* Các hạt nổ nát vỏ trứng */}
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none z-25"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.alpha,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />
            ))}

            {/* Điểm bay lượn */}
            {floatingTexts.map(f => (
              <div
                key={f.id}
                className="absolute pointer-events-none font-black font-mono text-sm sm:text-base whitespace-nowrap z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  left: f.x - 20,
                  top: f.y,
                  color: f.color,
                }}
              >
                {f.text}
              </div>
            ))}

            {/* Khẩu Pháo Bắn Trứng Ở Đáy (Rotating Cannon) */}
            <div 
              className="absolute pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: `${CANNON_X - 32}px`,
                top: `${CANNON_Y - 32}px`,
                width: '64px',
                height: '64px',
              }}
            >
              {/* Nòng pháo xoay */}
              <div 
                className="absolute w-8 h-16 origin-bottom rounded-t-xl bg-gradient-to-t from-slate-800 to-amber-500 border-2 border-white/20 shadow-xl"
                style={{
                  bottom: '32px',
                  transform: `rotate(${aimAngle + Math.PI / 2}rad)`,
                  boxShadow: '0 0 15px rgba(245,158,11,0.5)',
                }}
              />

              {/* Quả trứng hiện tại đặt ở nòng pháo */}
              <div 
                className="relative z-10 w-9 h-9 rounded-full shadow-lg border-2 border-white/40 flex items-center justify-center animate-pulse"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${BUBBLE_PALETTE[currentBubble].light} 0%, ${BUBBLE_PALETTE[currentBubble].fill} 60%, ${BUBBLE_PALETTE[currentBubble].dark} 100%)`,
                  boxShadow: `0 0 16px ${BUBBLE_PALETTE[currentBubble].shadow}`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/80 absolute top-1.5 left-1.5" />
              </div>

              {/* Bệ đỡ pháo bằng đồng */}
              <div className="absolute -bottom-3 w-16 h-8 rounded-t-full bg-gradient-to-t from-amber-700 to-amber-500 border-2 border-amber-300 shadow-md z-0" />
            </div>
          </div>

          {/* Modal Thua Cuộc */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-40">
              <span className="text-5xl mb-3 animate-bounce">💥</span>
              <h3 className="text-2xl font-black text-rose-400 mb-1 tracking-wider uppercase">TỔ TRỨNG BỊ ĐÈ!</h3>
              <p className="text-xs text-gray-400 mb-4">Trứng đã chạm vạch nguy hiểm. Hãy thử lại!</p>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[200px]">
                <span className="text-xs text-gray-400 block">ĐIỂM ĐẠT ĐƯỢC:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{score.toLocaleString()}</span>
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95"
              >
                Chơi Lại
              </button>
            </div>
          )}

          {/* Modal Chiến Thắng / Qua Màn */}
          {isVictory && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-40">
              <span className="text-5xl mb-3 animate-bounce">🏆</span>
              <h3 className="text-2xl font-black text-emerald-400 mb-1 tracking-wider uppercase">SẠCH TỔ TRỨNG!</h3>
              <p className="text-xs text-emerald-300/80 mb-4">Xuất sắc dọn sạch toàn bộ trứng khủng long!</p>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 mb-6 w-full max-w-[200px]">
                <span className="text-xs text-gray-400 block">ĐIỂM TỔNG CỘNG:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{score.toLocaleString()}</span>
              </div>
              <span className="text-xs text-gray-400 animate-pulse">Đang chuyển tiếp sang Màn {level + 1}...</span>
            </div>
          )}
        </div>

        {/* Bảng Thông Tin Bên Phải (Right Jurassic Guide Panel) */}
        <div className="hidden lg:flex flex-col justify-between w-64 h-full p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>BÍ KÍP BẮN TRỨNG</span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-amber-300 font-bold block">✨ Ghép 3 quả:</span>
                <span>Bắn trúng cụm từ 3 quả cùng màu trở lên để làm nổ.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-cyan-300 font-bold block">⚡ Dội tường:</span>
                <span>Tận dụng hai bên bờ tường để dội đạn vào các góc hiểm.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-emerald-300 font-bold block">🎯 Rụng chùm:</span>
                <span>Bắn đứt cuống cụm trên để toàn bộ cụm bên dưới rụng tự do.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-center">
            <span className="text-[11px] font-bold text-gray-400 block mb-0.5">KỶ LỤC TOÀN SERVER</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {Math.max(highScore, 45200).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
