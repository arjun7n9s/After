import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { CaptionGenerator, type CaptionTrack } from "./caption-generator";
import type { DemoStoryboard, StoryboardScene } from "./storyboard-generator";

export type VideoRenderArtifact =
  | "demo_script.md"
  | "demo_storyboard.json"
  | "demo_captions.srt"
  | "demo_sources.json";

export type VideoRenderPlan = {
  projectName: string;
  status: "prepared";
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  totalDurationSeconds: number;
  compositionId: string;
  outputPath: string;
  artifacts: Record<VideoRenderArtifact, string>;
  captionTrack: CaptionTrack;
};

export type VideoRenderPlanOptions = {
  fps?: number;
  width?: number;
  height?: number;
  compositionId?: string;
};

export class VideoRenderPlanner {
  private readonly captionGenerator = new CaptionGenerator();

  createPlan(
    projectPath: string,
    storyboard: DemoStoryboard,
    options: VideoRenderPlanOptions = {},
  ): VideoRenderPlan {
    const fps = options.fps ?? 30;
    const width = options.width ?? 1920;
    const height = options.height ?? 1080;
    const outputRoot = join(projectPath, "outputs");
    const captionTrack = this.captionGenerator.generate(storyboard);

    return {
      projectName: storyboard.projectName,
      status: "prepared",
      fps,
      width,
      height,
      totalFrames: Math.round(storyboard.totalDurationSeconds * fps),
      totalDurationSeconds: storyboard.totalDurationSeconds,
      compositionId: options.compositionId ?? "AfterDemo",
      outputPath: join(outputRoot, "demo_video.mp4"),
      artifacts: {
        "demo_script.md": join(outputRoot, "demo_script.md"),
        "demo_storyboard.json": join(outputRoot, "demo_storyboard.json"),
        "demo_captions.srt": join(outputRoot, "demo_captions.srt"),
        "demo_sources.json": join(outputRoot, "demo_sources.json"),
      },
      captionTrack,
    };
  }

  async writeArtifacts(
    projectPath: string,
    storyboard: DemoStoryboard,
    options: VideoRenderPlanOptions = {},
  ): Promise<VideoRenderPlan> {
    const plan = this.createPlan(projectPath, storyboard, options);
    const outputRoot = join(projectPath, "outputs");

    await mkdir(outputRoot, { recursive: true });
    await Promise.all([
      writeFile(plan.artifacts["demo_script.md"], renderScript(storyboard), "utf8"),
      writeFile(
        plan.artifacts["demo_storyboard.json"],
        `${JSON.stringify(storyboard, null, 2)}\n`,
        "utf8",
      ),
      writeFile(plan.artifacts["demo_captions.srt"], plan.captionTrack.srt, "utf8"),
      writeFile(
        plan.artifacts["demo_sources.json"],
        `${JSON.stringify(extractSources(storyboard), null, 2)}\n`,
        "utf8",
      ),
    ]);

    return plan;
  }
}

export const renderScript = (storyboard: DemoStoryboard): string => {
  const lines = [`# Demo Script: ${storyboard.projectName}`, ""];

  for (const scene of storyboard.scenes) {
    lines.push(`## ${scene.title}`, "", scene.narration, "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
};

export const extractSources = (storyboard: DemoStoryboard) =>
  storyboard.scenes.map((scene) => ({
    sceneId: scene.id,
    sceneTitle: scene.title,
    sources: scene.sources,
  }));

export const getSceneStartSeconds = (
  storyboard: DemoStoryboard,
  scene: StoryboardScene,
): number => {
  let startSeconds = 0;

  for (const currentScene of storyboard.scenes) {
    if (currentScene.id === scene.id) {
      return startSeconds;
    }

    startSeconds += currentScene.durationSeconds;
  }

  return startSeconds;
};
