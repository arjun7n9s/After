import { Outlet, useLocation } from "react-router-dom";

import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAppStore } from "@/stores/app-store";

type LayoutProps = {
  onRefresh: () => void;
};

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/timeline": "Timeline",
  "/chat": "Chat",
};

export function Layout({ onRefresh }: LayoutProps) {
  const location = useLocation();
  const project = useAppStore((state) => state.project);
  const isConnected = useAppStore((state) => state.isConnected);
  const title = routeTitles[location.pathname] || "After";
  const isChat = location.pathname === "/chat";

  return (
    <div className="relative min-h-screen" style={{ color: "var(--ink)" }}>
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "50vw",
            height: "50vw",
            maxWidth: 700,
            maxHeight: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200,125,66,0.06) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "ambient-drift-1 25s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            maxWidth: 800,
            maxHeight: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(180,94,42,0.04) 0%, transparent 70%)",
            filter: "blur(100px)",
            animation: "ambient-drift-2 30s ease-in-out infinite",
          }}
        />
      </div>

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar project={project} />

        {/* Main content — offset by sidebar rail width */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-16">
          <Header title={title} isConnected={isConnected} onRefresh={onRefresh} />

          {/* Mobile nav */}
          <div
            className="px-4 py-2 lg:hidden"
            style={{
              borderBottom: "1px solid var(--line)",
              background: "var(--cream-0)",
            }}
          >
            <Navigation />
          </div>

          <main className={isChat ? "flex flex-1 flex-col overflow-hidden" : "flex-1 px-5 py-6 sm:px-8"}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
