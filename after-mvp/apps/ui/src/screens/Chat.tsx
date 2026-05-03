import {
  AlertCircle,
  Check,
  Compass,
  FileText,
  Lightbulb,
  Presentation,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { SpotlightCard } from "@/components/SpotlightCard";
import { apiService } from "@/services/api";
import type {
  ChatCitation,
  ChatMode,
  ChatProgressEvent,
  ChatResponse,
} from "@/types";

type ChatEntry = {
  id: string;
  query: string;
  response: ChatResponse;
};

type ThinkingMood = {
  id: string;
  label: string;
  headline: string;
  detail: string;
  Icon: LucideIcon;
};

const heroHeadlines = [
  "Ask what changed.",
  "Trace the work.",
  "Explore the Project Brain.",
  "What changed, and why?",
  "Find the thread.",
];

const starterPrompts = [
  { text: "What changed most recently?", Icon: Search },
  { text: "What decisions shaped this project?", Icon: Lightbulb },
  { text: "Summarize the architecture.", Icon: Compass },
  { text: "Generate a README.", Icon: FileText },
];

const thinkingMoods: ThinkingMood[] = [
  {
    id: "careful",
    label: "Careful",
    headline: "Going slowly where it matters",
    detail: "Checking context before answering.",
    Icon: ShieldCheck,
  },
  {
    id: "focused",
    label: "Focused",
    headline: "Tracing the problem path",
    detail: "Following evidence instead of guessing.",
    Icon: Search,
  },
  {
    id: "builder",
    label: "Builder",
    headline: "Shaping this into something usable",
    detail: "Looking for the pieces that make it concrete.",
    Icon: Wrench,
  },
  {
    id: "curious",
    label: "Curious",
    headline: "Looking for the clearest explanation",
    detail: "Connecting the idea back to project context.",
    Icon: Lightbulb,
  },
  {
    id: "organized",
    label: "Organized",
    headline: "Arranging the story cleanly",
    detail: "Grouping the useful bits.",
    Icon: FileText,
  },
  {
    id: "presentation",
    label: "Polished",
    headline: "Thinking about how this should land",
    detail: "Watching clarity, confidence, and flow.",
    Icon: Presentation,
  },
  {
    id: "explorer",
    label: "Exploring",
    headline: "Finding the useful trail",
    detail: "Reading the question and the Project Brain together.",
    Icon: Compass,
  },
];

const moodKeywords: Record<string, string[]> = {
  careful: [
    "secure",
    "security",
    "secret",
    "credential",
    "risk",
    "safe",
    "privacy",
    "auth",
    "permission",
  ],
  focused: [
    "bug",
    "error",
    "fail",
    "fix",
    "issue",
    "broken",
    "why",
    "debug",
    "not working",
  ],
  builder: [
    "build",
    "create",
    "make",
    "add",
    "implement",
    "design",
    "enhance",
    "generate",
  ],
  curious: [
    "explain",
    "what",
    "how",
    "why",
    "understand",
    "meaning",
    "tell me",
  ],
  organized: [
    "summarize",
    "summary",
    "document",
    "readme",
    "notes",
    "report",
    "capture",
  ],
  presentation: [
    "demo",
    "pitch",
    "presentation",
    "showcase",
    "judge",
    "hackathon",
    "story",
    "wow",
  ],
};

function getThinkingMood(query: string): ThinkingMood {
  const normalizedQuery = query.toLowerCase();
  const scores = new Map<string, number>();

  for (const [id, terms] of Object.entries(moodKeywords)) {
    for (const term of terms) {
      if (normalizedQuery.includes(term)) {
        scores.set(id, (scores.get(id) ?? 0) + 1);
      }
    }
  }

  const best = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
  const fallback = thinkingMoods[thinkingMoods.length - 1]!;
  return (
    thinkingMoods.find((mood) => mood.id === best?.[0]) ??
    thinkingMoods.find((mood) => mood.id === "explorer") ??
    fallback
  );
}

function formatElapsed(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Chat() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [mode, setMode] = useState<ChatMode>("local");
  const [watsonxAvailable, setWatsonxAvailable] = useState(false);
  const [bobAvailable, setBobAvailable] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [progressEvents, setProgressEvents] = useState<ChatProgressEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(
      () => setHeroIndex((i) => (i + 1) % heroHeadlines.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    if (typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    } else {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [entries.length, progressEvents.length]);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      apiService.getChatStatus(),
      apiService.getIbmStatus(),
    ]).then(([status, ibmStatus]) => {
      if (!mounted) return;
      setWatsonxAvailable(ibmStatus.enabled && ibmStatus.watsonx);
      setBobAvailable(status.bobAvailable);
      setMode(
        ibmStatus.enabled && ibmStatus.watsonx ? "watsonx" : status.defaultMode,
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  const submitQuery = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    setActiveQuery(trimmed);
    setProgressEvents([]);

    try {
      if (mode !== "watsonx") {
        setProgressEvents([
          {
            id: "request",
            title: "Request submitted",
            detail:
              mode === "bob"
                ? "Waiting for Bob Shell response"
                : "Waiting for local Project Brain response",
            status: "active",
          },
        ]);
      }

      const response = await apiService.chatBrain(trimmed, mode, (event) => {
        setProgressEvents((current) => {
          const index = current.findIndex((item) => item.id === event.id);
          return index === -1
            ? [...current, event]
            : current.map((item, i) => (i === index ? event : item));
        });
      });

      setEntries((current) => [
        ...current,
        { id: `chat-${Date.now()}`, query: trimmed, response },
      ]);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuery(query);
  };

  const hasMessages = entries.length > 0 || isSubmitting;
  const modeHint =
    mode === "watsonx"
      ? "Watsonx answers use your Project Brain context"
      : mode === "bob"
        ? "Bob Shell answers from your Project Brain"
        : "Answers are generated from your local Project Brain";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          maskImage: hasMessages
            ? "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)"
            : "none",
          WebkitMaskImage: hasMessages
            ? "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)"
            : "none",
        }}
      >
        {!hasMessages ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-20 relative">
            <div
              className="animate-fade-up text-center relative z-10"
              style={{ maxWidth: 800 }}
            >
              <h1
                className="text-5xl font-display tracking-tight sm:text-6xl"
                style={{
                  color: "var(--ink)",
                  lineHeight: 1.1,
                  minHeight: "1.2em",
                }}
              >
                <span
                  key={heroIndex}
                  className="inline-block"
                  style={{
                    animation:
                      "fade-up-soft 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
                  }}
                >
                  {heroHeadlines[heroIndex]}
                </span>
              </h1>

              <p
                className="mx-auto mt-4 max-w-md text-sm leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                Ask anything about your project&apos;s history, decisions, and
                journey.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => void submitQuery(prompt.text)}
                    className="pill-btn"
                    style={{ fontSize: "12.5px" }}
                  >
                    <prompt.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto max-w-[720px] px-5 py-8"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {entries.map((entry) => (
              <div key={entry.id}>
                <UserBubble text={entry.query} />
                <AiBubble
                  content={entry.response.content}
                  citations={entry.response.citations}
                />
              </div>
            ))}

            {isSubmitting && (
              <div>
                <UserBubble text={activeQuery} />
                <ProcessingPipeline
                  mode={mode}
                  query={activeQuery}
                  events={progressEvents}
                />
              </div>
            )}

            {error && (
              <div
                className="animate-fade-up rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error)",
                  border: "1px solid rgba(162,59,47,0.2)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative shrink-0 px-5 pb-5 pt-3">
        <div className="relative z-10 mx-auto max-w-[720px]">
          <SpotlightCard
            className="p-2 overflow-visible"
            style={{ borderRadius: 28 }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 relative z-10"
            >
              <div className="flex items-center gap-2 px-2 pt-1">
                <div className="flex gap-1">
                  {[
                    {
                      value: "local" as ChatMode,
                      label: "Local",
                      available: true,
                    },
                    {
                      value: "watsonx" as ChatMode,
                      label: "Watsonx",
                      available: watsonxAvailable,
                    },
                    {
                      value: "bob" as ChatMode,
                      label: "Bob",
                      available: bobAvailable,
                    },
                  ].map((chatMode) => (
                    <button
                      key={chatMode.value}
                      type="button"
                      disabled={!chatMode.available}
                      onClick={() => setMode(chatMode.value)}
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                      style={
                        mode === chatMode.value
                          ? {
                              backgroundColor: "var(--accent)",
                              backgroundImage:
                                "linear-gradient(140deg, var(--accent-light), var(--accent-dark))",
                              color: "#fff7ef",
                              border: "1px solid var(--accent-dark)",
                            }
                          : {
                              backgroundColor: "transparent",
                              backgroundImage: "none",
                              color: "var(--ink-muted)",
                              border: "1px solid var(--line)",
                              opacity: chatMode.available ? 1 : 0.4,
                            }
                      }
                    >
                      {chatMode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center gap-2 w-full">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  disabled={isSubmitting}
                  className="input-glow h-12 w-full rounded-full px-5 text-[15px]"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--ink)",
                  }}
                  placeholder="Ask the Project Brain..."
                  aria-label="Ask the Project Brain"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !query.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: query.trim()
                      ? "var(--accent)"
                      : "transparent",
                    backgroundImage: query.trim()
                      ? "linear-gradient(140deg, var(--accent-light), var(--accent-dark))"
                      : "none",
                    color: query.trim() ? "#fff7ef" : "var(--ink-muted)",
                    boxShadow: query.trim()
                      ? "0 4px 14px rgba(200,125,66,0.25)"
                      : "none",
                    opacity: isSubmitting ? 0.5 : 1,
                  }}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </SpotlightCard>

          <p
            className="mt-3 text-center text-[10px] font-medium tracking-wide uppercase"
            style={{ color: "var(--ink-muted)", opacity: 0.6 }}
          >
            {modeHint}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="mb-3 flex items-start justify-end gap-2.5">
      <div className="flex max-w-[78%] flex-col items-end">
        <span
          className="mb-1 pr-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--ink-muted)" }}
        >
          You
        </span>
        <div
          className="animate-fade-up rounded-[14px_4px_14px_14px] px-3.5 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: "#2f1b0d",
            color: "#f5e6d5",
            border: "1px solid #3e2414",
            boxShadow: "0 4px 14px rgba(20,8,2,0.22)",
          }}
        >
          {text}
        </div>
      </div>
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          backgroundColor: "#2f1b0d",
          border: "1px solid #3e2414",
          color: "#e8cba8",
          boxShadow: "0 2px 8px rgba(20,10,3,0.2)",
        }}
      >
        U
      </div>
    </div>
  );
}

function AiBubble({
  content,
  citations,
}: {
  content: string;
  citations: ChatCitation[];
}) {
  return (
    <div className="mb-3 flex items-start gap-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#d47840",
          backgroundImage:
            "linear-gradient(140deg, #eba96e 0%, #d47840 55%, #b85e2a 100%)",
          border: "1px solid #cc7538",
          boxShadow: "0 2px 8px rgba(180,80,30,0.22)",
        }}
      >
        <Sparkles className="h-3 w-3 text-white" aria-hidden="true" />
      </div>
      <div className="flex max-w-[78%] flex-col">
        <span
          className="mb-1 pl-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--ink-muted)" }}
        >
          After
        </span>
        <div
          className="animate-fade-up rounded-[4px_14px_14px_14px] px-3.5 py-2.5 text-sm leading-relaxed"
          style={{
            backgroundColor: "rgba(255,252,247,0.94)",
            border: "1px solid #decebf",
            color: "#3b2518",
            boxShadow: "0 2px 8px rgba(50,25,10,0.06)",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
          {citations.length > 0 && <CitationList citations={citations} />}
        </div>
      </div>
    </div>
  );
}

function ProcessingPipeline({
  mode,
  query,
  events,
}: {
  mode: ChatMode;
  query: string;
  events: ChatProgressEvent[];
}) {
  const mood = getThinkingMood(query);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const heading =
    mode === "watsonx"
      ? "Watsonx"
      : mode === "bob"
        ? "Bob Shell"
        : "Local Brain";
  const MoodIcon = mood.Icon;

  useEffect(() => {
    const timer = setInterval(
      () => setElapsed(Date.now() - startRef.current),
      100,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="mb-3 flex items-start gap-2.5"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#d47840",
          backgroundImage:
            "linear-gradient(140deg, #eba96e 0%, #d47840 55%, #b85e2a 100%)",
          border: "1px solid #cc7538",
          boxShadow: "0 2px 8px rgba(180,80,30,0.22)",
        }}
      >
        <Sparkles className="h-3 w-3 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1" style={{ maxWidth: "78%" }}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="text-[13px] font-bold"
            style={{ color: "var(--ink)" }}
          >
            {heading} is thinking
          </span>
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: "var(--ink-muted)" }}
          >
            {formatElapsed(elapsed)}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--accent-glow)",
              color: "var(--accent)",
            }}
          >
            <MoodIcon className="h-2.5 w-2.5" aria-hidden="true" />
            {mood.label}
          </span>
        </div>
        <p
          className="mb-1 text-[12px] font-semibold"
          style={{ color: "var(--ink-soft)" }}
        >
          {mood.headline}
        </p>

        <div className="animate-fade-up">
          {(events.length === 0
            ? [
                {
                  id: "connecting",
                  title: "Opening progress stream",
                  detail: "Waiting for first step...",
                  status: "active" as const,
                },
              ]
            : events
          ).map((event, index, array) => (
            <PipelineStep
              key={event.id}
              event={event}
              isLast={index === array.length - 1}
            />
          ))}

          <div
            className="mt-1 flex items-center gap-2"
            style={{ paddingLeft: 7 }}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full"
              style={{
                border: "2px solid var(--cream-3)",
                borderTopColor: "var(--accent)",
                animation: "dreaming-spin 0.72s linear infinite",
              }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: "var(--ink-muted)" }}
            >
              {mood.detail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  event,
  isLast,
}: {
  event: ChatProgressEvent;
  isLast: boolean;
}) {
  const isComplete = event.status === "complete";
  const isError = event.status === "error";

  return (
    <div className="flex gap-0">
      <div
        className="flex w-4 shrink-0 flex-col items-center"
        style={{ marginRight: 9, paddingTop: 12 }}
      >
        {isComplete ? (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full"
            style={{ backgroundColor: "#1d6a35" }}
          >
            <Check className="h-2.5 w-2.5 text-white" aria-hidden="true" />
          </span>
        ) : isError ? (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full"
            style={{ backgroundColor: "#a23b2f" }}
          >
            <AlertCircle
              className="h-2.5 w-2.5 text-white"
              aria-hidden="true"
            />
          </span>
        ) : (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
        )}
        {!isLast && (
          <span
            className="mt-1 w-px flex-1"
            style={{
              backgroundColor: "rgba(200,168,130,0.18)",
              backgroundImage:
                "linear-gradient(to bottom, rgba(200,168,130,0.38), rgba(200,168,130,0.10))",
              minHeight: 6,
            }}
          />
        )}
      </div>
      <div className="flex-1 py-2">
        <div className="flex items-baseline gap-2">
          <p
            className="text-[12.5px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            {event.title}
          </p>
          {typeof event.elapsedMs === "number" && (
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--ink-muted)" }}
            >
              {formatElapsed(event.elapsedMs)}
            </span>
          )}
        </div>
        {event.detail && (
          <p
            className="mt-0.5 text-[11.5px] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            {event.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function CitationList({ citations }: { citations: ChatCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 pt-2" style={{ borderTop: "1px dashed #d9c7b5" }}>
      <p
        className="text-[9px] font-bold uppercase tracking-wider"
        style={{ color: "var(--ink-muted)" }}
      >
        Sources
      </p>
      <div className="mt-1.5 flex flex-col gap-1.5">
        {citations.map((citation) => (
          <div
            key={citation.id}
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              {citation.label}
            </span>
            {" - "}
            {citation.preview}
          </div>
        ))}
      </div>
    </div>
  );
}
