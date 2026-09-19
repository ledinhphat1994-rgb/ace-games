import { Users } from 'lucide-react'

interface ParticipationBadgesProps {
  activeKeys: string[]
  members: Array<{ key: string; ten: string }>
}

export function ParticipationBadges({
  activeKeys,
  members,
}: ParticipationBadgesProps) {
  // Map activeKeys to member names
  const activeMembers = members.filter((m) => activeKeys.includes(m.key))

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
            <Users className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Thành viên tích cực (5 phút qua)
          </h4>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          {activeMembers.length}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {activeMembers.map((m) => {
          const initial = (m.ten || '?').charAt(0).toUpperCase()
          return (
            <div
              key={m.key}
              title={m.ten}
              className="flex items-center gap-1.5 rounded-full border border-border/30 bg-background/60 py-1 pl-1 pr-2.5 text-xs text-foreground shadow-2xs"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-[10px] font-bold text-white shadow-2xs">
                {initial}
              </div>
              <span className="max-w-[100px] truncate text-[11px] font-medium">
                {m.ten}
              </span>
            </div>
          )
        })}

        {activeMembers.length === 0 && (
          <div className="py-2 text-center text-xs text-muted-foreground w-full">
            Chưa có thành viên nào hoạt động trong 5 phút vừa qua.
          </div>
        )}
      </div>
    </div>
  )
}
