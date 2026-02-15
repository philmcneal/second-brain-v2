import * as React from "react"

import { cn } from "@/app/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "h-10 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-zinc-100 backdrop-blur-md transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:border-[var(--accent-purple)]/50 focus-visible:shadow-[var(--focus-ring)] cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Select.displayName = "Select"

export { Select }
