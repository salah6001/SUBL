import { useState } from "react";
import {
  Settings, Shield, Bell, Save, Moon, Sun, Monitor, Info,
} from "lucide-react";
import type { ToastType } from "./shared/Toast";

type SettingsTab = "General" | "Security" | "Notifications";

interface Props { showToast: (msg: string, type?: ToastType) => void; }

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

function GeneralSettings({ showToast }: Props) {
  const [company, setCompany] = useState("Subl Technologies");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [language, setLanguage] = useState("en-US");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all";

  return (
    <>
      <SectionCard title="Organization">
        <SettingRow label="Company Name" description="Displayed across the Subl admin console.">
          <input className={inputCls} value={company} onChange={e => setCompany(e.target.value)} style={{ fontSize: "0.875rem", width: "220px" }} />
        </SettingRow>
        <SettingRow label="Timezone" description="Used for all timestamps and report scheduling.">
          <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="Europe/London">GMT / London</option>
            <option value="Europe/Berlin">Central European (CET)</option>
            <option value="Asia/Tokyo">Japan Standard (JST)</option>
            <option value="UTC">UTC</option>
          </select>
        </SettingRow>
        <SettingRow label="Display Language">
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
            <option value="de-DE">Deutsch</option>
            <option value="ja-JP">日本語</option>
          </select>
        </SettingRow>
        <SettingRow label="Date Format">
          <select className={inputCls} value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={{ fontSize: "0.875rem", width: "220px", appearance: "none" }}>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Interface Theme">
        <div className="py-4">
          <p className="text-slate-500 dark:text-slate-400 mb-4" style={{ fontSize: "0.82rem" }}>Choose the visual theme for the admin console.</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light",  label: "Light",  icon: <Sun size={18} />,     preview: "bg-white border-slate-200" },
              { key: "dark",   label: "Dark",   icon: <Moon size={18} />,    preview: "bg-slate-800 border-slate-700" },
              { key: "system", label: "System", icon: <Monitor size={18} />, preview: "bg-gradient-to-r from-white to-slate-800 border-slate-300" },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTheme(t.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === t.key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                <div className={`w-full h-10 rounded-lg border ${t.preview}`} />
                <div className={`flex items-center gap-1.5 ${theme === t.key ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`} style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {t.icon} {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={() => showToast("General settings saved successfully", "success")} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> Save General Settings
        </button>
      </div>
    </>
  );
}

function SecuritySettings({ showToast }: Props) {
  const [twoFA, setTwoFA] = useState(true);
  const [sso, setSSO] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordPolicy, setPasswordPolicy] = useState("Strong");
  const [ipWhitelist, setIpWhitelist] = useState("192.168.0.0/16, 10.0.0.0/8");
  const [auditRetention, setAuditRetention] = useState("365");
  const [bruteForce, setBruteForce] = useState(true);
  const [loginNotify, setLoginNotify] = useState(true);

  const inputCls = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all";

  return (
    <>
      <SectionCard title="Authentication">
        <SettingRow label="Two-Factor Authentication (2FA)" description="Require 2FA for all admin accounts. Currently enforced company-wide.">
          <Toggle value={twoFA} onChange={setTwoFA} />
        </SettingRow>
        <SettingRow label="Single Sign-On (SSO)" description="Enable SAML 2.0 / OIDC SSO integration for enterprise identity providers.">
          <Toggle value={sso} onChange={setSSO} />
        </SettingRow>
        <SettingRow label="Session Timeout" description="Automatically log out inactive sessions after this period.">
          <select className={inputCls} value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} style={{ fontSize: "0.875rem", width: "160px", appearance: "none" }}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
            <option value="0">Never</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Password & Access Policy">
        <SettingRow label="Password Policy" description="Minimum complexity requirements for all user passwords.">
          <select className={inputCls} value={passwordPolicy} onChange={e => setPasswordPolicy(e.target.value)} style={{ fontSize: "0.875rem", width: "160px", appearance: "none" }}>
            <option value="Basic">Basic (8+ chars)</option>
            <option value="Strong">Strong (12+, mixed)</option>
            <option value="Enterprise">Enterprise (16+, MFA)</option>
          </select>
        </SettingRow>
        <SettingRow label="Brute Force Protection" description="Lock accounts after 5 consecutive failed login attempts.">
          <Toggle value={bruteForce} onChange={setBruteForce} />
        </SettingRow>
        <SettingRow label="Login Notifications" description="Send email alerts on new logins from unrecognized devices.">
          <Toggle value={loginNotify} onChange={setLoginNotify} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Network & Compliance">
        <SettingRow label="IP Allowlist" description="Restrict admin access to these IP ranges (CIDR notation, comma-separated).">
          <textarea value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} rows={2}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all resize-none"
            style={{ fontSize: "0.78rem", width: "260px" }} />
        </SettingRow>
        <SettingRow label="Audit Log Retention" description="Number of days to retain audit log entries.">
          <select className={inputCls} value={auditRetention} onChange={e => setAuditRetention(e.target.value)} style={{ fontSize: "0.875rem", width: "160px", appearance: "none" }}>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
            <option value="730">2 years</option>
            <option value="2555">7 years (compliance)</option>
          </select>
        </SettingRow>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={() => showToast("Security settings saved", "success")} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> Save Security Settings
        </button>
      </div>
    </>
  );
}

function NotificationsSettings({ showToast }: Props) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [aiNudges, setAiNudges] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [threshold, setThreshold] = useState("70");
  const [slackWebhook, setSlackWebhook] = useState("");

  return (
    <>
      <SectionCard title="Alert Channels">
        <SettingRow label="Email Alerts" description="Send stress alerts and critical events to admin email addresses.">
          <Toggle value={emailAlerts} onChange={setEmailAlerts} />
        </SettingRow>
        <SettingRow label="Slack Notifications" description="Post alerts to a Slack channel via webhook.">
          <div className="flex flex-col items-end gap-2">
            <Toggle value={slackAlerts} onChange={setSlackAlerts} />
            {slackAlerts && (
              <input value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/…"
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all"
                style={{ fontSize: "0.78rem", width: "240px" }} />
            )}
          </div>
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser push notifications for real-time critical alerts.">
          <Toggle value={pushNotif} onChange={setPushNotif} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="AI & Wellness Interventions">
        <SettingRow label="AI Nudge System" description="Automatically send micro-break and wellness nudges to employees above the stress threshold.">
          <Toggle value={aiNudges} onChange={setAiNudges} />
        </SettingRow>
        <SettingRow label="Stress Alert Threshold" description="Trigger alerts when a team's average stress index exceeds this value.">
          <div className="flex items-center gap-3">
            <input type="range" min={40} max={90} value={parseInt(threshold)} onChange={e => setThreshold(e.target.value)} className="w-32 accent-blue-600" />
            <span className="w-12 text-center px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 700 }}>{threshold}</span>
          </div>
        </SettingRow>
        <SettingRow label="Critical Alerts Only" description="Only notify when stress reaches the 'Critical' threshold (>80). Silences moderate alerts.">
          <Toggle value={criticalOnly} onChange={setCriticalOnly} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Reporting">
        <SettingRow label="Weekly Digest" description="Receive a weekly summary of company wellness KPIs every Monday morning.">
          <Toggle value={weeklyDigest} onChange={setWeeklyDigest} />
        </SettingRow>
      </SectionCard>

      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40 mb-5">
        <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-blue-600 dark:text-blue-400" style={{ fontSize: "0.78rem", lineHeight: 1.6 }}>
          All AI-generated nudges are sent at the team level only. Individual employees never receive personalized stress-based messages without explicit departmental consent.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => showToast("Notification preferences saved", "success")} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Save size={15} /> Save Notification Settings
        </button>
      </div>
    </>
  );
}

export function SettingsView({ showToast }: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");

  const tabs: { key: SettingsTab; icon: React.ReactNode }[] = [
    { key: "General", icon: <Settings size={16} /> },
    { key: "Security", icon: <Shield size={16} /> },
    { key: "Notifications", icon: <Bell size={16} /> },
  ];

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
          <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Settings</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>System configuration and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-2 flex lg:flex-col gap-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-left w-full ${
                  activeTab === t.key
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200/50 dark:shadow-blue-900/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
                style={{ fontSize: "0.875rem", fontWeight: activeTab === t.key ? 600 : 400 }}>
                <span className={activeTab === t.key ? "text-white" : "text-slate-400 dark:text-slate-500"}>{t.icon}</span>
                {t.key}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "General" && <GeneralSettings showToast={showToast} />}
          {activeTab === "Security" && <SecuritySettings showToast={showToast} />}
          {activeTab === "Notifications" && <NotificationsSettings showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}
