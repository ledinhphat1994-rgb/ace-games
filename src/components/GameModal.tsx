import React, { useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Info, Keyboard, Smartphone } from 'lucide-react';
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
import { AdBanner } from './AdBanner';

interface GameModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  const renderGameContent = () => {
    switch (game.id) {
      case '2048': return <Game2048 />;
      case 'snake': return <GameSnake />;
      case 'flappy': return <GameFlappy />;
      case 'caro': return <GameCaro />;
      case 'minesweeper': return <GameMinesweeper />;
      case 'memory': return <GameMemory />;
      case 'tetris': return <GameTetris />;
      case 'chess': return <GameChess />;
      case 'xiangqi': return <GameXiangqi />;
      case 'breakout': return <GameBreakout />;
      case 'space-shooter': return <GameSpaceShooter />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
            <span className="text-4xl mb-2">🚧</span>
            <p>Trò chơi đang được cập nhật thêm!</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl bg-arcade-card border border-arcade-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-arcade-border/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{game.thumbnailIcon}</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{game.title}</h2>
              <span className="text-[11px] text-indigo-400 font-semibold">{game.categoryLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white bg-arcade-hover hover:bg-slate-700/80 rounded-xl transition"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-rose-400 bg-arcade-hover hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Đóng game"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Canvas Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex flex-col items-center justify-start bg-slate-950/60">
          {renderGameContent()}

          {/* Ad Banner inside modal */}
          <div className="w-full max-w-lg mt-4">
            <AdBanner format="banner" />
          </div>

          {/* Game Instructions Accordion */}
          <div className="w-full max-w-xl bg-slate-900/80 border border-arcade-border/60 rounded-2xl p-4 sm:p-5 mt-4 text-xs">
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-200 mb-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Hướng Dẫn Chơi & Điều Khiển</span>
            </div>

            <ul className="list-disc list-inside space-y-1 text-gray-300 mb-4 pl-1">
              {game.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-arcade-border/50 text-[11px]">
              <div className="flex items-start gap-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                <Keyboard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-300 block mb-0.5">Trên Máy Tính (PC):</span>
                  <span className="text-gray-400">{game.controls.desktop}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                <Smartphone className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-300 block mb-0.5">Trên Điện Thoại / iPad:</span>
                  <span className="text-gray-400">{game.controls.mobile}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
