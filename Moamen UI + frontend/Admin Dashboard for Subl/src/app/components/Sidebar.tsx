import {
  LayoutDashboard, Users, Shield, Building2,
  ScrollText, Monitor, Lock, Settings, X, ChevronRight, AlertTriangle,
} from "lucide-react";
import sublLogo from "figma:asset/33e97ce3c3256ed46e1bc445e85d1904e82e1ce9.png";

export type AppRoute =
  | "Dashboard" | "AlertsPage" | "Users" | "Roles" | "Accounts"
  | "AuditLogs" | "Devices" | "Permissions" | "Settings";

interface NavGroup {
  label: string;
  items: { route: AppRoute; icon: React.ReactNode; label: string; badge?: string; badgeColor?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { route: "Dashboard", icon: <LayoutDashboard size={17} />, label: "Dashboard" },
      { route: "AlertsPage", icon: <AlertTriangle size={17} />, label: "Alerts", badge: "8", badgeColor: "red" },
    ],
  },
  {
    label: "Management",
    items: [
      { route: "Users", icon: <Users size={17} />, label: "Users" },
      { route: "Roles", icon: <Shield size={17} />, label: "Roles" },
      { route: "Accounts", icon: <Building2 size={17} />, label: "Accounts" },
    ],
  },
  {
    label: "System",
    items: [
      { route: "AuditLogs", icon: <ScrollText size={17} />, label: "Audit Logs", badge: "25" },
      { route: "Devices", icon: <Monitor size={17} />, label: "Devices" },
      { route: "Permissions", icon: <Lock size={17} />, label: "Permissions" },
    ],
  },
];

interface SidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeRoute, onNavigate, mobileOpen, onClose }: SidebarProps) {
  function go(route: AppRoute) {
    onNavigate(route);
    onClose();
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40
        flex flex-col transition-transform duration-300 ease-in-out shadow-xl
        bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800
        lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={sublLogo} alt="Subl" className="w-8 h-8 object-contain" />
            <div>
              <span className="text-blue-700 dark:text-blue-400" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Subl</span>
              <span className="block text-slate-400 dark:text-slate-500" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em" }}>ADMIN CONSOLE</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-slate-400 dark:text-slate-600 uppercase tracking-widest" style={{ fontSize: "0.58rem", fontWeight: 700 }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = activeRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      onClick={() => go(item.route)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200/50 dark:shadow-blue-900/40"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      style={{ fontSize: "0.85rem", fontWeight: isActive ? 600 : 400 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </div>
                      {item.badge && !isActive && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full ${item.badgeColor === "red" ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}
                          style={{ fontSize: "0.62rem", fontWeight: 700 }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={13} className="text-white/60" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3 flex-shrink-0 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1">
          <button
            onClick={() => go("Settings")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
              activeRoute === "Settings"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200/50 dark:shadow-blue-900/40"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            style={{ fontSize: "0.85rem", fontWeight: activeRoute === "Settings" ? 600 : 400 }}
          >
            <Settings size={17} className={activeRoute === "Settings" ? "text-white" : "text-slate-400 dark:text-slate-500"} />
            Settings
          </button>
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.7rem" }}>System Online · v2.4.1</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full" style={{ width: "82%" }} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
