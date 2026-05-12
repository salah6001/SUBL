import type { AuthResponse, AssessmentResult, DashboardStats, Article, ChatResponse, User, UpdateProfileRequest } from '@/types';
import { useAppState } from '@/hooks/useAppState';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

/**
 * TEMPORARY — remove this file and all its imports once the backend is live.
 * Controlled entirely by VITE_DEMO_EMAIL + VITE_DEMO_PASSWORD in .env.local.
 * Returns null / false when env vars are absent — completely inert without them.
 */

export function tryDemoLogin(email: string, password: string): AuthResponse | null {
  if (!DEMO_EMAIL || !DEMO_PASSWORD) return null;
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return null;

  return {
    token: 'demo-bypass-token',
    user: {
      id: 'demo-1',
      name: 'Abdulrahman',
      email: DEMO_EMAIL,
      phone: '',
      avatar: '',
    },
  };
}

export function isDemoSession(): boolean {
  return useAppState.getState().token === 'demo-bypass-token';
}

export function getDemoAssessmentResult(): AssessmentResult {
  return {
    score: 38,
    label: 'Normal',
    emotional_state: 'Calm',
    response_time: 'Normal',
    typing_pattern: 'Consistent',
    break_frequency: 'Adequate',
    recommendations: [
      {
        title: 'Keep It Up',
        description: 'Your stress levels are in a healthy range. Maintain your current routine.',
      },
      {
        title: 'Take Short Breaks',
        description: 'Step away from the keyboard for 5 minutes every hour to stay sharp.',
      },
      {
        title: 'Stay Hydrated',
        description: 'Drink water regularly throughout your work session.',
      },
    ],
  };
}

function stressColor(v: number) {
  return v >= 55 ? '#e76f51' : v >= 35 ? '#f4a261' : '#74c69d';
}

export function getDemoDashboardStats(range: string): DashboardStats {
  if (range === 'today') {
    return {
      stress_score: 71, stress_label: 'High', emotional_state: 'Overwhelmed',
      session_data: [{ name: 'Now', value: 71, color: '#e76f51' }],
      typing_data: [{ name: 'Now', speed: 40 }],
    };
  }
  if (range === 'month') {
    const vals = [20, 63, 73, 38];
    const speeds = [75, 48, 40, 62];
    return {
      stress_score: 38, stress_label: 'Normal', emotional_state: 'Normal',
      session_data: vals.map((v, i) => ({ name: `Wk${i + 1}`, value: v, color: stressColor(v) })),
      typing_data: speeds.map((s, i) => ({ name: `Wk${i + 1}`, speed: s })),
    };
  }
  // week (default)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const vals = [18, 22, 59, 67, 74, 71, 35];
  const speeds = [78, 72, 52, 45, 38, 40, 63];
  return {
    stress_score: 71, stress_label: 'High', emotional_state: 'Overwhelmed',
    session_data: days.map((d, i) => ({ name: d, value: vals[i], color: stressColor(vals[i]) })),
    typing_data: days.map((d, i) => ({ name: d, speed: speeds[i] })),
  };
}

export function getDemoArticles(): Article[] {
  const authors = ['Dr. Sarah Chen', 'James Okafor'];
  const tags = ['Research', 'Wellness', 'Productivity', 'Health', 'Research', 'Wellness'];
  const readTimes = ['4 min read', '5 min read', '3 min read', '6 min read', '4 min read', '5 min read'];
  const articles: Array<{ title: string; excerpt: string; content: string }> = [
    {
      title: 'How Your Typing Rhythm Reveals Your Mental State',
      excerpt: 'Subtle changes in keystroke speed, pauses, and error rate can signal stress before you consciously feel it.',
      content: `Keyboard dynamics research has shown that the way we type is as unique as a fingerprint. When stress levels rise, the rhythm of our keystrokes changes in measurable ways — even before we notice the tension ourselves.\n\nStudies from MIT and Stanford have demonstrated that inter-key intervals (the time between pressing one key and the next) increase by an average of 23% during high-stress periods. Error rates climb, and the characteristic "flow" of typing breaks down into hesitant, irregular bursts.\n\nMindType's model was trained on over 50,000 typing sessions paired with self-reported stress scores and biometric data. The result is a system that can detect elevated stress with 84% accuracy from just 90 seconds of natural typing.\n\nThe practical implication is profound: your keyboard becomes a passive, continuous stress monitor — no wearable required, no conscious effort needed.`,
    },
    {
      title: 'The Hidden Stress Pattern: When Your Body Knows Before You Do',
      excerpt: 'MindType detected elevated stress in 78% of sessions where users reported feeling fine — here is what the data shows.',
      content: `One of the most striking findings from MindType's beta program was the prevalence of what researchers call "masked stress" — physiological and behavioral stress signals that users themselves did not consciously register.\n\nIn 78% of sessions where the model flagged high stress, users initially reported feeling "fine" or "normal." Yet follow-up surveys conducted 2–4 hours later revealed that most of those users had experienced a stressful event, made a difficult decision, or felt overwhelmed during that window.\n\nThe typing pattern signature of masked stress is distinct: deletion frequency rises sharply (users backspace more), while overall typing speed remains normal or even increases — a compensatory acceleration that masks the underlying dysregulation.\n\nRecognizing this pattern early allows for intervention before stress compounds. A two-minute breathing exercise taken at the right moment can prevent the cascade that leads to burnout.`,
    },
    {
      title: 'Five Desk Habits That Reduce Typing-Related Stress',
      excerpt: 'Small ergonomic and behavioral changes that measurably improve your keystroke consistency within one week.',
      content: `Keystroke consistency — the regularity of your typing rhythm — is one of the strongest predictors of cognitive calm. The good news: it responds quickly to simple behavioral changes.\n\n1. The 20-20-20 rule extended: Every 20 minutes, look 20 feet away for 20 seconds, then shake out your hands for 10 seconds. Users who adopted this habit showed a 31% improvement in cv_flight (keystroke variability) within five days.\n\n2. Keyboard height matters more than you think. When your wrists are bent upward even slightly, forearm tension increases and typing rhythm becomes erratic. A wrist rest or keyboard tray that keeps wrists neutral can reduce deletion frequency by up to 18%.\n\n3. Silence notifications during deep work. Every notification interruption creates a micro-stress spike visible in the typing data for up to 4 minutes afterward.\n\n4. Hydration checkpoints. Mild dehydration (as little as 1.5% body weight) measurably slows cognitive processing and increases typing errors. A glass of water every 90 minutes is sufficient.\n\n5. End-of-session wind-down. Spending the last 5 minutes of a work session on low-stakes tasks (email triage, calendar review) allows the nervous system to decelerate naturally.`,
    },
    {
      title: 'Understanding Cognitive Load Through Keystroke Patterns',
      excerpt: 'When the brain is overloaded, the first place it shows up is in motor control — especially the fingers.',
      content: `Cognitive load theory, developed by John Sweller in the 1980s, describes the mental effort required to process information. What Sweller could not have anticipated was that this invisible mental burden would one day be measurable through the fingers.\n\nMotor control is one of the first systems to degrade under high cognitive load. The prefrontal cortex, responsible for planning and sequencing, begins to allocate resources away from fine motor coordination when it is overwhelmed with decision-making or complex problem-solving.\n\nIn typing, this manifests as increased pause duration before complex words, higher variability in inter-key intervals, and a characteristic pattern of "burst-pause-burst" rather than smooth continuous flow. MindType's feature extraction pipeline captures all three signals.\n\nThe practical application extends beyond stress detection. Cognitive load monitoring can help knowledge workers identify when they have hit their processing ceiling — the point at which continuing to work produces diminishing returns and increases error rates in their actual output, not just their typing.`,
    },
    {
      title: 'The Science of Typing Speed and Emotional State',
      excerpt: 'A review of 14 studies linking words-per-minute variability to cortisol levels and self-reported stress.',
      content: `A 2024 meta-analysis published in the Journal of Human-Computer Interaction synthesized findings from 14 independent studies examining the relationship between typing behavior and emotional state. The combined dataset covered 8,400 participants across 6 countries.\n\nThe most robust finding: coefficient of variation in flight time (cv_flight) — a measure of how irregular the gaps between keystrokes are — showed a statistically significant positive correlation with salivary cortisol levels (r = 0.67, p < 0.001). In plain terms: the more erratic your typing rhythm, the higher your stress hormone levels.\n\nWords-per-minute alone was a poor predictor of stress, confirming that raw speed is not the signal — rhythm is. A fast but consistent typist may be in a calm, focused state, while a fast but erratic typist is likely under significant cognitive or emotional pressure.\n\nDeletion frequency emerged as the second strongest predictor, particularly for anxiety-type stress as opposed to fatigue-type stress. The two have distinct signatures, and MindType's model was trained to distinguish between them.`,
    },
    {
      title: 'Building a Digital Wellness Routine Around Your Keyboard Data',
      excerpt: 'How to use your typing metrics as a daily check-in for mental health, without becoming obsessed with the numbers.',
      content: `The promise of passive biometric monitoring is compelling: continuous insight into your mental state without any conscious effort. The risk is equally real: metric obsession, anxiety about your own data, and the paradox of monitoring stress causing stress.\n\nThe key is to treat your typing data as a weather report, not a report card. Just as you check the forecast to decide whether to bring an umbrella — not to feel guilty about rain — your stress score should inform decisions, not judgments.\n\nA sustainable digital wellness routine built around keyboard data looks like this: a 30-second morning glance at your weekly trend (not today's score), a mid-afternoon check-in if you feel off, and a weekly review to identify patterns (Monday mornings, pre-deadline Thursdays).\n\nThe goal is not a perfect score. The goal is awareness — catching the moments when your body is signaling something your conscious mind has not yet registered, and responding with the small interventions (a walk, a breath, a glass of water) that prevent small stress from becoming large burnout.`,
    },
  ];

  const imageMap: Record<number, string> = {
    1: '/article-1-nature.svg',
    3: '/article-3-nature.svg',
    4: '/article-4-nature.svg',
    5: '/article-5-nature.svg',
    6: '/article-6-nature.svg',
  };

  return articles.map((a, i) => ({
    id: i + 1,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    image: imageMap[i + 1] ?? `/article-${i + 1}.jpg`,
    tag: tags[i],
    read_time: readTimes[i],
    author: { name: authors[i % 2], avatar: '', date: 'Apr 28, 2026' },
  }));
}

export function getDemoArticle(id: number): Article {
  return getDemoArticles().find((a) => a.id === id) ?? getDemoArticles()[0];
}

const DEMO_REPLIES = [
  "Based on your recent typing patterns, I'd suggest a short break. Elevated keystroke variability is often the first sign of stress — before you consciously feel it.\n\nTry box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. It takes under 2 minutes.",
  "Your data shows your sharpest focus happens in the morning when typing rhythm is most consistent. Protect that time for your hardest tasks and schedule meetings for the afternoon.",
  "Stress management starts with awareness. You've completed your assessment — that's already the most important step. Would you like a 5-day stress-reduction plan based on your typing profile?",
  "High typing variability (cv_flight > 1.5) often correlates with decision fatigue rather than acute stress. If you're making important choices today, consider a 10-minute walk first.",
];

export function getDemoChatReply(_message: string): ChatResponse {
  return { reply: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)] };
}

export function getDemoProfileUpdate(data: UpdateProfileRequest): User {
  return { ...useAppState.getState().currentUser!, ...data };
}
