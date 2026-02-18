import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

const WORKSPACE_ROOT = "/home/toilet/clawd";

// Additional allowed roots for symlinked directories
const ALLOWED_ROOTS = [
  WORKSPACE_ROOT,
  "/home/toilet/.openclaw/media", // Allow access to media via symlink
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = join(WORKSPACE_ROOT, ...path);
    
    // Security: ensure path is within allowed roots
    const resolvedPath = await fs.realpath(filePath);
    const isAllowed = ALLOWED_ROOTS.some(root => resolvedPath.startsWith(root));
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    
    const content = await fs.readFile(filePath, "utf-8");
    const stats = await fs.stat(filePath);
    
    return NextResponse.json({
      path: path.join("/"),
      content,
      modifiedAt: stats.mtime.toISOString(),
      size: stats.size,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
