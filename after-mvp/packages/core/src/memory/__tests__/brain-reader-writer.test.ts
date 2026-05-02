import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { BrainReader } from "../brain-reader";
import { BrainWriter } from "../brain-writer";

describe("Project Brain reader and writer", () => {
  let projectPath: string;

  beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), "after-brain-"));
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("initializes and reads every Project Brain file", async () => {
    const writer = new BrainWriter(projectPath);
    await writer.initialize("Test Project");

    const reader = new BrainReader(projectPath);

    await expect(reader.readOverview()).resolves.toMatchObject({
      projectName: "Test Project",
      status: "initialized",
    });
    await expect(reader.readIntent()).resolves.toMatchObject({
      goals: [],
    });
    await expect(reader.readArchitecture()).resolves.toMatchObject({
      components: [],
    });
    await expect(reader.readDecisions()).resolves.toEqual([]);
    await expect(reader.readChangelog()).resolves.toEqual([]);
    await expect(reader.readEntities()).resolves.toEqual([]);
    await expect(reader.readMedia()).resolves.toEqual([]);
    await expect(reader.readJourney()).resolves.toHaveLength(1);
  });

  it("appends validated decision, change, journey, and media records", async () => {
    const writer = new BrainWriter(projectPath);
    await writer.initialize("Test Project");

    const now = new Date().toISOString();

    await writer.appendDecision({
      id: "decision-001",
      date: now,
      title: "Use local Project Brain",
      context: "Core features should work without credentials.",
      decision: "Store project memory on disk.",
      consequences: ["Outputs can cite local files."],
      sources: [],
    });
    await writer.appendChange({
      id: "change-001",
      date: now,
      type: "added",
      summary: "Added Project Brain persistence",
      details: "",
      sources: [],
    });
    await writer.appendJourneyEntry({
      id: "journey-002",
      timestamp: now,
      kind: "decision",
      title: "Captured the storage decision",
      narrative: "The writer appended a journey entry.",
      sources: [],
    });
    await writer.addMedia({
      id: "media-001",
      type: "screenshot",
      path: "brain/captures/screenshots/example.png",
      capturedAt: now,
      caption: "Example capture",
      sources: [],
    });

    const reader = new BrainReader(projectPath);

    await expect(reader.readDecisions()).resolves.toHaveLength(1);
    await expect(reader.readChangelog()).resolves.toHaveLength(1);
    await expect(reader.readJourney()).resolves.toHaveLength(2);
    await expect(reader.readMedia()).resolves.toHaveLength(1);
    await expect(reader.search("Store project memory")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ file: "decisions.md" }),
      ]),
    );
  });
});
