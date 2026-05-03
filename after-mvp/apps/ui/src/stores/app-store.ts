import { create } from "zustand";

import { fallbackEvents, fallbackProject } from "@/data/mock-data";
import type {
  CaptureEvent,
  Project,
  RepoAnalysisStatus,
  ThemeMode,
  ToastMessage,
  VideoReadiness,
} from "@/types";

type AppState = {
  project: Project;
  events: CaptureEvent[];
  selectedEventId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  theme: ThemeMode;
  toasts: ToastMessage[];
  repoAnalysis: RepoAnalysisStatus | null;
  videoReadiness: VideoReadiness | null;
  setProject: (project: Project) => void;
  setEvents: (events: CaptureEvent[]) => void;
  setRepoAnalysis: (repoAnalysis: RepoAnalysisStatus | null) => void;
  setVideoReadiness: (videoReadiness: VideoReadiness | null) => void;
  addEvent: (event: CaptureEvent) => void;
  selectEvent: (eventId: string | null) => void;
  setConnected: (isConnected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: ThemeMode) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (toastId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  project: fallbackProject,
  events: fallbackEvents,
  selectedEventId: fallbackEvents[0]?.id ?? null,
  isConnected: false,
  isLoading: false,
  error: null,
  theme: "light",
  toasts: [],
  repoAnalysis: null,
  videoReadiness: null,
  setProject: (project) => set({ project }),
  setEvents: (events) =>
    set((state) => ({
      events,
      selectedEventId: state.selectedEventId ?? events[0]?.id ?? null,
    })),
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events.filter((item) => item.id !== event.id)],
      project: {
        ...state.project,
        stats: {
          ...state.project.stats,
          captures: event.type === "git:commit"
            ? state.project.stats.captures + 1
            : state.project.stats.captures,
          changes: isFileEvent(event.type)
            ? state.project.stats.changes + 1
            : state.project.stats.changes,
          commits: event.type === "git:commit"
            ? state.project.stats.commits + 1
            : state.project.stats.commits,
          commitActivity: event.type === "git:commit"
            ? incrementLatestActivityBucket(state.project.stats.commitActivity)
            : state.project.stats.commitActivity,
        },
        lastActivity: event.timestamp,
      },
    })),
  selectEvent: (selectedEventId) => set({ selectedEventId }),
  setRepoAnalysis: (repoAnalysis) => set({ repoAnalysis }),
  setVideoReadiness: (videoReadiness) => set({ videoReadiness }),
  setConnected: (isConnected) => set({ isConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTheme: (theme) => set({ theme }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    })),
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
}));

const isFileEvent = (type: CaptureEvent["type"]): boolean =>
  type === "file:added" || type === "file:changed" || type === "file:deleted";

const incrementLatestActivityBucket = (activity: number[] | undefined): number[] => {
  const buckets = activity?.length
    ? activity.slice(-14)
    : Array.from({ length: 14 }, () => 0);
  const normalized = [
    ...Array.from({ length: Math.max(0, 14 - buckets.length) }, () => 0),
    ...buckets,
  ];
  normalized[normalized.length - 1] = (normalized.at(-1) ?? 0) + 1;
  return normalized;
};
