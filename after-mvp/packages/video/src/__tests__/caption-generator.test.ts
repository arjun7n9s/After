import { CaptionGenerator, formatTimestamp } from "../caption-generator";
import type { DemoStoryboard } from "../storyboard-generator";

const storyboard: DemoStoryboard = {
  projectName: "Caption Test",
  tone: "pitch",
  generatedAt: "2026-05-03T00:00:00.000Z",
  totalDurationSeconds: 5.5,
  scenes: [
    {
      id: "scene-1",
      kind: "title",
      title: "Opening",
      narration: "Welcome to the project.",
      durationSeconds: 2,
      sources: [{ path: "overview.md" }],
      visual: {
        heading: "Opening",
        bullets: [],
        accent: "#2563eb",
      },
    },
    {
      id: "scene-2",
      kind: "closing",
      title: "Close",
      narration: "This is the final result.",
      durationSeconds: 3.5,
      sources: [{ path: "journey.md" }],
      visual: {
        heading: "Close",
        bullets: [],
        accent: "#0f766e",
      },
    },
  ],
};

describe("CaptionGenerator", () => {
  it("generates SRT captions from storyboard scene timing", () => {
    const track = new CaptionGenerator().generate(storyboard);

    expect(track.cues).toEqual([
      expect.objectContaining({
        index: 1,
        startSeconds: 0,
        endSeconds: 2,
        text: "Welcome to the project.",
      }),
      expect.objectContaining({
        index: 2,
        startSeconds: 2,
        endSeconds: 5.5,
        text: "This is the final result.",
      }),
    ]);
    expect(track.srt).toContain("00:00:00,000 --> 00:00:02,000");
    expect(track.srt).toContain("00:00:02,000 --> 00:00:05,500");
  });

  it("formats timestamps for SRT", () => {
    expect(formatTimestamp(3723.25)).toBe("01:02:03,250");
  });
});
