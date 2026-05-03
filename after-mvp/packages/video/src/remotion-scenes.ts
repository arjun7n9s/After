import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { DemoStoryboard, StoryboardScene } from "./storyboard-generator";

export type DemoCompositionProps = {
  storyboard: DemoStoryboard;
};

const RemotionAbsoluteFill = AbsoluteFill as unknown as React.ComponentType<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
}>;
const RemotionSequence = Sequence as unknown as React.ComponentType<{
  children?: React.ReactNode;
  durationInFrames: number;
  from: number;
}>;

export function DemoComposition({ storyboard }: DemoCompositionProps) {
  const { fps } = useVideoConfig();
  let frameOffset = 0;

  return React.createElement(
    RemotionAbsoluteFill,
    { style: { backgroundColor: "#f8fafc", color: "#0f172a" } },
    storyboard.scenes.map((scene) => {
      const from = frameOffset;
      const durationInFrames = Math.round(scene.durationSeconds * fps);
      frameOffset += durationInFrames;

      return React.createElement(
        RemotionSequence,
        { key: scene.id, from, durationInFrames },
        React.createElement(StoryboardSceneView, { scene }),
      );
    }),
  );
}

export function StoryboardSceneView({ scene }: { scene: StoryboardScene }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 18], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return React.createElement(
    RemotionAbsoluteFill,
    {
      style: {
        justifyContent: "center",
        padding: 72,
        background: `linear-gradient(135deg, ${scene.visual.accent}18, #f8fafc 48%)`,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          opacity,
          transform: `translateY(${translateY}px)`,
          maxWidth: 1100,
        },
      },
      React.createElement(
        "p",
        {
          style: {
            color: scene.visual.accent,
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 18px",
            textTransform: "uppercase",
          },
        },
        scene.kind,
      ),
      React.createElement(
        "h1",
        {
          style: {
            fontSize: 72,
            lineHeight: 1,
            margin: "0 0 28px",
            maxWidth: 980,
          },
        },
        scene.title,
      ),
      React.createElement(
        "p",
        {
          style: {
            fontSize: 34,
            lineHeight: 1.35,
            margin: "0 0 36px",
            maxWidth: 980,
          },
        },
        scene.narration,
      ),
      React.createElement(
        "div",
        { style: { display: "flex", flexWrap: "wrap", gap: 14 } },
        scene.visual.bullets.slice(0, 5).map((bullet) =>
          React.createElement(
            "span",
            {
              key: bullet,
              style: {
                border: "2px solid #cbd5e1",
                borderRadius: 999,
                fontSize: 24,
                padding: "10px 18px",
              },
            },
            bullet,
          ),
        ),
      ),
      scene.visual.mediaPath
        ? React.createElement(
            "p",
            {
              style: {
                color: "#475569",
                fontSize: 22,
                margin: "32px 0 0",
              },
            },
            scene.visual.mediaCaption || scene.visual.mediaPath,
          )
        : null,
    ),
  );
}
