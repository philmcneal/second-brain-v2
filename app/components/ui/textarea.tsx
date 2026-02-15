import * as React from "react"

import { cn } from "@/app/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[80px] w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-zinc-100 backdrop-blur-md placeholder:text-zinc-500 transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:border-[var(--accent-purple)]/50 focus-visible:shadow-[var(--focus-ring)] resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
