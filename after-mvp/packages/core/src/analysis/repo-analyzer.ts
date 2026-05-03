import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import simpleGit from "simple-git";

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

type RepositoryModel = {
  packages: Array<{ name: string; path: string; scripts: string[]; technologies: string[] }>;
  scripts: Array<{ name: string; command: string; source: string }>;
  modules: Array<{ name: string; fileCount: number; samplePath: string; purpose: string }>;
  uiRoutes: Array<{ route: string; source: string }>;
  apiRoutes: Array<{ method: string; route: string; source: string }>;
  configFiles: string[];
  docs: string[];
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
    const repositoryModel = this.createRepositoryModel(files.scanned, packageFiles, components);
    const now = new Date();
    const summary = this.createBrainSummary(files.scanned, frameworks, languages, components, repositoryModel);
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
        "Open any working repository and connect After to that folder.",
        "Build a local Project Brain from source files, manifests, docs, routes, and commands.",
        "Generate cited README, chat context, and demo video assets from the captured evidence.",
      ]),
      successCriteria: unique([
        ...currentIntent.successCriteria,
        "Dashboard shows the connected repository, commands, routes, modules, and generated assets.",
        "Project Brain search, README generation, and demo video scripts cite scanned files.",
      ]),
    };
    const updatedArchitecture: Architecture = {
      ...currentArchitecture,
      metadata: { ...currentArchitecture.metadata, updatedAt: now.toISOString() },
      overview: this.createArchitectureOverview(repositoryModel, components),
      components,
      dataFlow: unique([
        ...currentArchitecture.dataFlow,
        "A developer launches After inside a project folder and opens the local dashboard URL.",
        "The repository scanner applies privacy filters, reads manifests, docs, source modules, UI routes, API routes, and environment hints, then writes cited Project Brain files.",
        "Dashboard, chat, README generation, Files, and video rendering read from the Project Brain and outputs directory.",
        ...repositoryModel.uiRoutes.slice(0, 5).map((route) => `UI route ${route.route} is implemented in ${route.source}.`),
        ...repositoryModel.apiRoutes.slice(0, 5).map((route) => `API ${route.method} ${route.route} is implemented in ${route.source}.`),
      ]),
      risks: unique([
        ...currentArchitecture.risks,
        "Generated context depends on the files the user allows After to inspect.",
        "LLM-enhanced outputs require IBM Pro/watsonx credentials; otherwise After uses deterministic local analysis.",
      ]),
    };
    const analysisChange: ChangeEntry = {
      id: `repo-analysis-${Date.now()}`,
      date: now.toISOString(),
      type: "documented",
      summary: "Repository context analyzed into Project Brain",
      details: `Scanned ${files.scanned.length} files, ${repositoryModel.packages.length} package manifest(s), ${repositoryModel.modules.length} module area(s), ${repositoryModel.uiRoutes.length} UI route(s), and ${repositoryModel.apiRoutes.length} API route(s).`,
      sources: files.scanned.slice(0, 8).map((file) => ({ path: file.path })),
    };
    const analysisJourney: JourneyEntry = {
      id: `journey-repo-analysis-${Date.now()}`,
      timestamp: now.toISOString(),
      kind: "milestone",
      title: "Repository context understood",
      narrative: `A developer allowed After to understand this folder. After inspected manifests, docs, source modules, routes, commands, and ${languages.join(", ") || "source"} files, then refreshed the Project Brain with cited context.`,
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
        ...repositoryModel.modules.map((module) => ({
          id: slug(`module-${module.name}`),
          name: module.name,
          type: "module" as const,
          description: module.purpose,
          sources: [{ path: module.samplePath }],
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

  async getRecentCommitCount(days = 14): Promise<number> {
    const activity = await this.getRecentCommitActivity(days);
    return activity.reduce((total, count) => total + count, 0);
  }

  async getRecentCommitActivity(days = 14): Promise<number[]> {
    try {
      const git = simpleGit(this.projectPath);
      if (!(await git.checkIsRepo())) return Array.from({ length: days }, () => 0);
      const start = startOfLocalDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
      const since = start.toISOString();
      const log = await git.log({ "--since": since, maxCount: 100 });
      const buckets = Array.from({ length: days }, () => 0);

      for (const commit of log.all) {
        const commitDay = startOfLocalDay(new Date(commit.date));
        const dayIndex = Math.floor((commitDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < buckets.length) {
          buckets[dayIndex] = (buckets[dayIndex] ?? 0) + 1;
        }
      }

      return buckets;
    } catch {
      return Array.from({ length: days }, () => 0);
    }
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

  private createRepositoryModel(
    files: ScannedFile[],
    packageFiles: Array<{ path: string; data: PackageJson }>,
    components: ArchitectureComponent[],
  ): RepositoryModel {
    const scripts = this.detectScripts(packageFiles);
    const packages = packageFiles.map((file) => ({
      name: file.data.name || dirname(file.path),
      path: file.path,
      scripts: Object.keys(file.data.scripts ?? {}),
      technologies: this.detectFrameworks([{ data: file.data }]),
    }));
    const modules = components
      .filter((component) => !component.sources[0]?.path.endsWith("package.json"))
      .slice(0, 12)
      .map((component) => ({
        name: component.name,
        fileCount: Number(component.responsibility.match(/(\d+) analyzed/)?.[1] ?? 0),
        samplePath: component.sources[0]?.path ?? component.name,
        purpose: this.describeModule(component.name, files),
      }));
    const uiRoutes = this.detectUiRoutes(files);
    const apiRoutes = this.detectApiRoutes(files);
    const configFiles = files
      .map((file) => file.path)
      .filter((path) => /(^|\/)(\.env\.example|vite\.config|tsconfig|turbo\.json|eslint\.config|tailwind\.config|package\.json)$/i.test(path))
      .slice(0, 20);
    const docs = files
      .map((file) => file.path)
      .filter((path) => /\.md$/i.test(path) && !path.startsWith("brain/"))
      .slice(0, 20);

    return { packages, scripts, modules, uiRoutes, apiRoutes, configFiles, docs };
  }

  private detectUiRoutes(files: ScannedFile[]): RepositoryModel["uiRoutes"] {
    const routes: RepositoryModel["uiRoutes"] = [];
    for (const file of files) {
      if (!/\.(tsx|jsx)$/.test(file.extension) || !file.content) continue;
      const matches = [...file.content.matchAll(/<Route[^>]+path=["']([^"']+)["']/g)];
      for (const match of matches) {
        routes.push({ route: match[1] || "/", source: file.path });
      }
    }
    return uniqueBy(routes, (route) => `${route.route}:${route.source}`).slice(0, 30);
  }

  private detectApiRoutes(files: ScannedFile[]): RepositoryModel["apiRoutes"] {
    const routes: RepositoryModel["apiRoutes"] = [];
    const routePattern = /\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g;
    for (const file of files) {
      if (!/\.(ts|js|tsx|jsx)$/.test(file.extension) || !file.content) continue;
      const matches = [...file.content.matchAll(routePattern)];
      for (const match of matches) {
        routes.push({
          method: (match[1] || "use").toUpperCase(),
          route: match[2] || "/",
          source: file.path,
        });
      }
    }
    return uniqueBy(routes, (route) => `${route.method}:${route.route}:${route.source}`).slice(0, 40);
  }

  private describeModule(moduleName: string, files: ScannedFile[]): string {
    const moduleFiles = files.filter((file) => file.path.startsWith(`${moduleName}/`));
    const names = moduleFiles.map((file) => basename(file.path).toLowerCase());
    if (names.some((name) => name.includes("screen") || name.includes("component"))) {
      return `${moduleName} contains user-facing UI screens and reusable interface components.`;
    }
    if (names.some((name) => name.includes("route") || name.includes("server") || name.includes("api"))) {
      return `${moduleName} contains server/API code for local dashboard and Project Brain workflows.`;
    }
    if (names.some((name) => name.includes("generator") || name.includes("template"))) {
      return `${moduleName} contains generation logic for polished project outputs.`;
    }
    if (names.some((name) => name.includes("test") || name.includes("spec"))) {
      return `${moduleName} includes implementation and test coverage for this repository area.`;
    }
    return `${moduleName} is a repository area with ${moduleFiles.length} analyzed source/documentation file(s).`;
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
    repositoryModel: RepositoryModel,
  ): string {
    const stack = [...frameworks, ...languages].slice(0, 5).join(", ");
    const componentNames = components.slice(0, 5).map((component) => component.name).join(", ");
    const workflowSignals = [
      repositoryModel.scripts.length ? `${repositoryModel.scripts.length} npm script(s)` : "",
      repositoryModel.uiRoutes.length ? `${repositoryModel.uiRoutes.length} UI route(s)` : "",
      repositoryModel.apiRoutes.length ? `${repositoryModel.apiRoutes.length} API route(s)` : "",
      repositoryModel.docs.length ? `${repositoryModel.docs.length} doc file(s)` : "",
    ].filter(Boolean).join(", ");
    return `After connected to this repository and built a local Project Brain from ${files.length} source and documentation files${stack ? ` across ${stack}` : ""}${componentNames ? `, including ${componentNames}` : ""}${workflowSignals ? `. It detected ${workflowSignals}` : ""}.`;
  }

  private createArchitectureOverview(
    repositoryModel: RepositoryModel,
    components: ArchitectureComponent[],
  ): string {
    const componentNames = components.slice(0, 4).map((component) => component.name).join(", ");
    const packageSummary = repositoryModel.packages.length
      ? `${repositoryModel.packages.length} package manifest(s)`
      : "the detected source tree";
    return `The project is organized around ${componentNames || packageSummary}. After identified ${packageSummary}, ${repositoryModel.modules.length} module area(s), ${repositoryModel.uiRoutes.length} UI route(s), ${repositoryModel.apiRoutes.length} API route(s), ${repositoryModel.configFiles.length} config/env file(s), and ${repositoryModel.docs.length} documentation file(s).`;
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

const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
