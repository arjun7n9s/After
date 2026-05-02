import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
import { brainFileNames, parseMarkdownBrainFile } from "./brain-files";
import { ProjectBrainRetriever, type SearchResult } from "./retrieval";

export class BrainReader {
  readonly brainPath: string;
  private readonly retriever: ProjectBrainRetriever;

  constructor(projectPath: string) {
    this.brainPath = join(projectPath, "brain");
    this.retriever = new ProjectBrainRetriever(projectPath);
  }

  async readOverview(): Promise<Overview> {
    return overviewSchema.parse(
      await this.readMarkdown<Overview>(brainFileNames.overview),
    );
  }

  async readIntent(): Promise<Intent> {
    return intentSchema.parse(
      await this.readMarkdown<Intent>(brainFileNames.intent),
    );
  }

  async readArchitecture(): Promise<Architecture> {
    return architectureSchema.parse(
      await this.readMarkdown<Architecture>(brainFileNames.architecture),
    );
  }

  async readDecisions(): Promise<Decision[]> {
    return decisionsSchema.parse(
      await this.readMarkdown<Decision[]>(brainFileNames.decisions),
    );
  }

  async readChangelog(): Promise<ChangeEntry[]> {
    return changelogSchema.parse(
      await this.readMarkdown<ChangeEntry[]>(brainFileNames.changelog),
    );
  }

  async readJourney(): Promise<JourneyEntry[]> {
    return journeySchema.parse(
      await this.readMarkdown<JourneyEntry[]>(brainFileNames.journey),
    );
  }

  async readEntities(): Promise<Entity[]> {
    return entitiesSchema.parse(
      await this.readJson<Entity[]>(brainFileNames.entities),
    );
  }

  async readMedia(): Promise<MediaItem[]> {
    return mediaSchema.parse(await this.readJson<MediaItem[]>(brainFileNames.media));
  }

  async search(query: string): Promise<SearchResult[]> {
    return this.retriever.search(query);
  }

  private async readMarkdown<T>(fileName: string): Promise<T> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return parseMarkdownBrainFile<T>(content);
  }

  private async readJson<T>(fileName: string): Promise<T> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return JSON.parse(content) as T;
  }

}
