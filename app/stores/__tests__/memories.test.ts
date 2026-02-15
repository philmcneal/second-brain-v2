import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMemoriesStore } from "@/app/stores/memories";

describe("useMemoriesStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T10:00:00.000Z"));
    useMemoriesStore.setState(useMemoriesStore.getInitialState(), true);
  });

  it("adds, updates, and deletes a memory", () => {
    const uuidSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("memory-test-id");

    const id = useMemoriesStore.getState().addMemory({
      title: "New Memory",
      content: "Capture this",
      tags: ["tag-a"],
    });

    expect(id).toBe("memory-test-id");

    let memory = useMemoriesStore.getState().memories.find((item) => item.id === id);
    expect(memory).toBeDefined();
    expect(memory?.title).toBe("New Memory");

    vi.setSystemTime(new Date("2026-02-15T10:30:00.000Z"));
    useMemoriesStore.getState().updateMemory(id, { title: "Updated" });

    memory = useMemoriesStore.getState().memories.find((item) => item.id === id);
    expect(memory?.title).toBe("Updated");
    expect(memory?.updatedAt).toBe("2026-02-15T10:30:00.000Z");

    useMemoriesStore.getState().deleteMemory(id);
    expect(useMemoriesStore.getState().memories.some((item) => item.id === id)).toBe(false);

    uuidSpy.mockRestore();
  });

  it("replaces memories from imported payload", () => {
    useMemoriesStore.getState().replaceMemories([{ id: "m-import", title: "Imported", content: "Body", tags: ["x"] }]);

    expect(useMemoriesStore.getState().memories).toHaveLength(1);
    expect(useMemoriesStore.getState().memories[0]?.title).toBe("Imported");
  });
});
