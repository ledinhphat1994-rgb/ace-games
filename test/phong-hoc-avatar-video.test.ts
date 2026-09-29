// Phòng học: ảnh đại diện thật trên dải người tham gia (RoomDO gửi kèm, lọc an toàn), cửa sổ nổi dễ kéo đổi cỡ,
// video lớp chính ôm đúng 16:9 (không còn dải đen hai bên).
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { avatarThanhVien, type ThanhVienPhong } from '../shared/protocol/room'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import stripRaw from '../src/features/study/workspace/MemberStrip.tsx?raw'
import khungRaw from '../src/features/study/workspace/KhungLop.tsx?raw'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'

async function chenPhong(ten: string): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Host', 'public', 20, 'mo') RETURNING id`,
  )
    .bind(ten)
    .first<{ id: number }>()
  return res!.id
}

const moPhong = (id: number, cookie: string, them: Record<string, string> = {}) =>
  exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC, ...them },
  }) as Promise<Response>

/** Gom mọi danh sách người tham gia nhận được — gắn ngay sau accept() để không lỡ gói nào. */
function ghiThanhVien(ws: WebSocket): ThanhVienPhong[][] {
  const ds: ThanhVienPhong[][] = []
  ws.addEventListener('message', (e) => {
    const g = JSON.parse(String(e.data)) as { type?: string; members?: ThanhVienPhong[] }
    if ((g.type === 'presence' || g.type === 'room.snapshot') && g.members) ds.push(g.members)
  })
  return ds
}

async function choThanhVien(ds: ThanhVienPhong[][], dieuKien: (d: ThanhVienPhong[]) => boolean): Promise<ThanhVienPhong[]> {
  for (let i = 0; i < 150; i++) {
    const cuoi = ds.at(-1)
    if (cuoi && dieuKien(cuoi)) return cuoi
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error('Không nhận được danh sách người tham gia mong đợi: ' + JSON.stringify(ds.at(-1)))
}

describe('Ảnh đại diện người tham gia', () => {
  it('lọc an toàn: chỉ đường dẫn ngắn của trường / ảnh có sẵn / https', () => {
    expect(avatarThanhVien('/api/files/avatars/acc5/a.webp')).toBe('/api/files/avatars/acc5/a.webp')
    expect(avatarThanhVien('/assets/avatars/cat.png')).toBe('/assets/avatars/cat.png')
    expect(avatarThanhVien('https://lh3.googleusercontent.com/a/xyz')).toBe('https://lh3.googleusercontent.com/a/xyz')
    for (const xau of ['data:image/png;base64,AAAA', 'http://x.test/a.png', 'javascript:alert(1)', '/api/files/a b', '/api/x"onerror=', '', null, 42, `/api/files/${'a'.repeat(500)}`]) {
      expect(avatarThanhVien(xau)).toBeNull()
    }
  })

  it('RoomDO gửi ảnh thật của tài khoản trong danh sách; header giả mạo từ trình duyệt bị bỏ', async () => {
    const id = await chenPhong('Phòng ảnh đại diện')
    await env.DB.prepare("UPDATE tai_khoan_campus SET avatar = '/assets/avatars/meo.png' WHERE ten_dang_nhap = 'qa.v2.thu1'").run()
    await env.DB.prepare('UPDATE tai_khoan_campus SET avatar = NULL WHERE ten_dang_nhap = ?1').bind('qa.v2.thu2').run()

    const r1 = await moPhong(id, await dangNhapLayCookie('qa.v2.thu1'))
    expect(r1.status).toBe(101)
    const ws1 = r1.webSocket!
    ws1.accept()
    const nhan = ghiThanhVien(ws1)
    // Người thứ hai tự gửi header ảnh giả: máy chủ xoá, dùng đúng dữ liệu D1 (không có ảnh).
    const r2 = await moPhong(id, await dangNhapLayCookie('qa.v2.thu2'), { 'X-Actor-Avatar': encodeURIComponent('https://evil.test/x.png') })
    expect(r2.status).toBe(101)
    const ws2 = r2.webSocket!
    ws2.accept()

    const ds = await choThanhVien(nhan, (d) => d.length === 2)
    expect(ds.find((m) => m.ten === 'QA Thử nghiệm 1')?.avatar).toBe('/assets/avatars/meo.png')
    expect(ds.find((m) => m.ten === 'QA Thử nghiệm 2')?.avatar ?? null).toBeNull()
    ws2.close(1000, 'xong')
    ws1.close(1000, 'xong')
    await env.DB.prepare("UPDATE tai_khoan_campus SET avatar = NULL WHERE ten_dang_nhap = 'qa.v2.thu1'").run()
  })

  it('dải người tham gia hiện ảnh thật (lỗi ảnh thì chữ cái đầu) và không cắt viền / góc', () => {
    expect(stripRaw).toContain('<AnhDaiDien key={m.avatar ?? \'\'} ten={m.ten} avatar={m.avatar} />')
    expect(stripRaw).toContain('onError={() => setLoi(true)}')
    expect(stripRaw).toContain('return <>{getInitials(ten)}</>')
    expect(stripRaw).toContain("px-3 py-2")
    expect(stripRaw).toContain('[&>li:first-child]:ml-auto [&>li:last-child]:mr-auto')
    expect(stripRaw).not.toMatch(/items-center justify-center gap-2 sm:gap-3 overflow-x-auto/)
  })
})

describe('Cửa sổ nổi dễ đổi cỡ', () => {
  it('khung ngoài không cắt tay kéo; tay kéo dày vắt qua mép, góc 28px có chữ L', () => {
    expect(khungRaw).toContain('<div className="absolute inset-0 overflow-hidden rounded-[inherit]">{children}</div>')
    expect(khungRaw).not.toContain('min-w-[180px] overflow-hidden rounded-xl')
    expect(khungRaw).toContain("{ huong: 'n', lop: '-top-2 inset-x-4 h-4 cursor-ns-resize'")
    expect(khungRaw).toContain('group/tay absolute z-50 size-7')
    for (const h of ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']) expect(khungRaw).toContain(`huong: '${h}'`)
  })
})

describe('Video lớp chính ôm đúng 16:9', () => {
  it('khung sân khấu co về 16:9 lớn nhất vừa chỗ (không dải đen, không quầng màu theo video); toàn màn hình giữ nguyên', () => {
    expect(stageRaw).toContain("const videoChinh = boCuc.video === 'main' && !isFullscreen && Boolean(mediaState?.videoId)")
    expect(stageRaw).toContain("videoChinh ? 'h-[min(100cqh,calc(100cqw*9/16))] w-[min(100cqw,calc(100cqh*16/9))]' : 'h-full w-full'")
    expect(stageRaw).toContain("isFullscreen ? 'contents' : 'relative flex h-full w-full items-center justify-center [container-type:size]'")
    expect(stageRaw).not.toContain('stage-quang-video')
    expect(stageRaw).not.toContain('blur-3xl')
  })
})
