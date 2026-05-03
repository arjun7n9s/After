import { spawn } from "node:child_process";
import type { SearchResult } from "../memory/retrieval";

/**
 * Context provided to Bob Shell for enhanced responses
 */
export interface BobContext {
  query: string;
  searchResults: SearchResult[];
  projectPath: string;
  files?: string[];
}

/**
 * Response from Bob Shell
 */
export interface BobResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Options for Bob Shell Adapter
 */
export interface BobShellAdapterOptions {
  shellPath?: string;
  timeout?: number;
  maxContextLength?: number;
}

/**
 * Bob Shell Adapter
 * 
 * Provides integration with Bob Shell for enhanced chat responses.
 * Falls back gracefully when Bob Shell is not available.
 */
export class BobShellAdapter {
  private shellPath: string;
  private timeout: number;
  private maxContextLength: number;

  constructor(options: BobShellAdapterOptions = {}) {
    this.shellPath = options.shellPath ?? "bob";
    this.timeout = options.timeout ?? 30000; // 30 seconds
    this.maxContextLength = options.maxContextLength ?? 8000;
  }

  /**
   * Check if Bob Shell is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.executeCommand(["--version"], 5000);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Query Bob Shell with context from Project Brain
   */
  async query(context: BobContext): Promise<BobResponse> {
    try {
      // Format context for Bob
      const formattedContext = this.formatContext(context);

      // Build Bob Shell command
      const args = [
        "chat",
        "--context",
        formattedContext,
        "--query",
        context.query,
      ];

      // Add project path if provided
      if (context.projectPath) {
        args.push("--project", context.projectPath);
      }

      // Execute Bob Shell command
      const result = await this.executeCommand(args, this.timeout);

      return result;
    } catch (error) {
      return {
        content: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Format context for Bob Shell
   */
  private formatContext(context: BobContext): string {
    const parts: string[] = [];

    // Add search results as context
    if (context.searchResults.length > 0) {
      parts.push("# Project Brain Context\n");

      for (const result of context.searchResults.slice(0, 5)) {
        parts.push(`## ${result.file}`);
        parts.push(`Score: ${result.score.toFixed(2)}`);
        if (result.line) {
          parts.push(`Line: ${result.line}`);
        }
        parts.push(`\n${result.preview}\n`);

        if (result.matches.length > 0) {
          parts.push(`Matched: ${result.matches.join(", ")}`);
        }

        parts.push("\n---\n");
      }
    }

    // Add file references
    if (context.files && context.files.length > 0) {
      parts.push("\n# Referenced Files\n");
      parts.push(context.files.join("\n"));
    }

    const formatted = parts.join("\n");

    // Truncate if too long
    if (formatted.length > this.maxContextLength) {
      return formatted.slice(0, this.maxContextLength) + "\n\n[Context truncated...]";
    }

    return formatted;
  }

  /**
   * Execute Bob Shell command
   */
  private executeCommand(args: string[], timeout: number): Promise<BobResponse> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.shellPath, args);
      let stdout = "";
      let stderr = "";

      const timeoutId = setTimeout(() => {
        process.kill();
        reject(new Error("Bob Shell command timed out"));
      }, timeout);

      process.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      process.on("close", (code) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve({
            content: stdout.trim(),
            success: true,
          });
        } else {
          resolve({
            content: "",
            success: false,
            error: stderr.trim() || `Process exited with code ${code}`,
          });
        }
      });

      process.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
}

// Made with Bob
