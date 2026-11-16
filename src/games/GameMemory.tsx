import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Star } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = ['🚀', '🎮', '💎', '🔥', '⚡', '👑', '🎯', '🪐'];

export const GameMemory: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGameTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize and shuffle deck
  const initGame = useCallback(() => {
    clearGameTimeout();
    const deck: Card[] = [];
    const pairs = [...EMOJI_PAIRS, ...EMOJI_PAIRS];
    // Fisher-Yates shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    pairs.forEach((icon, idx) => {
      deck.push({
        id: idx,
        icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(deck);
    setSelectedIndices([]);
    setMoves(0);
    setIsWon(false);
    setIsChecking(false);
  }, [clearGameTimeout]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    return () => {
      clearGameTimeout();
    };
  }, [clearGameTimeout]);

  const handleCardClick = (index: number) => {
    if (isChecking) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    soundManager.playCardFlip();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      setIsChecking(true);

      const [idx1, idx2] = newSelected;
      if (cards[idx1].icon === cards[idx2].icon) {
        // Matched!
        soundManager.playCardMatch();
        clearGameTimeout();
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          setCards(prev => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;

            // Check if all matched
            if (updated.every(c => c.isMatched)) {
              setIsWon(true);
              soundManager.playVictory();
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              try {
                const best = parseInt(localStorage.getItem('acegames_memory_best') || '999', 10);
                if (moves + 1 < best) {
                  localStorage.setItem('acegames_memory_best', (moves + 1).toString());
                }
              } catch {}
            }
            return updated;
          });
          setSelectedIndices([]);
          setIsChecking(false);
        }, 400);
      } else {
        // Not matched, flip back
        clearGameTimeout();
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          setCards(prev => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setSelectedIndices([]);
          setIsChecking(false);
        }, 900);
      }
    }
  };

  const getStars = () => {
    if (moves <= 14) return 3;
    if (moves <= 20) return 2;
    return 1;
  };

  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  return (
    <div className="game-arena-wrapper flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2">
      {/* Top HUD - Khớp chuẩn độ rộng 1320px như màn hình mặc định */}
      <div className="game-top-hud relative flex items-center justify-between w-full max-w-[min(96vw,1320px)] mb-2 px-3 sm:px-5 bg-slate-900/90 border border-white/10 rounded-2xl py-2 min-h-[52px] shadow-inner flex-shrink-0">
        {/* Khối Trái: Chế độ chơi game & Đánh giá sao */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold text-xs shadow-sm">
            <span>🧠</span>
            <span>Thử Thách Trí Nhớ</span>
          </div>

          <div className="hidden sm:flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < getStars() ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
              />
            ))}
          </div>
        </div>

        {/* Khối Giữa: Căn chính giữa tuyệt đối - Lượt mở & Cặp đã tìm */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-4 sm:gap-6 z-0 pointer-events-none">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center h-3 leading-none text-center">
              Lượt Mở
            </span>
            <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono leading-none mt-1 text-center">
              {moves}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center h-3 leading-none text-center">
              Cặp Đã Tìm
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono leading-none mt-1 text-center">
              {matchedCount} / 8
            </span>
          </div>
        </div>

        {/* Khối Phải: Tùy chỉnh, thiết lập của game (Ván mới) */}
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={initGame}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white rounded-xl font-bold text-xs border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
            title="Ván Mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ván Mới</span>
          </button>
        </div>
      </div>

      {/* Massive 16:9 Widescreen Theater Arena - Vùng 1 CHỈ hiển thị game to rõ, không để thẻ người và máy */}
      <div className="game-arena-box relative w-full max-w-[min(96vw,1320px)] aspect-[16/9] max-h-[calc(100dvh-235px)] bg-gradient-to-br from-[#1c0822] via-[#100414] to-[#050107] rounded-3xl border-4 border-pink-500/40 shadow-[0_0_50px_rgba(236,72,153,0.3)] overflow-hidden flex items-center justify-center p-3 sm:p-5 md:p-6 flex-shrink min-h-0">
        
        {/* Center: Massive 4x4 Grid of Cards taking full vertical height to rõ ở Vùng 1 */}
        <div className="game-board-inner relative bg-[#09030d] p-2.5 sm:p-4 rounded-3xl h-full aspect-square max-h-[calc(100dvh-260px)] border-4 border-pink-500/50 shadow-2xl flex items-center justify-center">
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3.5 w-full h-full">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.isFlipped || card.isMatched || isChecking}
                className={`rounded-2xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl flex items-center justify-center transition-all duration-300 transform select-none cursor-pointer ${
                  card.isMatched
                    ? 'bg-emerald-500/25 border-3 border-emerald-400/90 scale-95 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                    : card.isFlipped
                    ? 'bg-slate-800 border-3 border-pink-400 shadow-xl scale-100 rotate-y-180'
                    : 'bg-gradient-to-br from-indigo-700 to-purple-900 hover:from-indigo-600 hover:to-purple-800 border-2 border-purple-500/40 active:scale-95 shadow-lg'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <span>{card.icon}</span>
                ) : (
                  <span className="text-purple-300 text-2xl sm:text-3xl opacity-70">❓</span>
                )}
              </button>
            ))}
          </div>

          {/* Victory Overlay */}
          {isWon && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white p-6 animate-fade-in z-20">
              <Award className="w-20 h-20 text-yellow-300 mb-3 animate-bounce" />
              <h3 className="text-3xl font-black text-pink-400 mb-2 ">CHIẾN THẮNG!</h3>
              <div className="flex gap-2 mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-8 h-8 ${i < getStars() ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-300 mb-6">Bạn hoàn thành với {moves} lượt mở!</p>
              <button
                onClick={initGame}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl shadow-xl transition active:scale-95 cursor-pointer text-sm"
              >
                CHƠI LẠI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

