import { Router } from "express";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import {
  BrainReader,
  BrainWriter,
  ChatService,
  RepoAnalyzer,
  loadIBMProConfig,
  IBMProService,
} from "@after/core";
import {
  AbstractGenerator,
  ReadmeGenerator,
  ChangelogGenerator,
  JourneyGenerator,
} from "@after/outputs";
import { StoryboardGenerator, VideoRenderPlanner, renderDemoVideo } from "@after/video";
import type { StoryboardTone } from "@after/video";

export const createBobRouter = (projectPath: string) => {
  const router = Router();
  const reader = new BrainReader(projectPath);
  const writer = new BrainWriter(projectPath);
  const chatService = new ChatService(projectPath);
  const repoAnalyzer = new RepoAnalyzer(projectPath);
  const renderPlanner = new VideoRenderPlanner();
  const outputRoot = join(projectPath, "outputs");
  const captureRoot = join(projectPath, "brain", "captures");

  // Initialize IBM Pro Mode if configured
  const ibmProConfig = loadIBMProConfig();
  const ibmProService = new IBMProService(ibmProConfig, reader);

  /**
   * POST /api/bob/narrate
   * Activate narrator mode and return project status
   */
  router.post("/narrate", async (req, res) => {
    try {
      const overview = await reader.readOverview();
      const journey = await reader.readJourney();
      const lastEntry = journey[journey.length - 1];

      res.json({
        success: true,
        message: `Narrator Mode activated for ${overview.projectName}`,
        data: {
          projectName: overview.projectName,
          status: overview.status,
          lastActivity: lastEntry?.timestamp,
          journeyEntries: journey.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to activate narrator mode",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/snapshot
   * Capture a snapshot (screenshot, terminal, decision, milestone)
   */
  router.post("/snapshot", async (req, res) => {
    try {
      const { type, title, content, context } = req.body;

      if (!type || !["screenshot", "terminal", "decision", "milestone"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid snapshot type",
        });
      }

      const timestamp = new Date().toISOString();
      const id = `${type}-${Date.now()}`;

      // Handle different snapshot types
      if (type === "screenshot" || type === "terminal") {
        const mediaPath =
          typeof context?.path === "string" && context.path.trim()
            ? context.path
            : `brain/captures/${type === "screenshot" ? "screenshots" : "terminal"}/${id}.txt`;

        await writer.addMedia({
          id,
          type,
          path: mediaPath,
          capturedAt: timestamp,
          caption: title || content || `${type} snapshot`,
          sources: typeof context?.source === "string" ? [{ path: context.source }] : [],
        });
        await writer.appendJourneyEntry({
          id: `journey-${id}`,
          timestamp,
          kind: "milestone",
          title: title || `${type} snapshot captured`,
          narrative: content || `Captured ${type} evidence for demo generation.`,
          sources: [{ path: mediaPath }],
        });
      } else if (type === "decision") {
        await writer.appendDecision({
          id,
          date: timestamp,
          title: title || "Untitled Decision",
          context: context || "",
          decision: content || "",
          consequences: [],
          sources: [],
        });
      } else if (type === "milestone") {
        await writer.appendJourneyEntry({
          id,
          timestamp,
          kind: "milestone",
          title: title || "Milestone Reached",
          narrative: content || "",
          sources: [],
        });
      }

      res.json({
        success: true,
        message: `Captured ${type} snapshot`,
        data: { id, type, timestamp },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to capture snapshot",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/search
   * Search Project Brain with local ranking and citations
   */
  router.get("/search", async (req, res) => {
    try {
      const query = (req.query.q as string | undefined)?.trim() ?? "";
      const requestedLimit = Number(req.query.limit ?? 8);
      const limit =
        Number.isFinite(requestedLimit) && requestedLimit > 0
          ? requestedLimit
          : undefined;

      if (!query) {
        return res.json({
          success: true,
          message: "No search query provided",
          data: { query, results: [] },
        });
      }

      const results = await reader.search(query);

      res.json({
        success: true,
        message: `Found ${results.length} results for "${query}"`,
        data: {
          query,
          results: limit ? results.slice(0, limit) : results,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to search Project Brain",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/status
   * Search Project Brain or return project status
   */
  router.get("/status", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;

      if (query) {
        // Search mode
        const results = await reader.search(query);
        res.json({
          success: true,
          message: `Found ${results.length} results for "${query}"`,
          data: { query, results },
        });
      } else {
        // Status mode
        const overview = await reader.readOverview();
        const decisions = await reader.readDecisions();
        const changelog = await reader.readChangelog();
        const journey = await reader.readJourney();
        const media = await reader.readMedia();
        const commitEntries = journey.filter((entry) =>
          entry.title.toLowerCase().startsWith("commit:"),
        );
        const recentCommitActivity = await repoAnalyzer.getRecentCommitActivity(14);
        const recentCommitCount = recentCommitActivity.reduce((total, count) => total + count, 0);

        res.json({
          success: true,
          message: "Project status",
          data: {
            projectName: overview.projectName,
            status: overview.status,
            summary: overview.summary,
            repositoryPath: overview.repositoryPath,
            primaryLanguage: overview.primaryLanguage,
            frameworks: overview.frameworks,
            stats: {
              decisions: decisions.length,
              changes: changelog.length,
              journeyEntries: journey.length,
              commits: Math.max(commitEntries.length, recentCommitCount),
              commitActivity: recentCommitActivity,
              media: media.length,
            },
          },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get status",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/events
   * Return timeline events from Project Brain
   */
  router.get("/events", async (_req, res) => {
    try {
      const [changelog, journey] = await Promise.all([
        reader.readChangelog(),
        reader.readJourney(),
      ]);

      const changeEvents = changelog.map((entry) => ({
        id: entry.id,
        type:
          entry.type === "added"
            ? "file:added"
            : entry.type === "removed"
              ? "file:deleted"
              : "file:changed",
        title: entry.summary,
        summary: entry.details || entry.summary,
        timestamp: entry.date,
        source: entry.sources[0]?.path,
      }));

      const journeyEvents = journey.map((entry) => ({
        id: entry.id,
        type:
          entry.kind === "milestone"
            ? "milestone:reached"
            : entry.kind === "decision"
              ? "decision:made"
              : "git:commit",
        title: entry.title,
        summary: entry.narrative || entry.title,
        timestamp: entry.timestamp,
        source: entry.sources[0]?.path,
      }));

      res.json({
        success: true,
        data: {
          events: [...changeEvents, ...journeyEvents].sort(
            (left, right) =>
              new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
          ),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to read events",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/readme
   * Generate README from Project Brain
   */
  router.post("/readme", async (req, res) => {
    try {
      const output = ibmProService.isWatsonxAvailable()
        ? {
            ...(await ibmProService.generateOutput(
              "readme",
              await buildBrainContext(reader),
            )),
            metadata: {
              generator: "watsonx.ai",
              generatedAt: new Date().toISOString(),
            },
          }
        : await new ReadmeGenerator(reader, { projectPath }).generate();
      const outputPath = await writeGeneratedOutput("README.generated.md", output.content);

      res.json({
        success: true,
        message: "README generated",
        data: {
          content: output.content,
          citations: output.citations,
          metadata: output.metadata,
          outputPath,
          fileName: "README.generated.md",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate README",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/changelog
   * Generate CHANGELOG from Project Brain
   */
  router.post("/changelog", async (req, res) => {
    try {
      const generator = new ChangelogGenerator(reader, { projectPath });
      const output = await generator.generate();
      await writeGeneratedOutput("CHANGELOG.generated.md", output.content);

      res.json({
        success: true,
        message: "CHANGELOG generated",
        data: {
          content: output.content,
          citations: output.citations,
          metadata: output.metadata,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate CHANGELOG",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/journey
   * Generate journey report from Project Brain
   */
  router.post("/journey", async (req, res) => {
    try {
      const generator = new JourneyGenerator(reader, { projectPath });
      const output = await generator.generate();
      await writeGeneratedOutput("JOURNEY.generated.md", output.content);

      res.json({
        success: true,
        message: "Journey report generated",
        data: {
          content: output.content,
          citations: output.citations,
          metadata: output.metadata,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate journey report",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/abstract
   * Generate HTML abstract from Project Brain
   */
  router.post("/abstract", async (req, res) => {
    try {
      const generator = new AbstractGenerator(reader, { projectPath });
      const output = await generator.generate();
      await writeGeneratedOutput("abstract.generated.html", output.content);

      res.json({
        success: true,
        message: "Abstract generated",
        data: {
          content: output.content,
          citations: output.citations,
          metadata: output.metadata,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate abstract",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/storyboard
   * Generate demo storyboard from Project Brain
   */
  router.post("/storyboard", async (req, res) => {
    try {
      const generator = new StoryboardGenerator(projectPath);
      const requestedTone = req.body?.tone;
      const storyboard = await generator.generate({
        maxTimelineScenes:
          typeof req.body?.maxTimelineScenes === "number"
            ? req.body.maxTimelineScenes
            : undefined,
        tone: isStoryboardTone(requestedTone) ? requestedTone : undefined,
      });

      res.json({
        success: true,
        message: "Storyboard generated",
        data: { storyboard },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate storyboard",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/video/render
   * Render a demo video and supporting artifacts from Project Brain
   */
  router.post("/video/render", async (req, res) => {
    try {
      const generator = new StoryboardGenerator(projectPath);
      const requestedTone = req.body?.tone;
      const storyboard = await generator.generate({
        maxTimelineScenes:
          typeof req.body?.maxTimelineScenes === "number"
            ? req.body.maxTimelineScenes
            : undefined,
        tone: isStoryboardTone(requestedTone) ? requestedTone : undefined,
      });
      const renderPlan = await renderPlanner.writeArtifacts(projectPath, storyboard, {
        fps: typeof req.body?.fps === "number" ? req.body.fps : undefined,
        width: typeof req.body?.width === "number" ? req.body.width : undefined,
        height: typeof req.body?.height === "number" ? req.body.height : undefined,
      });
      const renderedVideo = await renderDemoVideo(storyboard, renderPlan);

      res.json({
        success: true,
        message: "Video rendered",
        data: {
          storyboard,
          renderPlan,
          renderedVideo,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to render video",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/files
   * List generated output assets and captured Brain artifacts.
   */
  router.get("/files", async (_req, res) => {
    try {
      const files = await listProjectFiles(outputRoot, captureRoot);

      res.json({
        success: true,
        message: "Project files",
        data: { outputRoot, captureRoot, files },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to list project files",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/files/content?path=...
   * Read a generated or captured text asset for preview.
   */
  router.get("/files/content", async (req, res) => {
    try {
      const requestedPath = String(req.query.path ?? "");
      const resolvedPath = resolveProjectFilePath(outputRoot, captureRoot, requestedPath);
      const extension = extname(resolvedPath).toLowerCase();

      if (!isPreviewableExtension(extension)) {
        return res.status(415).json({
          success: false,
          message: "File type cannot be previewed as text",
        });
      }

      const content = await readFile(resolvedPath, "utf8");

      res.json({
        success: true,
        message: "Project file content",
        data: {
          path: requestedPath,
          name: basename(resolvedPath),
          extension,
          content,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to read generated file",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/chat
   * Chat with Project Brain context
   */
  router.post("/chat", async (req, res) => {
    try {
      const { query, mode, maxResults } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      const response = await chatService.chat({
        query,
        mode: mode === "bob" ? "bob" : "local",
        maxResults,
      });

      res.json({
        success: response.success,
        message: response.success ? "Chat response generated" : "Chat failed",
        data: {
          content: response.content,
          citations: response.citations,
          mode: response.mode,
        },
        error: response.error,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to process chat",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/chat/status
   * Check if Bob Shell is available
   */
  router.get("/chat/status", async (req, res) => {
    try {
      const bobAvailable = await chatService.isBobAvailable();

      res.json({
        success: true,
        data: {
          bobAvailable,
          defaultMode: bobAvailable ? "bob" : "local",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to check chat status",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/verify-brain
   * Verify Project Brain integrity
   */
  router.post("/verify-brain", async (req, res) => {
    try {
      const errors: string[] = [];

      // Try to read and validate each brain file
      try {
        await reader.readOverview();
      } catch (e) {
        errors.push(`overview.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readIntent();
      } catch (e) {
        errors.push(`intent.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readArchitecture();
      } catch (e) {
        errors.push(`architecture.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readDecisions();
      } catch (e) {
        errors.push(`decisions.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readChangelog();
      } catch (e) {
        errors.push(`changelog.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readJourney();
      } catch (e) {
        errors.push(`journey.md: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readEntities();
      } catch (e) {
        errors.push(`entities.json: ${e instanceof Error ? e.message : String(e)}`);
      }

      try {
        await reader.readMedia();
      } catch (e) {
        errors.push(`media.json: ${e instanceof Error ? e.message : String(e)}`);
      }

      if (errors.length > 0) {
        res.json({
          success: false,
          message: `Found ${errors.length} integrity issues`,
          data: { errors },
        });
      } else {
        res.json({
          success: true,
          message: "Project Brain integrity verified - all files valid",
          data: { errors: [] },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to verify brain",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/ibm/status
   * Get IBM Pro Mode status
   */
  router.get("/ibm/status", async (req, res) => {
    try {
      const status = ibmProService.getStatus();

      res.json({
        success: true,
        message: "IBM Pro Mode status",
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get IBM Pro status",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/ibm/chat
   * Enhanced chat with watsonx.ai
   */
  router.post("/ibm/chat", async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      if (!ibmProService.isWatsonxAvailable()) {
        return res.status(503).json({
          success: false,
          message: "Watsonx.ai is not configured",
        });
      }

      // Search Project Brain for context
      const searchResults = await reader.search(query);

      // Use watsonx.ai for enhanced chat
      const response = await ibmProService.chat(query, searchResults);

      res.json({
        success: true,
        message: "Chat response generated with watsonx.ai",
        data: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to process IBM Pro chat",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/repo/status
   * Inspect configured repository and decide whether the user should approve analysis.
   */
  router.get("/repo/status", async (_req, res) => {
    try {
      const status = await repoAnalyzer.inspect();

      res.json({
        success: true,
        message: "Repository analysis status",
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to inspect repository",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/repo/analyze
   * Analyze local repository files and fill the Project Brain after user consent.
   */
  router.post("/repo/analyze", async (_req, res) => {
    try {
      const result = await repoAnalyzer.analyzeAndWriteBrain();

      res.json({
        success: true,
        message: "Repository context added to Project Brain",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to analyze repository",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/video/status
   * Report whether demo video assets can be prepared from current context.
   */
  router.get("/video/status", async (_req, res) => {
    try {
      const [media, journey, changelog] = await Promise.all([
        reader.readMedia(),
        reader.readJourney(),
        reader.readChangelog(),
      ]);
      const screenshotCount = media.filter((item) => item.type === "screenshot").length;
      const repoAnalysisDone = changelog.some((entry) => entry.id.startsWith("repo-analysis-"));
      const hasNarrativeContext = journey.length > 1 || repoAnalysisDone;
      const canGenerate = screenshotCount > 0 || hasNarrativeContext;

      res.json({
        success: true,
        message: "Video readiness status",
        data: {
          canGenerate,
          hasSnapshots: screenshotCount > 0,
          screenshotCount,
          hasNarrativeContext,
          repoAnalysisDone,
          requiresRuntimeSnapshots: screenshotCount === 0,
          recommendation: canGenerate
            ? screenshotCount > 0
              ? "Video assets can use captured snapshots."
              : "Video assets can be prepared now; run and test the project to add richer snapshots."
            : "Run the project, test key flows, and capture snapshots before preparing demo video assets.",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to check video readiness",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/bob/ibm/chat/stream
   * Enhanced chat with live server-side progress events.
   */
  router.post("/ibm/chat/stream", async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    if (!ibmProService.isWatsonxAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Watsonx.ai is not configured",
      });
    }

    const startedAt = Date.now();
    const sendEvent = (event: {
      type: "progress" | "final" | "error";
      id?: string;
      title?: string;
      detail?: string;
      status?: "active" | "complete" | "error";
      data?: unknown;
    }) => {
      res.write(
        `${JSON.stringify({
          ...event,
          elapsedMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        })}\n`,
      );
    };

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      sendEvent({
        type: "progress",
        id: "request",
        title: "Request received",
        detail: `Question length: ${query.length} characters`,
        status: "complete",
      });

      sendEvent({
        type: "progress",
        id: "brain-search",
        title: "Searching Project Brain",
        detail: "Reading local memory files for relevant context",
        status: "active",
      });
      const searchResults = await reader.search(query);
      sendEvent({
        type: "progress",
        id: "brain-search",
        title: "Project Brain search complete",
        detail: `Found ${searchResults.length} matching source${searchResults.length === 1 ? "" : "s"}`,
        status: "complete",
      });

      sendEvent({
        type: "progress",
        id: "watsonx",
        title: "Calling Watsonx",
        detail: `Model: ${ibmProConfig.watsonx?.model ?? "configured watsonx.ai model"}`,
        status: "active",
      });
      const response = await ibmProService.chat(query, searchResults);
      sendEvent({
        type: "progress",
        id: "watsonx",
        title: "Watsonx response received",
        detail: `Generated ${response.content.length} characters`,
        status: "complete",
      });

      sendEvent({
        type: "progress",
        id: "citations",
        title: "Citations attached",
        detail: `${response.citations.length} citation${response.citations.length === 1 ? "" : "s"} linked`,
        status: "complete",
      });

      sendEvent({
        type: "final",
        data: response,
      });
      res.end();
    } catch (error) {
      sendEvent({
        type: "error",
        id: "chat-error",
        title: "Chat failed",
        detail: error instanceof Error ? error.message : String(error),
        status: "error",
      });
      res.end();
    }
  });

  /**
   * POST /api/bob/ibm/narration
   * Generate narration audio with IBM TTS
   */
  router.post("/ibm/narration", async (req, res) => {
    try {
      const { script, outputPath } = req.body;

      if (!script || typeof script !== "string") {
        return res.status(400).json({
          success: false,
          message: "Script is required",
        });
      }

      if (!ibmProService.isTTSAvailable()) {
        return res.status(503).json({
          success: false,
          message: "IBM TTS is not configured",
        });
      }

      const audioPath = await ibmProService.generateNarration(
        script,
        outputPath || `${projectPath}/outputs/narration.wav`
      );

      res.json({
        success: true,
        message: audioPath ? "Narration generated" : "Narration skipped (TTS not available)",
        data: { audioPath },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate narration",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/bob/ibm/voices
   * List available TTS voices
   */
  router.get("/ibm/voices", async (req, res) => {
    try {
      if (!ibmProService.isTTSAvailable()) {
        return res.status(503).json({
          success: false,
          message: "IBM TTS is not configured",
        });
      }

      const voices = await ibmProService.listTTSVoices();

      res.json({
        success: true,
        message: "TTS voices retrieved",
        data: { voices },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to list TTS voices",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;

  async function writeGeneratedOutput(fileName: string, content: string): Promise<string> {
    await mkdir(outputRoot, { recursive: true });
    const outputPath = join(outputRoot, fileName);
    await writeFile(outputPath, content, "utf8");
    return outputPath;
  }
};

const isStoryboardTone = (value: unknown): value is StoryboardTone =>
  value === "technical" || value === "pitch" || value === "journey";

type GeneratedFile = {
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  updatedAt: string;
  collection: "generated" | "captured";
  kind: "markdown" | "video" | "audio" | "image" | "html" | "json" | "text" | "other";
  previewable: boolean;
};

const listProjectFiles = async (
  outputRoot: string,
  captureRoot: string,
): Promise<GeneratedFile[]> => {
  const [generatedFiles, capturedFiles] = await Promise.all([
    listFilesWithinRoot(outputRoot, "generated", "generated"),
    listFilesWithinRoot(captureRoot, "captured", "captured"),
  ]);

  return [...capturedFiles, ...generatedFiles].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
};

const listFilesWithinRoot = async (
  root: string,
  pathPrefix: "generated" | "captured",
  collection: GeneratedFile["collection"],
): Promise<GeneratedFile[]> => {
  try {
    await mkdir(root, { recursive: true });
    const files: GeneratedFile[] = [];

    const visit = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const absolutePath = join(directory, entry.name);
        if (entry.isDirectory()) {
          if (entry.name.startsWith(".")) continue;
          await visit(absolutePath);
          continue;
        }

        const fileStat = await stat(absolutePath);
        const extension = extname(entry.name).toLowerCase();
        const relativePath = relative(root, absolutePath).replace(/\\/g, "/");
        files.push({
          path: `${pathPrefix}/${relativePath}`,
          name: entry.name,
          extension,
          sizeBytes: fileStat.size,
          updatedAt: fileStat.mtime.toISOString(),
          collection,
          kind: getGeneratedFileKind(extension),
          previewable: isPreviewableExtension(extension),
        });
      }
    };

    await visit(root);
    return files;
  } catch {
    return [];
  }
};

const resolveProjectFilePath = (
  outputRoot: string,
  captureRoot: string,
  requestedPath: string,
): string => {
  const normalizedPath = requestedPath.replace(/\\/g, "/");

  if (normalizedPath.startsWith("generated/")) {
    return resolveFileWithinRoot(outputRoot, normalizedPath.slice("generated/".length));
  }

  if (normalizedPath.startsWith("captured/")) {
    return resolveFileWithinRoot(captureRoot, normalizedPath.slice("captured/".length));
  }

  return resolveFileWithinRoot(outputRoot, normalizedPath);
};

const resolveFileWithinRoot = (root: string, requestedPath: string): string => {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(resolvedRoot, requestedPath);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new Error("Requested file path is outside the allowed directory");
  }

  return resolvedPath;
};

const isPreviewableExtension = (extension: string): boolean =>
  [".md", ".markdown", ".txt", ".json", ".html", ".htm", ".srt"].includes(extension);

const getGeneratedFileKind = (extension: string): GeneratedFile["kind"] => {
  if (extension === ".md" || extension === ".markdown") return "markdown";
  if (extension === ".mp4" || extension === ".mov" || extension === ".webm") return "video";
  if (extension === ".wav" || extension === ".mp3" || extension === ".m4a") return "audio";
  if (extension === ".png" || extension === ".jpg" || extension === ".jpeg" || extension === ".webp") return "image";
  if (extension === ".html" || extension === ".htm") return "html";
  if (extension === ".json") return "json";
  if (extension === ".txt" || extension === ".srt") return "text";
  return "other";
};

const buildBrainContext = async (reader: BrainReader): Promise<string> => {
  const [overview, intent, architecture, decisions, changelog, journey, entities] =
    await Promise.all([
      reader.readOverview(),
      reader.readIntent(),
      reader.readArchitecture(),
      reader.readDecisions(),
      reader.readChangelog(),
      reader.readJourney(),
      reader.readEntities(),
    ]);

  return [
    "# Project Brain Context",
    "",
    "## Overview",
    JSON.stringify(overview, null, 2),
    "",
    "## Intent",
    JSON.stringify(intent, null, 2),
    "",
    "## Architecture",
    JSON.stringify(architecture, null, 2),
    "",
    "## Decisions",
    JSON.stringify(decisions, null, 2),
    "",
    "## Changelog",
    JSON.stringify(changelog.slice(-20), null, 2),
    "",
    "## Journey",
    JSON.stringify(journey.slice(-20), null, 2),
    "",
    "## Entities",
    JSON.stringify(entities.slice(0, 40), null, 2),
  ].join("\n");
};

// Made with Bob
