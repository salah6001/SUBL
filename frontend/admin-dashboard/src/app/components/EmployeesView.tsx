import { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  X,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Shield,
  Mail,
  Briefcase,
  Building2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AccountStatus = "Active" | "Inactive";
type SortField = "name" | "role" | "department" | "email" | "status";
type SortDir = "asc" | "desc";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  status: AccountStatus;
  initials: string;
  avatarColor: string;
}

// ─── Mock data (admin-only fields — NO psychological data) ───────────────────

const initialEmployees: Employee[] = [
  { id: 1, name: "Alice Johnson", role: "Senior Engineer", department: "Engineering", email: "alice.j@subl.io", status: "Active", initials: "AJ", avatarColor: "from-blue-500 to-blue-700" },
  { id: 2, name: "Brian Nguyen", role: "Account Executive", department: "Sales", email: "b.nguyen@subl.io", status: "Active", initials: "BN", avatarColor: "from-purple-500 to-purple-700" },
  { id: 3, name: "Carmen Ruiz", role: "Support Specialist", department: "Customer Support", email: "c.ruiz@subl.io", status: "Active", initials: "CR", avatarColor: "from-emerald-500 to-teal-600" },
  { id: 4, name: "David Park", role: "UX Designer", department: "Product", email: "d.park@subl.io", status: "Active", initials: "DP", avatarColor: "from-cyan-500 to-blue-600" },
  { id: 5, name: "Elena Vasquez", role: "HR Manager", department: "Human Resources", email: "e.vasquez@subl.io", status: "Active", initials: "EV", avatarColor: "from-pink-500 to-rose-500" },
  { id: 6, name: "Frank Liu", role: "Financial Analyst", department: "Finance", email: "f.liu@subl.io", status: "Active", initials: "FL", avatarColor: "from-amber-500 to-orange-600" },
  { id: 7, name: "Grace Kim", role: "Marketing Strategist", department: "Marketing", email: "g.kim@subl.io", status: "Active", initials: "GK", avatarColor: "from-indigo-500 to-violet-600" },
  { id: 8, name: "Hiro Tanaka", role: "Backend Engineer", department: "Engineering", email: "h.tanaka@subl.io", status: "Active", initials: "HT", avatarColor: "from-red-500 to-rose-600" },
  { id: 9, name: "Isabella Rossi", role: "Legal Counsel", department: "Legal", email: "i.rossi@subl.io", status: "Inactive", initials: "IR", avatarColor: "from-slate-500 to-slate-600" },
  { id: 10, name: "Jake Morrison", role: "Product Manager", department: "Product", email: "j.morrison@subl.io", status: "Active", initials: "JM", avatarColor: "from-teal-500 to-cyan-600" },
  { id: 11, name: "Karen Lee", role: "Sales Director", department: "Sales", email: "k.lee@subl.io", status: "Active", initials: "KL", avatarColor: "from-fuchsia-500 to-pink-600" },
  { id: 12, name: "Lucas Ferrari", role: "DevOps Engineer", department: "Engineering", email: "l.ferrari@subl.io", status: "Inactive", initials: "LF", avatarColor: "from-slate-400 to-slate-600" },
  { id: 13, name: "Mia Chen", role: "Data Scientist", department: "Engineering", email: "m.chen@subl.io", status: "Active", initials: "MC", avatarColor: "from-blue-400 to-indigo-600" },
  { id: 14, name: "Nathan Brooks", role: "Customer Success Lead", department: "Customer Support", email: "n.brooks@subl.io", status: "Active", initials: "NB", avatarColor: "from-green-500 to-emerald-600" },
  { id: 15, name: "Olivia Turner", role: "Content Strategist", department: "Marketing", email: "o.turner@subl.io", status: "Active", initials: "OT", avatarColor: "from-orange-400 to-amber-500" },
];

const DEPARTMENTS = ["Engineering", "Sales", "Customer Support", "Product", "Human Resources", "Finance", "Marketing", "Legal"];

// ─── Form state ───────────────────────────────────────────────────────────────

interface NewEmployeeForm {
  name: string;
  email: string;
  role: string;
  department: string;
  status: AccountStatus;
}

const emptyForm: NewEmployeeForm = { name: "", email: "", role: "", department: "", status: "Active" };

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-slate-300" />;
  return sortDir === "asc" ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onSave: (emp: NewEmployeeForm) => void;
}

function AddEmployeeModal({ onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<NewEmployeeForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof NewEmployeeForm, string>>>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.role.trim()) e.role = "Role is required";
    if (!form.department) e.department = "Please select a department";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSave(form);
  }

  function field(key: keyof NewEmployeeForm, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <UserPlus size={17} className="text-blue-600" />
              </div>
              <div>
                <p className="text-slate-800" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Add New Employee</p>
                <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>Administrative account only — no wellness data collected yet</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-slate-700 mb-1.5" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={e => field("name", e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-700 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all
                  ${errors.name ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                style={{ fontSize: "0.875rem" }}
              />
              {errors.name && <p className="text-red-500 mt-1" style={{ fontSize: "0.72rem" }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-700 mb-1.5" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Work Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="jane.smith@company.io"
                value={form.email}
                onChange={e => field("email", e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-700 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all
                  ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                style={{ fontSize: "0.875rem" }}
              />
              {errors.email && <p className="text-red-500 mt-1" style={{ fontSize: "0.72rem" }}>{errors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-slate-700 mb-1.5" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Job Role <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Engineer"
                value={form.role}
                onChange={e => field("role", e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-700 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all
                  ${errors.role ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                style={{ fontSize: "0.875rem" }}
              />
              {errors.role && <p className="text-red-500 mt-1" style={{ fontSize: "0.72rem" }}>{errors.role}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-slate-700 mb-1.5" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={form.department}
                onChange={e => field("department", e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all appearance-none
                  ${errors.department ? "border-red-300 bg-red-50" : "border-slate-200"}
                  ${!form.department ? "text-slate-400" : ""}`}
                style={{ fontSize: "0.875rem" }}
              >
                <option value="">Select a department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-red-500 mt-1" style={{ fontSize: "0.72rem" }}>{errors.department}</p>}
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-slate-700 mb-2" style={{ fontSize: "0.82rem", fontWeight: 600 }}>Account Status</label>
              <div className="flex items-center gap-3">
                {(["Active", "Inactive"] as AccountStatus[]).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => field("status", s)}
                      className="accent-blue-600"
                    />
                    <span className="text-slate-600" style={{ fontSize: "0.85rem" }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
              <Shield size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-600" style={{ fontSize: "0.72rem" }}>
                Only administrative data will be stored. Wellness monitoring requires separate employee consent.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Save Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────

function SuccessToast({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-5 py-4
      animate-in slide-in-from-bottom-4 duration-300"
      style={{ animation: "toastIn 0.35s ease-out" }}>
      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={18} className="text-green-500" />
      </div>
      <div>
        <p className="text-slate-800" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{name} added successfully</p>
        <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>Employee account created · Pending wellness consent</p>
      </div>
      <button onClick={onDismiss} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
        <X size={15} />
      </button>
      <style>{`@keyframes toastIn { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toastName, setToastName] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<"All" | AccountStatus>("All");

  // Sort + filter
  const displayed = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") list = list.filter(e => e.status === statusFilter);
    list.sort((a, b) => {
      const av = a[sortField] as string;
      const bv = b[sortField] as string;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [employees, search, sortField, sortDir, statusFilter]);

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  }

  function handleSave(form: NewEmployeeForm) {
    const initials = form.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const colors = ["from-blue-500 to-blue-700", "from-purple-500 to-purple-700", "from-emerald-500 to-teal-600", "from-cyan-500 to-blue-600", "from-pink-500 to-rose-500"];
    const newEmp: Employee = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      role: form.role,
      department: form.department,
      status: form.status,
      initials,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
    setEmployees(prev => [newEmp, ...prev]);
    setShowModal(false);
    setToastName(form.name);
    setTimeout(() => setToastName(null), 4000);
  }

  const cols: { key: SortField; label: string; icon: React.ReactNode }[] = [
    { key: "name", label: "Name", icon: <Mail size={13} className="text-slate-400" /> },
    { key: "role", label: "Role", icon: <Briefcase size={13} className="text-slate-400" /> },
    { key: "department", label: "Department", icon: <Building2 size={13} className="text-slate-400" /> },
    { key: "email", label: "Email", icon: <Mail size={13} className="text-slate-400" /> },
    { key: "status", label: "Status", icon: null },
  ];

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Employees</h2>
          </div>
          <div className="flex items-center gap-2 ml-3.5">
            <Shield size={13} className="text-blue-500" />
            <p className="text-blue-600" style={{ fontSize: "0.78rem", fontWeight: 500 }}>
              Privacy Mode — Administrative data only. No individual wellness or stress data is displayed.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex-shrink-0"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}
        >
          <UserPlus size={16} />
          Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, or department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              style={{ fontSize: "0.875rem" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {(["All", "Active", "Inactive"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 rounded-xl transition-all duration-150 ${
                  statusFilter === s
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
                }`}
                style={{ fontSize: "0.82rem", fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="text-slate-400 mt-2" style={{ fontSize: "0.72rem" }}>
          Showing {displayed.length} of {employees.length} employees
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-5 py-3.5 cursor-pointer select-none group"
                    style={{ fontSize: "0.72rem" }}
                  >
                    <div className="flex items-center gap-2 text-slate-500 uppercase tracking-wide font-semibold group-hover:text-blue-500 transition-colors">
                      {col.label}
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400" style={{ fontSize: "0.875rem" }}>
                    No employees match your search.
                  </td>
                </tr>
              ) : displayed.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{emp.initials}</span>
                      </div>
                      <span className="text-slate-800" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600" style={{ fontSize: "0.82rem" }}>{emp.role}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500" style={{ fontSize: "0.82rem" }}>{emp.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                      emp.status === "Active"
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    }`} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "Active" ? "bg-green-400" : "bg-slate-300"}`} />
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {displayed.length === 0 ? (
            <div className="p-8 text-center text-slate-400" style={{ fontSize: "0.875rem" }}>No employees match your search.</div>
          ) : displayed.map(emp => (
            <div key={emp.id} className="p-4 hover:bg-slate-50">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{emp.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 truncate" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{emp.name}</p>
                  <p className="text-slate-500 truncate" style={{ fontSize: "0.75rem" }}>{emp.role} · {emp.department}</p>
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                  emp.status === "Active" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                }`} style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "Active" ? "bg-green-400" : "bg-slate-300"}`} />
                  {emp.status}
                </span>
              </div>
              <p className="text-slate-400 ml-13" style={{ fontSize: "0.75rem", paddingLeft: "52px" }}>{emp.email}</p>
            </div>
          ))}
        </div>

        {/* Table footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-400" style={{ fontSize: "0.72rem" }}>
            {displayed.length} result{displayed.length !== 1 ? "s" : ""} · Sorted by {sortField} ({sortDir})
          </p>
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-blue-400" />
            <p className="text-blue-500" style={{ fontSize: "0.68rem" }}>GDPR compliant · No individual wellness data stored</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <AddEmployeeModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      {/* Success toast */}
      {toastName && <SuccessToast name={toastName} onDismiss={() => setToastName(null)} />}
    </div>
  );
}
