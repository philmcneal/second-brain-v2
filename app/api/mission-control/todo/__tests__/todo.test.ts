import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const promises = {
    readFile: vi.fn(),
  };
  return { default: { promises }, promises };
});

import { promises as fs } from "fs";
import { GET } from "../route";

const mockReadFile = fs.readFile as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/mission-control/todo", () => {
  it("parses sections with emoji headers and checkbox items", async () => {
    mockReadFile.mockResolvedValueOnce(
      "## 🔴 High Priority\n- [ ] Fix login bug\n- [x] Deploy to prod\n\n## 🟡 Medium Priority\n- [ ] Write docs\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("sections");
    expect(body.sections).toHaveLength(2);

    const high = body.sections[0];
    expect(high.emoji).toBe("🔴");
    expect(high.title).toBe("High Priority");
    expect(high.items).toHaveLength(2);
    expect(high.items[0]).toMatchObject({ text: "Fix login bug", completed: false });
    expect(high.items[1]).toMatchObject({ text: "Deploy to prod", completed: true });

    const medium = body.sections[1];
    expect(medium.emoji).toBe("🟡");
    expect(medium.title).toBe("Medium Priority");
    expect(medium.items).toHaveLength(1);
    expect(medium.items[0]).toMatchObject({ text: "Write docs", completed: false });
  });

  it("handles uppercase X checkbox as completed", async () => {
    mockReadFile.mockResolvedValueOnce(
      "## 🟢 Low Priority\n- [X] Old completed task\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sections[0].items[0]).toMatchObject({ completed: true });
  });

  it("ignores non-checkbox lines within sections", async () => {
    mockReadFile.mockResolvedValueOnce(
      "## 🔴 Work\n- [ ] Real task\nSome random prose line\n# H1 heading (not a section)\n- [ ] Another task\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sections[0].items).toHaveLength(2);
    expect(body.sections[0].items[0].text).toBe("Real task");
    expect(body.sections[0].items[1].text).toBe("Another task");
  });

  it("strips task meta HTML comments from item text", async () => {
    mockReadFile.mockResolvedValueOnce(
      '## 🟡 Work\n- [ ] Build feature <!-- sb:task {"id":"x1","createdAt":"2026-01-01T00:00:00.000Z"} -->\n'
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    const item = body.sections[0].items[0];
    expect(item.text).toBe("Build feature");
    expect(item.text).not.toContain("sb:task");
  });

  it("returns empty sections array for blank content", async () => {
    mockReadFile.mockResolvedValueOnce("");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sections).toEqual([]);
  });

  it("returns empty sections when file has no emoji section headers", async () => {
    mockReadFile.mockResolvedValueOnce(
      "# Top-level heading\n## No emoji here\n- [ ] Some task\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    // Only ## with 🔴/🟡/🟢 are valid sections; items without a section are dropped
    expect(body.sections).toEqual([]);
  });

  it("returns 500 when an unexpected read error occurs", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("permission denied"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });

  it("handles a single section with no items gracefully", async () => {
    mockReadFile.mockResolvedValueOnce("## 🟢 Someday\n");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sections).toHaveLength(1);
    expect(body.sections[0].items).toEqual([]);
  });
});
