import simpleGit, { type SimpleGit, type DefaultLogFields } from "simple-git";
import { EventBus, type GitEvent } from "./event-bus";

/**
 * GitScanner Options
 */
export type GitScannerOptions = {
  pollInterval?: number;
  maxCommits?: number;
};

/**
 * GitScanner
 * 
 * Scans git repository for commits and emits events through the EventBus.
 */
export class GitScanner {
  private projectPath: string;
  private git: SimpleGit;
  private eventBus: EventBus;
  private isRunning = false;
  private pollInterval: number;
  private maxCommits: number;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCommitHash: string | null = null;

  constructor(projectPath: string, eventBus: EventBus, options: GitScannerOptions = {}) {
    this.projectPath = projectPath;
    this.git = simpleGit(projectPath);
    this.eventBus = eventBus;
    this.pollInterval = options.pollInterval || 5000; // 5 seconds
    this.maxCommits = options.maxCommits || 100;
  }

  /**
   * Start scanning for git commits
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("GitScanner is already running");
    }

    // Check if directory is a git repository
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      throw new Error("Not a git repository");
    }

    // Get initial commit hash
    try {
      const log = await this.git.log({ maxCount: 1 });
      this.lastCommitHash = log.latest?.hash || null;
    } catch {
      this.lastCommitHash = null;
    }

    // Start polling
    this.isRunning = true;
    this.intervalId = setInterval(() => this.poll(), this.pollInterval);
  }

  /**
   * Stop scanning for git commits
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Check if scanner is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Scan for new commits since last check
   */
  async scanCommits(since?: Date): Promise<DefaultLogFields[]> {
    const options: Record<string, unknown> = {
      maxCount: this.maxCommits,
    };

    if (since) {
      options.from = since.toISOString();
    }

    const log = await this.git.log(options);
    return [...log.all];
  }

  /**
   * Get commit diff
   */
  async getCommitDiff(commitHash: string): Promise<string> {
    return await this.git.show([commitHash]);
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch();
    return branch.current;
  }

  /**
   * Get recent commits
   */
  async getRecentCommits(count: number): Promise<DefaultLogFields[]> {
    const log = await this.git.log({ maxCount: count });
    return [...log.all];
  }

  /**
   * Get commit by hash
   */
  async getCommit(hash: string): Promise<DefaultLogFields | null> {
    try {
      const log = await this.git.log({ maxCount: 1, from: hash, to: hash });
      return log.latest || null;
    } catch {
      return null;
    }
  }

  /**
   * Poll for new commits
   */
  private async poll(): Promise<void> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      const latestHash = log.latest?.hash;

      if (!latestHash) {
        return;
      }

      // Check if there's a new commit
      if (this.lastCommitHash && latestHash !== this.lastCommitHash) {
        // Get all new commits
        const newCommits = await this.getCommitsSince(this.lastCommitHash);
        
        // Emit events for each new commit
        for (const commit of newCommits) {
          await this.emitCommitEvent(commit);
        }
      }

      this.lastCommitHash = latestHash;
    } catch (error) {
      console.error("Error polling for commits:", error);
    }
  }

  /**
   * Get commits since a specific hash
   */
  private async getCommitsSince(sinceHash: string): Promise<DefaultLogFields[]> {
    try {
      const log = await this.git.log({
        from: sinceHash,
        to: "HEAD",
      });
      
      // Filter out the 'since' commit itself
      return log.all.filter((commit) => commit.hash !== sinceHash);
    } catch {
      return [];
    }
  }

  /**
   * Emit a commit event
   */
  private async emitCommitEvent(commit: DefaultLogFields): Promise<void> {
    try {
      // Get commit diff
      const diff = await this.getCommitDiff(commit.hash);

      const event: GitEvent = {
        id: EventBus.generateEventId(),
        type: "git:commit",
        timestamp: new Date().toISOString(),
        data: {
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name,
          branch: await this.getCurrentBranch(),
          diff,
        },
        metadata: {
          date: commit.date,
          authorEmail: commit.author_email,
        },
      };

      await this.eventBus.emit(event);
    } catch (error) {
      console.error(`Error emitting commit event for ${commit.hash}:`, error);
    }
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<{
    current: string;
    tracking: string | null;
    ahead: number;
    behind: number;
    files: Array<{ path: string; status: string }>;
  }> {
    const status = await this.git.status();
    
    return {
      current: status.current || "",
      tracking: status.tracking || null,
      ahead: status.ahead,
      behind: status.behind,
      files: status.files.map((file) => ({
        path: file.path,
        status: file.working_dir,
      })),
    };
  }

  /**
   * Check if repository has uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return !status.isClean();
  }
}

// Made with Bob
