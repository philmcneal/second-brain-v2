"use client";

import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";
import { useTasksStore } from "@/app/stores/tasks";
import type { Task } from "@/app/lib/types";

const columns: Array<{ status: Task["status"]; label: string }> = [
  { status: "todo", label: "To Do" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

function priorityVariant(priority: Task["priority"]): "default" | "warning" | "danger" {
  if (priority === "medium") return "warning";
  if (priority === "high") return "danger";
  return "default";
}

function nextStatus(status: Task["status"]): Task["status"] {
  if (status === "todo") return "in-progress";
  if (status === "in-progress") return "done";
  return "done";
}

function previousStatus(status: Task["status"]): Task["status"] {
  if (status === "done") return "in-progress";
  if (status === "in-progress") return "todo";
  return "todo";
}

function columnId(status: Task["status"]): string {
  return `column-${status}`;
}

function taskId(id: string): string {
  return `task-${id}`;
}

function parseStatus(id: string): Task["status"] | null {
  if (id === columnId("todo")) return "todo";
  if (id === columnId("in-progress")) return "in-progress";
  if (id === columnId("done")) return "done";
  return null;
}

function DroppableColumn({
  status,
  children,
}: {
  status: Task["status"];
  children: React.ReactNode;
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId(status),
    data: { type: "column", status },
  });

  return (
    <CardContent
      ref={setNodeRef}
      className={cn(
        "min-h-24 space-y-3 rounded-xl transition-colors",
        isOver ? "bg-white/5 outline outline-1 outline-[var(--accent-blue)]/40" : "",
      )}
    >
      {children}
    </CardContent>
  );
}

function TaskCard({
  task,
  onBack,
  onNext,
  onDelete,
}: {
  task: Task;
  onBack: () => void;
  onNext: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: taskId(task.id),
    data: { type: "task", taskId: task.id, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] p-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/10 hover:shadow-[0_10px_28px_rgba(0,0,0,0.32)]",
        isDragging ? "opacity-60 shadow-[0_12px_24px_rgba(0,0,0,0.35)]" : "",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{task.title}</p>
        <div className="flex items-center gap-1">
          <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Drag ${task.title}`}
            className="cursor-grab rounded-md border border-transparent p-1 text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-zinc-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      {task.description ? <p className="mt-2 text-xs text-zinc-300">{task.description}</p> : null}
      {task.dueDate ? <p className="mt-2 text-xs text-zinc-500">Due {format(new Date(task.dueDate), "PPP")}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1">
        {task.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {task.status !== "todo" ? (
          <Button size="sm" variant="ghost" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {task.status !== "done" ? (
          <Button size="sm" variant="secondary" onClick={onNext}>
            Next
          </Button>
        ) : null}
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function TasksPage(): React.JSX.Element {
  const tasks = useTasksStore((state) => state.tasks);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTask = useTasksStore((state) => state.updateTask);
  const deleteTask = useTasksStore((state) => state.deleteTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo"),
      "in-progress": tasks.filter((task) => task.status === "in-progress"),
      done: tasks.filter((task) => task.status === "done"),
    };
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (activeId: string, overId: string | null): void => {
    if (!overId || !activeId.startsWith("task-")) return;

    const draggedTaskId = activeId.replace("task-", "");
    const currentTask = tasks.find((task) => task.id === draggedTaskId);
    if (!currentTask) return;

    const directColumnTarget = parseStatus(overId);
    if (directColumnTarget && currentTask.status !== directColumnTarget) {
      updateTask(draggedTaskId, { status: directColumnTarget });
      return;
    }

    if (overId.startsWith("task-")) {
      const targetTask = tasks.find((task) => task.id === overId.replace("task-", ""));
      if (targetTask && targetTask.status !== currentTask.status) {
        updateTask(draggedTaskId, { status: targetTask.status });
      }
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    addTask({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setTags("");
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-zinc-400">Kanban workflow for focused execution.</p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
          <CardDescription>Capture the task and move it through the board.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
            <Input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" />
            <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 py-2 text-sm text-zinc-100 backdrop-blur-md placeholder:text-zinc-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/60 focus-visible:border-[var(--accent-purple)]/50 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.14),0_0_24px_rgba(139,92,246,0.16)] md:col-span-2"
              placeholder="Task details"
            />
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as Task["priority"])}
              className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 text-sm text-zinc-100 backdrop-blur-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/60 focus-visible:border-[var(--accent-purple)]/50"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <div className="md:col-span-2">
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => onDragEnd(String(active.id), over ? String(over.id) : null)}
      >
        <div className="stagger-children grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <Card key={column.status} className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>{column.label}</CardTitle>
                <CardDescription>{grouped[column.status].length} task(s)</CardDescription>
              </CardHeader>
              <SortableContext items={grouped[column.status].map((task) => taskId(task.id))} strategy={verticalListSortingStrategy}>
                <DroppableColumn status={column.status}>
                  {grouped[column.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onBack={() => updateTask(task.id, { status: previousStatus(task.status) })}
                      onNext={() => updateTask(task.id, { status: nextStatus(task.status) })}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                  {grouped[column.status].length === 0 ? <p className="text-xs text-zinc-500">No tasks yet</p> : null}
                </DroppableColumn>
              </SortableContext>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
