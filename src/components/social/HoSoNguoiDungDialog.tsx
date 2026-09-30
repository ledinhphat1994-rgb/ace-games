// Hồ sơ dùng chung: dữ liệu và quan hệ authoritative; bố cục thích ứng theo kích thước popup.
import { useMemo, useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { useQuery } from '@tanstack/react-query'
import { Award, ChevronLeft, Lock, MessageSquare, User, X } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '@/features/games/GameLeaderboard'
import { AnhNguoiDung } from './AnhNguoiDung'
import { NutQuanHe } from './NutQuanHe'
import { nhanVaiTro } from './quan-he'

export interface AnchorRect {
  top: number
  left: number
  right: number
  bottom: number
  width?: number
  height?: number
}

/** Người đang được xem: chỉ cần mã + những gì đã biết sẵn để hiện ngay trong lúc tải hồ sơ. */
export interface NguoiXem {
  id: number
  ten: string
  lopTen?: string | null
  vaiTro?: string | null
  avatar?: string | null
  anchorRect?: AnchorRect | null
}

interface HoSoNguoiDungDialogProps {
  nguoi: NguoiXem | null
  onDong: () => void
}

export function HoSoNguoiDungDialog({ nguoi, onDong }: HoSoNguoiDungDialogProps) {
  if (!nguoi) return null
  return <NoiDungHoSoPop key={nguoi.id} nguoi={nguoi} onDong={onDong} />
}

function NoiDungHoSoPop({ nguoi, onDong }: { nguoi: NguoiXem; onDong: () => void }) {
  const { nguoiDung } = usePhien()
  const isMe = nguoiDung ? nguoiDung.accountId === nguoi.id : false
  const [xemThanhTuu, setXemThanhTuu] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef(document.activeElement)
  const anchor = useMemo(() => ({
    getBoundingClientRect: () => {
      const rect = nguoi.anchorRect
      if (rect) return new DOMRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top)
      const viewport = window.visualViewport
      return new DOMRect((viewport?.offsetLeft ?? 0) + (viewport?.width ?? innerWidth) / 2, (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) / 2, 0, 0)
    },
  }), [nguoi.anchorRect])

  const { data: hoSo, isPending, isError } = useQuery({
    queryKey: ['ho-so-nguoi-dung', nguoi.id],
    queryFn: () => layHoSoNguoiDung(nguoi.id),
    staleTime: 60_000,
    retry: false,
  })

  // Dữ liệu thành tựu authoritative từ máy chủ
  const { data: achievementsData, isPending: thanhTuuDangTai, isError: thanhTuuLoi } = useQuery<{
    ok: boolean
    achievements?: Array<{
      key: string
      title: string
      description: string
      unlocked: boolean
      rewardXp?: number
    }>
    unlockedCount?: number
    totalCount?: number
  }>({
    queryKey: ['engagement', 'achievements', nguoi.id],
    queryFn: async () => {
      const res = await fetch(`/api/engagement/achievements?accountId=${nguoi.id}`)
      if (!res.ok) throw new Error('Không tải được thành tựu.')
      return res.json()
    },
    staleTime: 60_000,
  })

  const ten = hoSo?.displayName ?? nguoi.ten
  const avatar = hoSo?.avatar ?? nguoi.avatar ?? null
  const vaiTro = nhanVaiTro(hoSo?.role ?? nguoi.vaiTro)
  const lopTen = hoSo ? hoSo.lopTen : (nguoi.lopTen ?? null)
  const capDo = hoSo ? tinhLevel(hoSo.totalXp) : null

  const danhSachThanhTuu = achievementsData?.achievements ?? []
  const unlockedCount =
    achievementsData?.unlockedCount ??
    (danhSachThanhTuu.length > 0 ? danhSachThanhTuu.filter((a) => a.unlocked).length : null)
  const totalCount = achievementsData?.totalCount ?? danhSachThanhTuu.length

  const nhanThanhTuu = 'Xem tất cả thành tựu của ' + ten + (unlockedCount !== null ? ' (' + unlockedCount + '/' + totalCount + ')' : '')

  return (
    <Popover.Root open modal onOpenChange={(open) => { if (!open) onDong() }}>
      <Popover.Portal>
        <Popover.Backdrop className="fixed inset-0 z-40" />
        <Popover.Positioner
          anchor={anchor}
          positionMethod="fixed"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          collisionAvoidance={{ side: 'shift', align: 'shift' }}
          sticky
          className="z-50"
        >
          <Popover.Popup
            initialFocus={closeRef}
            finalFocus={() => {
              const previous = returnFocusRef.current
              if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) return previous
              // Presence can move this person into another group while their profile is open.
              const selector = `button[aria-label="${CSS.escape('Xem thông tin ' + nguoi.ten)}"]`
              return Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find(button => button.getClientRects().length > 0) ?? null
            }}
            aria-label={xemThanhTuu ? nhanThanhTuu : 'Hồ sơ của ' + ten}
            className="flex w-88 max-w-[calc(100vw-24px)] max-h-[min(36rem,var(--available-height,calc(100dvh-24px)))] min-h-0 flex-col rounded-2xl border border-border-default bg-surface-raised shadow-xl outline-none"
            data-testid="ho-so-nguoi-dung"
          >
            <header className="flex min-w-0 shrink-0 items-start gap-2 border-b border-border-subtle p-3">
              {xemThanhTuu ? (
                <Button variant="ghost" size="icon-lg" onClick={() => setXemThanhTuu(false)} title="Quay lại hồ sơ" aria-label="Quay lại hồ sơ">
                  <ChevronLeft />
                </Button>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <AnhNguoiDung ten={ten} avatar={avatar} className="size-12 text-base" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="break-words text-base font-semibold leading-snug text-text-primary">{ten}</h2>
                    {isMe && <span data-testid="badge-ban-highlight" className="text-xs font-semibold text-brand">★ BẠN</span>}
                    {vaiTro && <p className="break-words text-xs text-text-secondary">{vaiTro}</p>}
                    {lopTen && <p className="break-words text-xs text-text-secondary">{lopTen}</p>}
                  </div>
                </div>
              )}
              {xemThanhTuu && <h2 className="min-w-0 flex-1 self-center break-words text-sm font-semibold text-text-primary">Thành tựu <span className="text-text-secondary">{unlockedCount !== null ? '(' + unlockedCount + '/' + totalCount + ')' : ''}</span></h2>}
              <Popover.Close render={<Button ref={closeRef} variant="ghost" size="icon-lg" className="ml-auto" aria-label="Đóng" title="Đóng" />}><X /></Popover.Close>
            </header>

            {xemThanhTuu ? (
              <section data-testid="card-thanh-tuu" className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
                <div data-testid="ho-so-danh-sach-thanh-tuu" className="divide-y divide-border-subtle">
                  {thanhTuuDangTai || thanhTuuLoi || danhSachThanhTuu.length === 0 ? (
                    <p role="status" className="py-8 text-center text-sm text-text-secondary">{thanhTuuDangTai ? 'Đang tải thành tựu…' : thanhTuuLoi ? 'Không tải được thành tựu.' : 'Chưa có thành tựu.'}</p>
                  ) : danhSachThanhTuu.map((ach) => (
                    <div key={ach.key} className="flex min-w-0 items-start gap-3 py-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-overlay text-text-secondary">
                        {ach.unlocked ? <Award className="size-5 text-warning" /> : <Lock className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                          <h3 className="min-w-0 break-words text-sm font-semibold text-text-primary">{ach.title}</h3>
                          {ach.rewardXp ? <span className="shrink-0 text-xs tabular-nums text-text-secondary">+{ach.rewardXp} XP</span> : null}
                        </div>
                        <p className="break-words text-sm leading-relaxed text-text-secondary">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <>
                <div className="min-h-0 overflow-y-auto overscroll-contain p-4">

                  {hoSo?.tieuDeHoSo && <p className="mb-3 break-words text-sm text-text-secondary">{hoSo.tieuDeHoSo}</p>}
                  {isError ? (
                    <p data-testid="ho-so-loi" role="status" className="mt-4 text-sm text-text-secondary">Không tải được thông tin.</p>
                  ) : (
                    <dl className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2 text-sm tabular-nums text-text-secondary" aria-busy={isPending}>
                      <div className="flex items-baseline gap-2"><dt>Cấp</dt><dd data-testid="ho-so-cap" className="min-w-4 font-semibold text-text-primary">{isPending ? '—' : capDo}</dd></div>
                      <div className="flex items-baseline gap-2"><dt>XP</dt><dd data-testid="ho-so-xp" className="min-w-4 font-semibold text-text-primary">{isPending ? '—' : (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')}</dd></div>
                    </dl>
                  )}
                </div>
                <footer data-testid="ho-so-quan-he-row" className="min-w-0 shrink-0 space-y-3 border-t border-border-subtle p-4">
                  {!isMe && <NutQuanHe id={nguoi.id} day />}
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        if (isMe) window.location.href = '/me'
                        else window.dispatchEvent(new CustomEvent('campus:open-dm', { detail: { id: nguoi.id, displayName: ten, avatar, lopTen } }))
                        onDong()
                      }}
                      className="min-h-11 min-w-0 whitespace-normal px-3 text-sm"
                      title={isMe ? 'Xem hồ sơ của tôi' : 'Nhắn tin với ' + ten}
                      aria-label={isMe ? 'Xem hồ sơ của tôi' : 'Nhắn tin với ' + ten}
                      data-testid="ho-so-btn-nhan-tin"
                    >
                      {isMe ? <User className="size-4 shrink-0" /> : <MessageSquare className="size-4 shrink-0" />}
                      <span className="break-words">{isMe ? 'Hồ sơ' : 'Nhắn tin'}</span>
                    </Button>
                    <Button variant="outline" size="icon-lg" onClick={() => setXemThanhTuu(true)} aria-label={nhanThanhTuu} title={nhanThanhTuu} data-testid="ho-so-btn-thanh-tuu">
                      <Award className="size-5" />
                    </Button>
                  </div>
                </footer>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
