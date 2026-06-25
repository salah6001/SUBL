import { useState, useMemo, useEffect } from "react";
import { Monitor, Search, X, WifiOff, UserCog, CheckCircle2, RotateCcw } from "lucide-react";
import { type Device, type User } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { ConfirmDanger, Modal, Input } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";
import { fetchDevices, revokeDevice as revokeDeviceApi, assignDeviceOwner } from "../lib/admin/devicesApi";
import { fetchUsers } from "../lib/users/usersApi";
import { ApiError } from "../lib/apiClient";

const PAGE_SIZE = 8;

interface Props { showToast: (msg: string, type?: ToastType) => void; }

export function DevicesView({ showToast }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null);
  const [assignTarget, setAssignTarget] = useState<Device | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDevices()
      .then(data => { if (!cancelled) setDevices(data); })
      .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load devices."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchUsers()
      .then(data => { if (!cancelled) setUsers(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const userMatches = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = q
      ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      : users;
    return list.slice(0, 50);
  }, [users, userSearch]);

  async function assignOwner(device: Device, userId: string | null) {
    setAssigning(true);
    try {
      await assignDeviceOwner(device.id, userId);
      await reload();
      showToast(userId ? "Device data re-assigned" : "Claim released — data returns to registrant");
      setAssignTarget(null);
      setUserSearch("");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't reassign device", "error");
    } finally {
      setAssigning(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...devices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.hostname.toLowerCase().includes(q) || d.userName.toLowerCase().includes(q) || d.os.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") list = list.filter(d => d.status === statusFilter);
    return list;
  }, [devices, search, statusFilter]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  async function reload() {
    try {
      setDevices(await fetchDevices());
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "Couldn't load devices.");
    }
  }

  async function revokeDevice(id: string) {
    try {
      await revokeDeviceApi(id);
      await reload();
      showToast("Device revoked", "warning");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't revoke device", "error");
    }
  }

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

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Active Agents", value: counts.Active, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Idle", value: counts.Idle, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-50 dark:bg-slate-800" },
          { label: "Revoked", value: counts.Revoked, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
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
            <input type="text" placeholder="Search hostname, user, OS…" value={search}
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
              {["Hostname", "Data Owner", "OS / Agent", "Status", "Last Seen", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>No devices match your filters.</td></tr>
              ) : paginated.map(dev => (
                <tr key={dev.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dev.status === "Revoked" ? "bg-slate-100 dark:bg-slate-800" : "bg-blue-50 dark:bg-blue-900/30"}`}>
                        {dev.status === "Revoked" ? <WifiOff size={15} className="text-slate-400 dark:text-slate-500" /> : <Monitor size={15} className="text-blue-500 dark:text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 font-mono" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{dev.hostname}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {dev.isClaimed && <CheckCircle2 size={13} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />}
                      <p className="text-slate-700 dark:text-slate-200 truncate max-w-[180px]" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{dev.dataOwner ?? dev.userName}</p>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>{dev.isClaimed ? "claimed" : "registrant (default)"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.78rem" }}>{dev.os}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>Agent v{dev.agentVersion}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={dev.status} /></td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{dev.lastSeen}</td>
                  <td className="px-5 py-4">
                    {dev.status !== "Revoked" ? (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setAssignTarget(dev); setUserSearch(""); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          <UserCog size={12} /> Reassign
                        </button>
                        <button onClick={() => setRevokeTarget(dev)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          <X size={12} /> Revoke
                        </button>
                      </div>
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
            void revokeDevice(revokeTarget.id);
          }
          setRevokeTarget(null);
        }}
      />

      <Modal
        isOpen={!!assignTarget}
        onClose={() => { setAssignTarget(null); setUserSearch(""); }}
        title="Reassign Device Data"
        subtitle={assignTarget ? `${assignTarget.hostname} · currently feeding ${assignTarget.dataOwner ?? assignTarget.userName}` : undefined}
        icon={<UserCog size={18} className="text-blue-500" />}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.8rem" }}>
            Choose which user this machine's keystroke data should be attributed to. The change takes
            effect on the agent's next reporting window.
          </p>

          {assignTarget?.isClaimed && (
            <button
              disabled={assigning}
              onClick={() => assignTarget && void assignOwner(assignTarget, null)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
              style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              <RotateCcw size={14} /> Release claim (return to registrant)
            </button>
          )}

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search users by name or email…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl">
            {userMatches.length === 0 ? (
              <p className="px-4 py-6 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No users match.</p>
            ) : userMatches.map(u => {
              const isCurrent = assignTarget?.claimedByUserId === u.id;
              return (
                <button
                  key={u.id}
                  disabled={assigning || isCurrent}
                  onClick={() => assignTarget && void assignOwner(assignTarget, u.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50/60 dark:hover:bg-blue-900/15 disabled:cursor-default transition-colors">
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 truncate" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{u.name}</p>
                    <p className="text-slate-400 dark:text-slate-500 truncate" style={{ fontSize: "0.72rem" }}>{u.email}</p>
                  </div>
                  {isCurrent
                    ? <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 flex-shrink-0" style={{ fontSize: "0.72rem", fontWeight: 600 }}><CheckCircle2 size={13} /> Current</span>
                    : <span className="text-blue-600 dark:text-blue-400 flex-shrink-0" style={{ fontSize: "0.72rem", fontWeight: 600 }}>Assign →</span>}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
