import { useCallback, useEffect, useRef, useState } from 'react'
import type { GoiCampus, PhongSanh, TinCampus } from '@shared/protocol/campus'
import { lamSachVanBan, MA_DONG_SOCKET, PING_GIU_KET_NOI } from '@shared/protocol/common'
import { CHAT_CAMPUS } from '@shared/rooms/constants'

export type TrangThaiKetNoiCampus = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi' | 'phien_bi_thay'

export interface KetQuaThaoTac {
  ok: boolean
  loi?: string
}

interface ChoPhanHoi {
  resolve: (kq: KetQuaThaoTac) => void
  timer: ReturnType<typeof setTimeout>
}

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000
const TIMEOUT_LENH_MS = 5000

export function useCampus() {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiCampus>('dang_ket_noi')
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [rooms, setRooms] = useState<PhongSanh[]>([])
  const [messages, setMessages] = useState<TinCampus[]>([])
  const [myPermissions, setMyPermissions] = useState<{ accountId: number; xoaMoiTin: boolean } | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const choPhanHoiRef = useRef<Map<string, ChoPhanHoi>>(new Map())
  const lucGuiPingRef = useRef<number | null>(null)
  const guiChatGanNhatRef = useRef<number>(0)
  const soLanThuRef = useRef<number>(0)
  const henGioKetNoiLaiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const daHuyRef = useRef<boolean>(false)
  const ketNoiRef = useRef<() => void>(() => {})

  const donDepChoPhanHoi = useCallback((thongBaoLoi = 'Mất kết nối máy chủ') => {
    for (const [reqId, item] of choPhanHoiRef.current.entries()) {
      clearTimeout(item.timer)
      item.resolve({ ok: false, loi: thongBaoLoi })
      choPhanHoiRef.current.delete(reqId)
    }
  }, [])

  const ketNoi = useCallback(() => {
    if (daHuyRef.current) return
    if (henGioKetNoiLaiRef.current) {
      clearTimeout(henGioKetNoiLaiRef.current)
      henGioKetNoiLaiRef.current = null
    }

    setTrangThai('dang_ket_noi')
    const giaoThuc = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof location !== 'undefined' ? location.host : 'localhost'
    const ws = new WebSocket(`${giaoThuc}//${host}/ws/campus`)
    wsRef.current = ws

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      setTrangThai('da_ket_noi')
      soLanThuRef.current = 0
    }

    ws.onmessage = (e) => {
      if (wsRef.current !== ws) return
      let goi: GoiCampus
      try {
        const raw = JSON.parse(String(e.data)) as unknown
        if (!raw || typeof raw !== 'object' || !('type' in raw)) return
        goi = raw as GoiCampus
      } catch {
        return
      }

      switch (goi.type) {
        case 'snapshot':
          setOnlineCount(goi.online)
          setRooms(goi.rooms)
          setMessages(goi.chat)
          setMyPermissions(goi.me)
          break

        case 'online':
          setOnlineCount(goi.count)
          break

        case 'room.upsert': {
          const roomMoi = goi.room
          setRooms((prev) => {
            const index = prev.findIndex((r) => r.id === roomMoi.id)
            let danhSach: PhongSanh[]
            if (index >= 0) {
              danhSach = [...prev]
              danhSach[index] = roomMoi
            } else {
              danhSach = [roomMoi, ...prev]
            }
            return danhSach.sort((a, b) => b.soNguoi - a.soNguoi || b.taoLuc - a.taoLuc)
          })
          break
        }

        case 'room.remove': {
          const idXoa = goi.id
          setRooms((prev) => prev.filter((r) => r.id !== idXoa))
          break
        }

        case 'chat.msg': {
          const msgMoi = goi.message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msgMoi.id)) return prev
            return [...prev, msgMoi].slice(-CHAT_CAMPUS.GUI_KEM)
          })
          break
        }

        case 'chat.deleted': {
          const idXoa = goi.id
          setMessages((prev) => prev.filter((m) => m.id !== idXoa))
          break
        }

        case 'session.replaced':
          setTrangThai('phien_bi_thay')
          donDepChoPhanHoi('Tài khoản đã đăng nhập ở thiết bị khác')
          break

        case 'pong':
          if (lucGuiPingRef.current !== null) {
            setLatencyMs(Math.round(performance.now() - lucGuiPingRef.current))
            lucGuiPingRef.current = null
          }
          break

        case 'ack': {
          const reqId = goi.reqId
          if (reqId && choPhanHoiRef.current.has(reqId)) {
            const item = choPhanHoiRef.current.get(reqId)!
            clearTimeout(item.timer)
            item.resolve({ ok: true })
            choPhanHoiRef.current.delete(reqId)
          }
          break
        }

        case 'error': {
          const reqId = goi.reqId
          if (reqId && choPhanHoiRef.current.has(reqId)) {
            const item = choPhanHoiRef.current.get(reqId)!
            clearTimeout(item.timer)
            item.resolve({ ok: false, loi: goi.message })
            choPhanHoiRef.current.delete(reqId)
          }
          break
        }
      }
    }

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return
      wsRef.current = null
      donDepChoPhanHoi()

      if (e.code === MA_DONG_SOCKET.PHIEN_BI_THAY || e.reason === 'da_dang_nhap_noi_khac') {
        setTrangThai('phien_bi_thay')
        return
      }

      if (daHuyRef.current) return

      setTrangThai('mat_ket_noi')
      // Exponential backoff with jitter
      const soLan = soLanThuRef.current
      const delay = Math.min(
        BACKOFF_KHOI_DAU_MS * Math.pow(2, soLan) + Math.random() * 500,
        BACKOFF_TOI_DA_MS,
      )
      soLanThuRef.current = soLan + 1

      henGioKetNoiLaiRef.current = setTimeout(() => {
        if (!daHuyRef.current) ketNoiRef.current()
      }, delay)
    }

    ws.onerror = () => {
      // onclose sẽ được gọi ngay sau onerror
    }
  }, [donDepChoPhanHoi])

  useEffect(() => {
    ketNoiRef.current = ketNoi
  }, [ketNoi])

  useEffect(() => {
    daHuyRef.current = false
    ketNoi()

    return () => {
      daHuyRef.current = true
      if (henGioKetNoiLaiRef.current) {
        clearTimeout(henGioKetNoiLaiRef.current)
        henGioKetNoiLaiRef.current = null
      }
      donDepChoPhanHoi()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close(1000, 'roi_trang')
        wsRef.current = null
      }
    }
  }, [ketNoi, donDepChoPhanHoi])

  const ketNoiLai = useCallback(() => {
    soLanThuRef.current = 0
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close(1000, 'ket_noi_lai')
      wsRef.current = null
    }
    ketNoi()
  }, [ketNoi])

  const doDoTre = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    lucGuiPingRef.current = performance.now()
    ws.send(JSON.stringify({ type: PING_GIU_KET_NOI, t: Date.now() }))
  }, [])

  const guiChat = useCallback(async (text: string): Promise<KetQuaThaoTac> => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return { ok: false, loi: 'Chưa kết nối tới máy chủ, vui lòng đợi…' }
    }

    const noiDung = lamSachVanBan(text)
    if (!noiDung) return { ok: false, loi: 'Tin nhắn trống.' }
    if (noiDung.length > CHAT_CAMPUS.TOI_DA_KY_TU) {
      return { ok: false, loi: `Tin nhắn tối đa ${CHAT_CAMPUS.TOI_DA_KY_TU} ký tự.` }
    }

    const bayGio = Date.now()
    if (bayGio - guiChatGanNhatRef.current < CHAT_CAMPUS.GIAN_CACH_MS) {
      return { ok: false, loi: 'Gửi chậm lại một chút nhé!' }
    }
    guiChatGanNhatRef.current = bayGio

    const reqId = `c_${bayGio}_${Math.random().toString(36).slice(2, 7)}`

    return new Promise<KetQuaThaoTac>((resolve) => {
      const timer = setTimeout(() => {
        choPhanHoiRef.current.delete(reqId)
        resolve({ ok: false, loi: 'Máy chủ phản hồi quá lâu, vui lòng thử lại.' })
      }, TIMEOUT_LENH_MS)

      choPhanHoiRef.current.set(reqId, { resolve, timer })
      try {
        ws.send(JSON.stringify({ type: 'chat.send', reqId, text: noiDung }))
      } catch {
        clearTimeout(timer)
        choPhanHoiRef.current.delete(reqId)
        resolve({ ok: false, loi: 'Không thể gửi tin qua kết nối mạng.' })
      }
    })
  }, [])

  const xoaChat = useCallback(async (id: number): Promise<KetQuaThaoTac> => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return { ok: false, loi: 'Chưa kết nối tới máy chủ.' }
    }

    const reqId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    return new Promise<KetQuaThaoTac>((resolve) => {
      const timer = setTimeout(() => {
        choPhanHoiRef.current.delete(reqId)
        resolve({ ok: false, loi: 'Máy chủ phản hồi quá lâu, vui lòng thử lại.' })
      }, TIMEOUT_LENH_MS)

      choPhanHoiRef.current.set(reqId, { resolve, timer })
      try {
        ws.send(JSON.stringify({ type: 'chat.delete', reqId, id }))
      } catch {
        clearTimeout(timer)
        choPhanHoiRef.current.delete(reqId)
        resolve({ ok: false, loi: 'Không thể gửi yêu cầu xoá tin.' })
      }
    })
  }, [])

  return {
    trangThai,
    onlineCount,
    rooms,
    messages,
    myPermissions,
    latencyMs,
    latency: latencyMs,
    doDoTre,
    guiChat,
    xoaChat,
    sendMessage: async (content: string): Promise<void> => {
      const kq = await guiChat(content)
      if (!kq.ok) throw new Error(kq.loi || 'Không gửi được tin nhắn')
    },
    deleteMessage: async (id: string | number): Promise<void> => {
      const kq = await xoaChat(Number(id))
      if (!kq.ok) throw new Error(kq.loi || 'Không xoá được tin nhắn')
    },
    ketNoiLai,
  }
}
