import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  Clock,
  Copy,
  EyeOff,
  Loader2,
  MessageSquare,
  MoreVertical,
  Radio,
  SendHorizontal,
  Smile,
  Undo2,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCampusContext } from '@/app/CampusContext'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatLastSeen } from '@/features/hub/social-semantics'
import { guiReactionTinNhanRieng, guiTinNhanRieng, layTinNhanRieng, xoaTinNhanRieng } from '@/lib/api'
import { useTopLayerZIndex } from '@/lib/top-layer'
import { cn } from '@/lib/utils'
import { GameInviteBubble, parseGameInvite } from '@/components/chat/GameInviteBubble'
import type { ReactionDetail } from '@shared/protocol/campus'
import type { DirectMessage } from '@shared/protocol/social'

export interface DmTargetUser {
  id: number
  displayName: string
  avatar?: string | null
  lopTen?: string | null
}

interface DirectMessageThreadProps {
  target: DmTargetUser
  onBack?: () => void
  className?: string
}

const DINH_DANG_GIO = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const DINH_DANG_NGAY = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })
const GOP_TIN_TRONG_MS = 5 * 60 * 1000
const NGUONG_DAY_PX = 80

/**
 * Quy tắc emoji cố định cho tin nhắn riêng 1-1 (Vùng 3):
 * - Hiển thị ở ngoài tin nhắn: tối đa 3 emoji.
 * - Khi chọn emoji: có đầy đủ danh sách để chọn.
 */
export const DM_FIXED_3_EMOJIS = ['❤️', '😆', '😡'] as const

export const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '🎉', '👏', '😮', '😢', '💯', '✨', '🙏', '😍']
export const EXTRA_EMOJIS = [
  '🚀', '💡', '🎓', '🏆', '⭐', '💪',
  '🤝', '🥳', '😎', '🤩', '🎯', '📚',
  '⚡', '🌟', '🥰', '🙌', '👀', '🤯',
  '💖', '💐', '✌️', '🫡', '🎮', '☕',
]
export const ALL_REACTION_EMOJIS = [...QUICK_EMOJIS, ...EXTRA_EMOJIS]

const DANH_SACH_EMOJI = [
  '😊', '😂', '🔥', '👍', '👏', '🎉',
  '❤️', '🏆', '♟️', '🏮', '🎯', '⚡',
  '🚀', '😎', '🤝', '🙌', '💯', '✨',
  '🤩', '💪', '🎮', '✌️', '🫡', '👀',
]

function cungNgay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function nhanNgay(ms: number, bayGio: number): string {
  if (cungNgay(ms, bayGio)) return 'Hôm nay'
  if (cungNgay(ms, bayGio - 24 * 60 * 60 * 1000)) return 'Hôm qua'
  return DINH_DANG_NGAY.format(ms)
}

interface AnchorRect {
  top: number
  bottom: number
  left: number
  right: number
}

function getPickerPosition(rect?: AnchorRect | null, laCuaMinh = false) {
  if (!rect || typeof window === 'undefined') {
    return { top: 120, left: 60 }
  }

  const PICKER_WIDTH = 264
  const PICKER_HEIGHT = 224
  const MARGIN = 12

  // 1. Vị trí ngang: giữ trọn vẹn trong màn hình, không tràn lề phải hay trái
  let left = laCuaMinh ? rect.right - PICKER_WIDTH : rect.left
  const maxLeft = Math.max(MARGIN, window.innerWidth - PICKER_WIDTH - MARGIN)
  left = Math.max(MARGIN, Math.min(left, maxLeft))

  // 2. Vị trí dọc: ưu tiên phía trên nếu đủ chỗ, nếu không thì phía dưới
  const spaceAbove = rect.top - MARGIN
  const spaceBelow = window.innerHeight - rect.bottom - MARGIN

  let top: number
  if (spaceAbove >= PICKER_HEIGHT) {
    top = rect.top - PICKER_HEIGHT - 6
  } else if (spaceBelow >= PICKER_HEIGHT) {
    top = rect.bottom + 6
  } else {
    if (spaceAbove >= spaceBelow) {
      top = Math.max(MARGIN, rect.top - PICKER_HEIGHT - 6)
    } else {
      top = Math.min(window.innerHeight - PICKER_HEIGHT - MARGIN, rect.bottom + 6)
    }
  }

  return { top, left }
}

export function DirectMessageThread({ target, onBack, className }: DirectMessageThreadProps) {
  const { nguoiDung } = usePhien()
  const {
    socialState,
    friendsPresence,
    presenceReady,
    sendFriendRequest,
    rooms,
  } = useCampusContext()

  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [reactions, setReactions] = useState<Record<number, string[]>>({})
  const [reactionDetails, setReactionDetails] = useState<Record<number, ReactionDetail[]>>({})
  const [reactingState, setReactingState] = useState<{
    msgId: number
    replaceIndex?: number
    anchorRect?: AnchorRect
  } | null>(null)
  const { zIndex: emojiPickerZIndex, bringToFront: bringEmojiPickerToFront } = useTopLayerZIndex(reactingState !== null, 'popover')
  const [moPickerEmoji, setMoPickerEmoji] = useState(false)
  const [tinCanThuHoi, setTinCanThuHoi] = useState<DirectMessage | null>(null)
  const [idDangThuHoi, setIdDangThuHoi] = useState<number | null>(null)

  const myId = nguoiDung?.accountId
  const [hiddenMsgIds, setHiddenMsgIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined' || !myId) return new Set()
    try {
      const raw = localStorage.getItem(`c10a7_dm_hidden_${myId}_${target.id}`)
      if (!raw) return new Set()
      const arr = JSON.parse(raw)
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noiDung, setNoiDung] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [dangKetBan, setDangKetBan] = useState(false)
  const [taiLaiCount, setTaiLaiCount] = useState(0)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const [bayGio, setBayGio] = useState(() => Date.now())

  const khungRef = useRef<HTMLDivElement | null>(null)
  const daCuonLanDau = useRef(false)
  const oDayRef = useRef(true)
  const [oDay, setODay] = useState(true)

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  // VÙNG 2: Ẩn dấu 3 chấm nếu không hover, hiện trong 3s nếu hover vào tin nhắn 1s
  const [visibleDotsMsgIds, setVisibleDotsMsgIds] = useState<Set<number>>(() => new Set())
  const [openDropdownMsgId, setOpenDropdownMsgId] = useState<number | null>(null)
  const hoverEnterTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const autoHideTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const handleMessageMouseEnter = useCallback((msgId: number) => {
    if (visibleDotsMsgIds.has(msgId)) return
    const existingEnterTimer = hoverEnterTimersRef.current.get(msgId)
    if (existingEnterTimer) clearTimeout(existingEnterTimer)

    const enterTimer = setTimeout(() => {
      setVisibleDotsMsgIds((prev) => new Set(prev).add(msgId))
      hoverEnterTimersRef.current.delete(msgId)

      const hideTimer = setTimeout(() => {
        setVisibleDotsMsgIds((prev) => {
          const next = new Set(prev)
          next.delete(msgId)
          return next
        })
        autoHideTimersRef.current.delete(msgId)
      }, 3000)
      autoHideTimersRef.current.set(msgId, hideTimer)
    }, 1000)
    hoverEnterTimersRef.current.set(msgId, enterTimer)
  }, [visibleDotsMsgIds])

  const handleMessageMouseLeave = useCallback((msgId: number) => {
    const enterTimer = hoverEnterTimersRef.current.get(msgId)
    if (enterTimer) {
      clearTimeout(enterTimer)
      hoverEnterTimersRef.current.delete(msgId)
    }
  }, [])

  // Kiểm tra mối quan hệ bạn bè từ socialState authoritative
  const isFriend = useMemo(() => {
    return (socialState?.friends ?? []).some((f) => f.id === target.id)
  }, [socialState?.friends, target.id])

  // Trạng thái presence của bạn bè
  const presence = presenceReady ? friendsPresence[target.id] : undefined
  const presenceState = presenceReady ? (presence?.state ?? 'offline') : 'unknown'
  const isOnline = presenceState === 'online'
  const isAway = presenceState === 'away'
  const activity = presenceReady ? presence?.activity : undefined

  // VÙNG 1: Dưới tên người dùng hiển thị mục nào, phòng bao nhiêu, tên phòng
  const moTaViTri = useMemo(() => {
    if (!presenceReady) return 'Đang đồng bộ trạng thái…'
    if (!activity) {
      if (isOnline) return 'Đang trực tuyến'
      if (isAway) return 'Đang tạm vắng'
      return formatLastSeen(presence?.lastSeen ?? null)
    }

    if (activity.type === 'room') {
      const isGame = activity.area === 'game'
      const muc = isGame ? 'Game' : 'Học tập'
      const rId = activity.roomId || rooms?.find((r) => r.ten === activity.roomTitle)?.id
      const ten = activity.roomTitle || rooms?.find((r) => r.id === rId)?.ten || ''

      if (rId && ten) {
        const tenDaCoSo = ten.toLowerCase().includes(`phòng #${rId}`) || ten.toLowerCase().includes(`phòng ${rId}`)
        return tenDaCoSo ? `${muc} • ${ten}` : `${muc} • Phòng #${rId} • ${ten}`
      }
      if (rId) return `${muc} • Phòng #${rId}`
      if (ten) return `${muc} • ${ten}`
      return `${muc} • Đang trong phòng`
    }

    if (activity.type === 'game' || activity.area === 'game') return 'Game'
    if (activity.type === 'learn' || activity.area === 'learn') return 'Học tập'
    if (activity.type === 'community' || activity.area === 'community') return 'Cộng đồng'
    if (activity.type === 'home' || activity.area === 'home') return 'Trang chủ'
    if (activity.type === 'lobby') return 'Sảnh Campus'

    return isOnline ? 'Đang trực tuyến' : isAway ? 'Đang tạm vắng' : formatLastSeen(presence?.lastSeen ?? null)
  }, [presenceReady, activity, isOnline, isAway, presence?.lastSeen, rooms])

  // Định kỳ cập nhật thời gian
  useEffect(() => {
    const timer = setInterval(() => setBayGio(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Tải danh sách tin nhắn và biểu cảm từ máy chủ kèm bộ nhớ cục bộ
  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    layTinNhanRieng(target.id)
      .then((res) => {
        if (!active) return
        setMessages(res.messages.filter((m) => !hiddenMsgIds.has(m.id)))

        let savedLocal: Record<number, string[]> = {}
        try {
          const raw = localStorage.getItem(`c10a7_dm_reactions_${target.id}`)
          if (raw) savedLocal = JSON.parse(raw)
        } catch {}

        const merged: Record<number, string[]> = { ...savedLocal, ...(res.reactions || {}) }
        const cleaned: Record<number, string[]> = {}
        for (const [k, v] of Object.entries(merged)) {
          if (Array.isArray(v)) {
            cleaned[Number(k)] = v.slice(0, 3)
          }
        }

        setReactions(cleaned)
        setReactionDetails(res.reactionDetails || {})
        setIsLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Không tải được tin nhắn')
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [target.id, taiLaiCount])

  // Lắng nghe tin nhắn mới từ WebSocket
  useEffect(() => {
    const handleDm = (e: Event) => {
      const ce = e as CustomEvent<DirectMessage>
      const newMsg = ce.detail
      if (!newMsg) return
      if (newMsg.senderId !== target.id && newMsg.receiverId !== target.id) return
      if (hiddenMsgIds.has(newMsg.id)) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    }

    window.addEventListener('campus:direct_message', handleDm)
    return () => window.removeEventListener('campus:direct_message', handleDm)
  }, [target.id])

  // Lắng nghe sự kiện xoá tin nhắn riêng realtime
  useEffect(() => {
    const handleDmDeleted = (e: Event) => {
      const ce = e as CustomEvent<{
        messageId: number
        friendId?: number
        senderId?: number
      }>
      const payload = ce.detail
      if (!payload) return
      if (payload.friendId !== target.id && payload.senderId !== target.id) return

      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId))
    }

    window.addEventListener('campus:direct_message_deleted', handleDmDeleted)
    return () => window.removeEventListener('campus:direct_message_deleted', handleDmDeleted)
  }, [target.id])

  // Lắng nghe cập nhật reaction tin nhắn riêng realtime
  useEffect(() => {
    const handleReaction = (e: Event) => {
      const ce = e as CustomEvent<{
        messageId: number
        reactions: string[]
        reactionDetails?: ReactionDetail[]
        targetId?: number
        friendId?: number
      }>
      const payload = ce.detail
      if (!payload) return
      if (payload.targetId !== target.id && payload.friendId !== target.id) return

      const validEmojis = (payload.reactions || []).slice(0, 3)

      setReactions((prev) => {
        const next = { ...prev, [payload.messageId]: validEmojis }
        try {
          localStorage.setItem(`c10a7_dm_reactions_${target.id}`, JSON.stringify(next))
        } catch {}
        return next
      })

      if (payload.reactionDetails) {
        setReactionDetails((prev) => ({
          ...prev,
          [payload.messageId]: payload.reactionDetails!,
        }))
      }
    }

    window.addEventListener('campus:direct_message_reaction', handleReaction)
    return () => window.removeEventListener('campus:direct_message_reaction', handleReaction)
  }, [target.id])

  // Đóng bảng chọn cảm xúc khi bấm ra ngoài hoặc cuộn / resize
  useEffect(() => {
    if (!reactingState) return
    const handleClickOutside = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement
      if (
        !targetEl.closest('[data-emoji-picker]') &&
        !targetEl.closest('[data-emoji-trigger]') &&
        !targetEl.closest('[data-emoji-pill-item]')
      ) {
        setReactingState(null)
      }
    }
    const handleResize = () => setReactingState(null)
    window.addEventListener('pointerdown', handleClickOutside)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [reactingState])

  // Theo dõi vị trí cuộn: đóng picker khi cuộn để không bị trôi lệch
  const xuLyCuon = () => {
    if (reactingState) setReactingState(null)
    const el = khungRef.current
    if (!el) return
    const khoangCachDay = el.scrollHeight - el.scrollTop - el.clientHeight
    const dangODay = khoangCachDay < NGUONG_DAY_PX
    oDayRef.current = dangODay
    setODay(dangODay)
  }

  // Tự động cuộn xuống đáy khi có tin nhắn mới nếu người dùng đang ở đáy
  useLayoutEffect(() => {
    const el = khungRef.current
    if (!el) return

    if (!daCuonLanDau.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight
      daCuonLanDau.current = true
      return
    }

    if (oDayRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const cuonXuongDay = () => {
    const el = khungRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    oDayRef.current = true
    setODay(true)
  }

  // Chọn hoặc đổi emoji: hiển thị tối đa 3 emoji ở ngoài tin nhắn, cho phép chọn bất kỳ emoji nào
  const handleSelectEmoji = (msgId: number, selectedEmoji: string) => {
    const current = reactions[msgId] || []
    let next: string[]

    if (reactingState?.replaceIndex !== undefined) {
      const oldEmoji = current[reactingState.replaceIndex]
      const otherEmojis = current.filter((_, idx) => idx !== reactingState.replaceIndex)
      if (otherEmojis.includes(selectedEmoji)) {
        toast.error('Emoji đã tồn tại')
        return
      }
      next = [...current]
      next[reactingState.replaceIndex] = selectedEmoji
      guiReactionTinNhanRieng(target.id, msgId, { action: 'replace', oldEmoji, emoji: selectedEmoji }).catch(() => {})
    } else {
      if (current.includes(selectedEmoji)) {
        next = current.filter((e) => e !== selectedEmoji)
        guiReactionTinNhanRieng(target.id, msgId, { action: 'remove', emoji: selectedEmoji }).catch(() => {})
      } else if (current.length >= 3) {
        const oldEmoji = current[2]
        next = [current[0], current[1], selectedEmoji]
        guiReactionTinNhanRieng(target.id, msgId, { action: 'replace', oldEmoji, emoji: selectedEmoji }).catch(() => {})
      } else {
        next = [...current, selectedEmoji]
        guiReactionTinNhanRieng(target.id, msgId, { action: 'add', emoji: selectedEmoji }).catch(() => {})
      }
    }

    const sanitized = Array.from(new Set(next)).slice(0, 3)

    setReactions((prev) => {
      const updated = { ...prev, [msgId]: sanitized }
      try {
        localStorage.setItem(`c10a7_dm_reactions_${target.id}`, JSON.stringify(updated))
      } catch {}
      return updated
    })

    setReactingState(null)
  }

  // Nhấn giữ im emoji (≥ 450ms) để đổi sang emoji khác
  const handlePointerDownEmoji = (
    msgId: number,
    idx: number,
    e?: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const emoji = reactions[msgId]?.[idx]
    if (emoji) {
      const details = reactionDetails[msgId]?.filter((d) => d.emoji === emoji) || []
      const isForbidden = details.length > 0 && !details.some((d) => d.users.some((u) => u.id === nguoiDung?.accountId))
      if (isForbidden) {
        toast.error('Chỉ sửa được biểu cảm của bạn')
        return
      }
    }

    const rect = e?.currentTarget?.getBoundingClientRect()
    const anchorRect = rect ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right } : undefined

    isLongPressRef.current = false
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40) } catch {}
      }
      setReactingState({ msgId, replaceIndex: idx, anchorRect })
    }, 450)
  }

  const handlePointerUpOrLeaveEmoji = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  // Nhấp đúp để xóa emoji
  const handleDeleteEmoji = (msgId: number, emoji: string) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }

    const details = reactionDetails[msgId]?.filter((d) => d.emoji === emoji) || []
    const isForbidden = details.length > 0 && !details.some((d) => d.users.some((u) => u.id === nguoiDung?.accountId))
    if (isForbidden) {
      toast.error('Chỉ sửa được biểu cảm của bạn')
      return
    }

    const current = reactions[msgId] || []
    const next = current.filter((e) => e !== emoji)

    setReactions((prev) => {
      const updated = { ...prev, [msgId]: next }
      try {
        localStorage.setItem(`c10a7_dm_reactions_${target.id}`, JSON.stringify(updated))
      } catch {}
      return updated
    })

    guiReactionTinNhanRieng(target.id, msgId, { action: 'remove', emoji }).catch(() => {})
    toast.info(`Đã gỡ ${emoji}`)
  }

  // Click 1 lần vào emoji để tăng số lượng (+1)
  const handleIncrementEmoji = async (msgId: number, emoji: string) => {
    // 1. Optimistic update
    setReactionDetails((prev) => {
      const list = prev[msgId] ? [...prev[msgId]] : []
      const found = list.find((d) => d.emoji === emoji)
      if (found) {
        found.count = (found.count || 1) + 1
        if (nguoiDung?.accountId && !found.users.some((u) => u.id === nguoiDung.accountId)) {
          found.users.push({ id: nguoiDung.accountId, name: nguoiDung.ten || nguoiDung.username || 'Bạn' })
        }
      } else {
        list.push({
          emoji,
          count: 2,
          users: nguoiDung?.accountId ? [{ id: nguoiDung.accountId, name: nguoiDung.ten || nguoiDung.username || 'Bạn' }] : [],
        })
      }
      return { ...prev, [msgId]: list }
    })

    // 2. Authoritative update
    try {
      const res = await guiReactionTinNhanRieng(target.id, msgId, { action: 'increment', emoji })
      if (res.ok) {
        if (res.reactions) {
          setReactions((prev) => ({ ...prev, [msgId]: res.reactions.slice(0, 3) }))
        }
        if (res.reactionDetails) {
          setReactionDetails((prev) => ({ ...prev, [msgId]: res.reactionDetails || [] }))
        }
      }
    } catch {}
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = noiDung.trim()
    if (!text || dangGui || !isFriend) return

    setDangGui(true)
    try {
      const newMsg = await guiTinNhanRieng(target.id, text)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setNoiDung('')
    } catch {
      toast.error('Gửi tin thất bại')
    } finally {
      setDangGui(false)
    }
  }

  const handleSendFriendRequest = async () => {
    setDangKetBan(true)
    try {
      const res = await sendFriendRequest(target.id)
      if (res.ok) {
        toast.success('Đã gửi lời mời')
      } else {
        toast.error('Gửi lời mời thất bại')
      }
    } catch {
      toast.error('Gửi lời mời thất bại')
    } finally {
      setDangKetBan(false)
    }
  }

  const xacNhanThuHoi = async () => {
    const tin = tinCanThuHoi
    if (!tin || idDangThuHoi !== null) return
    setIdDangThuHoi(tin.id)
    try {
      const kq = await xoaTinNhanRieng(target.id, tin.id)
      if (kq.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tin.id))
        toast.success('Đã thu hồi tin nhắn')
      }
    } catch {
      toast.error('Không thu hồi được tin nhắn')
    } finally {
      setIdDangThuHoi(null)
      setTinCanThuHoi(null)
    }
  }

  const xoaTinPhiaToi = (msgId: number) => {
    setHiddenMsgIds((prev) => {
      const next = new Set(prev)
      next.add(msgId)
      if (myId) {
        try {
          localStorage.setItem(`c10a7_dm_hidden_${myId}_${target.id}`, JSON.stringify(Array.from(next)))
        } catch {}
      }
      return next
    })
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
    toast.success('Đã xóa tin nhắn ở phía bạn')
  }

  const hopLeMessages = useMemo(
    () => messages.filter((m) => !m.noiDung.trim().startsWith('[SYS_')),
    [messages],
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-canvas', className)}>
      {/* 1. Header cuộc trò chuyện: Bấm avatar hoặc tên mở hồ sơ trực tiếp (group/user-header) */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setNguoiXem({
              id: target.id,
              ten: target.displayName,
              lopTen: target.lopTen,
              avatar: target.avatar,
              anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
            })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const rect = e.currentTarget.getBoundingClientRect()
              setNguoiXem({
                id: target.id,
                ten: target.displayName,
                lopTen: target.lopTen,
                avatar: target.avatar,
                anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
              })
            }
          }}
          className="group/user-header flex min-w-0 flex-1 items-center gap-3 cursor-pointer text-left focus-visible:outline-none"
        >
          {onBack && (
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={(e) => {
                e.stopPropagation()
                onBack()
              }}
              className="-ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors duration-150"
              aria-label="Quay lại danh sách bạn bè"
              title="Quay lại danh sách bạn bè"
            >
              <ArrowLeft className="size-4.5" />
            </Button>
          )}

          <div className="relative shrink-0">
            <AnhNguoiDung ten={target.displayName} avatar={target.avatar} className="size-10 text-sm transition-transform group-hover/user-header:scale-105" />
            <span
              className={cn(
                'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
                !presenceReady
                  ? 'bg-slate-500'
                  : isOnline
                    ? 'bg-emerald-500'
                    : isAway
                      ? 'bg-amber-400'
                      : 'bg-slate-500',
              )}
              title={
                !presenceReady
                  ? 'Đang kết nối lại'
                  : isOnline
                    ? 'Trực tuyến'
                    : isAway
                      ? 'Tạm vắng'
                      : 'Ngoại tuyến'
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-text-primary group-hover/user-header:text-brand transition-colors">
                {target.displayName}
              </h2>
              {target.lopTen && (
                <span className="shrink-0 rounded-md bg-surface-overlay px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary">
                  {target.lopTen}
                </span>
              )}
            </div>

            <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
              {!presenceReady ? (
                <>
                  <Clock className="size-3 shrink-0" />
                  <span>Đang đồng bộ trạng thái…</span>
                </>
              ) : activity ? (
                <>
                  <Radio className="size-3 shrink-0 text-success" />
                  <span className="truncate text-success font-medium" title={moTaViTri}>
                    {moTaViTri}
                  </span>
                </>
              ) : (
                <span
                  className={cn(
                    isOnline ? 'text-success font-medium' : isAway ? 'text-warning' : 'text-text-tertiary',
                  )}
                  title={moTaViTri}
                >
                  {moTaViTri}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Cảnh báo nếu chưa kết bạn */}
      {!isFriend && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-warning/20 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          <p className="truncate">Hai bạn chưa là bạn bè. Hãy kết bạn để gửi tin nhắn.</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs border-warning/30 hover:bg-warning/20"
            disabled={dangKetBan}
            onClick={handleSendFriendRequest}
          >
            {dangKetBan ? <Loader2 className="size-3 animate-spin" /> : <UserPlus className="size-3" />}
            Kết bạn
          </Button>
        </div>
      )}

      {/* 3. Vùng danh sách tin nhắn */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={khungRef}
          onScroll={xuLyCuon}
          role="log"
          aria-label={`Tin nhắn với ${target.displayName}`}
          className="styled-scrollbar h-full overflow-y-auto overscroll-contain px-3 py-2 sm:px-4 sm:py-3 touch-pan-y"
          style={{ overflowAnchor: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center text-text-tertiary">
              <Loader2 className="size-6 animate-spin mb-2" />
              <p className="text-xs">Đang tải cuộc trò chuyện…</p>
            </div>
          ) : error && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="size-5" />
              </span>
              <p className="text-sm font-semibold text-text-primary">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setTaiLaiCount((c) => c + 1)}>
                Thử lại
              </Button>
            </div>
          ) : hopLeMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-raised text-text-tertiary mb-3">
                <MessageSquare className="size-5" />
              </span>
              <p className="text-sm font-semibold text-text-primary">Bắt đầu cuộc trò chuyện</p>
              <p className="mt-1 max-w-64 text-xs leading-relaxed text-text-tertiary">
                Gửi lời chào đầu tiên tới {target.displayName}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {hopLeMessages.map((msg, idx) => {
                const tinTruoc = idx > 0 ? hopLeMessages[idx - 1] : null
                const doiNgay = !tinTruoc || !cungNgay(tinTruoc.taoLuc, msg.taoLuc)
                const cungNguoi =
                  tinTruoc &&
                  tinTruoc.senderId === msg.senderId &&
                  !doiNgay &&
                  msg.taoLuc - tinTruoc.taoLuc < GOP_TIN_TRONG_MS
                const laCuaMinh = msg.senderId === nguoiDung?.accountId
                const msgReactions = (reactions[msg.id] || []).slice(0, 3)

                return (
                  <div key={msg.id} className="space-y-1">
                    {doiNgay && (
                      <div className="my-3 flex items-center justify-center">
                        <span className="rounded-full bg-surface-raised px-3 py-1 text-[11px] font-medium text-text-tertiary">
                          {nhanNgay(msg.taoLuc, bayGio)}
                        </span>
                      </div>
                    )}

                    <div
                      onMouseEnter={() => handleMessageMouseEnter(msg.id)}
                      onMouseLeave={() => handleMessageMouseLeave(msg.id)}
                      className={cn(
                        'flex items-end gap-1.5 group',
                        laCuaMinh ? 'flex-row-reverse' : 'flex-row',
                        cungNguoi ? 'mt-1' : 'mt-3',
                      )}
                    >
                      {/* Avatar người gửi khác (bấm vào mở hồ sơ người dùng trên cùng) */}
                      {!laCuaMinh && (
                        <div className="w-7 shrink-0">
                          {!cungNguoi ? (
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                setReactingState(null)
                                setMoPickerEmoji(false)
                                const rect = e.currentTarget.getBoundingClientRect()
                                setNguoiXem((prev) => {
                                  if (prev && prev.id === target.id) return null
                                  return {
                                    id: target.id,
                                    ten: target.displayName,
                                    lopTen: target.lopTen,
                                    avatar: target.avatar,
                                    anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                                  }
                                })
                              }}
                              className="block rounded-full transition-transform hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                              title={`Hồ sơ ${target.displayName}`}
                              aria-label={`Hồ sơ ${target.displayName}`}
                            >
                              <AnhNguoiDung
                                ten={target.displayName}
                                avatar={target.avatar}
                                className="size-7 text-[10px]"
                              />
                            </button>
                          ) : (
                            <div className="size-7" />
                          )}
                        </div>
                      )}

                      {/* Khối tin nhắn & Cảm xúc */}
                      <div
                        className={cn(
                          'flex flex-col relative group/card max-w-[85%] sm:max-w-[82%] w-fit',
                          laCuaMinh ? 'items-end' : 'items-start',
                        )}
                      >
                        {/* Hàng ngang chứa Card tin nhắn và Nút 3 chấm NẰM SÁT CẠNH BÊN CARD TIN NHẮN */}
                        <div
                          className={cn(
                            'flex items-center gap-1.5 max-w-full flex-nowrap',
                            laCuaMinh ? 'flex-row-reverse' : 'flex-row',
                          )}
                        >
                          {/* Card tin nhắn */}
                          <div
                            className={cn(
                              'min-w-0 max-w-full min-w-[5.5rem] rounded-2xl px-3 py-2 text-[0.8125rem] leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word] text-text-primary relative shrink',
                              laCuaMinh ? 'rounded-br-md bg-brand/15' : 'rounded-bl-md bg-surface-raised',
                            )}
                          >
                            {(() => {
                              const invite = parseGameInvite(msg.noiDung)
                              if (invite) {
                                return <GameInviteBubble invite={invite} isMe={laCuaMinh} />
                              }
                              return (
                                <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                                  {msg.noiDung}
                                </p>
                              )
                            })()}

                            {/* Dòng thời gian và icon thả emoji (ở góc phải dưới bubble chuẩn quốc tế) */}
                            <div className="mt-1 flex items-center justify-end gap-1.5 pt-0.5 select-none relative">
                              <time
                                dateTime={new Date(msg.taoLuc).toISOString()}
                                className="text-[10px] text-text-tertiary tabular-nums leading-none"
                                title={new Date(msg.taoLuc).toLocaleString('vi-VN')}
                              >
                                {DINH_DANG_GIO.format(msg.taoLuc)}
                              </time>

                              <div className="relative inline-flex items-center">
                                <button
                                  type="button"
                                  data-emoji-trigger={msg.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMoPickerEmoji(false)
                                    setNguoiXem(null)
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setReactingState((cur) =>
                                      cur?.msgId === msg.id && cur.replaceIndex === undefined
                                        ? null
                                        : {
                                            msgId: msg.id,
                                            anchorRect: {
                                              top: rect.top,
                                              bottom: rect.bottom,
                                              left: rect.left,
                                              right: rect.right,
                                            },
                                          },
                                    )
                                  }}
                                  className="inline-flex items-center justify-center size-4 rounded-full text-text-tertiary hover:text-amber-400 hover:bg-surface-overlay transition-colors cursor-pointer"
                                  title="Bày tỏ cảm xúc"
                                  aria-label="Bày tỏ cảm xúc với tin nhắn"
                                >
                                  <Smile className="size-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Nút 3 dấu chấm dọc NẰM SÁT VÀO CẠNH BÊN CARD TIN NHẮN (dù tin nhắn hay emoji dài cỡ nào) */}
                          <div className="shrink-0 self-center">
                            {(() => {
                              const isDotsVisible = visibleDotsMsgIds.has(msg.id) || openDropdownMsgId === msg.id
                              return (
                                <DropdownMenu
                                  open={openDropdownMsgId === msg.id}
                                  onOpenChange={(isOpen) => setOpenDropdownMsgId(isOpen ? msg.id : null)}
                                >
                                  <DropdownMenuTrigger
                                    data-msg-action-trigger={msg.id}
                                    className={cn(
                                      'size-7 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-opacity duration-150 cursor-pointer',
                                      isDotsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                                    )}
                                    title="Thao tác tin nhắn"
                                    aria-label="Thao tác tin nhắn"
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align={laCuaMinh ? 'end' : 'start'} side="top" sideOffset={4} className="w-44 p-1">
                                    {laCuaMinh && (
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setTinCanThuHoi(msg)}
                                        className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-medium"
                                      >
                                        <Undo2 className="size-4 shrink-0" />
                                        <span>Thu hồi tin nhắn</span>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => xoaTinPhiaToi(msg.id)}
                                      className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-medium text-text-primary hover:text-text-primary"
                                    >
                                      <EyeOff className="size-4 shrink-0 text-text-secondary" />
                                      <span>Xóa ở phía tôi</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        navigator.clipboard.writeText(msg.noiDung)
                                        toast.success('Đã sao chép nội dung')
                                      }}
                                      className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-medium text-text-primary hover:text-text-primary"
                                    >
                                      <Copy className="size-4 shrink-0 text-text-secondary" />
                                      <span>Sao chép</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Thanh con nhộng cảm xúc (Pill tối đa 3 emoji hiển thị ở ngoài tin nhắn, nằm dưới bubble, không đè nội dung) */}
                        {msgReactions.length > 0 && (
                          <div
                            data-testid={`reactions-${msg.id}`}
                            className={cn(
                              'relative -mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap select-none max-w-none z-10 w-fit shrink-0',
                              laCuaMinh ? 'justify-end pr-2' : 'justify-start pl-2',
                              laCuaMinh ? 'self-end' : 'self-start',
                            )}
                          >
                            <div className="inline-flex items-center gap-0.5 rounded-full bg-surface-raised/95 border border-border-default/90 shadow-sm px-1.5 py-0.5 w-fit shrink-0">
                              {msgReactions.slice(0, 3).map((emoji, eIdx) => {
                                const details = reactionDetails[msg.id]?.filter((d) => d.emoji === emoji) || []
                                const detail = reactionDetails[msg.id]?.find((d) => d.emoji === emoji)
                                const count = detail && typeof detail.count === 'number' && detail.count > 0 ? detail.count : 1
                                const isForbidden = details.length > 0 && !details.some((d) => d.users.some((u) => u.id === nguoiDung?.accountId))

                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    data-emoji-pill-item={eIdx}
                                    data-forbidden={isForbidden ? 'true' : undefined}
                                    onPointerDown={(e) => handlePointerDownEmoji(msg.id, eIdx, e)}
                                    onPointerUp={handlePointerUpOrLeaveEmoji}
                                    onPointerLeave={handlePointerUpOrLeaveEmoji}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      handleDeleteEmoji(msg.id, emoji)
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isLongPressRef.current) {
                                        isLongPressRef.current = false
                                        return
                                      }
                                      if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
                                      clickTimerRef.current = setTimeout(() => {
                                        clickTimerRef.current = null
                                        handleIncrementEmoji(msg.id, emoji)
                                      }, 220)
                                    }}
                                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full hover:bg-surface-overlay transition-colors cursor-pointer select-none shrink-0"
                                    title={isForbidden ? 'Biểu cảm của người khác' : 'Click để tăng (+1), nhấn giữ để đổi emoji, nhấp đúp để xóa'}
                                    aria-label={`Thả ${emoji} • Click để tăng (+1), nhấn giữ để đổi, nhấp đúp để xóa`}
                                  >
                                    <span className="text-[13px] leading-none">{emoji}</span>
                                    <span className="text-[10px] font-bold text-text-secondary leading-none tabular-nums">
                                      {count}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bảng chọn cảm xúc emoji nổi: Portal ra document.body để luôn nổi lên trên cùng, đè tất cả các card */}
        {reactingState && typeof document !== 'undefined' && createPortal(
          (() => {
            const msg = messages.find((m) => m.id === reactingState.msgId)
            if (!msg) return null
            const laCuaMinh = msg.senderId === nguoiDung?.accountId
            const pos = getPickerPosition(reactingState.anchorRect, laCuaMinh)
            const isReplacing = reactingState.replaceIndex !== undefined
            const currentEmojis = reactions[msg.id] || []

            return (
              <div
                data-emoji-picker={msg.id}
                style={{
                  position: 'fixed',
                  top: `${pos.top}px`,
                  left: `${pos.left}px`,
                  zIndex: Math.max(emojiPickerZIndex, 9999),
                }}
                onPointerDownCapture={bringEmojiPickerToFront}
                className="flex flex-col p-2.5 rounded-2xl bg-surface/98 border border-border-default shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 w-64 max-w-[calc(100vw-1.5rem)] select-none pointer-events-auto"
              >
                <div className="px-1 pb-1.5 mb-1.5 border-b border-border-subtle text-[11px] font-medium text-text-secondary flex items-center justify-between gap-2">
                  <span>{isReplacing ? 'Đổi biểu cảm' : 'Bày tỏ cảm xúc'}</span>
                  <span className="text-[10px] text-text-tertiary">Hiện tối đa 3 ngoài tin</span>
                </div>
                <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto overflow-x-hidden styled-scrollbar p-0.5">
                  {ALL_REACTION_EMOJIS.map((emoji) => {
                    const isCurrent = currentEmojis.includes(emoji)
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectEmoji(msg.id, emoji)
                        }}
                        className={cn(
                          'flex size-8.5 items-center justify-center rounded-lg transition-transform text-lg cursor-pointer select-none',
                          isCurrent
                            ? 'bg-brand/25 ring-1 ring-brand scale-110'
                            : 'hover:bg-surface-overlay active:scale-90 hover:scale-120',
                        )}
                        title={`Thả ${emoji}`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })(),
          document.body
        )}

        {/* Nút nhảy xuống đáy khi có tin mới */}
        {!oDay && (
          <Button
            size="sm"
            onClick={cuonXuongDay}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 gap-1 rounded-full shadow-lg bg-surface border border-border-default text-text-primary hover:bg-surface-raised"
          >
            <ArrowDown className="size-3.5" />
            <span>Tin nhắn mới</span>
          </Button>
        )}
      </div>

      {/* 4. Khung soạn tin nhắn */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-border-subtle bg-surface p-2.5 sm:p-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2">
          {/* Nút chèn biểu cảm */}
          <Popover
            open={moPickerEmoji}
            onOpenChange={(mo) => {
              if (mo) {
                setReactingState(null)
                setNguoiXem(null)
              }
              setMoPickerEmoji(mo)
            }}
          >
            <PopoverTrigger
              type="button"
              data-testid="dm-emoji-trigger"
              onClick={() => {
                setReactingState(null)
                setNguoiXem(null)
                setMoPickerEmoji((prev) => !prev)
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
              title="Biểu cảm"
              aria-label="Chọn biểu cảm"
            >
              <Smile className="size-5" />
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0c1322] border border-border-default shadow-2xl rounded-xl z-[150]">
              <div className="grid grid-cols-6 gap-1">
                {DANH_SACH_EMOJI.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setNoiDung((p) => p + em)
                      setMoPickerEmoji(false)
                    }}
                    className="flex size-9 items-center justify-center rounded-lg text-lg hover:bg-surface-raised transition-colors active:scale-95 cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Ô nhập nội dung */}
          <input
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value.slice(0, 500))}
            placeholder={isFriend ? `Nhắn tin cho ${target.displayName}…` : 'Kết bạn để nhắn tin…'}
            disabled={!isFriend}
            maxLength={500}
            className="h-10 min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-raised px-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none transition-colors disabled:opacity-60 [overflow-wrap:anywhere] break-words"
            enterKeyHint="send"
            autoComplete="off"
            aria-label={`Soạn tin nhắn gửi cho ${target.displayName}`}
          />

          {/* Nút gửi */}
          <Button
            type="submit"
            size="icon"
            disabled={!isFriend || !noiDung.trim() || dangGui}
            className="size-10 shrink-0 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 transition-colors"
            aria-label="Gửi tin nhắn"
          >
            {dangGui ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
          </Button>
        </div>
      </form>

      {/* Popover xem hồ sơ khi bấm avatar/header */}
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />

      {/* Hộp thoại xác nhận thu hồi tin nhắn riêng */}
      <AlertDialog
        open={tinCanThuHoi !== null}
        onOpenChange={(mo) => {
          if (!mo && idDangThuHoi === null) setTinCanThuHoi(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Thu hồi tin nhắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Tin nhắn này sẽ được thu hồi đối với tất cả mọi người trong cuộc trò chuyện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={idDangThuHoi !== null}>Huỷ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={idDangThuHoi !== null} onClick={xacNhanThuHoi}>
              {idDangThuHoi !== null && <Loader2 className="animate-spin" />}
              Thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
