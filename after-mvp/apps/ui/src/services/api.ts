import { fallbackEvents, fallbackProject } from "@/data/mock-data";
import type { CaptureEvent, Project, SearchResult } from "@/types";

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
    };
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
        stats: {
          captures: data.stats?.journeyEntries || fallbackProject.stats.captures,
          commits: fallbackProject.stats.commits,
          decisions: data.stats?.decisions || 0,
          changes: data.stats?.changes || 0,
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

  private async request(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${apiBaseUrl}${path}`, init);
  }
}

export const apiService = new ApiService();
