import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GameScreenHeaderProps {
  title: string
  subtitle?: ReactNode
  onBack: () => void
  backLabel: string
  actions?: ReactNode
}

// Thanh đầu trang dùng chung cho màn hình chơi (bàn 1v1 và trò chơi đơn): nút quay lại, tên trò,
// dòng phụ trạng thái và cụm hành động bên phải. Chữ dài tự xuống dòng, không cắt.
export function GameScreenHeader({ title, subtitle, onBack, backLabel, actions }: GameScreenHeaderProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-border-subtle">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label={backLabel} className="shrink-0">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[0.9375rem] leading-5 font-semibold tracking-[-0.01em] break-words text-text-primary">
            {title}
          </h1>
          {subtitle ? <div className="mt-0.5 text-xs text-text-tertiary">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
