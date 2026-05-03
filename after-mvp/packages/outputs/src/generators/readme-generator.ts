import { BaseGenerator, type GeneratedOutput } from "./base-generator";
import { OutputTemplateEngine, renderBulletList } from "./template-engine";
import type { Citation } from "@after/core";

/**
 * README Generator
 * 
 * Generates a comprehensive README.md from Project Brain.
 */
export class ReadmeGenerator extends BaseGenerator {
  private readonly templateEngine = new OutputTemplateEngine();

  getGeneratorName(): string {
    return "README Generator";
  }

  async generate(): Promise<GeneratedOutput> {
    const citations: Citation[] = [];

    // Read Project Brain data
    const overview = await this.brainReader.readOverview();
    const intent = await this.brainReader.readIntent();
    const architecture = await this.brainReader.readArchitecture();

    // Add citations
    citations.push({
      id: "cite-1",
      file: "overview.md",
      preview: overview.summary,
      label: "overview.md",
    });

    citations.push({
      id: "cite-2",
      file: "intent.md",
      preview: intent.problem,
      label: "intent.md",
    });

    citations.push({
      id: "cite-3",
      file: "architecture.md",
      preview: architecture.overview,
      label: "architecture.md",
    });

    const techStack = [
      overview.primaryLanguage ? `- **Language:** ${overview.primaryLanguage}` : "",
      overview.frameworks.length
        ? `- **Frameworks:** ${overview.frameworks.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    const components = architecture.components
      .map((component) => {
        const technologies = component.technologies.length
          ? `\n\n**Technologies:** ${component.technologies.join(", ")}`
          : "";
        return `#### ${component.name}\n\n${component.responsibility}${technologies}`;
      })
      .join("\n\n");
    let content = this.templateEngine.render("readme", {
      projectName: overview.projectName,
      summary: overview.summary,
      status: overview.status,
      problem: intent.problem,
      goals: intent.goals.length ? renderBulletList(intent.goals) : "",
      architecture: architecture.overview,
      components,
      techStack,
      successCriteria: intent.successCriteria.length
        ? renderBulletList(intent.successCriteria)
        : "",
    });

    // Add citations
    content += this.formatCitations(citations);

    // Add footer
    content = this.addFooter(content);

    return {
      content,
      citations,
      metadata: this.createMetadata(),
    };
  }
}

// Made with Bob
