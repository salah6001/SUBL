import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { fetchAlerts, acknowledgeAlert, resolveAlert, type AdminAlert } from "../lib/admin/alertsApi";
import { ApiError } from "../lib/apiClient";

type SeverityBucket = "critical" | "warning";

const severityConfig: Record<SeverityBucket, { badge: string; dot: string; label: string; icon: React.ReactNode }> = {
  critical: { badge: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40", dot: "bg-red-500", label: "Critical", icon: <AlertTriangle size={13} /> },
  warning:  { badge: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40", dot: "bg-orange-400", label: "Warning", icon: <AlertTriangle size={13} /> },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  Open:         { label: "Open",         color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  Acknowledged: { label: "Acknowledged", color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/30" },
  Resolved:     { label: "Resolved",     color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
};

function severityBucket(severity: string): SeverityBucket {
  return severity === "High" || severity === "Critical" ? "critical" : "warning";
}

function humanize(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function Shell({ count, children }: { count: { critical: number; warning: number }; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Critical Interventions &amp; Alerts</h3>
          <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>
            Early warning system — aggregated team-level signals only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {count.critical} Critical
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            {count.warning} Warnings
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function AlertsTable() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAlerts({ limit: 10 })
      .then(data => { if (!cancelled) setAlerts(data); })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load alerts."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function advance(alert: AdminAlert) {
    setBusyId(alert.id);
    try {
      if (alert.status === "Open") {
        await acknowledgeAlert(alert.id);
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: "Acknowledged" } : a));
      } else if (alert.status === "Acknowledged") {
        await resolveAlert(alert.id);
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: "Resolved" } : a));
      }
    } catch {
      // Keep the row as-is on failure; a toast layer can surface this later.
    } finally {
      setBusyId(null);
    }
  }

  const count = {
    critical: alerts.filter(a => severityBucket(a.severity) === "critical").length,
    warning: alerts.filter(a => severityBucket(a.severity) === "warning").length,
  };

  if (loading) {
    return <Shell count={{ critical: 0, warning: 0 }}><div className="py-12 flex justify-center"><span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div></Shell>;
  }
  if (error) {
    return <Shell count={{ critical: 0, warning: 0 }}><p className="py-10 text-center text-red-500" style={{ fontSize: "0.82rem" }}>{error}</p></Shell>;
  }
  if (alerts.length === 0) {
    return (
      <Shell count={count}>
        <div className="py-12 flex flex-col items-center gap-2">
          <CheckCircle size={28} className="text-green-500" />
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.85rem" }}>No active alerts. Everything looks calm.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell count={count}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Department", "Detected Issue", "When", "Severity", "Status", "Action"].map(col => (
                <th key={col} className="text-left px-6 py-3 text-slate-500 dark:text-slate-500 uppercase tracking-wide" style={{ fontSize: "0.68rem", fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {alerts.map(alert => {
              const sc = severityConfig[severityBucket(alert.severity)];
              const st = statusConfig[alert.status] ?? statusConfig.Open;
              const isBusy = busyId === alert.id;
              return (
                <tr key={alert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{humanize(alert.department)}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{humanize(alert.category)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <div>
                        <p className="text-slate-700 dark:text-slate-300" style={{ fontSize: "0.83rem" }}>{alert.title}</p>
                        {alert.message && <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{alert.message}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.8rem" }}>
                      <Clock size={13} className="text-slate-400 dark:text-slate-500" />
                      {relativeTime(alert.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${sc.badge}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {sc.icon}
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${st.bg} ${st.color}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {alert.status === "Resolved" && <CheckCircle size={11} />}
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {alert.status === "Resolved" ? (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                        <CheckCircle size={14} /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => advance(alert)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/40 transition-all duration-150 disabled:opacity-60"
                        style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        <Zap size={13} />
                        {alert.status === "Open" ? "Acknowledge" : "Resolve"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>
          Showing {alerts.length} alerts · Aggregated to protect individual privacy
        </p>
      </div>
    </Shell>
  );
}
