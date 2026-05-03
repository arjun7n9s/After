export type DemoVideoAsset =
  | "demo_script.md"
  | "demo_storyboard.json"
  | "demo_video.mp4"
  | "demo_voiceover.wav"
  | "demo_captions.srt"
  | "demo_thumbnail.png"
  | "demo_sources.json";

export const demoVideoAssets: DemoVideoAsset[] = [
  "demo_script.md",
  "demo_storyboard.json",
  "demo_video.mp4",
  "demo_voiceover.wav",
  "demo_captions.srt",
  "demo_thumbnail.png",
  "demo_sources.json",
];

export { StoryboardGenerator } from "./storyboard-generator";
export { CaptionGenerator, formatCueAsSrt, formatTimestamp } from "./caption-generator";
export {
  VideoRenderPlanner,
  extractSources,
  getSceneStartSeconds,
  renderScript,
} from "./render-plan";
export type {
  DemoStoryboard,
  StoryboardOptions,
  StoryboardScene,
  StoryboardSceneKind,
  StoryboardTone,
} from "./storyboard-generator";
export type { CaptionCue, CaptionTrack } from "./caption-generator";
export type {
  VideoRenderArtifact,
  VideoRenderPlan,
  VideoRenderPlanOptions,
} from "./render-plan";
export { DemoComposition, StoryboardSceneView } from "./remotion-scenes";
export type { DemoCompositionProps } from "./remotion-scenes";
