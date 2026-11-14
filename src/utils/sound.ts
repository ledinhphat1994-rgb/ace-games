// Web Audio API Synthesizer with AudioContext Auto-Unlock & Retro Arcade BGM

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = false;
  private lastHoverTime: number = 0;

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

    // Auto-unlock on first user interaction anywhere in the window
    if (typeof window !== 'undefined') {
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
}

export const soundManager = new SoundManager();
