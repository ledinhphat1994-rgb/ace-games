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


export function SlideUploadModal({ open, onOpenChange, onLoadSlide }: SlideUploadModalProps) {
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [totalPages, setTotalPages] = useState<number>(10)
  const [fileType, setFileType] = useState<'pptx' | 'pdf' | 'image'>('pptx')
  const [glUrl, setGlUrl] = useState('')
  const [glName, setGlName] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    let type: 'pptx' | 'pdf' | 'image' = 'pptx'
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) type = 'image'
    else if (ext === 'pdf') type = 'pdf'
    else type = 'pptx'

    setFileType(type)
    setDocName(file.name)

    // Create a local blob URL for immediate viewing
    const blobUrl = URL.createObjectURL(file)
    setDocUrl(blobUrl)
    setTotalPages(12) // estimated initial slide count
    toast.success(`Đã nạp tệp "${file.name}"!`)
  }

  const handleConfirm = () => {
    if (!docName.trim()) {
      toast.error('Vui lòng nhập tên tài liệu hoặc tải lên tệp.')
      return
    }
    const finalUrl = docUrl.trim() || 'local_presentation'
    onLoadSlide(finalUrl, docName.trim(), fileType, Math.max(1, totalPages))
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
          {/* File Upload Box */}
          <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center hover:border-cyan-500/50 transition-colors">
            <input
              type="file"
              id="slide-file-input"
              accept=".pptx,.ppt,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="slide-file-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                {docName ? `Đã chọn: ${docName}` : 'Bấm để tải tệp PowerPoint (.pptx), PDF hoặc Ảnh bài tập'}
              </span>
              <span className="text-[11px] text-slate-400">Hỗ trợ tối đa các định dạng trình chiếu học đường</span>
            </label>
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
                <label className="text-[11px] font-semibold text-slate-300">Tổng số trang slide</label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={totalPages}
                  onChange={(e) => setTotalPages(parseInt(e.target.value, 10) || 1)}
                  className="h-8 border-white/10 bg-black/40 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Loại tài liệu</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
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
