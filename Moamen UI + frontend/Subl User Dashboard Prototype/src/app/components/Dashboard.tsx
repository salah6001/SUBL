import { useMemo, useState, useEffect } from "react";
import { stressApi } from "../api/stress";
import type { CurrentStress } from "../api/stress";
import { usePrefs } from "../lib/prefs";
import { formatInZone } from "../lib/format";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, Wifi, AlertTriangle,
  ClipboardList, ArrowRight,
} from "lucide-react";
import { DateFilterBar, type DateFilter } from "./DateFilterBar";
import { LiveStream } from "./LiveStream";
import { DeviceClaimBar } from "./DeviceClaimBar";
import { devicesApi, type ClaimableDevice } from "../api/devices";
import { toast } from "sonner";
import { SessionTimeline } from "./SessionTimeline";
import { mlHistoryApi } from "../api/mlHistory";
import type { MlSummary } from "../api/mlHistory";
import type { AssessmentResult } from "./AssessmentModal";

// Stress-level bands (0–100), consistent with the Current Stress KPI colors.
const LEVELS = [
  { key: "Low",      max: 35,  color: "#22c55e" },
  { key: "Moderate", max: 55,  color: "#f59e0b" },
  { key: "High",     max: 80,  color: "#fb923c" },
  { key: "Critical", max: 101, color: "#ef4444" },
];
const classifyLevel = (score: number) => LEVELS.find(l => score < l.max) ?? LEVELS[LEVELS.length - 1];

const formatBucket = (iso: string, gran: string, tz: string): string => {
  const opts: Intl.DateTimeFormatOptions =
    gran === "Hour" || gran === "Minute" ? { hour: "2-digit", minute: "2-digit" }
    : gran === "Day" ? { weekday: "short" }
    : { month: "short", day: "numeric" };
  return formatInZone(iso, tz, opts);
};

type HistPoint = { time: string; score: number; level: string };

const HistTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: HistPoint }[] }) => {
  if (!active || !payload?.length) return null;
  const { time, score, level } = payload[0].payload;
  const color = classifyLevel(score).color;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-0.5">{time}</p>
      <p className="text-sm text-slate-800 dark:text-slate-100">Score: <span style={{ color }}>{score}/100</span></p>
      <p className="text-[11px]" style={{ color }}>{level}</p>
    </div>
  );
};

// Matches HistTooltip's look so the stress-mix pie has the same polished card
// instead of Recharts' default white box.
const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; color: string } }[] }) => {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {name}
      </p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{value} reading{value === 1 ? "" : "s"}</p>
    </div>
  );
};

const HistDot = (props: { cx?: number; cy?: number; payload?: { score: number } }) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill={classifyLevel(payload.score).color} stroke="white" strokeWidth={1.5} />;
};

interface DashboardProps {
  isDark: boolean;
  onStartAssessment: () => void;
  userName: string;
  dateFilter: DateFilter;
  onDateFilterChange: (f: DateFilter) => void;
  currentStress: CurrentStress | null;
  assessmentResult: AssessmentResult | null;
}

const resultColor = (s: number) => (s < 40 ? "text-green-300" : s < 65 ? "text-amber-300" : "text-red-300");
const resultBar   = (s: number) => (s < 40 ? "bg-green-400"  : s < 65 ? "bg-amber-400"  : "bg-red-400");

const dateFilterToRange = (f: DateFilter): { from: string; to: string; granularity: string } => {
  if (typeof f === "string") {
    const now = new Date();
    if (f === "Today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start.toISOString(), to: now.toISOString(), granularity: "Hour" };
    }
    if (f === "This Week") {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString(), granularity: "Day" };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: start.toISOString(), to: now.toISOString(), granularity: "Week" };
  }
  return { from: f.start.toISOString(), to: f.end.toISOString(), granularity: "Day" };
};

export function Dashboard({
  isDark, onStartAssessment, userName, dateFilter, onDateFilterChange, currentStress, assessmentResult,
}: DashboardProps) {
  const { prefs, t } = usePrefs();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greeting.morning") : hour < 17 ? t("greeting.afternoon") : t("greeting.evening");

  const [mlSummary, setMlSummary] = useState<MlSummary | null>(null);
  const [history, setHistory] = useState<HistPoint[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // Claimable monitoring devices — drives the data-source bar and the System KPI.
  const [devices, setDevices] = useState<ClaimableDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadDevices = () => {
    setDevicesLoading(true);
    devicesApi.getClaimable()
      .then(setDevices)
      .catch(() => {})
      .finally(() => setDevicesLoading(false));
  };

  useEffect(() => {
    loadDevices();
    const id = setInterval(loadDevices, 30_000);
    return () => clearInterval(id);
  }, []);

  const claimDevice = (id: string) => {
    setClaiming(id);
    devicesApi.claim(id)
      .then(() => { toast.success("Switched data source"); loadDevices(); })
      .catch(() => toast.error("Failed to switch device"))
      .finally(() => setClaiming(null));
  };

  // The system is "online" when a device feeding this user has a live agent.
  const feedingDevice = devices.find(d => d.claimedByMe);
  const systemOnline = !!feedingDevice?.isOnline;

  const filterLabel = typeof dateFilter === "string"
    ? (dateFilter === "Today" ? t("filter.today")
      : dateFilter === "This Week" ? t("filter.thisWeek")
      : dateFilter === "This Month" ? t("filter.thisMonth") : dateFilter)
    : t("common.customRange");

  // Historical stress readings (produced by the agent→backend→ML pipeline),
  // bucketed for the selected date filter.
  useEffect(() => {
    const { from, to, granularity } = dateFilterToRange(dateFilter);
    setHistLoading(true);
    stressApi.getTrends(from, to, granularity)
      .then(data => setHistory(
        data.map(p => {
          const score = Math.round(p.averageScore * 100);
          return { time: formatBucket(p.bucketStart, granularity, prefs.timezone), score, level: classifyLevel(score).key };
        })
      ))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [dateFilter, prefs.timezone]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(p => { counts[p.level] = (counts[p.level] ?? 0) + 1; });
    return LEVELS.filter(l => counts[l.key]).map(l => ({ name: l.key, value: counts[l.key], color: l.color }));
  }, [history]);

  // Average stress for *today*, computed from real trend readings (not mock).
  const [todayAvg, setTodayAvg] = useState<number | null>(null);
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    stressApi.getTrends(start.toISOString(), now.toISOString(), "Hour")
      .then(data => {
        if (!data.length) { setTodayAvg(null); return; }
        const avg = data.reduce((s, p) => s + p.averageScore, 0) / data.length;
        setTodayAvg(Math.round(avg * 100));
      })
      .catch(() => setTodayAvg(null));
  }, []);

  const avgStress     = todayAvg;
  const stressColor   = avgStress == null ? "text-slate-400" : avgStress < 40 ? "text-green-500" : avgStress < 65 ? "text-amber-500" : "text-red-500";
  const stressBarCol  = avgStress == null ? "bg-slate-300 dark:bg-slate-600" : avgStress < 40 ? "bg-green-500"  : avgStress < 65 ? "bg-amber-500"  : "bg-red-500";

  useEffect(() => {
    mlHistoryApi.get(50)
      .then(({ summary }) => setMlSummary(summary))
      .catch(() => {});
  }, []);

  const levelColor = (l: string | null) =>
    l === "Critical" ? "text-red-500" : l === "High" ? "text-orange-500" :
    l === "Moderate" ? "text-amber-500" : "text-green-500";

  const levelBar = (l: string | null) =>
    l === "Critical" ? "bg-red-500" : l === "High" ? "bg-orange-500" :
    l === "Moderate" ? "bg-amber-500" : "bg-green-500";

  const timeAgo = (at: string | null) => {
    if (!at) return t("time.unknown");
    const diff = Date.now() - new Date(at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("time.justNow");
    if (mins < 60) return `${mins}${t("time.minAgo")}`;
    return `${Math.floor(mins / 60)}${t("time.hourAgo")}`;
  };

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
              <p className="text-blue-200 text-xs mb-1.5">{formatInZone(new Date(), prefs.timezone, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <h2 className="text-2xl text-white mb-2">{greeting}, {userName.split(" ")[0]}! 👋</h2>
              <p className="text-blue-200 text-sm mb-5 leading-relaxed max-w-xs">
                {assessmentResult
                  ? `${t("dash.assessmentResultPre")} ${t(`level.${assessmentResult.level}`)} — ${assessmentResult.score}/100.`
                  : t("dash.assessmentPrompt")}
              </p>
              <button
                onClick={onStartAssessment}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm text-white border border-white/20 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                {t("dash.startAssessment")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[136px]">
              {assessmentResult ? (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200">{t("dash.lastAssessment")}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl text-white leading-none">{assessmentResult.score}</span>
                    <span className="text-blue-200 text-xs pb-1">/100</span>
                  </div>
                  <span className={`text-sm ${resultColor(assessmentResult.score)}`}>{t(`level.${assessmentResult.level}`)}</span>
                  {assessmentResult.takenAt && (
                    <span className="text-[10px] text-blue-200/80">
                      {formatInZone(assessmentResult.takenAt, prefs.timezone, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${resultBar(assessmentResult.score)}`} style={{ width: `${assessmentResult.score}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <ClipboardList className="w-7 h-7 text-blue-200" />
                  <p className="text-[11px] text-blue-200 text-center leading-snug">{t("dash.noAssessmentYet")}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2×2 */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-4">

          {/* KPI 1: Avg Stress Score */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("dash.avgStressToday")}</p>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className={`text-2xl ${stressColor}`}>{avgStress ?? "—"}</span>
              <span className="text-slate-400 text-xs pb-1">/100</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${stressBarCol} rounded-full transition-all duration-700`} style={{ width: `${avgStress ?? 0}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {avgStress == null ? t("dash.noReadingsToday") : t("dash.avgOfToday")}
              </span>
            </div>
          </div>

          {/* KPI 2: Current Stress Gauge */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("dash.currentStress")}</p>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            {currentStress?.hasData ? (
              <>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-2xl ${levelColor(currentStress.level)}`}>
                    {Math.round((currentStress.score ?? 0) * 100)}
                  </span>
                  <span className="text-slate-400 text-xs pb-1">/100</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${levelBar(currentStress.level)}`}
                    style={{ width: `${(currentStress.score ?? 0) * 100}%` }}
                  />
                </div>
                <div className="mt-auto pt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  {t(`level.${currentStress.level}`)} · {t("dash.updated")} {timeAgo(currentStress.at)}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-auto">{t("dash.noDataYet")}</p>
            )}
          </div>

          {/* KPI 3: Hidden Stress Events */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("dash.hiddenStress")}</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-end gap-1 mb-2">
              <span className={`text-2xl ${(mlSummary?.hidden_stress_count ?? 0) > 0 ? "text-amber-500" : "text-green-500"}`}>
                {mlSummary?.hidden_stress_count ?? "—"}
              </span>
              <span className="text-slate-400 text-xs pb-1">{t("dash.events")}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-auto">
              {t("dash.of")} {mlSummary?.total_sessions ?? 0} {t("dash.sessions")}
            </p>
          </div>

          {/* KPI 4: System Status — reflects whether a live agent feeds you */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("dash.system")}</p>
              <Wifi className={`w-4 h-4 ${systemOnline ? "text-green-500" : "text-slate-400"}`} />
            </div>
            <div className="flex items-center gap-2 mb-auto">
              <span className={`w-2.5 h-2.5 rounded-full ${systemOnline ? "bg-green-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
              <span className="text-slate-800 dark:text-slate-100">{systemOnline ? t("dash.active") : t("dash.offline")}</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {systemOnline
                  ? `${t("dash.agentLive")} · ${feedingDevice?.deviceName ?? ""}`
                  : feedingDevice
                  ? t("dash.agentNotReporting")
                  : t("dash.noDeviceClaimed")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data source: which device feeds this dashboard ──────────────────────── */}
      <DeviceClaimBar
        devices={devices}
        loading={devicesLoading}
        claiming={claiming}
        onClaim={claimDevice}
        onRefresh={loadDevices}
      />

      {/* ── Live Stream (real-time, WebSocket) ──────────────────────────────────── */}
      <LiveStream isDark={isDark} />

      {/* ── Date Filter — controls the historical graphs below ──────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
        <DateFilterBar filter={dateFilter} onChange={onDateFilterChange} />
      </div>

      {/* ── Historical stress (filtered) + level distribution pie ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtered historical line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm text-slate-800 dark:text-slate-200">{t("dash.keystrokeHistory")}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {t("dash.stressOverTime")} · {filterLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
              {LEVELS.map(l => (
                <span key={l.key} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />{t(`level.${l.key}`)}
                </span>
              ))}
            </div>
          </div>
          {histLoading ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">{t("common.loading")}</div>
          ) : history.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              {t("dash.noReadingsPeriod")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <ReferenceArea y1={80} y2={100} fill="#ef4444" fillOpacity={0.05} />
                <ReferenceArea y1={55} y2={80}  fill="#fb923c" fillOpacity={0.05} />
                <ReferenceArea y1={35} y2={55}  fill="#f59e0b" fillOpacity={0.05} />
                <ReferenceArea y1={0}  y2={35}  fill="#22c55e" fillOpacity={0.05} />
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="time" tick={{ fill: isDark ? "#475569" : "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: isDark ? "#475569" : "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<HistTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5}
                  dot={<HistDot />} activeDot={{ r: 6, fill: "#6366f1", stroke: "white", strokeWidth: 2 }}
                  isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stress-level distribution pie (across the filtered history) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm text-slate-800 dark:text-slate-200">{t("dash.stressLevelMix")}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t("dash.across")} {filterLabel}</p>
          </div>
          {histLoading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">{t("common.loading")}</div>
          ) : pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">{t("common.noData")}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => {
                  const total = pieData.reduce((s, x) => s + x.value, 0);
                  const pct = total ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{t(`level.${d.name}`)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Session Timeline ──────────────────────────────────────────────── */}
      <SessionTimeline dateFilter={dateFilterToRange(dateFilter)} />

    </div>
  );
}
