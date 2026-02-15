import { AlertCircle } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  helperText?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
  className?: string
}

export function FormField({
  label,
  error,
  helperText,
  required,
  children,
  htmlFor,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-zinc-200"
      >
        {label}
        {required && <span className="text-[var(--error)] ml-1">*</span>}
      </label>

      {children}

      {error && (
        <div className="flex items-start gap-2 text-sm text-[var(--error)]" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-sm text-zinc-400">{helperText}</p>
      )}
    </div>
  )
}
