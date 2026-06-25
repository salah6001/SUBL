import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastProps extends ToastState {
  onDismiss: () => void;
}

export function Toast({ visible, message, type, onDismiss }: ToastProps) {
  if (!visible) return null;

  const config = {
    success: { icon: <CheckCircle2 size={18} />, bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800", text: "text-green-700 dark:text-green-300", icon_color: "text-green-500 dark:text-green-400" },
    error:   { icon: <XCircle size={18} />,     bg: "bg-red-50 dark:bg-red-900/30",     border: "border-red-200 dark:border-red-800",     text: "text-red-700 dark:text-red-300",     icon_color: "text-red-500 dark:text-red-400" },
    warning: { icon: <AlertTriangle size={18} />, bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", icon_color: "text-amber-500 dark:text-amber-400" },
  };

  const c = config[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl ${c.bg} ${c.border}`}
      style={{ animation: "toastIn 0.3s ease-out", minWidth: "280px", maxWidth: "400px" }}
    >
      <span className={c.icon_color}>{c.icon}</span>
      <p className={`flex-1 ${c.text}`} style={{ fontSize: "0.875rem", fontWeight: 500 }}>{message}</p>
      <button onClick={onDismiss} className={`${c.text} opacity-60 hover:opacity-100 transition-opacity`}>
        <X size={15} />
      </button>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
