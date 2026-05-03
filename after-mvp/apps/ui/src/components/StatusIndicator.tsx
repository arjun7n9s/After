type StatusIndicatorProps = {
  isConnected: boolean;
};

export function StatusIndicator({ isConnected }: StatusIndicatorProps) {
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold"
      style={{
        background: "rgba(255, 252, 247, 0.7)",
        border: "1px solid var(--line)",
        color: "var(--ink-soft)",
      }}
    >
      <span
        className="relative flex h-2 w-2"
        aria-hidden="true"
      >
        {isConnected ? (
          <>
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
              style={{ background: "#1d6a35" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: "#1d6a35" }}
            />
          </>
        ) : (
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--ink-muted)" }}
          />
        )}
      </span>
      <span>{isConnected ? "Live" : "Local data"}</span>
    </div>
  );
}
