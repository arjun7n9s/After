import { IgnoreParser } from "./ignore-parser";
import { Redactor, type Secret } from "./redactor";

/**
 * FilterResult
 * 
 * Result of privacy filtering decision
 */
export type FilterResult = {
  allowed: boolean;
  reason: string;
  action: "allow" | "block" | "redact";
  secrets?: Secret[];
  redactedContent?: string;
};

/**
 * PrivacyFilter
 * 
 * Combines ignore patterns and secret detection to make privacy decisions.
 * Determines whether content should be captured, blocked, or redacted.
 */
export class PrivacyFilter {
  private ignoreParser: IgnoreParser;
  private redactor: Redactor;
  private projectPath: string;
  private initialized = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.ignoreParser = new IgnoreParser(projectPath);
    this.redactor = new Redactor();
  }

  /**
   * Initialize the filter by loading ignore patterns
   */
  async initialize(): Promise<void> {
    await this.ignoreParser.loadPatterns();
    this.initialized = true;
  }

  /**
   * Check if a file should be captured
   */
  async shouldCapture(filePath: string): Promise<FilterResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check ignore patterns
    if (this.ignoreParser.isIgnored(filePath)) {
      return {
        allowed: false,
        reason: `File matches ignore pattern`,
        action: "block",
      };
    }

    // Check for sensitive file extensions
    if (this.isSensitiveFile(filePath)) {
      return {
        allowed: false,
        reason: `Sensitive file type: ${this.getFileExtension(filePath)}`,
        action: "block",
      };
    }

    return {
      allowed: true,
      reason: "File passes privacy filter",
      action: "allow",
    };
  }

  /**
   * Check if content should be blocked or redacted
   */
  shouldBlock(content: string): FilterResult {
    const secrets = this.redactor.detectSecrets(content);

    if (secrets.length === 0) {
      return {
        allowed: true,
        reason: "No secrets detected",
        action: "allow",
      };
    }

    // Check if we have high-confidence secrets
    const highConfidenceSecrets = secrets.filter((s) => s.confidence === "high");

    if (highConfidenceSecrets.length > 0) {
      // Block content with high-confidence secrets
      return {
        allowed: false,
        reason: `Contains ${highConfidenceSecrets.length} high-confidence secret(s)`,
        action: "block",
        secrets: highConfidenceSecrets,
      };
    }

    // Redact medium/low confidence secrets
    const result = this.redactor.redactSecrets(content);
    return {
      allowed: true,
      reason: `Redacted ${result.redactionCount} potential secret(s)`,
      action: "redact",
      secrets: result.secrets,
      redactedContent: result.redacted,
    };
  }

  /**
   * Get the reason why a file path is blocked
   */
  getBlockReason(filePath: string): string {
    if (!this.initialized) {
      return "Filter not initialized";
    }

    if (this.ignoreParser.isIgnored(filePath)) {
      return "Matches ignore pattern";
    }

    if (this.isSensitiveFile(filePath)) {
      return `Sensitive file type: ${this.getFileExtension(filePath)}`;
    }

    return "Not blocked";
  }

  /**
   * Process content through the privacy filter
   * Returns filtered content or null if blocked
   */
  async filterContent(filePath: string, content: string): Promise<string | null> {
    // Check file path
    const fileResult = await this.shouldCapture(filePath);
    if (!fileResult.allowed) {
      return null;
    }

    // Check content
    const contentResult = this.shouldBlock(content);
    if (!contentResult.allowed) {
      return null;
    }

    // Return redacted content if needed
    if (contentResult.action === "redact" && contentResult.redactedContent) {
      return contentResult.redactedContent;
    }

    return content;
  }

  /**
   * Get statistics about filtering
   */
  getStats(content: string): {
    secretStats: Record<string, number>;
    totalSecrets: number;
  } {
    const secretStats = this.redactor.getStats(content);
    const totalSecrets = Object.values(secretStats).reduce((sum, count) => sum + count, 0);

    return {
      secretStats,
      totalSecrets,
    };
  }

  /**
   * Check if file has sensitive extension
   */
  private isSensitiveFile(filePath: string): boolean {
    const sensitiveExtensions = [
      ".env",
      ".pem",
      ".key",
      ".p12",
      ".pfx",
      ".cer",
      ".crt",
      ".der",
      ".jks",
      ".keystore",
      ".pkcs12",
      ".asc",
      ".gpg",
    ];

    const ext = this.getFileExtension(filePath).toLowerCase();
    return sensitiveExtensions.includes(ext);
  }

  /**
   * Get file extension including the dot
   */
  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filePath.slice(lastDot);
  }
}

// Made with Bob
