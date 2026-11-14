import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 140;

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

  const directionRef = useRef<Direction>(direction);
  directionRef.current = direction;

  // Generate random food not on snake
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
  }, [generateFood]);

  // Handle direction change with reverse guard
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
    }
  }, [hasStarted]);

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
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Game Loop
  useEffect(() => {
    if (!hasStarted || isGameOver || isPaused) return;

    const speed = Math.max(70, INITIAL_SPEED - Math.floor(score / 5) * 5);
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const curDir = directionRef.current;

        if (curDir === 'UP') head.y -= 1;
        if (curDir === 'DOWN') head.y += 1;
        if (curDir === 'LEFT') head.x -= 1;
        if (curDir === 'RIGHT') head.x += 1;

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => {
            const nextScore = s + 10;
            if (nextScore > bestScore) {
              setBestScore(nextScore);
              localStorage.setItem('acegames_snake_best', nextScore.toString());
            }
            return nextScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // remove tail
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [hasStarted, isGameOver, isPaused, food, score, bestScore, generateFood]);

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-md mx-auto select-none">
      {/* Score Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-400 font-['Orbitron']">SNAKE</h2>
          <p className="text-xs text-gray-400">Rắn Săn Mồi Cổ Điển</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-arcade-card border border-arcade-border px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Điểm</span>
            <span className="text-base sm:text-lg font-bold text-white">{score}</span>
          </div>
          <div className="bg-arcade-card border border-amber-500/30 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Trophy className="w-2.5 h-2.5" /> Kỷ Lục
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-300">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between w-full mb-2">
        <button
          onClick={() => setIsPaused(p => !p)}
          disabled={!hasStarted || isGameOver}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-arcade-card hover:bg-arcade-hover border border-arcade-border text-gray-200 transition"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-green-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          {isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}
        </button>

        <button
          onClick={resetGame}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {hasStarted ? 'Chơi Lại' : 'Bắt Đầu'}
        </button>
      </div>

      {/* Game Canvas Board */}
      <div className="relative bg-[#0F172A] p-2 rounded-2xl w-full aspect-square border-4 border-emerald-500/30 shadow-2xl overflow-hidden">
        {/* Grid cells */}
        <div 
          className="grid w-full h-full gap-[1px] bg-slate-800/40 rounded-xl overflow-hidden"
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
                className={`transition-colors duration-75 rounded-[2px] ${
                  isHead
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-10'
                    : isBody
                    ? 'bg-emerald-600/90'
                    : isFood
                    ? 'bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                    : 'bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Start Game Overlay */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 z-20">
            <span className="text-4xl mb-2 animate-bounce">🐍</span>
            <h3 className="text-2xl font-black text-emerald-400 mb-1">RẮN SĂN MỒI</h3>
            <p className="text-xs text-gray-300 mb-4 text-center">Dùng phím mũi tên hoặc nút ảo để điều khiển rắn ăn táo!</p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Bắt Đầu Chơi
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 z-20 animate-fade-in">
            <h3 className="text-2xl font-black text-rose-500 mb-1">THUA CUỘC!</h3>
            <p className="text-xs text-gray-300 mb-1">Điểm đạt được: <span className="font-bold text-emerald-400 text-base">{score}</span></p>
            <p className="text-[11px] text-gray-400 mb-4">Rắn đã va chạm vào tường hoặc tự cắn vào đuôi.</p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Chơi Lại Ngay
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 z-20">
            <Pause className="w-12 h-12 text-amber-400 mb-2" />
            <h3 className="text-xl font-bold mb-3">ĐÃ TẠM DỪNG</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs"
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>

      {/* On-screen D-Pad for Mobile & Touch devices */}
      <div className="flex flex-col items-center mt-3 sm:hidden">
        <button
          onClick={() => changeDirection('UP')}
          className="w-12 h-12 bg-arcade-card active:bg-emerald-600/50 border border-arcade-border rounded-xl flex items-center justify-center text-gray-200 mb-1 shadow active:scale-95 transition"
        >
          <ChevronUp className="w-7 h-7" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="w-12 h-12 bg-arcade-card active:bg-emerald-600/50 border border-arcade-border rounded-xl flex items-center justify-center text-gray-200 shadow active:scale-95 transition"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="w-12 h-12 bg-arcade-card active:bg-emerald-600/50 border border-arcade-border rounded-xl flex items-center justify-center text-gray-200 shadow active:scale-95 transition"
          >
            <ChevronDown className="w-7 h-7" />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="w-12 h-12 bg-arcade-card active:bg-emerald-600/50 border border-arcade-border rounded-xl flex items-center justify-center text-gray-200 shadow active:scale-95 transition"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
