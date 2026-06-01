import { useState } from "react";
import {
  Users,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────────────────────

type WellnessStatus = "good" | "moderate" | "at-risk";

interface Team {
  id: number;
  name: string;
  lead: string;
  leadInitials: string;
  members: number;
  status: WellnessStatus;
  score: number;
  trend: "up" | "down" | "flat";
  department: string;
  weeklyHistory: { week: string; stress: number; wellness: number }[];
  radarData: { subject: string; value: number }[];
  stats: {
    avgStress: number;
    peakStress: number;
    interventions: number;
    absenteeism: string;
  };
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const teams: Team[] = [
  {
    id: 1,
    name: "Marketing",
    lead: "Sarah Chen",
    leadInitials: "SC",
    members: 24,
    department: "Marketing",
    status: "good",
    score: 78,
    trend: "up",
    weeklyHistory: [
      { week: "W1", stress: 32, wellness: 74 },
      { week: "W2", stress: 29, wellness: 76 },
      { week: "W3", stress: 34, wellness: 72 },
      { week: "W4", stress: 27, wellness: 78 },
      { week: "W5", stress: 25, wellness: 80 },
      { week: "W6", stress: 28, wellness: 78 },
      { week: "W7", stress: 26, wellness: 80 },
      { week: "W8", stress: 24, wellness: 82 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 80 },
      { subject: "Workload", value: 72 },
      { subject: "Collaboration", value: 88 },
      { subject: "Communication", value: 76 },
      { subject: "Recognition", value: 84 },
    ],
    stats: { avgStress: 28, peakStress: 38, interventions: 1, absenteeism: "2.1%" },
  },
  {
    id: 2,
    name: "Sales",
    lead: "James Wilson",
    leadInitials: "JW",
    members: 38,
    department: "Sales",
    status: "moderate",
    score: 62,
    trend: "flat",
    weeklyHistory: [
      { week: "W1", stress: 45, wellness: 65 },
      { week: "W2", stress: 50, wellness: 60 },
      { week: "W3", stress: 48, wellness: 62 },
      { week: "W4", stress: 52, wellness: 58 },
      { week: "W5", stress: 47, wellness: 63 },
      { week: "W6", stress: 51, wellness: 59 },
      { week: "W7", stress: 49, wellness: 61 },
      { week: "W8", stress: 48, wellness: 62 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 58 },
      { subject: "Workload", value: 52 },
      { subject: "Collaboration", value: 70 },
      { subject: "Communication", value: 65 },
      { subject: "Recognition", value: 60 },
    ],
    stats: { avgStress: 49, peakStress: 64, interventions: 4, absenteeism: "3.8%" },
  },
  {
    id: 3,
    name: "Engineering",
    lead: "Priya Sharma",
    leadInitials: "PS",
    members: 52,
    department: "Engineering",
    status: "at-risk",
    score: 44,
    trend: "down",
    weeklyHistory: [
      { week: "W1", stress: 55, wellness: 50 },
      { week: "W2", stress: 58, wellness: 48 },
      { week: "W3", stress: 62, wellness: 45 },
      { week: "W4", stress: 65, wellness: 42 },
      { week: "W5", stress: 68, wellness: 40 },
      { week: "W6", stress: 66, wellness: 42 },
      { week: "W7", stress: 70, wellness: 38 },
      { week: "W8", stress: 68, wellness: 40 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 38 },
      { subject: "Workload", value: 30 },
      { subject: "Collaboration", value: 55 },
      { subject: "Communication", value: 48 },
      { subject: "Recognition", value: 42 },
    ],
    stats: { avgStress: 64, peakStress: 82, interventions: 9, absenteeism: "5.2%" },
  },
  {
    id: 4,
    name: "Customer Support",
    lead: "Marcus Torres",
    leadInitials: "MT",
    members: 31,
    department: "Support",
    status: "at-risk",
    score: 38,
    trend: "down",
    weeklyHistory: [
      { week: "W1", stress: 58, wellness: 45 },
      { week: "W2", stress: 62, wellness: 42 },
      { week: "W3", stress: 70, wellness: 38 },
      { week: "W4", stress: 74, wellness: 35 },
      { week: "W5", stress: 71, wellness: 37 },
      { week: "W6", stress: 75, wellness: 34 },
      { week: "W7", stress: 72, wellness: 36 },
      { week: "W8", stress: 74, wellness: 35 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 32 },
      { subject: "Workload", value: 28 },
      { subject: "Collaboration", value: 50 },
      { subject: "Communication", value: 44 },
      { subject: "Recognition", value: 38 },
    ],
    stats: { avgStress: 70, peakStress: 88, interventions: 12, absenteeism: "6.4%" },
  },
  {
    id: 5,
    name: "Human Resources",
    lead: "Lisa Park",
    leadInitials: "LP",
    members: 14,
    department: "HR",
    status: "good",
    score: 85,
    trend: "up",
    weeklyHistory: [
      { week: "W1", stress: 22, wellness: 80 },
      { week: "W2", stress: 20, wellness: 82 },
      { week: "W3", stress: 24, wellness: 79 },
      { week: "W4", stress: 19, wellness: 84 },
      { week: "W5", stress: 18, wellness: 85 },
      { week: "W6", stress: 21, wellness: 83 },
      { week: "W7", stress: 17, wellness: 86 },
      { week: "W8", stress: 16, wellness: 87 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 88 },
      { subject: "Workload", value: 82 },
      { subject: "Collaboration", value: 90 },
      { subject: "Communication", value: 86 },
      { subject: "Recognition", value: 88 },
    ],
    stats: { avgStress: 20, peakStress: 28, interventions: 0, absenteeism: "1.2%" },
  },
  {
    id: 6,
    name: "Product",
    lead: "Tom Bradley",
    leadInitials: "TB",
    members: 19,
    department: "Product",
    status: "good",
    score: 80,
    trend: "up",
    weeklyHistory: [
      { week: "W1", stress: 30, wellness: 76 },
      { week: "W2", stress: 28, wellness: 78 },
      { week: "W3", stress: 32, wellness: 74 },
      { week: "W4", stress: 26, wellness: 80 },
      { week: "W5", stress: 24, wellness: 82 },
      { week: "W6", stress: 27, wellness: 79 },
      { week: "W7", stress: 23, wellness: 83 },
      { week: "W8", stress: 22, wellness: 84 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 82 },
      { subject: "Workload", value: 76 },
      { subject: "Collaboration", value: 86 },
      { subject: "Communication", value: 80 },
      { subject: "Recognition", value: 82 },
    ],
    stats: { avgStress: 27, peakStress: 36, interventions: 1, absenteeism: "1.8%" },
  },
  {
    id: 7,
    name: "Finance",
    lead: "Ana Costa",
    leadInitials: "AC",
    members: 16,
    department: "Finance",
    status: "moderate",
    score: 65,
    trend: "flat",
    weeklyHistory: [
      { week: "W1", stress: 42, wellness: 66 },
      { week: "W2", stress: 45, wellness: 63 },
      { week: "W3", stress: 40, wellness: 68 },
      { week: "W4", stress: 44, wellness: 64 },
      { week: "W5", stress: 43, wellness: 65 },
      { week: "W6", stress: 46, wellness: 62 },
      { week: "W7", stress: 41, wellness: 67 },
      { week: "W8", stress: 43, wellness: 65 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 64 },
      { subject: "Workload", value: 58 },
      { subject: "Collaboration", value: 72 },
      { subject: "Communication", value: 68 },
      { subject: "Recognition", value: 62 },
    ],
    stats: { avgStress: 43, peakStress: 58, interventions: 3, absenteeism: "3.2%" },
  },
  {
    id: 8,
    name: "Legal",
    lead: "David Kim",
    leadInitials: "DK",
    members: 8,
    department: "Legal",
    status: "good",
    score: 88,
    trend: "up",
    weeklyHistory: [
      { week: "W1", stress: 18, wellness: 84 },
      { week: "W2", stress: 16, wellness: 86 },
      { week: "W3", stress: 20, wellness: 82 },
      { week: "W4", stress: 15, wellness: 87 },
      { week: "W5", stress: 14, wellness: 88 },
      { week: "W6", stress: 17, wellness: 85 },
      { week: "W7", stress: 13, wellness: 89 },
      { week: "W8", stress: 12, wellness: 90 },
    ],
    radarData: [
      { subject: "Work-Life Balance", value: 90 },
      { subject: "Workload", value: 86 },
      { subject: "Collaboration", value: 88 },
      { subject: "Communication", value: 92 },
      { subject: "Recognition", value: 88 },
    ],
    stats: { avgStress: 16, peakStress: 22, interventions: 0, absenteeism: "0.8%" },
  },
];

// ─── Status configs ──────────────────────────────────────────────────────────

const statusConfig: Record<WellnessStatus, { label: string; bg: string; text: string; bar: string; ring: string }> = {
  good: {
    label: "Healthy",
    bg: "bg-green-50",
    text: "text-green-600",
    bar: "bg-green-500",
    ring: "ring-green-200",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-orange-50",
    text: "text-orange-500",
    bar: "bg-orange-400",
    ring: "ring-orange-200",
  },
  "at-risk": {
    label: "At Risk",
    bg: "bg-red-50",
    text: "text-red-500",
    bar: "bg-red-500",
    ring: "ring-red-200",
  },
};

const trendIcon = {
  up: <TrendingUp size={13} className="text-green-500" />,
  down: <TrendingDown size={13} className="text-red-500" />,
  flat: <Minus size={13} className="text-slate-400" />,
};

const avatarColors = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-teal-600",
  "from-red-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-violet-600",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
  const cfg = statusConfig[team.status];
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left w-full
        hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5
        transition-all duration-200 group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[team.id - 1]} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{team.leadInitials}</span>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
          style={{ fontSize: "0.7rem" }}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.bar}`} />
          {cfg.label}
        </span>
      </div>

      {/* Team name */}
      <p className="text-slate-800 mb-0.5" style={{ fontSize: "0.95rem", fontWeight: 700 }}>{team.name}</p>
      <p className="text-slate-500 mb-4" style={{ fontSize: "0.78rem" }}>Lead: {team.lead}</p>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1.5">
          <span className="text-slate-500" style={{ fontSize: "0.72rem" }}>Wellness Score</span>
          <div className="flex items-center gap-1">
            {trendIcon[team.trend]}
            <span className={cfg.text} style={{ fontSize: "0.72rem", fontWeight: 700 }}>{team.score}/100</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
            style={{ width: `${team.score}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-slate-500" style={{ fontSize: "0.75rem" }}>
          <Users size={13} />
          <span>{team.members} members</span>
        </div>
        <span className="flex items-center gap-1 text-blue-500 group-hover:gap-2 transition-all"
          style={{ fontSize: "0.75rem", fontWeight: 500 }}>
          View details <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-slate-600 mb-1" style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "0.75rem", color: p.color, fontWeight: 500 }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
}

function SlideOver({ team, onClose }: { team: Team; onClose: () => void }) {
  const cfg = statusConfig[team.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-300"
        style={{ animation: "slideInRight 0.3s ease-out" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[team.id - 1]} flex items-center justify-center`}>
              <span className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>{team.leadInitials}</span>
            </div>
            <div>
              <h3 className="text-slate-800" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{team.name} Team</h3>
              <p className="text-slate-500" style={{ fontSize: "0.78rem" }}>Lead: {team.lead} · {team.members} members · {team.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* Status + stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
            {[
              { label: "Wellness Score", value: `${team.score}/100`, color: cfg.text },
              { label: "Avg Stress Level", value: `${team.stats.avgStress}%`, color: "text-slate-700" },
              { label: "Peak Stress", value: `${team.stats.peakStress}%`, color: "text-orange-500" },
              { label: "Interventions", value: `${team.stats.interventions}`, color: team.stats.interventions > 5 ? "text-red-500" : "text-slate-700" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className={`${stat.color}`} style={{ fontSize: "1.3rem", fontWeight: 700 }}>{stat.value}</p>
                <p className="text-slate-500 mt-0.5" style={{ fontSize: "0.7rem" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-2 p-3 rounded-xl border mb-7 ${cfg.bg}`} style={{ borderColor: "transparent" }}>
            <Shield size={16} className={cfg.text} />
            <p className={cfg.text} style={{ fontSize: "0.82rem", fontWeight: 600 }}>
              Team Status: {cfg.label}
            </p>
            <span className="text-slate-500 ml-auto" style={{ fontSize: "0.75rem" }}>
              Absenteeism rate: {team.stats.absenteeism}
            </span>
          </div>

          {/* 8-week stress + wellness trend */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-800" style={{ fontSize: "0.9rem", fontWeight: 600 }}>8-Week Historical Trend</p>
                <p className="text-slate-400" style={{ fontSize: "0.75rem" }}>Aggregated team stress vs. wellness score</p>
              </div>
              <Activity size={16} className="text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={team.weeklyHistory} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="stress" name="Stress" stroke="#ef4444" strokeWidth={2} fill="url(#stressGrad)" dot={false} />
                <Area type="monotone" dataKey="wellness" name="Wellness" stroke="#22c55e" strokeWidth={2} fill="url(#wellnessGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                <span className="w-3 h-0.5 bg-red-400 rounded inline-block" /> Stress
              </span>
              <span className="flex items-center gap-1.5" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                <span className="w-3 h-0.5 bg-green-400 rounded inline-block" /> Wellness
              </span>
            </div>
          </div>

          {/* Radar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-slate-800 mb-4" style={{ fontSize: "0.9rem", fontWeight: 600 }}>Wellness Dimension Analysis</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={team.radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function TeamsView() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [filter, setFilter] = useState<"all" | WellnessStatus>("all");

  const filteredTeams = filter === "all" ? teams : teams.filter(t => t.status === filter);

  const counts = {
    all: teams.length,
    good: teams.filter(t => t.status === "good").length,
    moderate: teams.filter(t => t.status === "moderate").length,
    "at-risk": teams.filter(t => t.status === "at-risk").length,
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            <h2 className="text-slate-800" style={{ fontSize: "1.2rem", fontWeight: 700 }}>Teams & Departments</h2>
          </div>
          <p className="text-slate-500 ml-3.5" style={{ fontSize: "0.82rem" }}>
            {teams.length} teams monitored · Aggregated wellness data only
          </p>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {counts.good} Healthy
          </span>
          <span className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {counts.moderate} Moderate
          </span>
          <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-500 border border-red-100" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {counts["at-risk"]} At Risk
          </span>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["all", "good", "moderate", "at-risk"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl transition-all duration-150 capitalize ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
            }`}
            style={{ fontSize: "0.82rem", fontWeight: filter === f ? 600 : 400 }}
          >
            {f === "all" ? `All Teams (${counts.all})` : f === "at-risk" ? `At Risk (${counts["at-risk"]})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f as WellnessStatus]})`}
          </button>
        ))}
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {filteredTeams.map(team => (
          <TeamCard key={team.id} team={team} onClick={() => setSelectedTeam(team)} />
        ))}
      </div>

      {/* Slide-over panel */}
      {selectedTeam && (
        <SlideOver team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}

      {/* Slide animation keyframe (injected once) */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
