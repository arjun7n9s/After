import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Activity, Boxes, ChevronRight, Files, LayoutDashboard, MessageSquare } from "lucide-react";

import { StatusIndicator } from "@/components/StatusIndicator";
import { useAppStore } from "@/stores/app-store";
import type { Project } from "@/types";

type SidebarProps = {
  project: Project;
};

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timeline", label: "Timeline", icon: Activity },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/files", label: "Files", icon: Files },
];

export function Sidebar({ project }: SidebarProps) {
  const isConnected = useAppStore((state) => state.isConnected);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Backdrop overlay when expanded on desktop */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 hidden lg:block"
          style={{ background: "rgba(43, 24, 10, 0.08)" }}
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className="group/sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col lg:flex"
        style={{
          width: expanded ? 220 : 64,
          background: "rgba(252, 246, 239, 0.97)",
          borderRight: "1px solid var(--line)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: expanded ? "8px 0 40px rgba(43, 24, 10, 0.08)" : "none",
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4" style={{ minHeight: 64 }}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(140deg, #eba96e 0%, #d47840 55%, #b85e2a 100%)",
              border: "1px solid #cc7538",
              boxShadow: "0 4px 16px rgba(180, 80, 30, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <Boxes className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div
            className="min-w-0 overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              transition: "opacity 180ms ease",
            }}
          >
            <p
              className="truncate text-sm font-bold"
              style={{ color: "var(--ink)" }}
            >
              {project.name}
            </p>
            <p
              className="truncate text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              {project.status}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-2" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="group/link relative flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                  ...(isActive
                    ? {
                        background: "linear-gradient(140deg, var(--accent-light), var(--accent-dark))",
                        color: "#fff7ef",
                        boxShadow: "0 4px 16px rgba(200, 125, 66, 0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
                      }
                    : {
                        color: "var(--ink-soft)",
                      }),
                }}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span
                  className="truncate text-[13px] font-semibold"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: "opacity 180ms ease",
                  }}
                >
                  {item.label}
                </span>
                {isActive && expanded && (
                  <ChevronRight
                    className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                )}

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <div
                    className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold opacity-0 transition-opacity group-hover/link:opacity-100"
                    style={{
                      background: "var(--ink)",
                      color: "var(--cream-0)",
                      boxShadow: "0 4px 12px rgba(43, 24, 10, 0.2)",
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className="px-2 py-3">
          <div
            className="flex items-center justify-center"
            style={{
              opacity: expanded ? 1 : undefined,
            }}
          >
            {expanded ? (
              <StatusIndicator isConnected={isConnected} />
            ) : (
              <div className="flex items-center justify-center" style={{ width: 40, height: 32 }}>
                <span className="relative flex h-2 w-2">
                  {isConnected ? (
                    <>
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                        style={{ background: "#1d6a35" }}
                      />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#1d6a35" }} />
                    </>
                  ) : (
                    <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--ink-muted)" }} />
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
