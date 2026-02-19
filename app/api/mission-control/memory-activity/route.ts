import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

const MEMORY_PATH = "/home/toilet/clawd/memory";

export interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  preview?: string;
}

/**
 * Returns a plain-text preview from the file's first non-empty, non-heading line.
 * Heading lines (starting with `#`) are skipped so the preview shows actual body
 * content rather than a repeated title. Truncates to maxLen characters.
 */
export function extractPreview(content: string, maxLen = 120): string {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || /^#+/.test(trimmed)) continue;
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
  }
  return "";
}

export async function GET() {
  // Confirm the memory directory exists before iterating
  try {
    const stat = await fs.stat(MEMORY_PATH);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: `${MEMORY_PATH} is not a directory` },
        { status: 500 },
      );
    }
  } catch {
    // Directory doesn't exist yet — return an empty feed rather than an error
    return NextResponse.json({ files: [] }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const entries = await fs.readdir(MEMORY_PATH, { withFileTypes: true });
    const memoryFiles: MemoryFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const filePath = join(MEMORY_PATH, entry.name);
      let stats;
      try {
        stats = await fs.stat(filePath);
      } catch {
        continue; // skip files that disappeared between readdir and stat
      }

      let preview = "";
      try {
        const content = await fs.readFile(filePath, "utf-8");
        preview = extractPreview(content);
      } catch {
        preview = "Unable to read preview";
      }

      memoryFiles.push({
        name: entry.name,
        path: filePath,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        preview,
      });
    }

    // Sort by modified date (newest first), return up to 10
    memoryFiles.sort(
      (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    );

    return NextResponse.json(
      { files: memoryFiles.slice(0, 10) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error reading memory files:", error);
    return NextResponse.json(
      { error: "Failed to read memory files" },
      { status: 500 },
    );
  }
}
