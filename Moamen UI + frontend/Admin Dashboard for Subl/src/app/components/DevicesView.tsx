import { useState, useMemo } from "react";
import { Monitor, Search, X, WifiOff } from "lucide-react";
import { MOCK_DEVICES, type Device } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { ConfirmDanger } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";

const PAGE_SIZE = 8;

interface Props { showToast: (msg: string, type?: ToastType) => void; }

function signalColor(level: string) {
  const map: Record<string, string> = {
    low:      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    moderate: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    high:     "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
    critical: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  };
  return map[level] ?? "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800";
}

export function DevicesView({ showToast }: Props) {
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null);

  const filtered = useMemo(() => {
    let list = [...devices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.hostname.toLowerCase().includes(q) || d.userName.toLowerCase().includes(q) || d.department.toLowerCase().includes(q) || d.os.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") list = list.filter(d => d.status === statusFilter);
    return list;
  }, [devices, search, statusFilter]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  function revokeDevice(id: string) {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: "Revoked" as const } : d));
  }

  const counts = {
    All: devices.length,
    Active: devices.filter(d => d.status === "Active").length,
    Idle: devices.filter(d => d.status === "Idle").length,
    Revoked: devices.filter(d => d.status === "Revoked").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Devices</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>Desktop monitoring agents · {devices.length} enrolled workstations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Active Agents", value: counts.Active, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Idle", value: counts.Idle, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-800" },
          { label: "Revoked", value: counts.Revoked, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "Critical Signal", value: devices.filter(d => d.stressSignal === "critical").length, color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-5`}>
            <p className="text-slate-500 dark:text-slate-400 mb-1" style={{ fontSize: "0.75rem" }}>{k.label}</p>
            <p className={`${k.color}`} style={{ fontSize: "1.5rem", fontWeight: 700 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Search hostname, user, department, OS…" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
              style={{ fontSize: "0.875rem" }} />
          </div>
          <div className="flex items-center gap-2">
            {(["All", "Active", "Idle", "Revoked"] as const).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-xl transition-all ${statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700"}`}
                style={{ fontSize: "0.78rem", fontWeight: statusFilter === s ? 600 : 400 }}>
                {s} ({counts[s as keyof typeof counts]})
              </button>
            ))}
          </div>
          {(search || statusFilter !== "All") && (
            <button onClick={() => { setSearch(""); setStatusFilter("All"); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" style={{ fontSize: "0.78rem" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Hostname", "Assigned User", "OS / Agent", "IP Address", "Stress Signal", "Status", "Last Seen", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>No devices match your filters.</td></tr>
              ) : paginated.map(dev => (
                <tr key={dev.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dev.status === "Revoked" ? "bg-slate-100 dark:bg-slate-800" : "bg-blue-50 dark:bg-blue-900/30"}`}>
                        {dev.status === "Revoked" ? <WifiOff size={15} className="text-slate-400 dark:text-slate-500" /> : <Monitor size={15} className="text-blue-500 dark:text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 font-mono" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{dev.hostname}</p>
                        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>{dev.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{dev.userName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.78rem" }}>{dev.os}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>Agent v{dev.agentVersion}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{dev.ip}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full capitalize ${signalColor(dev.stressSignal)}`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      {dev.stressSignal}
                    </span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={dev.status} /></td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{dev.lastSeen}</td>
                  <td className="px-5 py-4">
                    {dev.status !== "Revoked" ? (
                      <button onClick={() => setRevokeTarget(dev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        <X size={12} /> Revoke
                      </button>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600" style={{ fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} pageSize={PAGE_SIZE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      <ConfirmDanger
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Device Access"
        description={`Revoke agent access for "${revokeTarget?.hostname}" (${revokeTarget?.userName})? The monitoring agent will be disabled and data collection will stop immediately.`}
        confirmLabel="Revoke Device"
        onConfirm={() => {
          if (revokeTarget) {
            revokeDevice(revokeTarget.id);
            showToast(`Device "${revokeTarget.hostname}" revoked successfully`, "warning");
          }
          setRevokeTarget(null);
        }}
      />
    </div>
  );
}
