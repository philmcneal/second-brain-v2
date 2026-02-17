"use client";

import { create } from "zustand";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Task } from "@/app/lib/types";

interface AddTaskInput {
  title: string;
  description: string;
  priority: Task["priority"];
  assignee?: Task["assignee"];
  source?: Task["source"];
  dueDate?: string;
  tags: string[];
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assignee?: Task["assignee"];
  source?: Task["source"];
  dueDate?: string;
  tags?: string[];
}

interface TasksStore {
  tasks: Task[];
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  lastRevision: string | null;
  setHasHydrated: (value: boolean) => void;
  refreshTasks: () => Promise<void>;
  replaceTasks: (tasks: Partial<Task>[]) => Promise<void>;
  addTask: (input: AddTaskInput) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const TASKS_ENDPOINT = "/api/tasks";
const POLL_INTERVAL = 5000;

async function requestTasks(): Promise<{ tasks: Task[]; revision: string }> {
  const response = await fetch(TASKS_ENDPOINT);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

async function sendTaskRequest(method: string, body: unknown): Promise<void> {
  const response = await fetch(TASKS_ENDPOINT, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = typeof data?.error === "string" ? data.error : "Task update failed";
    throw new Error(message);
  }
}

export const useTasksStore = create<TasksStore>()((set, get) => ({
  tasks: [],
  hasHydrated: false,
  isLoading: false,
  error: null,
  lastRevision: null,
  setHasHydrated: (value) => set({ hasHydrated: value }),
  refreshTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { tasks, revision } = await requestTasks();
      if (revision !== get().lastRevision) {
        set({ tasks, lastRevision: revision });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },
  replaceTasks: async (tasks) => {
    const normalized = Array.isArray(tasks)
      ? tasks.map((task) => ({
          id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
          title: typeof task.title === "string" ? task.title : "Untitled Task",
          description: typeof task.description === "string" ? task.description : "",
          status: (task.status ?? "todo") as Task["status"],
          priority: (task.priority ?? "low") as Task["priority"],
          assignee: (task.assignee ?? null) as Task["assignee"],
          source: (task.source ?? "manual") as Task["source"],
          dueDate: normalizeDate(task.dueDate) ?? undefined,
          tags: Array.isArray(task.tags) ? task.tags : [],
          createdAt: normalizeDate(task.createdAt, new Date().toISOString()) ?? new Date().toISOString(),
        }))
      : [];

    await sendTaskRequest("PUT", { tasks: normalized });
    await get().refreshTasks();
  },
  addTask: async (input) => {
    await sendTaskRequest("POST", {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assignee: input.assignee ?? "user",
      source: input.source ?? "manual",
      dueDate: input.dueDate,
      tags: input.tags,
    });
    await get().refreshTasks();
  },
  updateTask: async (id, input) => {
    await sendTaskRequest("PATCH", {
      id,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      assignee: input.assignee,
      source: input.source,
      dueDate: input.dueDate,
      tags: input.tags,
    });
    await get().refreshTasks();
  },
  deleteTask: async (id) => {
    await sendTaskRequest("DELETE", { id });
    await get().refreshTasks();
  },
}));

let pollInterval: NodeJS.Timeout | null = null;

export function startTasksPolling() {
  if (pollInterval) return;
  const store = useTasksStore.getState();
  void store.refreshTasks();
  pollInterval = setInterval(() => {
    void useTasksStore.getState().refreshTasks();
  }, POLL_INTERVAL);
}

export function stopTasksPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
