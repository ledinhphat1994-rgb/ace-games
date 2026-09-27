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
import { Input } from '@/components/ui/input'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import { cn, getInitials } from '@/lib/utils'
import type { TinCampus } from '@shared/protocol/campus'
import { CHAT_CAMPUS } from '@shared/rooms/constants'
import { ArrowDown, Loader2, MessageSquare, SendHorizontal, Smile, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

export function CampusChatDrawer({
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
  className,
  hideHeader = false,
  hideInput = false,
}: CampusChatDrawerProps) {
  const [noiDung, setNoiDung] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [idDangXoa, setIdDangXoa] = useState<number | null>(null)
  const [tinCanXoa, setTinCanXoa] = useState<TinCampus | null>(null)
  const [bayGio, setBayGio] = useState(() => Date.now())
  const khungRef = useRef<HTMLDivElement | null>(null)
  const daCuonLanDau = useRef(false)
  const oDayRef = useRef(true)
  const [oDay, setODay] = useState(true)

  const tinCuoi = messages.length > 0 ? messages[messages.length - 1] : null
  const idTinCuoi = tinCuoi?.id ?? null
  const tinCuoiCuaMinh = tinCuoi !== null && tinCuoi.accountId === myPermissions?.accountId
  const [idDaXem, setIdDaXem] = useState<number | null>(idTinCuoi)
  const coTinMoi = !oDay && idTinCuoi !== null && idTinCuoi !== idDaXem

  useEffect(() => {
    const timer = setInterval(() => setBayGio(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Chỉ cuộn bên trong khung tin (không đụng tới cuộn trang). Lần đầu nhảy thẳng xuống cuối; về sau chỉ bám theo
  // tin mới khi người dùng đang ở cuối hoặc vừa tự gửi — đang đọc tin cũ thì không kéo họ đi, chỉ hiện nút "Tin nhắn mới".
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
  }, [idTinCuoi, tinCuoiCuaMinh])

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
          className="h-full overflow-y-auto overscroll-contain px-4 py-3"
          style={{ overflowAnchor: 'none' }}
        >
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-raised text-text-tertiary">
                <MessageSquare className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-text-primary">Chưa có tin nhắn nào</p>
              <p className="mt-1 max-w-64 text-xs leading-relaxed text-text-tertiary">
                Gửi lời chào đầu tiên tới thầy cô và các bạn trong trường.
              </p>
            </div>
          ) : (
            <ol>
              {messages.map((msg, i) => {
                const truoc = i > 0 ? messages[i - 1] : null
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

                    <div className={cn('group flex items-end gap-2', laCuaMinh && 'flex-row-reverse')}>
                      {!laCuaMinh &&
                        (noiTiep ? (
                          <span aria-hidden className="w-8 shrink-0" />
                        ) : (
                          <span
                            aria-hidden
                            className="flex size-8 shrink-0 items-center justify-center self-start rounded-full bg-surface-overlay text-[11px] font-semibold text-text-secondary"
                          >
                            {getInitials(msg.ten)}
                          </span>
                        ))}

                      <div className={cn('flex max-w-[80%] min-w-0 flex-col', laCuaMinh ? 'items-end' : 'items-start')}>
                        {!noiTiep && (
                          <p className="mb-1 flex flex-wrap items-baseline gap-x-1.5 px-1 text-xs">
                            {!laCuaMinh && (
                              <>
                                <span className="min-w-0 font-medium break-words text-text-primary">{msg.ten}</span>
                                {msg.vaiTro === 'giao_vien' ? (
                                  <span className="rounded bg-brand/12 px-1 text-[10px] font-semibold text-brand">GV</span>
                                ) : msg.lopTen ? (
                                  <span className="text-text-tertiary">{msg.lopTen}</span>
                                ) : null}
                              </>
                            )}
                            <time dateTime={new Date(msg.taoLuc).toISOString()} className="text-text-tertiary tabular-nums">
                              {gio}
                            </time>
                          </p>
                        )}

                        <div className={cn('flex max-w-full items-center gap-1', laCuaMinh && 'flex-row-reverse')}>
                          <p
                            title={gio}
                            className={cn(
                              'min-w-0 rounded-2xl px-3 py-2 text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap text-text-primary',
                              laCuaMinh ? 'rounded-br-md bg-brand/15' : 'rounded-bl-md bg-surface-raised',
                            )}
                          >
                            {msg.noiDung}
                          </p>
                          {coQuyenXoa && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setTinCanXoa(msg)}
                              disabled={idDangXoa === msg.id}
                              className="shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 pointer-coarse:opacity-100"
                              title={myPermissions?.xoaMoiTin && !laCuaMinh ? 'Xoá tin (quyền Giáo viên)' : 'Xoá tin của bạn'}
                              aria-label={laCuaMinh ? 'Xoá tin nhắn của bạn' : `Xoá tin nhắn của ${msg.ten}`}
                            >
                              <Trash2 />
                            </Button>
                          )}
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
          <div className="flex items-center gap-2">
            {/* Nút chèn biểu cảm Emoji */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 text-text-tertiary hover:text-white hover:bg-white/10"
                    title="Chèn biểu cảm emoji"
                    aria-label="Chèn biểu cảm emoji"
                  >
                    <Smile className="size-5" />
                  </Button>
                }
              />
              <PopoverContent side="top" align="start" className="w-64 p-2 bg-[#0c1322] border-white/10 shadow-2xl rounded-xl z-50">
                <div className="grid grid-cols-6 gap-1">
                  {DANH_SACH_EMOJI.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setNoiDung((prev) => (prev + em).slice(0, CHAT_CAMPUS.TOI_DA_KY_TU))
                      }}
                      className="flex size-9 items-center justify-center text-xl rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="relative min-w-0 flex-1">
              <Input
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value.slice(0, CHAT_CAMPUS.TOI_DA_KY_TU))}
                placeholder="Nhắn tới cả trường…"
                aria-label="Nội dung tin nhắn"
                maxLength={CHAT_CAMPUS.TOI_DA_KY_TU}
                enterKeyHint="send"
                autoComplete="off"
                className={cn('h-10', conLai <= 50 && 'pr-12')}
              />
              {conLai <= 50 && (
                <span
                  aria-live="polite"
                  className={cn(
                    'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] tabular-nums',
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
              className="shrink-0"
              disabled={!noiDung.trim() || dangGui}
              aria-label="Gửi tin nhắn"
              // Bấm gửi không lấy mất con trỏ của ô nhập (bàn phím điện thoại không bị đóng giữa chừng)
              onMouseDown={(e) => e.preventDefault()}
            >
              {dangGui ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
            </Button>
          </div>
        </form>
      )}

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
    </div>
  )
}
