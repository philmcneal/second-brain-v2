import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigViewerModal } from "@/app/components/config-viewer-modal";
import type { ConfigFile } from "@/app/lib/types";

// Radix Dialog uses portals; render into body by default in jsdom
// react-markdown needs no extra setup for text content

const existingFile: ConfigFile = {
  name: "SOUL.md",
  path: "/home/toilet/clawd/SOUL.md",
  lastModified: new Date().toISOString(),
  size: 128,
  exists: true,
};

const missingFile: ConfigFile = {
  name: "USER.md",
  path: "/home/toilet/clawd/USER.md",
  lastModified: "",
  size: 0,
  exists: false,
};

describe("ConfigViewerModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders nothing when not open", () => {
    render(<ConfigViewerModal file={existingFile} open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows loading spinner then content for an existing file", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: "# Soul\nThis is the soul file.",
        lastModified: new Date().toISOString(),
        size: 128,
      }),
    });

    render(<ConfigViewerModal file={existingFile} open={true} onClose={() => {}} />);

    // File name appears in dialog title
    expect(screen.getByText("SOUL.md")).toBeInTheDocument();

    // Loading spinner visible initially
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

    // Rendered markdown text
    await waitFor(() => expect(screen.getByText(/This is the soul file/)).toBeInTheDocument());

    // Edit button present
    expect(screen.getByRole("button", { name: /edit file/i })).toBeInTheDocument();
  });

  it("enters edit mode and saves successfully", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: "# Soul",
          lastModified: new Date().toISOString(),
          size: 64,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          lastModified: new Date().toISOString(),
          size: 80,
        }),
      });

    const onSaved = vi.fn();

    render(<ConfigViewerModal file={existingFile} open={true} onClose={() => {}} onSaved={onSaved} />);

    // Wait for content
    await waitFor(() => screen.getByRole("button", { name: /edit file/i }));

    // Click Edit
    await user.click(screen.getByRole("button", { name: /edit file/i }));

    // Textarea is shown
    const textarea = screen.getByRole("textbox", { name: /edit soul\.md/i });
    expect(textarea).toBeInTheDocument();

    // Modify content
    await user.clear(textarea);
    await user.type(textarea, "# Updated Soul");

    // Click Save
    await user.click(screen.getByRole("button", { name: /save file/i }));

    // PUT was called
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(url).toContain("/api/config-files/SOUL.md");
    expect(opts.method).toBe("PUT");

    // onSaved callback invoked
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    // Saved badge appears
    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
  });

  it("shows error when save fails", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: "# Soul",
          lastModified: new Date().toISOString(),
          size: 64,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to write file" }),
      });

    render(<ConfigViewerModal file={existingFile} open={true} onClose={() => {}} />);

    await waitFor(() => screen.getByRole("button", { name: /edit file/i }));
    await user.click(screen.getByRole("button", { name: /edit file/i }));
    await user.click(screen.getByRole("button", { name: /save file/i }));

    await waitFor(() => expect(screen.getByText("Failed to write file")).toBeInTheDocument());
  });

  it("opens in edit mode for a missing file and shows create button", () => {
    global.fetch = vi.fn();

    render(<ConfigViewerModal file={missingFile} open={true} onClose={() => {}} />);

    expect(screen.getByText("USER.md")).toBeInTheDocument();
    // Missing badge
    expect(screen.getByText("Missing")).toBeInTheDocument();
    // Editor textarea visible immediately
    expect(screen.getByRole("textbox", { name: /edit user\.md/i })).toBeInTheDocument();
    // Button says "Create"
    expect(screen.getByRole("button", { name: /save file/i })).toHaveTextContent("Create");
    // Fetch was NOT called (no file to load)
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("transitions from Missing to Exists badge after successful create", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lastModified: new Date().toISOString(),
        size: 42,
      }),
    });

    const onSaved = vi.fn();

    render(<ConfigViewerModal file={missingFile} open={true} onClose={() => {}} onSaved={onSaved} />);

    // Initially shows Missing badge
    expect(screen.getByText("Missing")).toBeInTheDocument();

    // Type some content and submit
    const textarea = screen.getByRole("textbox", { name: /edit user\.md/i });
    await user.type(textarea, "# New file");
    await user.click(screen.getByRole("button", { name: /save file/i }));

    // After save: Missing badge gone, Exists badge shown, Edit button available
    await waitFor(() => expect(screen.queryByText("Missing")).not.toBeInTheDocument());
    expect(screen.getByText("Exists")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit file/i })).toBeInTheDocument();

    // onSaved callback invoked
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
