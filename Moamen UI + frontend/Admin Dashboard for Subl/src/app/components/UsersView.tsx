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
import { MOCK_USERS, type User, type UserStatus, type UserDevice } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { Modal, ConfirmDanger, Field, Input, Select, Textarea } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";

const PAGE_SIZE = 8;
const DEPARTMENTS = ["Engineering", "Sales", "Customer Support", "Product", "Human Resources", "Finance", "Marketing", "Legal"];
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
              {(["Active", "Inactive", "Suspended"] as UserStatus[]).map(s => (
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
              Suspending <strong>{user.name}</strong> will immediately revoke all active sessions and block login. This action is logged in the Audit Trail.
            </p>
          </div>
          <Field label="Reason for Suspension" required>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Describe the reason for suspension (required for audit compliance)…" />
          </Field>
        </div>
      ) : (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/40">
          <p className="text-green-700 dark:text-green-300" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
            This will restore <strong>{user.name}</strong>'s access. They will be able to log in immediately. An entry will be created in the Audit Log.
          </p>
        </div>
      )}
    </Modal>
  );
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [form, setForm] = useState({ name: "", email: "", primaryRole: "", department: "", phone: "", location: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const initials = form.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const color = COLORS[Math.floor(form.name.length % COLORS.length)];
    const now = new Date("2026-05-25").toISOString().split("T")[0];
    const newUser: User = {
      id: `u-${Date.now()}`, ...form, status: "Active",
      lastLogin: "Never", createdAt: now, initials, color,
      activeSessions: 0, stressHistory: [], devices: [],
      assignedRoles: [{ id: "r5", name: "Viewer", assignedAt: now }],
    };
    onSave(newUser);
    setForm({ name: "", email: "", primaryRole: "", department: "", phone: "", location: "" });
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
        <div className="col-span-2 sm:col-span-1"><Field label="Job Role" required error={errors.primaryRole}><Input value={form.primaryRole} onChange={e => f("primaryRole", e.target.value)} placeholder="e.g. Senior Engineer" /></Field></div>
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
  onUpdateUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

function UserDetail({ user, allUsers, onBack, onUpdateUser, onDeleteUser, showToast }: UserDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [devices, setDevices] = useState<UserDevice[]>(user.devices);

  const avgStress = user.stressHistory.length
    ? Math.round(user.stressHistory.reduce((s, p) => s + p.score, 0) / user.stressHistory.length)
    : 0;
  const maxStress = user.stressHistory.length ? Math.max(...user.stressHistory.map(p => p.score)) : 0;

  const chartData = user.stressHistory.map((p, i) => ({
    ...p,
    displayDate: i % 5 === 0 ? p.date.slice(5) : "",
  }));

  const stressColor = avgStress >= 80 ? "#dc2626" : avgStress >= 60 ? "#f97316" : avgStress >= 30 ? "#f59e0b" : "#22c55e";
  const stressLabel = avgStress >= 80 ? "Critical" : avgStress >= 60 ? "High" : avgStress >= 30 ? "Moderate" : "Low";

  function revokeDevice(deviceId: string) {
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: "Revoked" } : d));
    showToast("Device access revoked successfully", "success");
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
              <LogOut size={14} /> Revoke Sessions ({user.activeSessions})
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
          { label: "Active Sessions", value: `${user.activeSessions}`, unit: "", color: "#3b82f6", sub: "Current sessions" },
          { label: "Enrolled Devices", value: `${devices.length}`, unit: "", color: "#8b5cf6", sub: `${devices.filter(d => d.status === "Active").length} active` },
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
        {user.stressHistory.length > 0 ? (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.9rem", fontWeight: 700 }}>Assigned Roles</h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" style={{ fontSize: "0.72rem", fontWeight: 600 }}>{user.assignedRoles.length} roles</span>
          </div>
          {user.assignedRoles.length === 0 ? (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No roles assigned</div>
          ) : (
            <table className="w-full">
              <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {["Role", "Assigned"].map(h => <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {user.assignedRoles.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Shield size={13} className="text-blue-500 dark:text-blue-400" /></div>
                        <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{r.assignedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
                {devices.map(dev => (
                  <tr key={dev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Monitor size={13} className="text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.78rem", fontWeight: 500 }}>{dev.name}</span>
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 ml-5" style={{ fontSize: "0.7rem" }}>{dev.ip}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.75rem" }}>{dev.os}</td>
                    <td className="px-4 py-3"><StatusBadge status={dev.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      {dev.status === "Active" && (
                        <button onClick={() => revokeDevice(dev.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                          <X size={11} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EditUserModal user={user} isOpen={editOpen} onClose={() => setEditOpen(false)}
        onSave={u => { onUpdateUser(u); setEditOpen(false); showToast(`${u.name}'s profile updated successfully`, "success"); }} />

      <SuspendUserModal user={user} isOpen={suspendOpen} onClose={() => setSuspendOpen(false)}
        onConfirm={reason => {
          const newStatus: UserStatus = user.status === "Suspended" ? "Active" : "Suspended";
          onUpdateUser({ ...user, status: newStatus });
          setSuspendOpen(false);
          showToast(newStatus === "Suspended" ? `${user.name} has been suspended` : `${user.name}'s account restored`, newStatus === "Suspended" ? "warning" : "success");
        }} />

      <ConfirmDanger isOpen={revokeOpen} onClose={() => setRevokeOpen(false)}
        title="Revoke All Sessions"
        description={`This will immediately terminate all ${user.activeSessions} active session(s) for ${user.name}. They will be logged out across all devices.`}
        confirmLabel="Revoke All Sessions"
        onConfirm={() => {
          onUpdateUser({ ...user, activeSessions: 0 });
          setRevokeOpen(false);
          showToast("All sessions revoked successfully", "success");
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
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  function updateUser(updated: User) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
  }

  function deleteUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);
  }

  const departments = useMemo(() => ["All", ...Array.from(new Set(MOCK_USERS.map(u => u.department))).sort()], []);

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
        {(["All", "Active", "Inactive", "Suspended"] as const).map(s => (
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

      {editTarget && (
        <EditUserModal user={editTarget} isOpen={true} onClose={() => setEditTarget(null)}
          onSave={u => { updateUser(u); setEditTarget(null); showToast(`${u.name} updated successfully`, "success"); }} />
      )}
      {suspendTarget && (
        <SuspendUserModal user={suspendTarget} isOpen={true} onClose={() => setSuspendTarget(null)}
          onConfirm={() => {
            const ns: UserStatus = suspendTarget.status === "Suspended" ? "Active" : "Suspended";
            updateUser({ ...suspendTarget, status: ns });
            setSuspendTarget(null);
            showToast(ns === "Suspended" ? `${suspendTarget.name} suspended` : `${suspendTarget.name} restored`, ns === "Suspended" ? "warning" : "success");
          }} />
      )}
      <ConfirmDanger isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete User Account"
        description={`Permanently delete ${deleteTarget?.name}'s account? This cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={() => {
          if (deleteTarget) { deleteUser(deleteTarget.id); showToast(`${deleteTarget.name} deleted`, "error"); }
          setDeleteTarget(null);
        }} />

      <AddUserModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onSave={u => { setUsers(prev => [u, ...prev]); setAddOpen(false); showToast(`${u.name} created successfully`, "success"); }} />
    </div>
  );
}
