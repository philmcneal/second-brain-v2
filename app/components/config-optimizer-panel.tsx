"use client";

import { RefreshCw, AlertCircle, Lightbulb, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import type { ConfigSuggestion } from "@/app/lib/types";

interface ConfigOptimizerPanelProps {
  suggestions: ConfigSuggestion[];
  loading?: boolean;
  onRefresh: () => void;
}

const fileIcons: Record<string, string> = {
  "SOUL.md": "🧠",
  "TOOLS.md": "🛠️",
  "MEMORY.md": "📚",
  "AGENTS.md": "🤖",
  "USER.md": "👤",
  "HEARTBEAT.md": "💓",
};

function getPriorityIcon(priority: ConfigSuggestion["priority"]) {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-rose-400" />;
    case "medium":
      return <Lightbulb className="h-4 w-4 text-amber-400" />;
    case "low":
      return <Info className="h-4 w-4 text-blue-400" />;
  }
}

function getPriorityBadgeVariant(priority: ConfigSuggestion["priority"]): "danger" | "warning" | "default" {
  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "default";
  }
}

export function ConfigOptimizerPanel({ 
  suggestions, 
  loading, 
  onRefresh 
}: ConfigOptimizerPanelProps): React.JSX.Element {
  const highCount = suggestions.filter((s) => s.priority === "high").length;
  const mediumCount = suggestions.filter((s) => s.priority === "medium").length;
  const lowCount = suggestions.filter((s) => s.priority === "low").length;

  return (
    <Card className="glass-card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Optimization Suggestions</CardTitle>
            {suggestions.length > 0 && (
              <div className="flex items-center gap-1">
                {highCount > 0 && (
                  <Badge variant="danger" className="text-xs">{highCount} high</Badge>
                )}
                {mediumCount > 0 && (
                  <Badge variant="warning" className="text-xs">{mediumCount} med</Badge>
                )}
                {lowCount > 0 && (
                  <Badge variant="default" className="text-xs">{lowCount} low</Badge>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">✨ All config files look good!</p>
            <p className="text-xs mt-1">No optimization suggestions at this time.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex gap-3 p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-sm"
              >
                <div className="shrink-0 mt-0.5">
                  {getPriorityIcon(suggestion.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{fileIcons[suggestion.file] || "📝"}</span>
                    <span className="text-xs font-medium text-zinc-300">{suggestion.file}</span>
                    <Badge 
                      variant={getPriorityBadgeVariant(suggestion.priority)} 
                      className="text-[10px] ml-auto"
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-medium text-zinc-100 mb-1">{suggestion.title}</h4>
                  <p className="text-xs text-zinc-400">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
