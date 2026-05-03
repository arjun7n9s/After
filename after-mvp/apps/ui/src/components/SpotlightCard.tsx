import React from "react";
import { useLocalMousePosition } from "@/hooks/useMousePosition";

type SpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
};

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(200, 125, 66, 0.12)", // Warm accent glow
  ...props
}: SpotlightCardProps) {
  const ref = useLocalMousePosition<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`glass-card tilt-card group/spotlight relative overflow-hidden ${className}`}
      {...props}
    >
      {/* 
        Spotlight Overlay:
        This pseudo-element provides the glowing gradient that follows the mouse.
        It starts at 0 opacity and fades in on hover.
      */}
      <div
        className="pointer-events-none absolute -inset-px z-0 opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--local-mouse-x, 50%) var(--local-mouse-y, 50%), ${spotlightColor}, transparent 40%)`,
          mixBlendMode: "overlay", // Optical blend mode for premium lighting
        }}
      />

      {/* Ensure children render above the spotlight */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
