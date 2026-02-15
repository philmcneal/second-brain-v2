import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-2.5 py-0.5 text-xs font-medium text-zinc-200 backdrop-blur-md transition-colors",
  {
  variants: {
    variant: {
      default: "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
      success: "border-emerald-400/30 bg-emerald-500/12 text-emerald-200",
      warning: "border-amber-400/30 bg-amber-500/12 text-amber-200",
      danger: "border-rose-400/30 bg-rose-500/12 text-rose-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
