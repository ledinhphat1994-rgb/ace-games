// src/features/study/workspace/ClassroomTopBar.tsx
// Digital Campus v2: Minimalist Immersive Room Header

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { VoiceClientState } from '@/lib/voice-client'
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
}

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
}: ClassroomTopBarProps) {
  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/80 px-3 sm:px-4 backdrop-blur-md z-30 select-none"
      data-testid="classroom-top-bar"
    >
      {/* ── LEFT: LEAVE + ROOM NAME + CONNECTION STATUS ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          data-testid="topbar-btn-leave"
          title="Rời phòng học"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Rời phòng</span>
        </button>

        <div className="flex items-center gap-1.5 truncate min-w-0">
          {isHost && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
          <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[240px]" title={roomTitle}>
            {roomTitle}
          </h1>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1 shrink-0">
          {isReconnecting ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              <span>Đang kết nối lại</span>
            </span>
          ) : isOnline ? (
            <div className="flex items-center gap-1" title="Kết nối trực tuyến">
              <Wifi className="h-3 w-3 text-emerald-400" />
              {latencyMs !== null && latencyMs > 0 && (
                <span className="hidden md:inline font-mono text-[9px] text-slate-500">{latencyMs}ms</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1" title="Mất kết nối">
              <WifiOff className="h-3 w-3 text-red-400" />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: VOICE + CONTEXTUAL PANEL TRIGGERS ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Voice Microphone + Device Settings */}
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5">
          <button
            type="button"
            onClick={onToggleMic}
            disabled={voiceState.isConnecting}
            className={`flex h-7 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all cursor-pointer ${
              myMic ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            } ${voiceState.isConnecting ? 'opacity-60 cursor-wait' : ''} ${
              voiceState.speakingActors.includes('local')
                ? 'ring-2 ring-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : ''
            }`}
            title={myMic ? 'Tắt micro' : 'Bật micro'}
            aria-label={myMic ? 'Tắt micro' : 'Bật micro'}
          >
            {voiceState.isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
            ) : myMic ? (
              <Mic className="h-3.5 w-3.5" />
            ) : (
              <MicOff className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Audio Settings Popover */}
          <Popover onOpenChange={(open) => { if (open) onRefreshDevices() }}>
            <PopoverTrigger
              type="button"
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none"
              title="Cài đặt âm thanh"
              aria-label="Cài đặt âm thanh"
            >
              <SlidersHorizontal className="h-3 w-3" />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-72 border border-white/15 bg-slate-950/95 p-3 text-slate-200 backdrop-blur-xl shadow-2xl rounded-2xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Cài đặt âm thanh</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {voiceState.connectionState === 'connected' ? 'Đã kết nối' : 'Sẵn sàng'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label htmlFor="voice-in-select" className="text-[11px] font-semibold text-slate-300">
                    Microphone
                  </label>
                  <select
                    id="voice-in-select"
                    value={voiceState.currentInputDeviceId || ''}
                    onChange={(e) => onSetAudioInput(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    {audioInputs.length === 0 ? (
                      <option value="">Mặc định hệ thống</option>
                    ) : (
                      audioInputs.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Microphone ${i + 1}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {isSinkIdSupported && (
                  <div className="space-y-1">
                    <label htmlFor="voice-out-select" className="text-[11px] font-semibold text-slate-300">
                      Loa / Tai nghe
                    </label>
                    <select
                      id="voice-out-select"
                      value={voiceState.currentOutputDeviceId || ''}
                      onChange={(e) => onSetAudioOutput(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-xs text-white"
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
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-white/15" />

        {/* Chat Drawer Toggle */}
        <button
          type="button"
          onClick={() => onTogglePanel('chat')}
          className={`relative flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all cursor-pointer ${
            activePanel === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          data-testid="topbar-btn-chat"
          title="Mở chat phòng học"
          aria-label="Mở chat phòng học"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Chat</span>
          {unreadChatCount > 0 && activePanel !== 'chat' && (
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-black text-white"
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
          className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all cursor-pointer ${
            activePanel === 'members'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          data-testid="topbar-btn-members"
          title="Danh sách thành viên"
          aria-label="Danh sách thành viên"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{memberCount}</span>
        </button>
      </div>
    </header>
  )
}
