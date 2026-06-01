import { useState, useMemo } from "react";
import { ScrollText, Search, X, ChevronRight, ArrowRight } from "lucide-react";
import { MOCK_AUDIT_LOGS, type AuditLog, type AuditSeverity } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { Modal } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";

const PAGE_SIZE = 10;

interface Props { showToast: (msg: string, type?: ToastType) => void; }

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  info:     "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  warning:  "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  critical: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "User Login", USER_CREATED: "User Created", USER_DELETED: "User Deleted",
  USER_STATUS_CHANGED: "Status Changed", USER_SUSPENDED: "User Suspended",
  ROLE_ASSIGNED: "Role Assigned", ROLE_CREATED: "Role Created",
  DEVICE_REVOKED: "Device Revoked", DEVICE_ENROLLED: "Device Enrolled",
  PASSWORD_RESET: "Password Reset", SETTINGS_UPDATED: "Settings Updated",
  ACCOUNT_PLAN_CHANGED: "Plan Changed", ACCOUNT_SUSPENDED: "Account Suspended",
  STRESS_ALERT_TRIGGERED: "Stress Alert", INTERVENTION_DEPLOYED: "Intervention Deployed",
  BULK_STRESS_REPORT: "Bulk Report", SESSION_EXPIRED: "Session Expired",
  EXPORT_DATA: "Data Exported", REPORT_VIEWED: "Report Viewed", "2FA_ENFORCED": "2FA Enforced",
};

function DiffModal({ log, isOpen, onClose }: { log: AuditLog; isOpen: boolean; onClose: () => void }) {
  function renderValue(val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  }

  function renderSide(data: Record<string, unknown> | null, side: "before" | "after") {
    if (!data) {
      return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-center" style={{ fontSize: "0.82rem" }}>
          {side === "before" ? "No prior state (new resource)" : "Resource deleted"}
        </div>
      );
    }
    const bgClass = side === "before" ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40" : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40";
    const textClass = side === "before" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400";
    const labelClass = side === "before" ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";

    return (
      <div className={`p-4 rounded-xl border ${bgClass}`}>
        <p className={`mb-3 uppercase tracking-wide ${labelClass}`} style={{ fontSize: "0.65rem", fontWeight: 700 }}>
          {side === "before" ? "▼ Before" : "▲ After"}
        </p>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-slate-500 dark:text-slate-400 flex-shrink-0" style={{ fontSize: "0.72rem", fontWeight: 600, minWidth: "120px" }}>{k}:</span>
              <span className={`${textClass} font-mono break-all`} style={{ fontSize: "0.78rem" }}>{renderValue(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Event Detail" subtitle={`${ACTION_LABELS[log.action] ?? log.action} · ${log.timestamp}`} size="lg"
      icon={<ScrollText size={17} className="text-blue-600" />}
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Actor", value: `${log.actor} (${log.actorRole})` },
          { label: "Action", value: ACTION_LABELS[log.action] ?? log.action },
          { label: "Resource", value: `${log.resource} · ${log.resourceId}` },
          { label: "IP Address", value: log.ip },
          { label: "Timestamp", value: log.timestamp },
          { label: "Severity", value: log.severity },
        ].map(m => (
          <div key={m.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-slate-500 dark:text-slate-400 mb-0.5" style={{ fontSize: "0.68rem", fontWeight: 600 }}>{m.label}</p>
            <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-slate-700 dark:text-slate-200 mb-3" style={{ fontSize: "0.85rem", fontWeight: 700 }}>State Change Diff</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {renderSide(log.before, "before")}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight size={20} className="text-slate-300 dark:text-slate-600" />
          </div>
          {renderSide(log.after, "after")}
        </div>
      </div>
    </Modal>
  );
}

export function AuditLogsView({ showToast }: Props) {
  const [logs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | AuditSeverity>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    let list = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q));
    }
    if (severityFilter !== "all") list = list.filter(l => l.severity === severityFilter);
    return list;
  }, [logs, search, severityFilter]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Audit Logs</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>Tamper-evident system event trail · {logs.length} events recorded</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "info", "warning", "critical"] as const).map(s => (
            <button key={s} onClick={() => { setSeverityFilter(s); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl transition-all capitalize ${severityFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700"}`}
              style={{ fontSize: "0.78rem", fontWeight: severityFilter === s ? 600 : 400 }}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Info Events", count: logs.filter(l => l.severity === "info").length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Warnings", count: logs.filter(l => l.severity === "warning").length, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Critical", count: logs.filter(l => l.severity === "critical").length, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4`}>
            <p className="text-slate-600 dark:text-slate-300 mb-1" style={{ fontSize: "0.75rem" }}>{k.label}</p>
            <p className={`${k.color}`} style={{ fontSize: "1.5rem", fontWeight: 700 }}>{k.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Search by actor, action, or resource…" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
              style={{ fontSize: "0.875rem" }} />
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="flex items-center gap-1.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" style={{ fontSize: "0.82rem" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Timestamp", "Actor", "Action", "Resource", "IP Address", "Severity", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>No log entries match your filters.</td></tr>
              ) : paginated.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => setSelectedLog(log)}>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap" style={{ fontSize: "0.78rem" }}>{log.timestamp}</td>
                  <td className="px-5 py-4">
                    <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{log.actor}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.72rem" }}>{log.actorRole}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>
                    {log.resource} <span className="text-slate-400 dark:text-slate-500">#{log.resourceId}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono" style={{ fontSize: "0.75rem" }}>{log.ip}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border capitalize ${SEVERITY_STYLES[log.severity]}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: "0.75rem" }}>
                      Diff <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} pageSize={PAGE_SIZE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {selectedLog && (
        <DiffModal log={selectedLog} isOpen={true} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
