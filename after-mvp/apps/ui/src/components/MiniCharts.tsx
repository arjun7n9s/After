/**
 * A zero-overhead SVG sparkline.
 * Uses a smooth bezier curve.
 */
export function Sparkline({ color, data }: { color: string; data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Normalize points to a 100x40 SVG box
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - ((d - min) / range) * 36; // leave padding
    return `${x},${y}`;
  });

  // Create a smooth curve string
  const pathData = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point}`;

    // Simple smooth curve control points
    const prevPoint = a[i - 1];
    if (!prevPoint) return acc;

    const [prevX, prevY] = prevPoint.split(",").map(Number);
    const [currX, currY] = point.split(",").map(Number);

    const cx1 = (prevX || 0) + ((currX || 0) - (prevX || 0)) / 2;
    const cy1 = prevY || 0;
    const cx2 = (prevX || 0) + ((currX || 0) - (prevX || 0)) / 2;
    const cy2 = currY || 0;

    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${currX || 0},${currY || 0}`;
  }, "");

  return (
    <svg
      viewBox="0 0 100 40"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0px 2px 4px ${color}40)`,
          transition: "d 300ms var(--spring-snappy)",
        }}
      />
    </svg>
  );
}

/**
 * A tiny 7x2 grid of activity blocks with a scale label.
 */
export function ActivityHeatmap({ color }: { color: string }) {
  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }).map((_, i) => {
          // Random opacity to simulate activity heatmap
          const opacity = Math.max(0.1, Math.random() * 0.8 + 0.2);
          return (
            <div
              key={i}
              className="h-2 w-2 rounded-sm"
              title={`Activity on day ${i + 1}`}
              style={{
                backgroundColor: color,
                opacity,
                transition: "opacity 300ms var(--spring-fade)",
              }}
            />
          );
        })}
      </div>
      <span
        className="text-[8px] font-medium uppercase tracking-widest opacity-60"
        style={{ color }}
      >
        Last 14 Days
      </span>
    </div>
  );
}

/**
 * A segmented progress ring with centered percentage label.
 */
export function SegmentedRing({
  color,
  percentage,
}: {
  color: string;
  percentage: number;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full -rotate-90 transform"
      >
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={`${color}20`}
          strokeWidth="4"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 800ms var(--spring-snappy)",
            filter: `drop-shadow(0px 2px 4px ${color}60)`,
          }}
        />
      </svg>
      <span className="relative z-10 text-[8px] font-bold" style={{ color }}>
        {percentage}%
      </span>
    </div>
  );
}
