// Thống kê nhanh của sảnh (Học tập / Game) — chỉ Quản trị trường; số liệu thật từ D1 theo ngày giờ trường (UTC+7).
// So sánh chênh lệch trước/sau khi chèn dữ liệu nên không phụ thuộc dữ liệu có sẵn của các test khác.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { ThongKeGame, ThongKeHocTap } from '../shared/protocol/thong-ke-sanh'
import { studyDate } from '../shared/study-date'
import { khungNgay } from '../worker/lib/thong-ke-sanh'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import sanhRaw from '../src/components/lobby/SanhHoatDong.tsx?raw'
import thongKeNhanhRaw from '../src/components/lobby/ThongKeNhanh.tsx?raw'
import gameCardRaw from '../src/features/games/GameCard.tsx?raw'
import gameLobbyViewRaw from '../src/features/games/GameLobbyView.tsx?raw'
import gameLobbyPageRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'
import hookRaw from '../src/hooks/use-thong-ke-sanh.ts?raw'

const NGAY = 86400000
const goi = (path: string, cookie?: string) =>
  exports.default.fetch(`${GOC}${path}`, { headers: cookie ? { Cookie: cookie } : {} })

async function layThongKe<T>(cookie: string, query: string): Promise<T> {
  const res = await goi(`/api/admin/thong-ke-sanh?${query}`, cookie)
  expect(res.status).toBe(200)
  const body = (await res.json()) as { ok: boolean; thongKe: T }
  expect(body.ok).toBe(true)
  return body.thongKe
}

const idCua = async (username: string) =>
  (await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(username).first<{ id: number }>())!.id

let dem = 0
async function chenVan(gameType: string, host: number, guest: number | null, endedAt: number) {
  dem++
  await env.DB.prepare(
    `INSERT INTO game_matches (id, game_type, mode, host_account_id, guest_account_id, status, started_at, ended_at, end_reason, idempotency_key, created_at)
     VALUES (?1, ?2, '1v1', ?3, ?4, 'ended', ?5, ?5, 'normal', ?1, ?5)`,
  )
    .bind(`tk-van-${dem}-${Math.random()}`, gameType, host, guest, endedAt)
    .run()
}
async function chenLuotDon(gameType: string, account: number, startedAt: number, status = 'completed') {
  dem++
  await env.DB.prepare(
    `INSERT INTO game_sessions (id, game_type, account_id, seed, started_at, status) VALUES (?1, ?2, ?3, 1, ?4, ?5)`,
  )
    .bind(`tk-luot-${dem}-${Math.random()}`, gameType, account, startedAt, status)
    .run()
}

describe('Thống kê sảnh — phân quyền', () => {
  it('khách 401; học sinh, giáo viên 403; tham số sai 400', async () => {
    const khach = await goi('/api/admin/thong-ke-sanh?loai=game')
    expect(khach.status).toBe(401)
    await khach.body?.cancel()
    for (const u of ['qa.v2.thu1', 'qa.v2.gv']) {
      const res = await goi('/api/admin/thong-ke-sanh?loai=hoc_tap', await dangNhapLayCookie(u))
      expect(res.status).toBe(403)
      await res.body?.cancel()
    }
    const admin = await dangNhapLayCookie('qa.v2.admin')
    for (const q of ['loai=khac', '', 'loai=game&gameType=poker', 'loai=hoc_tap&gameType=chess']) {
      const res = await goi(`/api/admin/thong-ke-sanh?${q}`, admin)
      expect(res.status).toBe(400)
      await res.body?.cancel()
    }
  })
})

describe('Thống kê sảnh — Game', () => {
  it('đếm ván 1v1 đã kết thúc + lượt chơi đơn; người chơi không trùng; bỏ lượt bị loại và ngoài 7 ngày', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const [a, b] = [await idCua('qa.v2.thu1'), await idCua('qa.v2.thu2')]
    const truoc = await layThongKe<ThongKeGame>(admin, 'loai=game')
    const now = Date.now()

    await chenVan('chess', a, b, now) // hôm nay: 1 ván, 2 người
    await chenVan('chess', a, null, now) // hôm nay: đấu máy, người a đã tính
    await chenVan('xiangqi', b, a, now - 3 * NGAY) // 3 ngày trước
    await chenVan('chess', a, b, now - 10 * NGAY) // ngoài 7 ngày
    await chenLuotDon('solo_snake', a, now) // hôm nay
    await chenLuotDon('solo_snake', b, now, 'rejected') // bị loại — không tính

    const sau = await layThongKe<ThongKeGame>(admin, 'loai=game')
    expect(sau.gameType).toBeNull()
    expect(sau.theoNgay).toHaveLength(7)
    expect(sau.homNay).toBe(studyDate(now))
    expect(sau.theoNgay.at(-1)!.ngay).toBe(sau.homNay)
    expect(sau.tongHomNay.van - truoc.tongHomNay.van).toBe(3)
    expect(sau.tong7Ngay.van - truoc.tong7Ngay.van).toBe(4)

    const tro = (t: ThongKeGame, g: string) => t.theoTroChoi.find((x) => x.gameType === g)!
    expect(sau.theoTroChoi.map((t) => t.gameType).sort()).toEqual(['caro_15', 'chess', 'solo_memory', 'solo_snake', 'xiangqi'])
    expect(tro(sau, 'chess').homNay.van - tro(truoc, 'chess').homNay.van).toBe(2)
    expect(tro(sau, 'xiangqi').bayNgay.van - tro(truoc, 'xiangqi').bayNgay.van).toBe(1)
    expect(tro(sau, 'xiangqi').homNay.van - tro(truoc, 'xiangqi').homNay.van).toBe(0)
    expect(tro(sau, 'solo_snake').homNay.van - tro(truoc, 'solo_snake').homNay.van).toBe(1)
    // Người chơi đếm không trùng: a và b đều đã chơi hôm nay.
    expect(sau.tongHomNay.nguoiChoi).toBeGreaterThanOrEqual(2)
    expect(tro(sau, 'solo_snake').homNay.nguoiChoi).toBeGreaterThanOrEqual(1)

    const chiCoVua = await layThongKe<ThongKeGame>(admin, 'loai=game&gameType=chess')
    expect(chiCoVua.gameType).toBe('chess')
    expect(chiCoVua.theoTroChoi.map((t) => t.gameType)).toEqual(['chess'])
    expect(chiCoVua.tongHomNay.van).toBe(tro(sau, 'chess').homNay.van)
  })
})

describe('Thống kê sảnh — Học tập', () => {
  it('người học theo ngày, theo lớp (sĩ số chỉ học sinh đang hoạt động), buổi học và phút học', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const hs = await idCua('qa.v2.thu3') // lớp 2
    const truoc = await layThongKe<ThongKeHocTap>(admin, 'loai=hoc_tap')
    const now = Date.now()
    const homNay = studyDate(now)

    await env.DB.prepare('INSERT OR IGNORE INTO study_activity_days (account_id, study_date, source_key, created_at) VALUES (?1, ?2, ?3, ?4)')
      .bind(hs, homNay, `tk-${now}`, now)
      .run()
    await env.DB.prepare('INSERT OR IGNORE INTO study_activity_days (account_id, study_date, source_key, created_at) VALUES (?1, ?2, ?3, ?4)')
      .bind(hs, studyDate(now - 2 * NGAY), `tk-${now}-2`, now)
      .run()
    const phong = await env.DB.prepare('SELECT id FROM phong LIMIT 1').first<{ id: number }>()
    if (phong) {
      await env.DB.prepare(
        `INSERT INTO hoc_session_summary (id, phong_id, started_at, ended_at, duration_seconds, summary_json) VALUES (?1, ?2, ?3, ?4, 1500, '{}')`,
      )
        .bind(`tk-buoi-${now}`, phong.id, now, now + 1500_000)
        .run()
    }

    const sau = await layThongKe<ThongKeHocTap>(admin, 'loai=hoc_tap')
    expect(sau.theoNgay).toHaveLength(7)
    expect(sau.homNay).toBe(homNay)
    const lop2 = (t: ThongKeHocTap) => t.theoLop.find((l) => l.lopId === 2)!
    expect(lop2(sau).ten).toBe('10A8 Thử nghiệm')
    expect(lop2(sau).siSo).toBe(1)
    expect(lop2(sau).hocHomNay).toBe(1)
    expect(lop2(sau).hoc7Ngay).toBe(1)
    expect(sau.tongHomNay.nguoiHoc).toBeGreaterThanOrEqual(1)
    expect(sau.tong7Ngay.nguoiHoc).toBeGreaterThanOrEqual(sau.tongHomNay.nguoiHoc)
    const ngayTruoc = sau.theoNgay.find((d) => d.ngay === studyDate(now - 2 * NGAY))!
    expect(ngayTruoc.nguoiHoc).toBeGreaterThanOrEqual(1)
    if (phong) {
      expect(sau.tongHomNay.buoiHoc - truoc.tongHomNay.buoiHoc).toBe(1)
      expect(sau.tongHomNay.phutHoc - truoc.tongHomNay.phutHoc).toBe(25)
    }
  })

  it('khung 7 ngày tính theo giờ trường: 0 giờ UTC+7 của ngày đầu', () => {
    // 2026-09-29 01:30 giờ VN = 2026-09-28 18:30 UTC → hôm nay theo trường là 29/9.
    const k = khungNgay(Date.parse('2026-09-28T18:30:00Z'))
    expect(k.homNay).toBe('2026-09-29')
    expect(k.cacNgay[0]).toBe('2026-09-23')
    expect(k.batDauMs).toBe(Date.parse('2026-09-22T17:00:00Z'))
    expect(k.batDauChuUtc).toBe('2026-09-22 17:00:00')
  })
})

describe('Giao diện sảnh — thống kê chỉ cho quản trị, người tham gia không thấy số', () => {
  it('thẻ trò chơi không còn nhãn thể loại và dải số; sảnh không còn chip số cho mọi người', () => {
    expect(gameCardRaw).not.toContain('1v1 & Đấu Máy')
    expect(gameCardRaw).not.toContain('Số người chơi')
    expect(gameCardRaw).not.toContain('stats')
    expect(sanhRaw).not.toContain('chiSo')
    expect(learningPageRaw).not.toContain('chiSo')
    expect(gameLobbyPageRaw).not.toContain('chiSo')
  })

  it('một mẫu thống kê chung cho Học tập, trang Game và sảnh từng trò; chỉ gọi khi là Quản trị trường', () => {
    expect(learningPageRaw).toContain('<ThongKeHocTap')
    expect(gameLobbyPageRaw).toContain('thongKe={<ThongKeGame gameType={gameType}')
    expect(gameLobbyViewRaw).toContain('<ThongKeGame ban={tables}')
    expect(hookRaw).toContain('Boolean(nguoiDung?.isSchoolAdmin)')
    expect(hookRaw).toContain('enabled: laQuanTri')
    expect(thongKeNhanhRaw).toContain('Chi tiết')
  })

  it('sảnh từng trò có nút quay lại ngay trên thanh công cụ; khung trống hoạt hình không viền', () => {
    expect(sanhRaw).toContain('data-testid={`${testId}-back`}')
    expect(sanhRaw.indexOf('${testId}-back')).toBeGreaterThan(sanhRaw.indexOf('${testId}-actions'))
    expect(gameLobbyPageRaw).toContain("quayLai={{ nhan: 'Tất cả trò chơi', toi: '/arena' }}")
    expect(sanhRaw).toContain('motion-safe:animate-troi-lo-lung')
    expect(gameLobbyPageRaw).toContain('variant="glyph"')
    expect(gameLobbyPageRaw).not.toContain('ring-1 ring-white/10">\n      <GameArt')
  })
})
