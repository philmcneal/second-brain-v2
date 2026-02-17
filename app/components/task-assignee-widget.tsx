"use client";

import { Bot, Check, RefreshCw, User } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useTasksStore } from "@/app/stores/tasks";
import { toast } from "@/app/stores/toasts";
import type { Task } from "@/app/lib/types";

function priorityVariant(priority: Task["priority"]): "default" | "warning" | "danger" {
  if (priority === "medium") return "warning";
  if (priority === "high") return "danger";
  return "default";
}

function statusVariant(status: Task["status"]): "default" | "success" | "warning" {
  if (status === "in-progress") return "warning";
  if (status === "done") return "success";
  return "default";
}

function TaskItem({
  task,
  onDone,
  onReassign,
}: {
  task: Task;
  onDone: () => void;
  onReassign: () => void;
}): React.JSX.Element {
  const otherLabel = task.assignee === "ai" ? "Vap3" : "Chief";

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/10">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{task.title}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={onDone} title="Mark done">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onReassign} title={`Reassign to ${otherLabel}`}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function TaskAssigneeWidget(): React.JSX.Element {
  const tasks = useTasksStore((state) => state.tasks);
  const updateTask = useTasksStore((state) => state.updateTask);

  const aiTasks = tasks.filter((t) => t.assignee === "ai" && t.status === "in-progress");
  const userTasks = tasks.filter((t) => t.assignee === "user" && t.status === "todo");

  const handleDone = async (task: Task): Promise<void> => {
    try {
      await updateTask(task.id, { status: "done" });
      toast.success("Task completed", `"${task.title}" marked as done`);
    } catch {
      toast.error("Task update failed", "Unable to mark task as done");
    }
  };

  const handleReassign = async (task: Task): Promise<void> => {
    const newAssignee = task.assignee === "ai" ? "user" : "ai";
    try {
      await updateTask(task.id, { assignee: newAssignee });
      toast.success("Task reassigned", `"${task.title}" reassigned to ${newAssignee === "ai" ? "Chief" : "Vap3"}`);
    } catch {
      toast.error("Task update failed", "Unable to reassign task");
    }
  };

  return (
    <div className="stagger-children grid gap-4 md:grid-cols-2">
      <Card className="animate-fade-in-up relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_70%)]" />
        <CardHeader className="relative">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" /> What Chief (AI) is working on
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {aiTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No active AI tasks right now.</p>
          ) : (
            aiTasks.map((task) => (
              <TaskItem key={task.id} task={task} onDone={() => handleDone(task)} onReassign={() => handleReassign(task)} />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_70%)]" />
        <CardHeader className="relative">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> What Vap3 (User) needs to work on
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {userTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No pending tasks for you.</p>
          ) : (
            userTasks.map((task) => (
              <TaskItem key={task.id} task={task} onDone={() => handleDone(task)} onReassign={() => handleReassign(task)} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
