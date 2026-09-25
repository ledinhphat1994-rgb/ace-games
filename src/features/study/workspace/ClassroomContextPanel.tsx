// src/features/study/workspace/ClassroomContextPanel.tsx
// Digital Campus v2: Single Mutually Exclusive Contextual Rail

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { NguoiDung } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import type { RoomChatMessage, ThanhVienPhong, SharedNotes } from '@shared/protocol/room'
import type { VoiceClientState } from '@/lib/voice-client'
import {
  AlertCircle,
  Ban,
  Crown,
  Flag,
  Mic,
  MicOff,
  SendHorizontal,
  Smile,
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

/** Cách đáy dưới mức này thì coi như đang xem tin mới nhất. */
const NGUONG_DAY_PX = 80

const NUT_ICON =
  'flex size-7 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring'

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
  const oDayRef = useRef(true)

  const tinCuoi = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null
  const tinCuoiCuaMinh = tinCuoi !== null && tinCuoi.accountId === nguoiDung.accountId

  // Chỉ cuộn trong khung tin; bám theo tin mới khi đang ở cuối hoặc vừa tự gửi, không kéo người đang đọc tin cũ
  useEffect(() => {
    const khung = chatScrollRef.current
    if (view !== 'chat' || !khung) return
    if (oDayRef.current || tinCuoiCuaMinh) {
      khung.scrollTo({ top: khung.scrollHeight, behavior: 'smooth' })
    }
  }, [chatMessages, view, tinCuoiCuaMinh])

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

  const coQuyenQuanLy = isHost || canModerate

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
        className="fixed sm:relative right-0 inset-y-0 sm:inset-y-auto sm:h-full z-50 sm:z-20 flex w-80 sm:w-72 md:w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border-l border-border-subtle bg-surface shadow-2xl sm:rounded-2xl sm:border sm:shadow-none"
        data-testid="classroom-context-panel"
      >
        {/* ── PANEL HEADER ── */}
        <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3.5 py-2 select-none">
          <p className="text-sm font-semibold text-text-primary">
            {view === 'chat' ? (
              'Trò chuyện'
            ) : view === 'members' ? (
              <>
                Thành viên <span className="font-medium text-text-tertiary tabular-nums">{members.length}</span>
              </>
            ) : (
              'Công cụ'
            )}
          </p>

          <div className="flex items-center gap-1">
            {view === 'members' && (
              <>
                <Button type="button" size="xs" variant="outline" onClick={onOpenInvite} title="Mời bạn bè vào phòng">
                  <UserPlus />
                  Mời
                </Button>

                {coQuyenQuanLy && (
                  <button
                    type="button"
                    onClick={onOpenBannedList}
                    className={cn(NUT_ICON, 'hover:bg-destructive/10 hover:text-destructive')}
                    title="Danh sách cấm"
                    aria-label="Danh sách cấm vào phòng"
                  >
                    <Ban className="size-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className={cn(NUT_ICON, 'hover:bg-surface-overlay hover:text-text-primary')}
              title="Đóng bảng này (Escape)"
              aria-label="Đóng bảng"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ── SUBVIEW: CHAT ── */}
        {view === 'chat' && (
          <div className="flex flex-1 flex-col overflow-hidden" data-testid="context-panel-chat">
            {/* Messages list */}
            <div
              ref={chatScrollRef}
              onScroll={() => {
                const khung = chatScrollRef.current
                if (khung) oDayRef.current = khung.scrollHeight - khung.scrollTop - khung.clientHeight < NGUONG_DAY_PX
              }}
              role="log"
              aria-label="Tin nhắn trong phòng"
              className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3.5 py-3"
              style={{ overflowAnchor: 'none' }}
            >
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <p className="text-sm font-medium text-text-primary">Chưa có tin nhắn</p>
                  <p className="mt-1 text-xs text-text-tertiary">Gửi lời chào tới mọi người trong phòng.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.accountId === nguoiDung.accountId
                  return (
                    <div key={msg.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                      {!isMe && <span className="mb-0.5 px-1 text-[11px] font-medium text-text-tertiary">{msg.ten}</span>}
                      <div className={cn('group/chatmsg relative flex max-w-[90%] items-center gap-1', isMe && 'flex-row-reverse')}>
                        <div
                          className={cn(
                            'min-w-0 rounded-2xl px-3 py-1.5 text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap text-text-primary select-text',
                            isMe ? 'rounded-br-md bg-brand/15' : 'rounded-bl-md bg-surface-raised',
                          )}
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
                            className={cn(
                              NUT_ICON,
                              'size-6 opacity-0 group-hover/chatmsg:opacity-100 hover:text-warning focus-visible:opacity-100 pointer-coarse:opacity-100',
                            )}
                            title="Báo cáo tin nhắn"
                            aria-label="Báo cáo tin nhắn"
                          >
                            <Flag className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Composer */}
            <div className="relative border-t border-border-subtle p-2.5">
              {showEmoji && (
                <div className="absolute right-2 bottom-full z-20 mb-2 w-64 rounded-2xl bg-surface-raised p-2 shadow-xl ring-1 ring-white/[0.08]">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setChatInput((prev) => prev + em)}
                        className="rounded-lg p-1 text-center text-sm leading-none transition-colors hover:bg-surface-overlay"
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
                  className={cn(
                    NUT_ICON,
                    'size-9 rounded-xl',
                    showEmoji ? 'bg-brand/12 text-brand' : 'hover:bg-surface-overlay hover:text-text-primary',
                  )}
                  title="Chèn biểu cảm"
                  aria-label="Chèn biểu cảm"
                  aria-expanded={showEmoji}
                >
                  <Smile className="size-4" />
                </button>

                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isReconnecting ? 'Đang kết nối lại…' : 'Nhập tin nhắn…'}
                  aria-label="Nội dung tin nhắn trong phòng"
                  disabled={isReconnecting}
                  maxLength={1000}
                  autoComplete="off"
                  enterKeyHint="send"
                  className="h-9 flex-1"
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
                  size="icon"
                  disabled={isReconnecting || !chatInput.trim() || isSending}
                  className="size-9 shrink-0 rounded-xl"
                  aria-label="Gửi tin nhắn"
                  // Bấm gửi không lấy mất con trỏ của ô nhập
                  onMouseDown={(e) => e.preventDefault()}
                  data-testid="chat-send-btn"
                >
                  <SendHorizontal />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── SUBVIEW: MEMBERS & SHARED NOTES ── */}
        {view === 'members' && (
          <div className="flex flex-1 flex-col overflow-hidden" data-testid="context-panel-members">
            {/* Members list */}
            <ul className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2">
              {members.map((m) => {
                const isRoomHost = m.key === hostKey || Boolean(m.isHost)
                const laToi = m.key === nguoiDung.actorKey
                const isSpeaking =
                  voiceState.speakingActors.includes(m.key) ||
                  (laToi && voiceState.speakingActors.includes('local'))
                const accId = m.key.startsWith('acc:') ? parseInt(m.key.slice(4), 10) || 0 : 0

                return (
                  <li key={m.key} className="group flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-surface-raised/60">
                    <span
                      className={cn(
                        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-[11px] font-semibold text-text-secondary',
                        isSpeaking && 'ring-2 ring-success',
                      )}
                    >
                      {getInitials(m.ten)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-medium break-words text-text-primary">
                        <span className="min-w-0">
                          {m.ten}
                          {laToi && <span className="font-normal text-text-tertiary"> (bạn)</span>}
                        </span>
                        {isRoomHost && <Crown className="size-3 shrink-0 text-achievement" aria-hidden />}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        {isRoomHost ? 'Chủ phòng' : 'Thành viên'}
                        {isSpeaking ? ' · đang nói' : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <span
                        className={cn('flex size-7 items-center justify-center', m.mic ? 'text-success' : 'text-text-tertiary/60')}
                        title={m.mic ? 'Đang bật mic' : 'Đang tắt mic'}
                      >
                        {m.mic ? <Mic className="size-3.5" /> : <MicOff className="size-3.5" />}
                      </span>

                      {/* Force mute (Host only) */}
                      {coQuyenQuanLy && !laToi && m.mic && (
                        <button
                          type="button"
                          onClick={() => onForceMute(m.key)}
                          className="rounded-lg px-1.5 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                          title="Tắt micro thành viên này"
                        >
                          Tắt mic
                        </button>
                      )}

                      {/* Kick member (Host only) */}
                      {coQuyenQuanLy && !laToi && (
                        <button
                          type="button"
                          onClick={() => onKickMember({ actorKey: m.key, name: m.ten })}
                          className={cn(NUT_ICON, 'hover:bg-destructive/10 hover:text-destructive')}
                          title="Mời ra khỏi phòng"
                          aria-label={`Mời ${m.ten} ra khỏi phòng`}
                        >
                          <UserX className="size-3.5" />
                        </button>
                      )}

                      {/* Report member */}
                      {!laToi && accId > 0 && (
                        <button
                          type="button"
                          onClick={() => onReportUser({ accountId: accId, name: m.ten })}
                          className={cn(NUT_ICON, 'hover:bg-warning/10 hover:text-warning')}
                          title="Báo cáo vi phạm"
                          aria-label={`Báo cáo ${m.ten}`}
                        >
                          <Flag className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Shared notes */}
            <div className="border-t border-border-subtle p-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-text-primary">Ghi chú chung</span>
                {sharedNotes.lastEditedBy && (
                  <span className="min-w-0 text-[11px] break-words text-text-tertiary">
                    Sửa lần cuối: {sharedNotes.lastEditedBy}
                  </span>
                )}
              </div>

              {notesConflict && (
                <div className="mb-2 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-xs">
                  <p className="flex items-center gap-1 font-medium text-warning">
                    <AlertCircle className="size-3.5 shrink-0" />
                    Có người vừa sửa ghi chú
                  </p>
                  <p className="mt-1 leading-snug text-text-secondary">
                    {notesConflict.currentNotes.lastEditedBy} đã lưu một bản khác. Chọn bản muốn giữ:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button type="button" size="xs" variant="outline" onClick={() => onResolveNotesConflict('keep_server')}>
                      Dùng bản mới
                    </Button>
                    <Button type="button" size="xs" onClick={() => onResolveNotesConflict('force_client')}>
                      Giữ bản của tôi
                    </Button>
                  </div>
                </div>
              )}

              <textarea
                value={localNotes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Ghi chú chung cho buổi học…"
                aria-label="Ghi chú chung"
                rows={3}
                className="w-full resize-none rounded-xl border border-border-default bg-canvas/40 p-2.5 text-xs leading-relaxed text-text-primary placeholder:text-text-tertiary focus:border-brand/50 focus:outline-none"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
