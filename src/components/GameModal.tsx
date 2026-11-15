import React, { useRef, useState, useEffect } from 'react';
import { X, Maximize2, Volume2, VolumeX, Trophy, HelpCircle, Settings, Music, ChevronDown, Check } from 'lucide-react';
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
import { soundManager, BGM_TRACKS, type BgmTrack } from '../utils/sound';
import { LeaderboardModal } from './LeaderboardModal';
import { GameGuideModal } from './GameGuideModal';
import { GameSettingsModal } from './GameSettingsModal';

interface GameModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  // 'vung2': Default in-place theater inside VÙNG 2 (central content area)
  // 'fullscreen': True 100vw x 100vh full screen for all monitors (PC 1920x1080) & mobile
  const [viewMode, setViewMode] = useState<'vung2' | 'fullscreen'>('vung2');
  const [soundOn, setSoundOn] = useState(() => soundManager.isSoundOn());
  const [musicOn, setMusicOn] = useState(() => soundManager.isMusicOn());
  const [sfxVolume, setSfxVolume] = useState(() => soundManager.getSoundVolume());
  const [musicVolume, setMusicVolume] = useState(() => soundManager.getMusicVolume());
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(() => soundManager.getMusicTrack());
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [isMusicDropdownOpen, setIsMusicDropdownOpen] = useState(false);
  const audioMenuRef = useRef<HTMLDivElement | null>(null);
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
      setSfxVolume(soundManager.getSoundVolume());
      setMusicVolume(soundManager.getMusicVolume());
      setCurrentTrack(soundManager.getMusicTrack());
    });
    return unsubscribe;
  }, []);

  // Close audio menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
        setIsAudioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleOpenSettings = () => {
    soundManager.playButtonClick();
    setIsGameSettingsOpen(true);
  };

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

          {/* VÙNG 6: Cụm Icon Điều Khiển (VÙNG 1 THIẾT LẬP GAME + HƯỚNG DẪN + BẢNG XẾP HẠNG + ÂM THANH + FULLSCREEN + ĐÓNG) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* VÙNG 1: Nút Thiết Lập Game Riêng (Icon Bánh Răng Độc Quyền Cho Game, Tuyệt Đối Không Trùng Icon) */}
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

            {/* VÙNG 5 ĐƯA LÊN VÙNG 6: Bộ Điều Khiển Âm Thanh In-Game & Popover */}
            <div className="relative" ref={audioMenuRef}>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setIsAudioMenuOpen(prev => !prev);
                }}
                className={`p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border transition cursor-pointer shadow-md active:scale-95 ${
                  isAudioMenuOpen || soundOn || musicOn
                    ? 'text-cyan-400 border-cyan-500/60 shadow-cyan-500/20'
                    : 'text-gray-500 border-slate-700/80'
                }`}
                title="Âm thanh trận đấu (Chọn nhạc, chỉnh âm lượng)"
              >
                {soundOn || musicOn ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                )}
              </button>

              {/* Popover Điều Khiển Âm Thanh Ngay Trong Trận - VÙNG 1: ÂM THANH TRẬN ĐẤU */}
              {isAudioMenuOpen && (
                <div className="absolute right-0 mt-3 w-96 max-w-[95vw] sm:w-[400px] bg-slate-950/98 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 z-50 animate-in fade-in zoom-in-95 duration-150 text-left space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Volume2 className="w-4 h-4" />
                      <span>ÂM THANH TRẬN ĐẤU</span>
                    </div>
                    <span className="text-[10px] text-cyan-400/90 font-mono tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      GAME
                    </span>
                  </div>

                  {/* SFX Section */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs font-bold text-gray-200">Hiệu Ứng (SFX)</span>
                      </div>
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                        <button
                          onClick={() => !soundOn && handleToggleSound()}
                          className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            soundOn
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Bật
                        </button>
                        <button
                          onClick={() => soundOn && handleToggleSound()}
                          className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            !soundOn
                              ? 'bg-slate-800 text-gray-300 border border-slate-700'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Tắt
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono w-7">{sfxVolume}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sfxVolume}
                        disabled={!soundOn}
                        onChange={(e) => soundManager.setSoundVolume(Number(e.target.value), game.id)}
                        className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 bg-slate-950 ${
                          !soundOn ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* BGM Section */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className={`w-4 h-4 ${musicOn ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
                        <span className="text-xs font-bold text-gray-200">Nhạc Nền (BGM)</span>
                      </div>
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                        <button
                          onClick={() => {
                            if (!musicOn) {
                              const next = soundManager.toggleMusic(game.id);
                              setMusicOn(next);
                            }
                          }}
                          className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            musicOn
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Bật
                        </button>
                        <button
                          onClick={() => {
                            if (musicOn) {
                              const next = soundManager.toggleMusic(game.id);
                              setMusicOn(next);
                            }
                          }}
                          className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            !musicOn
                              ? 'bg-slate-800 text-gray-300 border border-slate-700'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Tắt
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono w-7">{musicVolume}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={musicVolume}
                        disabled={!musicOn}
                        onChange={(e) => soundManager.setMusicVolume(Number(e.target.value), game.id)}
                        className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-slate-950 ${
                          !musicOn ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Track Selection Dropdown - TO RÕ, TINH TẾ, ĐẸP */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Chọn Nhạc Nền:</span>
                      <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                        {BGM_TRACKS.find(t => t.id === currentTrack)?.title}
                      </span>
                    </div>

                    {/* Dropdown Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsMusicDropdownOpen(prev => !prev)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer shadow-md ${
                        isMusicDropdownOpen
                          ? 'bg-slate-900 border-cyan-400 text-white shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-cyan-500/30 hover:border-cyan-500/60 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex-shrink-0">
                          {BGM_TRACKS.find(t => t.id === currentTrack)?.icon || '🎵'}
                        </span>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                            {BGM_TRACKS.find(t => t.id === currentTrack)?.title}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {BGM_TRACKS.find(t => t.id === currentTrack)?.desc}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full hidden sm:inline-block">
                          Đang chọn
                        </span>
                        <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-300 ${isMusicDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Dropdown Menu List */}
                    {isMusicDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-950/98 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl p-1.5 shadow-2xl shadow-cyan-950/80 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                        {BGM_TRACKS.map((t) => {
                          const isActive = currentTrack === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                soundManager.playButtonClick();
                                soundManager.setMusicTrack(t.id, game.id);
                                if (!musicOn) {
                                  soundManager.toggleMusic(game.id);
                                }
                                setIsMusicDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-500/20'
                                  : 'bg-transparent border-transparent hover:bg-slate-900/90 text-gray-300 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-lg flex-shrink-0">{t.icon}</span>
                                <div className="flex flex-col min-w-0">
                                  <span className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-cyan-200' : 'text-gray-200'}`}>
                                    {t.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400 truncate">
                                    {t.desc}
                                  </span>
                                </div>
                              </div>
                              {isActive && (
                                <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                  <Check className="w-3 h-3 text-cyan-400" />
                                  <span>Phát</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
