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

describe("GET /api/mission-control/slash-commands", () => {
  it("returns structured command entries parsed from TODO.md", async () => {
    mockReadFile.mockResolvedValueOnce(
      "## Ideas\n- [ ] /feature Add notifications\n- [ ] /bug Fix login crash\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(body.commands).toHaveLength(2);

    expect(body.commands[0]).toMatchObject({
      command: "feature",
      text: "- [ ] /feature Add notifications",
      section: "Ideas",
    });

    expect(body.commands[1]).toMatchObject({
      command: "bug",
      text: "- [ ] /bug Fix login crash",
      section: "Ideas",
    });
  });

  it("returns empty commands array when TODO.md does not exist", async () => {
    const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    mockReadFile.mockRejectedValueOnce(err);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.commands).toEqual([]);
  });

  it("returns 500 when an unexpected read error occurs", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("disk failure"));

    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns empty commands array when TODO.md has no slash commands", async () => {
    mockReadFile.mockResolvedValueOnce(
      "## High Priority\n- [ ] Fix taxes\n- [ ] Deploy staging\n"
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.commands).toEqual([]);
  });

  it("includes lineIndex in each command entry", async () => {
    mockReadFile.mockResolvedValueOnce("/feature First thing\n/bug Second thing\n");

    const response = await GET();
    const body = await response.json();

    expect(body.commands[0].lineIndex).toBe(0);
    expect(body.commands[1].lineIndex).toBe(1);
  });
});
