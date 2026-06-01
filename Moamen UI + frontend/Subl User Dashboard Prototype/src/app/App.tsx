import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import type { Route } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { AssessmentModal } from "./components/AssessmentModal";
import { Dashboard } from "./components/Dashboard";
import { Habits } from "./components/Habits";
import { Articles } from "./components/Articles";
import { SublAI } from "./components/SublAI";
import { Settings } from "./components/Settings";
import type { DateFilter } from "./components/DateFilterBar";
import { currentUser, initialNotifications, defaultHabits } from "./data/mockData";
import type { Habit } from "./data/mockData";
import { login as apiLogin } from "./api/auth";
type Theme = "light" | "dark";

interface UserProfile {
  name: string; email: string; phone: string; role: string; avatar: string;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email    = emailRef.current?.value    ?? "alex.johnson@company.com";
    const password = passwordRef.current?.value ?? "demo-password";
    try {
      await apiLogin(email, password);
    } catch (err) {
      // Fall back gracefully so the UI remains usable without a live backend
      console.warn("API login failed, proceeding with demo mode:", err);
    } finally {
      setLoading(false);
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-600/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-white text-2xl mb-0.5">Subl</h1>
          <p className="text-slate-500 text-sm">AI-Driven Workplace Wellness</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-white text-lg mb-0.5">Welcome back</h2>
          <p className="text-slate-500 text-xs mb-5">Sign in to your wellness dashboard</p>
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5">Email</label>
              <input ref={emailRef} type="email" defaultValue="alex.johnson@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5">Password</label>
              <input ref={passwordRef} type="password" defaultValue="demo-password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input type="checkbox" className="accent-blue-500 w-3 h-3" defaultChecked />
                Remember me
              </label>
              <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot?</button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/25 disabled:opacity-70 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : "Sign In"}
            </button>
          </form>
          <p className="text-center text-[11px] text-slate-600 mt-4">Demo credentials pre-filled</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [theme,         setTheme]         = useState<Theme>("light");
  const [activeRoute,   setActiveRoute]   = useState<Route>("Dashboard");
  const [isAssessing,   setIsAssessing]   = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [dateFilter,    setDateFilter]    = useState<DateFilter>("Today");
  const [habits,        setHabits]        = useState<Habit[]>(defaultHabits);
  const [user, setUser] = useState<UserProfile>({
    name:   currentUser.name,
    email:  currentUser.email,
    phone:  currentUser.phone,
    role:   currentUser.role,
    avatar: currentUser.avatar,
  });

  useEffect(() => {
    const saved = localStorage.getItem("subl-theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const init = saved ?? (prefersDark ? "dark" : "light");
    setTheme(init);
    if (init === "dark") document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("subl-theme", next);
    next === "dark"
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  };

  const habitCompletionRate = habits.length > 0
    ? Math.round(habits.filter((h) => h.completed).length / habits.length * 100)
    : 0;

  const handleLogout = () => {
    toast.success(`See you tomorrow, ${user.name.split(" ")[0]}!`);
    setTimeout(() => { setIsLoggedIn(false); setActiveRoute("Dashboard"); }, 900);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />
      {isAssessing && <AssessmentModal onClose={() => setIsAssessing(false)} />}

      <Sidebar
        activeRoute={activeRoute} setActiveRoute={setActiveRoute}
        user={user} onLogout={handleLogout}
      />
      <Header
        theme={theme} toggleTheme={toggleTheme}
        notifications={notifications} setNotifications={setNotifications}
        user={user} onLogout={handleLogout}
        onStartAssessment={() => setIsAssessing(true)}
        activeRoute={activeRoute} setActiveRoute={setActiveRoute}
      />

      <main className="md:ml-60 pt-14 pb-16 md:pb-0 min-h-screen">
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-[1600px] mx-auto">
          {activeRoute === "Dashboard" && (
            <Dashboard
              isDark={theme === "dark"}
              onStartAssessment={() => setIsAssessing(true)}
              userName={user.name}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              habitCompletionRate={habitCompletionRate}
            />
          )}
          {activeRoute === "Habits" && (
            <Habits habits={habits} setHabits={setHabits} />
          )}
          {activeRoute === "Articles" && <Articles />}
          {activeRoute === "SublAI"   && <SublAI />}
          {activeRoute === "Settings" && (
            <Settings
              user={user}
              setUser={(u) => setUser({
                ...u,
                avatar: u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
              })}
            />
          )}
        </div>
      </main>

      <BottomNav activeRoute={activeRoute} setActiveRoute={setActiveRoute} />
    </div>
  );
}
