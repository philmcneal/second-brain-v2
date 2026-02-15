"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, FileText, Home, Plus, SquareKanban } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/app/components/ui/button";
import { DataTransferControls } from "@/app/components/data-transfer-controls";
import { cn } from "@/app/lib/utils";

const routes = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/memories", label: "Memories", icon: BookOpen },
  { href: "/memories/new", label: "New Memory", icon: Plus },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: SquareKanban },
] as const;

export function Sidebar(): React.JSX.Element {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside
      className={cn(
        "relative h-screen glass-card border-r border-[var(--glass-border)] p-3 transition-all duration-[var(--duration-medium)] animate-slide-in-left",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className={cn("text-sm font-semibold tracking-wide text-zinc-100", collapsed && "sr-only")}>2nd Brain</span>
        <Button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href));

          return (
            <Link
              key={route.href}
              href={route.href}
              aria-label={route.label}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-[var(--duration-normal)]",
                active
                  ? "border-white/15 bg-[linear-gradient(145deg,rgba(139,92,246,0.22),rgba(59,130,246,0.16))] text-zinc-50 shadow-[var(--shadow-lg)]"
                  : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/10 hover:text-zinc-100",
              )}
              title={route.label}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-zinc-50" : "text-zinc-400 group-hover:text-zinc-100")} />
              <span className={cn(collapsed && "hidden")}>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <DataTransferControls collapsed={collapsed} />
    </aside>
  );
}
