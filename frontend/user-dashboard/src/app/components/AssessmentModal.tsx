import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, ChevronRight, Activity } from "lucide-react";
import { assessmentQuestions as mockQuestions } from "../data/mockData";
import { surveyApi } from "../api/survey";
import { stressApi } from "../api/stress";
import type { CurrentStress } from "../api/stress";
import type { SurveyResult } from "../api/survey";

export interface AssessmentResult { score: number; level: string; takenAt: string }

const pctColor = (p: number) => (p < 40 ? "#22c55e" : p < 65 ? "#f59e0b" : "#ef4444");

/** Semicircular gauge — 0..100 percent, scale marked 0–10 at the ends. */
function Gauge({ percent, color }: { percent: number; color: string }) {
  const r = 64, cx = 80, cy = 80, sw = 14;
  const L = Math.PI * r;
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <svg viewBox="0 0 160 96" className="w-full max-w-[180px] mx-auto">
      <path d={d} fill="none" strokeWidth={sw} strokeLinecap="round" className="stroke-slate-100 dark:stroke-slate-800" />
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${p * L} ${L}`} />
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100" style={{ fontSize: 24, fontWeight: 700 }}>
        {percent}%
      </text>
      <text x={cx - r + 2} y={cy + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>0</text>
      <text x={cx + r - 2} y={cy + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>10</text>
    </svg>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-slate-500 dark:text-slate-400">{k}</span>
      <span className="text-slate-700 dark:text-slate-200">{v}</span>
    </div>
  );
}

export function AssessmentModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: (r: AssessmentResult) => void;
}) {
  const [questions, setQuestions] = useState<{ id: string; text: string; category: string; options: string[] }[]>(
    mockQuestions.map(q => ({ ...q, options: ["Never", "Rarely", "Sometimes", "Often", "Always"] }))
  );
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [currentStress, setCurrentStress] = useState<CurrentStress | null>(null);

  useEffect(() => {
    surveyApi.getQuestions()
      .then(qs => {
        const sorted = [...qs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (sorted.length > 0) {
          setQuestions(sorted.map(q => ({
            id: q.id,
            text: q.text,
            category: q.category,
            options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
          })));
        }
      })
      .catch(() => {}); // keeps mock fallback
    stressApi.getCurrent().then(setCurrentStress).catch(() => {});
  }, []);

  const answeredAll = Object.keys(answers).length >= questions.length;

  const goResults = () => {
    setCalculating(true);

    const payload = questions.map(q => ({
      questionId: q.id,
      value: answers[q.id] ?? 3,
    }));

    surveyApi.submit(payload)
      .then((result: SurveyResult) => {
        const normalized = Math.round((result.totalScore / result.maxScore) * 100);
        const s = Math.min(100, Math.max(5, normalized));
        const lvl = result.level || (s < 40 ? "Low" : s < 65 ? "Moderate" : "High");
        setScore(s);
        setLevel(result.level);
        onComplete?.({ score: s, level: lvl, takenAt: new Date().toISOString() });
      })
      .catch(() => {
        const vals = questions.map(q => answers[q.id] ?? 3);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const fallback = Math.min(100, Math.max(5, Math.round((avg / 5) * 100)));
        const lvl = fallback < 40 ? "Low" : fallback < 65 ? "Moderate" : "High";
        setScore(fallback);
        setLevel(lvl);
        onComplete?.({ score: fallback, level: lvl, takenAt: new Date().toISOString() });
      })
      .finally(() => { setCalculating(false); setStep(2); });
  };

  const reset = () => {
    setStep(1); setAnswers({}); setScore(0); setLevel("");
  };

  const stateLabel = level || (score < 40 ? "Normal" : score < 65 ? "Moderate Stress" : "High Stress");

  // Comparison data
  const modelPct  = currentStress?.hasData ? Math.round((currentStress.score ?? 0) * 100) : null;
  const modelLevel = currentStress?.level ?? null;
  const gap       = modelPct != null ? modelPct - score : null; // model − self (pp)
  const hidden    = modelPct != null && modelPct - score > 20;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
              Subl · Stress Assessment
            </p>
            <h2 className="text-sm text-slate-800 dark:text-slate-100">
              {step === 1 && "Psychological Questionnaire"}
              {step === 2 && "Source Comparison"}
              {calculating && "Analyzing..."}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  step > s ? "bg-blue-600 text-white" : step === s ? "bg-blue-600 text-white ring-3 ring-blue-100 dark:ring-blue-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                </div>
                {i < 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">
            <span>Questionnaire</span><span>Comparison</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rate your experience over the past 7 days. No right or wrong answers.
              </p>
              {questions.map((q, i) => (
                <div key={q.id}>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                  </div>
                  <div className="flex gap-1.5 pl-7">
                    {q.options.map((label, v) => (
                      <button key={v} onClick={() => setAnswers((p) => ({ ...p, [q.id]: v + 1 }))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs transition-all ${
                          answers[q.id] === v + 1
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        }`}>
                        <div>{v + 1}</div>
                        <div className="text-[9px] opacity-70 mt-0.5 hidden sm:block">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calculating */}
          {calculating && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 relative">
                <div className="absolute inset-0 border-3 border-blue-200 dark:border-blue-900 rounded-full" style={{ borderWidth: 3 }} />
                <div className="absolute inset-0 border-3 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Analyzing multimodal signals...</p>
            </div>
          )}

          {/* Step 2 — Source comparison */}
          {step === 2 && !calculating && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Comparing the AI model's reading with your self-assessment.
              </p>

              {/* Two sources */}
              <div className="grid grid-cols-2 gap-3">
                {/* AI Model */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">AI Model</p>
                  </div>
                  {modelPct != null ? (
                    <>
                      <Gauge percent={modelPct} color={pctColor(modelPct)} />
                      <div className="grid grid-cols-2 gap-1.5 w-full mt-2">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 text-center">
                          <p className="text-sm" style={{ color: pctColor(modelPct) }}>{modelPct}%</p>
                          <p className="text-[9px] text-slate-400">Stress level</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 text-center">
                          <p className="text-sm text-slate-700 dark:text-slate-200">{modelLevel ?? "—"}</p>
                          <p className="text-[9px] text-slate-400">State</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
                      <Activity className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-400">No data yet</p>
                    </div>
                  )}
                </div>

                {/* Self-Assessment */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">Self-Assessment</p>
                  </div>
                  <Gauge percent={score} color={pctColor(score)} />
                  <div className="grid grid-cols-2 gap-1.5 w-full mt-2">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 text-center">
                      <p className="text-sm" style={{ color: pctColor(score) }}>{(score / 10).toFixed(1)}/10</p>
                      <p className="text-[9px] text-slate-400">Survey score</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 text-center">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{stateLabel}</p>
                      <p className="text-[9px] text-slate-400">Interpretation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap badge */}
              <div className="flex items-center justify-center gap-4 rounded-xl border border-slate-200 dark:border-slate-700 py-3 px-4">
                <div className="text-center shrink-0">
                  <p className="text-2xl" style={{ color: gap == null ? "#94a3b8" : gap > 0 ? "#ef4444" : "#22c55e" }}>
                    {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap}pp`}
                  </p>
                  <p className="text-[10px] text-slate-400">The Gap</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {gap == null ? "No model reading to compare yet."
                    : Math.abs(gap) < 20 ? "Slight difference — both readings broadly agree."
                    : "Significant gap between the two sources."}
                </p>
              </div>

              {/* Gap analysis */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Gap analysis</p>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-500" />AI Model</span>
                      <span className="text-slate-500 dark:text-slate-400">{modelPct == null ? "No data" : `${modelPct}%`}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      {modelPct != null && <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${modelPct}%` }} />}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-500" />Self-Report</span>
                      <span className="text-slate-500 dark:text-slate-400">{score}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs border-t border-slate-100 dark:border-slate-800 pt-1">
                  <InfoRow k="AI Model" v={modelPct == null ? "No data yet" : `${modelPct}%`} />
                  <InfoRow k="Self-Report" v={`${score}%`} />
                  <InfoRow k="Gap" v={gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap}pp`} />
                  <InfoRow k="Hidden stress" v={modelPct == null ? "—" : hidden ? "Yes" : "No"} />
                </div>
              </div>

              {hidden && (
                <div className="rounded-xl p-3.5 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Your behavioral signals suggest higher stress than you reported. Consider a check-in with Subl AI.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          {step === 1 && (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
              <button onClick={goResults} disabled={!answeredAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Analyze <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={reset} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                Retake
              </button>
              <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
                Go to Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
