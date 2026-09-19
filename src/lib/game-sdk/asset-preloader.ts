/**
 * Asset Preloader for Digital Campus Games
 *
 * Provides manifest-driven preloading of WebP textures, sprite atlases,
 * and audio with progress tracking and caching.
 */

export interface GameAssetManifest {
  images?: Record<string, string>
  audio?: Record<string, string>
  json?: Record<string, string>
}

export interface PreloadProgress {
  loaded: number
  total: number
  percent: number
  currentAsset: string
}

export class AssetPreloader {
  /**
   * Preloads all assets defined in the manifest.
   */
  static async preload(
    manifest: GameAssetManifest,
    onProgress?: (progress: PreloadProgress) => void,
  ): Promise<{
    images: Map<string, HTMLImageElement>
    audio: Map<string, HTMLAudioElement>
    json: Map<string, unknown>
  }> {
    const images = new Map<string, HTMLImageElement>()
    const audio = new Map<string, HTMLAudioElement>()
    const json = new Map<string, unknown>()

    const imageEntries = Object.entries(manifest.images || {})
    const audioEntries = Object.entries(manifest.audio || {})
    const jsonEntries = Object.entries(manifest.json || {})

    const total = imageEntries.length + audioEntries.length + jsonEntries.length
    if (total === 0) {
      onProgress?.({ loaded: 0, total: 0, percent: 100, currentAsset: '' })
      return { images, audio, json }
    }

    let loaded = 0

    const notify = (name: string) => {
      loaded++
      onProgress?.({
        loaded,
        total,
        percent: Math.min(100, Math.round((loaded / total) * 100)),
        currentAsset: name,
      })
    }

    // 1. Preload JSON assets
    const jsonPromises = jsonEntries.map(async ([key, url]) => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as unknown
        json.set(key, data)
      } catch (err) {
        console.warn(`AssetPreloader: Failed to load JSON ${key} from ${url}:`, err)
      } finally {
        notify(key)
      }
    })

    // 2. Preload Images (WebP / PNG)
    const imagePromises = imageEntries.map(([key, url]) => {
      return new Promise<void>((resolve) => {
        if (typeof Image === 'undefined') {
          notify(key)
          resolve()
          return
        }
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          images.set(key, img)
          notify(key)
          resolve()
        }
        img.onerror = () => {
          console.warn(`AssetPreloader: Failed to load image ${key} from ${url}`)
          notify(key)
          resolve()
        }
        img.src = url
      })
    })

    // 3. Preload Audio
    const audioPromises = audioEntries.map(([key, url]) => {
      return new Promise<void>((resolve) => {
        if (typeof Audio === 'undefined') {
          notify(key)
          resolve()
          return
        }
        const snd = new Audio()
        snd.preload = 'auto'
        snd.oncanplaythrough = () => {
          audio.set(key, snd)
          notify(key)
          resolve()
        }
        snd.onerror = () => {
          console.warn(`AssetPreloader: Failed to load audio ${key} from ${url}`)
          notify(key)
          resolve()
        }
        snd.src = url
      })
    })

    await Promise.all([...jsonPromises, ...imagePromises, ...audioPromises])

    return { images, audio, json }
  }
}
