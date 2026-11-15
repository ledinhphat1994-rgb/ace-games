import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Shuffle, Sparkles, Trophy, Flame, Pause, Play, Clock } from 'lucide-react';
import { soundManager } from '../utils/sound';

// Bộ biểu tượng Onet phong phú, rực rỡ, không bản quyền (Hoa quả, Động vật, Arcade, Vũ trụ)
const ONET_ICONS = [
  '🍎', '🍓', '🥑', '🍕', '🍔', '🍩', '🍦', '🚀',
  '🎮', '💎', '⚽', '🐱', '🐶', '🦄', '🍄', '⚡',
  '🔔', '🎯', '🔮', '🎸', '👑', '🎁', '🧩', '🏆',
  '🐼', '🦊', '🦁', '🌟', '🍉', '🍇', '🍒', '🍋',
];

interface Point {
  r: number;
  c: number;
}

interface Tile {
  id: string;
  icon: string;
  iconIndex: number;
}

type BoardGrid = (Tile | null)[][];

interface GameSettings {
  difficulty?: 'easy' | 'normal' | 'hard';
  timeLimit?: number; // seconds
}

export const GameOnet: React.FC = () => {
  // Đọc cài đặt từ localStorage hoặc mặc định
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_onet');
      return saved ? JSON.parse(saved) : { difficulty: 'normal', timeLimit: 300 };
    } catch {
      return { difficulty: 'normal', timeLimit: 300 };
    }
  });

  const getDimensions = useCallback(() => {
    switch (settings.difficulty) {
      case 'easy': return { rows: 6, cols: 10, iconCount: 15 };
      case 'hard': return { rows: 8, cols: 14, iconCount: 28 };
      case 'normal':
      default: return { rows: 8, cols: 12, iconCount: 24 };
    }
  }, [settings.difficulty]);

  const { rows, cols, iconCount } = getDimensions();
  const totalRows = rows + 2;
  const totalCols = cols + 2;

  const [board, setBoard] = useState<BoardGrid>([]);
  const [selected, setSelected] = useState<Point | null>(null);
  const [hintPair, setHintPair] = useState<[Point, Point] | null>(null);
  const [laserPath, setLaserPath] = useState<Point[] | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [shufflesLeft, setShufflesLeft] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimit || 300);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [remainingTiles, setRemainingTiles] = useState<number>(rows * cols);
  const [autoShuffleMsg, setAutoShuffleMsg] = useState<string | null>(null);

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoShuffleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lắng nghe thay đổi cài đặt từ GameSettingsModal
  useEffect(() => {
    const handleSettingChanged = (e: any) => {
      if (e.detail?.gameId === 'onet') {
        const newSettings = e.detail.allSettings || {};
        setSettings(newSettings);
      }
    };
    window.addEventListener('ace-game-setting-changed', handleSettingChanged);
    return () => window.removeEventListener('ace-game-setting-changed', handleSettingChanged);
  }, []);

  // --- THUẬT TOÁN TÌM ĐƯỜNG GẤP KHÚC KHÔNG QUÁ 3 ĐOẠN (ONET PATHFINDING) ---

  // Kiểm tra đoạn thẳng giữa 2 điểm cùng hàng hoặc cùng cột
  const checkStraightLine = useCallback((p1: Point, p2: Point, currentBoard: BoardGrid): boolean => {
    if (p1.r === p2.r) {
      const minC = Math.min(p1.c, p2.c);
      const maxC = Math.max(p1.c, p2.c);
      for (let c = minC + 1; c < maxC; c++) {
        if (currentBoard[p1.r][c] !== null) return false;
      }
      return true;
    }
    if (p1.c === p2.c) {
      const minR = Math.min(p1.r, p2.r);
      const maxR = Math.max(p1.r, p2.r);
      for (let r = minR + 1; r < maxR; r++) {
        if (currentBoard[r][p1.c] !== null) return false;
      }
      return true;
    }
    return false;
  }, []);

  // Tìm đường đi hợp lệ (tối đa 2 góc cua / 3 đoạn thẳng)
  const findPath = useCallback((p1: Point, p2: Point, currentBoard: BoardGrid): Point[] | null => {
    if (p1.r === p2.r && p1.c === p2.c) return null;

    // 1. Đường thẳng 0 góc cua (1 đoạn)
    if (checkStraightLine(p1, p2, currentBoard)) {
      return [p1, p2];
    }

    // 2. Đường gấp khúc 1 góc cua (2 đoạn: chữ L)
    const corner1: Point = { r: p1.r, c: p2.c };
    if (currentBoard[corner1.r][corner1.c] === null) {
      if (checkStraightLine(p1, corner1, currentBoard) && checkStraightLine(corner1, p2, currentBoard)) {
        return [p1, corner1, p2];
      }
    }

    const corner2: Point = { r: p2.r, c: p1.c };
    if (currentBoard[corner2.r][corner2.c] === null) {
      if (checkStraightLine(p1, corner2, currentBoard) && checkStraightLine(corner2, p2, currentBoard)) {
        return [p1, corner2, p2];
      }
    }

    // 3. Đường gấp khúc 2 góc cua (3 đoạn: chữ Z / chữ U)
    // Quét theo chiều ngang từ p1 sang trái và phải
    for (let c = p1.c - 1; c >= 0; c--) {
      if (currentBoard[p1.r][c] !== null) break;
      const interPoint: Point = { r: p1.r, c };
      // Thử xem từ interPoint tới p2 có tạo được đường 1 góc cua không
      const cornerA: Point = { r: interPoint.r, c: p2.c };
      if (cornerA.r === p2.r && checkStraightLine(interPoint, p2, currentBoard)) {
        return [p1, interPoint, p2];
      }
      const cornerB: Point = { r: p2.r, c: interPoint.c };
      if (currentBoard[cornerB.r][cornerB.c] === null && checkStraightLine(interPoint, cornerB, currentBoard) && checkStraightLine(cornerB, p2, currentBoard)) {
        return [p1, interPoint, cornerB, p2];
      }
    }
    for (let c = p1.c + 1; c < totalCols; c++) {
      if (currentBoard[p1.r][c] !== null) break;
      const interPoint: Point = { r: p1.r, c };
      const cornerB: Point = { r: p2.r, c: interPoint.c };
      if (currentBoard[cornerB.r][cornerB.c] === null && checkStraightLine(interPoint, cornerB, currentBoard) && checkStraightLine(cornerB, p2, currentBoard)) {
        return [p1, interPoint, cornerB, p2];
      }
    }

    // Quét theo chiều dọc từ p1 lên trên và xuống dưới
    for (let r = p1.r - 1; r >= 0; r--) {
      if (currentBoard[r][p1.c] !== null) break;
      const interPoint: Point = { r, c: p1.c };
      const cornerB: Point = { r: interPoint.r, c: p2.c };
      if (currentBoard[cornerB.r][cornerB.c] === null && checkStraightLine(interPoint, cornerB, currentBoard) && checkStraightLine(cornerB, p2, currentBoard)) {
        return [p1, interPoint, cornerB, p2];
      }
    }
    for (let r = p1.r + 1; r < totalRows; r++) {
      if (currentBoard[r][p1.c] !== null) break;
      const interPoint: Point = { r, c: p1.c };
      const cornerB: Point = { r: interPoint.r, c: p2.c };
      if (currentBoard[cornerB.r][cornerB.c] === null && checkStraightLine(interPoint, cornerB, currentBoard) && checkStraightLine(cornerB, p2, currentBoard)) {
        return [p1, interPoint, cornerB, p2];
      }
    }

    return null;
  }, [checkStraightLine, totalCols, totalRows]);

  // Tìm tất cả các cặp có thể ăn được trên bàn
  const findAvailableMoves = useCallback((currentBoard: BoardGrid): [Point, Point][] => {
    const activeTiles: { p: Point; icon: string }[] = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const tile = currentBoard[r][c];
        if (tile) {
          activeTiles.push({ p: { r, c }, icon: tile.icon });
        }
      }
    }

    const moves: [Point, Point][] = [];
    for (let i = 0; i < activeTiles.length; i++) {
      for (let j = i + 1; j < activeTiles.length; j++) {
        if (activeTiles[i].icon === activeTiles[j].icon) {
          const path = findPath(activeTiles[i].p, activeTiles[j].p, currentBoard);
          if (path) {
            moves.push([activeTiles[i].p, activeTiles[j].p]);
          }
        }
      }
    }
    return moves;
  }, [rows, cols, findPath]);

  // Xáo trộn các ô còn lại trên bàn nếu hết nước đi
  const shuffleBoard = useCallback((currentBoard: BoardGrid, isManual: boolean = false) => {
    const remaining: Tile[] = [];
    const positions: Point[] = [];

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (currentBoard[r][c] !== null) {
          remaining.push(currentBoard[r][c]!);
          positions.push({ r, c });
        }
      }
    }

    if (remaining.length === 0) return currentBoard;

    let newBoard: BoardGrid;
    let attempts = 0;
    do {
      // Fisher-Yates Shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }

      newBoard = Array(totalRows).fill(null).map(() => Array(totalCols).fill(null));
      positions.forEach((pos, idx) => {
        newBoard[pos.r][pos.c] = remaining[idx];
      });

      attempts++;
    } while (findAvailableMoves(newBoard).length === 0 && attempts < 50);

    soundManager.playDiceRoll();
    if (!isManual) {
      setAutoShuffleMsg('Hết nước đi: Tự động xáo bài!');
      if (autoShuffleTimerRef.current) clearTimeout(autoShuffleTimerRef.current);
      autoShuffleTimerRef.current = setTimeout(() => setAutoShuffleMsg(null), 2500);
    }
    return newBoard;
  }, [rows, cols, totalRows, totalCols, findAvailableMoves]);

  // Khởi tạo ván game Onet mới
  const initGame = useCallback(() => {
    const totalTiles = rows * cols;
    const selectedIcons = ONET_ICONS.slice(0, iconCount);
    
    // Mỗi icon được chia đều thành các cặp
    const tilesList: Tile[] = [];
    const pairsPerIcon = Math.floor(totalTiles / 2 / selectedIcons.length);
    let idCounter = 1;

    selectedIcons.forEach((icon, iconIdx) => {
      for (let i = 0; i < pairsPerIcon * 2; i++) {
        tilesList.push({ id: `t_${idCounter++}`, icon, iconIndex: iconIdx });
      }
    });

    // Điền phần còn lại nếu lẻ
    while (tilesList.length < totalTiles) {
      const randIdx = Math.floor(Math.random() * selectedIcons.length);
      const icon = selectedIcons[randIdx];
      tilesList.push({ id: `t_${idCounter++}`, icon, iconIndex: randIdx });
      tilesList.push({ id: `t_${idCounter++}`, icon, iconIndex: randIdx });
    }

    // Shuffle mảng
    for (let i = tilesList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilesList[i], tilesList[j]] = [tilesList[j], tilesList[i]];
    }

    // Tạo lưới với 1 vòng biên ngoài rỗng (row 0, row totalRows-1, col 0, col totalCols-1)
    let initialBoard: BoardGrid = Array(totalRows).fill(null).map(() => Array(totalCols).fill(null));
    let k = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        initialBoard[r][c] = tilesList[k++];
      }
    }

    // Đảm bảo có ít nhất 1 nước đi ngay lúc đầu
    if (findAvailableMoves(initialBoard).length === 0) {
      initialBoard = shuffleBoard(initialBoard, false);
    }

    setBoard(initialBoard);
    setSelected(null);
    setHintPair(null);
    setLaserPath(null);
    setScore(0);
    setCombo(0);
    setHintsLeft(3);
    setShufflesLeft(3);
    setTimeLeft(settings.timeLimit || 300);
    setIsGameOver(false);
    setIsWon(false);
    setIsPaused(false);
    setRemainingTiles(totalTiles);
    setAutoShuffleMsg(null);
  }, [rows, cols, iconCount, totalRows, totalCols, settings.timeLimit, findAvailableMoves, shuffleBoard]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (isGameOver || isWon || isPaused || (settings.timeLimit || 300) <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          soundManager.playDefeat();
          return 0;
        }
        if (prev === 30 || prev === 10) {
          soundManager.playLowTime();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, isWon, isPaused, settings.timeLimit]);

  // Xử lý nhấp chọn ô
  const handleTileClick = (r: number, c: number) => {
    if (isGameOver || isWon || isPaused) return;
    const tile = board[r][c];
    if (!tile) return;

    soundManager.playButtonClick();
    setHintPair(null);

    // Nếu chưa chọn ô nào
    if (!selected) {
      setSelected({ r, c });
      return;
    }

    // Nếu nhấp lại vào chính ô đang chọn -> hủy chọn
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    const prevTile = board[selected.r][selected.c];
    if (!prevTile) {
      setSelected({ r, c });
      return;
    }

    // Nếu khác biểu tượng -> chọn ô mới
    if (prevTile.icon !== tile.icon) {
      setSelected({ r, c });
      return;
    }

    // Cùng biểu tượng -> Kiểm tra đường gấp khúc
    const path = findPath(selected, { r, c }, board);
    if (path) {
      // Tìm thấy đường nối hợp lệ!
      setLaserPath(path);
      soundManager.playCardFlip();

      // Tính điểm và combo
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 * newCombo;
      setScore(prev => prev + points);

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setCombo(0), 4000);

      // Hiệu ứng tia laser nối 2 ô và xóa ô sau 260ms
      setTimeout(() => {
        setBoard(prevBoard => {
          const next = prevBoard.map(row => [...row]);
          next[selected.r][selected.c] = null;
          next[r][c] = null;

          const newRemaining = remainingTiles - 2;
          setRemainingTiles(newRemaining);

          if (newRemaining === 0) {
            // Chiến thắng!
            setIsWon(true);
            soundManager.playVictory();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            const finalScore = score + points + timeLeft * 10;
            try {
              const currentBest = parseInt(localStorage.getItem('acegames_onet_best') || '0', 10);
              if (finalScore > currentBest) {
                localStorage.setItem('acegames_onet_best', finalScore.toString());
              }
            } catch {}
          } else {
            // Kiểm tra deadlock sau khi xóa ô
            const available = findAvailableMoves(next);
            if (available.length === 0) {
              return shuffleBoard(next, false);
            }
          }
          return next;
        });

        setSelected(null);
        setLaserPath(null);
      }, 260);
    } else {
      // Đường đi bị chặn -> đổi sang chọn ô mới
      setSelected({ r, c });
    }
  };

  // Sử dụng Gợi Ý (Hint)
  const handleUseHint = () => {
    if (hintsLeft <= 0 || isGameOver || isWon || isPaused) return;
    const available = findAvailableMoves(board);
    if (available.length > 0) {
      soundManager.playButtonClick();
      setHintPair(available[0]);
      setHintsLeft(prev => prev - 1);
    }
  };

  // Sử dụng Xáo Bài (Shuffle thủ công)
  const handleManualShuffle = () => {
    if (shufflesLeft <= 0 || isGameOver || isWon || isPaused) return;
    soundManager.playButtonClick();
    setBoard(prev => shuffleBoard(prev, true));
    setSelected(null);
    setHintPair(null);
    setShufflesLeft(prev => prev - 1);
  };

  // Định dạng thời gian
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 bg-slate-950/70 select-none overflow-hidden">
      
      {/* Top Bar: Điểm số, Combo, Thời gian, Nút điều khiển */}
      <div className="w-full max-w-5xl flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-lg backdrop-blur-md mb-2 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Điểm số */}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-400 font-bold uppercase">Điểm:</span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              {score}
            </span>
          </div>

          {/* Combo */}
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black animate-bounce shadow-md">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>COMBO x{combo}</span>
            </div>
          )}

          {/* Còn lại */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <span>Còn:</span>
            <span className="font-bold text-cyan-300 font-mono">{remainingTiles / 2} cặp</span>
          </div>
        </div>

        {/* Thời gian & Các nút bổ trợ */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Đồng hồ */}
          {(settings.timeLimit || 300) > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs sm:text-sm ${
              timeLeft <= 30
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-950 text-cyan-300 border-cyan-500/30'
            }`}>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Gợi Ý */}
          <button
            onClick={handleUseHint}
            disabled={hintsLeft <= 0 || isGameOver || isWon}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
              hintsLeft > 0
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-gray-600 border-white/5 cursor-not-allowed'
            }`}
            title="Gợi ý cặp nối hợp lệ"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Gợi Ý</span>
            <span className="font-mono">({hintsLeft})</span>
          </button>

          {/* Đổi Bàn */}
          <button
            onClick={handleManualShuffle}
            disabled={shufflesLeft <= 0 || isGameOver || isWon}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
              shufflesLeft > 0
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-gray-600 border-white/5 cursor-not-allowed'
            }`}
            title="Xáo trộn lại toàn bộ bàn"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Xáo Bài</span>
            <span className="font-mono">({shufflesLeft})</span>
          </button>

          {/* Tạm dừng */}
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Chơi lại */}
          <button
            onClick={initGame}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer"
            title="Bắt đầu lại ván mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thông báo tự động xáo bài */}
      {autoShuffleMsg && (
        <div className="absolute top-16 z-30 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold animate-pulse shadow-lg backdrop-blur-md">
          {autoShuffleMsg}
        </div>
      )}

      {/* Board Game Container */}
      <div 
        ref={boardContainerRef}
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-1 sm:p-2 overflow-hidden"
      >
        {/* SVG Laser Path Overlay để vẽ đường nối gấp khúc khi ăn được 2 ô */}
        {laserPath && laserPath.length >= 2 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <defs>
              <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <polyline
              points={laserPath.map(p => {
                // Tính tọa độ pixel thực tế của tâm từng ô
                const colWidth = 100 / totalCols;
                const rowHeight = 100 / totalRows;
                const x = (p.c + 0.5) * colWidth;
                const y = (p.r + 0.5) * rowHeight;
                return `${x}%,${y}%`;
              }).join(' ')}
              fill="none"
              stroke="url(#laserGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
              className="animate-in fade-in duration-100"
            />
          </svg>
        )}

        {/* Lưới các ô Onet (Bao gồm cả 1 viền đệm bên ngoài để đường nối có thể đi vòng ra ngoài rìa) */}
        <div 
          className="w-full h-full max-h-[78vh] grid gap-1 sm:gap-1.5 p-1 bg-slate-900/40 border border-white/5 rounded-2xl shadow-2xl"
          style={{
            gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((rowArr, r) =>
            rowArr.map((tile, c) => {
              const isSelected = selected?.r === r && selected?.c === c;
              const isHinted = hintPair && (
                (hintPair[0].r === r && hintPair[0].c === c) ||
                (hintPair[1].r === r && hintPair[1].c === c)
              );
              const isEdge = r === 0 || r === totalRows - 1 || c === 0 || c === totalCols - 1;

              // Ô viền đệm bên ngoài (khoảng trống để vẽ đường nối vòng qua ngoài biên)
              if (isEdge || !tile) {
                return (
                  <div 
                    key={`empty_${r}_${c}`} 
                    className="w-full h-full rounded-lg pointer-events-none" 
                  />
                );
              }

              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(r, c)}
                  className={`relative w-full h-full rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-95 shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-500/40 to-blue-600/40 border-2 border-cyan-400 ring-2 ring-cyan-400/50 scale-105 z-10 shadow-cyan-500/40'
                      : isHinted
                      ? 'bg-gradient-to-b from-amber-500/40 to-orange-600/40 border-2 border-amber-400 animate-pulse scale-105 z-10'
                      : 'bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-cyan-500/50 hover:shadow-cyan-500/20'
                  }`}
                >
                  <span className="text-xl sm:text-2xl md:text-3xl filter drop-shadow-md transition-transform duration-150 hover:scale-115">
                    {tile.icon}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Tạm Dừng */}
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <h3 className="text-xl sm:text-2xl font-black text-white font-['Orbitron'] tracking-wider">
              ĐANG TẠM DỪNG
            </h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95"
            >
              Tiếp Tục Chơi
            </button>
          </div>
        )}

        {/* Modal Hết Giờ (Game Over) */}
        {isGameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-5xl">⏰</div>
            <h3 className="text-2xl font-black text-rose-400 font-['Orbitron'] tracking-wider">
              HẾT THỜI GIAN!
            </h3>
            <p className="text-sm text-gray-300 font-mono">
              Điểm đạt được: <span className="font-bold text-amber-300 text-base">{score}</span>
            </p>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Ngay</span>
            </button>
          </div>
        )}

        {/* Modal Chiến Thắng (Victory) */}
        {isWon && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-5xl animate-bounce">🏆</div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent font-['Orbitron'] tracking-wider">
              CHIẾN THẮNG HOÀN HẢO!
            </h3>
            <p className="text-sm text-gray-300">
              Bạn đã dọn sạch toàn bộ bàn cờ xuất sắc!
            </p>
            <div className="flex items-center gap-4 bg-slate-900/90 border border-white/10 px-5 py-2.5 rounded-2xl font-mono text-sm">
              <span className="text-gray-400">Tổng Điểm:</span>
              <span className="text-xl font-black text-amber-300">
                {score + timeLeft * 10}
              </span>
            </div>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ván Mới</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
