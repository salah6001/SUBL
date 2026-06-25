import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { usePrefs } from "../lib/prefs";

const MAX_POINTS = 60;
const WS_BASE = (import.meta.env.VITE_API_WS_URL as string | undefined) ?? "ws://localhost:5000";

interface WsPayload {
  score: number;
  level: string;
  confidence: number;
  at: string;
}

export function LiveStream({ isDark }: { isDark: boolean }) {
  const { t } = usePrefs();
  const [points, setPoints] = useState<{ t: number; score: number }[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [latest, setLatest] = useState<WsPayload | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryDelay = useRef(1000);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");

      const token = localStorage.getItem("subl_user_token");
      const url = token
        ? `${WS_BASE}/stress/stream?token=${encodeURIComponent(token)}`
        : `${WS_BASE}/stress/stream`;

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) { ws.close(); return; }
        setStatus("live");
        retryDelay.current = 1000;
      };

      ws.onmessage = (e) => {
        const d: WsPayload = JSON.parse(e.data);
        setLatest(d);
        setPoints(p => [
          ...p.slice(-(MAX_POINTS - 1)),
          { t: new Date(d.at).getTime(), score: d.score },
        ]);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setStatus("offline");
        retryTimer.current = setTimeout(() => {
          retryDelay.current = Math.min(retryDelay.current * 2, 30000);
          connect();
        }, retryDelay.current);
      };

      ws.onerror = () => {
        setStatus("offline");
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      wsRef.current?.close();
    };
  }, []);

  const lineColor =
    latest?.level === "Critical" ? "#ef4444" :
    latest?.level === "High"     ? "#f59e0b" :
    latest?.level === "Moderate" ? "#eab308" : "#22c55e";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm text-slate-800 dark:text-slate-200">{t("live.heading")}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {t("live.realtime")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          {status === "live"
            ? <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-green-600 dark:text-green-400">{t("live.live")}</span></>
            : status === "connecting"
            ? <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /><span className="text-yellow-500">{t("live.connecting")}</span></>
            : <><span className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-slate-400">{t("settings.offline")}</span></>
          }
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={points} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5} />
          <ReferenceLine y={30} stroke="#eab308" strokeDasharray="4 3" strokeOpacity={0.5} />
          <XAxis dataKey="t" hide />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: isDark ? "#475569" : "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={22}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {latest && (
        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{t("live.score")}: <strong className="text-slate-700 dark:text-slate-200">{latest.score.toFixed(1)}</strong></span>
          <span>{t("live.level")}: <strong className="text-slate-700 dark:text-slate-200">{t(`level.${latest.level}`)}</strong></span>
          <span>{t("live.confidence")}: <strong className="text-slate-700 dark:text-slate-200">{(latest.confidence * 100).toFixed(0)}%</strong></span>
        </div>
      )}
    </div>
  );
}
