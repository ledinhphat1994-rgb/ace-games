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
}

export function AvatarPicker({ currentAvatarUrl, onSaveAvatar, onSuccess }: AvatarPickerProps) {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="day-loc-deu-co-gian sm:max-w-xl sm:flex-1 [--the-nho-nhat:5.5rem]" role="group" aria-label="Loại ảnh đại diện">
          {NHOM.map((nhom) => (
            <button
              key={nhom.id}
              type="button"
              aria-pressed={activeCategory === nhom.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveCategory(nhom.id)}
              className={cn(
                'flex h-9 min-h-9 max-h-9 items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-medium transition-colors duration-150',
                activeCategory === nhom.id
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              )}
            >
              {nhom.label}
              <span className="text-xs tabular-nums opacity-70">{demTheoNhom(nhom.id)}</span>
            </button>
          ))}
        </div>
        <Button onClick={handleSave} disabled={isSaving || chuaDoi} className="skeuo-btn-cta-amber shrink-0">
          {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
          {isSaving ? 'Đang lưu…' : 'Lưu ảnh đã chọn'}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8 p-0.5" role="listbox" aria-label="Thư viện ảnh đại diện">
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
                daChon ? 'border-brand bg-brand/10 shadow-xs' : 'border-border-default hover:border-border-strong',
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
  )
}
