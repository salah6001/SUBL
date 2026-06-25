import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import type { Route } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { AssessmentModal } from "./components/AssessmentModal";
import type { AssessmentResult } from "./components/AssessmentModal";
import { Dashboard } from "./components/Dashboard";
import { Habits } from "./components/Habits";
import { Articles } from "./components/Articles";
import { SublAI } from "./components/SublAI";
import { Settings } from "./components/Settings";
import type { DateFilter } from "./components/DateFilterBar";
import { LoginScreen } from "./components/auth/LoginScreen";
import { SignUpScreen } from "./components/auth/SignUpScreen";
import { getToken } from "./api/client";
import { logout as clearAuth } from "./api/auth";
import { isAdminToken } from "./lib/jwtDecode";
import { userApi } from "./api/user";
import { notificationsApi } from "./api/notifications";
import type { AppNotification } from "./api/notifications";
import { stressApi } from "./api/stress";
import type { CurrentStress } from "./api/stress";
import { devicesApi } from "./api/devices";
import { surveyApi } from "./api/survey";
import { preferencesApi, DEFAULT_PREFERENCES } from "./api/preferences";
import type { Preferences, ThemePref } from "./api/preferences";
import { PreferencesProvider } from "./lib/prefs";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  avatarUrl: string | null;
  company: string | null;
}

export default function App() {
  const [isLoggedIn,    setIsLoggedIn]    = useState(() => {
    const t = getToken();
    // An admin token leaked into this app (e.g. via the role-redirect on a
    // shared browser) must not silently sign an admin into the user dashboard.
    if (t && isAdminToken(t)) { clearAuth(); return false; }
    return !!t;
  });
  const [authScreen,    setAuthScreen]    = useState<"login" | "signup">("login");
  const [prefs,         setPrefs]         = useState<Preferences>(() => {
    try {
      const cachedTheme = localStorage.getItem("subl-theme") as ThemePref | null;
      if (cachedTheme) return { ...DEFAULT_PREFERENCES, theme: cachedTheme };
    } catch {}
    return DEFAULT_PREFERENCES;
  });
  const [systemDark,    setSystemDark]    = useState(prefersDark);
  const [activeRoute,   setActiveRoute]   = useState<Route>("Dashboard");
  const [isAssessing,   setIsAssessing]   = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(() => {
    try {
      const saved = localStorage.getItem("subl-last-assessment");
      if (saved) return JSON.parse(saved) as AssessmentResult;
    } catch {}
    return null;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dateFilter,    setDateFilter]    = useState<DateFilter>("Today");
  const [currentStress, setCurrentStress] = useState<CurrentStress | null>(null);
  // Start blank — real identity is loaded from /users/me below. We never seed a
  // mock user, so a brand-new account never sees someone else's name/details.
  const [user, setUser] = useState<UserProfile>({
    name:   "",
    email:  "",
    phone:  "",
    role:   "",
    avatar: "",
    avatarUrl: null,
    company: null,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([userApi.getMe(), userApi.getProfile()])
      .then(([me, profile]) => {
        setUser({
          name:   `${me.firstName} ${me.lastName}`,
          email:  me.email,
          phone:  profile.phoneNumber ?? "",
          role:   profile.displayJobTitle ?? me.accountType,
          avatar: `${me.firstName[0]}${me.lastName[0]}`.toUpperCase(),
          avatarUrl: profile.avatarUrl ?? null,
          company: me.companyName ?? null,
        });
      })
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = () =>
      notificationsApi.list(1, 20)
        .then(r => setNotifications(r.items))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = () => stressApi.getCurrent().then(setCurrentStress).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  // Load the real most-recent assessment from the backend on login (the local
  // copy is only a fast cache for first paint).
  useEffect(() => {
    if (!isLoggedIn) return;
    surveyApi.history()
      .then(rows => {
        const latest = rows[0];
        if (!latest) {
          // This account has never taken an assessment. Drop any cached value
          // left in this browser by a previous user so a new sign-up never sees
          // a phantom "last assessment" score that isn't theirs.
          setAssessmentResult(null);
          try { localStorage.removeItem("subl-last-assessment"); } catch {}
          return;
        }
        const score = Math.min(100, Math.max(0, Math.round((latest.totalScore / latest.maxScore) * 100)));
        const r: AssessmentResult = { score, level: latest.level, takenAt: latest.submittedAt };
        setAssessmentResult(r);
        try { localStorage.setItem("subl-last-assessment", JSON.stringify(r)); } catch {}
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Auto-claim the running monitoring agent on login so the dashboard starts
  // receiving data with no manual step. Silently no-ops when nothing is online
  // or another user already owns the live device.
  useEffect(() => {
    if (!isLoggedIn) return;
    devicesApi.autoClaim()
      .then(r => {
        if (r.claimed && r.deviceName) {
          toast.success(`Now receiving data from ${r.deviceName}`);
        }
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Load server-side preferences once authenticated (theme, language, tz, date
  // format) so they follow the account across devices/browsers.
  useEffect(() => {
    if (!isLoggedIn) return;
    preferencesApi.get()
      .then(p => {
        setPrefs(p);
        try { localStorage.setItem("subl-theme", p.theme); } catch {}
      })
      .catch(() => {});
  }, [isLoggedIn]);

  // Track OS scheme so "system" theme stays live.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);

  // Apply dark mode only inside the authenticated app. The login/sign-up
  // screens are a light-only design, so we force <html> light there to avoid
  // white-on-white text.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isLoggedIn && isDark);
  }, [isLoggedIn, isDark]);

  // Apply language direction + lang attribute on <html> so the whole app
  // (including Tailwind's logical spacing) flips for Arabic (RTL).
  useEffect(() => {
    const ar = (prefs.language ?? "").toLowerCase().startsWith("ar");
    document.documentElement.dir = isLoggedIn && ar ? "rtl" : "ltr";
    document.documentElement.lang = isLoggedIn && ar ? "ar" : "en";
  }, [isLoggedIn, prefs.language]);

  const updatePreferences = (next: Preferences) => {
    setPrefs(next);
    try { localStorage.setItem("subl-theme", next.theme); } catch {}
    preferencesApi.update(next).catch(() => {});
  };

  const toggleTheme = () => {
    updatePreferences({ ...prefs, theme: isDark ? "light" : "dark" });
  };

  const handleLogout = () => {
    toast.success(`See you tomorrow, ${user.name.split(" ")[0]}!`);
    // Wipe per-user cached state so the next account on this browser starts
    // clean (no leftover assessment score, name or avatar).
    try { localStorage.removeItem("subl-last-assessment"); } catch {}
    setAssessmentResult(null);
    setUser({ name: "", email: "", phone: "", role: "", avatar: "", avatarUrl: null, company: null });
    setTimeout(() => { setIsLoggedIn(false); setAuthScreen("login"); setActiveRoute("Dashboard"); }, 900);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" richColors />
        {authScreen === "signup" ? (
          <SignUpScreen onGoLogin={() => setAuthScreen("login")} />
        ) : (
          <LoginScreen
            onLogin={() => setIsLoggedIn(true)}
            onGoSignUp={() => setAuthScreen("signup")}
          />
        )}
      </>
    );
  }

  return (
    <PreferencesProvider prefs={prefs}>
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />
      {isAssessing && (
        <AssessmentModal
          onClose={() => setIsAssessing(false)}
          onComplete={(r) => {
            setAssessmentResult(r);
            try { localStorage.setItem("subl-last-assessment", JSON.stringify(r)); } catch {}
          }}
        />
      )}

      <Sidebar
        activeRoute={activeRoute} setActiveRoute={setActiveRoute}
        user={user} onLogout={handleLogout}
      />
      <Header
        theme={isDark ? "dark" : "light"} toggleTheme={toggleTheme}
        notifications={notifications} setNotifications={setNotifications}
        user={user} onLogout={handleLogout}
        activeRoute={activeRoute} setActiveRoute={setActiveRoute}
      />

      <main className="md:ml-60 pt-14 pb-16 md:pb-0 min-h-screen">
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-[1600px] mx-auto">
          {/* All pages stay mounted; we only hide the inactive ones. This keeps
              the live keystroke stream (its WebSocket + buffer) and the Subl AI
              conversation alive instead of being torn down on every tab switch. */}
          <div className={activeRoute === "Dashboard" ? "" : "hidden"}>
            <Dashboard
              isDark={isDark}
              onStartAssessment={() => setIsAssessing(true)}
              userName={user.name}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              currentStress={currentStress}
              assessmentResult={assessmentResult}
            />
          </div>
          <div className={activeRoute === "Habits" ? "" : "hidden"}>
            <Habits />
          </div>
          <div className={activeRoute === "Articles" ? "" : "hidden"}>
            <Articles />
          </div>
          <div className={activeRoute === "SublAI" ? "" : "hidden"}>
            <SublAI />
          </div>
          <div className={activeRoute === "Settings" ? "" : "hidden"}>
            <Settings
              user={user}
              setUser={(u) => setUser((prev) => ({
                ...u,
                company: prev.company,
                avatar: u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
              }))}
              preferences={prefs}
              onUpdatePreferences={updatePreferences}
            />
          </div>
        </div>
      </main>

      <BottomNav activeRoute={activeRoute} setActiveRoute={setActiveRoute} />
    </div>
    </PreferencesProvider>
  );
}
