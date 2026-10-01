import { triggerHaptic } from '@/lib/web-experience'

/**
 * Lightweight Web Audio synthesized sound effects for board and arcade games.
 * Pure Web Audio API (zero external assets), strictly failsafe.
 */
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new AudioCtxClass()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

export function playGameStartSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    // Heroic War Horn / Herald Fanfare: G4 -> C5 -> E5 -> G5 (strong, triumphant, brass-like)
    const notes = [
      { freq: 392.0, time: 0, dur: 0.18, vol: 0.13, type: 'sawtooth' as OscillatorType },
      { freq: 523.25, time: 0.15, dur: 0.22, vol: 0.15, type: 'sawtooth' as OscillatorType },
      { freq: 659.25, time: 0.32, dur: 0.25, vol: 0.16, type: 'triangle' as OscillatorType },
      { freq: 783.99, time: 0.52, dur: 0.65, vol: 0.18, type: 'triangle' as OscillatorType },
    ]

    notes.forEach(({ freq, time, dur, vol, type }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = type
      osc.frequency.setValueAtTime(freq, now + time)

      // Warm brass filter
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1400, now + time)
      filter.frequency.exponentialRampToValueAtTime(800, now + time + dur)

      gain.gain.setValueAtTime(0.001, now + time)
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + dur)
    })
  } catch {}
}

export function playGameOverSound(result: 'win' | 'lose' | 'draw'): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    if (result === 'win') {
      // Victory Fanfare: C5 -> E5 -> G5 -> C6 (ascending bright arpeggio)
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.1)
        gain.gain.setValueAtTime(0.12, now + idx * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.1)
        osc.stop(now + idx * 0.1 + 0.35)
      })
    } else if (result === 'lose') {
      // Defeat Chime: F4 -> Eb4 -> D4 -> C4 (gentle melancholic descending notes)
      const freqs = [349.23, 311.13, 293.66, 261.63]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0.11, now + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.4)
      })
    } else {
      // Draw: G4 -> C5 (harmonious neutral chime)
      const freqs = [392.0, 523.25]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0.09, now + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.3)
      })
    }
  } catch {}
}

export function playClockTickSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.03)
  } catch {}
}

/**
 * Tiếng gõ quân cờ gỗ giòn giã (Tactile Wooden Piece Placement)
 */
export function playPieceMoveSound(): void {
  triggerHaptic('light')
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(420, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.055)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, now)
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.055)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.055)
  } catch {}
}

/**
 * Tiếng ăn quân va chạm mạnh mẽ (Piece Capture Impact)
 */
export function playPieceCaptureSound(): void {
  triggerHaptic('medium')
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime

    // Tiếng đập chắc nịch
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(320, now)
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08)
    gain1.gain.setValueAtTime(0.24, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.08)

    // Tiếng rào nhẹ (wood crack/resonance)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(750, now)
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.06)
    gain2.gain.setValueAtTime(0.12, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now)
    osc2.stop(now + 0.06)
  } catch {}
}

/**
 * Tiếng chuông cảnh báo Chiếu Tướng kịch tính (Check Alert Chime)
 */
export function playCheckAlertSound(): void {
  triggerHaptic('warning')
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15) // A5

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.16, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(800, now)
    filter.Q.setValueAtTime(3, now)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.28)
  } catch {}
}
