import { useEffect, useState, type ReactNode } from 'react'
import { LayoutGrid, MessageCircle, Trophy } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DraggableBubble } from './DraggableBubble'
import { cn } from '@/lib/utils'

interface ResponsiveActivityLayoutProps {
  leaderboard: ReactNode
  social: ReactNode
  children: ReactNode
  testId?: string
}

// Discovery, chat and rankings remain shared Platform capabilities on every activity.
export function ResponsiveActivityLayout({ leaderboard, social, children, testId }: ResponsiveActivityLayoutProps) {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1280px)').matches)
  const [panel, setPanel] = useState<'leaderboard' | 'messages' | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)')
    const update = () => { setDesktop(media.matches); setPanel(null) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])

  const panels = [
    { id: 'leaderboard' as const, label: 'Bảng xếp hạng', content: leaderboard, icon: <Trophy className="size-5" /> },
    { id: 'messages' as const, label: 'Tin nhắn & bạn bè', content: social, icon: <MessageCircle className="size-5" /> },
  ]

  if (isFullscreen) {
    return (
      <div data-testid={testId} className="activity-layout activity-layout--fullscreen w-full h-full min-h-[calc(100vh-1rem)] flex flex-col items-center justify-center p-0 m-0">
        <div className="w-full h-full flex flex-col flex-1 min-w-0">{children}</div>
      </div>
    )
  }

  return (
    <div data-testid={testId} className="activity-layout grid w-full min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px] 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <div className="min-w-0 xl:col-start-2 xl:row-start-1">{children}</div>
      {!desktop && (
        <DraggableBubble id="activity" label="Mở tiện ích" icon={<LayoutGrid className="size-5" />} suspended={panel !== null}
          actions={panels.map(item => ({ id: item.id, label: item.label, icon: item.icon, onSelect: () => setPanel(item.id) }))} />
      )}
      {panels.map(item => desktop ? (
        <aside key={item.id} aria-label={item.label} className={cn('min-w-0 self-start xl:row-start-1', item.id === 'leaderboard' ? 'xl:col-start-1' : 'xl:col-start-3')}>
          {item.content}
        </aside>
      ) : (
        <Sheet key={item.id} open={panel === item.id} onOpenChange={open => setPanel(open ? item.id : null)}>
          <SheetContent keepMounted finalFocus={() => document.querySelector<HTMLButtonElement>('[data-testid="bubble-activity"]')} side="right" className="activity-sheet gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md" data-testid={'activity-panel-' + item.id}>
            <SheetHeader className="shrink-0 border-b border-border-subtle py-3 pr-14">
              <SheetTitle>{item.label}</SheetTitle>
              <SheetDescription className="sr-only">{item.label}</SheetDescription>
            </SheetHeader>
            <div className="activity-sheet-body flex min-h-0 flex-1 flex-col overflow-hidden">{item.content}</div>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}
