"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Task } from "@/app/lib/types";

interface AddTaskInput {
  title: string;
  description: string;
  priority: Task["priority"];
  dueDate?: string;
  tags: string[];
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  dueDate?: string;
  tags?: string[];
}

interface TasksStore {
  tasks: Task[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  replaceTasks: (tasks: Partial<Task>[]) => void;
  addTask: (input: AddTaskInput) => void;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
}

const seedNow = new Date().toISOString();

const seedTasks: Task[] = [
  {
    id: "t-1",
    title: "Plan weekly review",
    description: "Block 30 minutes and summarize key learnings.",
    status: "todo",
    priority: "medium",
    tags: ["planning"],
    createdAt: seedNow,
  },
];

function normalizeTask(task: Partial<Task>): Task {
  const now = new Date().toISOString();
  const statusValues: Task["status"][] = ["todo", "in-progress", "done"];
  const priorityValues: Task["priority"][] = ["low", "medium", "high"];

  return {
    id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
    title: typeof task.title === "string" ? task.title : "Untitled Task",
    description: typeof task.description === "string" ? task.description : "",
    status: statusValues.includes(task.status as Task["status"]) ? (task.status as Task["status"]) : "todo",
    priority: priorityValues.includes(task.priority as Task["priority"]) ? (task.priority as Task["priority"]) : "low",
    dueDate: normalizeDate(task.dueDate),
    tags: Array.isArray(task.tags) ? task.tags.filter((tag): tag is string => typeof tag === "string") : [],
    createdAt: normalizeDate(task.createdAt, now) ?? now,
  };
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      replaceTasks: (tasks) => {
        set({
          tasks: Array.isArray(tasks) ? tasks.map((task) => normalizeTask(task)) : [],
        });
      },
      addTask: (input) => {
        set((state) => ({
          tasks: [
            {
              id: crypto.randomUUID(),
              title: input.title,
              description: input.description,
              status: "todo",
              priority: input.priority,
              dueDate: normalizeDate(input.dueDate),
              tags: input.tags,
              createdAt: new Date().toISOString(),
            },
            ...state.tasks,
          ],
        }));
      },
      updateTask: (id, input) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...input,
                  dueDate: input.dueDate === undefined ? task.dueDate : normalizeDate(input.dueDate),
                }
              : task,
          ),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
      },
    }),
    {
      name: "second-brain-tasks",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState) => {
        const state = persistedState as Partial<TasksStore>;
        return {
          ...state,
          tasks: Array.isArray(state.tasks) ? state.tasks.map((task) => normalizeTask(task)) : seedTasks,
          hasHydrated: false,
        };
      },
    },
  ),
);
