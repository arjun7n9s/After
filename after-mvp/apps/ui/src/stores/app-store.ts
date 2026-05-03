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
          captures: state.project.stats.captures + 1,
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
