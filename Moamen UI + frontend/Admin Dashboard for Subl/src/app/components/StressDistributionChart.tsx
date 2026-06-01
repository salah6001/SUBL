import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardApi } from "../api/dashboard";

interface Slice { name: string; value: number; color: string; }

const FALLBACK: Slice[] = [
  { name: "Normal",       value: 60, color: "#22c55e" },
  { name: "Calm",         value: 20, color: "#3b82f6" },
  { name: "High Stress",  value: 15, color: "#f97316" },
  { name: "Burnout Risk", value:  5, color: "#ef4444" },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{item.name}</span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: "0.8rem" }}>{item.value}% of workforce</p>
    </div>
  );
}

export function StressDistributionChart() {
  const [data, setData] = useState<Slice[]>(FALLBACK);

  useEffect(() => {
    dashboardApi.getDistribution()
      .then(d => {
        setData([
          { name: "Normal",       value: d.normal,      color: "#22c55e" },
          { name: "Calm",         value: d.calm,        color: "#3b82f6" },
          { name: "High Stress",  value: d.highStress,  color: "#f97316" },
          { name: "Burnout Risk", value: d.burnoutRisk, color: "#ef4444" },
        ]);
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const stablePercent = Math.round(data[0].value + data[1].value);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-2">
        <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Real-Time Stress Distribution</h3>
        <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Company-wide stress state breakdown</p>
      </div>

      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" animationBegin={0} animationDuration={800}>
              {data.map(entry => (
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
          <p className="text-green-700 dark:text-green-400" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{stablePercent}% workforce stable</p>
          <p className="text-green-600 dark:text-green-500" style={{ fontSize: "0.72rem" }}>Normal or Calm stress levels detected</p>
        </div>
      </div>
    </div>
  );
}
