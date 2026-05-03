import { ArrowRight, FileText, GitCommitHorizontal, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
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
  const addToast = useAppStore((state) => state.addToast);
  const setError = useAppStore((state) => state.setError);
  const navigate = useNavigate();

  const recentEvents = events.slice(0, 5);

  const handleGenerateReadme = async () => {
    try {
      await apiService.generateReadme();
      addToast({ tone: "success", title: "README generated", detail: "The backend returned a generated README draft." });
    } catch {
      addToast({ tone: "info", title: "README action queued locally", detail: "Start the API server to generate from the current Project Brain." });
    }
  };

  if (isLoading) return <div className="mx-auto max-w-6xl"><LoadingSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-6xl"><RetryPanel message={error} onRetry={() => setError(null)} /></div>;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── BENTO GRID ─────────────────────────────────────────── */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto auto",
        }}
      >
        {/* ── Hero Card — spans 2 columns ──────────────────────── */}
        <section
          className="tilt-card glass-card animate-fade-up relative overflow-hidden p-7"
          style={{
            gridColumn: "1 / 3",
            gridRow: "1 / 2",
            borderRadius: 22,
            minHeight: 200,
          }}
        >
          {/* Decorative accent arc */}
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
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: "var(--accent)" }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  </span>
                  {project.status}
                </p>

                <h2
                  className="mt-4 font-serif text-4xl font-medium"
                  style={{ color: "var(--ink)", letterSpacing: "-0.04em", lineHeight: 1.1 }}
                >
                  {project.name}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {project.summary}
                </p>
              </div>
            </div>

            {/* Stat pills — embedded in hero */}
            <div className="mt-6 flex flex-wrap gap-3">
              {statConfig.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                    style={{
                      background: item.bg,
                      border: `1px solid ${item.color}18`,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: item.color }} aria-hidden="true" />
                    <span className="font-mono text-xl font-bold" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                      {project.stats[item.key]}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: item.color }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Quick Actions Card — right column ────────────────── */}
        <section
          className="tilt-card glass-card animate-fade-up flex flex-col gap-3 p-6"
          style={{
            gridColumn: "3 / 4",
            gridRow: "1 / 2",
            borderRadius: 22,
            animationDelay: "100ms",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--ink-muted)" }}>
            Quick Actions
          </p>

          <button
            type="button"
            onClick={handleGenerateReadme}
            className="btn-primary w-full justify-start text-left"
            style={{ borderRadius: 14, padding: "12px 16px" }}
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-[13px] font-bold">Generate README</span>
              <span className="text-[10px] font-medium opacity-70">From Project Brain</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="pill-btn w-full justify-start text-left"
            style={{ borderRadius: 14, padding: "12px 16px" }}
          >
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Ask the Brain</span>
              <span className="text-[10px] font-medium" style={{ color: "var(--ink-muted)" }}>Chat with your history</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/timeline")}
            className="pill-btn w-full justify-start text-left"
            style={{ borderRadius: 14, padding: "12px 16px" }}
          >
            <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>View Timeline</span>
              <span className="text-[10px] font-medium" style={{ color: "var(--ink-muted)" }}>Explore all events</span>
            </span>
          </button>
        </section>

        {/* ── Activity Feed — spans full bottom ────────────────── */}
        <section
          className="tilt-card glass-card animate-fade-up overflow-hidden"
          style={{
            gridColumn: "1 / -1",
            gridRow: "2 / 3",
            borderRadius: 22,
            animationDelay: "200ms",
          }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>Recent Activity</h2>
            <button
              type="button"
              onClick={() => navigate("/timeline")}
              className="flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-200"
              style={{ color: "var(--accent)" }}
            >
              View all
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-3">
            {recentEvents.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="mx-auto h-8 w-8" style={{ color: "var(--cream-3)" }} aria-hidden="true" />
                <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
                  No events captured yet. Start coding and After will track everything.
                </p>
              </div>
            )}

            {recentEvents.map((event, idx) => {
              const dotColor = eventTypeColors[event.type] || "var(--ink-muted)";
              const isLast = idx === recentEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-0">
                  {/* Bullet column */}
                  <div className="flex w-5 shrink-0 flex-col items-center" style={{ paddingTop: 17 }}>
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}30` }}
                    />
                    {!isLast && (
                      <span
                        className="mt-1 w-px flex-1"
                        style={{ background: `linear-gradient(to bottom, ${dotColor}50, ${dotColor}08)`, minHeight: 10 }}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 py-3 pl-3">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                        {event.title}
                      </h3>
                      <time className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--ink-muted)" }} dateTime={event.timestamp}>
                        {relativeTime(event.timestamp)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                      {event.summary}
                    </p>
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
