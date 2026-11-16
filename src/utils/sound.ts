// Web Audio API Synthesizer with AudioContext Auto-Unlock & Studio Quality BGM / SFX

export type BgmTrack = 'heroic' | 'lofi' | 'arcade' | 'cyberpunk' | 'zen';

export interface BgmTrackInfo {
  id: BgmTrack;
  title: string;
  desc: string;
  icon: string;
  file: string;
}

export const BGM_TRACKS: BgmTrackInfo[] = [
  { id: 'heroic', title: 'Chiến Khí Hào Hùng', desc: 'Hào sảng, dồn dập', icon: '⚔️', file: '/sounds/bgm_heroic.wav' },
  { id: 'lofi', title: 'Lo-Fi Thư Giãn', desc: 'Êm dịu, nhẹ nhàng', icon: '🎧', file: '/sounds/bgm_lofi.wav' },
  { id: 'arcade', title: 'Retro Synthwave', desc: '8-bit sôi động', icon: '🕹️', file: '/sounds/bgm_arcade.wav' },
  { id: 'cyberpunk', title: 'Cyberpunk Neon', desc: 'Điện tử tương lai', icon: '⚡', file: '/sounds/bgm_cyberpunk.wav' },
  { id: 'zen', title: 'Thiền Cổ Phong', desc: 'Đàn tranh thanh tịnh', icon: '🎋', file: '/sounds/bgm_zen.wav' },
];

export interface GameAudioConfig {
  soundEnabled: boolean;
  sfxVolume: number; // 0 - 100
  musicEnabled: boolean;
  musicVolume: number; // 0 - 100
  bgmTrack: BgmTrack;
}

export const DEFAULT_GAME_TRACKS: Record<string, BgmTrack> = {
  xiangqi: 'heroic',
  chess: 'heroic',
  caro: 'zen',
  breakout: 'arcade',
  'space-shooter': 'cyberpunk',
  spaceshooter: 'cyberpunk',
  snake: 'arcade',
  tetris: 'arcade',
  flappy: 'arcade',
  2048: 'lofi',
  memory: 'zen',
  minesweeper: 'lofi',
  onet: 'lofi',
  sudoku: 'lofi',
  pong: 'arcade',
  pacman: 'arcade',
  jewels: 'arcade',
  'bubble-shooter': 'arcade',
  'gold-miner': 'arcade',
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private lastHoverTime: number = 0;
  private listeners: Array<() => void> = [];

  // VÙNG 1: Âm Thanh Hệ Thống / Giao Diện Web (System & UI Audio)
  // Tuyệt đối không liên quan và không ảnh hưởng tới ván chơi game
  private systemSoundEnabled: boolean = true;
  private systemSoundVolume: number = 85; // 0 - 100
  private systemMusicEnabled: boolean = false;
  private systemMusicVolume: number = 35; // 0 - 100
  private systemMusicTrack: BgmTrack = 'lofi';
  private systemBgmAudio: HTMLAudioElement | null = null;

  // VÙNG 2: Âm Thanh Trận Đấu / Ván Chơi Game (In-Game Audio)
  // Độc lập hoàn toàn, tùy biến và lưu theo từng game riêng biệt
  private activeGameId: string | null = null;
  private activeGameConfig: GameAudioConfig | null = null;
  private gameBgmAudio: HTMLAudioElement | null = null;

  // Audio Buffers Cache for 0ms Low Latency Game Audio
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private rawBuffers: Map<string, ArrayBuffer> = new Map();
  private loadingAudios: Map<string, Promise<AudioBuffer | null>> = new Map();
  private preloaded: boolean = false;

  constructor() {
    try {
      // Load VÙNG 1: System Audio settings
      const savedSysSound = localStorage.getItem('acegames_sys_sound') ?? localStorage.getItem('acegames_sound');
      this.systemSoundEnabled = savedSysSound !== null ? savedSysSound === 'true' : true;
      const savedSysSfxVol = localStorage.getItem('acegames_sys_sound_vol') ?? localStorage.getItem('acegames_sfx_volume');
      if (savedSysSfxVol !== null) this.systemSoundVolume = Math.max(0, Math.min(100, parseFloat(savedSysSfxVol)));

      const savedSysMusic = localStorage.getItem('acegames_sys_music') ?? localStorage.getItem('acegames_music');
      this.systemMusicEnabled = savedSysMusic !== null ? savedSysMusic === 'true' : false;
      const savedSysMusicVol = localStorage.getItem('acegames_sys_music_vol') ?? localStorage.getItem('acegames_music_volume');
      if (savedSysMusicVol !== null) this.systemMusicVolume = Math.max(0, Math.min(100, parseFloat(savedSysMusicVol)));

      const savedSysTrack = (localStorage.getItem('acegames_sys_music_track') ?? localStorage.getItem('acegames_bgm_track')) as BgmTrack;
      if (savedSysTrack && ['heroic', 'lofi', 'arcade', 'cyberpunk', 'zen'].includes(savedSysTrack)) {
        this.systemMusicTrack = savedSysTrack;
      }
    } catch {
      this.systemSoundEnabled = true;
      this.systemSoundVolume = 85;
      this.systemMusicEnabled = false;
      this.systemMusicVolume = 35;
      this.systemMusicTrack = 'lofi';
    }

    // Eagerly prefetch audio files over network immediately so they are hot in memory
    if (typeof window !== 'undefined') {
      this.eagerlyPrefetch();

      // Auto-unlock on first user interaction anywhere in the window
      const unlock = () => {
        this.unlockContext();
        if (this.systemMusicEnabled) {
          this.startSystemBGM(this.systemMusicTrack);
        }
        if (this.activeGameId && this.activeGameConfig?.musicEnabled) {
          this.startGameBGM(this.activeGameId);
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
      window.addEventListener('touchstart', unlock);
    }
  }

  private eagerlyPrefetch() {
    const urls = [
      '/sounds/xiangqi_move.wav',
      '/sounds/xiangqi_capture.wav',
      '/sounds/xiangqi_check.wav',
      '/sounds/chess_move.mp3',
      '/sounds/chess_capture.mp3',
      '/sounds/check.mp3',
      '/sounds/victory.mp3',
      '/sounds/defeat.mp3',
      '/sounds/draw.mp3',
      '/sounds/low_time.wav',
      '/sounds/explosion.mp3',
      '/sounds/notify.mp3',
      '/sounds/dice_roll.wav',
      '/sounds/card_flip.wav',
      '/sounds/wing_flap.wav',
      '/sounds/tetris_clear.wav',
    ];
    urls.forEach(async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          this.rawBuffers.set(url, ab);
          if (this.ctx) {
            const buf = await this.ctx.decodeAudioData(ab.slice(0));
            this.audioBuffers.set(url, buf);
          }
        }
      } catch {}
    });
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {}
    });
  }

  public unlockContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.ctx && !this.preloaded) {
      this.preloaded = true;
      this.preloadGameSounds();
    }

    return this.ctx;
  }

  // =========================================================================
  // VÙNG 1: ÂM THANH HỆ THỐNG / GIAO DIỆN WEB (System & UI Sounds)
  // Tuyệt đối không liên quan và không ảnh hưởng tới ván chơi game
  // =========================================================================
  public getSystemSoundEnabled(): boolean {
    return this.systemSoundEnabled;
  }

  public setSystemSoundEnabled(enabled: boolean) {
    this.systemSoundEnabled = enabled;
    try { localStorage.setItem('acegames_sys_sound', String(enabled)); } catch {}
    this.notify();
    if (enabled) {
      this.unlockContext();
      this.playButtonClick();
    }
  }

  public toggleSystemSound(): boolean {
    this.setSystemSoundEnabled(!this.systemSoundEnabled);
    return this.systemSoundEnabled;
  }

  public getSystemSoundVolume(): number {
    return this.systemSoundVolume;
  }

  public setSystemSoundVolume(percent: number) {
    this.systemSoundVolume = Math.max(0, Math.min(100, Math.round(percent)));
    try { localStorage.setItem('acegames_sys_sound_vol', String(this.systemSoundVolume)); } catch {}
    this.notify();
  }

  public getSystemMusicEnabled(): boolean {
    return this.systemMusicEnabled;
  }

  public setSystemMusicEnabled(enabled: boolean) {
    this.systemMusicEnabled = enabled;
    try { localStorage.setItem('acegames_sys_music', String(enabled)); } catch {}
    this.notify();
    this.unlockContext();
    if (enabled) {
      this.startSystemBGM(this.systemMusicTrack);
      this.playButtonClick();
    } else {
      this.stopSystemBGM();
    }
  }

  public toggleSystemMusic(): boolean {
    this.setSystemMusicEnabled(!this.systemMusicEnabled);
    return this.systemMusicEnabled;
  }

  public getSystemMusicVolume(): number {
    return this.systemMusicVolume;
  }

  public setSystemMusicVolume(percent: number) {
    this.systemMusicVolume = Math.max(0, Math.min(100, Math.round(percent)));
    try { localStorage.setItem('acegames_sys_music_vol', String(this.systemMusicVolume)); } catch {}
    if (this.systemBgmAudio) {
      this.systemBgmAudio.volume = this.systemMusicVolume / 100;
    }
    this.notify();
  }

  public getSystemMusicTrack(): BgmTrack {
    return this.systemMusicTrack;
  }

  public setSystemMusicTrack(track: BgmTrack) {
    this.systemMusicTrack = track;
    try { localStorage.setItem('acegames_sys_music_track', track); } catch {}
    if (this.systemMusicEnabled) {
      this.startSystemBGM(track);
    }
    this.notify();
  }

  public getSystemSfxGain(): number {
    if (!this.systemSoundEnabled) return 0;
    return Math.max(0, Math.min(1, this.systemSoundVolume / 100));
  }


  // =========================================================================
  // VÙNG 2: ÂM THANH TRẬN ĐẤU / VÁN CHƠI GAME (In-Game Audio)
  // Độc lập hoàn toàn, lưu và áp dụng riêng cho từng game
  // =========================================================================
  public setActiveGame(gameId: string | null) {
    this.activeGameId = gameId;
    if (gameId) {
      this.activeGameConfig = this.getGameAudioSettings(gameId);
      if (this.activeGameConfig.musicEnabled) {
        this.startGameBGM(gameId, this.activeGameConfig.bgmTrack);
      } else {
        this.stopGameBGM();
      }
    } else {
      this.activeGameConfig = null;
      this.stopGameBGM();
      if (this.systemMusicEnabled) {
        this.startSystemBGM();
      }
    }
    this.notify();
  }

  public getActiveGameId(): string | null {
    return this.activeGameId;
  }

  public getGameAudioSettings(gameId: string): GameAudioConfig {
    const defaultTrack = DEFAULT_GAME_TRACKS[gameId] || 'arcade';
    try {
      const storageKey = `ace_game_settings_${gameId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          soundEnabled: parsed.sound !== undefined ? Boolean(parsed.sound) : true,
          sfxVolume: parsed.sfxVolume !== undefined ? Number(parsed.sfxVolume) : 85,
          musicEnabled: parsed.music !== undefined ? Boolean(parsed.music) : true,
          musicVolume: parsed.musicVolume !== undefined ? Number(parsed.musicVolume) : 40,
          bgmTrack: parsed.bgmTrack && ['heroic', 'lofi', 'arcade', 'cyberpunk', 'zen'].includes(parsed.bgmTrack) ? parsed.bgmTrack : defaultTrack,
        };
      }
    } catch {}

    return {
      soundEnabled: true,
      sfxVolume: 85,
      musicEnabled: true,
      musicVolume: 40,
      bgmTrack: defaultTrack,
    };
  }

  public saveGameAudioSettings(gameId: string, updates: Partial<GameAudioConfig>): GameAudioConfig {
    const current = this.getGameAudioSettings(gameId);
    const updated: GameAudioConfig = { ...current, ...updates };

    try {
      const storageKey = `ace_game_settings_${gameId}`;
      const saved = localStorage.getItem(storageKey);
      const existingSettings = saved ? JSON.parse(saved) : {};
      const merged = {
        ...existingSettings,
        sound: updated.soundEnabled,
        sfxVolume: updated.sfxVolume,
        music: updated.musicEnabled,
        musicVolume: updated.musicVolume,
        bgmTrack: updated.bgmTrack,
      };
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {}

    if (this.activeGameId === gameId) {
      this.activeGameConfig = updated;
      if (updated.musicEnabled) {
        this.startGameBGM(gameId, updated.bgmTrack);
      } else {
        this.stopGameBGM();
      }
    }

    this.notify();
    return updated;
  }

  public getGameSfxGain(gameId?: string): number {
    const target = gameId || this.activeGameId;
    if (target) {
      const cfg = this.getGameAudioSettings(target);
      if (!cfg.soundEnabled) return 0;
      return Math.max(0, Math.min(1, cfg.sfxVolume / 100));
    }
    return this.getSystemSfxGain();
  }

  public getEffectiveSfxVolume(gameId?: string): number {
    return this.getGameSfxGain(gameId);
  }

  // Alias / Router functions for backward compatibility:
  public isSoundOn(): boolean {
    if (this.activeGameConfig) return this.activeGameConfig.soundEnabled;
    return this.systemSoundEnabled;
  }

  public isMusicOn(): boolean {
    if (this.activeGameConfig) return this.activeGameConfig.musicEnabled;
    return this.systemMusicEnabled;
  }

  public getSoundVolume(): number {
    if (this.activeGameConfig) return this.activeGameConfig.sfxVolume;
    return this.systemSoundVolume;
  }

  public setSoundVolume(percent: number, forGameId?: string) {
    const target = forGameId || this.activeGameId;
    if (target) {
      this.saveGameAudioSettings(target, { sfxVolume: Math.max(0, Math.min(100, Math.round(percent))) });
    } else {
      this.setSystemSoundVolume(percent);
    }
  }

  public getMusicVolume(): number {
    if (this.activeGameConfig) return this.activeGameConfig.musicVolume;
    return this.systemMusicVolume;
  }

  public setMusicVolume(percent: number, forGameId?: string) {
    const target = forGameId || this.activeGameId;
    if (target) {
      this.saveGameAudioSettings(target, { musicVolume: Math.max(0, Math.min(100, Math.round(percent))) });
    } else {
      this.setSystemMusicVolume(percent);
    }
  }

  public getMusicTrack(): BgmTrack {
    if (this.activeGameConfig) return this.activeGameConfig.bgmTrack;
    return this.systemMusicTrack;
  }

  public setMusicTrack(track: BgmTrack, forGameId?: string) {
    const target = forGameId || this.activeGameId;
    if (target) {
      this.saveGameAudioSettings(target, { bgmTrack: track });
    } else {
      this.setSystemMusicTrack(track);
    }
  }

  public toggleSound(forGameId?: string): boolean {
    const target = forGameId || this.activeGameId;
    if (target) {
      const current = this.getGameAudioSettings(target);
      const next = !current.soundEnabled;
      this.saveGameAudioSettings(target, { soundEnabled: next });
      if (next) {
        this.unlockContext();
        this.playButtonClick();
      }
      return next;
    }
    return this.toggleSystemSound();
  }

  public toggleMusic(forGameId?: string): boolean {
    const target = forGameId || this.activeGameId;
    if (target) {
      const current = this.getGameAudioSettings(target);
      const next = !current.musicEnabled;
      this.saveGameAudioSettings(target, { musicEnabled: next });
      this.unlockContext();
      if (next) this.playButtonClick();
      return next;
    }
    return this.toggleSystemMusic();
  }

  // =========================================================================
  // VÙNG 1: NHẠC NỀN CHUNG / SẢNH CHỜ (SYSTEM BGM)
  // Luôn hoạt động độc lập và ổn định khi bật
  // =========================================================================
  public startSystemBGM(track?: BgmTrack) {
    if (track) {
      this.systemMusicTrack = track;
    }
    if (!this.systemMusicEnabled) return;
    if (typeof window === 'undefined') return;

    const trackInfo = BGM_TRACKS.find(t => t.id === this.systemMusicTrack) || BGM_TRACKS[1];
    const targetSrc = trackInfo.file;
    const targetVolume = Math.max(0, Math.min(1, this.systemMusicVolume / 100));

    try {
      if (!this.systemBgmAudio) {
        this.systemBgmAudio = new Audio(targetSrc);
        this.systemBgmAudio.loop = true;
      } else if (!this.systemBgmAudio.src.endsWith(targetSrc)) {
        this.systemBgmAudio.src = targetSrc;
        this.systemBgmAudio.loop = true;
      }
      this.systemBgmAudio.volume = targetVolume;

      const p = this.systemBgmAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          const resume = () => {
            if (this.systemBgmAudio && this.systemMusicEnabled) {
              this.systemBgmAudio.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
          };
          window.addEventListener('pointerdown', resume, { once: true });
          window.addEventListener('keydown', resume, { once: true });
        });
      }
    } catch (e) {
      console.warn('System BGM play error:', e);
    }
  }

  public stopSystemBGM() {
    if (this.systemBgmAudio) {
      try {
        this.systemBgmAudio.pause();
      } catch {}
    }
  }

  // =========================================================================
  // VÙNG 2: NHẠC NỀN TRẬN ĐẤU (GAME BGM)
  // Riêng biệt cho từng trận game
  // =========================================================================
  public startGameBGM(gameId?: string, track?: BgmTrack) {
    const targetId = gameId || this.activeGameId;
    if (!targetId) return;

    const cfg = this.getGameAudioSettings(targetId);
    if (track) {
      cfg.bgmTrack = track;
    }
    if (!cfg.musicEnabled) {
      this.stopGameBGM();
      return;
    }
    if (typeof window === 'undefined') return;

    const trackInfo = BGM_TRACKS.find(t => t.id === cfg.bgmTrack) || BGM_TRACKS[0];
    const targetSrc = trackInfo.file;
    const targetVolume = Math.max(0, Math.min(1, cfg.musicVolume / 100));

    try {
      if (!this.gameBgmAudio) {
        this.gameBgmAudio = new Audio(targetSrc);
        this.gameBgmAudio.loop = true;
      } else if (!this.gameBgmAudio.src.endsWith(targetSrc)) {
        this.gameBgmAudio.src = targetSrc;
        this.gameBgmAudio.loop = true;
      }
      this.gameBgmAudio.volume = targetVolume;

      const p = this.gameBgmAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          const resume = () => {
            if (this.gameBgmAudio && this.activeGameConfig?.musicEnabled) {
              this.gameBgmAudio.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
          };
          window.addEventListener('pointerdown', resume, { once: true });
          window.addEventListener('keydown', resume, { once: true });
        });
      }
    } catch (e) {
      console.warn('Game BGM play error:', e);
    }
  }

  public stopGameBGM() {
    if (this.gameBgmAudio) {
      try {
        this.gameBgmAudio.pause();
      } catch {}
    }
  }

  // Backward compatibility routers
  public startBGM(track?: BgmTrack, _customVolume?: number) {
    if (this.activeGameId) {
      this.startGameBGM(this.activeGameId, track);
    } else {
      this.startSystemBGM(track);
    }
  }

  public stopBGM() {
    this.stopSystemBGM();
    this.stopGameBGM();
  }

  public setBgmContext(category: 'arcade' | 'strategy') {
    const saved = localStorage.getItem('acegames_sys_music_track');
    if (!saved) {
      const defaultTrack: BgmTrack = category === 'strategy' ? 'heroic' : 'arcade';
      if (this.systemMusicTrack !== defaultTrack) {
        this.systemMusicTrack = defaultTrack;
        if (this.systemMusicEnabled) this.startSystemBGM(defaultTrack);
        this.notify();
      }
    }
  }

  // --- UI SOUND EFFECTS (VÙNG 1: System / Web Audio) ---
  public playCardHover() {
    const sfx = this.getSystemSfxGain();
    if (sfx <= 0.001) return;
    const now = Date.now();
    if (now - this.lastHoverTime < 70) return;
    this.lastHoverTime = now;

    try {
      const ctx = this.unlockContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(920, ctx.currentTime + 0.045);

      gain.gain.setValueAtTime(0.06 * sfx, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playButtonClick() {
    const sfx = this.getSystemSfxGain();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.08 * sfx, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.065);
    } catch {}
  }

  public playFavorite() {
    const sfx = this.getSystemSfxGain();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;

      [
        { f: 880, start: 0, dur: 0.12 },
        { f: 1320, start: 0.07, dur: 0.2 },
      ].forEach(tone => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone.f, ctx.currentTime + tone.start);

        gain.gain.setValueAtTime(0.09 * sfx, ctx.currentTime + tone.start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.start + tone.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + tone.start);
        osc.stop(ctx.currentTime + tone.start + tone.dur);
      });
    } catch {}
  }

  public playGameLaunch() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Whoosh sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.24);

      gain.gain.setValueAtTime(0.09 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      // Victory chime chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();

        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.035);

        chordGain.gain.setValueAtTime(0.06 * sfx, now + 0.1 + idx * 0.035);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.035);

        chordOsc.connect(chordGain);
        chordGain.connect(ctx.destination);

        chordOsc.start(now + 0.1 + idx * 0.035);
        chordOsc.stop(now + 0.38 + idx * 0.035);
      });
    } catch {}
  }

  // --- LOW LATENCY BUFFER MANAGEMENT ---
  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.audioBuffers.has(url)) return this.audioBuffers.get(url)!;
    if (this.loadingAudios.has(url)) return this.loadingAudios.get(url)!;

    const promise = (async () => {
      try {
        const ctx = this.unlockContext();
        if (!ctx) return null;
        let arrayBuffer: ArrayBuffer;
        if (this.rawBuffers.has(url)) {
          arrayBuffer = this.rawBuffers.get(url)!.slice(0);
        } else {
          const res = await fetch(url);
          if (!res.ok) return null;
          arrayBuffer = await res.arrayBuffer();
          this.rawBuffers.set(url, arrayBuffer.slice(0));
        }
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(url, buffer);
        return buffer;
      } catch {
        return null;
      }
    })();

    this.loadingAudios.set(url, promise);
    return promise;
  }

  public preloadGameSounds() {
    const urls = [
      '/sounds/xiangqi_move.wav',
      '/sounds/xiangqi_capture.wav',
      '/sounds/xiangqi_check.wav',
      '/sounds/chess_move.mp3',
      '/sounds/chess_capture.mp3',
      '/sounds/check.mp3',
      '/sounds/victory.mp3',
      '/sounds/defeat.mp3',
      '/sounds/draw.mp3',
      '/sounds/low_time.wav',
      '/sounds/explosion.mp3',
      '/sounds/notify.mp3',
      '/sounds/dice_roll.wav',
      '/sounds/card_flip.wav',
      '/sounds/wing_flap.wav',
      '/sounds/tetris_clear.wav',
    ];
    urls.forEach(u => this.loadAudioBuffer(u));
  }

  private playSoundFile(url: string, volume: number = 0.6, fallbackSynth?: () => void) {
    const effectiveSfx = this.getEffectiveSfxVolume();
    if (effectiveSfx <= 0.001) return;
    const ctx = this.unlockContext();
    if (!ctx) return;

    const effectiveVolume = Math.max(0, Math.min(1, volume * effectiveSfx));
    if (effectiveVolume <= 0.001) return;

    const buffer = this.audioBuffers.get(url);
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(effectiveVolume, ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
        return;
      } catch {}
    } else {
      this.loadAudioBuffer(url).then(buf => {
        if (buf && this.ctx && this.isSoundOn()) {
          try {
            const source = this.ctx.createBufferSource();
            const gainNode = this.ctx.createGain();
            source.buffer = buf;
            gainNode.gain.setValueAtTime(effectiveVolume, this.ctx.currentTime);
            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            source.start();
          } catch {}
        }
      });
    }

    if (fallbackSynth) fallbackSynth();
  }

  // --- GAME-SPECIFIC DEDICATED SFX (Áp dụng riêng cho từng trò chơi) ---

  // 1. Phá Gạch (Breakout)
  public playBreakoutPaddle() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);
      gain.gain.setValueAtTime(0.25 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}
  }

  public playBreakoutBrick(combo: number = 0) {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const baseFreq = Math.min(1800, 520 + combo * 55);

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(baseFreq * 2.2, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.07);
      gain1.gain.setValueAtTime(0.22 * sfx, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.095);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq, now);
      gain2.gain.setValueAtTime(0.28 * sfx, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.085);
    } catch {}
  }

  // 2. Rắn Săn Mồi (Snake)
  public playSnakeEat() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(360, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain1.gain.setValueAtTime(0.26 * sfx, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.075);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.03);
      gain2.gain.setValueAtTime(0.18 * sfx, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.115);
    } catch {}
  }

  // 3. Xếp Gạch (Tetris)
  public playTetrisMove() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public playTetrisRotate() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
      gain.gain.setValueAtTime(0.18 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {}
  }

  public playTetrisDrop() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);
      gain.gain.setValueAtTime(0.28 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {}
  }

  // 4. Game 2048
  public play2048Slide() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
      gain.gain.setValueAtTime(0.14 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  public play2048Merge(addedScore: number = 2) {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const step = Math.min(10, Math.floor(Math.log2(Math.max(2, addedScore))));
      const baseFreq = 392 * Math.pow(1.05946, step);

      [baseFreq, baseFreq * 1.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.03);
        gain.gain.setValueAtTime(0.2 * sfx, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + idx * 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + 0.18 + idx * 0.03);
      });
    } catch {}
  }

  // 5. Phi Thuyền / Bắn Ruồi (Space Shooter)
  public playLaser() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.18 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playPowerup() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18 * sfx, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.11);
      });
    } catch {}
  }

  // 6. Dò Mìn (Minesweeper)
  public playMinesweeperClick() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.03);
      gain.gain.setValueAtTime(0.16 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  public playMinesweeperFlag() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.05);
      gain.gain.setValueAtTime(0.2 * sfx, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  // 7. Lật Bài (Memory)
  public playCardMatch() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18 * sfx, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.22);
      });
    } catch {}
  }

  // 8. Flappy Bird
  public playFlappyScore() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [987.77, 1318.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);
        gain.gain.setValueAtTime(0.2 * sfx, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.16);
      });
    } catch {}
  }

  // 9. Cờ Caro (Gomoku)
  public playCaroStone() {
    this.playSoundFile('/sounds/chess_move.mp3', 0.85, () => {
      this.synthWoodClick(580, 0.04);
    });
  }

  public playCaroCheck() {
    this.playSoundFile('/sounds/check.mp3', 0.9, () => {
      this.synthCheckAlert();
    });
  }

  // --- GAME SPECIFIC AUDIO METHODS ---
  public playXiangqiMove() {
    this.playSoundFile('/sounds/xiangqi_move.wav', 0.85, () => {
      this.synthWoodClick(480, 0.06);
    });
  }

  public playXiangqiCapture() {
    this.playSoundFile('/sounds/xiangqi_capture.wav', 0.9, () => {
      this.synthWoodCrack(320, 0.1);
    });
  }

  public playXiangqiCheck() {
    this.playSoundFile('/sounds/xiangqi_check.wav', 1.0, () => {
      this.synthCheckAlert();
    });
  }

  public playChessMove() {
    this.playSoundFile('/sounds/chess_move.mp3', 0.8, () => {
      this.synthWoodClick(520, 0.05);
    });
  }

  public playChessCapture() {
    this.playSoundFile('/sounds/chess_capture.mp3', 0.9, () => {
      this.synthWoodCrack(340, 0.08);
    });
  }

  public playCheck() {
    this.playSoundFile('/sounds/check.mp3', 1.0, () => {
      this.synthCheckAlert();
    });
  }

  public playVictory() {
    this.playSoundFile('/sounds/victory.mp3', 0.85, () => {
      this.playGameLaunch();
    });
  }

  public playDefeat() {
    this.playSoundFile('/sounds/defeat.mp3', 0.85, () => {
      this.synthDefeat();
    });
  }

  public playDraw() {
    this.playSoundFile('/sounds/draw.mp3', 0.8, () => {
      this.synthDraw();
    });
  }

  public playLowTime() {
    this.playSoundFile('/sounds/low_time.wav', 0.8, () => {
      this.synthBeep(880, 0.05);
    });
  }

  public playDiceRoll() {
    this.playSoundFile('/sounds/dice_roll.wav', 0.85, () => {
      this.playButtonClick();
    });
  }

  public playCardFlip() {
    this.playSoundFile('/sounds/card_flip.wav', 0.75, () => {
      this.playCardHover();
    });
  }

  public playWingFlap() {
    this.playSoundFile('/sounds/wing_flap.wav', 0.8, () => {
      this.playCardHover();
    });
  }

  public playTetrisClear() {
    this.playSoundFile('/sounds/tetris_clear.wav', 0.85, () => {
      this.playGameLaunch();
    });
  }

  public playStoneDrop() {
    this.playSoundFile('/sounds/chess_move.mp3', 0.85, () => {
      this.synthWoodClick(560, 0.05);
    });
  }

  public playExplosion() {
    this.playSoundFile('/sounds/explosion.mp3', 0.85, () => {
      this.synthExplosion();
    });
  }

  public playNotify() {
    this.playSoundFile('/sounds/notify.mp3', 0.75, () => {
      this.playButtonClick();
    });
  }

  // Studio-Grade Synthesized Fallbacks (Epic, Sharp, Heroic Acoustics)
  private synthWoodClick(freq: number = 430, dur: number = 0.09) {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // 1. Hardwood surface strike click (sharp chirp 3200Hz -> 400Hz)
      const oscClick = this.ctx.createOscillator();
      const gainClick = this.ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(3200, now);
      oscClick.frequency.exponentialRampToValueAtTime(380, now + 0.03);
      gainClick.gain.setValueAtTime(0.22 * sfx, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + dur);
      oscClick.connect(gainClick);
      gainClick.connect(this.ctx.destination);
      oscClick.start(now);
      oscClick.stop(now + dur);

      // 2. Resonant hardwood body (430Hz)
      const oscBody = this.ctx.createOscillator();
      const gainBody = this.ctx.createGain();
      oscBody.type = 'sine';
      oscBody.frequency.setValueAtTime(freq, now);
      gainBody.gain.setValueAtTime(0.25 * sfx, now);
      gainBody.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.2);
      oscBody.connect(gainBody);
      gainBody.connect(this.ctx.destination);
      oscBody.start(now);
      oscBody.stop(now + dur * 1.25);

      // 3. Board thump (100Hz)
      const oscThump = this.ctx.createOscillator();
      const gainThump = this.ctx.createGain();
      oscThump.type = 'sine';
      oscThump.frequency.setValueAtTime(110, now);
      oscThump.frequency.exponentialRampToValueAtTime(80, now + dur);
      gainThump.gain.setValueAtTime(0.18 * sfx, now);
      gainThump.gain.exponentialRampToValueAtTime(0.001, now + dur);
      oscThump.connect(gainThump);
      gainThump.connect(this.ctx.destination);
      oscThump.start(now);
      oscThump.stop(now + dur + 0.01);
    } catch {}
  }

  private synthWoodCrack(freq: number = 320, dur: number = 0.15) {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Piercing hardwood collision snap
      const oscSnap = this.ctx.createOscillator();
      const gainSnap = this.ctx.createGain();
      oscSnap.type = 'sawtooth';
      oscSnap.frequency.setValueAtTime(3800, now);
      oscSnap.frequency.exponentialRampToValueAtTime(260, now + 0.05);
      gainSnap.gain.setValueAtTime(0.3 * sfx, now);
      gainSnap.gain.exponentialRampToValueAtTime(0.001, now + dur);
      oscSnap.connect(gainSnap);
      gainSnap.connect(this.ctx.destination);
      oscSnap.start(now);
      oscSnap.stop(now + dur);

      // Heavy body impact (320Hz & 540Hz)
      [freq, freq * 1.68].forEach(f => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.24 * sfx, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + dur * 1.35);
      });

      // Sub-bass heavy wood thump (75Hz)
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(85, now);
      oscSub.frequency.exponentialRampToValueAtTime(60, now + dur * 1.4);
      gainSub.gain.setValueAtTime(0.28 * sfx, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.4);
      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + dur * 1.45);
    } catch {}
  }

  // Epic Chiếu Tướng (Heroic Sword Slash + Ancient Bronze Gong)
  private synthCheckAlert() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // 1. Razor-sharp sword slash gleam (SHING! - FM metallic harmonics)
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const swordGain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(2800, now);
      carrier.frequency.exponentialRampToValueAtTime(3600, now + 0.12);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(1400, now);
      modGain.gain.setValueAtTime(1200, now);
      modGain.gain.exponentialRampToValueAtTime(10, now + 0.35);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      swordGain.gain.setValueAtTime(0.28 * sfx, now);
      swordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      carrier.connect(swordGain);
      swordGain.connect(this.ctx.destination);

      modulator.start(now);
      carrier.start(now);
      modulator.stop(now + 0.46);
      carrier.stop(now + 0.46);

      // High blade shimmer (4400Hz, 6600Hz)
      [4400, 6600].forEach(f => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.08 * sfx, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });

      // 2. Resonant ancient bronze war gong chord (164Hz, 328Hz, 492Hz)
      [164, 328, 492, 720].forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime((0.18 / (idx + 1)) * sfx, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.9);
      });

      // 3. Piece strike anchor at 0ms
      this.synthWoodCrack(340, 0.1);
    } catch {}
  }

  private synthDefeat() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Deep cinematic boom + mournful brass descent
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(75, now);
      oscBoom.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gainBoom.gain.setValueAtTime(0.25 * sfx, now);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      oscBoom.connect(gainBoom);
      gainBoom.connect(this.ctx.destination);
      oscBoom.start(now);
      oscBoom.stop(now + 0.82);

      [261.63, 246.94, 220.00, 196.00].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);
        gain.gain.setValueAtTime(0.1 * sfx, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.36);
      });
    } catch {}
  }

  private synthDraw() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 440].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.08 * sfx, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.16);
      });
    } catch {}
  }

  private synthBeep(freq: number, dur: number) {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.07 * sfx, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur + 0.01);
    } catch {}
  }

  private synthExplosion() {
    const sfx = this.getEffectiveSfxVolume();
    if (sfx <= 0.001 || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15 * sfx, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.31);
    } catch {}
  }
}

export const soundManager = new SoundManager();
