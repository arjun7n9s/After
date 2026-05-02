import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useAppStore } from "@/stores/app-store";
import type { CaptureEventType } from "@/types";

const filters: Array<{ label: string; value: "all" | CaptureEventType }> = [
  { label: "All", value: "all" },
  { label: "Files", value: "file:changed" },
  { label: "Commits", value: "git:commit" },
  { label: "Decisions", value: "decision:made" },
  { label: "Milestones", value: "milestone:reached" },
];

export function Timeline() {
  const events = useAppStore((state) => state.events);
  const selectedEventId = useAppStore((state) => state.selectedEventId);
  const selectEvent = useAppStore((state) => state.selectEvent);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CaptureEventType>("all");

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesFilter =
        filter === "all" ||
        event.type === filter ||
        (filter === "file:changed" && event.type.startsWith("file:"));
      const matchesQuery =
        !normalizedQuery ||
        `${event.title} ${event.summary} ${event.source || ""}`.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) || filteredEvents[0] || null;

  return (
    <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                placeholder="Search timeline"
                aria-label="Search timeline"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={[
                    "h-9 rounded-md border px-3 text-sm font-medium",
                    filter === item.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => selectEvent(event.id)}
              className={[
                "block w-full px-5 py-4 text-left hover:bg-slate-50",
                selectedEvent?.id === event.id ? "bg-slate-50" : "",
              ].join(" ")}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-medium text-slate-950">{event.title}</h2>
                <time className="text-xs text-slate-500" dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
              {event.source ? <p className="mt-2 text-xs text-slate-500">{event.source}</p> : null}
            </button>
          ))}
          {filteredEvents.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No timeline events match the current filters.
            </div>
          ) : null}
        </div>
      </section>

      <aside className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Event Detail</h2>
        {selectedEvent ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</p>
              <p className="mt-1 text-sm text-slate-950">{selectedEvent.type}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{selectedEvent.summary}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Source</p>
              <p className="mt-1 break-words text-sm text-slate-950">
                {selectedEvent.source || "Not linked"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Select an event to inspect it.</p>
        )}
      </aside>
    </div>
  );
}
