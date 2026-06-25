import { useState, useEffect } from "react";
import { Clock, Activity, ChevronDown } from "lucide-react";
import { stressApi } from "../api/stress";
import type { StressSession } from "../api/stress";
import { usePrefs } from "../lib/prefs";

interface SessionTimelineProps {
  dateFilter: { from: string; to: string };
}

const scoreToLevel = (score: number) =>
  score >= 0.85 ? "Critical" : score >= 0.60 ? "High" : score >= 0.30 ? "Moderate" : "Low";

const levelColor = (l: string) =>
  l === "Critical" ? "text-red-500" : l === "High" ? "text-orange-500" :
  l === "Moderate" ? "text-amber-500" : "text-green-500";

const levelBg = (l: string) =>
  l === "Critical" || l === "High" ? "bg-red-500" :
  l === "Moderate" ? "bg-amber-500" : "bg-green-500";

export function SessionTimeline({ dateFilter }: SessionTimelineProps) {
  const { formatInZone } = usePrefs();
  const [sessions, setSessions] = useState<StressSession[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    stressApi.getSessions(dateFilter.from, dateFilter.to)
      .then(r => setSessions(r.items))
      .catch(() => {});
  }, [dateFilter.from, dateFilter.to]);

  if (sessions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Session Timeline</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2 mt-4">
            {sessions.map((s, i) => {
              const level = scoreToLevel(s.averageStressScore);
              const dur = Math.round(s.durationSeconds / 60);
              return (
                <div key={s.id} className="flex items-start gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${levelBg(level)} mt-1`} />
                    {i < sessions.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 min-h-[24px]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${levelColor(level)}`}>{level}</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-400">{dur}m duration</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatInZone(s.startedAt, { hour: "2-digit", minute: "2-digit" })}</span>
                      <Activity className="w-3 h-3" />
                      <span>
                        Avg {Math.round(s.averageStressScore * 100)} · Peak {Math.round(s.peakStressScore * 100)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${levelBg(level)}`}
                        style={{ width: `${s.averageStressScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
