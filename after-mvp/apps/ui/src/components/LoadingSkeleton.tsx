export function LoadingSkeleton() {
  return (
    <div className="grid gap-3" aria-label="Loading project data">
      <div className="h-24 animate-pulse rounded-md bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-md bg-slate-200" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-md bg-slate-200" />
    </div>
  );
}
