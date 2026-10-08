import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BlueprintCommunityPattern } from '@/components/ui/blueprint-patterns'
import { AvatarPicker } from './AvatarPicker'

export interface AvatarPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAvatarUrl?: string
  onSaveAvatar: (url: string) => Promise<void>
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  onSaveAvatar,
}: AvatarPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="skeuo-modal-surface sm:max-w-2xl w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden p-5 sm:p-6 text-text-primary">
        <BlueprintCommunityPattern className="opacity-75 pointer-events-none" />
        <DialogHeader className="shrink-0 mb-1">
          <DialogTitle className="text-base sm:text-lg font-bold text-text-primary">Ảnh đại diện</DialogTitle>
        </DialogHeader>
        <AvatarPicker
          currentAvatarUrl={currentAvatarUrl}
          onSaveAvatar={onSaveAvatar}
          onSuccess={() => onOpenChange(false)}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
