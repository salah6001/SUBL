import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import {
  Activity, Zap, CheckSquare, Wifi,
  TrendingDown, TrendingUp, Minus,
  ClipboardList, ArrowRight, Smile,
} from "lucide-react";
import { DateFilterBar, type DateFilter } from "./DateFilterBar";
import {
  getStressCurveData, getEmotionData, getBiometricData, KPI_PERIODS,
} from "../data/mockData";

interface DashboardProps {
  isDark: boolean;
  onStartAssessment: () => void;
  userName: string;
  dateFilter: DateFilter;
  onDateFilterChange: (f: DateFilter) => void;
  habitCompletionRate: number;
}

const TOOLTIP_STYLE = (dark: boolean) => ({
  backgroundColor: dark ? "#0f172a" : "#ffffff",
  border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`,
  borderRadius: "10px",
  color: dark ? "#e2e8f0" : "#1e293b",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
});
const AXIS  = (dark: boolean) => dark ? "#475569" : "#94a3b8";
const GRID  = (dark: boolean) => dark ? "#1e293b" : "#f1f5f9";

const zoneColor = (score: number) =>
  score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : score >= 30 ? "#3b82f6" : "#22c55e";

const StressDot = (props: { cx?: number; cy?: number; payload?: { score: number } }) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return <circle cx={cx} cy={cy} r={4} fill={zoneColor(payload.score)} stroke="white" strokeWidth={2} />;
};

const StressTooltip = ({
  active, payload,
}: {
  active?: boolean;
  payload?: { payload: { time: string; score: number; zone: string } }[];
}) => {
  if (!active || !payload?.length) return null;
  const { time, score, zone } = payload[0].payload;
  const color = zoneColor(score);
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">{time}</p>
      <p className="text-sm text-slate-800 dark:text-slate-100">
        Score: <span style={{ color }}>{score}/100</span>
      </p>
      <p className="text-[11px]" style={{ color }}>{zone}</p>
    </div>
  );
};

const BiometricTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: p.dataKey === "wpm" ? "#3b82f6" : "#f97316" }} />
          <span className="text-slate-700 dark:text-slate-300">
            {p.dataKey === "wpm" ? `${p.value} WPM` : `${p.value}% error rate`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function Dashboard({
  isDark, onStartAssessment, userName, dateFilter, onDateFilterChange, habitCompletionRate,
}: DashboardProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stressCurve = useMemo(() => getStressCurveData(dateFilter), [dateFilter]);
  const emotions    = useMemo(() => getEmotionData(dateFilter),     [dateFilter]);
  const biometric   = useMemo(() => getBiometricData(dateFilter),   [dateFilter]);

  const kpi = useMemo(() => {
    const key = typeof dateFilter === "string" ? dateFilter : "Today";
    return KPI_PERIODS[key] ?? KPI_PERIODS["Today"];
  }, [dateFilter]);

  const avgStress     = parseInt(kpi.avgStress, 10);
  const stressColor   = avgStress < 40 ? "text-green-500" : avgStress < 65 ? "text-amber-500" : "text-red-500";
  const stressBarCol  = avgStress < 40 ? "bg-green-500"  : avgStress < 65 ? "bg-amber-500"  : "bg-red-500";

  const dominantEmotion = emotions.reduce((a, b) => (a.value > b.value ? a : b));
  const filterLabel     = typeof dateFilter === "string" ? dateFilter : "Custom range";

  return (
    <div className="space-y-6">

      {/* ── Hero Banner + 4 KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Greeting banner */}
        <div className="xl:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 right-10 w-60 h-60 rounded-full bg-white/4 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-blue-200 text-xs mb-1.5">Monday, May 25, 2026</p>
              <h2 className="text-2xl text-white mb-2">{greeting}, {userName.split(" ")[0]}! 👋</h2>
              <p className="text-blue-200 text-sm mb-5 leading-relaxed max-w-xs">
                Your stress is in a healthy range today. Typing fluency is up 14 WPM vs. last week. Keep it up!
              </p>
              <button
                onClick={onStartAssessment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm text-white border border-white/20 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Start Assessment
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[136px]">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center">
                <Smile className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-300 text-sm">Normal</p>
              {[
                { l: "Calm",       p: 72, c: "bg-blue-400"   },
                { l: "Focus",      p: 58, c: "bg-indigo-400" },
                { l: "Low Stress", p: 88, c: "bg-green-400"  },
              ].map(({ l, p, c }) => (
                <div key={l} className="w-full">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[9px] text-blue-200">{l}</span>
                    <span className="text-[9px] text-blue-200">{p}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${c} rounded-full`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI 2×2 */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-4">

          {/* KPI 1: Avg Stress Score */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Avg Stress</p>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className={`text-2xl ${stressColor}`}>{kpi.avgStress}</span>
              <span className="text-slate-400 text-xs pb-1">/100</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${stressBarCol} rounded-full transition-all duration-700`} style={{ width: `${avgStress}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <TrendingDown className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">−8 pts vs last week</span>
            </div>
          </div>

          {/* KPI 2: Deep Focus Time */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Deep Focus</p>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-end gap-1 mb-auto">
              <span className="text-2xl text-slate-800 dark:text-slate-100">{kpi.focusHrs}</span>
              <span className="text-slate-400 text-xs pb-1">hrs</span>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">+0.8 hrs vs avg</span>
            </div>
          </div>

          {/* KPI 3: Habits Completed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Habits Done</p>
              <CheckSquare className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-2xl text-slate-800 dark:text-slate-100">{habitCompletionRate}</span>
              <span className="text-slate-400 text-xs pb-1">%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${habitCompletionRate}%` }}
              />
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <Minus className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Daily goal progress</span>
            </div>
          </div>

          {/* KPI 4: System Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">System</p>
              <Wifi className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2 mb-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-800 dark:text-slate-100">Active</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">All sensors online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Date Filter Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
        <DateFilterBar filter={dateFilter} onChange={onDateFilterChange} />
      </div>

      {/* ── Charts Row: Stress Curve + Emotion Donut ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart 1: Today's Stress Curve (Area) — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm text-slate-800 dark:text-slate-200">Stress Curve</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Score over time · {filterLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
              {[
                ["Calm",       "#22c55e"],
                ["Focused",    "#3b82f6"],
                ["Mild Stress","#f59e0b"],
                ["High Stress","#ef4444"],
              ].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stressCurve} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="stressAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.55} />
                  <stop offset="30%"  stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="60%"  stopColor="#3b82f6" stopOpacity={0.20} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <ReferenceArea key="ra-high"  y1={70}  y2={100} fill="#ef4444" fillOpacity={0.05} />
              <ReferenceArea key="ra-mild"  y1={50}  y2={70}  fill="#f59e0b" fillOpacity={0.05} />
              <ReferenceArea key="ra-focus" y1={30}  y2={50}  fill="#3b82f6" fillOpacity={0.05} />
              <ReferenceArea key="ra-calm"  y1={0}   y2={30}  fill="#22c55e" fillOpacity={0.05} />
              <CartesianGrid key="grid"     strokeDasharray="3 3" stroke={GRID(isDark)} vertical={false} />
              <XAxis         key="xaxis"    dataKey="time" tick={{ fill: AXIS(isDark), fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis         key="yaxis"    domain={[0, 100]} tick={{ fill: AXIS(isDark), fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip       key="tooltip"  content={<StressTooltip />} />
              <Area
                key="area"
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#stressAreaFill)"
                dot={<StressDot />}
                activeDot={{ r: 6, fill: "#6366f1", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Emotional Time Distribution (Donut) — 1/3 width */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm text-slate-800 dark:text-slate-200">Emotional Distribution</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Time allocation · {filterLabel}
            </p>
          </div>

          <div className="relative flex items-center justify-center flex-1">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  key="pie"
                  data={emotions}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90} endAngle={-270}
                >
                  {emotions.map((entry) => (
                    <Cell key={`ec-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  key="tooltip"
                  contentStyle={TOOLTIP_STYLE(isDark)}
                  formatter={(v: number, n: string) => [`${v}%`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl text-slate-800 dark:text-slate-100">{dominantEmotion.value}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight max-w-[64px]">
                {dominantEmotion.name}
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {emotions.map(({ name, value, color }) => (
              <div key={name}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{value}%</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart 3: Biometric Correlation (Line Chart) ─────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm text-slate-800 dark:text-slate-200">Biometric Correlation</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Typing WPM vs. Error Rate — multimodal AI stress signal · {filterLabel}
            </p>
          </div>
          <div className="flex gap-5 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded-full bg-blue-500 inline-block" />
              Typing Speed (WPM)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0 border-t-2 border-dashed border-orange-400 inline-block" />
              Error Rate (%)
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={biometric} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid key="grid"       strokeDasharray="3 3" stroke={GRID(isDark)} vertical={false} />
            <XAxis         key="xaxis"      dataKey="time" tick={{ fill: AXIS(isDark), fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis         key="yaxis-left"  yAxisId="left"  domain={[30, 100]} tick={{ fill: AXIS(isDark), fontSize: 10 }} axisLine={false} tickLine={false} width={26} />
            <YAxis         key="yaxis-right" yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: AXIS(isDark), fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip       key="tooltip"    content={<BiometricTooltip />} />
            <Line
              key="line-wpm"
              yAxisId="left"
              type="monotone"
              dataKey="wpm"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              key="line-err"
              yAxisId="right"
              type="monotone"
              dataKey="errorRate"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center italic">
          Inverse correlation: higher WPM + lower error rate = lower stress. Subl AI detects behavioral stress
          signatures from these real-time biometric patterns.
        </p>
      </div>
    </div>
  );
}
