export function LoadingSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Loading project data">
      {/* Hero skeleton */}
      <div className="skeleton-shimmer h-28 rounded-2xl" />
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton-shimmer h-28 rounded-2xl" style={{ animationDelay: `${item * 120}ms` }} />
        ))}
      </div>
      {/* Activity feed */}
      <div className="skeleton-shimmer h-56 rounded-2xl" />
    </div>
  );
}
