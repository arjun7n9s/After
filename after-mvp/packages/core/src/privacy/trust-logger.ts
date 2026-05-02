import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Audit Event Types
 */
export type AuditEventType = "capture" | "block" | "redaction" | "access" | "export";

/**
 * Base Audit Entry
 */
export type AuditEntry = {
  id: string;
  timestamp: string;
  type: AuditEventType;
  action: string;
  details: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
};

/**
 * Capture Event
 */
export type CaptureEvent = {
  filePath: string;
  fileType: string;
  size: number;
  hash?: string;
};

/**
 * Block Event
 */
export type BlockEvent = {
  filePath: string;
  reason: string;
  ruleMatched?: string;
};

/**
 * Redaction Event
 */
export type RedactionEvent = {
  filePath?: string;
  secretType: string;
  secretCount: number;
  confidence: "high" | "medium" | "low";
};

/**
 * TrustLogger
 * 
 * Logs all privacy-related actions for audit and transparency.
 * Maintains an immutable audit log of captures, blocks, and redactions.
 */
export class TrustLogger {
  private projectPath: string;
  private logPath: string;
  private entries: AuditEntry[] = [];
  private sessionId: string;

  constructor(projectPath: string, sessionId?: string) {
    this.projectPath = projectPath;
    this.logPath = join(projectPath, "brain", ".trust-log.json");
    this.sessionId = sessionId || this.generateSessionId();
  }

  /**
   * Log a capture event
   */
  async logCapture(event: CaptureEvent, userId?: string): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "capture",
      action: "file_captured",
      details: event,
      userId,
      sessionId: this.sessionId,
    };

    await this.addEntry(entry);
  }

  /**
   * Log a block event
   */
  async logBlock(event: BlockEvent, userId?: string): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "block",
      action: "file_blocked",
      details: event,
      userId,
      sessionId: this.sessionId,
    };

    await this.addEntry(entry);
  }

  /**
   * Log a redaction event
   */
  async logRedaction(event: RedactionEvent, userId?: string): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "redaction",
      action: "content_redacted",
      details: event,
      userId,
      sessionId: this.sessionId,
    };

    await this.addEntry(entry);
  }

  /**
   * Log an access event
   */
  async logAccess(resource: string, action: string, userId?: string): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "access",
      action,
      details: { resource },
      userId,
      sessionId: this.sessionId,
    };

    await this.addEntry(entry);
  }

  /**
   * Log an export event
   */
  async logExport(format: string, destination: string, userId?: string): Promise<void> {
    const entry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: "export",
      action: "data_exported",
      details: { format, destination },
      userId,
      sessionId: this.sessionId,
    };

    await this.addEntry(entry);
  }

  /**
   * Get all audit entries
   */
  async getAuditLog(): Promise<AuditEntry[]> {
    await this.loadEntries();
    return [...this.entries];
  }

  /**
   * Get audit entries by type
   */
  async getEntriesByType(type: AuditEventType): Promise<AuditEntry[]> {
    await this.loadEntries();
    return this.entries.filter((entry) => entry.type === type);
  }

  /**
   * Get audit entries by session
   */
  async getEntriesBySession(sessionId: string): Promise<AuditEntry[]> {
    await this.loadEntries();
    return this.entries.filter((entry) => entry.sessionId === sessionId);
  }

  /**
   * Get audit entries by date range
   */
  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<AuditEntry[]> {
    await this.loadEntries();
    return this.entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Export audit log to JSON
   */
  async exportToJson(): Promise<string> {
    await this.loadEntries();
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Export audit log to CSV
   */
  async exportToCsv(): Promise<string> {
    await this.loadEntries();

    if (this.entries.length === 0) {
      return "id,timestamp,type,action,sessionId,userId\n";
    }

    const headers = ["id", "timestamp", "type", "action", "sessionId", "userId"];
    const rows = this.entries.map((entry) => {
      return [
        entry.id,
        entry.timestamp,
        entry.type,
        entry.action,
        entry.sessionId || "",
        entry.userId || "",
      ]
        .map((value) => `"${value}"`)
        .join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Get statistics about audit log
   */
  async getStats(): Promise<{
    totalEntries: number;
    byType: Record<AuditEventType, number>;
    bySessions: number;
    dateRange: { start: string; end: string } | null;
  }> {
    await this.loadEntries();

    const byType: Record<string, number> = {};
    const sessions = new Set<string>();
    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      if (entry.sessionId) sessions.add(entry.sessionId);

      const entryDate = new Date(entry.timestamp);
      if (!earliest || entryDate < earliest) earliest = entryDate;
      if (!latest || entryDate > latest) latest = entryDate;
    }

    return {
      totalEntries: this.entries.length,
      byType: byType as Record<AuditEventType, number>,
      bySessions: sessions.size,
      dateRange:
        earliest && latest
          ? {
              start: earliest.toISOString(),
              end: latest.toISOString(),
            }
          : null,
    };
  }

  /**
   * Clear audit log (use with caution!)
   */
  async clear(): Promise<void> {
    this.entries = [];
    await this.saveEntries();
  }

  /**
   * Add an entry to the log
   */
  private async addEntry(entry: AuditEntry): Promise<void> {
    await this.loadEntries();
    this.entries.push(entry);
    await this.saveEntries();
  }

  /**
   * Load entries from disk
   */
  private async loadEntries(): Promise<void> {
    try {
      const content = await readFile(this.logPath, "utf8");
      this.entries = JSON.parse(content) as AuditEntry[];
    } catch {
      // File doesn't exist yet, start with empty array
      this.entries = [];
    }
  }

  /**
   * Save entries to disk
   */
  private async saveEntries(): Promise<void> {
    try {
      await mkdir(join(this.projectPath, "brain"), { recursive: true });
      await writeFile(this.logPath, JSON.stringify(this.entries, null, 2), "utf8");
    } catch (error) {
      console.error("Failed to save trust log:", error);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// Made with Bob
