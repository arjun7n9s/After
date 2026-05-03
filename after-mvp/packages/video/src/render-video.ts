import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { DemoStoryboard } from "./storyboard-generator";
import type { VideoRenderPlan } from "./render-plan";

export type DemoVideoRenderResult = {
  outputPath: string;
  contentType: string;
};

export const renderDemoVideo = async (
  storyboard: DemoStoryboard,
  plan: VideoRenderPlan,
): Promise<DemoVideoRenderResult> => {
  await mkdir(dirname(plan.outputPath), { recursive: true });

  const entryPoint = join(
    __dirname,
    `.after-remotion-entry-${process.pid}-${Date.now()}.js`,
  );
  const bundleDir = join(dirname(plan.outputPath), ".remotion-bundle");

  await writeFile(entryPoint, createEntrySource(storyboard, plan), "utf8");

  try {
    const serveUrl = await bundle({
      entryPoint,
      outDir: bundleDir,
      enableCaching: false,
      ignoreRegisterRootWarning: true,
      onProgress: () => undefined,
    });
    const composition = await selectComposition({
      serveUrl,
      id: plan.compositionId,
      logLevel: "warn",
    });
    const result = await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: plan.outputPath,
      overwrite: true,
      logLevel: "warn",
      concurrency: 1,
    });

    return {
      outputPath: plan.outputPath,
      contentType: result.contentType,
    };
  } finally {
    await rm(entryPoint, { force: true });
  }
};

const createEntrySource = (
  storyboard: DemoStoryboard,
  plan: VideoRenderPlan,
): string => `
const React = require("react");
const {Composition, registerRoot} = require("remotion");
const {DemoComposition} = require("./remotion-scenes");

const storyboard = ${JSON.stringify(storyboard)};

const Root = () =>
  React.createElement(Composition, {
    id: ${JSON.stringify(plan.compositionId)},
    component: DemoComposition,
    durationInFrames: ${Math.max(1, plan.totalFrames)},
    fps: ${plan.fps},
    width: ${plan.width},
    height: ${plan.height},
    defaultProps: {storyboard},
  });

registerRoot(Root);
`;
