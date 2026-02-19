import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock "fs" — supply both `default` and `promises` (Vitest requires a default export)
vi.mock("fs", () => {
  const promises = {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
  };
  return { default: { promises }, promises };
});

import { promises as fs } from "fs";
import { analyzeFile } from "../route";

const mockStat = fs.stat as unknown as ReturnType<typeof vi.fn>;
const mockReadFile = fs.readFile as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
});

function mockFile(size: number, content: string) {
  mockStat.mockResolvedValueOnce({ size, mtime: new Date("2026-02-19T05:00:00Z") });
  mockReadFile.mockResolvedValueOnce(content);
}

describe("analyzeFile", () => {
  it("returns empty suggestions for a well-formed SOUL.md", async () => {
    mockFile(500, "## Core\n\nSome content here.\n## Greeting\nHello!");
    const suggestions = await analyzeFile("SOUL.md");
    expect(suggestions).toHaveLength(0);
  });

  it("returns high-priority 'File is empty' suggestion when size is 0", async () => {
    mockFile(0, "");
    const suggestions = await analyzeFile("SOUL.md");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].priority).toBe("high");
    expect(suggestions[0].title).toBe("File is empty");
    expect(suggestions[0].file).toBe("SOUL.md");
  });

  it("returns medium-priority 'File is very minimal' when size < 100", async () => {
    mockFile(8, "## Short");
    const suggestions = await analyzeFile("TOOLS.md");
    expect(suggestions.some(s => s.title === "File is very minimal")).toBe(true);
    expect(suggestions.find(s => s.title === "File is very minimal")?.priority).toBe("medium");
  });

  it("suggests missing section headers for SOUL.md without ##", async () => {
    mockFile(200, "greeting is here but no headers at all");
    const suggestions = await analyzeFile("SOUL.md");
    expect(suggestions.some(s => s.title === "Missing section headers")).toBe(true);
  });

  it("suggests adding greeting for SOUL.md without 'greeting' keyword", async () => {
    mockFile(300, "## Core\n\nSome content but no mention of the g-word.");
    const suggestions = await analyzeFile("SOUL.md");
    expect(suggestions.some(s => s.title === "Consider adding greeting configuration")).toBe(true);
    expect(suggestions.find(s => s.title === "Consider adding greeting configuration")?.priority).toBe("low");
  });

  it("returns high-priority 'File does not exist' when fs throws", async () => {
    mockStat.mockRejectedValueOnce(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));

    const suggestions = await analyzeFile("MEMORY.md");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].priority).toBe("high");
    expect(suggestions[0].title).toBe("File does not exist");
    expect(suggestions[0].file).toBe("MEMORY.md");
  });

  it("returns high-priority archive suggestion for MEMORY.md when size > 20000", async () => {
    mockFile(20001, "## Sections\n\n" + "x".repeat(20001));
    const suggestions = await analyzeFile("MEMORY.md");
    expect(suggestions.some(s => s.title === "File is very large - consider archiving")).toBe(true);
    expect(suggestions.find(s => s.title === "File is very large - consider archiving")?.priority).toBe("high");
  });

  it("generates unique IDs across multiple analyzeFile calls", async () => {
    mockFile(0, "");
    mockFile(0, "");
    const [s1, s2] = await Promise.all([analyzeFile("SOUL.md"), analyzeFile("TOOLS.md")]);
    const ids = [...s1.map(s => s.id), ...s2.map(s => s.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("handles HEARTBEAT.md with valid structured content cleanly", async () => {
    mockFile(500, "## Checks\n\n- check email\n- check cron\n");
    const suggestions = await analyzeFile("HEARTBEAT.md");
    expect(suggestions).toHaveLength(0);
  });
});
