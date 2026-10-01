// Thanh trên căn giữa nền đặc · bảng xếp hạng gọn (hạng, tên, level, điểm) · sảnh trò chơi đơn một nút ·
// hồ sơ người dùng bấm từ chat + kết bạn + tìm người chưa kết bạn ở tab Bạn bè.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { HoSoNguoiDung, SearchResultItem } from '../shared/protocol/social'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import headerRaw from '../src/components/layout/AppHeader.tsx?raw'
import leaderboardRaw from '../src/features/games/GameArenaLeaderboard.tsx?raw'
import lobbyRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import chatRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'
import sidebarRaw from '../src/features/games/GameSocialSidebar.tsx?raw'
import nutRaw from '../src/components/social/NutQuanHe.tsx?raw'
import dialogRaw from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import hookRaw from '../src/hooks/use-tim-nguoi-dung.ts?raw'
import { suyRaQuanHe, nhanVaiTro } from '../src/components/social/quan-he'

const goi = (path: string, cookie?: string) => exports.default.fetch(`${GOC}${path}`, { headers: cookie ? { Cookie: cookie } : {} })
const idCua = async (u: string) =>
  (await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(u).first<{ id: number }>())!.id

describe('Hồ sơ người dùng — API', () => {
  it('cần đăng nhập; mã sai 400; không có 404', async () => {
    const khach = await goi('/api/social/profile/2')
    expect(khach.status).toBe(401)
    await khach.body?.cancel()
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    for (const [duong, ma] of [['abc', 400], ['0', 400], ['-3', 400], ['999999', 404]] as const) {
      const res = await goi(`/api/social/profile/${duong}`, cookie)
      expect(res.status, duong).toBe(ma)
      await res.body?.cancel()
    }
  })

  it('trả thông tin công khai an toàn: tên, ảnh, vai trò, lớp, châm ngôn, XP — không lộ tên đăng nhập / hash / thiết bị', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const dich = await idCua('qa.v2.thu2')
    await env.DB.prepare("UPDATE tai_khoan_campus SET tieu_de_ho_so = 'Học đều mỗi ngày', avatar = '/assets/avatars/meo.png' WHERE id = ?1").bind(dich).run()
    await env.DB.prepare(
      `INSERT INTO user_engagement_profile (account_id, total_xp, updated_at) VALUES (?1, 480, 1) ON CONFLICT(account_id) DO UPDATE SET total_xp = 480`,
    ).bind(dich).run()

    const res = await goi(`/api/social/profile/${dich}`, cookie)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toMatch(/qa\.v2|mat_khau|salt|hash|thiet_bi|username/i)
    const { profile } = JSON.parse(text) as { profile: HoSoNguoiDung }
    expect(profile).toMatchObject({ id: dich, displayName: 'QA Thử nghiệm 2', avatar: '/assets/avatars/meo.png', role: 'student', lopTen: '10A7 Thử nghiệm', tieuDeHoSo: 'Học đều mỗi ngày', totalXp: 480 })
    await env.DB.prepare('UPDATE tai_khoan_campus SET tieu_de_ho_so = NULL, avatar = NULL WHERE id = ?1').bind(dich).run()
  })

  it('tài khoản chưa có XP → 0; tài khoản khoá, tài khoản hệ thống và người chặn nhau đều 404', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const me = await idCua('qa.v2.thu1')
    const chuaXp = await idCua('qa.v2.thu3')
    await env.DB.prepare('DELETE FROM user_engagement_profile WHERE account_id = ?1').bind(chuaXp).run()
    const ok = await goi(`/api/social/profile/${chuaXp}`, cookie)
    expect(((await ok.json()) as { profile: HoSoNguoiDung }).profile.totalXp).toBe(0)

    for (const u of ['qa.v2.khoa', 'system']) {
      const res = await goi(`/api/social/profile/${await idCua(u)}`, cookie)
      expect(res.status, u).toBe(404)
      await res.body?.cancel()
    }

    const bi = await idCua('qa.v2.thu2')
    await env.DB.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?1, ?2, 1)').bind(bi, me).run()
    const chan = await goi(`/api/social/profile/${bi}`, cookie)
    expect(chan.status).toBe(404)
    await chan.body?.cancel()
    await env.DB.prepare('DELETE FROM blocks WHERE blocker_id = ?1 AND blocked_id = ?2').bind(bi, me).run()
  })

  it('tìm kiếm trả cả người chưa kết bạn kèm quan hệ, không tự thấy mình', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await goi(`/api/social/search?q=${encodeURIComponent('QA Thử')}`, cookie)
    const { results } = (await res.json()) as { results: SearchResultItem[] }
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.displayName === 'QA Thử nghiệm 1')).toBe(false)
    expect(results.every((r) => ['none', 'friend', 'pending_sent', 'pending_received'].includes(r.relationshipStatus))).toBe(true)
  })
})

describe('Quan hệ bạn bè suy từ SocialState', () => {
  const state = {
    friends: [{ id: 2 }],
    incomingRequests: [{ id: 10, sender: { id: 3 } }],
    outgoingRequests: [{ id: 11, receiver: { id: 4 } }],
    blockedUsers: [{ id: 5 }],
  } as never
  it('tự mình · bạn · đã gửi · nhận được · chặn · chưa quen', () => {
    expect(suyRaQuanHe(1, 1, state)).toBe('self')
    expect(suyRaQuanHe(2, 1, state)).toBe('friend')
    expect(suyRaQuanHe(4, 1, state)).toBe('pending_sent')
    expect(suyRaQuanHe(3, 1, state)).toBe('pending_received')
    expect(suyRaQuanHe(5, 1, state)).toBe('blocked')
    expect(suyRaQuanHe(9, 1, state)).toBe('none')
  })
  it('nhãn vai trò', () => {
    expect(nhanVaiTro('student')).toBe('Học sinh')
    expect(nhanVaiTro('giao_vien')).toBe('Giáo viên')
    expect(nhanVaiTro('school_admin')).toBe('Quản trị')
    expect(nhanVaiTro('lạ')).toBeNull()
  })
})

describe('Giao diện', () => {
  it('thanh trên: chuẩn kiến trúc tham chiếu, tìm kiếm bên trái, tiện ích và tài khoản bên phải', () => {
    expect(headerRaw).toContain('sticky top-0 z-30')
    expect(headerRaw).toContain('pt-[env(safe-area-inset-top)]')
    expect(headerRaw).toContain('border-b border-border-subtle')
    expect(headerRaw).toContain('CampusSearch')
    expect(headerRaw).toContain('ThemeSwitch')
    expect(headerRaw).toContain('data-testid="header-chat-button"')
    expect(headerRaw).toContain('UserAvatarMenu')
  })

  it('bảng xếp hạng chỉ còn hạng · tên · level · điểm: bỏ thẻ nhà vô địch, ảnh chữ cái, huy chương, chip Top 50', () => {
    for (const cu of ['ChampionSpotlight', 'AvatarInitials', 'Kỷ Lục Đứng Đầu', '🥈', '🥉', '👑', 'Thứ hạng 2', 'bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider']) {
      expect(leaderboardRaw, cu).not.toContain(cu)
    }
    expect(leaderboardRaw).toContain('grid-cols-[2rem_minmax(0,1fr)_auto_auto]')
    expect(leaderboardRaw).toContain('Lv.{capDo}')
    expect(leaderboardRaw).toContain("verifiedOnly: '1'")
  })

  it('sảnh trò chơi: sảnh các game là như nhau, thanh công cụ có Chơi ngay, Tạo phòng, danh sách bàn đồng nhất', () => {
    expect(lobbyRaw).toContain('testId="game-lobby"')
    expect(lobbyRaw).toContain("choiNgay={{ nhan: 'Chơi ngay'")
    expect(lobbyRaw).toContain("tieuDe: 'Bàn đang mở'")
    expect(lobbyRaw).toContain("nhan: 'Tạo phòng'")
  })

  it('chat chung: bấm ảnh hoặc tên người khác mở hồ sơ; hồ sơ có nút kết bạn theo quan hệ thật', () => {
    expect(chatRaw).toContain('<HoSoNguoiDungDialog nguoi={nguoiXem}')
    expect(chatRaw).toContain('aria-label={`Xem thông tin ${msg.ten}`}')
    expect(dialogRaw).toContain('layHoSoNguoiDung(nguoi.id)')
    expect(dialogRaw).toContain('<NutQuanHe id={nguoi.id} day />')
    expect(dialogRaw).toContain('anchorRect')
    for (const kq of ['guiLoiMoiKetBan', 'chapNhanKetBan', 'tuChoiKetBan', 'huyLoiMoi', 'unfriend']) expect(nutRaw).toContain(kq)
    expect(nutRaw).toContain('Hủy kết bạn')
    for (const tt of ["case 'friend'", "case 'pending_sent'", "case 'pending_received'", "case 'blocked'"]) expect(nutRaw).toContain(tt)
  })

  it('tab Bạn bè: tìm được người chưa kết bạn, xem hồ sơ và kết bạn ngay từ kết quả; có mục lời mời đến', () => {
    expect(sidebarRaw).toContain('useTimNguoiDung(tuKhoaTim')
    expect(sidebarRaw).toContain('data-testid="ket-qua-tim-nguoi"')
    expect(sidebarRaw).toContain("r.relationshipStatus !== 'friend' && r.relationshipStatus !== 'self'")
    expect(sidebarRaw).toContain('<NutQuanHe id={id} trangThaiMayChu={trangThaiMayChu} />')
    expect(sidebarRaw).toContain('data-testid="loi-moi-den"')
    expect(sidebarRaw).toContain('placeholder="Tìm bạn bè hoặc người khác…"')
    // Lỗi mạng không bị hiểu nhầm thành "không tìm thấy".
    expect(sidebarRaw).toContain('Không tìm được người dùng.')
    expect(hookRaw).toContain('new UserSearchController()')
    expect(hookRaw).toContain('const CHO_GO_MS = 300')
  })
})
