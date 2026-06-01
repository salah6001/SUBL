import React from "react";
import { Lock, Check, Minus } from "lucide-react";
import { MOCK_ROLES, ALL_PERMISSIONS } from "../data/mockData";

export function PermissionsView() {
  const groups: Record<string, string[]> = {};
  ALL_PERMISSIONS.forEach(p => {
    const [resource] = p.split(".");
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });

  function hasPermission(role: typeof MOCK_ROLES[0], perm: string): boolean {
    return role.permissions.includes("*") || role.permissions.includes(perm);
  }

  const roles = MOCK_ROLES;

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
          <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Permissions Matrix</h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>Read-only overview of role-permission assignments · Manage individual roles on the Roles page</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-4">
        <p className="text-slate-600 dark:text-slate-300" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Legend:</p>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center"><Check size={11} className="text-white" /></div>
          <span className="text-slate-600 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>Granted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Minus size={11} className="text-slate-400 dark:text-slate-500" /></div>
          <span className="text-slate-600 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>Not granted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center"><span className="text-white" style={{ fontSize: "0.6rem", fontWeight: 800 }}>*</span></div>
          <span className="text-slate-600 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>Wildcard (all)</span>
        </div>
      </div>

      {/* Matrix table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-5 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-100 dark:border-slate-800" style={{ minWidth: "180px", fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8" }}>
                  PERMISSION
                </th>
                {roles.map(r => (
                  <th key={r.id} className="px-3 py-4 text-center" style={{ minWidth: "100px" }}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${r.isSystem ? "bg-blue-50 dark:bg-blue-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
                        <Lock size={13} className={r.isSystem ? "text-blue-500" : "text-slate-400 dark:text-slate-500"} />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.72rem", fontWeight: 700 }}>{r.name}</span>
                      <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.62rem" }}>{r.userCount} users</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([group, perms]) => (
                <React.Fragment key={group}>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                    <td colSpan={roles.length + 1} className="px-5 py-2">
                      <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest" style={{ fontSize: "0.65rem", fontWeight: 700 }}>{group}</p>
                    </td>
                  </tr>
                  {perms.map((perm, pi) => (
                    <tr key={perm} className={pi % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/30 dark:bg-slate-800/20"}>
                      <td className="px-5 py-3 sticky left-0 border-r border-slate-100 dark:border-slate-800 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-400 font-mono" style={{ fontSize: "0.78rem" }}>{perm}</span>
                        </div>
                      </td>
                      {roles.map(r => {
                        const granted = hasPermission(r, perm);
                        const isWild = r.permissions.includes("*");
                        return (
                          <td key={r.id} className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center">
                              {isWild ? (
                                <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center" title="Wildcard — all permissions">
                                  <span className="text-white" style={{ fontSize: "0.65rem", fontWeight: 800 }}>*</span>
                                </div>
                              ) : granted ? (
                                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Check size={11} className="text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <Minus size={11} className="text-slate-300 dark:text-slate-600" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
          <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.72rem" }}>
            {ALL_PERMISSIONS.length} permissions × {roles.length} roles · To modify, navigate to Roles → Manage Permissions
          </p>
        </div>
      </div>
    </div>
  );
}
