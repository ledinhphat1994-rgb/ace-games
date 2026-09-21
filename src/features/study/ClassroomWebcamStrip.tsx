import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic, MicOff, Video } from 'lucide-react'

interface ClassroomMember {
  key: string
  ten: string
  avatar?: string
  mic?: boolean
}

interface ClassroomWebcamStripProps {
  members: ClassroomMember[]
  hostKey?: string | null
  currentActorKey: string
  speakingActors?: string[]
}

const DEFAULT_PARTICIPANTS = [
  {
    id: 'teacher',
    name: 'Thầy Lê Đình Phát',
    role: 'Giáo viên · Chủ phòng',
    isTeacher: true,
    avatar: '/assets/classroom/user_teacher.webp',
    isSpeaking: true,
    micOn: true,
  },
  {
    id: 'student_1',
    name: 'Nguyễn Văn Minh',
    role: 'Học sinh 10A7',
    isTeacher: false,
    avatar: '/assets/classroom/user_student_minh.webp',
    isSpeaking: false,
    micOn: true,
  },
  {
    id: 'student_2',
    name: 'Trần Thị Thảo',
    role: 'Học sinh 10A7',
    isTeacher: false,
    avatar: '/assets/classroom/user_student_thao.webp',
    isSpeaking: false,
    micOn: false,
  },
  {
    id: 'student_3',
    name: 'Lê Hoàng Long',
    role: 'Học sinh 10A7',
    isTeacher: false,
    avatar: '/assets/classroom/user_student_long.webp',
    isSpeaking: false,
    micOn: false,
  },
  {
    id: 'student_4',
    name: 'Phạm Quỳnh Anh',
    role: 'Học sinh 10A7',
    isTeacher: false,
    avatar: '/assets/classroom/user_student_anh.webp',
    isSpeaking: false,
    micOn: true,
  },
]

export function ClassroomWebcamStrip({
  members,
  hostKey,
  currentActorKey,
  speakingActors = [],
}: ClassroomWebcamStripProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Merge real room members with visual classroom participants
  const participants = DEFAULT_PARTICIPANTS.map((p, idx) => {
    // If real member exists at this index, sync name
    const realMember = members[idx]
    if (realMember) {
      const isHost = realMember.key === hostKey
      const isMe = realMember.key === currentActorKey
      const isSpeaking = speakingActors.includes(realMember.key) || (isMe && speakingActors.includes('local'))
      return {
        ...p,
        name: realMember.ten,
        role: isHost ? 'Chủ phòng · Giáo viên' : 'Học sinh 10A7',
        isTeacher: isHost,
        micOn: realMember.mic ?? p.micOn,
        isSpeaking: isSpeaking || p.isSpeaking,
      }
    }
    return p
  })

  return (
    <div className="absolute top-14 right-4 z-30 max-w-[calc(100vw-2rem)] transition-all select-none">
      <div className="flex flex-col items-end gap-1.5">
        {/* Strip header / collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-md hover:bg-black/80 transition-colors"
        >
          <Video className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Webcam Lớp Học</span>
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
            {participants.length} LIVE
          </span>
          {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Video Cards Grid / Strip */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl max-w-full">
            {participants.map((p) => (
              <div
                key={p.id}
                className={`relative shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden border bg-slate-900 shadow-md group ${
                  p.isSpeaking
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                    : 'border-white/15'
                }`}
              >
                {/* Webcam Image */}
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="h-full w-full object-cover brightness-95 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to avatar 1
                    e.currentTarget.src = '/assets/avatars/avatar_01_boy.webp'
                  }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                {/* Top Status: Role & Mic */}
                <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between text-[9px]">
                  {p.isTeacher ? (
                    <span className="rounded bg-amber-500/80 px-1 py-0.2 text-[9px] font-bold text-black uppercase">
                      Giáo viên
                    </span>
                  ) : (
                    <span className="rounded bg-black/40 px-1 py-0.2 text-[9px] font-medium text-slate-300 backdrop-blur-xs">
                      10A7
                    </span>
                  )}

                  <span
                    className={`rounded-full p-0.5 ${
                      p.micOn ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'
                    }`}
                  >
                    {p.micOn ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5" />}
                  </span>
                </div>

                {/* Bottom: Name */}
                <div className="absolute bottom-1 inset-x-1.5">
                  <p className="text-[10px] sm:text-[11px] font-bold text-white truncate drop-shadow-sm">
                    {p.name}
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
