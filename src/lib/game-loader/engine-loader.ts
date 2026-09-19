/**
 * Dynamic Game Engine Loader
 *
 * Ensures heavy game engines (Phaser 4 ~1.3MB) are NEVER bundled
 * into the main Digital Campus bundle, achieving a strict zero-bundle-penalty
 * for core campus pages, lobby, and study rooms.
 *
 * Architecture:
 * - Primary: dynamic import() of phaser@4.2.1 via Vite lazy chunk
 *   → Vite splits Phaser into a separate lazy chunk served from Cloudflare Static Assets
 * - Fallback: local /assets/engines/phaser.min.js (Phaser 4.2.1 pinned)
 * - CDN fallback (last resort): exact same version 4.2.1 on jsDelivr
 *
 * The lazy import() approach means:
 * - 0 bytes of Phaser runtime in the initial application path
 * - Phaser chunk is only fetched when Game Arena is opened
 * - All routes (homepage, study room, admin, Campus hub) load without Phaser
 */

export interface LoadEngineOptions {
  onProgress?: (percent: number) => void
  timeoutMs?: number
}

const PHASER_VERSION = '4.2.1'
const PHASER_CDN_FALLBACK = `https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js`
const PHASER_LOCAL_FALLBACK = '/assets/engines/phaser.min.js'

// In-memory singleton to prevent duplicate loads
let phaserLoadingPromise: Promise<unknown> | null = null

export class GameEngineLoader {
  /**
   * Dynamically loads Phaser 4.2.1 on demand via lazy import().
   * Vite creates a separate lazy chunk; the main bundle contains zero Phaser code.
   * If already loaded (window.Phaser), resolves immediately.
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

    const { onProgress, timeoutMs = 30000 } = options

    phaserLoadingPromise = (async () => {
      onProgress?.(10)

      // Attempt 1: Dynamic import of phaser npm package
      // Vite will tree-split this into a separate lazy chunk at build time,
      // preventing Phaser from loading on normal Campus routes.
      try {
        onProgress?.(20)
        const mod = await Promise.race([
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — phaser is a browser-only package; the import is lazy
          import('phaser'),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Phaser dynamic import timed out')), timeoutMs),
          ),
        ]) as { default?: unknown } | unknown
        onProgress?.(90)
        const phaser = (mod as { default?: unknown }).default ?? mod
        if (phaser && typeof phaser === 'object') {
          onProgress?.(100)
          return phaser
        }
        throw new Error('Phaser module resolved but has no usable export')
      } catch (importErr) {
        console.warn(`GameEngineLoader: dynamic import() failed, trying local fallback. Reason: ${String(importErr)}`)
      }

      // Attempt 2: Local static asset (/assets/engines/phaser.min.js — Phaser 4.2.1 pinned)
      try {
        onProgress?.(40)
        await loadScript(PHASER_LOCAL_FALLBACK, timeoutMs)
        if ((win as { Phaser?: unknown }).Phaser) {
          onProgress?.(100)
          return (win as { Phaser: unknown }).Phaser
        }
        throw new Error('Local Phaser asset loaded but window.Phaser is undefined')
      } catch (localErr) {
        console.warn(`GameEngineLoader: local fallback failed: ${String(localErr)}. Trying CDN...`)
      }

      // Attempt 3: CDN fallback — exact same Phaser 4.2.1 version
      onProgress?.(60)
      await loadScript(PHASER_CDN_FALLBACK, timeoutMs)
      if ((win as { Phaser?: unknown }).Phaser) {
        onProgress?.(100)
        return (win as { Phaser: unknown }).Phaser
      }
      phaserLoadingPromise = null
      throw new Error(`GameEngineLoader: Failed to load Phaser ${PHASER_VERSION} from all sources.`)
    })().catch((err) => {
      phaserLoadingPromise = null
      throw err
    })

    return phaserLoadingPromise
  }

  /**
   * Returns the Phaser version this loader is configured for.
   */
  static get phaserVersion(): string {
    return PHASER_VERSION
  }

  /**
   * Check if Phaser is currently loaded in memory
   */
  static isLoaded(): boolean {
    const win = typeof window !== 'undefined' ? (window as unknown as { Phaser?: unknown }) : undefined
    return Boolean(win?.Phaser)
  }

  /**
   * Resets the loading promise (for testing only)
   */
  static _resetForTest(): void {
    phaserLoadingPromise = null
  }
}

function loadScript(src: string, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = src

    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timer = null
      script.remove()
      reject(new Error(`Script load timed out: ${src}`))
    }, timeoutMs)

    script.onload = () => {
      if (timer) clearTimeout(timer)
      resolve()
    }
    script.onerror = (err) => {
      if (timer) clearTimeout(timer)
      script.remove()
      reject(new Error(`Script load failed: ${src} — ${String(err)}`))
    }

    document.head.appendChild(script)
  })
}
