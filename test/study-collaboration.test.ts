import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { dangNhapLayCookie, moKetNoi } from './ws'

/** Chèn phòng học loại 'video' vào D1, trả về id */
async function chenPhong(
  ten: string,
  chuPhongKhoa = 'acc:1',
): Promise<number> {
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

describe('Study Collaboration Subsystems Server Authority & Convergence', () => {
  // ── 1. Whiteboard Epoch & Stale Stroke Rejection ──────────────────────────
  it('Whiteboard: stale epoch strokes are rejected after clear board', async () => {
    const roomId = await chenPhong('Phòng Whiteboard Epoch')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    const snapA = await host.cho('room.snapshot')
    await member.cho('room.snapshot')
    expect(snapA.whiteboardEpoch).toBe(1)

    // Host draws stroke with epoch 1
    host.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'st_1', points: [[10, 10], [20, 20]], color: '#FFFFFF', size: 4, epoch: 1 },
      },
    })
    const gAdd1 = await member.cho('whiteboard.sync', (g) => g.action === 'stroke.add')
    expect(gAdd1.stroke?.id).toBe('st_1')
    expect(gAdd1.stroke?.epoch).toBe(1)

    // Host clears board -> server increments epoch to 2
    host.gui({
      type: 'whiteboard.action',
      data: { action: 'stroke.clear' },
    })
    const gClear = await member.cho('whiteboard.sync', (g) => g.action === 'stroke.clear')
    expect(gClear.epoch).toBe(2)

    // Member sends in-flight stroke with stale epoch 1 -> server drops it
    member.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'st_zombie', points: [[30, 30]], color: '#FF0000', size: 4, epoch: 1 },
      },
    })
    // Host should NOT receive any stroke with id 'st_zombie'
    await host.khongNhan('whiteboard.sync', (g) => g.stroke?.id === 'st_zombie', 400)

    // Member sends stroke with current epoch 2 -> accepted
    member.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'st_valid_2', points: [[40, 40]], color: '#00FF00', size: 4, epoch: 2 },
      },
    })
    const gAdd2 = await host.cho('whiteboard.sync', (g) => g.stroke?.id === 'st_valid_2')
    expect(gAdd2.stroke?.id).toBe('st_valid_2')

    host.dong()
    member.dong()
  })

  // ── 2. Shared Notes Optimistic Concurrency & Conflict Protection ──────────
  it('Shared Notes: optimistic concurrency detects conflicts and rejects stale baseRevision', async () => {
    const roomId = await chenPhong('Phòng Notes OCC')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    const snap = await host.cho('room.snapshot')
    await member.cho('room.snapshot')
    expect(snap.notes.revision).toBe(1)

    // Host opens notes editing to members (disables hostOnlyControl)
    host.gui({
      type: 'media.action',
      data: { action: 'set_host_only', enabled: false },
    })
    await member.cho('media.sync', (g) => !g.state.hostOnlyControl)

    // Host updates notes from rev 1 -> rev 2
    host.gui({
      type: 'notes.action',
      data: { action: 'update', content: 'Host update rev 2', baseRevision: 1 },
    })
    const gSync1 = await member.cho('notes.sync', (g) => g.notes.revision === 2)
    expect(gSync1.notes.content).toBe('Host update rev 2')

    // Member attempts concurrent update with stale baseRevision: 1
    member.gui({
      type: 'notes.action',
      data: { action: 'update', content: 'Conflicting member edit', baseRevision: 1 },
    })

    // Member receives notes.conflict packet with current server state and rejected content
    const gConflict = await member.cho('notes.conflict')
    expect(gConflict.currentNotes.revision).toBe(2)
    expect(gConflict.currentNotes.content).toBe('Host update rev 2')
    expect(gConflict.rejectedContent).toBe('Conflicting member edit')

    // Host never receives the conflicting update
    await host.khongNhan('notes.sync', (g) => g.notes.content === 'Conflicting member edit', 300)

    // Member resolves and sends with updated baseRevision: 2
    member.gui({
      type: 'notes.action',
      data: { action: 'update', content: 'Resolved edit', baseRevision: 2 },
    })
    const gSync2 = await host.cho('notes.sync', (g) => g.notes.revision === 3)
    expect(gSync2.notes.content).toBe('Resolved edit')
    expect(gSync2.notes.revision).toBe(3)

    host.dong()
    member.dong()
  })

  // ── 3. Room Chat Monotonic Order & ReqId Deduplication ─────────────────────
  it('Room Chat: reqId deduplication drops retransmissions and keeps monotonic IDs', async () => {
    const roomId = await chenPhong('Phòng Chat Deduplication')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Member sends chat with reqId 'chat-req-001'
    member.gui({
      type: 'chat.send',
      text: 'Tin nhắn chào đầu tiên',
      reqId: 'chat-req-001',
    })

    const msg1 = await host.cho('room.chat', (g) => g.message.text === 'Tin nhắn chào đầu tiên')
    const firstId = parseInt(msg1.message.id, 10)
    expect(Number.isFinite(firstId)).toBe(true)

    // Member retransmits identical message with same reqId (e.g. timeout retry)
    member.gui({
      type: 'chat.send',
      text: 'Tin nhắn chào đầu tiên',
      reqId: 'chat-req-001',
    })

    // Host should NOT receive duplicate message
    await host.khongNhan('room.chat', (g) => g.message.text === 'Tin nhắn chào đầu tiên', 350)

    // Member sends new message with different reqId
    member.gui({
      type: 'chat.send',
      text: 'Tin nhắn thứ hai',
      reqId: 'chat-req-002',
    })

    const msg2 = await host.cho('room.chat', (g) => g.message.text === 'Tin nhắn thứ hai')
    const secondId = parseInt(msg2.message.id, 10)
    expect(secondId).toBeGreaterThan(firstId)

    host.dong()
    member.dong()
  })

  // ── 4. Slide Security & Page Navigation Clamping ──────────────────────────
  it('Slide: rejects unsafe protocols and clamps page numbers', async () => {
    const roomId = await chenPhong('Phòng Slide Validation')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host attempts to load unsafe docUrl
    host.gui({
      type: 'slide.action',
      data: {
        action: 'load_doc',
        docUrl: 'javascript:alert(1)',
        docName: 'XSS slide',
        fileType: 'pdf',
        totalPages: 5,
      },
    })
    const err = await host.cho('error')
    expect(err.message).toContain('không an toàn')

    // Member should not receive any slide.sync
    await member.khongNhan('slide.sync', () => true, 300)

    // Host loads valid safe docUrl
    host.gui({
      type: 'slide.action',
      data: {
        action: 'load_doc',
        docUrl: '/api/slides/bai-giang-toan.pdf',
        docName: 'Toán học 10',
        fileType: 'pdf',
        totalPages: 10,
      },
    })
    const slideSync = await member.cho('slide.sync', (g) => g.slide !== null)
    expect(slideSync.slide?.docName).toBe('Toán học 10')
    expect(slideSync.slide?.currentPage).toBe(1)
    expect(slideSync.slide?.totalPages).toBe(10)

    // Change page beyond totalPages -> clamped to 10
    host.gui({
      type: 'slide.action',
      data: {
        action: 'change_page',
        page: 99,
      },
    })
    const pageSyncHigh = await member.cho('slide.sync', (g) => g.slide?.currentPage === 10)
    expect(pageSyncHigh.slide?.currentPage).toBe(10)

    // Change page back to 1
    host.gui({
      type: 'slide.action',
      data: {
        action: 'change_page',
        page: 1,
      },
    })
    const pageSyncLow = await member.cho('slide.sync', (g) => g.slide?.currentPage === 1)
    expect(pageSyncLow.slide?.currentPage).toBe(1)

    host.dong()
    member.dong()
  })

  // ── 5. Pomodoro Server Authority & Auto Expiration ────────────────────────
  it('Pomodoro: enforces host permission and transitions mode on expiration', async () => {
    const roomId = await chenPhong('Phòng Pomodoro Authority')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Normal member attempts to start pomodoro -> rejected
    member.gui({
      type: 'pomodoro.action',
      data: { action: 'start' },
    })
    const err = await member.cho('error')
    expect(err.message).toContain('quyền')

    // Host resets pomodoro with 1s duration
    host.gui({
      type: 'pomodoro.action',
      data: { action: 'reset', duration: 1 },
    })
    await member.cho('pomodoro.sync', (g) => g.state.duration === 1)

    // Host starts pomodoro
    host.gui({
      type: 'pomodoro.action',
      data: { action: 'start' },
    })
    const pStart = await member.cho('pomodoro.sync', (g) => g.state.running)
    expect(pStart.state.mode).toBe('focus')
    expect(pStart.state.endsAt).toBeGreaterThan(0)

    // Wait for timer to expire on server
    await new Promise((r) => setTimeout(r, 1200))

    // Late joiner connects after expiration -> server transitions and sends break mode
    const cLate = await dangNhapLayCookie('qa.v2.thu3')
    const late = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cLate)
    const snapLate = await late.cho('room.snapshot')
    expect(snapLate.pomodoro.mode).toBe('break')
    expect(snapLate.pomodoro.running).toBe(false)

    host.dong()
    member.dong()
    late.dong()
  })

  // ── 6. Multi-Subsystem Late Join Convergence ──────────────────────────────
  it('Convergence: late joiner receives full canonical snapshot across all 5 subsystems', async () => {
    const roomId = await chenPhong('Phòng Full Convergence')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    await host.cho('room.snapshot')

    // 1. Set Whiteboard (cleared to epoch 2, then stroke drawn)
    host.gui({ type: 'whiteboard.action', data: { action: 'stroke.clear' } })
    await host.cho('whiteboard.sync', (g) => g.action === 'stroke.clear')
    host.gui({
      type: 'whiteboard.action',
      data: {
        action: 'stroke.add',
        stroke: { id: 'st_canon', points: [[5, 5], [15, 15]], color: '#FFD700', size: 6, epoch: 2 },
      },
    })
    await host.cho('whiteboard.sync', (g) => g.action === 'stroke.add')

    // 2. Set Shared Notes
    host.gui({
      type: 'notes.action',
      data: { action: 'update', content: '# Canonical Notes Convergence', baseRevision: 1 },
    })
    await host.cho('notes.sync', (g) => g.notes.revision === 2)

    // 3. Send Chat
    host.gui({
      type: 'chat.send',
      text: 'Canonical Chat History Message',
      reqId: 'canon-chat-1',
    })
    await host.cho('room.chat', (g) => g.message.text === 'Canonical Chat History Message')

    // 4. Set Slide
    host.gui({
      type: 'slide.action',
      data: {
        action: 'load_doc',
        docUrl: '/api/slides/canon-presentation.pdf',
        docName: 'Canonical Lecture',
        fileType: 'pdf',
        totalPages: 15,
      },
    })
    await host.cho('slide.sync', (g) => g.slide !== null)
    host.gui({
      type: 'slide.action',
      data: { action: 'change_page', page: 7 },
    })
    await host.cho('slide.sync', (g) => g.slide?.currentPage === 7)

    // 5. Connect Late Joiner C
    const cLate = await dangNhapLayCookie('qa.v2.thu3')
    const late = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cLate)
    const snap = await late.cho('room.snapshot')

    // Verify all 5 subsystems converged in snapshot
    expect(snap.whiteboardEpoch).toBe(2)
    expect(snap.strokes.some((s) => s.id === 'st_canon')).toBe(true)
    expect(snap.notes.revision).toBe(2)
    expect(snap.notes.content).toBe('# Canonical Notes Convergence')
    expect(snap.chat.some((m) => m.text === 'Canonical Chat History Message')).toBe(true)
    expect(snap.slide?.docName).toBe('Canonical Lecture')
    expect(snap.slide?.currentPage).toBe(7)
    expect(snap.slide?.totalPages).toBe(15)

    host.dong()
    late.dong()
  })
})
