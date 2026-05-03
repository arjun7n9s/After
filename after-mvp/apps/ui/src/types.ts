export type ProjectStatus = "initialized" | "planning" | "active" | "paused" | "complete";

export type Project = {
  name: string;
  summary: string;
  status: ProjectStatus;
  repositoryPath?: string;
  primaryLanguage?: string;
  frameworks?: string[];
  stats: {
    captures: number;
    commits: number;
    commitActivity?: number[];
    decisions: number;
    changes: number;
    media?: number;
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
  line?: number;
  matches?: string[];
  citation?: {
    path: string;
    line?: number;
    label: string;
  };
};

export type ChatMode = "local" | "watsonx" | "bob";

export type ChatCitation = {
  id: string;
  file: string;
  line?: number;
  preview: string;
  label: string;
  url?: string;
};

export type ChatResponse = {
  content: string;
  citations: ChatCitation[];
  mode: ChatMode;
};

export type ChatProgressEvent = {
  id: string;
  title: string;
  detail?: string;
  status: "active" | "complete" | "error";
  elapsedMs?: number;
  timestamp?: string;
};

export type ThemeMode = "light" | "dark";

export type ToastMessage = {
  id: string;
  title: string;
  detail?: string;
  tone: "success" | "error" | "info";
};

export type RepoAnalysisStatus = {
  projectPath: string;
  projectName: string;
  brainIsEmpty: boolean;
  hasRepoContext: boolean;
  shouldAskForConsent: boolean;
  fileCount: number;
  analyzableFileCount: number;
  analyzedFileCount: number;
  skippedFileCount: number;
  primaryLanguage?: string;
  languages: string[];
  frameworks: string[];
  summary: string;
  recommendations: string[];
};

export type VideoReadiness = {
  canGenerate: boolean;
  hasSnapshots: boolean;
  screenshotCount: number;
  hasNarrativeContext: boolean;
  repoAnalysisDone: boolean;
  requiresRuntimeSnapshots: boolean;
  recommendation: string;
};

export type GeneratedFileKind =
  | "markdown"
  | "video"
  | "audio"
  | "image"
  | "html"
  | "json"
  | "text"
  | "other";

export type GeneratedFile = {
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  updatedAt: string;
  kind: GeneratedFileKind;
  previewable: boolean;
};

export type GeneratedFilesListing = {
  root?: string;
  files: GeneratedFile[];
};

export type GeneratedFileContent = {
  path: string;
  name: string;
  extension: string;
  content: string;
};
