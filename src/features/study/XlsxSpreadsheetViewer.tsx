// src/features/study/XlsxSpreadsheetViewer.tsx
// Trình xem bảng tính Excel (.xlsx) trực tiếp trên trình duyệt bằng JSZip + DOMParser.
// Tự dựng bảng tính, hỗ trợ nhiều sheet (tab chuyển đổi), tìm kiếm nội dung ô và phóng to/thu nhỏ.

import JSZip from 'jszip'
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface XlsxSpreadsheetViewerProps {
  docUrl: string
  docName: string
  compact?: boolean
  hideHeader?: boolean
  scale?: number
  search?: string
  canControl?: boolean
  canScroll?: boolean
  scrollRatio?: number
  onScrollRatioChange?: (ratio: number, scrollTop: number, scrollHeight: number) => void
  onSearchChange?: (val: string) => void
  children?: ReactNode
}

interface ExcelCell {
  col: string
  colIndex: number
  val: string
  isHeader?: boolean
}

interface ExcelRow {
  rowNum: number
  cells: Record<number, ExcelCell>
}

interface ExcelSheet {
  name: string
  rows: ExcelRow[]
  maxColIndex: number
  maxRowNum: number
}

function indexToColName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function colNameToIndex(col: string): number {
  let index = 0
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64)
  }
  return index - 1
}

function parseCellRef(ref: string): { col: string; colIndex: number; rowNum: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) return { col: 'A', colIndex: 0, rowNum: 1 }
  const col = match[1]
  const rowNum = parseInt(match[2], 10)
  return { col, colIndex: colNameToIndex(col), rowNum }
}

export function XlsxSpreadsheetViewer({
  docUrl,
  docName,
  compact = false,
  hideHeader = true,
  scale: scaleProp,
  search: searchProp,
  canControl = false,
  canScroll = true,
  scrollRatio,
  onScrollRatioChange,
  onSearchChange,
  children,
}: XlsxSpreadsheetViewerProps) {
  const [sheets, setSheets] = useState<ExcelSheet[]>([])
  const [activeSheetIdx, setActiveSheetIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)

  const currentScale = scaleProp ?? scale
  const currentSearch = searchProp ?? search

  // Đồng bộ vị trí cuộn từ chủ phòng hoặc người trình chiếu
  useEffect(() => {
    if (scrollRatio === undefined || scrollRatio === null || !containerRef.current) return
    const el = containerRef.current
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
    setSheets([])

    async function loadXlsx() {
      try {
        const res = await fetch(docUrl, { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`Không thể tải tệp Excel (${res.status}).`)
        const buffer = await res.arrayBuffer()

        const zip = await JSZip.loadAsync(buffer).catch(() => {
          throw new Error('legacy_or_corrupt')
        })

        const parser = new DOMParser()

        // 1. Shared Strings Table
        const sharedStrings: string[] = []
        const sstFile = zip.file('xl/sharedStrings.xml')
        if (sstFile) {
          const sstXml = await sstFile.async('text')
          const sstDoc = parser.parseFromString(sstXml, 'application/xml')
          const siEls = sstDoc.querySelectorAll('si')
          for (let i = 0; i < siEls.length; i++) {
            sharedStrings.push(siEls[i].textContent || '')
          }
        }

        // 2. Workbook & Relationships
        const relsMap: Record<string, string> = {}
        const relsFile = zip.file('xl/_rels/workbook.xml.rels')
        if (relsFile) {
          const relsXml = await relsFile.async('text')
          const relsDoc = parser.parseFromString(relsXml, 'application/xml')
          const relEls = relsDoc.querySelectorAll('Relationship')
          for (let i = 0; i < relEls.length; i++) {
            const id = relEls[i].getAttribute('Id')
            const target = relEls[i].getAttribute('Target')
            if (id && target) relsMap[id] = target.replace(/^\/?xl\//, '').replace(/^\//, '')
          }
        }

        const wbFile = zip.file('xl/workbook.xml')
        if (!wbFile) throw new Error('Không tìm thấy cấu trúc bảng tính Excel.')
        const wbXml = await wbFile.async('text')
        const wbDoc = parser.parseFromString(wbXml, 'application/xml')
        const sheetEls = wbDoc.querySelectorAll('sheets > sheet')

        const parsedSheets: ExcelSheet[] = []

        for (let s = 0; s < sheetEls.length; s++) {
          const sEl = sheetEls[s]
          const sheetName = sEl.getAttribute('name') || `Sheet ${s + 1}`
          const rId = sEl.getAttribute('r:id') || sEl.getAttribute('id') || `rId${s + 1}`
          const targetPath = relsMap[rId] || `worksheets/sheet${s + 1}.xml`
          const wsFile = zip.file(`xl/${targetPath}`) || zip.file(targetPath)
          if (!wsFile) continue

          const wsXml = await wsFile.async('text')
          const wsDoc = parser.parseFromString(wsXml, 'application/xml')
          const rowEls = wsDoc.querySelectorAll('sheetData > row')

          const rows: ExcelRow[] = []
          let maxColIndex = 0
          let maxRowNum = 0

          for (let r = 0; r < rowEls.length; r++) {
            const rEl = rowEls[r]
            const rowNum = parseInt(rEl.getAttribute('r') || String(r + 1), 10)
            if (rowNum > maxRowNum) maxRowNum = rowNum
            const cellEls = rEl.querySelectorAll('c')
            const cells: Record<number, ExcelCell> = {}

            for (let c = 0; c < cellEls.length; c++) {
              const cEl = cellEls[c]
              const rRef = cEl.getAttribute('r') || `${indexToColName(c)}${rowNum}`
              const { col, colIndex } = parseCellRef(rRef)
              if (colIndex > maxColIndex) maxColIndex = colIndex

              const type = cEl.getAttribute('t')
              let val = cEl.querySelector('v')?.textContent || cEl.querySelector('is > t')?.textContent || ''

              if (type === 's') {
                const sIdx = parseInt(val, 10)
                val = sharedStrings[sIdx] ?? val
              } else if (type === 'b') {
                val = val === '1' ? 'TRUE' : 'FALSE'
              }

              cells[colIndex] = { col, colIndex, val: val.trim() }
            }

            rows.push({ rowNum, cells })
          }

          parsedSheets.push({
            name: sheetName,
            rows,
            maxColIndex: Math.min(Math.max(maxColIndex, 5), 50),
            maxRowNum: Math.min(Math.max(maxRowNum, 10), 500),
          })
        }

        if (active) {
          if (parsedSheets.length === 0) throw new Error('Bảng tính không có dữ liệu.')
          setSheets(parsedSheets)
          setActiveSheetIdx(0)
          setLoading(false)
          // Khôi phục vị trí cuộn khi bảng tính vừa nạp xong
          if (scrollRatio !== undefined && scrollRatio !== null) {
            requestAnimationFrame(() => {
              if (!containerRef.current) return
              const el = containerRef.current
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
        console.error('Lỗi mở bảng tính Excel:', err)
        setError(err.message === 'legacy_or_corrupt' ? 'legacy' : err.message || 'Lỗi đọc tệp Excel.')
        setLoading(false)
      }
    }

    void loadXlsx()
    return () => {
      active = false
    }
  }, [docUrl])

  const currentSheet = sheets[activeSheetIdx]

  const filteredRows = useMemo(() => {
    if (!currentSheet) return []
    if (!currentSearch.trim()) return currentSheet.rows
    const q = currentSearch.toLowerCase()
    return currentSheet.rows.filter((r) =>
      Object.values(r.cells).some((cell) => cell.val.toLowerCase().includes(q)),
    )
  }, [currentSheet, currentSearch])

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-canvas p-6 text-text-secondary" data-testid="xlsx-loading">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-semibold text-text-primary">Đang dựng bảng tính Excel…</p>
        <span className="text-[11px] text-text-tertiary mt-1">{docName}</span>
      </div>
    )
  }

  if (error || !currentSheet) {
    if (!canControl) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-canvas select-none" data-testid="student-doc-waiting">
          <div className="rounded-2xl bg-surface-overlay p-4 border border-border-subtle text-text-tertiary mb-3">
            <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-text-primary">
            Chủ phòng đang chuẩn bị bảng tính
          </h4>
          <p className="text-xs text-text-tertiary mt-1">
            Nội dung bảng tính sẽ tự động hiển thị khi sẵn sàng
          </p>
        </div>
      )
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-canvas" data-testid="xlsx-error">
        <div className="rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20 mb-3">
          <FileSpreadsheet className="h-10 w-10 text-emerald-400" />
        </div>
        <h4 className="text-sm font-semibold text-text-primary max-w-md truncate" title={docName}>
          {docName}
        </h4>
        <p className="text-xs text-text-secondary max-w-sm mt-1.5 leading-relaxed">
          {error === 'legacy'
            ? 'Tệp Excel định dạng cũ (.xls) hoặc được mã hóa bảo mật. Bạn hãy xuất tệp sang .xlsx hoặc tải về để xem đầy đủ.'
            : 'Không thể mở trực tiếp bảng tính này trên trình duyệt.'}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <a
            href={docUrl}
            download={docName}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Tải tệp Excel về máy
          </a>
        </div>
      </div>
    )
  }

  const cols = Array.from({ length: currentSheet.maxColIndex + 1 }, (_, i) => indexToColName(i))

  return (
    <div className={`relative flex h-full w-full flex-col bg-canvas overflow-hidden select-text ${compact ? 'compact-sheet' : ''}`} data-testid="xlsx-viewer">
      {/* Top Toolbar: Search, Scale & Download (hidden when embedded inside DocumentStageView to prevent duplicate bars) */}
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </span>
            <span className="truncate text-xs font-medium text-text-primary max-w-[200px]" title={docName}>
              {docName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search box */}
            <div className="relative flex items-center">
              <Search className="absolute left-2 size-3 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => {
                  setSearch(e.target.value)
                  onSearchChange?.(e.target.value)
                }}
                placeholder="Tìm ô..."
                className="h-7 w-28 sm:w-36 rounded-lg border border-border-default bg-surface-overlay pl-7 pr-2 text-[11px] text-text-primary outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface-overlay rounded-lg p-0.5 border border-border-default">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.7, Math.round((s - 0.1) * 10) / 10))}
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
                onClick={() => setScale((s) => Math.min(1.5, Math.round((s + 0.1) * 10) / 10))}
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
                title="Tải tệp về máy"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Spreadsheet Grid Container: khoá cuộn khi không có quyền cuộn trang */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`relative flex-1 bg-canvas ${canScroll ? 'overflow-auto' : 'overflow-hidden'}`}
        data-testid="xlsx-viewport"
      >
        <div
          className="relative inline-block min-w-max pb-20 origin-top-left"
          style={{ transform: `scale(${currentScale})`, transformOrigin: 'top left' }}
        >
          <table className="border-collapse text-xs select-text w-full min-w-max">
            <thead>
              <tr className="sticky top-0 z-10 bg-surface border-b border-border-default shadow-xs">
                {/* Top-left empty cell */}
                <th className="sticky left-0 z-20 w-10 min-w-10 bg-surface border-r border-border-default py-1 text-center font-mono text-[10px] text-text-tertiary">
                  #
                </th>
                {cols.map((col) => (
                  <th
                    key={col}
                    className="min-w-24 px-2 py-1 border-r border-border-subtle bg-surface text-center font-mono text-[11px] font-semibold text-text-secondary"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.rowNum} className="border-b border-border-subtle/60 hover:bg-surface-raised/40 transition-colors">
                  {/* Row number header */}
                  <td className="sticky left-0 z-10 w-10 min-w-10 bg-surface border-r border-border-default py-1 text-center font-mono text-[10px] font-medium text-text-tertiary select-none">
                    {row.rowNum}
                  </td>
                  {cols.map((_, colIdx) => {
                    const cell = row.cells[colIdx]
                    const val = cell?.val || ''
                    const isNumber = val !== '' && !Number.isNaN(Number(val.replace(/,/g, '')))
                    const isMatch = currentSearch.trim() && val.toLowerCase().includes(currentSearch.toLowerCase())

                    return (
                      <td
                        key={colIdx}
                        className={`min-w-24 px-2 py-1 border-r border-border-subtle/50 text-[11px] font-normal leading-normal whitespace-pre-wrap break-words ${
                          isNumber ? 'text-right font-mono' : 'text-left'
                        } ${isMatch ? 'bg-amber-500/20 font-semibold text-warning' : 'text-text-primary'}`}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {children && (
            <div className="absolute inset-0 pointer-events-none z-10" data-testid="excel-annotation-overlay">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet Switcher Tabs */}
      {sheets.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 border-t border-border-subtle bg-surface px-3 py-1 overflow-x-auto [scrollbar-width:none]">
          {sheets.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setActiveSheetIdx(idx)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeSheetIdx === idx
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              }`}
            >
              <FileSpreadsheet className="size-3" />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
