import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Award, Star, Trophy } from 'lucide-react';

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = ['🚀', '🎮', '💎', '🔥', '⚡', '👑', '🎯', '🪐'];

interface GameMemoryProps {
  onOpenLeaderboard?: () => void;
}

export const GameMemory: React.FC<GameMemoryProps> = ({ onOpenLeaderboard }) => {
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
    <div className="flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden select-none p-1 sm:p-2 gap-2">
      {/* Slim HUD */}
      <div className="flex items-center justify-between w-full max-w-[min(94vw,580px)] px-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-pink-400 tracking-wider">LƯỢT MỞ:</span>
          <span className="text-base sm:text-lg font-black text-white px-2.5 py-0.5 bg-slate-800/80 rounded-lg border border-pink-500/30 font-mono">
            {moves}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (onOpenLeaderboard) onOpenLeaderboard();
              else window.dispatchEvent(new CustomEvent('acegames:open_leaderboard'));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition active:scale-95"
            title="Bảng Xếp Hạng Lật Hình"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BXH</span>
          </button>
          {!isWon && (
            <button
              onClick={initGame}
              className="flex items-center gap-1.5 px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold text-xs shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ván Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 4x4 Grid of Cards - Scaled to never exceed container */}
      <div className="relative bg-[#0d1322] p-2 sm:p-3.5 rounded-2xl w-full max-w-[min(92vw,calc(100dvh-215px),580px)] max-h-[min(92vw,calc(100dvh-215px),580px)] aspect-square border-3 sm:border-4 border-pink-500/40 shadow-2xl flex-shrink min-h-0">
        <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5 w-full h-full">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className={`rounded-xl text-3xl sm:text-5xl md:text-6xl flex items-center justify-center transition-all duration-300 transform perspective-1000 ${card.isMatched
                  ? 'bg-emerald-500/20 border-2 border-emerald-400/80 scale-95 opacity-80'
                  : card.isFlipped
                    ? 'bg-slate-700 border-2 border-pink-400 shadow-lg scale-100 rotate-y-180'
                    : 'bg-gradient-to-br from-indigo-700 to-purple-800 hover:from-indigo-600 hover:to-purple-700 border border-purple-500/30 active:scale-95 shadow-md'
                }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span>{card.icon}</span>
              ) : (
                <span className="text-purple-300 text-xl sm:text-2xl opacity-60">❓</span>
              )}
            </button>
          ))}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white p-6 animate-fade-in z-20">
            <Award className="w-20 h-20 text-yellow-300 mb-3 animate-bounce" />
            <h3 className="text-3xl font-black text-pink-400 mb-2">CHIẾN THẮNG!</h3>
            <div className="flex gap-2 mb-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${i < getStars() ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                    }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-300 mb-6">Bạn hoàn thành với {moves} lượt mở!</p>
            <button
              onClick={initGame}
              className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl shadow-xl transition active:scale-95"
            >
              CHƠI LẠI
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
