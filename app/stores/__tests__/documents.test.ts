import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDocumentsStore } from "@/app/stores/documents";

describe("useDocumentsStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T12:00:00.000Z"));
    useDocumentsStore.setState(useDocumentsStore.getInitialState(), true);
  });

  it("adds, updates, and deletes documents", () => {
    const uuidSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("doc-test-id");

    useDocumentsStore.getState().addDocument({
      name: "Plan",
      path: "notes/plan.md",
      content: "hello",
    });

    let document = useDocumentsStore.getState().documents.find((item) => item.id === "doc-test-id");
    expect(document).toBeDefined();
    expect(document?.name).toBe("Plan");

    vi.setSystemTime(new Date("2026-02-15T12:15:00.000Z"));
    useDocumentsStore.getState().updateDocument("doc-test-id", { name: "Updated Plan" });

    document = useDocumentsStore.getState().documents.find((item) => item.id === "doc-test-id");
    expect(document?.name).toBe("Updated Plan");
    expect(document?.updatedAt).toBe("2026-02-15T12:15:00.000Z");

    useDocumentsStore.getState().deleteDocument("doc-test-id");
    expect(useDocumentsStore.getState().documents.some((item) => item.id === "doc-test-id")).toBe(false);

    uuidSpy.mockRestore();
  });

  it("replaces documents from imported payload", () => {
    useDocumentsStore.getState().replaceDocuments([{ id: "d-import", name: "Imported Doc", path: "notes/imported.md", content: "hi" }]);

    expect(useDocumentsStore.getState().documents).toHaveLength(1);
    expect(useDocumentsStore.getState().documents[0]?.name).toBe("Imported Doc");
  });
});
