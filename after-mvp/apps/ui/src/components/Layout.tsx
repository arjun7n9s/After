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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar project={project} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={title} isConnected={isConnected} onRefresh={onRefresh} />
          <div className="border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
            <Navigation />
          </div>
          <main className="flex-1 px-4 py-5 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
