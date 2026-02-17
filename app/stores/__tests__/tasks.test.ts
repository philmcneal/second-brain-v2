import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Task } from "@/app/lib/types";
import { useTasksStore } from "@/app/stores/tasks";

describe("useTasksStore", () => {
  let tasks: Task[] = [];
  let revision = 0;
  let nextId = 1;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T11:00:00.000Z"));
    useTasksStore.setState(useTasksStore.getInitialState(), true);

    tasks = [];
    revision = 0;
    nextId = 1;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        const body = init?.body ? JSON.parse(String(init.body)) : null;

        if (method === "GET") {
          return {
            ok: true,
            json: async () => ({ tasks, revision: String(revision) }),
          } as Response;
        }

        if (method === "POST") {
          const createdAt = new Date().toISOString();
          const task: Task = {
            id: body?.id ?? `task-${nextId++}`,
            title: body?.title ?? "Untitled Task",
            description: body?.description ?? "",
            status: body?.status ?? "todo",
            priority: body?.priority ?? "medium",
            assignee: body?.assignee ?? "user",
            source: body?.source ?? "manual",
            dueDate: normalizeDate(body?.dueDate) ?? undefined,
            tags: Array.isArray(body?.tags) ? body.tags : [],
            createdAt,
          };
          tasks = [task, ...tasks];
          revision += 1;
          return { ok: true, json: async () => ({ ok: true, id: task.id }) } as Response;
        }

        if (method === "PATCH") {
          tasks = tasks.map((task) =>
            task.id === body?.id
              ? {
                  ...task,
                  title: body?.title ?? task.title,
                  description: body?.description ?? task.description,
                  status: body?.status ?? task.status,
                  priority: body?.priority ?? task.priority,
                  assignee: body?.assignee ?? task.assignee,
                  source: body?.source ?? task.source,
                  dueDate: body?.dueDate === undefined ? task.dueDate : normalizeDate(body?.dueDate) ?? undefined,
                  tags: Array.isArray(body?.tags) ? body.tags : task.tags,
                }
              : task,
          );
          revision += 1;
          return { ok: true, json: async () => ({ ok: true }) } as Response;
        }

        if (method === "DELETE") {
          tasks = tasks.filter((task) => task.id !== body?.id);
          revision += 1;
          return { ok: true, json: async () => ({ ok: true }) } as Response;
        }

        if (method === "PUT") {
          tasks = Array.isArray(body?.tasks) ? body.tasks : [];
          revision += 1;
          return { ok: true, json: async () => ({ ok: true }) } as Response;
        }

        return { ok: false, json: async () => ({ error: "Unsupported method" }) } as Response;
      }),
    );
  });

  it("adds, updates, and deletes tasks", async () => {
    await useTasksStore.getState().addTask({
      title: "Ship tests",
      description: "Write coverage",
      priority: "high",
      dueDate: "2026-02-20",
      tags: ["dev"],
    });

    let task = useTasksStore.getState().tasks.find((item) => item.title === "Ship tests");
    expect(task).toBeDefined();
    expect(task?.status).toBe("todo");
    expect(task?.priority).toBe("high");

    await useTasksStore.getState().updateTask(task!.id, { status: "in-progress", dueDate: "2026-02-22" });

    task = useTasksStore.getState().tasks.find((item) => item.title === "Ship tests");
    expect(task?.status).toBe("in-progress");
    expect(task?.dueDate).toBe("2026-02-22T00:00:00.000Z");

    await useTasksStore.getState().deleteTask(task!.id);
    expect(useTasksStore.getState().tasks.some((item) => item.id === task!.id)).toBe(false);
  });

  it("replaces tasks from imported payload", async () => {
    await useTasksStore.getState().replaceTasks([{ id: "t-import", title: "Imported Task", description: "", priority: "low", status: "done", tags: [] }]);

    expect(useTasksStore.getState().tasks).toHaveLength(1);
    expect(useTasksStore.getState().tasks[0]?.status).toBe("done");
  });

  describe("assignee and source fields", () => {
    it("assigns default assignee: 'user' and source: 'manual' when creating tasks", async () => {
      await useTasksStore.getState().addTask({
        title: "Default Task",
        description: "Test defaults",
        priority: "medium",
      });

      const task = useTasksStore.getState().tasks.find((item) => item.title === "Default Task");
      expect(task).toBeDefined();
      expect(task?.assignee).toBe("user");
      expect(task?.source).toBe("manual");
    });

    it("allows creating tasks with assignee: 'ai' and source: 'ai-generated'", async () => {
      await useTasksStore.getState().addTask({
        title: "AI Generated Task",
        description: "Created by AI",
        priority: "high",
        assignee: "ai",
        source: "ai-generated",
      });

      const task = useTasksStore.getState().tasks.find((item) => item.title === "AI Generated Task");
      expect(task).toBeDefined();
      expect(task?.assignee).toBe("ai");
      expect(task?.source).toBe("ai-generated");
    });

    it("can update assignee from 'user' to 'ai'", async () => {
      await useTasksStore.getState().addTask({
        title: "Reassignable Task",
        description: "Will be reassigned",
        priority: "low",
        assignee: "user",
      });

      let task = useTasksStore.getState().tasks.find((item) => item.title === "Reassignable Task");
      expect(task?.assignee).toBe("user");

      await useTasksStore.getState().updateTask(task!.id, { assignee: "ai" });

      task = useTasksStore.getState().tasks.find((item) => item.id === task!.id);
      expect(task?.assignee).toBe("ai");
    });

    it("normalizes tasks with missing assignee/source fields for backward compatibility", async () => {
      // Simulate loading old tasks without assignee/source
      const oldTask: Omit<Task, "assignee" | "source"> = {
        id: "old-task",
        title: "Old Task",
        description: "From before assignee existed",
        status: "todo",
        priority: "medium",
        tags: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        // assignee and source are missing
      };

      await useTasksStore.getState().replaceTasks([oldTask as Partial<Task>]);

      const task = useTasksStore.getState().tasks[0];
      expect(task.assignee).toBeNull();
      expect(task.source).toBe("manual");
    });

    it("preserves existing assignee and source when normalizing", async () => {
      const taskWithAssignee = {
        id: "task-with-assignee",
        title: "Task with assignee",
        description: "Has assignee",
        status: "in-progress",
        priority: "high",
        assignee: "ai",
        source: "ai-generated",
        tags: ["test"],
        createdAt: "2026-01-15T00:00:00.000Z",
      };

      await useTasksStore.getState().replaceTasks([taskWithAssignee]);

      const task = useTasksStore.getState().tasks[0];
      expect(task.assignee).toBe("ai");
      expect(task.source).toBe("ai-generated");
    });
  });
});
