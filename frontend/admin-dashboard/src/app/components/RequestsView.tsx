import { useEffect, useState, useCallback } from "react";
import { Inbox, Check, X, Copy, Mail, Building2, Clock, RefreshCw } from "lucide-react";
import {
  fetchWorkspaceRequests,
  approveWorkspaceRequest,
  rejectWorkspaceRequest,
  type WorkspaceRequest,
  type WorkspaceRequestStatus,
} from "../lib/admin/workspaceRequestsApi";
import { useI18n } from "../lib/i18n";

interface RequestsViewProps {
  showToast: (message: string, type?: "success" | "error") => void;
}

type Filter = "Pending" | "Approved" | "Rejected" | "All";

const STATUS_STYLES: Record<WorkspaceRequestStatus, string> = {
  Pending: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  Approved: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  Rejected: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
};

export function RequestsView({ showToast }: RequestsViewProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("Pending");
  const [items, setItems] = useState<WorkspaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Holds the freshly created admin credentials after an approval.
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchWorkspaceRequests(filter === "All" ? undefined : filter)
      .then(setItems)
      .catch(() => showToast(t("requests.loadError"), "error"))
      .finally(() => setLoading(false));
  }, [filter, showToast, t]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(req: WorkspaceRequest) {
    setBusyId(req.id);
    try {
      const result = await approveWorkspaceRequest(req.id);
      setCredentials({ email: result.email, password: result.temporaryPassword });
      showToast(t("requests.approved"), "success");
      load();
    } catch {
      showToast(t("requests.actionError"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req: WorkspaceRequest) {
    const note = window.prompt(t("requests.rejectPrompt")) ?? undefined;
    setBusyId(req.id);
    try {
      await rejectWorkspaceRequest(req.id, note);
      showToast(t("requests.rejected"), "success");
      load();
    } catch {
      showToast(t("requests.actionError"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox size={20} className="text-blue-600" />
            {t("requests.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("requests.subtitle")}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={14} /> {t("requests.refresh")}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["Pending", "Approved", "Rejected", "All"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300"
            }`}
          >
            {t(`requests.filter.${f.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw size={22} className="mx-auto mb-3 animate-spin opacity-50" />
          <p className="text-sm">{t("requests.loading")}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Inbox size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t("requests.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">{req.companyName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${STATUS_STYLES[req.status]}`}>
                      {t(`requests.filter.${req.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> {req.contactName} · {req.email}</p>
                    <p className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} /> {new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.message && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">"{req.message}"</p>
                    )}
                    {req.reviewNote && (
                      <p className="text-xs text-slate-400 mt-1">{t("requests.note")}: {req.reviewNote}</p>
                    )}
                  </div>
                </div>

                {req.status === "Pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busyId === req.id}
                      onClick={() => handleApprove(req)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check size={14} /> {t("requests.approve")}
                    </button>
                    <button
                      disabled={busyId === req.id}
                      onClick={() => handleReject(req)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      <X size={14} /> {t("requests.reject")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credentials modal shown after approval */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCredentials(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Check size={18} className="text-green-600" /> {t("requests.credsTitle")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("requests.credsSubtitle")}</p>
            <div className="mt-4 space-y-2">
              <CredRow label={t("requests.credsEmail")} value={credentials.email} />
              <CredRow label={t("requests.credsPassword")} value={credentials.password} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${credentials.email} / ${credentials.password}`);
                  showToast(t("requests.copied"), "success");
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy size={14} /> {t("requests.copyAll")}
              </button>
              <button
                onClick={() => setCredentials(null)}
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {t("requests.done")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <code className="text-sm text-slate-900 dark:text-slate-100 font-mono">{value}</code>
    </div>
  );
}
