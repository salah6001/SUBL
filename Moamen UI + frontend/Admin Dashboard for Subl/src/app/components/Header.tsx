import { useState, useRef, useEffect } from "react";
import {
  Bell, Search, Menu, ChevronDown, Sun, Moon, Check,
  Trash2, AlertTriangle, Info, AlertCircle, Zap,
  User, LogOut, Settings, Edit3, X,
} from "lucide-react";
import type { AppNotification, NotificationType } from "../data/mockData";

interface HeaderProps {
  onMenuClick: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  adminUser: { name: string; email: string };
  onUpdateAdmin: (name: string, email: string) => void;
  onLogout: () => void;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function notifIcon(type: NotificationType) {
  switch (type) {
    case "alert":   return <AlertCircle size={14} className="text-red-500" />;
    case "warning": return <AlertTriangle size={14} className="text-orange-500" />;
    case "system":  return <Zap size={14} className="text-blue-500" />;
    default:        return <Info size={14} className="text-slate-400" />;
  }
}

function formatTime(ts: string): string {
  const now = new Date("2026-05-25T12:00:00");
  const then = new Date(ts.replace(" ", "T") + (ts.includes("T") ? "" : ":00"));
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function EditProfileModal({
  adminUser,
  onSave,
  onClose,
}: {
  adminUser: { name: string; email: string };
  onSave: (name: string, email: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(adminUser.name);
  const [email, setEmail] = useState(adminUser.email);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Edit3 size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: "0.95rem" }}>Edit Profile</h3>
              <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>Update your admin account details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <span className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1.5" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Role</label>
            <input
              type="text"
              value="Super Admin"
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(name, email); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function Header({
  onMenuClick,
  theme,
  onToggleTheme,
  notifications = [],
  onMarkAllRead = () => {},
  onClearAll = () => {},
  adminUser = { name: "Admin User", email: "admin@subl.io" },
  onUpdateAdmin = () => {},
  onLogout = () => {},
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const unreadCount = notifications.filter(n => !n.read).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const initials = adminUser.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 md:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.2 }}>
                Good morning, {adminUser.name.split(" ")[0]} 👋
              </h1>
              <p className="text-slate-400 dark:text-slate-500 hidden sm:block" style={{ fontSize: "0.78rem" }}>
                {today}
              </p>
            </div>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search employees, teams..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900" style={{ fontSize: "0.6rem", fontWeight: 800, color: "#fff" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: "0.875rem" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" style={{ fontSize: "0.65rem", fontWeight: 700 }}>{unreadCount} new</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={onMarkAllRead}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          style={{ fontSize: "0.72rem", fontWeight: 600 }}
                        >
                          <Check size={11} /> Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={onClearAll}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          style={{ fontSize: "0.72rem", fontWeight: 600 }}
                        >
                          <Trash2 size={11} /> Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-12 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Bell size={18} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>All caught up!</p>
                      </div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3.5 flex gap-3 transition-colors ${
                            n.read
                              ? "bg-white dark:bg-slate-900"
                              : "bg-blue-50/60 dark:bg-blue-950/30"
                          } ${idx < notifications.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {notifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-slate-800 dark:text-slate-100 truncate ${!n.read ? "font-semibold" : ""}`} style={{ fontSize: "0.82rem" }}>
                                {n.title}
                              </p>
                              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" style={{ fontSize: "0.68rem" }}>{formatTime(n.time)}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2" style={{ fontSize: "0.75rem" }}>{n.message}</p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>{adminUser.name}</p>
                  <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>Super Admin</p>
                </div>
                <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* User info */}
                  <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white flex-shrink-0" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 dark:text-slate-100 truncate" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{adminUser.name}</p>
                        <p className="text-slate-400 dark:text-slate-500 truncate" style={{ fontSize: "0.72rem" }}>{adminUser.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setProfileOpen(false); setEditProfileOpen(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      style={{ fontSize: "0.83rem" }}
                    >
                      <User size={15} className="text-slate-400 dark:text-slate-500" />
                      Edit Profile
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      style={{ fontSize: "0.83rem" }}
                    >
                      <Settings size={15} className="text-slate-400 dark:text-slate-500" />
                      Preferences
                    </button>
                  </div>

                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => { setProfileOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      style={{ fontSize: "0.83rem", fontWeight: 500 }}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {editProfileOpen && (
        <EditProfileModal
          adminUser={adminUser}
          onSave={onUpdateAdmin}
          onClose={() => setEditProfileOpen(false)}
        />
      )}
    </>
  );
}
