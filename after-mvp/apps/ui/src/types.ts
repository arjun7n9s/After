export type ProjectStatus = "planning" | "active" | "paused" | "complete";

export type Project = {
  name: string;
  summary: string;
  status: ProjectStatus;
  stats: {
    captures: number;
    commits: number;
    decisions: number;
    changes: number;
  };
  lastActivity: string;
};

export type CaptureEventType =
  | "file:added"
  | "file:changed"
  | "file:deleted"
  | "git:commit"
  | "decision:made"
  | "milestone:reached";

export type CaptureEvent = {
  id: string;
  type: CaptureEventType;
  title: string;
  summary: string;
  timestamp: string;
  source?: string;
};

export type SearchResult = {
  file: string;
  preview: string;
  score: number;
};

export type ThemeMode = "light" | "dark";

export type ToastMessage = {
  id: string;
  title: string;
  detail?: string;
  tone: "success" | "error" | "info";
};
