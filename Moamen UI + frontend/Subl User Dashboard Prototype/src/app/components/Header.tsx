import { useState, useRef, useEffect } from "react";
import {
  Sun, Moon, Bell, LogOut, Settings, User,
  CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./Sidebar";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  user: { name: string; role: string; avatar: string };
  onLogout: () => void;
  onStartAssessment: () => void;
  activeRoute: Route;
  setActiveRoute: (r: Route) => void;
}

const TYPE_ICON  = { info: Info, warning: AlertTriangle, success: CheckCircle };
const TYPE_COLOR = { info: "text-blue-500", warning: "text-amber-500", success: "text-green-500" };

const TITLES: Record<Route, string> = {
  Dashboard: "Dashboard",
  Habits:    "Daily Habits",
  Articles:  "Wellness Articles",
  SublAI:   "Subl AI Assistant",
  Settings:  "Settings",
};

export function Header({
  theme, toggleTheme, notifications, setNotifications,
  user, onLogout, onStartAssessment, activeRoute,
}: HeaderProps) {
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };
  const clearAll = () => {
    setNotifications([]);
    toast.success("Notifications cleared");
    setNotifOpen(false);
  };
  const markRead = (id: string) =>
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-14 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between px-4 md:px-6">

      {/* Left: page title */}
      <div>
        <h1 className="text-sm text-slate-800 dark:text-slate-100">
          {TITLES[activeRoute]}
        </h1>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 hidden sm:block leading-none mt-0.5">
          Monday, May 25, 2026
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">

        {/* Assessment shortcut */}
        <button
          onClick={onStartAssessment}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Assess
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center leading-none">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  Notifications{" "}
                  {unread > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">({unread})</span>
                  )}
                </span>
                <div className="flex gap-1">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Mark all read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICON[n.type];
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                          !n.read ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TYPE_COLOR[n.type]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                            {n.time}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] shrink-0">
              {user.avatar}
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:block">
              {user.name.split(" ")[0]}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{user.role}</p>
              </div>
              <div className="p-1.5">
                {[
                  { label: "View Profile",     icon: User     },
                  { label: "Account Settings", icon: Settings },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm transition-colors text-left"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={() => { setProfileOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 text-sm transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
