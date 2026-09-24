// src/features/study/workspace/annotation-geometry.ts
// Digital Campus v2: Milestone PQA-C3 — Slide Annotation Compaction & Hit-testing Geometry

import type { SlideAnnotationStroke } from '@shared/protocol/room'

export type AnnotationTool = 'pointer' | 'pen' | 'highlighter' | 'eraser' | 'laser'

/**
 * Downsamples / compacts stroke points to <= maxPoints (default 300)
 * while strictly preserving the first point, trajectory, and last point.
 * Also clamps all coordinates within [0, 1].
 */
export function downsampleStrokePoints(
  points: [number, number][],
  maxPoints = 300,
): [number, number][] {
  if (points.length === 0) return []
  if (points.length <= maxPoints) {
    return points.map(([x, y]) => [
      Math.max(0, Math.min(1, Math.round(x * 10000) / 10000)),
      Math.max(0, Math.min(1, Math.round(y * 10000) / 10000)),
    ])
  }

  const result: [number, number][] = []
  const first = points[0]
  const last = points[points.length - 1]

  // Preserve first point
  result.push([
    Math.max(0, Math.min(1, Math.round(first[0] * 10000) / 10000)),
    Math.max(0, Math.min(1, Math.round(first[1] * 10000) / 10000)),
  ])

  // Uniformly sample interior points
  const step = (points.length - 1) / (maxPoints - 1)
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.min(points.length - 2, Math.max(1, Math.round(i * step)))
    const pt = points[idx]
    result.push([
      Math.max(0, Math.min(1, Math.round(pt[0] * 10000) / 10000)),
      Math.max(0, Math.min(1, Math.round(pt[1] * 10000) / 10000)),
    ])
  }

  // Strictly preserve last point
  result.push([
    Math.max(0, Math.min(1, Math.round(last[0] * 10000) / 10000)),
    Math.max(0, Math.min(1, Math.round(last[1] * 10000) / 10000)),
  ])

  return result
}

function distSqToSegment(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = (v[0] - w[0]) ** 2 + (v[1] - w[1]) ** 2
  if (l2 === 0) return (p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = v[0] + t * (w[0] - v[0])
  const projY = v[1] + t * (w[1] - v[1])
  return (p[0] - projX) ** 2 + (p[1] - projY) ** 2
}

/**
 * Hit-tests normalized point against a list of strokes.
 * Returns the id of the topmost stroke hit within threshold, or null.
 */
export function hitTestStrokes(
  point: [number, number],
  strokes: SlideAnnotationStroke[],
  threshold = 0.03,
): string | null {
  const threshSq = threshold * threshold
  // Search reverse order so top-most stroke is hit first
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i]
    const pts = s.points
    if (!pts || pts.length === 0) continue
    if (pts.length === 1) {
      const dSq = (point[0] - pts[0][0]) ** 2 + (point[1] - pts[0][1]) ** 2
      if (dSq <= threshSq) return s.id
      continue
    }
    for (let j = 0; j < pts.length - 1; j++) {
      if (distSqToSegment(point, pts[j], pts[j + 1]) <= threshSq) {
        return s.id
      }
    }
  }
  return null
}
