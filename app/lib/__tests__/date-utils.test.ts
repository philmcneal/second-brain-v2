import { describe, expect, it } from "vitest";

import { normalizeDate } from "@/app/lib/date-utils";

describe("normalizeDate", () => {
  it("returns undefined for undefined input", () => {
    expect(normalizeDate(undefined)).toBeUndefined();
  });

  it("returns undefined for null input", () => {
    expect(normalizeDate(null)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(normalizeDate("")).toBeUndefined();
  });

  it("returns fallback when value is undefined and fallback provided", () => {
    const fallback = "2026-01-01T00:00:00.000Z";
    expect(normalizeDate(undefined, fallback)).toBe(fallback);
  });

  it("returns fallback when value is null and fallback provided", () => {
    const fallback = "2026-01-01T00:00:00.000Z";
    expect(normalizeDate(null, fallback)).toBe(fallback);
  });

  it("parses a valid ISO string to ISO", () => {
    const result = normalizeDate("2026-03-15T10:00:00.000Z");
    expect(result).toBe("2026-03-15T10:00:00.000Z");
  });

  it("parses a date-only string to an ISO string", () => {
    const result = normalizeDate("2026-03-15");
    expect(result).toMatch(/^2026-03-15T/);
  });

  it("returns undefined for an unparseable string", () => {
    expect(normalizeDate("not-a-date")).toBeUndefined();
  });

  it("returns fallback for an unparseable string when fallback provided", () => {
    const fallback = "2026-01-01T00:00:00.000Z";
    expect(normalizeDate("not-a-date", fallback)).toBe(fallback);
  });

  it("converts a Date instance to ISO string", () => {
    const date = new Date("2026-06-01T12:00:00.000Z");
    const result = normalizeDate(date);
    expect(result).toBe("2026-06-01T12:00:00.000Z");
  });

  it("handles numeric timestamp-like strings gracefully (valid JS Date input)", () => {
    // "1234567890000" is a valid JS Date constructor arg
    const result = normalizeDate("1234567890000");
    // Should not throw; result is either an ISO or undefined
    expect(typeof result === "string" || result === undefined).toBe(true);
  });
});
