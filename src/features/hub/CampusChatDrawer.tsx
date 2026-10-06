import { createPortal } from 'react-dom'
import { useTopLayerZIndex } from '@/lib/top-layer'
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
import { Button } from '@/components/ui/button'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import { guiReactionCampusChat } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { TinCampus } from '@shared/protocol/campus'
import { CHAT_CAMPUS } from '@shared/rooms/constants'
import { ArrowDown, Copy, EyeOff, Lightbulb, Loader2, MessageSquare, MoreVertical, SendHorizontal, Smile, Sparkles, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GameInviteBubble, parseGameInvite } from '@/components/chat/GameInviteBubble'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { usePhien } from '@/app/phien'

const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '🎉', '👏', '😮', '😢', '💯', '✨', '🙏', '😍']
const EXTRA_EMOJIS = [
  '🚀', '💡', '🎓', '🏆', '⭐', '💪',
  '🤝', '🥳', '😎', '🤩', '🎯', '📚',
  '⚡', '🌟', '🥰', '🙌', '👀', '🤯',
  '💖', '💐', '✌️', '🫡', '🎮', '☕',
]
const ALL_REACTION_EMOJIS = [...QUICK_EMOJIS, ...EXTRA_EMOJIS]

const DANH_SACH_EMOJI = [
  '😊', '😂', '🔥', '👍', '👏', '🎉',
  '❤️', '🏆', '♟️', '🏮', '🎯', '⚡',
  '🚀', '😎', '🤝', '🙌', '💯', '✨',
  '🤩', '💪', '🎮', '✌️', '🫡', '👀'
]

interface CampusChatDrawerProps {
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  onSendMessage: (text: string) => Promise<KetQuaThaoTac>
  onDeleteMessage: (id: number) => Promise<KetQuaThaoTac>
  className?: string
  hideHeader?: boolean
  hideInput?: boolean
  placeholder?: string
  emptyMessage?: string
  scope?: 'campus' | 'room'
  roomId?: string
}

/** Tin liên tiếp của cùng một người trong khoảng này được gộp dưới một tên. */
const GOP_TIN_TRONG_MS = 5 * 60 * 1000
/** Cách đáy dưới mức này thì coi như đang xem tin mới nhất (tin mới đến sẽ tự cuộn theo). */
const NGUONG_DAY_PX = 80

const DINH_DANG_GIO = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const DINH_DANG_NGAY = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })

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

function getPickerPosition(rect?: AnchorRect | null, laCuaMinh = false): { top: number; left: number; width: number } {
  if (!rect || typeof window === 'undefined') {
    return { top: 120, left: 60, width: 264 }
  }

  const PICKER_WIDTH = 264
  const PICKER_HEIGHT = 224
  const MARGIN = 12

  let left = laCuaMinh ? rect.right - PICKER_WIDTH : rect.left
  const maxLeft = Math.max(MARGIN, window.innerWidth - PICKER_WIDTH - MARGIN)
  left = Math.max(MARGIN, Math.min(left, maxLeft))

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

  return { top, left, width: PICKER_WIDTH }
}

interface ReactingState {
  msgId: number
  replaceIndex?: number
  anchorRect?: AnchorRect | null
}

const STORAGE_KEY_CAMPUS_CHAT_REACTIONS = 'c10a7_campus_chat_reactions'
const STORAGE_KEY_CAMPUS_REACTION_USERS = 'c10a7_campus_reaction_users_v2'
const STORAGE_KEY_CAMPUS_REACTION_COUNTS = 'c10a7_campus_reaction_counts_v1'

function loadSavedCampusReactionCounts(): Record<number, Record<string, number>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPUS_REACTION_COUNTS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadSavedCampusReactionUsers(): Record<number, Record<string, string[]>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPUS_REACTION_USERS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadSavedCampusReactions(): Record<number, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPUS_CHAT_REACTIONS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: Record<number, string[]> = {}
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k)
      if (isNaN(id)) continue
      if (Array.isArray(v)) {
        result[id] = v.filter((item): item is string => typeof item === 'string').slice(0, 3)
      } else if (typeof v === 'object' && v !== null) {
        result[id] = Object.keys(v).slice(0, 3)
      }
    }
    return result
  } catch {
    return {}
  }
}

export function CampusChatDrawer({
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
  className,
  hideHeader = false,
  hideInput = false,
  placeholder = 'Nhắn tới cả trường…',
  emptyMessage = 'Gửi lời chào đầu tiên tới thầy cô và các bạn trong trường.',
  scope = 'campus',
  roomId,
}: CampusChatDrawerProps) {
  const { nguoiDung } = usePhien()
  const [noiDung, setNoiDung] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [idDangXoa, setIdDangXoa] = useState<number | null>(null)
  const [tinCanXoa, setTinCanXoa] = useState<TinCampus | null>(null)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const [bayGio, setBayGio] = useState(() => Date.now())
  const khungRef = useRef<HTMLDivElement | null>(null)
  const daCuonLanDau = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const oDayRef = useRef(true)
  const [oDay, setODay] = useState(true)

  const isRoomScope = scope === 'room' || Boolean(roomId)
  const roomKey = roomId || 'default'
  const storageReactionsKey = isRoomScope ? `c10a7_room_reactions_${roomKey}` : STORAGE_KEY_CAMPUS_CHAT_REACTIONS
  const storageUsersKey = isRoomScope ? `c10a7_room_reaction_users_${roomKey}` : STORAGE_KEY_CAMPUS_REACTION_USERS
  const storageCountsKey = isRoomScope ? `c10a7_room_reaction_counts_${roomKey}` : STORAGE_KEY_CAMPUS_REACTION_COUNTS

  const [reactingState, setReactingState] = useState<ReactingState | null>(null)
  const { zIndex: emojiPickerZIndex, bringToFront: bringEmojiPickerToFront } = useTopLayerZIndex(
    Boolean(reactingState),
    'popover',
  )
  const [reactions, setReactions] = useState<Record<number, string[]>>(() => {
    if (isRoomScope) {
      try {
        const raw = localStorage.getItem(storageReactionsKey)
        if (raw) return JSON.parse(raw)
      } catch {}
      return {}
    }
    return loadSavedCampusReactions()
  })
  const [reactionUsers, setReactionUsers] = useState<Record<number, Record<string, string[]>>>(() => {
    if (isRoomScope) {
      try {
        const raw = localStorage.getItem(storageUsersKey)
        if (raw) return JSON.parse(raw)
      } catch {}
      return {}
    }
    return loadSavedCampusReactionUsers()
  })
  const [reactionCounts, setReactionCounts] = useState<Record<number, Record<string, number>>>(() => {
    if (isRoomScope) {
      try {
        const raw = localStorage.getItem(storageCountsKey)
        if (raw) return JSON.parse(raw)
      } catch {}
      return {}
    }
    return loadSavedCampusReactionCounts()
  })
  const [moPickerEmoji, setMoPickerEmoji] = useState(false)

  // Cập nhật reactions khi đổi room
  useEffect(() => {
    try {
      const rawReactions = localStorage.getItem(storageReactionsKey)
      if (rawReactions) {
        const parsed = JSON.parse(rawReactions)
        if (parsed && typeof parsed === 'object') {
          const res: Record<number, string[]> = {}
          for (const [k, v] of Object.entries(parsed)) {
            const id = Number(k)
            if (!isNaN(id) && Array.isArray(v)) res[id] = (v as string[]).slice(0, 3)
          }
          setReactions(res)
        }
      } else {
        setReactions(isRoomScope ? {} : loadSavedCampusReactions())
      }

      const rawUsers = localStorage.getItem(storageUsersKey)
      if (rawUsers) {
        setReactionUsers(JSON.parse(rawUsers))
      } else {
        setReactionUsers(isRoomScope ? {} : loadSavedCampusReactionUsers())
      }

      const rawCounts = localStorage.getItem(storageCountsKey)
      if (rawCounts) {
        setReactionCounts(JSON.parse(rawCounts))
      } else {
        setReactionCounts(isRoomScope ? {} : loadSavedCampusReactionCounts())
      }
    } catch {}
  }, [storageReactionsKey, storageUsersKey, storageCountsKey, isRoomScope])

  const EMOJI_CLICK_COOLDOWN_MS = 650
  const lastReactionTimeRef = useRef<Record<string, number>>({})
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'

  const [hiddenMsgIds, setHiddenMsgIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined' || !myPermissions?.accountId) return new Set()
    try {
      const raw = localStorage.getItem(`c10a7_campus_hidden_${myPermissions.accountId}`)
      if (!raw) return new Set()
      const arr = JSON.parse(raw)
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  })

  // Quản lý hiển thị nút 3 chấm: chỉ hiện sau khi hover 1s và tự ẩn sau 3s
  const [visibleDotsMsgIds, setVisibleDotsMsgIds] = useState<Set<number>>(() => new Set())
  const [openDropdownMsgId, setOpenDropdownMsgId] = useState<number | null>(null)
  const hoverEnterTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const autoHideTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const enterTimers = hoverEnterTimersRef.current
    const hideTimers = autoHideTimersRef.current
    return () => {
      enterTimers.forEach((t) => clearTimeout(t))
      hideTimers.forEach((t) => clearTimeout(t))
      enterTimers.clear()
      hideTimers.clear()
    }
  }, [])

  const handleMessageMouseEnter = useCallback((msgId: number) => {
    if (visibleDotsMsgIds.has(msgId) || hoverEnterTimersRef.current.has(msgId)) return
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

  const xoaTinPhiaToi = (msgId: number) => {
    setHiddenMsgIds((prev) => {
      const next = new Set(prev)
      next.add(msgId)
      if (myPermissions?.accountId) {
        try {
          localStorage.setItem(`c10a7_campus_hidden_${myPermissions.accountId}`, JSON.stringify(Array.from(next)))
        } catch {}
      }
      return next
    })
    toast.success('Đã xóa tin nhắn ở phía bạn')
  }

  const saveReactions = (msgId: number, nextEmojis: string[]) => {
    const sanitized = nextEmojis.slice(0, 3)
    setReactions((prev) => {
      const updated = {
        ...prev,
        [msgId]: sanitized,
      }
      try {
        localStorage.setItem(storageReactionsKey, JSON.stringify(updated))
      } catch {
        // safe fallback
      }
      return updated
    })

    if (!isRoomScope) {
      guiReactionCampusChat(msgId, sanitized).catch(() => {
        // safe fallback
      })
    } else {
      window.dispatchEvent(
        new CustomEvent('campus:room_reaction_sync', {
          detail: { roomId: roomKey, msgId, reactions: sanitized },
        }),
      )
    }
  }

  const handleSelectEmoji = (msgId: number, selectedEmoji: string) => {
    const key = `${msgId}:${selectedEmoji}`
    const now = Date.now()
    if (now - (lastReactionTimeRef.current[key] || 0) < EMOJI_CLICK_COOLDOWN_MS) {
      return
    }
    lastReactionTimeRef.current[key] = now

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
      if (!isRoomScope) {
        guiReactionCampusChat(msgId, { action: 'replace', oldEmoji, emoji: selectedEmoji }).catch(() => {})
      }
    } else {
      // Thêm cảm xúc mới từ icon Smile
      if (current.includes(selectedEmoji)) {
        next = current.filter((e) => e !== selectedEmoji)
        if (!isRoomScope) {
          guiReactionCampusChat(msgId, { action: 'remove', emoji: selectedEmoji }).catch(() => {})
        }
      } else if (current.length >= 3) {
        next = [current[0], current[1], selectedEmoji]
        if (!isRoomScope) {
          guiReactionCampusChat(msgId, { action: 'add', emoji: selectedEmoji }).catch(() => {})
        }
      } else {
        next = [...current, selectedEmoji]
        if (!isRoomScope) {
          guiReactionCampusChat(msgId, { action: 'add', emoji: selectedEmoji }).catch(() => {})
        }
      }
    }

    const sanitized = Array.from(new Set(next)).slice(0, 3)
    saveReactions(msgId, sanitized)

    let nextUsersMap: Record<string, string[]> = {}
    setReactionUsers((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      const users = msgMap[selectedEmoji] ? [...msgMap[selectedEmoji]] : []
      if (!users.includes(myName)) {
        users.push(myName)
      }
      msgMap[selectedEmoji] = users
      nextUsersMap = msgMap
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageUsersKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    let nextCountsMap: Record<string, number> = {}
    setReactionCounts((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      const cur = msgMap[selectedEmoji] || 0
      msgMap[selectedEmoji] = cur + 1
      nextCountsMap = msgMap
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageCountsKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    if (isRoomScope) {
      window.dispatchEvent(
        new CustomEvent('campus:room_reaction_sync', {
          detail: {
            roomId: roomKey,
            msgId,
            reactions: sanitized,
            users: nextUsersMap,
            counts: nextCountsMap,
          },
        }),
      )
    }

    setReactingState(null)

    // Khi người dùng thả emoji vào tin nhắn (nhất là tin nhắn cuối hoặc khi đang ở đáy):
    // Tự động cuộn mượt xuống đáy để lộ trọn vẹn pill emoji và tin nhắn, không để thanh trượt bị khựng.
    requestAnimationFrame(() => {
      const khung = khungRef.current
      if (khung && (oDayRef.current || msgId === idTinCuoi)) {
        khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
        oDayRef.current = true
        setODay(true)
      }
    })
  }

  // 1. Tăng số lượng emoji khi click thêm 1 lần nữa vào emoji đã thả
  const handleIncrementEmoji = (msgId: number, emoji: string) => {
    const key = `${msgId}:${emoji}`
    const now = Date.now()
    if (now - (lastReactionTimeRef.current[key] || 0) < EMOJI_CLICK_COOLDOWN_MS) {
      return
    }
    lastReactionTimeRef.current[key] = now

    setReactionCounts((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      const cur = msgMap[emoji] || 0
      msgMap[emoji] = cur + 1
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageCountsKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    setReactionUsers((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      const users = msgMap[emoji] ? [...msgMap[emoji]] : []
      if (!users.includes(myName)) {
        users.push(myName)
      }
      msgMap[emoji] = users
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageUsersKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    const current = reactions[msgId] || []
    if (!current.includes(emoji)) {
      setReactions((prev) => {
        const next = [...(prev[msgId] || []), emoji].slice(0, 3)
        return { ...prev, [msgId]: next }
      })
    }

    if (!isRoomScope) {
      guiReactionCampusChat(msgId, { action: 'increment', emoji }).catch(() => {})
    } else {
      window.dispatchEvent(
        new CustomEvent('campus:room_reaction_sync', {
          detail: {
            roomId: roomKey,
            msgId,
            reactions: reactions[msgId] || [emoji],
            users: { ...(reactionUsers[msgId] || {}), [emoji]: [...(reactionUsers[msgId]?.[emoji] || []), myName] },
            counts: { ...(reactionCounts[msgId] || {}), [emoji]: (reactionCounts[msgId]?.[emoji] || 0) + 1 },
          },
        }),
      )
    }

    requestAnimationFrame(() => {
      const khung = khungRef.current
      if (khung && (oDayRef.current || msgId === idTinCuoi)) {
        khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
      }
    })
  }

  useEffect(() => {
    if (!isRoomScope) return
    const handleRoomReactionSync = (e: Event) => {
      const ce = e as CustomEvent<{
        roomId: string
        msgId: number
        reactions?: string[]
        users?: Record<string, string[]>
        counts?: Record<string, number>
      }>
      if (ce.detail && ce.detail.roomId === roomKey) {
        if (ce.detail.reactions) {
          setReactions((prev) => ({
            ...prev,
            [ce.detail.msgId]: ce.detail.reactions!,
          }))
        }
        if (ce.detail.users) {
          setReactionUsers((prev) => ({
            ...prev,
            [ce.detail.msgId]: ce.detail.users!,
          }))
        }
        if (ce.detail.counts) {
          setReactionCounts((prev) => ({
            ...prev,
            [ce.detail.msgId]: ce.detail.counts!,
          }))
        }
      }
    }
    window.addEventListener('campus:room_reaction_sync', handleRoomReactionSync)
    return () => window.removeEventListener('campus:room_reaction_sync', handleRoomReactionSync)
  }, [isRoomScope, roomKey])

  // 2. Nhấn giữ im emoji (≥ 450ms) để đổi sang emoji khác
  const handlePointerDownEmoji = (msgId: number, idx: number, anchorRect?: AnchorRect) => {
    const emoji = reactions[msgId]?.[idx]
    if (emoji) {
      const users = reactionUsers[msgId]?.[emoji] || []
      const myNames = [nguoiDung?.ten, nguoiDung?.username, myName].filter(Boolean) as string[]
      const hasReacted = users.some((u) => myNames.includes(u))
      if (users.length > 0 && !hasReacted) {
        toast.error('Chỉ sửa được biểu cảm của bạn')
        return
      }
    }
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

  // 3. Double click để xóa hoàn toàn emoji đó
  const handleDeleteEmoji = (msgId: number, emoji: string) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }

    const users = reactionUsers[msgId]?.[emoji] || []
    const myNames = [nguoiDung?.ten, nguoiDung?.username, myName].filter(Boolean) as string[]
    const hasReacted = users.some((u) => myNames.includes(u))
    if (users.length > 0 && !hasReacted) {
      toast.error('Chỉ sửa được biểu cảm của bạn')
      return
    }

    const current = reactions[msgId] || []
    const next = current.filter((e) => e !== emoji)

    setReactions((prev) => {
      const updated = { ...prev, [msgId]: next }
      try {
        localStorage.setItem(storageReactionsKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    let nextUsersMap: Record<string, string[]> = {}
    setReactionUsers((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      delete msgMap[emoji]
      nextUsersMap = msgMap
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageUsersKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    let nextCountsMap: Record<string, number> = {}
    setReactionCounts((prev) => {
      const msgMap = { ...(prev[msgId] || {}) }
      delete msgMap[emoji]
      nextCountsMap = msgMap
      const updated = { ...prev, [msgId]: msgMap }
      try {
        localStorage.setItem(storageCountsKey, JSON.stringify(updated))
      } catch {}
      return updated
    })

    if (!isRoomScope) {
      guiReactionCampusChat(msgId, { action: 'remove', emoji }).catch(() => {})
    } else {
      window.dispatchEvent(
        new CustomEvent('campus:room_reaction_sync', {
          detail: {
            roomId: roomKey,
            msgId,
            reactions: next,
            users: nextUsersMap,
            counts: nextCountsMap,
          },
        }),
      )
    }
    toast.info(`Đã gỡ ${emoji}`)

    requestAnimationFrame(() => {
      const khung = khungRef.current
      if (khung && (oDayRef.current || msgId === idTinCuoi)) {
        khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
      }
    })
  }

  useEffect(() => {
    if (!reactingState) {
      return
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('[data-emoji-picker]') &&
        !target.closest('[data-emoji-trigger]') &&
        !target.closest('[data-emoji-pill-item]')
      ) {
        setReactingState(null)
      }
    }
    window.addEventListener('pointerdown', handleClickOutside)
    return () => window.removeEventListener('pointerdown', handleClickOutside)
  }, [reactingState])

  const hopLeMessages = useMemo(
    () => messages.filter((m: TinCampus) => !m.noiDung.trim().startsWith('[SYS_')),
    [messages],
  )
  const tinCuoi = hopLeMessages.length > 0 ? hopLeMessages[hopLeMessages.length - 1] : null
  const idTinCuoi = tinCuoi?.id ?? null
  const tinCuoiCuaMinh = tinCuoi !== null && tinCuoi.accountId === myPermissions?.accountId
  const [idDaXem, setIdDaXem] = useState<number | null>(idTinCuoi)
  const coTinMoi = !oDay && idTinCuoi !== null && idTinCuoi !== idDaXem

  useEffect(() => {
    const timer = setInterval(() => setBayGio(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Lắng nghe reactions realtime và snapshot từ CampusDO
  useEffect(() => {
    const handleChatReaction = (e: Event) => {
      const ce = e as CustomEvent<{
        msgId: number
        reactions: string[]
        reactionDetails?: import('@shared/protocol/campus').ReactionDetail[]
      }>
      const detail = ce.detail
      if (!detail) return
      setReactions((prev) => {
        const updated = {
          ...prev,
          [detail.msgId]: detail.reactions,
        }
        try {
          localStorage.setItem(STORAGE_KEY_CAMPUS_CHAT_REACTIONS, JSON.stringify(updated))
        } catch {
          // safe fallback
        }
        return updated
      })

      if (detail.reactionDetails) {
        const countsMap: Record<string, number> = {}
        const usersMap: Record<string, string[]> = {}
        for (const rd of detail.reactionDetails) {
          countsMap[rd.emoji] = rd.count
          usersMap[rd.emoji] = rd.users.map((u) => u.name)
        }
        setReactionCounts((prev) => ({
          ...prev,
          [detail.msgId]: countsMap,
        }))
        setReactionUsers((prev) => ({
          ...prev,
          [detail.msgId]: usersMap,
        }))
      }
    }

    const handleChatReactionsSnapshot = (e: Event) => {
      const ce = e as CustomEvent<
        | {
            reactions: Record<number, string[]>
            reactionDetails?: Record<number, import('@shared/protocol/campus').ReactionDetail[]>
          }
        | Record<number, string[]>
      >
      const detail = ce.detail
      if (!detail) return
      const reactionsData =
        'reactions' in detail && detail.reactions ? detail.reactions : (detail as Record<number, string[]>)
      const reactionDetailsData = 'reactionDetails' in detail ? detail.reactionDetails : undefined

      setReactions((prev) => {
        const updated = {
          ...prev,
          ...reactionsData,
        }
        try {
          localStorage.setItem(STORAGE_KEY_CAMPUS_CHAT_REACTIONS, JSON.stringify(updated))
        } catch {
          // safe fallback
        }
        return updated
      })

      if (reactionDetailsData) {
        setReactionCounts((prev) => {
          const nextCounts = { ...prev }
          for (const [idStr, rds] of Object.entries(reactionDetailsData)) {
            const mId = Number(idStr)
            const map: Record<string, number> = {}
            for (const rd of rds) {
              map[rd.emoji] = rd.count
            }
            nextCounts[mId] = map
          }
          return nextCounts
        })
        setReactionUsers((prev) => {
          const nextUsers = { ...prev }
          for (const [idStr, rds] of Object.entries(reactionDetailsData)) {
            const mId = Number(idStr)
            const map: Record<string, string[]> = {}
            for (const rd of rds) {
              map[rd.emoji] = rd.users.map((u) => u.name)
            }
            nextUsers[mId] = map
          }
          return nextUsers
        })
      }
    }

    window.addEventListener('campus:chat_reaction', handleChatReaction)
    window.addEventListener('campus:chat_reactions_snapshot', handleChatReactionsSnapshot)
    return () => {
      window.removeEventListener('campus:chat_reaction', handleChatReaction)
      window.removeEventListener('campus:chat_reactions_snapshot', handleChatReactionsSnapshot)
    }
  }, [])

  const listRef = useRef<HTMLOListElement>(null)

  // Theo dõi chiều cao thực tế của danh sách tin nhắn (ví dụ khi thả emoji làm nở pill biểu cảm):
  // Nếu người dùng đang ở đáy thì tự động bám theo chiều cao mới, kéo xuống tận đáy mượt mà, không bị khựng.
  useEffect(() => {
    const listEl = listRef.current
    const khung = khungRef.current
    if (!listEl || !khung) return

    let prevHeight = listEl.scrollHeight
    const observer = new ResizeObserver(() => {
      const newHeight = listEl.scrollHeight
      if (newHeight !== prevHeight) {
        prevHeight = newHeight
        if (oDayRef.current) {
          khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
        }
      }
    })

    observer.observe(listEl)
    return () => observer.disconnect()
  }, [])

  // Chỉ cuộn bên trong khung tin (không đụng tới cuộn trang). Lần đầu nhảy thẳng xuống cuối; về sau chỉ bám theo
  // tin mới hoặc khi reactions thay đổi khi người dùng đang ở cuối hoặc vừa tự gửi — đang đọc tin cũ thì không kéo họ đi.
  useLayoutEffect(() => {
    const khung = khungRef.current
    if (!khung || idTinCuoi === null) return
    if (!daCuonLanDau.current) {
      daCuonLanDau.current = true
      khung.scrollTop = khung.scrollHeight
      return
    }
    if (oDayRef.current || tinCuoiCuaMinh) {
      khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
    }
  }, [idTinCuoi, tinCuoiCuaMinh, reactions, reactionCounts])

  const xuLyCuon = () => {
    const khung = khungRef.current
    if (!khung) return
    const gan = khung.scrollHeight - khung.scrollTop - khung.clientHeight < NGUONG_DAY_PX
    oDayRef.current = gan
    setODay(gan)
    if (gan) setIdDaXem(idTinCuoi)
  }

  const cuonXuongCuoi = () => {
    const khung = khungRef.current
    if (khung) khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
  }

  const xuLyGui = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = noiDung.trim()
    if (!text || dangGui) return

    // Ô nhập không bị khoá khi đang gửi để giữ nguyên con trỏ; chỉ xoá nếu nội dung vẫn là tin vừa gửi.
    setDangGui(true)
    const kq = await onSendMessage(text)
    setDangGui(false)

    if (kq.ok) {
      setNoiDung((hienTai) => (hienTai.trim() === text ? '' : hienTai))

    } else {
      toast.error(kq.loi || 'Không gửi được tin nhắn')
    }
  }

  const xacNhanXoa = async () => {
    const tin = tinCanXoa
    if (!tin || idDangXoa !== null) return
    setIdDangXoa(tin.id)
    const kq = await onDeleteMessage(tin.id)
    setIdDangXoa(null)
    setTinCanXoa(null)

    if (kq.ok) {
      toast.success('Đã xoá tin nhắn')
    } else {
      toast.error(kq.loi || 'Không xoá được tin nhắn')
    }
  }

  const conLai = CHAT_CAMPUS.TOI_DA_KY_TU - noiDung.length
  const xoaHoTinNguoiKhac = tinCanXoa !== null && tinCanXoa.accountId !== myPermissions?.accountId
  const hienThiMessages = hopLeMessages.filter((m: TinCampus) => !hiddenMsgIds.has(m.id))

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {!hideHeader && (
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <MessageSquare className="size-4 text-text-tertiary" />
          <h2 className="text-sm font-semibold text-text-primary">Trò chuyện toàn trường</h2>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={khungRef}
          onScroll={xuLyCuon}
          role="log"
          aria-label="Tin nhắn toàn trường"
          className="h-full overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 styled-scrollbar"
          style={{ overflowAnchor: 'none' }}
        >
          {hienThiMessages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-raised text-text-tertiary">
                <MessageSquare className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-text-primary">Chưa có tin nhắn nào</p>
              <p className="mt-1 max-w-64 text-xs leading-relaxed text-text-tertiary">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <ol ref={listRef}>
              {hienThiMessages.map((msg: TinCampus, i: number) => {
                const truoc = i > 0 ? hienThiMessages[i - 1] : null
                const sangNgayMoi = !truoc || !cungNgay(truoc.taoLuc, msg.taoLuc)
                const noiTiep =
                  !sangNgayMoi &&
                  truoc !== null &&
                  truoc.accountId === msg.accountId &&
                  msg.taoLuc - truoc.taoLuc < GOP_TIN_TRONG_MS
                const laCuaMinh = myPermissions?.accountId === msg.accountId
                const trong15Phut = bayGio - msg.taoLuc <= CHAT_CAMPUS.TU_XOA_TRONG_MS
                const coQuyenXoa = Boolean(myPermissions?.xoaMoiTin || (laCuaMinh && trong15Phut))
                const gio = DINH_DANG_GIO.format(msg.taoLuc)

                return (
                  <li key={msg.id} className={cn(sangNgayMoi ? 'pt-1' : noiTiep ? 'pt-0.5' : 'pt-3')}>
                    {sangNgayMoi && (
                      <p className="mb-3 flex items-center gap-3 text-[11px] font-medium text-text-tertiary">
                        <span className="h-px flex-1 bg-border-subtle" />
                        <span className="first-letter:uppercase">{nhanNgay(msg.taoLuc, bayGio)}</span>
                        <span className="h-px flex-1 bg-border-subtle" />
                      </p>
                    )}

                    <div
                      className={cn('group flex items-end gap-2', laCuaMinh && 'flex-row-reverse')}
                      onMouseEnter={() => handleMessageMouseEnter(msg.id)}
                      onMouseLeave={() => handleMessageMouseLeave(msg.id)}
                    >
                      {noiTiep ? (
                        <span aria-hidden className="w-8 shrink-0" />
                      ) : (
                        <div className="relative shrink-0 self-start">
                          <button
                            type="button"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setNguoiXem({
                                id: msg.accountId,
                                ten: msg.ten,
                                lopTen: msg.lopTen,
                                vaiTro: msg.vaiTro,
                                anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                              })
                            }}
                            aria-label={`Xem thông tin ${msg.ten}`}
                            title={msg.tieuDeHoSo ? `${msg.ten}: “${msg.tieuDeHoSo}”` : msg.ten}
                            data-testid={`chat-anh-${msg.accountId}`}
                            className="block cursor-pointer rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          >
                            <AnhNguoiDung ten={msg.ten} avatar={msg.avatar} className="size-8 text-[11px]" />
                          </button>
                          {/* Icon nhỏ góc trên như đã code (bóng đèn suy nghĩ hoặc giáo viên) */}
                          {msg.tieuDeHoSo ? (
                            <span
                              className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full border border-amber-400 bg-amber-500/90 text-amber-100 shadow-sm pointer-events-none"
                              title={`Suy nghĩ: ${msg.tieuDeHoSo}`}
                            >
                              <Lightbulb className="size-2 text-text-primary fill-amber-200" />
                            </span>
                          ) : msg.vaiTro === 'giao_vien' ? (
                            <span
                              className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full border border-brand bg-brand text-text-primary shadow-sm pointer-events-none"
                              title="Giáo viên"
                            >
                              <Sparkles className="size-2 text-text-primary" />
                            </span>
                          ) : null}
                        </div>
                      )}

                      <div className={cn('flex max-w-[85%] sm:max-w-[82%] min-w-0 flex-col', laCuaMinh ? 'items-end' : 'items-start')}>
                        {!noiTiep && (
                          <p className={cn('mb-1 flex flex-wrap items-baseline gap-x-1.5 px-1 text-xs', laCuaMinh && 'flex-row-reverse')}>
                            <button
                              type="button"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setNguoiXem({
                                  id: msg.accountId,
                                  ten: msg.ten,
                                  lopTen: msg.lopTen,
                                  vaiTro: msg.vaiTro,
                                  anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                                })
                              }}
                              className="min-w-0 cursor-pointer text-left font-medium break-words text-text-primary hover:text-brand hover:underline focus-visible:underline focus-visible:outline-none"
                            >
                              {msg.ten}
                            </button>
                            {msg.vaiTro === 'giao_vien' ? (
                              <span className="rounded bg-brand/12 px-1 text-[10px] font-semibold text-brand">GV</span>
                            ) : msg.lopTen ? (
                              <span className="text-text-tertiary">{msg.lopTen}</span>
                            ) : null}

                          </p>
                        )}

                        <div className={cn('flex flex-col max-w-full min-w-0 w-fit group/card', laCuaMinh ? 'items-end' : 'items-start')}>
                          {/* Hàng ngang chứa Card tin nhắn và Nút 3 chấm NẰM SÁT CẠNH BÊN CARD TIN NHẮN (dù co giãn phóng to thu nhỏ) */}
                          <div
                            className={cn(
                              'flex items-center gap-1.5 max-w-full flex-nowrap',
                              laCuaMinh ? 'flex-row-reverse' : 'flex-row',
                            )}
                          >
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

                              {/* Dòng thời gian, icon thả emoji và nút xóa (sắp xếp hợp lý ở góc phải dưới bubble) */}
                              <div className="mt-1 flex items-center justify-end gap-1.5 pt-0.5 select-none relative">
                                <time
                                  dateTime={new Date(msg.taoLuc).toISOString()}
                                  className="text-[10px] text-text-tertiary tabular-nums leading-none"
                                >
                                  {gio}
                                </time>
                                <div className="relative inline-flex items-center">
                                  <button
                                    type="button"
                                    data-emoji-trigger
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setReactingState((cur) => {
                                        if (cur && cur.msgId === msg.id && cur.replaceIndex === undefined) {
                                          return null
                                        }
                                        return {
                                          msgId: msg.id,
                                          anchorRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
                                        }
                                      })
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

                            {/* Nút 3 dấu chấm dọc NẰM SÁT VÀO CẠNH BÊN CARD TIN NHẮN */}
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
                                      {coQuyenXoa && (
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() => setTinCanXoa(msg)}
                                          disabled={idDangXoa === msg.id}
                                          className="cursor-pointer gap-2.5 px-2.5 py-2 text-xs font-medium"
                                        >
                                          <Trash2 className="size-4 shrink-0" />
                                          <span>{myPermissions?.xoaMoiTin && !laCuaMinh ? 'Xoá tin (quyền GV)' : 'Thu hồi tin nhắn'}</span>
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

                          {/* Danh sách cảm xúc đã thả (Hình 3): con nhộng xích lên 1/3 của card vào cạnh dưới của card tin nhắn */}
                          {(() => {
                            const msgEmojis = (reactions[msg.id] || []).slice(0, 3)
                            const activeEmojis = msgEmojis
                            if (activeEmojis.length === 0) return null

                            const msgUserMap = reactionUsers[msg.id] || {}

                            return (
                              <div
                                className={cn(
                                  'relative -mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap select-none max-w-none z-10 w-fit shrink-0',
                                  laCuaMinh ? 'justify-end pr-2' : 'justify-start pl-2',
                                  laCuaMinh ? 'self-end' : 'self-start',
                                )}
                                data-testid={`reactions-${msg.id}`}
                              >
                                <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-raised/95 border border-border-default/90 shadow-sm leading-none w-fit shrink-0">
                                  {activeEmojis.map((emoji, idx) => {
                                    const recordedUsers = msgUserMap[emoji] || []
                                    const users = recordedUsers.length > 0 ? recordedUsers : [msg.ten || 'Thành viên']
                                    const extraCount = reactionCounts[msg.id]?.[emoji]
                                    const count = typeof extraCount === 'number' && extraCount > 0 ? extraCount : Math.max(users.length, 1)
                                    const hasReacted = users.includes(myName)
                                    const tooltipText = `${users.join(', ')} đã thả ${emoji}`

                                    return (
                                      <button
                                        key={`${emoji}-${idx}`}
                                        type="button"
                                        data-emoji-pill-item={idx}
                                        onPointerDown={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect()
                                          handlePointerDownEmoji(msg.id, idx, {
                                            top: rect.top,
                                            bottom: rect.bottom,
                                            left: rect.left,
                                            right: rect.right,
                                          })
                                        }}
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
                                          const key = `${msg.id}:${emoji}`
                                          const now = Date.now()
                                          if (now - (lastReactionTimeRef.current[key] || 0) < EMOJI_CLICK_COOLDOWN_MS) {
                                            return
                                          }
                                          if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
                                          clickTimerRef.current = setTimeout(() => {
                                            clickTimerRef.current = null
                                            handleIncrementEmoji(msg.id, emoji)
                                          }, 220)
                                        }}
                                        className={cn(
                                          'inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full transition-transform cursor-pointer hover:scale-110 active:scale-95 select-none shrink-0',
                                          hasReacted ? 'text-brand font-bold' : 'text-text-secondary hover:text-text-primary',
                                        )}
                                        title={tooltipText}
                                        aria-label={`${tooltipText} • Click để tăng (+1), nhấn giữ đổi emoji, double click để xóa`}
                                      >
                                        <span className="text-xs leading-none">{emoji}</span>
                                        <span className="text-[10px] font-bold text-text-secondary leading-none tabular-nums">
                                          {count}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {coTinMoi && (
          <button
            type="button"
            onClick={cuonXuongCuoi}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg shadow-black/40"
          >
            Tin nhắn mới
            <ArrowDown className="size-3.5" />
          </button>
        )}
      </div>

      {!hideInput && (
        <form
          onSubmit={xuLyGui}
          className="shrink-0 border-t border-border-subtle p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-end gap-2">
            {/* Nút chèn biểu cảm Emoji */}
            <Popover open={moPickerEmoji} onOpenChange={setMoPickerEmoji}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 mb-0.5 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay cursor-pointer"
                    title="Chèn biểu cảm emoji"
                    aria-label="Chèn biểu cảm emoji"
                    data-testid="chat-emoji-trigger"
                  >
                    <Smile className="size-5" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0c1322] border-border-default shadow-2xl rounded-xl z-[150]">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setNoiDung((prev) => (prev + em).slice(0, CHAT_CAMPUS.TOI_DA_KY_TU))
                        setMoPickerEmoji(false)
                        inputRef.current?.focus()
                      }}
                      className="flex size-9 items-center justify-center text-xl rounded-lg hover:bg-surface-overlay transition-colors active:scale-95 cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value.slice(0, CHAT_CAMPUS.TOI_DA_KY_TU))}
                placeholder={placeholder}
                aria-label="Nội dung tin nhắn"
                maxLength={CHAT_CAMPUS.TOI_DA_KY_TU}
                autoComplete="off"
                className={cn(
                  'h-10 w-full rounded-xl border border-border-subtle bg-surface-raised px-3.5 text-sm leading-normal text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none transition-colors',
                  conLai <= 50 && 'pr-12',
                )}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    xuLyGui()
                  }
                }}
              />
              {conLai <= 50 && (
                <span
                  aria-live="polite"
                  className={cn(
                    'pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums',
                    conLai <= 10 ? 'text-warning' : 'text-text-tertiary',
                  )}
                >
                  {conLai}
                </span>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0 mb-0.5 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 transition-colors cursor-pointer"
              disabled={!noiDung.trim() || dangGui}
              aria-label="Gửi tin nhắn"
              onMouseDown={(e) => e.preventDefault()}
            >
              {dangGui ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </div>
        </form>
      )}

      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />

      <AlertDialog
        open={tinCanXoa !== null}
        onOpenChange={(mo) => {
          if (!mo && idDangXoa === null) setTinCanXoa(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tin nhắn?</AlertDialogTitle>
            <AlertDialogDescription>
              {xoaHoTinNguoiKhac
                ? `Tin của ${tinCanXoa?.ten} sẽ được gỡ khỏi trò chuyện toàn trường.`
                : 'Tin nhắn sẽ được gỡ với mọi người trong trường.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={idDangXoa !== null}>Huỷ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={idDangXoa !== null} onClick={xacNhanXoa}>
              {idDangXoa !== null && <Loader2 className="animate-spin" />}
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Portal Emoji Reaction Picker (Bày tỏ cảm xúc hoặc đổi emoji) */}
      {typeof document !== 'undefined' && reactingState && reactingState.anchorRect && (() => {
        const curState = reactingState
        const currentEmojis = reactions[curState.msgId] || []
        const replaceIndex = curState.replaceIndex
        const forbiddenEmojis =
          replaceIndex !== undefined
            ? currentEmojis.filter((_, idx) => idx !== replaceIndex)
            : currentEmojis.slice(0, 3)

        const pos = getPickerPosition(curState.anchorRect, false)

        return createPortal(
          <div
            className="fixed inset-0 select-none pointer-events-auto"
            style={{ zIndex: Math.max(emojiPickerZIndex, 9999) }}
            onClick={(e) => {
              e.stopPropagation()
              setReactingState(null)
            }}
          >
            <div
              data-emoji-picker
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: `${pos.width}px`,
                maxHeight: '260px',
              }}
              onClick={(e) => {
                e.stopPropagation()
                bringEmojiPickerToFront()
              }}
              className="flex flex-col p-2 rounded-2xl bg-surface/98 border border-border-default shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-1 pb-1.5 mb-1 border-b border-border-subtle text-[11px] font-medium text-text-secondary flex items-center justify-between gap-2">
                <span>
                  {replaceIndex !== undefined
                    ? `Đổi emoji ${currentEmojis[replaceIndex]} (không trùng)`
                    : 'Bày tỏ cảm xúc'}
                </span>
                <button
                  type="button"
                  onClick={() => setReactingState(null)}
                  className="size-4 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary cursor-pointer text-xs"
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto overflow-x-hidden styled-scrollbar p-0.5">
                {ALL_REACTION_EMOJIS.map((emoji) => {
                  const isForbidden = forbiddenEmojis.includes(emoji)
                  const isCurrent =
                    replaceIndex !== undefined &&
                    currentEmojis[replaceIndex] === emoji

                  return (
                    <button
                      key={emoji}
                      type="button"
                      disabled={isForbidden}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectEmoji(curState.msgId, emoji)
                      }}
                      className={cn(
                        'flex size-8.5 items-center justify-center rounded-lg transition-transform text-lg cursor-pointer select-none',
                        isForbidden
                          ? 'opacity-25 cursor-not-allowed filter grayscale'
                          : isCurrent
                            ? 'bg-brand/25 ring-1 ring-brand scale-110'
                            : 'hover:bg-surface-overlay active:scale-90 hover:scale-120',
                      )}
                      title={
                        isForbidden
                          ? 'Đang hiển thị, không chọn trùng'
                          : isCurrent
                            ? 'Emoji hiện tại'
                            : `Thả ${emoji}`
                      }
                      aria-label={`Thả biểu cảm ${emoji}`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      })()}
    </div>
  )
}
