import React, { useState, useRef, useEffect } from 'react';
import { Gamepad2, Search, Volume2, VolumeX, Music, Dices, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import type { GameCategory } from '../types/game';
import { soundManager, BGM_TRACKS, type BgmTrack } from '../utils/sound';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: GameCategory;
  onCategoryChange: (cat: GameCategory) => void;
  onRandomGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRandomGame,
}) => {
  const [soundOn, setSoundOn] = useState(() => soundManager.getSystemSoundEnabled());
  const [musicOn, setMusicOn] = useState(() => soundManager.getSystemMusicEnabled());
  const [sfxVolume, setSfxVolume] = useState(() => soundManager.getSystemSoundVolume());
  const [musicVolume, setMusicVolume] = useState(() => soundManager.getSystemMusicVolume());
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(() => soundManager.getSystemMusicTrack());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMusicDropdownOpen, setIsMusicDropdownOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const musicDropdownRef = useRef<HTMLDivElement | null>(null);

  // Synchronize VÙNG 1: System and UI Audio states
  useEffect(() => {
    const unsubscribe = soundManager.subscribe(() => {
      setSoundOn(soundManager.getSystemSoundEnabled());
      setMusicOn(soundManager.getSystemMusicEnabled());
      setSfxVolume(soundManager.getSystemSoundVolume());
      setMusicVolume(soundManager.getSystemMusicVolume());
      setCurrentTrack(soundManager.getSystemMusicTrack());
    });
    return unsubscribe;
  }, []);

  const toggleSound = () => {
    const next = soundManager.toggleSystemSound();
    setSoundOn(next);
  };

  const toggleMusic = () => {
    const next = soundManager.toggleSystemMusic();
    setMusicOn(next);
  };

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (musicDropdownRef.current && !musicDropdownRef.current.contains(e.target as Node)) {
        setIsMusicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories: { id: GameCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tất Cả', icon: '🔥' },
    { id: 'favorites', label: 'Yêu Thích', icon: '❤️' },
    { id: 'strategy', label: 'Cờ & Đấu Trí', icon: '♟️' },
    { id: 'arcade', label: 'Arcade & Bắn Súng', icon: '🚀' },
    { id: 'classic', label: 'Kinh Điển', icon: '🕹️' },
    { id: 'puzzle', label: 'Giải Đố & Số', icon: '🧩' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
      {/* Top Bar: Logo (Vùng 1+), Search Bar, and Settings Button (Vùng 2) */}
      <div className="w-full px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo - VÙNG 1+ (Góc trên cùng bên trái) */}
          <div
            onClick={() => {
              soundManager.playButtonClick();
              onCategoryChange('all');
            }}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
            title="Ace Games - Trang chủ"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 group-hover:shadow-cyan-400/50 transition-all duration-300">
              <Gamepad2 className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300">
                ACE GAMES
              </span>
            </div>
          </div>

          {/* Search Bar - Center Balanced */}
          <div className="relative flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm trò chơi..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-gray-100 placeholder-gray-500 rounded-2xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* VÙNG 2: Audio/System Settings Button (Biểu tượng thanh gạt Equalizer, KHÔNG trùng với icon bánh răng cài đặt game) */}
          <div className="relative flex-shrink-0" ref={settingsRef}>
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setSettingsOpen(prev => !prev);
              }}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-md ${
                settingsOpen || musicOn || soundOn
                  ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 shadow-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
              }`}
              title="Bộ điều khiển âm thanh hệ thống (Audio Hub)"
            >
              <SlidersHorizontal className={`w-5 h-5 transition-transform duration-300 ${settingsOpen ? 'scale-110 text-cyan-400' : ''}`} />
            </button>

            {/* Cyberpunk Settings Popover Menu - VÙNG 2: ÂM THANH HỆ THỐNG (CHUNG) */}
            {settingsOpen && (
              <div className="absolute right-0 mt-3 w-96 max-w-[95vw] sm:w-[400px] bg-slate-950/98 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 z-50 animate-in fade-in zoom-in-95 duration-150 text-left space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>ÂM THANH HỆ THỐNG</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/90 font-mono tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    CHUNG
                  </span>
                </div>

                {/* Section 1: Âm Giao Diện */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                      <span className="text-xs font-bold text-gray-200">Âm Giao Diện (UI)</span>
                    </div>
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                      <button
                        onClick={() => !soundOn && toggleSound()}
                        className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          soundOn
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Bật
                      </button>
                      <button
                        onClick={() => soundOn && toggleSound()}
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
                  
                  {/* Slider âm lượng UI SFX */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono w-7">{sfxVolume}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sfxVolume}
                      disabled={!soundOn}
                      onChange={(e) => soundManager.setSystemSoundVolume(Number(e.target.value))}
                      className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 bg-slate-950 ${
                        !soundOn ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Section 2: Nhạc Nền Sảnh Chờ */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className={`w-4 h-4 ${musicOn ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
                      <span className="text-xs font-bold text-gray-200">Nhạc Sảnh Chờ</span>
                    </div>
                    <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                      <button
                        onClick={() => !musicOn && toggleMusic()}
                        className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          musicOn
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Bật
                      </button>
                      <button
                        onClick={() => musicOn && toggleMusic()}
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

                  {/* Slider âm lượng Lounge BGM */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono w-7">{musicVolume}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={musicVolume}
                      disabled={!musicOn}
                      onChange={(e) => soundManager.setSystemMusicVolume(Number(e.target.value))}
                      className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-slate-950 ${
                        !musicOn ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Section 3: Chọn Bản Nhạc Sảnh Chờ */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 relative" ref={musicDropdownRef}>
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                    Chọn Nhạc Sảnh:
                  </span>

                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsMusicDropdownOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-md ${
                      isMusicDropdownOpen
                        ? 'bg-slate-900 border-cyan-400 text-white shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-cyan-500/30 hover:border-cyan-500/60 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg p-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex-shrink-0">
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

                  {/* Dropdown Menu List - Nổi bật, không bị cắt chữ, hiển thị trọn vẹn 5 bài hát */}
                  {isMusicDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950/98 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl p-1.5 shadow-[0_15px_50px_rgba(0,0,0,0.95)] z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 overflow-hidden select-none">
                      {BGM_TRACKS.map((t) => {
                        const isActive = currentTrack === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              soundManager.playButtonClick();
                              soundManager.setSystemMusicTrack(t.id);
                              if (!musicOn) {
                                soundManager.toggleSystemMusic();
                              }
                              setIsMusicDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-500/20'
                                : 'bg-transparent border-transparent hover:bg-slate-900/90 text-gray-300 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base flex-shrink-0">{t.icon}</span>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-bold truncate ${isActive ? 'text-cyan-200' : 'text-gray-200'}`}>
                                  {t.title}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate">
                                  {t.desc}
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
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
        </div>
      </div>

      {/* Category Pills Bar with VÙNG 1 moved into VÙNG 2 right beside the last category button */}
      <div className="w-full border-t border-white/5 bg-slate-950/50">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onMouseEnter={() => soundManager.playCardHover()}
                onClick={() => {
                  soundManager.playButtonClick();
                  onCategoryChange(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300 scale-102 font-black'
                    : 'bg-slate-900/90 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}

          {/* VÙNG 1 ĐƯA VÀO VÙNG 2 SÁT BÊN: Nút Ngẫu Nhiên nằm ngay sau nút Giải Đố & Số */}
          <button
            onClick={() => {
              soundManager.playDiceRoll();
              onRandomGame();
            }}
            onMouseEnter={() => soundManager.playCardHover()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold transition flex-shrink-0 cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 whitespace-nowrap"
            title="Chơi ngẫu nhiên 1 trò chơi"
          >
            <Dices className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-extrabold">Ngẫu Nhiên</span>
          </button>
        </div>
      </div>
    </header>
  );
};
