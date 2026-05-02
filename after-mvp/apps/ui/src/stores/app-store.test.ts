import { afterEach, describe, expect, it } from "vitest";

import { fallbackEvents, fallbackProject } from "@/data/mock-data";
import { useAppStore } from "@/stores/app-store";
import type { CaptureEvent } from "@/types";

describe("useAppStore", () => {
  afterEach(() => {
    useAppStore.setState({
      project: fallbackProject,
      events: fallbackEvents,
      selectedEventId: fallbackEvents[0]?.id ?? null,
      isConnected: false,
      isLoading: false,
      error: null,
      theme: "light",
      toasts: [],
    });
  });

  it("adds events and updates project activity", () => {
    const event: CaptureEvent = {
      id: "new-event",
      type: "file:changed",
      title: "Changed file",
      summary: "Updated a watched source file",
      timestamp: new Date().toISOString(),
    };

    useAppStore.getState().addEvent(event);

    const state = useAppStore.getState();
    expect(state.events[0]).toEqual(event);
    expect(state.project.lastActivity).toBe(event.timestamp);
    expect(state.project.stats.captures).toBe(fallbackProject.stats.captures + 1);
  });

  it("sets ui state and manages toast messages", () => {
    useAppStore.getState().setConnected(true);
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError("Failed");
    useAppStore.getState().setTheme("dark");
    useAppStore.getState().addToast({ tone: "info", title: "Saved" });

    const toastId = useAppStore.getState().toasts[0]?.id;
    expect(useAppStore.getState().isConnected).toBe(true);
    expect(useAppStore.getState().isLoading).toBe(true);
    expect(useAppStore.getState().error).toBe("Failed");
    expect(useAppStore.getState().theme).toBe("dark");
    expect(toastId).toBeDefined();

    useAppStore.getState().dismissToast(toastId!);
    expect(useAppStore.getState().toasts).toEqual([]);
  });
});
