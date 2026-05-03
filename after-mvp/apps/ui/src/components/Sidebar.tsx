import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Boxes,
  Files,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

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
      <aside
        className="group/sidebar fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col rounded-[32px] lg:flex"
        style={{
          width: expanded ? 200 : 64,
          background: "var(--cream-0)",
          border: "1px solid var(--line)",
          padding: "8px",
          transition:
            "width 300ms var(--spring-snappy), box-shadow 300ms var(--spring-fade), transform 300ms var(--spring-snappy)",
          boxShadow: expanded 
            ? "0 24px 48px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255,255,255,0.05)" 
            : "0 8px 24px rgba(0, 0, 0, 0.06)",
          transform: `translateZ(0) translateY(-50%) scale(${expanded ? 1.02 : 1})`,
          willChange: "width, box-shadow, transform",
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div
          className="mb-4 flex items-center gap-3 rounded-2xl p-1"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[20px]"
            style={{
              background:
                "linear-gradient(140deg, var(--accent-light) 0%, var(--accent) 55%, var(--accent-dark) 100%)",
              boxShadow: "0 4px 12px rgba(180, 80, 30, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <Boxes className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div
            className="min-w-0 overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              transition: "opacity 180ms var(--spring-fade)",
            }}
          >
            <p
              className="truncate text-[15px] font-display"
              style={{ color: "var(--ink)" }}
            >
              {project.name}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-1 flex-col gap-1"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="group/link relative flex items-center gap-3 rounded-[20px] px-3 py-2.5"
                style={{
                  transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                  ...(isActive
                    ? {
                        background:
                          "linear-gradient(140deg, var(--accent-light), var(--accent-dark))",
                        color: "#fff7ef",
                        boxShadow:
                          "0 4px 12px rgba(200, 125, 66, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                      }
                    : {
                        color: "var(--ink-soft)",
                      }),
                }}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  aria-hidden="true"
                />
                <span
                  className="truncate text-[13px] font-semibold"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: "opacity 150ms var(--spring-fade)",
                  }}
                >
                  {item.label}
                </span>

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <div
                    className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold opacity-0 transition-all duration-200 group-hover/link:opacity-100 group-hover/link:translate-x-1"
                    style={{
                      background: "var(--ink)",
                      color: "var(--cream-0)",
                      boxShadow: "0 6px 16px rgba(43, 24, 10, 0.15)",
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
        <div className="mt-4 pb-2">
          <div
            className="flex items-center justify-center"
          >
            {expanded ? (
              <StatusIndicator isConnected={isConnected} />
            ) : (
              <div
                className="flex items-center justify-center"
                style={{ width: 40, height: 32 }}
              >
                <span className="relative flex h-2 w-2">
                  {isConnected ? (
                    <>
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                        style={{ background: "var(--success)" }}
                      />
                      <span
                        className="relative inline-flex h-2 w-2 rounded-full"
                        style={{ background: "var(--success)" }}
                      />
                    </>
                  ) : (
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ background: "var(--ink-muted)" }}
                    />
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
