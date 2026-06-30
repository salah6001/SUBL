import { useState, useEffect } from "react";
import { Save, Bell, Shield, Smartphone, Mail, User, Lock, ChevronRight, Eye, EyeOff, CheckCircle, Laptop, RefreshCw, Sun, Moon, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { userApi } from "../api/user";
import { notificationsApi } from "../api/notifications";
import { devicesApi, type ClaimableDevice } from "../api/devices";
import type { Preferences, ThemePref } from "../api/preferences";
import { TIMEZONES, DATE_FORMATS } from "../lib/format";
import { usePrefs } from "../lib/prefs";
import { enablePush, disablePush, isPushSupported } from "../lib/push";
import { exportMyDataCsv } from "../lib/exportData";
import { UserAvatar, AVATAR_VECTOR_VALUES } from "./UserAvatar";

interface UserProfile { name: string; email: string; phone: string; role: string; avatarUrl?: string | null; }
interface SettingsProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  preferences: Preferences;
  onUpdatePreferences: (p: Preferences) => void;
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)", disabled: false },
  { value: "ar",    label: "العربية", disabled: true },
];

/** Highlights the settings section currently scrolled into view. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return active;
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-300 shrink-0 ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      style={{ height: "22px", width: "40px" }}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-[18px]" : "translate-x-0"}`}
        style={{ width: "18px", height: "18px" }} />
    </button>
  );
}

export function Settings({ user, setUser, preferences, onUpdatePreferences }: SettingsProps) {
  const { formatDateTime, t: tr } = usePrefs();
  const setPref = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    onUpdatePreferences({ ...preferences, [key]: value });

  const [form, setForm] = useState({ ...user });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const deleteAllData = async () => {
    setDeleting(true);
    try {
      await userApi.deleteMyData();
      try { localStorage.removeItem("subl-last-assessment"); } catch {}
      setConfirmDelete(false);
      toast.success(tr("settings.deleteDone"));
    } catch {
      toast.error(tr("settings.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };
  // This page stays mounted (App hides inactive tabs), so re-sync the editable
  // form whenever the authenticated user finishes loading or changes.
  useEffect(() => { setForm({ ...user }); }, [user.name, user.email, user.phone, user.role, user.avatarUrl]);
  const initials = (form.name || user.name).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  // Avatar is staged locally and only persisted when "Save" is clicked, so the
  // user can preview a choice and still cancel by leaving the page.
  const pickAvatar = (value: string | null) => setForm(f => ({ ...f, avatarUrl: value }));
  const [saved, setSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Mirrors the backend NotificationPrefs so every toggle drives a real,
  // persisted preference (no decorative switches).
  const [notif, setNotif] = useState({
    inAppEnabled: true,
    emailEnabled: false,
    pushEnabled: true,
    emailDigestEnabled: false,
    quietHoursEnabled: false,
  });

  // Load the user's saved notification preferences so the toggles reflect the
  // real server state instead of hardcoded defaults.
  useEffect(() => {
    notificationsApi.getPrefs()
      .then(p => setNotif({
        inAppEnabled:       p.inAppEnabled,
        emailEnabled:       p.emailEnabled,
        pushEnabled:        p.pushEnabled,
        emailDigestEnabled: p.emailDigestEnabled,
        quietHoursEnabled:  p.quietHoursEnabled,
      }))
      .catch(() => {});
  }, []);

  // Claimable monitoring devices — lets this account receive the running
  // desktop agent's keystroke data without redeploying the agent.
  const [devices, setDevices] = useState<ClaimableDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadDevices = () => {
    setDevicesLoading(true);
    devicesApi.getClaimable()
      .then(setDevices)
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  };
  useEffect(() => { loadDevices(); }, []);

  const claimDevice = async (id: string, name: string) => {
    setClaiming(id);
    try {
      await devicesApi.claim(id);
      toast.success(`"${name}" now feeds your dashboard`);
      loadDevices();
    } catch {
      toast.error("Failed to claim device");
    } finally {
      setClaiming(null);
    }
  };

  const exportData = () => {
    toast.promise(exportMyDataCsv(), {
      loading: "Preparing your data…",
      success: "Your data has been exported",
      error: "Failed to export data",
    });
  };

  const removeDevice = async (id: string, name: string) => {
    setRemoving(id);
    // Optimistically drop it so the list reflects the change immediately.
    setDevices(prev => prev.filter(d => d.id !== id));
    try {
      await devicesApi.remove(id);
      toast.success(`Removed "${name}"`);
    } catch {
      toast.error("Failed to remove device");
      loadDevices();
    } finally {
      setRemoving(null);
    }
  };

  const save = async () => {
    try {
      const parts = form.name.trim().split(" ");
      const firstName = parts[0];
      const lastName  = parts.slice(1).join(" ") || parts[0];
      await userApi.updateMe(firstName, lastName, form.email || undefined);
      await userApi.updateProfile({
        phoneNumber: form.phone || null,
        avatarUrl: form.avatarUrl ?? null,
        displayJobTitle: form.role || null,
      });
      setUser({ ...form });
      setSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = () => {
    if (!password || !newPassword) {
      toast.error("Enter both current and new password");
      return;
    }
    userApi.changePassword(password, newPassword)
      .then(() => {
        toast.success("Password changed successfully");
        setPassword(""); setNewPassword("");
      })
      .catch(() => toast.error("Failed to change password"));
  };

  const handleNotifToggle = async (key: keyof typeof notif, value: boolean) => {
    // Push needs a real browser subscription before the preference is meaningful.
    if (key === "pushEnabled") {
      try {
        if (value) await enablePush();
        else await disablePush();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not enable push");
        return; // leave the toggle off; nothing persisted
      }
    }

    const next = { ...notif, [key]: value };
    setNotif(next);
    // Persist only the field that changed — each toggle is a real backend pref.
    notificationsApi.updatePrefs({ [key]: value }).catch(() => {
      // Roll back on failure so the UI never lies about saved state.
      setNotif(notif);
      toast.error("Failed to save notification preference");
    });
    if (key === "pushEnabled" && value) toast.success("Browser push enabled");
  };

  const sections = [
    { id: "profile",       label: tr("settings.personalInfo"), icon: User },
    { id: "notifications", label: tr("settings.notifications"), icon: Bell },
    { id: "privacy",       label: tr("settings.privacy"),      icon: Shield },
    { id: "device",        label: tr("settings.device"),       icon: Smartphone },
  ];
  const active = useScrollSpy(sections.map(s => s.id));
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="max-w-4xl flex flex-col lg:flex-row gap-6">
      {/* Left anchor rail — links scroll to the matching section on this page */}
      <div className="lg:w-48 flex-shrink-0">
        <div className="lg:sticky lg:top-4 flex lg:flex-col gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 py-2 lg:px-3 rounded-lg text-xs transition-all ${
                active === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stacked sections */}
      <div className="flex-1 min-w-0 space-y-8">
      {/* Personal Info */}
      <section id="profile" className="scroll-mt-6 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <UserAvatar avatarUrl={form.avatarUrl} initials={initials} size={48} />
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{form.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{form.role}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{tr("settings.chooseAvatar")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {AVATAR_VECTOR_VALUES.map(v => (
                    <button key={v} onClick={() => pickAvatar(v)}
                      className={`rounded-full transition-all ${form.avatarUrl === v ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : "hover:opacity-80"}`}>
                      <UserAvatar avatarUrl={v} initials={initials} size={40} />
                    </button>
                  ))}
                  <button onClick={() => pickAvatar(null)}
                    className={`rounded-full transition-all ${!form.avatarUrl ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : "hover:opacity-80"}`}
                    title={tr("settings.useInitials")}>
                    <UserAvatar avatarUrl={null} initials={initials} size={40} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{tr("settings.fullName")}</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{tr("settings.jobTitle")}</label>
                  <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{tr("settings.emailAddress")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{tr("settings.phone")}</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-3">{tr("settings.security")}</h3>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type={showPw ? "text" : "password"} placeholder={tr("settings.currentPassword")} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type={showPw ? "text" : "password"} placeholder={tr("settings.newPassword")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-8 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button onClick={handlePasswordChange} className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
              {tr("settings.changePassword")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <button onClick={save}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all ${
              saved ? "bg-green-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            }`}>
            {saved ? <><CheckCircle className="w-4 h-4" />{tr("settings.saved")}</> : <><Save className="w-4 h-4" />{tr("action.save")}</>}
          </button>
      </section>

      {/* Notifications */}
      <section id="notifications" className="scroll-mt-6 space-y-3">
          {[
            { title: tr("settings.deliveryChannels"), items: [
              { k: "inAppEnabled", l: tr("settings.inAppNotifs"), d: tr("settings.inAppNotifsDesc"), disabled: false },
              { k: "emailEnabled", l: tr("settings.emailNotifs"), d: tr("settings.emailNotifsDesc"), disabled: false },
              { k: "pushEnabled", l: tr("settings.pushNotifs"), d: isPushSupported() ? tr("settings.pushNotifsOn") : tr("settings.pushNotifsOff"), disabled: !isPushSupported() },
            ]},
            { title: tr("settings.email"), items: [
              { k: "emailDigestEnabled", l: tr("settings.emailDigest"), d: tr("settings.emailDigestDesc"), disabled: false },
            ]},
            { title: tr("settings.quiet"), items: [
              { k: "quietHoursEnabled", l: tr("settings.dnd"), d: tr("settings.dndDesc"), disabled: false },
            ]},
          ].map(({ title, items }) => (
            <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
              <div className="space-y-3.5">
                {items.map(({ k, l, d, disabled }) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{l}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{d}</p>
                    </div>
                    <Toggle
                      checked={notif[k as keyof typeof notif]}
                      disabled={disabled}
                      onChange={(v) => handleNotifToggle(k as keyof typeof notif, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-6 space-y-3">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5">
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              <strong>{tr("settings.privacyFirst")}</strong> {tr("settings.privacyFirstDesc")}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { l: tr("settings.exportData"), d: tr("settings.exportDataDesc"), action: exportData },
              { l: tr("settings.deleteData"), d: tr("settings.deleteDataDesc"), action: () => setConfirmDelete(true) },
              { l: tr("settings.privacyPolicy"), d: tr("settings.privacyPolicyDesc"), action: () => setShowPolicy(true) },
            ].map(({ l, d, action }) => (
              <button key={l} onClick={action}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-start">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">{l}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{d}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 rtl:-scale-x-100" />
              </button>
            ))}
          </div>
      </section>

      {/* Device */}
      <section id="device" className="scroll-mt-6 space-y-3">
          {/* Keystroke monitoring — claim the machine that feeds your dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{tr("settings.keystrokeMonitoring")}</h3>
              <button onClick={loadDevices} title={tr("claim.refresh")}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {tr("settings.keystrokeMonitoringDesc")}
            </p>

            {devicesLoading && devices.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">{tr("settings.loadingDevices")}</div>
            ) : devices.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">
                {tr("settings.noDevices")}
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map(d => (
                  <div key={d.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      d.claimedByMe
                        ? "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-800"
                    }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      d.claimedByMe ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      <Laptop className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{d.deviceName}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${
                          d.isOnline ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${d.isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
                          {d.isOnline ? tr("settings.online") : tr("settings.offline")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {d.platform}
                        {d.lastSeenAt && ` · seen ${formatDateTime(d.lastSeenAt)}`}
                      </div>
                    </div>
                    {d.claimedByMe ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> {tr("settings.feedingYou")}
                      </span>
                    ) : (
                      <button
                        onClick={() => claimDevice(d.id, d.deviceName)}
                        disabled={claiming === d.id}
                        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                        {claiming === d.id ? tr("settings.claiming") : tr("settings.sendDataHere")}
                      </button>
                    )}
                    {/* Offline machines can be cleaned out of the list. A live
                        agent re-registers itself, so we only offer this when it
                        is not currently online. */}
                    {!d.isOnline && (
                      <button
                        onClick={() => removeDevice(d.id, d.deviceName)}
                        disabled={removing === d.id}
                        title={tr("settings.removeDevice")}
                        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appearance, language, timezone & date format — persisted server-side */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">{tr("settings.appearance")}</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "light",  label: tr("settings.theme.light"),  icon: Sun },
                  { v: "dark",   label: tr("settings.theme.dark"),   icon: Moon },
                  { v: "system", label: tr("settings.theme.system"), icon: Monitor },
                ] as { v: ThemePref; label: string; icon: typeof Sun }[]).map(({ v, label, icon: Icon }) => (
                  <button key={v} onClick={() => setPref("theme", v)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      preferences.theme === v
                        ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300"
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{tr("settings.language")}</span>
              <div className="flex flex-col items-end gap-1.5">
                <select value={preferences.language === "ar" ? "en-US" : preferences.language} onChange={e => setPref("language", e.target.value)}
                  className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value} disabled={l.disabled}>{l.label}</option>)}
                </select>
                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                  العربية — قريبًا · Arabic coming soon
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{tr("settings.timezone")}</span>
              <select value={preferences.timezone} onChange={e => setPref("timezone", e.target.value)}
                className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900">
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{tr("settings.dateFormat")}</span>
              <select value={preferences.dateFormat} onChange={e => setPref("dateFormat", e.target.value)}
                className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900">
                {DATE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm text-slate-800 dark:text-slate-200 mb-3">{tr("settings.appInfo")}</h3>
            <div className="space-y-2">
              {[
                { l: tr("settings.version"), v: "1.0.0" },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-500 dark:text-slate-400">{l}</span>
                  <span className="text-slate-700 dark:text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
      </section>
      </div>

      {/* Delete-all-data confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">{tr("settings.deleteConfirmTitle")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{tr("settings.deleteConfirmBody")}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60">
                {tr("action.cancel")}
              </button>
              <button onClick={deleteAllData} disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60">
                {deleting ? tr("settings.deleting") : tr("settings.deleteConfirmYes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy policy */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPolicy(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">{tr("settings.privacyPolicy")}</h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {tr("settings.privacyPolicyBody")}
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => setShowPolicy(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                {tr("action.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
