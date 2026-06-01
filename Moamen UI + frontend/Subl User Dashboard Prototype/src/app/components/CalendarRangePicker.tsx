import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isAfter,
  isBefore,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarRangePickerProps {
  value: { start: Date; end: Date } | null;
  onChange: (range: { start: Date; end: Date }) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarRangePicker({ value, onChange, onClose }: CalendarRangePickerProps) {
  const [viewDate, setViewDate] = useState(value?.start ?? new Date());
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate)),
    end: endOfWeek(endOfMonth(viewDate)),
  });

  const previewRange = (() => {
    if (pendingStart && hovered) {
      const s = isBefore(hovered, pendingStart) ? hovered : pendingStart;
      const e = isAfter(hovered, pendingStart) ? hovered : pendingStart;
      return { start: s, end: e };
    }
    return value;
  })();

  const checkStart = (d: Date) => !!previewRange && isSameDay(d, previewRange.start);
  const checkEnd = (d: Date) => !!previewRange && isSameDay(d, previewRange.end);
  const checkInRange = (d: Date) =>
    !!previewRange &&
    isWithinInterval(d, { start: previewRange.start, end: previewRange.end }) &&
    !isSameDay(d, previewRange.start) &&
    !isSameDay(d, previewRange.end);

  const handleClick = (day: Date) => {
    if (!pendingStart) {
      setPendingStart(day);
      return;
    }
    if (isSameDay(day, pendingStart)) {
      setPendingStart(null);
      return;
    }
    const s = isBefore(day, pendingStart) ? day : pendingStart;
    const e = isAfter(day, pendingStart) ? day : pendingStart;
    onChange({ start: s, end: e });
    setPendingStart(null);
    setHovered(null);
    onClose();
  };

  return (
    <div className="w-[252px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-slate-800 dark:text-slate-200">{format(viewDate, "MMMM yyyy")}</span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-slate-400 dark:text-slate-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const isStart = checkStart(day);
          const isEnd = checkEnd(day);
          const inRange = checkInRange(day);
          const inCurrentMonth = isSameMonth(day, viewDate);
          const todayFlag = isToday(day);

          return (
            <button
              key={i}
              onClick={() => handleClick(day)}
              onMouseEnter={() => pendingStart && setHovered(day)}
              onMouseLeave={() => setHovered(null)}
              className={[
                "h-8 w-full flex items-center justify-center text-xs transition-all duration-100",
                !inCurrentMonth ? "opacity-25 pointer-events-none" : "",
                isStart || isEnd
                  ? "bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-600/30"
                  : inRange
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-sm"
                  : todayFlag
                  ? "text-blue-600 dark:text-blue-400 rounded-xl ring-1 ring-blue-400 dark:ring-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  : "text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Status hint */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3">
        {pendingStart
          ? `From ${format(pendingStart, "MMM d")} — pick end date`
          : "Click to select a start date"}
      </p>
    </div>
  );
}
