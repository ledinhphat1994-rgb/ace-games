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
    <div className="flex flex-col items-center justify-center w-full h-full max-w-[min(94vw,620px)] mx-auto select-none p-1 sm:p-2">
      {/* Control bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-white/10 rounded-2xl px-4 py-2 mb-2 shadow-inner text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-black text-rose-400 font-mono text-sm sm:text-base">{statusMessage}</span>
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

      {/* Massive Xiangqi Board (9 files x 10 ranks) */}
      <div className="relative p-2 sm:p-4 bg-gradient-to-br from-amber-950 via-neutral-900 to-rose-950 border-4 border-rose-700/50 rounded-3xl shadow-[0_0_50px_rgba(225,29,72,0.25)] flex items-center justify-center">
        <div
          className="relative bg-[#dec196] border-4 border-[#78350f] rounded-2xl shadow-inner overflow-hidden"
          style={{ height: 'min(96vw * 1.11, calc(100vh - 150px), 880px)', width: 'calc(min(96vw * 1.11, calc(100vh - 150px), 880px) * 0.9)' }}
        >
          {/* River Divider */}
          <div className="absolute top-[44%] left-0 right-0 h-[12%] flex items-center justify-around text-rose-950 font-serif font-black text-sm sm:text-base tracking-[0.4em] border-y-2 border-amber-900/40 bg-amber-700/15 pointer-events-none">
            <span>楚 河</span>
            <span>漢 界</span>
          </div>

          {/* 90 intersections */}
          <div className="relative z-10 w-full h-full grid grid-cols-9 grid-rows-10 p-1.5 sm:p-2.5">
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
                    <div className={`absolute z-20 rounded-full ${piece ? 'w-10 h-10 border-4 border-emerald-500 bg-emerald-500/30' : 'w-4 h-4 bg-emerald-600 shadow-md'}`} />
                  )}

                  {/* Massive Piece token */}
                  {piece ? (
                    <div
                      className={`relative z-10 w-9 h-9 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-serif font-black text-xl sm:text-3xl md:text-4xl shadow-xl transition-transform duration-100 ${
                        isSelected ? 'scale-120 ring-4 ring-yellow-400' : isLast ? 'ring-2 ring-amber-500' : ''
                      } ${
                        sideOf(piece) === RED
                          ? 'bg-[#fff5f5] text-rose-700 border-3 border-rose-600 shadow-rose-950/40'
                          : 'bg-[#f8fafc] text-slate-950 border-3 border-slate-900 shadow-black/50'
                      }`}
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
