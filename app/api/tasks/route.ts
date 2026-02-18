import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Task } from "@/app/lib/types";
import {
  buildCommitmentBlock,
  buildTodoLine,
  emojiFromPriority,
  ensureTrailingNewline,
  normalizeTaskInput,
  parseCommitmentsMarkdown,
  parseTodoMarkdown,
} from "@/app/lib/task-markdown";

const TODO_PATH = "/home/toilet/clawd/TODO.md";
const COMMITMENTS_PATH = "/home/toilet/clawd/COMMITMENTS.md";

const TODO_TEMPLATE = (dateToken: string) => `# Master TODO List - Clawdbot & Projects\n\n*Last updated: ${dateToken}*\n\n---\n\n## 🔴 High Priority\n\n\n## 🟡 Medium Priority\n\n\n## 🟢 Low Priority / Maintenance\n`;

const COMMITMENTS_TEMPLATE = `# COMMITMENTS.md — Open Tasks & Pending Follow-ups\n\n> This file tracks tasks I've committed to but haven't completed yet.\n> I check this during every heartbeat and report status to Vap3.\n\n## Active Commitments\n\n<!-- Add new commitments below this line -->\n\n\n## Recently Completed (last 7 days)\n\n<!-- Move completed items here, delete after 7 days -->\n`;

type TaskPayload = {
  id?: string;
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assignee?: Task["assignee"];
  source?: Task["source"];
  dueDate?: string;
  tags?: string[];
  createdAt?: string;
};

async function readFileSafe(path: string): Promise<{ content: string; mtimeMs: number }> {
  try {
    const [content, stat] = await Promise.all([fs.readFile(path, "utf-8"), fs.stat(path)]);
    return { content, mtimeMs: stat.mtimeMs };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { content: "", mtimeMs: 0 };
    }
    throw error;
  }
}

async function ensureFile(path: string, template: string): Promise<void> {
  const existing = await readFileSafe(path);
  if (existing.content.trim()) return;
  await fs.writeFile(path, template, "utf-8");
}

function buildTaskFromPayload(payload: TaskPayload, defaults: Partial<Task>): Task {
  const now = new Date().toISOString();
  const createdAt = normalizeDate(payload.createdAt, defaults.createdAt ?? now) ?? defaults.createdAt ?? now;

  return {
    id: payload.id ?? crypto.randomUUID(),
    title: payload.title?.trim() || defaults.title || "Untitled Task",
    description: payload.description ?? defaults.description ?? "",
    status: payload.status ?? defaults.status ?? "todo",
    priority: payload.priority ?? defaults.priority ?? "medium",
    assignee: payload.assignee ?? defaults.assignee ?? "user",
    source: payload.source ?? defaults.source ?? "manual",
    dueDate: normalizeDate(payload.dueDate) ?? defaults.dueDate,
    tags: Array.isArray(payload.tags) ? payload.tags : defaults.tags ?? [],
    createdAt,
  };
}

async function writeTodoTask(task: Task, mode: "add" | "update" | "delete"): Promise<void> {
  const { content } = await readFileSafe(TODO_PATH);
  const dateToken = new Date().toISOString().slice(0, 10);
  if (!content.trim()) {
    await fs.writeFile(TODO_PATH, TODO_TEMPLATE(dateToken), "utf-8");
  }

  const { content: updatedContent } = await readFileSafe(TODO_PATH);
  const hadTrailingNewline = updatedContent.endsWith("\n");
  const parsed = parseTodoMarkdown(updatedContent, new Date().toISOString());
  const lines = [...parsed.lines];

  const existingIndex = parsed.tasks.findIndex((entry) => entry.task.id === task.id);

  if (mode === "delete") {
    if (existingIndex === -1) return;
    const lineIndex = parsed.tasks[existingIndex].lineIndex;
    lines.splice(lineIndex, 1);
    const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
    await fs.writeFile(TODO_PATH, newContent, "utf-8");
    return;
  }

  const targetEmoji = emojiFromPriority(task.priority);
  const section = parsed.sections.find((sec) => sec.emoji === targetEmoji);
  const insertIndex = section ? section.endIndex : lines.length;
  const newLine = buildTodoLine(task, existingIndex >= 0 ? parsed.tasks[existingIndex].indent : "");

  if (mode === "add" || existingIndex === -1) {
    lines.splice(insertIndex, 0, newLine);
    const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
    await fs.writeFile(TODO_PATH, newContent, "utf-8");
    return;
  }

  const existing = parsed.tasks[existingIndex];
  const existingLineIndex = existing.lineIndex;
  const existingEmoji = existing.sectionEmoji;

  if (existingEmoji !== targetEmoji) {
    lines.splice(existingLineIndex, 1);
    const adjustedInsert = existingLineIndex < insertIndex ? insertIndex - 1 : insertIndex;
    lines.splice(adjustedInsert, 0, newLine);
  } else {
    lines[existingLineIndex] = newLine;
  }

  const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
  await fs.writeFile(TODO_PATH, newContent, "utf-8");
}

async function writeCommitmentTask(task: Task, mode: "add" | "update" | "delete"): Promise<void> {
  const { content } = await readFileSafe(COMMITMENTS_PATH);
  if (!content.trim()) {
    await fs.writeFile(COMMITMENTS_PATH, COMMITMENTS_TEMPLATE, "utf-8");
  }

  const { content: updatedContent } = await readFileSafe(COMMITMENTS_PATH);
  const hadTrailingNewline = updatedContent.endsWith("\n");
  const parsed = parseCommitmentsMarkdown(updatedContent, new Date().toISOString());
  const lines = [...parsed.lines];

  const existingIndex = parsed.tasks.findIndex((entry) => entry.task.id === task.id);

  if (mode === "delete") {
    if (existingIndex === -1) return;
    const existing = parsed.tasks[existingIndex];
    lines.splice(existing.blockStart, existing.blockEnd - existing.blockStart);
    const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
    await fs.writeFile(COMMITMENTS_PATH, newContent, "utf-8");
    return;
  }

  const blockLines = buildCommitmentBlock(task, { existing: existingIndex >= 0 ? parsed.tasks[existingIndex] : undefined });

  if (mode === "add" || existingIndex === -1) {
    lines.splice(parsed.activeInsertIndex, 0, ...blockLines, "");
    const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
    await fs.writeFile(COMMITMENTS_PATH, newContent, "utf-8");
    return;
  }

  const existing = parsed.tasks[existingIndex];
  lines.splice(existing.blockStart, existing.blockEnd - existing.blockStart, ...blockLines);
  const newContent = ensureTrailingNewline(lines, hadTrailingNewline);
  await fs.writeFile(COMMITMENTS_PATH, newContent, "utf-8");
}

export async function GET() {
  try {
    await Promise.all([
      ensureFile(TODO_PATH, TODO_TEMPLATE(new Date().toISOString().slice(0, 10))),
      ensureFile(COMMITMENTS_PATH, COMMITMENTS_TEMPLATE),
    ]);

    const [todoFile, commitmentsFile] = await Promise.all([readFileSafe(TODO_PATH), readFileSafe(COMMITMENTS_PATH)]);

    const todoParsed = parseTodoMarkdown(todoFile.content, new Date().toISOString());
    const commitmentsParsed = parseCommitmentsMarkdown(commitmentsFile.content, new Date().toISOString());

    const tasks = [...todoParsed.tasks.map((entry) => entry.task), ...commitmentsParsed.tasks.map((entry) => entry.task)];

    const revision = `${todoFile.mtimeMs}-${commitmentsFile.mtimeMs}`;

    return NextResponse.json({ tasks, revision });
  } catch (error) {
    console.error("Error reading task markdown:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TaskPayload;

    if (!payload?.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = buildTaskFromPayload(payload, { createdAt: new Date().toISOString() });

    if (task.assignee === "ai") {
      await writeCommitmentTask(task, "add");
    } else {
      await writeTodoTask(task, "add");
    }

    return NextResponse.json({ ok: true, id: task.id });
  } catch (error) {
    console.error("Error writing task:", error);
    return NextResponse.json({ error: "Failed to write task" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as TaskPayload;
    if (!payload?.id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    const [todoFile, commitmentsFile] = await Promise.all([readFileSafe(TODO_PATH), readFileSafe(COMMITMENTS_PATH)]);
    const todoParsed = parseTodoMarkdown(todoFile.content, new Date().toISOString());
    const commitmentsParsed = parseCommitmentsMarkdown(commitmentsFile.content, new Date().toISOString());

    const todoEntry = todoParsed.tasks.find((entry) => entry.task.id === payload.id);
    const commitmentEntry = commitmentsParsed.tasks.find((entry) => entry.task.id === payload.id);

    if (!todoEntry && !commitmentEntry) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const existing = todoEntry?.task ?? commitmentEntry!.task;
    const updated = normalizeTaskInput(existing, {
      title: payload.title ?? existing.title,
      description: payload.description ?? existing.description,
      status: payload.status ?? existing.status,
      priority: payload.priority ?? existing.priority,
      assignee: payload.assignee ?? existing.assignee,
      source: payload.source ?? existing.source,
      dueDate: payload.dueDate ?? existing.dueDate,
      tags: payload.tags ?? existing.tags,
    });

    if (existing.assignee !== updated.assignee) {
      if (existing.assignee === "ai") {
        await writeCommitmentTask(existing, "delete");
        await writeTodoTask(updated, "add");
      } else {
        await writeTodoTask(existing, "delete");
        await writeCommitmentTask(updated, "add");
      }
      return NextResponse.json({ ok: true });
    }

    if (updated.assignee === "ai") {
      await writeCommitmentTask(updated, "update");
    } else {
      await writeTodoTask(updated, "update");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as TaskPayload;
    if (!payload?.id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    const [todoFile, commitmentsFile] = await Promise.all([readFileSafe(TODO_PATH), readFileSafe(COMMITMENTS_PATH)]);
    const todoParsed = parseTodoMarkdown(todoFile.content, new Date().toISOString());
    const commitmentsParsed = parseCommitmentsMarkdown(commitmentsFile.content, new Date().toISOString());

    const todoEntry = todoParsed.tasks.find((entry) => entry.task.id === payload.id);
    const commitmentEntry = commitmentsParsed.tasks.find((entry) => entry.task.id === payload.id);

    if (todoEntry) {
      await writeTodoTask(todoEntry.task, "delete");
    } else if (commitmentEntry) {
      await writeCommitmentTask(commitmentEntry.task, "delete");
    } else {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as { tasks?: TaskPayload[] };
    const tasksPayload = Array.isArray(payload?.tasks) ? payload.tasks : [];

    const [todoFile, commitmentsFile] = await Promise.all([readFileSafe(TODO_PATH), readFileSafe(COMMITMENTS_PATH)]);

    const todoParsed = parseTodoMarkdown(todoFile.content, new Date().toISOString());
    const commitmentsParsed = parseCommitmentsMarkdown(commitmentsFile.content, new Date().toISOString());

    const managedTodoLines = new Set(todoParsed.tasks.map((entry) => entry.lineIndex));
    const managedCommitmentBlocks = commitmentsParsed.tasks.map((entry) => ({ start: entry.blockStart, end: entry.blockEnd }));

    const todoLines = todoParsed.lines.filter((_, index) => !managedTodoLines.has(index));

    const commitmentLines = [...commitmentsParsed.lines];
    managedCommitmentBlocks
      .sort((a, b) => b.start - a.start)
      .forEach((block) => {
        commitmentLines.splice(block.start, block.end - block.start);
      });

    const todoTasks = tasksPayload
      .filter((task) => task.assignee !== "ai")
      .map((task) => buildTaskFromPayload(task, { assignee: "user" }));
    const commitmentTasks = tasksPayload
      .filter((task) => task.assignee === "ai")
      .map((task) => buildTaskFromPayload(task, { assignee: "ai" }));

    const todoParsedAfter = parseTodoMarkdown(todoLines.join("\n"), new Date().toISOString());
    const todoLinesUpdated = [...todoParsedAfter.lines];
    const sections = todoParsedAfter.sections;

    const grouped = new Map<string, Task[]>();
    todoTasks.forEach((task) => {
      const emoji = emojiFromPriority(task.priority);
      const key = emoji;
      const list = grouped.get(key) ?? [];
      list.push(task);
      grouped.set(key, list);
    });

    sections
      .slice()
      .sort((a, b) => b.startIndex - a.startIndex)
      .forEach((section) => {
        const items = grouped.get(section.emoji) ?? [];
        if (!items.length) return;
        const insertLines = items.map((task) => buildTodoLine(task));
        todoLinesUpdated.splice(section.endIndex, 0, ...insertLines, "");
      });

    const commitmentsParsedAfter = parseCommitmentsMarkdown(commitmentLines.join("\n"), new Date().toISOString());
    const commitmentsLinesUpdated = [...commitmentsParsedAfter.lines];
    let insertIndex = commitmentsParsedAfter.activeInsertIndex;
    commitmentTasks.forEach((task) => {
      const block = buildCommitmentBlock(task);
      commitmentsLinesUpdated.splice(insertIndex, 0, ...block, "");
      insertIndex += block.length + 1;
    });

    await Promise.all([
      fs.writeFile(TODO_PATH, ensureTrailingNewline(todoLinesUpdated, todoFile.content.endsWith("\n")), "utf-8"),
      fs.writeFile(COMMITMENTS_PATH, ensureTrailingNewline(commitmentsLinesUpdated, commitmentsFile.content.endsWith("\n")), "utf-8"),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error replacing tasks:", error);
    return NextResponse.json({ error: "Failed to replace tasks" }, { status: 500 });
  }
}
