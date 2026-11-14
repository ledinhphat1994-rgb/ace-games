import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Pause, Play } from 'lucide-react';
import { soundManager } from '../utils/sound';

const COLS = 10;
const ROWS = 20;

// Tetromino definitions
const SHAPES: { [key: string]: number[][] } = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

const COLORS: { [key: string]: string } = {
  I: '#06b6d4', // Cyan
  J: '#3b82f6', // Blue
  L: '#f97316', // Orange
  O: '#eab308', // Yellow
  S: '#22c55e', // Green
  T: '#a855f7', // Purple
  Z: '#ef4444'  // Red
};

interface Piece {
  type: string;
  shape: number[][];
  x: number;
  y: number;
}

export const GameTetris: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPieceType, setNextPieceType] = useState<string>('T');
  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('acegames_tetris_highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
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
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not permitted
    }
  }, []);

  const getRandomPieceType = (): string => {
    const keys = Object.keys(SHAPES);
    return keys[Math.floor(Math.random() * keys.length)];
  };

  const createPiece = (type: string): Piece => {
    const shape = SHAPES[type];
    return {
      type,
      shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0
    };
  };

  const checkCollision = useCallback((piece: Piece, b: (string | null)[][]): boolean => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = piece.x + c;
          const newY = piece.y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && b[newY][newX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const rotateMatrix = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return result;
  };

  const resetGame = useCallback(() => {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    const firstType = getRandomPieceType();
    const nextType = getRandomPieceType();
    setBoard(newBoard);
    setCurrentPiece(createPiece(firstType));
    setNextPieceType(nextType);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const lockPiece = useCallback((piece: Piece, currentB: (string | null)[][]) => {
    const nextB = currentB.map(row => [...row]);
    let placed = false;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const targetY = piece.y + r;
          const targetX = piece.x + c;
          if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
            nextB[targetY][targetX] = piece.type;
            placed = true;
          }
        }
      }
    }

    if (!placed || piece.y <= 0) {
      setGameOver(true);
      playTone(150, 'sawtooth', 0.4);
      return;
    }

    playTone(280, 'sine', 0.05);

    // Check cleared lines
    let clearedCount = 0;
    const filteredB = nextB.filter(row => {
      const isFull = row.every(cell => cell !== null);
      if (isFull) clearedCount++;
      return !isFull;
    });

    while (filteredB.length < ROWS) {
      filteredB.unshift(Array(COLS).fill(null));
    }

    if (clearedCount > 0) {
      playTone(520, 'triangle', 0.2);
      const points = [0, 100, 300, 500, 800][clearedCount] || (clearedCount * 200);
      setScore(prev => {
        const nextScore = prev + points * level;
        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem('acegames_tetris_highscore', nextScore.toString());
        }
        return nextScore;
      });
      setLines(prev => {
        const nextLines = prev + clearedCount;
        setLevel(Math.floor(nextLines / 10) + 1);
        return nextLines;
      });
    }

    setBoard(filteredB);

    // Spawn next piece
    const next = createPiece(nextPieceType);
    if (checkCollision(next, filteredB)) {
      setGameOver(true);
      playTone(150, 'sawtooth', 0.4);
    } else {
      setCurrentPiece(next);
      setNextPieceType(getRandomPieceType());
    }
  }, [checkCollision, highScore, level, nextPieceType, playTone]);

  const movePiece = useCallback((dx: number, dy: number): boolean => {
    if (!currentPiece || gameOver || isPaused) return false;
    const moved = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };
    if (!checkCollision(moved, board)) {
      setCurrentPiece(moved);
      if (dx !== 0) playTone(300, 'sine', 0.03);
      return true;
    }
    if (dy > 0) {
      lockPiece(currentPiece, board);
    }
    return false;
  }, [board, checkCollision, currentPiece, gameOver, isPaused, lockPiece, playTone]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotatedShape = rotateMatrix(currentPiece.shape);
    const candidate: Piece = { ...currentPiece, shape: rotatedShape };

    // Wall kick attempts
    const kicks = [0, 1, -1, 2, -2];
    for (const offset of kicks) {
      const kicked = { ...candidate, x: candidate.x + offset };
      if (!checkCollision(kicked, board)) {
        setCurrentPiece(kicked);
        playTone(400, 'sine', 0.04);
        return;
      }
    }
  }, [board, checkCollision, currentPiece, gameOver, isPaused, playTone]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    let curr = currentPiece;
    while (!checkCollision({ ...curr, y: curr.y + 1 }, board)) {
      curr = { ...curr, y: curr.y + 1 };
    }
    playTone(350, 'square', 0.05);
    lockPiece(curr, board);
  }, [board, checkCollision, currentPiece, gameOver, isPaused, lockPiece, playTone]);

  // Tick loop
  useEffect(() => {
    if (gameOver || isPaused) return;
    const speed = Math.max(100, 800 - (level - 1) * 70);
    const interval = setInterval(() => {
      movePiece(0, 1);
    }, speed);
    return () => clearInterval(interval);
  }, [gameOver, isPaused, level, movePiece]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotatePiece();
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, hardDrop, movePiece, rotatePiece]);

  // Render combined grid
  const displayGrid = board.map(row => [...row]);
  if (currentPiece && !gameOver) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const gy = currentPiece.y + r;
          const gx = currentPiece.x + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            displayGrid[gy][gx] = currentPiece.type;
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center select-none w-full max-w-lg mx-auto py-2">
      {/* Top Status Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2 mb-3 shadow-inner">
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-[9px] uppercase font-bold flex items-center h-4 leading-none">
              ĐIỂM SỐ
            </span>
            <span className="font-extrabold text-amber-400 text-base sm:text-lg font-mono leading-none mt-1">
              {score}
            </span>
          </div>
          <div className="h-7 w-px bg-white/10 hidden xs:block" />
          <div className="hidden xs:flex flex-col items-center">
            <span className="text-gray-400 text-[9px] uppercase font-bold flex items-center h-4 leading-none">
              HÀNG
            </span>
            <span className="font-bold text-cyan-400 text-xs sm:text-sm font-mono leading-none mt-1">
              {lines}
            </span>
          </div>
          <div className="h-7 w-px bg-white/10 hidden xs:block" />
          <div className="hidden xs:flex flex-col items-center">
            <span className="text-gray-400 text-[9px] uppercase font-bold flex items-center h-4 leading-none">
              CẤP
            </span>
            <span className="font-bold text-emerald-400 text-xs sm:text-sm font-mono leading-none mt-1">
              {level}
            </span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-purple-400 text-[9px] uppercase font-bold flex items-center h-4 leading-none">
              KỶ LỤC
            </span>
            <span className="font-bold text-purple-300 text-xs sm:text-sm font-mono leading-none mt-1">
              {highScore}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            disabled={gameOver}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors border border-white/5"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play size={16} className="text-emerald-400" /> : <Pause size={16} className="text-amber-400" />}
          </button>
          {!gameOver && (
            <button
              onClick={resetGame}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors border border-white/5"
              title="Chơi lại từ đầu"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="flex items-start justify-center gap-3 sm:gap-6 w-full">
        {/* Massive Tetris Board */}
        <div className="relative bg-slate-950 p-2 sm:p-3 rounded-3xl border-4 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]">
          <div 
            className="grid gap-[2px] bg-slate-900/90 border-2 border-slate-800 rounded-2xl overflow-hidden p-1"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              width: 'min(50vw, 260px, calc((100dvh - 270px) / 2))',
              height: 'calc(min(50vw, 260px, calc((100dvh - 270px) / 2)) * 2)'
            }}
          >
            {displayGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-full h-full rounded-[2px] transition-colors duration-75"
                  style={{
                    backgroundColor: cell ? COLORS[cell] : '#0f172a',
                    boxShadow: cell ? `inset 0 0 6px rgba(255, 255, 255, 0.35)` : 'none',
                    border: cell ? `1px solid rgba(255, 255, 255, 0.25)` : '1px solid rgba(30, 41, 59, 0.4)'
                  }}
                />
              ))
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <span className="text-4xl mb-2">💥</span>
              <h3 className="text-2xl font-black text-rose-500 mb-6 font-['Orbitron']">THUA CUỘC!</h3>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transform active:scale-95 transition-all text-sm"
              >
                <RotateCcw size={16} /> Chơi Lại (Phím Space)
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">ĐANG TẠM DỪNG</h3>
              <button
                onClick={() => setIsPaused(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-sm"
              >
                Tiếp tục chơi
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Info: Next Piece */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-center min-w-[70px] sm:min-w-[90px]">
            <span className="text-[10px] text-gray-400 block font-semibold mb-2">TIẾP THEO</span>
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto flex items-center justify-center bg-slate-950 rounded-lg border border-slate-800">
              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${SHAPES[nextPieceType][0].length}, 8px)`
                }}
              >
                {SHAPES[nextPieceType].map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`next-${r}-${c}`}
                      className="w-2 h-2 rounded-[1px]"
                      style={{
                        backgroundColor: cell ? COLORS[nextPieceType] : 'transparent'
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Touch D-Pad Controls for Mobile & iPad */}
      <div className="w-full mt-3 flex items-center justify-center gap-2 sm:gap-4">
        <button
          onClick={() => movePiece(-1, 0)}
          className="p-3 sm:p-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-white shadow-md transition-all active:scale-95"
          title="Trái"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={rotatePiece}
          className="p-3 sm:p-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-400 rounded-xl text-white shadow-md shadow-amber-600/30 transition-all active:scale-95"
          title="Xoay khối"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={() => movePiece(0, 1)}
          className="p-3 sm:p-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-white shadow-md transition-all active:scale-95"
          title="Hạ nhanh 1 bước"
        >
          <ArrowDown size={20} />
        </button>
        <button
          onClick={() => movePiece(1, 0)}
          className="p-3 sm:p-3.5 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-xl text-white shadow-md transition-all active:scale-95"
          title="Phải"
        >
          <ArrowRight size={20} />
        </button>
        <button
          onClick={hardDrop}
          className="px-3 sm:px-4 py-3 sm:py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-400 rounded-xl text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95"
          title="Rơi lập tức (Hard Drop)"
        >
          DROP
        </button>
      </div>
    </div>
  );
};
