import { EventBus } from "./event-bus";
import { FileWatcher } from "./file-watcher";
import { GitScanner } from "./git-scanner";
import { PrivacyFilter } from "../privacy/filter";
import { TrustLogger } from "../privacy/trust-logger";
import { BrainWriter } from "../memory/brain-writer";

/**
 * CaptureManager Options
 */
export type CaptureManagerOptions = {
  enableFileWatcher?: boolean;
  enableGitScanner?: boolean;
  fileWatcherOptions?: {
    ignored?: string[];
    awaitWriteFinish?: boolean;
  };
  gitScannerOptions?: {
    pollInterval?: number;
    maxCommits?: number;
  };
};

/**
 * CaptureManager
 * 
 * Orchestrates the entire capture pipeline:
 * - File watching
 * - Git scanning
 * - Privacy filtering
 * - Trust logging
 * - Brain writing
 */
export class CaptureManager {
  private projectPath: string;
  private eventBus: EventBus;
  private privacyFilter: PrivacyFilter;
  private trustLogger: TrustLogger;
  private brainWriter: BrainWriter;
  private fileWatcher: FileWatcher | null = null;
  private gitScanner: GitScanner | null = null;
  private isRunning = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.eventBus = new EventBus();
    this.privacyFilter = new PrivacyFilter(projectPath);
    this.trustLogger = new TrustLogger(projectPath);
    this.brainWriter = new BrainWriter(projectPath);
  }

  /**
   * Start the capture pipeline
   */
  async start(options: CaptureManagerOptions = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error("CaptureManager is already running");
    }

    const {
      enableFileWatcher = true,
      enableGitScanner = true,
      fileWatcherOptions = {},
      gitScannerOptions = {},
    } = options;

    // Set up event handlers
    this.setupEventHandlers();

    // Start file watcher
    if (enableFileWatcher) {
      this.fileWatcher = new FileWatcher(
        this.projectPath,
        this.eventBus,
        this.privacyFilter,
        this.trustLogger
      );
      await this.fileWatcher.start(fileWatcherOptions);
    }

    // Start git scanner
    if (enableGitScanner) {
      this.gitScanner = new GitScanner(
        this.projectPath,
        this.eventBus,
        gitScannerOptions
      );
      try {
        await this.gitScanner.start();
      } catch (error) {
        console.warn("Git scanner not started:", error);
        // Continue without git scanner if not a git repo
      }
    }

    this.isRunning = true;
  }

  /**
   * Stop the capture pipeline
   */
  async stop(): Promise<void> {
    if (this.fileWatcher) {
      await this.fileWatcher.stop();
      this.fileWatcher = null;
    }

    if (this.gitScanner) {
      this.gitScanner.stop();
      this.gitScanner = null;
    }

    this.isRunning = false;
  }

  /**
   * Check if capture manager is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get the event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get the privacy filter
   */
  getPrivacyFilter(): PrivacyFilter {
    return this.privacyFilter;
  }

  /**
   * Get the trust logger
   */
  getTrustLogger(): TrustLogger {
    return this.trustLogger;
  }

  /**
   * Get the brain writer
   */
  getBrainWriter(): BrainWriter {
    return this.brainWriter;
  }

  /**
   * Get capture statistics
   */
  async getStats(): Promise<{
    events: ReturnType<EventBus["getStats"]>;
    trust: Awaited<ReturnType<TrustLogger["getStats"]>>;
  }> {
    return {
      events: this.eventBus.getStats(),
      trust: await this.trustLogger.getStats(),
    };
  }

  /**
   * Set up event handlers to write to brain
   */
  private setupEventHandlers(): void {
    // Handle file change events
    this.eventBus.on("file:changed", async (event) => {
      try {
        await this.brainWriter.appendChange({
          id: event.id,
          date: event.timestamp,
          type: "changed",
          summary: `Modified ${event.data.path}`,
          details: "",
          sources: [{ path: event.data.path as string }],
        });
      } catch (error) {
        console.error("Error writing file change to brain:", error);
      }
    });

    // Handle file added events
    this.eventBus.on("file:added", async (event) => {
      try {
        await this.brainWriter.appendChange({
          id: event.id,
          date: event.timestamp,
          type: "added",
          summary: `Added ${event.data.path}`,
          details: "",
          sources: [{ path: event.data.path as string }],
        });
      } catch (error) {
        console.error("Error writing file addition to brain:", error);
      }
    });

    // Handle file deleted events
    this.eventBus.on("file:deleted", async (event) => {
      try {
        await this.brainWriter.appendChange({
          id: event.id,
          date: event.timestamp,
          type: "removed",
          summary: `Removed ${event.data.path}`,
          details: "",
          sources: [{ path: event.data.path as string }],
        });
      } catch (error) {
        console.error("Error writing file deletion to brain:", error);
      }
    });

    // Handle git commit events
    this.eventBus.on("git:commit", async (event) => {
      try {
        await this.brainWriter.appendJourneyEntry({
          id: event.id,
          timestamp: event.timestamp,
          kind: "milestone",
          title: `Commit: ${event.data.message}`,
          narrative: `${event.data.author} committed changes on ${event.data.branch}`,
          sources: [{ path: ".git", note: `Commit ${event.data.hash}` }],
        });
      } catch (error) {
        console.error("Error writing commit to brain:", error);
      }
    });
  }
}

// Made with Bob
