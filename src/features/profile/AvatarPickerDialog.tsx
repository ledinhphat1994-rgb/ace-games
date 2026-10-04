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
      <DialogContent className="skeuo-modal-surface max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <BlueprintCommunityPattern className="opacity-75 pointer-events-none" />
        <DialogHeader>
          <DialogTitle>Ảnh đại diện</DialogTitle>
        </DialogHeader>
        <AvatarPicker
          currentAvatarUrl={currentAvatarUrl}
          onSaveAvatar={onSaveAvatar}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
