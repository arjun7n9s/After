import { Moon, RefreshCw, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppStore } from "@/stores/app-store";

type HeaderProps = {
  title: string;
  isConnected: boolean;
  onRefresh: () => void;
};

export function Header({ title, onRefresh }: HeaderProps) {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const [scrolled, setScrolled] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <header
      className="sticky top-0 z-30 flex min-h-16 items-center justify-between px-4 transition-all duration-500 sm:px-6"
      style={{
        borderBottom: "1px solid transparent",
        ...(scrolled
          ? {
              borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              backdropFilter: "blur(24px) saturate(150%)",
              WebkitBackdropFilter: "blur(24px) saturate(150%)",
              background: theme === "dark" ? "rgba(28, 26, 25, 0.65)" : "rgba(252, 250, 247, 0.65)",
            }
          : {
              background: "transparent",
            }),
      }}
    >
      <div>
        <h1 className="text-[17px] font-display tracking-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="pill-btn"
          style={{ padding: "6px 10px" }}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefresh}
          className="pill-btn"
          style={{ padding: "6px 10px" }}
          aria-label="Refresh project data"
          title="Refresh project data"
        >
          <RefreshCw
            className="h-4 w-4"
            style={{
              transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
            }}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
