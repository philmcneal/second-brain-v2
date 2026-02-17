import { createHash } from "crypto";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Task } from "@/app/lib/types";

export type TaskMeta = {
  id: string;
  createdAt: string;
  dueDate?: string;
  tags?: string[];
  priority?: Task["priority"];
};

export type TodoSection = {
  emoji: "🔴" | "🟡" | "🟢";
  title: string;
  startIndex: number;
  endIndex: number;
};

export type ParsedTodoTask = {
  task: Task;
  lineIndex: number;
  indent: string;
  sectionEmoji: TodoSection["emoji"];
};

export type ParsedCommitmentTask = {
  task: Task;
  blockStart: number;
  blockEnd: number;
  headerTimestamp?: string;
  subAgent?: string;
  eta?: string;
  lastUpdate?: string;
  notes?: string;
};

const META_REGEX = /<!--\s*sb:task\s*({[^]*?})\s*-->/i;

export function stripTaskMeta(text: string): string {
  return text.replace(META_REGEX, "").trim();
}

export function extractTaskMeta(text: string): { text: string; meta: Partial<TaskMeta> | null } {
  const match = text.match(META_REGEX);
  if (!match) return { text: text.trim(), meta: null };

  const raw = match[1];
  let meta: Partial<TaskMeta> | null = null;

  try {
    meta = JSON.parse(raw);
  } catch {
    meta = null;
  }

  const cleaned = text.replace(match[0], "").trim();
  return { text: cleaned, meta };
}

export function buildTaskMeta(task: Task): string {
  const meta: TaskMeta = {
    id: task.id,
    createdAt: task.createdAt,
  };

  if (task.dueDate) meta.dueDate = task.dueDate;
  if (task.tags.length) meta.tags = task.tags;
  if (task.priority) meta.priority = task.priority;

  return `<!-- sb:task ${JSON.stringify(meta)} -->`;
}

function stableTaskId(source: string, section: string, title: string, lineIndex: number): string {
  const hash = createHash("sha1").update(`${source}|${section}|${title}|${lineIndex}`).digest("hex");
  return `sb-${hash.slice(0, 12)}`;
}

function priorityFromEmoji(emoji: TodoSection["emoji"]): Task["priority"] {
  if (emoji === "🔴") return "high";
  if (emoji === "🟡") return "medium";
  return "low";
}

export function emojiFromPriority(priority: Task["priority"]): TodoSection["emoji"] {
  if (priority === "high") return "🔴";
  if (priority === "medium") return "🟡";
  return "🟢";
}

export function parseTodoMarkdown(content: string, fallbackCreatedAt: string): { lines: string[]; sections: TodoSection[]; tasks: ParsedTodoTask[] } {
  const lines = content.split("\n");
  const sections: TodoSection[] = [];
  const tasks: ParsedTodoTask[] = [];

  let currentSection: TodoSection | null = null;

  lines.forEach((line, index) => {
    const sectionMatch = line.match(/^##\s*(🔴|🟡|🟢)\s*(.+)/);
    if (sectionMatch) {
      if (currentSection) {
        currentSection.endIndex = index;
        sections.push(currentSection);
      }
      currentSection = {
        emoji: sectionMatch[1] as TodoSection["emoji"],
        title: sectionMatch[2].trim(),
        startIndex: index,
        endIndex: lines.length,
      };
      return;
    }

    const itemMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.+)$/);
    if (itemMatch && currentSection) {
      const { text, meta } = extractTaskMeta(itemMatch[3]);
      const title = text.trim() || "Untitled Task";
      const id = typeof meta?.id === "string" ? meta.id : stableTaskId("todo", currentSection.emoji, title, index);
      const createdAt = normalizeDate(meta?.createdAt, fallbackCreatedAt) ?? fallbackCreatedAt;
      const dueDate = normalizeDate(meta?.dueDate);
      const tags = Array.isArray(meta?.tags) ? meta?.tags.filter((tag): tag is string => typeof tag === "string") : [];
      const priority = meta?.priority ?? priorityFromEmoji(currentSection.emoji);
      const status = itemMatch[2].toLowerCase() === "x" ? "done" : "todo";

      tasks.push({
        task: {
          id,
          title,
          description: "",
          status,
          priority,
          assignee: "user",
          source: "manual",
          dueDate: dueDate ?? undefined,
          tags,
          createdAt,
        },
        lineIndex: index,
        indent: itemMatch[1] ?? "",
        sectionEmoji: currentSection.emoji,
      });
    }
  });

  if (currentSection) {
    currentSection.endIndex = lines.length;
    sections.push(currentSection);
  }

  return { lines, sections, tasks };
}

function mapCommitmentStatus(status?: string): Task["status"] {
  if (!status) return "todo";
  const normalized = status.toLowerCase();
  if (normalized === "in-progress") return "in-progress";
  if (normalized === "done") return "done";
  return "todo";
}

export function taskStatusToCommitment(status: Task["status"]): string {
  if (status === "in-progress") return "in-progress";
  if (status === "done") return "done";
  return "pending";
}

function parseTimestampFromHeader(text: string): { timestamp?: string; title: string } {
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?\s+(.+)$/);
  if (!match) return { title: text.trim() };

  const dateToken = match[1];
  const timeToken = match[2] ?? "00:00";
  const title = match[3].trim();
  return { timestamp: `${dateToken} ${timeToken}`, title };
}

function toIsoFromTimestamp(timestamp?: string, fallback: string): string {
  if (!timestamp) return fallback;
  const parsed = new Date(timestamp.replace(" ", "T") + ":00Z");
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

export function parseCommitmentsMarkdown(content: string, fallbackCreatedAt: string): { lines: string[]; tasks: ParsedCommitmentTask[]; activeInsertIndex: number } {
  const lines = content.split("\n");
  const tasks: ParsedCommitmentTask[] = [];

  let inCodeBlock = false;
  let current: ParsedCommitmentTask | null = null;

  let activeHeaderIndex = lines.findIndex((line) => /^##\s+Active Commitments/i.test(line));
  if (activeHeaderIndex === -1) activeHeaderIndex = lines.length;
  let activeInsertIndex = activeHeaderIndex + 1;
  const markerIndex = lines.findIndex((line, index) => index > activeHeaderIndex && line.includes("Add new commitments"));
  if (markerIndex !== -1) activeInsertIndex = markerIndex + 1;

  const closeCurrent = (endIndex: number) => {
    if (current) {
      current.blockEnd = endIndex;
      tasks.push(current);
      current = null;
    }
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) return;

    const headerMatch = line.match(/^#{2,3}\s+(.+)/);
    if (headerMatch) {
      closeCurrent(index);

      const { text: headerText, meta } = extractTaskMeta(headerMatch[1]);
      const { timestamp, title } = parseTimestampFromHeader(headerText);

      const id = typeof meta?.id === "string" ? meta.id : stableTaskId("commitments", "header", title, index);
      const createdAt = normalizeDate(meta?.createdAt, toIsoFromTimestamp(timestamp, fallbackCreatedAt)) ?? fallbackCreatedAt;

      current = {
        task: {
          id,
          title: title || "Untitled Task",
          description: "",
          status: "todo",
          priority: meta?.priority ?? "medium",
          assignee: "ai",
          source: "manual",
          dueDate: normalizeDate(meta?.dueDate) ?? undefined,
          tags: Array.isArray(meta?.tags) ? meta?.tags.filter((tag): tag is string => typeof tag === "string") : [],
          createdAt,
        },
        blockStart: index,
        blockEnd: lines.length,
        headerTimestamp: timestamp,
      };
      return;
    }

    if (!current) return;

    const statusMatch = line.match(/\*?\*?Status\*?\*?:\s*(pending|in-progress|blocked|done)/i);
    if (statusMatch) {
      current.task.status = mapCommitmentStatus(statusMatch[1]);
      return;
    }

    const etaMatch = line.match(/\*?\*?ETA\*?\*?:\s*(.+)/i);
    if (etaMatch) {
      current.eta = etaMatch[1].trim();
      const dueDate = normalizeDate(etaMatch[1].trim());
      if (dueDate) current.task.dueDate = dueDate;
      return;
    }

    const updateMatch = line.match(/\*?\*?Last Update\*?\*?:\s*(.+)/i);
    if (updateMatch) {
      current.lastUpdate = updateMatch[1].trim();
      return;
    }

    const subAgentMatch = line.match(/\*?\*?Sub-agent\*?\*?:\s*(.+)/i);
    if (subAgentMatch) {
      current.subAgent = subAgentMatch[1].trim();
      return;
    }

    const notesMatch = line.match(/\*?\*?Notes\*?\*?:\s*(.+)/i);
    if (notesMatch) {
      current.notes = notesMatch[1].trim();
      current.task.description = current.notes;
      return;
    }

    if (line.trim() && !line.startsWith("#") && !line.match(/\*?\*?(Status|ETA|Last Update|Sub-agent|Notes)\*?\*?:/i)) {
      if (!current.task.description) {
        current.task.description = line.trim();
      }
    }
  });

  closeCurrent(lines.length);

  return { lines, tasks, activeInsertIndex };
}

export function buildTodoLine(task: Task, indent = ""): string {
  const checkbox = task.status === "done" ? "[x]" : "[ ]";
  const title = task.title.trim() || "Untitled Task";
  const meta = buildTaskMeta(task);
  return `${indent}- ${checkbox} ${title} ${meta}`.trimEnd();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16).replace("T", " ");
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function buildCommitmentBlock(task: Task, options: { existing?: ParsedCommitmentTask } = {}): string[] {
  const timestamp = options.existing?.headerTimestamp ?? formatTimestamp(task.createdAt);
  const headerTitle = task.title.trim() || "Untitled Task";
  const meta = buildTaskMeta(task);

  const status = taskStatusToCommitment(task.status);
  const eta = task.dueDate ?? options.existing?.eta;
  const subAgent = options.existing?.subAgent;
  const notes = task.description || options.existing?.notes;
  const lastUpdate = new Date().toISOString().slice(0, 16).replace("T", " ");

  const lines = [`### ${timestamp} ${headerTitle} ${meta}`.trimEnd()];
  lines.push(`- **Status:** ${status}`);
  if (subAgent) lines.push(`- **Sub-agent:** ${subAgent}`);
  if (eta) lines.push(`- **ETA:** ${eta}`);
  lines.push(`- **Last update:** ${lastUpdate}`);
  if (notes) lines.push(`- **Notes:** ${notes}`);

  return lines;
}

export function normalizeTaskInput(task: Task, update: Partial<Task>): Task {
  return {
    ...task,
    ...update,
    dueDate: update.dueDate === undefined ? task.dueDate : normalizeDate(update.dueDate) ?? undefined,
    tags: Array.isArray(update.tags) ? update.tags : task.tags,
  };
}

export function ensureTrailingNewline(lines: string[], hadTrailingNewline: boolean): string {
  const content = lines.join("\n");
  if (hadTrailingNewline) {
    return content.endsWith("\n") ? content : `${content}\n`;
  }
  return content;
}
