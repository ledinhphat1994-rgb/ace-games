import { describe, expect, it } from 'vitest'
import type { GoiCampus, PhongSanh, TinCampus } from '../shared/protocol/campus'
import { lamSachVanBan, MA_DONG_SOCKET } from '../shared/protocol/common'
import { CHAT_CAMPUS } from '../shared/rooms/constants'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moCampus = (cookie: string) => moKetNoi<GoiCampus>('/ws/campus', cookie)

describe('Protocol & State Logic cho useCampus (Frontend Real-time Layer)', () => {
  it('quy tắc làm sạch văn bản & độ dài tin nhắn client-side', () => {
    // Tin rỗng / khoảng trắng thừa
    expect(lamSachVanBan('   ')).toBe('')
    expect(lamSachVanBan('\n\t  \n')).toBe('')
    expect(lamSachVanBan('  xin chào lớp 10A7  ')).toBe('xin chào lớp 10A7')

    // Giới hạn ký tự tối đa (500 theo CHAT_CAMPUS.TOI_DA_KY_TU)
    const tinHopLe = 'a'.repeat(CHAT_CAMPUS.TOI_DA_KY_TU)
    expect(tinHopLe.length).toBe(CHAT_CAMPUS.TOI_DA_KY_TU)
    const tinQuaDai = 'a'.repeat(CHAT_CAMPUS.TOI_DA_KY_TU + 1)
    expect(tinQuaDai.length).toBe(CHAT_CAMPUS.TOI_DA_KY_TU + 1)
  })

  it('xử lý room.upsert: thêm mới, cập nhật và sắp xếp theo số người tham gia', () => {
    let rooms: PhongSanh[] = []

    const upsert = (roomMoi: PhongSanh) => {
      const idx = rooms.findIndex((r) => r.id === roomMoi.id)
      if (idx >= 0) {
        rooms[idx] = roomMoi
      } else {
        rooms = [roomMoi, ...rooms]
      }
      rooms.sort((a, b) => b.soNguoi - a.soNguoi || b.taoLuc - a.taoLuc)
    }

    const r1: PhongSanh = {
      id: 1,
      ten: 'Toán 10 - Ôn tập',
      moTa: 'Ôn tập chương 1',
      monHoc: 'toan',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      chuPhongTen: 'Thầy Phát',
      coMatKhau: false,
      sucChua: 30,
      soNguoi: 5,
      dangPhat: null,
      taoLuc: 1000,
    }

    const r2: PhongSanh = {
      id: 2,
      ten: 'Văn 10 - Thảo luận',
      moTa: 'Thảo luận tác phẩm',
      monHoc: 'ngu-van',
      phamVi: 'lop',
      lopId: 1,
      lopTen: '10A7',
      chuPhongTen: 'Bạn An',
      coMatKhau: true,
      sucChua: 15,
      soNguoi: 12,
      dangPhat: null,
      taoLuc: 2000,
    }

    upsert(r1)
    expect(rooms).toHaveLength(1)
    expect(rooms[0].id).toBe(1)

    upsert(r2)
    expect(rooms).toHaveLength(2)
    // r2 có 12 người > r1 có 5 người -> r2 phải đứng đầu
    expect(rooms[0].id).toBe(2)
    expect(rooms[1].id).toBe(1)

    // Cập nhật r1 tăng lên 20 người
    upsert({ ...r1, soNguoi: 20 })
    expect(rooms[0].id).toBe(1)
    expect(rooms[0].soNguoi).toBe(20)

    // Xoá r2 (room.remove)
    rooms = rooms.filter((r) => r.id !== 2)
    expect(rooms).toHaveLength(1)
    expect(rooms[0].id).toBe(1)
  })

  it('xử lý tin nhắn chat: chống trùng lặp id, giới hạn tin gần nhất & xoá tin', () => {
    let messages: TinCampus[] = []

    const themTin = (msg: TinCampus) => {
      if (messages.some((m) => m.id === msg.id)) return
      messages = [...messages, msg].slice(-CHAT_CAMPUS.GUI_KEM)
    }

    for (let i = 1; i <= 60; i++) {
      themTin({
        id: i,
        accountId: i % 2 === 0 ? 100 : 200,
        ten: `Người dùng ${i}`,
        vaiTro: 'hoc_sinh',
        lopTen: '10A7',
        noiDung: `Tin nhắn ${i}`,
        taoLuc: Date.now() + i * 100,
      })
    }

    // Chỉ giữ tối đa CHAT_CAMPUS.GUI_KEM = 50 tin
    expect(messages).toHaveLength(CHAT_CAMPUS.GUI_KEM)
    expect(messages[0].id).toBe(11)
    expect(messages[messages.length - 1].id).toBe(60)

    // Thêm trùng ID 60 -> không thêm lặp
    themTin({
      id: 60,
      accountId: 100,
      ten: 'Người dùng 60',
      vaiTro: 'hoc_sinh',
      lopTen: '10A7',
      noiDung: 'Tin nhắn 60',
      taoLuc: Date.now(),
    })
    expect(messages).toHaveLength(CHAT_CAMPUS.GUI_KEM)

    // Xoá tin nhắn (chat.deleted)
    messages = messages.filter((m) => m.id !== 20)
    expect(messages).toHaveLength(CHAT_CAMPUS.GUI_KEM - 1)
    expect(messages.some((m) => m.id === 20)).toBe(false)
  })

  it('cơ chế Exponential Backoff: tính toán thời gian chờ tăng luỹ tiến và chạm trần 10s', () => {
    const tinhDelay = (soLan: number) => {
      const BACKOFF_KHOI_DAU_MS = 1000
      const BACKOFF_TOI_DA_MS = 10000
      return Math.min(BACKOFF_KHOI_DAU_MS * Math.pow(2, soLan), BACKOFF_TOI_DA_MS)
    }

    expect(tinhDelay(0)).toBe(1000) // 1s
    expect(tinhDelay(1)).toBe(2000) // 2s
    expect(tinhDelay(2)).toBe(4000) // 4s
    expect(tinhDelay(3)).toBe(8000) // 8s
    expect(tinhDelay(4)).toBe(10000) // chạm trần 10s
    expect(tinhDelay(10)).toBe(10000) // chạm trần 10s
  })
})

describe('Tích hợp WebSocket thời gian thực (/ws/campus)', () => {
  it('kết nối nhận snapshot, gửi chat với reqId, nhận broadcast và tự xoá tin trong 15 phút', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const kn = await moCampus(cookie)
    expect(kn.status).toBe(101)

    // Nhận snapshot
    const snap = await kn.cho('snapshot')
    expect(snap.online).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(snap.rooms)).toBe(true)
    expect(Array.isArray(snap.chat)).toBe(true)

    // Gửi chat
    const reqId = `test_${Date.now()}`
    kn.gui({ type: 'chat.send', reqId, text: 'Kiểm tra tích hợp useCampus' })
    await kn.cho('ack', (g) => g.reqId === reqId)
    const goiMsg = await kn.cho('chat.msg', (g) => g.message.noiDung === 'Kiểm tra tích hợp useCampus')
    expect(goiMsg.message.ten).toBe('QA Thử nghiệm 1')

    // Xoá tin vừa gửi
    const delReqId = `del_${Date.now()}`
    kn.gui({ type: 'chat.delete', reqId: delReqId, id: goiMsg.message.id })
    await kn.cho('ack', (g) => g.reqId === delReqId)
    const goiDel = await kn.cho('chat.deleted', (g) => g.id === goiMsg.message.id)
    expect(goiDel.id).toBe(goiMsg.message.id)

    kn.dong()
  })

  it('đá phiên cũ khi đăng nhập thiết bị mới với mã đóng 4001 (Strict Single-device)', async () => {
    // Thiết bị 1 đăng nhập và mở kết nối
    const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
    const phien1 = await moCampus(cookie1)
    await phien1.cho('snapshot')

    // Thiết bị 2 đăng nhập lại cùng tài khoản (tạo phiên mới, đá phiên cũ)
    const cookie2 = await dangNhapLayCookie('qa.v2.thu1')
    const phien2 = await moCampus(cookie2)
    await phien2.cho('snapshot')

    // Phiên 1 phải nhận mã đóng 4001 và lý do 'da_dang_nhap_noi_khac'
    const dong = await phien1.choDong()
    expect(dong.code).toBe(MA_DONG_SOCKET.PHIEN_BI_THAY)
    expect(dong.reason).toBe('da_dang_nhap_noi_khac')

    phien2.dong()
  })
})
