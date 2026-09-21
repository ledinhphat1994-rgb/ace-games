import { useState } from 'react'
import { Check, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

import { CHARACTER_AVATARS } from './character-avatars'

type AvatarCategoryFilter = 'all' | 'nhan_vat' | 'anime' | 'cute' | 'minimal'

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

  const filteredAvatars = CHARACTER_AVATARS.filter((a) => {
    if (activeCategory === 'all') return true
    return a.category === activeCategory
  })

  const handleSelect = (src: string) => {
    setSelectedAvatar(src)
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await onSaveAvatar(selectedAvatar)
      toast.success('Đã cập nhật ảnh đại diện nhân vật thành công!')
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
    }
  }

  const handleApplyCustomUrl = async () => {
    if (!customUrl.trim()) return
    setSelectedAvatar(customUrl.trim())
    await onSaveAvatar(customUrl.trim())
    toast.success('Đã áp dụng ảnh đại diện từ đường dẫn!')
    setCustomUrl('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Column: Category Filters & Info */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Tạo dấu ấn riêng</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Chọn avatar thể hiện phong cách của bạn trên Digital Campus.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            {[
              { id: 'all', label: 'Tất cả', count: CHARACTER_AVATARS.length },
              { id: 'nhan_vat', label: 'Nhân vật', count: 5 },
              { id: 'anime', label: 'Phong cách anime', count: 3 },
              { id: 'cute', label: 'Cute & Thú cưng', count: 2 },
              { id: 'minimal', label: 'Minimal', count: 2 },
            ].map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as AvatarCategoryFilter)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-slate-900 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Upload Custom Avatar Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Tải ảnh từ thiết bị
          </h4>
          <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-900/50 p-4 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center">
            <Upload className="h-5 w-5 text-cyan-400 mb-1" />
            <span className="text-xs font-semibold text-slate-200">
              {isUploading ? 'Đang tải ảnh…' : 'Chọn tệp ảnh (.png, .jpg, .webp)'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleUploadFile}
            />
          </label>

          <div className="pt-2">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Hoặc dùng đường link ảnh
            </label>
            <div className="flex gap-2">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="h-8 text-xs bg-slate-900 border-white/10 rounded-lg flex-1"
              />
              <Button
                size="sm"
                onClick={handleApplyCustomUrl}
                disabled={!customUrl.trim()}
                className="h-8 px-3 text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right 3 Columns: Avatar Gallery Grid */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-base font-black text-white">
                Thư viện Avatar nhân vật ({filteredAvatars.length})
              </h3>
              <p className="text-xs text-slate-400">
                Nhấp vào avatar để chọn, sau đó bấm &ldquo;Lưu thay đổi&rdquo; bên dưới.
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-4 rounded-xl text-xs font-extrabold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
            </Button>
          </div>

          {/* Avatars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredAvatars.map((avatar) => {
              const isSelected = selectedAvatar === avatar.src
              return (
                <div
                  key={avatar.id}
                  onClick={() => handleSelect(avatar.src)}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer aspect-square bg-slate-950 flex items-center justify-center ${
                    isSelected
                      ? 'border-cyan-400 ring-4 ring-cyan-400/20 shadow-lg shadow-cyan-500/25 scale-[1.03]'
                      : 'border-white/10 hover:border-cyan-500/50 hover:scale-[1.02]'
                  }`}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Active Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-md">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Name label on hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold text-white text-center truncate">
                      {avatar.name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
