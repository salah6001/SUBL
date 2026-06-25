import { createContext, useContext, type ReactNode } from "react";

// Lightweight i18n for the admin console. Two locales: English ("en-US",
// default) and Arabic ("ar", RTL). The active locale comes from the admin's
// saved `language` preference; non-Arabic tags fall back to English.

export type Lang = "en" | "ar";

export function toLang(language: string | undefined | null): Lang {
  return (language ?? "").toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    // Sidebar groups
    "group.overview": "Overview",
    "group.management": "Management",
    "group.system": "System",
    // Nav items
    "nav.dashboard": "Dashboard",
    "nav.alerts": "Alerts",
    "nav.users": "Users",
    "nav.devices": "Devices",
    "nav.settings": "Settings",
    "sidebar.adminConsole": "ADMIN CONSOLE",
    "sidebar.systemOnline": "System Online",

    // Settings
    "settings.general": "General",
    "settings.appearance": "Appearance",
    "settings.language": "Language",
    "settings.timezone": "Timezone",
    "settings.dateFormat": "Date Format",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",

    // Common
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.logout": "Log Out",
  },
  ar: {
    // Sidebar groups
    "group.overview": "نظرة عامة",
    "group.management": "الإدارة",
    "group.system": "النظام",
    // Nav items
    "nav.dashboard": "لوحة التحكم",
    "nav.alerts": "التنبيهات",
    "nav.users": "المستخدمون",
    "nav.devices": "الأجهزة",
    "nav.settings": "الإعدادات",
    "sidebar.adminConsole": "وحدة تحكم المشرف",
    "sidebar.systemOnline": "النظام متصل",

    // Settings
    "settings.general": "عام",
    "settings.appearance": "المظهر",
    "settings.language": "اللغة",
    "settings.timezone": "المنطقة الزمنية",
    "settings.dateFormat": "تنسيق التاريخ",
    "settings.theme": "السمة",
    "settings.theme.light": "فاتح",
    "settings.theme.dark": "داكن",
    "settings.theme.system": "النظام",

    // Common
    "action.save": "حفظ",
    "action.cancel": "إلغاء",
    "action.logout": "تسجيل الخروج",
  },
};

export function translate(lang: Lang, key: string): string {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
}

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  dir: "ltr",
  t: (key) => translate("en", key),
});

export function I18nProvider({ language, children }: { language: string; children: ReactNode }) {
  const lang = toLang(language);
  const value: I18nValue = { lang, dir: dirFor(lang), t: (key) => translate(lang, key) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
