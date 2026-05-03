import { NavLink } from "react-router-dom";
import { Activity, Files, LayoutDashboard, MessageSquare } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timeline", label: "Timeline", icon: Activity },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/files", label: "Files", icon: Files },
];

export function Navigation() {
  return (
    <nav className="space-y-1" aria-label="Primary">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                "transition-all duration-200",
                isActive
                  ? ""
                  : "",
              ].join(" ")
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "linear-gradient(140deg, var(--accent-light), var(--accent-dark))",
                    color: "#fff7ef",
                    boxShadow: "0 2px 10px rgba(200, 125, 66, 0.25)",
                  }
                : {
                    color: "var(--ink-soft)",
                  }
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
