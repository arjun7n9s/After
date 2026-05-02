import { Router } from "express";
import { BrainReader, BrainWriter } from "@after/core";

export const createBobRouter = (projectPath: string) => {
  const router = Router();
  const reader = new BrainReader(projectPath);
  const writer = new BrainWriter(projectPath);

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
      const overview = await reader.readOverview();
      const intent = await reader.readIntent();
      const architecture = await reader.readArchitecture();

      // Basic README generation (will be enhanced with templates in Phase 2)
      const readme = `# ${overview.projectName}

${overview.summary}

## Goals

${intent.goals.map((g) => `- ${g}`).join("\n")}

## Architecture

${architecture.overview}

### Components

${architecture.components.map((c) => `- **${c.name}**: ${c.responsibility}`).join("\n")}

## Status

Current status: ${overview.status}

---

*Generated by After MVP from Project Brain*
`;

      res.json({
        success: true,
        message: "README generated",
        data: { content: readme },
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
      const changelog = await reader.readChangelog();

      // Group by date
      const grouped = changelog.reduce(
        (acc, entry) => {
          const date = entry.date.split("T")[0] || "unknown";
          if (!acc[date]) acc[date] = [];
          acc[date].push(entry);
          return acc;
        },
        {} as Record<string, typeof changelog>,
      );

      let content = "# Changelog\n\n";
      for (const [date, entries] of Object.entries(grouped).sort().reverse()) {
        content += `## ${date}\n\n`;
        for (const entry of entries) {
          const iconMap: Record<string, string> = {
            added: "✨",
            changed: "🔧",
            fixed: "🐛",
            removed: "🗑️",
            documented: "📝",
          };
          const icon = iconMap[entry.type] || "📝";
          content += `- ${icon} ${entry.summary}\n`;
        }
        content += "\n";
      }

      res.json({
        success: true,
        message: "CHANGELOG generated",
        data: { content },
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
      const journey = await reader.readJourney();
      const overview = await reader.readOverview();

      let content = `# Development Journey: ${overview.projectName}\n\n`;
      content += `${overview.summary}\n\n`;
      content += `## Timeline\n\n`;

      for (const entry of journey) {
        const date = new Date(entry.timestamp).toLocaleString();
        const iconMap: Record<string, string> = {
          milestone: "🎯",
          decision: "🤔",
          feature: "✨",
          bug: "🐛",
          refactor: "🔧",
          capture: "📸",
          debugging: "🔍",
          note: "📝",
        };
        const icon = iconMap[entry.kind] || "📝";

        content += `### ${icon} ${entry.title}\n`;
        content += `*${date}*\n\n`;
        content += `${entry.narrative}\n\n`;
      }

      res.json({
        success: true,
        message: "Journey report generated",
        data: { content },
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

// Made with Bob
