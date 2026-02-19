"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Brain, FileText, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  preview?: string;
}

interface MemoryActivityFeedProps {
  /** Open a file in the workspace viewer. Defaults to opening in a new tab. */
  onOpenFile?: (path: string) => void;
  /** Polling interval in milliseconds. Defaults to 5000 (5 s). */
  pollInterval?: number;
  className?: string;
}

const POLL_INTERVAL_MS = 5_000;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Live-updating memory activity feed.
 *
 * Polls `/api/mission-control/memory-activity` every `pollInterval` ms and
 * displays the 10 most-recently modified `.md` files from the memory directory.
 * The interval is cleaned up automatically when the component unmounts, so
 * there are no memory leaks when navigating away.
 */
export function MemoryActivityFeed({
  onOpenFile,
  pollInterval = POLL_INTERVAL_MS,
  className,
}: MemoryActivityFeedProps) {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/mission-control/memory-activity");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to load memory files");
      }
      const data = (await res.json()) as { files: MemoryFile[] };
      setFiles(data.files ?? []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch + polling with cleanup
  useEffect(() => {
    fetchFiles();

    intervalRef.current = setInterval(fetchFiles, pollInterval);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchFiles, pollInterval]);

  const handleOpenFile = (filePath: string) => {
    if (onOpenFile) {
      onOpenFile(filePath);
    } else {
      const relativePath = filePath.replace("/home/toilet/clawd/", "");
      window.open(`/documents/workspace/${encodeURIComponent(relativePath)}`, "_blank");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-zinc-200">Memory Activity</span>
          <Badge
            variant="default"
            className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            title="Updates every 5 seconds"
          >
            LIVE
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[11px] text-zinc-600" aria-live="polite">
              {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={fetchFiles}
            disabled={isLoading}
            aria-label="Refresh memory files"
            title="Refresh now"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading && files.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" aria-label="Loading memory files" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-300" role="alert">
          {error}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Brain className="h-8 w-8 text-zinc-600" aria-hidden="true" />
          <p className="text-sm text-zinc-500">No memory files found</p>
          <p className="text-xs text-zinc-600">
            Files written to{" "}
            <code className="text-zinc-500">~/clawd/memory/</code> will appear here
          </p>
        </div>
      ) : (
        <ol className="space-y-1.5" aria-label="Recent memory files">
          {files.map((file, idx) => (
            <li key={file.path}>
              <button
                onClick={() => handleOpenFile(file.path)}
                aria-label={`Open ${file.name}`}
                title={`Open ${file.name} — last modified ${new Date(file.modifiedAt).toLocaleString()}`}
                className={cn(
                  "w-full text-left rounded-lg border border-[var(--glass-border)] bg-[var(--glass)]",
                  "px-3 py-2 backdrop-blur-sm transition-all",
                  "hover:border-white/15 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 text-[10px] font-mono text-zinc-600 w-4 text-right"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <FileText className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" aria-hidden="true" />
                  <span className="truncate text-sm text-zinc-100 font-medium flex-1">{file.name}</span>
                  <span className="text-[10px] text-zinc-600 shrink-0">{formatFileSize(file.size)}</span>
                  <time
                    dateTime={file.modifiedAt}
                    className="text-[11px] text-zinc-500 shrink-0 ml-1"
                  >
                    {formatDistanceToNow(new Date(file.modifiedAt), { addSuffix: true })}
                  </time>
                </div>
                {file.preview && (
                  <p className="text-xs text-zinc-500 truncate mt-1 pl-6">{file.preview}</p>
                )}
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* Footer help text */}
      {files.length > 0 && (
        <p className="text-[11px] text-zinc-600 text-center pt-1">
          Showing {files.length} most recent · auto-refreshes every {pollInterval / 1000}s · click to open
        </p>
      )}
    </div>
  );
}
