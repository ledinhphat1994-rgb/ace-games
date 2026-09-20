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
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/80 bg-card/30 backdrop-blur-xs transition-colors ${
        compact ? 'min-h-[140px] p-4' : 'min-h-[220px] p-6 sm:p-8'
      } ${className}`}
    >
      {Icon && (
        <div
          className={`flex items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-muted-foreground shadow-inner ${
            compact ? 'h-10 w-10 mb-2.5' : 'h-12 w-12 mb-3.5'
          }`}
        >
          <Icon className={compact ? 'h-5 w-5 opacity-80' : 'h-6 w-6 opacity-85 text-primary/80'} />
        </div>
      )}

      <h3
        className={`font-bold tracking-tight text-foreground ${
          compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
        }`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`text-muted-foreground max-w-sm leading-relaxed ${
            compact ? 'mt-1 text-[11px]' : 'mt-1.5 text-xs'
          }`}
        >
          {description}
        </p>
      )}

      {action && (
        <div className={compact ? 'mt-3' : 'mt-4'}>
          {typeof action === 'object' && action !== null && 'label' in action ? (
            <Button
              size="sm"
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              className="h-8 gap-1.5 text-xs font-semibold border-border/80 hover:bg-white/5"
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
