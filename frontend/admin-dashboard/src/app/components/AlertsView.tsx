import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle, AlertCircle, CheckCircle2, Clock, Filter, Search,
  ChevronDown, Building2, User, Shield, Zap, Activity,
} from "lucide-react";
import { type Alert, type AlertSeverity, type AlertStatus, type AlertCategory } from "../data/mockData";
import { fetchAlerts, acknowledgeAlert, resolveAlert, type AdminAlert } from "../lib/admin/alertsApi";
import { ApiError } from "../lib/apiClient";

// ── Backend → UI mapping ──────────────────────────────────────────────────────
const SEVERITY_MAP: Record<string, AlertSeverity> = {
  Critical: "critical", High: "high", Medium: "medium", Low: "low",
};
const STATUS_MAP: Record<string, AlertStatus> = {
  Open: "Active", Acknowledged: "Acknowledged", Resolved: "Resolved",
};
const CATEGORY_MAP: Record<string, AlertCategory> = {
  HighStress: "Stress", CriticalStress: "Stress", SustainedStress: "Burnout", Anomaly: "Anomaly",
};

function humanizeDept(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function toUiAlert(a: AdminAlert): Alert & { backendStatus: string } {
  return {
    id: a.id,
    title: a.title,
    message: a.message ?? "",
    severity: SEVERITY_MAP[a.severity] ?? "low",
    status: STATUS_MAP[a.status] ?? "Active",
    category: CATEGORY_MAP[a.category] ?? "Stress",
    department: humanizeDept(a.department),
    userName: undefined,
    timestamp: a.createdAt,
    resolvedAt: a.resolvedAt ?? undefined,
    backendStatus: a.status,
  };
}

const SEV_CONFIG: Record<AlertSeverity, { label: string; dot: string; badge: string; text: string }> = {
  critical: { label: "Critical", dot: "bg-red-500", badge: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-400" },
  high:     { label: "High",     dot: "bg-orange-500", badge: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-400" },
  medium:   { label: "Medium",   dot: "bg-yellow-500", badge: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-400" },
  low:      { label: "Low",      dot: "bg-blue-400", badge: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
};

const STATUS_CONFIG: Record<AlertStatus, { icon: React.ReactNode; badge: string; text: string }> = {
  Active:       { icon: <AlertCircle size={13} />, badge: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-400" },
  Acknowledged: { icon: <Clock size={13} />,        badge: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  Resolved:     { icon: <CheckCircle2 size={13} />, badge: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-400" },
};

const CAT_ICON: Record<AlertCategory, React.ReactNode> = {
  Stress:   <Activity size={13} className="text-rose-500" />,
  Burnout:  <AlertTriangle size={13} className="text-orange-500" />,
  Anomaly:  <Zap size={13} className="text-purple-500" />,
  System:   <Shield size={13} className="text-blue-500" />,
  Security: <AlertCircle size={13} className="text-red-500" />,
};

const PAGE_SIZE = 10;
const ALL_SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low"];
const ALL_STATUSES: AlertStatus[] = ["Active", "Acknowledged", "Resolved"];
const ALL_CATEGORIES: AlertCategory[] = ["Stress", "Burnout", "Anomaly", "System", "Security"];

function formatTs(ts: string): string {
  return ts.replace("T", " ").substring(0, 16);
}

function AlertDetailModal({
  alert,
  onClose,
  onAcknowledge,
  onResolve,
}: {
  alert: Alert;
  onClose: () => void;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  const sev = SEV_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];
  const [busy, setBusy] = useState(false);

  async function run(action: (id: string) => Promise<void>) {
    setBusy(true);
    try {
      await action(alert.id);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sev.badge}`}>
              <span className={sev.text}>{CAT_ICON[alert.category]}</span>
            </div>
            <div>
              <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{alert.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${sev.badge} ${sev.text}`} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                  {sev.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${status.badge} ${status.text}`} style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  {status.icon}
                  {alert.status}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.7rem" }}>{alert.category}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
            <ChevronDown size={16} style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.875rem" }}>{alert.message}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" }}>Department</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={13} className="text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{alert.department}</span>
              </div>
            </div>
            {alert.userName && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" }}>Employee</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <User size={13} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{alert.userName}</span>
                </div>
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" }}>Triggered</p>
              <p className="text-slate-700 dark:text-slate-200 mt-1" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{formatTs(alert.timestamp)}</p>
            </div>
            {alert.resolvedAt && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <p className="text-green-600 dark:text-green-500" style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase" }}>Resolved At</p>
                <p className="text-green-700 dark:text-green-400 mt-1" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{formatTs(alert.resolvedAt)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          {alert.status === "Active" && (
            <button
              onClick={() => run(onAcknowledge)}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Acknowledge
            </button>
          )}
          {alert.status !== "Resolved" && (
            <button
              onClick={() => run(onResolve)}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Resolve
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | "All">("All");
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAlerts({ limit: 200 })
      .then(data => { if (!cancelled) setAlerts(data.map(toUiAlert)); })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load alerts."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Updates one alert's status locally after an acknowledge/resolve.
  function applyStatus(id: string, status: AlertStatus) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setSelectedAlert(prev => prev && prev.id === id ? { ...prev, status } : prev);
  }

  async function onAcknowledge(id: string) {
    await acknowledgeAlert(id);
    applyStatus(id, "Acknowledged");
  }

  async function onResolve(id: string) {
    await resolveAlert(id);
    applyStatus(id, "Resolved");
  }

  const filtered = useMemo(() => {
    let list = alerts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q) ||
        (a.userName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (severityFilter !== "All") list = list.filter(a => a.severity === severityFilter);
    if (statusFilter !== "All") list = list.filter(a => a.status === statusFilter);
    if (categoryFilter !== "All") list = list.filter(a => a.category === categoryFilter);
    list = [...list].sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
      return b.timestamp.localeCompare(a.timestamp);
    });
    return list;
  }, [alerts, search, severityFilter, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch(""); setSeverityFilter("All"); setStatusFilter("All"); setCategoryFilter("All"); setPage(1);
  }

  const stats = useMemo(() => ({
    active:    alerts.filter(a => a.status === "Active").length,
    critical:  alerts.filter(a => a.severity === "critical").length,
    acked:     alerts.filter(a => a.status === "Acknowledged").length,
    resolved:  alerts.filter(a => a.status === "Resolved").length,
  }), [alerts]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <span className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
        <p className="text-red-500" style={{ fontSize: "0.9rem" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page heading */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-1 h-5 rounded-full bg-red-500 inline-block flex-shrink-0" />
          <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Alerts &amp; Warnings</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>
          All system alerts and early warnings · {alerts.length} total across all departments
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Alerts",    value: stats.active,   color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20",    icon: <AlertCircle size={18} className="text-red-500" /> },
          { label: "Critical Severity",value: stats.critical, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", icon: <AlertTriangle size={18} className="text-orange-500" /> },
          { label: "Acknowledged",     value: stats.acked,    color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20",   icon: <Clock size={18} className="text-amber-500" /> },
          { label: "Resolved",         value: stats.resolved, color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20",   icon: <CheckCircle2 size={18} className="text-green-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
            </div>
            <p className={`${s.color}`} style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1" style={{ fontSize: "0.75rem", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search alerts..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 transition-all"
              style={{ fontSize: "0.82rem" }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />

            <FilterSelect
              value={statusFilter}
              options={["All", ...ALL_STATUSES]}
              onChange={v => { setStatusFilter(v as AlertStatus | "All"); setPage(1); }}
              label="Status"
            />
            <FilterSelect
              value={severityFilter}
              options={["All", ...ALL_SEVERITIES]}
              onChange={v => { setSeverityFilter(v as AlertSeverity | "All"); setPage(1); }}
              label="Severity"
            />
            <FilterSelect
              value={categoryFilter}
              options={["All", ...ALL_CATEGORIES]}
              onChange={v => { setCategoryFilter(v as AlertCategory | "All"); setPage(1); }}
              label="Category"
            />

            {(search || severityFilter !== "All" || statusFilter !== "All" || categoryFilter !== "All") && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ fontSize: "0.75rem", fontWeight: 600 }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-400 dark:text-slate-500 mt-2.5" style={{ fontSize: "0.72rem" }}>
          Showing {filtered.length} of {alerts.length} alerts
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-5 py-3" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Alert</th>
                <th className="text-left px-3 py-3 hidden md:table-cell" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Category</th>
                <th className="text-left px-3 py-3 hidden sm:table-cell" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Department</th>
                <th className="text-left px-3 py-3" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Severity</th>
                <th className="text-left px-3 py-3" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>Triggered</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <AlertTriangle size={22} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.85rem" }}>No alerts match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((alert, idx) => {
                const sev = SEV_CONFIG[alert.severity];
                const status = STATUS_CONFIG[alert.status];
                return (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-800/20"} ${idx < paginated.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${sev.badge}`}>
                          {CAT_ICON[alert.category]}
                        </div>
                        <div>
                          <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{alert.title}</p>
                          <p className="text-slate-400 dark:text-slate-500 hidden md:block mt-0.5 line-clamp-1" style={{ fontSize: "0.73rem" }}>{alert.message}</p>
                          {alert.userName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <User size={10} className="text-slate-400 dark:text-slate-500" />
                              <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.72rem" }}>{alert.userName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300" style={{ fontSize: "0.78rem" }}>
                        {CAT_ICON[alert.category]}
                        {alert.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.78rem" }}>{alert.department}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${sev.badge} ${sev.text}`} style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${status.badge} ${status.text}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                        {status.icon}
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{formatTs(alert.timestamp)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: "0.78rem" }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-500" style={{ fontSize: "0.78rem" }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg transition-colors ${page === p ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                      style={{ fontSize: "0.78rem", fontWeight: page === p ? 700 : 400 }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: "0.78rem" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={onAcknowledge}
          onResolve={onResolve}
        />
      )}
    </div>
  );
}

function FilterSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all cursor-pointer"
        style={{ fontSize: "0.78rem", fontWeight: 500 }}
        aria-label={label}
      >
        {options.map(o => (
          <option key={o} value={o}>{o === "All" ? `All ${label}` : o}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
    </div>
  );
}
