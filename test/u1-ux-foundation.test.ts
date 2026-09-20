// Digital Campus v2: Milestone U1 — UX/UI Foundation, Information Architecture & Canonical Room Creation Tests
// test/u1-ux-foundation.test.ts

import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong } from '../shared/protocol/room'
import { filterDiscoveryRooms, buildRoomFriendsMap } from '../src/features/hub/room-discovery'
import type { PhongSanh } from '../shared/protocol/campus'

describe('U1 UX/UI Foundation & Canonical Room Creation', () => {
  // ── 1. Canonical Room Creation Flow: Public Room ─────────────────────────
  it('1. User creates a public room via POST /api/rooms: returns 201, numeric ID, and connects to RoomDO WebSocket', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const res = await exports.default.fetch(`${GOC}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ten: 'Phòng Toán Ôn Tập U1',
        moTa: 'Phòng tạo qua canonical CreateStudyRoomDialog',
        phamVi: 'truong',
        accessMode: 'public',
        sucChua: 25,
      }),
    })

    expect(res.status).toBe(201)
    const data = (await res.json()) as {
      ok: boolean
      room: { id: number; ten: string; phamVi: string; accessMode: string; sucChua: number }
    }
    expect(data.ok).toBe(true)
    expect(typeof data.room.id).toBe('number')
    expect(data.room.id).toBeGreaterThan(0)
    expect(data.room.ten).toBe('Phòng Toán Ôn Tập U1')
    expect(data.room.accessMode).toBe('public')

    // Verify WebSocket connection with real numeric ID succeeds and snapshot is received
    const wsConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${data.room.id}`, cookie)
    const snap = await wsConn.cho('room.snapshot')
    expect(snap.type).toBe('room.snapshot')
    expect(snap.members).toBeDefined()
    expect(Array.isArray(snap.members)).toBe(true)

    wsConn.dong()
    await new Promise((r) => setTimeout(r, 50))
  })

  // ── 2. Canonical Room Creation Flow: Password-Protected Room ─────────────
  it('2. Password Room creation: requires canonical admit before WS, reject without admit, succeeds with admit', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Create room with accessMode = password
    const res = await exports.default.fetch(`${GOC}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ten: 'Phòng Mật Khẩu Khép Kín U1',
        phamVi: 'truong',
        accessMode: 'password',
        password: 'BiMatKhaoSat2026',
        sucChua: 15,
      }),
    })

    expect(res.status).toBe(201)
    const data = (await res.json()) as {
      ok: boolean
      room: { id: number; ten: string; accessMode: string }
    }
    const roomId = data.room.id
    expect(data.room.accessMode).toBe('password')

    // Connecting to WS directly without admission cookie must fail (HTTP 403)
    const resWsForbidden = await exports.default.fetch(`${GOC}/ws/room/phong-${roomId}`, {
      headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
    })
    expect(resWsForbidden.status).toBe(403)

    // Creator performs canonical admission: POST /api/rooms/:id/admit
    const resAdmit = await exports.default.fetch(`${GOC}/api/rooms/${roomId}/admit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ password: 'BiMatKhaoSat2026' }),
    })
    expect(resAdmit.status).toBe(200)
    const admitCookie = (resAdmit.headers.get('Set-Cookie') ?? '').split(';')[0]
    expect(admitCookie).toContain(`admit_${roomId}=`)

    // Now connecting with session cookie + admit cookie succeeds
    const fullCookie = `${cookie}; ${admitCookie}`
    const wsConn = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, fullCookie)
    const snap = await wsConn.cho('room.snapshot')
    expect(snap.type).toBe('room.snapshot')
    expect(snap.members).toBeDefined()

    wsConn.dong()
    await new Promise((r) => setTimeout(r, 50))
  })

  // ── 3. Server Validation Failure Handling ─────────────────────────────────
  it('3. Validation failures are strictly rejected with 400 without creating room', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Short name (< 2 chars)
    const resShortName = await exports.default.fetch(`${GOC}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ten: 'A',
        phamVi: 'truong',
        accessMode: 'public',
      }),
    })
    expect(resShortName.status).toBe(400)

    // Password room with missing/short password (< 4 chars)
    const resShortPw = await exports.default.fetch(`${GOC}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ten: 'Phòng Test Pass Ngắn',
        phamVi: 'truong',
        accessMode: 'password',
        password: '123',
      }),
    })
    expect(resShortPw.status).toBe(400)

    // Scope 'lop' by student from class 1 trying to create for class 2 -> 403
    const resWrongClass = await exports.default.fetch(`${GOC}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        ten: 'Phòng Lớp Trái Phép',
        phamVi: 'lop',
        lopId: 2,
        accessMode: 'public',
      }),
    })
    expect(resWrongClass.status).toBe(403)
  })

  // ── 4. URL Query Synchronization & Room Discovery ────────────────────────
  it('4. filterDiscoveryRooms: correctly filters by keyword and updates dynamically', () => {
    const sampleRooms: PhongSanh[] = [
      {
        id: 101,
        ten: 'Ôn tập Toán Giải tích 10',
        moTa: 'Toán học kỳ 2',
        monHoc: 'toan',
        phamVi: 'truong',
        lopId: null,
        lopTen: null,
        chuPhongTen: 'Bạn A',
        coMatKhau: false,
        sucChua: 20,
        soNguoi: 3,
        dangPhat: null,
        taoLuc: 1000,
      },
      {
        id: 102,
        ten: 'Thí nghiệm Vật lý quang học',
        moTa: 'Quang hình học',
        monHoc: 'vat-li',
        phamVi: 'truong',
        lopId: null,
        lopTen: null,
        chuPhongTen: 'Bạn B',
        coMatKhau: false,
        sucChua: 20,
        soNguoi: 1,
        dangPhat: null,
        taoLuc: 2000,
      },
    ]

    const roomFriendsMap = buildRoomFriendsMap(sampleRooms, [], {})

    // Filter with 'Toán'
    const resToan = filterDiscoveryRooms(sampleRooms, roomFriendsMap, {
      tabPhamVi: 'tat_ca',
      tuKhoa: 'Toán',
      chiHienCoBanBe: false,
    })
    expect(resToan.length).toBe(1)
    expect(resToan[0].id).toBe(101)

    // Dynamic search change to 'Vật lý'
    const resLy = filterDiscoveryRooms(sampleRooms, roomFriendsMap, {
      tabPhamVi: 'tat_ca',
      tuKhoa: 'Vật lý',
      chiHienCoBanBe: false,
    })
    expect(resLy.length).toBe(1)
    expect(resLy[0].id).toBe(102)

    // Empty search matches all
    const resAll = filterDiscoveryRooms(sampleRooms, roomFriendsMap, {
      tabPhamVi: 'tat_ca',
      tuKhoa: '',
      chiHienCoBanBe: false,
    })
    expect(resAll.length).toBe(2)
  })

  // ── 5. Contextual Admin Navigation vs Student Identity ────────────────────
  it('5. Contextual Admin Navigation: whoami returns isSchoolAdmin=false for student, isSchoolAdmin=true for admin', async () => {
    // Student session
    const studentCookie = await dangNhapLayCookie('qa.v2.thu1')
    const resStudent = await exports.default.fetch(`${GOC}/api/whoami`, {
      headers: { Cookie: studentCookie },
    })
    expect(resStudent.status).toBe(200)
    const dataStudent = (await resStudent.json()) as { isSchoolAdmin: boolean; role: string }
    expect(dataStudent.isSchoolAdmin).toBe(false)
    expect(dataStudent.role).toBe('student')

    // Admin session
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')
    const resAdmin = await exports.default.fetch(`${GOC}/api/whoami`, {
      headers: { Cookie: adminCookie },
    })
    expect(resAdmin.status).toBe(200)
    const dataAdmin = (await resAdmin.json()) as { isSchoolAdmin: boolean }
    expect(dataAdmin.isSchoolAdmin).toBe(true)
  })
})
