import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Maximize2, Volume2, VolumeX, Trophy, HelpCircle, Settings } from 'lucide-react';
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
import { GameOnet } from '../games/GameOnet';
import { GameSudoku } from '../games/GameSudoku';
import { GamePong } from '../games/GamePong';
import { GamePacman } from '../games/GamePacman';
import { GameJewels } from '../games/GameJewels';
import { GameBubbleShooter } from '../games/GameBubbleShooter';
import { GameGoldMiner } from '../games/GameGoldMiner';
import { GameTank1990 } from '../games/GameTank1990';
import { GameBomberman } from '../games/GameBomberman';
import { GameGalaga } from '../games/GameGalaga';
import { GameRoadFighter } from '../games/GameRoadFighter';
import { GameZuma } from '../games/GameZuma';
import { GameContra } from '../games/GameContra';
import { GameMario } from '../games/GameMario';
import { soundManager } from '../utils/sound';
import { LeaderboardModal } from './LeaderboardModal';
import { GameGuideModal } from './GameGuideModal';
import { GameSettingsModal } from './GameSettingsModal';

interface GameModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  // Mặc định Full Màn Hình Viewport 100vw x 100vh để trải nghiệm game to và rõ nhất
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundManager.isSoundOn());
  const [musicOn, setMusicOn] = useState(() => soundManager.isMusicOn());
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGameSettingsOpen, setIsGameSettingsOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync sound state across components
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundOn(soundManager.isSoundOn());
      setMusicOn(soundManager.isMusicOn());
    });
    return unsubscribe;
  }, []);

  // Set active game in soundManager so all in-game sound & music are isolated to this game!
  useEffect(() => {
    if (game) {
      soundManager.setActiveGame(game.id);
    }
    return () => {
      soundManager.setActiveGame(null);
    };
  }, [game]);

  // Listen for leaderboard open events dispatched by in-game HUDs
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      soundManager.playButtonClick();
      setIsLeaderboardOpen(true);
    };
    window.addEventListener('acegames:open_leaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('acegames:open_leaderboard', handleOpenLeaderboard);
  }, []);

  const handleOpenGuide = () => {
    soundManager.playButtonClick();
    setIsGuideOpen(true);
  };

  // Quick Mute / Unmute 1 chạm cho ván game - Không trùng lặp với menu Cài Đặt
  const handleQuickMute = () => {
    if (!game) return;
    if (soundOn || musicOn) {
      soundManager.saveGameAudioSettings(game.id, { soundEnabled: false, musicEnabled: false });
      setSoundOn(false);
      setMusicOn(false);
    } else {
      soundManager.saveGameAudioSettings(game.id, { soundEnabled: true, musicEnabled: true });
      setSoundOn(true);
      setMusicOn(true);
      soundManager.playButtonClick();
    }
  };

  const handleClose = useCallback(() => {
    soundManager.playButtonClick();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  }, [onClose]);

  const toggleFullscreen = () => {
    soundManager.playButtonClick();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Đồng bộ trạng thái Fullscreen và phím ESC
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  const handleOpenLeaderboard = () => {
    soundManager.playButtonClick();
    setIsLeaderboardOpen(true);
  };

  const handleOpenSettings = () => {
    soundManager.playButtonClick();
    setIsGameSettingsOpen(true);
  };

  if (!game) return null;

  const renderGameContent = () => {
    switch (game.id) {
      case '2048': return <Game2048 key={`${game.id}-${sessionKey}`} />;
      case 'snake': return <GameSnake key={`${game.id}-${sessionKey}`} />;
      case 'flappy': return <GameFlappy key={`${game.id}-${sessionKey}`} />;
      case 'caro': return <GameCaro key={`${game.id}-${sessionKey}`} />;
      case 'minesweeper': return <GameMinesweeper key={`${game.id}-${sessionKey}`} />;
      case 'memory': return <GameMemory key={`${game.id}-${sessionKey}`} />;
      case 'tetris': return <GameTetris key={`${game.id}-${sessionKey}`} />;
      case 'chess': return <GameChess key={`${game.id}-${sessionKey}`} />;
      case 'xiangqi': return <GameXiangqi key={`${game.id}-${sessionKey}`} />;
      case 'breakout': return <GameBreakout key={`${game.id}-${sessionKey}`} />;
      case 'space-shooter': return <GameSpaceShooter key={`${game.id}-${sessionKey}`} />;
      case 'onet': return <GameOnet key={`${game.id}-${sessionKey}`} />;
      case 'sudoku': return <GameSudoku key={`${game.id}-${sessionKey}`} />;
      case 'pong': return <GamePong key={`${game.id}-${sessionKey}`} />;
      case 'pacman': return <GamePacman key={`${game.id}-${sessionKey}`} />;
      case 'jewels': return <GameJewels key={`${game.id}-${sessionKey}`} />;
      case 'bubble-shooter': return <GameBubbleShooter key={`${game.id}-${sessionKey}`} />;
      case 'gold-miner': return <GameGoldMiner key={`${game.id}-${sessionKey}`} />;
      case 'tank-1990': return <GameTank1990 key={`${game.id}-${sessionKey}`} />;
      case 'bomberman': return <GameBomberman key={`${game.id}-${sessionKey}`} />;
      case 'galaga': return <GameGalaga key={`${game.id}-${sessionKey}`} />;
      case 'road-fighter': return <GameRoadFighter key={`${game.id}-${sessionKey}`} />;
      case 'zuma': return <GameZuma key={`${game.id}-${sessionKey}`} />;
      case 'contra': return <GameContra key={`${game.id}-${sessionKey}`} />;
      case 'mario': return <GameMario key={`${game.id}-${sessionKey}`} />;
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
      className="fixed inset-0 z-50 w-screen h-screen bg-[#03060c] p-0 flex flex-col overflow-hidden is-game-fullscreen select-none"
    >
      {/* Sleek Ultra-Thin Header Bar (Tối ưu không gian dọc tối đa, đầy đủ chức năng) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 border-b border-white/10 flex-shrink-0 z-20 bg-slate-950/90 backdrop-blur-md">
        {/* Game Title: Animated, Sinh động, Thẩm mỹ cao */}
        <div 
          className="flex items-center gap-2 group cursor-default"
          title={`${game.title}: ${game.subtitle || game.description}`}
        >
          <span className="text-lg sm:text-xl drop-shadow-md">
            {game.thumbnailIcon}
          </span>
          <h2 className="text-sm sm:text-base font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent">
            {game.title}
          </h2>
        </div>

        {/* Cụm Icon Điều Khiển */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Thiết Lập Game Riêng */}
          <button
            onClick={handleOpenSettings}
            className={`p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
              isGameSettingsOpen
                ? 'text-cyan-300 border-cyan-500/80 bg-slate-800'
                : 'text-cyan-400 hover:text-cyan-300 border-slate-700/80 hover:border-cyan-500/50'
            }`}
            title={`Thiết Lập Game: ${game.title}`}
          >
            <Settings className={`w-4 h-4 transition-transform duration-300 ${isGameSettingsOpen ? 'rotate-90 text-cyan-300' : ''}`} />
          </button>

          {/* Nút Hướng Dẫn Chơi */}
          <button
            onClick={handleOpenGuide}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition cursor-pointer shadow-md active:scale-95"
            title="Hướng Dẫn Chơi & Phím Điều Khiển"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Nút Bảng Xếp Hạng */}
          <button
            onClick={handleOpenLeaderboard}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/50 transition cursor-pointer shadow-md active:scale-95"
            title="Bảng Xếp Hạng Cao Thủ"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          {/* Nút Bật/Tắt Nhanh Âm Thanh Trận Đấu */}
          <button
            onClick={handleQuickMute}
            className={`p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
              soundOn || musicOn
                ? 'text-emerald-400 border-emerald-500/40'
                : 'text-gray-500 border-slate-700/80 hover:text-gray-300'
            }`}
            title={soundOn || musicOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundOn || musicOn ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Nút Toàn Màn Hình Trình Duyệt */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition cursor-pointer shadow-md active:scale-95"
            title={isNativeFullscreen ? 'Thoát Toàn Màn Hình' : 'Toàn Màn Hình (F11)'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Nút Đóng Trò Chơi */}
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/50 transition cursor-pointer shadow-md active:scale-95"
            title="Đóng Trò Chơi (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Big Immersive Game Viewport (100% Focused on Game, Zero Text Clutter) */}
      <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-0 bg-black">
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

      {/* VÙNG 1: Thiết Lập Game Riêng Modal Popup */}
      <GameSettingsModal
        isOpen={isGameSettingsOpen}
        onClose={() => setIsGameSettingsOpen(false)}
        game={game}
        onRestartGame={() => setSessionKey(k => k + 1)}
      />
    </div>
  );
};
