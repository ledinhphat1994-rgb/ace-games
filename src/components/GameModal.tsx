import React, { useRef, useState } from 'react';
import { X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import type { GameInfo } from '../types/game';
import { Game2048 } from '../games/Game2048';
import { GameSnake } from '../games/GameSnake';
import { GameFlappy } from '../games/GameFlappy';
import { GameCaro } from '../games/GameCaro';
import { GameMinesweeper } from '../games/GameMinesweeper';
import { GameMemory } from '../games/GameMemory';
import { GameTetris } from '../games/GameTetris';
import { GameChess } from '../games/GameChess';
import { GameXiangqi } from '../games/GameXiangqi';
import { GameBreakout } from '../games/GameBreakout';
import { GameSpaceShooter } from '../games/GameSpaceShooter';
import { soundManager } from '../utils/sound';

interface GameModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!game) return null;

  const toggleFullscreen = () => {
    soundManager.playButtonClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRestart = () => {
    soundManager.playButtonClick();
    setGameKey(k => k + 1);
  };

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  const renderGameContent = () => {
    switch (game.id) {
      case '2048': return <Game2048 key={gameKey} />;
      case 'snake': return <GameSnake key={gameKey} />;
      case 'flappy': return <GameFlappy key={gameKey} />;
      case 'caro': return <GameCaro key={gameKey} />;
      case 'minesweeper': return <GameMinesweeper key={gameKey} />;
      case 'memory': return <GameMemory key={gameKey} />;
      case 'tetris': return <GameTetris key={gameKey} />;
      case 'chess': return <GameChess key={gameKey} />;
      case 'xiangqi': return <GameXiangqi key={gameKey} />;
      case 'breakout': return <GameBreakout key={gameKey} />;
      case 'space-shooter': return <GameSpaceShooter key={gameKey} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <span className="text-5xl mb-3">🎮</span>
            <p className="text-base text-white">Đang tải trò chơi...</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#03060c]/95 backdrop-blur-2xl flex flex-col p-1 sm:p-2 md:p-3 overflow-hidden animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-[#080d19] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        {/* Sleek Theater Top Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-md flex-shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sm:text-3xl drop-shadow-md">{game.thumbnailIcon}</span>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-white leading-tight font-['Orbitron'] flex items-center gap-2">
                <span>{game.title}</span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-cyan-400 bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 rounded-full font-sans">
                  {game.categoryLabel}
                </span>
              </h2>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleRestart}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition flex items-center gap-1 cursor-pointer"
              title="Chơi lại ván mới"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Chơi Lại</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-xl transition cursor-pointer"
              title="Đóng game"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Immersive Game Viewport (100% Focused on Game, Zero Text Clutter) */}
        <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-1 sm:p-2 bg-gradient-to-b from-[#060913] to-[#04060a]">
          {renderGameContent()}
        </div>
      </div>
    </div>
  );
};
