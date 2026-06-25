import { useState, useRef, useEffect } from "react";
import {
  Sun, Moon, Bell, LogOut, Settings, User,
  CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "../api/notifications";
import type { AppNotification } from "../api/notifications";
import { usePrefs } from "../lib/prefs";
import { UserAvatar } from "./UserAvatar";
import type { Route } from "./Sidebar";

interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  notifications: AppNotification[];
  setNotifications: (n: AppNotification[]) => void;
  user: { name: string; role: string; avatar: string; avatarUrl?: string | null; company?: string | null };
  onLogout: () => void;
  activeRoute: Route;
  setActiveRoute: (r: Route) => void;
}

const priorityIcon = (priority: string) => {
  if (priority === "High" || priority === "Critical") return AlertTriangle;
  if (priority === "Low") return CheckCircle;
  return Info;
};
const priorityColor = (priority: string) => {
  if (priority === "Critical") return "text-red-500";
  if (priority === "High") return "text-amber-500";
  if (priority === "Low") return "text-green-500";
  return "text-blue-500";
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return d.toLocaleDateString();
};


export function Header({
  theme, toggleTheme, notifications, setNotifications,
  user, onLogout, activeRoute, setActiveRoute,
}: HeaderProps) {
  const { formatInZone, t } = usePrefs();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark notifications"); }
  };
  const clearAll = async () => {
    try {
      await Promise.all(notifications.map(n => notificationsApi.dismiss(n.id)));
      setNotifications([]);
      setNotifOpen(false);
    } catch { toast.error("Failed to clear notifications"); }
  };
  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const todayStr = formatInZone(new Date(), {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-14 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between px-4 md:px-6">

      {/* Left: page title + company banner */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm text-slate-800 dark:text-slate-100">
            {t(`title.${activeRoute}`)}
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 hidden sm:block leading-none mt-0.5">
            {todayStr}
          </p>
        </div>
        {user.company && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium max-w-[220px]">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.company}</span>
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">

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
                  {t("notif.title")}{" "}
                  {unread > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">({unread})</span>
                  )}
                </span>
                <div className="flex gap-1">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={t("notif.markAllRead")}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors"
                      title={t("notif.clearAll")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    {t("notif.none")}
                  </p>
                ) : (
                  notifications.map((n) => {
                    const Icon = priorityIcon(n.priority);
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                          !n.isRead ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${priorityColor(n.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                            {fmtTime(n.createdAt)}
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
            <UserAvatar avatarUrl={user.avatarUrl} initials={user.avatar} size={28} />
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
                <button
                  onClick={() => { setProfileOpen(false); setActiveRoute("Settings"); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm transition-colors text-left"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {t("action.accountSettings")}
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={() => { setProfileOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 text-sm transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("action.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
