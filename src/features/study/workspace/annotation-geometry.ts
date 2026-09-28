// src/features/study/workspace/annotation-geometry.ts
// Digital Campus v2: Milestone PQA-C3 — Slide Annotation Compaction & Hit-testing Geometry

import type { SlideAnnotationStroke } from '@shared/protocol/room'
import { netDuocCham } from './cong-cu'

/** shape: hình (kiểu hình chọn riêng — chữ nhật, tròn, tam giác, đường thẳng, mũi tên). */
export type AnnotationTool = 'pointer' | 'pen' | 'highlighter' | 'eraser' | 'laser' | 'text' | 'shape'

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

/**
 * Hit-tests normalized point against a list of strokes.
 * Returns the id of the topmost stroke hit within threshold, or null.
 * Chữ (tool 'text') được dò theo khung chữ: cỡ chữ tính theo 1/1000 chiều cao trang, `tiLeNgang` = rộng / cao trang.
 */
export function hitTestStrokes(
  point: [number, number],
  strokes: SlideAnnotationStroke[],
  threshold = 0.03,
  tiLeNgang = 1,
): string | null {
  const theoTrang = strokes.map((s) => (s.tool === 'text' ? { ...s, size: s.size / 1000 } : s))
  return netDuocCham(point, theoTrang, threshold, tiLeNgang)?.id ?? null
}
