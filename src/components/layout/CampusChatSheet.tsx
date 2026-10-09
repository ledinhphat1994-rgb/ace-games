import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router'
import {
  Gamepad2,
  GraduationCap,
  School,
  Search,
  Users,
  X,
} from 'lucide-react'

import { useCampusContext } from '@/app/CampusContext'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CampusChatDrawer } from '@/features/hub/CampusChatDrawer'
import { formatLastSeen } from '@/features/hub/social-semantics'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import { cn } from '@/lib/utils'
import type { PhongSanh, TinCampus } from '@shared/protocol/campus'
import type { FriendItem, FriendPresence } from '@shared/protocol/social'
import { DirectMessageThread, type DmTargetUser } from '@/components/chat/DirectMessageThread'
import { BlueprintCommunityPattern } from '@/components/ui/blueprint-patterns'
import { useGameRoomChatBridge } from '@/lib/game-room-chat-bridge'

export type { DmTargetUser }

function layViTriBanBe(presence: FriendPresence | undefined, rooms: PhongSanh[] = []): { text: string; isOnline: boolean; isAway: boolean } {
  if (!presence) return { text: 'Ngoại tuyến', isOnline: false, isAway: false }
  if (presence.state === 'offline') {
    return { text: formatLastSeen(presence.lastSeen ?? null), isOnline: false, isAway: false }
  }
  if (presence.state === 'away') {
    return { text: 'Tạm vắng', isOnline: false, isAway: true }
  }

  const act = presence.activity
  if (act) {
    if (act.type === 'room') {
      const isGame = act.area === 'game'
      const muc = isGame ? 'Game' : 'Học tập'
      const rId = act.roomId || rooms?.find((r) => r.ten === act.roomTitle)?.id
      const ten = act.roomTitle || rooms?.find((r) => r.id === rId)?.ten || ''
      if (rId && ten) {
        const tenDaCoSo = ten.toLowerCase().includes(`phòng #${rId}`) || ten.toLowerCase().includes(`phòng ${rId}`)
        return { text: tenDaCoSo ? `${muc} • ${ten}` : `${muc} • Phòng #${rId} • ${ten}`, isOnline: true, isAway: false }
      }
      if (rId) return { text: `${muc} • Phòng #${rId}`, isOnline: true, isAway: false }
      if (ten) return { text: `${muc} • ${ten}`, isOnline: true, isAway: false }
      return { text: muc, isOnline: true, isAway: false }
    }
    if (act.type === 'game' || act.area === 'game') return { text: 'Game', isOnline: true, isAway: false }
    if (act.type === 'learn' || act.area === 'learn') return { text: 'Học tập', isOnline: true, isAway: false }
    if (act.type === 'community' || act.area === 'community') return { text: 'Cộng đồng', isOnline: true, isAway: false }
    if (act.type === 'home' || act.area === 'home') return { text: 'Trang chủ', isOnline: true, isAway: false }
    if (act.type === 'lobby') return { text: 'Sảnh Campus', isOnline: true, isAway: false }
  }
  return { text: 'Trang chủ', isOnline: true, isAway: false }
}

const STORAGE_KEY = 'c10a7_chat_sheet_dimensions'

interface SheetDimensions {
  width: number
  height: number
  bottomOffset?: number
}

function layTieuDePhongGame(rawId: string): string {
  const lower = rawId.toLowerCase()
  if (lower.startsWith('xiangqi')) return 'Chat Cờ Tướng'
  if (lower.startsWith('chess')) return 'Chat Cờ Vua'
  if (lower.startsWith('caro')) return 'Chat Cờ Caro'
  if (lower.startsWith('snake')) return 'Chat Rắn Săn Mồi'
  if (lower.startsWith('memory')) return 'Chat Trí Nhớ'
  return 'Chat phòng game'
}

function getInitialDimensions(): SheetDimensions {
  if (typeof window === 'undefined') return { width: 480, height: 580, bottomOffset: 84 }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        const maxWidth = Math.max(360, window.innerWidth - 32)
        const maxHeight = Math.max(380, window.innerHeight - 60)
        return {
          width: Math.min(Math.max(360, parsed.width), maxWidth),
          height: Math.min(Math.max(380, parsed.height), maxHeight),
          bottomOffset:
            typeof parsed.bottomOffset === 'number'
              ? Math.max(16, Math.min(parsed.bottomOffset, window.innerHeight - 380))
              : 84,
        }
      }
    }
  } catch {
    // fallback
  }
  return {
    width: Math.min(480, Math.max(360, window.innerWidth - 32)),
    height: Math.min(580, Math.max(380, window.innerHeight - 60)),
    bottomOffset: 84,
  }
}

interface CampusChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  onSendMessage: (text: string) => Promise<KetQuaThaoTac>
  onDeleteMessage: (id: number) => Promise<KetQuaThaoTac>
  activeDmTarget?: DmTargetUser | null
  onSelectDmTarget?: (target: DmTargetUser | null) => void
  coTinNhanMoiCampus?: boolean
  roomChatMessages?: import('@shared/protocol/room').RoomChatMessage[]
  onSendRoomChat?: (text: string) => Promise<boolean> | void
  roomTitle?: string
  roomMembers?: Array<{ accountId?: number; avatar?: string | null; ten?: string }>
}

export type ChatTab = 'ban_be' | 'toan_truong' | 'phong'

export function CampusChatSheet({
  open,
  onOpenChange,
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
  activeDmTarget,
  onSelectDmTarget,
  coTinNhanMoiCampus = false,
  roomChatMessages,
  onSendRoomChat,
  roomTitle,
  roomMembers,
}: CampusChatSheetProps) {
  const { nguoiDung } = usePhien()
  const { socialState, friendsPresence, presenceReady, rooms } = useCampusContext()
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])

  const gameBridge = useGameRoomChatBridge()
  const effectiveRoomMessages = roomChatMessages ?? gameBridge?.messages ?? null
  const effectiveOnSendRoomChat = onSendRoomChat ?? gameBridge?.onSend ?? null
  const effectiveRoomMembers = roomMembers ?? gameBridge?.roomMembers ?? null

  const onlineFriendsCount = useMemo(() => {
    if (!presenceReady) return 0
    return friends.filter((f) => {
      const p = friendsPresence[f.id]
      return p?.state === 'online' || p?.state === 'away'
    }).length
  }, [friends, friendsPresence, presenceReady])

  const avatarMap = useMemo(() => {
    const map = new Map<number, string>()
    if (nguoiDung?.accountId && nguoiDung?.avatar) {
      map.set(nguoiDung.accountId, nguoiDung.avatar)
    }
    for (const f of friends) {
      if (f.id && f.avatar) {
        map.set(f.id, f.avatar)
      }
    }
    for (const m of effectiveRoomMembers ?? []) {
      if (m.accountId && m.avatar) {
        map.set(m.accountId, m.avatar)
      }
    }
    return map
  }, [nguoiDung?.accountId, nguoiDung?.avatar, friends, effectiveRoomMembers])

  const avatarByNameMap = useMemo(() => {
    const map = new Map<string, string>()
    if (nguoiDung?.ten && nguoiDung?.avatar) {
      map.set(nguoiDung.ten, nguoiDung.avatar)
    }
    for (const f of friends) {
      if (f.displayName && f.avatar) {
        map.set(f.displayName, f.avatar)
      }
    }
    for (const m of effectiveRoomMembers ?? []) {
      if (m.ten && m.avatar) {
        map.set(m.ten, m.avatar)
      }
    }
    return map
  }, [nguoiDung?.ten, nguoiDung?.avatar, friends, effectiveRoomMembers])

  const location = useLocation()
  const gameRoomId = location.pathname.match(/^\/game\/([^/?#]+)/)?.[1] ?? null
  const studyRoomId = location.pathname.match(/^\/room\/([^/?#]+)/)?.[1]?.replace(/^phong-/, '') ?? null

  const inRoomInfo = useMemo(() => {
    if (gameRoomId) {
      return {
        type: 'game' as const,
        id: gameRoomId,
        title: layTieuDePhongGame(gameRoomId),
        subtitle: `Bàn đấu #${gameRoomId.slice(0, 8)}`,
      }
    }
    if (studyRoomId) {
      return {
        type: 'study' as const,
        id: studyRoomId,
        title: roomTitle || 'Chat phòng học',
        subtitle: `Phòng học #${studyRoomId.slice(0, 8)}`,
      }
    }
    return null
  }, [gameRoomId, studyRoomId, roomTitle])

  // VÙNG X: TABS (Bạn bè | Toàn trường | Phòng)
  const [activeTab, setActiveTab] = useState<ChatTab>(() => {
    if (activeDmTarget) return 'ban_be'
    if (gameRoomId || studyRoomId) return 'phong'
    return 'toan_truong'
  })

  // Tự động chuyển tab Phòng duy nhất 1 lần khi bước vào phòng (không ép người dùng khi họ đổi tab khác)
  const lastAutoSwitchedRoomIdRef = useRef<string | null>(null)
  useEffect(() => {
    const currentRoomId = inRoomInfo?.id ?? null
    if (currentRoomId && lastAutoSwitchedRoomIdRef.current !== currentRoomId && !activeDmTarget) {
      lastAutoSwitchedRoomIdRef.current = currentRoomId
      setActiveTab('phong')
    } else if (!currentRoomId) {
      lastAutoSwitchedRoomIdRef.current = null
    }
  }, [inRoomInfo?.id, activeDmTarget])

  // Quản lý người bạn đang nhắn tin riêng (null = xem danh sách bạn bè)
  const [internalDmTarget, setInternalDmTarget] = useState<DmTargetUser | null>(null)
  const currentDmTarget = activeDmTarget !== undefined ? activeDmTarget : internalDmTarget

  useEffect(() => {
    if (activeDmTarget) {
      setActiveTab('ban_be')
    }
  }, [activeDmTarget])

  // VÙNG 2: THANH SEARCH TÌM KIẾM THEO TAB ACTIVE
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)

  // Khả năng co giãn khung chat trên Desktop (các cạnh và góc)
  const [dimensions, setDimensions] = useState<SheetDimensions>(getInitialDimensions)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerHeight >= 560)

  useEffect(() => {
    const handleWindowResize = () => {
      setIsDesktop(window.innerWidth >= 768 && window.innerHeight >= 560)
      setDimensions((prev) => {
        const maxWidth = Math.max(360, window.innerWidth - 32)
        const maxHeight = Math.max(380, window.innerHeight - 60)
        return {
          width: Math.min(Math.max(360, prev.width), maxWidth),
          height: Math.min(Math.max(380, prev.height), maxHeight),
          bottomOffset: Math.max(16, Math.min(prev.bottomOffset ?? 84, window.innerHeight - 380)),
        }
      })
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  const handleResizeStart = (e: React.PointerEvent, direction: 'w' | 'n' | 's' | 'nw' | 'sw') => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    const startBottom = dimensions.bottomOffset ?? 84

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = startX - moveEvent.clientX // Kéo chuột sang trái -> deltaX > 0 -> tăng width

      const maxWidth = Math.max(360, window.innerWidth - 32)
      const maxHeight = Math.max(380, window.innerHeight - 60)

      let nextWidth = startWidth
      let nextHeight = startHeight
      let nextBottom = startBottom

      // 1. Kéo chiều ngang (cạnh trái: 'w', 'nw', 'sw')
      if (direction === 'w' || direction === 'nw' || direction === 'sw') {
        nextWidth = Math.min(Math.max(360, startWidth + deltaX), maxWidth)
      }

      // 2. Kéo cạnh trên ('n', 'nw'): Cạnh dưới cố định, cạnh trên mở rộng/thu nhỏ
      if (direction === 'n' || direction === 'nw') {
        const deltaY = startY - moveEvent.clientY // Kéo lên trên -> deltaY > 0 -> tăng height
        nextHeight = Math.min(Math.max(380, startHeight + deltaY), maxHeight)
      }

      // 3. Kéo cạnh dưới ('s', 'sw'): Cạnh trên cố định, cạnh dưới mở rộng/thu nhỏ
      if (direction === 's' || direction === 'sw') {
        const deltaDown = moveEvent.clientY - startY // Kéo xuống dưới -> deltaDown > 0 -> giảm bottomOffset
        const minBottom = 16
        const maxBottom = window.innerHeight - 380 - 40
        const proposedBottom = Math.max(minBottom, Math.min(startBottom - deltaDown, maxBottom))
        const actualDeltaBottom = startBottom - proposedBottom
        nextBottom = proposedBottom
        nextHeight = Math.min(Math.max(380, startHeight + actualDeltaBottom), maxHeight)
      }

      setDimensions({ width: nextWidth, height: nextHeight, bottomOffset: nextBottom })
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      setDimensions((curr) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(curr))
        } catch {
          // ignore
        }
        return curr
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // Theo dõi các bạn bè đã đọc tin nhắn
  const [daDocFriendIds, setDaDocFriendIds] = useState<Set<number>>(() => new Set())

  // Quản lý số tin nhắn chưa đọc cho từng bạn bè
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    for (const f of socialState?.friends ?? []) {
      if (typeof f.unreadCount === 'number') {
        init[f.id] = f.unreadCount
      }
    }
    return init
  })

  // Cập nhật khi socialState.friends thay đổi
  useEffect(() => {
    if (!socialState?.friends) return
    setUnreadCounts((prev) => {
      const next = { ...prev }
      for (const f of socialState.friends) {
        const serverCount = typeof f.unreadCount === 'number' ? f.unreadCount : 0
        const isCurrentActive = currentDmTarget?.id === f.id && open
        const isAlreadyRead = daDocFriendIds.has(f.id)
        if (isCurrentActive || isAlreadyRead) {
          next[f.id] = 0
        } else {
          next[f.id] = Math.max(prev[f.id] ?? 0, serverCount)
        }
      }
      return next
    })
  }, [socialState?.friends, currentDmTarget, open, daDocFriendIds])

  // Lắng nghe tin nhắn riêng realtime tới
  useEffect(() => {
    const handleDm = (e: Event) => {
      const ce = e as CustomEvent<{ senderId?: number; nguoiGuiId?: number }>
      const senderId = ce.detail?.senderId ?? ce.detail?.nguoiGuiId
      if (!senderId) return
      if (currentDmTarget?.id === senderId && open) {
        return
      }
      setDaDocFriendIds((prev) => {
        if (!prev.has(senderId)) return prev
        const next = new Set(prev)
        next.delete(senderId)
        return next
      })
      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] ?? 0) + 1,
      }))
    }

    window.addEventListener('campus:direct_message', handleDm)
    return () => window.removeEventListener('campus:direct_message', handleDm)
  }, [currentDmTarget, open])

  const hasUnreadFriends = useMemo(() => {
    return Object.values(unreadCounts).some((count) => count > 0)
  }, [unreadCounts])

  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  const friendsFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        (f.lopTen && f.lopTen.toLowerCase().includes(q)),
    )
  }, [friends, searchQuery])

  // Chọn bạn bè để mở cuộc trò chuyện
  const handleSelectFriend = (friend: FriendItem) => {
    const target: DmTargetUser = {
      id: friend.id,
      displayName: friend.displayName,
      avatar: friend.avatar,
      lopTen: friend.lopTen,
    }
    setDaDocFriendIds((prev) => {
      const next = new Set(prev)
      next.add(friend.id)
      return next
    })
    setUnreadCounts((prev) => ({ ...prev, [friend.id]: 0 }))
    setInternalDmTarget(target)
    onSelectDmTarget?.(target)
  }

  // Nút Back quay lại danh sách bạn bè
  const handleBackFromDm = useCallback(() => {
    setInternalDmTarget(null)
    onSelectDmTarget?.(null)
  }, [onSelectDmTarget])

  // Mapped room messages (lọc bỏ các gói tin hệ thống nội bộ để không rác khung chat)
  const mappedRoomMessages = useMemo<TinCampus[]>(() => {
    if (!effectiveRoomMessages) return []
    return effectiveRoomMessages
      .filter((m) => !m.text.startsWith('[SYS_'))
      .map((m, idx) => {
        let numId = parseInt(m.id, 10)
        if (isNaN(numId) || numId <= 0) {
          numId = Math.abs(m.id.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0)) || (idx + 1)
        }
        return {
          id: numId,
          accountId: m.accountId,
          ten: m.ten,
          vaiTro: 'hoc_sinh' as const,
          lopTen: null,
          noiDung: m.text,
          taoLuc: m.taoLuc,
          avatar: m.avatar || avatarMap.get(m.accountId) || avatarByNameMap.get(m.ten) || undefined,
        }
      })
  }, [effectiveRoomMessages, avatarMap, avatarByNameMap])

  // Lọc tin nhắn toàn trường theo từ khóa tìm kiếm
  const campusMessagesFiltered = useMemo(() => {
    const list = messages.filter((m) => !m.noiDung.trim().startsWith('[SYS_'))
    if (!searchQuery.trim()) return list
    const q = searchQuery.trim().toLowerCase()
    return list.filter(
      (m) =>
        m.noiDung.toLowerCase().includes(q) ||
        m.ten.toLowerCase().includes(q),
    )
  }, [messages, searchQuery])

  // Lọc tin nhắn phòng theo từ khóa tìm kiếm
  const roomMessagesFiltered = useMemo(() => {
    if (!searchQuery.trim()) return mappedRoomMessages
    const q = searchQuery.trim().toLowerCase()
    return mappedRoomMessages.filter(
      (m) =>
        m.noiDung.toLowerCase().includes(q) ||
        m.ten.toLowerCase().includes(q),
    )
  }, [mappedRoomMessages, searchQuery])

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false} disablePointerDismissal={true}>
      <SheetContent
        side="right"
        floating
        hideOverlay
        showCloseButton={false}
        style={
          isDesktop
            ? {
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                bottom: `${dimensions.bottomOffset ?? 84}px`,
                right: '16px',
                top: 'auto',
                left: 'auto',
              }
            : undefined
        }
        className={cn(
          'campus-chat-sheet-root gap-0 p-0 z-[70] shadow-2xl overflow-hidden flex flex-col',
          // Mobile portrait: Tận dụng trọn vẹn chiều cao màn hình, loại bỏ 100% khoảng đen thừa ở top và bot
          !isDesktop && [
            'top-1.5 bottom-1.5 left-1.5 right-1.5 my-0 mx-0',
            'h-[calc(100svh-12px)] max-h-[calc(100svh-12px)]',
            'rounded-2xl border border-border-default',
          ],
          // Tối ưu màn hình ngang mobile: CHỈ kích hoạt khi KHÔNG phải Desktop
          !isDesktop &&
            'landscape:top-2 landscape:bottom-[max(0.5rem,env(safe-area-inset-bottom,8px))] landscape:right-2 landscape:left-auto landscape:w-[min(380px,calc(100vw-20px))] landscape:h-[calc(100dvh-16px)] landscape:max-h-[calc(100dvh-16px)] landscape:min-h-0',
          // Bố cục nổi desktop: không ép width cứng, cho phép co dãn tự do
          isDesktop && [
            'sm:top-auto sm:right-4 sm:bottom-[84px] sm:left-auto',
            'sm:rounded-2xl sm:border sm:border-border-default',
            'sm:w-[480px] md:w-[500px] lg:w-[520px]',
            'sm:min-w-[360px] sm:max-w-[calc(100vw-24px)] sm:min-h-[380px] sm:max-h-[calc(100vh-48px)]',
            'sm:shadow-[-8px_12px_32px_rgba(0,0,0,0.45)]',
          ],
          '[&_[data-slot=sheet-close]]:size-8 sm:[&_[data-slot=sheet-close]]:size-9',
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Trò chuyện Campus</SheetTitle>
          <SheetDescription>Bảng trò chuyện bạn bè, toàn trường và phòng học</SheetDescription>
        </SheetHeader>

        {/* Họa tiết Blueprint Community Schematic mờ chìm toàn diện */}
        <BlueprintCommunityPattern className="opacity-35 pointer-events-none" />

        {/* Các tay cầm co giãn trên Desktop (Cạnh Trái, Cạnh Trên, Cạnh Dưới, Góc Trên-Trái, Góc Dưới-Trái) */}
        {isDesktop && (
          <>
            {/* Cạnh trái (W): Thay đổi độ rộng */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'w')}
              className="hidden sm:block absolute top-3 left-0 bottom-3 w-3 cursor-ew-resize z-50 hover:bg-brand/20 active:bg-brand/40 transition-colors select-none group"
              title="Kéo cạnh trái để thay đổi độ rộng"
              aria-label="Kéo cạnh trái để thay đổi độ rộng"
            >
              <div className="absolute top-1/2 left-0.5 -translate-y-1/2 w-1 h-8 rounded-full bg-border-strong opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Cạnh trên (N): Thay đổi chiều cao phía trên */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'n')}
              className="hidden sm:block absolute top-0 left-3 right-3 h-3 cursor-ns-resize z-50 hover:bg-brand/20 active:bg-brand/40 transition-colors select-none group"
              title="Kéo cạnh trên để thay đổi chiều cao"
              aria-label="Kéo cạnh trên để thay đổi chiều cao"
            >
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-border-strong opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Cạnh dưới (S): Thay đổi chiều cao phía dưới */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 's')}
              className="hidden sm:block absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize z-50 hover:bg-brand/20 active:bg-brand/40 transition-colors select-none group"
              title="Kéo cạnh dưới để thay đổi chiều cao"
              aria-label="Kéo cạnh dưới để thay đổi chiều cao"
            >
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-border-strong opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Góc trên-trái (NW): Co giãn cả 2 chiều */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'nw')}
              className="hidden sm:flex items-start justify-start p-0.5 absolute top-0 left-0 size-5 cursor-nwse-resize z-50 hover:bg-brand/30 active:bg-brand/50 transition-colors select-none group rounded-tl-2xl"
              title="Kéo góc trên-trái để co giãn cả 2 chiều"
              aria-label="Kéo góc trên-trái để co giãn cả 2 chiều"
            >
              <div className="size-2 rounded-tl-sm border-t-2 border-l-2 border-brand/50 group-hover:border-brand transition-colors" />
            </div>

            {/* Góc dưới-trái (SW): Co giãn cả 2 chiều */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'sw')}
              className="hidden sm:flex items-end justify-start p-0.5 absolute bottom-0 left-0 size-5 cursor-nesw-resize z-50 hover:bg-brand/30 active:bg-brand/50 transition-colors select-none group rounded-bl-2xl"
              title="Kéo góc dưới-trái để co giãn cả 2 chiều"
              aria-label="Kéo góc dưới-trái để co giãn cả 2 chiều"
            >
              <div className="size-2 rounded-bl-sm border-b-2 border-l-2 border-brand/50 group-hover:border-brand transition-colors" />
            </div>
          </>
        )}

        {/* Tiêu đề ẩn hỗ trợ trợ năng / Screen reader */}
        <h2 className="sr-only text-center">Trò chuyện</h2>

        <div className="flex flex-col h-full w-full min-h-0 bg-surface">
          {/* ════════════════════════════════════════════════════════════════════════════════
              VÙNG X: CÁC TAB (Bạn bè, Toàn trường, Phòng) & NÚT TÌM KIẾM + NÚT ĐÓNG
              ════════════════════════════════════════════════════════════════════════════════ */}
          <div className="shrink-0 px-2.5 py-1.5 sm:p-2 border-b border-border-subtle bg-surface flex items-center gap-1.5 sm:gap-2">
            <div className="flex-1 grid grid-cols-3 gap-1 p-0.5 sm:p-1 rounded-xl bg-surface-raised border border-border-subtle/60">
              {/* Tab 1: Bạn bè */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ban_be')
                  setSearchQuery('')
                }}
                className={cn(
                  'h-7.5 sm:h-8.5 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold border-2 transition-colors duration-150 cursor-pointer select-none',
                  activeTab === 'ban_be'
                    ? 'border-brand/40 bg-brand/12 text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                )}
                title="Bạn bè"
                aria-label="Tab Bạn bè"
              >
                <Users className="size-3.5 shrink-0" />
                <span>Bạn bè</span>
                {onlineFriendsCount > 0 && (
                  <span
                    data-testid="friends-count-badge"
                    className="px-1 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 tabular-nums"
                  >
                    {onlineFriendsCount}{friends.length > 0 ? `/${friends.length}` : ''}
                  </span>
                )}
                {hasUnreadFriends && (
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                )}
              </button>

              {/* Tab 2: Toàn trường */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('toan_truong')
                  setSearchQuery('')
                }}
                className={cn(
                  'h-7.5 sm:h-8.5 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold border-2 transition-colors duration-150 cursor-pointer select-none',
                  activeTab === 'toan_truong'
                    ? 'border-brand/40 bg-brand/12 text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                )}
                title="Toàn trường"
                aria-label="Tab Toàn trường"
              >
                <School className="size-3.5 shrink-0" />
                <span>Trường</span>
                {coTinNhanMoiCampus && (
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                )}
              </button>

              {/* Tab 3: Phòng */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('phong')
                  setSearchQuery('')
                }}
                className={cn(
                  'h-7.5 sm:h-8.5 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold border-2 transition-colors duration-150 cursor-pointer select-none',
                  activeTab === 'phong'
                    ? 'border-brand/40 bg-brand/12 text-brand'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                )}
                title={inRoomInfo ? inRoomInfo.title : 'Phòng'}
                aria-label="Tab Phòng"
              >
                {inRoomInfo?.type === 'game' ? (
                  <Gamepad2 className="size-3.5 shrink-0" />
                ) : (
                  <GraduationCap className="size-3.5 shrink-0" />
                )}
                <span>Phòng</span>
                {inRoomInfo && (
                  <span className="size-2 rounded-full bg-emerald-400" />
                )}
              </button>
            </div>

            {/* Cụm công cụ bên phải: Nút bật tìm kiếm & Nút đóng */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSearchOpen((prev) => !prev)
                  if (searchOpen) setSearchQuery('')
                }}
                className={cn(
                  'size-8 sm:size-9 shrink-0 text-text-secondary hover:text-text-primary hover:bg-surface-overlay rounded-xl border border-border-subtle/60 cursor-pointer transition-colors',
                  (searchOpen || searchQuery) && 'text-brand bg-brand/12 border-brand/40',
                )}
                title={searchOpen ? 'Ẩn tìm kiếm' : 'Tìm kiếm'}
                aria-label="Tìm kiếm"
              >
                <Search className="size-3.5 sm:size-4" />
              </Button>

              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 sm:size-9 shrink-0 text-text-secondary hover:text-text-primary hover:bg-surface-overlay rounded-xl border border-border-subtle/60 cursor-pointer"
                    title="Đóng chat"
                    aria-label="Đóng chat"
                  />
                }
              >
                <X className="size-3.5 sm:size-4" />
                <span className="sr-only">Đóng</span>
              </SheetClose>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════════════════
              VÙNG 2: THANH SEARCH TÌM KIẾM (Thu gọn mặc định, mở ra khi người dùng cần)
              ════════════════════════════════════════════════════════════════════════════════ */}
          {(searchOpen || searchQuery) && (
            <div className="shrink-0 px-3 py-1.5 border-b border-border-subtle bg-surface animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'ban_be'
                      ? 'Tìm bạn bè…'
                      : activeTab === 'toan_truong'
                        ? 'Tìm tin nhắn toàn trường…'
                        : 'Tìm tin nhắn trong phòng…'
                  }
                  aria-label={
                    activeTab === 'ban_be'
                      ? 'Tìm bạn bè'
                      : activeTab === 'toan_truong'
                        ? 'Tìm tin nhắn toàn trường'
                        : 'Tìm tin nhắn trong phòng'
                  }
                  className="h-8 pl-9 pr-8 text-xs bg-surface-raised border-border-subtle rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5 rounded-full cursor-pointer"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════════════
              VÙNG 3: NỘI DUNG NHẮN TIN / DANH SÁCH BẠN BÈ
              ════════════════════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-h-0 flex flex-col bg-canvas overflow-hidden">
            {activeTab === 'phong' ? (
              inRoomInfo || effectiveRoomMessages ? (
                <CampusChatDrawer
                  messages={roomMessagesFiltered}
                  myPermissions={myPermissions}
                  onSendMessage={async (text) => {
                    if (effectiveOnSendRoomChat) {
                      await effectiveOnSendRoomChat(text)
                      return { ok: true, thanhCong: true }
                    }
                    return { ok: false, thanhCong: false, loi: 'Không có kết nối phòng' }
                  }}
                  onDeleteMessage={onDeleteMessage}
                  hideHeader
                  className="min-h-0 flex-1"
                  placeholder="Nhập tin nhắn trong phòng…"
                  emptyMessage={searchQuery ? 'Không tìm thấy tin nhắn nào khớp.' : 'Chưa có tin nhắn trong phòng.'}
                  scope="room"
                  roomId={inRoomInfo?.id ? String(inRoomInfo.id) : undefined}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
                  <Gamepad2 className="size-10 text-text-tertiary opacity-40 mb-2" />
                  <p className="text-xs font-semibold text-text-secondary">Bạn hiện không ở trong phòng nào</p>
                  <p className="text-[11px] text-text-tertiary mt-1">Vào phòng học hoặc bàn game để trò chuyện cùng mọi người.</p>
                </div>
              )
            ) : activeTab === 'toan_truong' ? (
              <CampusChatDrawer
                messages={campusMessagesFiltered}
                myPermissions={myPermissions}
                onSendMessage={onSendMessage}
                onDeleteMessage={onDeleteMessage}
                hideHeader
                className="min-h-0 flex-1"
                placeholder="Nhập tin nhắn toàn trường…"
                emptyMessage={searchQuery ? 'Không tìm thấy tin nhắn nào khớp.' : 'Chưa có tin nhắn toàn trường.'}
              />
            ) : currentDmTarget ? (
              <DirectMessageThread
                target={currentDmTarget}
                onBack={handleBackFromDm}
                className="min-h-0 flex-1"
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header danh sách bạn bè */}
                <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-text-secondary border-b border-border-subtle bg-surface/50">
                  <span>Bạn bè</span>
                  <span
                    data-testid="friends-count-badge"
                    className="text-[11px] text-text-tertiary font-normal"
                  >
                    <span className="text-emerald-400 font-semibold">{onlineFriendsCount}</span> trực tuyến / {friends.length} bạn
                  </span>
                </div>

                {/* Danh sách bạn bè cuộn */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1 min-h-0 styled-scrollbar">
                  {friendsFiltered.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <Users className="size-8 mx-auto text-text-tertiary opacity-40 mb-2" />
                      <p className="text-xs text-text-secondary">
                        {searchQuery ? 'Không tìm thấy bạn nào khớp.' : 'Chưa có bạn bè nào.'}
                      </p>
                    </div>
                  ) : (
                    friendsFiltered.map((friend) => {
                      const presence = presenceReady ? friendsPresence[friend.id] : undefined
                      const status = presenceReady ? (presence?.state ?? 'offline') : 'unknown'
                      const isOnline = status === 'online'
                      const isAway = status === 'away'
                      const isCoMat = isOnline || isAway
                      const isMarkedRead = daDocFriendIds.has(friend.id)
                      const unreadRaw = isMarkedRead ? 0 : (unreadCounts[friend.id] ?? (isMarkedRead ? 0 : friend.unreadCount) ?? 0)
                      const unread = Math.max(0, unreadRaw)
                      const viTriBan = layViTriBanBe(presence, rooms)

                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => handleSelectFriend(friend)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer group',
                            isCoMat
                              ? 'text-text-primary hover:bg-surface-raised opacity-100'
                              : 'text-text-secondary hover:bg-surface-raised opacity-60 hover:opacity-90',
                          )}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setNguoiXem({
                                id: friend.id,
                                ten: friend.displayName,
                                avatar: friend.avatar,
                                lopTen: friend.lopTen,
                                anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                              })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                e.preventDefault()
                                const rect = e.currentTarget.getBoundingClientRect()
                                setNguoiXem({
                                  id: friend.id,
                                  ten: friend.displayName,
                                  avatar: friend.avatar,
                                  lopTen: friend.lopTen,
                                  anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                                })
                              }
                            }}
                            className="relative shrink-0 cursor-pointer rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            title={`Xem thông tin ${friend.displayName}`}
                            aria-label={`Xem thông tin ${friend.displayName}`}
                          >
                            <AnhNguoiDung
                              ten={friend.displayName}
                              avatar={friend.avatar}
                              className={cn('size-10 text-sm transition-all', !isCoMat && 'grayscale-35 opacity-75')}
                            />
                            {unread > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 flex size-2.5 z-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                                <span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
                              </span>
                            )}
                            <span
                              className={cn(
                                'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
                                !presenceReady
                                  ? 'bg-slate-500'
                                  : isOnline
                                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
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
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={cn(
                                  'text-sm truncate transition-colors',
                                  isCoMat ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary',
                                )}
                              >
                                {friend.displayName}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {friend.lopTen && (
                                  <span className="text-[10px] text-text-tertiary rounded bg-surface-overlay px-1.5 py-0.2 shrink-0">
                                    {friend.lopTen}
                                  </span>
                                )}
                                {unread > 0 && (
                                  <span
                                    data-testid={`unread-badge-${friend.id}`}
                                    className="min-w-4.5 h-4.5 px-1.5 flex items-center justify-center rounded-full bg-destructive text-white text-[10px] font-bold leading-none tabular-nums shadow-xs shrink-0"
                                  >
                                    {unread > 100 ? '100+' : unread}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p
                              className={cn(
                                'text-[11px] truncate mt-0.5 leading-tight',
                                viTriBan.isOnline
                                  ? 'text-emerald-400 font-medium'
                                  : viTriBan.isAway
                                    ? 'text-amber-400'
                                    : 'text-text-tertiary',
                              )}
                              title={viTriBan.text}
                            >
                              {viTriBan.text}
                            </p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />
      </SheetContent>
    </Sheet>
  )
}
