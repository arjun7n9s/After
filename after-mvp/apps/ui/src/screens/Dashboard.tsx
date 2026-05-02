import { FileText, GitCommitHorizontal, ListChecks, ShieldCheck } from "lucide-react";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RetryPanel } from "@/components/RetryPanel";
import { apiService } from "@/services/api";
import { useAppStore } from "@/stores/app-store";

const statConfig = [
  { key: "captures", label: "Captures", icon: ShieldCheck },
  { key: "commits", label: "Commits", icon: GitCommitHorizontal },
  { key: "decisions", label: "Decisions", icon: ListChecks },
  { key: "changes", label: "Changes", icon: FileText },
] as const;

export function Dashboard() {
  const project = useAppStore((state) => state.project);
  const events = useAppStore((state) => state.events);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const addToast = useAppStore((state) => state.addToast);
  const setError = useAppStore((state) => state.setError);

  const recentEvents = events.slice(0, 4);

  const handleGenerateReadme = async () => {
    try {
      await apiService.generateReadme();
      addToast({
        tone: "success",
        title: "README generated",
        detail: "The backend returned a generated README draft.",
      });
    } catch {
      addToast({
        tone: "info",
        title: "README action queued locally",
        detail: "Start the API server to generate from the current Project Brain.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <RetryPanel message={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5">
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Project</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{project.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{project.summary}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerateReadme}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Generate README
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.key} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {project.stats[item.key]}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentEvents.map((event) => (
            <article key={event.id} className="px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium text-slate-950">{event.title}</h3>
                <time className="text-xs text-slate-500" dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
