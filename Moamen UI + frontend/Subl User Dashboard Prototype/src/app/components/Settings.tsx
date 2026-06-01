import { useState } from "react";
import { Save, Bell, Shield, Smartphone, Mail, User, Lock, ChevronRight, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface UserProfile { name: string; email: string; phone: string; role: string; }
interface SettingsProps { user: UserProfile; setUser: (u: UserProfile) => void; }

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-300 shrink-0 ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
      style={{ height: "22px", width: "40px" }}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-[18px]" : "translate-x-0"}`}
        style={{ width: "18px", height: "18px" }} />
    </button>
  );
}

export function Settings({ user, setUser }: SettingsProps) {
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [tab, setTab] = useState<"profile" | "notifications" | "privacy" | "device">("profile");

  const [notif, setNotif] = useState({
    stressAlerts: true, weeklyReport: true, newArticles: false,
    assessmentReminders: true, emailDigest: false, pushNotifications: true,
    soundAlerts: false, doNotDisturb: false,
  });

  const [privacy, setPrivacy] = useState({
    dataSharing: false, analyticsOptIn: true,
    keystrokeMonitoring: true, sentimentAnalysis: true,
  });

  const save = () => {
    setUser(form); setSaved(true);
    toast.success("Profile updated successfully");
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "profile" as const, label: "Personal Info", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
    { id: "device" as const, label: "Device", icon: Smartphone },
  ];

  return (
    <div className="max-w-xl space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${
              tab === id
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                {form.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">{form.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{form.role}</p>
                <button className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Change photo</button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Job Title</label>
                  <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-3">Security</h3>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type={showPw ? "text" : "password"} defaultValue="••••••••"
                className="w-full pl-8 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
              Change password <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <button onClick={save}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all ${
              saved ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            }`}>
            {saved ? <><CheckCircle className="w-4 h-4" />Saved</> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="space-y-3">
          {[
            { title: "Alert Preferences", items: [
              { k: "stressAlerts", l: "Stress Alerts", d: "Notify when stress exceeds threshold" },
              { k: "weeklyReport", l: "Weekly Report", d: "Weekly stress analytics summary" },
              { k: "newArticles", l: "New Articles", d: "When new wellness articles publish" },
              { k: "assessmentReminders", l: "Assessment Reminders", d: "Daily assessment reminders" },
            ]},
            { title: "Delivery Channels", items: [
              { k: "emailDigest", l: "Email Digest", d: "Daily summary to your email" },
              { k: "pushNotifications", l: "Push Notifications", d: "In-app and browser notifications" },
              { k: "soundAlerts", l: "Sound Alerts", d: "Play sound on stress alerts" },
              { k: "doNotDisturb", l: "Do Not Disturb", d: "Silence during focus sessions" },
            ]},
          ].map(({ title, items }) => (
            <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
              <div className="space-y-3.5">
                {items.map(({ k, l, d }) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{l}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{d}</p>
                    </div>
                    <Toggle checked={notif[k as keyof typeof notif]} onChange={(v) => setNotif({ ...notif, [k]: v })} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy */}
      {tab === "privacy" && (
        <div className="space-y-3">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5">
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              <strong>Privacy First:</strong> All biometric data is processed locally. We never sell your personal stress data.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-4">Data Collection</h3>
            <div className="space-y-3.5">
              {[
                { k: "keystrokeMonitoring", l: "Keystroke Dynamics", d: "Monitor typing patterns (core feature)" },
                { k: "sentimentAnalysis", l: "Sentiment Analysis", d: "Analyze communication tone (opt-in)" },
                { k: "analyticsOptIn", l: "Product Analytics", d: "Share anonymized usage data" },
                { k: "dataSharing", l: "Employer Data Sharing", d: "Anonymized aggregate reports" },
              ].map(({ k, l, d }) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{l}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{d}</p>
                  </div>
                  <Toggle checked={privacy[k as keyof typeof privacy]} onChange={(v) => setPrivacy({ ...privacy, [k]: v })} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { l: "Export My Data", d: "Download all history as CSV" },
              { l: "Delete All Data", d: "Permanently remove stored data" },
              { l: "View Privacy Policy", d: "Read our full privacy policy" },
            ].map(({ l, d }) => (
              <button key={l} onClick={() => toast.info(`${l} — coming soon`)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{l}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{d}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Device */}
      {tab === "device" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { l: "Language", v: "English (US)" },
              { l: "Timezone", v: "UTC-5 (Eastern)" },
              { l: "Date Format", v: "MM/DD/YYYY" },
              { l: "Stress Threshold", v: "70 / 100" },
              { l: "Monitoring Interval", v: "Every 30 minutes" },
            ].map(({ l, v }) => (
              <div key={l} className="flex items-center justify-between p-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">{l}</span>
                <button onClick={() => toast.info(`Edit ${l} — coming soon`)}
                  className="flex items-center gap-1 text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {v} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-3">App Info</h3>
            <div className="space-y-2">
              {[
                { l: "Version", v: "2.4.1" },
                { l: "Last Sync", v: "Just now" },
                { l: "Storage Used", v: "12.4 MB" },
                { l: "Account Created", v: "January 15, 2026" },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-500 dark:text-slate-400">{l}</span>
                  <span className="text-slate-700 dark:text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
