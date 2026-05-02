import { Moon, RefreshCw, Sun } from "lucide-react";

import { StatusIndicator } from "@/components/StatusIndicator";
import { useAppStore } from "@/stores/app-store";

type HeaderProps = {
  title: string;
  isConnected: boolean;
  onRefresh: () => void;
};

export function Header({ title, isConnected, onRefresh }: HeaderProps) {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-950">{title}</h1>
        <p className="text-sm text-slate-500">Local-first project capture workspace</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator isConnected={isConnected} />
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Refresh project data"
          title="Refresh project data"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
