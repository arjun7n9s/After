import type { WatsonxConfig } from "./config";
import type { SearchResult } from "../memory/retrieval";

/**
 * Watsonx.ai Chat Message
 */
export interface WatsonxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Watsonx.ai Chat Request
 */
export interface WatsonxChatRequest {
  model: string;
  messages: WatsonxMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

/**
 * Watsonx.ai Chat Response
 */
export interface WatsonxChatResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Watsonx.ai Generation Request
 */
export interface WatsonxGenerationRequest {
  prompt: string;
  model: string;
  max_tokens?: number;
  temperature?: number;
  stop_sequences?: string[];
}

/**
 * Watsonx.ai Client
 *
 * Integrates with IBM watsonx.ai for enhanced chat and generation.
 */
export class WatsonxClient {
  private config: WatsonxConfig;
  private baseUrl: string;
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  constructor(config: WatsonxConfig) {
    this.config = config;
    this.baseUrl = config.url || "https://us-south.ml.cloud.ibm.com";
  }

  private async getAccessToken(): Promise<string> {
    const refreshBufferMs = 60_000;
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - refreshBufferMs) {
      return this.accessToken;
    }

    const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: this.config.apiKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IBM IAM token request failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;

    if (!this.accessToken) {
      throw new Error("IBM IAM token response did not include an access token");
    }

    return this.accessToken;
  }

  /**
   * Chat with watsonx.ai using Project Brain context
   */
  async chat(request: WatsonxChatRequest): Promise<WatsonxChatResponse> {
    const url = `${this.baseUrl}/ml/v1/text/chat?version=2023-05-29`;
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model_id: request.model,
        project_id: this.config.projectId,
        messages: request.messages,
        parameters: {
          max_tokens: request.max_tokens || 1024,
          temperature: request.temperature || 0.7,
          top_p: request.top_p || 1.0,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Watsonx.ai chat failed: ${response.status} ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      model: request.model,
      usage: data.usage,
    };
  }

  /**
   * Generate text with watsonx.ai
   */
  async generate(request: WatsonxGenerationRequest): Promise<string> {
    const url = `${this.baseUrl}/ml/v1/text/generation?version=2023-05-29`;
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model_id: request.model,
        project_id: this.config.projectId,
        input: request.prompt,
        parameters: {
          max_new_tokens: request.max_tokens || 1024,
          temperature: request.temperature || 0.7,
          stop_sequences: request.stop_sequences || [],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Watsonx.ai generation failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.results[0]?.generated_text || "";
  }

  /**
   * Build context from search results for watsonx.ai
   */
  buildContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return "No relevant context found in Project Brain.";
    }

    const contextParts: string[] = [];

    for (const result of results.slice(0, 5)) {
      contextParts.push(`From ${result.file}:`);
      contextParts.push(result.preview);
      contextParts.push("");
    }

    return contextParts.join("\n");
  }

  /**
   * Create system message with Project Brain context
   */
  createSystemMessage(context: string): WatsonxMessage {
    return {
      role: "system",
      content: `You are After, a helpful AI assistant with access to the project's Project Brain.

Use the following Project Brain context to answer questions accurately:

${context}

Rules:
- Answer from the context you have, even when the context is small.
- If the Project Brain only shows initialization or empty sections, say that directly and summarize what is currently captured.
- Do not invent project facts that are not in the context.
- If the user asks what has been captured, treat overview, journey, changelog, decisions, and architecture context as relevant.
- Always cite the Project Brain source files when referencing captured context.`,
    };
  }
}

// Made with Bob
