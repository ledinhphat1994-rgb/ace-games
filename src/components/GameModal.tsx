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
  // 'vung2': Mặc định hiển thị tại khung VÙNG 2 trung tâm website
  // 'fullscreen': Chế độ toàn màn hình khi người dùng bấm nút phóng to
  const [viewMode, setViewMode] = useState<'vung2' | 'fullscreen'>('vung2');
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

  // Đồng bộ trạng thái Fullscreen và phím ESC
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
      if (e.key === 'Escape') {
        if (viewMode === 'fullscreen') {
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          }
          setViewMode('vung2');
        } else {
          handleClose();
        }
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
  }, [viewMode, handleClose]);

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
      className={`transition-all duration-300 overflow-hidden flex flex-col ${
        viewMode === 'vung2'
          ? 'relative w-full h-full bg-[#070b14] rounded-2xl sm:rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.85)]'
          : 'fixed inset-0 z-50 w-screen h-screen bg-[#03060c] p-0 rounded-none border-0 is-game-fullscreen'
      }`}
    >
      {/* Sleek Header Bar */}
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
              <h2 className="text-sm sm:text-lg font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                {game.title}
              </h2>
            </div>
            <div className="w-12 group-hover:w-full h-0.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400 transition-all duration-500 rounded-full mt-0.5 opacity-80" />
          </div>
        </div>

        {/* VÙNG 6: Cụm Icon Điều Khiển */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Thiết Lập Game Riêng */}
          <button
            onClick={handleOpenSettings}
            className={`p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
              isGameSettingsOpen
                ? 'text-cyan-300 border-cyan-500/80 shadow-cyan-500/20 bg-slate-800'
                : 'text-cyan-400 hover:text-cyan-300 border-slate-700/80 hover:border-cyan-500/50'
            }`}
            title={`Thiết Lập Game: ${game.title}`}
          >
            <Settings className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isGameSettingsOpen ? 'rotate-90 text-cyan-300' : ''}`} />
          </button>

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

          {/* Nút Bật/Tắt Nhanh Âm Thanh Trận Đấu */}
          <button
            onClick={handleQuickMute}
            className={`p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
              soundOn || musicOn
                ? 'text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                : 'text-gray-500 border-slate-700/80 hover:text-gray-300'
            }`}
            title={soundOn || musicOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundOn || musicOn ? (
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

      {/* Big Immersive Game Viewport */}
      <div className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center ${
        viewMode === 'vung2'
          ? 'p-1.5 sm:p-2.5 bg-gradient-to-b from-[#060913] to-[#04060a]'
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
