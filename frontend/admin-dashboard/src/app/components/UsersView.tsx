import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, MoreVertical, Eye, Edit3, UserX, Trash2, ArrowLeft,
  Mail, Phone, MapPin, Clock, Monitor, Shield, AlertTriangle,
  RefreshCw, LogOut, Check, X,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine,
} from "recharts";
import { type User, type UserStatus, type UserDevice } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { Modal, ConfirmDanger, Field, Input, Select, Textarea } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";
import {
  fetchUsers,
  createUserWithProfile,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
  suspendUser,
  activateUser,
  deactivateUser,
  splitName,
  DEPARTMENT_LABELS,
  departmentToInt,
  getUserProfile,
  updateUserProfile,
  fetchActiveSessionCount,
  revokeAllSessions,
  fetchUserDevices,
  deleteDevice,
  revokeDeviceApi,
  type AdminDeviceDto,
} from "../lib/users/usersApi";
import { ApiError, api } from "../lib/apiClient";

const PAGE_SIZE = 8;
const DEPARTMENTS = DEPARTMENT_LABELS;
const COLORS = ["from-blue-500 to-blue-700", "from-purple-500 to-purple-700", "from-emerald-500 to-teal-600", "from-red-500 to-rose-600", "from-amber-500 to-orange-600", "from-cyan-500 to-blue-600", "from-pink-500 to-rose-500", "from-indigo-500 to-violet-600", "from-green-500 to-emerald-600", "from-teal-500 to-cyan-600"];

interface Props {
  showToast: (message: string, type?: ToastType) => void;
}

function StressTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const level = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 30 ? "Moderate" : "Low";
  const color = score >= 80 ? "#dc2626" : score >= 60 ? "#f97316" : score >= 30 ? "#f59e0b" : "#22c55e";
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-slate-600 dark:text-slate-300 mb-1" style={{ fontSize: "0.75rem" }}>{label}</p>
      <p style={{ fontSize: "0.9rem", fontWeight: 700, color }}>{score} — {level}</p>
    </div>
  );
}

interface RowMenuProps {
  user: User;
  onView: () => void;
  onEdit: () => void;
  onSuspend: () => void;
  onDelete: () => void;
}

function RowMenu({ user, onView, onEdit, onSuspend, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden py-1"
          style={{ animation: "modalIn 0.15s ease-out" }}>
          <MenuItem icon={<Eye size={14} />} label="View Profile" onClick={() => { onView(); setOpen(false); }} />
          <MenuItem icon={<Edit3 size={14} />} label="Edit User" onClick={() => { onEdit(); setOpen(false); }} />
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <MenuItem
            icon={user.status === "Suspended" ? <RefreshCw size={14} /> : <UserX size={14} />}
            label={user.status === "Suspended" ? "Unsuspend User" : "Suspend User"}
            onClick={() => { onSuspend(); setOpen(false); }}
            color="text-amber-600 dark:text-amber-400"
          />
          <MenuItem icon={<Trash2 size={14} />} label="Delete User" onClick={() => { onDelete(); setOpen(false); }} color="text-red-500 dark:text-red-400" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, color = "text-slate-600 dark:text-slate-300" }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${color}`} style={{ fontSize: "0.82rem" }}>
      {icon} {label}
    </button>
  );
}

interface EditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: User) => void;
}

function EditUserModal({ user, isOpen, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({ name: user.name, email: user.email, primaryRole: user.primaryRole, department: user.department, phone: user.phone, location: user.location, status: user.status as string });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({ name: user.name, email: user.email, primaryRole: user.primaryRole, department: user.department, phone: user.phone, location: user.location, status: user.status });
  }, [user]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.primaryRole.trim()) e.primaryRole = "Role is required";
    if (!form.department) e.department = "Department is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ ...user, ...form, status: form.status as UserStatus });
  }

  const f = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Profile" subtitle={`Editing ${user.name}`} size="lg"
      icon={<Edit3 size={17} className="text-blue-600" />}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Save Changes</button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Field label="Full Name" required error={errors.name}><Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Full name" /></Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Work Email" required error={errors.email}><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="email@company.io" /></Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Job Role" required error={errors.primaryRole}><Input value={form.primaryRole} onChange={e => f("primaryRole", e.target.value)} placeholder="e.g. Senior Engineer" /></Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Department" required error={errors.department}>
            <Select value={form.department} onChange={e => f("department", e.target.value)}>
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Phone"><Input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+1 (555) 000-0000" /></Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Location"><Input value={form.location} onChange={e => f("location", e.target.value)} placeholder="City, State" /></Field>
        </div>
        <div className="col-span-2">
          <Field label="Account Status">
            <div className="flex items-center gap-3">
              {(["Active", "Suspended"] as UserStatus[]).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => f("status", s)} className="accent-blue-600" />
                  <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.875rem" }}>{s}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

interface SuspendModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

function SuspendUserModal({ user, isOpen, onClose, onConfirm }: SuspendModalProps) {
  const [reason, setReason] = useState("");
  const isSuspended = user.status === "Suspended";

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={isSuspended ? "Unsuspend User Account" : "Suspend User Account"}
      subtitle={`This action affects ${user.name}'s system access`}
      icon={<UserX size={17} className="text-amber-500" />}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onConfirm(reason); setReason(""); }}
            className={`px-5 py-2.5 rounded-xl text-white transition-colors shadow-sm ${isSuspended ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"}`}
            style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            {isSuspended ? "Unsuspend Account" : "Suspend Account"}
          </button>
        </>
      }
    >
      {!isSuspended ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-700 dark:text-amber-300" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
              Suspending <strong>{user.name}</strong> will immediately revoke all active sessions and block login.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/40">
          <p className="text-green-700 dark:text-green-300" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
            This will restore <strong>{user.name}</strong>'s access. They will be able to log in immediately.
          </p>
        </div>
      )}
    </Modal>
  );
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string; primaryRole: string; department: string; phone: string }) => void | Promise<void>;
}

function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", primaryRole: "", department: "", phone: "", location: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password.trim()) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    void onSave({ name: form.name, email: form.email, password: form.password, primaryRole: form.primaryRole, department: form.department, phone: form.phone });
    setForm({ name: "", email: "", password: "", primaryRole: "", department: "", phone: "", location: "" });
    setErrors({});
  }

  const f = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User" size="lg"
      icon={<Plus size={17} className="text-blue-600" />}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Create User</button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1"><Field label="Full Name" required error={errors.name}><Input value={form.name} onChange={e => f("name", e.target.value)} placeholder="Full name" /></Field></div>
        <div className="col-span-2 sm:col-span-1"><Field label="Work Email" required error={errors.email}><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="email@company.io" /></Field></div>
        <div className="col-span-2 sm:col-span-1"><Field label="Temporary Password" required error={errors.password}><Input type="password" value={form.password} onChange={e => f("password", e.target.value)} placeholder="Min 8 characters" /></Field></div>
        <div className="col-span-2 sm:col-span-1"><Field label="Job Role" error={errors.primaryRole}><Input value={form.primaryRole} onChange={e => f("primaryRole", e.target.value)} placeholder="e.g. Senior Engineer" /></Field></div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Department" required error={errors.department}>
            <Select value={form.department} onChange={e => f("department", e.target.value)}>
              <option value="">Select…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1"><Field label="Phone"><Input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+1 (555) 000-0000" /></Field></div>
        <div className="col-span-2 sm:col-span-1"><Field label="Location"><Input value={form.location} onChange={e => f("location", e.target.value)} placeholder="City, State" /></Field></div>
      </div>
    </Modal>
  );
}

interface UserDetailProps {
  user: User;
  allUsers: User[];
  onBack: () => void;
  onUpdateUser: (u: User) => void | Promise<void>;
  onDeleteUser: (id: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

function UserDetail({ user, allUsers, onBack, onUpdateUser, onDeleteUser, showToast }: UserDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Real enrolled devices + active session count for this user (no mock data).
  const [devices, setDevices] = useState<AdminDeviceDto[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);

  const reloadDevices = () => { fetchUserDevices(user.id).then(setDevices).catch(() => setDevices([])); };
  useEffect(() => {
    reloadDevices();
    fetchActiveSessionCount(user.id).then(setActiveSessions).catch(() => setActiveSessions(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const [realStressHistory, setRealStressHistory] = useState<{date: string; score: number}[]>([]);
  const [stressLoading, setStressLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setStressLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    api.get<{ bucketStart: string; averageScore: number }[]>(
      `admin/users/${user.id}/stress-trends`,
      { params: { from: from.toISOString(), to: to.toISOString(), granularity: 'Day' } }
    )
      .then(data => {
        if (cancelled) return;
        setRealStressHistory(
          data.map(p => ({
            date: p.bucketStart.slice(0, 10),
            score: Math.round(p.averageScore * 100),
          }))
        );
      })
      .catch(() => {}) // falls back to user.stressHistory
      .finally(() => { if (!cancelled) setStressLoading(false); });
    return () => { cancelled = true; };
  }, [user.id]);

  const sourceHistory = realStressHistory.length > 0 ? realStressHistory : user.stressHistory;
  const avgStress = sourceHistory.length
    ? Math.round(sourceHistory.reduce((s, p) => s + p.score, 0) / sourceHistory.length)
    : 0;
  const maxStress = sourceHistory.length ? Math.max(...sourceHistory.map(p => p.score)) : 0;
  const chartData = sourceHistory.map((p, i) => ({
    ...p,
    displayDate: i % 5 === 0 ? p.date.slice(5) : "",
  }));

  const stressColor = avgStress >= 80 ? "#dc2626" : avgStress >= 60 ? "#f97316" : avgStress >= 30 ? "#f59e0b" : "#22c55e";
  const stressLabel = avgStress >= 80 ? "Critical" : avgStress >= 60 ? "High" : avgStress >= 30 ? "Moderate" : "Low";

  // Derives the display status for an enrolled device.
  function deviceStatus(d: AdminDeviceDto): "Active" | "Revoked" | "Idle" {
    if (d.revokedAt || !d.isActive) return "Revoked";
    return d.isOnline ? "Active" : "Idle";
  }

  async function revokeDevice(deviceId: string) {
    try {
      await revokeDeviceApi(deviceId);
      reloadDevices();
      showToast("Device access revoked successfully", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't revoke device", "error");
    }
  }

  async function removeDevice(deviceId: string) {
    try {
      await deleteDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      showToast("Device permanently removed", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.displayMessage : "Couldn't delete device", "error");
    }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6" style={{ fontSize: "0.85rem" }}>
        <ArrowLeft size={16} /> Back to All Users
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${user.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <span className="text-white" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{user.initials}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-slate-900 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{user.name}</h2>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-3" style={{ fontSize: "0.85rem" }}>{user.primaryRole} · {user.department}</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: <Mail size={13} />, text: user.email },
                  { icon: <Phone size={13} />, text: user.phone },
                  { icon: <MapPin size={13} />, text: user.location },
                  { icon: <Clock size={13} />, text: `Last login: ${user.lastLogin}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>
                    <span className="text-slate-400 dark:text-slate-500">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              style={{ fontSize: "0.82rem", fontWeight: 600 }}>
              <Edit3 size={14} /> Edit Profile
            </button>
            <button onClick={() => setSuspendOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                user.status === "Suspended"
                  ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  : "border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              }`}
              style={{ fontSize: "0.82rem", fontWeight: 600 }}>
              <UserX size={14} /> {user.status === "Suspended" ? "Unsuspend" : "Suspend"}
            </button>
            <button onClick={() => setRevokeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}>
              <LogOut size={14} /> Revoke Sessions ({activeSessions})
            </button>
            <button onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Avg Stress Score", value: `${avgStress}`, unit: "/100", color: stressColor, sub: stressLabel },
          { label: "Peak Stress (30d)", value: `${maxStress}`, unit: "/100", color: maxStress >= 80 ? "#dc2626" : "#f97316", sub: "Highest recorded" },
          { label: "Active Sessions", value: `${activeSessions}`, unit: "", color: "#3b82f6", sub: "Current sessions" },
          { label: "Enrolled Devices", value: `${devices.length}`, unit: "", color: "#8b5cf6", sub: `${devices.filter(d => deviceStatus(d) === "Active").length} active` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <p className="text-slate-500 dark:text-slate-400 mb-1" style={{ fontSize: "0.75rem" }}>{s.label}</p>
            <div className="flex items-baseline gap-1">
              <span style={{ fontSize: "1.8rem", fontWeight: 700, color: s.color }}>{s.value}</span>
              <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.8rem" }}>{s.unit}</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.72rem" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.95rem", fontWeight: 700 }}>30-Day Stress Trend</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.75rem" }}>Personal stress index — AI multimodal analysis</p>
          </div>
          <div className="flex items-center gap-3">
            {[{ label: "Low ≤30", color: "#22c55e" }, { label: "Moderate 30–60", color: "#f59e0b" }, { label: "High 60–80", color: "#f97316" }, { label: "Critical >80", color: "#dc2626" }].map(z => (
              <span key={z.label} className="flex items-center gap-1 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.68rem" }}>
                <span className="w-2 h-2 rounded-sm" style={{ background: z.color }} /> {z.label}
              </span>
            ))}
          </div>
        </div>
        {stressLoading && realStressHistory.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (realStressHistory.length > 0 || user.stressHistory.length > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <ReferenceArea key="ra-low" id="ra-low" y1={0} y2={30} fill="#22c55e" fillOpacity={0.05} />
              <ReferenceArea key="ra-mod" id="ra-mod" y1={30} y2={60} fill="#f59e0b" fillOpacity={0.05} />
              <ReferenceArea key="ra-high" id="ra-high" y1={60} y2={80} fill="#f97316" fillOpacity={0.06} />
              <ReferenceArea key="ra-crit" id="ra-crit" y1={80} y2={100} fill="#dc2626" fillOpacity={0.07} />
              <ReferenceLine key="rl-avg" id="rl-avg" y={avgStress} stroke={stressColor} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: `Avg ${avgStress}`, position: "right", fontSize: 10, fill: stressColor }} />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
              <Tooltip content={<StressTooltip />} />
              <Line type="monotone" dataKey="score" stroke={stressColor} strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: stressColor, strokeWidth: 0 }} animationDuration={600} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>
            No stress data available for this user yet.
          </div>
        )}
      </div>

      <div className="mb-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>Enrolled Devices</h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{devices.length} devices</span>
          </div>
          {devices.length === 0 ? (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No devices enrolled</div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {["Device", "OS", "Status", ""].map(h => <th key={h} className="text-left px-4 py-3" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {devices.map(dev => {
                  const status = deviceStatus(dev);
                  return (
                  <tr key={dev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Monitor size={13} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.78rem", fontWeight: 500 }}>{dev.deviceName}</span>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 ml-5" style={{ fontSize: "0.7rem" }}>{dev.lastIpAddress ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{dev.osVersion ?? dev.platform}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} size="sm" /></td>
                    <td className="px-4 py-3">
                      {status === "Revoked" ? (
                        <button onClick={() => removeDevice(dev.id)}
                          title="Permanently delete this device"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      ) : (
                        <button onClick={() => revokeDevice(dev.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                          <X size={11} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EditUserModal user={user} isOpen={editOpen} onClose={() => setEditOpen(false)}
        onSave={async u => {
          try {
            await onUpdateUser(u);
            setEditOpen(false);
            showToast(`${u.name}'s profile updated successfully`, "success");
          } catch (err) {
            showToast(err instanceof ApiError ? err.displayMessage : "Couldn't update user", "error");
          }
        }} />

      <SuspendUserModal user={user} isOpen={suspendOpen} onClose={() => setSuspendOpen(false)}
        onConfirm={reason => {
          const newStatus: UserStatus = user.status === "Suspended" ? "Active" : "Suspended";
          onUpdateUser({ ...user, status: newStatus });
          setSuspendOpen(false);
          showToast(newStatus === "Suspended" ? `${user.name} has been suspended` : `${user.name}'s account restored`, newStatus === "Suspended" ? "warning" : "success");
        }} />

      <ConfirmDanger isOpen={revokeOpen} onClose={() => setRevokeOpen(false)}
        title="Revoke All Sessions"
        description={`This will immediately terminate all ${activeSessions} active session(s) for ${user.name}. They will be logged out across all devices.`}
        confirmLabel="Revoke All Sessions"
        onConfirm={async () => {
          setRevokeOpen(false);
          try {
            await revokeAllSessions(user.id);
            setActiveSessions(0);
            showToast("All sessions revoked successfully", "success");
          } catch (err) {
            showToast(err instanceof ApiError ? err.displayMessage : "Couldn't revoke sessions", "error");
          }
        }} />

      <ConfirmDanger isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}
        title="Permanently Delete User"
        description={`This will permanently delete ${user.name}'s account, all stress history, and audit records. This action CANNOT be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={() => {
          onDeleteUser(user.id);
          setDeleteOpen(false);
          onBack();
          showToast(`${user.name}'s account deleted`, "error");
        }} />
    </div>
  );
}

export function UsersView({ showToast }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  async function reload() {
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.displayMessage : "Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  // Calls the right backend endpoint to move a user to a target status.
  async function applyStatus(id: string, status: UserStatus) {
    if (status === "Suspended") await suspendUser(id);
    else if (status === "Inactive") await deactivateUser(id);
    else await activateUser(id);
  }

  // Edit: update name/email, department/phone (profile), plus status if changed.
  async function updateUser(updated: User) {
    const original = users.find(u => u.id === updated.id);
    const { firstName, lastName } = splitName(updated.name);
    await updateUserApi(updated.id, { firstName, lastName, email: updated.email });

    // Persist profile fields (department, job title, phone) — these were not
    // saved before, so edits only showed in the UI and reverted on reload.
    // NOTE: the form's "Job Role" maps to the profile's displayJobTitle. The
    // backend PUT is a full replace, so fetch the existing profile and preserve
    // the fields this form doesn't edit.
    const profileChanged =
      original && (
        original.department !== updated.department ||
        original.phone !== updated.phone ||
        original.primaryRole !== updated.primaryRole
      );
    if (profileChanged) {
      const deptInt = departmentToInt(updated.department);
      const existing = await getUserProfile(updated.id).catch(() => null);
      const jobTitle =
        updated.primaryRole && updated.primaryRole !== "—" ? updated.primaryRole : null;
      await updateUserProfile(updated.id, {
        department: deptInt ?? (existing ? departmentToInt(existing.department) : null) ?? 1,
        displayJobTitle: jobTitle,
        internalJobTitle: existing?.internalJobTitle ?? null,
        hourlyCost: existing?.hourlyCost ?? null,
        phoneNumber: updated.phone ?? existing?.phoneNumber ?? null,
        hireDate: existing?.hireDate ?? null,
        avatarUrl: existing?.avatarUrl ?? null,
        bio: existing?.bio ?? null,
        skills: existing?.skills ?? null,
      });
    }

    if (original && original.status !== updated.status) {
      await applyStatus(updated.id, updated.status);
    }
    await reload();
    if (selectedUser?.id === updated.id) {
      setSelectedUser(prev => prev ? { ...prev, ...updated } : prev);
    }
  }

  async function deleteUser(id: string) {
    await deleteUserApi(id);
    await reload();
    if (selectedUser?.id === id) setSelectedUser(null);
  }

  const departments = useMemo(() => ["All", ...Array.from(new Set(users.map(u => u.department))).sort()], [users]);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.primaryRole.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") list = list.filter(u => u.status === statusFilter);
    if (deptFilter !== "All") list = list.filter(u => u.department === deptFilter);
    return list;
  }, [users, search, statusFilter, deptFilter]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);

  function resetFilters() { setSearch(""); setStatusFilter("All"); setDeptFilter("All"); setCurrentPage(1); }

  if (selectedUser) {
    const fresh = users.find(u => u.id === selectedUser.id) ?? selectedUser;
    return (
      <UserDetail
        user={fresh} allUsers={users}
        onBack={() => setSelectedUser(null)}
        onUpdateUser={updateUser}
        onDeleteUser={deleteUser}
        showToast={showToast}
      />
    );
  }

  const counts = { All: users.length, Active: users.filter(u => u.status === "Active").length, Inactive: users.filter(u => u.status === "Inactive").length, Suspended: users.filter(u => u.status === "Suspended").length };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Users</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>Manage all Subl system accounts — {users.length} users total</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex-shrink-0"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        {(["All", "Active", "Suspended"] as const).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl transition-all ${statusFilter === s ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"}`}
            style={{ fontSize: "0.82rem", fontWeight: statusFilter === s ? 600 : 400 }}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Search by name, email, role, department…" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
              style={{ fontSize: "0.875rem" }} />
          </div>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 appearance-none"
            style={{ fontSize: "0.875rem" }}>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(search || statusFilter !== "All" || deptFilter !== "All") && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.82rem" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
        <p className="text-slate-400 dark:text-slate-500 mt-2" style={{ fontSize: "0.72rem" }}>{filtered.length} of {users.length} users shown</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-16 flex items-center justify-center">
          <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      {!loading && loadError && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-10 text-center">
          <p className="text-red-500" style={{ fontSize: "0.875rem" }}>{loadError}</p>
        </div>
      )}
      {!loading && !loadError && (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {["User", "Role / Department", "Status", "Last Login", "Sessions", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>No users match your filters.</td></tr>
              ) : paginated.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{user.initials}</span>
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.name}</p>
                        <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem" }}>{user.primaryRole}</p>
                    <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.75rem" }}>{user.department}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{user.lastLogin}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full ${user.activeSessions > 0 ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {user.activeSessions} active
                    </span>
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <RowMenu user={user}
                      onView={() => setSelectedUser(user)}
                      onEdit={() => setEditTarget(user)}
                      onSuspend={() => setSuspendTarget(user)}
                      onDelete={() => setDeleteTarget(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginated.map(user => (
            <div key={user.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedUser(user)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center`}>
                    <span className="text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{user.initials}</span>
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.name}</p>
                    <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{user.primaryRole}</p>
                  </div>
                </div>
                <StatusBadge status={user.status} size="sm" />
              </div>
            </div>
          ))}
        </div>

        <Pagination total={filtered.length} pageSize={PAGE_SIZE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      )}

      {editTarget && (
        <EditUserModal user={editTarget} isOpen={true} onClose={() => setEditTarget(null)}
          onSave={async u => {
            try {
              await updateUser(u);
              setEditTarget(null);
              showToast(`${u.name} updated successfully`, "success");
            } catch (err) {
              showToast(err instanceof ApiError ? err.displayMessage : "Couldn't update user", "error");
            }
          }} />
      )}
      {suspendTarget && (
        <SuspendUserModal user={suspendTarget} isOpen={true} onClose={() => setSuspendTarget(null)}
          onConfirm={async () => {
            const target = suspendTarget;
            const ns: UserStatus = target.status === "Suspended" ? "Active" : "Suspended";
            setSuspendTarget(null);
            try {
              await applyStatus(target.id, ns);
              await reload();
              showToast(ns === "Suspended" ? `${target.name} suspended` : `${target.name} restored`, ns === "Suspended" ? "warning" : "success");
            } catch (err) {
              showToast(err instanceof ApiError ? err.displayMessage : "Couldn't change status", "error");
            }
          }} />
      )}
      <ConfirmDanger isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete User Account"
        description={`Permanently delete ${deleteTarget?.name}'s account? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={async () => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (!target) return;
          try {
            await deleteUser(target.id);
            showToast(`${target.name} deleted`, "error");
          } catch (err) {
            showToast(err instanceof ApiError ? err.displayMessage : "Couldn't delete user", "error");
          }
        }} />

      <AddUserModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onSave={async data => {
          const { firstName, lastName } = splitName(data.name);
          try {
            await createUserWithProfile({
              email: data.email, firstName, lastName, password: data.password,
              department: data.department, jobTitle: data.primaryRole, phone: data.phone,
            });
            await reload();
            setAddOpen(false);
            showToast(`${data.name} created successfully`, "success");
          } catch (err) {
            showToast(err instanceof ApiError ? err.displayMessage : "Couldn't create user", "error");
          }
        }} />
    </div>
  );
}
