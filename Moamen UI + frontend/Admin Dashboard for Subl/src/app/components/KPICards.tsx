import { useEffect, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
} from "lucide-react";
import { fetchKpis, stressLabel, type AdminKpis } from "../lib/admin/kpisApi";
import { ApiError } from "../lib/apiClient";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
}

function KPICard({ title, value, subtitle, icon, iconBg, valueColor, badge, footer }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>{title}</p>
          <p className={`${valueColor}`} style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
          {subtitle && (
            <p className="text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: "0.78rem" }}>{subtitle}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {badge && <div>{badge}</div>}
      {footer && <div className="pt-1 border-t border-slate-50 dark:border-slate-800">{footer}</div>}
    </div>
  );
}

function KPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse h-[180px]">
      <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-3" />
      <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
  );
}

export function KPICards() {
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchKpis()
      .then(data => { if (!cancelled) setKpis(data); })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.displayMessage : "Couldn't load KPIs.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map(i => <KPICardSkeleton key={i} />)}
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <p className="text-red-500" style={{ fontSize: "0.875rem" }}>{error ?? "No KPI data available."}</p>
      </div>
    );
  }

  const wellness = Math.round(kpis.wellnessScore);
  const stressPct = Math.round(kpis.overallStressPercent);
  const stress = stressLabel(kpis.overallStressPercent);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Card 1: Company Wellness Score */}
      <KPICard
        title="Company Wellness Score"
        value={`${wellness}/100`}
        valueColor="text-green-600 dark:text-green-400"
        iconBg="bg-green-50 dark:bg-green-900/30"
        icon={<TrendingUp size={20} className="text-green-500" />}
        footer={
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${wellness}%` }} />
          </div>
        }
      />

      {/* Card 2: Teams at Risk */}
      <KPICard
        title="Teams at Risk"
        value={`${kpis.teamsAtRisk} ${kpis.teamsAtRisk === 1 ? "Team" : "Teams"}`}
        subtitle="Departments above 60% average stress"
        valueColor="text-orange-500 dark:text-orange-400"
        iconBg="bg-orange-50 dark:bg-orange-900/30"
        icon={<AlertTriangle size={20} className="text-orange-500" />}
      />

      {/* Card 3: Total Monitored Employees */}
      <KPICard
        title="Total Monitored Employees"
        value={kpis.totalEmployees.toLocaleString()}
        subtitle="Across all departments"
        valueColor="text-blue-700 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-900/30"
        icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
      />

      {/* Card 4: Overall Stress Level */}
      <KPICard
        title="Overall Stress Level"
        value={stress}
        subtitle={`Company-wide average: ${stressPct}%`}
        valueColor="text-orange-500 dark:text-orange-400"
        iconBg="bg-orange-50 dark:bg-orange-900/30"
        icon={<Activity size={20} className="text-orange-500" />}
        badge={
          <div className="w-full">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>Stress Index</span>
              <span className="text-orange-500 dark:text-orange-400" style={{ fontSize: "0.7rem", fontWeight: 600 }}>{stressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${stressPct}%`, background: "linear-gradient(90deg, #f97316, #fb923c)" }}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
