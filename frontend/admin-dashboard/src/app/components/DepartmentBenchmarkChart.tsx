import { useEffect, useState } from "react";
import { fetchDepartmentStress } from "../lib/admin/analyticsApi";
import { ApiError } from "../lib/apiClient";

interface DeptStress {
  department: string;
  stress: number;
}

function getBarColor(stress: number): string {
  if (stress >= 60) return "#ef4444";
  if (stress >= 40) return "#f97316";
  return "#3b82f6";
}

function getLevel(stress: number): string {
  if (stress >= 60) return "High Risk";
  if (stress >= 40) return "Moderate";
  return "Normal";
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Department Benchmarking</h3>
          <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Aggregated team stress levels by department</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" style={{ fontSize: "0.72rem" }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#3b82f6" }} /> Normal
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" style={{ fontSize: "0.72rem" }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#f97316" }} /> Moderate
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400" style={{ fontSize: "0.72rem" }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#ef4444" }} /> High
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function DepartmentBenchmarkChart() {
  const [data, setData] = useState<DeptStress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDepartmentStress()
      .then(res => {
        if (cancelled) return;
        setData(res.departments.map(d => ({
          department: d.department,
          stress: Math.round(d.averageStressScore * 100),
        })));
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load department data.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <Shell><div className="py-10 flex justify-center"><span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div></Shell>;
  }

  if (error) {
    return <Shell><p className="py-8 text-center text-red-500" style={{ fontSize: "0.82rem" }}>{error}</p></Shell>;
  }

  if (data.length === 0) {
    return <Shell><p className="py-8 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No stress data recorded yet.</p></Shell>;
  }

  return (
    <Shell>
      <div className="space-y-4 pt-1">
        {data.map(d => {
          const color = getBarColor(d.stress);
          const isHovered = hovered === d.department;
          return (
            <div
              key={d.department}
              className="group"
              onMouseEnter={() => setHovered(d.department)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span
                  className="truncate text-slate-600 dark:text-slate-300"
                  style={{ fontSize: "0.8rem", fontWeight: 500 }}
                >
                  {d.department}
                </span>
                <span
                  className="flex-shrink-0 tabular-nums"
                  style={{ fontSize: "0.78rem", fontWeight: 700, color }}
                >
                  {d.stress}% · {getLevel(d.stress)}
                </span>
              </div>
              <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${d.stress}%`,
                    background: color,
                    opacity: isHovered ? 1 : 0.85,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
