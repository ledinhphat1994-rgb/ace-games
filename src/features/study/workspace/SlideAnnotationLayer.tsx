// src/features/study/workspace/SlideAnnotationLayer.tsx
// Digital Campus v2: Milestone PQA-C3 — PDF/Slide Annotation Layer & Laser Pointer

import type { SlideAnnotationStroke } from '@shared/protocol/room'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  type AnnotationTool,
  downsampleStrokePoints,
  hitTestStrokes,
} from './annotation-geometry'

export type { AnnotationTool }

interface SlideAnnotationLayerProps {
  pageNumber: number
  strokes: SlideAnnotationStroke[]
  activeTool: AnnotationTool
  selectedColor: string
  canAnnotate: boolean
  onSendStroke?: (stroke: SlideAnnotationStroke) => void
  onRemoveStroke?: (strokeId: string) => void
  laser?: {
    point: [number, number] | null
    page: number
    senderName?: string
    updatedAt: number
  } | null
  onSendLaser?: (point: [number, number] | null, page: number) => void
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'],
  )
  d.push('Z')
  return d.join(' ')
}

export function SlideAnnotationLayer({
  pageNumber,
  strokes,
  activeTool,
  selectedColor,
  canAnnotate,
  onSendStroke,
  onRemoveStroke,
  laser,
  onSendLaser,
}: SlideAnnotationLayerProps) {
  const isDrawingRef = useRef(false)
  const isErasingRef = useRef(false)
  const currentPointsRef = useRef<[number, number][]>([])
  const [activePoints, setActivePoints] = useState<[number, number][]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  // Laser throttle ref
  const lastLaserSentAtRef = useRef(0)

  // Ephemeral laser auto-fade (hide after 1.8s of inactivity)
  const [expiredLaserTime, setExpiredLaserTime] = useState<number | null>(null)
  useEffect(() => {
    if (laser?.point && laser.page === pageNumber) {
      const timer = setTimeout(() => {
        setExpiredLaserTime(laser.updatedAt)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [laser, pageNumber])

  const laserVisible = Boolean(
    laser?.point &&
      laser.page === pageNumber &&
      expiredLaserTime !== laser.updatedAt,
  )

  // Filter strokes for current page
  const pageStrokes = strokes.filter((s) => s.page === pageNumber)

  // Get normalized [0..1] coordinates from mouse/pointer event relative to SVG
  const getNormalizedPoint = useCallback((e: React.PointerEvent<SVGSVGElement>): [number, number] | null => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return null
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    return [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]
  }, [])

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canAnnotate) return
    const pt = getNormalizedPoint(e)
    if (!pt) return

    if (activeTool === 'laser') {
      onSendLaser?.(pt, pageNumber)
      return
    }

    if (activeTool === 'eraser') {
      const hitId = hitTestStrokes(pt, pageStrokes)
      if (hitId) {
        onRemoveStroke?.(hitId)
      }
      isErasingRef.current = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      return
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      isDrawingRef.current = true
      currentPointsRef.current = [pt]
      setActivePoints([pt])
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canAnnotate) return

    if (activeTool === 'laser') {
      const now = Date.now()
      // Throttle laser broadcast to ~30fps (33ms)
      if (now - lastLaserSentAtRef.current > 33) {
        lastLaserSentAtRef.current = now
        const pt = getNormalizedPoint(e)
        if (pt) {
          onSendLaser?.(pt, pageNumber)
        }
      }
      return
    }

    if (activeTool === 'eraser') {
      if (isErasingRef.current) {
        const pt = getNormalizedPoint(e)
        if (pt) {
          const hitId = hitTestStrokes(pt, pageStrokes)
          if (hitId) {
            onRemoveStroke?.(hitId)
          }
        }
      }
      return
    }

    if (!isDrawingRef.current) return
    const pt = getNormalizedPoint(e)
    if (!pt) return

    currentPointsRef.current.push(pt)
    setActivePoints([...currentPointsRef.current])
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'laser') {
      onSendLaser?.(null, pageNumber)
      return
    }

    if (activeTool === 'eraser') {
      isErasingRef.current = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
      return
    }

    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const rawPts = currentPointsRef.current
    if (rawPts.length >= 2 && onSendStroke && (activeTool === 'pen' || activeTool === 'highlighter')) {
      const pts = downsampleStrokePoints(rawPts, 300)
      const strokeSize = activeTool === 'highlighter' ? 22 : 6
      const opacity = activeTool === 'highlighter' ? 0.38 : 1
      onSendStroke({
        id: `slide_str_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        page: pageNumber,
        tool: activeTool,
        points: pts,
        color: selectedColor,
        size: strokeSize,
        opacity,
      })
    }
    currentPointsRef.current = []
    setActivePoints([])
  }

  const handlePointerLeave = () => {
    if (activeTool === 'laser' && canAnnotate) {
      onSendLaser?.(null, pageNumber)
    }
  }

  const isInteractive = canAnnotate && (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser' || activeTool === 'laser')

  return (
    <div
      className="absolute inset-0 h-full w-full pointer-events-none select-none z-10"
      data-testid="slide-annotation-layer"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`absolute inset-0 h-full w-full touch-none ${
          isInteractive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
        style={{
          cursor:
            activeTool === 'laser'
              ? 'none'
              : activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser'
                ? 'crosshair'
                : 'default',
        }}
      >
        {/* Render committed strokes */}
        {pageStrokes.map((s) => {
          const mappedPoints = s.points.map(([px, py]) => [px * 1000, py * 1000])
          const strokePath = getSvgPathFromStroke(
            getStroke(mappedPoints, {
              size: s.size,
              thinning: s.tool === 'highlighter' ? 0 : 0.45,
              smoothing: 0.6,
              streamline: 0.5,
            }),
          )
          return (
            <path
              key={s.id}
              d={strokePath}
              fill={s.color}
              opacity={s.opacity ?? (s.tool === 'highlighter' ? 0.38 : 1)}
              style={{ mixBlendMode: s.tool === 'highlighter' ? 'multiply' : 'normal' }}
            />
          )
        })}

        {/* Render currently drawn active stroke */}
        {activePoints.length > 1 && (
          <path
            d={getSvgPathFromStroke(
              getStroke(
                activePoints.map(([px, py]) => [px * 1000, py * 1000]),
                {
                  size: activeTool === 'highlighter' ? 22 : 6,
                  thinning: activeTool === 'highlighter' ? 0 : 0.45,
                  smoothing: 0.6,
                  streamline: 0.5,
                },
              ),
            )}
            fill={selectedColor}
            opacity={activeTool === 'highlighter' ? 0.38 : 1}
            style={{ mixBlendMode: activeTool === 'highlighter' ? 'multiply' : 'normal' }}
          />
        )}

        {/* Laser pointer dot on SVG coordinates */}
        {laserVisible && laser?.point && (
          <g transform={`translate(${laser.point[0] * 1000}, ${laser.point[1] * 1000})`} data-testid="slide-laser-pointer">
            {/* Outer pulsating ring */}
            <circle r="18" fill="#ef4444" opacity="0.3" className="animate-ping" />
            <circle r="12" fill="#ef4444" opacity="0.5" />
            {/* Core glowing dot */}
            <circle r="6" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
            {/* Laser label tag */}
            {laser.senderName && (
              <g transform="translate(14, -14)">
                <rect
                  x="0"
                  y="0"
                  width={Math.max(60, laser.senderName.length * 8 + 14)}
                  height="20"
                  rx="6"
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="rgba(239, 68, 68, 0.6)"
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y="14"
                  fill="#fecaca"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {laser.senderName}
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
