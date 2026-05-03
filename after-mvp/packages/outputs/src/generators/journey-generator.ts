import { BaseGenerator, type GeneratedOutput } from "./base-generator";
import { OutputTemplateEngine } from "./template-engine";
import type { Citation, JourneyEntry } from "@after/core";

/**
 * Journey Generator
 *
 * Generates a development journey report from Project Brain.
 */
export class JourneyGenerator extends BaseGenerator {
  private readonly templateEngine = new OutputTemplateEngine();

  getGeneratorName(): string {
    return "Journey Generator";
  }

  async generate(): Promise<GeneratedOutput> {
    const citations: Citation[] = [];

    const journey = await this.brainReader.readJourney();
    const overview = await this.brainReader.readOverview();

    citations.push({
      id: "cite-1",
      file: "journey.md",
      preview: `${journey.length} journey entries`,
      label: "journey.md",
    });

    const entries = journey
      .map((entry) => {
        const date = new Date(entry.timestamp).toLocaleString();
        const related = entry.sources.length
          ? `\n\n**Related:** ${entry.sources.map((source) => source.path).join(", ")}`
          : "";
        return `### ${this.getJourneyLabel(entry.kind)}: ${entry.title}

*${date}*

${entry.narrative}${related}

---`;
      })
      .join("\n\n");
    const summaryStats =
      journey.length > 0
        ? [
            `Total entries: ${journey.length}`,
            "",
            "**By Type:**",
            ...Object.entries(this.countJourneyKinds(journey)).map(
              ([kind, count]) => `- ${kind}: ${count}`,
            ),
          ].join("\n")
        : "";
    let content = this.templateEngine.render("journey", {
      projectName: overview.projectName,
      summary: overview.summary,
      entries,
      summaryStats,
    });
    content += this.formatCitations(citations);
    content = this.addFooter(content);

    return {
      content,
      citations,
      metadata: this.createMetadata(),
    };
  }

  private countJourneyKinds(journey: JourneyEntry[]): Record<string, number> {
    return journey.reduce(
      (acc, entry) => {
        acc[entry.kind] = (acc[entry.kind] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private getJourneyLabel(kind: string): string {
    const labelMap: Record<string, string> = {
      milestone: "Milestone",
      decision: "Decision",
      capture: "Capture",
      debugging: "Debugging",
      note: "Note",
    };

    return labelMap[kind] || "Note";
  }
}

// Made with Bob
