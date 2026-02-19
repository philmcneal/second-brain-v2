import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const promises = {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
  return { default: { promises }, promises };
});

import { promises as fs } from "fs";
import { GET, PUT } from "../[filename]/route";

const mockStat = fs.stat as unknown as ReturnType<typeof vi.fn>;
const mockReadFile = fs.readFile as unknown as ReturnType<typeof vi.fn>;
const mockWriteFile = fs.writeFile as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
});

// Helper: build the params shape the route expects (Promise<{ filename }>)
const makeParams = (filename: string) =>
  ({ params: Promise.resolve({ filename }) } as Parameters<typeof GET>[1]);

const makeRequest = (body: unknown, method = "PUT") =>
  new Request("http://localhost", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET /api/config-files/[filename]", () => {
  it("returns 403 for a filename not on the allowlist", async () => {
    const res = await GET(new Request("http://localhost"), makeParams("../../etc/passwd"));
    expect(res.status).toBe(403);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("File not allowed");
  });

  it("returns 403 for unknown but benign filename", async () => {
    const res = await GET(new Request("http://localhost"), makeParams("EVIL.md"));
    expect(res.status).toBe(403);
  });

  it("returns 404 when the allowed file does not exist on disk", async () => {
    mockReadFile.mockRejectedValueOnce(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));

    const res = await GET(new Request("http://localhost"), makeParams("SOUL.md"));
    expect(res.status).toBe(404);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("File not found");
  });

  it("returns file content + metadata for an allowed file", async () => {
    const content = "# SOUL\n\nHello world";
    const mtime = new Date("2026-02-19T05:00:00Z");
    mockReadFile.mockResolvedValueOnce(content);
    mockStat.mockResolvedValueOnce({ mtime, size: content.length });

    const res = await GET(new Request("http://localhost"), makeParams("SOUL.md"));
    expect(res.status).toBe(200);
    const json = await res.json() as { name: string; content: string; size: number; lastModified: string };
    expect(json.name).toBe("SOUL.md");
    expect(json.content).toBe(content);
    expect(json.size).toBe(content.length);
    expect(json.lastModified).toBe(mtime.toISOString());
  });

  it("accepts all six allowed filenames without 403", async () => {
    const allowed = ["SOUL.md", "TOOLS.md", "MEMORY.md", "AGENTS.md", "USER.md", "HEARTBEAT.md"];
    for (const filename of allowed) {
      mockReadFile.mockResolvedValueOnce("content");
      mockStat.mockResolvedValueOnce({ mtime: new Date(), size: 7 });
      const res = await GET(new Request("http://localhost"), makeParams(filename));
      expect(res.status).toBe(200);
    }
  });
});

describe("PUT /api/config-files/[filename]", () => {
  it("returns 403 for a filename not on the allowlist", async () => {
    const res = await PUT(makeRequest({ content: "x" }), makeParams("EVIL.md"));
    expect(res.status).toBe(403);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns 400 when content field is missing", async () => {
    const res = await PUT(makeRequest({}), makeParams("SOUL.md"));
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("Invalid content");
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns 400 when content is not a string", async () => {
    const res = await PUT(makeRequest({ content: 42 }), makeParams("SOUL.md"));
    expect(res.status).toBe(400);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("writes file and returns success + metadata for allowed file", async () => {
    const newContent = "# New SOUL content";
    const mtime = new Date("2026-02-19T05:30:00Z");
    mockWriteFile.mockResolvedValueOnce(undefined);
    mockStat.mockResolvedValueOnce({ mtime, size: newContent.length });

    const res = await PUT(makeRequest({ content: newContent }), makeParams("SOUL.md"));
    expect(res.status).toBe(200);
    const json = await res.json() as { success: boolean; size: number; lastModified: string };
    expect(json.success).toBe(true);
    expect(json.size).toBe(newContent.length);
    expect(json.lastModified).toBe(mtime.toISOString());
    expect(mockWriteFile).toHaveBeenCalledWith(
      "/home/toilet/clawd/SOUL.md",
      newContent,
      "utf-8",
    );
  });

  it("returns 500 when fs.writeFile throws", async () => {
    mockWriteFile.mockRejectedValueOnce(new Error("EPERM: permission denied"));

    const res = await PUT(makeRequest({ content: "new content" }), makeParams("TOOLS.md"));
    expect(res.status).toBe(500);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("Failed to write file");
  });
});
