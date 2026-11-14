import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 130;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const GameSnake: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
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
  const [soundEnabled, setSoundEnabled] = useState(true);

  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, duration: number = 0.08) => {
    if (!soundEnabled) return;
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
  }, [soundEnabled]);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const newFood: Point = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) return newFood;
    }
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('UP');
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasStarted(true);
    playTone(520, 0.1);
  }, [generateFood, playTone]);

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

    const speed = Math.max(70, INITIAL_SPEED - Math.floor(score / 5) * 6);

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
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          playTone(180, 0.3);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setIsGameOver(true);
          playTone(180, 0.3);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          playTone(660, 0.08);
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
  }, [hasStarted, isGameOver, isPaused, food, score, bestScore, generateFood, playTone]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col items-center justify-center w-full h-full max-w-[min(96vw,calc(100vh-80px),1000px)] mx-auto select-none p-1 sm:p-2"
    >
      {/* Top Large HUD */}
      <div className="flex items-center justify-between w-full mb-2 px-3 bg-slate-900/85 border border-white/10 rounded-2xl py-2 shadow-inner">
        <div className="flex items-center gap-3 sm:gap-6">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Điểm Số</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono leading-none">{score}</span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Kỷ Lục</span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono leading-none">{bestScore}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(p => !p)}
            className="p-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white"
            title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={!hasStarted || isGameOver}
            className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/5 transition"
          >
            {isPaused ? <Play className="w-4 h-4 text-green-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}</span>
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 transition shadow-lg shadow-emerald-500/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{hasStarted ? 'Chơi Lại' : 'Bắt Đầu'}</span>
          </button>
        </div>
      </div>

      {/* Massive Game Canvas Board (Fills maximum screen size!) */}
      <div className="relative bg-[#0b1120] p-2 sm:p-3 rounded-3xl w-full aspect-square max-h-[min(94vw,56vh)] sm:max-h-[min(96vw,calc(100vh-160px),920px)] border-4 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.35)] overflow-hidden flex items-center justify-center">
        {/* Grid cells */}
        <div 
          className="grid w-full h-full gap-[2px] bg-slate-950/80 rounded-2xl overflow-hidden p-1"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);
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
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <span className="text-6xl mb-3 animate-bounce">🐍</span>
            <h3 className="text-3xl font-black text-emerald-400 mb-2 font-['Orbitron']">RẮN SĂN MỒI</h3>
            <p className="text-xs text-gray-400 mb-6">Dùng phím mũi tên hoặc vuốt màn hình để săn táo!</p>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black rounded-2xl text-base shadow-[0_0_30px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-6xl mb-2">💥</span>
            <h3 className="text-3xl font-black text-rose-500 mb-2 font-['Orbitron']">ĐÂM VÀO TƯỜNG!</h3>
            <p className="text-sm text-gray-400 mb-1">Điểm số của bạn:</p>
            <p className="text-4xl font-black text-amber-400 font-mono mb-6">{score}</p>
            <button
              onClick={resetGame}
              className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black rounded-2xl text-base shadow-[0_0_30px_rgba(244,63,94,0.5)] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại Ngay
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
