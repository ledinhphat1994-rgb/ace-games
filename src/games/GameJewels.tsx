import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Pause, 
  Sparkles, 
  Flame, 
  Zap, 
  Timer, 
  Gem
} from 'lucide-react';
import { soundManager } from '../utils/sound';

type GameMode = 'classic' | 'timed' | 'zen';

interface JewelTile {
  id: string;
  type: number; // 0..5 (Gems), 6 = Hypercube Rainbow
  special?: 'none' | 'lightning' | 'bomb' | 'hypercube';
  isMatched?: boolean;
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

const ROWS = 8;
const COLS = 8;

const GEM_COLORS = [
  { name: 'Ruby', color: '#f43f5e', border: '#fda4af', shadow: 'rgba(244,63,94,0.6)', icon: '💎', grad: 'from-rose-500 to-red-600' },
  { name: 'Sapphire', color: '#3b82f6', border: '#93c5fd', shadow: 'rgba(59,130,246,0.6)', icon: '🔷', grad: 'from-blue-500 to-indigo-600' },
  { name: 'Emerald', color: '#10b981', border: '#6ee7b7', shadow: 'rgba(16,185,129,0.6)', icon: '🟢', grad: 'from-emerald-500 to-teal-600' },
  { name: 'Citrine', color: '#f59e0b', border: '#fde68a', shadow: 'rgba(245,158,11,0.6)', icon: '🟡', grad: 'from-amber-400 to-orange-500' },
  { name: 'Amethyst', color: '#a855f7', border: '#e9d5ff', shadow: 'rgba(168,85,247,0.6)', icon: '🟣', grad: 'from-purple-500 to-fuchsia-600' },
  { name: 'Diamond', color: '#06b6d4', border: '#a5f3fc', shadow: 'rgba(6,182,212,0.6)', icon: '💠', grad: 'from-cyan-400 to-sky-500' },
];

export const GameJewels: React.FC = () => {
  const [board, setBoard] = useState<JewelTile[][]>([]);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('acegames_jewels_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [mode, setMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_jewels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['classic', 'timed', 'zen'].includes(parsed.gameMode)) return parsed.gameMode;
      }
    } catch {}
    return 'classic';
  });

  const [initialMoves] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_jewels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.movesLimit === 'number') return parsed.movesLimit;
      }
    } catch {}
    return 30;
  });

  const [movesLeft, setMovesLeft] = useState(initialMoves);
  const [timeLeft, setTimeLeft] = useState(90);
  const [comboCount, setComboCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hintPos, setHintPos] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Lưu cấu hình vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ace_game_settings_jewels', JSON.stringify({ gameMode: mode, movesLimit: initialMoves }));
    } catch {}
  }, [mode, initialMoves]);

  // Synthesizer Audio
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.08, vol: number = 0.06) => {
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

  const playExplosionSound = useCallback(() => {
    playTone(180, 'sawtooth', 0.25, 0.1);
    setTimeout(() => playTone(120, 'sawtooth', 0.3, 0.08), 100);
  }, [playTone]);

  const playMatchSound = useCallback((combo: number) => {
    const base = 440 + Math.min(combo * 60, 400);
    playTone(base, 'triangle', 0.1, 0.07);
    setTimeout(() => playTone(base * 1.25, 'triangle', 0.12, 0.07), 60);
    if (combo >= 2) {
      setTimeout(() => playExplosionSound(), 100);
    }
  }, [playTone, playExplosionSound]);

  // Kiểm tra 3 ô trùng nhau
  const checkMatches = useCallback((grid: JewelTile[][]) => {
    const matchedCoords: { r: number; c: number; type: number }[] = [];
    const matchedMap = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Ngang
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const type = grid[r][c]?.type;
        if (type === undefined || type < 0) continue;
        let len = 1;
        while (c + len < COLS && grid[r][c + len]?.type === type) {
          len++;
        }
        if (len >= 3) {
          for (let k = 0; k < len; k++) matchedMap[r][c + k] = true;
        }
        c += len - 1;
      }
    }

    // Dọc
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        const type = grid[r][c]?.type;
        if (type === undefined || type < 0) continue;
        let len = 1;
        while (r + len < ROWS && grid[r + len][c]?.type === type) {
          len++;
        }
        if (len >= 3) {
          for (let k = 0; k < len; k++) matchedMap[r + k][c] = true;
        }
        r += len - 1;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (matchedMap[r][c]) {
          matchedCoords.push({ r, c, type: grid[r][c].type });
        }
      }
    }

    return matchedCoords;
  }, []);

  // Kiểm tra có nước đi hợp lệ trên bàn cờ không
  const findPossibleMove = useCallback((grid: JewelTile[][]) => {
    const testMatchAt = (testGrid: number[][], r: number, c: number) => {
      const type = testGrid[r][c];
      if (type < 0) return false;
      let h = 1, i = c - 1;
      while (i >= 0 && testGrid[r][i] === type) { h++; i--; }
      i = c + 1;
      while (i < COLS && testGrid[r][i] === type) { h++; i++; }
      if (h >= 3) return true;

      let v = 1, j = r - 1;
      while (j >= 0 && testGrid[j][c] === type) { v++; j--; }
      j = r + 1;
      while (j < ROWS && testGrid[j][c] === type) { v++; j++; }
      if (v >= 3) return true;

      return false;
    };

    const numGrid = grid.map(row => row.map(cell => cell.type));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Thử đổi sang phải
        if (c < COLS - 1) {
          const t = numGrid[r][c];
          numGrid[r][c] = numGrid[r][c + 1];
          numGrid[r][c + 1] = t;
          if (testMatchAt(numGrid, r, c) || testMatchAt(numGrid, r, c + 1)) {
            numGrid[r][c + 1] = numGrid[r][c];
            numGrid[r][c] = t;
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
          numGrid[r][c + 1] = numGrid[r][c];
          numGrid[r][c] = t;
        }

        // Thử đổi xuống dưới
        if (r < ROWS - 1) {
          const t = numGrid[r][c];
          numGrid[r][c] = numGrid[r + 1][c];
          numGrid[r + 1][c] = t;
          if (testMatchAt(numGrid, r, c) || testMatchAt(numGrid, r + 1, c)) {
            numGrid[r + 1][c] = numGrid[r][c];
            numGrid[r][c] = t;
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
          numGrid[r + 1][c] = numGrid[r][c];
          numGrid[r][c] = t;
        }
      }
    }
    return null;
  }, []);

  // Khởi tạo bàn cờ không có sẵn chuỗi 3 trùng lặp
  const generateCleanBoard = useCallback((): JewelTile[][] => {
    let newGrid: JewelTile[][] = [];
    let hasMove = false;

    while (!hasMove) {
      newGrid = [];
      for (let r = 0; r < ROWS; r++) {
        const row: JewelTile[] = [];
        for (let c = 0; c < COLS; c++) {
          let forbidden: number[] = [];
          if (c >= 2 && row[c - 1].type === row[c - 2].type) {
            forbidden.push(row[c - 1].type);
          }
          if (r >= 2 && newGrid[r - 1][c].type === newGrid[r - 2][c].type) {
            forbidden.push(newGrid[r - 1][c].type);
          }

          const available = [0, 1, 2, 3, 4, 5].filter(t => !forbidden.includes(t));
          const chosen = available[Math.floor(Math.random() * available.length)];
          row.push({
            id: `tile_${r}_${c}_${Math.random()}`,
            type: chosen,
            special: 'none',
          });
        }
        newGrid.push(row);
      }
      hasMove = findPossibleMove(newGrid) !== null;
    }

    return newGrid;
  }, [findPossibleMove]);

  // Cập nhật điểm cao nhất
  const updateHighScore = useCallback((newScore: number) => {
    setHighScore(prev => {
      if (newScore > prev) {
        try {
          localStorage.setItem('acegames_jewels_highscore', newScore.toString());
        } catch {}
        return newScore;
      }
      return prev;
    });
  }, []);

  // Bắt đầu hoặc làm mới ván đấu
  const resetGame = useCallback(() => {
    soundManager.playButtonClick();
    const freshBoard = generateCleanBoard();
    setBoard(freshBoard);
    setSelectedPos(null);
    setIsProcessing(false);
    setScore(0);
    setComboCount(0);
    setMovesLeft(initialMoves);
    setTimeLeft(90);
    setIsPaused(false);
    setIsGameOver(false);
    setHintPos(null);
    setParticles([]);
    setFloatingTexts([]);
  }, [generateCleanBoard, initialMoves]);

  // Khởi tạo ban đầu
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Đếm ngược thời gian trong Mode Timed
  useEffect(() => {
    if (mode !== 'timed' || isPaused || isGameOver || isProcessing) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          soundManager.playDefeat();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, isPaused, isGameOver, isProcessing]);

  // Tạo hiệu ứng hạt nổ neon
  const spawnExplosion = useCallback((r: number, c: number, color: string, count: number = 8) => {
    const newParts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 2;
      newParts.push({
        id: Math.random(),
        x: c * 52 + 26,
        y: r * 52 + 26,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
      });
    }
    setParticles(prev => [...prev.slice(-40), ...newParts]);
  }, []);

  // Tạo popup điểm bay
  const spawnFloatText = useCallback((r: number, c: number, text: string, color: string = '#fde047') => {
    const item: FloatingText = {
      id: Math.random(),
      x: c * 52 + 26,
      y: r * 52 + 10,
      text,
      color,
    };
    setFloatingTexts(prev => [...prev.slice(-10), item]);
  }, []);

  // Vòng lặp cập nhật animation hạt
  useEffect(() => {
    const anim = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, alpha: p.alpha - 0.05 }))
          .filter(p => p.alpha > 0)
      );

      setFloatingTexts(prev =>
        prev
          .map(t => ({ ...t, y: t.y - 1 }))
          .filter(t => t.y > -20)
      );
    }, 16);
    return () => clearInterval(anim);
  }, []);

  // Xử lý nổ dây chuyền (Cascade Gravitational Drop)
  const processMatchesAndCascade = useCallback(async (currentGrid: JewelTile[][], currentCombo: number) => {
    const matches = checkMatches(currentGrid);
    if (matches.length === 0) {
      // Kiểm tra xem bàn có còn nước đi không, nếu không thì xáo bài
      const possible = findPossibleMove(currentGrid);
      if (!possible) {
        spawnFloatText(3, 3, 'XÁO BÀN CỜ!', '#38bdf8');
        playTone(520, 'sine', 0.2, 0.1);
        const shuffled = generateCleanBoard();
        setBoard(shuffled);
      }
      setIsProcessing(false);
      setComboCount(0);
      return;
    }

    // Tính điểm combo
    const newCombo = currentCombo + 1;
    setComboCount(newCombo);
    playMatchSound(newCombo);

    const basePoints = matches.length * 50;
    const comboBonus = newCombo > 1 ? basePoints * (newCombo - 1) : 0;
    const totalAdd = basePoints + comboBonus;

    setScore(s => {
      const updated = s + totalAdd;
      updateHighScore(updated);
      return updated;
    });

    // Tạo popup điểm
    const centerMatch = matches[Math.floor(matches.length / 2)];
    spawnFloatText(centerMatch.r, centerMatch.c, `+${totalAdd}${newCombo > 1 ? ` (x${newCombo})` : ''}`);

    // Đánh dấu biến mất
    matches.forEach(m => {
      const tile = currentGrid[m.r][m.c];
      const color = GEM_COLORS[tile.type]?.color || '#ffffff';
      spawnExplosion(m.r, m.c, color, 6);
    });

    // Chờ 150ms hiệu ứng biến mất
    await new Promise(r => setTimeout(r, 160));

    // Rơi trọng lực & bổ sung ngọc mới từ trên xuống
    const nextGrid: JewelTile[][] = currentGrid.map(row => row.map(tile => ({ ...tile })));

    // Xóa các ô khớp
    matches.forEach(m => {
      nextGrid[m.r][m.c] = { id: '', type: -1 };
    });

    for (let c = 0; c < COLS; c++) {
      let emptyRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (nextGrid[r][c].type !== -1) {
          nextGrid[emptyRow][c] = nextGrid[r][c];
          if (emptyRow !== r) {
            nextGrid[r][c] = { id: '', type: -1 };
          }
          emptyRow--;
        }
      }

      // Thả ngọc mới từ đỉnh
      for (let r = emptyRow; r >= 0; r--) {
        nextGrid[r][c] = {
          id: `tile_${r}_${c}_${Date.now()}_${Math.random()}`,
          type: Math.floor(Math.random() * 6),
          special: 'none',
        };
      }
    }

    setBoard(nextGrid);

    // Chờ 200ms cho ngọc rơi hoàn tất rồi kiểm tra đợt nổ kế tiếp
    await new Promise(r => setTimeout(r, 220));
    await processMatchesAndCascade(nextGrid, newCombo);
  }, [checkMatches, findPossibleMove, generateCleanBoard, playMatchSound, playTone, spawnExplosion, spawnFloatText, updateHighScore]);

  // Hoán đổi 2 viên ngọc
  const handleSwap = useCallback(async (r1: number, c1: number, r2: number, c2: number) => {
    setIsProcessing(true);
    setHintPos(null);

    // Copy grid
    const tempGrid = board.map(row => row.map(tile => ({ ...tile })));
    const t = tempGrid[r1][c1];
    tempGrid[r1][c1] = tempGrid[r2][c2];
    tempGrid[r2][c2] = t;

    setBoard(tempGrid);
    playTone(360, 'sine', 0.05, 0.05);

    // Kiểm tra xem nước đi có tạo thành combo hợp lệ không
    const matches = checkMatches(tempGrid);

    if (matches.length > 0) {
      // Nước đi thành công! Giảm lượt nếu ở chế độ Cổ Điển
      if (mode === 'classic') {
        setMovesLeft(prev => {
          const updated = prev - 1;
          if (updated <= 0) {
            setIsGameOver(true);
            soundManager.playVictory();
            confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          }
          return updated;
        });
      }

      await processMatchesAndCascade(tempGrid, 0);
    } else {
      // Nước đi không hợp lệ: Hoán đổi ngược lại
      await new Promise(r => setTimeout(r, 200));
      const reverted = board.map(row => row.map(tile => ({ ...tile })));
      setBoard(reverted);
      playTone(220, 'sawtooth', 0.1, 0.06);
      setIsProcessing(false);
    }
  }, [board, checkMatches, mode, playTone, processMatchesAndCascade]);

  // Nhấp chọn ô kim cương
  const handleTileClick = (r: number, c: number) => {
    if (isProcessing || isPaused || isGameOver) return;

    if (!selectedPos) {
      setSelectedPos({ r, c });
      playTone(520, 'triangle', 0.04, 0.04);
      return;
    }

    // Nếu nhấp lại chính ô đó thì hủy chọn
    if (selectedPos.r === r && selectedPos.c === c) {
      setSelectedPos(null);
      return;
    }

    // Kiểm tra xem ô thứ hai có kề cận ô thứ nhất không (không tính đường chéo)
    const isAdjacent = 
      (Math.abs(selectedPos.r - r) === 1 && selectedPos.c === c) ||
      (Math.abs(selectedPos.c - c) === 1 && selectedPos.r === r);

    if (isAdjacent) {
      const first = selectedPos;
      setSelectedPos(null);
      handleSwap(first.r, first.c, r, c);
    } else {
      // Nhấp sang ô xa khác thì đổi ô được chọn
      setSelectedPos({ r, c });
      playTone(520, 'triangle', 0.04, 0.04);
    }
  };

  // Trợ giúp gợi ý nước đi
  const handleRequestHint = () => {
    if (isProcessing || isPaused || isGameOver) return;
    soundManager.playButtonClick();
    const possible = findPossibleMove(board);
    if (possible) {
      setHintPos(possible);
      playTone(660, 'sine', 0.1, 0.08);
      setTimeout(() => setHintPos(null), 3000);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070b14]">
      {/* Top HUD: Chuẩn hóa 3 Cột, Căn giữa tuyệt đối 50% ngang bằng Arena */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(98vw,1280px)] px-3 sm:px-6 py-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg flex-shrink-0 mb-2 min-h-[52px]">
        {/* Khối Trái: Chế độ chơi (Cổ Điển / Tính Giờ / Thư Giãn) */}
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['classic', 'timed', 'zen'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetGame();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  mode === m
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'classic' ? 'Cổ Điển' : m === 'timed' ? 'Tính Giờ' : 'Thư Giãn'}
              </button>
            ))}
          </div>

          {/* Nút Gợi Ý Nước Đi */}
          <button
            onClick={handleRequestHint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold text-xs border border-purple-500/30 transition cursor-pointer active:scale-95 shadow-sm"
            title="Gợi ý một nước đi hợp lệ"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Gợi Ý</span>
          </button>
        </div>

        {/* Khối Giữa: ĐIỂM SỐ & KỶ LỤC - CĂN CHÍNH GIỮA TUYỆT ĐỐI 50% */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-full flex items-center justify-center z-0 pointer-events-none select-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-gray-500 font-black text-base sm:text-lg select-none">•</span>
          </div>

          {/* Bên Trái: Điểm Số */}
          <div className="absolute right-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 whitespace-nowrap">
            <Trophy className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-fuchsia-400 tracking-wide">ĐIỂM:</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono min-w-[50px] text-right">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Bên Phải: Kỷ Lục hoặc Lượt / Giờ */}
          <div className="absolute left-[calc(50%+12px)] top-1/2 -translate-y-1/2 flex items-center justify-start gap-2 whitespace-nowrap">
            {mode === 'classic' && (
              <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide font-mono">
                LƯỢT: {movesLeft}
              </span>
            )}
            {mode === 'timed' && (
              <span className="text-xs sm:text-sm font-black text-rose-400 tracking-wide font-mono flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
              </span>
            )}
            {mode === 'zen' && (
              <span className="text-xs sm:text-sm font-black text-cyan-400 tracking-wide">
                TOP: {highScore.toLocaleString()}
              </span>
            )}
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
            onClick={() => resetGame()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-fuchsia-400 hover:text-fuchsia-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sân đấu Widescreen 16:9 Cinema Theater Arena */}
      <div className="game-arena-box relative bg-slate-950/90 rounded-3xl w-full max-w-[min(98vw,1280px)] max-h-[calc(100dvh-150px)] border-4 border-fuchsia-500/40 shadow-[0_0_60px_rgba(217,70,239,0.25)] flex items-center justify-between p-3 sm:p-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Bảng Thông Tin Bên Trái (Left Cyberpunk Panel) */}
        <div className="hidden lg:flex flex-col justify-between w-64 h-full p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-fuchsia-400 font-black text-sm uppercase tracking-wider">
              <Gem className="w-4 h-4" />
              <span>BẢNG NGỌC QUÝ</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {GEM_COLORS.map((g, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-base">{g.icon}</span>
                  <span className="text-gray-300">{g.name}</span>
                </div>
              ))}
            </div>
          </div>

          {comboCount > 1 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-center animate-bounce">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>COMBO LIÊN HOÀN</span>
              </div>
              <span className="text-2xl font-black text-white font-mono">x{comboCount}</span>
            </div>
          )}
        </div>

        {/* Bàn Cờ 8x8 Kim Cương Trung Tâm */}
        <div className="relative mx-auto flex items-center justify-center">
          <div className="relative grid grid-cols-8 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-slate-950 border-2 border-fuchsia-500/30 shadow-[0_0_40px_rgba(217,70,239,0.3)] touch-none">
            {board.map((row, r) =>
              row.map((tile, c) => {
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isHint = hintPos && ((hintPos.r1 === r && hintPos.c1 === c) || (hintPos.r2 === r && hintPos.c2 === c));
                const gem = GEM_COLORS[tile.type] || GEM_COLORS[0];

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleTileClick(r, c)}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'scale-110 ring-4 ring-cyan-400 shadow-[0_0_20px_#22d3ee] z-20 animate-pulse bg-slate-800'
                        : isHint
                        ? 'ring-2 ring-yellow-400 animate-bounce z-10'
                        : 'hover:scale-105 active:scale-95 bg-slate-900/80 hover:bg-slate-850'
                    }`}
                    style={{
                      boxShadow: isSelected ? undefined : `inset 0 0 10px ${gem.shadow}`,
                    }}
                  >
                    <div 
                      className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${gem.grad} shadow-md border border-white/20`}
                    >
                      <span className="text-base sm:text-xl md:text-2xl select-none filter drop-shadow">
                        {gem.icon}
                      </span>
                    </div>
                  </button>
                );
              })
            )}

            {/* Hiệu ứng hạt nổ Neon bay */}
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute pointer-events-none rounded-full"
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

            {/* Popup Điểm Bay Lượn */}
            {floatingTexts.map(f => (
              <div
                key={f.id}
                className="absolute pointer-events-none font-black font-mono text-sm sm:text-base whitespace-nowrap z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  left: f.x,
                  top: f.y,
                  color: f.color,
                }}
              >
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bảng Thông Tin Bên Phải (Right Cyberpunk Panel) */}
        <div className="hidden lg:flex flex-col justify-between w-64 h-full p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>HƯỚNG DẪN CHIẾN LƯỢC</span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-fuchsia-300 font-bold block">✨ Ghép 3 viên:</span>
                <span>Tạo điểm cơ bản và nổ hạt ngọc.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-amber-300 font-bold block">🔥 Chuỗi Combo:</span>
                <span>Càng nổ dây chuyền, điểm số nhân bội.</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                <span className="text-cyan-300 font-bold block">💡 Nút Gợi Ý:</span>
                <span>Tìm nước đi tức thì khi bạn bị bế tắc.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/20 text-center">
            <span className="text-xs text-gray-400 block mb-1">KỶ LỤC TOÀN SERVER</span>
            <span className="text-lg font-black text-cyan-300 font-mono">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Màn hình Bắt Đầu */}
        {score === 0 && !isGameOver && movesLeft === initialMoves && mode === 'classic' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in">
            <span className="text-6xl mb-3 animate-bounce">💎</span>
            <h3 className="text-3xl sm:text-4xl font-black text-fuchsia-400 mb-2 tracking-wider">XẾP KIM CƯƠNG</h3>
            <p className="text-sm sm:text-base text-gray-300 mb-6 font-semibold max-w-md">
              Hoán đổi các viên ngọc kề nhau để tạo hàng từ 3 viên cùng màu và kích hoạt combo phát nổ rực rỡ!
            </p>
            <button
              onClick={() => resetGame()}
              className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 text-white font-black rounded-2xl text-base shadow-[0_0_30px_rgba(217,70,239,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-white" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Màn hình Tạm Dừng */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-40">
            <Pause className="w-14 h-14 text-fuchsia-400 animate-pulse" />
            <span className="text-2xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
            <button
              onClick={() => setIsPaused(false)}
              className="px-8 py-3 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black text-base uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-fuchsia-500/40"
            >
              Tiếp Tục
            </button>
          </div>
        )}

        {/* Màn hình Kết Thúc Trận Đấu */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-in fade-in">
            <span className="text-6xl mb-2">🏆</span>
            <h3 className="text-3xl font-black text-fuchsia-400 mb-2 tracking-wider">HẾT LƯỢT / HẾT GIỜ!</h3>
            <p className="text-sm text-gray-300 font-semibold mb-6">
              Tổng điểm của bạn: <strong className="text-yellow-400 font-mono text-2xl">{score.toLocaleString()}</strong>
            </p>
            <button
              onClick={() => resetGame()}
              className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white font-black rounded-2xl text-base shadow-[0_0_30px_rgba(217,70,239,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
