import { useRef, useState, useCallback, useEffect } from 'react'

interface DragScrollOptions {
  direction?: 'horizontal' | 'vertical' | 'both'
  dragSpeed?: number
  enableMomentum?: boolean
}

/**
 * Hook hỗ trợ bấm giữ chuột trái (mouse hold-and-drag) hoặc bấm giữ cảm ứng (touch hold-and-drag)
 * với chuyển động quán tính (momentum / inertial glide) và tối ưu hóa 60-120fps bằng requestAnimationFrame.
 * - Tránh giật xé hình (layout thrashing) nhờ RAF batching.
 * - Khi thả tay sau khi vuốt/kéo, nội dung tiếp tục lướt mượt mà có quán tính như trải nghiệm iOS/macOS.
 * - Tự động chặn click nhầm vào con khi đang kéo.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>(options: DragScrollOptions = {}) {
  const { direction = 'horizontal', dragSpeed = 1.0, enableMomentum = true } = options
  const ref = useRef<T | null>(null)

  const isDown = useRef(false)
  const isTouch = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const scrollLeftStart = useRef(0)
  const scrollTopStart = useRef(0)
  const hasMoved = useRef(false)

  // Velocity tracking for inertial glide
  const lastTime = useRef(0)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const velocityX = useRef(0)
  const velocityY = useRef(0)

  // RAF handles
  const rafMoveId = useRef<number | null>(null)
  const rafMomentumId = useRef<number | null>(null)
  const pendingScrollLeft = useRef<number | null>(null)
  const pendingScrollTop = useRef<number | null>(null)

  const [isDragging, setIsDragging] = useState(false)

  const stopMomentum = useCallback(() => {
    if (rafMomentumId.current !== null) {
      cancelAnimationFrame(rafMomentumId.current)
      rafMomentumId.current = null
    }
    velocityX.current = 0
    velocityY.current = 0
  }, [])

  const startMomentum = useCallback(() => {
    if (!enableMomentum || !ref.current) return
    stopMomentum()

    let lastMomentumTime = performance.now()
    const friction = 0.95 // Hệ số ma sát lướt mượt trơn tru

    const momentumLoop = (now: number) => {
      if (!ref.current) return
      const dt = Math.min(now - lastMomentumTime, 32)
      lastMomentumTime = now

      if (direction === 'horizontal' || direction === 'both') {
        ref.current.scrollLeft -= velocityX.current * dt
        velocityX.current *= Math.pow(friction, dt / 16)
      }

      if (direction === 'vertical' || direction === 'both') {
        ref.current.scrollTop -= velocityY.current * dt
        velocityY.current *= Math.pow(friction, dt / 16)
      }

      const isStillMovingX = Math.abs(velocityX.current) > 0.02
      const isStillMovingY = Math.abs(velocityY.current) > 0.02

      if (isStillMovingX || isStillMovingY) {
        rafMomentumId.current = requestAnimationFrame(momentumLoop)
      } else {
        rafMomentumId.current = null
      }
    }

    if (Math.abs(velocityX.current) > 0.05 || Math.abs(velocityY.current) > 0.05) {
      rafMomentumId.current = requestAnimationFrame(momentumLoop)
    }
  }, [direction, enableMomentum, stopMomentum])

  // 1. Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || !ref.current) return
      stopMomentum()

      isDown.current = true
      isTouch.current = false
      hasMoved.current = false
      startX.current = e.pageX
      startY.current = e.pageY
      lastX.current = e.pageX
      lastY.current = e.pageY
      lastTime.current = performance.now()
      scrollLeftStart.current = ref.current.scrollLeft
      scrollTopStart.current = ref.current.scrollTop
      pendingScrollLeft.current = ref.current.scrollLeft
      pendingScrollTop.current = ref.current.scrollTop

      if (ref.current) {
        ref.current.style.scrollBehavior = 'auto'
      }
    },
    [stopMomentum],
  )

  // 2. Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!ref.current || e.touches.length !== 1) return
      stopMomentum()

      isDown.current = true
      isTouch.current = true
      hasMoved.current = false
      const touch = e.touches[0]
      startX.current = touch.pageX
      startY.current = touch.pageY
      lastX.current = touch.pageX
      lastY.current = touch.pageY
      lastTime.current = performance.now()
      scrollLeftStart.current = ref.current.scrollLeft
      scrollTopStart.current = ref.current.scrollTop
      pendingScrollLeft.current = ref.current.scrollLeft
      pendingScrollTop.current = ref.current.scrollTop

      if (ref.current) {
        ref.current.style.scrollBehavior = 'auto'
      }
    },
    [stopMomentum],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDown.current || !ref.current || e.touches.length !== 1) return
      const touch = e.touches[0]
      const now = performance.now()
      const dt = Math.max(now - lastTime.current, 1)

      const deltaX = (touch.pageX - startX.current) * dragSpeed
      const deltaY = (touch.pageY - startY.current) * dragSpeed

      // Instant velocity tracking
      const vx = ((touch.pageX - lastX.current) / dt) * dragSpeed
      const vy = ((touch.pageY - lastY.current) / dt) * dragSpeed
      velocityX.current = velocityX.current * 0.4 + vx * 0.6
      velocityY.current = velocityY.current * 0.4 + vy * 0.6
      lastX.current = touch.pageX
      lastY.current = touch.pageY
      lastTime.current = now

      if (Math.abs(touch.pageX - startX.current) > 4 || Math.abs(touch.pageY - startY.current) > 4) {
        if (!hasMoved.current) {
          hasMoved.current = true
          setIsDragging(true)
          if (ref.current) ref.current.classList.add('is-dragging')
        }
      }

      if (hasMoved.current) {
        if (direction === 'horizontal' || direction === 'both') {
          ref.current.scrollLeft = scrollLeftStart.current - deltaX
        }
        if (direction === 'vertical' || direction === 'both') {
          ref.current.scrollTop = scrollTopStart.current - deltaY
        }
      }
    },
    [direction, dragSpeed],
  )

  const onTouchEnd = useCallback(() => {
    if (!isDown.current) return
    isDown.current = false
    if (ref.current) ref.current.classList.remove('is-dragging')
    startMomentum()

    setTimeout(() => {
      hasMoved.current = false
      setIsDragging(false)
    }, 70)
  }, [startMomentum])

  // 3. Global Mouse Listeners (prevents dropping drag when cursor leaves container)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDown.current || isTouch.current || !ref.current) return

      const now = performance.now()
      const dt = Math.max(now - lastTime.current, 1)
      const deltaX = (e.pageX - startX.current) * dragSpeed
      const deltaY = (e.pageY - startY.current) * dragSpeed

      // Instant velocity tracking with exponential smoothing
      const vx = ((e.pageX - lastX.current) / dt) * dragSpeed
      const vy = ((e.pageY - lastY.current) / dt) * dragSpeed
      velocityX.current = velocityX.current * 0.35 + vx * 0.65
      velocityY.current = velocityY.current * 0.35 + vy * 0.65
      lastX.current = e.pageX
      lastY.current = e.pageY
      lastTime.current = now

      // Ngưỡng phát hiện thao tác kéo (3px cực nhạy)
      if (Math.abs(e.pageX - startX.current) > 3 || Math.abs(e.pageY - startY.current) > 3) {
        if (!hasMoved.current) {
          hasMoved.current = true
          setIsDragging(true)
          if (ref.current) ref.current.classList.add('is-dragging')
        }
      }

      if (hasMoved.current) {
        e.preventDefault()

        pendingScrollLeft.current = scrollLeftStart.current - deltaX
        pendingScrollTop.current = scrollTopStart.current - deltaY

        if (rafMoveId.current === null) {
          rafMoveId.current = requestAnimationFrame(() => {
            if (!ref.current) return
            if ((direction === 'horizontal' || direction === 'both') && pendingScrollLeft.current !== null) {
              ref.current.scrollLeft = pendingScrollLeft.current
            }
            if ((direction === 'vertical' || direction === 'both') && pendingScrollTop.current !== null) {
              ref.current.scrollTop = pendingScrollTop.current
            }
            rafMoveId.current = null
          })
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (!isDown.current) return
      isDown.current = false
      if (ref.current) ref.current.classList.remove('is-dragging')
      if (rafMoveId.current !== null) {
        cancelAnimationFrame(rafMoveId.current)
        rafMoveId.current = null
      }

      startMomentum()

      setTimeout(() => {
        hasMoved.current = false
        setIsDragging(false)
      }, 70)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      if (rafMoveId.current !== null) cancelAnimationFrame(rafMoveId.current)
      if (rafMomentumId.current !== null) cancelAnimationFrame(rafMomentumId.current)
    }
  }, [direction, dragSpeed, startMomentum])

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  return {
    ref,
    isDragging,
    events: {
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onClickCapture,
    },
  }
}
