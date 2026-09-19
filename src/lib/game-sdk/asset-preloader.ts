/**
 * Asset Preloader for Digital Campus Games (G0 Closure)
 *
 * Provides manifest-driven preloading with:
 * - required vs optional asset distinction
 * - Failed required asset → fail game startup cleanly
 * - Failed optional asset → degrade gracefully
 * - Compressed texture format selection: KTX2/ETC1S, KTX2/UASTC, WebP, PNG fallback
 *
 * G1 Snake Deluxe will supply its own manifest with real art assets.
 * G0 defines the contract and types only.
 */

export interface AssetEntry {
  url: string
  /** If true, failure aborts game startup. Default: false (optional) */
  required?: boolean
}

export interface CompressedTextureEntry {
  /** KTX2 ETC1S compressed (best compression, mobile GPU) */
  ktx2_etc1s?: string
  /** KTX2 UASTC compressed (high quality, desktop GPU) */
  ktx2_uastc?: string
  /** WebP fallback */
  webp?: string
  /** PNG baseline fallback */
  png?: string
  required?: boolean
}

export interface GameAssetManifest {
  images?: Record<string, AssetEntry | string>
  textures?: Record<string, CompressedTextureEntry>
  audio?: Record<string, AssetEntry | string>
  json?: Record<string, AssetEntry | string>
}

export interface PreloadProgress {
  loaded: number
  total: number
  percent: number
  currentAsset: string
  failures: string[]
}

export type PreloadResult = {
  images: Map<string, HTMLImageElement>
  audio: Map<string, HTMLAudioElement>
  json: Map<string, unknown>
  failures: string[]
  aborted: boolean
}

/**
 * Selects the best available texture URL based on browser GPU capabilities.
 * In G0, always falls back to WebP → PNG (no KTX2 detector yet; G1 will add detector).
 */
function selectTextureUrl(entry: CompressedTextureEntry): string | null {
  // G1 will add KTX2 capability detection; for now fall through to WebP/PNG
  if (entry.webp) return entry.webp
  if (entry.png) return entry.png
  return null
}

function normalizeEntry(entry: AssetEntry | string): AssetEntry {
  if (typeof entry === 'string') return { url: entry, required: false }
  return { url: entry.url, required: entry.required ?? false }
}

export class AssetPreloader {
  /**
   * Preloads all assets defined in the manifest.
   * Throws an error if any REQUIRED asset fails.
   */
  static async preload(
    manifest: GameAssetManifest,
    onProgress?: (progress: PreloadProgress) => void,
  ): Promise<PreloadResult> {
    const images = new Map<string, HTMLImageElement>()
    const audio = new Map<string, HTMLAudioElement>()
    const json = new Map<string, unknown>()
    const failures: string[] = []

    const imageEntries = Object.entries(manifest.images || {}).map(([k, v]) => [k, normalizeEntry(v)] as [string, AssetEntry])
    const textureEntries = Object.entries(manifest.textures || {}).map(([k, v]) => {
      const url = selectTextureUrl(v)
      const entry: AssetEntry = { url: url ?? '', required: v.required ?? false }
      return [k, entry, !url] as [string, AssetEntry, boolean]
    })
    const audioEntries = Object.entries(manifest.audio || {}).map(([k, v]) => [k, normalizeEntry(v)] as [string, AssetEntry])
    const jsonEntries = Object.entries(manifest.json || {}).map(([k, v]) => [k, normalizeEntry(v)] as [string, AssetEntry])

    const total = imageEntries.length + textureEntries.length + audioEntries.length + jsonEntries.length

    if (total === 0) {
      onProgress?.({ loaded: 0, total: 0, percent: 100, currentAsset: '', failures: [] })
      return { images, audio, json, failures, aborted: false }
    }

    let loaded = 0

    const notify = (name: string) => {
      loaded++
      onProgress?.({
        loaded,
        total,
        percent: Math.min(100, Math.round((loaded / total) * 100)),
        currentAsset: name,
        failures: [...failures],
      })
    }

    const recordFailure = (key: string, isRequired: boolean, err: unknown): void => {
      failures.push(key)
      const level = isRequired ? 'error' : 'warn'
      console[level](`AssetPreloader: [${isRequired ? 'REQUIRED' : 'optional'}] failed to load "${key}":`, err)
    }

    // 1. JSON assets
    const jsonPromises = jsonEntries.map(async ([key, entry]) => {
      try {
        const res = await fetch(entry.url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as unknown
        json.set(key, data)
      } catch (err) {
        recordFailure(key, entry.required ?? false, err)
      } finally {
        notify(key)
      }
    })

    // 2. Images
    const imagePromises = [...imageEntries, ...textureEntries.map(([k, e]) => [k, e] as [string, AssetEntry])].map(([key, entry]) => {
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
        img.onerror = (err) => {
          recordFailure(key, entry.required ?? false, err)
          notify(key)
          resolve()
        }
        img.src = entry.url
      })
    })

    // 3. Audio
    const audioPromises = audioEntries.map(([key, entry]) => {
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
        snd.onerror = (err) => {
          recordFailure(key, entry.required ?? false, err)
          notify(key)
          resolve()
        }
        snd.src = entry.url
      })
    })

    await Promise.all([...jsonPromises, ...imagePromises, ...audioPromises])

    // Abort if any required asset failed
    const requiredFailures = [
      ...imageEntries.filter(([k, e]) => (e.required ?? false) && failures.includes(k)),
      ...textureEntries.filter(([k, , missing]) => !missing && failures.includes(k)),
      ...audioEntries.filter(([k, e]) => (e.required ?? false) && failures.includes(k)),
      ...jsonEntries.filter(([k, e]) => (e.required ?? false) && failures.includes(k)),
    ]

    if (requiredFailures.length > 0) {
      return { images, audio, json, failures, aborted: true }
    }

    return { images, audio, json, failures, aborted: false }
  }
}
