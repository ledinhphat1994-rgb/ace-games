import { useState, useRef, useCallback } from 'react'
import { triggerHaptic } from '@/lib/web-experience'
import type { CapDoMay } from './cap-do-may'

export function useHoldBotDifficulty(
  initialLevel: CapDoMay = 'medium',
  onLevelChange?: (level: CapDoMay) => void
) {
  const [aiLevel, setAiLevelState] = useState<CapDoMay>(initialLevel)
  const [isOpen, setIsOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<{
    top: number
    left: number
    right: number
    bottom: number
  } | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoldTriggeredRef = useRef(false)

  const handleLevelChange = useCallback(
    (level: CapDoMay) => {
      setAiLevelState(level)
      onLevelChange?.(level)
    },
    [onLevelChange]
  )

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isHoldTriggeredRef.current = false
    const rect = e.currentTarget.getBoundingClientRect()
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      isHoldTriggeredRef.current = true
      triggerHaptic('medium')
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      })
      setIsOpen(true)
    }, 420)
  }, [])

  const onPointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const onPointerLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    triggerHaptic('selection')
    setAnchorRect({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    })
    setIsOpen(true)
  }, [])

  const wrapClickHandler = useCallback(
    <T extends React.MouseEvent<any>>(defaultClickHandler: (e: T) => void) => {
      return (e: T) => {
        if (isHoldTriggeredRef.current) {
          e.preventDefault()
          e.stopPropagation()
          isHoldTriggeredRef.current = false
          return
        }
        defaultClickHandler(e)
      }
    },
    []
  )

  return {
    aiLevel,
    setAiLevel: handleLevelChange,
    isDifficultyMenuOpen: isOpen,
    closeDifficultyMenu: () => setIsOpen(false),
    anchorRect,
    botHoldHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onContextMenu,
    },
    wrapClickHandler,
  }
}
