import { BaseGenerator, type GeneratedOutput } from "./base-generator";
import { OutputTemplateEngine } from "./template-engine";
import type { Citation } from "@after/core";

/**
 * Changelog Generator
 *
 * Generates a CHANGELOG.md from Project Brain changelog entries.
 */
export class ChangelogGenerator extends BaseGenerator {
  private readonly templateEngine = new OutputTemplateEngine();

  getGeneratorName(): string {
    return "Changelog Generator";
  }

  async generate(): Promise<GeneratedOutput> {
    const citations: Citation[] = [];

    const changelog = await this.brainReader.readChangelog();
    const overview = await this.brainReader.readOverview();

    citations.push({
      id: "cite-1",
      file: "changelog.md",
      preview: `${changelog.length} change entries`,
      label: "changelog.md",
    });

    const grouped = changelog.reduce(
      (acc, entry) => {
        const date = entry.date.split("T")[0] || "unknown";
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      },
      {} as Record<string, typeof changelog>,
    );
    const renderedEntries: string[] = [];

    for (const date of Object.keys(grouped).sort().reverse()) {
      renderedEntries.push(`## ${date}\n`);

      const entries = grouped[date];
      if (!entries) continue;

      for (const entry of entries) {
        renderedEntries.push(`### ${this.getChangeLabel(entry.type)}: ${entry.summary}\n`);

        if (entry.details) {
          renderedEntries.push(`${entry.details}\n`);
        }

        if (entry.sources.length > 0) {
          renderedEntries.push(
            `**Files:** ${entry.sources.map((source) => source.path).join(", ")}\n`,
          );
        }
      }
    }

    let content = this.templateEngine.render("changelog", {
      projectName: overview.projectName,
      entries: renderedEntries.join("\n"),
    });
    content += this.formatCitations(citations);
    content = this.addFooter(content);

    return {
      content,
      citations,
      metadata: this.createMetadata(),
    };
  }

  private getChangeLabel(type: string): string {
    const labelMap: Record<string, string> = {
      added: "Added",
      changed: "Changed",
      fixed: "Fixed",
      removed: "Removed",
      documented: "Documented",
      security: "Security",
      deprecated: "Deprecated",
    };

    return labelMap[type] || "Changed";
  }
}

// Made with Bob
