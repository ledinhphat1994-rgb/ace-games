// src/features/study/workspace/ClassroomTopBar.tsx
// Digital Campus v2: Minimalist Immersive Room Header
// Tên phòng xuống dòng khi dài (thanh cao lên), không bao giờ cắt chữ hay ẩn nút.

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  Loader2,
  MessageSquare,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import type { ContextPanelView } from './types'

export interface ClassroomTopBarProps {
  roomTitle: string
  isHost: boolean
  isOnline: boolean
  isReconnecting: boolean
  latencyMs: number | null
  // Contextual Rail Triggers
  activePanel: ContextPanelView
  onTogglePanel: (panel: ContextPanelView) => void
  unreadChatCount: number
  /** Dải người tham gia kéo ngang + cấp quyền công cụ (chỉ chủ phòng thấy ô cấp quyền). */
  memberStrip?: ReactNode
  // Navigation
  onLeaveRoom: () => void
  onCloseRoom?: () => Promise<void>
}

const NUT_KHUNG =
  'relative flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ClassroomTopBar({
  roomTitle,
  isHost,
  isOnline,
  isReconnecting,
  latencyMs,
  activePanel,
  onTogglePanel,
  unreadChatCount,
  memberStrip,
  onLeaveRoom,
  onCloseRoom,
}: ClassroomTopBarProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [isClosingRoom, setIsClosingRoom] = useState(false)

  const nutPanel = (dangMo: boolean) =>
    cn(
      NUT_KHUNG,
      dangMo
        ? 'border-brand/40 bg-brand/12 text-brand'
        : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
    )

  return (
    <header
      className="z-30 flex min-h-16 sm:min-h-[68px] shrink-0 items-center justify-between gap-3 bg-canvas px-2 py-1 select-none sm:px-3"
      data-testid="classroom-top-bar"
    >
      {/* ── LEFT: LEAVE + ROOM NAME + CONNECTION STATUS ── */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onLeaveRoom}
          className={cn(NUT_KHUNG, 'w-10 shrink-0 border-border-default px-0 text-text-secondary hover:bg-surface-overlay hover:text-text-primary sm:w-auto sm:px-3.5')}
          data-testid="topbar-btn-leave"
          title="Rời phòng học"
          aria-label="Rời phòng học"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>

        <div className="min-w-0">
          <h1 className="flex items-start gap-1.5 text-sm sm:text-base leading-snug font-bold break-words text-text-primary">
            {isHost && (
              <Crown className="mt-0.5 size-4 shrink-0 text-achievement" aria-label="Bạn là chủ phòng" />
            )}
            <span className="min-w-0">{roomTitle}</span>
          </h1>

          {/* Connection status */}
          {isReconnecting ? (
            <p className="flex items-center gap-1 text-[11px] font-medium text-warning">
              <Loader2 className="size-3 animate-spin" />
              Đang kết nối lại…
            </p>
          ) : isOnline ? (
            // Biểu tượng wifi xanh (text-emerald-400) là tín hiệu "đã vào phòng" mà các bài e2e dựa vào
            <p className="flex items-center gap-1.5 text-[11px] text-text-tertiary" title="Kết nối trực tuyến">
              <Wifi className="size-3 text-emerald-400" />
              Trực tuyến
              {latencyMs !== null && latencyMs > 0 && <span className="tabular-nums">· {latencyMs} ms</span>}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-destructive" title="Mất kết nối">
              <WifiOff className="size-3" />
              Mất kết nối
            </p>
          )}
        </div>
      </div>

      {/* ── CENTER: MEMBER STRIP (vùng 1 ra 1+ và căn giữa) ── */}
      {memberStrip && (
        <div className="flex flex-1 min-w-0 items-center justify-center px-1">
          {memberStrip}
        </div>
      )}

      {/* ── RIGHT: CONTEXTUAL PANEL TRIGGERS + CLOSE ROOM ── */}
      <div className="flex flex-1 min-w-0 items-center justify-end gap-1.5 sm:gap-2">
        {/* Chat Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel('chat')}
          className={nutPanel(activePanel === 'chat')}
          data-testid="topbar-btn-chat"
          title="Mở chat phòng học"
          aria-label="Mở chat phòng học"
        >
          <MessageSquare className="size-4" />
          <span className="hidden sm:inline">Chat</span>
          {unreadChatCount > 0 && activePanel !== 'chat' && (
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-primary-foreground tabular-nums"
              data-testid="chat-unread-badge"
            >
              {Math.min(unreadChatCount, 99)}
            </span>
          )}
        </button>

        {/* Nút hủy phòng (chỉ dành cho chủ phòng) */}
        {isHost && onCloseRoom && (
          <button
            type="button"
            onClick={() => setShowConfirmClose(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            data-testid="topbar-btn-close-room"
            title="Hủy phòng"
            aria-label="Hủy phòng"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Popup xác nhận hủy phòng (cân đối, tinh gọn, chỉ tiêu đề) */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-[320px] p-6 rounded-2xl border-border-default bg-surface shadow-2xl flex flex-col items-center text-center gap-0"
          data-testid="dialog-confirm-close-room"
        >
          {/* Icon cảnh báo đỏ nổi bật, tinh tế */}
          <div className="flex size-12 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive mb-3.5 shadow-sm">
            <AlertTriangle className="size-6" />
          </div>

          <DialogHeader className="p-0 text-center space-y-0">
            <DialogTitle className="text-base font-semibold text-text-primary text-center">
              Hủy phòng học?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Hủy phòng học
            </DialogDescription>
          </DialogHeader>

          {/* 2 nút dàn đều 2 bên cân đối */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmClose(false)}
              disabled={isClosingRoom}
              className="h-10 rounded-xl font-medium"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (isClosingRoom || !onCloseRoom) return
                setIsClosingRoom(true)
                try {
                  await onCloseRoom()
                  setShowConfirmClose(false)
                } catch {
                  // error toast handled in parent
                } finally {
                  setIsClosingRoom(false)
                }
              }}
              disabled={isClosingRoom}
              data-testid="btn-confirm-close-room"
              className="h-10 rounded-xl font-medium"
            >
              {isClosingRoom ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang hủy…
                </>
              ) : (
                'Hủy phòng'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
