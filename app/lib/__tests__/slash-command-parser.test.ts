import { describe, expect, it } from "vitest";

import { parseSlashCommands } from "@/app/lib/slash-command-parser";

describe("parseSlashCommands", () => {
  it("returns empty array for empty string", () => {
    expect(parseSlashCommands("")).toEqual([]);
  });

  it("returns empty array when no slash commands are present", () => {
    const content = "## 🔴 High Priority\n- [ ] Fix the login bug\n- [ ] Deploy to staging\n";
    expect(parseSlashCommands(content)).toEqual([]);
  });

  it("detects a bare /feature command", () => {
    const content = "- [ ] /feature Add dark mode";
    const results = parseSlashCommands(content);
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("feature");
    expect(results[0].text).toBe("- [ ] /feature Add dark mode");
    expect(results[0].section).toBeNull();
    expect(results[0].lineIndex).toBe(0);
  });

  it("detects a bare /bug command", () => {
    const results = parseSlashCommands("/bug Login page crashes on Safari");
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("bug");
  });

  it("detects a bare /marketing command", () => {
    const results = parseSlashCommands("/marketing Write launch blog post");
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("marketing");
  });

  it("detects bracketed [/feature] form", () => {
    const results = parseSlashCommands("[/feature] Offline sync support");
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("feature");
  });

  it("detects bracketed [/bug] form", () => {
    const results = parseSlashCommands("[/bug] Crash on empty input");
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("bug");
  });

  it("detects bracketed [/marketing] form", () => {
    const results = parseSlashCommands("[/marketing] Product Hunt post");
    expect(results).toHaveLength(1);
    expect(results[0].command).toBe("marketing");
  });

  it("is case-insensitive (/Feature, /BUG, /MARKETING)", () => {
    const content = "/Feature A\n/BUG B\n/MARKETING C";
    const results = parseSlashCommands(content);
    expect(results.map((r) => r.command)).toEqual(["feature", "bug", "marketing"]);
  });

  it("attaches nearest ## section heading as context", () => {
    const content = [
      "## Ideas",
      "- [ ] /feature Notifications",
    ].join("\n");
    const results = parseSlashCommands(content);
    expect(results).toHaveLength(1);
    expect(results[0].section).toBe("Ideas");
  });

  it("updates section context across multiple headings", () => {
    const content = [
      "## Alpha",
      "/feature First",
      "## Beta",
      "/bug Second",
    ].join("\n");
    const results = parseSlashCommands(content);
    expect(results[0].section).toBe("Alpha");
    expect(results[1].section).toBe("Beta");
  });

  it("reports null section when no ## heading precedes the command", () => {
    const content = "# Top-level heading\n/feature No section yet";
    const results = parseSlashCommands(content);
    expect(results[0].section).toBeNull();
  });

  it("does not emit section headings as command entries", () => {
    const content = "## /feature This is a heading, not a command";
    // ## lines update section context but are never emitted as entries
    expect(parseSlashCommands(content)).toHaveLength(0);
  });

  it("records correct 0-based lineIndex", () => {
    const content = "line 0\nline 1\n/feature on line 2";
    const results = parseSlashCommands(content);
    expect(results[0].lineIndex).toBe(2);
  });

  it("handles multiple commands on separate lines", () => {
    const content = "/feature A\n/bug B\n/marketing C";
    const results = parseSlashCommands(content);
    expect(results).toHaveLength(3);
  });

  it("trims leading/trailing whitespace from text field", () => {
    const content = "   /feature   lots of spaces   ";
    const results = parseSlashCommands(content);
    expect(results[0].text).toBe("/feature   lots of spaces");
  });
});
