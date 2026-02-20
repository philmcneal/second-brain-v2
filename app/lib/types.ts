export interface Memory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee: "ai" | "user" | null;
  source: "manual" | "ai-generated";
  dueDate?: string;
  tags: string[];
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  path: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigFile {
  name: string;
  path: string;
  lastModified: string;
  size: number;
  exists: boolean;
}

export interface ConfigSuggestion {
  id: string;
  file: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface SlashCommandEntry {
  command: "feature" | "bug" | "marketing";
  /** Full source line text (trimmed) containing the slash command. */
  text: string;
  /** Nearest `##` heading above this line, or null if none. */
  section: string | null;
  /** 0-based line index within the source file. */
  lineIndex: number;
}
