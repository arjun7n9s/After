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

export type SearchResult = {
  file: string;
  preview: string;
  score: number;
};

export class BrainReader {
  readonly brainPath: string;

  constructor(projectPath: string) {
    this.brainPath = join(projectPath, "brain");
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const files = Object.values(brainFileNames);
    const results: Array<SearchResult | undefined> = await Promise.all(
      files.map(async (file): Promise<SearchResult | undefined> => {
        const content = await readFile(join(this.brainPath, file), "utf8");
        const lowerContent = content.toLowerCase();
        const index = lowerContent.indexOf(normalizedQuery);

        if (index === -1) {
          return undefined;
        }

        const start = Math.max(0, index - 80);
        const end = Math.min(content.length, index + normalizedQuery.length + 80);

        return {
          file,
          preview: content.slice(start, end).replace(/\s+/g, " ").trim(),
          score: this.countOccurrences(lowerContent, normalizedQuery),
        };
      }),
    );

    return results
      .filter((result): result is SearchResult => result !== undefined)
      .sort((left, right) => right.score - left.score);
  }

  private async readMarkdown<T>(fileName: string): Promise<T> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return parseMarkdownBrainFile<T>(content);
  }

  private async readJson<T>(fileName: string): Promise<T> {
    const content = await readFile(join(this.brainPath, fileName), "utf8");
    return JSON.parse(content) as T;
  }

  private countOccurrences(content: string, query: string): number {
    return content.split(query).length - 1;
  }
}
