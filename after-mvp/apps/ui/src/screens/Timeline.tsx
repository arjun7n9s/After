import {
  ChevronDown,
  FileText,
  GitCommitHorizontal,
  ListChecks,
  Search,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { SpotlightCard } from "@/components/SpotlightCard";
import { useAppStore } from "@/stores/app-store";
import type { CaptureEventType } from "@/types";

type FilterItem = {
  label: string;
  value: "all" | CaptureEventType;
  dot?: string;
  icon?: LucideIcon;
};

const filters: FilterItem[] = [
  { label: "All", value: "all" },
  { label: "Files", value: "file:changed", dot: "#c87d42", icon: FileText },
  {
    label: "Commits",
    value: "git:commit",
    dot: "#1d6a35",
    icon: GitCommitHorizontal,
  },
  {
    label: "Decisions",
    value: "decision:made",
    dot: "#7a5e4b",
    icon: ListChecks,
  },
  {
    label: "Milestones",
    value: "milestone:reached",
    dot: "#2b180a",
    icon: Trophy,
  },
];

const eventTypeConfig: Record<
  string,
  { color: string; bg: string; label: string; Icon: LucideIcon }
> = {
  "file:added": {
    color: "#c87d42",
    bg: "rgba(200,125,66,0.08)",
    label: "File Added",
    Icon: FileText,
  },
  "file:changed": {
    color: "#c87d42",
    bg: "rgba(200,125,66,0.08)",
    label: "File Changed",
    Icon: FileText,
  },
  "file:deleted": {
    color: "#a23b2f",
    bg: "rgba(162,59,47,0.08)",
    label: "File Deleted",
    Icon: FileText,
  },
  "git:commit": {
    color: "#1d6a35",
    bg: "rgba(29,106,53,0.08)",
    label: "Commit",
    Icon: GitCommitHorizontal,
  },
  "decision:made": {
    color: "#7a5e4b",
    bg: "rgba(122,94,75,0.08)",
    label: "Decision",
    Icon: ListChecks,
  },
  "milestone:reached": {
    color: "#2b180a",
    bg: "rgba(43,24,10,0.08)",
    label: "Milestone",
    Icon: Trophy,
  },
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

export function Timeline() {
  const events = useAppStore((state) => state.events);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CaptureEventType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const matchesFilter =
        filter === "all" ||
        e.type === filter ||
        (filter === "file:changed" && e.type.startsWith("file:"));
      const matchesQuery =
        !q ||
        `${e.title} ${e.summary} ${e.source || ""}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* ── Search + Filters ───────────────────────────────────── */}
      <div className="animate-fade-up mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--ink-muted)" }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-glow h-10 w-full rounded-2xl pl-9 pr-3 text-sm"
            style={{
              background: "var(--cream-0)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
            placeholder="Search events…"
            aria-label="Search timeline"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
              style={
                filter === item.value
                  ? {
                      background:
                        "linear-gradient(140deg, var(--accent-light), var(--accent-dark))",
                      color: "#fff7ef",
                      border: "1px solid var(--accent-dark)",
                      boxShadow: "0 2px 8px rgba(200,125,66,0.2)",
                    }
                  : {
                      background: "var(--cream-0)",
                      color: "var(--ink-soft)",
                      border: "1px solid var(--line)",
                    }
              }
            >
              {item.dot && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: filter === item.value ? "#fff7ef" : item.dot,
                  }}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────── */}
      <div
        className="animate-fade-up relative"
        style={{ animationDelay: "100ms" }}
      >
        {/* Vertical gradient line + data flow packet */}
        {filteredEvents.length > 0 && (
          <div
            className="pointer-events-none absolute left-[15px] top-0 w-px overflow-hidden"
            style={{
              height: "100%",
              background:
                "linear-gradient(to bottom, var(--accent) 0%, var(--line) 30%, var(--line) 70%, transparent 100%)",
            }}
          >
            <div
              className="absolute left-0 top-0 w-full"
              style={{
                height: 100,
                background:
                  "linear-gradient(to bottom, transparent, var(--accent), transparent)",
                animation: "data-flow 3s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {filteredEvents.map((event) => {
          const config = eventTypeConfig[event.type] || {
            color: "var(--ink-muted)",
            bg: "rgba(154,128,110,0.08)",
            label: event.type,
            Icon: FileText,
          };
          const TypeIcon = config.Icon;
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              className="relative flex gap-0"
              style={{ paddingLeft: 0 }}
            >
              {/* Bullet */}
              <div
                className="relative z-10 flex w-8 shrink-0 items-start justify-center"
                style={{ paddingTop: 22 }}
              >
                <div
                  className="flex h-[14px] w-[14px] items-center justify-center rounded-full"
                  style={{
                    background: config.color,
                    boxShadow: `0 0 10px ${config.color}30`,
                    border: "2px solid var(--cream-0)",
                  }}
                />
              </div>

              {/* Card */}
              <SpotlightCard
                className="mb-3 flex-1 overflow-visible"
                style={{ borderRadius: 16 }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className="w-full rounded-2xl p-4 text-left"
                  style={{
                    background: isExpanded
                      ? "rgba(255,252,247,0.98)"
                      : "transparent",
                    transition: "background 300ms var(--spring-fade)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-1 flex-col">
                      {/* Type badge + time */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: config.bg, color: config.color }}
                        >
                          <TypeIcon className="h-2.5 w-2.5" />
                          {config.label}
                        </span>
                        <time
                          className="text-[10px] font-semibold tabular-nums"
                          style={{ color: "var(--ink-muted)" }}
                          dateTime={event.timestamp}
                        >
                          {relativeTime(event.timestamp)}
                        </time>
                      </div>

                      {/* Title */}
                      <h2
                        className="text-[14px] font-bold"
                        style={{
                          color: "var(--ink)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {event.title}
                      </h2>
                      <p
                        className="mt-0.5 text-[12px] leading-relaxed"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        {event.summary}
                      </p>

                      {/* Expanded detail */}
                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{
                          maxHeight: isExpanded ? 200 : 0,
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? 12 : 0,
                        }}
                      >
                        <div
                          className="rounded-xl p-3"
                          style={{
                            background: config.bg,
                            border: `1px solid ${config.color}18`,
                          }}
                        >
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: config.color }}
                          >
                            Source
                          </p>
                          <p
                            className="mt-1 break-words font-mono text-[11px]"
                            style={{ color: "var(--ink)" }}
                          >
                            {event.source || "Not linked"}
                          </p>
                          <p
                            className="mt-3 text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: config.color }}
                          >
                            Timestamp
                          </p>
                          <p
                            className="mt-1 font-mono text-[11px]"
                            style={{ color: "var(--ink)" }}
                          >
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <ChevronDown
                      className="mt-1 h-4 w-4 shrink-0 transition-transform duration-300"
                      style={{
                        color: "var(--ink-muted)",
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              </SpotlightCard>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              No timeline events match the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
