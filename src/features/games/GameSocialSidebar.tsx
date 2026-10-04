import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Users,
  MessageCircle,
  Send,
  Search,
  Gamepad2,
  ArrowLeft,
  Smile,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, getInitials } from '@/lib/utils'
import { layTinNhanRieng, guiTinNhanRieng } from '@/lib/api'
import { CampusChatDrawer } from '@/features/hub/CampusChatDrawer'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { NutQuanHe } from '@/components/social/NutQuanHe'
import { nhanVaiTro } from '@/components/social/quan-he'
import { useTimNguoiDung } from '@/hooks/use-tim-nguoi-dung'
import type { FriendItem, DirectMessage } from '@shared/protocol/social'
import type { RoomChatMessage } from '@shared/protocol/room'
import { DO_DAI_TIN_BAN_TOI_DA } from '@/hooks/use-game'

export type SocialTab = 'chat_phong' | 'chat_chung' | 'ban_be'

const DANH_SACH_EMOJI = [
  '😊', '😂', '🔥', '👍', '👏', '🎉',
  '❤️', '🏆', '♟️', '🏮', '🎯', '⚡',
  '🚀', '😎', '🤝', '🙌', '💯', '✨',
  '🤩', '💪', '🎮', '✌️', '🫡', '👀'
]

const CHIPS_CHAT_PHONG_SNAKE = [
  'Né hay quá! 🔥',
  'Tăng tốc lên! ⚡',
  'Cố lên bạn ơi! 👏',
  'Ăn nhiều bánh vào! 🧁',
  'Sâu to quá! 🐍',
  'Cố lọt top 1 nào! 👑',
  'Chúc may mắn! 🍀',
  'Chào cả phòng! 👋',
  'Kịch tính quá! 💥',
]

const CHIPS_CHAT_PHONG_DEFAULT = [
  'Nước cờ hay quá! 👏',
  'Cố lên bạn ơi! 🔥',
  'Chúc may mắn! 🍀',
  'Trận đấu kịch tính quá! ⚡',
  'Chào cả phòng! 👋',
  'Bình tĩnh thi đấu nhé 🧘',
]

const CHIPS_CHAT_CHUNG = [
  'Chào cả trường! 👋',
  'Chúc mọi người học tốt! ✨',
  'Có ai chơi game không? 🎮',
  'Hello cả nhà! 😊',
  'Cố lên nhé! 🔥',
  'Chào buổi chiều! ☀️',
]

const CHIPS_BAN_BE = [
  'Chào bạn! 👋',
  'Vào chơi game cùng mình nhé! 🎮',
  'Đang rảnh không bạn? ☕',
  'Cố lên bạn ơi! 🔥',
  'Ok bạn nhé! 👍',
]

interface QuickChipsScrollProps {
  chips: string[]
  onSelectChip: (chip: string) => void
}

/**
 * Thanh tin nhắn nhanh có tính năng hold kéo ngang và chọn giống Vùng 5
 */
function QuickChipsScroll({ chips, onSelectChip }: QuickChipsScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const dragDistance = useRef(0)
  const [isDraggingActive, setIsDraggingActive] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const el = containerRef.current
    if (!el) return
    isDragging.current = true
    dragDistance.current = 0
    startX.current = e.pageX
    scrollLeftStart.current = el.scrollLeft

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const diffX = moveEvent.pageX - startX.current
      dragDistance.current = Math.abs(diffX)
      if (dragDistance.current > 6) {
        setIsDraggingActive(true)
        containerRef.current.scrollLeft = scrollLeftStart.current - diffX
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      setIsDraggingActive(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setTimeout(() => {
        dragDistance.current = 0
      }, 60)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleChipClick = (chip: string) => {
    if (dragDistance.current > 6) return
    onSelectChip(chip)
  }

  return (
    <div className="relative px-2 py-1.5 border-t border-border-default bg-surface-overlay shrink-0 select-none overflow-hidden">
      {/* Vệt mờ viền phải để chỉ dẫn danh sách còn tiếp tục cuộn ngang */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-surface-overlay via-surface-overlay/80 to-transparent z-10" />

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={cn(
          'flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none px-1 py-0.5 touch-pan-x',
          isDraggingActive ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface hover:bg-amber-500/20 hover:text-warning border border-border-default hover:border-amber-500/40 text-text-secondary active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface RoomMessage {
  id: string
  accountId?: number
  senderName: string
  role?: 'player' | 'spectator'
  playerSide?: string
  text: string
  timestamp: number
}

/** Chat phòng game thật của một bàn đấu: tin nhắn do RoomDO lưu và phát cho mọi người đang ở bàn. */
export interface ChatBan {
  tinNhan: RoomChatMessage[]
  /** Gửi tin; trả về false khi bàn đang mất kết nối. */
  gui: (text: string) => boolean
  daKetNoi: boolean
  /** Khoá ghế X / O của bàn — để gắn nhãn "Đấu thủ X/O" cho tin nhắn. */
  playerX: string | null
  playerO: string | null
}

interface GameSocialSidebarProps {
  roomId?: string
  roomName?: string
  userRole?: 'player' | 'spectator'
  playerSide?: string
  /** Chỉ bàn đấu online mới có chat phòng; sảnh và trò chơi đơn không có phòng chung nên tab này chỉ báo trống. */
  chatBan?: ChatBan
  onInviteToGame?: (friendId: number, friendName: string) => void
  className?: string
  defaultTab?: SocialTab
  /** Tab "Chat phòng" chỉ có nghĩa ở bàn đấu game; trang khác (Học tập) chỉ cần Chat chung + Bạn bè. */
  coChatPhong?: boolean
  /** Chế độ chỉ chat phòng của bàn đấu (ẩn Chat chung và Bạn bè) */
  roomOnly?: boolean
}

export function GameSocialSidebar({
  roomId,
  roomName,
  chatBan,
  onInviteToGame,
  className,
  defaultTab,
  coChatPhong = true,
  roomOnly = false,
}: GameSocialSidebarProps) {
  const { nguoiDung, moAuthModal } = usePhien()
  const {
    messages,
    myPermissions,
    guiChat,
    xoaChat,
    socialState,
    presenceMap,
  } = useCampus()

  const [activeTabRaw, setActiveTabRaw] = useState<SocialTab>(() => (roomOnly ? 'chat_phong' : (defaultTab ?? (chatBan && coChatPhong ? 'chat_phong' : 'chat_chung'))))
  const activeTab: SocialTab = roomOnly ? 'chat_phong' : activeTabRaw
  const setActiveTab = useCallback((tab: SocialTab) => {
    if (roomOnly) return
    setActiveTabRaw(tab)
  }, [roomOnly])
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null)
  const [friendSearch, setFriendSearch] = useState('')
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const [lanThuTim, setLanThuTim] = useState(0)
  const [isRoomEmojiOpen, setIsRoomEmojiOpen] = useState(false)
  const [roomText, setRoomText] = useState('')

  const [campusText, setCampusText] = useState('')
  const [isCampusEmojiOpen, setIsCampusEmojiOpen] = useState(false)
  const [isSendingCampus, setIsSendingCampus] = useState(false)

  const isSnakeRoom = Boolean(
    (roomName && /rắn|snake/i.test(roomName)) ||
    (roomId && /snake/i.test(roomId))
  )
  const quickChips = isSnakeRoom ? CHIPS_CHAT_PHONG_SNAKE : CHIPS_CHAT_PHONG_DEFAULT

  // ── Chat phòng: tin nhắn thật của bàn đấu (RoomDO lưu và phát cho người chơi lẫn người xem) ──
  const roomMessages = useMemo<RoomMessage[]>(
    () =>
      (chatBan?.tinNhan ?? [])
        .filter((m) => !m.text.startsWith('[SYS_'))
        .map((m) => {
        const khoa = `acc:${m.accountId}`
        const ben = khoa === chatBan?.playerX ? 'X' : khoa === chatBan?.playerO ? 'O' : undefined
        return {
          id: m.id,
          accountId: m.accountId,
          senderName: m.ten,
          role: ben ? 'player' : 'spectator',
          playerSide: ben,
          text: m.text,
          timestamp: m.taoLuc,
        }
      }),
    [chatBan?.tinNhan, chatBan?.playerX, chatBan?.playerO],
  )

  const roomMessagesContainerRef = useRef<HTMLDivElement>(null)
  const roomInputRef = useRef<HTMLInputElement>(null)
  const campusInputRef = useRef<HTMLInputElement>(null)

  // Cuộn an toàn nội bộ container (tuân thủ nguyên tắc Zero CLS & Anti-Jitter, cấm window scroll)
  useEffect(() => {
    if (activeTab === 'chat_phong' && roomMessagesContainerRef.current) {
      roomMessagesContainerRef.current.scrollTo({
        top: roomMessagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [activeTab, roomMessages])

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])

  // Tính số bạn bè đang online
  const onlineFriendsCount = useMemo(() => {
    return friends.filter((f) => {
      const p = presenceMap[f.id]
      return p && (p.state === 'online' || p.state === 'away')
    }).length
  }, [friends, presenceMap])

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends
    const q = friendSearch.toLowerCase()
    return friends.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        (f.lopTen && f.lopTen.toLowerCase().includes(q))
    )
  }, [friends, friendSearch])

  // Tìm cả người chưa kết bạn: bạn bè lọc ngay trong máy, người khác hỏi máy chủ (trả tối đa 10, đã loại người chặn nhau).
  const tuKhoaTim = friendSearch.trim()
  const timNguoi = useTimNguoiDung(tuKhoaTim, activeTab === 'ban_be' && Boolean(nguoiDung), lanThuTim)
  const ketQuaKhop = timNguoi.status !== 'idle' && timNguoi.query === tuKhoaTim
  const dangTimNguoi = tuKhoaTim !== '' && !(ketQuaKhop && timNguoi.status !== 'searching')
  const loiTimNguoi = ketQuaKhop && timNguoi.status === 'error'
  const friendIdSet = useMemo(() => new Set(friends.map((f) => f.id)), [friends])
  const nguoiKhac = useMemo(
    () =>
      ketQuaKhop && timNguoi.status === 'success'
        ? timNguoi.results.filter(
            (r) => !friendIdSet.has(r.id) && r.relationshipStatus !== 'friend' && r.relationshipStatus !== 'self',
          )
        : [],
    [ketQuaKhop, timNguoi, friendIdSet],
  )
  const loiMoiDen = socialState?.incomingRequests ?? []

  const handleSendRoomMessage = (customText?: string) => {
    const textToSend = (customText ?? roomText).trim()
    if (!textToSend || !chatBan) return
    if (!chatBan.gui(textToSend)) {
      toast.error('Bàn đang mất kết nối — thử gửi lại sau giây lát.')
      return
    }
    if (!customText) setRoomText('')
  }

  const handleStartChatWithFriend = (friend: FriendItem) => {
    if (roomOnly) return
    setSelectedFriend(friend)
    setActiveTab('ban_be')
  }

  useEffect(() => {
    if (roomOnly) return
    const handleOpenDM = (e: Event) => {
      const ce = e as CustomEvent<{ id: number; displayName: string; avatar?: string | null; lopTen?: string | null }>
      if (!ce.detail) return
      const { id, displayName, avatar, lopTen } = ce.detail
      setSelectedFriend({
        id,
        displayName,
        username: '',
        avatar: avatar ?? null,
        lopTen: lopTen ?? null,
        role: 'hoc_sinh',
        friendedAt: Date.now(),
      })
      setActiveTab('ban_be')
    }
    window.addEventListener('campus:open-dm', handleOpenDM)
    return () => window.removeEventListener('campus:open-dm', handleOpenDM)
  }, [roomOnly, setActiveTab])

  const insertRoomEmoji = (emoji: string) => {
    setRoomText((prev) => (prev + emoji).slice(0, DO_DAI_TIN_BAN_TOI_DA))
    setIsRoomEmojiOpen(false)
    setTimeout(() => {
      roomInputRef.current?.focus({ preventScroll: true })
    }, 0)
  }

  const getFriendPresence = (friendId: number) => {
    const p = presenceMap[friendId]
    if (!p) return { isOnline: false, label: 'Ngoại tuyến', color: 'bg-zinc-500' }
    if (p.state === 'online') {
      if (p.activity?.type === 'room') {
        return { isOnline: true, label: 'Đang trong phòng học', color: 'bg-purple-500 ring-2 ring-purple-400/40' }
      }
      return { isOnline: true, label: 'Trực tuyến', color: 'bg-emerald-500 ring-2 ring-emerald-400/40' }
    }
    if (p.state === 'away') {
      return { isOnline: true, label: 'Tạm vắng', color: 'bg-amber-500' }
    }
    return { isOnline: false, label: 'Ngoại tuyến', color: 'bg-zinc-500' }
  }

  return (
    <aside
      aria-label="Cột cộng đồng & trò chuyện"
      className={cn(
        'flex min-w-0 flex-col h-[max(420px,min(740px,calc(100dvh-10rem)))] rounded-2xl border border-border-default bg-surface overflow-hidden',
        className
      )}
    >
      {!roomOnly && (
        <div className="shrink-0 border-b border-border-subtle p-2" role="group" aria-label="Loại trò chuyện">
          <div className={cn('grid min-w-0 gap-1', coChatPhong ? 'grid-cols-3' : 'grid-cols-2')}>
            {coChatPhong && (
              <button type="button" aria-label="Chat phòng" title="Chat phòng" aria-pressed={activeTab === 'chat_phong'} onClick={() => setActiveTab('chat_phong')}
                className={cn('flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand', activeTab === 'chat_phong' ? 'bg-amber-500/15 text-warning' : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary')}>
                <Gamepad2 className="size-4 shrink-0" /><span>Chat phòng</span>
              </button>
            )}
            <button type="button" aria-label="Chat chung" title="Chat chung" aria-pressed={activeTab === 'chat_chung'} onClick={() => setActiveTab('chat_chung')}
              className={cn('flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand', activeTab === 'chat_chung' ? 'bg-brand/12 text-brand' : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary')}>
              <MessageSquare className="size-4 shrink-0" /><span>Chat chung</span>
            </button>
            <button type="button" aria-label="Bạn bè" title="Bạn bè" aria-pressed={activeTab === 'ban_be'} onClick={() => setActiveTab('ban_be')}
              className={cn('flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand', activeTab === 'ban_be' ? 'bg-purple-500/15 text-social' : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary')}>
              <Users className="size-4 shrink-0" />
              <span className="flex items-center justify-center gap-1">Bạn bè<span aria-hidden title={onlineFriendsCount + ' bạn đang trực tuyến'} className="rounded-md bg-success/10 px-1 text-success tabular-nums">{onlineFriendsCount > 99 ? '99+' : onlineFriendsCount}</span></span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Chat phòng (Trò chuyện giữa người chơi & người xem trong phòng game) */}
      {coChatPhong && activeTab === 'chat_phong' && (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
          {/* Danh sách tin nhắn phòng */}
          <div
            ref={roomMessagesContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0"
          >
            {!chatBan ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 px-3">
                <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-warning mb-2">
                  <Gamepad2 className="size-5" />
                </div>
                <p className="text-xs font-semibold text-text-primary">Chat phòng chỉ có ở bàn đấu</p>
                {!roomOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('chat_chung')}
                    className="mt-3 gap-1.5 border-border-default cursor-pointer"
                  >
                    <MessageSquare className="size-3.5" />
                    Mở Chat chung
                  </Button>
                )}
              </div>
            ) : roomMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 px-3">
                <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-warning mb-2">
                  <Gamepad2 className="size-5" />
                </div>
                <p className="text-xs font-semibold text-text-primary">Chưa có tin nhắn trong phòng</p>
                <p className="text-[11px] text-text-tertiary mt-1 leading-relaxed">
                  {isSnakeRoom
                    ? 'Gửi tin nhắn nhanh bên dưới để cổ vũ và giao lưu cùng các đấu thủ!'
                    : 'Gửi tin nhắn nhanh bên dưới để giao lưu cùng người chơi & khán giả!'}
                </p>
              </div>
            ) : (
              roomMessages.map((m) => {
                const isMe = nguoiDung && m.accountId ? m.accountId === nguoiDung.accountId : false
                const isSystem = m.id.startsWith('system_')

                if (isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center my-1.5">
                      <div className="rounded-full bg-surface-overlay border border-border-default px-3 py-1 text-[10px] text-text-tertiary text-center max-w-[90%] leading-relaxed flex items-center gap-1.5">
                        <Sparkles className="size-3 text-warning shrink-0" />
                        <span>{m.text}</span>
                      </div>
                    </div>
                  )
                }

                const tenNguoiGui = isMe ? (nguoiDung?.ten || nguoiDung?.username || 'Bạn') : m.senderName
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-end gap-2 max-w-[88%]',
                      isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-[10px] font-bold text-text-secondary"
                    >
                      {getInitials(tenNguoiGui)}
                    </span>
                    <div className={cn('flex flex-col min-w-0', isMe ? 'items-end' : 'items-start')}>
                      {/* Tên người gửi & vai trò */}
                      <div className={cn('flex items-center gap-1.5 mb-1 px-1', isMe && 'flex-row-reverse')}>
                        <span className="text-[11px] font-bold text-text-secondary truncate max-w-[120px]">
                          {tenNguoiGui}
                        </span>
                        {m.role === 'player' ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-brand/12 text-brand border border-brand/30">
                            {m.playerSide ? `Đấu thủ ${m.playerSide}` : 'Đấu thủ'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/15 text-social border border-purple-500/30">
                            Khán giả
                          </span>
                        )}
                      </div>

                      {/* Khung nội dung */}
                      <div
                        className={cn(
                          'rounded-2xl px-3 py-2 text-xs leading-relaxed break-words shadow-md',
                          isMe
                            ? 'bg-gradient-to-r from-amber-600/90 to-amber-500 text-text-primary rounded-br-xs font-medium'
                            : 'bg-[#131b2e] border border-border-default text-text-primary rounded-bl-xs'
                        )}
                      >
                        {m.text}
                      </div>

                      <span className="text-[9px] text-text-tertiary mt-0.5 px-1 tabular-nums">
                        {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(m.timestamp)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* VÙNG 4: Tin nhắn nhanh hỗ trợ hold kéo ngang và chọn giống Vùng 5 */}
          <QuickChipsScroll
            chips={quickChips}
            onSelectChip={(chip) => {
              if (!chatBan) {
                toast.info('Hãy vào một bàn đấu để chat phòng — ở đây dùng Chat chung nhé.')
                return
              }
              handleSendRoomMessage(chip)
            }}
          />

          {/* Form gửi tin nhắn phòng */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendRoomMessage()
            }}
            className="p-2 border-t border-border-default bg-surface-overlay flex items-center gap-1.5 shrink-0"
          >
            <Popover open={isRoomEmojiOpen} onOpenChange={setIsRoomEmojiOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!chatBan}
                    className="size-8 text-text-tertiary hover:text-warning shrink-0 cursor-pointer"
                    title="Chèn biểu cảm"
                  >
                    <Smile className="size-4" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0d1527] border-border-default shadow-2xl">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertRoomEmoji(emoji)}
                      className="flex items-center justify-center p-1.5 text-base rounded hover:bg-surface-overlay active:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Input
              ref={roomInputRef}
              value={roomText}
              onChange={(e) => setRoomText(e.target.value)}
              maxLength={DO_DAI_TIN_BAN_TOI_DA}
              disabled={!chatBan}
              placeholder={
                !chatBan ? 'Chỉ có ở bàn đấu' : chatBan.daKetNoi ? 'Nhắn tới phòng game…' : 'Đang kết nối lại bàn…'
              }
              className="h-8 text-xs bg-surface-overlay border-border-default focus-visible:ring-amber-500/40"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2.5 shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
              disabled={!roomText.trim() || !chatBan?.daKetNoi}
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Chat chung (Sảnh toàn trường) */}
      {!roomOnly && activeTab === 'chat_chung' && (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
          <CampusChatDrawer
            messages={messages}
            myPermissions={myPermissions}
            onSendMessage={guiChat}
            onDeleteMessage={xoaChat}
            hideHeader={true}
            hideInput={true}
            className="border-none bg-transparent flex-1 h-full shadow-none p-0 min-h-0"
          />

          {/* VÙNG 3 ĐỒNG BỘ: Quick chips của chat chung */}
          <QuickChipsScroll
            chips={CHIPS_CHAT_CHUNG}
            onSelectChip={(chip) => {
              void guiChat(chip)
            }}
          />

          {/* Form gửi tin nhắn chung chuẩn đồng bộ 1 style */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!campusText.trim() || isSendingCampus) return
              setIsSendingCampus(true)
              guiChat(campusText.trim())
                .then((res) => {
                  if (res.ok) setCampusText('')
                })
                .finally(() => setIsSendingCampus(false))
            }}
            className="p-2 border-t border-border-default bg-surface-overlay flex items-center gap-1.5 shrink-0"
          >
            <Popover open={isCampusEmojiOpen} onOpenChange={setIsCampusEmojiOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-text-tertiary hover:text-brand shrink-0 cursor-pointer"
                    title="Chèn biểu cảm"
                  >
                    <Smile className="size-4" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0d1527] border-border-default shadow-2xl">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setCampusText((prev) => prev + emoji)
                        setIsCampusEmojiOpen(false)
                        setTimeout(() => {
                          campusInputRef.current?.focus({ preventScroll: true })
                        }, 0)
                      }}
                      className="flex items-center justify-center p-1.5 text-base rounded hover:bg-surface-overlay active:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Input
              ref={campusInputRef}
              value={campusText}
              onChange={(e) => setCampusText(e.target.value)}
              placeholder="Nhắn tới cả trường…"
              className="h-8 text-xs bg-surface-overlay border-border-default focus-visible:ring-brand/40"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2.5 shrink-0 bg-brand hover:bg-brand-hover text-primary-foreground font-bold cursor-pointer"
              disabled={!campusText.trim() || isSendingCampus}
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Tab 3: Bạn bè & Trò chuyện riêng (Gộp 2 trong 1) */}
      {!roomOnly && activeTab === 'ban_be' && (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
          {!nguoiDung ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Users className="size-8 text-text-tertiary mb-2" />
                <p className="text-sm font-semibold text-text-primary">Bạn bè & Chat riêng</p>
                <p className="text-xs text-text-secondary mt-1">Đăng nhập để trò chuyện và kết nối cùng bạn bè.</p>
                <Button size="sm" onClick={() => moAuthModal('dang_nhap')} className="mt-4 cursor-pointer">
                  Đăng nhập
                </Button>
              </div>

              {/* VÙNG 3 ĐỒNG BỘ: Giữ nguyên style và chiều cao khi chưa đăng nhập */}
              <QuickChipsScroll
                chips={CHIPS_BAN_BE}
                onSelectChip={(_chip) => {
                  moAuthModal('dang_nhap')
                }}
              />

              <div className="p-2 border-t border-border-default bg-surface-overlay flex items-center gap-1.5 shrink-0 opacity-60">
                <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary" disabled>
                  <Smile className="size-4" />
                </Button>
                <Input
                  disabled
                  placeholder="Đăng nhập để trò chuyện cùng bạn bè…"
                  className="h-8 text-xs bg-surface-overlay border-border-default cursor-not-allowed"
                />
                <Button disabled size="sm" className="h-8 px-2.5 shrink-0 bg-surface-overlay text-text-tertiary">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : selectedFriend ? (
            <HopChatRieng11
              friend={selectedFriend}
              myId={nguoiDung?.accountId}
              presenceInfo={getFriendPresence(selectedFriend.id)}
              onOpenProfile={(rect) =>
                setNguoiXem(nguoiXemTu(selectedFriend, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }))
              }
              onInviteToGame={onInviteToGame}
              onBack={() => setSelectedFriend(null)}
            />
          ) : (
            // Danh sách bạn bè kèm ô tìm kiếm
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Ô tìm kiếm bạn */}
              <div className="p-2.5 border-b border-border-default bg-surface-overlay shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-text-tertiary" />
                  <Input
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Tìm bạn bè hoặc người khác…"
                    className="h-8 pl-7 text-xs bg-surface-overlay border-border-default"
                  />
                </div>
              </div>

              {/* Danh sách: lời mời đến · bạn bè · (khi tìm) người khác */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0" data-testid="danh-sach-ban-be">
                {!tuKhoaTim && loiMoiDen.length > 0 && (
                  <section aria-label="Lời mời kết bạn" className="space-y-1.5 pb-1" data-testid="loi-moi-den">
                    <p className="px-1 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
                      Lời mời <span className="tabular-nums">{loiMoiDen.length}</span>
                    </p>
                    {loiMoiDen.map((r) =>
                      r.sender ? (
                        <HangNguoi
                          key={r.id}
                          id={r.sender.id}
                          ten={r.sender.displayName}
                          avatar={r.sender.avatar}
                          phu={r.sender.lopTen ?? nhanVaiTro(r.sender.role)}
                          onXem={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setNguoiXem(
                              nguoiXemTu(r.sender!, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }),
                            )
                          }}
                        />
                      ) : null,
                    )}
                  </section>
                )}

                {filteredFriends.length > 0 && (
                  <>
                    {tuKhoaTim && <p className="px-1 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">Bạn bè</p>}
                    {filteredFriends.map((friend) => {
                      const pres = getFriendPresence(friend.id)
                      return (
                        <div
                          key={friend.id}
                          data-testid={`game-friend-${friend.id}`}
                          onClick={() => handleStartChatWithFriend(friend)}
                          className="flex min-w-0 flex-wrap items-center gap-3 border-b border-border-subtle p-3 hover:bg-surface-overlay transition-colors cursor-pointer group"
                        >
                          <div className="flex min-w-0 grow basis-48 items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const rect = e.currentTarget.getBoundingClientRect()
                                setNguoiXem(
                                  nguoiXemTu(friend, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }),
                                )
                              }}
                              aria-label={`Xem thông tin ${friend.displayName}`}
                              className="relative size-11 shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                              data-testid={`ban-be-anh-${friend.id}`}
                            >
                              <AnhNguoiDung ten={friend.displayName} avatar={friend.avatar} className="size-11 text-sm" />
                              <span className={cn('absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-background', pres.color)} />
                            </button>
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-text-primary">
                                {friend.displayName}
                              </p>
                              <p className="break-words text-xs text-text-secondary">
                                {friend.lopTen ? `${friend.lopTen} · ` : ''}
                                {pres.label}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              className="text-text-secondary hover:text-brand cursor-pointer"
                              onClick={() => handleStartChatWithFriend(friend)}
                              title="Nhắn tin"
                              aria-label={`Nhắn tin với ${friend.displayName}`}
                            >
                              <MessageCircle className="size-3.5" />
                            </Button>
                            {onInviteToGame && (
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                className="text-text-secondary hover:text-brand cursor-pointer"
                                onClick={() => onInviteToGame(friend.id, friend.displayName)}
                                title="Mời chơi game"
                                aria-label={`Mời ${friend.displayName} chơi game`}
                              >
                                <Gamepad2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {tuKhoaTim && (
                  <section aria-label="Người khác" className="space-y-1.5" data-testid="ket-qua-tim-nguoi">
                    {(nguoiKhac.length > 0 || dangTimNguoi) && (
                      <p className="flex items-center gap-1.5 px-1 pt-1 text-[10px] font-bold tracking-wider text-text-tertiary uppercase">
                        Người khác
                        {dangTimNguoi && <Loader2 className="size-3 animate-spin" aria-label="Đang tìm" />}
                      </p>
                    )}
                    {nguoiKhac.map((r) => (
                      <HangNguoi
                        key={r.id}
                        id={r.id}
                        ten={r.displayName}
                        avatar={r.avatar}
                        phu={r.lopTen ?? nhanVaiTro(r.role)}
                        trangThaiMayChu={r.relationshipStatus}
                        onXem={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setNguoiXem(
                            nguoiXemTu(r, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }),
                          )
                        }}
                      />
                    ))}
                    {loiTimNguoi && (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-text-secondary">
                        Không tìm được người dùng.
                        <Button size="xs" variant="outline" onClick={() => setLanThuTim((n) => n + 1)}>
                          Thử lại
                        </Button>
                      </div>
                    )}
                  </section>
                )}

                {((!tuKhoaTim && filteredFriends.length === 0 && loiMoiDen.length === 0) ||
                  (tuKhoaTim && !dangTimNguoi && !loiTimNguoi && filteredFriends.length === 0 && nguoiKhac.length === 0)) && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Users className="size-6 text-text-tertiary mb-2" />
                    <p className="text-xs text-text-secondary">
                      {tuKhoaTim ? 'Không tìm thấy ai khớp.' : 'Danh sách bạn bè đang trống.'}
                    </p>
                  </div>
                )}
              </div>

              {/* VÙNG 3 ĐỒNG BỘ: Giữ nguyên style và chiều cao khi đang ở danh sách bạn bè */}
              <QuickChipsScroll
                chips={CHIPS_BAN_BE}
                onSelectChip={(_chip) => {
                  toast.info('Tin nhắn riêng chưa được hỗ trợ — hãy dùng Chat chung nhé.')
                }}
              />

              <div className="p-2 border-t border-border-default bg-surface-overlay flex items-center gap-1.5 shrink-0 opacity-60">
                <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary" disabled>
                  <Smile className="size-4" />
                </Button>
                <Input
                  disabled
                  placeholder="Chọn một người bạn ở trên để nhắn tin…"
                  className="h-8 text-xs bg-surface-overlay border-border-default cursor-not-allowed"
                />
                <Button disabled size="sm" className="h-8 px-2.5 shrink-0 bg-surface-overlay text-text-tertiary">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />
    </aside>
  )
}

/** Người trong danh sách bạn bè / lời mời / kết quả tìm kiếm → thông tin đã biết sẵn để hiện ngay trong hồ sơ. */
function nguoiXemTu(
  p: { id: number; displayName: string; lopTen: string | null; role: string; avatar: string | null },
  anchorRect?: import('@/components/social/HoSoNguoiDungDialog').AnchorRect | null,
): NguoiXem {
  return { id: p.id, ten: p.displayName, lopTen: p.lopTen, vaiTro: p.role, avatar: p.avatar, anchorRect }
}

/** Một dòng người: bấm ảnh / tên để xem hồ sơ, nút kết bạn ở bên phải. */
function HangNguoi({
  id,
  ten,
  avatar,
  phu,
  trangThaiMayChu,
  onXem,
}: {
  id: number
  ten: string
  avatar: string | null
  phu: string | null
  trangThaiMayChu?: import('@shared/protocol/social').RelationshipStatus
  onXem: (e: React.MouseEvent<HTMLElement>) => void
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-3 border-b border-border-subtle p-3"
      data-testid={`hang-nguoi-${id}`}
    >
      <button
        type="button"
        onClick={(e) => onXem(e)}
        aria-label={`Xem thông tin ${ten}`}
        className="flex min-h-11 min-w-0 grow basis-48 cursor-pointer items-center gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <AnhNguoiDung ten={ten} avatar={avatar} className="size-10 text-sm" />
        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold text-text-primary">{ten}</span>
          {phu && <span className="block break-words text-xs text-text-secondary">{phu}</span>}
        </span>
      </button>
      <NutQuanHe id={id} trangThaiMayChu={trangThaiMayChu} />
    </div>
  )
}

function HopChatRieng11({
  friend,
  myId,
  presenceInfo,
  onOpenProfile,
  onInviteToGame,
  onBack,
}: {
  friend: FriendItem
  myId?: number
  presenceInfo: { label: string; color: string }
  onOpenProfile: (rect: DOMRect) => void
  onInviteToGame?: (friendId: number, friendName: string) => void
  onBack: () => void
}) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cuonXuongCuoi = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      }
    })
  }, [])

  useEffect(() => {
    let unmounted = false
    setLoading(true)
    layTinNhanRieng(friend.id)
      .then((res) => {
        if (!unmounted) {
          setMessages(res.messages)
          setLoading(false)
          cuonXuongCuoi()
        }
      })
      .catch(() => {
        if (!unmounted) setLoading(false)
      })
    return () => {
      unmounted = true
    }
  }, [friend.id, cuonXuongCuoi])

  useEffect(() => {
    const handleDm = (e: Event) => {
      const custom = e as CustomEvent<DirectMessage>
      const msg = custom.detail
      if (!msg) return
      if (
        (msg.senderId === friend.id && msg.receiverId === myId) ||
        (msg.senderId === myId && msg.receiverId === friend.id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        cuonXuongCuoi()
      }
    }

    window.addEventListener('campus:direct_message', handleDm)
    return () => window.removeEventListener('campus:direct_message', handleDm)
  }, [friend.id, myId, cuonXuongCuoi])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = text.trim()
    if (!content || sending) return

    setSending(true)
    try {
      const sent = await guiTinNhanRieng(friend.id, content)
      setText('')
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev
        return [...prev, sent]
      })
      cuonXuongCuoi()
    } catch (err: any) {
      toast.error(err?.message || 'Không gửi được tin nhắn.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle p-3">
        <div className="flex min-w-0 grow basis-48 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onBack}
            className="shrink-0 text-text-secondary hover:text-text-primary cursor-pointer"
            aria-label="Quay lại danh sách bạn bè"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <button
            type="button"
            onClick={(e) => onOpenProfile(e.currentTarget.getBoundingClientRect())}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left hover:opacity-85 transition-opacity group cursor-pointer"
            title="Xem hồ sơ & thao tác"
          >
            <div className="relative shrink-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold ring-1 ring-white/10 group-hover:ring-brand/40 transition-all">
                {getInitials(friend.displayName)}
              </div>
              <span
                className={cn(
                  'absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-background',
                  presenceInfo.color
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
                {friend.displayName}
              </p>
              <p className="break-words text-xs text-text-secondary">{presenceInfo.label}</p>
            </div>
          </button>
        </div>

        {onInviteToGame && (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => onInviteToGame(friend.id, friend.displayName)}
            className="cursor-pointer"
            title="Mời chơi game"
            aria-label={`Mời ${friend.displayName} chơi game`}
          >
            <Gamepad2 className="size-3" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 min-h-0 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-text-tertiary">
            <Loader2 className="size-4 animate-spin mr-1.5" />
            Đang tải tin nhắn…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <MessageCircle className="size-7 text-brand/60 mb-2" />
            <p className="text-xs font-bold text-text-primary">Chưa có tin nhắn nào</p>
            <p className="mt-1 text-[11px] text-text-tertiary max-w-[200px]">
              Gửi tin nhắn riêng để trò chuyện và thảo luận với {friend.displayName}!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === myId
            return (
              <div
                key={m.id}
                className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'px-3 py-1.5 text-xs max-w-[85%] break-words shadow-sm',
                    isMe
                      ? 'bg-brand/20 border border-brand/35 text-brand rounded-2xl rounded-tr-xs'
                      : 'bg-surface-overlay border border-border-default text-text-primary rounded-2xl rounded-tl-xs',
                  )}
                >
                  {m.noiDung}
                </div>
                <span className="text-[9px] text-text-tertiary mt-0.5 px-1 font-mono">
                  {new Date(m.taoLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="p-2 border-t border-border-default bg-surface-overlay flex items-center gap-1.5 shrink-0"
      >
        <Popover>
          <PopoverTrigger
            render={
              <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary hover:text-text-primary cursor-pointer">
                <Smile className="size-4" />
              </Button>
            }
          />
          <PopoverContent side="top" align="start" className="w-64 p-2 bg-surface border-border-default shadow-2xl">
            <div className="grid grid-cols-6 gap-1">
              {DANH_SACH_EMOJI.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setText((t) => t + emo)}
                  className="size-8 text-lg flex items-center justify-center rounded-lg hover:bg-surface-overlay cursor-pointer"
                >
                  {emo}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Nhắn tin cho ${friend.displayName}…`}
          disabled={sending}
          className="h-8 text-xs bg-surface-overlay border-border-default text-text-primary placeholder:text-text-tertiary focus-visible:ring-1 focus-visible:ring-brand"
        />
        <Button
          type="submit"
          disabled={!text.trim() || sending}
          size="sm"
          className="h-8 px-2.5 shrink-0 bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-40 cursor-pointer"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        </Button>
      </form>
    </div>
  )
}
