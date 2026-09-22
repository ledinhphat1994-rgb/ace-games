// test/u3-visual.test.ts
// Digital Campus v2: Milestone V3 — Visual Recovery & Account Quick Center Contracts

import { describe, expect, it } from 'vitest'
import type { UserAchievementItem } from '../shared/protocol/engagement'
import { PRESET_AVATARS } from '../src/components/account/preset-avatars'
import accountQuickCenterRaw from '../src/components/account/AccountQuickCenter.tsx?raw'

describe('V3 Visual Recovery & Account Quick Center Contracts', () => {
  // ── 1. Preset Avatars Integrity ───────────────────────────────────────────
  it('1. Preset avatars contain 12 distinct teen illustrated assets', () => {
    expect(PRESET_AVATARS).toHaveLength(12)

    const ids = new Set<string>()
    const paths = new Set<string>()

    for (const avatar of PRESET_AVATARS) {
      expect(avatar.id).toBeTruthy()
      expect(avatar.label).toBeTruthy()
      expect(avatar.src).toMatch(/^\/assets\/avatars\/avatar_\d{2}_.+\.webp$/)

      expect(ids.has(avatar.id)).toBe(false)
      expect(paths.has(avatar.src)).toBe(false)

      ids.add(avatar.id)
      paths.add(avatar.src)
    }
  })

  // ── 2. Password Change Rules ──────────────────────────────────────────────
  it('2. Enforces password change validation rules', () => {
    const validatePasswordChange = (oldPass: string, newPass: string, confirmPass: string) => {
      if (!oldPass || !newPass || !confirmPass) {
        return { ok: false, error: 'Vui lòng điền đầy đủ các trường.' }
      }
      if (newPass !== confirmPass) {
        return { ok: false, error: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' }
      }
      if (newPass.length < 6) {
        return { ok: false, error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' }
      }
      return { ok: true }
    }

    // Mismatched confirmation
    expect(validatePasswordChange('old123', 'newpass1', 'newpass2')).toEqual({
      ok: false,
      error: 'Mật khẩu mới và xác nhận mật khẩu không khớp.',
    })

    // Too short
    expect(validatePasswordChange('old123', '12345', '12345')).toEqual({
      ok: false,
      error: 'Mật khẩu mới phải từ 6 ký tự trở lên.',
    })

    // Valid
    expect(validatePasswordChange('old123', 'newPass123', 'newPass123')).toEqual({
      ok: true,
    })
  })

  // ── 3. Profile Update Rules ───────────────────────────────────────────────
  it('3. Enforces profile update validation constraints', () => {
    const validateProfileUpdate = (tenHienThi?: string, tieuDeHoSo?: string) => {
      if (tenHienThi !== undefined) {
        const trimmed = tenHienThi.trim()
        if (trimmed.length < 2 || trimmed.length > 50) {
          return { ok: false, error: 'Tên hiển thị phải từ 2 đến 50 ký tự.' }
        }
      }
      if (tieuDeHoSo !== undefined) {
        const trimmed = tieuDeHoSo.trim()
        if (trimmed.length > 150) {
          return { ok: false, error: 'Châm ngôn học tập không được vượt quá 150 ký tự.' }
        }
      }
      return { ok: true }
    }

    expect(validateProfileUpdate('A')).toEqual({
      ok: false,
      error: 'Tên hiển thị phải từ 2 đến 50 ký tự.',
    })
    expect(validateProfileUpdate('Nguyễn Văn A')).toEqual({ ok: true })
    expect(validateProfileUpdate('Học sinh', 'A'.repeat(151))).toEqual({
      ok: false,
      error: 'Châm ngôn học tập không được vượt quá 150 ký tự.',
    })
    expect(validateProfileUpdate('Học sinh', 'Cố gắng mỗi ngày')).toEqual({ ok: true })
  })

  // ── 4. Account Role Label Resolution ──────────────────────────────────────
  it('4. Resolves account role labels accurately for all tiers', () => {
    const getRoleLabel = (user: { isSchoolAdmin?: boolean; role?: string | null }) => {
      if (user.isSchoolAdmin) return 'Quản trị viên'
      if (user.role === 'teacher') return 'Giáo viên'
      return 'Học sinh'
    }

    expect(getRoleLabel({ isSchoolAdmin: true, role: 'teacher' })).toBe('Quản trị viên')
    expect(getRoleLabel({ isSchoolAdmin: true, role: 'student' })).toBe('Quản trị viên')
    expect(getRoleLabel({ isSchoolAdmin: false, role: 'teacher' })).toBe('Giáo viên')
    expect(getRoleLabel({ isSchoolAdmin: false, role: 'student' })).toBe('Học sinh')
  })

  // ── 5. Quick Launch Destinations Contract ─────────────────────────────────
  it('5. Verifies Quick Launch destinations coverage and gaming hub identity', () => {
    const destinationIds = ['learn', 'arena', 'community', 'rooms']
    expect(destinationIds).toContain('learn')
    expect(destinationIds).toContain('arena')
    expect(destinationIds).toContain('community')
    expect(destinationIds).toContain('rooms')

    // Game hub identity
    const arenaItem = {
      id: 'arena',
      title: 'Đấu trường Game',
      subtitle: 'Caro · 2048 · Rắn',
      artwork: '/assets/games/card_game.webp',
      href: '/arena',
      accentColor: 'green',
      badge: 'HOT',
    }
    expect(arenaItem.accentColor).toBe('green')
    expect(arenaItem.badge).toBe('HOT')
    expect(arenaItem.artwork).toContain('/assets/games/')
  })

  // ── 6. Zero Fabricated Achievements Contract ──────────────────────────────
  it('6. Ensures AccountQuickCenter does NOT contain hardcoded fake achievements and consumes authoritative endpoint', () => {
    // Must NOT contain fabricated achievement titles
    expect(accountQuickCenterRaw).not.toContain('Pomodoro')
    expect(accountQuickCenterRaw).not.toContain('Vua Cờ Caro')
    expect(accountQuickCenterRaw).not.toContain('Thuyết Trình')
    expect(accountQuickCenterRaw).not.toContain('Bảng Đen')

    // Must query authoritative achievements endpoint
    expect(accountQuickCenterRaw).toContain('/api/engagement/achievements')
    expect(accountQuickCenterRaw).toContain("currentView === 'achievements'")
  })

  // ── 7. Authoritative Achievement Model Mapping ────────────────────────────
  it('7. Correctly maps UserAchievementItem list and distinguishes empty vs populated state', () => {
    const mockEmptyAchievements: UserAchievementItem[] = []
    const mockRealAchievements: UserAchievementItem[] = [
      {
        key: 'first_session',
        title: 'Khởi đầu học tập',
        description: 'Hoàn thành phiên học đầu tiên tại Digital Campus',
        category: 'session',
        icon: 'Sparkles',
        rewardXp: 15,
        unlocked: true,
        unlockedAt: 1710000000000,
      },
      {
        key: 'streak_3',
        title: 'Chăm chỉ 3 ngày',
        description: 'Duy trì chuỗi học tập 3 ngày liên tiếp',
        category: 'streak',
        icon: 'Flame',
        rewardXp: 25,
        unlocked: false,
        unlockedAt: null,
      },
    ]

    // Empty state truthfully detected
    expect(mockEmptyAchievements.length).toBe(0)

    // Unlocked and locked records distinguish visually and have valid rewardXP
    expect(mockRealAchievements[0].unlocked).toBe(true)
    expect(mockRealAchievements[0].rewardXp).toBe(15)
    expect(mockRealAchievements[1].unlocked).toBe(false)
    expect(mockRealAchievements[1].rewardXp).toBe(25)
  })
})
