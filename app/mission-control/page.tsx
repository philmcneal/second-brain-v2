"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bot, CheckCircle2, Circle, Clock, ExternalLink, Inbox, Loader2, RefreshCw, Tag, User, AlertCircle, Pause, Settings } from "lucide-react";

import type { SlashCommandEntry } from "@/app/lib/types";

import { ConfigFileList } from "@/app/components/config-file-list";
import { ConfigViewerModal } from "@/app/components/config-viewer-modal";
import { ConfigOptimizerPanel } from "@/app/components/config-optimizer-panel";
import { MemoryActivityFeed } from "@/app/components/memory-activity-feed";
import type { ConfigFile, ConfigSuggestion } from "@/app/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface TodoSection {
  title: string;
  emoji: string;
  items: Array<{
    text: string;
    completed: boolean;
  }>;
}

interface Commitment {
  title: string;
  status: "pending" | "in-progress" | "blocked" | "done";
  eta?: string;
  lastUpdate?: string;
  description?: string;
}

function SlashCommandBadge({ command }: { command: SlashCommandEntry["command"] }): React.JSX.Element {
  const map: Record<SlashCommandEntry["command"], { variant: "success" | "danger" | "warning"; label: string }> = {
    feature: { variant: "success", label: "/feature" },
    bug: { variant: "danger", label: "/bug" },
    marketing: { variant: "warning", label: "/marketing" },
  };
  const { variant, label } = map[command];
  return <Badge variant={variant} className="shrink-0 mt-0.5">{label}</Badge>;
}

export default function MissionControlPage(): React.JSX.Element {
  const [todoSections, setTodoSections] = useState<TodoSection[]>([]);
  const [activeCommitments, setActiveCommitments] = useState<Commitment[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Slash Command Inbox state
  const [slashCommands, setSlashCommands] = useState<SlashCommandEntry[]>([]);
  const [isSlashLoading, setIsSlashLoading] = useState(true);

  // OpenClaw Config Optimizer state
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [configSuggestions, setConfigSuggestions] = useState<ConfigSuggestion[]>([]);
  const [selectedConfigFile, setSelectedConfigFile] = useState<ConfigFile | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [todoRes, commitmentsRes] = await Promise.all([
        fetch("/api/mission-control/todo"),
        fetch("/api/mission-control/commitments"),
      ]);

      if (!todoRes.ok || !commitmentsRes.ok) {
        throw new Error("Failed to fetch mission control data");
      }

      const todoData = await todoRes.json();
      const commitmentsData = await commitmentsRes.json();

      setTodoSections(todoData.sections || []);
      setActiveCommitments(commitmentsData.active || []);
      setRecentlyCompleted(commitmentsData.recentlyCompleted || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfigData = async () => {
    setIsConfigLoading(true);
    try {
      const [filesRes, analysisRes] = await Promise.all([
        fetch("/api/config-files"),
        fetch("/api/config-analysis"),
      ]);

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setConfigFiles(filesData.files || []);
      }

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setConfigSuggestions(analysisData.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to fetch config data:", err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchSlashCommands = async () => {
    setIsSlashLoading(true);
    try {
      const res = await fetch("/api/mission-control/slash-commands");
      if (res.ok) {
        const data = await res.json();
        setSlashCommands(data.commands ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch slash commands:", err);
    } finally {
      setIsSlashLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfigData();
    fetchSlashCommands();
  }, []);

  const getStatusIcon = (status: Commitment["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: Commitment["status"]) => {
    const variants = {
      done: "default",
      "in-progress": "warning",
      blocked: "danger",
      pending: "default",
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const openFile = (filePath: string) => {
    const relativePath = filePath.replace("/home/toilet/clawd/", "");
    window.open(`/documents/workspace/${encodeURIComponent(relativePath)}`, "_blank");
  };

  const handleConfigFileSelect = (file: ConfigFile) => {
    setSelectedConfigFile(file);
    setIsConfigModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Mission Control Center</h1>
          <p className="text-sm text-zinc-400">Unified dashboard for Vap3 and Chief&apos;s active work.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-zinc-500">
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="secondary"
              className="h-auto flex-col items-start p-4"
              onClick={() => window.open("/memories/new", "_self")}
            >
              <span className="text-sm font-semibold">New Memory</span>
              <span className="text-xs text-zinc-400 mt-1">Capture a new thought</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto flex-col items-start p-4"
              onClick={() => window.open("/tasks", "_self")}
            >
              <span className="text-sm font-semibold">Task Board</span>
              <span className="text-xs text-zinc-400 mt-1">View Kanban board</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto flex-col items-start p-4"
              onClick={() => openFile("/home/toilet/clawd/TODO.md")}
            >
              <span className="text-sm font-semibold">Edit TODO.md</span>
              <span className="text-xs text-zinc-400 mt-1">Update Vap3&apos;s tasks</span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto flex-col items-start p-4"
              onClick={() => openFile("/home/toilet/clawd/COMMITMENTS.md")}
            >
              <span className="text-sm font-semibold">Edit COMMITMENTS.md</span>
              <span className="text-xs text-zinc-400 mt-1">Update Chief&apos;s tasks</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="py-4">
            <p className="text-sm text-red-200">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* Left Column - Vap3's Tasks */}
        <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden h-fit">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_70%)]" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-400" />
                <CardTitle>Vap3&apos;s Tasks</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openFile("/home/toilet/clawd/TODO.md")}
                title="Open TODO.md"
                aria-label="Open TODO.md"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>From TODO.md</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : todoSections.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No tasks found in TODO.md</p>
            ) : (
              todoSections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <span>{section.emoji}</span>
                    <span>{section.title}</span>
                    <Badge variant="default" className="ml-auto">
                      {section.items.filter(i => !i.completed).length}/{section.items.length}
                    </Badge>
                  </h3>
                  <div className="space-y-1 pl-4">
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className={cn(
                          "flex items-start gap-2 text-sm rounded px-2 py-1 transition-colors hover:bg-white/5",
                          item.completed && "text-zinc-500 line-through"
                        )}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 mt-0.5 text-zinc-400 shrink-0" />
                        )}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column - Chief's Tasks */}
        <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden h-fit">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_70%)]" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-400" />
                <CardTitle>Chief&apos;s Tasks</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openFile("/home/toilet/clawd/COMMITMENTS.md")}
                title="Open COMMITMENTS.md"
                aria-label="Open COMMITMENTS.md"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>From COMMITMENTS.md</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : (
              <>
                {activeCommitments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Active</h3>
                    {activeCommitments.map((commitment, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] p-3 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(commitment.status)}
                            <p className="text-sm font-medium text-zinc-100">{commitment.title}</p>
                          </div>
                          {getStatusBadge(commitment.status)}
                        </div>
                        {commitment.description && (
                          <p className="text-xs text-zinc-400 mt-2">{commitment.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                          {commitment.eta && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ETA: {commitment.eta}
                            </span>
                          )}
                          {commitment.lastUpdate && (
                            <span>Updated: {commitment.lastUpdate}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {recentlyCompleted.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-200">Recently Completed (Last 7 Days)</h3>
                    {recentlyCompleted.map((commitment, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] p-3 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/10 opacity-75"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <p className="text-sm font-medium text-zinc-100">{commitment.title}</p>
                          </div>
                          {commitment.lastUpdate && (
                            <span className="text-xs text-zinc-500">{commitment.lastUpdate}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeCommitments.length === 0 && recentlyCompleted.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No commitments found</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memory Activity Feed — always visible, live-polling */}
      <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_70%)]" />
        <CardHeader className="relative">
          <CardTitle>Memory Activity Feed</CardTitle>
          <CardDescription>
            Your second brain remembers what you forgot. Recent notes from{" "}
            <code className="text-zinc-400">~/clawd/memory/</code> — live-updated every 5 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[420px] overflow-y-auto">
          <MemoryActivityFeed onOpenFile={openFile} />
        </CardContent>
      </Card>

      {/* Slash Command Inbox */}
      <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_70%)]" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-indigo-400" />
              <CardTitle>Slash Command Inbox</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchSlashCommands} disabled={isSlashLoading} aria-label="Refresh slash commands">
              <RefreshCw className={cn("h-3 w-3", isSlashLoading && "animate-spin")} />
            </Button>
          </div>
          <CardDescription>
            Directives found in <code className="text-zinc-400">TODO.md</code> — use{" "}
            <code className="text-zinc-400">/feature</code>,{" "}
            <code className="text-zinc-400">/bug</code>, or{" "}
            <code className="text-zinc-400">/marketing</code> (bare or{" "}
            <code className="text-zinc-400">[bracketed]</code>) to queue ideas.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[360px] overflow-y-auto">
          {isSlashLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : slashCommands.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Inbox className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400 font-medium">No slash commands detected</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Add <code className="text-zinc-400">/feature</code>, <code className="text-zinc-400">/bug</code>, or{" "}
                <code className="text-zinc-400">/marketing</code> directives to{" "}
                <code className="text-zinc-400">TODO.md</code> to surface them here as a prioritized queue.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {slashCommands.map((entry, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2.5 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/10"
                >
                  <SlashCommandBadge command={entry.command} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-100 break-words">{entry.text}</p>
                    {entry.section && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                        <Tag className="h-3 w-3 shrink-0" />
                        {entry.section}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* OpenClaw Config Optimizer Section */}
      <Card className="animate-fade-in-up glass-card-hover relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_70%)]" />
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            <CardTitle>OpenClaw Config Optimizer</CardTitle>
          </div>
          <CardDescription>
            Manage and optimize SOUL.md, TOOLS.md, MEMORY.md, and other vital configuration files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">Configuration Files</h3>
              <ConfigFileList
                files={configFiles}
                onSelect={handleConfigFileSelect}
                loading={isConfigLoading}
              />
            </div>
            <div>
              <ConfigOptimizerPanel
                suggestions={configSuggestions}
                loading={isConfigLoading}
                onRefresh={fetchConfigData}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config File Viewer Modal */}
      <ConfigViewerModal
        file={selectedConfigFile}
        open={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={fetchConfigData}
      />

    </div>
  );
}
