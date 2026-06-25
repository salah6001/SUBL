import { api } from "./client";

export type ThemePref = "light" | "dark" | "system";

export interface Preferences {
  theme: ThemePref;
  language: string;   // BCP-47-ish tag, e.g. "en-US" or "ar"
  timezone: string;   // IANA tz, e.g. "UTC", "Africa/Cairo"
  dateFormat: string; // "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  language: "en-US",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
};

export const preferencesApi = {
  get: () => api.get<Preferences>("/users/me/preferences"),
  update: (p: Preferences) => api.put<Preferences>("/users/me/preferences", p),
};
