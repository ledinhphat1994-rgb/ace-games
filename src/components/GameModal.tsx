import React, { useRef, useState, useEffect } from 'react';
import { X, Maximize2 } from 'lucide-react';
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
  // 'vung2': Default in-place theater inside VÙNG 2 (central content area)
  // 'fullscreen': True 100vw x 100vh full screen for all monitors (PC 1920x1080) & mobile
  const [viewMode, setViewMode] = useState<'vung2' | 'fullscreen'>('vung2');
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!game) return null;

  const toggleViewMode = () => {
    soundManager.playButtonClick();
    if (viewMode === 'vung2') {
      setViewMode('fullscreen');
      window.history.pushState({ inGameFullscreen: true }, '');
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {});
      }
    } else {
      setViewMode('vung2');
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  // Sync state if user presses ESC to exit browser fullscreen or back button on mobile
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && viewMode === 'fullscreen') {
        setViewMode('vung2');
      }
    };

    const handlePopState = () => {
      if (viewMode === 'fullscreen') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setViewMode('vung2');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'fullscreen') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        setViewMode('vung2');
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode]);

  const handleClose = () => {
    soundManager.playButtonClick();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const renderGameContent = () => {
    switch (game.id) {
      case '2048': return <Game2048 key={game.id} />;
      case 'snake': return <GameSnake key={game.id} />;
      case 'flappy': return <GameFlappy key={game.id} />;
      case 'caro': return <GameCaro key={game.id} />;
      case 'minesweeper': return <GameMinesweeper key={game.id} />;
      case 'memory': return <GameMemory key={game.id} />;
      case 'tetris': return <GameTetris key={game.id} />;
      case 'chess': return <GameChess key={game.id} />;
      case 'xiangqi': return <GameXiangqi key={game.id} />;
      case 'breakout': return <GameBreakout key={game.id} />;
      case 'space-shooter': return <GameSpaceShooter key={game.id} />;
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
    <div
      ref={containerRef}
      className={`transition-all duration-300 overflow-hidden flex flex-col ${
        viewMode === 'vung2'
          ? 'relative w-full h-[76vh] min-h-[580px] max-h-[820px] bg-[#070b14] rounded-2xl sm:rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.85)] mb-8'
          : 'fixed inset-0 z-50 w-screen h-screen bg-[#03060c] p-0 rounded-none border-0'
      }`}
    >
      {/* Sleek Header Bar - Shown ONLY in VÙNG 2. In Fullscreen, completely removed (exited by ESC on PC or Back on mobile) */}
      {viewMode === 'vung2' && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl drop-shadow-md">{game.thumbnailIcon}</span>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight font-['Orbitron'] flex items-center gap-2">
                <span>{game.title}</span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-cyan-400 bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-full font-sans">
                  {game.categoryLabel}
                </span>
              </h2>
            </div>
          </div>

          {/* Action controls in Vùng 2 */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20 active:scale-95"
              title="Phóng to toàn màn hình 100%"
            >
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span className="font-black">Toàn Màn Hình</span>
            </button>

            <button
              onClick={handleClose}
              className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 rounded-xl transition cursor-pointer active:scale-95"
              title="Đóng game và quay lại danh sách"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Đóng</span>
            </button>
          </div>
        </div>
      )}

      {/* Big Immersive Game Viewport (100% Focused on Game, Zero Text Clutter) */}
      <div className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center ${
        viewMode === 'vung2'
          ? 'p-2 sm:p-4 bg-gradient-to-b from-[#060913] to-[#04060a]'
          : 'p-0 bg-black'
      }`}>
        {renderGameContent()}
      </div>
    </div>
  );
};
