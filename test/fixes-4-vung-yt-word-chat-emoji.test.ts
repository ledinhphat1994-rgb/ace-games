import { describe, expect, it } from 'vitest'
import workerRaw from '../worker/index.ts?raw'
import docxViewerRaw from '../src/features/study/DocxDocumentViewer.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'
import campusChatDrawerRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'

describe('Kiểm tra 4 vùng sửa lỗi theo yêu cầu người dùng (Hình 1, Vùng 2, Vùng 3, Vùng 4)', () => {
  describe('Hình 1: Tìm nhiều video YouTube nhất có thể (nhiều năm đổ lại, an toàn chịu tải Worker)', () => {
    it('Worker trích xuất continuation token và gọi search continuation để mở rộng kết quả', () => {
      expect(workerRaw).toContain('continuationItemRenderer')
      expect(workerRaw).toContain('continuationEndpoint')
      expect(workerRaw).toContain('https://www.youtube.com/youtubei/v1/search')
    })

    it('Worker nâng giới hạn video trả về lên 100 video', () => {
      expect(workerRaw).toContain('ketQua.slice(0, 100)')
    })

    it('Worker kiểm soát giới hạn subrequest Cloudflare an toàn (tối đa 25 subrequests oEmbed, cache lookups)', () => {
      expect(workerRaw).toContain('countOembed < 25')
      expect(workerRaw).toContain('daBiChanNhung(v.videoId, cache)')
    })
  })

  describe('Vùng 2: File Word hiển thị đúng căn chỉnh lề như trên PC', () => {
    it('Quốc hiệu được căn giữa, in hoa đậm', () => {
      expect(docxViewerRaw).toContain('text-center font-bold text-sm sm:text-base tracking-wider uppercase text-gray-950 mt-2 mb-0.5')
      expect(docxViewerRaw).toContain('CỘNG\\s*HÒA\\s*XÃ\\s*HỘI\\s*CHỦ\\s*NGHĨA\\s*VIỆT\\s*NAM')
    })

    it('Tiêu ngữ được căn giữa và có đường kẻ ngang chuẩn thể thức hành chính Việt Nam', () => {
      expect(docxViewerRaw).toContain('text-center font-bold text-xs sm:text-sm text-gray-900 mb-1')
      expect(docxViewerRaw).toContain('Độc\\s*lập\\s*[-–—]\\s*Tự\\s*do\\s*[-–—]\\s*Hạnh\\s*phúc')
      expect(docxViewerRaw).toContain('w-36 h-[1.5px] bg-gray-900 mx-auto mt-1 mb-6')
    })

    it('Tên văn bản (BẢN CAM KẾT, ĐƠN XIN...) được căn giữa, in hoa cỡ lớn', () => {
      expect(docxViewerRaw).toContain('text-center font-bold text-base sm:text-lg text-gray-950 uppercase mt-5 mb-4 tracking-wide')
      expect(docxViewerRaw).toContain('BẢN\\s+CAM\\s+KẾT')
    })

    it('Ngày tháng năm được căn phải nghiêng', () => {
      expect(docxViewerRaw).toContain('text-right italic text-xs sm:text-sm text-gray-800 my-2.5')
    })

    it('Các điều khoản danh sách 1., 2. áp dụng hanging indent và căn đều 2 bên (text-justify)', () => {
      expect(docxViewerRaw).toContain('pl-8 sm:pl-10 mb-2.5 leading-relaxed text-gray-900 text-justify [text-indent:-1.5rem]')
    })

    it('Đoạn văn thông thường thụt đầu dòng 1cm và căn đều 2 bên', () => {
      expect(docxViewerRaw).toContain('leading-relaxed text-gray-900 text-justify indent-6 sm:indent-8')
    })

    it('Trang giấy Word thiết kế khổ A4 chuẩn với font-serif (Times New Roman)', () => {
      expect(docxViewerRaw).toContain('docx-preview-doc bg-white text-gray-900 shadow-2xl rounded-xs mx-auto my-6 p-8 sm:p-14 md:p-16 max-w-[850px] w-full min-h-[1100px] font-serif')
    })
  })

  describe('Vùng 3: Header tab trò chuyện Bạn bè, Toàn trường, Phòng', () => {
    it('Thanh tab trò chuyện chứa các tab chuẩn', () => {
      expect(campusChatSheetRaw).toContain('aria-label="Tab Bạn bè"')
      expect(campusChatSheetRaw).toMatch(/aria-label="Tab (Toàn trường|Chung)"/)
    })
  })

  describe('Vùng 4: Giảm tần suất (slow down) click emoji để tránh spam', () => {
    it('CampusChatDrawer định nghĩa cooldown EMOJI_CLICK_COOLDOWN_MS = 650', () => {
      expect(campusChatDrawerRaw).toContain('EMOJI_CLICK_COOLDOWN_MS = 650')
    })

    it('Có lastReactionTimeRef ghi nhớ thời điểm click từng reaction', () => {
      expect(campusChatDrawerRaw).toContain('lastReactionTimeRef = useRef<Record<string, number>>({})')
    })

    it('Kiểm tra cooldown khi tăng emoji hoặc chọn emoji mới', () => {
      expect(campusChatDrawerRaw).toContain('if (now - (lastReactionTimeRef.current[key] || 0) < EMOJI_CLICK_COOLDOWN_MS)')
      expect(campusChatDrawerRaw).toContain('lastReactionTimeRef.current[key] = now')
    })
  })
})
