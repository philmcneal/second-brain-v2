"use client";

import { HardDrive, AlertCircle, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import type { ConfigFile } from "@/app/lib/types";

interface ConfigFileListProps {
  files: ConfigFile[];
  onSelect: (file: ConfigFile) => void;
  loading?: boolean;
}

const fileIcons: Record<string, string> = {
  "SOUL.md": "🧠",
  "TOOLS.md": "🛠️",
  "MEMORY.md": "📚",
  "AGENTS.md": "🤖",
  "USER.md": "👤",
  "HEARTBEAT.md": "💓",
};

const fileDescriptions: Record<string, string> = {
  "SOUL.md": "Personality and behavior config",
  "TOOLS.md": "Tool preferences and notes",
  "MEMORY.md": "Curated long-term memory",
  "AGENTS.md": "Workspace rules and patterns",
  "USER.md": "User preferences and context",
  "HEARTBEAT.md": "Periodic check configuration",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConfigFileList({ files, onSelect, loading }: ConfigFileListProps): React.JSX.Element {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-white/5 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <button
          key={file.name}
          onClick={() => onSelect(file)}
          className={cn(
            "text-left transition-all hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black"
          )}
        >
          <Card className="glass-card-hover group relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{fileIcons[file.name] || "📝"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-100 truncate">{file.name}</span>
                    {file.exists ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    {fileDescriptions[file.name] || "Configuration file"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(file.size)}
                    </span>
                    {file.lastModified && (
                      <span>
                        {formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!file.exists && (
                <Badge variant="danger" className="absolute top-2 right-2 text-[10px]">
                  Missing
                </Badge>
              )}
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}
