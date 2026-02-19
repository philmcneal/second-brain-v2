import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import type { ConfigSuggestion } from "@/app/lib/types";

const CONFIG_DIR = "/home/toilet/clawd";
const CONFIG_FILES = [
  { name: "SOUL.md", description: "Personality and behavior configuration" },
  { name: "TOOLS.md", description: "Tool preferences and local notes" },
  { name: "MEMORY.md", description: "Curated long-term memory" },
  { name: "AGENTS.md", description: "Workspace rules and patterns" },
  { name: "USER.md", description: "User preferences and context" },
  { name: "HEARTBEAT.md", description: "Periodic check configuration" },
];

let suggestionIdCounter = 0;
const generateId = (): string => {
  suggestionIdCounter += 1;
  return `suggestion-${Date.now()}-${suggestionIdCounter}`;
};

export async function analyzeFile(fileName: string): Promise<ConfigSuggestion[]> {
  const suggestions: ConfigSuggestion[] = [];
  const filePath = `${CONFIG_DIR}/${fileName}`;

  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const size = stats.size;

    // Check if file is empty or very small
    if (size === 0) {
      suggestions.push({
        id: generateId(),
        file: fileName,
        title: "File is empty",
        description: `${fileName} has no content. Consider adding configuration data.`,
        priority: "high",
      });
      return suggestions;
    }

    if (size < 100) {
      suggestions.push({
        id: generateId(),
        file: fileName,
        title: "File is very minimal",
        description: `${fileName} is under 100 bytes. Consider expanding with more details.`,
        priority: "medium",
      });
    }

    // File-specific checks
    switch (fileName) {
      case "SOUL.md": {
        // Check for key sections
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "SOUL.md should have section headers (##) to organize content",
            priority: "medium",
          });
        }
        if (!content.toLowerCase().includes("greeting")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Consider adding greeting configuration",
            description: "SOUL.md typically includes a Greeting section for model/thinking display",
            priority: "low",
          });
        }
        if (size > 5000) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "File is quite large",
            description: `SOUL.md is ${(size / 1024).toFixed(1)}KB. Consider if all content is necessary for the core personality.`,
            priority: "low",
          });
        }
        break;
      }

      case "TOOLS.md": {
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "TOOLS.md should have section headers to organize tool categories",
            priority: "low",
          });
        }
        // Check for environment-specific notes
        if (!content.toLowerCase().includes("ssh") && !content.toLowerCase().includes("env")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Consider adding environment notes",
            description: "TOOLS.md typically documents SSH hosts, API keys, and environment-specific settings",
            priority: "low",
          });
        }
        break;
      }

      case "MEMORY.md": {
        // MEMORY.md tends to grow very large
        if (size > 20000) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "File is very large - consider archiving",
            description: `MEMORY.md is ${(size / 1024).toFixed(1)}KB. Large files can bloat context window. Consider archiving old entries.`,
            priority: "high",
          });
        } else if (size > 10000) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "File is getting large",
            description: `MEMORY.md is ${(size / 1024).toFixed(1)}KB. Consider reviewing for outdated content.`,
            priority: "medium",
          });
        }
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "MEMORY.md should have section headers for better organization",
            priority: "low",
          });
        }
        break;
      }

      case "AGENTS.md": {
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "AGENTS.md should have section headers for rules and patterns",
            priority: "medium",
          });
        }
        if (!content.toLowerCase().includes("rule") && !content.toLowerCase().includes("pattern")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Consider documenting patterns",
            description: "AGENTS.md typically documents coding patterns, rules, and best practices",
            priority: "low",
          });
        }
        break;
      }

      case "USER.md": {
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "USER.md should have section headers to organize user preferences",
            priority: "low",
          });
        }
        if (!content.toLowerCase().includes("timezone") && !content.toLowerCase().includes("time zone")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Consider adding timezone info",
            description: "USER.md typically includes timezone and communication preferences",
            priority: "low",
          });
        }
        break;
      }

      case "HEARTBEAT.md": {
        if (!content.includes("##")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Missing section headers",
            description: "HEARTBEAT.md should have section headers for different check types",
            priority: "low",
          });
        }
        if (!content.toLowerCase().includes("cron") && !content.toLowerCase().includes("check")) {
          suggestions.push({
            id: generateId(),
            file: fileName,
            title: "Consider documenting checks",
            description: "HEARTBEAT.md typically documents periodic checks and cron jobs",
            priority: "low",
          });
        }
        break;
      }
    }
  } catch {
    // File doesn't exist
    suggestions.push({
      id: generateId(),
      file: fileName,
      title: "File does not exist",
      description: `${fileName} is missing. This file is recommended for proper OpenClaw operation.`,
      priority: "high",
    });
  }

  return suggestions;
}

export async function GET() {
  try {
    const allSuggestions: ConfigSuggestion[] = [];

    for (const file of CONFIG_FILES) {
      const fileSuggestions = await analyzeFile(file.name);
      allSuggestions.push(...fileSuggestions);
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({ suggestions: allSuggestions });
  } catch (error) {
    console.error("Error analyzing config files:", error);
    return NextResponse.json(
      { error: "Failed to analyze config files" },
      { status: 500 }
    );
  }
}
