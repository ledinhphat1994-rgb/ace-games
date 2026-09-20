import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CampusChatDrawer } from '@/features/hub/CampusChatDrawer'
import type { KetQuaThaoTac } from '@/hooks/use-campus'
import type { TinCampus } from '@shared/protocol/campus'

interface CampusChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: TinCampus[]
  myPermissions: { accountId: number; xoaMoiTin: boolean } | null
  onSendMessage: (text: string) => Promise<KetQuaThaoTac>
  onDeleteMessage: (id: number) => Promise<KetQuaThaoTac>
}

export function CampusChatSheet({
  open,
  onOpenChange,
  messages,
  myPermissions,
  onSendMessage,
  onDeleteMessage,
}: CampusChatSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-[#0a0f18]/98 border-border/80 text-foreground backdrop-blur-2xl shadow-2xl"
      >
        <SheetHeader className="p-4 pb-2 border-b border-border/60">
          <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Trò chuyện toàn trường</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              ({messages.length} tin)
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0">
          <CampusChatDrawer
            messages={messages}
            myPermissions={myPermissions}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
            className="h-full border-0 rounded-none bg-transparent shadow-none"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
