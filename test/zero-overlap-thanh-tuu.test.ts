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
import toolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import leaderboardRaw from '../src/features/games/GameArenaLeaderboard.tsx?raw'
import dmThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'
import nutQuanHeRaw from '../src/components/social/NutQuanHe.tsx?raw'

describe('Quy tắc thiết kế: Zero Overlap & Nút Thành tựu & Xóa nút Thành viên góc phải', () => {
  it('1. ClassroomTopBar loại bỏ nút Thành viên thừa thãi cạnh Chat, giữ dải thành viên trung tâm', () => {
    expect(topBarRaw).not.toContain('topbar-btn-members')
    expect(topBarRaw).toContain('memberStrip')
  })

  it('2. HoSoNguoiDungDialog tách hàng độc lập (Zero Overlap), có card thành tựu và badge Bạn nổi bật ở vùng 3+', () => {
    // Badge "Bạn" nổi bật ở góc trên trái vùng 3+
    expect(dialogRaw).toContain('data-testid="badge-ban-highlight"')
    expect(dialogRaw).toContain('★ BẠN')

    // Card Thành tựu độc lập, không đè
    expect(dialogRaw).toContain('data-testid="card-thanh-tuu"')
    expect(dialogRaw).toContain('Thành tựu')

    // Phân tách hàng quan hệ riêng, hàng hành động riêng chống đè
    expect(dialogRaw).toContain('data-testid="ho-so-quan-he-row"')
    expect(dialogRaw).toContain('data-testid="ho-so-btn-nhan-tin"')

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

  it('5. GamePlayToolbar: 2 icon ngoài cùng cố định, cụm icon giữa có thể kéo qua kéo lại (drag-to-scroll)', () => {
    expect(toolbarRaw).toContain('game-toolbar-fixed-left')
    expect(toolbarRaw).toContain('game-toolbar-fixed-right')
    expect(toolbarRaw).toContain('game-toolbar-scrollable-center')
    expect(toolbarRaw).toContain('centerScrollRef')
    expect(toolbarRaw).toContain('batDauKeo')
    expect(toolbarRaw).toContain('keo')
    expect(toolbarRaw).toContain('thaKeo')
    expect(toolbarRaw).toContain('setPointerCapture')
  })

  it('6. Icon tương tác trên toàn bộ trang sáng rõ, không bị mờ', () => {
    expect(leaderboardRaw).toContain('text-white/80 hover:text-white')
    expect(toolbarRaw).toContain('text-white')
  })

  it('7. Thiết kế lại Vùng 1 và Vùng 2 theo yêu cầu mới', () => {
    // Vùng 1: Nút thành tựu nằm sát bên dòng XP, không còn ở footer
    expect(dialogRaw).toContain('ho-so-btn-thanh-tuu')
    expect(dialogRaw).toContain('ho-so-btn-nhan-tin')
    expect(dialogRaw).toContain('w-full min-h-11')

    // Vùng 2: Xóa icon User thừa ở header DirectMessageThread, chuyển sang click Avatar
    expect(dmThreadRaw).not.toContain('title={`Xem hồ sơ của ${target.displayName}`}')
    expect(dmThreadRaw).toContain('group/user-header')
    expect(dmThreadRaw).toContain('setNguoiXem({')

    // NutQuanHe: Trạng thái bạn bè với hủy kết bạn chung 1 dòng, khi hủy kết bạn thì hiển thị kết bạn
    expect(nutQuanHeRaw).toContain('Hủy kết bạn')
    expect(nutQuanHeRaw).toContain('Kết bạn')
    expect(nutQuanHeRaw).toContain('flex min-w-0 w-full items-center justify-between gap-3')
  })
})
