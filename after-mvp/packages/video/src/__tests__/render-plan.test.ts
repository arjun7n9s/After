import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { VideoRenderPlanner, renderScript } from "../render-plan";
import type { DemoStoryboard } from "../storyboard-generator";

const storyboard: DemoStoryboard = {
  projectName: "Render Test",
  tone: "technical",
  generatedAt: "2026-05-03T00:00:00.000Z",
  totalDurationSeconds: 4,
  scenes: [
    {
      id: "scene-1",
      kind: "title",
      title: "Render Test",
      narration: "The render pipeline prepares artifacts.",
      durationSeconds: 4,
      sources: [{ path: "overview.md" }],
      visual: {
        heading: "Render Test",
        bullets: ["prepared"],
        accent: "#2563eb",
      },
    },
  ],
};

describe("VideoRenderPlanner", () => {
  let projectPath: string;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-render-plan-"));
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("creates a deterministic render plan", () => {
    const plan = new VideoRenderPlanner().createPlan(projectPath, storyboard, {
      fps: 24,
      width: 1280,
      height: 720,
    });

    expect(plan).toMatchObject({
      projectName: "Render Test",
      status: "prepared",
      fps: 24,
      width: 1280,
      height: 720,
      totalFrames: 96,
      compositionId: "AfterDemo",
    });
    expect(plan.artifacts["demo_captions.srt"]).toContain("demo_captions.srt");
  });

  it("writes script, storyboard, captions, and source manifest artifacts", async () => {
    const plan = await new VideoRenderPlanner().writeArtifacts(projectPath, storyboard);

    await expect(readFile(plan.artifacts["demo_script.md"], "utf8")).resolves.toContain(
      "The render pipeline prepares artifacts.",
    );
    await expect(
      readFile(plan.artifacts["demo_storyboard.json"], "utf8"),
    ).resolves.toContain('"projectName": "Render Test"');
    await expect(
      readFile(plan.artifacts["demo_captions.srt"], "utf8"),
    ).resolves.toContain("00:00:00,000 --> 00:00:04,000");
    await expect(readFile(plan.artifacts["demo_sources.json"], "utf8")).resolves.toContain(
      "overview.md",
    );
  });

  it("renders a markdown narration script", () => {
    expect(renderScript(storyboard)).toContain("# Demo Script: Render Test");
  });
});
