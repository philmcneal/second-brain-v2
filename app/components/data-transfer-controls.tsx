"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import type { Document, Memory, Task } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";
import { useDocumentsStore } from "@/app/stores/documents";
import { useMemoriesStore } from "@/app/stores/memories";
import { useTasksStore } from "@/app/stores/tasks";

type ImportPayload = {
  version?: number;
  exportedAt?: string;
  data?: {
    memories?: Partial<Memory>[];
    tasks?: Partial<Task>[];
    documents?: Partial<Document>[];
  };
};

interface DataTransferControlsProps {
  collapsed: boolean;
}

export function DataTransferControls({ collapsed }: DataTransferControlsProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const memories = useMemoriesStore((state) => state.memories);
  const replaceMemories = useMemoriesStore((state) => state.replaceMemories);

  const tasks = useTasksStore((state) => state.tasks);
  const replaceTasks = useTasksStore((state) => state.replaceTasks);

  const documents = useDocumentsStore((state) => state.documents);
  const replaceDocuments = useDocumentsStore((state) => state.replaceDocuments);

  const onExport = (): void => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        memories,
        tasks,
        documents,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateToken = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `second-brain-export-${dateToken}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setStatusMessage("Exported data to JSON.");
  };

  const onImport = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ImportPayload;
        const data = parsed.data;
        if (!data || typeof data !== "object") {
          throw new Error("Invalid payload shape");
        }

        replaceMemories(Array.isArray(data.memories) ? data.memories : []);
        replaceTasks(Array.isArray(data.tasks) ? data.tasks : []);
        replaceDocuments(Array.isArray(data.documents) ? data.documents : []);
        setStatusMessage("Imported JSON data successfully.");
      } catch {
        setStatusMessage("Import failed: invalid JSON format.");
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  return (
    <div className="mt-4 space-y-2 border-t border-[var(--glass-border)] pt-3">
      <Button
        type="button"
        variant="outline"
        size={collapsed ? "icon" : "sm"}
        aria-label="Export JSON"
        title="Export JSON"
        onClick={onExport}
        className={cn("w-full justify-start gap-2", collapsed ? "w-10 justify-center" : "")}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className={cn(collapsed && "hidden")}>Export JSON</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size={collapsed ? "icon" : "sm"}
        aria-label="Import JSON"
        title="Import JSON"
        onClick={() => fileInputRef.current?.click()}
        className={cn("w-full justify-start gap-2", collapsed ? "w-10 justify-center" : "")}
      >
        <Upload className="h-4 w-4 shrink-0" />
        <span className={cn(collapsed && "hidden")}>Import JSON</span>
      </Button>

      <input ref={fileInputRef} type="file" accept="application/json" onChange={onImport} className="hidden" aria-label="Import JSON file" />

      {statusMessage ? <p className={cn("text-xs text-zinc-400", collapsed && "hidden")}>{statusMessage}</p> : null}
    </div>
  );
}
