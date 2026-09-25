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
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8', className)}>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.025em] text-text-primary sm:text-[2rem]">
          {title}
        </h1>
        {description ? <div className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</div> : null}
      </div>
      {actions ? <div className="max-sm:day-loc-deu-co-gian shrink-0 items-center gap-2 sm:flex">{actions}</div> : null}
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
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-baseline gap-2 text-[0.9375rem] leading-6 font-semibold tracking-[-0.01em] text-text-primary">
          <span>{title}</span>
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
