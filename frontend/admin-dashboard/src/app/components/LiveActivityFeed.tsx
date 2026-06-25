import { useEffect, useState } from "react";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { fetchActivityFeed, type ActivityItem } from "../lib/admin/activityApi";
import { ApiError } from "../lib/apiClient";

type FeedType = "up" | "down" | "neutral";

interface FeedItem {
  id: string;
  team: string;
  message: string;
  type: FeedType;
  ago: string;
}

const typeConfig: Record<FeedType, { icon: React.ReactNode; color: string; dot: string }> = {
  up:      { icon: <TrendingUp size={13} />,   color: "text-red-500 dark:text-red-400",   dot: "bg-red-400" },
  down:    { icon: <TrendingDown size={13} />, color: "text-green-500 dark:text-green-400", dot: "bg-green-400" },
  neutral: { icon: <Minus size={13} />,        color: "text-blue-500 dark:text-blue-400",  dot: "bg-blue-400" },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function typeForAction(action: string): FeedType {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("delete") || a.includes("suspend") || a.includes("error") || a.includes("revoke")) {
    return "up";
  }
  if (a.includes("login") || a.includes("activat") || a.includes("created") || a.includes("resolved")) {
    return "down";
  }
  return "neutral";
}

function toFeedItem(item: ActivityItem): FeedItem {
  return {
    id: item.id,
    team: item.userEmail ?? item.entityType ?? "System",
    message: item.description ?? item.actionName,
    type: typeForAction(item.actionName),
    ago: relativeTime(item.timestamp),
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 600 }}>Live Activity Feed</h3>
          <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>Recent system events</p>
        </div>
        <div className="flex items-center gap-1.5 text-green-500 dark:text-green-400" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
          <Activity size={14} />
          <span>Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>
      {children}
    </div>
  );
}

export function LiveActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetchActivityFeed()
        .then(items => { if (!cancelled) setFeed(items.map(toFeedItem)); })
        .catch(err => { if (!cancelled) setError(err instanceof ApiError ? err.displayMessage : "Couldn't load activity."); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    load();
    // Poll every 60s to keep the feed fresh (SignalR can replace this later).
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return <Shell><div className="py-10 flex justify-center"><span className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div></Shell>;
  }
  if (error) {
    return <Shell><p className="py-8 text-center text-red-500" style={{ fontSize: "0.82rem" }}>{error}</p></Shell>;
  }
  if (feed.length === 0) {
    return <Shell><p className="py-8 text-center text-slate-400 dark:text-slate-500" style={{ fontSize: "0.82rem" }}>No recent activity.</p></Shell>;
  }

  return (
    <Shell>
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
                  <span className="text-slate-400 dark:text-slate-500 flex-shrink-0" style={{ fontSize: "0.7rem" }}>{item.ago}</span>
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
    </Shell>
  );
}
