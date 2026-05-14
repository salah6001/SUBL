# Subl: Reading the Invisible — AI-Powered Stress Detection for the Modern Knowledge Worker

Across Africa and the world, a new category of worker has emerged: the knowledge worker — the developer, analyst, student, designer, or administrator who spends the majority of their working day at a keyboard. For this growing population, the computer is not just a tool; it is the primary medium through which they think, create, and communicate. It is also, as it turns out, an unintentional recorder of their psychological state.

Subl is a real-time stress detection and mental wellness platform built around this insight. Its premise is simple: before a knowledge worker consciously feels stressed, their typing already shows it. The rhythm of keystrokes, the pauses between them, the frequency of backspacing — these encode measurable signals of psychological load. Subl reads those signals continuously and turns them into actionable intelligence.

## The Science Behind the Keys

From each typing session, Subl extracts five features: mean dwell time (how long each key is held down), median flight time (the interval between successive keystrokes), the coefficient of variation of flight time (how irregular those intervals are), deletion frequency, and total session duration. Together, these five numbers form what might be called a motor-control fingerprint of mental state.

The underlying model is a Random Forest classifier trained on the EmoSurv dataset, a benchmark corpus of keystroke recordings with verified emotional labels. It achieves 90.3% accuracy under five-fold cross-validation and 94.2% accuracy on an independent test set, with a binary stress F1 score of 91.3%. The classifier distinguishes five emotional states — Angry, Calm, Happy, Neutral, Sad — and derives a continuous stress score from the combined probability mass of the high-arousal negative states.

## Hidden Stress: The Core Innovation

Most wellness tools rely on self-report: they ask you how you feel. But self-report fails precisely when it matters most. Knowledge workers under sustained pressure often normalise their condition — they report feeling fine while their behaviour tells a different story. This is the blind spot Subl is designed to close.

Subl compares two independent signals. The first is the model's objective assessment from keystroke dynamics. The second is a structured five-question Likert self-assessment. When the model detects elevated stress but the self-report scores low, the gap is measured as a divergence score. A divergence exceeding 20 percentage points triggers a hidden stress alert — a notification that the user's subjective sense of calm may not reflect what their fingers are signalling. This dual-source architecture turns a routine wellness check-in into a genuine early-warning system.

## The Full Platform

Subl is production-ready. The frontend is a React 18 single-page application with a polished, mobile-first interface. New users complete an onboarding assessment — five survey questions plus a short typing baseline — that gives the system its first keystroke sample. From that point, the dashboard tracks stress in real time.

Charts visualise stress trajectories across the day, the week, and the month. Alongside stress scores, the platform tracks typing speed over time, a sensitive proxy for cognitive load. The system surfaces patterns users cannot detect unaided: peak focus windows, the days workload turns unsustainable, the gradual accumulation of pressure across a work week.

An AI chat assistant draws on the user's own data to deliver personalised recommendations. When the model flags an erratic keystroke pattern, it recommends a breathing break and names the specific signal that triggered it — not generic advice, but guidance grounded in that user's behaviour. A curated article library covers keyboard ergonomics, cognitive load management, and evidence-based stress reduction, making Subl a complete wellness companion rather than a standalone detection tool.

## Why This, and Why Now

The knowledge economy is expanding rapidly across Africa, bringing with it the occupational health challenges that have long burdened equivalent workforces in the West. Burnout, chronic stress, and undetected anxiety are productivity killers — and in environments where mental health professionals are scarce, early detection is the only realistic first line of defence.

Every knowledge worker already owns the sensor Subl requires. The keyboard is already there. Subl simply listens to what it has always been saying.
