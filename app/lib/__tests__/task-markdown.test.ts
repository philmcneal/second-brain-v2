import { describe, expect, it } from "vitest";

import {
  buildCommitmentBlock,
  buildTaskMeta,
  buildTodoLine,
  extractTaskMeta,
  normalizeTaskInput,
  parseCommitmentsMarkdown,
  parseTodoMarkdown,
  stripTaskMeta,
} from "@/app/lib/task-markdown";
import type { Task } from "@/app/lib/types";

const FALLBACK = "2026-02-18T00:00:00.000Z";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "test-id-001",
    title: "Test task",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "user",
    source: "manual",
    tags: [],
    createdAt: FALLBACK,
    ...overrides,
  };
}

// ── extractTaskMeta / stripTaskMeta ──────────────────────────────────────────

describe("extractTaskMeta", () => {
  it("returns null meta when no comment present", () => {
    const result = extractTaskMeta("Fix the login bug");
    expect(result.text).toBe("Fix the login bug");
    expect(result.meta).toBeNull();
  });

  it("extracts embedded meta JSON", () => {
    const raw = `Do the thing <!-- sb:task {"id":"abc","createdAt":"${FALLBACK}"} -->`;
    const result = extractTaskMeta(raw);
    expect(result.text).toBe("Do the thing");
    expect(result.meta?.id).toBe("abc");
    expect(result.meta?.createdAt).toBe(FALLBACK);
  });

  it("returns null meta when JSON is malformed", () => {
    const raw = "Fix <!-- sb:task {bad json} -->";
    const result = extractTaskMeta(raw);
    expect(result.meta).toBeNull();
  });
});

describe("stripTaskMeta", () => {
  it("removes embedded meta comment", () => {
    const raw = `Title <!-- sb:task {"id":"x"} -->`;
    expect(stripTaskMeta(raw)).toBe("Title");
  });

  it("is a no-op when there is no meta", () => {
    expect(stripTaskMeta("Just a title")).toBe("Just a title");
  });
});

// ── buildTaskMeta ─────────────────────────────────────────────────────────────

describe("buildTaskMeta", () => {
  it("produces a roundtrippable comment", () => {
    const task = makeTask({ id: "tid-1", dueDate: "2026-03-01T00:00:00.000Z", tags: ["dev"] });
    const comment = buildTaskMeta(task);
    expect(comment).toContain("sb:task");
    const extracted = extractTaskMeta(`title ${comment}`);
    expect(extracted.meta?.id).toBe("tid-1");
    expect(extracted.meta?.dueDate).toBe("2026-03-01T00:00:00.000Z");
    expect(extracted.meta?.tags).toEqual(["dev"]);
  });

  it("omits optional fields when absent", () => {
    const task = makeTask({ tags: [] });
    const comment = buildTaskMeta(task);
    expect(comment).not.toContain('"dueDate"');
    expect(comment).not.toContain('"tags"');
  });
});

// ── parseTodoMarkdown ─────────────────────────────────────────────────────────

describe("parseTodoMarkdown", () => {
  const TODO_MD = `# Master TODO

## 🔴 High Priority

- [ ] Ship the feature <!-- sb:task {"id":"t-high-1","createdAt":"${FALLBACK}"} -->
- [x] Write tests <!-- sb:task {"id":"t-high-2","createdAt":"${FALLBACK}"} -->

## 🟡 Medium Priority

- [ ] Review PR <!-- sb:task {"id":"t-med-1","createdAt":"${FALLBACK}"} -->

## 🟢 Low Priority / Maintenance

- [ ] Update deps
`;

  it("parses tasks from all priority sections", () => {
    const { tasks } = parseTodoMarkdown(TODO_MD, FALLBACK);
    expect(tasks).toHaveLength(4);
  });

  it("assigns correct priority from section emoji", () => {
    const { tasks } = parseTodoMarkdown(TODO_MD, FALLBACK);
    const high = tasks.filter((t) => t.task.priority === "high");
    const medium = tasks.filter((t) => t.task.priority === "medium");
    const low = tasks.filter((t) => t.task.priority === "low");
    expect(high).toHaveLength(2);
    expect(medium).toHaveLength(1);
    expect(low).toHaveLength(1);
  });

  it("marks done tasks correctly", () => {
    const { tasks } = parseTodoMarkdown(TODO_MD, FALLBACK);
    const done = tasks.find((t) => t.task.id === "t-high-2");
    expect(done?.task.status).toBe("done");
  });

  it("restores id from embedded meta", () => {
    const { tasks } = parseTodoMarkdown(TODO_MD, FALLBACK);
    const ids = tasks.map((t) => t.task.id);
    expect(ids).toContain("t-high-1");
    expect(ids).toContain("t-med-1");
  });

  it("falls back to a stable generated id when meta is absent", () => {
    const { tasks } = parseTodoMarkdown(TODO_MD, FALLBACK);
    const noMeta = tasks.find((t) => t.task.title === "Update deps");
    expect(noMeta?.task.id).toMatch(/^sb-/);
  });

  it("returns sections with correct emoji keys", () => {
    const { sections } = parseTodoMarkdown(TODO_MD, FALLBACK);
    const emojis = sections.map((s) => s.emoji);
    expect(emojis).toContain("🔴");
    expect(emojis).toContain("🟡");
    expect(emojis).toContain("🟢");
  });

  it("handles empty content gracefully", () => {
    const { tasks, sections } = parseTodoMarkdown("", FALLBACK);
    expect(tasks).toHaveLength(0);
    expect(sections).toHaveLength(0);
  });
});

// ── buildTodoLine ─────────────────────────────────────────────────────────────

describe("buildTodoLine", () => {
  it("produces an unchecked line for todo status", () => {
    const task = makeTask({ title: "Do something" });
    const line = buildTodoLine(task);
    expect(line).toMatch(/^- \[ \] Do something/);
  });

  it("produces a checked line for done status", () => {
    const task = makeTask({ title: "Done thing", status: "done" });
    const line = buildTodoLine(task);
    expect(line).toMatch(/^- \[x\] Done thing/);
  });

  it("preserves indent", () => {
    const task = makeTask({ title: "Indented" });
    const line = buildTodoLine(task, "  ");
    expect(line).toMatch(/^  - \[ \] Indented/);
  });

  it("embeds meta in the line", () => {
    const task = makeTask({ id: "meta-task" });
    const line = buildTodoLine(task);
    expect(line).toContain("sb:task");
    expect(line).toContain('"id":"meta-task"');
  });
});

// ── parseCommitmentsMarkdown ──────────────────────────────────────────────────

const COMMITMENTS_MD = `# COMMITMENTS.md

## Active Commitments

<!-- Add new commitments below this line -->

### 2026-02-18 10:30 Deploy backend <!-- sb:task {"id":"c-001","createdAt":"${FALLBACK}"} -->
- **Status:** in-progress
- **ETA:** 2026-02-20
- **Last update:** 2026-02-18 09:00
- **Notes:** Running migration first

### 2026-02-17 08:00 Write docs <!-- sb:task {"id":"c-002","createdAt":"${FALLBACK}"} -->
- **Status:** pending
- **Last update:** 2026-02-17 10:00

## Recently Completed (last 7 days)

<!-- Move completed items here -->
`;

describe("parseCommitmentsMarkdown", () => {
  it("does NOT include section headers (## Active Commitments, etc.) as tasks", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const titles = tasks.map((t) => t.task.title);
    expect(titles).not.toContain("Active Commitments");
    expect(titles).not.toContain("Recently Completed (last 7 days)");
  });

  it("parses the correct number of commitment tasks", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    expect(tasks).toHaveLength(2);
  });

  it("restores task id from meta", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const ids = tasks.map((t) => t.task.id);
    expect(ids).toContain("c-001");
    expect(ids).toContain("c-002");
  });

  it("maps in-progress status correctly", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const task = tasks.find((t) => t.task.id === "c-001");
    expect(task?.task.status).toBe("in-progress");
  });

  it("maps pending status to todo", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const task = tasks.find((t) => t.task.id === "c-002");
    expect(task?.task.status).toBe("todo");
  });

  it("parses ETA into dueDate", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const task = tasks.find((t) => t.task.id === "c-001");
    expect(task?.task.dueDate).toBeTruthy();
  });

  it("extracts notes into description (no stray ** prefix)", () => {
    const { tasks } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    const task = tasks.find((t) => t.task.id === "c-001");
    expect(task?.task.description).toContain("Running migration first");
    expect(task?.task.description).not.toMatch(/^\*\*/);
  });

  it("handles empty content gracefully", () => {
    const { tasks } = parseCommitmentsMarkdown("", FALLBACK);
    expect(tasks).toHaveLength(0);
  });

  it("returns activeInsertIndex after the marker comment", () => {
    const { activeInsertIndex } = parseCommitmentsMarkdown(COMMITMENTS_MD, FALLBACK);
    // Marker is "<!-- Add new commitments below this line -->"
    // activeInsertIndex should point to the line after that comment
    expect(activeInsertIndex).toBeGreaterThan(0);
  });
});

// ── buildCommitmentBlock ──────────────────────────────────────────────────────

describe("buildCommitmentBlock", () => {
  it("produces a ### header line", () => {
    const task = makeTask({ title: "Deploy service", assignee: "ai" });
    const block = buildCommitmentBlock(task);
    expect(block[0]).toMatch(/^###\s+/);
    expect(block[0]).toContain("Deploy service");
  });

  it("includes a Status line", () => {
    const task = makeTask({ title: "Task", status: "in-progress", assignee: "ai" });
    const block = buildCommitmentBlock(task);
    // buildCommitmentBlock format: "- **Status:** value" (colon inside bold, before closing **)
    expect(block.some((l) => /\*\*Status:\*\*/.test(l))).toBe(true);
    expect(block.some((l) => l.includes("in-progress"))).toBe(true);
  });

  it("maps done status to done in the block", () => {
    const task = makeTask({ title: "Task", status: "done", assignee: "ai" });
    const block = buildCommitmentBlock(task);
    expect(block.some((l) => l.includes("done"))).toBe(true);
  });

  it("includes ETA line when dueDate is set", () => {
    const task = makeTask({ title: "Task", assignee: "ai", dueDate: "2026-03-01T00:00:00.000Z" });
    const block = buildCommitmentBlock(task);
    expect(block.some((l) => /\*\*ETA:\*\*/.test(l))).toBe(true);
  });

  it("includes Notes line when description is set", () => {
    const task = makeTask({ title: "Task", assignee: "ai", description: "Do the thing carefully" });
    const block = buildCommitmentBlock(task);
    expect(block.some((l) => /\*\*Notes:\*\*/.test(l))).toBe(true);
    expect(block.some((l) => l.includes("Do the thing carefully"))).toBe(true);
  });

  it("embeds meta in the header line", () => {
    const task = makeTask({ id: "commit-abc", assignee: "ai" });
    const block = buildCommitmentBlock(task);
    expect(block[0]).toContain("sb:task");
    expect(block[0]).toContain('"id":"commit-abc"');
  });
});

// ── normalizeTaskInput ────────────────────────────────────────────────────────

describe("normalizeTaskInput", () => {
  it("merges partial updates onto the existing task", () => {
    const base = makeTask({ title: "Original", status: "todo" });
    const updated = normalizeTaskInput(base, { status: "done" });
    expect(updated.title).toBe("Original");
    expect(updated.status).toBe("done");
  });

  it("normalizes dueDate string through normalizeDate", () => {
    const base = makeTask({ dueDate: undefined });
    const updated = normalizeTaskInput(base, { dueDate: "2026-03-15" });
    expect(updated.dueDate).toMatch(/^2026-03-15T/);
  });

  it("clears dueDate when undefined is passed in update", () => {
    const base = makeTask({ dueDate: "2026-01-01T00:00:00.000Z" });
    const updated = normalizeTaskInput(base, { dueDate: undefined });
    // When update.dueDate is undefined, keeps original
    expect(updated.dueDate).toBe("2026-01-01T00:00:00.000Z");
  });

  it("replaces tags when provided as array", () => {
    const base = makeTask({ tags: ["old"] });
    const updated = normalizeTaskInput(base, { tags: ["new", "tags"] });
    expect(updated.tags).toEqual(["new", "tags"]);
  });

  it("preserves existing tags when update.tags is not an array", () => {
    const base = makeTask({ tags: ["keep"] });
    const updated = normalizeTaskInput(base, {});
    expect(updated.tags).toEqual(["keep"]);
  });
});
