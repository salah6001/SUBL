import { useState, useCallback, useEffect } from "react";
import { Sidebar, type AppRoute } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Toast, type ToastState } from "./components/shared/Toast";
import { INITIAL_NOTIFICATIONS, type AppNotification } from "./data/mockData";
import { login as apiLogin } from "./api/auth";

// Views
import { DashboardView } from "./components/DashboardView";
import { AlertsView } from "./components/AlertsView";
import { UsersView } from "./components/UsersView";
import { RolesView } from "./components/RolesView";
import { AccountsView } from "./components/AccountsView";
import { AuditLogsView } from "./components/AuditLogsView";
import { DevicesView } from "./components/DevicesView";
import { PermissionsView } from "./components/PermissionsView";
import { SettingsView } from "./components/SettingsView";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@onex.com");
  const [password, setPassword] = useState("Admin@123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiLogin(email, password);
      onLogin();
    } catch (err) {
      // Fall back to mock login so the UI remains usable without a live backend
      console.warn("API login failed, using mock fallback:", err);
      onLogin();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/60">
            <span style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.04em" }}>S</span>
          </div>
          <h1 className="text-white" style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Sign in to Subl</h1>
          <p className="text-slate-400 mt-1" style={{ fontSize: "0.82rem" }}>Admin Console · AI Workplace Wellness</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-7 space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div>
            <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", fontSize: "0.875rem" }}
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1.5" style={{ fontSize: "0.78rem", fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", fontSize: "0.875rem" }}
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : "Sign In"}
          </button>
        </form>
        <p className="text-center text-slate-600 mt-5" style={{ fontSize: "0.72rem" }}>
          Subl AI Console · GDPR &amp; HIPAA Compliant
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "success" });
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [adminUser, setAdminUser] = useState({ name: "Admin User", email: "admin@subl.io" });

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(() => setToast(p => ({ ...p, visible: false })), 3500);
    return () => clearTimeout(t);
  }, [toast.visible, toast.message]);

  function navigate(route: AppRoute) {
    setActiveRoute(route);
    setSidebarOpen(false);
  }

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleClearAll() {
    setNotifications([]);
  }

  function handleUpdateAdmin(name: string, email: string) {
    setAdminUser({ name, email });
    showToast("Profile updated successfully");
  }

  function handleLogout() {
    setIsLoggedIn(false);
  }

  function handleLogin() {
    setIsLoggedIn(true);
    setActiveRoute("Dashboard");
    showToast("Welcome back, " + adminUser.name);
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(p => ({ ...p, visible: false }))}
        />
      </>
    );
  }

  function renderView() {
    switch (activeRoute) {
      case "Dashboard":    return <DashboardView onNavigateAlerts={() => navigate("AlertsPage")} />;
      case "AlertsPage":   return <AlertsView />;
      case "Users":        return <UsersView showToast={showToast} />;
      case "Roles":        return <RolesView showToast={showToast} />;
      case "Accounts":     return <AccountsView showToast={showToast} />;
      case "AuditLogs":    return <AuditLogsView showToast={showToast} />;
      case "Devices":      return <DevicesView showToast={showToast} />;
      case "Permissions":  return <PermissionsView />;
      case "Settings":     return <SettingsView showToast={showToast} />;
      default:             return <DashboardView onNavigateAlerts={() => navigate("AlertsPage")} />;
    }
  }

  return (
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
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          adminUser={adminUser}
          onUpdateAdmin={handleUpdateAdmin}
          onLogout={handleLogout}
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
  );
}
