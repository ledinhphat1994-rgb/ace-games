import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  X, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Bot, 
  Users, 
  Gauge, 
  Grid3X3, 
  Layers, 
  Eye, 
  Sparkles,
  Zap,
  Check,
  Timer
} from 'lucide-react';
import type { GameInfo } from '../types/game';
import { soundManager } from '../utils/sound';

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
  // Load saved settings for this specific game
  const storageKey = `ace_game_settings_${game.id}`;
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return soundManager.isSoundOn();
  });

  const [justSaved, setJustSaved] = useState(false);

  // Sync when game changes or modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(storageKey);
        setSettings(saved ? JSON.parse(saved) : {});
      } catch {
        setSettings({});
      }
      setSoundEnabled(soundManager.isSoundOn());
    }
  }, [isOpen, storageKey]);

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

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const toggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
    updateSetting('sound', newState);
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
    window.dispatchEvent(
      new CustomEvent('ace-game-setting-changed', {
        detail: { gameId: game.id, key: 'RESET', value: null, allSettings: {} },
      })
    );
    onRestartGame();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleClose = () => {
    soundManager.playButtonClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] to-[#070b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Settings className="w-5 h-5 text-cyan-400 rotate-45 transition-transform" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Orbitron'] flex items-center gap-2">
                <span>THIẾT LẬP GAME</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-sans">
                  <span>{game.thumbnailIcon}</span>
                  <span>{game.title}</span>
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                Tùy chỉnh chế độ, luật chơi & giao diện riêng
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-left">
          
          {/* Âm thanh riêng của game */}
          <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-white/5">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-gray-200 tracking-wider">
                  Hiệu Ứng Âm Thanh Game
                </h4>
                <p className="text-[11px] text-gray-400">
                  {soundEnabled ? 'Đang bật âm thanh nước đi & va chạm' : 'Đã tắt tiếng trong trò chơi'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-slate-800 text-gray-500 border border-slate-700'
              }`}
            >
              {soundEnabled ? 'BẬT' : 'TẮT'}
            </button>
          </div>

          {/* Cài đặt chuyên sâu theo từng Game */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-['Orbitron']">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tùy Chọn Chuyên Sâu ({game.title})</span>
            </h4>

            {/* CỜ TƯỚNG (Xiangqi) */}
            {game.id === 'xiangqi' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Chế Độ Chơi</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => updateSetting('mode', 'ai')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        (settings.mode || 'ai') === 'ai'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Đấu Máy
                    </button>
                    <button
                      onClick={() => updateSetting('mode', 'pvp')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        settings.mode === 'pvp'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      2 Người
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>Cấp Độ Máy (AI)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { level: 1, label: 'Dễ' },
                      { level: 2, label: 'Vừa' },
                      { level: 3, label: 'Khó' },
                    ].map(({ level, label }) => (
                      <button
                        key={level}
                        onClick={() => updateSetting('aiLevel', level)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Gợi Ý Nước Đi Hợp Lệ</span>
                  </div>
                  <button
                    onClick={() => updateSetting('showHints', settings.showHints !== false ? false : true)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.showHints !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    {settings.showHints !== false ? 'Hiện' : 'Ẩn'}
                  </button>
                </div>

                {/* Thời gian chờ suy nghĩ cho mỗi lượt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Timer className="w-4 h-4 text-purple-400" />
                    <span>Thời Gian Chờ Suy Nghĩ</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 flex-wrap">
                    {[
                      { val: 0, label: 'Vô Hạn' },
                      { val: 30, label: '30s' },
                      { val: 60, label: '60s' },
                      { val: 90, label: '90s' },
                      { val: 120, label: '120s' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => updateSetting('timeLimit', val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          (settings.timeLimit !== undefined ? settings.timeLimit : 60) === val
                            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CỜ VUA (Chess) */}
            {game.id === 'chess' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Chế Độ Chơi</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => updateSetting('mode', 'ai')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        (settings.mode || 'ai') === 'ai'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Đấu Máy
                    </button>
                    <button
                      onClick={() => updateSetting('mode', 'pvp')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        settings.mode === 'pvp'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      2 Người
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>Độ Khó AI</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { level: 1, label: 'Dễ' },
                      { level: 2, label: 'Vừa' },
                      { level: 3, label: 'Khó' },
                    ].map(({ level, label }) => (
                      <button
                        key={level}
                        onClick={() => updateSetting('aiLevel', level)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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

                {/* Thời gian chờ suy nghĩ cho mỗi lượt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Timer className="w-4 h-4 text-purple-400" />
                    <span>Thời Gian Chờ Suy Nghĩ</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 flex-wrap">
                    {[
                      { val: 0, label: 'Vô Hạn' },
                      { val: 30, label: '30s' },
                      { val: 60, label: '60s' },
                      { val: 90, label: '90s' },
                      { val: 120, label: '120s' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => updateSetting('timeLimit', val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          (settings.timeLimit !== undefined ? settings.timeLimit : 60) === val
                            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CỜ CARO */}
            {game.id === 'caro' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                    <span>Kích Thước Bàn Cờ</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => {
                        updateSetting('boardSize', 3);
                        onRestartGame();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        settings.boardSize === 3
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      3x3 (Cổ Điển)
                    </button>
                    <button
                      onClick={() => {
                        updateSetting('boardSize', 10);
                        onRestartGame();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        (settings.boardSize || 10) === 10
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      10x10 (Chuẩn 5 Ô)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Chế Độ Chơi</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => updateSetting('mode', 'ai')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        (settings.mode || 'ai') === 'ai'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Đấu Máy
                    </button>
                    <button
                      onClick={() => updateSetting('mode', 'pvp')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        settings.mode === 'pvp'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      2 Người
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>Trình Độ AI</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => updateSetting('difficulty', 'EASY')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        settings.difficulty === 'EASY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Dễ
                    </button>
                    <button
                      onClick={() => updateSetting('difficulty', 'UNBEATABLE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        (settings.difficulty || 'UNBEATABLE') === 'UNBEATABLE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Khó (AI Bất Khả)
                    </button>
                  </div>
                </div>

                {/* Thời gian chờ suy nghĩ cho mỗi lượt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Timer className="w-4 h-4 text-purple-400" />
                    <span>Thời Gian Chờ Suy Nghĩ</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10 flex-wrap">
                    {[
                      { val: 0, label: 'Vô Hạn' },
                      { val: 30, label: '30s' },
                      { val: 60, label: '60s' },
                      { val: 90, label: '90s' },
                      { val: 120, label: '120s' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => updateSetting('timeLimit', val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          (settings.timeLimit !== undefined ? settings.timeLimit : 60) === val
                            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* XẾP GẠCH (Tetris) */}
            {game.id === 'tetris' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Cấp Độ Khởi Đầu</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[1, 5, 10].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => updateSetting('startLevel', lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Chiếu Bóng Vị Trí Rơi (Ghost)</span>
                  </div>
                  <button
                    onClick={() => updateSetting('ghostPiece', settings.ghostPiece !== false ? false : true)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.ghostPiece !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    {settings.ghostPiece !== false ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>
            )}

            {/* RẮN SĂN MỒI (Snake) */}
            {game.id === 'snake' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Tốc Độ Rắn</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { key: 'slow', label: 'Chậm' },
                      { key: 'normal', label: 'Vừa' },
                      { key: 'fast', label: 'Nhanh' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting('speed', key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Đi Xuyên Tường</span>
                  </div>
                  <button
                    onClick={() => updateSetting('wrapWalls', !settings.wrapWalls)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.wrapWalls
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    {settings.wrapWalls ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>
            )}

            {/* DÒ MÌN (Minesweeper) */}
            {game.id === 'minesweeper' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Độ Khó Bãi Mìn</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { key: 'easy', label: 'Dễ (8x8)' },
                      { key: 'medium', label: 'Vừa (12x12)' },
                      { key: 'hard', label: 'Khó (16x16)' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          updateSetting('difficulty', key);
                          onRestartGame();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
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
              </div>
            )}

            {/* PHÁ GẠCH (Breakout) */}
            {game.id === 'breakout' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Tốc Độ Bóng</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { key: 'normal', label: 'Tiêu Chuẩn' },
                      { key: 'fast', label: 'Siêu Tốc' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting('ballSpeed', key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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
              </div>
            )}

            {/* 2048 */}
            {game.id === '2048' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Tốc Độ Lướt Gạch</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { key: 'normal', label: 'Mượt Mà' },
                      { key: 'fast', label: 'Tức Thì' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting('slideSpeed', key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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
              </div>
            )}

            {/* CHIẾN CƠ KHÔNG GIAN (Space Shooter) */}
            {game.id === 'space-shooter' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Tự Động Xả Đạn (Auto-Fire)</span>
                  </div>
                  <button
                    onClick={() => updateSetting('autoFire', settings.autoFire !== false ? false : true)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.autoFire !== false
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-gray-400'
                    }`}
                  >
                    {settings.autoFire !== false ? 'Bật' : 'Tắt'}
                  </button>
                </div>
              </div>
            )}

            {/* LẬT HÌNH (Memory) */}
            {game.id === 'memory' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Grid3X3 className="w-4 h-4 text-cyan-400" />
                    <span>Số Lượng Thẻ Bài</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { count: 16, label: '16 Ô (8 Cặp)' },
                      { count: 36, label: '36 Ô (18 Cặp)' },
                    ].map(({ count, label }) => (
                      <button
                        key={count}
                        onClick={() => {
                          updateSetting('cardCount', count);
                          onRestartGame();
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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
              </div>
            )}

            {/* FLAPPY BIRD */}
            {game.id === 'flappy' && (
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <span>Độ Thử Thách Ống Bay</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    {[
                      { key: 'normal', label: 'Chuẩn' },
                      { key: 'hard', label: 'Cực Hạn' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSetting('difficulty', key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
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
              </div>
            )}

          </div>

          {/* Toast thông báo đã lưu */}
          {justSaved && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Đã lưu cài đặt cho {game.title}!</span>
            </div>
          )}

          {/* Nút Hành Động Lớn */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleRestart}
              className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-slate-950" />
              <span>Khởi Động Lại Ván Game</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer active:scale-95"
              title="Khôi phục mọi thiết lập về mặc định ban đầu"
            >
              Mặc Định
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
