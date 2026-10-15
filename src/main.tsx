import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthGate } from '@/app/AuthGate'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ViewportMetrics } from '@/components/layout/ViewportMetrics'
import { AppShell } from '@/components/layout/AppShell'
import { LearningPage } from '@/features/hub/LearningPage'
import './index.css'
import { ThemeProvider } from '@/app/theme'

import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

if (typeof window !== 'undefined') {
  ;(window as unknown as { toast?: typeof toast }).toast = toast

  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    StatusBar.setBackgroundColor({ color: '#0a0d14' }).catch(() => {})

    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        CapApp.exitApp()
      }
    }).catch(() => {})
  }
}

// Trang đích /learn nằm trong bundle chính; các trang khác tách chunk riêng, chỉ tải khi người dùng mở tới.
const CommunityPage = lazy(() => import('@/features/hub/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const HomePage = lazy(() => import('@/features/hub/HomePage').then((m) => ({ default: m.HomePage })))
const LeaderboardPage = lazy(() => import('@/features/hub/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('@/features/hub/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const RoomPage = lazy(() => import('@/features/study/RoomPage').then((m) => ({ default: m.RoomPage })))
const GameArenaPage = lazy(() => import('@/features/games/GameArenaPage').then((m) => ({ default: m.GameArenaPage })))
const GameLobbyPage = lazy(() => import('@/features/games/GameLobbyPage').then((m) => ({ default: m.GameLobbyPage })))
const GameRoomPage = lazy(() => import('@/features/games/GameRoomPage').then((m) => ({ default: m.GameRoomPage })))
const AnalyticsDashboardPage = lazy(() =>
  import('@/features/admin/AnalyticsDashboardPage').then((m) => ({ default: m.AnalyticsDashboardPage })),
)
const AdminControlPlanePage = lazy(() =>
  import('@/features/admin/AdminControlPlanePage').then((m) => ({ default: m.AdminControlPlanePage })),
)
const ShopPage = lazy(() => import('@/features/shop/ShopPage').then((m) => ({ default: m.ShopPage })))

// Sau một lần deploy, tab đang mở vẫn giữ bundle cũ và xin chunk đã bị thay tên → tải lại trang một lần để lấy bản mới.
// Chặn lặp: không tự tải lại quá một lần trong 10 giây.
window.addEventListener('vite:preloadError', (e) => {
  const KHOA = 'dc_tai_lai_chunk'
  let lanTruoc = 0
  try {
    lanTruoc = Number(sessionStorage.getItem(KHOA)) || 0
  } catch {}
  if (Date.now() - lanTruoc < 10_000) return
  try {
    sessionStorage.setItem(KHOA, String(Date.now()))
  } catch {}
  e.preventDefault()
  window.location.reload()
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

const router = createBrowserRouter([
  // Trang công khai, không qua AuthGate: không cần đăng nhập và vẫn mở được khi API lỗi.
  { path: 'privacy', lazy: () => import('@/app/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
  {
    element: <AuthGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/arena" replace /> },
          { path: 'home', element: <Navigate to="/arena" replace /> },
          { path: 'homepage', element: <HomePage /> },
          { path: 'learn', element: <LearningPage /> },
          { path: 'learning', element: <Navigate to="/learn" replace /> },
          { path: 'arena', element: <GameArenaPage /> },
          { path: 'arena/:gameType', element: <GameLobbyPage /> },
          { path: 'community', element: <CommunityPage /> },
          { path: 'leaderboard', element: <LeaderboardPage /> },
          { path: 'rankings', element: <Navigate to="/leaderboard" replace /> },
          { path: 'shop', element: <ShopPage /> },
          { path: 'market', element: <Navigate to="/shop" replace /> },
          { path: 'me', element: <ProfilePage /> },
          { path: 'profile', element: <Navigate to="/me" replace /> },
          { path: 'admin/analytics', element: <AnalyticsDashboardPage /> },
          { path: 'admin', element: <AdminControlPlanePage /> },
          {
            path: 'game/godot',
            lazy: () =>
              import('@/features/games/godot').then((m) => ({
                Component: () => <m.GodotGameView onClose={() => window.history.back()} />,
              })),
          },
          { path: 'game/:gameId', element: <GameRoomPage /> },
        ],
      },
      { path: 'room/:roomId', element: <RoomPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
    <ViewportMetrics />
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          offset={16}
          mobileOffset={{ top: 16 }}
          closeButton
          gap={10}
          duration={2500}
        />
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
