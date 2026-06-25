import { Laptop, RefreshCw, ChevronDown, CheckCircle } from "lucide-react";
import type { ClaimableDevice } from "../api/devices";
import { usePrefs } from "../lib/prefs";

interface Props {
  devices: ClaimableDevice[];
  loading: boolean;
  claiming: string | null;
  onClaim: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Compact control on the dashboard: shows which device currently feeds the
 * user and lets them switch to another running ("online") device in one click.
 */
export function DeviceClaimBar({ devices, loading, claiming, onClaim, onRefresh }: Props) {
  const { t } = usePrefs();
  const feeding = devices.find(d => d.claimedByMe);
  const others = devices.filter(d => !d.claimedByMe);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
        <Laptop className="w-4 h-4" />
        <span className="text-xs">{t("claim.dataSource")}</span>
      </div>

      {/* Current feeding device */}
      {feeding ? (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{feeding.deviceName}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium shrink-0 ${
            feeding.isOnline ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${feeding.isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`} />
            {feeding.isOnline ? t("settings.online") : t("settings.offline")}
          </span>
          <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        </div>
      ) : (
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {loading ? t("settings.loadingDevices") : t("claim.noLiveDevice")}
        </span>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {/* Switch to another device */}
        {others.length > 0 && (
          <div className="relative">
            <select
              value=""
              onChange={(e) => e.target.value && onClaim(e.target.value)}
              disabled={claiming !== null}
              className="appearance-none text-xs pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 disabled:opacity-60"
            >
              <option value="">{claiming ? t("settings.claiming") : t("claim.switchDevice")}</option>
              {others.map(d => (
                <option key={d.id} value={d.id}>
                  {d.deviceName} {d.isOnline ? `● ${t("settings.online")}` : `○ ${t("settings.offline")}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
        <button
          onClick={onRefresh}
          title={t("claim.refresh")}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
