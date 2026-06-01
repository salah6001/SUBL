import { useState, useRef } from "react";
import { X, CheckCircle, AlertTriangle, ChevronRight, BarChart2, Clock, Keyboard, Coffee } from "lucide-react";
import { assessmentQuestions, typingTestParagraph } from "../data/mockData";

const LIKERT = ["Never", "Rarely", "Sometimes", "Often", "Always"];

export function AssessmentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [typingDone, setTypingDone] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [score, setScore] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const answeredAll = Object.keys(answers).length >= assessmentQuestions.length;

  const handleType = (v: string) => {
    if (!startTime && v.length === 1) setStartTime(Date.now());
    setTyped(v);
    if (v.length >= typingTestParagraph.length * 0.88) {
      const elapsed = (Date.now() - (startTime ?? Date.now())) / 60000;
      const words = v.split(" ").filter(Boolean).length;
      setWpm(Math.min(120, elapsed > 0 ? Math.round(words / elapsed) : 65));
      setTypingDone(true);
    }
  };

  const goResults = () => {
    setCalculating(true);
    const avg = Object.values(answers).reduce((a, b) => a + b, 0) / Math.max(assessmentQuestions.length, 1);
    const psych = (avg / 5) * 62;
    const typFactor = typingDone ? Math.max(0, (1 - wpm / 100) * 38) : 20;
    setTimeout(() => {
      setScore(Math.min(100, Math.max(5, Math.round(psych + typFactor))));
      setCalculating(false);
      setStep(3);
    }, 1600);
  };

  const reset = () => {
    setStep(1); setAnswers({}); setTyped(""); setStartTime(null);
    setTypingDone(false); setWpm(0); setScore(0);
  };

  const stateLabel = score < 40 ? "Normal" : score < 65 ? "Moderate Stress" : "High Stress";
  const stateColor = score < 40 ? "text-green-500" : score < 65 ? "text-amber-500" : "text-red-500";
  const barColor = score < 40 ? "bg-green-500" : score < 65 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
              Subl · Stress Assessment
            </p>
            <h2 className="text-sm text-slate-800 dark:text-slate-100">
              {step === 1 && "Psychological Questionnaire"}
              {step === 2 && "Typing Baseline Calibration"}
              {step === 3 && "Your Results"}
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
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  step > s ? "bg-blue-600 text-white" : step === s ? "bg-blue-600 text-white ring-3 ring-blue-100 dark:ring-blue-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">
            <span>Questionnaire</span><span className="pr-3">Typing Test</span><span>Results</span>
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
              {assessmentQuestions.map((q, i) => (
                <div key={q.id}>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{q.text}</p>
                  </div>
                  <div className="flex gap-1.5 pl-7">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button key={v} onClick={() => setAnswers((p) => ({ ...p, [q.id]: v }))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs transition-all ${
                          answers[q.id] === v
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        }`}>
                        <div>{v}</div>
                        <div className="text-[9px] opacity-70 mt-0.5 hidden sm:block">{LIKERT[v - 1]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Type the paragraph below at your natural pace to calibrate your baseline keystroke dynamics.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed select-none">{typingTestParagraph}</p>
              </div>
              <div className="relative">
                <textarea
                  ref={textRef} value={typed} onChange={(e) => handleType(e.target.value)}
                  disabled={typingDone} placeholder="Start typing here..." rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm disabled:opacity-60"
                />
                {typingDone && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-xl border-2 border-green-500">
                    <div className="text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1.5" />
                      <p className="text-green-600 dark:text-green-400 text-sm">Baseline recorded · {wpm} WPM</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span>{typed.length} / {typingTestParagraph.length} chars</span>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (typed.length / typingTestParagraph.length) * 100)}%` }} />
                </div>
              </div>
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

          {/* Step 3 */}
          {step === 3 && !calculating && (
            <div className="space-y-5">
              <div className="text-center py-2">
                {score < 40 ? (
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className={`w-10 h-10 mx-auto mb-2 ${stateColor}`} />
                )}
                <h3 className={`text-2xl mb-0.5 ${stateColor}`}>{stateLabel}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Current stress index</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Stress Score</span>
                  <span className={`${stateColor}`}>{score}/100</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${score}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600">
                  <span>Normal (0–39)</span><span>Moderate (40–64)</span><span>High (65+)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: Clock, label: "Response Time", value: `${(1.2 + Math.random() * 1.5).toFixed(1)}s`, status: score < 50 ? "Normal" : "Elevated" },
                  { icon: Keyboard, label: "Typing Pattern", value: `${wpm || 62} WPM`, status: (wpm || 62) > 55 ? "Normal" : "Low" },
                  { icon: Coffee, label: "Break Frequency", value: score < 50 ? "Optimal" : "Low", status: score < 50 ? "Good" : "Monitor" },
                  { icon: BarChart2, label: "Stress Index", value: stateLabel, status: score < 40 ? "Stable" : "Watch" },
                ].map(({ icon: Icon, label, value, status }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{value}</p>
                    <p className={`text-[11px] mt-0.5 ${
                      ["Normal", "Good", "Stable", "Optimal"].includes(status) ? "text-green-500" :
                      ["Elevated", "Monitor", "Watch", "Low"].includes(status) ? "text-amber-500" : "text-slate-400"
                    }`}>{status}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl p-3.5 border text-sm ${
                score >= 40
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
                  : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400"
              }`}>
                {score >= 40
                  ? "Your stress levels are elevated. Consider scheduling a 10-minute break and trying the breathing exercise in Subl AI."
                  : "Great work! Your stress levels are in a healthy range. Keep maintaining your current routines."}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          {step === 1 && (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {Object.keys(answers).length}/{assessmentQuestions.length} answered
              </span>
              <button onClick={() => setStep(2)} disabled={!answeredAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Continue <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {step === 2 && !calculating && (
            <>
              <button onClick={() => setStep(1)} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-colors">
                Back
              </button>
              <button onClick={goResults} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
                Analyze <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {step === 3 && (
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
