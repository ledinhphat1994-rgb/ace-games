// src/features/study/workspace/ClassroomContextPanel.tsx
// Digital Campus v2: Single Mutually Exclusive Contextual Rail

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { NguoiDung } from '@/lib/api'
import type { RoomChatMessage, ThanhVienPhong, SharedNotes } from '@shared/protocol/room'
import type { VoiceClientState } from '@/lib/voice-client'
import {
  AlertCircle,
  Ban,
  Crown,
  Flag,
  Mic,
  MicOff,
  Send,
  UserPlus,
  UserX,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ContextPanelView } from './types'

export interface ClassroomContextPanelProps {
  view: ContextPanelView
  onClose: () => void
  nguoiDung: NguoiDung
  isHost: boolean
  canModerate?: boolean
  hostKey: string | null
  // Chat
  chatMessages: RoomChatMessage[]
  onSendChat: (text: string) => Promise<boolean>
  onReportMessage: (target: { accountId: number; name: string; contentSnippet?: string }) => void
  // Members
  members: ThanhVienPhong[]
  voiceState: VoiceClientState
  onForceMute: (actorKey: string) => Promise<unknown>
  onKickMember: (target: { actorKey: string; name: string }) => void
  onReportUser: (target: { accountId: number; name: string }) => void
  onOpenInvite: () => void
  onOpenBannedList: () => void
  // Shared Notes
  sharedNotes: SharedNotes
  localNotes: string
  onChangeNotes: (text: string) => void
  notesConflict: { currentNotes: SharedNotes; rejectedContent: string } | null
  onResolveNotesConflict: (resolution: 'keep_server' | 'force_client') => void
  isReconnecting?: boolean
}

const EMOJIS = [
  '😊', '😄', '😆', '🤣', '😢', '😭', '😅', '😍', '😂', '🙂',
  '👍', '👎', '👋', '🙌', '🤝', '💪', '🤦', '🙏', '✌️', '👏',
  '❤️', '💙', '💚', '💛', '💜', '🔥', '⭐', '🌟', '💯', '🎉',
  '📚', '📖', '✏️', '📝', '🎯', '💡', '🏫', '🎒', '📊', '🧩',
]

export function ClassroomContextPanel({
  view,
  onClose,
  nguoiDung,
  isHost,
  canModerate = false,
  hostKey,
  chatMessages,
  onSendChat,
  onReportMessage,
  members,
  voiceState,
  onForceMute,
  onKickMember,
  onReportUser,
  onOpenInvite,
  onOpenBannedList,
  sharedNotes,
  localNotes,
  onChangeNotes,
  notesConflict,
  onResolveNotesConflict,
  isReconnecting = false,
}: ClassroomContextPanelProps) {
  const [chatInput, setChatInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (view === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages, view])

  // Escape key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (view === 'closed') return null

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed || isSending) return
    setIsSending(true)
    setShowEmoji(false)
    try {
      const ok = await onSendChat(trimmed)
      if (ok) setChatInput('')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop for drawer overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Khung thông tin bên phải"
        className="fixed sm:relative right-0 inset-y-0 sm:inset-y-auto sm:h-full z-50 sm:z-20 flex w-80 sm:w-72 md:w-80 flex-col overflow-hidden border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-all"
        data-testid="classroom-context-panel"
      >
        {/* ── PANEL HEADER ── */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4 bg-white/5 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {view === 'chat' ? '💬 Chat phòng học' : view === 'members' ? `👥 Thành viên (${members.length})` : '🛠️ Công cụ'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {view === 'members' && (
              <>
                <button
                  type="button"
                  onClick={onOpenInvite}
                  className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  title="Mời bạn bè vào phòng"
                >
                  <UserPlus className="h-3 w-3" />
                  <span className="hidden sm:inline">Mời</span>
                </button>

                {(isHost || canModerate) && (
                  <button
                    type="button"
                    onClick={onOpenBannedList}
                    className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Danh sách cấm"
                  >
                    <Ban className="h-3 w-3" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Đóng bảng này (Escape)"
              aria-label="Đóng bảng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── SUBVIEW: CHAT ── */}
        {view === 'chat' && (
          <div className="flex flex-1 flex-col overflow-hidden" data-testid="context-panel-chat">
            {/* Messages list */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-500 text-center p-4">
                  Chưa có tin nhắn nào trong phòng học. Hãy gửi lời chào đầu tiên!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.accountId === nguoiDung.accountId
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="mb-0.5 text-[10px] font-semibold text-slate-400">
                          {msg.ten}
                        </span>
                      )}
                      <div className="group/chatmsg relative flex items-center gap-1 max-w-[90%]">
                        <div
                          className={`rounded-2xl px-3 py-1.5 text-xs break-words leading-relaxed select-text ${
                            isMe
                              ? 'rounded-tr-xs bg-indigo-600 text-white'
                              : 'rounded-tl-xs bg-white/10 text-slate-200'
                          }`}
                        >
                          {msg.text}
                        </div>
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => {
                              onReportMessage({
                                accountId: msg.accountId,
                                name: msg.ten,
                                contentSnippet: msg.text,
                              })
                            }}
                            className="opacity-0 group-hover/chatmsg:opacity-100 transition-opacity p-1 text-slate-500 hover:text-amber-400 cursor-pointer"
                            title="Báo cáo tin nhắn"
                            aria-label="Báo cáo tin nhắn"
                          >
                            <Flag className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Composer */}
            <div className="relative border-t border-white/10 bg-slate-950 p-2.5">
              {showEmoji && (
                <div className="absolute bottom-full right-2 mb-2 z-20 w-64 rounded-2xl border border-white/15 bg-slate-950 p-2 shadow-2xl backdrop-blur-2xl">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setChatInput((prev) => prev + em)}
                        className="rounded p-1 text-sm leading-none hover:bg-white/10 transition-colors cursor-pointer text-center"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition-colors cursor-pointer ${
                    showEmoji ? 'bg-indigo-600/60 ring-1 ring-indigo-500/50' : 'hover:bg-white/10'
                  }`}
                  title="Chèn biểu cảm"
                >
                  😊
                </button>

                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isReconnecting ? 'Đang kết nối lại...' : 'Nhập tin nhắn...'}
                  disabled={isReconnecting}
                  className="flex-1 h-8 rounded-xl border-white/15 bg-white/5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/40"
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleFormSubmit(e)
                    }
                  }}
                  data-testid="chat-input"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={isReconnecting || !chatInput.trim() || isSending}
                  className="h-8 w-8 shrink-0 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
                  data-testid="chat-send-btn"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── SUBVIEW: MEMBERS & SHARED NOTES ── */}
        {view === 'members' && (
          <div className="flex flex-1 flex-col overflow-hidden" data-testid="context-panel-members">
            {/* Members list */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {members.map((m) => {
                const isRoomHost = m.key === hostKey || Boolean(m.isHost)
                const isSpeaking =
                  voiceState.speakingActors.includes(m.key) ||
                  (m.key === nguoiDung.actorKey && voiceState.speakingActors.includes('local'))

                return (
                  <div
                    key={m.key}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-white/5 group transition-colors"
                  >
                    <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {m.ten.charAt(0).toUpperCase()}
                      {m.mic && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-xs font-semibold text-slate-200">{m.ten}</p>
                        {isRoomHost && (
                          <span title="Chủ phòng">
                            <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      {isRoomHost && (
                        <span className="text-[9px] font-bold text-amber-400">Chủ phòng</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`rounded-full p-1 text-xs transition-all ${
                          m.mic ? 'text-emerald-400' : 'text-slate-600'
                        } ${isSpeaking ? 'ring-2 ring-emerald-400 animate-pulse bg-emerald-500/20' : ''}`}
                        title={m.mic ? 'Đang bật mic' : 'Đang tắt mic'}
                      >
                        {m.mic ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                      </span>

                      {/* Force mute (Host only) */}
                      {(isHost || canModerate) && m.key !== nguoiDung.actorKey && m.mic && (
                        <button
                          type="button"
                          onClick={() => onForceMute(m.key)}
                          className="rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                          title="Tắt micro thành viên này"
                        >
                          <span className="text-[9px] font-bold text-red-400">Tắt mic</span>
                        </button>
                      )}

                      {/* Kick member (Host only) */}
                      {(isHost || canModerate) && m.key !== nguoiDung.actorKey && (
                        <button
                          type="button"
                          onClick={() => onKickMember({ actorKey: m.key, name: m.ten })}
                          className="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Mời ra khỏi phòng"
                        >
                          <UserX className="h-3 w-3" />
                        </button>
                      )}

                      {/* Report member */}
                      {m.key !== nguoiDung.actorKey && (() => {
                        let accId = 0
                        if (m.key.startsWith('acc:')) accId = parseInt(m.key.slice(4), 10) || 0
                        if (!accId) return null
                        return (
                          <button
                            type="button"
                            onClick={() => onReportUser({ accountId: accId, name: m.ten })}
                            className="rounded p-1 text-slate-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Báo cáo vi phạm"
                          >
                            <Flag className="h-3 w-3" />
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Shared notes */}
            <div className="border-t border-white/10 p-3 bg-white/2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  📝 Ghi chú chung
                </span>
                {sharedNotes.lastEditedBy && (
                  <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                    Sửa: {sharedNotes.lastEditedBy}
                  </span>
                )}
              </div>

              {notesConflict && (
                <div className="mb-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                  <div className="flex items-center gap-1 font-bold text-[11px] text-amber-300">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>Xung đột chỉnh sửa</span>
                  </div>
                  <p className="mt-1 text-[10px] text-amber-200/80 leading-snug">
                    Ghi chú đã được cập nhật bởi {notesConflict.currentNotes.lastEditedBy}.
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onResolveNotesConflict('keep_server')}
                      className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-white/20"
                    >
                      Bản mới
                    </button>
                    <button
                      type="button"
                      onClick={() => onResolveNotesConflict('force_client')}
                      className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-500"
                    >
                      Lưu bản tôi
                    </button>
                  </div>
                </div>
              )}

              <textarea
                value={localNotes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Ghi chú chung cho buổi học..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
