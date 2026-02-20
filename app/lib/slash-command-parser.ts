import type { SlashCommandEntry } from "@/app/lib/types";

// Matches /feature, /bug, /marketing — optionally bracket-wrapped: [/feature]
// Case-insensitive; group 1 captures the command name.
const COMMAND_RE = /(?:\[)?\/(feature|bug|marketing)(?:\])?/i;

/**
 * Scans markdown content line-by-line and returns every line that contains a
 * slash command directive (`/feature`, `/bug`, `/marketing`, or bracketed forms
 * like `[/feature]`).
 *
 * Section context is tracked by following the nearest `##` heading above each
 * matched line. Section headings are never emitted as command entries.
 */
export function parseSlashCommands(content: string): SlashCommandEntry[] {
  const lines = content.split("\n");
  const results: SlashCommandEntry[] = [];
  let currentSection: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track nearest ## heading as section context (consume line, don't emit)
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    const commandMatch = line.match(COMMAND_RE);
    if (commandMatch) {
      results.push({
        command: commandMatch[1].toLowerCase() as SlashCommandEntry["command"],
        text: line.trim(),
        section: currentSection,
        lineIndex: i,
      });
    }
  }

  return results;
}
