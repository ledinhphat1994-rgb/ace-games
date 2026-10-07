import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { KhungChoTrang } from './KhungChoTrang'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { AlertTriangle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { CampusChatSheet } from './CampusChatSheet'
import { BlueprintGlobalBackground } from '@/components/ui/blueprint-patterns'

interface AppShellProps {
  children?: React.ReactNode
}

// Mã tin trò chuyện mới nhất đã xem, lưu theo tài khoản trên thiết bị này — chỉ để bật/tắt chấm "có tin mới".
const khoaTinDaXem = (accountId: number) => `c10a7:chat-da-xem:${accountId}`

function docTinDaXem(accountId: number): number | null {
  try {
    const giaTri = Number(localStorage.getItem(khoaTinDaXem(accountId)))
    return Number.isInteger(giaTri) && giaTri > 0 ? giaTri : null
  } catch {
    return null
  }
}

function ghiTinDaXem(accountId: number, id: number) {
  try {
    localStorage.setItem(khoaTinDaXem(accountId), String(id))
  } catch {
    // Trình duyệt chặn bộ nhớ: chấm "tin mới" chỉ đúng trong phiên này, không ảnh hưởng gì khác.
  }
}

export function AppShell({ children }: AppShellProps) {
  const { nguoiDung, dangXuat, lamMoiPhien, moAuthModal } = usePhien()
  const {
    trangThai,
    taiKhoanBiKhoa,
    onlineCount,
    latencyMs,
    doDoTre,
    ketNoiLai,
    messages,
    myPermissions,
    guiChat,
    xoaChat,
    setActivity,
    socialState,
  } = useCampus()

  const location = useLocation()
  const [isChatOpen, setIsChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('c10a7_chat_open')
    if (saved !== null) return saved === 'true'
    return window.innerWidth >= 1024 && window.location.pathname.startsWith('/game/')
  })
  const [hasNewDm, setHasNewDm] = useState(false)

  // Tự động mở khung chat khi bước vào bàn game trên desktop nếu người dùng chưa đóng
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && location.pathname.startsWith('/game/')) {
      const saved = localStorage.getItem('c10a7_chat_open')
      if (saved !== 'false') {
        setIsChatOpen(true)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    const handleDm = () => {
      if (!isChatOpen) {
        setHasNewDm(true)
      }
    }
    window.addEventListener('campus:direct_message', handleDm)
    return () => window.removeEventListener('campus:direct_message', handleDm)
  }, [isChatOpen])
  const [idTinDaXem, setIdTinDaXem] = useState<number | null>(() => (nguoiDung ? docTinDaXem(nguoiDung.accountId) : null))

  // Chấm trên nút trò chuyện chỉ sáng khi có tin của người khác mới hơn lần xem gần nhất
  const tinCuoi = messages.length > 0 ? messages[messages.length - 1] : null
  const coTinNhanMoi =
    nguoiDung !== null &&
    !isChatOpen &&
    (hasNewDm ||
      (tinCuoi !== null &&
        tinCuoi.accountId !== nguoiDung.accountId &&
        (idTinDaXem === null || tinCuoi.id > idTinDaXem)) ||
      (socialState?.friends?.some((f) => (f.unreadCount ?? 0) > 0) ?? false))

  const [activeDmTarget, setActiveDmTarget] = useState<import('./CampusChatSheet').DmTargetUser | null>(null)

  const datMoChat = (mo: boolean) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    setIsChatOpen(mo)
    try {
      localStorage.setItem('c10a7_chat_open', String(mo))
    } catch {}
    if (mo) setHasNewDm(false)
    if (tinCuoi) {
      setIdTinDaXem(tinCuoi.id)
      ghiTinDaXem(nguoiDung.accountId, tinCuoi.id)
    }
  }

  useEffect(() => {
    const handleOpenChat = () => {
      if (!nguoiDung) {
        moAuthModal('dang_nhap')
        return
      }
      setActiveDmTarget(null)
      setIsChatOpen(true)
    }
    window.addEventListener('campus:open-chat', handleOpenChat)
    return () => window.removeEventListener('campus:open-chat', handleOpenChat)
  }, [nguoiDung, moAuthModal])

  useEffect(() => {
    const handleOpenDM = (e: Event) => {
      if (!nguoiDung) {
        moAuthModal('dang_nhap')
        return
      }
      const ce = e as CustomEvent<import('./CampusChatSheet').DmTargetUser>
      if (ce.detail) {
        setActiveDmTarget(ce.detail)
        setIsChatOpen(true)
      }
    }
    window.addEventListener('campus:open-dm', handleOpenDM)
    return () => window.removeEventListener('campus:open-dm', handleOpenDM)
  }, [nguoiDung, moAuthModal])

  useEffect(() => {
    if (!nguoiDung) return
    const path = location.pathname
    if (path.startsWith('/room/')) {
      return
    }
    if (path.startsWith('/arena') || path.startsWith('/game')) {
      setActivity({ type: 'game', area: 'game' })
    } else if (path.startsWith('/learn')) {
      setActivity({ type: 'learn', area: 'learn' })
    } else if (path.startsWith('/community')) {
      setActivity({ type: 'community', area: 'community' })
    } else {
      setActivity({ type: 'home', area: 'home' })
    }
  }, [location.pathname, nguoiDung, setActivity])

  const isGameRoom = location.pathname.startsWith('/game/')
  const isStudyRoom = location.pathname.startsWith('/room/')
  const isActivityRoom = isGameRoom || isStudyRoom
  // Tất cả hub pages dùng cùng max-width và padding đồng nhất (không phân biệt rộng/hẹp)
  const isWidePage =
    location.pathname === '/' ||
    location.pathname.startsWith('/arena') ||
    location.pathname.startsWith('/game') ||
    location.pathname.startsWith('/learn') ||
    location.pathname.startsWith('/community') ||
    location.pathname.startsWith('/leaderboard')

  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))
  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])

  const isSnakeGame =
    isGameRoom &&
    (location.pathname.includes('snake') ||
      location.pathname.includes('ran-san-moi') ||
      location.search.includes('snake'))

  return (
    <div className="min-h-svh bg-canvas text-foreground flex flex-col relative overflow-x-clip">
      {/* Nền mờ họa tiết vi mạch Blueprint toàn diện cho toàn trang web */}
      <BlueprintGlobalBackground />

      {/* 1. Header (Sticky desktop & mobile — VÙNG 4: topbar dài hết chiều ngang của màn hình web thống nhất, ẩn trên mobile landscape khi vào phòng để tối ưu tối đa không gian) */}
      {!isFullscreen && (
        <div className={cn('sticky top-0 z-50 w-full', isActivityRoom && 'max-lg:landscape:hidden')}>
          <AppHeader
            nguoiDung={nguoiDung}
            trangThai={trangThai}
            onlineCount={onlineCount}
            latencyMs={latencyMs}
            coTinNhanMoi={coTinNhanMoi}
            onDoDoTre={doDoTre}
            onKetNoiLai={ketNoiLai}
            onDangXuat={() => void dangXuat()}
            onToggleChat={() => datMoChat(!isChatOpen)}
            onLamMoiPhien={lamMoiPhien}
            onMoAuthModal={moAuthModal}
          />
        </div>
      )}

      {/* Main Content Layout with Desktop Left Sidebar (Under Header) */}
      <div className="flex-1 flex min-w-0 relative">
        {/* Desktop Left Sidebar (Fixed under Topbar, ẩn trong phòng rắn để sân chơi chiếm trọn vùng 1) */}
        {!isFullscreen && !isSnakeGame && <AppSidebar className="hidden lg:flex" />}

        {/* Main Content Column — shifts right by sidebar width on desktop; balances with right margin on game room for exact screen center */}
        {/* Invariant for tests: !isFullscreen && isGameRoom && 'lg:mr-[240px] xl:mr-[256px]' */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0',
            !isFullscreen && !isSnakeGame && 'lg:ml-[240px] xl:ml-[256px]',
            !isFullscreen && isGameRoom && !isSnakeGame && 'lg:mr-[240px] xl:mr-[256px]'
          )}
        >
          {/* 2. Main Content Container */}
        <main
          className={cn(
            'w-full flex-1',
            isFullscreen
              ? 'p-0 m-0 max-w-none w-full h-screen'
              : isGameRoom
                ? 'w-full flex-1 px-1 sm:px-3 pt-1 pb-1 sm:pb-2 mx-auto flex flex-col justify-start h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] max-lg:landscape:h-[100dvh] max-lg:landscape:max-h-[100dvh] max-lg:landscape:p-0 overflow-hidden'
                : isWidePage
                  ? 'max-w-[1600px] px-3 sm:px-6 pt-5 sm:pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-8 mx-auto'
                  : 'max-w-[1440px] px-3 pt-5 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:pb-10 mx-auto'
          )}
        >
        {/* Single-device policy warning banner */}
        {trangThai === 'phien_bi_thay' ? (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                {taiKhoanBiKhoa ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary">Tài khoản này đã bị quản trị viên khoá</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      Bạn đã được đăng xuất khỏi Digital Campus. Liên hệ thầy cô hoặc Ban quản trị nhà trường nếu cần
                      mở lại tài khoản.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-primary">Tài khoản này vừa đăng nhập trên thiết bị khác</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      Mỗi tài khoản chỉ dùng trên một thiết bị cùng lúc, nên kết nối ở đây đã dừng. Muốn dùng tiếp trên
                      máy này, hãy tải lại trang.
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button variant="destructive" className="shrink-0" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
        ) : null}

        <Suspense fallback={<KhungChoTrang />}>{children || <Outlet />}</Suspense>
        </main>
        </div>
      </div>

      {/* 3. Mobile Bottom Navigation (Ẩn khi đang trong phòng chơi game hoặc phòng học để tối đa hoá không gian) */}
      {!isFullscreen && !isActivityRoom && <MobileNav />}

      {/* 3b. Floating Campus Chat Button at bottom right (Vùng 5) — Bấm mở / bấm lại là đóng (Nhỏ gọn & mờ tinh tế khi vào phòng hoạt động) */}
      {!isFullscreen && (
        <button
          type="button"
          onClick={() => datMoChat(!isChatOpen)}
          aria-label={isChatOpen ? 'Đóng trò chuyện toàn trường' : 'Trò chuyện toàn trường'}
          title={isChatOpen ? 'Đóng trò chuyện' : 'Trò chuyện toàn trường'}
          data-testid="floating-chat-button"
          className={cn(
            'fixed z-[80] flex items-center justify-center rounded-full text-white cursor-pointer transition-colors duration-150',
            isActivityRoom
              ? 'bottom-2.5 right-2.5 sm:bottom-5 sm:right-5'
              : 'bottom-20 right-4 sm:bottom-6 sm:right-6',
            isChatOpen
              ? cn(
                  isActivityRoom ? 'size-10 sm:size-11' : 'size-12',
                  'bg-gradient-to-r from-sky-500 to-blue-600 border border-sky-300/40 opacity-100 shadow-[0_4px_20px_rgba(56,189,248,0.5)]',
                )
              : cn(
                  isActivityRoom
                    ? 'size-8 sm:size-9 bg-sky-950/70 border border-sky-400/25 shadow-sm backdrop-blur-xs opacity-35 hover:opacity-100 hover:bg-sky-600/80 hover:border-sky-300/50'
                    : 'size-9.5 sm:size-10 bg-sky-600/75 border border-sky-300/30 shadow-md',
                  !isActivityRoom && (coTinNhanMoi ? 'opacity-85' : 'opacity-40'),
                  !isActivityRoom && 'hover:opacity-100 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 hover:shadow-[0_4px_20px_rgba(56,189,248,0.45)]',
                  'focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-400',
                  'active:scale-95',
                ),
          )}
        >
          <MessageSquare
            className={cn(
              'text-white transition-transform',
              isChatOpen
                ? 'size-5'
                : isActivityRoom
                  ? 'size-3.5 sm:size-4'
                  : 'size-4.5 sm:size-5',
            )}
          />
          {coTinNhanMoi && !isChatOpen && (
            <span className="absolute -top-1 -right-1 flex size-2.5 sm:size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 sm:size-3 bg-destructive border border-canvas" />
            </span>
          )}
        </button>
      )}

      {/* 4. Global Campus Chat Drawer (On-demand Sheet) */}
      <CampusChatSheet
        open={isChatOpen}
        onOpenChange={datMoChat}
        messages={messages}
        myPermissions={myPermissions}
        onSendMessage={guiChat}
        onDeleteMessage={xoaChat}
        activeDmTarget={activeDmTarget}
        onSelectDmTarget={setActiveDmTarget}
        coTinNhanMoiCampus={coTinNhanMoi}
      />
    </div>
  )
}
