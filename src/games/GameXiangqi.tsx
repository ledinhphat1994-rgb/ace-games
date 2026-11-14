import React, { useState, useCallback, useRef } from 'react';
import { XiangqiPosition, type XiangqiMove, RED, BLACK, GENERAL, ADVISOR, ELEPHANT, HORSE, CHARIOT, CANNON, SOLDIER, typeOf, sideOf } from './xiangqi/xiangqi-engine';
import { findBestXiangqiMove } from './xiangqi/xiangqi-ai';
import { RotateCcw, Bot, Users, Volume2, VolumeX } from 'lucide-react';

const XIANGQI_PIECES: Record<number, Record<number, string>> = {
  [RED]: {
    [GENERAL]: '帥',
    [ADVISOR]: '仕',
    [ELEPHANT]: '相',
    [HORSE]: '傌',
    [CHARIOT]: '俥',
    [CANNON]: '炮',
    [SOLDIER]: '兵',
  },
  [BLACK]: {
    [GENERAL]: '將',
    [ADVISOR]: '士',
    [ELEPHANT]: '象',
    [HORSE]: '馬',
    [CHARIOT]: '車',
    [CANNON]: '砲',
    [SOLDIER]: '卒',
  },
};

export const GameXiangqi: React.FC = () => {
  const [pos, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen());
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<XiangqiMove[]>([]);
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null);
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');
  const [aiLevel, setAiLevel] = useState<1 | 2 | 3>(2);
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>('Lượt đi: Đỏ (Đi trước)');

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

  const updateStatus = useCallback((currentPos: XiangqiPosition) => {
    const outcome = currentPos.outcome();
    if (outcome.over) {
      if (outcome.winner === RED) setStatusMessage('🏆 Chiếu bí! Cờ Đỏ Thắng!');
      else if (outcome.winner === BLACK) setStatusMessage('🏆 Chiếu bí! Cờ Đen Thắng!');
      else setStatusMessage('🤝 Ván cờ hòa!');
    } else {
      const inCheck = currentPos.inCheck();
      const turnStr = currentPos.turn === RED ? 'Đỏ' : 'Đen';
      setStatusMessage(inCheck ? `⚠️ ${turnStr} đang bị CHIẾU TƯỚNG!` : `Lượt đi: ${turnStr}`);
    }
  }, []);

  const resetGame = () => {
    const newPos = XiangqiPosition.fromFen();
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

    // If a piece is already selected, try to execute move to clicked square
    if (selectedSq !== null) {
      const move = validMoves.find(m => m.to === sq);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Select piece of current turn
    if (piece && sideOf(piece) === pos.turn) {
      setSelectedSq(sq);
      const moves = pos.legalMoves().filter(m => m.from === sq);
      setValidMoves(moves);
      playTone(420, 0.04);
    } else {
      setSelectedSq(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: XiangqiMove) => {
    const isCapture = Boolean(pos.board[move.to]);
    const nextPos = pos.clone();
    nextPos.makeMove(move);
    setPos(nextPos);
    setLastMove(move);
    setSelectedSq(null);
    setValidMoves([]);
    updateStatus(nextPos);

    if (isCapture) playTone(240, 0.12);
    else playTone(520, 0.06);

    // AI Turn trigger
    if (mode === 'ai' && nextPos.turn === BLACK && !nextPos.outcome().over) {
      setIsThinking(true);
      setTimeout(() => {
        const levelStr = aiLevel === 1 ? 'easy' : aiLevel === 3 ? 'hard' : 'medium';
        const aiMove = findBestXiangqiMove(nextPos, levelStr);
        if (aiMove) {
          const isAiCapture = Boolean(nextPos.board[aiMove.to]);
          const posAfterAi = nextPos.clone();
          posAfterAi.makeMove(aiMove);
          setPos(posAfterAi);
          setLastMove(aiMove);
          updateStatus(posAfterAi);
          if (isAiCapture) playTone(240, 0.12);
          else playTone(460, 0.06);
        }
        setIsThinking(false);
      }, 400);
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-lg mx-auto py-2">
      {/* Control bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 mb-3 shadow-inner text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-amber-400 font-mono">{statusMessage}</span>
          {isThinking && (
            <span className="text-[11px] text-cyan-400 animate-pulse font-semibold">
              (AI đang tính...)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300"
            title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
          </button>
          <button
            onClick={() => {
              setMode(prev => (prev === 'ai' ? 'pvp' : 'ai'));
              resetGame();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold text-xs"
          >
            {mode === 'ai' ? <Bot size={14} className="text-cyan-400" /> : <Users size={14} className="text-emerald-400" />}
            {mode === 'ai' ? 'Đấu Máy' : '2 Người'}
          </button>
          {mode === 'ai' && (
            <select
              value={aiLevel}
              onChange={e => setAiLevel(Number(e.target.value) as 1 | 2 | 3)}
              className="bg-slate-800 border border-slate-700 text-gray-200 text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value={1}>Dễ</option>
              <option value={2}>Vừa</option>
              <option value={3}>Khó</option>
            </select>
          )}
          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300"
            title="Ván mới"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Xiangqi Board (9 files x 10 ranks) */}
      <div className="relative p-2.5 bg-amber-950/70 border-2 border-amber-600/50 rounded-2xl shadow-2xl">
        <div
          className="relative bg-[#deb887] border-2 border-[#8b4513] rounded-lg shadow-inner overflow-hidden"
          style={{ width: 'min(90vw, 360px)', height: 'calc(min(90vw, 360px) * 1.11)' }}
        >
          {/* Grid lines background */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
            {/* River Divider */}
            <div className="absolute top-[45%] left-0 right-0 h-[10%] flex items-center justify-around text-amber-900 font-serif font-black text-xs tracking-widest border-y border-amber-900/40 bg-amber-600/10">
              <span>楚 河</span>
              <span>漢 界</span>
            </div>
          </div>

          {/* 90 intersections */}
          <div className="relative z-10 w-full h-full grid grid-cols-9 grid-rows-10 p-2 sm:p-2.5">
            {Array.from({ length: 90 }).map((_, idx) => {
              const r = 9 - Math.floor(idx / 9);
              const f = idx % 9;
              const sq = r * 9 + f;
              const piece = pos.board[sq];
              const isSelected = selectedSq === sq;
              const isTarget = validMoves.some(m => m.to === sq);
              const isLast = lastMove?.from === sq || lastMove?.to === sq;

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className="relative flex items-center justify-center cursor-pointer select-none"
                >
                  {/* Target move indicator */}
                  {isTarget && (
                    <div className={`absolute z-20 rounded-full ${piece ? 'w-8 h-8 border-2 border-emerald-600 bg-emerald-500/30' : 'w-3 h-3 bg-emerald-600 shadow'}`} />
                  )}

                  {/* Piece token */}
                  {piece ? (
                    <div
                      className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-serif font-bold text-base sm:text-lg shadow-md transition-transform duration-100 ${isSelected ? 'scale-115 ring-2 ring-yellow-400 ring-offset-1' : isLast ? 'ring-1 ring-amber-500' : ''} ${sideOf(piece) === RED ? 'bg-[#fdfbf7] text-rose-700 border-2 border-rose-700 shadow-rose-900/30' : 'bg-[#fdfbf7] text-slate-900 border-2 border-slate-900 shadow-black/40'}`}
                    >
                      {XIANGQI_PIECES[sideOf(piece)]?.[typeOf(piece)] || ''}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
