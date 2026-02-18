import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import type { ConfigFile } from "@/app/lib/types";

const CONFIG_FILES: Array<{ name: string; path: string }> = [
  { name: "SOUL.md", path: "/home/toilet/clawd/SOUL.md" },
  { name: "TOOLS.md", path: "/home/toilet/clawd/TOOLS.md" },
  { name: "MEMORY.md", path: "/home/toilet/clawd/MEMORY.md" },
  { name: "AGENTS.md", path: "/home/toilet/clawd/AGENTS.md" },
  { name: "USER.md", path: "/home/toilet/clawd/USER.md" },
  { name: "HEARTBEAT.md", path: "/home/toilet/clawd/HEARTBEAT.md" },
];

export async function GET() {
  const files = await Promise.all(
    CONFIG_FILES.map(async ({ name, path }): Promise<ConfigFile> => {
      try {
        const stats = await fs.stat(path);
        return {
          name,
          path,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
          exists: true,
        };
      } catch {
        return {
          name,
          path,
          lastModified: "",
          size: 0,
          exists: false,
        };
      }
    })
  );

  return NextResponse.json({ files });
}
