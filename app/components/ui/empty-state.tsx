import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/app/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 rounded-xl',
        className
      )}
    >
      <div className="relative mb-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-blue)]/20 blur-xl rounded-full" />

        {/* Icon */}
        <div className="relative glass-card rounded-2xl p-6">
          <Icon className="h-12 w-12 text-zinc-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">{description}</p>

      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}
