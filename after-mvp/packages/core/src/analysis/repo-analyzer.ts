import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";

import { PrivacyFilter } from "../privacy/filter";
import { BrainReader } from "../memory/brain-reader";
import { BrainWriter } from "../memory/brain-writer";
import type {
  Architecture,
  ArchitectureComponent,
  ChangeEntry,
  Entity,
  Intent,
  JourneyEntry,
  Overview,
} from "../memory/schemas";

export type RepoAnalysisStatus = {
  projectPath: string;
  projectName: string;
  brainIsEmpty: boolean;
  hasRepoContext: boolean;
  shouldAskForConsent: boolean;
  fileCount: number;
  analyzableFileCount: number;
  analyzedFileCount: number;
  skippedFileCount: number;
  primaryLanguage?: string;
  languages: string[];
  frameworks: string[];
  summary: string;
  recommendations: string[];
};

export type RepoAnalysisResult = RepoAnalysisStatus & {
  updatedBrain: true;
  updatedFiles: string[];
};

type ScannedFile = {
  path: string;
  extension: string;
  content: string;
};

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
};

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "outputs",
  "brain",
]);

const analyzableExtensions = new Set([
  ".cjs",
  ".css",
  ".go",
  ".html",
  ".java",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".rs",
  ".ts",
  ".tsx",
  ".vue",
  ".yaml",
  ".yml",
]);

const languageByExtension: Record<string, string> = {
  ".cjs": "JavaScript",
  ".css": "CSS",
  ".go": "Go",
  ".html": "HTML",
  ".java": "Java",
  ".js": "JavaScript",
  ".jsx": "React",
  ".md": "Markdown",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".ts": "TypeScript",
  ".tsx": "React",
  ".vue": "Vue",
  ".yaml": "YAML",
  ".yml": "YAML",
};

export class RepoAnalyzer {
  private readonly reader: BrainReader;
  private readonly writer: BrainWriter;
  private readonly privacyFilter: PrivacyFilter;

  constructor(private readonly projectPath: string) {
    this.reader = new BrainReader(projectPath);
    this.writer = new BrainWriter(projectPath);
    this.privacyFilter = new PrivacyFilter(projectPath);
  }

  async inspect(): Promise<RepoAnalysisStatus> {
    const [files, overview, decisions, changelog, journey] = await Promise.all([
      this.scanFiles({ includeContent: false }),
      this.reader.readOverview(),
      this.reader.readDecisions(),
      this.reader.readChangelog(),
      this.reader.readJourney(),
    ]);
    const packageFiles = await this.readPackageJsonFiles();
    const languages = this.detectLanguages(files.scanned);
    const frameworks = this.detectFrameworks(packageFiles);
    const brainIsEmpty =
      !overview.summary.trim() &&
      decisions.length === 0 &&
      changelog.length === 0 &&
      journey.length <= 1;

    return {
      projectPath: this.projectPath,
      projectName: overview.projectName,
      brainIsEmpty,
      hasRepoContext: files.analyzableFileCount > 0 || packageFiles.length > 0,
      shouldAskForConsent: brainIsEmpty && (files.analyzableFileCount > 0 || packageFiles.length > 0),
      fileCount: files.fileCount,
      analyzableFileCount: files.analyzableFileCount,
      analyzedFileCount: files.scanned.length,
      skippedFileCount: files.skippedFileCount,
      primaryLanguage: languages[0],
      languages,
      frameworks,
      summary: this.createInspectionSummary(files.analyzableFileCount, frameworks, languages),
      recommendations: this.createRecommendations(brainIsEmpty, files.analyzableFileCount),
    };
  }

  async analyzeAndWriteBrain(): Promise<RepoAnalysisResult> {
    const files = await this.scanFiles({ includeContent: true });
    const packageFiles = await this.readPackageJsonFiles();
    const [currentOverview, currentIntent, currentArchitecture, decisions, changelog, journey] =
      await Promise.all([
        this.reader.readOverview(),
        this.reader.readIntent(),
        this.reader.readArchitecture(),
        this.reader.readDecisions(),
        this.reader.readChangelog(),
        this.reader.readJourney(),
      ]);
    const languages = this.detectLanguages(files.scanned);
    const frameworks = this.detectFrameworks(packageFiles);
    const components = this.detectComponents(files.scanned, packageFiles);
    const scripts = this.detectScripts(packageFiles);
    const now = new Date();
    const summary = this.createBrainSummary(files.scanned, frameworks, languages, components);
    const updatedOverview: Overview = {
      ...currentOverview,
      metadata: { ...currentOverview.metadata, updatedAt: now.toISOString() },
      summary,
      primaryLanguage: languages[0] ?? currentOverview.primaryLanguage,
      frameworks,
      status: "active",
    };
    const updatedIntent: Intent = {
      ...currentIntent,
      metadata: { ...currentIntent.metadata, updatedAt: now.toISOString() },
      problem:
        currentIntent.problem ||
        "Keep a local, cited Project Brain that understands the repository and can power summaries, chat, and demo assets.",
      goals: unique([
        ...currentIntent.goals,
        "Understand the repository structure from local files.",
        "Keep generated context cited back to source files.",
        "Prepare demo-ready outputs from the Project Brain.",
      ]),
      successCriteria: unique([
        ...currentIntent.successCriteria,
        "Dashboard shows the connected repository and captured context.",
        "Project Brain search and chat can cite scanned files.",
      ]),
    };
    const updatedArchitecture: Architecture = {
      ...currentArchitecture,
      metadata: { ...currentArchitecture.metadata, updatedAt: now.toISOString() },
      overview:
        currentArchitecture.overview ||
        `The repository is organized around ${components
          .slice(0, 3)
          .map((component) => component.name)
          .join(", ") || "the detected source tree"}.`,
      components,
      dataFlow: unique([
        ...currentArchitecture.dataFlow,
        "Local files are scanned through privacy filters before Project Brain files are updated.",
        "The dashboard reads Project Brain status, events, chat context, and video readiness from the API.",
      ]),
      risks: unique([
        ...currentArchitecture.risks,
        "Generated context depends on the files the user allows After to inspect.",
      ]),
    };
    const analysisChange: ChangeEntry = {
      id: `repo-analysis-${Date.now()}`,
      date: now.toISOString(),
      type: "documented",
      summary: "Repository context analyzed into Project Brain",
      details: `Scanned ${files.scanned.length} files and detected ${frameworks.length || 0} framework signal(s).`,
      sources: files.scanned.slice(0, 8).map((file) => ({ path: file.path })),
    };
    const analysisJourney: JourneyEntry = {
      id: `journey-repo-analysis-${Date.now()}`,
      timestamp: now.toISOString(),
      kind: "milestone",
      title: "Repository context understood",
      narrative: `After read the configured folder, detected ${languages.join(", ") || "source"} context, and refreshed the Project Brain.`,
      sources: analysisChange.sources,
    };
    const entities: Entity[] = uniqueBy(
      [
        ...components.map((component) => ({
          id: slug(`component-${component.name}`),
          name: component.name,
          type: "component" as const,
          description: component.responsibility,
          sources: component.sources,
        })),
        ...scripts.map((script) => ({
          id: slug(`command-${script.name}`),
          name: script.name,
          type: "command" as const,
          description: script.command,
          sources: [{ path: script.source }],
        })),
      ],
      (entity) => entity.id,
    ).slice(0, 40);

    await Promise.all([
      this.writer.writeOverview(updatedOverview),
      this.writer.writeIntent(updatedIntent),
      this.writer.writeArchitecture(updatedArchitecture),
      this.writer.writeChangelog([...changelog, analysisChange]),
      this.writer.writeJourney([...journey, analysisJourney]),
      this.writer.updateEntities(entities),
    ]);

    const status = await this.inspect();
    return {
      ...status,
      updatedBrain: true,
      updatedFiles: [
        "overview.md",
        "intent.md",
        "architecture.md",
        "changelog.md",
        "journey.md",
        "entities.json",
      ],
    };
  }

  private async scanFiles(options: { includeContent: boolean }): Promise<{
    scanned: ScannedFile[];
    fileCount: number;
    analyzableFileCount: number;
    skippedFileCount: number;
  }> {
    await this.privacyFilter.initialize();
    const scanned: ScannedFile[] = [];
    let fileCount = 0;
    let analyzableFileCount = 0;
    let skippedFileCount = 0;

    const visit = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const absolutePath = join(directory, entry.name);
        const relativePath = relative(this.projectPath, absolutePath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (!ignoredDirectories.has(entry.name)) {
            await visit(absolutePath);
          }
          continue;
        }

        fileCount += 1;
        const extension = extname(entry.name).toLowerCase();
        if (!analyzableExtensions.has(extension)) {
          skippedFileCount += 1;
          continue;
        }

        analyzableFileCount += 1;
        if (scanned.length >= 250) continue;

        const fileStat = await stat(absolutePath);
        if (fileStat.size > 200_000) {
          skippedFileCount += 1;
          continue;
        }

        const filterResult = await this.privacyFilter.shouldCapture(relativePath);
        if (!filterResult.allowed) {
          skippedFileCount += 1;
          continue;
        }

        const content = options.includeContent
          ? await this.privacyFilter.filterContent(relativePath, await readFile(absolutePath, "utf8"))
          : "";
        if (content === null) {
          skippedFileCount += 1;
          continue;
        }

        scanned.push({ path: relativePath, extension, content });
      }
    };

    await visit(this.projectPath);
    return { scanned, fileCount, analyzableFileCount, skippedFileCount };
  }

  private async readPackageJsonFiles(): Promise<Array<{ path: string; data: PackageJson }>> {
    const files = await this.scanFiles({ includeContent: true });
    return files.scanned
      .filter((file) => basename(file.path) === "package.json")
      .map((file) => {
        try {
          return { path: file.path, data: JSON.parse(file.content) as PackageJson };
        } catch {
          return null;
        }
      })
      .filter((file): file is { path: string; data: PackageJson } => Boolean(file));
  }

  private detectLanguages(files: ScannedFile[]): string[] {
    const counts = new Map<string, number>();
    for (const file of files) {
      const language = languageByExtension[file.extension];
      if (!language) continue;
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([language]) => language).slice(0, 6);
  }

  private detectFrameworks(packageFiles: Array<{ data: PackageJson }>): string[] {
    const dependencies = new Set<string>();
    for (const file of packageFiles) {
      for (const name of Object.keys(file.data.dependencies ?? {})) dependencies.add(name);
      for (const name of Object.keys(file.data.devDependencies ?? {})) dependencies.add(name);
    }

    const frameworkSignals: Array<[string, string]> = [
      ["react", "React"],
      ["vite", "Vite"],
      ["next", "Next.js"],
      ["express", "Express"],
      ["turbo", "Turborepo"],
      ["remotion", "Remotion"],
      ["@remotion/cli", "Remotion"],
      ["tailwindcss", "Tailwind CSS"],
      ["zustand", "Zustand"],
      ["jest", "Jest"],
      ["vitest", "Vitest"],
      ["typescript", "TypeScript"],
    ];

    return unique(
      frameworkSignals
        .filter(([dependency]) => dependencies.has(dependency))
        .map(([, framework]) => framework),
    );
  }

  private detectComponents(
    files: ScannedFile[],
    packageFiles: Array<{ path: string; data: PackageJson }>,
  ): ArchitectureComponent[] {
    const packageComponents = packageFiles.map((file) => ({
      name: file.data.name || dirname(file.path),
      responsibility: `Package defined at ${file.path}`,
      technologies: this.detectFrameworks([{ data: file.data }]),
      sources: [{ path: file.path }],
    }));
    const topLevelDirectories = unique(
      files
        .map((file) => file.path.split("/")[0])
        .filter((part): part is string => Boolean(part) && part !== "package.json"),
    ).slice(0, 10);
    const directoryComponents = topLevelDirectories.map((directory) => ({
      name: directory,
      responsibility: `Repository area containing ${files.filter((file) => file.path.startsWith(`${directory}/`)).length} analyzed file(s).`,
      technologies: [],
      sources: [{ path: files.find((file) => file.path.startsWith(`${directory}/`))?.path ?? directory }],
    }));

    return uniqueBy([...packageComponents, ...directoryComponents], (component) => component.name).slice(0, 20);
  }

  private detectScripts(packageFiles: Array<{ path: string; data: PackageJson }>): Array<{
    name: string;
    command: string;
    source: string;
  }> {
    return packageFiles.flatMap((file) =>
      Object.entries(file.data.scripts ?? {}).map(([name, command]) => ({
        name,
        command,
        source: file.path,
      })),
    );
  }

  private createInspectionSummary(fileCount: number, frameworks: string[], languages: string[]): string {
    if (fileCount === 0) return "No analyzable repository files were found yet.";
    const stack = [...frameworks, ...languages].slice(0, 5).join(", ");
    return stack
      ? `Found ${fileCount} analyzable files with ${stack} signals.`
      : `Found ${fileCount} analyzable files ready for Project Brain analysis.`;
  }

  private createBrainSummary(
    files: ScannedFile[],
    frameworks: string[],
    languages: string[],
    components: ArchitectureComponent[],
  ): string {
    const stack = [...frameworks, ...languages].slice(0, 5).join(", ");
    const componentNames = components.slice(0, 5).map((component) => component.name).join(", ");
    return `After analyzed ${files.length} repository files${stack ? ` across ${stack}` : ""}${componentNames ? `, including ${componentNames}` : ""}.`;
  }

  private createRecommendations(brainIsEmpty: boolean, fileCount: number): string[] {
    if (!brainIsEmpty) return ["Project Brain already contains context; refresh analysis when major code changes land."];
    if (fileCount === 0) return ["Add source files or open a repository folder before asking After to understand it."];
    return ["Allow repo analysis to fill overview, intent, architecture, changelog, journey, and entity memory."];
  }
}

const unique = <T>(items: T[]): T[] => [...new Set(items)];

const uniqueBy = <T>(items: T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
