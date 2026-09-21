import type { ComponentType, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateAction {
  label: string
  onClick?: () => void
  icon?: ComponentType<{ className?: string }>
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: EmptyStateAction | ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={[
        'flex flex-col items-center justify-center text-center',
        'rounded-2xl border border-dashed transition-colors',
        'border-border-subtle bg-surface/30',
        compact ? 'min-h-[140px] p-4' : 'min-h-[240px] p-8 sm:p-10',
        className,
      ].join(' ')}
    >
      {Icon && (
        <div
          className={[
            'flex items-center justify-center rounded-2xl',
            'border border-border-subtle bg-surface-overlay/60',
            'text-text-tertiary shadow-inner',
            compact ? 'h-10 w-10 mb-3' : 'h-14 w-14 mb-4',
          ].join(' ')}
        >
          <Icon
            className={compact ? 'h-5 w-5 opacity-70' : 'h-7 w-7 opacity-75 text-brand/70'}
          />
        </div>
      )}

      <h3
        className={[
          'font-semibold tracking-tight text-text-primary',
          compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base',
        ].join(' ')}
      >
        {title}
      </h3>

      {description && (
        <p
          className={[
            'text-text-secondary max-w-xs leading-relaxed',
            compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs sm:text-[0.8125rem]',
          ].join(' ')}
        >
          {description}
        </p>
      )}

      {action && (
        <div className={compact ? 'mt-3' : 'mt-5'}>
          {typeof action === 'object' && action !== null && 'label' in action ? (
            <Button
              size="sm"
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              className="gap-1.5 text-xs font-semibold"
            >
              {action.icon && <action.icon className="h-3.5 w-3.5" />}
              <span>{action.label}</span>
            </Button>
          ) : (
            (action as ReactNode)
          )}
        </div>
      )}
    </div>
  )
}
