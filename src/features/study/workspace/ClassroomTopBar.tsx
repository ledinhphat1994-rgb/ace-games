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
  'relative flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-2xs'

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
        : 'border-border-default/80 bg-surface/60 text-text-secondary hover:bg-surface-raised hover:text-text-primary',
    )

  return (
    <header
      className="relative z-30 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 border-b border-border-subtle/80 bg-canvas px-2 py-1 select-none sm:px-3"
      data-testid="classroom-top-bar"
    >
      {/* ── LEFT: LEAVE + ROOM NAME + CONNECTION STATUS ── */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onLeaveRoom}
          className={cn(
            NUT_KHUNG,
            'w-9 shrink-0 border-border-default/80 bg-surface/60 px-0 text-text-secondary hover:bg-surface-raised hover:text-text-primary sm:w-auto sm:px-3',
          )}
          data-testid="topbar-btn-leave"
          title="Rời phòng học"
          aria-label="Rời phòng học"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="flex items-start gap-1.5 text-xs sm:text-sm font-bold tracking-tight text-text-primary break-words">
            {isHost && (
              <Crown className="mt-0.5 size-3.5 sm:size-4 shrink-0 text-achievement drop-shadow-xs" aria-label="Bạn là chủ phòng" />
            )}
            <span className="min-w-0 break-words">{roomTitle}</span>
          </h1>

          {/* Connection status */}
          {isReconnecting ? (
            <p className="flex items-center gap-1 text-[11px] font-semibold text-warning">
              <Loader2 className="size-3 animate-spin shrink-0" />
              <span>Đang kết nối lại…</span>
            </p>
          ) : isOnline ? (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary" title="Kết nối trực tuyến">
              <Wifi className="size-3 text-success shrink-0" />
              <span>Trực tuyến</span>
              {latencyMs !== null && latencyMs > 0 && <span className="tabular-nums opacity-75">· {latencyMs} ms</span>}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive" title="Mất kết nối">
              <WifiOff className="size-3 shrink-0" />
              <span>Mất kết nối</span>
            </p>
          )}
        </div>
      </div>

      {/* ── CENTER: MEMBER STRIP (vùng 5 căn giữa cạnh trên so với màn hình) ── */}
      {memberStrip && (
        <div className="col-span-2 row-start-2 flex min-w-0 items-center justify-start lg:col-span-1 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:justify-center pointer-events-auto max-w-[calc(100vw-360px)]">
          {memberStrip}
        </div>
      )}

      {/* ── RIGHT: CONTEXTUAL PANEL TRIGGERS + CLOSE ROOM ── */}
      <div className="flex shrink-0 items-center justify-end gap-2">
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
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground tabular-nums shadow-xs"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-destructive cursor-pointer shadow-2xs"
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
          className="w-full max-w-[min(320px,calc(100vw-2rem))] p-6 rounded-2xl border-border-default bg-surface shadow-2xl flex flex-col items-center text-center gap-0"
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
