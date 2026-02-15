import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { HydrationGate } from "@/app/components/hydration-gate";
import { useDocumentsStore } from "@/app/stores/documents";
import { useMemoriesStore } from "@/app/stores/memories";
import { useTasksStore } from "@/app/stores/tasks";

describe("HydrationGate", () => {
  beforeEach(() => {
    useMemoriesStore.setState(useMemoriesStore.getInitialState(), true);
    useDocumentsStore.setState(useDocumentsStore.getInitialState(), true);
    useTasksStore.setState(useTasksStore.getInitialState(), true);
  });

  it("does not render children before all stores hydrate", () => {
    render(
      <HydrationGate>
        <p>Visible Content</p>
      </HydrationGate>,
    );

    expect(screen.queryByText("Visible Content")).not.toBeInTheDocument();
  });

  it("renders children after all stores hydrate", () => {
    useMemoriesStore.getState().setHasHydrated(true);
    useDocumentsStore.getState().setHasHydrated(true);
    useTasksStore.getState().setHasHydrated(true);

    render(
      <HydrationGate>
        <p>Visible Content</p>
      </HydrationGate>,
    );

    expect(screen.getByText("Visible Content")).toBeInTheDocument();
  });
});
