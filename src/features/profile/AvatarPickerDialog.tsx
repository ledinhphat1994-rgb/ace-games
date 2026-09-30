import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
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
