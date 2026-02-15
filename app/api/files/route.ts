import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

const WORKSPACE_ROOT = "/home/toilet/clawd";

interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  modifiedAt: string;
}

async function scanDirectory(dir: string, basePath: string = ""): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const fullPath = join(dir, basePath);
  
  try {
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    for (const item of items) {
      const relativePath = basePath ? `${basePath}/${item.name}` : item.name;
      const itemPath = join(fullPath, item.name);
      
      if (item.isDirectory()) {
        // Skip hidden dirs, build artifacts, and non-content directories
        const skipDirs = new Set([
          "node_modules",
          "archive",
          "__pycache__",
          ".git",
          ".next",
          "dist",
          "build",
          ".cache",
          "__snapshots__",
        ]);
        if (item.name.startsWith(".") || item.name.startsWith("__") || skipDirs.has(item.name)) {
          continue;
        }
        // Recurse into subdirectories
        const subEntries = await scanDirectory(dir, relativePath);
        entries.push(...subEntries);
      } else if (item.name.endsWith(".md")) {
        const stats = await fs.stat(itemPath);
        entries.push({
          path: relativePath,
          name: item.name,
          isDirectory: false,
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${fullPath}:`, error);
  }
  
  return entries;
}

export async function GET() {
  try {
    const files = await scanDirectory(WORKSPACE_ROOT);
    
    // Sort markdown files by modified time (newest first)
    files.sort((a, b) => {
      const modifiedDiff = new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      return modifiedDiff !== 0 ? modifiedDiff : a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ files, root: WORKSPACE_ROOT });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
