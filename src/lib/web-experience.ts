import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * ── 1. Haptic Feedback (Vibration API) ──
 * Rung phản hồi xúc giác nhẹ nhàng trên thiết bị di động (Android / iOS hỗ trợ)
 * Hoàn toàn an toàn, tự động bỏ qua nếu trình duyệt không hỗ trợ.
 */
export type HapticType = 'light' | 'medium' | 'success' | 'warning'

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 22,
  success: [12, 35, 18],
  warning: [25, 40, 25],
}

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(HAPTIC_PATTERNS[type])
    }
  } catch {}
}

/**
 * ── 2. Screen Wake Lock API ──
 * Giữ màn hình luôn sáng trong suốt trận đấu hoặc buổi học nhóm,
 * tự động khôi phục lock khi người dùng chuyển lại tab (visibilitychange).
 */
export function useScreenWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    try {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null
        })
      }
    } catch {}
  }, [])

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
      } catch {}
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      void releaseLock()
      return
    }

    void requestLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        void requestLock()
      } else {
        void releaseLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseLock()
    }
  }, [enabled, requestLock, releaseLock])
}

/**
 * ── 3. Web Share API & Clipboard Fallback ──
 * Chia sẻ liên kết phòng học, bàn cờ qua hệ thống chia sẻ gốc của thiết bị
 * (AirDrop, Zalo, Telegram, Tin nhắn...) hoặc tự động sao chép vào bộ nhớ tạm.
 */
export interface ShareOptions {
  title?: string
  text?: string
  url?: string
  successMessage?: string
}

export async function shareCampusLink(options: ShareOptions): Promise<boolean> {
  const title = options.title ?? 'Digital Campus'
  const text = options.text ?? 'Tham gia cùng mình trên Digital Campus!'
  const url = options.url ?? (typeof window !== 'undefined' ? window.location.href : '')
  const successMessage = options.successMessage ?? 'Đã sao chép liên kết vào bộ nhớ tạm!'

  if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch (err: unknown) {
      // Người dùng bấm huỷ chia sẻ (AbortError)
      if (err instanceof Error && err.name === 'AbortError') return false
    }
  }

  // Fallback: Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      triggerHaptic('light')
      toast.success(successMessage)
      return true
    } catch {}
  }

  return false
}
