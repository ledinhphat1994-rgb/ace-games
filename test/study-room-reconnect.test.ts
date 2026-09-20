// Digital Campus v2: Milestone R1 — Study Room Reconnect & State Synchronization Tests
// test/study-room-reconnect.test.ts

import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { dangNhapLayCookie, moKetNoi } from './ws'

/** Insert a study room directly into D1 and return its id */
async function insertRoom(
  name: string,
  chuPhongKhoa = 'acc:1',
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(name, chuPhongKhoa)
    .first<{ id: number }>()
  if (!res) throw new Error('Failed to insert room')
  return res.id
}

describe('R1 — Study Room Reconnect & Document Sync Persistence', () => {
  it('1. RoomDO accepts load_doc with docId and broadcasts slide.sync with docId', async () => {
    const roomId = await insertRoom('Phòng Đồng Bộ Slide DocId')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')
    const cMember = await dangNhapLayCookie('qa.v2.thu2')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)

    await host.cho('room.snapshot')
    await member.cho('room.snapshot')

    // Host loads document with docId = 42
    host.gui({
      type: 'slide.action',
      data: {
        action: 'load_doc',
        docUrl: `/api/rooms/${roomId}/documents/42/file`,
        docName: 'Giao_trinh_R1.pdf',
        fileType: 'pdf',
        totalPages: 15,
        docId: 42,
      },
    })

    const syncPkt = await member.cho('slide.sync', (g) => g.slide !== null)
    expect(syncPkt.slide?.docId).toBe(42)
    expect(syncPkt.slide?.docName).toBe('Giao_trinh_R1.pdf')
    expect(syncPkt.slide?.docUrl).toBe(`/api/rooms/${roomId}/documents/42/file`)
    expect(syncPkt.slide?.currentPage).toBe(1)
    expect(syncPkt.slide?.totalPages).toBe(15)

    // Host advances page to 5
    host.gui({
      type: 'slide.action',
      data: { action: 'change_page', page: 5 },
    })

    const pageSync = await member.cho('slide.sync', (g) => g.slide?.currentPage === 5)
    expect(pageSync.slide?.docId).toBe(42)
    expect(pageSync.slide?.currentPage).toBe(5)

    host.dong()
    member.dong()
  })

  it('2. Late joiner / reconnecting participant receives authoritative SlideState snapshot with docId and currentPage', async () => {
    const roomId = await insertRoom('Phòng Reconnect Slide Snapshot')
    const cHost = await dangNhapLayCookie('qa.v2.thu1')

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cHost)
    await host.cho('room.snapshot')

    // Host loads document and sets page to 7
    host.gui({
      type: 'slide.action',
      data: {
        action: 'load_doc',
        docUrl: `/api/rooms/${roomId}/documents/99/file`,
        docName: 'Tài_liệu_ôn_tập.pdf',
        fileType: 'pdf',
        totalPages: 20,
        docId: 99,
      },
    })
    await host.cho('slide.sync', (g) => g.slide !== null)

    host.gui({
      type: 'slide.action',
      data: { action: 'change_page', page: 7 },
    })
    await host.cho('slide.sync', (g) => g.slide?.currentPage === 7)

    // Participant joins late (or reconnects after refresh)
    const cMember = await dangNhapLayCookie('qa.v2.thu2')
    const member = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, cMember)
    const snap = await member.cho('room.snapshot')

    expect(snap.slide).not.toBeNull()
    expect(snap.slide?.docId).toBe(99)
    expect(snap.slide?.docName).toBe('Tài_liệu_ôn_tập.pdf')
    expect(snap.slide?.docUrl).toBe(`/api/rooms/${roomId}/documents/99/file`)
    expect(snap.slide?.currentPage).toBe(7)
    expect(snap.slide?.totalPages).toBe(20)

    host.dong()
    member.dong()
  })
})
