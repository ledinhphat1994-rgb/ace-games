import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  Clock,
  Loader2,
  MessageSquare,
  Radio,
  SendHorizontal,
  Smile,
  User,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCampusContext } from '@/app/CampusContext'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatLastSeen } from '@/features/hub/social-semantics'
import { guiTinNhanRieng, layTinNhanRieng } from '@/lib/api'
import { cn } from '@/lib/utils'
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

export function DirectMessageThread({ target, onBack, className }: DirectMessageThreadProps) {
  const { nguoiDung } = usePhien()
  const {
    socialState,
    friendsPresence,
    presenceReady,
    sendFriendRequest,
  } = useCampusContext()

  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noiDung, setNoiDung] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [dangKetBan, setDangKetBan] = useState(false)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const [bayGio, setBayGio] = useState(() => Date.now())

  const khungRef = useRef<HTMLDivElement | null>(null)
  const daCuonLanDau = useRef(false)
  const oDayRef = useRef(true)
  const [oDay, setODay] = useState(true)

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

  // Định kỳ cập nhật thời gian
  useEffect(() => {
    const timer = setInterval(() => setBayGio(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const [taiLaiCount, setTaiLaiCount] = useState(0)

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError(null)
    daCuonLanDau.current = false
    oDayRef.current = true
    setODay(true)

    layTinNhanRieng(target.id)
      .then((msgs) => {
        if (!ignore) setMessages(msgs)
      })
      .catch((err) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Không tải được tin nhắn'
          setError(msg)
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [target.id, taiLaiCount])

  // Lắng nghe tin nhắn realtime từ CampusDO (qua CampusContext)
  useEffect(() => {
    const handleDirectMessage = (e: Event) => {
      const ce = e as CustomEvent<DirectMessage>
      const msg = ce.detail
      if (!msg) return
      // Kiểm tra xem tin nhắn này có thuộc cuộc trò chuyện hiện tại không
      const hopLe =
        (msg.senderId === target.id && msg.receiverId === nguoiDung?.accountId) ||
        (msg.senderId === nguoiDung?.accountId && msg.receiverId === target.id)

      if (hopLe) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    window.addEventListener('campus:direct_message', handleDirectMessage)
    return () => window.removeEventListener('campus:direct_message', handleDirectMessage)
  }, [target.id, nguoiDung?.accountId])

  // Điều khiển cuộn nội bộ
  const idTinCuoi = messages.length > 0 ? messages[messages.length - 1].id : null
  const tinCuoiCuaMinh =
    messages.length > 0 && messages[messages.length - 1].senderId === nguoiDung?.accountId

  useLayoutEffect(() => {
    const khung = khungRef.current
    if (!khung || idTinCuoi === null) return
    if (!daCuonLanDau.current) {
      daCuonLanDau.current = true
      khung.scrollTop = khung.scrollHeight
      return
    }
    if (oDayRef.current || tinCuoiCuaMinh) {
      khung.scrollTop = khung.scrollHeight
    }
  }, [idTinCuoi, tinCuoiCuaMinh])

  const xuLyCuon = () => {
    const khung = khungRef.current
    if (!khung) return
    const cachDay = khung.scrollHeight - khung.scrollTop - khung.clientHeight
    const hienODay = cachDay < NGUONG_DAY_PX
    oDayRef.current = hienODay
    setODay(hienODay)
  }

  const cuonXuongDay = () => {
    const khung = khungRef.current
    if (!khung) return
    khung.scrollTop = khung.scrollHeight
    oDayRef.current = true
    setODay(true)
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = noiDung.trim()
    if (!text || dangGui) return

    setDangGui(true)
    try {
      const newMsg = await guiTinNhanRieng(target.id, text)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      setNoiDung('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không gửi được tin nhắn')
    } finally {
      setDangGui(false)
    }
  }

  const handleSendFriendRequest = async () => {
    setDangKetBan(true)
    try {
      const res = await sendFriendRequest(target.id)
      if (res.ok) {
        toast.success('Đã gửi lời mời kết bạn!')
      } else {
        toast.error(res.loi || 'Không gửi được lời mời.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi kết nối')
    } finally {
      setDangKetBan(false)
    }
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-canvas', className)}>
      {/* 1. Header cuộc trò chuyện */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={onBack}
              className="sm:hidden -ml-2 text-text-secondary hover:text-text-primary"
              aria-label="Quay lại danh sách trò chuyện"
            >
              <ArrowLeft className="size-4.5" />
            </Button>
          )}

          <div className="relative shrink-0">
            <AnhNguoiDung ten={target.displayName} avatar={target.avatar} className="size-10 text-sm" />
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
              <h2 className="truncate text-sm font-semibold text-text-primary">{target.displayName}</h2>
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
                  <span className="truncate text-success">
                    {activity.type === 'room'
                      ? activity.roomTitle
                        ? `Trong phòng: ${activity.roomTitle}`
                        : 'Đang học nhóm'
                      : 'Sảnh Campus'}
                  </span>
                </>
              ) : (
                <span
                  className={cn(
                    isOnline ? 'text-success font-medium' : isAway ? 'text-warning' : 'text-text-tertiary',
                  )}
                >
                  {isOnline
                    ? 'Đang trực tuyến'
                    : isAway
                      ? 'Đang tạm vắng'
                      : formatLastSeen(presence?.lastSeen ?? null)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Nút xem hồ sơ */}
        <Button
          variant="ghost"
          size="icon-lg"
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
          title={`Xem hồ sơ của ${target.displayName}`}
          aria-label={`Xem hồ sơ của ${target.displayName}`}
          className="text-text-secondary hover:text-text-primary"
        >
          <User className="size-4.5" />
        </Button>
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
          className="h-full overflow-y-auto overscroll-contain px-4 py-3"
          style={{ overflowAnchor: 'none' }}
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
          ) : messages.length === 0 ? (
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
              {messages.map((msg, idx) => {
                const tinTruoc = idx > 0 ? messages[idx - 1] : null
                const doiNgay = !tinTruoc || !cungNgay(tinTruoc.taoLuc, msg.taoLuc)
                const cungNguoi =
                  tinTruoc &&
                  tinTruoc.senderId === msg.senderId &&
                  !doiNgay &&
                  msg.taoLuc - tinTruoc.taoLuc < GOP_TIN_TRONG_MS
                const laCuaMinh = msg.senderId === nguoiDung?.accountId

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
                      className={cn(
                        'flex items-end gap-2 group',
                        laCuaMinh ? 'flex-row-reverse' : 'flex-row',
                        cungNguoi ? 'mt-1' : 'mt-3',
                      )}
                    >
                      {/* Avatar người gửi khác */}
                      {!laCuaMinh && (
                        <div className="w-7 shrink-0">
                          {!cungNguoi ? (
                            <AnhNguoiDung
                              ten={target.displayName}
                              avatar={target.avatar}
                              className="size-7 text-[10px]"
                            />
                          ) : (
                            <div className="size-7" />
                          )}
                        </div>
                      )}

                      {/* Bubble tin nhắn */}
                      <div
                        className={cn(
                          'flex max-w-[78%] flex-col',
                          laCuaMinh ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap select-text',
                            laCuaMinh
                              ? 'rounded-br-sm bg-brand text-brand-foreground shadow-sm'
                              : 'rounded-bl-sm bg-surface-raised border border-border-subtle text-text-primary',
                          )}
                        >
                          {msg.noiDung}
                        </div>

                        {/* Thời gian gửi */}
                        <time
                          className="mt-0.5 px-1 text-[10px] tabular-nums text-text-tertiary opacity-75 group-hover:opacity-100 transition-opacity"
                          title={new Date(msg.taoLuc).toLocaleString('vi-VN')}
                        >
                          {DINH_DANG_GIO.format(msg.taoLuc)}
                        </time>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
        className="shrink-0 border-t border-border-subtle bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2">
          {/* Nút chèn biểu cảm */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 text-text-tertiary hover:text-text-primary"
                  title="Biểu cảm"
                  aria-label="Chọn biểu cảm"
                />
              }
            >
              <Smile className="size-5" />
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2">
              <div className="grid grid-cols-6 gap-1">
                {DANH_SACH_EMOJI.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNoiDung((p) => p + em)}
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
            className="h-10 min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-raised px-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none transition-colors disabled:opacity-60"
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

      {/* Popover xem hồ sơ khi bấm nút */}
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />
    </div>
  )
}
