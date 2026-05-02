import { RotateCcw } from "lucide-react";

type RetryPanelProps = {
  message: string;
  onRetry: () => void;
};

export function RetryPanel({ message, onRetry }: RetryPanelProps) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
      <p className="text-sm font-medium text-rose-950">Could not load project data</p>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-900 hover:bg-rose-100"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
