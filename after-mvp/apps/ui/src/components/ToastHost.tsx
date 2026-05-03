import { X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

const toneStyles: Record<string, { accent: string; bg: string; text: string }> = {
  success: { accent: "#1d6a35", bg: "#ebf9ef", text: "#1d6a35" },
  error: { accent: "#a23b2f", bg: "#fdeceb", text: "#a23b2f" },
  info: { accent: "#c87d42", bg: "#fff7ed", text: "#8a5d3c" },
};

export function ToastHost() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone] ?? { accent: "#c87d42", bg: "#fff7ed", text: "#8a5d3c" };
        return (
          <div
            key={toast.id}
            className="animate-fade-up overflow-hidden rounded-xl"
            style={{
              background: "rgba(255, 252, 247, 0.96)",
              border: "1px solid var(--line)",
              boxShadow: "0 8px 30px rgba(43, 24, 10, 0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Colored accent strip */}
            <div style={{ height: 3, background: tone.accent }} />
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {toast.title}
                </p>
                {toast.detail ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                    {toast.detail}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--ink-muted)" }}
                aria-label="Dismiss notification"
                title="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
