import { useState, useMemo } from "react";
import { Plus, Shield, Trash2, Lock, Check, Users } from "lucide-react";
import { MOCK_ROLES, ALL_PERMISSIONS, type Role } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import { Modal, ConfirmDanger, Field, Input, Textarea } from "./shared/Modal";
import type { ToastType } from "./shared/Toast";

const PAGE_SIZE = 8;

interface Props { showToast: (msg: string, type?: ToastType) => void; }

function ManagePermissionsModal({ role, isOpen, onClose, onSave }: { role: Role; isOpen: boolean; onClose: () => void; onSave: (r: Role) => void }) {
  const [selected, setSelected] = useState<string[]>(role.permissions.includes("*") ? ALL_PERMISSIONS : role.permissions);

  function toggle(p: string) {
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  const groups = useMemo(() => {
    const map: Record<string, string[]> = {};
    ALL_PERMISSIONS.forEach(p => {
      const [resource] = p.split(".");
      if (!map[resource]) map[resource] = [];
      map[resource].push(p);
    });
    return map;
  }, []);

  const isAll = selected.length === ALL_PERMISSIONS.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions: ${role.name}`} subtitle="Click checkboxes to grant or revoke access" size="lg"
      icon={<Lock size={17} className="text-blue-600" />}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => onSave({ ...role, permissions: selected })}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}>Save Permissions</button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{selected.length} of {ALL_PERMISSIONS.length} permissions granted</p>
        <button onClick={() => setSelected(isAll ? [] : [...ALL_PERMISSIONS])}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          style={{ fontSize: "0.75rem" }}>
          {isAll ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="space-y-5">
        {Object.entries(groups).map(([resource, perms]) => (
          <div key={resource}>
            <p className="text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide" style={{ fontSize: "0.7rem", fontWeight: 700 }}>{resource}</p>
            <div className="grid grid-cols-2 gap-2">
              {perms.map(p => {
                const isChecked = selected.includes(p);
                return (
                  <label key={p} onClick={() => toggle(p)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"}`}>
                      {isChecked && <Check size={10} className="text-white" />}
                    </div>
                    <span className={`${isChecked ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`} style={{ fontSize: "0.78rem", fontWeight: isChecked ? 600 : 400 }}>{p}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function AddRoleModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (r: Role) => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Role name is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const newRole: Role = {
      id: `r-${Date.now()}`, name: form.name, description: form.description,
      userCount: 0, createdAt: "2026-05-25", isSystem: false, permissions: [],
    };
    onSave(newRole);
    setForm({ name: "", description: "" });
    setErrors({});
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Role" size="md"
      icon={<Plus size={17} className="text-blue-600" />}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Create Role</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Role Name" required error={errors.name}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Compliance Auditor" /></Field>
        <Field label="Description" required error={errors.description}><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe the purpose and scope of this role…" /></Field>
      </div>
    </Modal>
  );
}

export function RolesView({ showToast }: Props) {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [currentPage, setCurrentPage] = useState(1);
  const [permTarget, setPermTarget] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const paginated = useMemo(() => roles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [roles, currentPage]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Roles</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>{roles.length} roles defined — manage access control</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex-shrink-0"
          style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {["Role", "Description", "Users", "Permissions", "Type", "Created", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.map(role => (
                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${role.isSystem ? "bg-blue-50 dark:bg-blue-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
                        <Shield size={16} className={role.isSystem ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"} />
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{role.name}</p>
                        {role.isSystem && <p className="text-blue-500 dark:text-blue-400" style={{ fontSize: "0.68rem", fontWeight: 600 }}>SYSTEM</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-xs" style={{ fontSize: "0.82rem" }}>{role.description}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users size={13} className="text-slate-400 dark:text-slate-500" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{role.userCount}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {role.permissions.includes("*") ? (
                      <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800" style={{ fontSize: "0.72rem", fontWeight: 700 }}>All (*)</span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{role.permissions.length} granted</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={role.isSystem ? "Active" : "Trial"} size="sm" />
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{role.createdAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPermTarget(role)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        <Lock size={12} /> Manage
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => setDeleteTarget(role)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={roles.length} pageSize={PAGE_SIZE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {permTarget && (
        <ManagePermissionsModal role={permTarget} isOpen={true} onClose={() => setPermTarget(null)}
          onSave={r => { setRoles(prev => prev.map(ro => ro.id === r.id ? r : ro)); setPermTarget(null); showToast(`Permissions for "${r.name}" saved`, "success"); }} />
      )}

      <ConfirmDanger isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Role"
        description={`Delete the "${deleteTarget?.name}" role? Users with this role will lose associated permissions. This cannot be undone.`}
        confirmLabel="Delete Role"
        onConfirm={() => {
          if (deleteTarget) { setRoles(prev => prev.filter(r => r.id !== deleteTarget.id)); showToast(`Role "${deleteTarget.name}" deleted`, "error"); }
          setDeleteTarget(null);
        }} />

      <AddRoleModal isOpen={addOpen} onClose={() => setAddOpen(false)}
        onSave={r => { setRoles(prev => [r, ...prev]); setAddOpen(false); showToast(`Role "${r.name}" created`, "success"); }} />
    </div>
  );
}
