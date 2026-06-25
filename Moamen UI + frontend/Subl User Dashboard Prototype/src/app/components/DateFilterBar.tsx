import { useState, useRef, useEffect } from "react";
import { Calendar, X, ChevronDown } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarRangePicker } from "./CalendarRangePicker";
import { usePrefs } from "../lib/prefs";

// Maps a quick-option value (kept in English for logic) to its i18n key.
const QUICK_KEY: Record<string, string> = {
  "Today": "filter.today",
  "This Week": "filter.thisWeek",
  "This Month": "filter.thisMonth",
  "This Year": "filter.thisYear",
};

export type QuickOption = "Today" | "This Week" | "This Month" | "This Year";
export type DateFilter = QuickOption | { start: Date; end: Date };

interface DateFilterBarProps {
  filter: DateFilter;
  onChange: (f: DateFilter) => void;
}

const QUICK: QuickOption[] = ["Today", "This Week", "This Month", "This Year"];

function formatFilterLabel(f: DateFilter, t: (k: string) => string): string {
  if (typeof f === "string") return `${t(QUICK_KEY[f] ?? f)} ${t("filter.dataSuffix")}`;
  const days = differenceInCalendarDays(f.end, f.start) + 1;
  return `${format(f.start, "MMM d")} – ${format(f.end, "MMM d, yyyy")} (${days}d)`;
}

export function DateFilterBar({ filter, onChange }: DateFilterBarProps) {
  const { t } = usePrefs();
  const [calOpen, setCalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isCustom = typeof filter !== "string";
  const activeQuick = typeof filter === "string" ? filter : null;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const clearCustom = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("Today");
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Segmented quick-select */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
        {QUICK.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setCalOpen(false); }}
            className={[
              "px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150",
              activeQuick === opt
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
            ].join(" ")}
          >
            {t(QUICK_KEY[opt] ?? opt)}
          </button>
        ))}
      </div>

      {/* Visual separator */}
      <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700" />

      {/* Custom range calendar picker */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setCalOpen((o) => !o)}
          className={[
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all border",
            isCustom
              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
              : calOpen
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-blue-400 dark:border-blue-700 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800",
          ].join(" ")}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {isCustom
              ? `${format(filter.start, "MMM d")} – ${format(filter.end, "MMM d, yyyy")}`
              : t("filter.customRange")}
          </span>
          {isCustom ? (
            <span
              role="button"
              onClick={clearCustom}
              className="ml-0.5 p-0.5 rounded hover:bg-white/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          ) : (
            <ChevronDown
              className={[
                "w-3 h-3 transition-transform duration-200",
                calOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          )}
        </button>

        {/* Calendar dropdown */}
        {calOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4">
            <CalendarRangePicker
              value={isCustom ? { start: filter.start, end: filter.end } : null}
              onChange={(range) => {
                onChange({ start: range.start, end: range.end });
                setCalOpen(false);
              }}
              onClose={() => setCalOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Active label */}
      <div className="ml-auto hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>{t("filter.showing")}</span>
        <span className="text-slate-600 dark:text-slate-300">{formatFilterLabel(filter, t)}</span>
      </div>
    </div>
  );
}
