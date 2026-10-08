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

  // Biến đếm combo ăn mồi liên tục
  private lastNomTime = 0
  private nomComboCount = 0

  // Quản lý âm thanh lướt nhanh (Boost Woosh)
  private isBoostingAudio = false
  private boostNoiseNode: AudioBufferSourceNode | null = null
  private boostGainNode: GainNode | null = null
  private boostFilterNode: BiquadFilterNode | null = null
  private lastBushRustleTime = 0

  // ── HIỆU ỨNG ÂM THANH (SFX) ──

  // 1. Ăn đồ thường (+điểm giòn tan, có pitch shifting combo tăng dần cực vui tai)
  public playNom() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime

      // Tính combo ăn mồi liên tiếp trong 1.2s
      if (now - this.lastNomTime < 1.2) {
        this.nomComboCount = Math.min(14, this.nomComboCount + 1)
      } else {
        this.nomComboCount = 0
      }
      this.lastNomTime = now

      // Tần số cơ sở nâng dần theo combo (chromatic scale) + biến điệu ngẫu nhiên
      const comboMult = Math.pow(1.05946, this.nomComboCount % 12)
      const baseFreq = 440 * comboMult * (0.97 + Math.random() * 0.06)

      // Lớp 1: Tiếng Bubble Pop ấm áp
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.075)

      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.085)

      // Lớp 2: Tiếng Ping cao lấp lánh (Sparkle chime)
      const chimeOsc = this.ctx.createOscillator()
      const chimeGain = this.ctx.createGain()
      chimeOsc.type = 'sine'
      chimeOsc.frequency.setValueAtTime(baseFreq * 2.5, now)
      chimeGain.gain.setValueAtTime(0.08, now)
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      chimeOsc.connect(chimeGain)
      chimeGain.connect(this.sfxGain)
      chimeOsc.start(now)
      chimeOsc.stop(now + 0.13)
    } catch {}
  }

  // 2. Ăn đồ xịn (+nhiều điểm, bánh kem to / ngọc bảo: hợp âm chuông vàng óng arpeggio)
  public playSuperNom() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return
        const startTime = now + idx * 0.035
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.22)
        gain.gain.setValueAtTime(0.18, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.26)
        osc.connect(gain)
        gain.connect(this.sfxGain)
        osc.start(startTime)
        osc.stop(startTime + 0.27)
      })

      // Tiếng pop giòn kèm theo
      const popOsc = this.ctx.createOscillator()
      const popGain = this.ctx.createGain()
      popOsc.type = 'triangle'
      popOsc.frequency.setValueAtTime(380, now)
      popOsc.frequency.exponentialRampToValueAtTime(880, now + 0.1)
      popGain.gain.setValueAtTime(0.24, now)
      popGain.gain.linearRampToValueAtTime(0.001, now + 0.11)
      popOsc.connect(popGain)
      popGain.connect(this.sfxGain)
      popOsc.start(now)
      popOsc.stop(now + 0.12)
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
      osc.frequency.setValueAtTime(340, now)
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.22)
      gain.gain.setValueAtTime(0.22, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22)
      osc.connect(gain)
      gain.connect(this.sfxGain)
      osc.start(now)
      osc.stop(now + 0.23)
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

  // 5. Va chạm chết / Nổ tan xác thành kẹo bánh (Impact boom + Shatter debris)
  public playCrash() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime

      // Lớp 1: Sub-bass Punch boom trầm vang
      const bassOsc = this.ctx.createOscillator()
      const bassGain = this.ctx.createGain()
      bassOsc.type = 'sine'
      bassOsc.frequency.setValueAtTime(130, now)
      bassOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45)
      bassGain.gain.setValueAtTime(0.40, now)
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      bassOsc.connect(bassGain)
      bassGain.connect(this.sfxGain)
      bassOsc.start(now)
      bassOsc.stop(now + 0.46)

      // Lớp 2: Tiếng nứt vỡ va chạm (Shatter noise burst)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.3)
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22))
      }
      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(900, now)
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.3)
      filter.Q.value = 1.2

      const noiseGain = this.ctx.createGain()
      noiseGain.gain.setValueAtTime(0.32, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(this.sfxGain)
      noise.start(now)
      noise.stop(now + 0.36)

      // Lớp 3: Sawtooth gãy khúc trượt
      const crashOsc = this.ctx.createOscillator()
      const crashGain = this.ctx.createGain()
      crashOsc.type = 'sawtooth'
      crashOsc.frequency.setValueAtTime(220, now)
      crashOsc.frequency.linearRampToValueAtTime(45, now + 0.35)
      crashGain.gain.setValueAtTime(0.22, now)
      crashGain.gain.linearRampToValueAtTime(0.001, now + 0.36)
      crashOsc.connect(crashGain)
      crashGain.connect(this.sfxGain)
      crashOsc.start(now)
      crashOsc.stop(now + 0.37)
    } catch {}
  }

  // 6. Thăng cấp kích thước khổng lồ / Level up fanfare
  public playLevelUp() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return
        const startTime = now + idx * 0.05
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0.22, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)
        osc.connect(gain)
        gain.connect(this.sfxGain)
        osc.start(startTime)
        osc.stop(startTime + 0.36)
      })
    } catch {}
  }

  // 7. Lướt nhanh tăng tốc (Boost Woosh Wind - âm thanh phản lực xé gió siêu tốc)
  public updateBoost(isBoosting: boolean) {
    if (!this.settings.sfxEnabled) {
      if (this.isBoostingAudio) this.stopBoostSound()
      return
    }
    if (isBoosting) {
      if (!this.isBoostingAudio) this.startBoostSound()
    } else {
      if (this.isBoostingAudio) this.stopBoostSound()
    }
  }

  private startBoostSound() {
    this.initContext()
    if (!this.ctx || !this.sfxGain) return
    try {
      this.isBoostingAudio = true
      const now = this.ctx.currentTime

      // Buffer white noise lặp tuần hoàn 1s
      const bufferSize = this.ctx.sampleRate
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1)
      }

      const noiseSource = this.ctx.createBufferSource()
      noiseSource.buffer = buffer
      noiseSource.loop = true

      // Bandpass filter tạo tiếng gió xé rít
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(650, now)
      filter.frequency.linearRampToValueAtTime(1450, now + 0.25)
      filter.Q.value = 1.8

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.12)

      noiseSource.connect(filter)
      filter.connect(gain)
      gain.connect(this.sfxGain)

      noiseSource.start(now)

      this.boostNoiseNode = noiseSource
      this.boostGainNode = gain
      this.boostFilterNode = filter
    } catch {}
  }

  private stopBoostSound() {
    this.isBoostingAudio = false
    if (!this.ctx || !this.boostGainNode) return
    try {
      const now = this.ctx.currentTime
      this.boostGainNode.gain.linearRampToValueAtTime(0.001, now + 0.15)
      const oldSource = this.boostNoiseNode
      const oldFilter = this.boostFilterNode
      setTimeout(() => {
        try {
          oldSource?.stop()
          oldSource?.disconnect()
          oldFilter?.disconnect()
        } catch {}
      }, 160)
      this.boostNoiseNode = null
      this.boostGainNode = null
      this.boostFilterNode = null
    } catch {}
  }

  // 8. Chui vào bụi rậm (Foliage Rustle: tiếng xào xạc lá cây sột soạt êm ái)
  public playBushRustle() {
    if (!this.settings.sfxEnabled) return
    this.initContext()
    if (!this.ctx || !this.sfxGain) return

    const now = this.ctx.currentTime
    if (now - this.lastBushRustleTime < 0.35) return // Chống spam lặp liên tục
    this.lastBushRustleTime = now

    try {
      // 2 nhịp xào xạc lá cây
      for (let step = 0; step < 2; step++) {
        const startTime = now + step * 0.08
        const dur = 0.14
        const bufferSize = Math.floor(this.ctx.sampleRate * dur)
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI)
        }

        const noise = this.ctx.createBufferSource()
        noise.buffer = buffer

        const hp = this.ctx.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.setValueAtTime(1800 + step * 400, startTime)

        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0.09, startTime)
        gain.gain.linearRampToValueAtTime(0.001, startTime + dur)

        noise.connect(hp)
        hp.connect(gain)
        gain.connect(this.sfxGain)

        noise.start(startTime)
        noise.stop(startTime + dur)
      }
    } catch {}
  }
}

export const snakeAudio = new SnakeAudioEngineClass()
