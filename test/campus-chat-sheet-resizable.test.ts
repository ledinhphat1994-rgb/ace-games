import { describe, it, expect } from 'vitest'
import chatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'

describe('CampusChatSheet: Khôi phục và nâng cấp khả năng co dãn đa cạnh trên Desktop', () => {
  it('Hỗ trợ co dãn ở đầy đủ các hướng: cạnh trái, cạnh trên, cạnh dưới, góc trên-trái, góc dưới-trái', () => {
    // Kiểu hỗ trợ resize đầy đủ
    expect(chatSheetRaw).toContain("direction: 'w' | 'n' | 's' | 'nw' | 'sw'")
    // Các tay cầm co dãn tương ứng
    expect(chatSheetRaw).toContain("handleResizeStart(e, 'w')")
    expect(chatSheetRaw).toContain("handleResizeStart(e, 'n')")
    expect(chatSheetRaw).toContain("handleResizeStart(e, 's')")
    expect(chatSheetRaw).toContain("handleResizeStart(e, 'nw')")
    expect(chatSheetRaw).toContain("handleResizeStart(e, 'sw')")
  })

  it('Lưu trữ và điều khiển linh hoạt bottomOffset khi kéo cạnh dưới và góc dưới-trái', () => {
    expect(chatSheetRaw).toContain('bottomOffset?: number')
    expect(chatSheetRaw).toContain('bottomOffset: nextBottom')
    expect(chatSheetRaw).toContain('dimensions.bottomOffset ?? 84')
  })

  it('Ngăn chặn layout landscape mobile đè lên màn hình Desktop ngang (16:9)', () => {
    // Chỉ kích hoạt landscape khi KHÔNG phải Desktop (!isDesktop)
    expect(chatSheetRaw).toContain('!isDesktop &&')
    expect(chatSheetRaw).toContain("'landscape:top-2 landscape:bottom-[max(0.5rem,env(safe-area-inset-bottom,8px))]")
  })

  it('Style inline điều khiển chính xác kích thước và vị trí bảng chat trên Desktop', () => {
    expect(chatSheetRaw).toContain('width: `${dimensions.width}px`')
    expect(chatSheetRaw).toContain('height: `${dimensions.height}px`')
    expect(chatSheetRaw).toContain('bottom: `${dimensions.bottomOffset ?? 84}px`')
  })
})
