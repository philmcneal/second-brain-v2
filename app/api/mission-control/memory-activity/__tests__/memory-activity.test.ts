import { describe, expect, it } from "vitest";

import { extractPreview } from "../route";

describe("extractPreview", () => {
  it("skips heading line and returns first body content", () => {
    const content = "# Daily Log\n\nDid some work today.";
    expect(extractPreview(content)).toBe("Did some work today.");
  });

  it("returns empty string when file only contains a heading", () => {
    expect(extractPreview("# My Heading")).toBe("");
  });

  it("skips multiple heading lines (##, ###) to reach body content", () => {
    const content = "## Section\n### Sub\nContent here";
    expect(extractPreview(content)).toBe("Content here");
  });

  it("truncates to maxLen with ellipsis character", () => {
    const long = "a".repeat(200);
    const result = extractPreview(long, 50);
    expect(result).toHaveLength(51); // 50 chars + ellipsis char
    expect(result.endsWith("…")).toBe(true);
  });

  it("does not append ellipsis when text fits within maxLen", () => {
    const short = "Short note.";
    expect(extractPreview(short, 120)).toBe("Short note.");
    expect(extractPreview(short, 120).endsWith("…")).toBe(false);
  });

  it("skips blank lines to find first content", () => {
    const content = "\n\n\nActual content starts here";
    expect(extractPreview(content)).toBe("Actual content starts here");
  });

  it("returns empty string for blank/whitespace-only content", () => {
    expect(extractPreview("")).toBe("");
    expect(extractPreview("   \n  \n")).toBe("");
  });

  it("returns empty string for content with only heading markers", () => {
    expect(extractPreview("# Only a title\n## Another heading")).toBe("");
  });

  it("preserves content lines that happen to contain # mid-string", () => {
    const content = "Issue #42 resolved";
    expect(extractPreview(content)).toBe("Issue #42 resolved");
  });
});
