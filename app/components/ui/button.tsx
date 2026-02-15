import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-all duration-[var(--duration-normal)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "border-white/10 text-white shadow-[var(--shadow-elevation-default)] bg-[linear-gradient(135deg,var(--accent-purple),var(--accent-blue))] hover:brightness-110 hover:shadow-[var(--shadow-elevation-hover)]",
        secondary:
          "border-[var(--glass-border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] text-zinc-100 shadow-[var(--shadow-md)] hover:border-white/20 hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))]",
        outline:
          "border-[var(--glass-border)] bg-[var(--glass)] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] hover:border-white/20 hover:bg-white/10",
        ghost: "border-transparent bg-transparent text-zinc-300 hover:bg-white/10 hover:text-zinc-100",
        destructive:
          "border-[var(--error)]/30 text-white shadow-[var(--shadow-elevation-destructive)] bg-[linear-gradient(135deg,rgba(248,113,113,0.9),rgba(220,38,38,0.95))] hover:brightness-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
