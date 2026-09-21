import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic, MicOff, Video } from 'lucide-react'
import {
  deriveWebcamParticipants,
  getInitials,
  type ClassroomMember,
  type DerivedWebcamParticipant,
} from './classroom-webcam-state'

export {
  deriveWebcamParticipants,
  getInitials,
  type ClassroomMember,
  type DerivedWebcamParticipant,
}

export interface ClassroomWebcamStripProps {
  members: ClassroomMember[]
  hostKey?: string | null
  currentActorKey: string
  speakingActors?: string[]
}

export function ClassroomWebcamStrip({
  members = [],
  hostKey,
  currentActorKey,
  speakingActors = [],
}: ClassroomWebcamStripProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const participants = deriveWebcamParticipants(members, hostKey, currentActorKey, speakingActors)

  // Guard: Zero room members => zero rendered fictional webcams
  if (participants.length === 0) {
    return null
  }

  return (
    <div
      className="absolute top-14 right-4 z-30 max-w-[calc(100vw-2rem)] transition-all select-none"
      data-testid="classroom-webcam-strip"
    >
      <div className="flex flex-col items-end gap-1.5">
        {/* Strip header / collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-md hover:bg-black/80 transition-colors cursor-pointer"
          data-testid="webcam-strip-toggle"
        >
          <Video className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Webcam Phòng Học</span>
          <span
            className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300"
            data-testid="participant-count-badge"
          >
            {participants.length} TRỰC TUYẾN
          </span>
          {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Video Cards Grid / Strip: derives 1:1 from real members */}
        {!isCollapsed && (
          <div
            className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl max-w-full"
            data-testid="webcam-members-grid"
          >
            {participants.map((p) => (
              <div
                key={p.key}
                data-testid={`webcam-tile-${p.key}`}
                data-actor-key={p.key}
                className={`relative shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden border bg-slate-900 shadow-md flex flex-col justify-between p-2 ${
                  p.isSpeaking
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                    : 'border-white/15'
                }`}
              >
                {/* Background: User custom avatar if provided, otherwise styled initials backdrop */}
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover brightness-90"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[#0c1322] flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-white/25 select-none tracking-wider">
                      {p.initials}
                    </span>
                  </div>
                )}

                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

                {/* Top Status: Real role badge & Mic */}
                <div className="relative z-10 flex items-center justify-between text-[9px] w-full">
                  {p.isHost ? (
                    <span className="rounded bg-amber-500/90 px-1 py-0.2 text-[9px] font-bold text-black uppercase">
                      Chủ phòng
                    </span>
                  ) : p.role === 'Quản trị' ? (
                    <span className="rounded bg-indigo-500/80 px-1 py-0.2 text-[9px] font-bold text-white uppercase">
                      Quản trị
                    </span>
                  ) : (
                    <span className="rounded bg-black/40 px-1 py-0.2 text-[9px] font-medium text-slate-400 backdrop-blur-xs">
                      Thành viên
                    </span>
                  )}

                  {typeof p.micOn === 'boolean' && (
                    <span
                      className={`rounded-full p-0.5 ${
                        p.micOn ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                      }`}
                      title={p.micOn ? 'Đang mở mic' : 'Đã tắt mic'}
                    >
                      {p.micOn ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5" />}
                    </span>
                  )}
                </div>

                {/* Bottom: Real Name */}
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-[11px] font-bold text-white truncate drop-shadow-sm">
                    {p.name} {p.isMe && '(Tôi)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
