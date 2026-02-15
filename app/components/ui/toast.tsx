'use client'

import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/app/stores/toasts'
import { cn } from '@/app/lib/utils'

const variantStyles: Record<ToastVariant, { icon: React.ElementType; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'border-[var(--success)]/30 bg-[var(--success-bg)]'
  },
  error: {
    icon: AlertCircle,
    className: 'border-[var(--error)]/30 bg-[var(--error-bg)]'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-[var(--warning)]/30 bg-[var(--warning-bg)]'
  },
  info: {
    icon: Info,
    className: 'border-[var(--info)]/30 bg-[var(--info-bg)]'
  }
}

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-[var(--success)]',
  error: 'text-[var(--error)]',
  warning: 'text-[var(--warning)]',
  info: 'text-[var(--info)]'
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => {
        const { icon: Icon, className } = variantStyles[toast.variant]
        const iconColor = variantIconColors[toast.variant]

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto min-w-[320px] max-w-md rounded-lg border p-4 backdrop-blur-xl shadow-[var(--shadow-lg)] animate-slide-in-right',
              className
            )}
            style={{
              animationDelay: `${index * 60}ms`
            }}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm text-zinc-400">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-zinc-400 hover:text-zinc-100 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
