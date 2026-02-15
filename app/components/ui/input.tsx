import * as React from "react";

import { cn } from "@/app/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-zinc-100 backdrop-blur-md placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/60 focus-visible:border-[var(--accent-purple)]/50 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.14),0_0_24px_rgba(139,92,246,0.16)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
