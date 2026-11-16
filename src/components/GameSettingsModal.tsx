import React, { useEffect, useState, useRef } from 'react';
import { 
  Settings, 
  X, 
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
import { soundManager, BGM_TRACKS, type BgmTrack } from '../utils/sound';

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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const musicDropdownRef = useRef<HTMLDivElement | null>(null);

  // Lưu trữ cấu hình ban đầu khi mở modal để phục vụ nút "Hủy Bỏ"
  const initialSettingsRef = useRef<Record<string, any>>({});
  const initialAudioRef = useRef<any>(null);

  const updateDropdownPos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 224; // Chiều cao chính xác của 5 bài nhạc
      const viewportHeight = window.innerHeight;

      // Mặc định mở đè xuống dưới ngay sát nút trigger
      let top = rect.bottom + 6;

      // Không bao giờ được đụng cạnh dưới màn hình (đảm bảo cách cạnh đáy màn hình tối thiểu 16px)
      if (top + dropdownHeight > viewportHeight - 16) {
        if (rect.top - 6 - dropdownHeight >= 16) {
          top = rect.top - 6 - dropdownHeight;
        } else {
          top = Math.max(16, viewportHeight - dropdownHeight - 16);
        }
      }

      setDropdownPos({
        top: Math.round(top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
      });
    }
  };

  const toggleMusicDropdown = () => {
    if (!isMusicDropdownOpen) {
      updateDropdownPos();
      setIsMusicDropdownOpen(true);
    } else {
      setIsMusicDropdownOpen(false);
    }
  };

  // Cập nhật vị trí dropdown khi mở
  useEffect(() => {
    if (isMusicDropdownOpen) {
      updateDropdownPos();
    }
  }, [isMusicDropdownOpen]);

  // Cập nhật vị trí dropdown khi resize hoặc scroll cửa sổ / modal
  useEffect(() => {
    if (!isMusicDropdownOpen) return;
    const handleUpdate = () => updateDropdownPos();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isMusicDropdownOpen]);

  // Sync state when opening & lưu snapshot ban đầu
  useEffect(() => {
    if (isOpen) {
      let initial: Record<string, any> = {};
      try {
        const saved = localStorage.getItem(storageKey);
        initial = saved ? JSON.parse(saved) : {};
      } catch {
        initial = {};
      }
      setSettings(initial);
      initialSettingsRef.current = JSON.parse(JSON.stringify(initial));

      const cfg = soundManager.getGameAudioSettings(game.id);
      setSoundEnabled(cfg.soundEnabled);
      setMusicEnabled(cfg.musicEnabled);
      setSfxVolume(cfg.sfxVolume);
      setMusicVolume(cfg.musicVolume);
      setCurrentTrack(cfg.bgmTrack);
      initialAudioRef.current = { ...cfg };
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

  // Handle ESC key to close (Hủy bỏ)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Cập nhật cài đặt tạm thời trong modal
  const updateSetting = (key: string, value: any) => {
    soundManager.playButtonClick();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
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

  // Nút ÁP DỤNG: Lưu toàn bộ thay đổi và áp dụng vào game
  const handleApply = () => {
    soundManager.playButtonClick();
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }

    soundManager.saveGameAudioSettings(game.id, {
      soundEnabled,
      sfxVolume,
      musicEnabled,
      musicVolume,
      bgmTrack: currentTrack,
    });

    window.dispatchEvent(
      new CustomEvent('ace-game-setting-changed', {
        detail: { gameId: game.id, key: 'APPLY_SETTINGS', value: null, allSettings: settings },
      })
    );

    // Nếu cài đặt gameplay có thay đổi thì khởi động lại ván để áp dụng ngay
    const hasGameplayChanged = JSON.stringify(settings) !== JSON.stringify(initialSettingsRef.current);
    if (hasGameplayChanged) {
      onRestartGame();
    }

    onClose();
  };

  // Nút HỦY BỎ: Khôi phục lại đúng trạng thái ban đầu và đóng cài đặt
  const handleCancel = () => {
    soundManager.playButtonClick();
    setSettings(initialSettingsRef.current);
    try {
      localStorage.setItem(storageKey, JSON.stringify(initialSettingsRef.current));
      window.dispatchEvent(
        new CustomEvent('ace-game-setting-changed', {
          detail: { gameId: game.id, key: 'REVERT_SETTINGS', value: null, allSettings: initialSettingsRef.current },
        })
      );
    } catch (e) {
      console.error(e);
    }

    if (initialAudioRef.current) {
      soundManager.saveGameAudioSettings(game.id, initialAudioRef.current);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Kích thước vừa vặn, không đụng cạnh màn hình, có khoảng thở xung quanh */}
      <div
        ref={modalRef}
        className="relative w-[92vw] max-w-[500px] h-auto max-h-[82vh] bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070b14] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col select-none my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - To rõ, bề thế */}
        <div className="h-16 px-5 sm:px-6 border-b border-white/10 bg-slate-900/95 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Settings className="w-5 h-5 text-cyan-400 rotate-45" />
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-xl font-black text-white tracking-wider">
                CÀI ĐẶT
              </h3>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm flex items-center gap-1.5">
                <span>{game.thumbnailIcon}</span>
                <span>{game.title}</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer active:scale-90"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body - Thoáng đãng, font to bự, cuộn mượt mà */}
        <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar text-left">
          
          {/* Cụm Cài Đặt Âm Thanh & Nhạc Nền Riêng Biệt Cho Từng Game */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3.5 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
                  Âm Thanh Trận Đấu
                </span>
              </div>
              <span className="text-[11px] text-cyan-300 font-mono font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                GAME
              </span>
            </div>

            {/* Hiệu ứng âm thanh của game */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                  <span className="text-sm sm:text-base font-bold text-white">Hiệu Ứng</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={handleToggleSound}
                    className={`px-4 py-1 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
                      soundEnabled
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={handleToggleSound}
                    className={`px-4 py-1 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
                      !soundEnabled
                        ? 'bg-slate-800 text-gray-300 border border-slate-700'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tắt
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-xs sm:text-sm text-cyan-400 font-mono font-bold w-10">{sfxVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  disabled={!soundEnabled}
                  onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400 bg-slate-950 ${
                    !soundEnabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Nhạc nền của game */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
                  <span className="text-sm sm:text-base font-bold text-white">Nhạc Nền</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={handleToggleMusic}
                    className={`px-4 py-1 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
                      musicEnabled
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bật
                  </button>
                  <button
                    onClick={handleToggleMusic}
                    className={`px-4 py-1 rounded-lg text-xs sm:text-sm font-black transition cursor-pointer ${
                      !musicEnabled
                        ? 'bg-slate-800 text-gray-300 border border-slate-700'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tắt
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-xs sm:text-sm text-cyan-400 font-mono font-bold w-10">{musicVolume}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  disabled={!musicEnabled}
                  onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-slate-950 ${
                    !musicEnabled ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Danh sách bản nhạc BGM cho game */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-wider block">
                Chọn Nhạc Nền:
              </span>

              {/* Dropdown Trigger Button - To, rõ, tinh tế */}
              <button
                ref={triggerRef}
                type="button"
                onClick={toggleMusicDropdown}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer shadow-md ${
                  isMusicDropdownOpen
                    ? 'bg-slate-900 border-cyan-400 text-white shadow-cyan-500/25 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-cyan-500/35 hover:border-cyan-400 text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex-shrink-0">
                    {BGM_TRACKS.find(t => t.id === currentTrack)?.icon || '🎵'}
                  </span>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                      {BGM_TRACKS.find(t => t.id === currentTrack)?.title}
                    </span>
                    <span className="text-xs text-gray-300 truncate">
                      {BGM_TRACKS.find(t => t.id === currentTrack)?.desc}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2.5 py-1 rounded-full hidden sm:inline-block">
                    Đang chọn
                  </span>
                  <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${isMusicDropdownOpen ? 'rotate-180' : ''}`} />
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
                  <option value={0}>Vô Hạn</option>
                  <option value={30}>30 Giây</option>
                  <option value={60}>60 Giây</option>
                  <option value={90}>90 Giây</option>
                  <option value={120}>120 Giây</option>
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
                  <option value={0}>Vô Hạn</option>
                  <option value={30}>30 Giây</option>
                  <option value={60}>60 Giây</option>
                  <option value={90}>90 Giây</option>
                  <option value={120}>120 Giây</option>
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
                    3x3
                  </button>
                  <button
                    onClick={() => updateSetting('boardSize', 10)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.boardSize || 10) === 10
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    10x10
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
                  <option value={0}>Vô Hạn</option>
                  <option value={30}>30 Giây</option>
                  <option value={60}>60 Giây</option>
                  <option value={90}>90 Giây</option>
                  <option value={120}>120 Giây</option>
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
                  <option value={0}>Vô Hạn</option>
                  <option value={180}>3 Phút</option>
                  <option value={300}>5 Phút</option>
                  <option value={480}>8 Phút</option>
                </select>
              </div>
            </>
          )}

          {/* SUDOKU */}
          {game.id === 'sudoku' && (
            <>
              {/* ĐỘ KHÓ */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Gauge className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó Bàn</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => updateSetting('difficulty', d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.difficulty || 'easy') === d
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
                    </button>
                  ))}
                </div>
              </div>

              {/* GIỚI HẠN LỖI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-rose-400">
                    <Zap className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Giới Hạn Lỗi</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => updateSetting('maxMistakes', 3)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      (settings.maxMistakes || 3) === 3
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    3 Lỗi
                  </button>
                  <button
                    onClick={() => updateSetting('maxMistakes', 0)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      settings.maxMistakes === 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Vô Hạn
                  </button>
                </div>
              </div>
            </>
          )}

          {/* BÓNG BÀN (Pong) */}
          {game.id === 'pong' && (
            <>
              {/* ĐỘ KHÓ AI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Độ Khó AI</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { key: 'easy', label: 'Dễ' },
                    { key: 'medium', label: 'Vừa' },
                    { key: 'hard', label: 'Khó' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('difficulty', key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.difficulty || 'medium') === key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ĐIỂM CHIẾN THẮNG */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Timer className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Điểm Thắng</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[5, 7, 11].map((pts) => (
                    <button
                      key={pts}
                      onClick={() => updateSetting('targetScore', pts)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.targetScore || 5) === pts
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {pts} Điểm
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* PAC-MAN */}
          {game.id === 'pacman' && (
            <>
              {/* TỐC ĐỘ DI CHUYỂN */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-yellow-400">
                    <Gauge className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Tốc Độ Game</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { key: 'normal', label: 'Chuẩn' },
                    { key: 'fast', label: 'Nhanh' },
                    { key: 'turbo', label: 'Siêu Tốc' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('speedMode', key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.speedMode || 'normal') === key
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SỐ MẠNG KHỞI ĐẦU */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Số Mạng Sống</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => updateSetting('initialLives', cnt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.initialLives || 3) === cnt
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {cnt} Mạng
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* XẾP KIM CƯƠNG (Jewels) */}
          {game.id === 'jewels' && (
            <>
              {/* CHẾ ĐỘ CHƠI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-fuchsia-400">
                    <Layers className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Chế Độ Chơi</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[
                    { key: 'classic', label: 'Cổ Điển' },
                    { key: 'timed', label: 'Tính Giờ' },
                    { key: 'zen', label: 'Thư Giãn' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => updateSetting('gameMode', key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.gameMode || 'classic') === key
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SỐ LƯỢT ĐI */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                    <Timer className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-200">Giới Hạn Lượt</span>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
                  {[20, 30, 50].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => updateSetting('movesLimit', cnt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        (settings.movesLimit || 30) === cnt
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {cnt} Lượt
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Bar: 2 nút HỦY BỎ và ÁP DỤNG chuẩn logic thiết kế giao diện cài đặt */}
        <div className="h-16 px-5 sm:px-6 border-t border-white/10 bg-slate-900/95 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-gray-300 hover:text-white border border-white/10 text-sm sm:text-base font-bold transition cursor-pointer active:scale-95 shadow-md"
            title="Hủy bỏ mọi thay đổi và đóng cài đặt"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Hủy Bỏ</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95 tracking-wide"
            title="Lưu và áp dụng cài đặt mới"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>Áp Dụng</span>
          </button>
        </div>
      </div>

      {/* SMART FIXED DROPDOWN OVERLAY: Nổi độc lập, không bị overflow-hidden cắt, đè lên mọi card bên dưới nhưng tuyệt đối không chạm cạnh màn hình */}
      {isMusicDropdownOpen && (
        <div
          ref={musicDropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          className="bg-slate-950/98 backdrop-blur-2xl border-2 border-cyan-400/90 rounded-2xl p-1.5 shadow-[0_25px_70px_rgba(0,0,0,0.98)] animate-in fade-in zoom-in-95 duration-150 space-y-1 overflow-hidden select-none"
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-transparent border-transparent hover:bg-slate-900/90 text-gray-200 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm sm:text-base font-bold truncate ${isActive ? 'text-cyan-200' : 'text-white'}`}>
                      {t.title}
                    </span>
                    <span className="text-xs text-gray-300 truncate">
                      {t.desc}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 font-black bg-cyan-950/90 border border-cyan-400/60 px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2 shadow-sm">
                    <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                    <span>Phát</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
