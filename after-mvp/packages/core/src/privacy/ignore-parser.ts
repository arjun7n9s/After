import { readFile } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";

/**
 * IgnoreParser
 * 
 * Parses .gitignore and .afterignore files to determine which files
 * should be excluded from capture.
 */
export class IgnoreParser {
  private patterns: string[] = [];
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Load and parse .gitignore file
   */
  async parseGitignore(): Promise<string[]> {
    try {
      const content = await readFile(join(this.projectPath, ".gitignore"), "utf8");
      return this.parseIgnoreFile(content);
    } catch {
      return [];
    }
  }

  /**
   * Load and parse .afterignore file
   */
  async parseAfterignore(): Promise<string[]> {
    try {
      const content = await readFile(join(this.projectPath, ".afterignore"), "utf8");
      return this.parseIgnoreFile(content);
    } catch {
      return [];
    }
  }

  /**
   * Load all ignore patterns
   */
  async loadPatterns(): Promise<void> {
    const gitignore = await this.parseGitignore();
    const afterignore = await this.parseAfterignore();
    
    // Combine and deduplicate patterns
    this.patterns = [...new Set([...gitignore, ...afterignore])];
  }

  /**
   * Check if a file path should be ignored
   */
  isIgnored(filePath: string): boolean {
    const normalizedPath = this.normalizePath(filePath);

    for (const pattern of this.patterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all loaded patterns
   */
  getPatterns(): string[] {
    return [...this.patterns];
  }

  /**
   * Parse ignore file content into patterns
   */
  private parseIgnoreFile(content: string): string[] {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")) // Remove empty lines and comments
      .map((line) => line.replace(/\\/g, "/")); // Normalize path separators
  }

  /**
   * Check if a path matches an ignore pattern
   * Supports basic glob patterns: *, **, ?, [abc]
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Handle negation patterns (starting with !)
    if (pattern.startsWith("!")) {
      return !this.matchesPattern(path, pattern.slice(1));
    }

    // Handle directory-only patterns (ending with /)
    if (pattern.endsWith("/")) {
      const dirPattern = pattern.slice(0, -1);
      return path.startsWith(dirPattern + "/") || path === dirPattern;
    }

    // Handle patterns starting with /
    if (pattern.startsWith("/")) {
      pattern = pattern.slice(1);
    }

    // Convert glob pattern to regex
    const regexPattern = this.globToRegex(pattern);
    const regex = new RegExp(`^${regexPattern}$`);

    // Check if path matches
    return regex.test(path) || regex.test(path.split("/").pop() || "");
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): string {
    let regex = "";
    let i = 0;

    while (i < pattern.length) {
      const char = pattern[i];

    switch (char) {
        case "*":
          if (pattern[i + 1] === "*") {
            // ** matches any number of directories
            regex += ".*";
            i += 2;
          } else {
            // * matches anything except /
            regex += "[^/]*";
            i++;
          }
          break;

        case "?":
          // ? matches any single character except /
          regex += "[^/]";
          i++;
          break;

        case "[":
          // Character class
          {
            const closeIndex = pattern.indexOf("]", i);
            if (closeIndex !== -1) {
              const charClass = pattern.slice(i, closeIndex + 1);
              regex += charClass;
              i = closeIndex + 1;
            } else {
              regex += "\\[";
              i++;
            }
          }
          break;

        case ".":
        case "(":
        case ")":
        case "+":
        case "|":
        case "^":
        case "$":
        case "{":
        case "}":
          // Escape regex special characters
          regex += "\\" + char;
          i++;
          break;

        default:
          regex += char;
          i++;
      }
    }

    return regex;
  }

  private normalizePath(filePath: string): string {
    const relativePath = isAbsolute(filePath)
      ? relative(this.projectPath, filePath)
      : filePath;

    return relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
  }
}

// Made with Bob
