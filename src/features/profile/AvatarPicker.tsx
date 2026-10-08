import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { CHARACTER_AVATARS, type CharacterAvatar } from './character-avatars'

type AvatarCategoryFilter = 'all' | CharacterAvatar['category']

const NHOM: readonly { id: AvatarCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'cute', label: 'Hoạt hình' },
  { id: 'nhan_vat', label: 'Nhân vật' },
  { id: 'anime', label: 'Anime' },
  { id: 'minimal', label: 'Tối giản' },
]

interface AvatarPickerProps {
  currentAvatarUrl?: string
  onSaveAvatar: (url: string) => Promise<void>
  onSuccess?: () => void
  onClose?: () => void
}

export function AvatarPicker({ currentAvatarUrl, onSaveAvatar, onSuccess, onClose }: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentAvatarUrl || CHARACTER_AVATARS[0].src
  )
  const [activeCategory, setActiveCategory] = useState<AvatarCategoryFilter>('all')
  const [isSaving, setIsSaving] = useState(false)

  const filteredAvatars = CHARACTER_AVATARS.filter((a) => activeCategory === 'all' || a.category === activeCategory)
  const demTheoNhom = (id: AvatarCategoryFilter) =>
    id === 'all' ? CHARACTER_AVATARS.length : CHARACTER_AVATARS.filter((a) => a.category === id).length

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await onSaveAvatar(selectedAvatar)
      toast.success('Đã cập nhật ảnh đại diện!')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được ảnh đại diện.')
    } finally {
      setIsSaving(false)
    }
  }

  const chuaDoi = selectedAvatar === currentAvatarUrl

  return (
    <div className="flex flex-col flex-1 min-h-0 justify-between gap-3">
      {/* VÙNG 1: BỘ LỌC DANH MỤC CỐ ĐỊNH 1 HÀNG DUY NHẤT, KHÔNG RỚT HÀNG (Rule 9 & 10) */}
      <div
        className="grid grid-cols-5 gap-1.5 sm:gap-2 shrink-0 select-none"
        role="group"
        aria-label="Loại ảnh đại diện"
      >
        {NHOM.map((nhom) => {
          const isActive = activeCategory === nhom.id
          return (
            <button
              key={nhom.id}
              type="button"
              aria-pressed={isActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveCategory(nhom.id)}
              className={cn(
                'flex h-9 min-h-9 max-h-9 items-center justify-center gap-1 sm:gap-1.5 rounded-xl border-2 px-1.5 sm:px-2.5 text-xs sm:text-[13px] font-semibold transition-colors duration-150 cursor-pointer',
                isActive
                  ? 'border-brand bg-brand/15 text-brand shadow-xs'
                  : 'border-border-default bg-surface text-text-secondary hover:border-brand/40 hover:bg-surface-raised hover:text-text-primary',
              )}
            >
              <span className="truncate">{nhom.label}</span>
              <span className="text-[11px] font-mono tabular-nums opacity-75 shrink-0">
                {demTheoNhom(nhom.id)}
              </span>
            </button>
          )
        })}
      </div>

      {/* VÙNG 2: THƯ VIỆN ẢNH ĐẠI DIỆN - KHÓA SLOT CHIỀU CAO CỐ ĐỊNH, CUỘN NỘI BỘ, ZERO CLS */}
      <div
        className="flex-1 min-h-[340px] max-h-[340px] overflow-y-auto overscroll-contain pr-1 py-1 select-none"
        role="listbox"
        aria-label="Thư viện ảnh đại diện"
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3 content-start">
          {filteredAvatars.map((avatar) => {
            const daChon = selectedAvatar === avatar.src
            return (
              <button
                key={avatar.id}
                type="button"
                role="option"
                aria-selected={daChon}
                aria-label={avatar.name}
                title={avatar.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSelectedAvatar(avatar.src)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-2xl bg-canvas border-2 transition-colors duration-150 cursor-pointer',
                  daChon ? 'border-brand bg-brand/10 shadow-xs ring-1 ring-brand/40' : 'border-border-default hover:border-brand/40',
                )}
              >
                <img src={avatar.src} alt="" loading="lazy" className="size-full object-cover" />
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-text-on-brand shadow transition-opacity duration-150',
                    daChon ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <Check className="size-3 stroke-[3]" />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* VÙNG 3: FOOTER CTA CỐ ĐỊNH VỊ TRÍ, KHÔNG BỊ ĐÈ HAY CO GIẬT (Rule 9) */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle shrink-0">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-semibold border-2 border-border-default hover:bg-surface-raised cursor-pointer transition-colors duration-150"
          >
            Hủy
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || chuaDoi}
          className="skeuo-btn-cta-amber h-9 px-5 rounded-xl text-xs font-bold shrink-0 cursor-pointer gap-1.5 transition-colors duration-150"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          <span>{isSaving ? 'Đang lưu…' : 'Lưu ảnh đã chọn'}</span>
        </Button>
      </div>
    </div>
  )
}
