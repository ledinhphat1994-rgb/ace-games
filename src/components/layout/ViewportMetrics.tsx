import { useEffect } from 'react'

// The visual viewport also shrinks for the on-screen keyboard on iOS Safari.
export function ViewportMetrics() {
  useEffect(() => {
    const update = () => {
      const viewport = window.visualViewport
      document.documentElement.style.setProperty('--visible-viewport-height', (viewport?.height ?? window.innerHeight) + 'px')
      document.documentElement.style.setProperty('--visible-viewport-top', (viewport?.offsetTop ?? 0) + 'px')
    }
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])
  return null
}
