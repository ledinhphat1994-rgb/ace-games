import { useEffect } from 'react'

// The visual viewport also shrinks for the on-screen keyboard on iOS Safari.
export function ViewportMetrics() {
  useEffect(() => {
    let lastHeight = 0
    let lastTop = -1
    let rafId = 0

    const update = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const viewport = window.visualViewport
        const h = Math.round(viewport?.height ?? window.innerHeight)
        const top = Math.round(viewport?.offsetTop ?? 0)

        // Chỉ cập nhật biến CSS khi thật sự đổi kích thước (tránh hủy cache render DOM khi cuộn)
        if (h !== lastHeight) {
          lastHeight = h
          document.documentElement.style.setProperty('--visible-viewport-height', `${h}px`)
        }
        if (top !== lastTop) {
          lastTop = top
          document.documentElement.style.setProperty('--visible-viewport-top', `${top}px`)
        }
      })
    }

    update()
    window.addEventListener('resize', update, { passive: true })
    window.visualViewport?.addEventListener('resize', update, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])
  return null
}
