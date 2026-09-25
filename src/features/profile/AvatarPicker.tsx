import { useState } from 'react'
import { Check, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { CHARACTER_AVATARS, type CharacterAvatar } from './character-avatars'

type AvatarCategoryFilter = 'all' | CharacterAvatar['category']

const NHOM: readonly { id: AvatarCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nhan_vat', label: 'Nhân vật' },
  { id: 'anime', label: 'Anime' },
  { id: 'cute', label: 'Thú cưng' },
  { id: 'minimal', label: 'Tối giản' },
]

interface AvatarPickerProps {
  currentAvatarUrl?: string
  onSaveAvatar: (url: string) => Promise<void>
}

export function AvatarPicker({ currentAvatarUrl, onSaveAvatar }: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentAvatarUrl || CHARACTER_AVATARS[0].src
  )
  const [activeCategory, setActiveCategory] = useState<AvatarCategoryFilter>('all')
  const [customUrl, setCustomUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const filteredAvatars = CHARACTER_AVATARS.filter((a) => activeCategory === 'all' || a.category === activeCategory)
  const demTheoNhom = (id: AvatarCategoryFilter) =>
    id === 'all' ? CHARACTER_AVATARS.length : CHARACTER_AVATARS.filter((a) => a.category === id).length

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await onSaveAvatar(selectedAvatar)
      toast.success('Đã cập nhật ảnh đại diện!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được ảnh đại diện.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'avatar')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Tải ảnh lên thất bại.')
      const data = (await res.json()) as { ok?: boolean; url?: string }
      if (data.ok && data.url) {
        setSelectedAvatar(data.url)
        await onSaveAvatar(data.url)
        toast.success('Tải ảnh đại diện thành công!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleApplyCustomUrl = async () => {
    if (!customUrl.trim()) return
    try {
      setSelectedAvatar(customUrl.trim())
      await onSaveAvatar(customUrl.trim())
      toast.success('Đã áp dụng ảnh đại diện từ đường dẫn!')
      setCustomUrl('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không dùng được ảnh từ đường dẫn này.')
    }
  }

  const chuaDoi = selectedAvatar === currentAvatarUrl

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="day-loc-deu-co-gian sm:max-w-xl sm:flex-1 [--the-nho-nhat:5.5rem]" role="group" aria-label="Loại ảnh đại diện">
          {NHOM.map((nhom) => (
            <button
              key={nhom.id}
              type="button"
              aria-pressed={activeCategory === nhom.id}
              onClick={() => setActiveCategory(nhom.id)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors duration-150',
                activeCategory === nhom.id
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              )}
            >
              {nhom.label}
              <span className="text-xs tabular-nums opacity-70">{demTheoNhom(nhom.id)}</span>
            </button>
          ))}
        </div>
        <Button onClick={handleSave} disabled={isSaving || chuaDoi} className="shrink-0">
          {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
          {isSaving ? 'Đang lưu…' : 'Lưu ảnh đã chọn'}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8" role="listbox" aria-label="Thư viện ảnh đại diện">
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
              onClick={() => setSelectedAvatar(avatar.src)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-2xl bg-canvas transition-shadow duration-150',
                daChon ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : 'ring-1 ring-border-default hover:ring-border-strong',
              )}
            >
              <img src={avatar.src} alt="" loading="lazy" className="size-full object-cover" />
              {daChon && (
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-text-on-brand shadow">
                  <Check className="size-3 stroke-[3]" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 border-t border-border-subtle pt-5 sm:grid-cols-2">
        <label
          className={cn(
            'flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong px-4 py-4 text-center transition-colors hover:border-brand/50 hover:bg-brand/5',
            isUploading && 'pointer-events-none opacity-60',
          )}
        >
          {isUploading ? <Loader2 className="size-5 animate-spin text-brand" /> : <Upload className="size-5 text-brand" />}
          <span className="text-sm font-medium text-text-primary">{isUploading ? 'Đang tải ảnh…' : 'Tải ảnh từ thiết bị'}</span>
          <span className="text-xs text-text-tertiary">PNG, JPG hoặc WEBP</span>
          <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleUploadFile} />
        </label>

        <div className="flex flex-col justify-center gap-2">
          <Label htmlFor="avatar-link" className="text-sm font-medium">Hoặc dùng đường link ảnh</Label>
          <div className="flex gap-2">
            <Input
              id="avatar-link"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://…/anh.png"
              className="flex-1"
            />
            <Button variant="outline" onClick={() => void handleApplyCustomUrl()} disabled={!customUrl.trim()} className="shrink-0">
              Dùng link
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
