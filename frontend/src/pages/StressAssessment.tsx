import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SublLogo } from '@/components/SublLogo';
import { useAppState } from '@/hooks/useAppState';
import { assessmentApi } from '@/api/assessment';
import type { AssessmentResult } from '@/types';
import { Clock, Keyboard, Timer, RotateCcw, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { isDemoSession, getDemoAssessmentResult } from '@/lib/demoAuth';

const questions = [
  { id: 1, text: 'How stressed do you feel right now? (1 = No stress, 5 = Extreme stress)' },
  { id: 2, text: 'How difficult is it to concentrate? (1 = No stress, 5 = Extreme stress)' },
  { id: 3, text: 'Do you feel mentally overwhelmed? (1 = No stress, 5 = Extreme stress)' },
  { id: 4, text: 'How anxious do you feel? (1 = No stress, 5 = Extreme stress)' },
  { id: 5, text: 'Do you feel pressure from current tasks? (1 = No stress, 5 = Extreme stress)' },
];

export default function StressAssessment() {
  const navigate = useNavigate();
  const { completeAssessment } = useAppState();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [baseline, setBaseline] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const handleAnswer = (qId: number, val: number) => setAnswers({ ...answers, [qId]: val });
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const localScore = Object.keys(answers).length === 0
    ? null
    : Math.round(
        (Object.values(answers).reduce((a, b) => a + b, 0) / (questions.length * 5)) * 100
      );

  const getStateFromLabel = (label: string) => {
    if (label === 'Normal') return { color: 'text-subl-green-500', bg: 'bg-subl-green-50', bar: 'bg-subl-green-500' };
    if (label === 'Medium') return { color: 'text-subl-orange-500', bg: 'bg-subl-orange-50', bar: 'bg-subl-orange-500' };
    return { color: 'text-subl-red-500', bg: 'bg-subl-red-50', bar: 'bg-subl-red-500' };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = isDemoSession()
        ? getDemoAssessmentResult()
        : await assessmentApi.submit({ answers, baseline_text: baseline });
      setResult(data);
      completeAssessment(data.score, data.emotional_state);
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? localScore ?? 0;
  const label = result?.label ?? (localScore === null ? 'Normal' : localScore <= 40 ? 'Normal' : localScore <= 60 ? 'Medium' : 'High');
  const state = getStateFromLabel(label);

  return (
    <div className="min-h-screen bg-subl-grey-50 flex flex-col items-center py-8 px-4">
      <div className="flex items-center gap-2 mb-8">
        <SublLogo className="w-8 h-8" />
        <span className="text-xl font-bold text-subl-blue-500">Subl</span>
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-subl-grey-900 mb-1">
            {step === 3 ? 'Your Stress Assessment Results' : "Let's Understand Your Stress"}
          </h1>
          <p className="text-sm text-subl-grey-500">
            {step === 3
              ? 'Based on your responses and our AI analysis'
              : 'This assessment helps us personalize your experience. Takes about 3-5 minutes.'}
          </p>
        </div>

        {step < 3 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-subl-grey-500 mb-2">
              <span>Stress Assessment</span>
              <span>{step} of 2</span>
            </div>
            <div className="h-1.5 bg-subl-grey-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-subl-blue-500 rounded-full transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Questions */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-subl-grey-800 mb-3">{q.id}. {q.text}</p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(q.id, val)}
                        className={`w-12 h-12 rounded-xl text-sm font-medium border-2 transition-all ${
                          answers[q.id] === val
                            ? 'border-subl-blue-500 bg-subl-blue-50 text-subl-blue-500'
                            : 'border-subl-grey-200 bg-white text-subl-grey-500 hover:border-subl-grey-300'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!allAnswered}
                className="px-8 py-3 bg-subl-blue-500 hover:bg-subl-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Text Baseline */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-subl-grey-800 mb-3">Text Baseline</h3>
              <div className="bg-subl-grey-50 rounded-xl p-4 text-sm text-subl-grey-600 leading-relaxed mb-4">
                <p className="mb-3">
                  Managing stress through mindfulness is about shifting your focus from the pressures of the
                  future to the impacts of the past back to the present moment. When the mind feels
                  overwhelmed, it often becomes trapped in a cycle of "what-ifs" and reactive thinking.
                </p>
                <p>Your space</p>
              </div>
              <textarea
                placeholder="Type this paragraph here"
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                className="w-full h-32 p-4 bg-subl-grey-50 border border-subl-grey-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 resize-none transition-all"
              />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-subl-grey-500 hover:text-subl-grey-700 transition-colors">
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-subl-blue-500 hover:bg-subl-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? 'Analyzing…' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col items-center mb-8">
              <div className={`w-20 h-20 ${state.bg} rounded-2xl flex items-center justify-center mb-3`}>
                <span className="text-3xl">
                  {label === 'Normal' ? '😊' : label === 'Medium' ? '😐' : '😰'}
                </span>
              </div>
              <h3 className={`text-lg font-semibold ${state.color}`}>{label}</h3>
              <p className="text-sm text-subl-grey-500 mt-1">
                {result?.emotional_state
                  ? `Your emotional state: ${result.emotional_state}`
                  : 'You appear to be in a good state of mind with manageable stress levels.'}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-subl-grey-800">Stress Score</span>
                <span className="font-semibold text-subl-grey-900">{score} / 100</span>
              </div>
              <div className="h-3 bg-subl-grey-100 rounded-full overflow-hidden">
                <div className={`h-full ${state.bar} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-subl-grey-50 rounded-xl">
                <Clock size={20} className="mx-auto mb-2 text-subl-blue-500" />
                <p className="text-xs text-subl-grey-500">Response Time</p>
                <p className="text-sm font-semibold text-subl-grey-800">{result?.response_time ?? 'Normal'}</p>
              </div>
              <div className="text-center p-4 bg-subl-grey-50 rounded-xl">
                <Keyboard size={20} className="mx-auto mb-2 text-subl-blue-500" />
                <p className="text-xs text-subl-grey-500">Typing Pattern</p>
                <p className="text-sm font-semibold text-subl-grey-800">{result?.typing_pattern ?? 'Consistent'}</p>
              </div>
              <div className="text-center p-4 bg-subl-grey-50 rounded-xl">
                <Timer size={20} className="mx-auto mb-2 text-subl-blue-500" />
                <p className="text-xs text-subl-grey-500">Break Frequency</p>
                <p className="text-sm font-semibold text-subl-grey-800">{result?.break_frequency ?? 'Adequate'}</p>
              </div>
            </div>

            {(result?.recommendations?.length ?? 0) > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-subl-grey-800 mb-4">Personalized Recommendations</h3>
                <p className="text-xs text-subl-grey-500 mb-4">Based on your stress level, we recommend the following actions</p>
                <div className="space-y-3">
                  {result!.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-subl-grey-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-subl-grey-800">{rec.title}</p>
                        <p className="text-xs text-subl-grey-500">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setAnswers({}); setBaseline(''); setResult(null); setStep(1); }}
                className="flex-1 py-3 border border-subl-grey-200 rounded-xl text-sm font-medium text-subl-grey-700 hover:bg-subl-grey-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Retake Assessment
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-subl-blue-500 hover:bg-subl-blue-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
