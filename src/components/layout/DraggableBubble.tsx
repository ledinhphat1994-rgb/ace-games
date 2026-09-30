import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'

interface Position { x: number; y: number }
interface DraggableBubbleProps {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  bottomOffset?: number
  notification?: boolean
  className?: string
}

export function DraggableBubble({ id, label, icon, onClick, bottomOffset = 84, notification, className }: DraggableBubbleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const dragRef = useRef<{ id: number; x: number; y: number; origin: Position; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const storageKey = 'campus:bubble:' + id

  const constrain = (p: Position): Position => {
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft ?? 0
    const top = viewport?.offsetTop ?? 0
    const width = viewport?.width ?? window.innerWidth
    const height = viewport?.height ?? window.innerHeight
    const nav = document.querySelector<HTMLElement>('[aria-label="Điều hướng chính di động"]')
    const bottom = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().height + 12 : 12
    return {
      x: Math.max(left + 12, Math.min(p.x, left + width - 60)),
      y: Math.max(top + 64, Math.min(p.y, Math.max(top + 64, top + height - bottom - 48))),
    }
  }

  useEffect(() => {
    let initial = { x: window.innerWidth - 60, y: window.innerHeight - bottomOffset - 48 }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Position | null
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) initial = saved
    } catch { /* Storage is optional. */ }
    setPosition(constrain(initial))
    const resize = () => setPosition(p => p ? constrain(p) : p)
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('scroll', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('scroll', resize)
    }
  }, [storageKey, bottomOffset])

  const finishDrag = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== e.pointerId) return
    suppressClick.current = drag.moved || e.type === 'pointercancel'
    dragRef.current = null
    if (drag.moved && position) {
      const snapped = constrain({ ...position, x: position.x < window.innerWidth / 2 ? 12 : window.innerWidth - 60 })
      setPosition(snapped)
      try { localStorage.setItem(storageKey, JSON.stringify(snapped)) } catch { /* Storage is optional. */ }
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      data-testid={'bubble-' + id}
      aria-label={label}
      title={label + ' · Kéo để di chuyển'}
      className={cn('fixed z-40 flex size-12 touch-none select-none items-center justify-center rounded-full border border-white/20 bg-surface-raised text-brand shadow-[0_8px_28px_rgb(0_0_0/0.45)] outline-none transition-[box-shadow,background-color] active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-brand', className)}
      style={{ left: position?.x ?? 0, top: position?.y ?? 0, visibility: position ? 'visible' : 'hidden' }}
      onPointerDown={e => {
        if (e.button !== 0 || !e.isPrimary || !position) return
        suppressClick.current = false
        dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, origin: position, moved: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        const drag = dragRef.current
        if (!drag || drag.id !== e.pointerId) return
        const dx = e.clientX - drag.x
        const dy = e.clientY - drag.y
        if (Math.hypot(dx, dy) > 6) drag.moved = true
        if (drag.moved) setPosition(constrain({ x: drag.origin.x + dx, y: drag.origin.y + dy }))
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onClick={e => {
        if (suppressClick.current && e.detail !== 0) { suppressClick.current = false; return }
        onClick()
      }}
    >
      {icon}
      {notification && <span className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-surface-raised bg-rose-400" aria-label="Có tin mới" />}
    </button>
  )
}
