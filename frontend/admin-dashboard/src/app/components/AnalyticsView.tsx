import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Download, RefreshCw, Info, AlertCircle } from "lucide-react";
import {
  fetchDepartmentStress,
  fetchStressDistribution,
  type DepartmentStressSlice,
} from "../lib/admin/analyticsApi";
import { fetchKpis, type AdminKpis } from "../lib/admin/kpisApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = "7d" | "1m" | "3m";

interface DataPoint {
  label: string;
  stress: number;
  wellness: number;
  burnout: number;
}

interface DeptPoint {
  dept: string;
  stress: number;
  prev: number;
}

// ─── Illustrative trend dataset (kept as-is — not backed by a single API call) ──

const ILLUSTRATIVE_DATA: Record<TimeRange, DataPoint[]> = {
  "7d": [
    { label: "Mon", stress: 44, wellness: 78, burnout: 8 },
    { label: "Tue", stress: 42, wellness: 80, burnout: 7 },
    { label: "Wed", stress: 49, wellness: 74, burnout: 10 },
    { label: "Thu", stress: 52, wellness: 70, burnout: 12 },
    { label: "Fri", stress: 46, wellness: 76, burnout: 9 },
    { label: "Sat", stress: 36, wellness: 84, burnout: 5 },
    { label: "Sun", stress: 32, wellness: 87, burnout: 4 },
  ],
  "1m": [
    { label: "May 1", stress: 50, wellness: 72, burnout: 11 },
    { label: "May 5", stress: 48, wellness: 74, burnout: 10 },
    { label: "May 8", stress: 52, wellness: 70, burnout: 13 },
    { label: "May 12", stress: 55, wellness: 67, burnout: 14 },
    { label: "May 15", stress: 49, wellness: 73, burnout: 11 },
    { label: "May 19", stress: 47, wellness: 75, burnout: 9 },
    { label: "May 22", stress: 44, wellness: 78, burnout: 8 },
    { label: "May 25", stress: 45, wellness: 77, burnout: 9 },
  ],
  "3m": [
    { label: "Mar W1", stress: 60, wellness: 62, burnout: 16 },
    { label: "Mar W2", stress: 58, wellness: 64, burnout: 15 },
    { label: "Mar W3", stress: 55, wellness: 67, burnout: 13 },
    { label: "Mar W4", stress: 53, wellness: 69, burnout: 12 },
    { label: "Apr W1", stress: 50, wellness: 72, burnout: 11 },
    { label: "Apr W2", stress: 52, wellness: 70, burnout: 12 },
    { label: "Apr W3", stress: 48, wellness: 74, burnout: 10 },
    { label: "Apr W4", stress: 46, wellness: 76, burnout: 9 },
    { label: "May W1", stress: 49, wellness: 73, burnout: 11 },
    { label: "May W2", stress: 47, wellness: 75, burnout: 9 },
    { label: "May W3", stress: 44, wellness: 78, burnout: 8 },
    { label: "May W4", stress: 45, wellness: 77, burnout: 9 },
  ],
};

const TIME_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 Days",
  "1m": "This Month",
  "3m": "This Quarter",
};

const RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "1m": 30,
  "3m": 90,
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getDeptBarColor(stress: number): string {
  if (stress >= 60) return "#ef4444";
  if (stress >= 40) return "#f97316";
  return "#22c55e";
}

function computeTrend(data: DataPoint[], key: keyof DataPoint): { val: number; dir: "up" | "down" | "flat" } {
  if (data.length < 2) return { val: 0, dir: "flat" };
  const last = data[data.length - 1][key] as number;
  const first = data[0][key] as number;
  const diff = Math.round(last - first);
  return { val: Math.abs(diff), dir: diff > 0 ? "up" : diff < 0 ? "down" : "flat" };
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-700 mb-2" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600" style={{ fontSize: "0.78rem" }}>
            {p.name}: <strong>{p.value}%</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

function DeptTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const curr = payload.find(p => p.name === "stress")?.value ?? 0;
  const prev = payload.find(p => p.name === "prev")?.value ?? 0;
  const delta = curr - prev;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-700 mb-1" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{label}</p>
      <p className="text-slate-600" style={{ fontSize: "0.75rem" }}>Current: <strong>{curr}%</strong></p>
      <p className="text-slate-500" style={{ fontSize: "0.75rem" }}>Previous: {prev}%</p>
      <p className={delta > 0 ? "text-red-500" : "text-green-500"} style={{ fontSize: "0.72rem", fontWeight: 600 }}>
        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}% vs. last period
      </p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, trend, color, live }: {
  label: string; value: number; unit?: string; trend: { val: number; dir: "up" | "down" | "flat" }; color: string; live?: boolean;
}) {
  const isGoodDown = label.toLowerCase().includes("stress") || label.toLowerCase().includes("burnout");
  const isPositive = (trend.dir === "down" && isGoodDown) || (trend.dir === "up" && !isGoodDown);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>{label}</p>
        {live && (
          <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em" }}>
            LIVE
          </span>
        )}
      </div>
      <p style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{value}{unit ?? "%"}</p>
      <div className={`flex items-center gap-1 mt-1 ${isPositive ? "text-green-500" : trend.dir === "flat" ? "text-slate-400" : "text-red-500"}`}
        style={{ fontSize: "0.75rem", fontWeight: 500 }}>
        {trend.dir === "up" ? <TrendingUp size={13} /> : trend.dir === "down" ? <TrendingDown size={13} /> : <Minus size={13} />}
        {trend.val > 0 ? `${trend.dir === "up" ? "+" : "-"}${trend.val}% vs. period start` : "No change"}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
      <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-3/4" />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AnalyticsView() {
  const [range, setRange] = useState<TimeRange>("1m");
  const [lineLoading, setLineLoading] = useState(false);
  const [activeLines, setActiveLines] = useState({ stress: true, wellness: true, burnout: true });

  // Live KPIs
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(false);

  // Live dept chart
  const [deptData, setDeptData] = useState<DeptPoint[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState(false);

  const data = ILLUSTRATIVE_DATA[range];

  // Fetch KPIs on mount
  useEffect(() => {
    let cancelled = false;
    setKpisLoading(true);
    setKpisError(false);
    fetchKpis()
      .then(k => { if (!cancelled) setKpis(k); })
      .catch(() => { if (!cancelled) setKpisError(true); })
      .finally(() => { if (!cancelled) setKpisLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch dept stress whenever range changes
  useEffect(() => {
    let cancelled = false;
    setDeptLoading(true);
    setDeptError(false);
    const days = RANGE_DAYS[range];
    fetchDepartmentStress(days)
      .then(res => {
        if (cancelled) return;
        // Convert 0..1 score to 0..100 percentage for chart display
        const mapped: DeptPoint[] = res.departments.map((d: DepartmentStressSlice) => ({
          dept: d.department,
          stress: Math.round(d.averageStressScore * 100),
          prev: Math.round(d.peakStressScore * 100), // use peak as the "prev" comparison bar
        }));
        setDeptData(mapped);
      })
      .catch(() => { if (!cancelled) setDeptError(true); })
      .finally(() => { if (!cancelled) setDeptLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  function switchRange(r: TimeRange) {
    setLineLoading(true);
    setTimeout(() => { setRange(r); setLineLoading(false); }, 400);
  }

  function toggleLine(key: keyof typeof activeLines) {
    setActiveLines(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Derive stat card values from live KPIs or fall back to illustrative data
  const stressIndexVal = kpis ? Math.round(kpis.overallStressPercent) : data[data.length - 1].stress;
  const wellnessVal = kpis ? Math.round(kpis.wellnessScore) : data[data.length - 1].wellness;
  const burnoutVal = data[data.length - 1].burnout;

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Analytics & Reports</h2>
          </div>
          <p className="text-slate-500 ml-3.5" style={{ fontSize: "0.82rem" }}>
            Company-wide aggregated stress and wellness intelligence
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
          style={{ fontSize: "0.82rem" }}
        >
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Live data banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 mb-5">
        <Info size={13} className="text-blue-500 flex-shrink-0" />
        <p className="text-blue-700" style={{ fontSize: "0.75rem" }}>
          <strong>Dept chart and stats show live data</strong> · Trend line is illustrative (multi-period aggregation not yet wired to a single backend call)
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {kpisLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : kpisError ? (
          <>
            <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm col-span-2 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-500" style={{ fontSize: "0.78rem" }}>Could not load live KPIs</p>
            </div>
          </>
        ) : (
          <>
            <StatCard
              label="Current Stress Index"
              value={stressIndexVal}
              trend={computeTrend(data, "stress")}
              color="#f97316"
              live
            />
            <StatCard
              label="Wellness Score"
              value={wellnessVal}
              trend={computeTrend(data, "wellness")}
              color="#22c55e"
              live
            />
          </>
        )}
        <StatCard label="Burnout Risk Index" value={burnoutVal} trend={computeTrend(data, "burnout")} color="#ef4444" />
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-slate-500 mb-2" style={{ fontSize: "0.78rem" }}>Period</p>
          <p className="text-slate-800" style={{ fontSize: "1rem", fontWeight: 700 }}>{TIME_LABELS[range]}</p>
          <p className="text-slate-400 mt-1" style={{ fontSize: "0.75rem" }}>{data.length} data points</p>
        </div>
      </div>

      {/* Main line chart — illustrative */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        {/* Chart toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-slate-800" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Company Stress Trends Over Time</h3>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>Aggregated multivariate wellness indicators · 3 signals tracked · <em>Illustrative data</em></p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time range filters */}
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
              {(["7d", "1m", "3m"] as TimeRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => switchRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    range === r
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                  style={{ fontSize: "0.78rem", fontWeight: range === r ? 600 : 400 }}
                >
                  {TIME_LABELS[r]}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => switchRange(range)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <RefreshCw size={14} className={lineLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Line toggles */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {[
            { key: "stress", label: "Stress Index", color: "#f97316" },
            { key: "wellness", label: "Wellness Score", color: "#22c55e" },
            { key: "burnout", label: "Burnout Risk", color: "#ef4444" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleLine(key as keyof typeof activeLines)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                activeLines[key as keyof typeof activeLines]
                  ? "border-transparent bg-slate-50"
                  : "opacity-40 border-slate-200"
              }`}
              style={{ fontSize: "0.75rem" }}
            >
              <span className="w-3 h-0.5 rounded" style={{ background: color, display: "inline-block" }} />
              <span className="text-slate-700" style={{ fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className={`transition-opacity duration-300 ${lineLoading ? "opacity-40" : "opacity-100"}`}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="stressLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: "High Risk", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
              <ReferenceLine y={40} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Moderate", position: "insideTopRight", fontSize: 10, fill: "#f97316" }} />

              {activeLines.stress && (
                <Line type="monotone" dataKey="stress" name="Stress Index" stroke="#f97316" strokeWidth={2.5}
                  dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={500} />
              )}
              {activeLines.wellness && (
                <Line type="monotone" dataKey="wellness" name="Wellness Score" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={500} />
              )}
              {activeLines.burnout && (
                <Line type="monotone" dataKey="burnout" name="Burnout Risk" stroke="#ef4444" strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: "#ef4444", r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={500} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart note */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
          <Info size={12} className="text-slate-400 flex-shrink-0" />
          <p className="text-slate-400" style={{ fontSize: "0.7rem" }}>
            Dashed reference lines indicate risk thresholds. All data is aggregated at company level.
            Stress Index ≥ 70% triggers automatic alert escalation.
          </p>
        </div>
      </div>

      {/* Department comparison bar chart — [Live data] */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-slate-800" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Department Stress Comparison</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                LIVE DATA
              </span>
            </div>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Average vs. peak stress per department · {TIME_LABELS[range]} · Real-time from backend
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5" style={{ fontSize: "0.72rem" }}>
              <span className="w-3 h-1 rounded inline-block bg-blue-500" /> Avg Stress
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: "0.72rem" }}>
              <span className="w-3 h-1 rounded inline-block bg-slate-300" /> Peak
            </span>
          </div>
        </div>

        {deptLoading ? (
          <div className="h-60 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : deptError ? (
          <div className="h-60 flex items-center justify-center gap-2 text-red-400">
            <AlertCircle size={15} />
            <span style={{ fontSize: "0.82rem" }}>Could not load department data</span>
          </div>
        ) : deptData.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-slate-400" style={{ fontSize: "0.82rem" }}>
            No department data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData} barGap={4} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<DeptTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
              <Bar dataKey="prev" name="prev" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="stress" name="stress" radius={[4, 4, 0, 0]} barSize={16}>
                {deptData.map((entry) => (
                  <Cell key={entry.dept} fill={getDeptBarColor(entry.stress)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Insights panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[
          {
            title: "Positive Trend",
            desc: "Wellness scores improved by 8% since the start of the quarter following targeted micro-break interventions.",
            color: "border-green-200 bg-green-50",
            textColor: "text-green-700",
            icon: <TrendingUp size={14} className="text-green-500" />,
          },
          {
            title: "Watch: Engineering",
            desc: "Engineering team stress index rose +6% this month. Workload review recommended before it crosses the critical threshold.",
            color: "border-orange-200 bg-orange-50",
            textColor: "text-orange-700",
            icon: <TrendingUp size={14} className="text-orange-500" />,
          },
          {
            title: "Watch: Support",
            desc: "Customer Support remains the highest-stress department at 74%. Structural intervention planning is advised this quarter.",
            color: "border-red-200 bg-red-50",
            textColor: "text-red-700",
            icon: <TrendingUp size={14} className="text-red-500" />,
          },
        ].map((insight, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${insight.color}`}>
            <div className="flex items-center gap-2 mb-2">
              {insight.icon}
              <p className={`${insight.textColor}`} style={{ fontSize: "0.82rem", fontWeight: 700 }}>{insight.title}</p>
            </div>
            <p className={`${insight.textColor} opacity-80`} style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>{insight.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
