import { useState } from "react";

const data = [
  { department: "Marketing", stress: 28 },
  { department: "Sales", stress: 35 },
  { department: "Dev", stress: 68 },
  { department: "HR", stress: 22 },
  { department: "Support", stress: 74 },
];

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

export function DepartmentBenchmarkChart() {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxStress = Math.max(...data.map(d => d.stress));

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

      <div className="space-y-3 pt-1">
        {data.map(d => {
          const color = getBarColor(d.stress);
          const isHovered = hovered === d.department;
          return (
            <div
              key={d.department}
              className="flex items-center gap-3 group"
              onMouseEnter={() => setHovered(d.department)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="flex-shrink-0 text-right text-slate-500 dark:text-slate-400"
                style={{ fontSize: "0.75rem", width: "52px" }}
              >
                {d.department}
              </span>
              <div className="flex-1 relative h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out"
                  style={{
                    width: `${(d.stress / 100) * 100}%`,
                    background: color,
                    opacity: isHovered ? 1 : 0.85,
                  }}
                />
                {isHovered && (
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                    style={{ left: `${(d.stress / 100) * 100}%` }}
                  >
                    <div className="ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap z-10">
                      <p className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{d.department}</p>
                      <p style={{ fontSize: "0.72rem", color, fontWeight: 600 }}>{d.stress}% — {getLevel(d.stress)}</p>
                    </div>
                  </div>
                )}
              </div>
              <span
                className="flex-shrink-0 tabular-nums"
                style={{ fontSize: "0.78rem", fontWeight: 700, color, width: "36px" }}
              >
                {d.stress}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Y-axis reference lines */}
      <div className="flex items-center mt-3 ml-[64px] mr-[44px]">
        {[0, 25, 50, 75, 100].map(v => (
          <div key={v} className="flex-1 text-center text-slate-300 dark:text-slate-700" style={{ fontSize: "0.65rem", marginLeft: v === 0 ? 0 : undefined }}>
            {v === 0 ? null : `${v}`}
          </div>
        ))}
      </div>
    </div>
  );
}
