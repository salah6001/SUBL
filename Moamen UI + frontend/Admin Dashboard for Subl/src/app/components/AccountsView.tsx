import { useState, useMemo } from "react";
import { Building2, Users, ChevronRight, Mail, Phone, DollarSign, Calendar, ArrowLeft, X } from "lucide-react";
import { MOCK_ACCOUNTS, type Account } from "../data/mockData";
import { StatusBadge } from "./shared/StatusBadge";
import { Pagination } from "./shared/Pagination";
import type { ToastType } from "./shared/Toast";

const PAGE_SIZE = 6;

interface Props { showToast: (msg: string, type?: ToastType) => void; }

function planColor(plan: string) {
  if (plan === "Enterprise") return "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800";
  if (plan === "Professional") return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
  return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
}

export function AccountsView({ showToast }: Props) {
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [selected, setSelected] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...accounts];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q));
    }
    if (planFilter !== "All") list = list.filter(a => a.plan === planFilter);
    return list;
  }, [accounts, search, planFilter]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);
  const totalMRR = accounts.filter(a => a.status === "Active").reduce((s, a) => s + a.mrr, 0);

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6" style={{ fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Back to Accounts
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-slate-900 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{selected.name}</h2>
                  <StatusBadge status={selected.status} />
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${planColor(selected.plan)}`}>{selected.plan}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.82rem" }}>{selected.industry} · Created {selected.createdAt}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Users", value: selected.userCount.toLocaleString(), icon: <Users size={15} />, color: "text-blue-600 dark:text-blue-400" },
              { label: "Monthly Revenue", value: selected.mrr > 0 ? `$${selected.mrr.toLocaleString()}` : "–", icon: <DollarSign size={15} />, color: "text-green-600 dark:text-green-400" },
              { label: "Plan", value: selected.plan, icon: <Building2 size={15} />, color: "text-violet-600 dark:text-violet-400" },
              { label: "Renewal Date", value: selected.renewalDate, icon: <Calendar size={15} />, color: "text-slate-600 dark:text-slate-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span style={{ fontSize: "0.72rem", fontWeight: 600 }}>{s.label}</span></div>
                <p className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Contacts ({selected.contacts.length})</h3>
          </div>
          <table className="w-full">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Name", "Role", "Email", "Phone"].map(h => <th key={h} className="text-left px-5 py-3" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {selected.contacts.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                        <span className="text-white" style={{ fontSize: "0.65rem", fontWeight: 700 }}>{c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-100" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300" style={{ fontSize: "0.82rem" }}>{c.role}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400" style={{ fontSize: "0.82rem" }}>
                      <Mail size={12} /> {c.email}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>
                      <Phone size={12} /> {c.phone}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Accounts</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>{accounts.length} organizations · ${totalMRR.toLocaleString()} MRR</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Accounts", value: accounts.filter(a => a.status === "Active").length, color: "text-green-600 dark:text-green-400" },
          { label: "Trial Accounts", value: accounts.filter(a => a.status === "Trial").length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Suspended", value: accounts.filter(a => a.status === "Suspended").length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Total MRR", value: `$${totalMRR.toLocaleString()}`, color: "text-violet-600 dark:text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
            <p className="text-slate-500 dark:text-slate-400 mb-1" style={{ fontSize: "0.75rem" }}>{k.label}</p>
            <p className={`${k.color}`} style={{ fontSize: "1.5rem", fontWeight: 700 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Search accounts…" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 transition-all"
              style={{ fontSize: "0.875rem" }} />
          </div>
          <div className="flex items-center gap-2">
            {["All", "Starter", "Professional", "Enterprise"].map(p => (
              <button key={p} onClick={() => { setPlanFilter(p); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-xl transition-all ${planFilter === p ? "bg-blue-600 text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-700"}`}
                style={{ fontSize: "0.78rem", fontWeight: planFilter === p ? 600 : 400 }}>
                {p}
              </button>
            ))}
          </div>
          {(search || planFilter !== "All") && (
            <button onClick={() => { setSearch(""); setPlanFilter("All"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ fontSize: "0.78rem" }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {["Organization", "Plan", "Status", "Users", "MRR", "Industry", "Renewal", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.875rem" }}>No accounts found.</td></tr>
              ) : paginated.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setSelected(acc)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                        <Building2 size={15} className="text-white" />
                      </div>
                      <p className="text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{acc.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${planColor(acc.plan)}`}>{acc.plan}</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={acc.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><Users size={12} className="text-slate-400 dark:text-slate-500" /><span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{acc.userCount.toLocaleString()}</span></div>
                  </td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                    {acc.mrr > 0 ? `$${acc.mrr.toLocaleString()}` : <span className="text-slate-400 dark:text-slate-500">–</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{acc.industry}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>{acc.renewalDate}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 group-hover:gap-2 transition-all" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                      View <ChevronRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} pageSize={PAGE_SIZE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
