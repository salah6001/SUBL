import { X, AlertTriangle } from "lucide-react";

// ─── Generic Modal Wrapper ────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children, footer, size = "md", icon }: ModalProps) {
  if (!isOpen) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${widths[size]} flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700`}
        onClick={e => e.stopPropagation()}
        style={{ animation: "modalIn 0.2s ease-out" }}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">{icon}</div>}
            <div>
              <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
              {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-0.5" style={{ fontSize: "0.75rem" }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/60 dark:bg-slate-800/30 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── Confirm Danger Dialog ────────────────────────────────────────────────────

interface ConfirmDangerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDanger({ isOpen, onClose, onConfirm, title, description, confirmLabel = "Confirm", loading = false }: ConfirmDangerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
        style={{ animation: "modalIn 0.2s ease-out" }}>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-slate-100" style={{ fontSize: "1rem", fontWeight: 700 }}>{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm shadow-red-200 dark:shadow-red-900/30 disabled:opacity-50"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {loading ? "Processing…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─── Reusable Form Field ──────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-slate-700 dark:text-slate-300 mb-1.5" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 mt-1" style={{ fontSize: "0.72rem" }}>{error}</p>}
    </div>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200
        placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600
        transition-all ${className}`}
      style={{ fontSize: "0.875rem" }}
    />
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200
        focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600
        transition-all appearance-none ${className}`}
      style={{ fontSize: "0.875rem" }}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200
        placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600
        transition-all resize-none ${className}`}
      style={{ fontSize: "0.875rem" }}
    />
  );
}
