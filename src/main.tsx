import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthGate } from '@/app/AuthGate'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/features/hub/HomePage'
import { LearningPage } from '@/features/hub/LearningPage'
import { CommunityPage } from '@/features/hub/CommunityPage'
import { ProfilePage } from '@/features/hub/ProfilePage'
import { RoomPage } from '@/features/study/RoomPage'
import { GameArenaPage } from '@/features/games/GameArenaPage'
import { GameRoomPage } from '@/features/games/GameRoomPage'
import { AnalyticsDashboardPage } from '@/features/admin/AnalyticsDashboardPage'
import { AdminControlPlanePage } from '@/features/admin/AdminControlPlanePage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

const router = createBrowserRouter([
  {
    element: <AuthGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'learn', element: <LearningPage /> },
          { path: 'learning', element: <LearningPage /> },
          { path: 'arena', element: <GameArenaPage /> },
          { path: 'community', element: <CommunityPage /> },
          { path: 'me', element: <ProfilePage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'admin/analytics', element: <AnalyticsDashboardPage /> },
          { path: 'admin', element: <AdminControlPlanePage /> },
        ],
      },
      { path: 'room/:roomId', element: <RoomPage /> },
      { path: 'game/:gameId', element: <GameRoomPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
