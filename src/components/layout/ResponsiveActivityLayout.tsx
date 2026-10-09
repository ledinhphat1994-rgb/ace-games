import { useEffect, useState, type ReactNode } from 'react'
import { LayoutGrid, MessageCircle, Trophy } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DraggableBubble } from './DraggableBubble'
import { cn } from '@/lib/utils'

interface ResponsiveActivityLayoutProps {
  leaderboard?: ReactNode
  social?: ReactNode
  children: ReactNode
  testId?: string
  utilityMode?: 'inline' | 'floating'
  bubbleBottomOffset?: number
  showFloatingTrigger?: boolean
  socialLabel?: string
  finalFocusSelector?: string
}

// Discovery, chat and rankings remain shared Platform capabilities on every activity.
export function ResponsiveActivityLayout({
  leaderboard,
  social,
  children,
  testId,
  bubbleBottomOffset,
  utilityMode = 'inline',
  showFloatingTrigger = true,
  socialLabel,
  finalFocusSelector,
}: ResponsiveActivityLayoutProps) {
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

  useEffect(() => {
    const handleOpenPanel = (e: Event) => {
      const custom = e as CustomEvent<'leaderboard' | 'messages'>
      if (custom.detail === 'leaderboard' || custom.detail === 'messages') {
        setPanel(custom.detail)
      }
    }
    window.addEventListener('activity:open-panel', handleOpenPanel)
    return () => window.removeEventListener('activity:open-panel', handleOpenPanel)
  }, [])

  const panels = [
    leaderboard ? { id: 'leaderboard' as const, label: 'Bảng xếp hạng', content: leaderboard, icon: <Trophy className="size-5" /> } : null,
    social ? { id: 'messages' as const, label: socialLabel ?? 'Tin nhắn & bạn bè', content: social, icon: <MessageCircle className="size-5" /> } : null,
  ].filter(Boolean) as { id: 'leaderboard' | 'messages'; label: string; content: ReactNode; icon: ReactNode }[]

  const inlinePanels = desktop && utilityMode === 'inline' && panels.length > 0

  return (
    <div data-testid={testId} className={cn('activity-layout grid w-full min-w-0 grid-cols-1 items-start gap-5', utilityMode === 'floating' && 'h-full flex-1 min-h-0', inlinePanels && 'xl:grid-cols-[240px_minmax(0,1fr)_280px] 2xl:grid-cols-[260px_minmax(0,1fr)_300px]', isFullscreen && 'activity-layout--fullscreen')}>
      <div className={cn('min-w-0', utilityMode === 'floating' && 'h-full flex-1 flex flex-col min-h-0', inlinePanels && 'xl:col-start-2 xl:row-start-1')}>{children}</div>
      {!inlinePanels && !isFullscreen && panels.length > 0 && showFloatingTrigger && (
        <DraggableBubble id="activity" bottomOffset={bubbleBottomOffset} label="Mở tiện ích" icon={<LayoutGrid className="size-5" />} suspended={panel !== null}
          actions={panels.map(item => ({ id: item.id, label: item.label, icon: item.icon, onSelect: () => setPanel(item.id) }))} />
      )}
      {panels.map(item => inlinePanels ? (
        <aside key={item.id} hidden={isFullscreen} aria-label={item.label} className={cn('min-w-0 self-start xl:row-start-1', item.id === 'leaderboard' ? 'xl:col-start-1' : 'xl:col-start-3')}>
          {item.content}
        </aside>
      ) : (
        <Sheet key={item.id} open={!isFullscreen && panel === item.id} onOpenChange={open => setPanel(open ? item.id : null)}>
          <SheetContent
            keepMounted
            finalFocus={() => {
              if (finalFocusSelector) {
                const el = document.querySelector<HTMLButtonElement>(finalFocusSelector)
                if (el) return el
              }
              return document.querySelector<HTMLButtonElement>('[data-testid="bubble-activity"]')
            }}
            side="right"
            className="activity-sheet gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
            data-testid={'activity-panel-' + item.id}
          >
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
