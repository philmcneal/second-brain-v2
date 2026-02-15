import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/app/components/command-palette";
import { useDocumentsStore } from "@/app/stores/documents";
import { useMemoriesStore } from "@/app/stores/memories";
import { useTasksStore } from "@/app/stores/tasks";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    useMemoriesStore.setState(useMemoriesStore.getInitialState(), true);
    useDocumentsStore.setState(useDocumentsStore.getInitialState(), true);
    useTasksStore.setState(useTasksStore.getInitialState(), true);

    useMemoriesStore.setState({
      hasHydrated: true,
      memories: [
        {
          id: "m-10",
          title: "Deep Work Notes",
          content: "Focus blocks and task batching",
          tags: ["focus"],
          createdAt: "2026-02-10T10:00:00.000Z",
          updatedAt: "2026-02-12T10:00:00.000Z",
        },
      ],
    });

    useTasksStore.setState({
      hasHydrated: true,
      tasks: [
        {
          id: "t-10",
          title: "Prepare Demo",
          description: "Record and upload walkthrough",
          status: "todo",
          priority: "medium",
          tags: ["launch"],
          createdAt: "2026-02-13T10:00:00.000Z",
        },
      ],
    });

    useDocumentsStore.setState({
      hasHydrated: true,
      documents: [
        {
          id: "d-10",
          name: "Architecture",
          path: "notes/architecture.md",
          content: "System design",
          createdAt: "2026-02-11T10:00:00.000Z",
          updatedAt: "2026-02-11T10:00:00.000Z",
        },
      ],
    });
  });

  it("opens and filters search results", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.click(screen.getByRole("button", { name: "Press Cmd/Ctrl + K" }));
    expect(screen.getByText("Search Everything")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Find notes, tasks, docs...");
    await user.type(input, "demo");

    expect(screen.getByText("Prepare Demo")).toBeInTheDocument();
    expect(screen.queryByText("Deep Work Notes")).not.toBeInTheDocument();
  });
});
