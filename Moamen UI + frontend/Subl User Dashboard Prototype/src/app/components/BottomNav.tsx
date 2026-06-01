import { LayoutDashboard, CheckSquare, BookOpen, MessageSquare, Settings } from "lucide-react";
import type { Route } from "./Sidebar";

interface BottomNavProps {
  activeRoute: Route;
  setActiveRoute: (r: Route) => void;
}

const ITEMS: { id: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "Dashboard", label: "Home",     icon: LayoutDashboard },
  { id: "Habits",    label: "Habits",   icon: CheckSquare     },
  { id: "Articles",  label: "Articles", icon: BookOpen        },
  { id: "SublAI",    label: "AI",       icon: MessageSquare   },
  { id: "Settings",  label: "Settings", icon: Settings        },
];

export function BottomNav({ activeRoute, setActiveRoute }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center">
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveRoute(id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
            activeRoute === id
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-400 dark:text-slate-600"
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all ${
              activeRoute === id ? "bg-blue-50 dark:bg-blue-950/40" : ""
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </nav>
  );
}
