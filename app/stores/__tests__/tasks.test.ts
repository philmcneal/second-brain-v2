import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTasksStore } from "@/app/stores/tasks";

describe("useTasksStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T11:00:00.000Z"));
    useTasksStore.setState(useTasksStore.getInitialState(), true);
  });

  it("adds, updates, and deletes tasks", () => {
    const uuidSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("task-test-id");

    useTasksStore.getState().addTask({
      title: "Ship tests",
      description: "Write coverage",
      priority: "high",
      dueDate: "2026-02-20",
      tags: ["dev"],
    });

    let task = useTasksStore.getState().tasks.find((item) => item.id === "task-test-id");
    expect(task).toBeDefined();
    expect(task?.status).toBe("todo");
    expect(task?.priority).toBe("high");

    useTasksStore.getState().updateTask("task-test-id", { status: "in-progress", dueDate: "2026-02-22" });

    task = useTasksStore.getState().tasks.find((item) => item.id === "task-test-id");
    expect(task?.status).toBe("in-progress");
    expect(task?.dueDate).toBe("2026-02-22T00:00:00.000Z");

    useTasksStore.getState().deleteTask("task-test-id");
    expect(useTasksStore.getState().tasks.some((item) => item.id === "task-test-id")).toBe(false);

    uuidSpy.mockRestore();
  });
});
