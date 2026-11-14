import React, { useState, useCallback, useRef } from 'react';
import { ChessPosition, type ChessMove, WHITE, BLACK, colorOf, typeOf, ROOK, KNIGHT, BISHOP, QUEEN, KING, PAWN } from './chess/chess-engine';
import { findBestChessMove } from './chess/chess-ai';
import { RotateCcw, Bot, Users, Volume2, VolumeX } from 'lucide-react';

const PIECE_SYMBOLS: Record<number, Record<number, string>> = {
  [WHITE]: {
    [KING]: '♔',
    [QUEEN]: '♕',
    [ROOK]: '♖',
    [BISHOP]: '♗',
    [KNIGHT]: '♘',
    [PAWN]: '♙',
  },
  [BLACK]: {
    [KING]: '♚',
    [QUEEN]: '♛',
    [ROOK]: '♜',
    [BISHOP]: '♝',
    [KNIGHT]: '♞',
    [PAWN]: '♟',
  },
};

export const GameChess: React.FC = () => {
  const [pos, setPos] = useState<ChessPosition>(() => ChessPosition.fromFen());
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');
  const [aiLevel, setAiLevel] = useState<1 | 2 | 3>(2);
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Lượt đi: Trắng');

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, duration: number = 0.1) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundEnabled]);

  const updateStatus = useCallback((currentPos: ChessPosition) => {
    const outcome = currentPos.outcome();
    if (outcome.over) {
      if (outcome.winner === WHITE) setStatusMessage('🏆 Chiếu bí! Quân Trắng Thắng!');
      else if (outcome.winner === BLACK) setStatusMessage('🏆 Chiếu bí! Quân Đen Thắng!');
      else setStatusMessage('🤝 Ván cờ hòa!');
    } else {
      const inCheck = currentPos.inCheck();
      const turnStr = currentPos.turn === WHITE ? 'Trắng' : 'Đen';
      setStatusMessage(inCheck ? `⚠️ ${turnStr} đang bị CHIẾU!` : `Lượt đi: ${turnStr}`);
    }
  }, []);

  const resetGame = () => {
    const newPos = ChessPosition.fromFen();
    setPos(newPos);
    setSelectedSq(null);
    setValidMoves([]);
    setLastMove(null);
    setIsThinking(false);
    updateStatus(newPos);
  };

  const handleSquareClick = (sq: number) => {
    if (isThinking) return;
    const outcome = pos.outcome();
    if (outcome.over) return;

    if (mode === 'ai' && pos.turn === BLACK) return;

    const piece = pos.board[sq];

    // If already selected, check if clicked square is a valid target move
    if (selectedSq !== null) {
      const move = validMoves.find(m => m.to === sq);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select piece of current turn's color
    if (piece && colorOf(piece) === pos.turn) {
      setSelectedSq(sq);
      const moves = pos.legalMoves().filter(m => m.from === sq);
      setValidMoves(moves);
      playTone(400, 0.04);
    } else {
      setSelectedSq(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: ChessMove) => {
    const isCapture = Boolean(pos.board[move.to]);
    const nextPos = pos.clone();
    nextPos.makeMove(move);
    setPos(nextPos);
    setLastMove(move);
    setSelectedSq(null);
    setValidMoves([]);
    updateStatus(nextPos);

    if (isCapture) playTone(250, 0.12);
    else playTone(500, 0.06);

    // AI Turn trigger
    if (mode === 'ai' && nextPos.turn === BLACK && !nextPos.outcome().over) {
      setIsThinking(true);
      setTimeout(() => {
        const levelStr = aiLevel === 1 ? 'easy' : aiLevel === 3 ? 'hard' : 'medium';
        const aiMove = findBestChessMove(nextPos, levelStr);
        if (aiMove) {
          const isAiCapture = Boolean(nextPos.board[aiMove.to]);
          const posAfterAi = nextPos.clone();
          posAfterAi.makeMove(aiMove);
          setPos(posAfterAi);
          setLastMove(aiMove);
          updateStatus(posAfterAi);
          if (isAiCapture) playTone(250, 0.12);
          else playTone(450, 0.06);
        }
        setIsThinking(false);
      }, 350);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-[min(94vw,620px)] mx-auto select-none p-1 sm:p-2">
      {/* Control bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-2 mb-2 shadow-inner text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-black text-amber-400 font-mono text-sm sm:text-base">{statusMessage}</span>
          {isThinking && (
            <span className="text-xs text-cyan-400 animate-pulse font-bold">
              (AI đang tính...)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300"
            title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
          </button>
          <button
            onClick={() => {
              setMode(prev => (prev === 'ai' ? 'pvp' : 'ai'));
              resetGame();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold text-xs border border-white/5"
          >
            {mode === 'ai' ? <Bot size={15} className="text-cyan-400" /> : <Users size={15} className="text-emerald-400" />}
            {mode === 'ai' ? 'Đấu Máy' : '2 Người'}
          </button>
          {mode === 'ai' && (
            <select
              value={aiLevel}
              onChange={e => setAiLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="bg-slate-800 border border-slate-700 text-gray-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value={1}>Dễ</option>
              <option value={2}>Vừa</option>
              <option value={3}>Khó</option>
            </select>
          )}
          <button
            onClick={resetGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white"
            title="Ván mới"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Massive Chessboard (8x8) */}
      <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 border-4 border-amber-600/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)]">
        <div 
          className="grid grid-cols-8 grid-rows-8 rounded-2xl overflow-hidden border-2 border-slate-950 shadow-inner"
          style={{ width: 'min(90vw, 560px, 70vh)', height: 'min(90vw, 560px, 70vh)' }}
        >
          {Array.from({ length: 64 }).map((_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const sq = (7 - row) * 8 + col;
            const piece = pos.board[sq];
            const isLight = (row + col) % 2 === 0;
            const isSelected = selectedSq === sq;
            const isTarget = validMoves.some(m => m.to === sq);
            const isLastFrom = lastMove?.from === sq;
            const isLastTo = lastMove?.to === sq;

            let bgColor = isLight ? '#f0d9b5' : '#b58863';
            if (isSelected) bgColor = '#facc15';
            else if (isLastFrom || isLastTo) bgColor = isLight ? '#ced887' : '#aaa23a';

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                className="relative flex items-center justify-center cursor-pointer select-none transition-colors duration-150"
                style={{ backgroundColor: bgColor }}
              >
                {/* Target move dot indicator */}
                {isTarget && (
                  <div className={`absolute z-10 rounded-full ${piece ? 'w-full h-full border-4 border-emerald-500/90 bg-emerald-500/25' : 'w-4 h-4 sm:w-6 sm:h-6 bg-emerald-600/80 shadow-md'}`} />
                )}

                {/* Massive Chess piece icon */}
                {piece && (
                  <span
                    className={`text-4xl sm:text-6xl leading-none transition-transform active:scale-90 ${colorOf(piece) === WHITE ? 'text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.95)]' : 'text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'}`}
                  >
                    {PIECE_SYMBOLS[colorOf(piece)]?.[typeOf(piece)] || ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
