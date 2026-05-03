import type { DemoStoryboard, StoryboardScene } from "./storyboard-generator";

export type CaptionCue = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type CaptionTrack = {
  cues: CaptionCue[];
  srt: string;
};

export class CaptionGenerator {
  generate(storyboard: DemoStoryboard): CaptionTrack {
    let cursor = 0;
    const cues = storyboard.scenes.map((scene, index) => {
      const cue = this.createCue(index + 1, cursor, scene);
      cursor += scene.durationSeconds;
      return cue;
    });

    return {
      cues,
      srt: cues.map(formatCueAsSrt).join("\n\n") + "\n",
    };
  }

  private createCue(
    index: number,
    startSeconds: number,
    scene: StoryboardScene,
  ): CaptionCue {
    return {
      index,
      startSeconds,
      endSeconds: startSeconds + scene.durationSeconds,
      text: normalizeCaptionText(scene.narration || scene.title),
    };
  }
}

export const formatCueAsSrt = (cue: CaptionCue): string =>
  [
    String(cue.index),
    `${formatTimestamp(cue.startSeconds)} --> ${formatTimestamp(cue.endSeconds)}`,
    cue.text,
  ].join("\n");

export const formatTimestamp = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const milliseconds = Math.round((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)},${String(milliseconds).padStart(3, "0")}`;
};

const normalizeCaptionText = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

const pad = (value: number): string => String(value).padStart(2, "0");
