import { api } from "./client";
import type { Habit, HabitCategory } from "../data/mockData";

/** Server DTO — category comes back as the enum *name* (e.g. "Mindfulness"). */
interface HabitDto {
  id: string;
  label: string;
  category: string;
  icon: string | null;
  isActive: boolean;
  streak: number;
  completedToday: boolean;
  createdAt: string;
}

// The backend has no JsonStringEnumConverter, so enums bind from integers on
// input. Categories map to the Domain.Habits.HabitCategory values.
const CATEGORY_TO_INT: Record<HabitCategory, number> = {
  Mindfulness: 1,
  Physical: 2,
  Nutrition: 3,
  Focus: 4,
  Recovery: 5,
};

function toHabit(dto: HabitDto): Habit {
  return {
    id: dto.id,
    label: dto.label,
    category: dto.category as HabitCategory,
    icon: dto.icon ?? "Activity",
    completed: dto.completedToday,
    streak: dto.streak,
  };
}

export const habitsApi = {
  list: () => api.get<HabitDto[]>("/habits").then(rows => rows.map(toHabit)),

  create: (label: string, category: HabitCategory, icon: string) =>
    api.post<{ id: string }>("/habits", { label, category: CATEGORY_TO_INT[category], icon }),

  update: (id: string, label: string, category: HabitCategory, icon: string) =>
    api.put<void>(`/habits/${id}`, { label, category: CATEGORY_TO_INT[category], icon }),

  remove: (id: string) => api.delete<void>(`/habits/${id}`),

  /** Toggle today's completion; returns the new completed state. */
  toggle: (id: string) => api.post<{ completed: boolean }>(`/habits/${id}/toggle`),
};
