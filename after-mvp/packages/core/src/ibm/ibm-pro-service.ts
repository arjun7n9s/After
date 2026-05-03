import type { IBMProConfig } from "./config";
import { WatsonxClient } from "./watsonx-client";
import { TTSClient } from "./tts-client";
import type { BrainReader } from "../memory/brain-reader";
import type { SearchResult } from "../memory/retrieval";
import type { Citation } from "../intelligence/citation-builder";

/**
 * IBM Pro Chat Response
 */
export interface IBMProChatResponse {
  content: string;
  citations: Citation[];
  mode: "watsonx" | "local";
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * IBM Pro Generation Response
 */
export interface IBMProGenerationResponse {
  content: string;
  citations: Citation[];
  mode: "watsonx" | "local";
}

/**
 * IBM Pro Service
 *
 * Orchestrates IBM Cloud services for enhanced functionality.
 */
export class IBMProService {
  private config: IBMProConfig;
  private watsonxClient?: WatsonxClient;
  private ttsClient?: TTSClient;
  private brainReader: BrainReader;

  constructor(config: IBMProConfig, brainReader: BrainReader) {
    this.config = config;
    this.brainReader = brainReader;

    // Initialize clients if configured
    if (config.watsonx) {
      this.watsonxClient = new WatsonxClient(config.watsonx);
    }

    if (config.tts) {
      this.ttsClient = new TTSClient(config.tts);
    }
  }

  /**
   * Check if IBM Pro Mode is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if Watsonx.ai is available
   */
  isWatsonxAvailable(): boolean {
    return this.config.enabled && !!this.watsonxClient;
  }

  /**
   * Check if IBM TTS is available
   */
  isTTSAvailable(): boolean {
    return this.config.enabled && !!this.ttsClient;
  }

  /**
   * Enhanced chat with watsonx.ai
   */
  async chat(
    query: string,
    searchResults: SearchResult[]
  ): Promise<IBMProChatResponse> {
    if (!this.watsonxClient) {
      throw new Error("Watsonx.ai is not configured");
    }

    // Build context from search results
    const context = this.watsonxClient.buildContext(searchResults);

    // Create messages
    const systemMessage = this.watsonxClient.createSystemMessage(context);
    const userMessage = {
      role: "user" as const,
      content: query,
    };

    // Call watsonx.ai
    const response = await this.watsonxClient.chat({
      model: this.config.watsonx!.model,
      messages: [systemMessage, userMessage],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Build citations
    const citations: Citation[] = searchResults.slice(0, 5).map((result, index) => ({
      id: `cite-${index + 1}`,
      file: result.file,
      line: result.line,
      preview: result.preview,
      label: result.file,
    }));

    return {
      content: response.content,
      citations,
      mode: "watsonx",
      usage: response.usage,
    };
  }

  /**
   * Enhanced output generation with watsonx.ai
   */
  async generateOutput(
    type: "readme" | "changelog" | "journey" | "abstract",
    brainContext: string
  ): Promise<IBMProGenerationResponse> {
    if (!this.watsonxClient) {
      throw new Error("Watsonx.ai is not configured");
    }

    const prompts = {
      readme: `You are writing a production-quality README.md for this exact repository, using only the Project Brain context below.

Project Brain context:
${brainContext}

Write a README that feels like it was prepared by a senior engineer after reading the repo. Avoid generic filler and marketing copy. Do not invent services, commands, endpoints, or features that are not supported by the context. If a command or setup detail is unknown, say what still needs to be confirmed.

Required structure:
- Project name and a concrete one-paragraph summary
- What the project does, with specific capabilities found in the context
- Architecture, naming important apps, packages, services, data stores, and generated outputs when known
- Getting started, including environment variables and commands only when the context supports them
- Key workflows, such as repo analysis, generated files, README/changelog/journey/abstract creation, and video/demo generation if present
- Generated assets and where to find them
- Current limitations or open questions
- Sources, citing the Project Brain files or entries that informed the README

Style rules:
- Use clear Markdown headings and compact paragraphs.
- Prefer precise bullets over broad claims.
- Make it useful for a new contributor opening the repo today.`,
      changelog: `Generate a CHANGELOG.md file from the following Project Brain context:\n\n${brainContext}\n\nGroup changes by date and use conventional commit icons (✨ added, 🔧 changed, 🐛 fixed, 🗑️ removed, 📝 documented).`,
      journey: `Generate a development journey report from the following Project Brain context:\n\n${brainContext}\n\nCreate a narrative timeline of key moments, decisions, and milestones.`,
      abstract: `Generate an HTML abstract/summary page for this project based on the following Project Brain context:\n\n${brainContext}\n\nInclude: overview, problem statement, goals, architecture, and key statistics.`,
    };

    const content = await this.watsonxClient.generate({
      prompt: prompts[type],
      model: this.config.watsonx!.model,
      max_tokens: 2048,
      temperature: 0.7,
    });

    // Build citations from brain files
    const citations: Citation[] = [
      {
        id: "cite-1",
        file: "overview.md",
        preview: "Project overview and summary",
        label: "overview.md",
      },
      {
        id: "cite-2",
        file: "intent.md",
        preview: "Project goals and intent",
        label: "intent.md",
      },
      {
        id: "cite-3",
        file: "architecture.md",
        preview: "System architecture",
        label: "architecture.md",
      },
    ];

    return {
      content,
      citations,
      mode: "watsonx",
    };
  }

  /**
   * Generate narration audio with IBM TTS
   */
  async generateNarration(script: string, outputPath: string): Promise<string | null> {
    if (!this.ttsClient) {
      // TTS not configured, skip narration
      return null;
    }

    try {
      return await this.ttsClient.generateNarration(script, outputPath);
    } catch (error) {
      console.error("IBM TTS narration failed:", error);
      return null;
    }
  }

  /**
   * Generate narration in chunks for long scripts
   */
  async generateNarrationChunks(
    script: string,
    outputDir: string
  ): Promise<string[]> {
    if (!this.ttsClient) {
      return [];
    }

    try {
      return await this.ttsClient.generateNarrationChunks(script, outputDir);
    } catch (error) {
      console.error("IBM TTS narration chunks failed:", error);
      return [];
    }
  }

  /**
   * List available TTS voices
   */
  async listTTSVoices(): Promise<Array<{ name: string; language: string; gender: string }>> {
    if (!this.ttsClient) {
      return [];
    }

    try {
      return await this.ttsClient.listVoices();
    } catch (error) {
      console.error("IBM TTS list voices failed:", error);
      return [];
    }
  }

  /**
   * Get IBM Pro status
   */
  getStatus(): {
    enabled: boolean;
    watsonx: boolean;
    tts: boolean;
    cloudant: boolean;
    nlu: boolean;
  } {
    return {
      enabled: this.config.enabled,
      watsonx: !!this.config.watsonx,
      tts: !!this.config.tts,
      cloudant: this.config.cloudant?.enabled || false,
      nlu: this.config.nlu?.enabled || false,
    };
  }
}

// Made with Bob
