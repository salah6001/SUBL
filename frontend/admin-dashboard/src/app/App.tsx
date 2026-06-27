import { useState, useCallback, useEffect } from "react";
import { Toaster } from "sonner";
import { Sidebar, type AppRoute } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Toast, type ToastState } from "./components/shared/Toast";
import { type AppNotification } from "./data/mockData";
import { LoginScreen } from "./components/auth/LoginScreen";
import { useAuth } from "./lib/auth/AuthContext";
import { fetchNotifications, markAllNotificationsRead, archiveAllNotifications } from "./lib/notificationsApi";
import { preferencesApi, DEFAULT_PREFERENCES, type Preferences } from "./lib/preferencesApi";
import { fetchCompany } from "./lib/admin/companyApi";
import { I18nProvider } from "./lib/i18n";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

// Views
import { DashboardView } from "./components/DashboardView";
import { AlertsView } from "./components/AlertsView";
import { UsersView } from "./components/UsersView";
import { RequestsView } from "./components/RequestsView";
import { DevicesView } from "./components/DevicesView";
import { SettingsView } from "./components/SettingsView";

export default function App() {
  const { status, user, logout } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      const cachedTheme = localStorage.getItem("subl-admin-theme");
      if (cachedTheme === "light" || cachedTheme === "dark" || cachedTheme === "system") {
        return { ...DEFAULT_PREFERENCES, theme: cachedTheme };
      }
    } catch { /* ignore */ }
    return DEFAULT_PREFERENCES;
  });
  const [systemDark, setSystemDark] = useState(prefersDark);
  const isDarkMode = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
  const [activeRoute, setActiveRoute] = useState<AppRoute>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "success" });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [company, setCompany] = useState<string>("");

  const adminUser = {
    name: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Admin",
    email: user?.email ?? "",
  };

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    // Dark mode applies only inside the authenticated app. The login screen is
    // a light-only design, so keeping <html> light there avoids white-on-white.
    document.documentElement.classList.toggle("dark", status === "authenticated" && isDarkMode);
  }, [isDarkMode, status]);

  // Apply language direction + lang on <html> so the console flips to RTL for
  // Arabic. Login screen stays LTR (prefs default to English before auth).
  useEffect(() => {
    const ar = (prefs.language ?? "").toLowerCase().startsWith("ar");
    document.documentElement.dir = status === "authenticated" && ar ? "rtl" : "ltr";
    document.documentElement.lang = status === "authenticated" && ar ? "ar" : "en";
  }, [prefs.language, status]);

  // Track OS scheme so the "system" theme stays live.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Load server-side preferences once authenticated.
  useEffect(() => {
    if (status !== "authenticated") return;
    preferencesApi.get()
      .then(p => { setPrefs(p); try { localStorage.setItem("subl-admin-theme", p.theme); } catch { /* ignore */ } })
      .catch(() => {});
  }, [status]);

  // Load the company name (shown as a banner + editable in Settings).
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchCompany().then(c => setCompany(c.name)).catch(() => {});
  }, [status]);

  const updatePreferences = useCallback((next: Preferences) => {
    setPrefs(next);
    try { localStorage.setItem("subl-admin-theme", next.theme); } catch { /* ignore */ }
    preferencesApi.update(next).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(() => setToast(p => ({ ...p, visible: false })), 3500);
    return () => clearTimeout(t);
  }, [toast.visible, toast.message]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetchNotifications()
      .then(items => { if (!cancelled) setNotifications(items); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  function navigate(route: AppRoute) {
    setActiveRoute(route);
    setSidebarOpen(false);
  }

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    void markAllNotificationsRead().catch(() => {});
  }

  function handleClearAll() {
    setNotifications([]);
    void archiveAllNotifications().catch(() => {});
  }

  function handleUpdateAdmin(_name: string, _email: string) {
    // Persistence + success toast happen inside SettingsView (PUT /users/me).
    // The header name refreshes on next load; nothing else to do here.
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginScreen />
      </>
    );
  }

  function renderView() {
    switch (activeRoute) {
      case "Dashboard":   return <DashboardView onNavigateAlerts={() => navigate("AlertsPage")} />;
      case "AlertsPage":  return <AlertsView />;
      case "Users":       return <UsersView showToast={showToast} />;
      case "Requests":    return <RequestsView showToast={showToast} />;
      case "Devices":     return <DevicesView showToast={showToast} />;
      case "Settings":    return <SettingsView showToast={showToast} adminUser={adminUser} onUpdateAdmin={handleUpdateAdmin} preferences={prefs} onUpdatePreferences={updatePreferences} company={company} onCompanyChange={setCompany} />;
      default:            return <DashboardView onNavigateAlerts={() => navigate("AlertsPage")} />;
    }
  }

  return (
    <I18nProvider language={prefs.language}>
    <div
      className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      style={{ fontFamily: "'Inter', 'Roboto', system-ui, sans-serif" }}
    >
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={navigate}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          theme={isDarkMode ? "dark" : "light"}
          onToggleTheme={() => updatePreferences({ ...prefs, theme: isDarkMode ? "light" : "dark" })}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          adminUser={adminUser}
          company={company}
          onOpenSettings={() => navigate("Settings")}
          onLogout={logout}
        />

        <main
          key={activeRoute}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-7 bg-slate-50 dark:bg-slate-950"
          style={{ scrollBehavior: "smooth" }}
        >
          {renderView()}
        </main>
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast(p => ({ ...p, visible: false }))}
      />
    </div>
    </I18nProvider>
  );
}
