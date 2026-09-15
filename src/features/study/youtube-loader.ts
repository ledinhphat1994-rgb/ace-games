import type { YTNamespace } from './youtube-types'

let apiPromise: Promise<YTNamespace> | null = null
const readyCallbacks: Array<(yt: YTNamespace) => void> = []

export function loadYouTubeIframeAPI(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API cannot be loaded in non-browser environment'))
  }

  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }

  if (apiPromise) {
    return apiPromise
  }

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    // Check if script already exists in document
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')

    const prevOnReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) {
        try { prevOnReady() } catch {}
      }
      if (window.YT && window.YT.Player) {
        resolve(window.YT)
        while (readyCallbacks.length > 0) {
          const cb = readyCallbacks.shift()
          if (cb) {
            try { cb(window.YT) } catch {}
          }
        }
      } else {
        reject(new Error('YouTube Iframe API loaded but window.YT.Player is unavailable.'))
      }
    }

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        reject(new Error('Không thể tải YouTube Iframe API. Kiểm tra kết nối mạng.'))
      }
      document.head.appendChild(script)
    }

    // Safety timeout (15s) in case network is completely blocked
    setTimeout(() => {
      if (!window.YT || !window.YT.Player) {
        reject(new Error('Hết thời gian chờ nạp YouTube Iframe API (timeout 15s).'))
      }
    }, 15000)
  })

  return apiPromise
}
