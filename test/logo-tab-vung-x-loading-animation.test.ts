import { describe, it, expect } from 'vitest'
import faviconRaw from '../public/favicon.svg?raw'
import logoRaw from '../src/components/brand/DigitalCampusLogo.tsx?raw'
import authGateRaw from '../src/app/AuthGate.tsx?raw'
import khungChoTrangRaw from '../src/components/layout/KhungChoTrang.tsx?raw'
import indexHtmlRaw from '../index.html?raw'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import caroBoardRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryGameRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

describe('Logo tab, Logo Vùng X & Màn hình loading Ace Games', () => {
  it('1. Logo vùng tab (public/favicon.svg) đồng bộ với logo vùng X và không có dấu chấm tròn', () => {
    // Đã đổi từ tia sét tím cũ sang logo squircle chữ A
    expect(faviconRaw).not.toContain('#863bff')
    // Khung squircle bo góc
    expect(faviconRaw).toContain('rx="23"')
    // Path chữ A đặc trưng
    expect(faviconRaw).toContain('M50 16C43.5 16 35.8 28.5')
    // Tuyệt đối không có dấu chấm tròn nào
    expect(faviconRaw).not.toContain('<circle')
  })

  it('2. Logo vùng X (DigitalCampusLogo.tsx) đã xóa hoàn toàn dấu chấm tròn & hỗ trợ animation chạy dọc chữ A', () => {
    // Xóa dấu chấm tròn live signal ở góc trên bên phải
    expect(logoRaw).not.toContain('animate-ping')
    expect(logoRaw).not.toContain('rounded-full bg-sky-400')
    // Xóa viên ngọc tròn ở giữa vòm chữ A
    expect(logoRaw).not.toContain('<circle')

    // Hỗ trợ prop loading và size 2xl
    expect(logoRaw).toContain("loading = false")
    expect(logoRaw).toContain("'2xl'")

    // Có hiệu ứng animated chạy dọc chữ A khi chờ
    expect(logoRaw).toContain('dc-a-pulse-outer')
    expect(logoRaw).toContain('dc-a-pulse-inner')
    expect(logoRaw).toContain('dcPulseTrace')
    expect(logoRaw).toContain('stroke-dashoffset')
  })

  it('3. Màn hình loading (AuthGate.tsx) chỉ hiện duy nhất logo to bản, không có text hay spinner', () => {
    // Trong khối phien.isPending chỉ render DigitalCampusLogo size 2xl loading
    expect(authGateRaw).toContain('<DigitalCampusLogo size="2xl" loading showGlow />')
    expect(authGateRaw).not.toContain('<LogoCampus />')
    // Không có spinner Loader2 trong AuthGate
    expect(authGateRaw).not.toContain('Loader2')
  })

  it('4. Khung giữ chỗ khi tải trang (KhungChoTrang.tsx) đồng bộ hiển thị màn hình loading cố định 1 loại', () => {
    expect(khungChoTrangRaw).toContain('<DigitalCampusLogo size="2xl" loading showGlow />')
    expect(khungChoTrangRaw).toContain('fixed inset-0')
  })

  it('5. Màn hình loading ban đầu trong index.html và DigitalCampusLogo có tia laser chuẩn xác dọc chữ A', () => {
    expect(indexHtmlRaw).toContain('id="init-a-clip"')
    expect(indexHtmlRaw).toContain('M 23 81 C 26 58, 41 21, 50 18 C 59 21, 74 58, 77 81')
    expect(indexHtmlRaw).toContain('initTrace')

    // DigitalCampusLogo có clipPath dc-a-laser-clip và laser pulse
    expect(logoRaw).toContain('id="dc-a-laser-clip"')
    expect(logoRaw).toContain('dc-a-pulse-outer')
    expect(logoRaw).toContain('dc-a-pulse-inner')
    // Không còn rect scan-bar thô
    expect(logoRaw).not.toContain('dc-a-scan-bar')
  })

  it('6. Cài đặt trận đấu cờ tướng (XiangqiBoard.tsx) đồng bộ 100% với cờ vua (loại bỏ ghim công cụ, giữ đúng 4 mục + Áp Dụng)', () => {
    // Loại bỏ khối ghim công cụ quanh avatar trong settings modal
    expect(xiangqiBoardRaw).not.toContain('MỤC 1: GHIM CÔNG CỤ QUANH AVATAR')
    expect(xiangqiBoardRaw).not.toContain('Công cụ quanh avatar')
    // Có thẻ hồ sơ mở chi tiết
    expect(xiangqiBoardRaw).toContain('setSelectedProfileUser')
    expect(xiangqiBoardRaw).toContain('Kỳ thủ cờ tướng')
    // Mục thời gian mỗi bên + tùy chỉnh
    expect(xiangqiBoardRaw).toContain('Thời gian mỗi bên:')
    expect(xiangqiBoardRaw).toContain('Tùy chỉnh thời gian:')
    // Âm thanh cờ & Gợi ý nước đi & Xoay bàn cờ
    expect(xiangqiBoardRaw).toContain('Âm thanh cờ')
    expect(xiangqiBoardRaw).toContain('Gợi ý nước đi')
    expect(xiangqiBoardRaw).toContain('Xoay bàn cờ')
    // Nút Áp Dụng màu amber
    expect(xiangqiBoardRaw).toContain('Áp Dụng')
  })

  it('7. Cài đặt trận đấu Caro (CaroBoard.tsx) đồng bộ chuẩn cờ vua (có gợi ý nước đi, xoay bàn cờ, nút Áp Dụng)', () => {
    expect(caroBoardRaw).toContain('Kỳ thủ cờ caro')
    expect(caroBoardRaw).toContain('Thời gian mỗi bên:')
    expect(caroBoardRaw).toContain('Tùy chỉnh thời gian:')
    expect(caroBoardRaw).toContain('Âm thanh cờ')
    expect(caroBoardRaw).toContain('Gợi ý nước đi')
    expect(caroBoardRaw).toContain('showHints')
    expect(caroBoardRaw).toContain('Xoay bàn cờ')
    expect(caroBoardRaw).toContain('Áp Dụng')
  })

  it('8. Cài đặt trận đấu Trí Nhớ (MemoryGame.tsx) đồng bộ chuẩn cờ vua (thẻ kỳ thủ trí nhớ, âm thanh cờ, gợi ý nước đi, nút Áp Dụng)', () => {
    expect(memoryGameRaw).toContain('Kỳ thủ trí nhớ')
    expect(memoryGameRaw).toContain('Thời gian mỗi bên:')
    expect(memoryGameRaw).toContain('Tùy chỉnh thời gian:')
    expect(memoryGameRaw).toContain('Âm thanh cờ')
    expect(memoryGameRaw).toContain('Gợi ý nước đi')
    expect(memoryGameRaw).toContain('showHints')
    expect(memoryGameRaw).toContain('Đặt lại ván chơi')
    expect(memoryGameRaw).toContain('Áp Dụng')
  })
})
