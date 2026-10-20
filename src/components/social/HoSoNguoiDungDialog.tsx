// Hồ sơ dùng chung: dữ liệu và quan hệ authoritative; bố cục thích ứng theo kích thước popup.
import { useMemo, useRef, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, BadgeCheck, ChevronLeft, Lock, MessageSquare, Pencil, User, X } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '@/features/games/GameLeaderboard'
import { useTopLayerZIndex } from '@/lib/top-layer'
import { cn } from '@/lib/utils'
import { BlueprintCommunityPattern } from '@/components/ui/blueprint-patterns'
import { AnhNguoiDung } from './AnhNguoiDung'
import { GhiChuSuyNghiModal } from './GhiChuSuyNghiModal'
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
  gameElo?: number | null
  gameName?: string | null
  isMe?: boolean
}

interface HoSoNguoiDungDialogProps {
  nguoi: NguoiXem | null
  onDong: () => void
}

export function HoSoNguoiDungDialog({ nguoi, onDong }: HoSoNguoiDungDialogProps) {
  if (!nguoi) return null
  return (
    <NoiDungHoSoPop
      key={`${nguoi.id}_${nguoi.anchorRect?.top ?? 0}_${nguoi.anchorRect?.left ?? 0}`}
      nguoi={nguoi}
      onDong={onDong}
    />
  )
}

function NoiDungHoSoPop({ nguoi, onDong }: { nguoi: NguoiXem; onDong: () => void }) {
  const { nguoiDung, moAuthModal } = usePhien()
  const isMe = nguoi.isMe !== undefined
    ? nguoi.isMe
    : (nguoiDung && nguoiDung.accountId > 0 && nguoi.id > 0)
      ? nguoiDung.accountId === nguoi.id
      : false
  const isGuestTarget = nguoi.id <= 0
  const isGuestViewer = !nguoiDung || nguoiDung.accountId === 0

  const [xemThanhTuu, setXemThanhTuu] = useState(false)
  const [moModalGhiChu, setMoModalGhiChu] = useState(false)
  const { zIndex, bringToFront } = useTopLayerZIndex(true, 'popover')
  const queryClient = useQueryClient()
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
    enabled: nguoi.id > 0,
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
    enabled: nguoi.id > 0,
    staleTime: 60_000,
  })

  const ten = hoSo?.displayName ?? nguoi.ten
  const avatar = hoSo?.avatar ?? nguoi.avatar ?? null
  const vaiTro = nhanVaiTro(hoSo?.role ?? nguoi.vaiTro)
  const lopTen = hoSo ? hoSo.lopTen : (nguoi.lopTen ?? null)
  const capDo = hoSo ? tinhLevel(hoSo.totalXp) : null
  const tagDinhDanh = isGuestTarget
    ? null
    : (isMe && nguoiDung?.username)
      ? `@${nguoiDung.username}`
      : (hoSo?.username ? `@${hoSo.username}` : (hoSo?.tag || (nguoi.id > 0 ? `@campus_${nguoi.id}` : null)))

  const danhSachThanhTuu = achievementsData?.achievements ?? []
  const unlockedCount =
    achievementsData?.unlockedCount ??
    (danhSachThanhTuu.length > 0 ? danhSachThanhTuu.filter((a) => a.unlocked).length : null)
  const totalCount = achievementsData?.totalCount ?? danhSachThanhTuu.length

  const nhanThanhTuu = 'Xem tất cả thành tựu của ' + ten + (unlockedCount !== null ? ' (' + unlockedCount + '/' + totalCount + ')' : '')

  return (
    <Popover.Root open modal={false} onOpenChange={(open) => { if (!open) onDong() }}>
      <Popover.Portal>
        {/* Layer stack invariant: z-[130] base context, z-[140] popover positioner fallback, zIndex 9000+ từ useTopLayerZIndex popover */}
        <Popover.Positioner
          anchor={anchor}
          positionMethod="fixed"
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={12}
          collisionAvoidance={{ side: 'flip', align: 'shift' }}
          sticky
          style={{ zIndex }}
          className="z-[140]"
        >
          <Popover.Popup
            initialFocus={closeRef}
            style={{ zIndex: zIndex + 1 }}
            onPointerDownCapture={bringToFront}
            finalFocus={() => {
              const previous = returnFocusRef.current
              if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) return previous
              // Presence can move this person into another group while their profile is open.
              const selector = `button[aria-label="${CSS.escape('Xem thông tin ' + nguoi.ten)}"]`
              return Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find(button => button.getClientRects().length > 0) ?? null
            }}
            aria-label={moModalGhiChu ? 'Chỉnh sửa ghi chú suy nghĩ' : xemThanhTuu ? nhanThanhTuu : 'Hồ sơ của ' + ten}
            className="relative overflow-hidden flex w-92 max-w-[calc(100vw-24px)] max-h-[min(38rem,var(--available-height,calc(100dvh-24px)))] min-h-0 flex-col rounded-2xl border border-sky-500/25 bg-gradient-to-b from-slate-900/98 via-slate-900/98 to-slate-950/98 shadow-2xl outline-none"
            data-testid="ho-so-nguoi-dung"
          >
            <BlueprintCommunityPattern className="opacity-75 pointer-events-none" />
            {/* Chỉnh sửa suy nghĩ trực tiếp ở Vùng 2 (nằm trên các layer khác, nhỏ gọn tinh tế vừa đủ) */}
            {isMe && moModalGhiChu ? (
              <GhiChuSuyNghiModal
                inline
                open={moModalGhiChu}
                onClose={() => setMoModalGhiChu(false)}
                currentNote={hoSo?.tieuDeHoSo || ''}
                currentAvatar={avatar}
                displayName={ten}
                onSaveSuccess={() => {
                  void queryClient.invalidateQueries({ queryKey: ['ho-so-nguoi-dung', nguoi.id] })
                  setMoModalGhiChu(false)
                }}
              />
            ) : (
              <>
            {/* ── VÙNG 2: Header gồm 1. Avatar (bấm để edit mở Vùng 1), 2. Tên người dùng, 3. Tag xác thực người dùng, và Dòng trạng thái như Vùng 1 ── */}
            <header className="flex min-w-0 shrink-0 flex-col border-b border-border-subtle p-3.5 gap-2">
              <div className="flex min-w-0 items-start justify-between gap-2">
                {xemThanhTuu ? (
                  <Button variant="ghost" size="icon-lg" onClick={() => setXemThanhTuu(false)} title="Quay lại hồ sơ" aria-label="Quay lại hồ sơ">
                    <ChevronLeft />
                  </Button>
                ) : (
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {/* Phần 1: Avatar người dùng (nếu là mình, bấm để edit cấu hình như Vùng 1) */}
                    <div className="relative shrink-0">
                      {isMe ? (
                        <button
                          type="button"
                          onClick={() => setMoModalGhiChu(true)}
                          className="group/avatar relative block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          title="Bấm vào ảnh đại diện để sửa ghi chú & suy nghĩ"
                          aria-label="Cấu hình ghi chú suy nghĩ"
                        >
                          <AnhNguoiDung ten={ten} avatar={avatar} className="size-13 text-base transition-transform group-hover/avatar:scale-105" />
                          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xs ring-2 ring-surface-raised">
                            <Pencil className="size-2.5" />
                          </span>
                        </button>
                      ) : (
                        <div className="relative">
                          <AnhNguoiDung ten={ten} avatar={avatar} className="size-13 text-base" />
                        </div>
                      )}
                    </div>

                    {/* Phần 2 & 3: Tên người dùng + Tag xác thực người dùng */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="break-words text-base font-bold leading-snug text-text-primary">{ten}</h2>
                        {isMe && <span data-testid="badge-ban-highlight" className="text-[11px] font-bold text-brand px-1.5 py-0.5 rounded bg-brand/10">★ BẠN</span>}
                      </div>

                      {/* Tag người dùng: mỗi tài khoản có 1 tag riêng để xác thực */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isGuestTarget ? (
                          <span
                            data-testid="tag-choi-nhanh"
                            title="Tài khoản chơi nhanh với tên thông thường"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold"
                          >
                            <span>⚡ Chơi nhanh</span>
                          </span>
                        ) : tagDinhDanh ? (
                          <span
                            data-testid="tag-xac-thuc"
                            title="Tag định danh xác thực tài khoản"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-mono font-semibold"
                          >
                            <BadgeCheck className="size-3 shrink-0" />
                            <span>{tagDinhDanh}</span>
                          </span>
                        ) : null}
                        {vaiTro && <span className="text-xs text-text-tertiary">· {vaiTro}</span>}
                      </div>
                    </div>
                  </div>
                )}
                {xemThanhTuu && <h2 className="min-w-0 flex-1 self-center break-words text-sm font-semibold text-text-primary">Thành tựu <span className="text-text-secondary">{unlockedCount !== null ? '(' + unlockedCount + '/' + totalCount + ')' : ''}</span></h2>}
                <Popover.Close render={<Button ref={closeRef} variant="ghost" size="icon-lg" className="ml-auto shrink-0" aria-label="Đóng" title="Đóng" />}><X /></Popover.Close>
              </div>

              {/* Dòng trạng thái như Vùng 1: hiển thị suy nghĩ / trạng thái, bấm để sửa */}
              {!xemThanhTuu && (
                isMe ? (
                  <button
                    type="button"
                    onClick={() => setMoModalGhiChu(true)}
                    className="group/status flex w-full items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-brand/40 transition-colors duration-150 text-left cursor-pointer shadow-xs"
                    title="Bấm để cập nhật ghi chú suy nghĩ"
                  >
                    <span className="text-sm shrink-0">💭</span>
                    <span className={cn("text-xs font-medium truncate flex-1", hoSo?.tieuDeHoSo ? "text-text-primary" : "text-text-tertiary")}>
                      {hoSo?.tieuDeHoSo || "Chia sẻ suy nghĩ…"}
                    </span>
                    <Pencil className="size-3 text-text-tertiary group-hover/status:text-brand transition-colors shrink-0" />
                  </button>
                ) : hoSo?.tieuDeHoSo ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs text-text-secondary">
                    <span className="text-sm shrink-0">💭</span>
                    <span className="truncate italic">“{hoSo.tieuDeHoSo}”</span>
                  </div>
                ) : null
              )}
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
                  {isGuestTarget ? (
                    <div className="space-y-3">
                      {nguoi.gameElo !== undefined && nguoi.gameElo !== null && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
                          <span className="text-text-secondary font-medium">Elo {nguoi.gameName || 'trò chơi'}:</span>
                          <span className="font-bold text-amber-400 tabular-nums text-sm">{nguoi.gameElo}</span>
                        </div>
                      )}
                      <div className="rounded-xl bg-slate-800/30 border border-slate-800 p-3 text-xs text-text-secondary leading-relaxed space-y-1">
                        <p className="font-medium text-text-primary">
                          {isMe ? 'Tài khoản chơi nhanh' : `${ten} đang chơi nhanh`}
                        </p>
                        <p className="text-text-tertiary">
                          {isMe
                            ? 'Bạn đang chơi với tên thông thường. Hãy tạo Tag Name và mật khẩu riêng để mở khóa tính năng kết bạn, nhắn tin riêng và mời bạn bè!'
                            : 'Người chơi dùng tên thông thường, chưa tạo Tag Name & mật khẩu nên không thể kết bạn hoặc nhắn tin riêng.'}
                        </p>
                      </div>
                    </div>
                  ) : isError ? (
                    <p data-testid="ho-so-loi" role="status" className="mt-4 text-sm text-text-secondary">Không tải được thông tin.</p>
                  ) : (
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <dl className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 text-sm tabular-nums text-text-secondary" aria-busy={isPending}>
                        <div className="flex items-baseline gap-2"><dt>Cấp</dt><dd data-testid="ho-so-cap" className="min-w-4 font-semibold text-text-primary">{isPending ? '—' : capDo}</dd></div>
                        <div className="flex items-baseline gap-2"><dt>XP</dt><dd data-testid="ho-so-xp" className="min-w-4 font-semibold text-text-primary">{isPending ? '—' : (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')}</dd></div>
                        {nguoi.gameElo !== undefined && nguoi.gameElo !== null && (
                          <div className="flex items-baseline gap-2"><dt>Elo {nguoi.gameName || 'trò chơi'}</dt><dd data-testid="ho-so-game-elo" className="min-w-4 font-bold text-amber-400">{nguoi.gameElo}</dd></div>
                        )}
                      </dl>

                      {/* Huy hiệu thành tựu nằm sát bên dòng XP */}
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setXemThanhTuu(true)}
                        aria-label={nhanThanhTuu}
                        title={nhanThanhTuu}
                        data-testid="ho-so-btn-thanh-tuu"
                        className="h-8 px-2.5 gap-1.5 rounded-xl border-border-default hover:bg-surface-raised text-text-secondary hover:text-text-primary shrink-0 cursor-pointer"
                      >
                        <Award className="size-4 text-warning" />
                        <span className="text-xs font-medium">Thành tựu</span>
                        {unlockedCount !== null && (
                          <span className="text-[11px] text-text-tertiary">({unlockedCount}/{totalCount})</span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Vùng Footer: Quan hệ & Nhắn tin */}
                <footer data-testid="ho-so-quan-he-row" className="min-w-0 shrink-0 border-t border-border-subtle p-3.5">
                  {isGuestTarget ? (
                    isMe ? (
                      <Button
                        variant="default"
                        onClick={() => {
                          onDong()
                          moAuthModal('dang_ky')
                        }}
                        className="w-full min-h-11 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold cursor-pointer"
                        title="Tạo Tag Name & Mật khẩu riêng"
                      >
                        Tạo Tag Name & Mật khẩu
                      </Button>
                    ) : (
                      <div className="text-center py-0.5">
                        <span className="text-xs text-text-tertiary">Tài khoản chơi nhanh không hỗ trợ kết bạn & nhắn tin riêng</span>
                      </div>
                    )
                  ) : isGuestViewer ? (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="default"
                        onClick={() => {
                          onDong()
                          moAuthModal('dang_ky')
                        }}
                        className="w-full min-h-11 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold cursor-pointer"
                        title="Tạo tài khoản để kết bạn và nhắn tin"
                      >
                        Tạo tài khoản để kết bạn & nhắn tin
                      </Button>
                    </div>
                  ) : (
                    <div className={cn("grid gap-2 w-full", isMe ? "grid-cols-1" : "grid-cols-2")}>
                      {!isMe && <NutQuanHe id={nguoi.id} day />}
                      <Button
                        variant="default"
                        onClick={() => {
                          if (isMe) window.location.href = '/me'
                          else window.dispatchEvent(new CustomEvent('campus:open-dm', { detail: { id: nguoi.id, displayName: ten, avatar, lopTen } }))
                          onDong()
                        }}
                        className="w-full min-h-11 min-w-0 whitespace-normal px-2.5 text-sm font-semibold rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 transition-colors duration-150 shadow-sm cursor-pointer"
                        title={isMe ? 'Xem hồ sơ của tôi' : 'Nhắn tin với ' + ten}
                        aria-label={isMe ? 'Xem hồ sơ của tôi' : 'Nhắn tin với ' + ten}
                        data-testid="ho-so-btn-nhan-tin"
                      >
                        {isMe ? <User className="size-4 shrink-0" /> : <MessageSquare className="size-4 shrink-0" />}
                        <span className="truncate">{isMe ? 'Hồ sơ' : 'Nhắn tin'}</span>
                      </Button>
                    </div>
                  )}
                </footer>
              </>
            )}
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
