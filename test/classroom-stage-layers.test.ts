// Sân khấu lớp học: Tài liệu / Bảng / Video chạy đồng thời như các lớp, công cụ vẽ chung,
// và bảng vẽ v2 (toạ độ logic, người vẽ do máy chủ gắn, tẩy từng nét có kiểm quyền).
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong } from '../shared/protocol/room'
import {
  anLop,
  bamLop,
  batTatBangPhu,
  boCucBanDau,
  goLop,
  hienLop,
  lamChinh,
  lopChinh,
  thuNho,
  viTriCuaSo,
} from '../src/features/study/workspace/stage-layout'
import {
  diemKhungChuNhat,
  diemVongTron,
  doDayNet,
  netDuocCham,
  rutGonDiem,
  CAC_CO_VE,
} from '../src/features/study/workspace/cong-cu'
import workspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import khungRaw from '../src/features/study/workspace/KhungLop.tsx?raw'

describe('Bố cục lớp: ba lớp chạy đồng thời', () => {
  it('vào phòng: video đang phát làm lớp chính, tài liệu thành cửa sổ nổi', () => {
    expect(boCucBanDau('video', true, true)).toEqual({ video: 'main', doc: 'pip' })
    expect(boCucBanDau('document', false, true)).toEqual({ doc: 'main' })
    expect(boCucBanDau('idle', false, false)).toEqual({})
  })

  it('bấm Bảng khi đang xem tài liệu: bảng to, tài liệu vẫn chạy trong cửa sổ nổi; bấm lại thì ẩn bảng, tài liệu to lại', () => {
    let bc = bamLop({ doc: 'main' }, 'board')
    expect(bc).toEqual({ doc: 'pip', board: 'main' })
    bc = bamLop(bc, 'board')
    expect(bc).toEqual({ doc: 'main', board: 'an' })
  })

  it('phóng to cửa sổ nổi thì đổi chỗ với lớp chính', () => {
    expect(lamChinh({ board: 'main', video: 'pip' }, 'video')).toEqual({ board: 'pip', video: 'main' })
  })

  it('thu nhỏ lớp chính: lớp đang nổi được nâng lên; không còn lớp nào thì chỉ thu nhỏ', () => {
    expect(thuNho({ video: 'main', doc: 'pip' }, 'video')).toEqual({ video: 'pip', doc: 'main' })
    expect(thuNho({ video: 'main' }, 'video')).toEqual({ video: 'pip' })
  })

  it('ẩn lớp chính: nâng cửa sổ nổi; chỉ còn bảng đang phủ thì bảng thành lớp chính', () => {
    expect(anLop({ video: 'main', doc: 'pip' }, 'video')).toEqual({ video: 'an', doc: 'main' })
    expect(anLop({ video: 'main', board: 'phu' }, 'video')).toEqual({ video: 'an', board: 'main' })
  })

  it('bảng phủ trong suốt lên video / tài liệu; không phủ được khi chính bảng đang là lớp chính', () => {
    const phu = batTatBangPhu({ video: 'main', board: 'pip' })
    expect(phu).toEqual({ video: 'main', board: 'phu' })
    expect(batTatBangPhu(phu)).toEqual({ video: 'main', board: 'pip' })
    expect(batTatBangPhu({ board: 'main' })).toEqual({ board: 'main' })
    // Đổi lớp chính trong lúc bảng đang phủ: bảng vẫn phủ lên lớp chính mới.
    expect(lamChinh({ video: 'main', doc: 'pip', board: 'phu' }, 'doc')).toEqual({ video: 'pip', doc: 'main', board: 'phu' })
  })

  it('nội dung mới từ giáo viên hiện lên mà không giành lớp chính; nội dung kết thúc thì gỡ lớp', () => {
    expect(hienLop({ board: 'main' }, 'video')).toEqual({ board: 'main', video: 'pip' })
    expect(hienLop({}, 'doc')).toEqual({ doc: 'main' })
    expect(hienLop({ video: 'an', board: 'main' }, 'video')).toEqual({ video: 'pip', board: 'main' })
    expect(goLop({ doc: 'main', video: 'pip' }, 'doc')).toEqual({ video: 'main' })
    expect(lopChinh(goLop({ doc: 'main' }, 'doc'))).toBeNull()
  })

  it('mỗi cửa sổ nổi một góc riêng', () => {
    const bc = { board: 'main', doc: 'pip', video: 'pip' } as const
    expect(viTriCuaSo(bc, 'doc')).toBe(0)
    expect(viTriCuaSo(bc, 'video')).toBe(1)
  })

  it('đổi vai trò chỉ đổi class (lớp giữ nguyên chỗ trong cây) — video không bị tải lại', () => {
    expect(stageRaw).toContain('{boCuc.video && (')
    expect(stageRaw).toContain('<KhungLop id="video" vaiTro={boCuc.video}')
    // Lớp ẩn vẫn gắn trong trang (đẩy ra ngoài màn hình), không bị gỡ.
    expect(khungRaw).toContain("'pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0'")
    expect(workspaceRaw).not.toContain("setMode('video')")
  })

  it('người tham gia không có nút ẩn khung và có nút khôi phục bài giảng khi sân khấu trống', () => {
    expect(stageRaw).toContain('choPhepAn={canControl}')
    expect(khungRaw).toContain('{choPhepAn && (')
    expect(khungRaw).toContain('data-testid={`layer-${id}-hide`}')
    expect(stageRaw).toContain('data-testid="stage-restore-doc-btn"')
    expect(stageRaw).toContain('data-testid="stage-restore-video-btn"')
  })
})

describe('Công cụ vẽ chung', () => {
  it('rút gọn nét dài về đúng giới hạn máy chủ, giữ điểm đầu và cuối', () => {
    const dai: [number, number][] = Array.from({ length: 900 }, (_, i) => [i, i * 2])
    const gon = rutGonDiem(dai, 200)
    expect(gon).toHaveLength(200)
    expect(gon[0]).toEqual([0, 0])
    expect(gon[199]).toEqual([899, 1798])
  })

  it('khung chữ nhật và vòng tròn là đường khép kín', () => {
    const khung = diemKhungChuNhat([10, 10], [110, 60])
    expect(khung[0]).toEqual(khung[khung.length - 1])
    const tron = diemVongTron([0, 0], [100, 100])
    expect(tron[0][0]).toBeCloseTo(tron[tron.length - 1][0])
    expect(tron[0][1]).toBeCloseTo(tron[tron.length - 1][1])
  })

  it('mọi cỡ nét / cỡ chữ nằm trong giới hạn máy chủ (bảng ≤ 100, trang ≤ 50)', () => {
    for (const co of CAC_CO_VE) {
      for (const cc of ['but', 'to_sang', 'chu', 'khung'] as const) {
        expect(doDayNet('bang', cc, co)).toBeLessThanOrEqual(100)
        expect(doDayNet('trang', cc, co)).toBeLessThanOrEqual(50)
      }
    }
  })

  it('tẩy chạm đúng nét trên cùng, kể cả chữ', () => {
    const cacNet = [
      { id: 'duoi', points: [[0, 0], [100, 0]] as [number, number][] },
      { id: 'tren', points: [[0, 0], [100, 0]] as [number, number][] },
      { id: 'chu', points: [[300, 300]] as [number, number][], tool: 'text', text: 'Xin chào', size: 40 },
    ]
    expect(netDuocCham([50, 3], cacNet, 5)?.id).toBe('tren')
    expect(netDuocCham([320, 320], cacNet, 5)?.id).toBe('chu')
    expect(netDuocCham([50, 50], cacNet, 5)).toBeNull()
  })
})

async function chenPhong(ten: string, chuPhongKhoa: string): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, chuPhongKhoa)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

describe('Bảng vẽ v2 trên RoomDO', () => {
  it('máy chủ gắn người vẽ, giữ toạ độ v2 / chữ / hình; chỉ người vẽ hoặc chủ phòng tẩy được nét', async () => {
    const id = await chenPhong('Phòng bảng v2', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu2'))
    const binh = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snap = await an.cho('room.snapshot')
    await host.cho('room.snapshot')
    await binh.cho('room.snapshot')
    const epoch = snap.whiteboardEpoch ?? 1

    // Người vẽ giả mạo trường `by` → máy chủ ghi đè bằng khoá thật.
    an.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'chu-cua-an', points: [[100, 100]], color: '#fff', size: 40, epoch, v: 2, tool: 'text', text: 'Bài 1', by: 'acc:1' },
      },
    })
    const netChu = await host.cho('whiteboard.sync', (g) => g.action === 'stroke.add' && g.stroke?.id === 'chu-cua-an')
    expect(netChu.stroke).toMatchObject({ v: 2, tool: 'text', text: 'Bài 1', by: 'acc:2' })

    an.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'khung-cua-an', points: diemKhungChuNhat([10, 10], [200, 120]), color: '#f00', size: 7, epoch, v: 2, tool: 'shape' },
      },
    })
    await host.cho('whiteboard.sync', (g) => g.action === 'stroke.add' && g.stroke?.id === 'khung-cua-an')

    // Bình không tẩy được nét của An.
    binh.gui({ type: 'whiteboard.action', data: { action: 'stroke.remove', id: 'chu-cua-an' } })
    await binh.cho('error', (g) => g.message.includes('nét vẽ của mình'))
    await host.khongNhan('whiteboard.sync', (g) => g.action === 'stroke.remove', 200)

    // An tẩy được nét của mình; chủ phòng tẩy được nét của người khác.
    an.gui({ type: 'whiteboard.action', data: { action: 'stroke.remove', id: 'chu-cua-an' } })
    await binh.cho('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId === 'chu-cua-an')
    host.gui({ type: 'whiteboard.action', data: { action: 'stroke.remove', id: 'khung-cua-an' } })
    await binh.cho('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId === 'khung-cua-an')

    // Vào lại phòng: hai nét đã tẩy không còn trong ảnh chụp.
    const vaoLai = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snapMoi = await vaoLai.cho('room.snapshot')
    expect(snapMoi.strokes.map((s) => s.id)).not.toContain('chu-cua-an')
    expect(snapMoi.strokes.map((s) => s.id)).not.toContain('khung-cua-an')
    host.dong()
    an.dong()
    binh.dong()
    vaoLai.dong()
  })

  it('chú thích chữ trên tài liệu được lưu kèm nội dung chữ', async () => {
    const id = await chenPhong('Phòng chú thích chữ', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    await host.cho('room.snapshot')
    host.gui({
      type: 'slide.action',
      data: {
        action: 'annotation_add',
        stroke: { id: 'ghi-chu-1', page: 1, tool: 'text', points: [[0.2, 0.3]], color: '#ef4444', size: 26, text: 'Công thức' },
      },
    })
    const goi = await host.cho('slide.annotation', (g) => g.action === 'add' && g.stroke?.id === 'ghi-chu-1')
    expect(goi.stroke).toMatchObject({ tool: 'text', text: 'Công thức' })
    host.dong()
  })
})
