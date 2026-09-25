import {
  Sheet,
  SheetContent,
  SheetDescription,
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
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b border-border-subtle px-4 pt-4 pb-3 pr-12">
          <SheetTitle className="text-base font-semibold text-text-primary">Trò chuyện toàn trường</SheetTitle>
          <SheetDescription className="text-[0.8125rem] text-text-tertiary">
            Thầy cô và mọi bạn trong trường đều thấy tin nhắn ở đây.
          </SheetDescription>
        </SheetHeader>

        <CampusChatDrawer
          messages={messages}
          myPermissions={myPermissions}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          hideHeader
          className="min-h-0 flex-1"
        />
      </SheetContent>
    </Sheet>
  )
}
