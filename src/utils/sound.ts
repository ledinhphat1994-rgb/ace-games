// Web Audio API Synthesizer with AudioContext Auto-Unlock & Retro Arcade BGM

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private lastHoverTime: number = 0;
  private listeners: Array<() => void> = [];

  // BGM Synthesizer state
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private bgmGain: GainNode | null = null;

  // Retro chill arcade melody (pentatonic notes in Hz)
  private readonly bgmMelody = [
    261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
    293.66, 349.23, 440.00, 587.33, 440.00, 349.23,
    220.00, 261.63, 329.63, 440.00, 329.63, 261.63,
    196.00, 246.94, 293.66, 392.00, 293.66, 246.94,
  ];

  // Audio Buffers Cache for 0ms Low Latency Game Audio
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private rawBuffers: Map<string, ArrayBuffer> = new Map();
  private loadingAudios: Map<string, Promise<AudioBuffer | null>> = new Map();

  constructor() {
    try {
      const savedSound = localStorage.getItem('acegames_sound');
      this.soundEnabled = savedSound !== null ? savedSound === 'true' : true;
      const savedMusic = localStorage.getItem('acegames_music');
      this.musicEnabled = savedMusic !== null ? savedMusic === 'true' : false;
    } catch {
      this.soundEnabled = true;
      this.musicEnabled = false;
    }

    // Eagerly prefetch audio files over network immediately so they are hot in memory
    if (typeof window !== 'undefined') {
      this.eagerlyPrefetch();

      // Auto-unlock on first user interaction anywhere in the window
      const unlock = () => {
        this.unlockContext();
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
      '/sounds/low_time.mp3',
      '/sounds/explosion.mp3',
      '/sounds/notify.mp3',
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

    // If music was enabled, start playing
    if (this.musicEnabled && !this.bgmTimer) {
      this.startBGM();
    }

    return this.ctx;
  }

  public isSoundOn(): boolean {
    return this.soundEnabled;
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem('acegames_sound', String(this.soundEnabled));
    } catch {}
    this.notify();
    if (this.soundEnabled) {
      this.unlockContext();
      this.playButtonClick();
    }
    return this.soundEnabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('acegames_music', String(this.musicEnabled));
    } catch {}
    this.notify();
    this.unlockContext();

    if (this.musicEnabled) {
      this.startBGM();
      this.playButtonClick();
    } else {
      this.stopBGM();
    }
    return this.musicEnabled;
  }

  // --- BACKGROUND MUSIC SYNTHESIZER ---
  private startBGM() {
    this.stopBGM();
    if (!this.musicEnabled) return;
    const ctx = this.unlockContext();
    if (!ctx) return;

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.025, ctx.currentTime); // gentle background level
    this.bgmGain.connect(ctx.destination);

    const tempoMs = 180; // ~160 BPM

    this.bgmTimer = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.bgmGain) return;
      try {
        const now = this.ctx.currentTime;
        const freq = this.bgmMelody[this.bgmStep % this.bgmMelody.length];
        this.bgmStep++;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Soft warm triangle wave
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Pluck envelope
        noteGain.gain.setValueAtTime(0.035, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 0.17);
      } catch {}
    }, tempoMs);
  }

  private stopBGM() {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {}
      this.bgmGain = null;
    }
  }

  // --- UI SOUND EFFECTS ---
  public playCardHover() {
    if (!this.soundEnabled) return;
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

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playButtonClick() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.unlockContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.065);
    } catch {}
  }

  public playFavorite() {
    if (!this.soundEnabled) return;
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

        gain.gain.setValueAtTime(0.09, ctx.currentTime + tone.start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.start + tone.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + tone.start);
        osc.stop(ctx.currentTime + tone.start + tone.dur);
      });
    } catch {}
  }

  public playGameLaunch() {
    if (!this.soundEnabled) return;
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

      gain.gain.setValueAtTime(0.09, now);
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

        chordGain.gain.setValueAtTime(0.06, now + 0.1 + idx * 0.035);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.035);

        chordOsc.connect(chordGain);
        chordGain.connect(ctx.destination);

        chordOsc.start(now + 0.1 + idx * 0.035);
        chordOsc.stop(now + 0.38 + idx * 0.035);
      });
    } catch {}
  }

  // --- LOW LATENCY BUFFER MANAGEMENT ---
  private preloaded: boolean = false;

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
      '/sounds/low_time.mp3',
      '/sounds/explosion.mp3',
      '/sounds/notify.mp3',
    ];
    urls.forEach(u => this.loadAudioBuffer(u));
  }

  private playSoundFile(url: string, volume: number = 0.6, fallbackSynth?: () => void) {
    if (!this.soundEnabled) return;
    const ctx = this.unlockContext();
    if (!ctx) return;

    const buffer = this.audioBuffers.get(url);
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        source.buffer = buffer;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
        return;
      } catch {}
    } else {
      this.loadAudioBuffer(url).then(buf => {
        if (buf && this.ctx && this.soundEnabled) {
          try {
            const source = this.ctx.createBufferSource();
            const gainNode = this.ctx.createGain();
            source.buffer = buf;
            gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            source.start();
          } catch {}
        }
      });
    }

    if (fallbackSynth) fallbackSynth();
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
    this.playSoundFile('/sounds/low_time.mp3', 0.65, () => {
      this.synthBeep(880, 0.05);
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
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // 1. Hardwood surface strike click (sharp chirp 3200Hz -> 400Hz)
      const oscClick = this.ctx.createOscillator();
      const gainClick = this.ctx.createGain();
      oscClick.type = 'triangle';
      oscClick.frequency.setValueAtTime(3200, now);
      oscClick.frequency.exponentialRampToValueAtTime(380, now + 0.03);
      gainClick.gain.setValueAtTime(0.22, now);
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
      gainBody.gain.setValueAtTime(0.25, now);
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
      gainThump.gain.setValueAtTime(0.18, now);
      gainThump.gain.exponentialRampToValueAtTime(0.001, now + dur);
      oscThump.connect(gainThump);
      gainThump.connect(this.ctx.destination);
      oscThump.start(now);
      oscThump.stop(now + dur + 0.01);
    } catch {}
  }

  private synthWoodCrack(freq: number = 320, dur: number = 0.15) {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Piercing hardwood collision snap
      const oscSnap = this.ctx.createOscillator();
      const gainSnap = this.ctx.createGain();
      oscSnap.type = 'sawtooth';
      oscSnap.frequency.setValueAtTime(3800, now);
      oscSnap.frequency.exponentialRampToValueAtTime(260, now + 0.05);
      gainSnap.gain.setValueAtTime(0.3, now);
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
        gain.gain.setValueAtTime(0.24, now);
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
      gainSub.gain.setValueAtTime(0.28, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.4);
      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + dur * 1.45);
    } catch {}
  }

  // Epic Chiếu Tướng (Heroic Sword Slash + Ancient Bronze Gong)
  private synthCheckAlert() {
    if (!this.soundEnabled || !this.ctx) return;
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

      swordGain.gain.setValueAtTime(0.28, now);
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
        gain.gain.setValueAtTime(0.08, now);
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
        gain.gain.setValueAtTime(0.18 / (idx + 1), now);
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
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Deep cinematic boom + mournful brass descent
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(75, now);
      oscBoom.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gainBoom.gain.setValueAtTime(0.25, now);
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
        gain.gain.setValueAtTime(0.1, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.36);
      });
    } catch {}
  }

  private synthDraw() {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 440].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.08, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.16);
      });
    } catch {}
  }

  private synthBeep(freq: number, dur: number) {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur + 0.01);
    } catch {}
  }

  private synthExplosion() {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.31);
    } catch {}
  }
}

export const soundManager = new SoundManager();
