/**
 * Dynamic Game Engine Loader
 *
 * Ensures heavy game engines (such as Phaser 3 ~1MB) are NEVER bundled
 * into the main Digital Campus bundle, achieving a strict zero-bundle-penalty
 * for core campus pages, lobby, and study rooms.
 */

export interface LoadEngineOptions {
  onProgress?: (percent: number) => void
  cdnFallbackUrl?: string
  timeoutMs?: number
}

// In-memory singleton cache to prevent duplicate script downloads
let phaserLoadingPromise: Promise<unknown> | null = null

export class GameEngineLoader {
  /**
   * Dynamically loads Phaser 3 on demand.
   * If already loaded (in window.Phaser), resolves immediately.
   */
  static async loadPhaser(options: LoadEngineOptions = {}): Promise<unknown> {
    const win = typeof window !== 'undefined' ? (window as unknown as { Phaser?: unknown }) : undefined
    if (!win) {
      throw new Error('GameEngineLoader: Browser window environment required.')
    }

    if (win.Phaser) {
      options.onProgress?.(100)
      return win.Phaser
    }

    if (phaserLoadingPromise) {
      return phaserLoadingPromise
    }

    const {
      onProgress,
      cdnFallbackUrl = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.88.2/phaser.min.js',
      timeoutMs = 20000,
    } = options

    phaserLoadingPromise = new Promise((resolve, reject) => {
      onProgress?.(10)

      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.crossOrigin = 'anonymous'

      // Primary source: local static assets or bundled public script, fallback to CDN
      const primaryUrl = '/assets/engines/phaser.min.js'
      script.src = primaryUrl

      let timer: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        if (timer) clearTimeout(timer)
      }

      timer = setTimeout(() => {
        cleanup()
        phaserLoadingPromise = null
        reject(new Error(`GameEngineLoader: Loading Phaser timed out after ${timeoutMs}ms.`))
      }, timeoutMs)

      script.onload = () => {
        cleanup()
        onProgress?.(100)
        if (win.Phaser) {
          resolve(win.Phaser)
        } else {
          phaserLoadingPromise = null
          reject(new Error('GameEngineLoader: Phaser script loaded but window.Phaser is undefined.'))
        }
      }

      script.onerror = () => {
        // Fallback to CDN if local asset is not available
        console.warn(`GameEngineLoader: Failed to load ${primaryUrl}, falling back to ${cdnFallbackUrl}`)
        onProgress?.(30)

        const fallbackScript = document.createElement('script')
        fallbackScript.type = 'text/javascript'
        fallbackScript.async = true
        fallbackScript.crossOrigin = 'anonymous'
        fallbackScript.src = cdnFallbackUrl

        fallbackScript.onload = () => {
          cleanup()
          onProgress?.(100)
          if (win.Phaser) {
            resolve(win.Phaser)
          } else {
            phaserLoadingPromise = null
            reject(new Error('GameEngineLoader: Fallback Phaser loaded but window.Phaser is undefined.'))
          }
        }

        fallbackScript.onerror = (err) => {
          cleanup()
          phaserLoadingPromise = null
          reject(new Error(`GameEngineLoader: Failed to load Phaser engine: ${String(err)}`))
        }

        document.head.appendChild(fallbackScript)
        script.remove()
      }

      onProgress?.(25)
      document.head.appendChild(script)
    })

    return phaserLoadingPromise
  }

  /**
   * Check if Phaser is currently loaded in memory
   */
  static isPhaserLoaded(): boolean {
    return typeof window !== 'undefined' && Boolean((window as unknown as { Phaser?: unknown }).Phaser)
  }
}
