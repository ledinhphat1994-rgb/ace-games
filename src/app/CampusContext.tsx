import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { GoiCampus, PhongSanh, TinCampus } from '@shared/protocol/campus'
import type { FriendPresence, SocialState, UserActivity } from '@shared/protocol/social'
import { lamSachVanBan, MA_DONG_SOCKET, PING_GIU_KET_NOI } from '@shared/protocol/common'
import { CHAT_CAMPUS } from '@shared/rooms/constants'

import type { NotificationType } from '@shared/protocol/notification'
import { SocialMutationLockManager, type SocialStatus } from '@/features/hub/social-semantics'
import { PhienContext } from '@/app/phien'

// ─── Notification System ────────────────────────────────────────────────────
export type { NotificationType }
export type { SocialStatus }

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
    invitationId?: string
    achievementKey?: string
    actorId?: number
    actorName?: string
    actorAvatar?: string | null
    [key: string]: unknown
  }
}

export type TrangThaiKetNoiCampus = 'dang_ket_noi' | 'da_ket_noi' | 'mat_ket_noi' | 'phien_bi_thay'

export interface KetQuaThaoTac {
  ok: boolean
  loi?: string
  refreshed?: boolean
}

interface ChoPhanHoi {
  resolve: (kq: KetQuaThaoTac) => void
  timer: ReturnType<typeof setTimeout>
}

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000
const TIMEOUT_LENH_MS = 5000

const RONG_SOCIAL_STATE: SocialState = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUsers: [],
}

export interface CampusContextValue {
  trangThai: TrangThaiKetNoiCampus
  /** Phiên bị máy chủ đóng vì quản trị viên khoá tài khoản (không phải đăng nhập ở thiết bị khác). */
  taiKhoanBiKhoa: boolean
  onlineCount: number
  rooms: PhongSanh[]
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  campusSnapshotReady: boolean
  roomsReady: boolean
  latencyMs: number | null
  latency: number | null
  doDoTre: () => Promise<number | null>
  guiChat: (text: string) => Promise<KetQuaThaoTac>
  xoaChat: (id: number) => Promise<KetQuaThaoTac>
  sendMessage: (content: string) => Promise<void>
  deleteMessage: (id: string | number) => Promise<void>
  ketNoiLai: () => void

  // Social Layer v1
  socialStatus: SocialStatus
  socialError: string | null
  presenceReady: boolean
  retrySocialLoad: () => Promise<void>
  socialState: SocialState | null
  presenceMap: Record<number, FriendPresence>
  friendsPresence: Record<number, FriendPresence>
  incomingCount: number
  onlineFriendsCount: number
  lamMoiSocialState: () => Promise<{ ok: boolean; error?: string }>
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
  dismissNotification: (id: string) => Promise<boolean>
  markAllRead: () => Promise<boolean>
  lamMoiNotifications: () => Promise<void>

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
  const phien = useContext(PhienContext)
  const nguoiDung = phien?.nguoiDung ?? null

  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiCampus>('dang_ket_noi')
  const [taiKhoanBiKhoa, setTaiKhoanBiKhoa] = useState(false)
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [rooms, setRooms] = useState<PhongSanh[]>([])
  const [messages, setMessages] = useState<TinCampus[]>([])
  const [myPermissions, setMyPermissions] = useState<{ accountId: number; xoaMoiTin: boolean } | null>(null)
  const [campusSnapshotReady, setCampusSnapshotReady] = useState<boolean>(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  // Social state & presence map
  const [socialStatus, setSocialStatus] = useState<SocialStatus>('loading')
  const [socialError, setSocialError] = useState<string | null>(null)
  const [presenceReady, setPresenceReady] = useState<boolean>(false)
  const [socialState, setSocialState] = useState<SocialState>(RONG_SOCIAL_STATE)
  const [presenceMap, setPresenceMap] = useState<Record<number, FriendPresence>>({})
  const mutationLockManager = useRef(new SocialMutationLockManager()).current

  // Notifications v1 — Authoritative D1 State Only
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const wsRef = useRef<WebSocket | null>(null)
  const choPhanHoiRef = useRef<Map<string, ChoPhanHoi>>(new Map())
  const lucGuiPingRef = useRef<number | null>(null)
  const guiChatGanNhatRef = useRef<number>(0)
  const soLanThuRef = useRef<number>(0)
  const henGioKetNoiLaiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Đang chờ nối lại sau khi rớt mạng (không bao giờ bật khi phiên bị thiết bị khác thay — mã 4001). */
  const choNoiLaiRef = useRef<boolean>(false)
  const daHuyRef = useRef<boolean>(false)
  const hoatDongRef = useRef<UserActivity | null>(null)
  const awayRef = useRef<boolean>(false)
  // Track previous presence to guard against flicker spam
  const prevPresenceRef = useRef<Record<number, FriendPresence>>({})

  // Tải social state từ API — Authoritative Server State Only (Không merge ghost request)
  const lamMoiSocialState = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!nguoiDung) {
      setSocialState(RONG_SOCIAL_STATE)
      setSocialStatus('ready')
      setSocialError(null)
      return { ok: true }
    }
    try {
      const res = await fetch('/api/social/state')
      if (res.ok) {
        const json = (await res.json()) as { ok: boolean; state: SocialState; loi?: string }
        if (json.ok && json.state) {
          setSocialState(json.state)
          setSocialStatus('ready')
          setSocialError(null)
          return { ok: true }
        }
      }
      const msg = 'Không thể làm mới dữ liệu bạn bè.'
      setSocialStatus((prev) => (prev === 'ready' || prev === 'degraded' ? 'degraded' : 'error'))
      setSocialError(msg)
      return { ok: false, error: msg }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi tải mạng xã hội.'
      setSocialStatus((prev) => (prev === 'ready' || prev === 'degraded' ? 'degraded' : 'error'))
      setSocialError(msg)
      return { ok: false, error: msg }
    }
  }, [])

  const retrySocialLoad = useCallback(async () => {
    setSocialStatus('loading')
    setSocialError(null)
    await lamMoiSocialState()
  }, [lamMoiSocialState])

  useEffect(() => {
    void lamMoiSocialState()
  }, [lamMoiSocialState])

  // Tải danh sách thông báo từ API D1
  const lamMoiNotifications = useCallback(async () => {
    if (!nguoiDung) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) {
        const json = (await res.json()) as {
          ok: boolean
          notifications?: Array<{
            id: number
            type: NotificationType
            title: string
            body: string
            data?: Record<string, unknown> | null
            readAt: number | null
            createdAt: number
          }>
          unreadCount?: number
          totalCount?: number
          hasMore?: boolean
        }
        if (json.ok && Array.isArray(json.notifications)) {
          setNotifications(
            json.notifications.map((n) => ({
              id: String(n.id),
              type: n.type,
              title: n.title,
              body: n.body,
              timestamp: n.createdAt,
              read: n.readAt !== null,
              meta: (n.data as AppNotification['meta']) || undefined,
            })),
          )
          if (typeof json.unreadCount === 'number') {
            setUnreadCount(json.unreadCount)
          }
        }
      }
    } catch {
      // Ignored: network error
    }
  }, [nguoiDung])

  useEffect(() => {
    void lamMoiNotifications()
  }, [lamMoiNotifications])

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
    if (!nguoiDung) {
      setTrangThai('da_ket_noi')
      setPresenceReady(false)
      setCampusSnapshotReady(true)
      return
    }
    if (henGioKetNoiLaiRef.current) {
      clearTimeout(henGioKetNoiLaiRef.current)
      henGioKetNoiLaiRef.current = null
    }
    choNoiLaiRef.current = false

    setTrangThai('dang_ket_noi')
    setPresenceReady(false)
    setCampusSnapshotReady(false)
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
          setCampusSnapshotReady(true)
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
          setPresenceReady(true)
          break
        }

        case 'social.presence_update': {
          const p = goi.presence
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
            const cur = prev ?? RONG_SOCIAL_STATE
            if (cur.incomingRequests.some((r) => r.id === req.id)) return cur
            return {
              ...cur,
              incomingRequests: [req, ...cur.incomingRequests],
            }
          })
          // Authoritative refresh from D1 — zero client-local fake injection
          void lamMoiNotifications()
          break
        }

        case 'social.study_invite': {
          // Authoritative refresh from D1 — zero client-local fake injection
          void lamMoiNotifications()
          break
        }

        case 'social.request_resolved': {
          const id = goi.requestId
          setSocialState((prev) => {
            const cur = prev ?? RONG_SOCIAL_STATE
            return {
              ...cur,
              incomingRequests: cur.incomingRequests.filter((r) => r.id !== id),
              outgoingRequests: cur.outgoingRequests.filter((r) => r.id !== id),
            }
          })
          void lamMoiNotifications()
          break
        }

        case 'social.friend_added': {
          const friend = goi.friend
          const presence = goi.presence
          setSocialState((prev) => {
            const cur = prev ?? RONG_SOCIAL_STATE
            if (cur.friends.some((f) => f.id === friend.id)) return cur
            return {
              ...cur,
              friends: [friend, ...cur.friends],
              incomingRequests: cur.incomingRequests.filter((r) => r.sender?.id !== friend.id),
              outgoingRequests: cur.outgoingRequests.filter((r) => r.receiver?.id !== friend.id),
            }
          })
          setPresenceMap((prev) => ({
            ...prev,
            [presence.accountId]: presence,
          }))
          void lamMoiNotifications()
          break
        }

        case 'social.friend_removed': {
          const fid = goi.friendId
          setSocialState((prev) => {
            const cur = prev ?? RONG_SOCIAL_STATE
            return {
              ...cur,
              friends: cur.friends.filter((f) => f.id !== fid),
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
            const cur = prev ?? RONG_SOCIAL_STATE
            return {
              ...cur,
              friends: cur.friends.filter((f) => f.id !== tid),
              incomingRequests: cur.incomingRequests.filter((r) => r.sender?.id !== tid),
              outgoingRequests: cur.outgoingRequests.filter((r) => r.receiver?.id !== tid),
              blockedUsers: [{ id: tid, username: '', displayName: '', blockedAt: Date.now() }, ...cur.blockedUsers],
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
          if (goi.reason === 'tai_khoan_khoa') setTaiKhoanBiKhoa(true)
          setTrangThai('phien_bi_thay')
          break
        }
      }
    }

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return
      donDepChoPhanHoi()
      setPresenceReady(false)
      setCampusSnapshotReady(false)

      if (e.code === MA_DONG_SOCKET.PHIEN_BI_THAY) {
        if (e.reason === 'tai_khoan_khoa') setTaiKhoanBiKhoa(true)
        setTrangThai('phien_bi_thay')
        return
      }

      setTrangThai('mat_ket_noi')
      if (daHuyRef.current) return

      // Độ trễ ngẫu nhiên trong khoảng ½–1 mức lùi: sau một lần deploy, các máy không cùng nối lại một nhịp vào CampusDO.
      const mucLui = Math.min(BACKOFF_KHOI_DAU_MS * 2 ** soLanThuRef.current, BACKOFF_TOI_DA_MS)
      const delay = mucLui / 2 + Math.random() * (mucLui / 2)
      soLanThuRef.current += 1
      choNoiLaiRef.current = true
      henGioKetNoiLaiRef.current = setTimeout(() => {
        ketNoiRef.current()
      }, delay)
    }

    ws.onerror = () => {
      if (wsRef.current !== ws) return
      donDepChoPhanHoi()
      setPresenceReady(false)
      setCampusSnapshotReady(false)
    }
  }, [donDepChoPhanHoi, lamMoiNotifications])

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

  // Có mạng trở lại hoặc quay lại tab trong lúc đang chờ nối lại: nối ngay, không chờ hết thời gian lùi.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const noiLaiNgay = () => {
      if (daHuyRef.current || !choNoiLaiRef.current || document.visibilityState === 'hidden') return
      soLanThuRef.current = 0
      ketNoiRef.current()
    }
    window.addEventListener('online', noiLaiNgay)
    document.addEventListener('visibilitychange', noiLaiNgay)
    return () => {
      window.removeEventListener('online', noiLaiNgay)
      document.removeEventListener('visibilitychange', noiLaiNgay)
    }
  }, [])

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
    if (!nguoiDung) {
      phien?.moAuthModal('dang_nhap')
      return { ok: false, loi: 'Vui lòng đăng nhập để gửi tin nhắn.' }
    }
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

  // Social API actions with in-flight mutation guards
  const guiLoiMoiKetBan = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `send-${targetAccountId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể gửi lời mời.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi gửi lời mời.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const chapNhanKetBan = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `accept-${requestId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể chấp nhận lời mời.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi chấp nhận lời mời.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const tuChoiKetBan = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `reject-${requestId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể từ chối lời mời.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi từ chối lời mời.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const huyLoiMoi = useCallback(async (requestId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `cancel-${requestId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể huỷ lời mời.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi huỷ lời mời.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const huyKetBan = useCallback(async (friendAccountId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `unfriend-${friendAccountId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể huỷ kết bạn.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi huỷ kết bạn.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const chanNguoiDung = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `block-${targetAccountId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể chặn người dùng.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi chặn người dùng.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

  const boChanNguoiDung = useCallback(async (targetAccountId: number): Promise<KetQuaThaoTac> => {
    const lockKey = `unblock-${targetAccountId}`
    if (!mutationLockManager.acquire(lockKey)) return { ok: false, loi: 'Thao tác đang được xử lý.' }
    try {
      const res = await fetch('/api/social/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAccountId }),
      })
      const data = (await res.json()) as { ok: boolean; loi?: string }
      if (!res.ok || !data.ok) return { ok: false, loi: data.loi || 'Không thể bỏ chặn.' }
      const refreshRes = await lamMoiSocialState()
      return { ok: true, refreshed: refreshRes.ok }
    } catch {
      return { ok: false, loi: 'Lỗi mạng khi bỏ chặn.' }
    } finally {
      mutationLockManager.release(lockKey)
    }
  }, [lamMoiSocialState, mutationLockManager])

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

  const dismissNotification = useCallback(async (id: string): Promise<boolean> => {
    const numId = parseInt(id, 10)
    if (!Number.isInteger(numId) || numId <= 0) return false
    try {
      const res = await fetch(`/api/notifications/${numId}/read`, { method: 'POST' })
      if (!res.ok) return false
      const data = (await res.json()) as { ok?: boolean }
      if (!data.ok) return false

      // Authoritative convergence: update local state only on D1 success
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id)
        if (target && !target.read) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      })
      return true
    } catch {
      return false
    }
  }, [])

  const markAllRead = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (!res.ok) return false
      const data = (await res.json()) as { ok?: boolean }
      if (!data.ok) return false

      // Authoritative convergence: update local state only on D1 success
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      return true
    } catch {
      return false
    }
  }, [])

  const value: CampusContextValue = {
    trangThai,
    taiKhoanBiKhoa,
    onlineCount,
    rooms,
    messages,
    myPermissions,
    campusSnapshotReady,
    roomsReady: campusSnapshotReady,
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
    socialStatus,
    socialError,
    presenceReady,
    retrySocialLoad,
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
    lamMoiNotifications,

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
