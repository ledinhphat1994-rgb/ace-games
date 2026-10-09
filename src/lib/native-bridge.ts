// Digital Campus v2: Native Bridge Protocol
// Kết nối 2 chiều giữa Web Game Engine và Khung Native App (Expo / React Native)

export type HapticPattern =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'

interface NativeBridgeMessage {
  type: 'haptic' | 'audio' | 'share' | 'navigate'
  pattern?: HapticPattern
  sound?: string
  payload?: any
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
  }
}

/**
 * Kích hoạt rung phản hồi xúc giác (Haptic Feedback) trên điện thoại
 * Tự động nhận diện nếu đang chạy trong App Mobile Native hoặc Web Browser
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined') return

  // 1. Nếu đang chạy trong App Mobile (Expo Native Shell)
  if (window.ReactNativeWebView?.postMessage) {
    try {
      const msg: NativeBridgeMessage = {
        type: 'haptic',
        pattern,
      }
      window.ReactNativeWebView.postMessage(JSON.stringify(msg))
      return
    } catch {
      // Bỏ qua lỗi gửi tin nhắn
    }
  }

  // 2. Fallback nếu đang chạy trên Trình duyệt Web di động (navigator.vibrate)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (pattern) {
        case 'selection':
          navigator.vibrate(10)
          break
        case 'light':
          navigator.vibrate(20)
          break
        case 'medium':
          navigator.vibrate(35)
          break
        case 'heavy':
          navigator.vibrate(60)
          break
        case 'success':
          navigator.vibrate([25, 40, 35])
          break
        case 'warning':
          navigator.vibrate([40, 30, 40])
          break
        case 'error':
          navigator.vibrate([60, 40, 60])
          break
      }
    } catch {
      // Một số trình duyệt chặn rung nếu chưa có cử chỉ người dùng
    }
  }
}

/**
 * Kiểm tra xem người dùng có đang chạy trong App Mobile Native không
 */
export function isNativeMobileApp(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.ReactNativeWebView?.postMessage)
}
