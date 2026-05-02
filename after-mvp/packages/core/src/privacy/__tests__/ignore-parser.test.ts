import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { IgnoreParser } from "../ignore-parser";

describe("IgnoreParser", () => {
  let projectPath: string;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-ignore-"));
    await writeFile(
      join(projectPath, ".gitignore"),
      ["node_modules/", "dist/", "ignored.txt", "*.log"].join("\n"),
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("matches ignore patterns against relative and absolute paths", async () => {
    const parser = new IgnoreParser(projectPath);
    await parser.loadPatterns();

    expect(parser.isIgnored("ignored.txt")).toBe(true);
    expect(parser.isIgnored(join(projectPath, "node_modules", "dep.js"))).toBe(
      true,
    );
    expect(parser.isIgnored(join(projectPath, "dist", "index.js"))).toBe(true);
    expect(parser.isIgnored(join(projectPath, "logs", "debug.log"))).toBe(true);
    expect(parser.isIgnored(join(projectPath, "src", "index.ts"))).toBe(false);
  });
});
