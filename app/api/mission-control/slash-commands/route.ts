import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import { parseSlashCommands } from "@/app/lib/slash-command-parser";

const TODO_PATH = "/home/toilet/clawd/TODO.md";

export async function GET() {
  try {
    const content = await fs.readFile(TODO_PATH, "utf-8");
    const commands = parseSlashCommands(content);
    return NextResponse.json({ commands });
  } catch (error) {
    // File not found → return empty list so the UI shows empty state
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ commands: [] });
    }
    console.error("Error reading TODO.md for slash commands:", error);
    return NextResponse.json(
      { error: "Failed to read TODO.md" },
      { status: 500 }
    );
  }
}
