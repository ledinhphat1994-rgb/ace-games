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
  roomId?: string
  onLoadSlide: (docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages: number, docId?: number) => void
}

/** Tải lên có tiến độ (fetch không báo % tải lên) — tệp lớn / mạng chậm vẫn thấy đang chạy tới đâu. */
function taiLenCoTienDo(url: string, body: FormData, onTienDo: (phanTram: number) => void): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onTienDo(Math.min(100, Math.round((e.loaded / e.total) * 100)))
    }
    xhr.onload = () => {
      let data: any = {}
      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch {}
      resolve({ status: xhr.status, data })
    }
    xhr.onerror = () => reject(new Error('Lỗi kết nối khi tải tệp lên máy chủ lưu trữ.'))
    xhr.send(body)
  })
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

export function SlideUploadModal({ open, onOpenChange, roomId, onLoadSlide }: SlideUploadModalProps) {
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docId, setDocId] = useState<number | undefined>(undefined)
  const [totalPages, setTotalPages] = useState<number>(10)
  const [fileType, setFileType] = useState<'pptx' | 'pdf' | 'image'>('pptx')
  const [glUrl, setGlUrl] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  /** % đã gửi lên (100 = đang chờ máy chủ kiểm tra + lưu tệp). */
  const [tienDo, setTienDo] = useState(0)

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    let type: 'pptx' | 'pdf' | 'image' = 'pptx'
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image'
    else if (ext === 'pdf') type = 'pdf'
    else type = 'pptx'

    setFileType(type)
    setDocName(file.name)
    // Chọn tệp thì bỏ link Google Slides đang gõ dở: một nút Chèn lên bảng chỉ chèn một thứ.
    setGlUrl('')

    // Tải lên server R2 để có URL dùng chung cho cả phòng học
    setIsUploading(true)
    setTienDo(0)
    let uploadedUrl = ''
    let uploadedDocId: number | undefined
    let soTrangMayChu: number | undefined
    try {
      const formData = new FormData()
      formData.append('file', file)
      const cleanRoomId = roomId ? roomId.replace('phong-', '') : null
      if (!cleanRoomId) {
        formData.append('purpose', 'slide')
      }
      const endpoint = cleanRoomId ? `/api/rooms/${cleanRoomId}/documents` : '/api/upload'
      const { status, data } = await taiLenCoTienDo(endpoint, formData, setTienDo)
      const res = { ok: status >= 200 && status < 300, status }
      if (res.ok && data.ok) {
        if (data.document) {
          uploadedUrl = data.document.url
          uploadedDocId = data.document.id
          if (typeof data.document.pageCount === 'number' && data.document.pageCount > 0) soTrangMayChu = data.document.pageCount
        } else if (data.url) {
          uploadedUrl = data.url
        }
        if (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://')) {
          try {
            uploadedUrl = new URL(uploadedUrl).pathname
          } catch {}
        }
      } else {
        const errorMsg =
          data.loi ||
          data.error ||
          (res.status === 413
            ? 'Dung lượng tệp vượt quá giới hạn tối đa cho phép.'
            : res.status === 415
              ? 'Định dạng tệp không được hỗ trợ.'
              : res.status === 409
                ? 'Phòng học đã đóng, không thể tải lên tài liệu mới.'
                : res.status === 403
                  ? 'Bạn không có quyền tải tài liệu vào phòng học này.'
                  : res.status === 401
                    ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                    : res.status === 429
                      ? 'Bạn đã tải lên quá nhiều tệp. Vui lòng đợi trong giây lát.'
                      : 'Không thể tải tệp lên máy chủ lưu trữ.')
        toast.error(errorMsg)
        return
      }
    } catch (err: any) {
      console.error('Lỗi tải tệp lên máy chủ:', err)
      toast.error(err.message || 'Lỗi kết nối khi tải tệp lên máy chủ lưu trữ.')
      return
    } finally {
      setIsUploading(false)
    }

    if (!uploadedUrl) {
      setDocUrl('')
      setDocId(undefined)
      return
    }

    setDocUrl(uploadedUrl)
    setDocId(uploadedDocId)

    if (type === 'pdf') {
      setIsDetecting(true)
      const pages = await countPdfPages(file)
      setTotalPages(pages)
      setIsDetecting(false)
      toast.success(`Đã nạp PDF "${file.name}" — phát hiện ${pages} trang!`)
    } else {
      // .pptx: máy chủ đã đếm số slide lúc kiểm tra tệp.
      setTotalPages(type === 'image' ? 1 : (soTrangMayChu ?? 1))
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
    const ALLOWED_EXTS = ['pptx', 'pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'webp']
    if (!ALLOWED_EXTS.includes(ext)) {
      toast.error('Định dạng không hỗ trợ. Hãy chọn PDF, PowerPoint (.pptx), Word, Excel hoặc ảnh.')
      return
    }
    void processFile(file)
  }

  // Một nút Chèn lên bảng: có link Google Slides thì chèn link, không thì chèn tệp đã tải lên.
  const handleConfirm = () => {
    if (glUrl.trim()) {
      handlePickGoogleSlides()
      return
    }
    if (!docName.trim()) {
      toast.error('Vui lòng chọn tệp hoặc dán link Google Slides.')
      return
    }
    if (!docUrl.trim()) {
      toast.error('Tệp chưa được tải lên máy chủ lưu trữ. Vui lòng chọn tệp để tải lên.')
      return
    }
    onLoadSlide(docUrl.trim(), docName.trim(), fileType, Math.max(1, totalPages), docId)
    onOpenChange(false)
    toast.success(`Đã chèn bài giảng "${docName}" lên bảng đen!`)
  }

  const handlePickGoogleSlides = () => {
    if (!glUrl.trim()) { toast.error('Vui lòng dán link Google Slides.'); return }
    if (!glUrl.includes('docs.google.com/presentation')) {
      toast.error('Link không phải Google Slides. Vui lòng kiểm tra lại.')
      return
    }
    const name = 'Google Slides'
    onLoadSlide(glUrl.trim(), name, 'pptx', 30)
    onOpenChange(false)
    toast.success(`Đã mở: ${name}!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-[#0d1422] text-slate-100 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-cyan-300">
            <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
            Chèn Tài Liệu
          </DialogTitle>
          <DialogDescription className="sr-only">Chèn tài liệu vào phòng học</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
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
              accept=".pdf,.pptx,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
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
                  ? tienDo < 100
                    ? `Đang tải lên… ${tienDo}%`
                    : 'Đang kiểm tra tệp…'
                  : isDetecting
                    ? 'Đang phát hiện số trang...'
                    : docName
                      ? docName
                      : isDragOver
                        ? 'Thả tệp vào đây'
                        : 'Chọn tệp tài liệu'}
              </span>
              {isUploading ? (
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10" data-testid="slide-upload-progress">
                  <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-200" style={{ width: `${tienDo}%` }} />
                </div>
              ) : (
                <span className="text-[11px] text-slate-400" data-testid="slide-upload-types">
                  PDF · PowerPoint (.pptx) · Word · Excel — tối đa 30 MB · Ảnh PNG, JPG, WEBP — tối đa 10 MB
                </span>
              )}
            </div>
          </div>

          {/* Hoặc dán link Google Slides — cùng nút Chèn lên bảng bên dưới */}
          <div className="relative">
            <Link className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-400" />
            <Input
              value={glUrl}
              onChange={(e) => setGlUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
              }}
              placeholder="Dán link Google Slides"
              aria-label="Link Google Slides"
              autoComplete="off"
              className="h-9 border-white/10 bg-black/40 pl-8 text-xs text-white"
              data-testid="slide-google-link"
            />
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
              disabled={isDetecting || isUploading || (!glUrl.trim() && !docUrl)}
              data-testid="slide-btn-insert"
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
