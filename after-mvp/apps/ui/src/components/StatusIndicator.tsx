import { CheckCircle2, CircleOff } from "lucide-react";

type StatusIndicatorProps = {
  isConnected: boolean;
};

export function StatusIndicator({ isConnected }: StatusIndicatorProps) {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
      {isConnected ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <CircleOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
      )}
      <span>{isConnected ? "Live" : "Local data"}</span>
    </div>
  );
}
