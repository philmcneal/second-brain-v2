import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

const WORKSPACE_ROOT = "/home/toilet/clawd";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = join(WORKSPACE_ROOT, ...path);
    
    // Security: ensure path is within workspace
    const resolvedPath = await fs.realpath(filePath);
    if (!resolvedPath.startsWith(WORKSPACE_ROOT)) {
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
