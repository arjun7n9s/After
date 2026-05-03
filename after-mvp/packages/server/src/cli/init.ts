import { access, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { BrainWriter } from "@after/core";

export type InitProjectOptions = {
  projectName?: string;
};

export const initProject = async (
  projectPath: string,
  options: InitProjectOptions = {},
): Promise<string> => {
  const resolvedPath = resolve(projectPath);
  const writer = new BrainWriter(resolvedPath);
  const projectName = options.projectName ?? basename(resolvedPath);

  await writer.initialize(projectName);
  await ensureAfterIgnore(resolvedPath);

  return writer.brainPath;
};

const ensureAfterIgnore = async (projectPath: string): Promise<void> => {
  const afterIgnorePath = resolve(projectPath, ".afterignore");

  try {
    await access(afterIgnorePath);
    return;
  } catch {
    await writeFile(
      afterIgnorePath,
      ["node_modules", ".git", ".env*", "dist", "coverage", "brain", "outputs", ""].join("\n"),
      "utf8",
    );
  }
};
