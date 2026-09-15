import type { WhiteboardStroke } from '@shared/protocol/room'
import { getStroke } from 'perfect-freehand'
import { useRef, useState } from 'react'

interface ChalkboardCanvasProps {
  strokes: WhiteboardStroke[]
  selectedColor: string
  selectedSize: number
  isEraser: boolean
  onSendStroke: (stroke: WhiteboardStroke) => void
  children?: React.ReactNode
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

export function ChalkboardCanvas({
  strokes,
  selectedColor,
  selectedSize,
  isEraser,
  onSendStroke,
  children,
}: ChalkboardCanvasProps) {
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('.interactive-control')) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setCurrentPoints([[Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)]])
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (currentPoints.length === 0) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setCurrentPoints((prev) => [
      ...prev,
      [Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)],
    ])
  }

  const handlePointerUp = () => {
    if (currentPoints.length < 2) { setCurrentPoints([]); return }
    onSendStroke({
      id: `str_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      points: currentPoints,
      color: isEraser ? '#0d1c16' : selectedColor,
      size: isEraser ? selectedSize * 3 : selectedSize,
    })
    setCurrentPoints([])
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d1c16] select-none">
      {/* Chalk grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Pinned background content (e.g. pinned presentation slide) */}
      {children}

      {/* SVG drawing layer — fills the entire surface */}
      <svg
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: isEraser ? 'cell' : 'crosshair', zIndex: 10 }}
      >
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={getSvgPathFromStroke(
              getStroke(stroke.points, { size: stroke.size, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })
            )}
            fill={stroke.color}
            opacity={0.93}
          />
        ))}
        {currentPoints.length > 1 && (
          <path
            d={getSvgPathFromStroke(
              getStroke(currentPoints, {
                size: isEraser ? selectedSize * 3 : selectedSize,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
              })
            )}
            fill={isEraser ? '#0d1c16' : selectedColor}
            opacity={0.93}
          />
        )}
      </svg>
    </div>
  )
}
