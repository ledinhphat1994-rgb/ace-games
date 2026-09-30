import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Khung tiêu đề dùng chung cho các trang chính (Học tập, Game, Cộng đồng) để ba trang có cùng nhịp
// chữ, cùng lề trái thẳng với logo trên thanh đầu trang, và không nhảy bố cục khi chuyển tab.

interface PageHeaderProps {
  title: string
  /** Một dòng dưới tiêu đề: mô tả ngắn hoặc trạng thái trực tiếp. */
  description?: ReactNode
  /** Hành động chính của trang — trên điện thoại tự chia đều hết chiều ngang. */
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6', className)}>
      <div className="min-w-0">
        <h1 className="tieu-de-cap-1 text-[1.75rem] leading-[1.2] font-bold tracking-[-0.03em] sm:text-[2.25rem]">
          {title}
        </h1>
        {description ? <div className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</div> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 [&>button]:min-h-11 max-md:[&>button]:flex-1">{actions}</div> : null}
    </header>
  )
}

interface SectionHeaderProps {
  title: string
  /** Số lượng thật đi kèm tiêu đề; bỏ trống khi dữ liệu chưa sẵn sàng. */
  count?: number
  description?: ReactNode
  action?: ReactNode
  className?: string
  id?: string
}

export function SectionHeader({ title, count, description, action, className, id }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-3 gap-y-2', className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-baseline gap-2 text-[1.0625rem] leading-6 font-bold tracking-[-0.01em]">
          <span className="tieu-de-cap-2 min-w-0 break-words">{title}</span>
          {typeof count === 'number' ? <span className="text-sm font-medium tabular-nums text-text-tertiary">{count}</span> : null}
        </h2>
        {description ? <p className="mt-0.5 text-[0.8125rem] text-text-tertiary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** Chấm trạng thái nhỏ cạnh dòng mô tả trực tiếp. */
export function LiveDot({ tone }: { tone: 'success' | 'warning' | 'muted' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        tone === 'success' && 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_20%,transparent)]',
        tone === 'warning' && 'animate-pulse bg-warning',
        tone === 'muted' && 'bg-text-tertiary',
      )}
    />
  )
}
