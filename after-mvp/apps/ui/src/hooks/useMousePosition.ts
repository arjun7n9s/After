import { useEffect, useRef } from "react";

/**
 * Tracks mouse position globally and updates CSS variables on the document element.
 * Bypasses React state to achieve 60fps performance without re-renders.
 */
export function useGlobalMousePosition() {
  useEffect(() => {
    let rafId: number;
    let x = 0;
    let y = 0;

    const updateMousePosition = () => {
      document.documentElement.style.setProperty("--mouse-x", `${x}px`);
      document.documentElement.style.setProperty("--mouse-y", `${y}px`);
    };

    const handleMouseMove = (event: MouseEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateMousePosition);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}

/**
 * Hook to track mouse position relative to a specific element.
 * Perfect for card-level spotlight effects.
 */
export function useLocalMousePosition<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty("--local-mouse-x", `${x}px`);
        el.style.setProperty("--local-mouse-y", `${y}px`);
      });
    };

    el.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return ref;
}
