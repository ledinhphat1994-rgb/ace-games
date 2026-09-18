import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { GoiCampus, PhongSanh, TinCampus } from '@shared/protocol/campus'
import type { FriendPresence, SocialState, UserActivity } from '@shared/protocol/social'
import { lamSachVanBan, MA_DONG_SOCKET, PING_GIU_KET_NOI } from '@shared/protocol/common'
import { CHAT_CAMPUS } from '@shared/rooms/constants'

// ─── Notification System ────────────────────────────────────────────────────
export type NotificationType = 'friend_request' | 'friend_online' | 'friend_in_room'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  timestamp: number
  read: boolean
  meta?: {
    requestId?: number
    accountId?: number
    roomId?: number
    roomTitle?: string
  }
}

const MAX_NOTIFICATIONS = 50

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

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

export interface CampusContextValue {
  trangThai: TrangThaiKetNoiCampus
  onlineCount: number
  rooms: PhongSanh[]
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  latencyMs: number | null
  latency: number | null
  doDoTre: () => Promise<number | null>
  guiChat: (text: string) => Promise<KetQuaThaoTac>
  xoaChat: (id: number) => Promise<KetQuaThaoTac>
  sendMessage: (content: string) => Promise<void>
  deleteMessage: (id: string | number) => Promise<void>
  ketNoiLai: () => void

  // Social Layer v1
  socialState: SocialState | null
  presenceMap: Record<number, FriendPresence>
  friendsPresence: Record<number, FriendPresence>
  incomingCount: number
  onlineFriendsCount: number
  lamMoiSocialState: () => Promise<void>
  guiLoiMoiKetBan: (targetAccountId: number) => Promise<KetQuaThaoTac>
  chapNhanKetBan: (requestId: number) => Promise<KetQuaThaoTac>
  tuChoiKetBan: (requestId: number) => Promise<KetQuaThaoTac>
  huyLoiMoi: (requestId: number) => Promise<KetQuaThaoTac>
  huyKetBan: (friendAccountId: number) => Promise<KetQuaThaoTac>
  chanNguoiDung: (targetAccountId: number) => Promise<KetQuaThaoTac>
  boChanNguoiDung: (targetAccountId: number) => Promise<KetQuaThaoTac>
  datTrangThaiAway: (away: boolean) => void
  datHoatDong: (activity: UserActivity | null) => void

  // Notifications v1
  notifications: AppNotification[]
  unreadCount: number
  dismissNotification: (id: string) => void
  markAllRead: () => void

  // Aliases
  sendFriendRequest: (targetAccountId: number) => Promise<KetQuaThaoTac>
  acceptFriendRequest: (requestId: number) => Promise<KetQuaThaoTac>
  rejectFriendRequest: (requestId: number) => Promise<KetQuaThaoTac>
  cancelFriendRequest: (requestId: number) => Promise<KetQuaThaoTac>
  unfriend: (friendAccountId: number) => Promise<KetQuaThaoTac>
  blockUser: (targetAccountId: number) => Promise<KetQuaThaoTac>
  unblockUser: (targetAccountId: number) => Promise<KetQuaThaoTac>
  setPresenceAway: (away: boolean) => void
  setActivity: (activity: UserActivity | null) => void
}

const CampusContext = createContext<CampusContextValue | null>(null)

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiCampus>('dang_ket_noi')
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [rooms, setRooms] = useState<PhongSanh[]>([])
  const [messages, setMessages] = useState<TinCampus[]>([])
  const [myPermissions, setMyPermissions] = useState<{ accountId: number; xoaMoiTin: boolean } | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  // Social state & presence map
  const [socialState, setSocialState] = useState<SocialState | null>(null)
  const [presenceMap, setPresenceMap] = useState<Record<number, FriendPresence>>({})

  // Notifications v1
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const choPhanHoiRef = useRef<Map<string, ChoPhanHoi>>(new Map())
  const lucGuiPingRef = useRef<number | null>(null)
  const guiChatGanNhatRef = useRef<number>(0)
  const soLanThuRef = useRef<number>(0)
  const henGioKetNoiLaiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const daHuyRef = useRef<boolean>(false)
  const hoatDongRef = useRef<UserActivity | null>(null)
  const awayRef = useRef<boolean>(false)
  // Track previous presence to guard against flicker spam
  const prevPresenceRef = useRef<Record<number, FriendPresence>>({})

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
    setNotifications((prev) => [
      { ...n, id: makeId(), read: false, timestamp: Date.now() },
      ...prev,
    ].slice(0, MAX_NOTIFICATIONS))
  }, [])

  // Tải social state từ API
  const lamMoiSocialState = useCallback(async () => {
    try {
      const res = await fetch('/api/social/state')
      if (res.ok) {
        const json = (await res.json()) as { ok: boolean; state: SocialState }
        if (json.ok && json.state) {
          setSocialState(json.state)
        }
      }
    } catch {
      // Ignored: network error
    }
  }, [])

  useEffect(() => {
    void lamMoiSocialState()
  }, [lamMoiSocialState])

  const donDepChoPhanHoi = useCallback((thongBaoLoi = 'Mất kết nối máy chủ') => {
    for (const [reqId, item] of choPhanHoiRef.current.entries()) {
      clearTimeout(item.timer)
      item.resolve({ ok: false, loi: thongBaoLoi })
      choPhanHoiRef.current.delete(reqId)
    }
  }, [])

  const ketNoiRef = useRef<() => void>(() => {})

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

      if (awayRef.current) {
        try {
          ws.send(JSON.stringify({ type: 'presence.away', away: true }))
        } catch {}
      }
      if (hoatDongRef.current) {
        try {
          ws.send(JSON.stringify({ type: 'activity.set', activity: hoatDongRef.current }))
        } catch {}
      }
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

        case 'social.presence_snapshot': {
          const map: Record<number, FriendPresence> = {}
          for (const f of goi.friends) {
            map[f.accountId] = f
          }
          // Seed prevPresenceRef without triggering notifications (snapshot is initial state)
          prevPresenceRef.current = map
          setPresenceMap(map)
          break
        }

        case 'social.presence_update': {
          const p = goi.presence
          const prev = prevPresenceRef.current[p.accountId]

          // Trigger: friend came online (was offline before)
          if (
            (p.state === 'online' || p.state === 'away') &&
            (!prev || prev.state === 'offline')
          ) {
            pushNotification({
              type: 'friend_online',
              title: 'Bạn bè trực tuyến',
              body: `Một người bạn vừa online.`,
              meta: { accountId: p.accountId },
            })
          }

          // Trigger: friend joined a room (activity changed to a new room)
          if (
            p.activity?.type === 'room' &&
            p.activity.roomId != null &&
            p.activity.roomId !== prev?.activity?.roomId
          ) {
            pushNotification({
              type: 'friend_in_room',
              title: 'Bạn bè đang học nhóm',
              body: p.activity.roomTitle
                ? `Vừa vào phòng "${p.activity.roomTitle}".`
                : 'Vừa vào một phòng học.',
              meta: {
                accountId: p.accountId,
                roomId: p.activity.roomId,
                roomTitle: p.activity.roomTitle,
              },
            })
          }

          prevPresenceRef.current = { ...prevPresenceRef.current, [p.accountId]: p }
          setPresenceMap((prev) => ({
            ...prev,
            [p.accountId]: p,
          }))
          break
        }

        case 'social.request_received': {
          const req = goi.request
          setSocialState((prev) => {
            if (!prev) return prev
            if (prev.incomingRequests.some((r) => r.id === req.id)) return prev
            return {
              ...prev,
              incomingRequests: [req, ...prev.incomingRequests],
            }
          })
          // Notification: incoming friend request
          pushNotification({
            type: 'friend_request',
            title: 'Lời mời kết bạn',
            body: req.sender
              ? `${req.sender.displayName || req.sender.username} muốn kết bạn với bạn.`
              : 'Bạn có một lời mời kết bạn mới.',
            meta: { requestId: req.id, accountId: req.sender?.id },
          })
          break
        }

        case 'social.request_resolved': {
          const id = goi.requestId
          setSocialState((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              incomingRequests: prev.incomingRequests.filter((r) => r.id !== id),
              outgoingRequests: prev.outgoingRequests.filter((r) => r.id !== id),
            }
          })
          break
        }

        case 'social.friend_added': {
          const friend = goi.friend
          const presence = goi.presence
          setSocialState((prev) => {
            if (!prev) return prev
            if (prev.friends.some((f) => f.id === friend.id)) return prev
            return {
              ...prev,
              friends: [friend, ...prev.friends],
              incomingRequests: prev.incomingRequests.filter((r) => r.sender?.id !== friend.id),
              outgoingRequests: prev.outgoingRequests.filter((r) => r.receiver?.id !== friend.id),
            }
          })
          setPresenceMap((prev) => ({
            ...prev,
            [presence.accountId]: presence,
          }))
          break
        }

        case 'social.friend_removed': {
          const fid = goi.friendId
          setSocialState((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              friends: prev.friends.filter((f) => f.id !== fid),
            }
          })
          setPresenceMap((prev) => {
            const next = { ...prev }
            delete next[fid]
            return next
          })
          break
        }

        case 'social.blocked': {
          const tid = goi.targetId
          setSocialState((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              friends: prev.friends.filter((f) => f.id !== tid),
              incomingRequests: prev.incomingRequests.filter((r) => r.sender?.id !== tid),
              outgoingRequests: prev.outgoingRequests.filter((r) => r.receiver?.id !== tid),
              blockedUsers: [{ id: tid, username: '', displayName: '', blockedAt: Date.now() }, ...prev.blockedUsers],
            }
          })
          setPresenceMap((prev) => {
            const next = { ...prev }
            delete next[tid]
            return next
          })
          break
        }

        case 'ack': {
          if (goi.reqId) {
            const item = choPhanHoiRef.current.get(goi.reqId)
            if (item) {
              clearTimeout(item.timer)
              item.resolve({ ok: true })
              choPhanHoiRef.current.delete(goi.reqId)
            }
          }
          break
        }

        case 'error': {
          if (goi.reqId) {
            const item = choPhanHoiRef.current.get(goi.reqId)
            if (item) {
              clearTimeout(item.timer)
              item.resolve({ ok: false, loi: goi.message })
              choPhanHoiRef.current.delete(goi.reqId)
            }
          }
          break
        }

        case 'pong': {
          if (lucGuiPingRef.current !== null) {
            setLatencyMs(Math.max(0, Date.now() - lucGuiPingRef.current))
            lucGuiPingRef.current = null
          }
          break
        }

        case 'session.replaced': {
          setTrangThai('phien_bi_thay')
          break
        }
      }
    }

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return
      donDepChoPhanHoi()

      if (e.code === MA_DONG_SOCKET.PHIEN_BI_THAY) {
        setTrangThai('phien_bi_thay')
        return
      }

      setTrangThai('mat_ket_noi')
      if (daHuyRef.current) return

      const delay = Math.min(BACKOFF_KHOI_DAU_MS * 2 ** soLanThuRef.current, BACKOFF_TOI_DA_MS)
      soLanThuRef.current += 1
      henGioKetNoiLaiRef.current = setTimeout(() => {
        ketNoiRef.current()
      }, delay)
    }

    ws.onerror = () => {
      if (wsRef.current !== ws) return
      donDepChoPhanHoi()
    }
  }, [donDepChoPhanHoi])

  useEffect(() => {
    ketNoiRef.current = ketNoi
  }, [ketNoi])

  useEffect(() => {
    daHuyRef.current = false
    ketNoi()

    const pingInterval = setInterval(() => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(PING_GIU_KET_NOI)
        } catch {}
      }
    }, 25000)

    return () => {
      daHuyRef.current = true
      clearInterval(pingInterval)
      if (henGioKetNoiLaiRef.current) clearTimeout(henGioKetNoiLaiRef.current)
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
        wsRef.current = null
      }
      donDepChoPhanHoi('Hủy kết nối')
    }
  }, [ketNoi, donDepChoPhanHoi])

  const doDoTre = useCallback(async (): Promise<number | null> => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return null
    lucGuiPingRef.current = Date.now()
    try {
      ws.send(JSON.stringify({ type: 'ping', t: lucGuiPingRef.current }))
    } catch {
      lucGuiPingRef.current = null
      return null
    }
    return new Promise<number | null>((resolve) => {
      const batDau = Date.now()
      const check = setInterval(() => {
        if (lucGuiPingRef.current === null) {
          clearInterval(check)
          resolve(Math.max(0, Date.now() - batDau))
        } else if (Date.now() - batDau > 3000) {
          clearInterval(check)
          resolve(null)
        }
      }, 50)
    })
  }, [])

  const guiChat = useCallback(async (text: string): Promise<KetQuaThaoTac> => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return { ok: false, loi: 'Chưa kết nối tới máy chủ.' }
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
    if (!ws || ws.readyState !== WebSocket.OPEN) return { ok: false, loi: 'Chưa kết nối tới máy chủ.' }
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

  // Social API actions
  const guiLoiMoiKetBan = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể gửi lời mời.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi gửi lời mời.' }
    }
  }, [lamMoiSocialState])

  const chapNhanKetBan = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể chấp nhận lời mời.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi chấp nhận lời mời.' }
    }
  }, [lamMoiSocialState])

  const tuChoiKetBan = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể từ chối lời mời.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi từ chối lời mời.' }
    }
  }, [lamMoiSocialState])

  const huyLoiMoi = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể huỷ lời mời.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi huỷ lời mời.' }
    }
  }, [lamMoiSocialState])

  const huyKetBan = useCallback(async (friendAccountId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể huỷ kết bạn.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi huỷ kết bạn.' }
    }
  }, [lamMoiSocialState])

  const chanNguoiDung = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể chặn người dùng.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi chặn người dùng.' }
    }
  }, [lamMoiSocialState])

  const boChanNguoiDung = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    try {
      const res = await fetch('/api/social/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể bỏ chặn.' }
      await lamMoiSocialState()
      return { ok: true }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi bỏ chặn.' }
    }
  }, [lamMoiSocialState])

  const datTrangThaiAway = useCallback((away: boolean) => {
    awayRef.current = away
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'presence.away', away }))
      } catch {}
    }
  }, [])

  const datHoatDong = useCallback((activity: UserActivity | null) => {
    hoatDongRef.current = activity
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'activity.set', activity }))
      } catch {}
    }
  }, [])

  const incomingCount = socialState?.incomingRequests?.length ?? 0
  const onlineFriendsCount = Object.values(presenceMap).filter(
    (p) => p.state === 'online' || p.state === 'away',
  ).length

  const unreadCount = notifications.filter((n) => !n.read).length

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const value: CampusContextValue = {
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
    ketNoiLai: ketNoi,

    // Social Layer
    socialState,
    presenceMap,
    friendsPresence: presenceMap,
    incomingCount,
    onlineFriendsCount,
    lamMoiSocialState,
    guiLoiMoiKetBan,
    chapNhanKetBan,
    tuChoiKetBan,
    huyLoiMoi,
    huyKetBan,
    chanNguoiDung,
    boChanNguoiDung,
    datTrangThaiAway,
    datHoatDong,

    // Notifications v1
    notifications,
    unreadCount,
    dismissNotification,
    markAllRead,

    // Aliases
    sendFriendRequest: guiLoiMoiKetBan,
    acceptFriendRequest: chapNhanKetBan,
    rejectFriendRequest: tuChoiKetBan,
    cancelFriendRequest: huyLoiMoi,
    unfriend: huyKetBan,
    blockUser: chanNguoiDung,
    unblockUser: boChanNguoiDung,
    setPresenceAway: datTrangThaiAway,
    setActivity: datHoatDong,
  }

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>
}

export function useCampusContext() {
  const ctx = useContext(CampusContext)
  if (!ctx) {
    throw new Error('useCampusContext must be used within a CampusProvider')
  }
  return ctx
}
