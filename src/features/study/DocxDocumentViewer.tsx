// src/features/study/DocxDocumentViewer.tsx
// Trình xem tài liệu Word (.docx) trực tiếp trên trình duyệt bằng docx-preview.
// Dựng tài liệu theo từng trang giấy (page break, margins, tables, styles, images) không phụ thuộc dịch vụ ngoài.

import { renderAsync } from 'docx-preview'
import {
  Download,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface DocxDocumentViewerProps {
  docUrl: string
  docName: string
  compact?: boolean
  hideHeader?: boolean
  scale?: number
  canControl?: boolean
  canScroll?: boolean
  scrollRatio?: number
  onScrollRatioChange?: (ratio: number, scrollTop: number, scrollHeight: number) => void
  children?: ReactNode
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export { cleanAndStitchVietnamese, assembleCoherentParagraphs } from './docx-vietnamese-utils'
import { cleanAndStitchVietnamese, assembleCoherentParagraphs } from './docx-vietnamese-utils'

function extractUtf16Paragraphs(bytes: Uint8Array): string[] {
  const rawLines: string[] = []
  let currentRun: number[] = []
  let consecutiveNonWord = 0

  const isWordChar = (code: number) => {
    if (code >= 0x20 && code <= 0x7e) return true
    if (code === 0x09 || code === 0x0a || code === 0x0d) return true
    if (code >= 0x00a0 && code <= 0x02ff) return true
    if (code >= 0x0300 && code <= 0x036f) return true
    if (code >= 0x1ab0 && code <= 0x1aff) return true
    if (code >= 0x1dc0 && code <= 0x1dff) return true
    if (code >= 0x1ea0 && code <= 0x1ef9) return true
    if (code >= 0x2000 && code <= 0x206f) return true
    if (code >= 0x20a0 && code <= 0x20cf) return true
    if (code >= 0xfe00 && code <= 0xfe0f) return true
    return false
  }

  const isIgnored = (s: string) => {
    const t = s.trim()
    if (t.length < 2) return true
    if (/^(Normal|Heading \d|Default Paragraph Font|Table Normal|Body Text|No List|Header|Footer)$/i.test(t)) return true
    if (/^(Times New Roman|Arial|Calibri|Tahoma|Verdana|Symbol|Wingdings|Courier New)$/i.test(t)) return true
    if (/^[A-Za-z0-9_\-.]+$/i.test(t) && t.length < 8 && !/[aeiouy]/i.test(t)) return true
    return false
  }

  const flushRun = () => {
    if (currentRun.length >= 2) {
      const text = String.fromCharCode(...currentRun).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 2 && !isIgnored(l))
      rawLines.push(...lines)
    }
    currentRun = []
    consecutiveNonWord = 0
  }

  for (let i = 0; i < bytes.length - 1; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8)
    if (isWordChar(code)) {
      currentRun.push(code)
      consecutiveNonWord = 0
    } else {
      consecutiveNonWord++
      if (code === 0x0d || code === 0x0a || consecutiveNonWord >= 4) {
        flushRun()
      }
    }
  }
  flushRun()

  return assembleCoherentParagraphs(rawLines)
}

function extract8BitParagraphs(bytes: Uint8Array): string[] {
  const rawLines: string[] = []
  let currentRun: number[] = []
  let consecutiveNonWord = 0

  const isWordByte = (b: number) => {
    if (b >= 0x20 && b <= 0x7e) return true
    if (b === 0x09 || b === 0x0a || b === 0x0d) return true
    if (b >= 0x80 && b <= 0xff) return true
    return false
  }

  const isIgnored = (s: string) => {
    const t = s.trim()
    if (t.length < 2) return true
    if (/^(Normal|Heading \d|Default Paragraph Font|Table Normal|Body Text|No List|Header|Footer)$/i.test(t)) return true
    if (/^(Times New Roman|Arial|Calibri|Tahoma|Verdana|Symbol|Wingdings|Courier New)$/i.test(t)) return true
    return false
  }

  const flushRun = () => {
    if (currentRun.length >= 2) {
      const text = new TextDecoder('utf-8', { fatal: false })
        .decode(new Uint8Array(currentRun))
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 2 && !isIgnored(l))
      rawLines.push(...lines)
    }
    currentRun = []
    consecutiveNonWord = 0
  }

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (isWordByte(b)) {
      currentRun.push(b)
      consecutiveNonWord = 0
    } else {
      consecutiveNonWord++
      if (b === 0x0d || b === 0x0a || consecutiveNonWord >= 4) {
        flushRun()
      }
    }
  }
  flushRun()

  return assembleCoherentParagraphs(rawLines)
}

function renderParagraphs(paras: string[], container: HTMLElement, docName: string) {
  const page = document.createElement('div')
  page.className =
    'docx-preview-doc bg-white text-gray-900 shadow-2xl rounded-xs mx-auto my-6 p-8 sm:p-14 md:p-16 max-w-[850px] w-full min-h-[1100px] font-serif leading-relaxed text-[15px] select-text border border-gray-200'

  const header = document.createElement('div')
  header.className = 'border-b border-gray-200 pb-3 mb-6 flex items-center justify-between text-xs text-gray-500 font-sans'
  header.innerHTML = `
    <span class="font-semibold text-blue-600 flex items-center gap-1.5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      Tài liệu Word
    </span>
    <span class="truncate max-w-[280px]">${escapeHtml(docName)}</span>
  `
  page.appendChild(header)

  for (let i = 0; i < paras.length; i++) {
    const para = cleanAndStitchVietnamese(paras[i])
    if (!para) continue
    const p = document.createElement('p')

    // 1. Quốc hiệu
    if (/^CỘNG\s*HÒA\s*XÃ\s*HỘI\s*CHỦ\s*NGHĨA\s*VIỆT\s*NAM/i.test(para)) {
      p.className = 'text-center font-bold text-sm sm:text-base tracking-wider uppercase text-gray-950 mt-2 mb-0.5'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 2. Tiêu ngữ
    if (/^Độc\s*lập\s*[-–—]\s*Tự\s*do\s*[-–—]\s*Hạnh\s*phúc/i.test(para)) {
      p.className = 'text-center font-bold text-xs sm:text-sm text-gray-900 mb-1'
      p.textContent = para
      page.appendChild(p)

      // Kẻ vạch chuẩn thể thức văn bản hành chính Việt Nam dưới tiêu ngữ
      const rule = document.createElement('div')
      rule.className = 'w-36 h-[1.5px] bg-gray-900 mx-auto mt-1 mb-6'
      page.appendChild(rule)
      continue
    }

    // 3. Tên văn bản / Tiêu đề chính (BẢN CAM KẾT, ĐƠN XIN..., BÁO CÁO...)
    const isDocTitle =
      /^(BẢN\s+CAM\s+KẾT|BÁO\s+CÁO|ĐƠN\s+XIN|KẾ\s+HOẠCH|QUYẾT\s+ĐỊNH|BIÊN\s+BẢN|TỜ\s+TRÌNH|THÔNG\s+BÁO|NỘI\s+QUY|QUY\s+CHẾ|GIẤY\s+XÁC\s+NHẬN|GIẤY\s+ĐỀ\s+NGHỊ|HỢP\s+ĐỒNG)\b/i.test(
        para
      ) ||
      (para.length < 60 &&
        para === para.toUpperCase() &&
        /[A-ZÀ-Ỹ]/.test(para) &&
        !para.includes(':') &&
        !/^\d+\./.test(para))

    if (isDocTitle) {
      p.className = 'text-center font-bold text-base sm:text-lg text-gray-950 uppercase mt-5 mb-4 tracking-wide'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 4. Trích yếu / phụ đề tiêu đề (ví dụ "(V/v: ...)" hoặc "năm học 202... - 202...")
    if (/^(\(V\/v|\(Về\s+việc|\(Ban\s+hành|năm\s+học\s+20\d\d)/i.test(para) || (para.startsWith('(') && para.endsWith(')') && para.length < 80)) {
      p.className = 'text-center italic text-xs sm:text-sm text-gray-700 -mt-2 mb-4'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 5. Địa danh, ngày tháng năm ("..., ngày ... tháng ... năm ...")
    if (
      /^([A-ZÀ-Ỹa-zà-ỹ\s]+,\s*)?ngày\s+(\d+|\.{2,})\s+tháng\s+(\d+|\.{2,})\s+năm\s+(\d+|\.{2,})/i.test(para) ||
      /^ngày\s+(\d+|\.{2,})\s+tháng/i.test(para)
    ) {
      p.className = 'text-right italic text-xs sm:text-sm text-gray-800 my-2.5'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 6. Mục lớn (ví dụ "6. CAM KẾT CỦA HỌC SINH VÀ PHỤ HUYNH", "I. MỤC ĐÍCH YÊU CẦU", "CHƯƠNG I")
    const isMajorSection =
      /^(CHƯƠNG|PHẦN|ĐIỀU|MỤC)\s+[0-9IVXLCDM]+/i.test(para) ||
      /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(para) ||
      /^\d+\.\s+[A-ZÀ-Ỹ\s]{4,}/.test(para)

    if (isMajorSection) {
      p.className = 'font-bold text-gray-950 text-sm sm:text-base mt-6 mb-3 uppercase tracking-wide'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 7. Kính gửi
    if (/^Kính\s+gửi\s*:/i.test(para)) {
      p.className = 'pl-2 sm:pl-6 text-gray-950 my-2 font-medium leading-relaxed'
      p.innerHTML = `<strong class="font-bold">Kính gửi:</strong> ${escapeHtml(para.replace(/^Kính\s+gửi\s*:\s*/i, ''))}`
      page.appendChild(p)
      continue
    }

    // Dòng gạch đầu dòng các đơn vị kính gửi phía dưới "Kính gửi:"
    if (/^-\s+(Ban\s+giám\s+đốc|Thầy\s+cô|Phòng|Ban|Khoa|Trường|Trung\s+tâm)/i.test(para)) {
      p.className = 'pl-6 sm:pl-12 text-gray-800 mb-1.5 leading-relaxed'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 8. Các trường biểu mẫu điền thông tin (Tên em là:, Ngày sinh:, Nơi thường trú:, Là học sinh lớp:)
    if (
      /^(Tên em là|Họ và tên|Ngày sinh|Ngày, tháng, năm sinh|Nơi sinh|Giới tính|Số ĐT|Điện thoại|Nơi thường trú|Chỗ ở|Là học sinh lớp|Học sinh lớp)\s*:/i.test(
        para
      )
    ) {
      p.className = 'pl-2 sm:pl-4 mb-2 leading-relaxed text-gray-900 font-normal'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 9. Điều khoản danh sách đánh số hoặc gạch đầu dòng (1. 2. 3. hoặc a) b) c) hoặc - *)
    if (/^(\d+\.|\w\)|-|\*)\s/.test(para)) {
      // Chuẩn Word PC: thụt lề treo (hanging indent), căn đều 2 bên
      p.className = 'pl-8 sm:pl-10 mb-2.5 leading-relaxed text-gray-900 text-justify [text-indent:-1.5rem]'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 10. Chữ ký và trách nhiệm cuối văn bản
    if (
      /^(NGƯỜI\s+LÀM\s+CAM\s+KẾT|NGƯỜI\s+LÀM\s+ĐƠN|HỌC\s+SINH\s+CAM\s+KẾT|Ý\s+KIẾN\s+CỦA\s+CHA\s+MẸ|CHA\s+MẸ\s+HỌC\s+SINH|GIÁO\s+VIÊN\s+CHỦ\s+NHIỆM|HIỆU\s+TRƯỞNG|BAN\s+GIÁM\s+ĐỐC|XÁC\s+NHẬN\s+CỦA)\b/i.test(
        para
      )
    ) {
      p.className = 'text-right font-bold text-gray-950 mt-6 mb-1 pr-6 sm:pr-12 uppercase'
      p.textContent = para
      page.appendChild(p)
      continue
    }
    if (/^\(Ký(\s*,\s*|\s+và\s+)ghi\s+rõ\s+họ\s+tên\)$/i.test(para) || /^\(Ký\s+tên\)$/i.test(para)) {
      p.className = 'text-right italic text-xs text-gray-600 mb-14 pr-6 sm:pr-12'
      p.textContent = para
      page.appendChild(p)
      continue
    }

    // 11. Đoạn văn xuôi thông thường: thụt đầu dòng 1cm, căn đều 2 bên
    p.className = 'mb-3 leading-relaxed text-gray-900 text-justify indent-6 sm:indent-8'
    p.textContent = para
    page.appendChild(p)
  }

  container.appendChild(page)
}

function parseAndRenderFallbackWordDoc(buffer: ArrayBuffer, container: HTMLElement, docName: string): boolean {
  try {
    const bytes = new Uint8Array(buffer)
    if (bytes.length === 0) return false

    // 1. Kiểm tra nếu là HTML / WordML (xuất từ các phần mềm quản lý trường học)
    const sampleLen = Math.min(bytes.length, 4096)
    const sampleUtf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, sampleLen))

    if (/<html|<!DOCTYPE\s+html|<body|<w:wordDocument/i.test(sampleUtf8)) {
      const fullHtml = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      const parser = new DOMParser()
      const doc = parser.parseFromString(fullHtml, 'text/html')
      doc.querySelectorAll('script, link[rel="stylesheet"]').forEach((el) => el.remove())

      const page = document.createElement('div')
      page.className =
        'docx-preview-doc bg-white text-gray-900 shadow-2xl rounded-xs mx-auto my-6 p-8 sm:p-14 md:p-16 max-w-[850px] w-full min-h-[1100px] font-serif leading-relaxed text-[15px] select-text border border-gray-200'
      page.innerHTML = doc.body?.innerHTML || doc.documentElement?.innerHTML || fullHtml
      container.appendChild(page)
      return true
    }

    // 2. Kiểm tra nếu là RTF
    if (sampleUtf8.trim().startsWith('{\\rtf')) {
      const fullRtf = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      const cleanText = fullRtf
        .replace(/\\par[d]?\s*/gi, '\n')
        .replace(/\\tab\s*/gi, '\t')
        .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\u(-?[0-9]+)\??/g, (_, code) => {
          const c = parseInt(code, 10)
          return String.fromCharCode(c < 0 ? c + 65536 : c)
        })
        .replace(/\\[a-z]+-?[0-9]*\s?/gi, '')
        .replace(/[{}]/g, '')
        .trim()
      const paras = cleanText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
      if (paras.length > 0) {
        renderParagraphs(paras, container, docName)
        return true
      }
    }

    // 3. Tệp nhị phân Word 97-2003 (.doc)
    const utf16Paras = extractUtf16Paragraphs(bytes)
    const utf8Paras = extract8BitParagraphs(bytes)
    const paras = utf16Paras.join(' ').length >= utf8Paras.join(' ').length ? utf16Paras : utf8Paras
    if (paras.length > 0) {
      renderParagraphs(paras, container, docName)
      return true
    }

    return false
  } catch (err) {
    console.warn('[DocxDocumentViewer] Lỗi trích xuất tệp Word fallback:', err)
    return false
  }
}

export function DocxDocumentViewer({
  docUrl,
  docName,
  compact = false,
  hideHeader = true,
  scale: scaleProp,
  canControl = false,
  canScroll = true,
  scrollRatio,
  onScrollRatioChange,
  children,
}: DocxDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const currentScale = scaleProp ?? scale

  // Đồng bộ vị trí cuộn từ chủ phòng hoặc người trình chiếu
  useEffect(() => {
    if (scrollRatio === undefined || scrollRatio === null || !viewportRef.current) return
    const el = viewportRef.current
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return

    const targetTop = Math.round(scrollRatio * maxScroll)
    if (Math.abs(el.scrollTop - targetTop) > 2) {
      isProgrammaticScrollRef.current = true
      el.scrollTop = targetTop
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false
      })
    }
  }, [scrollRatio])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScrollRef.current) return
    if (!canScroll) return
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    const ratio = Math.max(0, Math.min(1, el.scrollTop / maxScroll))
    onScrollRatioChange?.(ratio, el.scrollTop, el.scrollHeight)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    async function loadDocx() {
      try {
        const res = await fetch(docUrl, { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`Không thể tải tệp Word (${res.status}).`)
        const buffer = await res.arrayBuffer()

        if (!active || !containerRef.current) return
        containerRef.current.innerHTML = ''

        let renderedWithDocxPreview = false
        try {
          await renderAsync(buffer, containerRef.current, undefined, {
            className: 'docx-preview-doc',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          })
          renderedWithDocxPreview = true
        } catch {
          // docx-preview không xử lý được (ví dụ tệp .doc nhị phân hoặc HTML/RTF cũ)
        }

        if (!renderedWithDocxPreview) {
          containerRef.current.innerHTML = ''
          const ok = parseAndRenderFallbackWordDoc(buffer, containerRef.current, docName)
          if (!ok) {
            throw new Error('Định dạng tệp Word không được hỗ trợ hoặc tệp bị hỏng.')
          }
        }

        if (active) {
          setLoading(false)
          // Khôi phục vị trí cuộn khi tài liệu vừa nạp xong
          if (scrollRatio !== undefined && scrollRatio !== null) {
            requestAnimationFrame(() => {
              if (!viewportRef.current) return
              const el = viewportRef.current
              const maxScroll = el.scrollHeight - el.clientHeight
              if (maxScroll > 0) {
                isProgrammaticScrollRef.current = true
                el.scrollTop = Math.round(scrollRatio * maxScroll)
                requestAnimationFrame(() => {
                  isProgrammaticScrollRef.current = false
                })
              }
            })
          }
        }
      } catch (err: any) {
        if (!active) return
        console.error('Lỗi dựng tài liệu Word:', err)
        setError(err.message || 'Lỗi đọc tệp Word.')
        setLoading(false)
      }
    }

    void loadDocx()
    return () => {
      active = false
    }
  }, [docUrl, docName])

  return (
    <div className={`relative flex h-full w-full flex-col bg-canvas overflow-hidden select-text ${compact ? 'compact-doc' : ''}`} data-testid="docx-viewer">
      {/* Top Toolbar: Name, Scale & Download (hidden when embedded inside DocumentStageView to prevent duplicate bars) */}
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              <FileText className="h-3.5 w-3.5" />
              Word
            </span>
            <span className="truncate text-xs font-medium text-text-primary max-w-[240px]" title={docName}>
              {docName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface-overlay rounded-lg p-0.5 border border-border-default">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, Math.round((s - 0.1) * 10) / 10))}
                className="p-1 text-text-secondary hover:text-text-primary rounded cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-mono px-1 text-text-secondary min-w-8 text-center">
                {Math.round(currentScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))}
                className="p-1 text-text-secondary hover:text-text-primary rounded cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>

            {canControl && (
              <a
                href={docUrl}
                download={docName}
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-text-primary p-1 rounded transition-colors"
                title="Tải tệp Word về máy"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Viewport Container: khoá cuộn khi không có quyền cuộn trang */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className={`relative flex-1 bg-canvas p-4 pb-20 flex justify-center ${
          canScroll ? 'overflow-auto' : 'overflow-hidden'
        }`}
        data-testid="docx-viewport"
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-xs text-text-secondary" data-testid="docx-loading">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-xs font-semibold text-text-primary">Đang dựng tài liệu Word…</p>
            <span className="text-[11px] text-text-tertiary mt-1">{docName}</span>
          </div>
        )}

        {error && !canControl && (
          <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center text-text-secondary select-none m-auto" data-testid="student-doc-waiting">
            <div className="rounded-2xl bg-surface-overlay p-4 border border-border-subtle text-text-tertiary mb-3">
              <FileText className="h-8 w-8 text-brand" />
            </div>
            <h4 className="text-sm font-semibold text-text-primary">
              Chủ phòng đang chuẩn bị tài liệu
            </h4>
            <p className="text-xs text-text-tertiary mt-1">
              Nội dung tài liệu sẽ tự động hiển thị khi sẵn sàng
            </p>
          </div>
        )}

        {error && canControl && (
          <div className="flex flex-col items-center justify-center p-6 text-center m-auto" data-testid="docx-error">
            <div className="rounded-2xl bg-blue-500/10 p-4 ring-1 ring-blue-500/20 mb-3">
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-text-primary max-w-md truncate" title={docName}>
              {docName}
            </h4>
            <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
              Tệp Word định dạng cũ (.doc) hoặc chứa phần tử chưa hỗ trợ dựng trực tiếp. Bạn hãy lưu tệp sang .docx hoặc tải về để xem đầy đủ.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={docUrl}
                download={docName}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Tải tệp Word về máy
              </a>
            </div>
          </div>
        )}

        <div
          className="relative inline-block transition-transform duration-100 origin-top h-fit"
          style={{ transform: `scale(${currentScale})` }}
        >
          <div
            ref={containerRef}
            className="text-black [&_.docx-preview-doc]:shadow-2xl [&_.docx-preview-doc]:rounded-xs [&_.docx-preview-doc]:bg-white [&_.docx-preview-doc]:font-serif"
          />

          {!loading && !error && children && (
            <div className="absolute inset-0 pointer-events-none z-10" data-testid="docx-annotation-overlay">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
