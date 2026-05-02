import { Boxes } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import type { Project } from "@/types";

type SidebarProps = {
  project: Project;
};

export function Sidebar({ project }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
          <Boxes className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{project.name}</p>
          <p className="text-xs capitalize text-slate-500">{project.status}</p>
        </div>
      </div>
      <Navigation />
    </aside>
  );
}
