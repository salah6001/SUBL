import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Zap, ChevronRight } from "lucide-react";

interface Alert {
  id: number;
  team: string;
  department: string;
  issue: string;
  duration: string;
  recommendation: string;
  severity: "critical" | "warning";
  status: "pending" | "deployed" | "reviewing";
  action: string;
  actionVariant: "primary" | "outline";
}

const alerts: Alert[] = [
  { id: 1, team: "Customer Support Team", department: "Support", issue: "High stress spike detected", duration: "Last 3 hours", recommendation: "Send micro-break notification", severity: "critical", status: "pending", action: "Deploy Intervention", actionVariant: "primary" },
  { id: 2, team: "Dev Team Alpha", department: "Engineering", issue: "Extended typing cadence irregularity", duration: "Last 2 days", recommendation: "Review workload with team lead", severity: "warning", status: "reviewing", action: "Notify Team Lead", actionVariant: "outline" },
  { id: 3, team: "Sales West Region", department: "Sales", issue: "Elevated communication stress signals", duration: "Last 6 hours", recommendation: "Schedule team wellness check-in", severity: "warning", status: "pending", action: "Schedule Check-in", actionVariant: "outline" },
];

const severityConfig = {
  critical: { badge: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40", dot: "bg-red-500", label: "Critical", icon: <AlertTriangle size={13} /> },
  warning:  { badge: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40", dot: "bg-orange-400", label: "Warning", icon: <AlertTriangle size={13} /> },
};

const statusConfig = {
  pending:   { label: "Pending",   color: "text-slate-500 dark:text-slate-400",  bg: "bg-slate-100 dark:bg-slate-800" },
  deployed:  { label: "Deployed",  color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/30" },
  reviewing: { label: "In Review", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/30" },
};

export function AlertsTable() {
  const [alertStates, setAlertStates] = useState<Record<number, string>>(
    Object.fromEntries(alerts.map(a => [a.id, a.status]))
  );
  const [deployed, setDeployed] = useState<Set<number>>(new Set());

  function handleAction(alert: Alert) {
    setDeployed(prev => new Set(prev).add(alert.id));
    setAlertStates(prev => ({ ...prev, [alert.id]: "deployed" }));
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
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
            {alerts.filter(a => a.severity === "critical").length} Critical
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            {alerts.filter(a => a.severity === "warning").length} Warnings
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Team / Department", "Detected Issue", "Duration", "Recommended Action", "Severity", "Status", "Action"].map(col => (
                <th key={col} className="text-left px-6 py-3 text-slate-500 dark:text-slate-500 uppercase tracking-wide" style={{ fontSize: "0.68rem", fontWeight: 600 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {alerts.map(alert => {
              const isDeployed = deployed.has(alert.id);
              const currentStatus = alertStates[alert.id] as keyof typeof statusConfig;
              const sc = severityConfig[alert.severity];
              const st = statusConfig[currentStatus] || statusConfig.pending;
              return (
                <tr key={alert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{alert.team}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{alert.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.83rem" }}>{alert.issue}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.8rem" }}>
                      <Clock size={13} className="text-slate-400 dark:text-slate-500" />
                      {alert.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.8rem" }}>{alert.recommendation}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${sc.badge}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {sc.icon}
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${st.bg} ${st.color}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {currentStatus === "deployed" && <CheckCircle size={11} />}
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isDeployed ? (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                        <CheckCircle size={14} /> Done
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAction(alert)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-150 ${
                          alert.actionVariant === "primary"
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/40"
                            : "border border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        }`}
                        style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        <Zap size={13} />
                        {alert.action}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {alerts.map(alert => {
          const isDeployed = deployed.has(alert.id);
          const sc = severityConfig[alert.severity];
          return (
            <div key={alert.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.9rem", fontWeight: 600 }}>{alert.team}</p>
                  <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{alert.department}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border flex-shrink-0 ${sc.badge}`} style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  {sc.icon} {sc.label}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-1" style={{ fontSize: "0.82rem" }}>{alert.issue}</p>
              <p className="text-slate-400 dark:text-slate-500 mb-3" style={{ fontSize: "0.75rem" }}>{alert.duration} · {alert.recommendation}</p>
              {!isDeployed ? (
                <button
                  onClick={() => handleAction(alert)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    alert.actionVariant === "primary"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                  style={{ fontSize: "0.82rem", fontWeight: 600 }}
                >
                  <Zap size={14} /> {alert.action}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  <CheckCircle size={15} /> Intervention Deployed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>
          Showing {alerts.length} active alerts · All data is team-aggregated to protect individual privacy
        </p>
        <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" style={{ fontSize: "0.78rem", fontWeight: 500 }}>
          View full log <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
