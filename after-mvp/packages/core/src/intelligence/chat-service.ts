import { ProjectBrainRetriever, type SearchResult } from "../memory/retrieval";
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
  private bobAdapter: BobShellAdapter;
  private citationBuilder: CitationBuilder;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.retriever = new ProjectBrainRetriever(projectPath);
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
          content = this.generateLocalResponse(request.query, searchResults);
          success = true;
          error = undefined;
        }
      } else {
        content = this.generateLocalResponse(request.query, searchResults);
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
  private generateLocalResponse(query: string, searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return this.generateNoContextResponse(query);
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
