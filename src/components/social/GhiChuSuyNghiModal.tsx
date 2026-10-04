// Modal cập nhật ghi chú suy nghĩ / trạng thái tâm trạng theo thiết kế Vùng 1 (Notes)
import { useState } from 'react'
import { ChevronLeft, Music, Smile, X } from 'lucide-react'
import { toast } from 'sonner'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { capNhatHoSo } from '@/lib/api'
import { BlueprintCommunityPattern } from '@/components/ui/blueprint-patterns'

interface GhiChuSuyNghiModalProps {
  open: boolean
  onClose: () => void
  currentNote?: string | null
  currentAvatar?: string | null
  displayName: string
  onSaveSuccess?: (newNote: string) => void
  inline?: boolean
}

export const GOI_Y_EMOJI = ['🎧', '📚', '✨', '🔥', '☕', '😴', '🎮', '💯', '🌸', '🚀', '⭐', '💡']
export const GOI_Y_NHAC = [
  'Lofi chill học bài 🎧',
  'Nhạc không lời tập trung 📖',
  'Giai điệu thanh xuân 🌿',
  'Energy bứt phá 🚀',
  'Thư giãn đêm muộn 🌙',
]
export const GOI_Y_GIF = ['(•‿•) Vui vẻ', '(¬_¬) Đang tập trung', '(ง •_•)ง Cố lên', 'ദ്ദി(˵ •̀ ᴗ - ˵ ) Tuyệt vời', 'ʕ•́ᴥ•̀ʔ Chill']

export function GhiChuSuyNghiModal({
  open,
  onClose,
  currentNote,
  currentAvatar,
  displayName,
  onSaveSuccess,
  inline = false,
}: GhiChuSuyNghiModalProps) {
  const [suyNghi, setSuyNghi] = useState(currentNote || '')
  const [dangLuu, setDangLuu] = useState(false)
  const [hienGoiYNhac, setHienGoiYNhac] = useState(false)
  const [hienGoiYGif, setHienGoiYGif] = useState(false)
  const [showTip, setShowTip] = useState(true)

  const handleChiaSe = async () => {
    setDangLuu(true)
    try {
      const trimmed = suyNghi.trim()
      await capNhatHoSo({ tieuDeHoSo: trimmed })
      toast.success(trimmed ? 'Đã lưu suy nghĩ' : 'Đã gỡ trạng thái')
      onSaveSuccess?.(trimmed)
      onClose()
    } catch {
      toast.error('Cập nhật suy nghĩ thất bại')
    } finally {
      setDangLuu(false)
    }
  }

  // Chế độ inline hiển thị trực tiếp trong card Vùng 2 (nhỏ gọn, tinh tế, vừa vặn)
  if (inline) {
    if (!open) return null
    return (
      <div data-testid="modal-ghi-chu-suy-nghi" className="flex flex-col w-full h-full min-h-0 bg-surface rounded-2xl overflow-hidden animate-in fade-in duration-150">
        {/* Header: Nút quay lại bên trái, Tiêu đề "Ghi chú mới", Nút "Chia sẻ" bên phải */}
        <header className="flex items-center justify-between px-3.5 py-3 border-b border-border-subtle bg-surface shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-7 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-raised cursor-pointer"
            title="Quay lại hồ sơ"
            aria-label="Quay lại hồ sơ"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <h2 className="text-sm font-bold text-text-primary text-center">Ghi chú mới</h2>

          <Button
            type="button"
            size="sm"
            onClick={handleChiaSe}
            disabled={dangLuu}
            data-testid="btn-chia-se-ghi-chu"
            className="h-7 px-3 rounded-full text-xs font-bold bg-brand text-brand-foreground hover:bg-brand/90 transition-all cursor-pointer shadow-xs"
          >
            {dangLuu ? 'Đang lưu…' : 'Chia sẻ'}
          </Button>
        </header>

        {/* Banner gợi ý bạn bè */}
        {showTip && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-surface-raised/60 border-b border-border-subtle text-xs shrink-0">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary text-[11px]">Giờ bạn có thể chia sẻ suy nghĩ & tâm trạng</p>
              <p className="text-text-secondary text-[10px] truncate">Bạn bè trên trường sẽ thấy ghi chú nổi trên avatar của bạn</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTip(false)}
              className="text-text-tertiary hover:text-text-primary cursor-pointer shrink-0 p-0.5"
              title="Ẩn thông báo"
              aria-label="Ẩn thông báo"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Nội dung chính: Bong bóng suy nghĩ + Avatar + 3 nút tròn chức năng */}
        <div className="flex flex-col items-center justify-center p-4 space-y-3 min-h-0 overflow-y-auto">
          {/* Bong bóng suy nghĩ */}
          <div className="relative flex flex-col items-center w-full">
            <div className="relative px-3 py-2 rounded-2xl bg-surface-raised border border-border-default shadow-xs max-w-[240px] w-full text-center">
              <input
                type="text"
                value={suyNghi}
                onChange={(e) => setSuyNghi(e.target.value.slice(0, 100))}
                placeholder="Chia sẻ suy nghĩ…"
                maxLength={100}
                autoFocus
                className="w-full text-center text-xs font-medium text-text-primary placeholder:text-text-tertiary bg-transparent outline-none"
              />
              {suyNghi.length > 70 && (
                <span className="block mt-0.5 text-[9px] text-text-tertiary font-mono">
                  {suyNghi.length}/100
                </span>
              )}
            </div>

            {/* Hạt tròn nối xuống avatar */}
            <div className="flex flex-col items-center -space-y-0.5 mt-0.5 pointer-events-none">
              <div className="size-1.5 rounded-full bg-surface-raised border border-border-default shadow-xs" />
              <div className="size-1 rounded-full bg-surface-raised border border-border-default shadow-xs mt-0.5" />
            </div>
          </div>

          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="size-16 rounded-full ring-3 ring-brand/20 p-0.5 bg-gradient-to-tr from-brand/40 to-sky-400/40 shadow-sm overflow-hidden flex items-center justify-center">
              <AnhNguoiDung ten={displayName} avatar={currentAvatar} className="size-full text-xl" />
            </div>
          </div>

          {/* 3 nút tròn bên dưới: 🎵 Nhạc, GIF, 😊 Emoji */}
          <div className="flex items-center gap-3 pt-1">
            {/* Nút 1: Âm nhạc 🎵 */}
            <Popover open={hienGoiYNhac} onOpenChange={setHienGoiYNhac}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-8 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Thêm giai điệu / bài hát"
                    aria-label="Thêm giai điệu / bài hát"
                  >
                    <Music className="size-3.5" />
                  </button>
                }
              />
              <PopoverContent side="top" align="center" className="w-56 p-2 bg-surface-raised border-border-default shadow-xl rounded-xl z-[150]">
                <p className="px-2 py-1 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1">
                  Chọn trạng thái âm nhạc
                </p>
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {GOI_Y_NHAC.map((baiHat) => (
                    <button
                      key={baiHat}
                      type="button"
                      onClick={() => {
                        setSuyNghi(baiHat)
                        setHienGoiYNhac(false)
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-surface-overlay text-text-primary transition-colors cursor-pointer truncate flex items-center gap-1.5"
                    >
                      <span>🎵</span>
                      <span className="truncate">{baiHat}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Nút 2: GIF / Nhãn dán */}
            <Popover open={hienGoiYGif} onOpenChange={setHienGoiYGif}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-8 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95 text-[10px] font-bold"
                    title="Thêm biểu tượng cảm xúc GIF"
                    aria-label="Thêm biểu tượng cảm xúc GIF"
                  >
                    GIF
                  </button>
                }
              />
              <PopoverContent side="top" align="center" className="w-56 p-2 bg-surface-raised border-border-default shadow-xl rounded-xl z-[150]">
                <p className="px-2 py-1 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1">
                  Chọn nhãn dán cảm xúc
                </p>
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  {GOI_Y_GIF.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setSuyNghi((prev) => `${prev} ${g}`.trim())
                        setHienGoiYGif(false)
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-surface-overlay text-text-primary transition-colors cursor-pointer font-mono"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Nút 3: Emoji 😊 */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-8 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Chọn biểu cảm emoji"
                    aria-label="Chọn biểu cảm emoji"
                  >
                    <Smile className="size-3.5" />
                  </button>
                }
              />
              <PopoverContent side="top" align="center" className="w-60 p-2 bg-surface-raised border-border-default shadow-xl rounded-xl z-[150]">
                <p className="px-1 pb-1 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1">
                  Tâm trạng hôm nay
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {GOI_Y_EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSuyNghi((prev) => `${prev} ${em}`.trim())}
                      className="flex size-7 items-center justify-center text-base rounded-lg hover:bg-surface-overlay transition-colors active:scale-95 cursor-pointer"
                      title={`Thêm ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 py-2 border-t border-border-subtle bg-surface-raised/40 text-center shrink-0">
          <p className="text-[10px] text-text-tertiary leading-tight">
            Bạn bè và người trong trường có thể xem ghi chú của bạn trên Digital Campus trong 24 giờ.
          </p>
        </footer>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        style={{ top: '72px', translate: '-50% 0', transform: 'none' }}
        data-testid="modal-ghi-chu-suy-nghi"
        className="skeuo-modal-surface sm:max-w-md w-[calc(100vw-2rem)] p-0 overflow-hidden text-white shadow-2xl"
      >
        {/* Họa tiết Blueprint Community Schematic mờ chìm toàn diện */}
        <BlueprintCommunityPattern className="opacity-80 pointer-events-none" />

        {/* ── Header: Nút X bên trái, Tiêu đề "Ghi chú", Nút "Chia sẻ" bên phải ── */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-sky-400/20 bg-slate-950/60 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="skeuo-btn-cancel size-8 flex items-center justify-center p-0 rounded-full"
            title="Đóng"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>

          <h2 className="text-base font-bold text-white tracking-wide">Ghi chú</h2>

          <button
            type="button"
            onClick={handleChiaSe}
            disabled={dangLuu}
            data-testid="btn-chia-se-ghi-chu"
            className="skeuo-btn-cta-amber h-8 px-4 text-xs font-bold disabled:opacity-50"
          >
            {dangLuu ? 'Đang lưu…' : 'Chia sẻ'}
          </button>
        </header>

        {/* ── Khu vực giữa: Bong bóng suy nghĩ gắn trên Avatar + 3 nút tròn bên dưới ── */}
        <div className="flex flex-col items-center justify-center p-8 space-y-4 relative z-10">
          {/* Vùng Thought Bubble: Bong bóng suy nghĩ nổi trên đầu avatar */}
          <div className="relative flex flex-col items-center">
            {/* Hộp thoại bong bóng suy nghĩ dạng đám mây/oval */}
            <div className="relative px-5 py-3 rounded-2xl bg-surface-raised/95 border border-border-default shadow-lg backdrop-blur-md max-w-[280px] w-full text-center">
              <input
                type="text"
                value={suyNghi}
                onChange={(e) => setSuyNghi(e.target.value.slice(0, 100))}
                placeholder="Chia sẻ suy nghĩ…"
                maxLength={100}
                autoFocus
                className="w-full text-center text-sm font-medium text-text-primary placeholder:text-text-tertiary bg-transparent outline-none"
              />
              {suyNghi.length > 70 && (
                <span className="block mt-1 text-[10px] text-text-tertiary font-mono">
                  {suyNghi.length}/100
                </span>
              )}
            </div>

            {/* 2 hạt tròn kết nối bong bóng xuống avatar */}
            <div className="flex flex-col items-center -space-y-0.5 mt-0.5 pointer-events-none">
              <div className="size-2 rounded-full bg-surface-raised border border-border-default shadow-xs" />
              <div className="size-1 rounded-full bg-surface-raised border border-border-default shadow-xs mt-0.5" />
            </div>
          </div>

          {/* Avatar to ở trung tâm */}
          <div className="relative group">
            <div className="size-24 rounded-full ring-4 ring-brand/20 p-0.5 bg-gradient-to-tr from-brand/40 to-sky-400/40 shadow-xl overflow-hidden flex items-center justify-center">
              <AnhNguoiDung ten={displayName} avatar={currentAvatar} className="size-full text-2xl" />
            </div>
          </div>

          {/* 3 nút tròn chức năng bên dưới Avatar như Hình 1: 🎵 Nhạc, GIF Nhãn dán, 😊 Emoji */}
          <div className="flex items-center gap-3 pt-2">
            {/* Nút 1: Âm nhạc 🎵 */}
            <Popover open={hienGoiYNhac} onOpenChange={setHienGoiYNhac}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-10 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Thêm giai điệu / bài hát"
                    aria-label="Thêm giai điệu / bài hát"
                  >
                    <Music className="size-4" />
                  </button>
                }
              />
              <PopoverContent side="bottom" align="center" className="w-64 p-2 bg-surface-raised border-border-default shadow-xl rounded-xl z-[100]">
                <p className="px-2 py-1 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1">
                  Chọn trạng thái âm nhạc
                </p>
                <div className="space-y-1">
                  {GOI_Y_NHAC.map((baiHat) => (
                    <button
                      key={baiHat}
                      type="button"
                      onClick={() => {
                        setSuyNghi(baiHat)
                        setHienGoiYNhac(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-surface-overlay text-text-primary transition-colors cursor-pointer truncate flex items-center gap-1.5"
                    >
                      <span>🎵</span>
                      <span className="truncate">{baiHat}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Nút 2: GIF / Nhãn dán */}
            <Popover open={hienGoiYGif} onOpenChange={setHienGoiYGif}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-10 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95 text-[11px] font-bold"
                    title="Thêm biểu tượng cảm xúc GIF"
                    aria-label="Thêm biểu tượng cảm xúc GIF"
                  >
                    GIF
                  </button>
                }
              />
              <PopoverContent side="bottom" align="center" className="w-60 p-2 bg-surface-raised border-border-default shadow-xl rounded-xl z-[100]">
                <p className="px-2 py-1 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1">
                  Chọn nhãn dán cảm xúc
                </p>
                <div className="space-y-1">
                  {GOI_Y_GIF.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setSuyNghi((prev) => `${prev} ${g}`.trim())
                        setHienGoiYGif(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-surface-overlay text-text-primary transition-colors cursor-pointer font-mono"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Nút 3: Emoji 😊 */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="size-10 rounded-full bg-surface-raised border border-border-default hover:border-brand/50 hover:bg-surface-overlay flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Chọn biểu cảm emoji"
                    aria-label="Chọn biểu cảm emoji"
                  >
                    <Smile className="size-4" />
                  </button>
                }
              />
              <PopoverContent side="bottom" align="center" className="w-64 p-2.5 bg-surface-raised border-border-default shadow-xl rounded-xl z-[100]">
                <p className="px-1 pb-1.5 text-xs font-semibold text-text-secondary border-b border-border-subtle mb-1.5">
                  Tâm trạng hôm nay
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {GOI_Y_EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSuyNghi((prev) => `${prev} ${em}`.trim())}
                      className="flex size-8 items-center justify-center text-lg rounded-lg hover:bg-surface-overlay transition-colors active:scale-95 cursor-pointer"
                      title={`Thêm ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
