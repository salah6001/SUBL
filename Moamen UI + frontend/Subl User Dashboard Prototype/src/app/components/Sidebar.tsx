import {
  LayoutDashboard, CheckSquare, BookOpen, MessageSquare, Settings,
  Brain, LogOut, Activity,
} from "lucide-react";

export type Route = "Dashboard" | "Habits" | "Articles" | "SublAI" | "Settings";

interface SidebarProps {
  activeRoute: Route;
  setActiveRoute: (r: Route) => void;
  user: { name: string; role: string; avatar: string };
  onLogout: () => void;
}

const NAV: { id: Route; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { id: "Dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { id: "Habits",    label: "Daily Habits",    icon: CheckSquare     },
  { id: "Articles",  label: "Wellness Articles",icon: BookOpen       },
  { id: "SublAI",    label: "Subl AI",         icon: MessageSquare, badge: "AI" },
  { id: "Settings",  label: "Settings",        icon: Settings        },
];

export function Sidebar({ activeRoute, setActiveRoute, user, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-40">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-slate-800 dark:text-slate-100">Subl</span>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-none mt-0.5">
            AI Wellness Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2 mb-2">
          Navigation
        </p>
        {NAV.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveRoute(id)}
            className={[
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left",
              activeRoute === id
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200",
            ].join(" ")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] ${
                  activeRoute === id
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}

        {/* Live status card */}
        <div className="pt-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 px-2 mb-2">
            Live Status
          </p>
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
              <span className="text-xs text-green-700 dark:text-green-400">Monitoring Active</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-green-600 dark:text-green-500">Stress Level</span>
              <span className="text-green-600 dark:text-green-400">Normal</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-green-100 dark:bg-green-900/40 rounded-full overflow-hidden">
              <div className="h-full w-[34%] bg-green-500 rounded-full" />
            </div>
            <p className="text-[10px] text-green-500/70 dark:text-green-600 mt-1">Score: 34/100</p>
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-slate-200 truncate leading-none">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {user.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
