import React, { useRef, useState, useEffect } from 'react';
import { X, Maximize2, Volume2, VolumeX, Trophy, HelpCircle } from 'lucide-react';
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
import { LeaderboardModal } from './LeaderboardModal';
import { GameGuideModal } from './GameGuideModal';

interface GameModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  // 'vung2': Default in-place theater inside VÙNG 2 (central content area)
  // 'fullscreen': True 100vw x 100vh full screen for all monitors (PC 1920x1080) & mobile
  const [viewMode, setViewMode] = useState<'vung2' | 'fullscreen'>('vung2');
  const [soundOn, setSoundOn] = useState(() => soundManager.isSoundOn());
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync sound state across components
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundOn(soundManager.isSoundOn());
    });
    return unsubscribe;
  }, []);

  // Listen for leaderboard open events dispatched by in-game HUDs
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      soundManager.playButtonClick();
      setIsLeaderboardOpen(true);
    };
    window.addEventListener('acegames:open_leaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('acegames:open_leaderboard', handleOpenLeaderboard);
  }, []);

  if (!game) return null;

  const handleOpenGuide = () => {
    soundManager.playButtonClick();
    setIsGuideOpen(true);
  };

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundOn(next);
  };

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

  const handleOpenLeaderboard = () => {
    soundManager.playButtonClick();
    setIsLeaderboardOpen(true);
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
          ? 'relative w-full h-full bg-[#070b14] rounded-2xl sm:rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.85)]'
          : 'fixed inset-0 z-50 w-screen h-screen bg-[#03060c] p-0 rounded-none border-0 is-game-fullscreen'
      }`}
    >
      {/* Sleek Header Bar - CHỈ HIỂN THỊ Ở VÙNG 2 (ẨN HOÀN TOÀN KHI FULL MÀN HÌNH THEO YÊU CẦU) */}
      {viewMode === 'vung2' && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 border-b border-white/10 flex-shrink-0 z-20 bg-slate-950/90 backdrop-blur-md">
          {/* Game Title: Animated, Sinh động, Thẩm mỹ cao */}
          <div 
            className="flex items-center gap-2.5 group cursor-default"
            title={`${game.title}: ${game.subtitle || game.description}`}
          >
            <span className="text-xl sm:text-2xl drop-shadow-md transform transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
              {game.thumbnailIcon}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black tracking-wider font-['Orbitron'] bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                  {game.title}
                </h2>
              </div>
              <div className="w-12 group-hover:w-full h-0.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400 transition-all duration-500 rounded-full mt-0.5 opacity-80" />
            </div>
          </div>

          {/* VÙNG 6: Cụm Icon Điều Khiển (VÙNG 5 ÂM THANH ĐƯỢC ĐƯA LÊN ĐÂY + HƯỚNG DẪN + BẢNG XẾP HẠNG + FULLSCREEN + ĐÓNG) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Nút Hướng Dẫn Chơi */}
            <button
              onClick={handleOpenGuide}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition cursor-pointer shadow-md active:scale-95"
              title="Hướng Dẫn Chơi & Phím Điều Khiển"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </button>

            {/* Nút Bảng Xếp Hạng */}
            <button
              onClick={handleOpenLeaderboard}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/50 transition cursor-pointer shadow-md active:scale-95"
              title="Bảng Xếp Hạng Cao Thủ"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </button>

            {/* VÙNG 5 ĐƯA LÊN VÙNG 6: Nút Bật/Tắt Âm Thanh */}
            <button
              onClick={handleToggleSound}
              className={`p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
                soundOn
                  ? 'text-cyan-400 border-slate-700/80 hover:border-cyan-500/50'
                  : 'text-gray-500 border-slate-700/80'
              }`}
              title={soundOn ? 'Tắt âm thanh game' : 'Bật âm thanh game'}
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              )}
            </button>

            {/* Nút Toàn Màn Hình */}
            <button
              onClick={toggleViewMode}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition cursor-pointer shadow-md active:scale-95"
              title="Toàn Màn Hình"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Nút Đóng Trò Chơi */}
            <button
              onClick={handleClose}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/50 transition cursor-pointer shadow-md active:scale-95"
              title="Đóng Trò Chơi"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}


      {/* Big Immersive Game Viewport (100% Focused on Game, Zero Text Clutter) */}
      <div className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center ${
        viewMode === 'vung2'
          ? 'p-1.5 sm:p-3 bg-gradient-to-b from-[#060913] to-[#04060a]'
          : 'p-0 bg-black'
      }`}>
        {renderGameContent()}
      </div>

      {/* Bảng Xếp Hạng Modal Popup */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameId={game.id}
        gameTitle={game.title}
      />

      {/* Hướng Dẫn Chơi Modal Popup */}
      <GameGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        game={game}
      />
    </div>
  );
};
