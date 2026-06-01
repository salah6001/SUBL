import {
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
} from "lucide-react";

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

export function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Card 1: Company Wellness Score */}
      <KPICard
        title="Company Wellness Score"
        value="82/100"
        subtitle="Updated 5 minutes ago"
        valueColor="text-green-600 dark:text-green-400"
        iconBg="bg-green-50 dark:bg-green-900/30"
        icon={<TrendingUp size={20} className="text-green-500" />}
        badge={
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" style={{ fontSize: "0.72rem", fontWeight: 600 }}>
              <TrendingUp size={11} /> +3.2% this week
            </span>
          </div>
        }
        footer={
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "82%" }} />
          </div>
        }
      />

      {/* Card 2: Teams at Risk */}
      <KPICard
        title="Teams at Risk"
        value="2 Teams"
        subtitle="Require immediate attention"
        valueColor="text-orange-500 dark:text-orange-400"
        iconBg="bg-orange-50 dark:bg-orange-900/30"
        icon={<AlertTriangle size={20} className="text-orange-500" />}
        badge={
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Customer Support</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" style={{ fontSize: "0.72rem", fontWeight: 500 }}>Dev Alpha</span>
          </div>
        }
        footer={
          <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.73rem" }}>
            <span className="text-orange-500 dark:text-orange-400" style={{ fontWeight: 600 }}>Alert</span>: High stress detected in 2 departments
          </p>
        }
      />

      {/* Card 3: Total Monitored Employees */}
      <KPICard
        title="Total Monitored Employees"
        value="1,240"
        subtitle="Across 8 departments"
        valueColor="text-blue-700 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-900/30"
        icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
        badge={
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: "0.78rem" }}>1,198 active right now</span>
          </div>
        }
        footer={
          <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.73rem" }}>
            <span className="text-blue-600 dark:text-blue-400" style={{ fontWeight: 600 }}>+12</span> new employees onboarded this week
          </p>
        }
      />

      {/* Card 4: Overall Stress Level */}
      <KPICard
        title="Overall Stress Level"
        value="Moderate"
        subtitle="Company-wide average: 45%"
        valueColor="text-orange-500 dark:text-orange-400"
        iconBg="bg-orange-50 dark:bg-orange-900/30"
        icon={<Activity size={20} className="text-orange-500" />}
        badge={
          <div className="w-full">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.7rem" }}>Stress Index</span>
              <span className="text-orange-500 dark:text-orange-400" style={{ fontSize: "0.7rem", fontWeight: 600 }}>45%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: "45%", background: "linear-gradient(90deg, #f97316, #fb923c)" }}
              />
            </div>
          </div>
        }
        footer={
          <p className="text-slate-400 dark:text-slate-500" style={{ fontSize: "0.73rem" }}>
            <span className="text-orange-500 dark:text-orange-400" style={{ fontWeight: 600 }}>↑ 4%</span> higher than last month
          </p>
        }
      />
    </div>
  );
}
