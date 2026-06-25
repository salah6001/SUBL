// Presentation-layer date/time formatting. Timestamps are stored UTC; we format
// them in the user's chosen timezone and date format at display time only.

export interface DatePrefs {
  dateFormat: string; // "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
  timezone: string;   // IANA tz, e.g. "UTC", "Africa/Cairo"
}

/** Curated timezone list for the settings picker. */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: "UTC", label: "UTC" },
  { value: "Africa/Cairo", label: "Cairo (GMT+2)" },
  { value: "Europe/London", label: "London (GMT+0/1)" },
  { value: "Europe/Paris", label: "Central Europe (GMT+1/2)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Riyadh", label: "Riyadh (GMT+3)" },
  { value: "America/New_York", label: "Eastern US (GMT-5/4)" },
  { value: "America/Chicago", label: "Central US (GMT-6/5)" },
  { value: "America/Los_Angeles", label: "Pacific US (GMT-8/7)" },
  { value: "Asia/Kolkata", label: "India (GMT+5:30)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
];

export const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const;

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Extract Y/M/D/H/m fields for a Date in a given IANA timezone. */
function partsInZone(date: Date, timeZone: string) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const map: Record<string, string> = {};
    for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
    return {
      yyyy: map.year, MM: map.month, DD: map.day,
      HH: map.hour === "24" ? "00" : map.hour, mm: map.minute,
    };
  } catch {
    // Invalid timezone → fall back to UTC.
    return {
      yyyy: String(date.getUTCFullYear()),
      MM: String(date.getUTCMonth() + 1).padStart(2, "0"),
      DD: String(date.getUTCDate()).padStart(2, "0"),
      HH: String(date.getUTCHours()).padStart(2, "0"),
      mm: String(date.getUTCMinutes()).padStart(2, "0"),
    };
  }
}

/** Format just the date per the user's date format + timezone. */
export function formatDate(
  input: Date | string | number | null | undefined,
  prefs: DatePrefs,
): string {
  const d = toDate(input);
  if (!d) return "—";
  const { yyyy, MM, DD } = partsInZone(d, prefs.timezone || "UTC");
  switch (prefs.dateFormat) {
    case "DD/MM/YYYY": return `${DD}/${MM}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${MM}-${DD}`;
    case "MM/DD/YYYY":
    default:           return `${MM}/${DD}/${yyyy}`;
  }
}

/** Format date + 24h time per the user's preferences. */
export function formatDateTime(
  input: Date | string | number | null | undefined,
  prefs: DatePrefs,
): string {
  const d = toDate(input);
  if (!d) return "—";
  const { HH, mm } = partsInZone(d, prefs.timezone || "UTC");
  return `${formatDate(d, prefs)} ${HH}:${mm}`;
}
