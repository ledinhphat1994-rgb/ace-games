// Sân khấu lớp học: Tài liệu / Bảng / Video chạy đồng thời như các lớp, công cụ vẽ chung,
// và bảng vẽ v2 (toạ độ logic, người vẽ do máy chủ gắn, tẩy từng nét có kiểm quyền).
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong } from '../shared/protocol/room'
import {
  anLop,
  bamLop,
  boCucBanDau,
  cungBoCuc,
  datKhung,
  kepKhung,
  goLop,
  hienLop,
  lamChinh,
  lopChinh,
  theoBoCucTrinhChieu,
  thuNho,
  viTriCuaSo,
} from '../src/features/study/workspace/stage-layout'
import {
  diemHinh,
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
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import videoRaw from '../src/features/study/workspace/EmbeddedVideoPlayer.tsx?raw'
import dockRaw from '../src/features/study/workspace/ClassroomToolDock.tsx?raw'
import bangVeRaw from '../src/features/study/workspace/BangVe.tsx?raw'
import topBarRaw from '../src/features/study/workspace/ClassroomTopBar.tsx?raw'

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
    expect(bc).toEqual({ doc: 'main', board: 'an', truocKhiAn: { board: 'main' } })
  })

  it('ẩn rồi bật lại ở thanh dưới: về đúng vai trò cũ, cửa sổ nổi giữ nguyên chỗ / cỡ — không tự phóng to', () => {
    const khung = { x: 0.6, y: 0.1, w: 0.3, h: 0.3 }
    // Video đang là cửa sổ nổi: ẩn → bật lại vẫn là cửa sổ nổi, cùng khung.
    let bc = bamLop({ doc: 'main', video: 'pip', khung: { video: khung } }, 'video')
    expect(bc.video).toBe('an')
    bc = bamLop(bc, 'video')
    expect(bc.video).toBe('pip')
    expect(bc.doc).toBe('main')
    expect(bc.khung?.video).toEqual(khung)
    // Video đang là lớp chính: ẩn → tài liệu lên thay; bật lại → video làm chính, tài liệu về cửa sổ nổi như trước.
    let bc2 = bamLop({ video: 'main', doc: 'pip' }, 'video')
    expect(bc2).toMatchObject({ video: 'an', doc: 'main' })
    bc2 = bamLop(bc2, 'video')
    expect(bc2).toMatchObject({ video: 'main', doc: 'pip' })
    // Cửa sổ nổi nhưng không còn lớp chính nào: bật lại thành lớp chính (không để sân khấu trống).
    expect(bamLop({ video: 'an', truocKhiAn: { video: 'pip' } }, 'video').video).toBe('main')
    // Học sinh theo bố cục giáo viên nhận luôn vai trò trước khi ẩn.
    expect(theoBoCucTrinhChieu({ doc: 'main', video: 'an', truocKhiAn: { video: 'pip' } }, true, true).truocKhiAn).toEqual({ video: 'pip' })
  })

  it('phóng to cửa sổ nổi thì đổi chỗ với lớp chính', () => {
    expect(lamChinh({ board: 'main', video: 'pip' }, 'video')).toEqual({ board: 'pip', video: 'main' })
  })

  it('thu nhỏ lớp chính: lớp đang nổi được nâng lên; không còn lớp nào thì chỉ thu nhỏ', () => {
    expect(thuNho({ video: 'main', doc: 'pip' }, 'video')).toEqual({ video: 'pip', doc: 'main' })
    expect(thuNho({ video: 'main' }, 'video')).toEqual({ video: 'pip' })
  })

  it('ẩn lớp chính: nâng cửa sổ nổi lên làm chính', () => {
    expect(anLop({ video: 'main', doc: 'pip' }, 'video')).toEqual({ video: 'an', doc: 'main', truocKhiAn: { video: 'main' } })
    expect(anLop({ video: 'main', board: 'pip' }, 'video')).toEqual({ video: 'an', board: 'main', truocKhiAn: { video: 'main' } })
  })

  it('đã bỏ chức năng phủ Bảng: không còn nút phủ, không còn nhánh vẽ bảng phủ', () => {
    expect(khungRaw).not.toContain('layer-${id}-overlay')
    expect(stageRaw).not.toContain("boCuc.board === 'phu'")
    expect(workspaceRaw).not.toContain('batTatBangPhu')
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

  it('phát / dừng / xem lại video không đổi bố cục; chỉ video mới mới hiện lớp (giữ chỗ nếu đang hiện)', () => {
    expect(workspaceRaw).toContain("setBoCuc((bc) => (videoId ? hienLop(bc, 'video') : goLop(bc, 'video')))")
    expect(workspaceRaw).toContain('  }, [videoId])')
    expect(workspaceRaw).not.toContain("videoDangPhat ? lamChinh(bc, 'video')")
    // Video đang là cửa sổ nổi, bấm phát / xem lại: vẫn là cửa sổ nổi, cùng khung.
    const bc = datKhung({ doc: 'main', video: 'pip' }, 'video', { x: 0.55, y: 0.05, w: 0.33, h: 0.4 })
    expect(hienLop(bc, 'video')).toBe(bc)
  })

  it('đổi vai trò chỉ đổi class (lớp giữ nguyên chỗ trong cây) — video không bị tải lại', () => {
    expect(stageRaw).toContain('{boCuc.video && (')
    expect(stageRaw).toContain('<KhungLop id="video" vaiTro={boCuc.video}')
    // Lớp ẩn vẫn gắn trong trang (đẩy ra ngoài màn hình), không bị gỡ.
    expect(khungRaw).toContain("'pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0'")
    expect(workspaceRaw).not.toContain("setMode('video')")
  })

  it('toàn màn hình: thanh công cụ tự thu xuống, nút nhỏ ở đáy hiện lại khi rê / chạm; đang mở khay thì giữ nguyên', () => {
    expect(workspaceRaw).toContain('if (isFullscreen) henThuGon(2000)')
    expect(workspaceRaw).toContain('const anDock = isFullscreen && dockThuGon && !khayDockMo')
    expect(workspaceRaw).toContain('data-testid="dock-handle"')
    expect(workspaceRaw).toContain("anDock ? 'translate-y-[calc(100%+0.5rem)] opacity-0' : 'pointer-events-auto'")
    // Lớp bọc không chặn thao tác trên sân khấu khi thanh đã thu xuống.
    expect(workspaceRaw).toContain("'pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex justify-center'")
    expect(dockRaw).toContain('onKhayMo?.(moBut || moCongCu || moAmThanh)')
  })

  it('mic + cài đặt âm thanh nằm ở thanh công cụ dưới (mọi người), không còn ở thanh trên', () => {
    expect(dockRaw).toContain('data-testid="dock-btn-mic"')
    expect(dockRaw).toContain("aria-label={myMic ? 'Tắt micro' : 'Bật micro'}")
    expect(dockRaw).toContain('id="voice-in-select"')
    expect(topBarRaw).not.toContain('onToggleMic')
    // Cụm mic đứng trước khối chỉ dành cho người trình chiếu → học sinh cũng có.
    expect(dockRaw.indexOf('data-testid="dock-btn-mic"')).toBeLessThan(dockRaw.indexOf('{canControl && ('))
  })

  it('video là cửa sổ nhỏ vẫn có thanh âm lượng', () => {
    expect(videoRaw).not.toContain("gap-1.5 ml-2 ${compact ? 'hidden' : 'flex'}")
    expect(videoRaw).toContain("${compact ? 'w-12' : 'w-16'} h-1 rounded-lg")
  })

  it('người tham gia chỉ xem: không ẩn / mở / phóng to / thu nhỏ / toàn màn hình / kéo / đổi cỡ khung, không tự thu phóng tài liệu', () => {
    // Khung: không còn nút điều khiển nào.
    expect(stageRaw).toContain('chiXem={!canControl}')
    expect(khungRaw).toContain('if (chiXem) return null')
    expect(khungRaw).toContain('data-testid={`layer-${id}-hide`}')
    // Cửa sổ nổi khoá kéo và điểm đổi cỡ.
    for (const id of ['doc', 'video', 'board']) expect(stageRaw).toContain(`<KhungLop id="${id}" vaiTro={boCuc.${id}} viTri={viTriCuaSo(boCuc, '${id}')} khoa={!canControl} {...khungCuaSo('${id}')}>`)
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
    expect(theoBoCucTrinhChieu({ doc: 'main', video: 'pip', board: 'pip' }, true, true)).toEqual({ doc: 'main', video: 'pip', board: 'pip' })
    // Bố cục cũ còn bảng phủ ('phu', đã bỏ) → đọc thành cửa sổ nổi.
    expect(theoBoCucTrinhChieu({ doc: 'main', board: 'phu' }, false, true)).toEqual({ doc: 'main', board: 'pip' })
    // Gói đồng bộ video chưa tới: bỏ lớp video, cửa sổ nổi còn lại thành lớp chính.
    expect(theoBoCucTrinhChieu({ video: 'main', board: 'phu' }, false, false)).toEqual({ board: 'main' })
    expect(theoBoCucTrinhChieu({ video: 'main', doc: 'pip' }, false, true)).toEqual({ doc: 'main' })
  })

  it('cửa sổ nổi: giáo viên kéo / đổi cỡ → khung theo tỉ lệ sân khấu, kẹp trong sân khấu, học sinh nhận nguyên khung', () => {
    expect(kepKhung({ x: 0.9, y: -0.2, w: 0.5, h: 1.4 })).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 })
    expect(kepKhung({ x: 0.1, y: 0.1, w: 0.01, h: 0.3333333 })).toEqual({ x: 0.1, y: 0.1, w: 0.1, h: 0.3333 })
    const bc = datKhung({ video: 'main', doc: 'pip' }, 'doc', { x: 0.01, y: 0.02, w: 0.45, h: 0.6 })
    expect(bc).toEqual({ video: 'main', doc: 'pip', khung: { doc: { x: 0.01, y: 0.02, w: 0.45, h: 0.6 } } })
    expect(theoBoCucTrinhChieu(bc, true, true)).toEqual(bc)
    // Chỉ dời cửa sổ cũng là đổi bố cục → người trình chiếu gửi lại.
    expect(cungBoCuc(datKhung(bc, 'doc', { x: 0.3, y: 0.02, w: 0.45, h: 0.6 }), bc)).toBe(false)
    expect(cungBoCuc({ ...bc }, bc)).toBe(true)
    // Trong lúc kéo: gửi khung tạm cho cả phòng (có giới hạn nhịp); thả chuột mới ghi vào bố cục của giáo viên.
    expect(workspaceRaw).toContain('onKeoKhung={laNguoiTrinhChieu && daNhanAnhChup ? guiKhungTam : undefined}')
    expect(workspaceRaw).toContain('const conCho = 80 - (Date.now() - t.lanCuoi)')
    expect(khungRaw).toContain('onKeoKhung(khungTuHop(keo.hop,')
    // Người xem: cửa sổ trượt mượt theo các gói khung liên tiếp.
    expect(khungRaw).toContain("khoa && khung ? 'transition-[left,top,width,height] duration-100 ease-linear' : ''")
  })

  it('so sánh bố cục theo từng lớp', () => {
    expect(cungBoCuc({ doc: 'main', board: 'an' }, { board: 'an', doc: 'main' })).toBe(true)
    expect(cungBoCuc({ doc: 'main' }, { doc: 'main', video: 'an' })).toBe(false)
    expect(cungBoCuc({}, null)).toBe(false)
  })

  it('bảng độc lập; video và tài liệu nhúng mỗi thứ một lớp vẽ tàng hình riêng; chọn bút không đổi bố cục', () => {
    // Mỗi mặt vẽ chỉ thấy / tẩy nét của chính nó và gắn mặt của mình vào nét gửi đi.
    expect(bangVeRaw).toContain('const netCuaMat = strokes.filter((s) => s.mat === mat)')
    expect(bangVeRaw).toContain('const coTheTay = netCuaMat.filter(')
    expect(bangVeRaw).toContain('...(mat ? { mat } : {}),')
    // Lớp vẽ nằm trong khung video / tài liệu nên đi theo khung (di chuyển, phóng to, ẩn).
    expect(stageRaw).toContain("lopVe={bangVe(true, 'video')}")
    expect(stageRaw).toContain("lopVeNhung={bangVe(true, 'tailieu')}")
    expect(stageRaw).not.toContain('whiteboard-passive-overlay')
    expect(workspaceRaw).not.toContain('phuBangDeVe')
    expect(workspaceRaw).toMatch(/onChonCongCu=\{\(c\) => \{\s*if \(!laNguoiTrinhChieu && c !== 'chuot'\) return\s*setCongCu\(c\)\s*\}\}/)
  })

  it('giao diện nối bố cục máy chủ: người trình chiếu gửi, mọi người theo', () => {
    expect(workspaceRaw).toContain('onSendStageLayout(boCuc)')
    expect(workspaceRaw).toContain('setBoCuc(theoBoCucTrinhChieu(stageLayout, Boolean(videoId), Boolean(docUrl)))')
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

  it('tẩy chạm đúng nét trên cùng, kể cả chữ và hình (chạm vào đường viền)', () => {
    const cacNet = [
      { id: 'duoi', points: [[0, 0], [100, 0]] as [number, number][] },
      { id: 'tren', points: [[0, 0], [100, 0]] as [number, number][] },
      { id: 'chu', points: [[300, 300]] as [number, number][], tool: 'text', text: 'Xin chào', size: 40 },
      { id: 'tam-giac', points: diemHinh('tam_giac', [500, 500], [700, 700]), tool: 'shape' },
    ]
    expect(netDuocCham([50, 3], cacNet, 5)?.id).toBe('tren')
    expect(netDuocCham([320, 320], cacNet, 5)?.id).toBe('chu')
    expect(netDuocCham([600, 702], cacNet, 5)?.id).toBe('tam-giac')
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

    host.gui({ type: 'stage.layout', layout: { doc: 'main', video: 'pip', board: 'phu', khung: { video: { x: 0.02, y: 0.03, w: 0.5, h: 0.45 } }, truocKhiAn: { board: 'pip' } } })
    const dongBo = await an.cho('stage.sync')
    expect(dongBo.layout).toEqual({ doc: 'main', video: 'pip', board: 'phu', khung: { video: { x: 0.02, y: 0.03, w: 0.5, h: 0.45 } }, truocKhiAn: { board: 'pip' } })
    // Người gửi không nhận lại bố cục của chính mình (tránh ghi đè thay đổi mới hơn trên máy mình).
    await host.khongNhan('stage.sync', () => true, 200)

    // Học sinh không đổi được bố cục của cả phòng.
    an.gui({ type: 'stage.layout', layout: { board: 'main' } })
    await an.cho('error', (g) => g.message.includes('bố cục trình chiếu'))
    await host.khongNhan('stage.sync', () => true, 200)

    // Vai trò lạ bị từ chối ngay ở lược đồ.
    host.gui({ type: 'stage.layout', layout: { doc: 'khong-hop-le' } } as never)
    await an.khongNhan('stage.sync', () => true, 200)
    // Khung vượt ra ngoài sân khấu cũng bị từ chối.
    host.gui({ type: 'stage.layout', layout: { doc: 'main', khung: { doc: { x: 0, y: 0, w: 2, h: 0.5 } } } })
    await an.khongNhan('stage.sync', () => true, 200)

    const vaoSau = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snapSau = await vaoSau.cho('room.snapshot')
    expect(snapSau.stageLayout).toEqual({ doc: 'main', video: 'pip', board: 'phu', khung: { video: { x: 0.02, y: 0.03, w: 0.5, h: 0.45 } }, truocKhiAn: { board: 'pip' } })
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

  it('lớp vẽ riêng: nét trên video / tài liệu nhúng mang mặt vẽ; đổi video / tài liệu chỉ xoá nét của lớp đó, bảng giữ nguyên', async () => {
    const id = await chenPhong('Phòng lớp vẽ riêng', 'acc:1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu2'))
    const snap = await host.cho('room.snapshot')
    await an.cho('room.snapshot')
    const epoch = snap.whiteboardEpoch ?? 1
    const net = (idNet: string, mat?: 'video' | 'tailieu') => ({
      type: 'whiteboard.action' as const,
      data: { action: 'stroke.add' as const, stroke: { id: idNet, points: [[1, 1], [9, 9]] as [number, number][], color: '#f00', size: 4, epoch, v: 2 as const, tool: 'pen' as const, ...(mat ? { mat } : {}) } },
    })

    host.gui({ type: 'media.action', data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Video 1' } })
    await an.cho('media.sync', (g) => g.state.videoId === 'dQw4w9WgXcQ')
    host.gui(net('tren-bang'))
    host.gui(net('tren-video', 'video'))
    host.gui(net('tren-tai-lieu', 'tailieu'))
    const netVideo = await an.cho('whiteboard.sync', (g) => g.stroke?.id === 'tren-video')
    expect(netVideo.stroke?.mat).toBe('video')
    await an.cho('whiteboard.sync', (g) => g.stroke?.id === 'tren-tai-lieu')

    // Cùng video (tải lại) không xoá; video mới thì xoá nét trên video, giữ bảng và tài liệu.
    host.gui({ type: 'media.action', data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Video 1' } })
    await an.khongNhan('whiteboard.sync', (g) => g.action === 'stroke.remove', 200)
    host.gui({ type: 'media.action', data: { action: 'load', videoId: 'M7lc1UVf-VE', title: 'Video 2' } })
    await an.cho('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId === 'tren-video')
    await an.khongNhan('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId !== 'tren-video', 200)

    // Mở tài liệu mới: xoá nét trên lớp tài liệu nhúng.
    host.gui({ type: 'slide.action', data: { action: 'load_doc', docUrl: '/api/files/tai-lieu.pdf', docName: 'x.pdf', fileType: 'pdf', totalPages: 2 } })
    await an.cho('whiteboard.sync', (g) => g.action === 'stroke.remove' && g.strokeId === 'tren-tai-lieu')

    const vaoSau = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, await dangNhapLayCookie('qa.v2.thu3'))
    const snapSau = await vaoSau.cho('room.snapshot')
    expect(snapSau.strokes.map((s) => s.id)).toEqual(['tren-bang'])
    host.dong()
    an.dong()
    vaoSau.dong()
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
