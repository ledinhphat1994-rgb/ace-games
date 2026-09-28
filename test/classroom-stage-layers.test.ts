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
  cungBoCuc,
  goLop,
  hienLop,
  lamChinh,
  lopChinh,
  phuBangDeVe,
  theoBoCucTrinhChieu,
  thuNho,
  viTriCuaSo,
} from '../src/features/study/workspace/stage-layout'
import {
  diemHinh,
  diemKhungChuNhat,
  diemVongTron,
  tayXoaDuoc,
  doDayNet,
  netDuocCham,
  rutGonDiem,
  CAC_CO_VE,
} from '../src/features/study/workspace/cong-cu'
import workspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import khungRaw from '../src/features/study/workspace/KhungLop.tsx?raw'
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import videoRaw from '../src/features/study/workspace/EmbeddedVideoPlayer.tsx?raw'

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

  it('người tham gia chỉ xem: không ẩn / mở / phóng to / thu nhỏ / kéo / đổi cỡ khung, không tự thu phóng tài liệu', () => {
    // Khung: chỉ còn nút toàn màn hình trên máy mình.
    expect(stageRaw).toContain('chiXem={!canControl}')
    expect(khungRaw).toMatch(/if \(chiXem\) \{\s*return nutToanManHinh \?/)
    expect(khungRaw).toContain('data-testid={`layer-${id}-hide`}')
    // Cửa sổ nổi khoá kéo và điểm đổi cỡ.
    for (const id of ['doc', 'video', 'board']) expect(stageRaw).toContain(`<KhungLop id="${id}" vaiTro={boCuc.${id}} viTri={viTriCuaSo(boCuc, '${id}')} khoa={!canControl}>`)
    expect(khungRaw).toContain("if (khoa || vaiTro !== 'pip' || resizeRef.current) return")
    expect(khungRaw).toContain("{vaiTro === 'pip' && !khoa && (")
    // Nút mở lại bài giảng khi sân khấu trống chỉ dành cho người trình chiếu.
    expect(stageRaw).toContain('{canControl && (Boolean(slideState?.docUrl) || Boolean(mediaState?.videoId)) && (')
    expect(stageRaw).toContain('data-testid="stage-restore-doc-btn"')
    expect(docStageRaw).toContain('{!compact && !dungPptx && canControl && (')
    // Video: chỉ người trình chiếu điều khiển, kể cả khi phòng cũ đã tắt hostOnlyControl.
    expect(videoRaw).toContain('const effectiveCanControl = !isReconnecting && (isHost || canModerate) && canControlMedia')
  })
})

describe('Học sinh thấy đúng bố cục người trình chiếu', () => {
  it('theo bố cục giáo viên; lớp chưa có nội dung trên máy này thì bỏ ra và nâng lớp khác lên', () => {
    expect(theoBoCucTrinhChieu({ doc: 'main', video: 'pip', board: 'phu' }, true, true)).toEqual({ doc: 'main', video: 'pip', board: 'phu' })
    // Gói đồng bộ video chưa tới: bỏ lớp video, bảng đang phủ lên video thành lớp chính.
    expect(theoBoCucTrinhChieu({ video: 'main', board: 'phu' }, false, false)).toEqual({ board: 'main' })
    expect(theoBoCucTrinhChieu({ video: 'main', doc: 'pip' }, false, true)).toEqual({ doc: 'main' })
  })

  it('so sánh bố cục theo từng lớp', () => {
    expect(cungBoCuc({ doc: 'main', board: 'an' }, { board: 'an', doc: 'main' })).toBe(true)
    expect(cungBoCuc({ doc: 'main' }, { doc: 'main', video: 'an' })).toBe(false)
    expect(cungBoCuc({}, null)).toBe(false)
  })

  it('chọn bút: phủ bảng lên video / tài liệu nhúng; PDF, ảnh, .pptx vẽ lên trang nên giữ nguyên bố cục', () => {
    expect(phuBangDeVe({ video: 'main', board: 'pip' }, false)).toEqual({ video: 'main', board: 'phu' })
    expect(phuBangDeVe({ doc: 'main' }, false)).toEqual({ doc: 'main', board: 'phu' })
    const taiLieuVeDuoc = { doc: 'main', video: 'pip' } as const
    expect(phuBangDeVe(taiLieuVeDuoc, true)).toBe(taiLieuVeDuoc)
    expect(phuBangDeVe({ board: 'main' }, false)).toEqual({ board: 'main' })
  })

  it('giao diện nối bố cục máy chủ: người trình chiếu gửi, mọi người theo; lớp phủ thụ động chỉ dùng khi chưa có bố cục', () => {
    expect(workspaceRaw).toContain('onSendStageLayout(boCuc)')
    expect(workspaceRaw).toContain('setBoCuc(theoBoCucTrinhChieu(stageLayout, Boolean(videoId), Boolean(docUrl)))')
    expect(stageRaw).toContain('!canControl && !theoNguoiTrinhChieu && boCuc.board')
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

  it('hình: chữ nhật / tròn khép kín, tam giác đỉnh giữa cạnh trên, đường thẳng 2 điểm, mũi tên có đầu', () => {
    expect(diemHinh('chu_nhat', [0, 0], [10, 5])).toEqual(diemKhungChuNhat([0, 0], [10, 5]))
    expect(diemHinh('tron', [0, 0], [10, 10])).toEqual(diemVongTron([0, 0], [10, 10]))
    expect(diemHinh('tam_giac', [0, 0], [10, 8])).toEqual([[5, 0], [10, 8], [0, 8], [5, 0]])
    expect(diemHinh('thang', [1, 2], [3, 4])).toEqual([[1, 2], [3, 4]])
    const mui = diemHinh('mui_ten', [0, 0], [100, 0], 1, 20)
    expect(mui.slice(0, 2)).toEqual([[0, 0], [100, 0]])
    // Hai cạnh đầu mũi tên đối xứng qua thân, dài đúng giới hạn.
    expect(mui[2][0]).toBeCloseTo(mui[4][0])
    expect(mui[2][1]).toBeCloseTo(-mui[4][1])
    expect(Math.hypot(mui[2][0] - 100, mui[2][1])).toBeCloseTo(20)
  })

  it('tẩy chỉ xoá nét bút / dạ quang; chữ và hình giữ lại cho nút Xoá hết', () => {
    expect([undefined, 'pen', 'highlighter', 'text', 'shape'].map((tool) => tayXoaDuoc({ tool }))).toEqual([true, true, true, false, false])
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
  it('chỉ người trình chiếu vẽ được; máy chủ gắn người vẽ, giữ toạ độ v2 / chữ / hình; học sinh không tẩy được nét', async () => {
    const id = await chenPhong('Phòng bảng v2', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu2'))
    const snap = await host.cho('room.snapshot')
    await an.cho('room.snapshot')
    const epoch = snap.whiteboardEpoch ?? 1

    // Học sinh không vẽ được lên bảng (giao diện đã ẩn công cụ — máy chủ cũng chặn).
    an.gui({
      type: 'whiteboard.action',
      data: { action: 'stroke.add', stroke: { id: 'net-cua-an', points: [[1, 1], [2, 2]], color: '#fff', size: 4, epoch } },
    })
    await an.cho('error', (g) => g.message.includes('mới vẽ được lên bảng'))
    await host.khongNhan('whiteboard.sync', (g) => g.stroke?.id === 'net-cua-an', 200)

    // Giả mạo trường `by` → máy chủ ghi đè bằng khoá thật.
    host.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'chu-cua-thay', points: [[100, 100]], color: '#fff', size: 40, epoch, v: 2, tool: 'text', text: 'Bài 1', by: 'acc:2' },
      },
    })
    const netChu = await an.cho('whiteboard.sync', (g) => g.action === 'stroke.add' && g.stroke?.id === 'chu-cua-thay')
    expect(netChu.stroke).toMatchObject({ v: 2, tool: 'text', text: 'Bài 1', by: 'acc:1' })

    host.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'khung-cua-thay', points: diemKhungChuNhat([10, 10], [200, 120]), color: '#f00', size: 7, epoch, v: 2, tool: 'shape' },
      },
    })
    await an.cho('whiteboard.sync', (g) => g.action === 'stroke.add' && g.stroke?.id === 'khung-cua-thay')

    // Học sinh không tẩy được nét của thầy; thầy tẩy được.
    an.gui({ type: 'whiteboard.action', data: { action: 'stroke.remove', id: 'chu-cua-thay' } })
    await an.cho('error', (g) => g.message.includes('nét vẽ của mình'))
    await host.khongNhan('whiteboard.sync', (g) => g.action === 'stroke.remove', 200)
    host.gui({ type: 'whiteboard.action', data: { action: 'stroke.remove', id: 'chu-cua-thay' } })
    await an.cho('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId === 'chu-cua-thay')

    // Vào lại phòng: nét đã tẩy không còn, nét còn lại vẫn giữ.
    const vaoLai = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snapMoi = await vaoLai.cho('room.snapshot')
    expect(snapMoi.strokes.map((s) => s.id)).not.toContain('chu-cua-thay')
    expect(snapMoi.strokes.map((s) => s.id)).toContain('khung-cua-thay')
    host.dong()
    an.dong()
    vaoLai.dong()
  })

  it('bố cục sân khấu: chỉ người trình chiếu đổi được; gửi cho người khác và lưu cho người vào sau', async () => {
    const id = await chenPhong('Phòng bố cục', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu2'))
    const snap = await an.cho('room.snapshot')
    await host.cho('room.snapshot')
    expect(snap.stageLayout ?? null).toBeNull()

    host.gui({ type: 'stage.layout', layout: { doc: 'main', video: 'pip', board: 'phu' } })
    const dongBo = await an.cho('stage.sync')
    expect(dongBo.layout).toEqual({ doc: 'main', video: 'pip', board: 'phu' })
    // Người gửi không nhận lại bố cục của chính mình (tránh ghi đè thay đổi mới hơn trên máy mình).
    await host.khongNhan('stage.sync', () => true, 200)

    // Học sinh không đổi được bố cục của cả phòng.
    an.gui({ type: 'stage.layout', layout: { board: 'main' } })
    await an.cho('error', (g) => g.message.includes('bố cục trình chiếu'))
    await host.khongNhan('stage.sync', () => true, 200)

    // Vai trò lạ bị từ chối ngay ở lược đồ.
    host.gui({ type: 'stage.layout', layout: { doc: 'khong-hop-le' } } as never)
    await an.khongNhan('stage.sync', () => true, 200)

    const vaoSau = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snapSau = await vaoSau.cho('room.snapshot')
    expect(snapSau.stageLayout).toEqual({ doc: 'main', video: 'pip', board: 'phu' })
    host.dong()
    an.dong()
    vaoSau.dong()
  })

  it('người tham gia chỉ xem: không điều khiển video (kể cả khi đã tắt hostOnlyControl), không đụng hàng chờ', async () => {
    const id = await chenPhong('Phòng chỉ xem', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu2'))
    await host.cho('room.snapshot')
    await an.cho('room.snapshot')

    host.gui({ type: 'media.action', data: { action: 'set_host_only', enabled: false } })
    await an.cho('media.sync', (g) => g.state.hostOnlyControl === false)
    for (const data of [{ action: 'play' }, { action: 'seek', time: 30 }, { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'x' }] as const) {
      an.gui({ type: 'media.action', data })
      await an.cho('error', (g) => g.message.includes('quyền điều khiển video'))
    }
    await host.khongNhan('media.sync', (g) => g.state.status === 'playing' || g.state.time === 30 || g.state.videoId === 'dQw4w9WgXcQ', 200)

    an.gui({ type: 'queue.action', data: { action: 'add', videoId: 'dQw4w9WgXcQ', title: 'Bài hát' } })
    await an.cho('error', (g) => g.message.includes('danh sách video'))
    await host.khongNhan('queue.sync', () => true, 200)

    host.gui({ type: 'queue.action', data: { action: 'add', videoId: 'dQw4w9WgXcQ', title: 'Bài giảng' } })
    const hangCho = await an.cho('queue.sync', (g) => g.queue.length === 1)
    an.gui({ type: 'queue.action', data: { action: 'play', id: hangCho.queue[0].id } })
    await an.cho('error', (g) => g.message.includes('danh sách video'))
    host.dong()
    an.dong()
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
