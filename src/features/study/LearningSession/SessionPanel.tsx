import { useState } from 'react'
import {
  GraduationCap,
  Square,
  Target,
  Clock,
  Vote,
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SessionGoalWidget } from './SessionGoal'
import { SessionTaskList } from './SessionTaskList'
import { SessionTimerWidget } from './SessionTimerWidget'
import { SessionPoll } from './SessionPoll'
import { ParticipationBadges } from './ParticipationBadges'
import type {
  SessionGoal,
  SessionTask,
  SessionTimerState,
  ActivePoll,
} from '@shared/protocol/room'

interface SessionPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SessionGoal | null
  tasks: SessionTask[]
  completionMap: Record<string, number[]>
  timer: SessionTimerState
  serverClockOffset?: number
  poll: ActivePoll | null
  voteCounts: Record<string, number> | null
  activeKeys: string[]
  members: Array<{ key: string; ten: string }>
  currentAccountId: number
  canControl: boolean
  sessionStartedAt: number | null
  onSetGoal: (text: string) => void
  onClearGoal: () => void
  onAddTask: (text: string) => void
  onRemoveTask: (taskId: string) => void
  onTickTask: (taskId: string) => void
  onUntickTask: (taskId: string) => void
  onStartTimer: (durationSeconds: number) => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onCreatePoll: (question: string, options: string[]) => void
  onVotePoll: (pollId: string, optionId: string) => void
  onClosePoll: () => void
  onStartSession: () => void
  onEndSession: () => void
}

export function SessionPanel({
  open,
  onOpenChange,
  goal,
  tasks,
  completionMap,
  timer,
  serverClockOffset = 0,
  poll,
  voteCounts,
  activeKeys,
  members,
  currentAccountId,
  canControl,
  sessionStartedAt,
  onSetGoal,
  onClearGoal,
  onAddTask,
  onRemoveTask,
  onTickTask,
  onUntickTask,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  onStartSession,
  onEndSession,
}: SessionPanelProps) {
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const isStarted = Boolean(sessionStartedAt && sessionStartedAt > 0)

  const handleEndConfirm = () => {
    setConfirmEndOpen(false)
    onEndSession()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/50 overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="p-4 pb-3 border-b border-border/40 bg-card/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    Phiên học nhóm
                    {isStarted && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/30">
                        Đang diễn ra
                      </span>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] text-muted-foreground">
                    Cấu trúc buổi học, nhiệm vụ, đồng hồ và khảo sát
                  </SheetDescription>
                </div>
              </div>
            </div>

            {/* Host session lifecycle controls */}
            {canControl && (
              <div className="mt-3 flex items-center gap-2">
                {!isStarted ? (
                  <Button
                    size="xs"
                    onClick={onStartSession}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-sm h-8"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Bắt đầu buổi học ngay
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setConfirmEndOpen(true)}
                    className="w-full border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-semibold text-xs h-8"
                  >
                    <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    Kết thúc & Tổng kết buổi học
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Navigation Tabs */}
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2 border-b border-border/40 bg-card/20">
              <TabsList className="w-full grid grid-cols-3 h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="tasks" className="text-xs gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Nhiệm vụ
                </TabsTrigger>
                <TabsTrigger value="timer" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Đồng hồ
                </TabsTrigger>
                <TabsTrigger value="poll" className="text-xs gap-1.5">
                  <Vote className="h-3.5 w-3.5" />
                  Bình chọn
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <TabsContent value="tasks" className="space-y-4 m-0">
                <SessionGoalWidget
                  goal={goal}
                  canControl={canControl}
                  onSetGoal={onSetGoal}
                  onClearGoal={onClearGoal}
                />

                <SessionTaskList
                  tasks={tasks}
                  completionMap={completionMap}
                  currentAccountId={currentAccountId}
                  canControl={canControl}
                  onAddTask={onAddTask}
                  onRemoveTask={onRemoveTask}
                  onTickTask={onTickTask}
                  onUntickTask={onUntickTask}
                />
              </TabsContent>

              <TabsContent value="timer" className="space-y-4 m-0">
                <SessionTimerWidget
                  timer={timer}
                  serverClockOffset={serverClockOffset}
                  canControl={canControl}
                  onStart={onStartTimer}
                  onPause={onPauseTimer}
                  onReset={onResetTimer}
                />

                <ParticipationBadges
                  activeKeys={activeKeys}
                  members={members}
                />
              </TabsContent>

              <TabsContent value="poll" className="space-y-4 m-0">
                <SessionPoll
                  poll={poll}
                  voteCounts={voteCounts}
                  currentAccountId={currentAccountId}
                  canControl={canControl}
                  onCreatePoll={onCreatePoll}
                  onVote={onVotePoll}
                  onClosePoll={onClosePoll}
                />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog for Ending Session */}
      <AlertDialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kết thúc buổi học này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ chốt báo cáo buổi học, tính toán thời lượng, tỷ lệ hoàn
              thành nhiệm vụ của các thành viên và hiển thị bản tổng kết cho cả phòng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndConfirm}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Xác nhận kết thúc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
