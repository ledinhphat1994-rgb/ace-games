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
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy');
  const [board, setBoard] = useState<SudokuCell[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isPencilMode, setIsPencilMode] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [maxMistakes] = useState<number>(3);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  
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
      ...prev.slice(-20), // Keep up to 20 states
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

  // Handle cell click
  const handleCellClick = (r: number, c: number) => {
    if (isWon || isGameOver) return;
    soundManager.playButtonClick();
    setSelected([r, c]);
  };

  // Handle number input (1-9)
  const handleNumberInput = (num: number) => {
    if (!selected || isWon || isGameOver) return;
    const [r, c] = selected;
    const cell = board[r][c];

    // Cannot overwrite given clues
    if (cell.isGiven) return;

    pushHistory();
    const newBoard = cloneBoard(board);
    const target = newBoard[r][c];

    if (isPencilMode) {
      // Toggle note
      soundManager.playButtonClick();
      if (target.notes.includes(num)) {
        target.notes = target.notes.filter(n => n !== num);
      } else {
        target.notes = [...target.notes, num].sort((a, b) => a - b);
      }
      setBoard(newBoard);
      return;
    }

    // Normal placement
    if (target.value === num) {
      // Clear if tapping same number
      target.value = 0;
      target.isError = false;
      setBoard(newBoard);
      return;
    }

    target.value = num;
    target.notes = []; // Clear notes when placing number

    // Check correctness
    if (num === target.solution) {
      soundManager.playChessMove();
      target.isError = false;

      // Remove this number from notes in same row, column, and 3x3 block
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

      // Check for win
      if (isBoardSolved(newBoard)) {
        setIsWon(true);
        soundManager.playVictory();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Wrong number!
      soundManager.playDefeat();
      target.isError = true;
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setBoard(newBoard);

      if (nextMistakes >= maxMistakes) {
        setIsGameOver(true);
      }
    }
  };

  // Erase active cell
  const handleErase = () => {
    if (!selected || isWon || isGameOver) return;
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

  // Hint button: Fills current cell or first empty cell with correct number
  const handleHint = () => {
    if (hintsLeft <= 0 || isWon || isGameOver) return;

    let targetR = -1;
    let targetC = -1;

    if (selected) {
      const [r, c] = selected;
      if (!board[r][c].isGiven && board[r][c].value !== board[r][c].solution) {
        targetR = r;
        targetC = c;
      }
    }

    // Find any empty or wrong cell if not selected
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

    // Remove from notes in neighborhood
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
    setHintsLeft(prev => prev - 1);

    if (isBoardSolved(newBoard)) {
      setIsWon(true);
      soundManager.playVictory();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon || isGameOver || isPaused) return;

      // Numbers 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
        return;
      }

      // Erase
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleErase();
        return;
      }

      // Notes mode
      if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPencilMode(prev => !prev);
        soundManager.playButtonClick();
        return;
      }

      // Hint
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleHint();
        return;
      }

      // Undo
      if (e.key.toLowerCase() === 'u' || (e.ctrlKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Arrow navigation
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
        soundManager.playButtonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, board, isWon, isGameOver, isPaused, isPencilMode, hintsLeft]);

  // Derived state for highlights
  const selectedValue = selected ? board[selected[0]]?.[selected[1]]?.value : 0;
  const remainingCounts = board.length > 0 ? getRemainingCounts(board) : {};

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden bg-[#070b14]">
      {/* Top HUD: Độ khó, Đồng hồ, Lỗi, Thao tác */}
      <div className="game-top-hud flex items-center justify-between w-full max-w-[min(96vw,820px)] px-3 sm:px-5 py-2 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg flex-shrink-0 mb-2">
        {/* Left: Độ khó & Lỗi */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Difficulty selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  if (difficulty !== d) {
                    setDifficulty(d);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  difficulty === d
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Mistakes badge */}
          <div className="flex items-center gap-1.5 text-xs font-black">
            <span className="text-gray-400 uppercase tracking-wider">Lỗi:</span>
            <span className={`font-mono ${mistakes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mistakes}/{maxMistakes}
            </span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm sm:text-base">
          <Timer className="w-4 h-4 text-cyan-400" />
          <span>{formatTime(elapsedTime)}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => startNewGame()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-white/10 transition cursor-pointer active:scale-95"
            title="Ván Mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Arena: Sudoku 9x9 Board */}
      <div className="relative flex-1 w-full max-w-[min(96vw,820px)] flex items-center justify-center min-h-0 py-1">
        {board.length > 0 && (
          <div className="relative aspect-square w-full max-w-[min(88vw,calc(100vh-290px),520px)] bg-slate-950 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col justify-between">
            {/* 9x9 Grid */}
            <div className="grid grid-cols-9 grid-rows-9 w-full h-full border border-cyan-500/40 rounded-xl overflow-hidden bg-slate-900/60">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isSelected = selected && selected[0] === r && selected[1] === c;
                  const isCrosshair = selected && (selected[0] === r || selected[1] === c || (Math.floor(selected[0] / 3) === Math.floor(r / 3) && Math.floor(selected[1] / 3) === Math.floor(c / 3)));
                  const isSameValue = selectedValue > 0 && cell.value === selectedValue;
                  
                  // Block borders (thick border every 3 cells)
                  const borderRight = (c % 3 === 2 && c !== 8) ? 'border-r-2 sm:border-r-3 border-cyan-400/80' : 'border-r border-white/10';
                  const borderBottom = (r % 3 === 2 && r !== 8) ? 'border-b-2 sm:border-b-3 border-cyan-400/80' : 'border-b border-white/10';

                  // Styling background
                  let bgStyle = 'bg-transparent';
                  if (cell.isError) {
                    bgStyle = 'bg-rose-950/80 animate-pulse';
                  } else if (isSelected) {
                    bgStyle = 'bg-cyan-500/40 ring-2 ring-cyan-300 ring-inset shadow-inner';
                  } else if (isSameValue) {
                    bgStyle = 'bg-cyan-500/25 ring-1 ring-cyan-400/50 ring-inset';
                  } else if (isCrosshair) {
                    bgStyle = 'bg-cyan-950/25';
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150 ${borderRight} ${borderBottom} ${bgStyle}`}
                    >
                      {cell.value > 0 ? (
                        <span
                          className={`font-black font-mono leading-none ${
                            cell.isError
                              ? 'text-rose-400 text-lg sm:text-2xl'
                              : cell.isGiven
                              ? 'text-white text-lg sm:text-2xl drop-shadow-md'
                              : 'text-cyan-400 text-lg sm:text-2xl font-black'
                          }`}
                        >
                          {cell.value}
                        </span>
                      ) : cell.notes.length > 0 ? (
                        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <span
                              key={n}
                              className={`flex items-center justify-center text-[8px] sm:text-[10px] font-mono font-bold leading-none ${
                                cell.notes.includes(n)
                                  ? isSameValue && selectedValue === n
                                    ? 'text-cyan-200 font-black scale-125'
                                    : 'text-cyan-400/70'
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

            {/* Paused Overlay */}
            {isPaused && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
                <Pause className="w-12 h-12 text-cyan-400 animate-pulse" />
                <span className="text-xl font-black text-white uppercase tracking-wider">ĐANG TẠM DỪNG</span>
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/30"
                >
                  Tiếp Tục
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls & Keypad */}
      <div className="w-full max-w-[min(96vw,820px)] flex flex-col items-center gap-2 flex-shrink-0">
        {/* Action Toolbar: Undo, Erase, Notes, Hint */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-[min(92vw,500px)]">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-bold transition ${
              history.length > 0
                ? 'bg-slate-900 hover:bg-slate-800 border-white/10 text-gray-200 hover:text-white cursor-pointer active:scale-95'
                : 'bg-slate-950/60 border-white/5 text-gray-600 cursor-not-allowed'
            }`}
            title="Đi lại 1 bước"
          >
            <Undo2 className="w-4 h-4 mb-0.5 text-cyan-400" />
            <span>Đi Lại</span>
          </button>

          <button
            onClick={handleErase}
            className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-200 hover:text-white cursor-pointer active:scale-95 transition"
            title="Xóa số"
          >
            <Eraser className="w-4 h-4 mb-0.5 text-rose-400" />
            <span>Xóa</span>
          </button>

          <button
            onClick={() => setIsPencilMode(prev => !prev)}
            className={`flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
              isPencilMode
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-gray-200 hover:text-white'
            }`}
            title="Bật/Tắt Ghi chú"
          >
            <div className="relative">
              <Pencil className="w-4 h-4 mb-0.5 text-cyan-400" />
              {isPencilMode && (
                <span className="absolute -top-1 -right-2 px-1 rounded-full bg-cyan-400 text-[8px] text-slate-950 font-black">
                  BẬT
                </span>
              )}
            </div>
            <span>Ghi Chú</span>
          </button>

          <button
            onClick={handleHint}
            disabled={hintsLeft <= 0}
            className={`flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-bold transition ${
              hintsLeft > 0
                ? 'bg-slate-900 hover:bg-slate-800 border-white/10 text-amber-300 hover:text-amber-200 cursor-pointer active:scale-95'
                : 'bg-slate-950/60 border-white/5 text-gray-600 cursor-not-allowed'
            }`}
            title="Gợi ý số chính xác"
          >
            <div className="relative">
              <Lightbulb className="w-4 h-4 mb-0.5 text-amber-400" />
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-400 text-[9px] text-slate-950 font-black flex items-center justify-center">
                {hintsLeft}
              </span>
            </div>
            <span>Gợi Ý</span>
          </button>
        </div>

        {/* 1-9 Number Keypad */}
        <div className="grid grid-cols-9 gap-1 sm:gap-2 w-full max-w-[min(94vw,520px)]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const remaining = remainingCounts[num] || 0;
            const isCompleted = remaining === 0;

            return (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                disabled={isCompleted}
                className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl font-mono font-black transition cursor-pointer select-none active:scale-90 ${
                  isCompleted
                    ? 'bg-slate-950/50 border border-white/5 text-gray-600 cursor-default opacity-40'
                    : selectedValue === num
                    ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/25 scale-105'
                    : 'bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-white hover:border-cyan-400'
                }`}
              >
                <span className="text-lg sm:text-2xl leading-none">{num}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold leading-none mt-1">
                  {isCompleted ? <Check className="w-3 h-3 text-emerald-400 inline" /> : remaining}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Victory Modal */}
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Ván Tiếp Theo
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-base shadow-lg shadow-rose-500/40 transition cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Chơi Lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
