import type {
  Architecture,
  BrainMetadata,
  ChangeEntry,
  Decision,
  Entity,
  Intent,
  JourneyEntry,
  MediaItem,
  Overview,
} from "./schemas";

export const brainFileNames = {
  overview: "overview.md",
  intent: "intent.md",
  architecture: "architecture.md",
  decisions: "decisions.md",
  changelog: "changelog.md",
  journey: "journey.md",
  entities: "entities.json",
  media: "media.json",
} as const;

export type BrainSeed = {
  overview: Overview;
  intent: Intent;
  architecture: Architecture;
  decisions: Decision[];
  changelog: ChangeEntry[];
  journey: JourneyEntry[];
  entities: Entity[];
  media: MediaItem[];
};

export const createMetadata = (now = new Date()): BrainMetadata => ({
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  version: "1.0.0",
});

export const createDefaultBrainSeed = (
  projectPath: string,
  projectName = "Untitled Project",
  now = new Date(),
): BrainSeed => {
  const metadata = createMetadata(now);

  return {
    overview: {
      metadata,
      projectName,
      summary: "",
      repositoryPath: projectPath,
      frameworks: [],
      status: "initialized",
    },
    intent: {
      metadata,
      problem: "",
      audience: [],
      goals: [],
      nonGoals: [],
      successCriteria: [],
    },
    architecture: {
      metadata,
      overview: "",
      components: [],
      dataFlow: [],
      risks: [],
    },
    decisions: [],
    changelog: [],
    journey: [
      {
        id: "journey-001",
        timestamp: now.toISOString(),
        kind: "milestone",
        title: "Project Brain initialized",
        narrative: "After created the local Project Brain structure.",
        sources: [],
      },
    ],
    entities: [],
    media: [],
  };
};

export const renderMarkdownBrainFile = (title: string, data: unknown): string =>
  `# ${title}\n\n` +
  "```json\n" +
  `${JSON.stringify(data, null, 2)}\n` +
  "```\n";

export const parseMarkdownBrainFile = <T>(content: string): T => {
  const match = content.match(/```json\s*([\s\S]*?)\s*```/);

  if (!match?.[1]) {
    throw new Error("Brain markdown file is missing a json code block.");
  }

  return JSON.parse(match[1]) as T;
};
