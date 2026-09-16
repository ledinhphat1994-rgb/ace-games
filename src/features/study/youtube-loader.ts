import type { YTNamespace } from './youtube-types'

let apiPromise: Promise<YTNamespace> | null = null

export const APP_OWNED_ATTR = 'data-campus-owned'

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

    const prevOnReady = window.onYouTubeIframeAPIReady

    // Check if script already exists in document
    let script = document.querySelector('script[src*="youtube.com/iframe_api"]') as HTMLScriptElement | null
    let isAppOwned = false

    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.setAttribute(APP_OWNED_ATTR, 'true')
      isAppOwned = true
    } else {
      isAppOwned = script.getAttribute(APP_OWNED_ATTR) === 'true'
    }

    const onErrorHandler = () => {
      cleanupAndReject(new Error('Không thể tải YouTube Iframe API. Kiểm tra kết nối mạng.'))
    }

    script.addEventListener('error', onErrorHandler)

    const cleanupAndReject = (err: Error) => {
      if (settled) return
      settled = true

      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Detach handler
      script?.removeEventListener('error', onErrorHandler)

      // Restore previous callback
      window.onYouTubeIframeAPIReady = prevOnReady

      // Remove only failed app-owned script node from DOM
      if (isAppOwned && script && script.parentNode) {
        script.parentNode.removeChild(script)
      }

      // Reset apiPromise so future callers perform a fresh load
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

      script?.removeEventListener('error', onErrorHandler)
      window.onYouTubeIframeAPIReady = prevOnReady

      resolve(yt)
    }

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

    if (isAppOwned && !script.parentNode) {
      const target = document.head || document.body
      target.appendChild(script)
    }

    // Safety timeout (15s) in case network or script hangs
    timeoutId = setTimeout(() => {
      cleanupAndReject(new Error('Quá thời gian tải YouTube Iframe API (15s). Vui lòng thử lại.'))
    }, 15000)
  })

  return apiPromise
}
