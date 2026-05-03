import type { SearchResult } from "../memory/retrieval";

/**
 * Citation for a chat response
 */
export interface Citation {
  id: string;
  file: string;
  line?: number;
  preview: string;
  label: string;
  url?: string;
}

/**
 * Citation Builder
 * 
 * Builds citations from search results to provide provenance
 * for chat responses and generated outputs.
 */
export class CitationBuilder {
  /**
   * Build citations from search results
   */
  build(results: SearchResult[]): Citation[] {
    return results.map((result, index) => ({
      id: `cite-${index + 1}`,
      file: result.file,
      line: result.line,
      preview: result.preview,
      label: result.citation.label,
      url: this.buildUrl(result),
    }));
  }

  /**
   * Build a URL for a citation (for local file links)
   */
  private buildUrl(result: SearchResult): string {
    const base = `brain://${result.file}`;
    return result.line ? `${base}#L${result.line}` : base;
  }

  /**
   * Format citations as markdown footnotes
   */
  formatAsMarkdown(citations: Citation[]): string {
    if (citations.length === 0) {
      return "";
    }

    const lines = ["\n\n## Sources\n"];

    for (const citation of citations) {
      lines.push(`- [${citation.label}](${citation.url})`);
      if (citation.preview) {
        lines.push(`  > ${citation.preview.slice(0, 100)}...`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Format citations as inline references [1], [2], etc.
   */
  formatAsInlineReferences(citations: Citation[]): string {
    return citations.map((c) => `[${c.id.replace("cite-", "")}]`).join(" ");
  }
}

// Made with Bob
