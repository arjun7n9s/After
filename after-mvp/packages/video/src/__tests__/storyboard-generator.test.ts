import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BrainWriter, createMetadata } from "@after/core";
import { StoryboardGenerator } from "../storyboard-generator";

describe("StoryboardGenerator", () => {
  let projectPath: string;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-storyboard-"));
    const writer = new BrainWriter(projectPath);
    const metadata = createMetadata();

    await writer.initialize("Storyboard Test");
    await writer.writeOverview({
      metadata,
      projectName: "Storyboard Test",
      summary: "A project that turns local memory into demo videos.",
      repositoryPath: projectPath,
      frameworks: ["React", "Remotion"],
      status: "active",
    });
    await writer.writeIntent({
      metadata,
      problem: "Hackathon projects need a clear story.",
      audience: ["judges"],
      goals: ["Create a demo narrative", "Cite Project Brain sources"],
      nonGoals: [],
      successCriteria: ["Storyboard scenes cite sources"],
    });
    await writer.writeArchitecture({
      metadata,
      overview: "Project Brain feeds output and video generators.",
      components: [
        {
          name: "Storyboard",
          responsibility: "Converts memory into video scenes.",
          technologies: ["TypeScript"],
          sources: [],
        },
      ],
      dataFlow: [],
      risks: [],
    });
    await writer.appendDecision({
      id: "decision-001",
      date: "2026-05-03",
      title: "Use Project Brain sources",
      context: "Every output should be explainable.",
      decision: "Carry citations into video scenes.",
      consequences: ["Judges can audit the story."],
      sources: [{ path: "brain/decisions.md" }],
    });
    await writer.addMedia({
      id: "media-001",
      type: "screenshot",
      path: "brain/captures/screenshots/dashboard.png",
      capturedAt: "2026-05-03T00:00:00.000Z",
      caption: "Dashboard screenshot",
      sources: [{ path: "apps/ui/src/screens/Dashboard.tsx" }],
    });
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("creates ordered scenes with durations and citations", async () => {
    const storyboard = await new StoryboardGenerator(projectPath).generate({
      maxTimelineScenes: 1,
      tone: "journey",
    });

    expect(storyboard.projectName).toBe("Storyboard Test");
    expect(storyboard.tone).toBe("journey");
    expect(storyboard.totalDurationSeconds).toBeGreaterThan(0);
    expect(storyboard.scenes.map((scene) => scene.kind)).toEqual(
      expect.arrayContaining(["title", "problem", "architecture", "decision", "closing"]),
    );
    expect(storyboard.scenes.every((scene) => scene.sources.length > 0)).toBe(true);
    expect(storyboard.scenes[0]?.visual.mediaPath).toBe(
      "brain/captures/screenshots/dashboard.png",
    );
  });
});
