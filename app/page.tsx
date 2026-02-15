"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity, BookOpen, FileText, SquareKanban, Folder, File, RefreshCw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useMemoriesStore } from "@/app/stores/memories";
import { useDocumentsStore } from "@/app/stores/documents";
import { useTasksStore } from "@/app/stores/tasks";
import { useFilesystemStore, startFilesystemPolling, stopFilesystemPolling } from "@/app/stores/filesystem";

type ActivityItem = {
  id: string;
  type: "memory" | "document" | "task";
  title: string;
  date: string;
  href: string;
};

export default function DashboardPage(): React.JSX.Element {
  const memories = useMemoriesStore((state) => state.memories);
  const documents = useDocumentsStore((state) => state.documents);
  const tasks = useTasksStore((state) => state.tasks);
  
  const { files, isLoading, lastRefresh, refreshFiles } = useFilesystemStore();

  const items: ActivityItem[] = [
    ...memories.map((memory) => ({ id: memory.id, type: "memory" as const, title: memory.title, date: memory.updatedAt, href: `/memories/${memory.id}` })),
    ...documents.map((document) => ({ id: document.id, type: "document" as const, title: document.name, date: document.updatedAt, href: `/documents/${document.id}` })),
    ...tasks.map((task) => ({ id: task.id, type: "task" as const, title: task.title, date: task.createdAt, href: "/tasks" })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const doneTasks = tasks.filter((task) => task.status === "done").length;

  // Start filesystem polling on mount
  useEffect(() => {
    startFilesystemPolling();
    return () => stopFilesystemPolling();
  }, []);

  const mdFiles = files.filter((f) => !f.isDirectory && f.name.endsWith(".md")).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400">Overview of memories, documents, and task progress.</p>
      </div>

      <div className="stagger-children grid gap-4 md:grid-cols-3">
        <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_70%)]" />
          <CardHeader className="relative">
            <CardDescription className="inline-flex items-center gap-2 text-zinc-300">
              <BookOpen className="h-4 w-4" /> Memories
            </CardDescription>
            <CardTitle className="text-3xl">{memories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_70%)]" />
          <CardHeader className="relative">
            <CardDescription className="inline-flex items-center gap-2 text-zinc-300">
              <FileText className="h-4 w-4" /> Documents
            </CardDescription>
            <CardTitle className="text-3xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_70%)]" />
          <CardHeader className="relative">
            <CardDescription className="inline-flex items-center gap-2 text-zinc-300">
              <SquareKanban className="h-4 w-4" /> Tasks Completed
            </CardDescription>
            <CardTitle className="text-3xl">
              {doneTasks}/{tasks.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-100">{item.title}</p>
                <p className="text-xs text-zinc-400">{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</p>
              </div>
              <Badge>{item.type}</Badge>
            </Link>
          ))}
          {items.length === 0 ? <p className="text-sm text-zinc-500">No activity yet.</p> : null}
        </CardContent>
      </Card>

      {/* Live Filesystem View */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="inline-flex items-center gap-2">
              <Folder className="h-4 w-4" /> OpenClaw Workspace
              {isLoading && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-xs text-zinc-500">
                  Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={refreshFiles} disabled={isLoading}>
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <CardDescription>Live view of markdown files from /home/toilet/clawd (auto-refreshes every 5s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {mdFiles.length === 0 ? (
              <p className="text-sm text-zinc-500">No markdown files found.</p>
            ) : (
              mdFiles.map((file) => (
                <Link
                  key={file.path}
                  href={`/documents/workspace/${encodeURIComponent(file.path)}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/10"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <File className="h-4 w-4 text-zinc-500 shrink-0" />
                    <div>
                      <p className="truncate text-sm text-zinc-100">{file.name}</p>
                      <p className="text-xs text-zinc-500">{file.path}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {formatDistanceToNow(new Date(file.modifiedAt), { addSuffix: true })}
                  </span>
                </Link>
              ))
            )}
          </div>
          {mdFiles.length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Showing {mdFiles.length} of {files.filter(f => !f.isDirectory && f.name.endsWith(".md")).length} markdown files
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
