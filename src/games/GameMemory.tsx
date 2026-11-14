import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Star } from 'lucide-react';

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

  // Initialize and shuffle deck
  const initGame = useCallback(() => {
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
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (index: number) => {
    if (isChecking) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

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
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;

            // Check if all matched
            if (updated.every(c => c.isMatched)) {
              setIsWon(true);
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
            return updated;
          });
          setSelectedIndices([]);
          setIsChecking(false);
        }, 400);
      } else {
        // Not matched, flip back
        setTimeout(() => {
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

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-md mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div>
          <h2 className="text-3xl font-extrabold text-pink-400 font-['Orbitron']">MEMORY</h2>
          <p className="text-xs text-gray-400">Lật Hình Tìm Cặp</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-arcade-card border border-arcade-border px-3 py-1.5 rounded-lg text-center">
            <span className="text-[10px] text-gray-400 font-bold block">Lượt Mở</span>
            <span className="text-base font-bold text-white">{moves}</span>
          </div>
          <button
            onClick={initGame}
            className="p-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition shadow"
            title="Ván mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4x4 Grid of Cards */}
      <div className="relative bg-[#111827] p-3 rounded-2xl w-full aspect-square border-4 border-pink-500/30 shadow-2xl">
        <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className={`rounded-xl text-3xl sm:text-4xl flex items-center justify-center transition-all duration-300 transform perspective-1000 ${
                card.isMatched
                  ? 'bg-emerald-500/20 border-2 border-emerald-400/80 scale-95 opacity-80'
                  : card.isFlipped
                  ? 'bg-slate-700 border-2 border-pink-400 shadow-lg scale-100 rotate-y-180'
                  : 'bg-gradient-to-br from-indigo-700 to-purple-800 hover:from-indigo-600 hover:to-purple-700 border border-purple-500/30 active:scale-95 shadow-md'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span>{card.icon}</span>
              ) : (
                <span className="text-purple-300 text-lg opacity-60">❓</span>
              )}
            </button>
          ))}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-fade-in z-20">
            <Award className="w-14 h-14 text-yellow-300 mb-2 animate-bounce" />
            <h3 className="text-2xl font-black text-pink-400 mb-1">HOÀN THÀNH XUẤT SẮC!</h3>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < getStars() ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-300 mb-4">Bạn đã ghép thành công tất cả 8 cặp trong {moves} lượt!</p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg transition text-xs"
            >
              Chơi Lại Ván Khác
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-3">
        💡 <span className="text-gray-300">Mẹo:</span> Ghi nhớ vị trí các biểu tượng để hoàn thành với dưới 15 lượt mở để đạt 3 sao!
      </p>
    </div>
  );
};
