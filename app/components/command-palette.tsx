"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText, Search, SquareKanban, StickyNote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { useMemoriesStore } from "@/app/stores/memories";
import { useTasksStore } from "@/app/stores/tasks";
import { useDocumentsStore } from "@/app/stores/documents";

type SearchResult = {
  id: string;
  type: "memory" | "task" | "document";
  title: string;
  subtitle: string;
  href: string;
  date: string;
};

export function CommandPalette(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const memories = useMemoriesStore((state) => state.memories);
  const tasks = useTasksStore((state) => state.tasks);
  const documents = useDocumentsStore((state) => state.documents);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase();

    const source: SearchResult[] = [
      ...memories.map((memory) => ({
        id: memory.id,
        type: "memory" as const,
        title: memory.title,
        subtitle: memory.content,
        href: `/memories/${memory.id}`,
        date: memory.updatedAt,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        subtitle: task.description,
        href: "/tasks",
        date: task.createdAt,
      })),
      ...documents.map((document) => ({
        id: document.id,
        type: "document" as const,
        title: document.name,
        subtitle: document.path,
        href: `/documents/${document.id}`,
        date: document.updatedAt,
      })),
    ];

    const filtered = normalized
      ? source.filter((item) => {
          return (
            item.title.toLowerCase().includes(normalized) ||
            item.subtitle.toLowerCase().includes(normalized) ||
            item.type.includes(normalized)
          );
        })
      : source;

    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);
  }, [documents, memories, query, tasks]);

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
        onClick={() => setOpen(true)}
      >
        Press Cmd/Ctrl + K
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Everything</DialogTitle>
            <DialogDescription>Search across memories, tasks, and documents.</DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Find notes, tasks, docs..." />
            </div>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {results.map((result) => {
                const icon =
                  result.type === "memory" ? (
                    <StickyNote className="h-4 w-4" />
                  ) : result.type === "task" ? (
                    <SquareKanban className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  );

                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3 hover:bg-zinc-900"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 text-zinc-400">{icon}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">{result.title}</p>
                        <p className="truncate text-xs text-zinc-400">{result.subtitle}</p>
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <Badge>{result.type}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                        <CalendarDays className="h-3 w-3" />
                        {formatDistanceToNow(new Date(result.date), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {results.length === 0 ? <p className="text-sm text-zinc-500">No matches found.</p> : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
