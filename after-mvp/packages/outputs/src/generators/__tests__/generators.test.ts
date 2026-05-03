import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BrainReader, BrainWriter, createMetadata } from "@after/core";
import { AbstractGenerator } from "../abstract-generator";
import { ChangelogGenerator } from "../changelog-generator";
import { JourneyGenerator } from "../journey-generator";
import { ReadmeGenerator } from "../readme-generator";

describe("output generators", () => {
  let projectPath: string;
  let reader: BrainReader;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-output-"));
    const writer = new BrainWriter(projectPath);
    const metadata = createMetadata();

    await writer.initialize("Output Test");
    await writer.writeOverview({
      metadata,
      projectName: "Output Test",
      summary: "A local-first project memory and demo generator.",
      repositoryPath: projectPath,
      primaryLanguage: "TypeScript",
      frameworks: ["React", "Express"],
      status: "active",
    });
    await writer.writeIntent({
      metadata,
      problem: "Developers need a credible project story from local context.",
      audience: ["hackathon judges"],
      goals: ["Generate outputs", "Cite Project Brain sources"],
      nonGoals: [],
      successCriteria: ["Outputs include citations"],
    });
    await writer.writeArchitecture({
      metadata,
      overview: "The app uses a local Project Brain, API server, and React UI.",
      components: [
        {
          name: "Project Brain",
          responsibility: "Stores structured project memory.",
          technologies: ["TypeScript", "JSON"],
          sources: [],
        },
      ],
      dataFlow: [],
      risks: [],
    });
    await writer.appendChange({
      id: "change-001",
      date: "2026-05-03T00:00:00.000Z",
      type: "added",
      summary: "Added output generators",
      details: "README, changelog, journey, and abstract outputs were added.",
      sources: [{ path: "packages/outputs/src/index.ts" }],
    });
    await writer.appendJourneyEntry({
      id: "journey-002",
      timestamp: "2026-05-03T00:00:00.000Z",
      kind: "note",
      title: "Generated project outputs",
      narrative: "The outputs package can now create cited project summaries.",
      sources: [{ path: "packages/outputs/src/generators" }],
    });

    reader = new BrainReader(projectPath);
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("generates a cited README", async () => {
    const output = await new ReadmeGenerator(reader, { projectPath }).generate();

    expect(output.content).toContain("# Output Test");
    expect(output.content).toContain("## Goals");
    expect(output.content).toContain("## Sources");
    expect(output.citations.map((citation) => citation.file)).toEqual(
      expect.arrayContaining(["overview.md", "intent.md", "architecture.md"]),
    );
  });

  it("generates a changelog from Project Brain entries", async () => {
    const output = await new ChangelogGenerator(reader, { projectPath }).generate();

    expect(output.content).toContain("# Changelog");
    expect(output.content).toContain("Added output generators");
    expect(output.citations[0]).toMatchObject({ file: "changelog.md" });
  });

  it("generates a journey report from Project Brain entries", async () => {
    const output = await new JourneyGenerator(reader, { projectPath }).generate();

    expect(output.content).toContain("# Development Journey: Output Test");
    expect(output.content).toContain("Generated project outputs");
    expect(output.citations[0]).toMatchObject({ file: "journey.md" });
  });

  it("generates an escaped HTML abstract", async () => {
    const output = await new AbstractGenerator(reader, { projectPath }).generate();

    expect(output.content).toContain("<!DOCTYPE html>");
    expect(output.content).toContain("Output Test");
    expect(output.content).toContain("Project Statistics");
    expect(output.citations).toHaveLength(3);
  });
});
