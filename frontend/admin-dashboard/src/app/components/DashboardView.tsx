import { AlertTriangle } from "lucide-react";
import { KPICards } from "./KPICards";
import { DepartmentBenchmarkChart } from "./DepartmentBenchmarkChart";
import { StressDistributionChart } from "./StressDistributionChart";
import { AlertsTable } from "./AlertsTable";

interface DashboardViewProps {
  onNavigateAlerts: () => void;
}

export function DashboardView({ onNavigateAlerts }: DashboardViewProps) {
  return (
    <div>
      {/* Page heading */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-1 h-5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
          <h2 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Overview Dashboard
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 ml-3.5" style={{ fontSize: "0.82rem" }}>
          Real-time wellness intelligence — aggregated team data · Strict privacy compliance
        </p>
      </div>

      {/* KPI cards */}
      <section className="mb-8">
        <KPICards />
      </section>

      {/* Charts row */}
      <section className="mb-8">
        <SectionHeading color="bg-blue-400" title="Real-Time Analytics" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DepartmentBenchmarkChart />
          <StressDistributionChart />
        </div>
      </section>

      {/* Alerts + activity feed */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-red-400 inline-block flex-shrink-0" />
            <h3 className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Early Warning System
            </h3>
          </div>
          <button
            onClick={onNavigateAlerts}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/40"
            style={{ fontSize: "0.78rem", fontWeight: 600 }}
          >
            <AlertTriangle size={14} />
            View All Warnings
          </button>
        </div>
        <AlertsTable />
      </section>

      {/* Footer */}
      <footer className="mt-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-slate-400 dark:text-slate-600" style={{ fontSize: "0.72rem" }}>
          Subl AI Admin Console · v2.4.1 · All data is anonymized and aggregated at team level
        </p>
        <p className="text-slate-400 dark:text-slate-600" style={{ fontSize: "0.72rem" }}>
          © 2026 Subl Technologies · GDPR &amp; HIPAA Compliant
        </p>
      </footer>
    </div>
  );
}

function SectionHeading({ color, title }: { color: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={`w-1 h-4 rounded-full ${color} inline-block flex-shrink-0`} />
      <h3 className="text-slate-700 dark:text-slate-200" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
        {title}
      </h3>
    </div>
  );
}
