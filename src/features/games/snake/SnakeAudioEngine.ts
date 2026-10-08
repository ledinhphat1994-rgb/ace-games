// src/features/games/snake/SnakeAudioEngine.ts
// Digital Campus v2: Web Audio Synthesizer for Snake Game
// Cung cấp hiệu ứng âm thanh (SFX) sinh động và nhạc nền (BGM) vui tươi 100% bằng Web Audio API

export interface SnakeAudioSettings {
  bgmEnabled: boolean
  sfxEnabled: boolean
  bgmVolume: number // 0.0 - 1.0
  sfxVolume: number // 0.0 - 1.0
  musicEnabled: boolean
  musicVolume: number
}

const STORAGE_KEY = 'dc_snake_audio_v2'

export function loadAudioSettings(): SnakeAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const bgm = Boolean(parsed.bgmEnabled ?? parsed.musicEnabled ?? false)
      const vol = typeof parsed.bgmVolume === 'number' ? Math.max(0, Math.min(1, parsed.bgmVolume)) : (typeof parsed.musicVolume === 'number' ? Math.max(0, Math.min(1, parsed.musicVolume)) : 0.35)
      return {
        bgmEnabled: bgm,
        musicEnabled: bgm,
        sfxEnabled: Boolean(parsed.sfxEnabled ?? true),
        bgmVolume: vol,
        musicVolume: vol,
        sfxVolume: typeof parsed.sfxVolume === 'number' ? Math.max(0, Math.min(1, parsed.sfxVolume)) : 0.5,
      }
    }
  } catch {}
  return {
    bgmEnabled: false,
    musicEnabled: false,
    sfxEnabled: true,
    bgmVolume: 0.35,
    musicVolume: 0.35,
    sfxVolume: 0.5,
  }
}

export function saveAudioSettings(settings: SnakeAudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

class SnakeAudioEngineClass {
  private ctx: AudioContext | null = null
  private settings: SnakeAudioSettings = loadAudioSettings()
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private isBgmPlaying = false
  private bgmTimer: number | null = null
  private currentNoteIndex = 0

  // Giai điệu BGM vui tươi Arcade (nốt nhạc tính theo tần số Hz)
  // Giai điệu Pop vui nhộn phong cách Arcade Snake
  private readonly melodyNotes = [
    // Đoạn 1 (C major upbeat)
    523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 523.25,
    587.33, 698.46, 880.00, 698.46, 783.99, 659.25, 587.33, 523.25,
    // Đoạn 2 (A minor / F major lift)
    440.00, 523.25, 659.25, 523.25, 698.46, 659.25, 523.25, 440.00,
    783.99, 880.00, 987.77, 880.00, 1046.50, 987.77, 783.99, 659.25,
  ]

  private readonly bassNotes = [
    130.81, 130.81, 164.81, 164.81, 174.61, 174.61, 196.00, 196.00,
    110.00, 110.00, 130.81, 130.81, 174.61, 174.61, 196.00, 196.00,
  ]

  private initContext() {
    if (this.ctx) return
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    this.ctx = new AudioContextClass()

    this.bgmGain = this.ctx.createGain()
    this.bgmGain.gain.setValueAtTime(this.settings.bgmVolume * (this.settings.bgmEnabled ? 1 : 0), this.ctx.currentTime)
    this.bgmGain.connect(this.ctx.destination)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume * (this.settings.sfxEnabled ? 1 : 0), this.ctx.currentTime)
    this.sfxGain.connect(this.ctx.destination)
  }

  public getSettings(): SnakeAudioSettings {
    return {
      ...this.settings,
      musicEnabled: this.settings.bgmEnabled,
      musicVolume: this.settings.bgmVolume,
    }
  }

  public toggleMusic(): boolean {
    const next = !this.settings.bgmEnabled
    this.updateSettings({ bgmEnabled: next })
    return next
  }

  public toggleSfx(): boolean {
    const next = !this.settings.sfxEnabled
    this.updateSettings({ sfxEnabled: next })
    return next
  }

  public setMusicVolume(vol: number) {
    this.updateSettings({ bgmVolume: Math.max(0, Math.min(1, vol)) })
  }

  public setSfxVolume(vol: number) {
    this.updateSettings({ sfxVolume: Math.max(0, Math.min(1, vol)) })
  }

  public updateSettings(newSettings: Partial<SnakeAudioSettings>) {
    const bgmEn = newSettings.bgmEnabled ?? newSettings.musicEnabled
    const bgmVol = newSettings.bgmVolume ?? newSettings.musicVolume
    this.settings = {
      ...this.settings,
      ...newSettings,
      ...(bgmEn !== undefined ? { bgmEnabled: bgmEn } : {}),
      ...(bgmVol !== undefined ? { bgmVolume: bgmVol } : {}),
    }
    saveAudioSettings(this.settings)

    if (this.ctx) {
      if (this.bgmGain) {
        const targetGain = this.settings.bgmEnabled ? this.settings.bgmVolume : 0
        this.bgmGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05)
      }
      if (this.sfxGain) {
        const targetGain = this.settings.sfxEnabled ? this.settings.sfxVolume : 0
        this.sfxGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05)
      }
    }

    if (this.settings.bgmEnabled && !this.isBgmPlaying) {
      this.startBgm()
    } else if (!this.settings.bgmEnabled && this.isBgmPlaying) {
      this.stopBgm()
    }
  }

  // ── NHẠC NỀN BGM (Bật/tắt trong cài đặt) ──
  public startBgm() {
    if (!this.settings.bgmEnabled) return
    this.initContext()
    if (!this.ctx) return

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }

    if (this.isBgmPlaying) return
    this.isBgmPlaying = true
    this.currentNoteIndex = 0

    // Vòng lặp nhịp điệu (Tempo: 132 BPM, 1/8 note = ~227ms)
    const stepDuration = 227
    const tick = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return
      const now = this.ctx.currentTime

      const melodyFreq = this.melodyNotes[this.currentNoteIndex % this.melodyNotes.length]
      const bassFreq = this.bassNotes[Math.floor(this.currentNoteIndex / 2) % this.bassNotes.length]

      // 1. Giai điệu chính (Melody Lead: Triangle ấm áp)
      try {
        const leadOsc = this.ctx.createOscillator()
        const leadGain = this.ctx.createGain()
        leadOsc.type = 'triangle'
        leadOsc.frequency.setValueAtTime(melodyFreq, now)

        leadGain.gain.setValueAtTime(0.08, now)
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20)

        leadOsc.connect(leadGain)
        leadGain.connect(this.bgmGain)

        leadOsc.start(now)
        leadOsc.stop(now + 0.21)

        // 2. Tiếng Bass trầm nhịp điệu
        if (this.currentNoteIndex % 2 === 0) {
          const bassOsc = this.ctx.createOscillator()
          const bassGain = this.ctx.createGain()
          bassOsc.type = 'sine'
          bassOsc.frequency.setValueAtTime(bassFreq, now)

          bassGain.gain.setValueAtTime(0.12, now)
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

          bassOsc.connect(bassGain)
          bassGain.connect(this.bgmGain)

          bassOsc.start(now)
          bassOsc.stop(now + 0.39)
        }
      } catch {}

      this.currentNoteIndex++
      this.bgmTimer = window.setTimeout(tick, stepDuration)
    }

    tick()
  }

  public stopBgm() {
    this.isBgmPlaying = false
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer)
      this.bgmTimer = null
    }
  }

  // ── HIỆU ỨNG ÂM THANH (SFX) ──

  // 1. Ăn đồ thường (+điểm nhẹ nhàng: tiếng pop giòn tan)
  public playNom() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450, now)
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.08)
    } catch {}
  }

  // 2. Ăn đồ xịn (+nhiều điểm, nở lớn nhanh: hợp âm chuông reo vàng óng)
  public playSuperNom() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 Arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return
        const startTime = now + idx * 0.04
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.16, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22)
        osc.connect(gain)
        gain.connect(this.sfxGain)
        osc.start(startTime)
        osc.stop(startTime + 0.22)
      })
    } catch {}
  }

  // 3. Ăn phải đồ dỏm / độc hại (-điểm, teo nhỏ: âm thanh slide-down méo tiếng)
  public playHazard() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18)
      gain.gain.setValueAtTime(0.20, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.18)
    } catch {}
  }

  // 4. Cảnh báo vòng bo thu hẹp (Siren cảnh báo rền vang)
  public playSafeZoneAlert() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(350, now + 0.15)
      osc.frequency.linearRampToValueAtTime(440, now + 0.30)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.35)
    } catch {}
  }

  // 5. Va chạm / Game over
  public playCrash() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(40, now + 0.40)
      gain.gain.setValueAtTime(0.28, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.40)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.40)
    } catch {}
  }
}

export const snakeAudio = new SnakeAudioEngineClass()
