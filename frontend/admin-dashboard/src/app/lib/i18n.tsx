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
    "nav.requests": "Requests",
    "nav.devices": "Devices",
    "nav.settings": "Settings",
    "sidebar.adminConsole": "ADMIN CONSOLE",
    "sidebar.systemOnline": "System Online",

    // Workspace requests
    "requests.title": "Workspace Requests",
    "requests.subtitle": "Review requests to onboard a new admin and provision their account.",
    "requests.refresh": "Refresh",
    "requests.filter.pending": "Pending",
    "requests.filter.approved": "Approved",
    "requests.filter.rejected": "Rejected",
    "requests.filter.all": "All",
    "requests.loading": "Loading requests…",
    "requests.loadError": "Could not load requests.",
    "requests.empty": "No requests here.",
    "requests.approve": "Approve",
    "requests.reject": "Reject",
    "requests.rejectPrompt": "Optional note (reason for rejection):",
    "requests.approved": "Request approved — admin account created.",
    "requests.rejected": "Request rejected.",
    "requests.actionError": "Something went wrong. Please try again.",
    "requests.note": "Note",
    "requests.credsTitle": "Admin account created",
    "requests.credsSubtitle": "These sign-in details were also emailed to the new admin. Share them securely if needed.",
    "requests.credsEmail": "Email",
    "requests.credsPassword": "Temporary password",
    "requests.copied": "Copied to clipboard.",
    "requests.copyAll": "Copy",
    "requests.done": "Done",

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
    "nav.requests": "الطلبات",
    "nav.devices": "الأجهزة",
    "nav.settings": "الإعدادات",
    "sidebar.adminConsole": "وحدة تحكم المشرف",
    "sidebar.systemOnline": "النظام متصل",

    // Workspace requests
    "requests.title": "طلبات مساحات العمل",
    "requests.subtitle": "راجع طلبات إضافة مشرف جديد وأنشئ حسابه.",
    "requests.refresh": "تحديث",
    "requests.filter.pending": "قيد الانتظار",
    "requests.filter.approved": "مقبول",
    "requests.filter.rejected": "مرفوض",
    "requests.filter.all": "الكل",
    "requests.loading": "جارٍ تحميل الطلبات…",
    "requests.loadError": "تعذّر تحميل الطلبات.",
    "requests.empty": "لا توجد طلبات هنا.",
    "requests.approve": "قبول",
    "requests.reject": "رفض",
    "requests.rejectPrompt": "ملاحظة اختيارية (سبب الرفض):",
    "requests.approved": "تم قبول الطلب — أُنشئ حساب المشرف.",
    "requests.rejected": "تم رفض الطلب.",
    "requests.actionError": "حدث خطأ ما. حاول مرة أخرى.",
    "requests.note": "ملاحظة",
    "requests.credsTitle": "تم إنشاء حساب المشرف",
    "requests.credsSubtitle": "أُرسلت بيانات الدخول هذه أيضًا إلى المشرف الجديد عبر البريد. شاركها بأمان عند الحاجة.",
    "requests.credsEmail": "البريد الإلكتروني",
    "requests.credsPassword": "كلمة مرور مؤقتة",
    "requests.copied": "تم النسخ.",
    "requests.copyAll": "نسخ",
    "requests.done": "تم",

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
