import { BrainReader, type BrainSource } from "@after/core";

export type StoryboardSceneKind =
  | "title"
  | "launch"
  | "problem"
  | "architecture"
  | "brain"
  | "outputs"
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
    const topComponents = architecture.components
      .slice(0, 4)
      .map((component) => component.name);
    const workflowBullets = [
      "Open a working repo",
      "Launch After",
      "Understand the project",
      "Generate outputs",
    ];
    const scenes: StoryboardScene[] = [
      {
        id: "scene-title",
        kind: "title",
        title: `Demo: ${overview.projectName}`,
        narration: `A developer opens ${overview.projectName} and uses After to turn the project folder into a clear demo story.`,
        durationSeconds: 6,
        sources: [{ path: "overview.md" }],
        visual: {
          heading: overview.projectName,
          bullets: workflowBullets,
          accent: accents[0],
          mediaPath: primaryScreenshot?.path,
          mediaCaption: primaryScreenshot?.caption,
        },
      },
      {
        id: "scene-launch",
        kind: "launch",
        title: "Launch After in the repo",
        narration: `From the terminal, the developer starts After against the current project folder. The dashboard opens already connected to ${overview.repositoryPath || "the selected repository"}.`,
        durationSeconds: 8,
        sources: [{ path: "overview.md" }],
        visual: {
          heading: "Connected workspace",
          bullets: [
            overview.repositoryPath || "Selected project folder",
            overview.primaryLanguage || "Detected source files",
            ...overview.frameworks.slice(0, 2),
          ].filter(Boolean),
          accent: accents[1],
        },
      },
      {
        id: "scene-understand",
        kind: "brain",
        title: "Understand the project",
        narration: `The developer clicks Understand Repo. After reads source files, package manifests, docs, routes, commands, and configuration through privacy filters, then fills the local Project Brain with cited context.`,
        durationSeconds: 9,
        sources: [{ path: "architecture.md" }, { path: "entities.json" }],
        visual: {
          heading: "Project Brain",
          bullets: [
            `${architecture.components.length} architecture areas`,
            `${journey.length} timeline entries`,
            `${decisions.length} decisions captured`,
            ...topComponents,
          ],
          accent: accents[2],
        },
      },
      {
        id: "scene-architecture",
        kind: "architecture",
        title: "Navigate the repo map",
        narration:
          architecture.overview ||
          "After converts the repository structure into a practical map the developer can use for chat, documentation, and demo generation.",
        durationSeconds: 8,
        sources: [{ path: "architecture.md" }],
        visual: {
          heading: "Repo map",
          bullets: architecture.dataFlow.slice(0, 4),
          accent: accents[3],
        },
      },
      {
        id: "scene-outputs",
        kind: "outputs",
        title: "Generate demo-ready outputs",
        narration: `With context loaded, the developer generates a polished README, browses the files page, and renders a demo video backed by the same captured evidence.`,
        durationSeconds: 8,
        sources: [{ path: "overview.md" }, { path: "journey.md" }],
        visual: {
          heading: "Outputs",
          bullets: ["README.generated.md", "demo_script.md", "demo_video.mp4", "cited Project Brain sources"],
          accent: accents[4],
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
          bullets: latestDecision.consequences.length
            ? latestDecision.consequences.slice(0, 4)
            : ["Decision captured with local citations"],
          accent: accents[3],
        },
      });
    }

    for (const entry of journey.slice(-maxTimelineScenes)) {
      scenes.push({
        id: `scene-journey-${entry.id}`,
        kind: "timeline",
        title: entry.title,
        narration: `The timeline keeps the demo grounded in real work: ${entry.narrative}`,
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
        "The demo is ready: the repository is understood, the Project Brain is cited, and the generated assets are available from the Files page.",
      pitch:
        "Instead of explaining the project from scratch, the developer can now show a working dashboard, a professional README, and a rendered demo video.",
      journey:
        "After preserves the path from repository context to shareable demo, so the story follows the actual work.",
    };

    return narrationByTone[tone];
  }
}
