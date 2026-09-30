import { useState, useMemo, useRef, useEffect } from 'react'
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
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, getInitials } from '@/lib/utils'
import { CampusChatDrawer } from '@/features/hub/CampusChatDrawer'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { NutQuanHe } from '@/components/social/NutQuanHe'
import { nhanVaiTro } from '@/components/social/quan-he'
import { useTimNguoiDung } from '@/hooks/use-tim-nguoi-dung'
import type { FriendItem } from '@shared/protocol/social'
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
    <div className="relative px-2 py-1.5 border-t border-white/10 bg-white/[0.01] shrink-0 select-none">
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
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-text-secondary active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow-xs"
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
}

export function GameSocialSidebar({
  roomId,
  roomName,
  chatBan,
  onInviteToGame,
  className,
  defaultTab,
  coChatPhong = true,
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

  const [activeTab, setActiveTab] = useState<SocialTab>(() => defaultTab ?? (chatBan && coChatPhong ? 'chat_phong' : 'chat_chung'))
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
    setSelectedFriend(friend)
    setActiveTab('ban_be')
  }

  const insertRoomEmoji = (emoji: string) => {
    setRoomText((prev) => prev + emoji)
    setIsRoomEmojiOpen(false)
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
        'flex flex-col h-[700px] xl:h-[720px] 2xl:h-[740px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1120] to-[#070b14] shadow-2xl backdrop-blur-md overflow-hidden',
        className
      )}
    >
      {/* VÙNG 1: Header Tabs (3 tabs: Chat phòng, Chat chung, Bạn bè) */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-1.5 shrink-0">
        <div className={cn('grid gap-1 w-full', coChatPhong ? 'grid-cols-3' : 'grid-cols-2')}>
          {/* Tab 1: Chat phòng */}
          {coChatPhong && (
            <button
              onClick={() => setActiveTab('chat_phong')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-150 cursor-pointer',
                activeTab === 'chat_phong'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
              )}
            >
              <Gamepad2 className="size-3.5 shrink-0" />
              <span className="truncate">Chat phòng</span>
            </button>
          )}

          {/* Tab 2: Chat chung */}
          <button
            onClick={() => setActiveTab('chat_chung')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-150 cursor-pointer',
              activeTab === 'chat_chung'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
            )}
          >
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="truncate">Chat chung</span>
          </button>

          {/* Tab 3: Bạn bè */}
          <button
            onClick={() => setActiveTab('ban_be')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-bold transition-all duration-150 cursor-pointer',
              activeTab === 'ban_be'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
            )}
          >
            <Users className="size-3.5 shrink-0" />
            <span className="truncate">Bạn bè</span>
            <span
              className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums shrink-0',
                onlineFriendsCount > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 text-text-tertiary'
              )}
              title={`${onlineFriendsCount} bạn đang trực tuyến`}
            >
              {onlineFriendsCount}
            </span>
          </button>
        </div>
      </div>

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
                <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                  <Gamepad2 className="size-5" />
                </div>
                <p className="text-xs font-semibold text-text-primary">Chat phòng chỉ có ở bàn đấu</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('chat_chung')}
                  className="mt-3 gap-1.5 border-white/10 cursor-pointer"
                >
                  <MessageSquare className="size-3.5" />
                  Mở Chat chung
                </Button>
              </div>
            ) : roomMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 px-3">
                <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
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
                      <div className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] text-text-tertiary text-center max-w-[90%] leading-relaxed flex items-center gap-1.5">
                        <Sparkles className="size-3 text-amber-400 shrink-0" />
                        <span>{m.text}</span>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex flex-col max-w-[85%]',
                      isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    {/* Tên người gửi & vai trò */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-text-secondary truncate max-w-[120px]">
                        {isMe ? 'Bạn' : m.senderName}
                      </span>
                      {m.role === 'player' ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          {m.playerSide ? `Đấu thủ ${m.playerSide}` : 'Đấu thủ'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          Khán giả
                        </span>
                      )}
                    </div>

                    {/* Khung nội dung */}
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-xs leading-relaxed break-words shadow-md',
                        isMe
                          ? 'bg-gradient-to-r from-amber-600/90 to-amber-500 text-white rounded-br-xs font-medium'
                          : 'bg-[#131b2e] border border-white/10 text-text-primary rounded-bl-xs'
                      )}
                    >
                      {m.text}
                    </div>

                    <span className="text-[9px] text-text-tertiary mt-0.5 px-1 tabular-nums">
                      {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(m.timestamp)}
                    </span>
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
            className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0"
          >
            <Popover open={isRoomEmojiOpen} onOpenChange={setIsRoomEmojiOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!chatBan}
                    className="size-8 text-text-tertiary hover:text-amber-400 shrink-0 cursor-pointer"
                    title="Chèn biểu cảm"
                  >
                    <Smile className="size-4" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0d1527] border-white/15 shadow-2xl">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertRoomEmoji(emoji)}
                      className="flex items-center justify-center p-1.5 text-base rounded hover:bg-white/10 active:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Input
              value={roomText}
              onChange={(e) => setRoomText(e.target.value)}
              maxLength={DO_DAI_TIN_BAN_TOI_DA}
              disabled={!chatBan}
              placeholder={
                !chatBan ? 'Chỉ có ở bàn đấu' : chatBan.daKetNoi ? 'Nhắn tới phòng game…' : 'Đang kết nối lại bàn…'
              }
              className="h-8 text-xs bg-white/5 border-white/10 focus-visible:ring-amber-500/40"
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
      {activeTab === 'chat_chung' && (
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
            className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0"
          >
            <Popover open={isCampusEmojiOpen} onOpenChange={setIsCampusEmojiOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-text-tertiary hover:text-cyan-400 shrink-0 cursor-pointer"
                    title="Chèn biểu cảm"
                  >
                    <Smile className="size-4" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0d1527] border-white/15 shadow-2xl">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setCampusText((prev) => prev + emoji)
                        setIsCampusEmojiOpen(false)
                      }}
                      className="flex items-center justify-center p-1.5 text-base rounded hover:bg-white/10 active:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Input
              value={campusText}
              onChange={(e) => setCampusText(e.target.value)}
              placeholder="Nhắn tới cả trường…"
              className="h-8 text-xs bg-white/5 border-white/10 focus-visible:ring-cyan-500/40"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2.5 shrink-0 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold cursor-pointer"
              disabled={!campusText.trim() || isSendingCampus}
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Tab 3: Bạn bè & Trò chuyện riêng (Gộp 2 trong 1) */}
      {activeTab === 'ban_be' && (
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

              <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0 opacity-60">
                <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary" disabled>
                  <Smile className="size-4" />
                </Button>
                <Input
                  disabled
                  placeholder="Đăng nhập để trò chuyện cùng bạn bè…"
                  className="h-8 text-xs bg-white/5 border-white/10 cursor-not-allowed"
                />
                <Button disabled size="sm" className="h-8 px-2.5 shrink-0 bg-white/10 text-text-tertiary">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : selectedFriend ? (
            // Giao diện trò chuyện riêng 1v1 khi đã chọn bạn
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header người bạn đang chat */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-text-tertiary hover:text-white cursor-pointer"
                    onClick={() => setSelectedFriend(null)}
                    title="Quay lại danh sách bạn bè"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setNguoiXem(nguoiXemTu(selectedFriend, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }))
                    }}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer group"
                    title="Xem hồ sơ & thao tác"
                  >
                    <div className="relative shrink-0">
                      <div className="flex size-7 items-center justify-center rounded-full bg-brand/20 text-brand text-xs font-bold ring-1 ring-white/10 group-hover:ring-brand/40 transition-all">
                        {getInitials(selectedFriend.displayName)}
                      </div>
                      <span
                        className={cn(
                          'absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-background',
                          getFriendPresence(selectedFriend.id).color
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate group-hover:text-brand transition-colors">{selectedFriend.displayName}</p>
                      <p className="text-[10px] text-text-tertiary truncate">
                        {getFriendPresence(selectedFriend.id).label}
                      </p>
                    </div>
                  </button>
                </div>

                {onInviteToGame && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onInviteToGame(selectedFriend.id, selectedFriend.displayName)}
                    className="gap-1 text-[11px] border-white/10 hover:bg-white/5 cursor-pointer"
                  >
                    <Gamepad2 className="size-3" />
                    Mời game
                  </Button>
                )}
              </div>

              {/* Campus chưa có tin nhắn riêng: không giả lập hộp thoại — chỉ ra cách liên lạc thật */}
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <MessageCircle className="size-7 text-text-tertiary mb-2" />
                  <p className="text-xs font-semibold text-text-primary">Chưa hỗ trợ tin nhắn riêng</p>
                  <p className="mt-1 text-[11px] text-text-tertiary max-w-[200px]">
                    Hệ thống hiện dùng Chat chung và Chat phòng học/bàn chơi
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('chat_chung')}
                      className="gap-1.5 border-white/10 cursor-pointer"
                    >
                      <MessageSquare className="size-3.5" />
                      Mở Chat chung
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setNguoiXem(nguoiXemTu(selectedFriend, { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }))
                      }}
                      className="gap-1.5 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      <User className="size-3.5" />
                      Xem hồ sơ
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0 opacity-60">
                <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary" disabled>
                  <Smile className="size-4" />
                </Button>
                <Input
                  disabled
                  placeholder="Tin nhắn riêng chưa được hỗ trợ"
                  className="h-8 text-xs bg-white/5 border-white/10 cursor-not-allowed"
                />
                <Button disabled size="sm" className="h-8 px-2.5 shrink-0 bg-white/10 text-text-tertiary">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            // Danh sách bạn bè kèm ô tìm kiếm
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Ô tìm kiếm bạn */}
              <div className="p-2.5 border-b border-white/5 bg-white/[0.01] shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-text-tertiary" />
                  <Input
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Tìm bạn bè hoặc người khác…"
                    className="h-8 pl-7 text-xs bg-white/5 border-white/10"
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
                          onClick={() => handleStartChatWithFriend(friend)}
                          className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/15 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
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
                              className="relative shrink-0 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                              data-testid={`ban-be-anh-${friend.id}`}
                            >
                              <AnhNguoiDung ten={friend.displayName} avatar={friend.avatar} className="size-8 text-xs" />
                              <span className={cn('absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-background', pres.color)} />
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text-primary truncate group-hover:text-purple-300 transition-colors">
                                {friend.displayName}
                              </p>
                              <p className="text-[10px] text-text-tertiary truncate">
                                {friend.lopTen ? `${friend.lopTen} · ` : ''}
                                {pres.label}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-text-tertiary hover:text-brand cursor-pointer"
                              onClick={() => handleStartChatWithFriend(friend)}
                              title="Nhắn tin"
                            >
                              <MessageCircle className="size-3.5" />
                            </Button>
                            {onInviteToGame && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-text-tertiary hover:text-cyan-400 cursor-pointer"
                                onClick={() => onInviteToGame(friend.id, friend.displayName)}
                                title="Mời chơi game"
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

              <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-1.5 shrink-0 opacity-60">
                <Button type="button" variant="ghost" size="icon" className="size-8 text-text-tertiary" disabled>
                  <Smile className="size-4" />
                </Button>
                <Input
                  disabled
                  placeholder="Chọn một người bạn ở trên để nhắn tin…"
                  className="h-8 text-xs bg-white/5 border-white/10 cursor-not-allowed"
                />
                <Button disabled size="sm" className="h-8 px-2.5 shrink-0 bg-white/10 text-text-tertiary">
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
      className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2"
      data-testid={`hang-nguoi-${id}`}
    >
      <button
        type="button"
        onClick={(e) => onXem(e)}
        aria-label={`Xem thông tin ${ten}`}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <AnhNguoiDung ten={ten} avatar={avatar} className="size-8 text-xs" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-text-primary">{ten}</span>
          {phu && <span className="block truncate text-[10px] text-text-tertiary">{phu}</span>}
        </span>
      </button>
      <NutQuanHe id={id} trangThaiMayChu={trangThaiMayChu} />
    </div>
  )
}
