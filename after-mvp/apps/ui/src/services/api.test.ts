import { afterEach, describe, expect, it, vi } from "vitest";

import { fallbackEvents, fallbackProject } from "@/data/mock-data";
import { apiService } from "@/services/api";

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as Response;

describe("apiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads project status from the backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          data: {
            projectName: "Live After",
            status: "active",
            summary: "Loaded from Project Brain",
            stats: { decisions: 2, changes: 5, journeyEntries: 8 },
          },
        }),
      ),
    );

    const project = await apiService.getProject();

    expect(project.name).toBe("Live After");
    expect(project.stats.decisions).toBe(2);
    expect(project.stats.changes).toBe(5);
    expect(project.stats.captures).toBe(8);
  });

  it("falls back to local project data when status loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(apiService.getProject()).resolves.toEqual(fallbackProject);
  });

  it("loads events and falls back when needed", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ success: true, data: { events: [fallbackEvents[0]] } }),
        )
        .mockRejectedValueOnce(new Error("offline")),
    );

    await expect(apiService.getEvents()).resolves.toEqual([fallbackEvents[0]]);
    await expect(apiService.getEvents()).resolves.toEqual(fallbackEvents);
  });

  it("searches backend results and local fallback results", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            results: [
              {
                file: "brain.md",
                preview: "privacy",
                score: 2,
                line: 4,
                matches: ["privacy"],
                citation: { path: "brain.md", line: 4, label: "brain.md:4" },
              },
            ],
          },
        }),
      )
      .mockRejectedValueOnce(new Error("offline"));

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await expect(apiService.searchBrain("privacy")).resolves.toEqual([
      {
        file: "brain.md",
        preview: "privacy",
        score: 2,
        line: 4,
        matches: ["privacy"],
        citation: { path: "brain.md", line: 4, label: "brain.md:4" },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/api/bob/search?q=privacy", undefined);
    await expect(apiService.searchBrain("dashboard")).resolves.toHaveLength(1);
    await expect(apiService.searchBrain("")).resolves.toEqual([]);
  });

  it("returns generated README content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ data: { content: "# After" } })),
    );

    await expect(apiService.generateReadme()).resolves.toBe("# After");
  });
});
