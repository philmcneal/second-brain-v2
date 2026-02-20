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

// Build a recent lastUpdate date string (yesterday) so "done" items land in recentlyCompleted
function recentDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Build an old lastUpdate date string (>7 days ago) so "done" items don't appear in recentlyCompleted
function oldDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// NOTE: The route's status/ETA/LastUpdate regexes require the colon OUTSIDE the bold markers
// (e.g. "**Status**: in-progress"), not inside ("**Status:** in-progress").
// Use that format in all fixtures below.

describe("GET /api/mission-control/commitments", () => {
  it("returns active and recentlyCompleted from a simple markdown fixture", async () => {
    const recent = recentDate();
    mockReadFile.mockResolvedValueOnce(
      `## Active Commitments\n\n### Build second-brain\n- **Status**: in-progress\n- **ETA**: 2026-03-01\n- **Last Update**: ${recent}\n\n### Write docs\n- **Status**: pending\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("active");
    expect(body).toHaveProperty("recentlyCompleted");

    // Both are active (status != "done")
    expect(body.active).toHaveLength(2);
    expect(body.active[0]).toMatchObject({
      title: "Build second-brain",
      status: "in-progress",
      eta: "2026-03-01",
    });
    expect(body.active[1]).toMatchObject({
      title: "Write docs",
      status: "pending",
    });
    expect(body.recentlyCompleted).toHaveLength(0);
  });

  it("moves a done item with recent lastUpdate into recentlyCompleted", async () => {
    const recent = recentDate();
    mockReadFile.mockResolvedValueOnce(
      `### Ship v1\n- **Status**: done\n- **Last Update**: ${recent}\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.active).toHaveLength(0);
    expect(body.recentlyCompleted).toHaveLength(1);
    expect(body.recentlyCompleted[0]).toMatchObject({
      title: "Ship v1",
      status: "done",
      lastUpdate: recent,
    });
  });

  it("does not include a done item with an old lastUpdate in recentlyCompleted", async () => {
    const old = oldDate();
    mockReadFile.mockResolvedValueOnce(
      `### Old task\n- **Status**: done\n- **Last Update**: ${old}\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.active).toHaveLength(0);
    expect(body.recentlyCompleted).toHaveLength(0);
  });

  it("skips known section headers (Active Commitments, Shipped Features Archive, etc.)", async () => {
    mockReadFile.mockResolvedValueOnce(
      `## Active Commitments\n## Recently Completed\n## Shipped Features Archive\n## Format\n### Real Task\n- **Status**: pending\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    // Only "Real Task" should survive; section headers should be filtered out
    expect(body.active).toHaveLength(1);
    expect(body.active[0].title).toBe("Real Task");
  });

  it("handles missing lastUpdate on done item (not included in recentlyCompleted)", async () => {
    mockReadFile.mockResolvedValueOnce(
      `### No update task\n- **Status**: done\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.active).toHaveLength(0);
    expect(body.recentlyCompleted).toHaveLength(0);
  });

  it("strips task meta HTML comments from commitment titles", async () => {
    mockReadFile.mockResolvedValueOnce(
      `### Task with meta <!-- sb:task {"id":"abc123","createdAt":"2026-01-01T00:00:00.000Z"} -->\n- **Status**: pending\n`
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.active[0].title).toBe("Task with meta");
    expect(body.active[0].title).not.toContain("sb:task");
  });

  it("returns 500 when an unexpected read error occurs", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("disk failure"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });

  it("returns an empty active and recentlyCompleted array for blank content", async () => {
    mockReadFile.mockResolvedValueOnce("");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.active).toEqual([]);
    expect(body.recentlyCompleted).toEqual([]);
  });
});
