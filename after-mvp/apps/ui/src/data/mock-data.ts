import type { CaptureEvent, Project } from "@/types";

export const fallbackProject: Project = {
  name: "After",
  summary:
    "Local-first developer tool that captures progress, preserves project context, and turns work history into useful outputs.",
  status: "active",
  stats: {
    captures: 18,
    commits: 4,
    decisions: 3,
    changes: 27,
  },
  lastActivity: new Date().toISOString(),
};

export const fallbackEvents: CaptureEvent[] = [
  {
    id: "task-4-capture",
    type: "milestone:reached",
    title: "Capture engine completed",
    summary: "File watcher, git scanner, event bus, privacy filter, and trust logger are wired into core.",
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    source: "packages/core/src/capture",
  },
  {
    id: "privacy-fix",
    type: "file:changed",
    title: "Privacy ignore matching fixed",
    summary: "Absolute paths now normalize to project-relative paths before ignore checks run.",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    source: "packages/core/src/privacy/ignore-parser.ts",
  },
  {
    id: "audit-clean",
    type: "decision:made",
    title: "Audit and verification cleaned up",
    summary: "Dependency audit, build, typecheck, lint, and tests are green after the review pass.",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    source: "README.md",
  },
  {
    id: "ui-started",
    type: "file:added",
    title: "Dashboard slice started",
    summary: "Task 5 begins with a dashboard, timeline, app store, and API/WebSocket service layer.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    source: "apps/ui/src",
  },
];
