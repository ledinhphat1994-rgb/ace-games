// Web Audio API Synthesizer for high-performance, zero-latency gaming UI sound effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastHoverTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('acegames_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.enabled = true;
    }
  }

  private initContext(): AudioContext | null {
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
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('acegames_sound_enabled', String(val));
    } catch {}
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.playButtonClick();
    }
    return this.enabled;
  }

  /**
   * Crisp, subtle micro-blip when hovering over game cards or buttons
   */
  public playCardHover() {
    if (!this.enabled) return;
    const now = Date.now();
    // Throttle hover sounds so rapid mouse movement doesn't create harsh noise
    if (now - this.lastHoverTime < 60) return;
    this.lastHoverTime = now;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.045);
    } catch {}
  }

  /**
   * Tactile click when pressing a button or switching categories
   */
  public playButtonClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.065);
    } catch {}
  }

  /**
   * Fun, sweet bell chime when bookmarking / favoriting a game
   */
  public playFavorite() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // Two harmonic notes (Ding-Dong)
      [
        { f: 880, start: 0, dur: 0.12 },
        { f: 1320, start: 0.06, dur: 0.18 },
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

  /**
   * Epic, exciting arcade riser sound when launching a game!
   */
  public playGameLaunch() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Whoosh sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Sparkle chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();

        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, now + 0.12 + idx * 0.03);

        chordGain.gain.setValueAtTime(0.05, now + 0.12 + idx * 0.03);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.03);

        chordOsc.connect(chordGain);
        chordGain.connect(ctx.destination);

        chordOsc.start(now + 0.12 + idx * 0.03);
        chordOsc.stop(now + 0.36 + idx * 0.03);
      });
    } catch {}
  }
}

export const soundManager = new SoundManager();
