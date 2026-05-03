import { CitationBuilder } from "../citation-builder";
import type { SearchResult } from "../../memory/retrieval";

describe("CitationBuilder", () => {
  it("builds local brain citations from search results", () => {
    const results: SearchResult[] = [
      {
        file: "overview.md",
        preview: "Project summary",
        score: 10,
        line: 4,
        matches: ["project"],
        citation: {
          path: "overview.md",
          line: 4,
          label: "overview.md:4",
        },
      },
    ];

    const citations = new CitationBuilder().build(results);

    expect(citations).toEqual([
      {
        id: "cite-1",
        file: "overview.md",
        line: 4,
        preview: "Project summary",
        label: "overview.md:4",
        url: "brain://overview.md#L4",
      },
    ]);
  });

  it("formats citations as markdown and inline references", () => {
    const builder = new CitationBuilder();
    const citations = builder.build([
      {
        file: "intent.md",
        preview: "The problem and goals",
        score: 8,
        matches: ["goals"],
        citation: {
          path: "intent.md",
          label: "intent.md",
        },
      },
    ]);

    expect(builder.formatAsMarkdown(citations)).toContain("[intent.md](brain://intent.md)");
    expect(builder.formatAsInlineReferences(citations)).toBe("[1]");
  });
});
