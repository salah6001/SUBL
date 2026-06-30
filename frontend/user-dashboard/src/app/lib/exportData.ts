import { getText } from "../api/client";
import { habitsApi } from "../api/habits";
import { surveyApi } from "../api/survey";

// Builds a single CSV from the user's real data — the COMPLETE raw stress
// reading history (server-side export), plus habits and assessment history.
// No mock/placeholder content, no 30-day cap.

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function section(title: string, headers: string[], rows: unknown[][]): string {
  const lines = [title, headers.join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  return lines.join("\n");
}

export async function exportMyDataCsv(): Promise<void> {
  const now = new Date();

  const [readingsCsv, habits, surveys] = await Promise.all([
    // Complete, all-time raw stress readings, exported server-side.
    getText("/users/me/data/export").catch(() => ""),
    habitsApi.list().catch(() => []),
    surveyApi.history().catch(() => []),
  ]);

  const parts: string[] = [];

  parts.push(
    "# Stress readings (full history)\n" +
    (readingsCsv.trim() || "Id,SessionId,Score,Level,Confidence,ModelVersion,CreatedAt"),
  );

  parts.push(section(
    "# Habits",
    ["label", "category", "streak", "completedToday"],
    habits.map(h => [h.label, h.category, h.streak, h.completed]),
  ));

  parts.push(section(
    "# Assessment history",
    ["submittedAt", "score", "maxScore", "level"],
    surveys.map(s => [s.submittedAt, s.totalScore, s.maxScore, s.level]),
  ));

  const csv = parts.join("\n\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subl-data-export-${now.toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
