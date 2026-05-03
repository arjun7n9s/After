import { Router } from "express";
import { BrainReader, BrainWriter, ChatService } from "@after/core";
import {
  AbstractGenerator,
  ReadmeGenerator,
  ChangelogGenerator,
  JourneyGenerator,
} from "@after/outputs";
import { StoryboardGenerator, VideoRenderPlanner } from "@after/video";
import type { StoryboardTone } from "@after/video";

export const createBobRouter = (projectPath: string) => {
  const router = Router();
  const reader = new BrainReader(projectPath);
  const writer = new BrainWriter(projectPath);
  const chatService = new ChatService(projectPath);
  const renderPlanner = new VideoRenderPlanner();

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
      if (type === "decision") {
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

        res.json({
          success: true,
          message: "Project status",
          data: {
            projectName: overview.projectName,
            status: overview.status,
            summary: overview.summary,
            stats: {
              decisions: decisions.length,
              changes: changelog.length,
              journeyEntries: journey.length,
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
      const generator = new ReadmeGenerator(reader, { projectPath });
      const output = await generator.generate();

      res.json({
        success: true,
        message: "README generated",
        data: {
          content: output.content,
          citations: output.citations,
          metadata: output.metadata,
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
   * Prepare demo video render artifacts from Project Brain
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

      res.json({
        success: true,
        message: "Video render artifacts prepared",
        data: {
          storyboard,
          renderPlan,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to prepare video render artifacts",
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

  return router;
};

const isStoryboardTone = (value: unknown): value is StoryboardTone =>
  value === "technical" || value === "pitch" || value === "journey";

// Made with Bob
