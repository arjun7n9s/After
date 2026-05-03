import { BobShellAdapter } from "../bob-shell-adapter";
import type { SearchResult } from "../../memory/retrieval";

describe("BobShellAdapter", () => {
  let adapter: BobShellAdapter;

  beforeEach(() => {
    adapter = new BobShellAdapter({
      shellPath: "bob",
      timeout: 5000,
    });
  });

  describe("formatContext", () => {
    it("should format search results into context", () => {
      const searchResults: SearchResult[] = [
        {
          file: "overview.md",
          preview: "This is a test project for After MVP",
          score: 10.5,
          line: 5,
          matches: ["test", "project"],
          citation: {
            path: "overview.md",
            line: 5,
            label: "overview.md:5",
          },
        },
      ];

      const context = {
        query: "What is this project about?",
        searchResults,
        projectPath: "/test/project",
      };

      // Access private method through type assertion for testing
      const formatted = (adapter as unknown as { formatContext: (ctx: typeof context) => string }).formatContext(context);

      expect(formatted).toContain("# Project Brain Context");
      expect(formatted).toContain("overview.md");
      expect(formatted).toContain("Score: 10.50");
      expect(formatted).toContain("Line: 5");
      expect(formatted).toContain("This is a test project for After MVP");
      expect(formatted).toContain("Matched: test, project");
    });

    it("should handle empty search results", () => {
      const context = {
        query: "test query",
        searchResults: [],
        projectPath: "/test/project",
      };

      const formatted = (adapter as unknown as { formatContext: (ctx: typeof context) => string }).formatContext(context);

      expect(formatted).not.toContain("# Project Brain Context");
    });

    it("should truncate long context", () => {
      const longPreview = "a".repeat(10000);
      const searchResults: SearchResult[] = [
        {
          file: "test.md",
          preview: longPreview,
          score: 5,
          matches: [],
          citation: {
            path: "test.md",
            label: "test.md",
          },
        },
      ];

      const context = {
        query: "test",
        searchResults,
        projectPath: "/test",
      };

      const formatted = (adapter as unknown as { formatContext: (ctx: typeof context) => string }).formatContext(context);

      expect(formatted.length).toBeLessThanOrEqual(8100); // maxContextLength + buffer
      expect(formatted).toContain("[Context truncated...]");
    });

    it("should include file references", () => {
      const context = {
        query: "test",
        searchResults: [],
        projectPath: "/test",
        files: ["src/index.ts", "src/utils.ts"],
      };

      const formatted = (adapter as unknown as { formatContext: (ctx: typeof context) => string }).formatContext(context);

      expect(formatted).toContain("# Referenced Files");
      expect(formatted).toContain("src/index.ts");
      expect(formatted).toContain("src/utils.ts");
    });
  });

  describe("isAvailable", () => {
    it("should return false when bob shell is not available", async () => {
      const unavailableAdapter = new BobShellAdapter({
        shellPath: "nonexistent-bob-shell",
        timeout: 1000,
      });

      const available = await unavailableAdapter.isAvailable();

      expect(available).toBe(false);
    });

  });
});

// Made with Bob
