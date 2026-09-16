import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet, Link, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SlideUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadSlide: (docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages: number) => void
}

/** Lightweight PDF page count using regex on binary content — no external deps */
async function countPdfPages(file: File): Promise<number> {
  try {
    const buf = await file.arrayBuffer()
    const text = new TextDecoder('latin1').decode(buf)
    // PDF stores the page count in /Pages dictionary as /Count N
    const m = text.match(/\/Count\s+(\d+)/)
    if (m) return Math.max(1, parseInt(m[1], 10))
    // Fallback: count individual /Type /Page objects (not /Pages)
    const pages = text.match(/\/Type\s*\/Page[^s]/g)
    return pages ? Math.max(1, pages.length) : 1
  } catch {
    return 1
  }
}

export function SlideUploadModal({ open, onOpenChange, onLoadSlide }: SlideUploadModalProps) {
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [totalPages, setTotalPages] = useState<number>(10)
  const [fileType, setFileType] = useState<'pptx' | 'pdf' | 'image'>('pptx')
  const [glUrl, setGlUrl] = useState('')
  const [glName, setGlName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    let type: 'pptx' | 'pdf' | 'image' = 'pptx'
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image'
    else if (ext === 'pdf') type = 'pdf'
    else type = 'pptx'

    setFileType(type)
    setDocName(file.name)

    // Tải lên server R2 để có URL dùng chung cho cả phòng học
    setIsUploading(true)
    let uploadedUrl = ''
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; url?: string }
        if (data.ok && data.url) {
          uploadedUrl = data.url
          if (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://')) {
            try {
              uploadedUrl = new URL(uploadedUrl).pathname
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải tệp lên máy chủ R2:', err)
    } finally {
      setIsUploading(false)
    }

    if (!uploadedUrl) {
      setDocUrl('')
      toast.error('Không thể tải tệp lên máy chủ lưu trữ. Vui lòng thử lại.')
      return
    }

    setDocUrl(uploadedUrl)

    if (type === 'pdf') {
      setIsDetecting(true)
      const pages = await countPdfPages(file)
      setTotalPages(pages)
      setIsDetecting(false)
      toast.success(`Đã nạp PDF "${file.name}" — phát hiện ${pages} trang!`)
    } else {
      setTotalPages(type === 'image' ? 1 : 12)
      toast.success(`Đã tải lên máy chủ "${file.name}"!`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pptx', 'ppt', 'pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      toast.error('Định dạng không hỗ trợ. Hãy chọn .pptx, .pdf hoặc ảnh.')
      return
    }
    void processFile(file)
  }

  const handleConfirm = () => {
    if (!docName.trim()) {
      toast.error('Vui lòng nhập tên tài liệu hoặc tải lên tệp.')
      return
    }
    if (!docUrl.trim()) {
      toast.error('Tệp chưa được tải lên máy chủ lưu trữ. Vui lòng chọn tệp để tải lên.')
      return
    }
    onLoadSlide(docUrl.trim(), docName.trim(), fileType, Math.max(1, totalPages))
    onOpenChange(false)
    toast.success(`Đã chèn bài giảng "${docName}" lên bảng đen!`)
  }

  const handlePickGoogleSlides = () => {
    if (!glUrl.trim()) { toast.error('Vui lòng dán link Google Slides.'); return }
    if (!glUrl.includes('docs.google.com/presentation')) {
      toast.error('Link không phải Google Slides. Vui lòng kiểm tra lại.')
      return
    }
    const name = glName.trim() || 'Bài giảng Google Slides'
    onLoadSlide(glUrl.trim(), name, 'pptx', 30)
    onOpenChange(false)
    toast.success(`Đã mở: ${name}!`)
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-[#0d1422] text-slate-100 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-cyan-300">
            <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
            Chèn Bài Giảng PowerPoint / PDF
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Tải lên tệp trình chiếu hoặc dán đường dẫn tài liệu để cả phòng cùng theo dõi trên bảng đen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Drag-and-drop / click upload box */}
          <div
            className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-white/20 bg-white/5 hover:border-cyan-500/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('slide-file-input')?.click()}
          >
            <input
              type="file"
              id="slide-file-input"
              accept=".pptx,.ppt,.pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                isDragOver ? 'bg-cyan-500/30 text-cyan-300' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                {isUploading
                  ? '☁️ Đang tải tệp lên máy chủ lưu trữ...'
                  : isDetecting
                    ? '⏳ Đang phát hiện số trang PDF...'
                    : docName
                      ? `✅ Đã chọn: ${docName}`
                      : isDragOver
                        ? '🎯 Thả tệp vào đây!'
                        : 'Kéo thả hoặc bấm để chọn tệp'}
              </span>
              <span className="text-[11px] text-slate-400">
                Hỗ trợ: .pptx, .ppt, .pdf, ảnh (.png/.jpg/.webp)
              </span>
            </div>
          </div>

          {/* Form inputs */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300">Tên bài giảng hiển thị</label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Ví dụ: Toán 10 - Bài 1: Mệnh đề và tập hợp"
                className="h-8 border-white/10 bg-black/40 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  Tổng số trang
                  {isDetecting && <span className="text-[10px] text-cyan-400 animate-pulse">đang phát hiện…</span>}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={totalPages}
                  onChange={(e) => setTotalPages(parseInt(e.target.value, 10) || 1)}
                  className="h-8 border-white/10 bg-black/40 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Loại tài liệu</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as 'pptx' | 'pdf' | 'image')}
                  className="h-8 w-full rounded-md border border-white/10 bg-black/40 px-2 text-xs text-white"
                >
                  <option value="pptx">PowerPoint (.pptx)</option>
                  <option value="pdf">Tài liệu PDF (.pdf)</option>
                  <option value="image">Hình ảnh bài tập (.png/.jpg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Google Slides section */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Link className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-blue-300">Chèn Google Slides (khuyên dùng)</span>
            </div>
            <div className="space-y-2">
              <Input
                value={glUrl}
                onChange={(e) => setGlUrl(e.target.value)}
                placeholder="Dán link Google Slides (share/edit/pub)..."
                className="h-8 border-white/10 bg-black/40 text-xs text-white"
              />
              <Input
                value={glName}
                onChange={(e) => setGlName(e.target.value)}
                placeholder="Tên bài giảng (tùy chọn)..."
                className="h-8 border-white/10 bg-black/40 text-xs text-white"
              />
              <Button
                size="sm"
                onClick={handlePickGoogleSlides}
                className="w-full h-8 bg-blue-600 hover:bg-blue-500 text-xs font-bold"
              >
                Mở Google Slides
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-blue-400/70">
              Hướng dẫn: Google Slides → File → Share → Publish to web → Copy link, dán vào đây.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isDetecting}
              className="bg-cyan-600 hover:bg-cyan-500 text-xs font-bold px-4"
            >
              Chèn Lên Bảng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
