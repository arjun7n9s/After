import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import {
  architectureSchema,
  changelogSchema,
  decisionsSchema,
  entitiesSchema,
  intentSchema,
  journeySchema,
  mediaSchema,
  overviewSchema,
  type Architecture,
  type ChangeEntry,
  type Decision,
  type Entity,
  type Intent,
  type JourneyEntry,
  type MediaItem,
  type Overview,
} from "./schemas";
import {
  brainFileNames,
  createDefaultBrainSeed,
  parseMarkdownBrainFile,
  renderMarkdownBrainFile,
} from "./brain-files";

export class BrainWriter {
  readonly brainPath: string;

  constructor(projectPath: string) {
    this.brainPath = join(projectPath, "brain");
  }

  async initialize(projectName?: string): Promise<void> {
    const projectPath = dirname(this.brainPath);
    const seed = createDefaultBrainSeed(projectPath, projectName);

    await mkdir(join(this.brainPath, "captures", "screenshots"), {
      recursive: true,
    });
    await mkdir(join(this.brainPath, "captures", "terminal"), {
      recursive: true,
    });
    await mkdir(join(this.brainPath, "captures", "diffs"), { recursive: true });

    await this.writeOverview(seed.overview);
    await this.writeIntent(seed.intent);
    await this.writeArchitecture(seed.architecture);
    await this.writeDecisions(seed.decisions);
    await this.writeChangelog(seed.changelog);
    await this.writeJourney(seed.journey);
    await this.writeEntities(seed.entities);
    await this.writeMedia(seed.media);
  }

  async writeOverview(data: Overview): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.overview,
      "Overview",
      overviewSchema.parse(data),
    );
  }

  async writeIntent(data: Intent): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.intent,
      "Intent",
      intentSchema.parse(data),
    );
  }

  async writeArchitecture(data: Architecture): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.architecture,
      "Architecture",
      architectureSchema.parse(data),
    );
  }

  async appendDecision(decision: Decision): Promise<void> {
    const decisions = await this.readMarkdownArray<Decision>(
      brainFileNames.decisions,
    );
    decisions.push(decision);
    await this.writeDecisions(decisions);
  }

  async appendChange(change: ChangeEntry): Promise<void> {
    const changelog = await this.readMarkdownArray<ChangeEntry>(
      brainFileNames.changelog,
    );
    changelog.push(change);
    await this.writeChangelog(changelog);
  }

  async appendJourneyEntry(entry: JourneyEntry): Promise<void> {
    const journey = await this.readMarkdownArray<JourneyEntry>(
      brainFileNames.journey,
    );
    journey.push(entry);
    await this.writeJourney(journey);
  }

  async updateEntities(entities: Entity[]): Promise<void> {
    await this.writeEntities(entities);
  }

  async addMedia(media: MediaItem): Promise<void> {
    const existing = await this.readJsonArray<MediaItem>(brainFileNames.media);
    existing.push(media);
    await this.writeMedia(existing);
  }

  async writeDecisions(data: Decision[]): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.decisions,
      "Decisions",
      decisionsSchema.parse(data),
    );
  }

  async writeChangelog(data: ChangeEntry[]): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.changelog,
      "Changelog",
      changelogSchema.parse(data),
    );
  }

  async writeJourney(data: JourneyEntry[]): Promise<void> {
    await this.writeMarkdown(
      brainFileNames.journey,
      "Journey",
      journeySchema.parse(data),
    );
  }

  async writeEntities(data: Entity[]): Promise<void> {
    await this.writeJson(brainFileNames.entities, entitiesSchema.parse(data));
  }

  async writeMedia(data: MediaItem[]): Promise<void> {
    await this.writeJson(brainFileNames.media, mediaSchema.parse(data));
  }

  private async writeMarkdown(
    fileName: string,
    title: string,
    data: unknown,
  ): Promise<void> {
    await mkdir(this.brainPath, { recursive: true });
    await writeFile(
      join(this.brainPath, fileName),
      renderMarkdownBrainFile(title, data),
      "utf8",
    );
  }

  private async writeJson(fileName: string, data: unknown): Promise<void> {
    await mkdir(this.brainPath, { recursive: true });
    await writeFile(
      join(this.brainPath, fileName),
      `${JSON.stringify(data, null, 2)}\n`,
      "utf8",
    );
  }

  private async readMarkdownArray<T>(fileName: string): Promise<T[]> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return parseMarkdownBrainFile<T[]>(content);
  }

  private async readJsonArray<T>(fileName: string): Promise<T[]> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return JSON.parse(content) as T[];
  }
}
