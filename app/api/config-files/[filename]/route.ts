import { NextResponse } from "next/server";
import { promises as fs } from "fs";

const CONFIG_DIR = "/home/toilet/clawd";
const ALLOWED_FILES = ["SOUL.md", "TOOLS.md", "MEMORY.md", "AGENTS.md", "USER.md", "HEARTBEAT.md"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!ALLOWED_FILES.includes(filename)) {
    return NextResponse.json({ error: "File not allowed" }, { status: 403 });
  }

  const filePath = `${CONFIG_DIR}/${filename}`;

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const stats = await fs.stat(filePath);

    return NextResponse.json({
      name: filename,
      content,
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!ALLOWED_FILES.includes(filename)) {
    return NextResponse.json({ error: "File not allowed" }, { status: 403 });
  }

  const filePath = `${CONFIG_DIR}/${filename}`;

  try {
    const body = await request.json() as { content?: string };
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    await fs.writeFile(filePath, content, "utf-8");
    const stats = await fs.stat(filePath);

    return NextResponse.json({
      success: true,
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
    });
  } catch (error) {
    console.error("Error writing config file:", error);
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}
