import { ProjectBrainRetriever, type SearchResult } from "../memory/retrieval";
import { BrainReader } from "../memory/brain-reader";
import { BobShellAdapter, type BobContext } from "./bob-shell-adapter";
import { CitationBuilder, type Citation } from "./citation-builder";

/**
 * Chat mode: local template-based or Bob Shell enhanced
 */
export type ChatMode = "local" | "bob";

/**
 * Chat request
 */
export interface ChatRequest {
  query: string;
  mode?: ChatMode;
  maxResults?: number;
}

/**
 * Chat response
 */
export interface ChatResponse {
  content: string;
  citations: Citation[];
  mode: ChatMode;
  success: boolean;
  error?: string;
}

/**
 * Chat Service
 * 
 * Provides chat functionality with Project Brain context.
 * Supports both local template-based responses and Bob Shell enhanced responses.
 */
export class ChatService {
  private retriever: ProjectBrainRetriever;
  private brainReader: BrainReader;
  private bobAdapter: BobShellAdapter;
  private citationBuilder: CitationBuilder;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.retriever = new ProjectBrainRetriever(projectPath);
    this.brainReader = new BrainReader(projectPath);
    this.bobAdapter = new BobShellAdapter();
    this.citationBuilder = new CitationBuilder();
  }

  /**
   * Process a chat query
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Search Project Brain for context
      const searchResults = await this.retriever.search(
        request.query,
        { limit: request.maxResults ?? 5 }
      );

      // Build citations
      const citations = this.citationBuilder.build(searchResults);

      // Determine mode
      let mode = request.mode ?? "local";
      
      // If Bob mode requested, check if available
      if (mode === "bob") {
        const bobAvailable = await this.bobAdapter.isAvailable();
        if (!bobAvailable) {
          mode = "local"; // Fallback to local
        }
      }

      // Generate response based on mode
      let content: string;
      let success = true;
      let error: string | undefined;

      if (mode === "bob") {
        const bobResponse = await this.queryBob(request.query, searchResults);
        content = bobResponse.content;
        success = bobResponse.success;
        error = bobResponse.error;

        // Fallback to local if Bob fails
        if (!success) {
          mode = "local";
          content = await this.generateLocalResponse(request.query, searchResults);
          success = true;
          error = undefined;
        }
      } else {
        content = await this.generateLocalResponse(request.query, searchResults);
      }

      // Add citations to response
      const citationMarkdown = this.citationBuilder.formatAsMarkdown(citations);
      content = content + citationMarkdown;

      return {
        content,
        citations,
        mode,
        success,
        error,
      };
    } catch (error) {
      return {
        content: "",
        citations: [],
        mode: "local",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Query Bob Shell with context
   */
  private async queryBob(query: string, searchResults: SearchResult[]) {
    const context: BobContext = {
      query,
      searchResults,
      projectPath: this.projectPath,
    };

    return await this.bobAdapter.query(context);
  }

  /**
   * Generate local template-based response
   */
  private async generateLocalResponse(query: string, searchResults: SearchResult[]): Promise<string> {
    if (searchResults.length === 0) {
      return this.generateNoContextResponse(query);
    }

    if (searchResults.some((result) => result.matches.includes("project-brain-overview"))) {
      return this.generateProjectBrainOverviewResponse();
    }

    // Build response from search results
    const parts: string[] = [];
    
    parts.push(`Based on your Project Brain, here's what I found about "${query}":\n`);

    // Summarize top results
    for (const result of searchResults.slice(0, 3)) {
      parts.push(`\n**From ${result.file}:**`);
      parts.push(result.preview);
    }

    parts.push("\n\nThis information comes from your project's captured context.");

    return parts.join("\n");
  }

  private async generateProjectBrainOverviewResponse(): Promise<string> {
    const parts: string[] = ["Here's what your Project Brain currently has captured:\n"];

    try {
      const overview = await this.brainReader.readOverview();
      parts.push(`- Project: ${overview.projectName} (${overview.status}).`);
      parts.push(
        overview.summary
          ? `- Summary: ${overview.summary}`
          : "- Summary: not filled in yet.",
      );
      parts.push(
        overview.frameworks.length > 0
          ? `- Frameworks: ${overview.frameworks.join(", ")}.`
          : "- Frameworks: none recorded yet.",
      );
    } catch {
      parts.push("- Overview: not available yet.");
    }

    try {
      const journey = await this.brainReader.readJourney();
      if (journey.length > 0) {
        const latest = journey[journey.length - 1]!;
        parts.push(`- Journey: ${journey.length} entr${journey.length === 1 ? "y" : "ies"} recorded. Latest: ${latest.title} - ${latest.narrative}`);
      } else {
        parts.push("- Journey: no entries recorded yet.");
      }
    } catch {
      parts.push("- Journey: not available yet.");
    }

    try {
      const changes = await this.brainReader.readChangelog();
      parts.push(
        changes.length > 0
          ? `- Changes: ${changes.length} changelog entr${changes.length === 1 ? "y" : "ies"} recorded.`
          : "- Changes: no changelog entries recorded yet.",
      );
    } catch {
      parts.push("- Changes: not available yet.");
    }

    try {
      const decisions = await this.brainReader.readDecisions();
      parts.push(
        decisions.length > 0
          ? `- Decisions: ${decisions.length} decision${decisions.length === 1 ? "" : "s"} recorded.`
          : "- Decisions: no decisions recorded yet.",
      );
    } catch {
      parts.push("- Decisions: not available yet.");
    }

    try {
      const architecture = await this.brainReader.readArchitecture();
      parts.push(
        architecture.overview || architecture.components.length > 0
          ? `- Architecture: ${architecture.overview || `${architecture.components.length} component${architecture.components.length === 1 ? "" : "s"} recorded`}.`
          : "- Architecture: not documented yet.",
      );
    } catch {
      parts.push("- Architecture: not available yet.");
    }

    parts.push("\nSo yes, the system has a Project Brain, but right now it is still sparse. As you capture more snapshots, changes, decisions, and journey entries, answers will become richer.");

    return parts.join("\n");
  }

  /**
   * Generate response when no context is found
   */
  private generateNoContextResponse(query: string): string {
    return `I couldn't find specific information about "${query}" in your Project Brain yet. 

This could mean:
- The project is still being captured
- This topic hasn't been documented yet
- Try rephrasing your question

You can use the /snapshot command to capture important moments, or continue working and let After capture your development journey automatically.`;
  }

  /**
   * Check if Bob Shell is available
   */
  async isBobAvailable(): Promise<boolean> {
    return await this.bobAdapter.isAvailable();
  }
}

// Made with Bob
