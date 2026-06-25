import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_PREFERENCES, type Preferences } from "../api/preferences";
import { formatDate as fmtDate, formatDateTime as fmtDateTime, formatInZone as fmtInZone } from "./format";
import { toLang, dirFor, translate, type Lang } from "./i18n";

type DateInput = Date | string | number | null | undefined;

interface PrefsContextValue {
  prefs: Preferences;
  /** Numeric date in the user's format + timezone. */
  formatDate: (d: DateInput) => string;
  /** Numeric date + 24h time in the user's format + timezone. */
  formatDateTime: (d: DateInput) => string;
  /** Locale-aware styled formatting in the user's timezone. */
  formatInZone: (d: DateInput, options: Intl.DateTimeFormatOptions, locale?: string) => string;
  /** Active UI language. */
  lang: Lang;
  /** Text direction for the active language. */
  dir: "rtl" | "ltr";
  /** Translate an i18n key into the active language. */
  t: (key: string) => string;
}

const defaultLang = toLang(DEFAULT_PREFERENCES.language);

const PrefsContext = createContext<PrefsContextValue>({
  prefs: DEFAULT_PREFERENCES,
  formatDate: (d) => fmtDate(d, DEFAULT_PREFERENCES),
  formatDateTime: (d) => fmtDateTime(d, DEFAULT_PREFERENCES),
  formatInZone: (d, options, locale) => fmtInZone(d, DEFAULT_PREFERENCES.timezone, options, locale),
  lang: defaultLang,
  dir: dirFor(defaultLang),
  t: (key) => translate(defaultLang, key),
});

export function PreferencesProvider({ prefs, children }: { prefs: Preferences; children: ReactNode }) {
  const lang = toLang(prefs.language);
  const value: PrefsContextValue = {
    prefs,
    formatDate: (d) => fmtDate(d, prefs),
    formatDateTime: (d) => fmtDateTime(d, prefs),
    // Default the locale to the active UI language so styled dates (e.g. the
    // header's "Wednesday, 24 June 2026") render in Arabic when the app is ar.
    formatInZone: (d, options, locale) => fmtInZone(d, prefs.timezone, options, locale ?? (lang === "ar" ? "ar" : "en-US")),
    lang,
    dir: dirFor(lang),
    t: (key) => translate(lang, key),
  };
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
