import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Undo2, 
  Eraser, 
  Pencil, 
  Lightbulb, 
  Trophy, 
  Timer, 
  AlertTriangle, 
  Play, 
  Pause,
  Check
} from 'lucide-react';
import { 
  generateSudoku, 
  isBoardSolved, 
  getRemainingCounts, 
  type SudokuCell, 
  type SudokuDifficulty 
} from './sudoku/sudoku-generator';
import { soundManager } from '../utils/sound';

interface HistoryStep {
  board: SudokuCell[][];
  selected: [number, number] | null;
  mistakes: number;
}

export const GameSudoku: React.FC = () => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_sudoku');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['easy', 'medium', 'hard'].includes(parsed.difficulty)) return parsed.difficulty;
      }
    } catch {}
    return 'easy';
  });
  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [isPencilMode, setIsPencilMode] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [maxMistakes, setMaxMistakes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_sudoku');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.maxMistakes !== undefined) return parsed.maxMistakes;
      }
    } catch {}
    return 3;
  });
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryStep[]>([]);

  // Lưu cài đặt khi độ khó thay đổi
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ace_game_settings_sudoku');
      const existing = saved ? JSON.parse(saved) : {};
      localStorage.setItem('ace_game_settings_sudoku', JSON.stringify({ ...existing, difficulty }));
    } catch {}
  }, [difficulty]);

  // Lắng nghe thay đổi cài đặt từ GameSettingsModal
  useEffect(() => {
    const handleSettingChange = (e: CustomEvent) => {
      if (e.detail?.gameId === 'sudoku' && e.detail?.allSettings) {
        const s = e.detail.allSettings;
        if (s.difficulty && ['easy', 'medium', 'hard'].includes(s.difficulty)) {
          setDifficulty(s.difficulty);
        }
        if (s.maxMistakes !== undefined) {
          setMaxMistakes(s.maxMistakes);
        }
      }
    };
    window.addEventListener('ace-game-setting-changed' as any, handleSettingChange);
    return () => window.removeEventListener('ace-game-setting-changed' as any, handleSettingChange);
  }, []);

  // Clone board deep
  const cloneBoard = (b: SudokuCell[][]): SudokuCell[][] => {
    return b.map(row => row.map(cell => ({ ...cell, notes: [...cell.notes] })));
  };

  // Start new game
  const startNewGame = useCallback((diff: SudokuDifficulty = difficulty) => {
    soundManager.playButtonClick();
    const { board: newBoard } = generateSudoku(diff);
    setBoard(newBoard);
    setSelected(null);
    setActiveNumber(null);
    setMistakes(0);
    setHintsLeft(3);
    setElapsedTime(0);
    setIsPencilMode(false);
    setIsPaused(false);
    setIsWon(false);
    setIsGameOver(false);
    setHistory([]);
  }, [difficulty]);

  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty]);

  // Timer loop
  useEffect(() => {
    if (isPaused || isWon || isGameOver || board.length === 0) return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isWon, isGameOver, board.length]);

  // Format seconds to MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Push history before mutating
  const pushHistory = () => {
    setHistory(prev => [
      ...prev.slice(-20),
      {
        board: cloneBoard(board),
        selected,
        mistakes,
      }
    ]);
  };

  // Undo step
  const handleUndo = () => {
    if (history.length === 0 || isWon || isGameOver) return;
    soundManager.playButtonClick();
    const last = history[history.length - 1];
    setBoard(last.board);
    setSelected(last.selected);
    setMistakes(last.mistakes);
    setHistory(prev => prev.slice(0, -1));
  };

  // Process filling a number into cell (r, c)
  const fillCell = (r: number, c: number, num: number) => {
    const cell = board[r][c];
    if (cell.isGiven) return;

    pushHistory();
    const newBoard = cloneBoard(board);
    const target = newBoard[r][c];

    if (isPencilMode) {
      soundManager.playButtonClick();
      if (target.notes.includes(num)) {
        target.notes = target.notes.filter(n => n !== num);
      } else {
        target.notes = [...target.notes, num].sort((a, b) => a - b);
      }
      setBoard(newBoard);
      return;
    }

    // Toggle off if tapping same value
    if (target.value === num) {
      target.value = 0;
      target.isError = false;
      setBoard(newBoard);
      return;
    }

    target.value = num;
    target.notes = [];

    // Verify correctness
    if (num === target.solution) {
      soundManager.playChessMove();
      target.isError = false;

      // Auto-clear notes of this number from same row, column, 3x3 block
      const boxR = Math.floor(r / 3) * 3;
      const boxC = Math.floor(c / 3) * 3;
      for (let i = 0; i < 9; i++) {
        newBoard[r][i].notes = newBoard[r][i].notes.filter(n => n !== num);
        newBoard[i][c].notes = newBoard[i][c].notes.filter(n => n !== num);
      }
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newBoard[boxR + i][boxC + j].notes = newBoard[boxR + i][boxC + j].notes.filter(n => n !== num);
        }
      }

      setBoard(newBoard);

      // Check win
      if (isBoardSolved(newBoard)) {
        setIsWon(true);
        soundManager.playVictory();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        try {
          const finalScore = Math.max(1000, 15000 - elapsedTime * 12 - mistakes * 1000);
          const currentBest = parseInt(localStorage.getItem('acegames_sudoku_best') || '0', 10);
          if (finalScore > currentBest) {
            localStorage.setItem('acegames_sudoku_best', finalScore.toString());
          }
        } catch {}
      }
    } else {
      // Wrong move
      soundManager.playDefeat();
      target.isError = true;
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setBoard(newBoard);

      if (maxMistakes > 0 && nextMistakes >= maxMistakes) {
        setIsGameOver(true);
      }
    }
  };

  // Handle cell click
  const handleCellClick = (r: number, c: number) => {
    if (isWon || isGameOver || isPaused) return;
    soundManager.playButtonClick();

    // If activeNumber is selected and cell is empty, fill immediately!
    if (activeNumber && !board[r][c].isGiven && board[r][c].value === 0) {
      setSelected([r, c]);
      fillCell(r, c, activeNumber);
      return;
    }

    setSelected([r, c]);
    if (board[r][c].value > 0) {
      setActiveNumber(board[r][c].value);
    }
  };

  // Handle number input (from keypad or keyboard)
  const handleNumberInput = (num: number) => {
    if (isWon || isGameOver || isPaused) return;

    setActiveNumber(num);

    // If a cell is currently selected, fill it
    if (selected) {
      const [r, c] = selected;
      fillCell(r, c, num);
    }
  };

  // Erase active cell
  const handleErase = () => {
    if (!selected || isWon || isGameOver || isPaused) return;
    const [r, c] = selected;
    const cell = board[r][c];
    if (cell.isGiven) return;
    if (cell.value === 0 && cell.notes.length === 0) return;

    soundManager.playButtonClick();
    pushHistory();
    const newBoard = cloneBoard(board);
    newBoard[r][c].value = 0;
    newBoard[r][c].notes = [];
    newBoard[r][c].isError = false;
    setBoard(newBoard);
  };

  // Hint button
  const handleHint = () => {
    if (hintsLeft <= 0 || isWon || isGameOver || isPaused) return;

    let targetR = -1;
    let targetC = -1;

    if (selected) {
      const [r, c] = selected;
      if (!board[r][c].isGiven && board[r][c].value !== board[r][c].solution) {
        targetR = r;
        targetC = c;
      }
    }

    if (targetR === -1) {
      for (let r = 0; r < 9 && targetR === -1; r++) {
        for (let c = 0; c < 9; c++) {
          if (!board[r][c].isGiven && board[r][c].value !== board[r][c].solution) {
            targetR = r;
            targetC = c;
            break;
          }
        }
      }
    }

    if (targetR === -1) return;

    soundManager.playCardMatch();
    pushHistory();
    const newBoard = cloneBoard(board);
    const cell = newBoard[targetR][targetC];
    cell.value = cell.solution;
    cell.isError = false;
    cell.notes = [];

    // Clear notes from neighbors
    const boxR = Math.floor(targetR / 3) * 3;
    const boxC = Math.floor(targetC / 3) * 3;
    for (let i = 0; i < 9; i++) {
      newBoard[targetR][i].notes = newBoard[targetR][i].notes.filter(n => n !== cell.solution);
      newBoard[i][targetC].notes = newBoard[i][targetC].notes.filter(n => n !== cell.solution);
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        newBoard[boxR + i][boxC + j].notes = newBoard[boxR + i][boxC + j].notes.filter(n => n !== cell.solution);
      }
    }

    setBoard(newBoard);
    setSelected([targetR, targetC]);
    setActiveNumber(cell.solution);
    setHintsLeft(prev => prev - 1);

    if (isBoardSolved(newBoard)) {
      setIsWon(true);
      soundManager.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      try {
        const finalScore = Math.max(1000, 15000 - elapsedTime * 12 - mistakes * 1000);
        const currentBest = parseInt(localStorage.getItem('acegames_sudoku_best') || '0', 10);
        if (finalScore > currentBest) {
          localStorage.setItem('acegames_sudoku_best', finalScore.toString());
        }
      } catch {}
    }
  };

  // Keyboard navigation & inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon || isGameOver || isPaused) return;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
        return;
      }

      if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPencilMode(prev => !prev);
        soundManager.playButtonClick();
        return;
      }

      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleHint();
        return;
      }

      if (e.key.toLowerCase() === 'u' || (e.ctrlKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const [r, c] = selected;
        let nextR = r;
        let nextC = c;
        if (e.key === 'ArrowUp') nextR = (r + 8) % 9;
        if (e.key === 'ArrowDown') nextR = (r + 1) % 9;
        if (e.key === 'ArrowLeft') nextC = (c + 8) % 9;
        if (e.key === 'ArrowRight') nextC = (c + 1) % 9;
        setSelected([nextR, nextC]);
        if (board[nextR][nextC].value > 0) {
          setActiveNumber(board[nextR][nextC].value);
        }
        soundManager.playButtonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, board, isWon, isGameOver, isPaused, isPencilMode, hintsLeft]);

  // Highlight number calculation
  const highlightVal = activeNumber || (selected ? board[selected[0]]?.[selected[1]]?.value : 0);
  const remainingCounts = board.length > 0 ? getRemainingCounts(board) : {};

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 select-none overflow-hidden bg-[#070b14]">
      {/* Container: Tự động chia 2 cột trên Desktop / Fullscreen, và xếp dọc trên Mobile */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 w-full h-full max-w-[min(98vw,1440px)] mx-auto flex-1 min-h-0">
        
        {/* CỘT TRÁI / TRUNG TÂM: Bảng Sudoku 9x9 Khổng Lồ, Bung Hết Cỡ Cực Đã Mắt */}
        <div className="flex-1 flex items-center justify-center w-full h-full min-h-0 min-w-0">
          {board.length > 0 && (
            <div className="relative aspect-square w-full h-full max-h-[min(88vw,calc(100vh-120px),820px)] bg-slate-950 p-2 sm:p-3.5 md:p-4 rounded-3xl border-4 border-cyan-500/60 shadow-[0_0_60px_rgba(6,182,212,0.35)] flex flex-col justify-between">
              
              {/* 9x9 Grid: Phân khối 3x3 bằng viền Cyan 4px cực kỳ rõ nét */}
              <div className="grid grid-cols-9 grid-rows-9 w-full h-full border-2 border-cyan-400/80 rounded-2xl overflow-hidden bg-slate-900/80">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const isSelected = selected && selected[0] === r && selected[1] === c;
                    const isCrosshair = selected && (selected[0] === r || selected[1] === c || (Math.floor(selected[0] / 3) === Math.floor(r / 3) && Math.floor(selected[1] / 3) === Math.floor(c / 3)));
                    const isSameNumber = highlightVal > 0 && cell.value === highlightVal;

                    // Đường ngăn 9 khối 3x3: Viền dày 3-4px nổi bật
                    const borderR = (c % 3 === 2 && c !== 8) 
                      ? 'border-r-3 sm:border-r-4 border-cyan-400/90' 
                      : 'border-r border-white/10';
                    const borderB = (r % 3 === 2 && r !== 8) 
                      ? 'border-b-3 sm:border-b-4 border-cyan-400/90' 
                      : 'border-b border-white/10';

                    // Hiệu ứng màu nền ô
                    let bgStyle = 'bg-transparent';
                    if (cell.isError) {
                      bgStyle = 'bg-rose-950/85 ring-2 ring-rose-500 animate-pulse';
                    } else if (isSelected) {
                      bgStyle = 'bg-cyan-500/40 ring-3 ring-cyan-300 ring-inset shadow-inner';
                    } else if (isSameNumber) {
                      bgStyle = 'bg-cyan-500/25 ring-1.5 ring-cyan-400/70 ring-inset';
                    } else if (isCrosshair) {
                      bgStyle = 'bg-cyan-950/30';
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className={`relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150 ${borderR} ${borderB} ${bgStyle}`}
                      >
                        {cell.value > 0 ? (
                          <span
                            className={`font-black font-mono leading-none select-none ${
                              cell.isError
                                ? 'text-rose-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl'
                                : cell.isGiven
                                ? 'text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl drop-shadow-md'
                                : 'text-cyan-400 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                            }`}
                          >
                            {cell.value}
                          </span>
                        ) : cell.notes.length > 0 ? (
                          <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 sm:p-1 pointer-events-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                              <span
                                key={n}
                                className={`flex items-center justify-center text-[9px] sm:text-[11px] md:text-xs font-mono font-bold leading-none ${
                                  cell.notes.includes(n)
                                    ? highlightVal === n
                                      ? 'text-cyan-200 font-black scale-125'
                                      : 'text-cyan-400/75'
                                    : 'opacity-0'
                                }`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Màn hình tạm dừng */}
              {isPaused && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-4 z-20">
                  <Pause className="w-14 h-14 text-cyan-400 animate-pulse" />
                  <span className="text-2xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-base uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/40"
                  >
                    Tiếp Tục
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Bảng Điều Khiển Hiện Đại & Bàn Phím Số Siêu Tiện Dụng */}
        <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col justify-center gap-3 sm:gap-4 flex-shrink-0">
          
          {/* Card 1: Khối Thông Số Trận Đấu */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/95 border border-white/10 shadow-lg space-y-3">
            {/* Top row: Difficulty & Timer */}
            <div className="flex items-center justify-between">
              {/* Difficulty selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      if (difficulty !== d) setDifficulty(d);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                      difficulty === d
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
                  </button>
                ))}
              </div>

              {/* Actions: Pause & New Game */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(prev => !prev)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
                  title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                >
                  {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => startNewGame()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
                  title="Ván Mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom row: Mistakes & Timer Display */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
                <span className="text-gray-400 uppercase tracking-wider">Lỗi:</span>
                <span className={`font-mono text-base ${mistakes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {mistakes}/{maxMistakes > 0 ? maxMistakes : '∞'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 text-cyan-300 font-mono font-bold text-sm sm:text-base border border-cyan-500/30">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: 4 Nút Chức Năng (Đi Lại, Xóa, Ghi Chú, Gợi Ý) */}
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-2.5">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-sm ${
                history.length > 0
                  ? 'bg-slate-900 hover:bg-slate-800 border-white/10 text-gray-200 hover:text-white cursor-pointer active:scale-95'
                  : 'bg-slate-950/60 border-white/5 text-gray-600 cursor-not-allowed'
              }`}
              title="Đi lại 1 bước"
            >
              <Undo2 className="w-4 h-4 text-cyan-400" />
              <span>Đi Lại</span>
            </button>

            <button
              onClick={handleErase}
              className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-200 hover:text-white cursor-pointer active:scale-95 transition shadow-sm text-xs sm:text-sm font-bold"
              title="Xóa số"
            >
              <Eraser className="w-4 h-4 text-rose-400" />
              <span>Xóa</span>
            </button>

            <button
              onClick={() => setIsPencilMode(prev => !prev)}
              className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95 shadow-sm ${
                isPencilMode
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-gray-200 hover:text-white'
              }`}
              title="Bật/Tắt Ghi chú"
            >
              <Pencil className="w-4 h-4 text-cyan-400" />
              <span>Ghi Chú</span>
              {isPencilMode && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            <button
              onClick={handleHint}
              disabled={hintsLeft <= 0}
              className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-sm ${
                hintsLeft > 0
                  ? 'bg-slate-900 hover:bg-slate-800 border-white/10 text-amber-300 hover:text-amber-200 cursor-pointer active:scale-95'
                  : 'bg-slate-950/60 border-white/5 text-gray-600 cursor-not-allowed'
              }`}
              title="Gợi ý số chính xác"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Gợi Ý</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-[10px] text-slate-950 font-black">
                {hintsLeft}
              </span>
            </button>
          </div>

          {/* Card 3: Bàn Phím Số 1-9 (Dạng Numpad 3x3 trên Desktop và 1 hàng 9 nút trên Mobile) */}
          <div className="grid grid-cols-9 lg:grid-cols-3 gap-1.5 sm:gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const remaining = remainingCounts[num] || 0;
              const isCompleted = remaining === 0;

              return (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  disabled={isCompleted}
                  className={`relative flex flex-col items-center justify-center h-12 sm:h-14 lg:h-16 rounded-2xl font-mono font-black transition cursor-pointer select-none active:scale-95 shadow-md ${
                    isCompleted
                      ? 'bg-slate-950/50 border border-white/5 text-gray-600 cursor-default opacity-30'
                      : highlightVal === num
                      ? 'bg-cyan-500/35 border-2 border-cyan-400 text-cyan-200 shadow-cyan-500/30 scale-105'
                      : 'bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-white hover:border-cyan-400'
                  }`}
                >
                  <span className="text-xl sm:text-2xl lg:text-3xl leading-none">{num}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold leading-none mt-1">
                    {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : remaining}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Modal Chiến Thắng (Victory) */}
      {isWon && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(6,182,212,0.35)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-wider">XUẤT SẮC!</h3>
              <p className="text-sm text-cyan-400 font-semibold mt-1">Bạn đã hoàn thành bảng Sudoku</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Thời Gian</span>
                <span className="text-lg font-black text-white font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Số Lỗi</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{mistakes}</span>
              </div>
            </div>

            <button
              onClick={() => startNewGame()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Ván Tiếp Theo
            </button>
          </div>
        </div>
      )}

      {/* Modal Thất Bại (Game Over) */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-rose-500/50 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(244,63,94,0.35)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/50 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/30">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-wider">HẾT LƯỢT!</h3>
              <p className="text-sm text-gray-300 font-semibold mt-1">Bạn đã mắc tối đa 3 lỗi</p>
            </div>

            <button
              onClick={() => startNewGame()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-base shadow-lg shadow-rose-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Chơi Lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
