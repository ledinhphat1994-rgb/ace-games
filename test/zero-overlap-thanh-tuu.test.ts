// test/zero-overlap-thanh-tuu.test.ts
// Kiểm tra hồi quy cho:
// 1. Xóa tận gốc nút Thành viên góc phải ClassroomTopBar.
// 2. Chống đè card (Zero Overlap Invariant) và bổ sung nút / view Thành tựu trong HoSoNguoiDungDialog.
// 3. Quy tắc thiết kế trong AGENTS.md và 00-digital-campus-root.md.
// 4. API /api/engagement/achievements hỗ trợ xem thành tựu người dùng khác qua ?accountId=

import { describe, expect, it } from 'vitest'
import topBarRaw from '../src/features/study/workspace/ClassroomTopBar.tsx?raw'
import dialogRaw from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import agentsRaw from '../AGENTS.md?raw'
import rootRulesRaw from '../.agents/rules/00-digital-campus-root.md?raw'
import apiRaw from '../worker/routes/engagement-api.ts?raw'

describe('Quy tắc thiết kế: Zero Overlap & Nút Thành tựu & Xóa nút Thành viên góc phải', () => {
  it('1. ClassroomTopBar xóa tận gốc nút Thành viên góc phải, giữ dải thành viên trung tâm', () => {
    expect(topBarRaw).not.toContain('topbar-btn-members')
    expect(topBarRaw).not.toContain("onTogglePanel('members')")
    expect(topBarRaw).toContain('memberStrip')
  })

  it('2. HoSoNguoiDungDialog tách hàng độc lập (Zero Overlap) và có nút / view Thành tựu', () => {
    // Nút thành tựu
    expect(dialogRaw).toContain('data-testid="ho-so-btn-thanh-tuu"')
    expect(dialogRaw).toContain('Thành tựu')
    // Phân tách hàng quan hệ riêng, hàng grid hành động riêng chống đè
    expect(dialogRaw).toContain('data-testid="ho-so-quan-he-row"')
    expect(dialogRaw).toContain('grid grid-cols-2')
    // Danh sách thành tựu chi tiết
    expect(dialogRaw).toContain('data-testid="ho-so-danh-sach-thanh-tuu"')
    expect(dialogRaw).toContain('/api/engagement/achievements?accountId=')
  })

  it('3. AGENTS.md và 00-digital-campus-root.md ghi nhận quy tắc Zero Overlap, Nút thành tựu, Icon khi hẹp', () => {
    for (const text of [agentsRaw, rootRulesRaw]) {
      expect(text).toContain('Zero Overlap Invariant')
      expect(text).toContain('Nút thành tựu')
      expect(text).toContain('Icon-Only Compact Mode')
    }
  })

  it('4. API /api/engagement/achievements hỗ trợ query accountId', () => {
    expect(apiRaw).toContain("c.req.query('accountId')")
    expect(apiRaw).toContain('parsedTarget')
  })
})
