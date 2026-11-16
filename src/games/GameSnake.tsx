import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundManager } from '../utils/sound';

// Dynamic grid for 16:9 widescreen arcade experience on PC, vertical on mobile
const getGridConfig = () => {
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return { cols: 32, rows: 18 }; // 16:9 Widescreen Theater Grid
  }
  return { cols: 18, rows: 22 };   // Mobile Portrait Grid
};

const INITIAL_SPEED = 120;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const GameSnake: React.FC = () => {
  const [gridConfig, setGridConfig] = useState(getGridConfig);
  const { cols, rows } = gridConfig;

  // Responsive grid listener
  useEffect(() => {
    const handleResize = () => setGridConfig(getGridConfig());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [snake, setSnake] = useState<Point[]>([
    { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
    { x: Math.floor(cols / 2), y: Math.floor(rows / 2) + 1 },
    { x: Math.floor(cols / 2), y: Math.floor(rows / 2) + 2 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('acegames_snake_best') || '0', 10);
  });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, duration: number = 0.08) => {
    if (!soundManager.isSoundOn()) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const newFood: Point = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      const isOnSnake = currentSnake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) return newFood;
    }
  }, [cols, rows]);

  const resetGame = useCallback(() => {
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    const initialSnake: Point[] = [
      { x: midX, y: midY },
      { x: midX, y: midY + 1 },
      { x: midX, y: midY + 2 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('UP');
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    playTone(520, 0.1);
  }, [cols, rows, generateFood, playTone]);

  const changeDirection = useCallback((newDir: Direction) => {
    if (!hasStarted) setHasStarted(true);
    const cur = directionRef.current;
    if (
      (newDir === 'UP' && cur !== 'DOWN') ||
      (newDir === 'DOWN' && cur !== 'UP') ||
      (newDir === 'LEFT' && cur !== 'RIGHT') ||
      (newDir === 'RIGHT' && cur !== 'LEFT')
    ) {
      setDirection(newDir);
      playTone(400, 0.03);
    }
  }, [hasStarted, playTone]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!hasStarted || isGameOver) resetGame();
        else setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, hasStarted, isGameOver, resetGame]);

  // Touch Swipe on mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) changeDirection('RIGHT');
      else if (dx < -20) changeDirection('LEFT');
    } else {
      if (dy > 20) changeDirection('DOWN');
      else if (dy < -20) changeDirection('UP');
    }
  };

  // Game Loop
  useEffect(() => {
    if (!hasStarted || isGameOver || isPaused) return;

    const speed = Math.max(65, INITIAL_SPEED - Math.floor(score / 5) * 5);

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (directionRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
          setIsGameOver(true);
          soundManager.playExplosion();
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setIsGameOver(true);
          soundManager.playExplosion();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          soundManager.playSnakeEat();
          setScore(s => {
            const nextScore = s + 1;
            if (nextScore > bestScore) {
              setBestScore(nextScore);
              localStorage.setItem('acegames_snake_best', nextScore.toString());
            }
            return nextScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, isGameOver, isPaused, food, score, bestScore, cols, rows, generateFood, playTone]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full max-w-[min(96vw,1320px)] mx-auto select-none p-1 sm:p-2"
    >
      {/* Top HUD - Khớp chuẩn độ rộng 1320px đồng bộ tất cả games */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 min-h-[52px] shadow-inner flex-shrink-0">
        {/* Khối Trái: Chế độ chơi game */}
        <div className="flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs shadow-sm">
            <span>🐍</span>
            <span>Rắn Cổ Điển</span>
          </div>
        </div>

        {/* Khối Giữa: Căn chính giữa tuyệt đối - Điểm số, Kỷ lục & Độ dài */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-4 sm:gap-6 z-0 pointer-events-none">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-3 leading-none text-center">
              Điểm Số
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono leading-none mt-1 text-center">
              {score}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1 h-3 leading-none text-center">
              <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>Kỷ Lục</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-none mt-1 text-center">
              {bestScore}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:flex flex-col items-center text-center">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-center h-3 leading-none text-center">
              Chiều Dài
            </span>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono leading-none mt-1 text-center">
              {snake.length}
            </span>
          </div>
        </div>

        {/* Khối Phải: Tùy chỉnh, thiết lập của game (Tạm dừng & Chơi lại) */}
        <div className="flex items-center gap-1.5 sm:gap-2 z-10">
          {/* Nút Tạm Dừng */}
          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={!hasStarted || isGameOver}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/5 transition cursor-pointer"
            title={isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Nút Chơi Lại */}
          {!isGameOver && hasStarted && (
            <button
              onClick={resetGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
              title="Chơi Lại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chơi Lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Massive 16:9 Widescreen Arcade Board - Fits 100% inside container */}
      <div 
        className="game-arena-box relative bg-[#0b1120] p-2 sm:p-2.5 rounded-3xl w-full max-w-[min(96vw,1320px)] max-h-[calc(100dvh-235px)] border-4 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.35)] overflow-hidden flex items-center justify-center flex-shrink min-h-0"
        style={{ aspectRatio: `${cols} / ${rows}` }}
      >
        {/* Grid cells */}
        <div 
          className="grid w-full h-full gap-[2px] bg-slate-950/80 rounded-2xl overflow-hidden p-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: cols * rows }).map((_, idx) => {
            const x = idx % cols;
            const y = Math.floor(idx / cols);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className={`transition-colors duration-75 rounded-[3px] ${
                  isHead
                    ? 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,1)] z-10 scale-105'
                    : isBody
                    ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
                    : isFood
                    ? 'bg-rose-500 rounded-full animate-pulse shadow-[0_0_14px_rgba(244,63,94,1)] scale-110'
                    : 'bg-slate-900/30'
                }`}
              />
            );
          })}
        </div>

        {/* Start Overlay */}
        {!hasStarted && !isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <span className="text-6xl mb-3 animate-bounce">🐍</span>
            <h3 className="text-3xl font-black text-emerald-400 mb-6 ">RẮN SĂN MỒI</h3>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over Overlay (Zero Duplicate Score & Single Big Button) */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            <span className="text-6xl mb-2">💥</span>
            <h3 className="text-3xl font-black text-rose-500 mb-6 ">ĐÂM VÀO TƯỜNG!</h3>
            
            {/* The ONLY Play Again button on the screen */}
            <button
              onClick={resetGame}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile D-Pad (Only on small screens) */}
      <div className="flex sm:hidden flex-col items-center mt-3 gap-1">
        <button
          onClick={() => changeDirection('UP')}
          className="w-12 h-12 bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

