import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

const MEMORY_PATH = "/home/toilet/clawd/memory";

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  preview?: string;
}

export async function GET() {
  try {
    const files = await fs.readdir(MEMORY_PATH);
    const memoryFiles: MemoryFile[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = join(MEMORY_PATH, file);
        const stats = await fs.stat(filePath);

        // Read first 100 characters for preview
        let preview = "";
        try {
          const content = await fs.readFile(filePath, "utf-8");
          preview = content.slice(0, 100).replace(/\n/g, " ").trim();
          if (content.length > 100) preview += "...";
        } catch {
          preview = "Unable to read preview";
        }

        memoryFiles.push({
          name: file,
          path: filePath,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          preview,
        });
      }
    }

    // Sort by modified date (newest first)
    memoryFiles.sort((a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );

    // Return last 10
    return NextResponse.json({ files: memoryFiles.slice(0, 10) });
  } catch (error) {
    console.error("Error reading memory files:", error);
    return NextResponse.json(
      { error: "Failed to read memory files" },
      { status: 500 }
    );
  }
}
