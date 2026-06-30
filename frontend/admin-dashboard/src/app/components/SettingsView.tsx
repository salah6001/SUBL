import { useState, useEffect } from "react";
import {
  Settings, Bell, Save, Moon, Sun, Monitor, User, Lock, Eye, EyeOff, Building2,
} from "lucide-react";
import type { ToastType } from "./shared/Toast";
import type { Preferences } from "../lib/preferencesApi";
import { useI18n } from "../lib/i18n";
import { api, ApiError } from "../lib/apiClient";
import { updateCompany } from "../lib/admin/companyApi";
import { getNotificationPrefs, updateNotificationPrefs } from "../lib/notificationsApi";
import { enablePush, disablePush, isPushSupported } from "../lib/push";

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";
  const lastName = parts.join(" ") || firstName;
  return { firstName, lastName };
}

interface Props {
  showToast: (msg: string, type?: ToastType) => void;
  adminUser?: { name: string; email: string };
  onUpdateAdmin?: (name: string, email: string) => void;
  preferences: Preferences;
  onUpdatePreferences: (p: Preferences) => void;
  company?: string;
  onCompanyChange?: (name: string) => void;
}

function CompanySettings({ company, onCompanyChange, showToast }: { company: string; onCompanyChange: (n: string) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [name, setName] = useState(company);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setName(company); }, [company]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) { showToast("Company name can't be empty", "error"); return; }
    setSaving(true);
    try {
      const updated = await updateCompany(trimmed);
      onCompanyChange(updated.name);
      showToast("Company name updated", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't update company", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Company">
      <SettingRow label="Company Name" description="Shown as the banner at the top of the admin and user dashboards.">
        <input className={INPUT_CLS} value={name} onChange={e => setName(e.target.value)} style={{ fontSize: "0.875rem", width: "220px" }} />
      </SettingRow>
      <div className="flex justify-end py-4">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> {saving ? "Saving…" : "Save Company"}
        </button>
      </div>
    </SectionCard>
  );
}

const INPUT_CLS = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all";

/** Highlights the settings section currently scrolled into view. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    function update() {
      const probe = window.innerHeight * 0.28;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      // The last section often can't scroll high enough to cross the probe line
      // (not enough content below it), so highlight it once it's fully in view.
      const lastEl = document.getElementById(ids[ids.length - 1]);
      if (lastEl && lastEl.getBoundingClientRect().bottom <= window.innerHeight + 2) {
        current = ids[ids.length - 1];
      }
      setActive(current);
    }
    update();
    // capture = true so scrolls inside an inner scroll container are caught too.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return active;
}

function ProfileSettings({
  adminUser, onUpdateAdmin, showToast,
}: { adminUser: { name: string; email: string }; onUpdateAdmin: (n: string, e: string) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [name, setName] = useState(adminUser.name);
  const [saving, setSaving] = useState(false);
  const initials = name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => { setName(adminUser.name); }, [adminUser.name]);

  async function saveProfile() {
    const { firstName, lastName } = splitName(name);
    if (!firstName) { showToast("Name can't be empty", "error"); return; }
    setSaving(true);
    try {
      await api.put<void>("users/me", { firstName, lastName });
      onUpdateAdmin(name, adminUser.email);
      showToast("Profile saved", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't save profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) { showToast("Enter both current and new password", "error"); return; }
    setChangingPw(true);
    try {
      await api.post<void>("users/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword("");
      showToast("Password changed", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't change password", "error");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <SectionCard title="Admin Profile">
      <div className="py-5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shrink-0">
          <span className="text-white" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{initials || "A"}</span>
        </div>
        <div>
          <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.95rem", fontWeight: 700 }}>{name || "Admin"}</p>
          <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.8rem" }}>Super Admin</p>
        </div>
      </div>
      <SettingRow label="Display Name" description="Shown across the admin console.">
        <input className={INPUT_CLS} value={name} onChange={e => setName(e.target.value)} style={{ fontSize: "0.875rem", width: "220px" }} />
      </SettingRow>
      <SettingRow label="Email Address" description="Your sign-in email.">
        <input className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} type="email" value={adminUser.email} disabled style={{ fontSize: "0.875rem", width: "220px" }} />
      </SettingRow>
      <SettingRow label="Role" description="Your access level.">
        <input className={`${INPUT_CLS} opacity-60 cursor-not-allowed`} value="Super Admin" disabled style={{ fontSize: "0.875rem", width: "220px" }} />
      </SettingRow>
      <div className="flex justify-end py-4">
        <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
        <SettingRow label="Current Password" description="Change your sign-in password.">
          <div className="relative" style={{ width: "220px" }}>
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${INPUT_CLS} pl-9`} type={showPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" style={{ fontSize: "0.875rem" }} />
          </div>
        </SettingRow>
        <SettingRow label="New Password" description="At least 8 characters.">
          <div className="relative" style={{ width: "220px" }}>
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${INPUT_CLS} pl-9 pr-9`} type={showPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" style={{ fontSize: "0.875rem" }} />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </SettingRow>
        <div className="flex justify-end py-4">
          <button onClick={changePassword} disabled={changingPw} className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            <Lock size={15} /> {changingPw ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        value ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex-1">
        <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{label}</p>
        {description && <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: "0.78rem", lineHeight: 1.6 }}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-5">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>{title}</h3>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

function GeneralSettings({ showToast, preferences, onUpdatePreferences }: Props) {
  const { t: tr } = useI18n();
  const set = (patch: Partial<Preferences>) => onUpdatePreferences({ ...preferences, ...patch });
  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all";

  return (
    <>
      <SectionCard title="Localization">
        <SettingRow label={tr("settings.timezone")} description="Used when formatting timestamps across the console.">
          <select className={inputCls} value={preferences.timezone} onChange={e => set({ timezone: e.target.value })} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="Europe/London">GMT / London</option>
            <option value="Europe/Berlin">Central European (CET)</option>
            <option value="Africa/Cairo">Cairo (EET)</option>
            <option value="Asia/Dubai">Gulf (GST)</option>
            <option value="Asia/Tokyo">Japan Standard (JST)</option>
            <option value="UTC">UTC</option>
          </select>
        </SettingRow>
        <SettingRow label={tr("settings.language")}>
          <div className="flex flex-col items-end gap-1.5">
            <select className={inputCls} value={preferences.language === "ar" ? "en-US" : preferences.language} onChange={e => set({ language: e.target.value })} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
              <option value="en-US">English (US)</option>
              <option value="ar" disabled>العربية</option>
            </select>
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
              العربية — قريبًا · Arabic coming soon
            </span>
          </div>
        </SettingRow>
        <SettingRow label={tr("settings.dateFormat")}>
          <select className={inputCls} value={preferences.dateFormat} onChange={e => set({ dateFormat: e.target.value })} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Interface Theme">
        <div className="py-4">
          <p className="text-slate-500 dark:text-slate-400 mb-4" style={{ fontSize: "0.82rem" }}>Choose the visual theme for the admin console. Saved to your account.</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light",  label: tr("settings.theme.light"),  icon: <Sun size={18} />,     preview: "bg-white border-slate-200" },
              { key: "dark",   label: tr("settings.theme.dark"),   icon: <Moon size={18} />,    preview: "bg-slate-800 border-slate-700" },
              { key: "system", label: tr("settings.theme.system"), icon: <Monitor size={18} />, preview: "bg-gradient-to-r from-white to-slate-800 border-slate-300" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => set({ theme: t.key })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${preferences.theme === t.key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                <div className={`w-full h-10 rounded-lg border ${t.preview}`} />
                <div className={`flex items-center gap-1.5 ${preferences.theme === t.key ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`} style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {t.icon} {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={() => showToast("Preferences saved")} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> Done
        </button>
      </div>
    </>
  );
}

function NotificationsSettings({ showToast }: Props) {
  const [prefs, setPrefs] = useState({ inAppEnabled: true, emailEnabled: true, pushEnabled: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getNotificationPrefs()
      .then(p => setPrefs({ inAppEnabled: p.inAppEnabled, emailEnabled: p.emailEnabled, pushEnabled: p.pushEnabled }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const pushSupported = isPushSupported();

  // Each toggle persists immediately (partial update) — no fake "Save" button.
  async function toggle(key: keyof typeof prefs, value: boolean) {
    const prev = prefs;
    setPrefs({ ...prefs, [key]: value });
    try {
      // Push needs a real browser subscription before the preference is meaningful:
      // request permission, subscribe via the PushManager and register the token.
      if (key === "pushEnabled") {
        if (value) await enablePush();
        else await disablePush();
      }
      await updateNotificationPrefs({ [key]: value });
      if (key === "pushEnabled" && value) showToast("Browser push enabled", "success");
    } catch (err) {
      setPrefs(prev);
      showToast(
        err instanceof ApiError ? err.displayMessage
          : err instanceof Error ? err.message
          : "Couldn't save preference",
        "error",
      );
    }
  }

  return (
    <>
      <SectionCard title="Alert Channels">
        <SettingRow label="In-App Alerts" description="Real-time alerts inside the console.">
          <Toggle value={prefs.inAppEnabled} disabled={!loaded} onChange={v => toggle("inAppEnabled", v)} />
        </SettingRow>
        <SettingRow label="Email Alerts" description="Send stress alerts and critical events to your email.">
          <Toggle value={prefs.emailEnabled} disabled={!loaded} onChange={v => toggle("emailEnabled", v)} />
        </SettingRow>
        <SettingRow label="Push Notifications" description={pushSupported ? "Browser push notifications for real-time critical alerts." : "This browser doesn't support push notifications."}>
          <Toggle value={prefs.pushEnabled && pushSupported} disabled={!loaded || !pushSupported} onChange={v => toggle("pushEnabled", v)} />
        </SettingRow>
        <SettingRow label="Slack" description="Slack delivery is configured server-side (a team webhook). When set, stress &amp; session alerts post to your Slack channel automatically.">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Server-managed</span>
        </SettingRow>
      </SectionCard>
    </>
  );
}

export function SettingsView({
  showToast,
  adminUser = { name: "Admin", email: "" },
  onUpdateAdmin = () => {},
  preferences,
  onUpdatePreferences,
  company = "",
  onCompanyChange = () => {},
}: Props) {
  const sections = [
    { id: "profile",       label: "Profile",       icon: <User size={16} /> },
    { id: "company",       label: "Company",       icon: <Building2 size={16} /> },
    { id: "general",       label: "General",       icon: <Settings size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  ];
  const active = useScrollSpy(sections.map(s => s.id));
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
          <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Settings</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>Profile, system configuration and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left anchor rail — links scroll to the matching section on this page */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="lg:sticky lg:top-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-2 flex lg:flex-col gap-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => go(s.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left w-full ${
                  active === s.id
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200/50 dark:shadow-blue-900/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                style={{ fontSize: "0.875rem", fontWeight: active === s.id ? 600 : 400 }}>
                <span className={active === s.id ? "text-white" : "text-slate-400 dark:text-slate-500"}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stacked sections */}
        <div className="flex-1 min-w-0 space-y-10">
          <section id="profile" className="scroll-mt-6">
            <ProfileSettings adminUser={adminUser} onUpdateAdmin={onUpdateAdmin} showToast={showToast} />
          </section>
          <section id="company" className="scroll-mt-6">
            <CompanySettings company={company} onCompanyChange={onCompanyChange} showToast={showToast} />
          </section>
          <section id="general" className="scroll-mt-6">
            <GeneralSettings showToast={showToast} preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
          </section>
          <section id="notifications" className="scroll-mt-6">
            <NotificationsSettings showToast={showToast} />
          </section>
        </div>
      </div>
    </div>
  );
}
