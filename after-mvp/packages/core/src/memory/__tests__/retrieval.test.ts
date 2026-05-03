import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { BrainWriter } from "../brain-writer";
import { createMetadata } from "../brain-files";
import { ProjectBrainRetriever } from "../retrieval";

describe("Project Brain retrieval", () => {
  let projectPath: string;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-retrieval-"));
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("ranks exact phrase and weighted Project Brain matches first", async () => {
    const writer = new BrainWriter(projectPath);
    await writer.initialize("Retrieval Test");
    const metadata = createMetadata();

    await writer.writeOverview({
      metadata,
      projectName: "Retrieval Test",
      summary:
        "Local retrieval ranking should surface the most relevant Project Brain context.",
      repositoryPath: projectPath,
      frameworks: ["TypeScript"],
      status: "active",
    });
    await writer.writeIntent({
      metadata,
      problem: "Developers need cited answers from local memory.",
      audience: ["developers"],
      goals: ["Generate cited answers"],
      nonGoals: [],
      successCriteria: ["Search results include citations"],
    });
    await writer.appendDecision({
      id: "decision-001",
      date: new Date().toISOString(),
      title: "Use local retrieval",
      context: "The MVP should work offline.",
      decision: "Rank Project Brain files without a remote service.",
      consequences: ["Search can run locally."],
      sources: [{ path: "brain/decisions.md", line: 1 }],
    });

    const results = await new ProjectBrainRetriever(projectPath).search(
      "local retrieval ranking",
    );

    expect(results[0]).toMatchObject({
      file: "overview.md",
      matches: expect.arrayContaining(["local", "retrieval", "ranking"]),
      citation: expect.objectContaining({ path: "overview.md" }),
    });
    expect(results[0]?.line).toBeGreaterThan(0);
    expect(results[0]?.preview).toContain("Local retrieval ranking");
  });

  it("supports result limits and returns empty results for empty queries", async () => {
    const writer = new BrainWriter(projectPath);
    await writer.initialize("Retrieval Test");
    await writer.appendChange({
      id: "change-001",
      date: new Date().toISOString(),
      type: "added",
      summary: "Added search ranking",
      details: "The retrieval engine ranks search results.",
      sources: [],
    });

    const retriever = new ProjectBrainRetriever(projectPath);

    await expect(retriever.search("search", { limit: 1 })).resolves.toHaveLength(1);
    await expect(retriever.search("   ")).resolves.toEqual([]);
  });

  it("returns Project Brain overview context for broad capture questions", async () => {
    const writer = new BrainWriter(projectPath);
    await writer.initialize("Retrieval Test");

    const results = await new ProjectBrainRetriever(projectPath).search(
      "what did you capture till now",
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.map((result) => result.file)).toContain("journey.md");
    expect(results[0]?.matches).toContain("project-brain-overview");
  });

  it("skips missing brain files instead of failing the whole search", async () => {
    const results = await new ProjectBrainRetriever(projectPath).search("anything");

    expect(results).toEqual([]);
  });
});
