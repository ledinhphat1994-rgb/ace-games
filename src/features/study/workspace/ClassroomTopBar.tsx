// src/features/study/workspace/ClassroomTopBar.tsx
// Digital Campus v2: Minimalist Immersive Room Header
// Tên phòng xuống dòng khi dài (thanh cao lên), không bao giờ cắt chữ hay ẩn nút.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { VoiceClientState } from '@/lib/voice-client'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Crown,
  Loader2,
  Mic,
  MicOff,
  MessageSquare,
  SlidersHorizontal,
  Users,
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
  // Voice
  myMic: boolean
  onToggleMic: () => void
  voiceState: VoiceClientState
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  isSinkIdSupported: boolean
  onSetAudioInput: (deviceId: string) => void
  onSetAudioOutput: (deviceId: string) => void
  onRefreshDevices: () => void
  // Contextual Rail Triggers
  activePanel: ContextPanelView
  onTogglePanel: (panel: ContextPanelView) => void
  unreadChatCount: number
  memberCount: number
  // Navigation
  onLeaveRoom: () => void
  onCloseRoom?: () => Promise<void>
}

const NUT_KHUNG =
  'relative flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ClassroomTopBar({
  roomTitle,
  isHost,
  isOnline,
  isReconnecting,
  latencyMs,
  myMic,
  onToggleMic,
  voiceState,
  audioInputs,
  audioOutputs,
  isSinkIdSupported,
  onSetAudioInput,
  onSetAudioOutput,
  onRefreshDevices,
  activePanel,
  onTogglePanel,
  unreadChatCount,
  memberCount,
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
      className="z-30 flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-canvas/85 px-3 py-1.5 backdrop-blur-md select-none sm:px-4"
      data-testid="classroom-top-bar"
    >
      {/* ── LEFT: LEAVE + ROOM NAME + CONNECTION STATUS ── */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onLeaveRoom}
          className={cn(NUT_KHUNG, 'w-9 shrink-0 border-border-default px-0 text-text-secondary hover:bg-surface-overlay hover:text-text-primary sm:w-auto sm:px-3')}
          data-testid="topbar-btn-leave"
          title="Rời phòng học"
          aria-label="Rời phòng học"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>

        <div className="min-w-0">
          <h1 className="flex items-start gap-1.5 text-sm leading-snug font-semibold break-words text-text-primary">
            {isHost && (
              <Crown className="mt-0.5 size-3.5 shrink-0 text-achievement" aria-label="Bạn là chủ phòng" />
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

      {/* ── RIGHT: VOICE + CONTEXTUAL PANEL TRIGGERS ── */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Voice Microphone + Device Settings */}
        <div className="flex h-9 items-center rounded-xl border border-border-default p-0.5">
          <button
            type="button"
            onClick={onToggleMic}
            disabled={voiceState.isConnecting}
            className={cn(
              'flex h-7 items-center justify-center rounded-lg px-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              myMic ? 'bg-success text-white' : 'text-text-secondary hover:text-text-primary',
              voiceState.isConnecting && 'cursor-wait opacity-60',
              voiceState.speakingActors.includes('local') && 'ring-2 ring-success/70',
            )}
            title={myMic ? 'Tắt micro' : 'Bật micro'}
            aria-label={myMic ? 'Tắt micro' : 'Bật micro'}
          >
            {voiceState.isConnecting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : myMic ? (
              <Mic className="size-4" />
            ) : (
              <MicOff className="size-4" />
            )}
          </button>

          {/* Audio Settings Popover */}
          <Popover onOpenChange={(open) => { if (open) onRefreshDevices() }}>
            <PopoverTrigger
              type="button"
              className="flex h-7 items-center rounded-lg px-1.5 text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring"
              title="Cài đặt âm thanh"
              aria-label="Cài đặt âm thanh"
            >
              <SlidersHorizontal className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-72 gap-3 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Âm thanh</span>
                <span className="text-xs text-text-tertiary">
                  {voiceState.connectionState === 'connected' ? 'Đã kết nối' : 'Sẵn sàng'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="voice-in-select" className="text-xs font-medium text-text-secondary">
                  Micro
                </label>
                <select
                  id="voice-in-select"
                  value={voiceState.currentInputDeviceId || ''}
                  onChange={(e) => onSetAudioInput(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-surface px-2 py-1.5 text-xs text-text-primary"
                >
                  {audioInputs.length === 0 ? (
                    <option value="">Mặc định hệ thống</option>
                  ) : (
                    audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Micro ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {isSinkIdSupported && (
                <div className="space-y-1.5">
                  <label htmlFor="voice-out-select" className="text-xs font-medium text-text-secondary">
                    Loa / Tai nghe
                  </label>
                  <select
                    id="voice-out-select"
                    value={voiceState.currentOutputDeviceId || ''}
                    onChange={(e) => onSetAudioOutput(e.target.value)}
                    className="w-full rounded-lg border border-border-default bg-surface px-2 py-1.5 text-xs text-text-primary"
                  >
                    {audioOutputs.length === 0 ? (
                      <option value="">Mặc định hệ thống</option>
                    ) : (
                      audioOutputs.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Loa ${i + 1}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

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

        {/* Members Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel('members')}
          className={nutPanel(activePanel === 'members')}
          data-testid="topbar-btn-members"
          title="Danh sách thành viên"
          aria-label="Danh sách thành viên"
        >
          <Users className="size-4" />
          <span className="tabular-nums">{memberCount}</span>
        </button>

        {/* Nút hủy phòng (chỉ dành cho chủ phòng, nằm sát bên phải danh sách thành viên) */}
        {isHost && onCloseRoom && (
          <button
            type="button"
            onClick={() => setShowConfirmClose(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            data-testid="topbar-btn-close-room"
            title="Hủy phòng"
            aria-label="Hủy phòng"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Popup xác nhận hủy phòng (chỉ tiêu đề, không chú thích) */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent
          className="w-full max-w-[360px] p-5 rounded-2xl border-border-default bg-surface shadow-2xl"
          data-testid="dialog-confirm-close-room"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-text-primary">
              Hủy phòng học?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Hủy phòng học
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmClose(false)}
              disabled={isClosingRoom}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
