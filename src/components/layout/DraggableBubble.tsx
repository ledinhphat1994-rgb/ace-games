import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Position { x: number; y: number }
interface BubbleAction { id: string; label: string; icon: ReactNode; onSelect: () => void }
interface DraggableBubbleProps {
  id: string
  label: string
  icon: ReactNode
  actions: BubbleAction[]
  suspended?: boolean
  bottomOffset?: number
}

const SIZE = 48
const EDGE = 8
const IDLE_DELAY = 3200
const MENU_WIDTH = 208
const MENU_HEIGHT = 112

function viewportBounds() {
  const viewport = window.visualViewport
  return {
    left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight,
  }
}

function constrain(position: Position): Position {
  const { left, top, width, height } = viewportBounds()
  return {
    x: Math.max(left + EDGE, Math.min(position.x, left + width - SIZE - EDGE)),
    y: Math.max(top + EDGE, Math.min(position.y, top + height - SIZE - EDGE)),
  }
}

export function DraggableBubble({ id, label, icon, actions, suspended = false, bottomOffset = 96 }: DraggableBubbleProps) {
  const storageKey = 'campus:bubble:' + id
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<Position>(() => {
    let initial = { x: window.innerWidth - SIZE - 16, y: window.innerHeight - bottomOffset - SIZE }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Position | null
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) initial = saved
    } catch { /* Storage is optional. */ }
    return constrain(initial)
  })
  const [open, setOpen] = useState(false)
  const [idle, setIdle] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [keyboardFocused, setKeyboardFocused] = useState(false)
  const dragRef = useRef<{ id: number; x: number; y: number; origin: Position; latest: Position; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => {
    if (open || dragging || hovered || keyboardFocused || suspended) return
    const timer = window.setTimeout(() => setIdle(true), IDLE_DELAY)
    return () => window.clearTimeout(timer)
  }, [open, dragging, hovered, keyboardFocused, suspended])

  useEffect(() => {
    const resize = () => setPosition(previous => constrain(previous))
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('scroll', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('scroll', resize)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    suppressClick.current = drag.moved || event.type === 'pointercancel'
    dragRef.current = null
    setDragging(false)
    if (drag.moved) {
      const finalPosition = constrain(drag.latest)
      setPosition(finalPosition)
      try { localStorage.setItem(storageKey, JSON.stringify(finalPosition)) } catch { /* Storage is optional. */ }
    }
  }

  const bounds = viewportBounds()
  const menuLeft = Math.max(bounds.left + EDGE, Math.min(position.x, bounds.left + bounds.width - MENU_WIDTH - EDGE))
  const menuTop = Math.max(bounds.top + EDGE, Math.min(
    position.y - MENU_HEIGHT - 12 >= bounds.top + EDGE ? position.y - MENU_HEIGHT - 12 : position.y + SIZE + 12,
    bounds.top + bounds.height - MENU_HEIGHT - EDGE,
  ))
  const focusAction = (last = false) => window.requestAnimationFrame(() => {
    const buttons = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    buttons?.[last ? buttons.length - 1 : 0]?.focus({ preventScroll: true })
  })

  return (
    <div ref={rootRef} hidden={suspended} data-testid="activity-bubble" data-idle={idle && !open && !dragging}
      className={cn('fixed z-[45] size-12 transition-opacity duration-300 motion-reduce:transition-none', idle && !open && !dragging ? 'opacity-35' : 'opacity-100')}
      style={{ left: position.x, top: position.y }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') { setHovered(true); setIdle(false) } }}
      onPointerLeave={event => { if (event.pointerType === 'mouse') setHovered(false) }}
      onFocus={event => { setIdle(false); if (event.target.matches(':focus-visible')) setKeyboardFocused(true) }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false) }}>
      <button ref={buttonRef} type="button" data-testid={'bubble-' + id} aria-label={label}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? 'activity-bubble-menu' : undefined}
        title={label + ' · Kéo hoặc Shift + phím mũi tên để di chuyển'}
        className={cn('flex size-12 touch-none select-none items-center justify-center rounded-full border border-brand/30 bg-surface-raised text-brand shadow-[0_6px_24px_rgb(0_0_0/0.4)] outline-none transition-[background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-brand', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={event => {
          if (event.button !== 0 || !event.isPrimary) return
          setIdle(false)
          setDragging(true)
          suppressClick.current = false
          dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position, latest: position, moved: false }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => {
          const drag = dragRef.current
          if (!drag || drag.id !== event.pointerId) return
          const dx = event.clientX - drag.x
          const dy = event.clientY - drag.y
          if (Math.hypot(dx, dy) > 6) drag.moved = true
          if (drag.moved) {
            setOpen(false)
            setDragging(true)
            drag.latest = constrain({ x: drag.origin.x + dx, y: drag.origin.y + dy })
            setPosition(drag.latest)
          }
        }}
        onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
        onKeyDown={event => {
          if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault()
            setIdle(false)
            setOpen(false)
            const next = constrain({ x: position.x + (event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0), y: position.y + (event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0) })
            setPosition(next)
            try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* Storage is optional. */ }
            return
          }
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault(); setIdle(false); setOpen(true); focusAction(event.key === 'ArrowUp')
        }}
        onClick={event => {
          if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return }
          setIdle(false); setOpen(!open)
          if (!open && event.detail === 0) focusAction()
        }}>
        {open ? <X className="size-5" /> : icon}
      </button>
      {open && (
        <div id="activity-bubble-menu" role="menu" aria-label="Tiện ích" data-testid="activity-bubble-menu"
          className="fixed grid gap-1.5 rounded-2xl border border-border-default bg-surface-raised p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none"
          style={{ left: menuLeft, top: menuTop, width: MENU_WIDTH }}
          onKeyDown={event => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
            const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
            buttons[index]?.focus({ preventScroll: true })
          }}>
          {actions.map(action => (
            <button key={action.id} type="button" role="menuitem" data-testid={'bubble-action-' + action.id}
              onClick={() => { setIdle(false); setOpen(false); action.onSelect() }}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-primary outline-none hover:bg-surface-overlay focus-visible:bg-surface-overlay focus-visible:ring-2 focus-visible:ring-brand">
              <span className="text-brand">{action.icon}</span>{action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
