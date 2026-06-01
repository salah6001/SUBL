import { useEffect, useState } from "react";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface FeedItem {
  id: number;
  time: string;
  team: string;
  message: string;
  type: "up" | "down" | "neutral";
  ago: number;
}

const initialFeed: FeedItem[] = [
  { id: 1, time: "09:42 AM", team: "HR Team", message: "Stress levels returned to normal after wellness session", type: "down", ago: 2 },
  { id: 2, time: "09:30 AM", team: "Dev Team Alpha", message: "Burnout risk indicator elevated — workload review queued", type: "up", ago: 14 },
  { id: 3, time: "09:18 AM", team: "Marketing", message: "Stress levels stable — no interventions required", type: "neutral", ago: 26 },
  { id: 4, time: "09:05 AM", team: "Customer Support", message: "High stress spike detected in morning shift", type: "up", ago: 39 },
];

const typeConfig = {
  up:      { icon: <TrendingUp size={13} />,   color: "text-red-500 dark:text-red-400",   dot: "bg-red-400" },
  down:    { icon: <TrendingDown size={13} />, color: "text-green-500 dark:text-green-400", dot: "bg-green-400" },
  neutral: { icon: <Minus size={13} />,        color: "text-blue-500 dark:text-blue-400",  dot: "bg-blue-400" },
};

export function LiveActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeed(prev => prev.map(item => ({ ...item, ago: item.ago + 1 })));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Live Activity Feed</h3>
          <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Team-level events in real time</p>
        </div>
        <div className="flex items-center gap-1.5 text-green-500 dark:text-green-400" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
          <Activity size={14} />
          <span>Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {feed.map(item => {
          const cfg = typeConfig[item.type];
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`} />
                <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 mt-1" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-slate-700 dark:text-slate-200 truncate" style={{ fontSize: "0.82rem", fontWeight: 600 }}>{item.team}</p>
                  <span className="text-slate-400 dark:text-slate-500 flex-shrink-0" style={{ fontSize: "0.7rem" }}>{item.ago}m ago</span>
                </div>
                <div className={`flex items-start gap-1.5 ${cfg.color}`}>
                  <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-snug" style={{ fontSize: "0.78rem" }}>{item.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
