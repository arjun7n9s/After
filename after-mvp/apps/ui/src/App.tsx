import { useCallback, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { ToastHost } from "@/components/ToastHost";
import { apiService } from "@/services/api";
import { webSocketService } from "@/services/websocket";
import { Chat } from "@/screens/Chat";
import { Dashboard } from "@/screens/Dashboard";
import { Files } from "@/screens/Files";
import { Timeline } from "@/screens/Timeline";
import { useAppStore } from "@/stores/app-store";

function App() {
  const setProject = useAppStore((state) => state.setProject);
  const setEvents = useAppStore((state) => state.setEvents);
  const setRepoAnalysis = useAppStore((state) => state.setRepoAnalysis);
  const setVideoReadiness = useAppStore((state) => state.setVideoReadiness);
  const addEvent = useAppStore((state) => state.addEvent);
  const setConnected = useAppStore((state) => state.setConnected);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const theme = useAppStore((state) => state.theme);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [project, events, repoAnalysis, videoReadiness] = await Promise.all([
        apiService.getProject(),
        apiService.getEvents(),
        apiService.getRepoAnalysisStatus(),
        apiService.getVideoReadiness(),
      ]);
      setProject(project);
      setEvents(events);
      setRepoAnalysis(repoAnalysis);
      setVideoReadiness(videoReadiness);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [setError, setEvents, setLoading, setProject, setRepoAnalysis, setVideoReadiness]);

  useEffect(() => {
    void refreshData();

    let refreshTimeout: number | undefined;
    const unsubscribe = webSocketService.on((event) => {
      addEvent(event);
      window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => {
        void refreshData();
      }, 750);
    });
    webSocketService.connect();
    const intervalId = window.setInterval(() => {
      setConnected(webSocketService.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      window.clearTimeout(refreshTimeout);
      window.clearInterval(intervalId);
      webSocketService.disconnect();
    };
  }, [addEvent, refreshData, setConnected]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout onRefresh={refreshData} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/files" element={<Files />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastHost />
    </ErrorBoundary>
  );
}

export default App;
