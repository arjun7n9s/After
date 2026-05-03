import { RotateCcw } from "lucide-react";

type RetryPanelProps = {
  message: string;
  onRetry: () => void;
};

export function RetryPanel({ message, onRetry }: RetryPanelProps) {
  return (
    <div
      className="animate-fade-up rounded-2xl p-5"
      style={{
        background: "var(--error-bg)",
        border: "1px solid rgba(162, 59, 47, 0.2)",
      }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>
        Could not load project data
      </p>
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-primary mt-4"
        style={{
          background: "var(--error)",
          borderColor: "var(--error)",
          fontSize: "12px",
          padding: "6px 14px",
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
