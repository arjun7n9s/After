import { MessageSquare, Send, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { apiService } from "@/services/api";
import type { ChatCitation, ChatMode, ChatResponse } from "@/types";

type ChatEntry = {
  id: string;
  query: string;
  response: ChatResponse;
};

const starterPrompts = [
  "What changed most recently?",
  "What decisions shaped this project?",
  "Summarize the architecture.",
];

export function Chat() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ChatMode>("local");
  const [bobAvailable, setBobAvailable] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void apiService.getChatStatus().then((status) => {
      if (!mounted) return;
      setBobAvailable(status.bobAvailable);
      setMode(status.defaultMode);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const submitQuery = async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiService.chatBrain(trimmedQuery, mode);
      setEntries((current) => [
        {
          id: `chat-${Date.now()}`,
          query: trimmedQuery,
          response,
        },
        ...current,
      ]);
      setQuery("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Chat failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuery(query);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <MessageSquare className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                placeholder="Ask Project Brain"
                aria-label="Ask Project Brain"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !query.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-100">
          {error ? (
            <div className="px-5 py-4 text-sm text-red-600">{error}</div>
          ) : null}
          {entries.map((entry) => (
            <article key={entry.id} className="px-5 py-5">
              <p className="text-sm font-medium text-slate-950">{entry.query}</p>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {entry.response.content}
              </div>
              <CitationList citations={entry.response.citations} />
            </article>
          ))}
          {entries.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitQuery(prompt)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Chat Mode</h2>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => setMode("local")}
            className={[
              "h-10 rounded-md border px-3 text-left text-sm font-medium",
              mode === "local"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            Local
          </button>
          <button
            type="button"
            onClick={() => setMode("bob")}
            disabled={!bobAvailable}
            className={[
              "h-10 rounded-md border px-3 text-left text-sm font-medium",
              mode === "bob"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              !bobAvailable ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            Bob
          </button>
        </div>
      </aside>
    </div>
  );
}

function CitationList({ citations }: { citations: ChatCitation[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sources</p>
      <div className="mt-2 grid gap-2">
        {citations.map((citation) => (
          <div key={citation.id} className="text-xs leading-5 text-slate-600">
            <p className="font-medium text-slate-900">{citation.label}</p>
            <p>{citation.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
