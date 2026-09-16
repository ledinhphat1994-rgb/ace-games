import type { YTNamespace } from './youtube-types'

let apiPromise: Promise<YTNamespace> | null = null

export function resetYouTubeLoaderForTesting(): void {
  apiPromise = null
}

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
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let settled = false

    const cleanupAndReject = (err: Error) => {
      if (settled) return
      settled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      // Reset apiPromise on failure so future callers can retry
      apiPromise = null
      reject(err)
    }

    const cleanupAndResolve = (yt: YTNamespace) => {
      if (settled) return
      settled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      resolve(yt)
    }

    const prevOnReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady && typeof prevOnReady === 'function' && prevOnReady !== window.onYouTubeIframeAPIReady) {
        try { prevOnReady() } catch {}
      }
      if (window.YT && window.YT.Player) {
        cleanupAndResolve(window.YT)
      } else {
        cleanupAndReject(new Error('YouTube Iframe API loaded but window.YT.Player is unavailable.'))
      }
    }

    // Check if script already exists in document
    let script = document.querySelector('script[src*="youtube.com/iframe_api"]') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = () => {
        cleanupAndReject(new Error('Không thể tải YouTube Iframe API. Kiểm tra kết nối mạng.'))
      }
      document.head.appendChild(script)
    } else {
      const origOnError = script.onerror
      script.onerror = (e) => {
        if (origOnError && typeof origOnError === 'function') {
          try { origOnError.call(script, e) } catch {}
        }
        cleanupAndReject(new Error('Không thể tải YouTube Iframe API. Kiểm tra kết nối mạng.'))
      }
    }

    // Safety timeout (15s) in case network or script hangs
    timeoutId = setTimeout(() => {
      if (!window.YT || !window.YT.Player) {
        cleanupAndReject(new Error('Hết thời gian chờ nạp YouTube Iframe API (timeout 15s).'))
      }
    }, 15000)
  })

  return apiPromise
}
