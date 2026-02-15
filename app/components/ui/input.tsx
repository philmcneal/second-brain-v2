import * as React from "react";

import { cn } from "@/app/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-zinc-100 backdrop-blur-md placeholder:text-zinc-500 transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:border-[var(--accent-purple)]/50 focus-visible:shadow-[var(--focus-ring)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
