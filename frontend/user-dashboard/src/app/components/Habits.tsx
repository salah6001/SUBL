import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, Wind, Activity, Droplets, Target, Moon,
  BookOpen, Timer, Dumbbell, Plus, X, Flame, Trophy, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { Habit, HabitCategory } from "../data/mockData";
import { habitsApi } from "../api/habits";
import { usePrefs } from "../lib/prefs";

const CATEGORY_CONFIG: Record<
  HabitCategory,
  { color: string; bg: string; darkBg: string; borderCls: string }
> = {
  Mindfulness: {
    color:     "text-blue-600 dark:text-blue-400",
    bg:        "bg-blue-50",
    darkBg:    "dark:bg-blue-950/40",
    borderCls: "border-blue-200 dark:border-blue-900/50",
  },
  Physical: {
    color:     "text-green-600 dark:text-green-400",
    bg:        "bg-green-50",
    darkBg:    "dark:bg-green-950/40",
    borderCls: "border-green-200 dark:border-green-900/50",
  },
  Nutrition: {
    color:     "text-orange-600 dark:text-orange-400",
    bg:        "bg-orange-50",
    darkBg:    "dark:bg-orange-950/40",
    borderCls: "border-orange-200 dark:border-orange-900/50",
  },
  Focus: {
    color:     "text-purple-600 dark:text-purple-400",
    bg:        "bg-purple-50",
    darkBg:    "dark:bg-purple-950/40",
    borderCls: "border-purple-200 dark:border-purple-900/50",
  },
  Recovery: {
    color:     "text-indigo-600 dark:text-indigo-400",
    bg:        "bg-indigo-50",
    darkBg:    "dark:bg-indigo-950/40",
    borderCls: "border-indigo-200 dark:border-indigo-900/50",
  },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind, Activity, Droplets, Target, Moon, BookOpen, Timer, Dumbbell,
};
function HabitIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? CheckCircle2;
  return <Icon className={className} />;
}

const CATEGORIES: HabitCategory[] = ["Mindfulness", "Physical", "Nutrition", "Focus", "Recovery"];

export function Habits() {
  const { t } = usePrefs();
  const [habits,       setHabits]       = useState<Habit[]>([]);
  const [showModal,    setShowModal]    = useState(false);
  const [newLabel,     setNewLabel]     = useState("");
  const [newCategory,  setNewCategory]  = useState<HabitCategory>("Mindfulness");

  // Habits live in the backend (per-user, with server-computed streaks).
  const reload = () => habitsApi.list().then(setHabits).catch(() => {});
  useEffect(() => { reload(); }, []);

  const completed  = habits.filter((h) => h.completed).length;
  const total      = habits.length;
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0;
  const bestStreak = Math.max(...habits.map((h) => h.streak), 0);

  const toggle = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const nowCompleted = !habit.completed;
    // Optimistic flip, then reconcile the streak from the server.
    setHabits(prev => prev.map((h) => (h.id === id ? { ...h, completed: nowCompleted } : h)));
    if (nowCompleted) toast.success(`✓ "${habit.label}" completed!`);
    habitsApi.toggle(id)
      .then(reload)
      .catch(() => { toast.error("Failed to update habit"); reload(); });
  };

  const deleteHabit = (id: string, label: string) => {
    setHabits(prev => prev.filter((h) => h.id !== id));
    habitsApi.remove(id)
      .then(() => toast.success(`"${label}" removed`))
      .catch(() => { toast.error("Failed to remove habit"); reload(); });
  };

  const addHabit = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setShowModal(false);
    habitsApi.create(trimmed, newCategory, "Activity")
      .then(() => { toast.success("New habit added!"); reload(); })
      .catch(() => toast.error("Failed to add habit"));
    setNewLabel("");
    setNewCategory("Mindfulness");
  };

  const grouped = CATEGORIES.reduce<Record<HabitCategory, Habit[]>>((acc, cat) => {
    acc[cat] = habits.filter((h) => h.category === cat);
    return acc;
  }, {} as Record<HabitCategory, Habit[]>);

  const progressBarColor =
    progress >= 100 ? "bg-green-500" : progress >= 60 ? "bg-amber-500" : "bg-white";

  return (
    <div className="space-y-6">

      {/* ── Header Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white">
          <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-200 text-xs mb-1">{t("habits.todayProgress")}</p>
                <h2 className="text-2xl text-white">
                  {completed}/{total} {t("habits.habitsCompleted")}
                </h2>
              </div>
              {progress === 100 && (
                <Trophy className="w-9 h-9 text-amber-400" />
              )}
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-200">
              <span>{progress}{t("habits.percentComplete")}</span>
              <span>{total - completed} {t("habits.remaining")}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <Flame className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("habits.bestStreak")}</p>
            <p className="text-slate-800 dark:text-slate-100">{bestStreak} {t("habits.days")}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <Sparkles className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("habits.totalHabits")}</p>
            <p className="text-slate-800 dark:text-slate-100">{total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("habits.doneToday")}</p>
            <p className="text-slate-800 dark:text-slate-100">{completed}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <Trophy className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t("habits.rate")}</p>
            <p className="text-slate-800 dark:text-slate-100">{progress}%</p>
          </div>
        </div>
      </div>

      {/* ── Section header with Add button ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-slate-700 dark:text-slate-300">{t("habits.todayHabits")}</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors shadow-sm shadow-blue-600/25"
        >
          <Plus className="w-4 h-4" />
          {t("habits.add")}
        </button>
      </div>

      {/* ── Habit lists grouped by category ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CATEGORIES.map((cat) => {
          const catHabits = grouped[cat];
          if (catHabits.length === 0) return null;
          const cfg        = CATEGORY_CONFIG[cat];
          const catDone    = catHabits.filter((h) => h.completed).length;

          return (
            <div key={cat} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs border ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.borderCls}`}
                >
                  {t(`hcat.${cat}`)}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {catDone}/{catHabits.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      habit.completed
                        ? "bg-green-50/40 dark:bg-green-950/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <button onClick={() => toggle(habit.id)} className="shrink-0">
                      {habit.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />
                      )}
                    </button>
                    <HabitIcon
                      name={habit.icon}
                      className={`w-4 h-4 shrink-0 ${habit.completed ? "text-green-400" : cfg.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm transition-colors ${
                          habit.completed
                            ? "line-through text-slate-400 dark:text-slate-600"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {habit.label}
                      </p>
                      {habit.streak > 0 && (
                        <p className="text-[10px] text-orange-500 flex items-center gap-0.5 mt-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          {habit.streak} {t("habits.streak")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id, habit.label)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all shrink-0"
                      title={t("habits.removeHabit")}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add Habit Modal ────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
                  {t("habits.title")}
                </p>
                <h3 className="text-sm text-slate-800 dark:text-slate-200">{t("habits.addNew")}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  {t("habits.nameLabel")}
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  placeholder={t("habits.namePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  {t("habits.category")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const cfg     = CATEGORY_CONFIG[cat];
                    const isActive = newCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setNewCategory(cat)}
                        className={`py-2 px-3 rounded-xl text-xs border transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.borderCls} border`
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {t(`hcat.${cat}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors"
              >
                {t("action.cancel")}
              </button>
              <button
                onClick={addHabit}
                disabled={!newLabel.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("habits.add")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
