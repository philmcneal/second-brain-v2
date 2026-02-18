"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, HardDrive, Pencil, X, Check, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import type { ConfigFile } from "@/app/lib/types";

interface ConfigViewerModalProps {
  file: ConfigFile | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FileContent {
  content: string;
  lastModified: string;
  size: number;
}

type SaveState = "idle" | "saving" | "success" | "error";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConfigViewerModal({ file, open, onClose, onSaved }: ConfigViewerModalProps): React.JSX.Element {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  // Track effective existence locally so a successful create transitions the modal state
  const [fileExists, setFileExists] = useState(file?.exists ?? false);

  useEffect(() => {
    const exists = file?.exists ?? false;
    setFileExists(exists);
    if (open && exists) {
      fetchFileContent();
    } else if (open && file && !exists) {
      // File is missing — open editor with empty content
      setFileContent(null);
      setError(null);
      setEditing(true);
      setEditText("");
      setSaveState("idle");
      setSaveError(null);
    } else {
      setFileContent(null);
      setError(null);
      setEditing(false);
      setEditText("");
      setSaveState("idle");
      setSaveError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.name]);

  const fetchFileContent = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/config-files/${encodeURIComponent(file.name)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch file content");
      }
      const data = await response.json();
      setFileContent({
        content: data.content,
        lastModified: data.lastModified,
        size: data.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditText(fileContent?.content ?? "");
    setSaveState("idle");
    setSaveError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSaveState("idle");
    setSaveError(null);
    // If file was missing, closing edit cancels the create flow
    if (!fileExists) {
      setEditText("");
    }
  };

  const handleSave = async () => {
    if (!file) return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch(`/api/config-files/${encodeURIComponent(file.name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to save file");
      }

      const saved = await response.json();
      setFileContent({
        content: editText,
        lastModified: saved.lastModified,
        size: saved.size,
      });
      setFileExists(true);
      setSaveState("success");
      setEditing(false);
      onSaved?.();

      // Reset success badge after 2 s
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setSaveState("error");
    }
  };

  const isNewFile = file && !fileExists;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-400" />
              <DialogTitle className="text-lg font-semibold">
                {file?.name || "Config File"}
              </DialogTitle>
              {isNewFile ? (
                <Badge variant="danger" className="text-xs">Missing</Badge>
              ) : (
                <Badge variant="default" className="text-xs">Exists</Badge>
              )}
              {saveState === "success" && (
                <Badge variant="default" className="text-xs bg-green-600/80 border-green-500/40">
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>

            {/* Edit / Cancel controls */}
            {!editing && fileExists && !loading && !error && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                aria-label="Edit file"
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {editing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saveState === "saving"}
                  aria-label="Cancel editing"
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                  aria-label="Save file"
                  className="gap-1.5"
                >
                  {saveState === "saving" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {saveState === "saving" ? "Saving…" : isNewFile ? "Create" : "Save"}
                </Button>
              </div>
            )}
          </div>

          {fileContent && !editing && (
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5" />
                {formatFileSize(fileContent.size)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Modified {formatDistanceToNow(new Date(fileContent.lastModified), { addSuffix: true })}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {editing ? (
            <div className="flex flex-col gap-2 h-full">
              {isNewFile && (
                <p className="text-xs text-zinc-500">
                  This file does not exist yet. Enter content below and click <strong>Create</strong> to create it at{" "}
                  <code className="text-purple-300">{file?.path}</code>.
                </p>
              )}
              <textarea
                className="flex-1 w-full min-h-[320px] rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/60 placeholder-zinc-600"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={isNewFile ? `# ${file?.name ?? "Config"}\n\nStart writing…` : ""}
                spellCheck={false}
                aria-label={`Edit ${file?.name ?? "config file"}`}
              />
              {saveState === "error" && saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFileContent}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : fileContent ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>
                {fileContent.content}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
