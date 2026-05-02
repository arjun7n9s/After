import { X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

export function ToastHost() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-md border border-slate-200 bg-white p-4 text-sm shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-950">{toast.title}</p>
              {toast.detail ? <p className="mt-1 text-slate-600">{toast.detail}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              aria-label="Dismiss notification"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
