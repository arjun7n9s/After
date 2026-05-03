import {
  ArrowRight,
  BrainCircuit,
  FileText,
  FolderOpen,
  GitCommitHorizontal,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RetryPanel } from "@/components/RetryPanel";
import { apiService } from "@/services/api";
import { useAppStore } from "@/stores/app-store";

const statConfig = [
  { key: "captures", label: "Captures", icon: ShieldCheck, color: "#1d6a35", bg: "rgba(29, 106, 53, 0.08)" },
  { key: "commits", label: "Commits", icon: GitCommitHorizontal, color: "#c87d42", bg: "rgba(200, 125, 66, 0.08)" },
  { key: "decisions", label: "Decisions", icon: ListChecks, color: "#7a5e4b", bg: "rgba(122, 94, 75, 0.08)" },
  { key: "changes", label: "Changes", icon: FileText, color: "#b45e2a", bg: "rgba(180, 94, 42, 0.08)" },
] as const;

const eventTypeColors: Record<string, string> = {
  "file:added": "#c87d42",
  "file:changed": "#c87d42",
  "file:deleted": "#a23b2f",
  "git:commit": "#1d6a35",
  "decision:made": "#7a5e4b",
  "milestone:reached": "#2b180a",
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Dashboard() {
  const project = useAppStore((state) => state.project);
  const events = useAppStore((state) => state.events);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const repoAnalysis = useAppStore((state) => state.repoAnalysis);
  const videoReadiness = useAppStore((state) => state.videoReadiness);
  const addToast = useAppStore((state) => state.addToast);
  const setError = useAppStore((state) => state.setError);
  const setProject = useAppStore((state) => state.setProject);
  const setEvents = useAppStore((state) => state.setEvents);
  const setRepoAnalysis = useAppStore((state) => state.setRepoAnalysis);
  const setVideoReadiness = useAppStore((state) => state.setVideoReadiness);
  const [isAnalyzing, setAnalyzing] = useState(false);
  const [isPreparingVideo, setPreparingVideo] = useState(false);
  const navigate = useNavigate();

  const recentEvents = events.slice(0, 5);

  const refreshDashboardData = async () => {
    const [nextProject, nextEvents, nextRepoAnalysis, nextVideoReadiness] = await Promise.all([
      apiService.getProject(),
      apiService.getEvents(),
      apiService.getRepoAnalysisStatus(),
      apiService.getVideoReadiness(),
    ]);
    setProject(nextProject);
    setEvents(nextEvents);
    setRepoAnalysis(nextRepoAnalysis);
    setVideoReadiness(nextVideoReadiness);
  };

  const handleGenerateReadme = async () => {
    try {
      await apiService.generateReadme();
      addToast({ tone: "success", title: "README generated", detail: "The backend returned a generated README draft." });
    } catch {
      addToast({ tone: "info", title: "README action queued locally", detail: "Start the API server to generate from the current Project Brain." });
    }
  };

  const handleAnalyzeRepo = async () => {
    setAnalyzing(true);
    try {
      const result = await apiService.analyzeRepo();
      setRepoAnalysis(result);
      await refreshDashboardData();
      addToast({
        tone: "success",
        title: "Repository understood",
        detail: `Added ${result.analyzedFileCount} analyzed files into the Project Brain.`,
      });
    } catch {
      addToast({
        tone: "error",
        title: "Repo analysis failed",
        detail: "Check that the API is running against the folder you initialized.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePrepareVideo = async () => {
    if (!videoReadiness?.canGenerate) {
      addToast({
        tone: "info",
        title: "Snapshots needed first",
        detail: "Run the project, test the main flow, and capture screenshots before preparing video assets.",
      });
      return;
    }

    setPreparingVideo(true);
    try {
      await apiService.prepareVideoAssets();
      await refreshDashboardData();
      addToast({
        tone: "success",
        title: "Video assets prepared",
        detail: "Storyboard, script, captions, and sources were written to the project outputs folder.",
      });
    } catch {
      addToast({
        tone: "error",
        title: "Video prep failed",
        detail: "The API could not prepare render artifacts from the current Project Brain.",
      });
    } finally {
      setPreparingVideo(false);
    }
  };

  if (isLoading) return <div className="mx-auto max-w-6xl"><LoadingSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-6xl"><RetryPanel message={error} onRetry={() => setError(null)} /></div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="tilt-card glass-card animate-fade-up relative overflow-hidden p-7 lg:col-span-2" style={{ borderRadius: 22 }}>
          <div
            className="pointer-events-none absolute"
            style={{
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(200,125,66,0.1) 0%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />

          <div className="relative">
            <p
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: "var(--accent)" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              </span>
              {project.status}
            </p>

            <h2 className="mt-4 font-serif text-4xl font-medium" style={{ color: "var(--ink)", lineHeight: 1.1 }}>
              {project.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              {project.summary}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {statConfig.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                    style={{ background: item.bg, border: `1px solid ${item.color}18` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: item.color }} aria-hidden="true" />
                    <span className="font-mono text-xl font-bold" style={{ color: "var(--ink)" }}>
                      {project.stats[item.key]}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: item.color }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-[11px]"
              style={{ background: "rgba(255,252,247,0.66)", border: "1px solid var(--line)", color: "var(--ink-soft)" }}
            >
              <FolderOpen className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} aria-hidden="true" />
              <span className="font-semibold" style={{ color: "var(--ink)" }}>Connected repo</span>
              <span className="min-w-0 truncate">{project.repositoryPath || repoAnalysis?.projectPath || "Start the API with a project folder"}</span>
            </div>
          </div>
        </section>

        <section className="tilt-card glass-card animate-fade-up flex flex-col gap-3 p-6" style={{ borderRadius: 22, animationDelay: "100ms" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--ink-muted)" }}>
            Quick Actions
          </p>

          <ActionButton Icon={FileText} title="Generate README" detail="From Project Brain" onClick={handleGenerateReadme} tone="primary" />
          <ActionButton
            Icon={BrainCircuit}
            title={isAnalyzing ? "Reading Repo..." : "Understand Repo"}
            detail="Local cited scan"
            onClick={handleAnalyzeRepo}
            disabled={isAnalyzing}
          />
          <ActionButton
            Icon={Video}
            title={isPreparingVideo ? "Preparing..." : "Video Assets"}
            detail={videoReadiness?.canGenerate ? "Storyboard ready" : "Needs snapshots"}
            onClick={handlePrepareVideo}
            disabled={isPreparingVideo || !videoReadiness?.canGenerate}
          />
          <ActionButton Icon={Sparkles} title="Ask the Brain" detail="Chat with your history" onClick={() => navigate("/chat")} />
          <ActionButton Icon={ArrowRight} title="View Timeline" detail="Explore all events" onClick={() => navigate("/timeline")} />
        </section>

        {repoAnalysis?.shouldAskForConsent && (
          <section
            className="glass-card animate-fade-up p-5 lg:col-span-2"
            style={{ borderRadius: 18, border: "1px solid rgba(200,125,66,0.22)", animationDelay: "160ms" }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
                  <BrainCircuit className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>Let After understand this repo?</h2>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    The Project Brain is still light, but this folder has {repoAnalysis.analyzableFileCount} readable files. After can locally scan source,
                    manifests, and docs, then write cited context into the brain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAnalyzeRepo}
                disabled={isAnalyzing}
                className="btn-primary shrink-0"
                style={{ borderRadius: 14, padding: "10px 14px", opacity: isAnalyzing ? 0.65 : 1 }}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {isAnalyzing ? "Understanding..." : "Allow Scan"}
              </button>
            </div>
          </section>
        )}

        <section className="glass-card animate-fade-up p-5" style={{ borderRadius: 18, animationDelay: "200ms" }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: videoReadiness?.canGenerate ? "rgba(29,106,53,0.08)" : "rgba(200,125,66,0.08)",
                color: videoReadiness?.canGenerate ? "#1d6a35" : "var(--accent)",
              }}
            >
              {videoReadiness?.canGenerate ? <Video className="h-5 w-5" aria-hidden="true" /> : <PlayCircle className="h-5 w-5" aria-hidden="true" />}
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                {videoReadiness?.canGenerate ? "Video generation is available" : "Video generation needs runtime snapshots"}
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {videoReadiness?.recommendation || "Run the API against an initialized project so After can check video readiness."}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                {videoReadiness?.screenshotCount ?? 0} screenshots captured
              </p>
            </div>
          </div>
        </section>

        <section className="tilt-card glass-card animate-fade-up overflow-hidden lg:col-span-3" style={{ borderRadius: 22, animationDelay: "240ms" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>Recent Activity</h2>
            <button type="button" onClick={() => navigate("/timeline")} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
              View all
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-3">
            {recentEvents.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-8 w-8" style={{ color: "var(--cream-3)" }} aria-hidden="true" />
                <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>No events captured yet. Start coding and After will track everything.</p>
              </div>
            )}

            {recentEvents.map((event, idx) => {
              const dotColor = eventTypeColors[event.type] || "var(--ink-muted)";
              const isLast = idx === recentEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-0">
                  <div className="flex w-5 shrink-0 flex-col items-center" style={{ paddingTop: 17 }}>
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}30` }} />
                    {!isLast && <span className="mt-1 w-px flex-1" style={{ background: `linear-gradient(to bottom, ${dotColor}50, ${dotColor}08)`, minHeight: 10 }} />}
                  </div>
                  <div className="flex-1 py-3 pl-3">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{event.title}</h3>
                      <time className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--ink-muted)" }} dateTime={event.timestamp}>
                        {relativeTime(event.timestamp)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>{event.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

type ActionButtonProps = {
  Icon: typeof FileText;
  title: string;
  detail: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "default";
};

function ActionButton({ Icon, title, detail, onClick, disabled = false, tone = "default" }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={tone === "primary" ? "btn-primary w-full justify-start text-left" : "pill-btn w-full justify-start text-left"}
      style={{ borderRadius: 14, padding: "12px 16px", opacity: disabled ? 0.55 : 1 }}
    >
      <Icon className="h-4 w-4 shrink-0" style={tone === "primary" ? undefined : { color: "var(--accent)" }} aria-hidden="true" />
      <span className="flex flex-col">
        <span className="text-[13px] font-semibold" style={tone === "primary" ? undefined : { color: "var(--ink)" }}>{title}</span>
        <span className="text-[10px] font-medium" style={tone === "primary" ? { opacity: 0.7 } : { color: "var(--ink-muted)" }}>{detail}</span>
      </span>
    </button>
  );
}
