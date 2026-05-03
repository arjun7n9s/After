import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { BaseGenerator, type GeneratedOutput } from "./base-generator";
import { renderBulletList } from "./template-engine";
import type { Citation } from "@after/core";

/**
 * README Generator
 * 
 * Generates a comprehensive README.md from Project Brain.
 */
export class ReadmeGenerator extends BaseGenerator {
  getGeneratorName(): string {
    return "README Generator";
  }

  async generate(): Promise<GeneratedOutput> {
    const citations: Citation[] = [];

    // Read Project Brain data
    const overview = await this.brainReader.readOverview();
    const intent = await this.brainReader.readIntent();
    const [architecture, decisions, changelog, journey, media] = await Promise.all([
      this.brainReader.readArchitecture(),
      this.brainReader.readDecisions(),
      this.brainReader.readChangelog(),
      this.brainReader.readJourney(),
      this.brainReader.readMedia(),
    ]);

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
    ].filter(Boolean);
    const components = architecture.components
      .map((component) => {
        const technologies = component.technologies.length
          ? `\n\n**Technologies:** ${component.technologies.join(", ")}`
          : "";
        return `#### ${component.name}\n\n${component.responsibility}${technologies}`;
      })
      .join("\n\n");
    const generatedAssets = await this.listGeneratedAssets();
    const latestDecision = decisions.at(-1);
    const recentChanges = changelog.slice(-5).map((entry) => {
      const source = entry.sources[0]?.path ? ` (${entry.sources[0].path})` : "";
      return `- **${entry.type}:** ${entry.summary}${source}`;
    });
    const recentJourney = journey.slice(-5).map((entry) => {
      const source = entry.sources[0]?.path ? ` (${entry.sources[0].path})` : "";
      return `- **${entry.title}:** ${entry.narrative}${source}`;
    });
    const screenshotCount = media.filter((item) => item.type === "screenshot").length;

    const sections = [
      `# ${overview.projectName}`,
      overview.summary,
      `**Status:** ${overview.status}`,
      overview.repositoryPath ? `**Repository:** \`${overview.repositoryPath}\`` : "",
      intent.problem ? ["## Problem", intent.problem].join("\n\n") : "",
      intent.goals.length ? ["## Goals", renderBulletList(intent.goals)].join("\n\n") : "",
      architecture.overview ? ["## Architecture", architecture.overview].join("\n\n") : "",
      components ? ["### Components", components].join("\n\n") : "",
      techStack.length ? ["## Tech Stack", techStack.join("\n")].join("\n\n") : "",
      [
        "## Core Workflows",
        [
          "- Understand the repository and write local context into the Project Brain.",
          "- Generate cited README, changelog, journey, and abstract outputs from Project Brain files.",
          `- Prepare demo assets and render a video from captured context${screenshotCount ? `, including ${screenshotCount} screenshot snapshot${screenshotCount === 1 ? "" : "s"}` : ""}.`,
          "- Browse generated files from the local outputs directory.",
        ].join("\n"),
      ].join("\n\n"),
      latestDecision
        ? [
            "## Latest Decision",
            `**${latestDecision.title}**`,
            latestDecision.decision || latestDecision.context,
            latestDecision.consequences.length
              ? ["Consequences:", renderBulletList(latestDecision.consequences)].join("\n\n")
              : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : "",
      recentChanges.length ? ["## Recent Changes", recentChanges.join("\n")].join("\n\n") : "",
      recentJourney.length ? ["## Recent Journey", recentJourney.join("\n")].join("\n\n") : "",
      generatedAssets.length
        ? ["## Generated Assets", generatedAssets.map((asset) => `- \`${asset}\``).join("\n")].join("\n\n")
        : "",
      intent.successCriteria.length
        ? ["## Success Criteria", renderBulletList(intent.successCriteria)].join("\n\n")
        : "",
      "## Notes\n\nThis README was generated from the local Project Brain. If setup commands, environment variables, or deployment steps are missing, they were not captured in the available context yet.",
    ];

    let content = `${sections.filter(Boolean).join("\n\n")}\n`;

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

  private async listGeneratedAssets(): Promise<string[]> {
    const outputRoot = join(this.projectPath, "outputs");

    try {
      const entries = await readdir(outputRoot, { withFileTypes: true });
      const files: Array<{ name: string; updatedAt: number }> = [];

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fileStat = await stat(join(outputRoot, entry.name));
        files.push({ name: entry.name, updatedAt: fileStat.mtimeMs });
      }

      return files
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(0, 12)
        .map((file) => file.name);
    } catch {
      return [];
    }
  }
}

// Made with Bob
