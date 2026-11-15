import React, { useEffect, useState, useRef } from 'react';
import { 
  Settings, 
  X, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Music,
  SlidersHorizontal,
  Bot, 
  Gauge, 
  Grid3X3, 
  Layers, 
  Eye, 
  Zap,
  Timer,
  ChevronDown,
  Check
} from 'lucide-react';
import type { GameInfo } from '../types/game';
import { soundManager, BGM_TRACKS, DEFAULT_GAME_TRACKS, type BgmTrack } from '../utils/sound';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameInfo;
  onRestartGame: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  game,
  onRestartGame,
}) => {
  const storageKey = `ace_game_settings_${game.id}`;
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.getGameAudioSettings(game.id).soundEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => soundManager.getGameAudioSettings(game.id).musicEnabled);
  const [sfxVolume, setSfxVolume] = useState<number>(() => soundManager.getGameAudioSettings(game.id).sfxVolume);
  const [musicVolume, setMusicVolume] = useState<number>(() => soundManager.getGameAudioSettings(game.id).musicVolume);
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(() => soundManager.getGameAudioSettings(game.id).bgmTrack);
  const [isMusicDropdownOpen, setIsMusicDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const musicDropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleMusicDropdown = () => {
    if (!isMusicDropdownOpen && triggerRef.current && modalRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const spaceBelow = modalRect.bottom - rect.bottom;
      const spaceAbove = rect.top - modalRect.top;
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;

      setDropdownPos({
        top: openUp ? (rect.top - modalRect.top - 6) : (rect.bottom - modalRect.top + 6),
        left: rect.left - modalRect.left,
        width: rect.width,
        openUp,
      });
      setIsMusicDropdownOpen(true);
    } else {
      setIsMusicDropdownOpen(false);
    }
  };

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(storageKey);
        setSettings(saved ? JSON.parse(saved) : {});
      } catch {
        setSettings({});
      }
      const cfg = soundManager.getGameAudioSettings(game.id);
      setSoundEnabled(cfg.soundEnabled);
      setMusicEnabled(cfg.musicEnabled);
      setSfxVolume(cfg.sfxVolume);
      setMusicVolume(cfg.musicVolume);
      setCurrentTrack(cfg.bgmTrack);
      setIsMusicDropdownOpen(false);
    }
  }, [isOpen, storageKey, game.id]);

  // Click outside music dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        musicDropdownRef.current &&
        !musicDropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsMusicDropdownOpen(false);
      }
    };
    if (isMusicDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMusicDropdownOpen]);

  useEffect(() => {
    const unsub = soundManager.subscribe(() => {
      const cfg = soundManager.getGameAudioSettings(game.id);
      setSoundEnabled(cfg.soundEnabled);
      setMusicEnabled(cfg.musicEnabled);
      setSfxVolume(cfg.sfxVolume);
      setMusicVolume(cfg.musicVolume);
      setCurrentTrack(cfg.bgmTrack);
    });
    return unsub;
  }, [game.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Cập nhật cài đặt mà KHÔNG làm reset ván game nền ngay lập tức (cố định bảng chính)
  const updateSetting = (key: string, value: any) => {
    soundManager.playButtonClick();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('ace-game-setting-changed', {
          detail: { gameId: game.id, key, value, allSettings: updated },
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSound = () => {
    soundManager.playButtonClick();
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.saveGameAudioSettings(game.id, { soundEnabled: next });
  };

  const handleToggleMusic = () => {
    soundManager.playButtonClick();
    const next = !musicEnabled;
    setMusicEnabled(next);
    soundManager.saveGameAudioSettings(game.id, { musicEnabled: next });
  };

  const handleSfxVolumeChange = (vol: number) => {
    setSfxVolume(vol);
    soundManager.saveGameAudioSettings(game.id, { sfxVolume: vol });
  };

  const handleMusicVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    soundManager.saveGameAudioSettings(game.id, { musicVolume: vol });
  };

  const handleSelectTrack = (track: BgmTrack) => {
    soundManager.playButtonClick();
    setCurrentTrack(track);
    soundManager.saveGameAudioSettings(game.id, { bgmTrack: track, musicEnabled: true });
    setMusicEnabled(true);
  };

  const handleRestart = () => {
    soundManager.playButtonClick();
    onRestartGame();
    onClose();
  };

  const handleResetDefaults = () => {
    soundManager.playButtonClick();
    localStorage.removeItem(storageKey);
    setSettings({});
    const defaultTrack = DEFAULT_GAME_TRACKS[game.id] || 'arcade';
    soundManager.saveGameAudioSettings(game.id, {
      soundEnabled: true,
      sfxVolume: 85,
      musicEnabled: true,
      musicVolume: 40,
      bgmTrack: defaultTrack,
    });
    window.dispatchEvent(
      new CustomEvent('ace-game-setting-changed', {
        detail: { gameId: game.id, key: 'RESET', value: null, allSettings: {} },
      })
    );
    onRestartGame();
  };

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Kích thước bảng cài đặt cố định chuẩn xác, tuyệt đối không nhảy kích thước hay đè thanh điều hướng */}
      <div
        ref={modalRef}
        className="relative w-[92vw] max-w-[460px] h-[540px] max-h-[88vh] bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Cố định độ cao h-14 */}
        <div className="h-14 px-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Settings className="w-4 h-4 text-cyan-400 rotate-45" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white font-['Orbitron'] tracking-wider">
                CÀI ĐẶT
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <span>{game.thumbnailIcon}</span>
                <span className="font-semibold">{game.title}</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Cố định cấu trúc, cuộn mượt mà nếu cần */}
        <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto custom-scrollbar text-left">
          
          {/* Cụm Cài Đặt Âm Thanh & Nhạc Nền Riêng Biệt Cho Từng Game - VÙNG 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 font-['Orbitron']">
                  Âm Thanh Trận Đấu
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/25">
                GAME
              </span>
            </div>

            {/* Hiệu ứng âm thanh (SFX) của game */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                  <span className="text-xs font-bold text-gray-200">Hiệu Ứng (SFX)</span>
                </div>
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={handleToggleSound}
                    className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      soundEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={handleToggleSound}
                    className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !soundEnabled
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
                  disabled={!soundEnabled}
                  onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
                  className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400 bg-slate-950 ${
                    !soundEnabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Nhạc nền (BGM) của game */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className={`w-4 h-4 ${musicEnabled ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
                  <span className="text-xs font-bold text-gray-200">Nhạc Nền (BGM)</span>
                </div>
                <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={handleToggleMusic}
                    className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      musicEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={handleToggleMusic}
                    className={`px-3 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !musicEnabled
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
                  disabled={!musicEnabled}
                  onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
                  className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-slate-950 ${
                    !musicEnabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Danh sách bản nhạc BGM cho game */}
            <div className="space-y-1.5 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Chọn Nhạc Nền:</span>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                  {BGM_TRACKS.find(t => t.id === currentTrack)?.title}
                </span>
              </div>

              {/* Dropdown Trigger Button - To, rõ, tinh tế */}
              <button
                ref={triggerRef}
                type="button"
                onClick={toggleMusicDropdown}
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
            </div>
          </div>

          {/* CỜ TƯỚNG (Xiangqi) */}
          {game.id === 'xiangqi' && (
            <>
              {/* ĐỘ KHÓ AI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó AI</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { level: 1, label: 'Dễ' },
                    { level: 2, label: 'Vừa' },
                    { level: 3, label: 'Khó' },
                  ].map(({ level, label }) => (
                    <button
                      key={level}
                      onClick={() => updateSetting('aiLevel', level)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.aiLevel || 2) === level
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                    <Timer className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Thời Gian Lượt</span>
                </div>
                <select
                  value={settings.timeLimit !== undefined ? settings.timeLimit : 60}
                  onChange={(e) => updateSetting('timeLimit', Number(e.target.value))}
                  className="bg-slate-950 text-purple-300 font-bold text-xs border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-500/60 transition shadow-inner font-mono"
                >
                  <option value={0}>Vô Hạn (Tự do)</option>
                  <option value={30}>30 Giây (Nhanh)</option>
                  <option value={60}>60 Giây (Chuẩn)</option>
                  <option value={90}>90 Giây (Chiến thuật)</option>
                  <option value={120}>120 Giây (Thong thả)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Gợi Ý Nước Đi</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('showHints', true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.showHints !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={() => updateSetting('showHints', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.showHints === false
                        ? 'bg-slate-800 text-gray-300 border border-slate-700'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tắt
                  </button>
                </div>
              </div>
            </>
          )}

          {/* CỜ VUA (Chess) */}
          {game.id === 'chess' && (
            <>
              {/* ĐỘ KHÓ AI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó AI</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { level: 1, label: 'Dễ' },
                    { level: 2, label: 'Vừa' },
                    { level: 3, label: 'Khó' },
                  ].map(({ level, label }) => (
                    <button
                      key={level}
                      onClick={() => updateSetting('aiLevel', level)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.aiLevel || 2) === level
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                    <Timer className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Thời Gian Lượt</span>
                </div>
                <select
                  value={settings.timeLimit !== undefined ? settings.timeLimit : 60}
                  onChange={(e) => updateSetting('timeLimit', Number(e.target.value))}
                  className="bg-slate-950 text-purple-300 font-bold text-xs border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-500/60 transition shadow-inner font-mono"
                >
                  <option value={0}>Vô Hạn (Tự do)</option>
                  <option value={30}>30 Giây (Nhanh)</option>
                  <option value={60}>60 Giây (Chuẩn)</option>
                  <option value={90}>90 Giây (Chiến thuật)</option>
                  <option value={120}>120 Giây (Thong thả)</option>
                </select>
              </div>
            </>
          )}

          {/* CỜ CARO */}
          {game.id === 'caro' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Kích Thước Bàn</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('boardSize', 3)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.boardSize === 3
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    3x3 (Nhanh)
                  </button>
                  <button
                    onClick={() => updateSetting('boardSize', 10)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.boardSize || 10) === 10
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    10x10 (Chuẩn)
                  </button>
                </div>
              </div>

              {/* ĐỘ KHÓ AI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó AI</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('difficulty', 'EASY')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.difficulty === 'EASY'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Dễ
                  </button>
                  <button
                    onClick={() => updateSetting('difficulty', 'UNBEATABLE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.difficulty || 'UNBEATABLE') === 'UNBEATABLE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Khó
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                    <Timer className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Thời Gian Lượt</span>
                </div>
                <select
                  value={settings.timeLimit !== undefined ? settings.timeLimit : 60}
                  onChange={(e) => updateSetting('timeLimit', Number(e.target.value))}
                  className="bg-slate-950 text-purple-300 font-bold text-xs border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-500/60 transition shadow-inner font-mono"
                >
                  <option value={0}>Vô Hạn (Tự do)</option>
                  <option value={30}>30 Giây (Nhanh)</option>
                  <option value={60}>60 Giây (Chuẩn)</option>
                  <option value={90}>90 Giây (Chiến thuật)</option>
                  <option value={120}>120 Giây (Thong thả)</option>
                </select>
              </div>
            </>
          )}

          {/* XẾP GẠCH (Tetris) */}
          {game.id === 'tetris' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Cấp Độ Bắt Đầu</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[1, 5, 10].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateSetting('startLevel', lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.startLevel || 1) === lvl
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Lv.{lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Chiếu Bóng Rơi</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('ghostPiece', true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.ghostPiece !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={() => updateSetting('ghostPiece', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.ghostPiece === false
                        ? 'bg-slate-800 text-gray-300 border border-slate-700'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tắt
                  </button>
                </div>
              </div>
            </>
          )}

          {/* RẮN SĂN MỒI (Snake) */}
          {game.id === 'snake' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Tốc Độ Rắn</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { key: 'slow', label: 'Chậm' },
                    { key: 'normal', label: 'Vừa' },
                    { key: 'fast', label: 'Nhanh' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('speed', key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.speed || 'normal') === key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Đi Xuyên Tường</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('wrapWalls', true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.wrapWalls
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={() => updateSetting('wrapWalls', false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !settings.wrapWalls
                        ? 'bg-slate-800 text-gray-300 border border-slate-700'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tắt
                  </button>
                </div>
              </div>
            </>
          )}

          {/* DÒ MÌN (Minesweeper) */}
          {game.id === 'minesweeper' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Cấp Độ Bãi Mìn</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {[
                  { key: 'easy', label: '8x8' },
                  { key: 'medium', label: '12x12' },
                  { key: 'hard', label: '16x16' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateSetting('difficulty', key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.difficulty || 'medium') === key
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PHÁ GẠCH (Breakout) */}
          {game.id === 'breakout' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Tốc Độ Bóng</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {[
                  { key: 'normal', label: 'Chuẩn' },
                  { key: 'fast', label: 'Nhanh' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateSetting('ballSpeed', key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.ballSpeed || 'normal') === key
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2048 */}
          {game.id === '2048' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Tốc Độ Lướt Ô</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {[
                  { key: 'normal', label: 'Mượt' },
                  { key: 'fast', label: 'Nhanh' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateSetting('slideSpeed', key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.slideSpeed || 'normal') === key
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHIẾN CƠ KHÔNG GIAN (Space Shooter) */}
          {game.id === 'space-shooter' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Tự Động Bắn</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => updateSetting('autoFire', true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.autoFire !== false
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Bật
                </button>
                <button
                  onClick={() => updateSetting('autoFire', false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    settings.autoFire === false
                      ? 'bg-slate-800 text-gray-300 border border-slate-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tắt
                </button>
              </div>
            </div>
          )}

          {/* LẬT HÌNH (Memory) */}
          {game.id === 'memory' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Grid3X3 className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Số Lượng Thẻ</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {[
                  { count: 16, label: '16 Ô' },
                  { count: 36, label: '36 Ô' },
                ].map(({ count, label }) => (
                  <button
                    key={count}
                    onClick={() => updateSetting('cardCount', count)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.cardCount || 16) === count
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FLAPPY BIRD */}
          {game.id === 'flappy' && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó Ống</span>
              </div>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                {[
                  { key: 'normal', label: 'Chuẩn' },
                  { key: 'hard', label: 'Khó' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateSetting('difficulty', key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.difficulty || 'normal') === key
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ONET NỐI HÌNH */}
          {game.id === 'onet' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó Bàn</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { key: 'easy', label: 'Dễ' },
                    { key: 'normal', label: 'Vừa' },
                    { key: 'hard', label: 'Khó' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('difficulty', key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.difficulty || 'normal') === key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
                    <Timer className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Thời Gian</span>
                </div>
                <select
                  value={settings.timeLimit !== undefined ? settings.timeLimit : 300}
                  onChange={(e) => updateSetting('timeLimit', Number(e.target.value))}
                  className="bg-slate-950 text-purple-300 font-bold text-xs border border-purple-500/30 rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-purple-500/60 transition shadow-inner font-mono"
                >
                  <option value={0}>Vô Hạn (Tự do)</option>
                  <option value={180}>3 Phút (Nhanh)</option>
                  <option value={300}>5 Phút (Chuẩn)</option>
                  <option value={480}>8 Phút (Thong thả)</option>
                </select>
              </div>
            </>
          )}

        </div>

        {/* Footer Bar - Cố định độ cao và vị trí ở đáy, không bao giờ dịch chuyển */}
        <div className="h-16 px-5 border-t border-white/10 bg-slate-900/90 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khởi Động Lại Ván Game</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer active:scale-95"
            title="Khôi phục mặc định"
          >
            Mặc Định
          </button>
        </div>

        {/* SMART DROPDOWN OVERLAY: Nằm ở cấp Modal Card, tự do đè lên Body và Footer mà không bị cắt/che khuất */}
        {isMusicDropdownOpen && (
          <div
            ref={musicDropdownRef}
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              transform: dropdownPos.openUp ? 'translateY(-100%)' : 'none',
            }}
            className="bg-slate-950/98 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl p-1.5 shadow-[0_15px_50px_rgba(0,0,0,0.95)] z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar"
          >
            {BGM_TRACKS.map((t) => {
              const isActive = currentTrack === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    handleSelectTrack(t.id);
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
  );
};
