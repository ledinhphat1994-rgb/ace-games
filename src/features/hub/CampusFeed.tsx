import { useState, type FormEvent } from 'react'
import {
  MessageSquare,
  SendHorizontal,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Calendar,
  Smile,
  Heart,
  Share2,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { CHAT_CAMPUS } from '@shared/rooms/constants'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const FEED_TABS = [
  { id: 'all', label: 'Dành cho bạn' },
  { id: 'posts', label: 'Bài viết' },
  { id: 'events', label: 'Sự kiện' },
  { id: 'discover', label: 'Khám phá' },
  { id: 'media', label: 'Media' },
]

export function CampusFeed() {
  const { nguoiDung, moAuthModal } = usePhien()
  const { messages, guiChat, xoaChat, myPermissions, campusSnapshotReady, trangThai, ketNoiLai } = useCampus()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [person, setPerson] = useState<NguoiXem | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Local likes tracking
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({})

  const toggleLike = (id: number) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Đã sao chép liên kết bài viết!')
  }

  const online = trangThai === 'da_ket_noi'

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim() || sending || !online) return
    setSending(true)
    setError(null)
    try {
      const result = await guiChat(text)
      if (result.ok) {
        setText('')
        toast.success('Đã đăng bài viết lên bảng tin trường!')
      } else {
        setError(result.loi ?? 'Không gửi được nội dung. Hãy thử lại.')
      }
    } catch {
      setError('Không gửi được nội dung. Hãy thử lại.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="min-w-0 space-y-5" aria-label="Bảng tin trường" data-testid="campus-feed">
      {/* ── 1. Top Category Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'min-h-10 whitespace-nowrap rounded-full px-4 text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer border',
                isActive
                  ? 'bg-brand/12 text-brand border-brand/25 shadow-xs font-bold'
                  : 'bg-surface text-text-secondary border-border-subtle hover:bg-surface-overlay hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── 2. "Bạn đang nghĩ gì?" Composer Card ── */}
      <div className="rounded-2xl border border-border-default/70 bg-surface p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
        {!nguoiDung ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Tham gia bảng tin Digital Campus</p>
                <p className="text-xs text-text-tertiary">Đăng bài, chia sẻ khoảnh khắc học tập và thảo luận cùng bạn bè</p>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => moAuthModal('dang_nhap')}
              className="rounded-xl px-5 font-semibold shrink-0"
            >
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3.5">
            <div className="flex items-start gap-3">
              {nguoiDung.avatar ? (
                <img
                  src={nguoiDung.avatar}
                  alt={nguoiDung.ten || nguoiDung.username}
                  className="size-10 sm:size-11 shrink-0 rounded-full object-cover ring-2 ring-brand/20"

                />
              ) : (
                <div className="size-10 sm:size-11 shrink-0 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/25 flex items-center justify-center font-bold text-sm text-brand">
                  {(nguoiDung.ten || nguoiDung.username).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <label htmlFor="campus-feed-input" className="sr-only">
                  Chia sẻ với mọi người
                </label>
                <textarea
                  id="campus-feed-input"
                  data-testid="campus-feed-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={CHAT_CAMPUS.TOI_DA_KY_TU}
                  placeholder={`${nguoiDung.ten || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border-default/80 bg-canvas/70 px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand/50 focus:bg-surface focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
            </div>

            {/* Quick Attachment Pills & Submit Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-subtle">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => toast.info('Tính năng đính kèm ảnh sẽ lưu ảnh vào bài viết!')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <ImageIcon className="size-4" />
                  <span>Hình ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Tính năng video sẽ hỗ trợ liên kết YouTube hoặc clip ngắn.')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
                >
                  <Video className="size-4" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Gắn lịch sự kiện học tập hoặc hoạt động lớp.')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Calendar className="size-4" />
                  <span>Sự kiện</span>
                </button>
                <button
                  type="button"
                  onClick={() => setText((prev) => prev + ' 😊🎉')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Smile className="size-4" />
                  <span>Cảm xúc</span>
                </button>
              </div>

              <Button
                type="submit"
                disabled={!online || !text.trim() || sending}
                data-testid="campus-feed-send"
                className="h-9 rounded-xl px-4 text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
              >
                <SendHorizontal className="size-3.5 mr-1" />
                {sending ? 'Đang gửi…' : 'Đăng bài'}
              </Button>
            </div>

            {error && <p role="alert" className="text-xs font-medium text-destructive mt-1">{error}</p>}
          </form>
        )}
      </div>

      {/* ── Status Banners ── */}
      {nguoiDung && (!campusSnapshotReady || !online) && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning-muted/60 border border-warning/25 px-4 py-3 text-sm text-warning"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="size-4 animate-spin shrink-0" />
            <span className="text-xs sm:text-sm">
              {campusSnapshotReady ? 'Đang kết nối lại — nội dung có thể chưa mới nhất.' : 'Đang đồng bộ bảng tin…'}
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={ketNoiLai} className="text-xs h-8">
            Kết nối lại
          </Button>
        </div>
      )}

      {/* ── Empty State ── */}
      {campusSnapshotReady && messages.length === 0 && (
        <div className="rounded-2xl border border-border-default bg-surface px-5 py-16 text-center shadow-xs">
          <div className="size-14 rounded-2xl bg-surface-overlay border border-border-default mx-auto mb-3 flex items-center justify-center text-text-tertiary">
            <MessageSquare className="size-6" />
          </div>
          <p className="text-base font-bold text-text-primary">Chưa có bài viết nào trên bảng tin</p>
          <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
            Hãy là người đầu tiên chia sẻ cảm nghĩ, kỷ niệm học tập hoặc rủ bạn cùng phòng nhé!
          </p>
        </div>
      )}

      {/* ── 3. Post Feed List ── */}
      <div className="space-y-4">
        {[...messages].reverse().map((message) => {
          const isLiked = Boolean(likedPosts[message.id])

          return (
            <article
              key={message.id}
              data-testid={'campus-post-' + message.id}
              className="rounded-2xl border border-border-default/70 bg-surface p-4 sm:p-5 shadow-xs hover:border-border-default transition-all duration-200"
            >
              {/* Post Header: Avatar, Name, Class/Role, Timestamp, Actions */}
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <button
                  type="button"
                  className="flex min-h-11 min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer group"
                  aria-label={'Xem thông tin ' + message.ten}
                  onClick={(e) =>
                    setPerson({
                      id: message.accountId,
                      ten: message.ten,
                      avatar: message.avatar ?? null,
                      lopTen: message.lopTen,
                      vaiTro: message.vaiTro,
                      anchorRect: e.currentTarget.getBoundingClientRect(),
                    })
                  }
                >
                  {message.avatar ? (
                    <img
                      src={message.avatar}
                      alt=""
                      className="size-10 sm:size-11 shrink-0 rounded-full object-cover ring-2 ring-border-subtle group-hover:ring-brand/40 transition-all"
                    />
                  ) : (
                    <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-brand/12 border border-brand/25 text-sm font-bold text-brand group-hover:scale-105 transition-transform">
                      {message.ten.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className="block break-words text-sm sm:text-base font-bold text-text-primary group-hover:text-brand transition-colors">
                      {message.ten}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-tertiary">
                      {message.lopTen && (
                        <span className="font-semibold text-text-secondary bg-surface-overlay px-1.5 py-0.5 rounded text-[10px]">
                          {message.lopTen}
                        </span>
                      )}
                      <span>·</span>
                      <span>{timeFormatter.format(message.taoLuc)}</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  {myPermissions && (myPermissions.xoaMoiTin || myPermissions.accountId === message.accountId) && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Xóa nội dung"
                      title="Xóa bài viết này"
                      onClick={() => setDeleting(message.id)}
                      className="text-text-tertiary hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" aria-label="Tùy chọn" className="text-text-tertiary">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Post Content */}
              <p className="break-words whitespace-pre-wrap text-sm sm:text-[0.9375rem] leading-relaxed text-text-primary mb-3.5">
                {message.noiDung}
              </p>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border-subtle/80">
                <button
                  type="button"
                  onClick={() => toggleLike(message.id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer',
                    isLiked
                      ? 'text-rose-500 bg-rose-500/10 font-bold scale-102'
                      : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                  )}
                >
                  <Heart className={cn('size-4 transition-transform active:scale-125', isLiked && 'fill-current text-rose-500')} />
                  <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info('Bình luận trực tiếp vào bài viết!')}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors cursor-pointer"
                >
                  <MessageSquare className="size-4" />
                  <span>Bình luận</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors cursor-pointer"
                >
                  <Share2 className="size-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Profile Dialog */}
      <HoSoNguoiDungDialog nguoi={person} onDong={() => setPerson(null)} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nội dung này?</AlertDialogTitle>
            <AlertDialogDescription>
              Nội dung sẽ được xóa khỏi bảng tin và trò chuyện toàn trường.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleting === null) return
                const result = await xoaChat(deleting)
                if (!result.ok) setError(result.loi ?? 'Không xóa được nội dung.')
                setDeleting(null)
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
