import { describe, expect, it } from 'vitest'
import { CHARACTER_AVATARS } from '../src/features/profile/character-avatars'
import avatarPickerRaw from '../src/features/profile/AvatarPicker.tsx?raw'

describe('Avatar Picker Vùng 1 (Xóa Upload & Link) & Vùng 2 (Bổ sung Avatar Hoạt hình Dễ thương)', () => {
  it('1. Vùng 1 đã xóa sạch: Không còn input file tải ảnh hay input URL', () => {
    // Vùng 1 bị xóa hoàn toàn
    expect(avatarPickerRaw).not.toContain('Tải ảnh từ thiết bị')
    expect(avatarPickerRaw).not.toContain('Đường dẫn ảnh trực tiếp')
    expect(avatarPickerRaw).not.toContain('type="file"')
    expect(avatarPickerRaw).not.toContain('Dùng link')
    expect(avatarPickerRaw).not.toContain('handleUploadFile')
    expect(avatarPickerRaw).not.toContain('handleApplyCustomUrl')
  })

  it('2. Vùng 2 được bổ sung nhiều avatar hoạt hình dễ thương (tổng cộng 28 avatar, nhóm hoạt hình >= 18)', () => {
    expect(CHARACTER_AVATARS.length).toBe(28)

    const cuteAvatars = CHARACTER_AVATARS.filter((a) => a.category === 'cute')
    expect(cuteAvatars.length).toBe(18)

    // Kiểm tra các avatar dễ thương mới có trong danh sách
    const ids = CHARACTER_AVATARS.map((a) => a.id)
    expect(ids).toContain('panda_cute')
    expect(ids).toContain('corgi_cute')
    expect(ids).toContain('kitten_cute')
    expect(ids).toContain('dino_cute')
    expect(ids).toContain('bunny_cute')
    expect(ids).toContain('penguin_cute')
    expect(ids).toContain('duck_cute')
    expect(ids).toContain('hamster_cute')
    expect(ids).toContain('fox_cute')
    expect(ids).toContain('koala_cute')
    expect(ids).toContain('frog_cute')
    expect(ids).toContain('piggy_cute')
    expect(ids).toContain('tiger_cute')
    expect(ids).toContain('unicorn_cute')
    expect(ids).toContain('bear_cute')
    expect(ids).toContain('chick_cute')
  })

  it('3. Toàn bộ file ảnh avatar .webp được trỏ tới đều tồn tại thực tế và được package bởi Vite', () => {
    const packagedAvatars = import.meta.glob('../public/assets/avatars/*.webp', { eager: true })
    const packagedPaths = new Set(
      Object.keys(packagedAvatars).map((p) => p.replace('../public', ''))
    )

    for (const avatar of CHARACTER_AVATARS) {
      expect(
        packagedPaths.has(avatar.src),
        `Avatar asset ${avatar.src} (${avatar.name}) must be packaged`
      ).toBe(true)
    }
  })

  it('4. Tab filter có nhóm Hoạt hình hiển thị đúng định danh', () => {
    expect(avatarPickerRaw).toContain("id: 'cute', label: 'Hoạt hình'")
  })
})
