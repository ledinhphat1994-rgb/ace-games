import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthGate } from '@/app/AuthGate'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { HubPage } from '@/features/hub/HubPage'
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
      { index: true, element: <HubPage /> },
      { path: 'room/:roomId', element: <RoomPage /> },
      { path: 'arena', element: <GameArenaPage /> },
      { path: 'game/:gameId', element: <GameRoomPage /> },
      { path: 'admin/analytics', element: <AnalyticsDashboardPage /> },
      { path: 'admin', element: <AdminControlPlanePage /> },
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
