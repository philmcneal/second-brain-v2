import { NextResponse } from "next/server";
import { promises as fs } from "fs";

import { stripTaskMeta } from "@/app/lib/task-markdown";

const COMMITMENTS_PATH = "/home/toilet/clawd/COMMITMENTS.md";

interface Commitment {
  title: string;
  status: "pending" | "in-progress" | "blocked" | "done";
  eta?: string;
  lastUpdate?: string;
  description?: string;
}

export async function GET() {
  try {
    const content = await fs.readFile(COMMITMENTS_PATH, "utf-8");
    const lines = content.split("\n");

    const commitments: Commitment[] = [];
    let currentCommitment: Commitment | null = null;
    let inCodeBlock = false;

    for (const line of lines) {
      // Track code blocks to ignore content inside them
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      // Match commitment headers like "### Task Name" or "## Task Name"
      // Skip section headers (like "## Active Commitments", "### Shipped Features Archive")
      const headerMatch = line.match(/^#{2,3}\s+(.+)/);
      if (headerMatch) {
        const title = headerMatch[1];
        // Skip section headers that aren't actual tasks
        const sectionHeaders = [
          "Active Commitments",
          "Recently Completed",
          "Shipped Features Archive",
          "Format",
        ];
        if (sectionHeaders.some(h => title.includes(h))) {
          continue;
        }
        
        if (currentCommitment) {
          commitments.push(currentCommitment);
        }
        currentCommitment = {
          title: stripTaskMeta(title),
          status: "pending",
        };
        continue;
      }

      if (currentCommitment) {
        // Match status line like "**Status:** in-progress" or "Status: pending"
        const statusMatch = line.match(/\*?\*?Status\*?\*?:\s*(pending|in-progress|blocked|done)/i);
        if (statusMatch) {
          currentCommitment.status = statusMatch[1].toLowerCase() as Commitment["status"];
          continue;
        }

        // Match ETA line like "**ETA:** 2026-02-20" or "ETA: Friday"
        const etaMatch = line.match(/\*?\*?ETA\*?\*?:\s*(.+)/i);
        if (etaMatch) {
          currentCommitment.eta = etaMatch[1].trim();
          continue;
        }

        // Match last update like "**Last Update:** 2026-02-16"
        const updateMatch = line.match(/\*?\*?Last Update\*?\*?:\s*(.+)/i);
        if (updateMatch) {
          currentCommitment.lastUpdate = updateMatch[1].trim();
          continue;
        }

        // Add description from regular text (not headers, not empty)
        if (line.trim() && !line.startsWith("#") && !line.match(/^\*?\*?(Status|ETA|Last Update)\*?\*?:/i)) {
          if (!currentCommitment.description) {
            currentCommitment.description = line.trim();
          }
        }
      }
    }

    if (currentCommitment) {
      commitments.push(currentCommitment);
    }

    // Separate active and recently completed
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const active = commitments.filter(c => c.status !== "done");
    const recentlyCompleted = commitments.filter(c => {
      if (c.status !== "done") return false;
      if (!c.lastUpdate) return false;

      try {
        const updateDate = new Date(c.lastUpdate);
        return updateDate >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    return NextResponse.json({ active, recentlyCompleted });
  } catch (error) {
    console.error("Error reading COMMITMENTS.md:", error);
    return NextResponse.json(
      { error: "Failed to read COMMITMENTS.md" },
      { status: 500 }
    );
  }
}
