"use client";

import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, Loader2 } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Select } from "@/app/components/ui/select";
import { FormField } from "@/app/components/ui/form-field";
import { cn } from "@/app/lib/utils";
import { useTasksStore } from "@/app/stores/tasks";
import { toast } from "@/app/stores/toasts";
import { confirm } from "@/app/stores/confirm";
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
  onDelete: () => Promise<void>;
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
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const statusLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
      toast.success("Task moved", `Moved to ${statusLabels[directColumnTarget]}`);
      return;
    }

    if (overId.startsWith("task-")) {
      const targetTask = tasks.find((task) => task.id === overId.replace("task-", ""));
      if (targetTask && targetTask.status !== currentTask.status) {
        updateTask(draggedTaskId, { status: targetTask.status });
        const statusLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
        toast.success("Task moved", `Moved to ${statusLabels[targetTask.status]}`);
      }
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    // Validation
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = "Task title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Task title must be at least 3 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      toast.success("Task created", "Your task has been added to the board");

      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setTags("");
      setErrors({});
    } catch {
      toast.error("Failed to create task", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-zinc-400">Kanban workflow for focused execution.</p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
          <CardDescription>Capture the task and move it through the board.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField
              label="Task Title"
              htmlFor="task-title"
              required
              error={errors.title}
              className="md:col-span-2"
            >
              <Input
                id="task-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                placeholder="What needs to be done?"
              />
            </FormField>

            <FormField label="Due Date" htmlFor="task-due-date">
              <Input
                id="task-due-date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
              />
            </FormField>

            <FormField label="Priority" htmlFor="task-priority">
              <Select
                id="task-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Task["priority"])}
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </Select>
            </FormField>

            <FormField
              label="Description"
              htmlFor="task-description"
              helperText="Optional details about the task"
              className="md:col-span-2"
            >
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add more details..."
                className="min-h-20"
              />
            </FormField>

            <FormField
              label="Tags"
              htmlFor="task-tags"
              helperText="Comma separated (e.g., urgent, work, personal)"
              className="md:col-span-2"
            >
              <Input
                id="task-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="work, urgent"
              />
            </FormField>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Task"
                )}
              </Button>
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
                      onBack={() => {
                        updateTask(task.id, { status: previousStatus(task.status) });
                        const statusLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
                        toast.success("Task moved", `Moved back to ${statusLabels[previousStatus(task.status)]}`);
                      }}
                      onNext={() => {
                        updateTask(task.id, { status: nextStatus(task.status) });
                        const statusLabels = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
                        toast.success("Task moved", `Moved to ${statusLabels[nextStatus(task.status)]}`);
                      }}
                      onDelete={async () => {
                        const confirmed = await confirm({
                          title: "Delete Task",
                          description: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
                          variant: "destructive",
                          confirmLabel: "Delete",
                        });

                        if (confirmed) {
                          deleteTask(task.id);
                          toast.success("Task deleted", "The task has been removed");
                        }
                      }}
                    />
                  ))}
                  {grouped[column.status].length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-zinc-500">
                        {column.status === "todo" && "No pending tasks"}
                        {column.status === "in-progress" && "No active tasks"}
                        {column.status === "done" && "No completed tasks"}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {column.status === "todo" && "Create a task to get started"}
                        {column.status === "in-progress" && "Move tasks here to start working"}
                        {column.status === "done" && "Mark tasks as done when complete"}
                      </p>
                    </div>
                  ) : null}
                </DroppableColumn>
              </SortableContext>
            </Card>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
