import { useState, useCallback } from 'react'

export type TopLayerCategory = 'sheet' | 'dialog' | 'popover'

// Base ranges for layers:
// Sheet / Drawer: 100 - 390
// Dialog / Modal: 500 - 890
// Popover / DropdownMenu / Tooltip / Floating Picker: 9000 - 9990
const layerCounters: Record<TopLayerCategory, number> = {
  sheet: 100,
  dialog: 500,
  popover: 9000,
}

let currentGlobalZIndex = 200

/**
 * Cấp phát z-index mới cho layer tương ứng.
 * Mặc định là 'popover' để luôn nổi trên cùng đè tất cả các layer khác.
 */
export function getNextTopLayerZIndex(category: TopLayerCategory = 'popover'): number {
  layerCounters[category] += 10
  if (category === 'popover') {
    currentGlobalZIndex = Math.max(currentGlobalZIndex + 10, layerCounters.popover)
    return currentGlobalZIndex
  }
  return layerCounters[category]
}

/**
 * Lấy giá trị z-index hiện tại của layer trên cùng.
 */
export function getCurrentTopLayerZIndex(category: TopLayerCategory = 'popover'): number {
  if (category === 'popover') {
    return Math.max(currentGlobalZIndex, layerCounters.popover)
  }
  return layerCounters[category]
}

/**
 * Hook quản lý z-index theo quy tắc Top-Layer:
 * - Sheet/Drawer: nằm ở tầng trung gian (100 - 390)
 * - Dialog/Modal: nằm ở tầng cao (500 - 890)
 * - Popover/Dropdown/Picker: nằm ở tầng cao nhất (9000 - 9990), LUÔN đè lên tất cả Sheet, Dialog và Card
 * Khi người dùng tương tác, bringToFront sẽ đưa phần tử lên đỉnh của layer tương ứng mà không vượt cấp layer.
 */
export function useTopLayerZIndex(isOpen = true, category: TopLayerCategory = 'popover') {
  const [zIndex, setZIndex] = useState(() => (isOpen ? getNextTopLayerZIndex(category) : layerCounters[category]))
  const [prevOpen, setPrevOpen] = useState(isOpen)

  const bringToFront = useCallback((_e?: React.SyntheticEvent) => {
    setZIndex((prev) => {
      const currentHighest = getCurrentTopLayerZIndex(category)
      if (prev < currentHighest) {
        return getNextTopLayerZIndex(category)
      }
      return prev
    })
  }, [category])

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    if (isOpen) {
      const nextZ = getNextTopLayerZIndex(category)
      setZIndex(nextZ)
      return { zIndex: nextZ, bringToFront }
    }
  }

  return { zIndex, bringToFront }
}
