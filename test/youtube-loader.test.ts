import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadYouTubeIframeAPI, resetYouTubeLoaderForTesting, APP_OWNED_ATTR } from '../src/features/study/youtube-loader'

interface MockScriptElement {
  src: string
  async: boolean
  attributes: Record<string, string>
  parentNode: { removeChild: (child: MockScriptElement) => void } | null
  eventListeners: Record<string, ((e?: unknown) => void)[]>
  setAttribute: (name: string, value: string) => void
  getAttribute: (name: string) => string | null
  hasAttribute: (name: string) => boolean
  addEventListener: (name: string, cb: (e?: unknown) => void) => void
  removeEventListener: (name: string, cb: (e?: unknown) => void) => void
  trigger: (name: string, e?: unknown) => void
}

describe('YouTube Loader Lifecycle & Retry Engine', () => {
  let originalWindow: unknown
  let originalDocument: unknown
  let mockHeadChildren: MockScriptElement[] = []

  function createMockScript(): MockScriptElement {
    const script: MockScriptElement = {
      src: '',
      async: false,
      attributes: {},
      parentNode: null,
      eventListeners: {},
      setAttribute(name, value) {
        this.attributes[name] = value
      },
      getAttribute(name) {
        return this.attributes[name] ?? null
      },
      hasAttribute(name) {
        return name in this.attributes
      },
      addEventListener(name, cb) {
        this.eventListeners[name] = this.eventListeners[name] || []
        this.eventListeners[name].push(cb)
      },
      removeEventListener(name, cb) {
        if (!this.eventListeners[name]) return
        this.eventListeners[name] = this.eventListeners[name].filter((fn) => fn !== cb)
      },
      trigger(name, e) {
        if (this.eventListeners[name]) {
          for (const fn of this.eventListeners[name]) {
            fn(e)
          }
        }
      },
    }
    return script
  }

  beforeEach(() => {
    resetYouTubeLoaderForTesting()
    mockHeadChildren = []
    originalWindow = (globalThis as any).window
    originalDocument = (globalThis as any).document

    const mockHead = {
      appendChild: (el: MockScriptElement) => {
        el.parentNode = {
          removeChild: (child: MockScriptElement) => {
            const idx = mockHeadChildren.indexOf(child)
            if (idx >= 0) mockHeadChildren.splice(idx, 1)
            child.parentNode = null
          },
        }
        mockHeadChildren.push(el)
        return el
      },
    }

    const mockDoc = {
      head: mockHead,
      body: mockHead,
      createElement: (tag: string) => {
        if (tag === 'script') {
          return createMockScript()
        }
        return {}
      },
      querySelector: (selector: string) => {
        if (selector.includes('youtube.com/iframe_api')) {
          return mockHeadChildren.find((s) => s.src.includes('youtube.com/iframe_api')) || null
        }
        return null
      },
    }

    const mockWin: any = {
      document: mockDoc,
    }

    ;(globalThis as any).window = mockWin
    ;(globalThis as any).document = mockDoc
  })

  afterEach(() => {
    resetYouTubeLoaderForTesting()
    vi.restoreAllMocks()
    ;(globalThis as any).window = originalWindow
    ;(globalThis as any).document = originalDocument
  })

  it('1. Trả về ngay lập tức nếu window.YT.Player đã tồn tại sẵn', async () => {
    const fakeYT = { Player: vi.fn() }
    ;(window as any).YT = fakeYT

    const res = await loadYouTubeIframeAPI()
    expect(res).toBe(fakeYT)
    expect(mockHeadChildren.length).toBe(0)
  })

  it('2. Các cuộc gọi đồng thời (concurrent callers) dùng chung 1 Promise và chỉ tạo 1 thẻ script', async () => {
    const p1 = loadYouTubeIframeAPI()
    const p2 = loadYouTubeIframeAPI()
    const p3 = loadYouTubeIframeAPI()

    expect(mockHeadChildren.length).toBe(1)
    const script = mockHeadChildren[0]
    expect(script.src).toBe('https://www.youtube.com/iframe_api')
    expect(script.getAttribute(APP_OWNED_ATTR)).toBe('true')

    // Simulate API ready callback
    const fakeYT = { Player: vi.fn() }
    ;(window as any).YT = fakeYT
    ;(window as any).onYouTubeIframeAPIReady()

    const [r1, r2, r3] = await Promise.all([p1, p2, p3])
    expect(r1).toBe(fakeYT)
    expect(r2).toBe(fakeYT)
    expect(r3).toBe(fakeYT)
  })

  it('3. Lần tải đầu thất bại -> gỡ thẻ script lỗi -> reset Promise -> lần 2 tạo script mới và thành công', async () => {
    const p1 = loadYouTubeIframeAPI()
    expect(mockHeadChildren.length).toBe(1)
    const failedScript = mockHeadChildren[0]

    // Simulate script load error
    failedScript.trigger('error')

    await expect(p1).rejects.toThrow('Không thể tải YouTube Iframe API')

    // Invariant: Failed app-owned script node MUST BE REMOVED from DOM
    expect(mockHeadChildren.length).toBe(0)
    expect(failedScript.parentNode).toBeNull()

    // Second call: must create a fresh script request
    const p2 = loadYouTubeIframeAPI()
    expect(mockHeadChildren.length).toBe(1)
    const freshScript = mockHeadChildren[0]
    expect(freshScript).not.toBe(failedScript)
    expect(freshScript.getAttribute(APP_OWNED_ATTR)).toBe('true')

    // Simulate API ready on second attempt
    const fakeYT = { Player: vi.fn() }
    ;(window as any).YT = fakeYT
    ;(window as any).onYouTubeIframeAPIReady()

    const r2 = await p2
    expect(r2).toBe(fakeYT)
  })

  it('4. Quá thời gian chờ (timeout) -> reject -> gỡ script -> cho phép thử lại', async () => {
    vi.useFakeTimers()
    try {
      const p = loadYouTubeIframeAPI()
      expect(mockHeadChildren.length).toBe(1)

      // Advance timers past 15s timeout
      vi.advanceTimersByTime(15100)

      await expect(p).rejects.toThrow('Quá thời gian tải YouTube Iframe API (15s)')
      expect(mockHeadChildren.length).toBe(0)

      // Subsequent call can run again
      void loadYouTubeIframeAPI()
      expect(mockHeadChildren.length).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('5. Thẻ script tồn tại từ bên ngoài (không có app-owned attribute) KHÔNG bị xóa khi lỗi', async () => {
    const externalScript = createMockScript()
    externalScript.src = 'https://www.youtube.com/iframe_api'
    // Do NOT set APP_OWNED_ATTR
    document.head.appendChild(externalScript as any)
    expect(mockHeadChildren.length).toBe(1)

    const p = loadYouTubeIframeAPI()
    // Does not create another script
    expect(mockHeadChildren.length).toBe(1)

    // Trigger error
    externalScript.trigger('error')

    await expect(p).rejects.toThrow('Không thể tải YouTube Iframe API')

    // External script remains in DOM
    expect(mockHeadChildren.length).toBe(1)
    expect(mockHeadChildren[0]).toBe(externalScript)
  })
})
