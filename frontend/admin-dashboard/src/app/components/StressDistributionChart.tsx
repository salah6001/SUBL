import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchStressDistribution } from "../lib/admin/analyticsApi";
import { ApiError } from "../lib/apiClient";

interface Segment {
  name: string;
  value: number;
  color: string;
}

const LEVEL_COLORS: Record<string, string> = {
  Low: "#22c55e",
  Moderate: "#3b82f6",
  High: "#f97316",
  Critical: "#ef4444",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{item.name}</span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: "0.8rem" }}>{item.value}% of readings</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-2">
        <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Real-Time Stress Distribution</h3>
        <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Company-wide stress state breakdown</p>
      </div>
      {children}
    </div>
  );
}

export function StressDistributionChart() {
  const [data, setData] = useState<Segment[]>([]);
  const [total, setTotal] = useState(0);
  const [stablePct, setStablePct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStressDistribution()
      .then(res => {
        if (cancelled) return;
        setTotal(res.totalReadings);
        setData(res.slices.map(s => ({
          name: s.level,
          value: Math.round(s.percentage),
          color: LEVEL_COLORS[s.level] ?? "#94a3b8",
        })));
        const stable = res.slices
          .filter(s => s.level === "Low" || s.level === "Moderate")
          .reduce((sum, s) => sum + s.percentage, 0);
        setStablePct(Math.round(stable));
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load distribution.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <Shell><div className="py-16 flex justify-center"><span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div></Shell>;
  }
  if (error) {
    return <Shell><p className="py-12 text-center text-red-500" style={{ fontSize: "0.82rem" }}>{error}</p></Shell>;
  }
  if (total === 0) {
    return <Shell><p className="py-12 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No stress readings recorded yet.</p></Shell>;
  }

  return (
    <Shell>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="w-full mt-2 px-2">
          <div className="flex flex-col gap-2 mt-4">
            {data.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-600 dark:text-slate-400" style={{ fontSize: "0.8rem" }}>{d.name}</span>
                </div>
                <span className="text-slate-700 dark:text-slate-300" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
          <span style={{ fontSize: "1rem" }}>✅</span>
        </div>
        <div>
          <p className="text-green-700 dark:text-green-400" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{stablePct}% workforce stable</p>
          <p className="text-green-600 dark:text-green-500" style={{ fontSize: "0.72rem" }}>Low or Moderate stress levels detected</p>
        </div>
      </div>
    </Shell>
  );
}
