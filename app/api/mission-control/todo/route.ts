import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import { stripTaskMeta } from "@/app/lib/task-markdown";

const TODO_PATH = "/home/toilet/clawd/TODO.md";

interface TodoSection {
  title: string;
  emoji: string;
  items: Array<{
    text: string;
    completed: boolean;
  }>;
}

export async function GET() {
  try {
    const content = await fs.readFile(TODO_PATH, "utf-8");
    const lines = content.split("\n");

    const sections: TodoSection[] = [];
    let currentSection: TodoSection | null = null;

    for (const line of lines) {
      // Match section headers like "## 🔴 Taxes" or "## 🟡 Medium Priority"
      const sectionMatch = line.match(/^##\s*(🔴|🟡|🟢)\s*(.+)/);
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          emoji: sectionMatch[1],
          title: sectionMatch[2].trim(),
          items: [],
        };
        continue;
      }

      // Match checkbox items like "- [ ] Task" or "- [x] Task"
      const itemMatch = line.match(/^-\s*\[([ xX])\]\s*(.+)/);
      if (itemMatch && currentSection) {
        currentSection.items.push({
          completed: itemMatch[1].toLowerCase() === "x",
          text: stripTaskMeta(itemMatch[2]),
        });
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error reading TODO.md:", error);
    return NextResponse.json(
      { error: "Failed to read TODO.md" },
      { status: 500 }
    );
  }
}
