export function normalizeDate(value: unknown, fallback?: string): string | undefined {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
}
