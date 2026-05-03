import { BrainReader, type BrainSource } from "@after/core";

export type StoryboardSceneKind =
  | "title"
  | "problem"
  | "architecture"
  | "decision"
  | "timeline"
  | "closing";

export type StoryboardTone = "technical" | "pitch" | "journey";

export type StoryboardScene = {
  id: string;
  kind: StoryboardSceneKind;
  title: string;
  narration: string;
  durationSeconds: number;
  sources: BrainSource[];
  visual: {
    heading: string;
    bullets: string[];
    accent: string;
    mediaPath?: string;
    mediaCaption?: string;
  };
};

export type DemoStoryboard = {
  projectName: string;
  tone: StoryboardTone;
  totalDurationSeconds: number;
  generatedAt: string;
  scenes: StoryboardScene[];
};

export type StoryboardOptions = {
  maxTimelineScenes?: number;
  tone?: StoryboardTone;
};

const accents = ["#2563eb", "#0f766e", "#7c3aed", "#b45309", "#be123c"] as const;

export class StoryboardGenerator {
  private readonly reader: BrainReader;

  constructor(projectPath: string) {
    this.reader = new BrainReader(projectPath);
  }

  async generate(options: StoryboardOptions = {}): Promise<DemoStoryboard> {
    const [overview, intent, architecture, decisions, journey, media] = await Promise.all([
      this.reader.readOverview(),
      this.reader.readIntent(),
      this.reader.readArchitecture(),
      this.reader.readDecisions(),
      this.reader.readJourney(),
      this.reader.readMedia(),
    ]);
    const maxTimelineScenes = options.maxTimelineScenes ?? 3;
    const tone = options.tone ?? "pitch";
    const screenshots = media.filter((item) => item.type === "screenshot");
    const primaryScreenshot = screenshots.at(-1);
    const scenes: StoryboardScene[] = [
      {
        id: "scene-title",
        kind: "title",
        title: overview.projectName,
        narration:
          overview.summary ||
          `${overview.projectName} is being captured through After's local Project Brain.`,
        durationSeconds: 6,
        sources: [{ path: "overview.md" }],
        visual: {
          heading: overview.projectName,
          bullets: [overview.status, ...overview.frameworks].filter(Boolean),
          accent: accents[0],
          mediaPath: primaryScreenshot?.path,
          mediaCaption: primaryScreenshot?.caption,
        },
      },
      {
        id: "scene-problem",
        kind: "problem",
        title: "Problem",
        narration: intent.problem || "The Project Brain has not captured a problem statement yet.",
        durationSeconds: 8,
        sources: [{ path: "intent.md" }],
        visual: {
          heading: "Problem",
          bullets: intent.goals.slice(0, 4),
          accent: accents[1],
        },
      },
      {
        id: "scene-architecture",
        kind: "architecture",
        title: "Architecture",
        narration:
          architecture.overview ||
          "The architecture summary will become richer as the Project Brain is updated.",
        durationSeconds: 9,
        sources: [{ path: "architecture.md" }],
        visual: {
          heading: "Architecture",
          bullets: architecture.components.map(
            (component) => `${component.name}: ${component.responsibility}`,
          ),
          accent: accents[2],
        },
      },
    ];

    const latestDecision = decisions.at(-1);
    if (latestDecision) {
      scenes.push({
        id: `scene-decision-${latestDecision.id}`,
        kind: "decision",
        title: latestDecision.title,
        narration: latestDecision.decision || latestDecision.context,
        durationSeconds: 8,
        sources: latestDecision.sources.length
          ? latestDecision.sources
          : [{ path: "decisions.md" }],
        visual: {
          heading: "Key Decision",
          bullets: latestDecision.consequences.slice(0, 4),
          accent: accents[3],
        },
      });
    }

    for (const entry of journey.slice(-maxTimelineScenes)) {
      scenes.push({
        id: `scene-journey-${entry.id}`,
        kind: "timeline",
        title: entry.title,
        narration: entry.narrative,
        durationSeconds: 7,
        sources: entry.sources.length ? entry.sources : [{ path: "journey.md" }],
        visual: {
          heading: entry.kind,
          bullets: [new Date(entry.timestamp).toLocaleDateString(), entry.title],
          accent: accents[4],
        },
      });
    }

    scenes.push({
      id: "scene-closing",
      kind: "closing",
      title: "Ready to Share",
      narration: this.getClosingNarration(tone),
      durationSeconds: 6,
      sources: [{ path: "overview.md" }, { path: "journey.md" }],
      visual: {
        heading: "After",
        bullets: ["Captured", "Cited", "Demo-ready"],
        accent: accents[0],
      },
    });

    return {
      projectName: overview.projectName,
      tone,
      generatedAt: new Date().toISOString(),
      totalDurationSeconds: scenes.reduce(
        (total, scene) => total + scene.durationSeconds,
        0,
      ),
      scenes,
    };
  }

  private getClosingNarration(tone: StoryboardTone): string {
    const narrationByTone: Record<StoryboardTone, string> = {
      technical:
        "After packages captured memory, retrieval, citations, outputs, and video scenes into one local-first pipeline.",
      pitch:
        "After turns captured development context into cited outputs and demo-ready storytelling for a polished submission.",
      journey:
        "After preserves the path from first idea to final demo, making the development journey easy to share.",
    };

    return narrationByTone[tone];
  }
}
