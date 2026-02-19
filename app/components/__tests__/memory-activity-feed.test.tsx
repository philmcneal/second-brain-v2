import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryActivityFeed } from "@/app/components/memory-activity-feed";

const MOCK_FILES = [
  {
    name: "2026-02-19.md",
    path: "/home/toilet/clawd/memory/2026-02-19.md",
    size: 512,
    modifiedAt: new Date("2026-02-19T10:00:00.000Z").toISOString(),
    preview: "Today was productive",
  },
  {
    name: "2026-02-18.md",
    path: "/home/toilet/clawd/memory/2026-02-18.md",
    size: 256,
    modifiedAt: new Date("2026-02-18T09:00:00.000Z").toISOString(),
    preview: "Shipped a feature",
  },
];

function mockFetchSuccess(files = MOCK_FILES) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ files }),
  });
}

describe("MemoryActivityFeed", () => {
  it("shows a loading spinner on initial mount", () => {
    // Never resolves — keeps the component in loading state
    global.fetch = vi.fn(() => new Promise(() => {}));

    render(<MemoryActivityFeed pollInterval={60_000} />);

    expect(screen.getByLabelText("Loading memory files")).toBeInTheDocument();
  });

  it("renders memory files after successful fetch", async () => {
    mockFetchSuccess();

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByText("2026-02-19.md"));

    expect(screen.getByText("2026-02-19.md")).toBeInTheDocument();
    expect(screen.getByText("2026-02-18.md")).toBeInTheDocument();
    expect(screen.getByText("Today was productive")).toBeInTheDocument();
    expect(screen.getByText("Shipped a feature")).toBeInTheDocument();
  });

  it("shows the LIVE badge", async () => {
    mockFetchSuccess();

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByText("LIVE"));
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows empty state when no files returned", async () => {
    mockFetchSuccess([]);

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByText("No memory files found"));
    expect(screen.getByText(/Files written to/)).toBeInTheDocument();
  });

  it("shows error state on API error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to read memory files" }),
    });

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByRole("alert"));
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to read memory files");
  });

  it("shows error state on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByRole("alert"));
    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });

  it("calls onOpenFile callback when a file is clicked", async () => {
    mockFetchSuccess();
    const onOpenFile = vi.fn();
    const user = userEvent.setup();

    render(<MemoryActivityFeed pollInterval={60_000} onOpenFile={onOpenFile} />);

    await waitFor(() => screen.getByText("2026-02-19.md"));
    await user.click(screen.getByRole("button", { name: /open 2026-02-19\.md/i }));

    expect(onOpenFile).toHaveBeenCalledWith("/home/toilet/clawd/memory/2026-02-19.md");
  });

  it("shows footer help text when files are present", async () => {
    mockFetchSuccess();

    render(<MemoryActivityFeed pollInterval={60_000} />);

    await waitFor(() => screen.getByText(/auto-refreshes every 60s/i));
  });

  describe("polling and cleanup", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("polls on interval and updates the list", async () => {
      const secondBatch = [
        {
          name: "2026-02-19-evening.md",
          path: "/home/toilet/clawd/memory/2026-02-19-evening.md",
          size: 128,
          modifiedAt: new Date("2026-02-19T20:00:00.000Z").toISOString(),
          preview: "Evening notes",
        },
        ...MOCK_FILES,
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: MOCK_FILES }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ files: secondBatch }),
        });

      render(<MemoryActivityFeed pollInterval={5_000} />);

      // Flush the initial fetch promise microtasks
      await act(() => vi.advanceTimersByTimeAsync(0));

      expect(screen.getByText("2026-02-19.md")).toBeInTheDocument();
      expect(screen.queryByText("2026-02-19-evening.md")).not.toBeInTheDocument();

      // Advance past the poll interval — fires the setInterval callback and flushes the resulting fetch
      await act(() => vi.advanceTimersByTimeAsync(5_001));

      // At this point the DOM should be updated — no waitFor needed since act flushed everything
      expect(screen.getByText("2026-02-19-evening.md")).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10_000);

    it("cleans up interval on unmount — no further fetches after unmount", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ files: MOCK_FILES }),
      });

      const { unmount } = render(<MemoryActivityFeed pollInterval={5_000} />);

      // Flush initial fetch
      await act(() => vi.advanceTimersByTimeAsync(0));
      expect(screen.getByText("2026-02-19.md")).toBeInTheDocument();

      const fetchCountBeforeUnmount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      unmount();

      // Advance well past the interval — no extra fetches should occur
      await act(() => vi.advanceTimersByTimeAsync(30_000));

      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
        fetchCountBeforeUnmount,
      );
    });
  });
});
