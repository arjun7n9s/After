import chokidar, { type FSWatcher } from "chokidar";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { EventBus, type FileChangeEvent } from "./event-bus";
import { PrivacyFilter } from "../privacy/filter";
import { TrustLogger } from "../privacy/trust-logger";

/**
 * FileWatcher Options
 */
export type FileWatcherOptions = {
  ignored?: string[];
  ignoreInitial?: boolean;
  persistent?: boolean;
  awaitWriteFinish?: boolean | { stabilityThreshold?: number; pollInterval?: number };
};

const defaultIgnoredPatterns = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/brain/**",
];

/**
 * FileWatcher
 * 
 * Watches for file changes in the project directory.
 * Emits events through the EventBus and applies privacy filtering.
 */
export class FileWatcher {
  private projectPath: string;
  private watcher: FSWatcher | null = null;
  private eventBus: EventBus;
  private privacyFilter: PrivacyFilter;
  private trustLogger: TrustLogger;
  private isRunning = false;

  constructor(
    projectPath: string,
    eventBus: EventBus,
    privacyFilter: PrivacyFilter,
    trustLogger: TrustLogger
  ) {
    this.projectPath = projectPath;
    this.eventBus = eventBus;
    this.privacyFilter = privacyFilter;
    this.trustLogger = trustLogger;
  }

  /**
   * Start watching for file changes
   */
  async start(options: FileWatcherOptions = {}): Promise<void> {
    if (this.isRunning) {
      throw new Error("FileWatcher is already running");
    }

    // Initialize privacy filter
    await this.privacyFilter.initialize();

    const defaultOptions: FileWatcherOptions = {
      ignored: defaultIgnoredPatterns,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    };

    const watchOptions = {
      ...defaultOptions,
      ...options,
      ignored: [...defaultIgnoredPatterns, ...(options.ignored || [])],
    };

    // Create watcher
    this.watcher = chokidar.watch(this.projectPath, watchOptions);

    // Set up event handlers
    this.watcher
      .on("add", (path) => this.handleFileAdded(path))
      .on("change", (path) => this.handleFileChanged(path))
      .on("unlink", (path) => this.handleFileDeleted(path))
      .on("error", (error) => this.handleError(error instanceof Error ? error : new Error(String(error))));

    this.isRunning = true;
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.isRunning = false;
  }

  /**
   * Check if watcher is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle file added event
   */
  private async handleFileAdded(filePath: string): Promise<void> {
    try {
      // Check if file should be captured
      const filterResult = await this.privacyFilter.shouldCapture(filePath);
      
      if (!filterResult.allowed) {
        await this.trustLogger.logBlock({
          filePath,
          reason: filterResult.reason,
        });
        return;
      }

      // Read file content
      const content = await readFile(filePath, "utf8");
      const hash = this.calculateHash(content);

      // Check content for secrets
      const contentResult = this.privacyFilter.shouldBlock(content);
      
      if (!contentResult.allowed) {
        await this.trustLogger.logBlock({
          filePath,
          reason: contentResult.reason,
        });
        return;
      }

      // Log redactions if any
      if (contentResult.action === "redact" && contentResult.secrets) {
        await this.trustLogger.logRedaction({
          filePath,
          secretType: contentResult.secrets[0]?.type || "unknown",
          secretCount: contentResult.secrets.length,
          confidence: contentResult.secrets[0]?.confidence || "low",
        });
      }

      // Log capture
      await this.trustLogger.logCapture({
        filePath,
        fileType: this.getFileType(filePath),
        size: content.length,
        hash,
      });

      // Emit event
      const event: FileChangeEvent = {
        id: EventBus.generateEventId(),
        type: "file:added",
        timestamp: new Date().toISOString(),
        data: {
          path: filePath,
          content: contentResult.redactedContent || content,
          size: content.length,
          hash,
        },
      };

      await this.eventBus.emit(event);
    } catch (error) {
      console.error(`Error handling file added: ${filePath}`, error);
    }
  }

  /**
   * Handle file changed event
   */
  private async handleFileChanged(filePath: string): Promise<void> {
    try {
      // Check if file should be captured
      const filterResult = await this.privacyFilter.shouldCapture(filePath);
      
      if (!filterResult.allowed) {
        await this.trustLogger.logBlock({
          filePath,
          reason: filterResult.reason,
        });
        return;
      }

      // Read file content
      const content = await readFile(filePath, "utf8");
      const hash = this.calculateHash(content);

      // Check content for secrets
      const contentResult = this.privacyFilter.shouldBlock(content);
      
      if (!contentResult.allowed) {
        await this.trustLogger.logBlock({
          filePath,
          reason: contentResult.reason,
        });
        return;
      }

      // Log redactions if any
      if (contentResult.action === "redact" && contentResult.secrets) {
        await this.trustLogger.logRedaction({
          filePath,
          secretType: contentResult.secrets[0]?.type || "unknown",
          secretCount: contentResult.secrets.length,
          confidence: contentResult.secrets[0]?.confidence || "low",
        });
      }

      // Log capture
      await this.trustLogger.logCapture({
        filePath,
        fileType: this.getFileType(filePath),
        size: content.length,
        hash,
      });

      // Emit event
      const event: FileChangeEvent = {
        id: EventBus.generateEventId(),
        type: "file:changed",
        timestamp: new Date().toISOString(),
        data: {
          path: filePath,
          content: contentResult.redactedContent || content,
          size: content.length,
          hash,
        },
      };

      await this.eventBus.emit(event);
    } catch (error) {
      console.error(`Error handling file changed: ${filePath}`, error);
    }
  }

  /**
   * Handle file deleted event
   */
  private async handleFileDeleted(filePath: string): Promise<void> {
    try {
      // Emit event
      const event: FileChangeEvent = {
        id: EventBus.generateEventId(),
        type: "file:deleted",
        timestamp: new Date().toISOString(),
        data: {
          path: filePath,
        },
      };

      await this.eventBus.emit(event);
    } catch (error) {
      console.error(`Error handling file deleted: ${filePath}`, error);
    }
  }

  /**
   * Handle watcher error
   */
  private handleError(error: Error): void {
    console.error("FileWatcher error:", error);
  }

  /**
   * Calculate SHA-256 hash of content
   */
  private calculateHash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get file type from path
   */
  private getFileType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    return ext || "unknown";
  }
}

// Made with Bob
