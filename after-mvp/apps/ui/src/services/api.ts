import { fallbackEvents, fallbackProject } from "@/data/mock-data";
import type {
  CaptureEvent,
  ChatMode,
  ChatProgressEvent,
  ChatResponse,
  GeneratedFile,
  GeneratedFileContent,
  Project,
  RepoAnalysisStatus,
  SearchResult,
  VideoReadiness,
} from "@/types";

type BobStatusResponse = {
  success: boolean;
  data?: {
    projectName?: string;
    status?: Project["status"];
    summary?: string;
    stats?: {
      decisions?: number;
      changes?: number;
      journeyEntries?: number;
      media?: number;
    };
    repositoryPath?: string;
    primaryLanguage?: string;
    frameworks?: string[];
  };
};

type BobSearchResponse = {
  success: boolean;
  data?: {
    results?: SearchResult[];
  };
};

type BobEventsResponse = {
  success: boolean;
  data?: {
    events?: CaptureEvent[];
  };
};

type BobChatResponse = {
  success: boolean;
  data?: ChatResponse;
  error?: string;
};

type BobIbmStatusResponse = {
  success: boolean;
  data?: {
    enabled?: boolean;
    watsonx?: boolean;
    tts?: boolean;
    cloudant?: boolean;
    nlu?: boolean;
  };
};

type BobChatStatusResponse = {
  success: boolean;
  data?: {
    bobAvailable?: boolean;
    defaultMode?: ChatMode;
  };
};

type BobRepoStatusResponse = {
  success: boolean;
  data?: RepoAnalysisStatus;
};

type BobVideoStatusResponse = {
  success: boolean;
  data?: VideoReadiness;
};

type BobFilesResponse = {
  success: boolean;
  data?: {
    root?: string;
    files?: GeneratedFile[];
  };
};

type BobFileContentResponse = {
  success: boolean;
  data?: GeneratedFileContent;
};

type ChatStreamMessage =
  | ({ type: "progress" } & ChatProgressEvent)
  | { type: "final"; data: ChatResponse }
  | ({ type: "error" } & Partial<ChatProgressEvent>);

const apiBaseUrl = import.meta.env.VITE_AFTER_API_BASE_URL || "";

class ApiService {
  async getProject(): Promise<Project> {
    try {
      const response = await this.request("/api/bob/status");
      if (!response.ok) throw new Error(`Status request failed: ${response.status}`);

      const payload = (await response.json()) as BobStatusResponse;
      const data = payload.data;
      if (!payload.success || !data) return fallbackProject;

      return {
        name: data.projectName || fallbackProject.name,
        summary: data.summary || fallbackProject.summary,
        status: data.status || fallbackProject.status,
        repositoryPath: data.repositoryPath,
        primaryLanguage: data.primaryLanguage,
        frameworks: data.frameworks || [],
        stats: {
          captures: data.stats?.journeyEntries || fallbackProject.stats.captures,
          commits: fallbackProject.stats.commits,
          decisions: data.stats?.decisions || 0,
          changes: data.stats?.changes || 0,
          media: data.stats?.media || 0,
        },
        lastActivity: new Date().toISOString(),
      };
    } catch {
      return fallbackProject;
    }
  }

  async getEvents(): Promise<CaptureEvent[]> {
    try {
      const response = await this.request("/api/bob/events");
      if (!response.ok) throw new Error(`Events request failed: ${response.status}`);

      const payload = (await response.json()) as BobEventsResponse;
      return payload.data?.events?.length ? payload.data.events : fallbackEvents;
    } catch {
      return fallbackEvents;
    }
  }

  async getEvent(id: string): Promise<CaptureEvent> {
    const event = fallbackEvents.find((item) => item.id === id);
    if (!event) throw new Error(`Event not found: ${id}`);
    return event;
  }

  async searchBrain(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const params = new URLSearchParams({ q: query });
      const response = await this.request(`/api/bob/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Search request failed: ${response.status}`);

      const payload = (await response.json()) as BobSearchResponse;
      return payload.data?.results || [];
    } catch {
      const normalizedQuery = query.toLowerCase();
      return fallbackEvents
        .filter((event) => `${event.title} ${event.summary}`.toLowerCase().includes(normalizedQuery))
        .map((event) => ({
          file: event.source || "local timeline",
          preview: event.summary,
          score: 1,
        }));
    }
  }

  async generateReadme(): Promise<string> {
    const response = await this.request("/api/bob/readme", { method: "POST" });
    if (!response.ok) throw new Error(`README generation failed: ${response.status}`);
    const payload = (await response.json()) as { data?: { content?: string } };
    return payload.data?.content || "";
  }

  async prepareVideoAssets(): Promise<void> {
    const response = await this.request("/api/bob/video/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone: "pitch", width: 1920, height: 1080, fps: 30 }),
    });
    if (!response.ok) throw new Error(`Video asset preparation failed: ${response.status}`);
  }

  async chatBrain(
    query: string,
    mode: ChatMode = "local",
    onProgress?: (event: ChatProgressEvent) => void,
  ): Promise<ChatResponse> {
    if (!query.trim()) {
      return { content: "", citations: [], mode };
    }

    try {
      if (mode === "watsonx" && onProgress) {
        return await this.streamWatsonxChat(query, onProgress);
      }

      const path = mode === "watsonx" ? "/api/bob/ibm/chat" : "/api/bob/chat";
      const body =
        mode === "watsonx"
          ? { query }
          : { query, mode, maxResults: 5 };
      const response = await this.request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);

      const payload = (await response.json()) as BobChatResponse;
      if (!payload.success || !payload.data) {
        throw new Error(payload.error || "Chat request failed");
      }

      return payload.data;
    } catch (error) {
      if (mode === "watsonx") {
        throw error;
      }

      const results = await this.searchBrain(query);
      const citations = results.map((result, index) => ({
        id: `cite-${index + 1}`,
        file: result.file,
        line: result.line,
        preview: result.preview,
        label: result.citation?.label || result.file,
        url: result.citation
          ? `brain://${result.citation.path}${result.citation.line ? `#L${result.citation.line}` : ""}`
          : undefined,
      }));

      return {
        content: results.length
          ? `Local fallback found ${results.length} Project Brain result${results.length === 1 ? "" : "s"} for "${query}".`
          : `No Project Brain context matched "${query}" yet.`,
        citations,
        mode: "local",
      };
    }
  }

  async getChatStatus(): Promise<{ bobAvailable: boolean; defaultMode: ChatMode }> {
    try {
      const response = await this.request("/api/bob/chat/status");
      if (!response.ok) throw new Error(`Chat status failed: ${response.status}`);
      const payload = (await response.json()) as BobChatStatusResponse;

      return {
        bobAvailable: Boolean(payload.data?.bobAvailable),
        defaultMode: payload.data?.defaultMode || "local",
      };
    } catch {
      return { bobAvailable: false, defaultMode: "local" };
    }
  }

  async getIbmStatus(): Promise<{
    enabled: boolean;
    watsonx: boolean;
    tts: boolean;
    cloudant: boolean;
    nlu: boolean;
  }> {
    try {
      const response = await this.request("/api/bob/ibm/status");
      if (!response.ok) throw new Error(`IBM status failed: ${response.status}`);
      const payload = (await response.json()) as BobIbmStatusResponse;
      const data = payload.data;

      return {
        enabled: Boolean(data?.enabled),
        watsonx: Boolean(data?.watsonx),
        tts: Boolean(data?.tts),
        cloudant: Boolean(data?.cloudant),
        nlu: Boolean(data?.nlu),
      };
    } catch {
      return {
        enabled: false,
        watsonx: false,
        tts: false,
        cloudant: false,
        nlu: false,
      };
    }
  }

  async getRepoAnalysisStatus(): Promise<RepoAnalysisStatus | null> {
    try {
      const response = await this.request("/api/bob/repo/status");
      if (!response.ok) throw new Error(`Repo status failed: ${response.status}`);
      const payload = (await response.json()) as BobRepoStatusResponse;
      return payload.success ? payload.data ?? null : null;
    } catch {
      return null;
    }
  }

  async analyzeRepo(): Promise<RepoAnalysisStatus> {
    const response = await this.request("/api/bob/repo/analyze", { method: "POST" });
    if (!response.ok) throw new Error(`Repo analysis failed: ${response.status}`);
    const payload = (await response.json()) as BobRepoStatusResponse;
    if (!payload.success || !payload.data) throw new Error("Repo analysis failed");
    return payload.data;
  }

  async getVideoReadiness(): Promise<VideoReadiness | null> {
    try {
      const response = await this.request("/api/bob/video/status");
      if (!response.ok) throw new Error(`Video readiness failed: ${response.status}`);
      const payload = (await response.json()) as BobVideoStatusResponse;
      return payload.success ? payload.data ?? null : null;
    } catch {
      return null;
    }
  }

  async getGeneratedFiles(): Promise<GeneratedFile[]> {
    try {
      const response = await this.request("/api/bob/files");
      if (!response.ok) throw new Error(`Generated files request failed: ${response.status}`);
      const payload = (await response.json()) as BobFilesResponse;
      return payload.success ? payload.data?.files ?? [] : [];
    } catch {
      return [];
    }
  }

  async getGeneratedFileContent(path: string): Promise<GeneratedFileContent> {
    const params = new URLSearchParams({ path });
    const response = await this.request(`/api/bob/files/content?${params.toString()}`);
    if (!response.ok) throw new Error(`Generated file content failed: ${response.status}`);
    const payload = (await response.json()) as BobFileContentResponse;
    if (!payload.success || !payload.data) throw new Error("Generated file content missing");
    return payload.data;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${apiBaseUrl}${path}`, init);
  }

  private async streamWatsonxChat(
    query: string,
    onProgress: (event: ChatProgressEvent) => void,
  ): Promise<ChatResponse> {
    const response = await this.request("/api/bob/ibm/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error(`Watsonx stream failed: ${response.status}`);
    if (!response.body) throw new Error("Watsonx stream response has no body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResponse: ChatResponse | undefined;

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        handleStreamLine(line);
      }

      if (done) break;
    }

    handleStreamLine(buffer);

    if (!finalResponse) {
      throw new Error("Watsonx stream ended before a response was returned");
    }

    return finalResponse;

    function handleStreamLine(line: string) {
      if (!line.trim()) return;
      const message = JSON.parse(line) as ChatStreamMessage;

      if (message.type === "progress") {
        onProgress({
          id: message.id,
          title: message.title,
          detail: message.detail,
          status: message.status,
          elapsedMs: message.elapsedMs,
          timestamp: message.timestamp,
        });
      }

      if (message.type === "error") {
        throw new Error(message.detail || message.title || "Watsonx stream failed");
      }

      if (message.type === "final") {
        finalResponse = message.data;
      }
    }
  }
}

export const apiService = new ApiService();
