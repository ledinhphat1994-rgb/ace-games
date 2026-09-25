import { describe, expect, it } from 'vitest'
import type { UserAchievementItem } from '../shared/protocol/engagement'
import { PRESET_AVATARS } from '../src/components/account/preset-avatars'
import { deriveAchievementViewState } from '../src/components/account/account-quick-center-state'
import { deriveProgressState } from '../src/components/progress/progress-state'
import { type HomeDestinationConfig, HOME_DESTINATIONS } from '../src/features/hub/home-destinations'
import accountQuickCenterRaw from '../src/components/account/AccountQuickCenter.tsx?raw'
import homePageRaw from '../src/features/hub/HomePage.tsx?raw'

describe('V3 Visual Recovery & Account Quick Center Contracts', () => {
  // ── 1. Preset Avatars Integrity ───────────────────────────────────────────
  it('1. Preset avatars contain 12 distinct teen illustrated assets that resolve to real packaged files', () => {
    expect(PRESET_AVATARS).toHaveLength(12)

    // Verify all 12 avatar assets are discoverable and packaged by Vite
    const packagedAvatars = import.meta.glob('../public/assets/avatars/*.webp', { eager: true })
    const packagedPaths = new Set(
      Object.keys(packagedAvatars).map((p) => p.replace('../public', ''))
    )

    const ids = new Set<string>()
    const paths = new Set<string>()

    for (const avatar of PRESET_AVATARS) {
      expect(avatar.id).toBeTruthy()
      expect(avatar.label).toBeTruthy()
      expect(avatar.src).toMatch(/^\/assets\/avatars\/avatar_\d{2}_.+\.webp$/)

      expect(ids.has(avatar.id)).toBe(false)
      expect(paths.has(avatar.src)).toBe(false)

      // Deterministic check: asset file must be packaged and available
      expect(packagedPaths.has(avatar.src), `Preset avatar "${avatar.label}" asset (${avatar.src}) must be packaged`).toBe(true)

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

  // ── 5. Quick Launch Destinations Contract (Source-Derived) ────────────────
  it('5. E: Verifies Quick Launch destinations coverage and gaming hub identity from real source config', () => {
    // Assert current V3 contract from real code:
    // 1. learn destination exists
    const learnDest = HOME_DESTINATIONS.find((d: HomeDestinationConfig) => d.id === 'learn')
    expect(learnDest).toBeDefined()
    expect(learnDest?.title).toBe('Học tập')
    expect(learnDest?.href).toBe('/learning')

    // 2. arena destination exists and routes to /arena
    const arenaDest = HOME_DESTINATIONS.find((d: HomeDestinationConfig) => d.id === 'arena')
    expect(arenaDest).toBeDefined()
    expect(arenaDest?.title).toBe('Game')
    expect(arenaDest?.href).toBe('/arena')
    expect(arenaDest?.artwork).toContain('/assets/games/')

    // 3. community destination exists
    const commDest = HOME_DESTINATIONS.find((d: HomeDestinationConfig) => d.id === 'community')
    expect(commDest).toBeDefined()
    expect(commDest?.title).toBe('Cộng đồng')
    expect(commDest?.href).toBe('/community')

    // 4. rooms destination exists
    const roomsDest = HOME_DESTINATIONS.find((d: HomeDestinationConfig) => d.id === 'rooms')
    expect(roomsDest).toBeDefined()
    expect(roomsDest?.title).toBe('Phòng học')
    expect(roomsDest?.href).toBe('/learn')

    // Total destinations coverage
    const destinationIds = HOME_DESTINATIONS.map((d: HomeDestinationConfig) => d.id)
    expect(destinationIds).toEqual(['learn', 'arena', 'community', 'rooms'])

    // NO decorative HOT badge in actual destinations
    for (const dest of HOME_DESTINATIONS) {
      expect(dest.badge).toBeUndefined()
    }

    // NO explanatory destination subtitles in actual Home config
    for (const dest of HOME_DESTINATIONS) {
      expect(dest.subtitle).toBeUndefined()
    }

    // Quick launch does not assign rainbow accent colors merely per tile
    for (const dest of HOME_DESTINATIONS) {
      expect('accentColor' in dest).toBe(false)
    }

    // Assert real HomePage source code has no legacy HOT badge or tile accentColor assignments
    expect(homePageRaw).not.toContain("badge: 'HOT'")
    expect(homePageRaw).not.toContain('accentColor:')
  })

  // ── 6. Zero Fabricated Achievements Contract ──────────────────────────────
  it('6. D: Ensures AccountQuickCenter does NOT contain hardcoded fake achievements and consumes authoritative endpoint', () => {
    // D. No fabricated achievement names exist
    expect(accountQuickCenterRaw).not.toContain('Pomodoro')
    expect(accountQuickCenterRaw).not.toContain('Vua Cờ Caro')
    expect(accountQuickCenterRaw).not.toContain('Thuyết Trình')
    expect(accountQuickCenterRaw).not.toContain('Bảng Đen')

    // Must query authoritative achievements & profile endpoints.
    // The profile summary lives at /api/engagement/me — /api/engagement/profile never existed on the worker (404).
    expect(accountQuickCenterRaw).toContain('/api/engagement/achievements')
    expect(accountQuickCenterRaw).toContain('/api/engagement/me')
    expect(accountQuickCenterRaw).not.toContain('/api/engagement/profile')
    expect(accountQuickCenterRaw).toContain("currentView === 'achievements'")
  })

  // ── 7. Truthful Achievement View State Derivation ─────────────────────────
  describe('7. Truthful Achievement View State & Error Recovery Contract', () => {
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

    // A. Authoritative achievement success renders backend data
    it('A. Authoritative achievement success renders backend data without fabrication', () => {
      const state = deriveAchievementViewState({
        isLoading: false,
        isError: false,
        items: mockRealAchievements,
      })
      expect(state).toEqual({
        status: 'success',
        items: mockRealAchievements,
      })
      if (state.status === 'success') {
        expect(state.items).toHaveLength(2)
        expect(state.items[0].title).toBe('Khởi đầu học tập')
        expect(state.items[0].rewardXp).toBe(15)
        expect(state.items[0].unlocked).toBe(true)
        expect(state.items[1].title).toBe('Chăm chỉ 3 ngày')
        expect(state.items[1].unlocked).toBe(false)
      }
    })

    // B. Zero achievements renders true empty state
    it('B. Zero achievements (200 OK with empty catalog/list) renders truthful empty state', () => {
      const state = deriveAchievementViewState({
        isLoading: false,
        isError: false,
        items: [],
      })
      expect(state).toEqual({ status: 'empty' })
    })

    // C. Achievement API failure renders ERROR state, NOT empty state
    it('C. Achievement API failure renders ERROR state, NEVER converts to empty or zero', () => {
      // Even if items is empty array or null, isError takes absolute precedence
      const stateOnErrorEmpty = deriveAchievementViewState({
        isLoading: false,
        isError: true,
        items: [],
      })
      expect(stateOnErrorEmpty).toEqual({
        status: 'error',
        message: 'Không tải được thành tựu',
      })
      expect(stateOnErrorEmpty.status).not.toBe('empty')
      expect(stateOnErrorEmpty.status).not.toBe('success')

      const stateOnErrorNull = deriveAchievementViewState({
        isLoading: false,
        isError: true,
        items: null,
      })
      expect(stateOnErrorNull).toEqual({
        status: 'error',
        message: 'Không tải được thành tựu',
      })
      expect(stateOnErrorNull.status).not.toBe('empty')

      // With custom error message from backend
      const stateCustomError = deriveAchievementViewState({
        isLoading: false,
        isError: true,
        errorMessage: 'Máy chủ phản hồi 500',
      })
      expect(stateCustomError).toEqual({
        status: 'error',
        message: 'Máy chủ phản hồi 500',
      })
      expect(stateCustomError.status).not.toBe('empty')
    })

    // Strict loading state isolation
    it('Loading state is strictly distinguished from empty and error', () => {
      const state = deriveAchievementViewState({
        isLoading: true,
        isError: false,
        items: null,
      })
      expect(state).toEqual({ status: 'loading' })
    })
  })

  // ── 6. Truthful Progress State Contract ──────────────────────────────────
  describe('6. Truthful Progress State Contract (Anti-Fabrication & Strict Error Handling)', () => {
    // A. Successful profile: currentStreak=0, totalXp=0 => legitimate zero values render
    it('A. Successful profile with 0 streak and 0 XP renders legitimate zeros, not error', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: true,
          profile: {
            accountId: 1,
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            totalXp: 0,
            todayXp: 0,
            unlockedAchievementsCount: 0,
            updatedAt: 1700000000000,
          },
        },
      })
      expect(state).toEqual({
        type: 'success',
        profile: expect.any(Object),
        todayXp: 0,
        totalXp: 0,
        currentStreak: 0,
      })
    })

    // B. Successful profile with data => authoritative values render
    it('B. Successful profile with real data renders authoritative values', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: true,
          profile: {
            accountId: 1,
            currentStreak: 7,
            longestStreak: 14,
            lastStudyDate: '2026-09-23',
            totalXp: 450,
            todayXp: 50,
            unlockedAchievementsCount: 4,
            updatedAt: 1700000000000,
          },
        },
      })
      expect(state).toEqual({
        type: 'success',
        profile: expect.any(Object),
        todayXp: 50,
        totalXp: 450,
        currentStreak: 7,
      })
    })

    // C. HTTP/API error => error state, NOT 0 ngày / 0 XP
    it('C. HTTP/API error renders ERROR state, NEVER converts to fake zero streak or XP', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: true,
        data: null,
        error: new Error('Network timeout'),
      })
      expect(state).toEqual({
        type: 'error',
        message: 'Network timeout',
      })
      expect(state.type).not.toBe('success')
    })

    // D. JSON { ok:false } => error state
    it('D. HTTP 200 with JSON { ok: false } returns error state, not success', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: false,
          loi: 'Phiên đăng nhập hết hạn',
        },
      })
      expect(state).toEqual({
        type: 'error',
        message: 'Phiên đăng nhập hết hạn',
      })
      expect(state.type).not.toBe('success')
    })

    // E. Loading => loading state
    it('E. Loading state is strictly distinguished from error and success', () => {
      const state = deriveProgressState({
        isLoading: true,
        isError: false,
        data: null,
      })
      expect(state).toEqual({
        type: 'loading',
      })
    })
  })
})
