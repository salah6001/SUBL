import type { QuickOption, DateFilter } from "../components/DateFilterBar";
import { differenceInCalendarDays } from "date-fns";

// ─── User ─────────────────────────────────────────────────────────────────────

export const currentUser = {
  name: "Alex Johnson",
  email: "alex.johnson@company.com",
  phone: "+1 (555) 234-5678",
  role: "Senior Product Manager",
  avatar: "AJ",
  department: "Product & Strategy",
};

// ─── Habit types ──────────────────────────────────────────────────────────────

export type HabitCategory = "Mindfulness" | "Physical" | "Nutrition" | "Focus" | "Recovery";

export interface Habit {
  id: string;
  label: string;
  category: HabitCategory;
  icon: string;
  completed: boolean;
  streak: number;
}

export const defaultHabits: Habit[] = [
  { id: "h1", label: "5-Min Box Breathing",           category: "Mindfulness", icon: "Wind",        completed: false, streak: 7  },
  { id: "h2", label: "10-Min Morning Walk",            category: "Physical",    icon: "Activity",    completed: true,  streak: 3  },
  { id: "h3", label: "Drink 8 Glasses of Water",       category: "Nutrition",   icon: "Droplets",    completed: true,  streak: 12 },
  { id: "h4", label: "2× 25-Min Deep Work Blocks",     category: "Focus",       icon: "Target",      completed: false, streak: 5  },
  { id: "h5", label: "No Screens 30 Min Before Bed",   category: "Recovery",    icon: "Moon",        completed: false, streak: 2  },
  { id: "h6", label: "Gratitude Journal – 3 Items",    category: "Mindfulness", icon: "BookOpen",    completed: false, streak: 1  },
  { id: "h7", label: "Desk Stretching Routine",        category: "Physical",    icon: "Dumbbell",    completed: true,  streak: 8  },
  { id: "h8", label: "Take a Pomodoro Screen Break",   category: "Focus",       icon: "Timer",       completed: false, streak: 4  },
];

// ─── Chart data types ─────────────────────────────────────────────────────────

export type StressCurveRow = { time: string; score: number; zone: string };
export type EmotionRow     = { name: string; value: number; color: string };
export type BiometricRow   = { time: string; wpm: number; errorRate: number };

// ─── Stress curve data ────────────────────────────────────────────────────────

const STRESS_TODAY: StressCurveRow[] = [
  { time: "9:00",  score: 22, zone: "Calm"        },
  { time: "9:30",  score: 28, zone: "Calm"        },
  { time: "10:00", score: 44, zone: "Focused"     },
  { time: "10:30", score: 55, zone: "Mild Stress" },
  { time: "11:00", score: 68, zone: "High Stress" },
  { time: "11:30", score: 76, zone: "High Stress" },
  { time: "12:00", score: 58, zone: "Mild Stress" },
  { time: "12:30", score: 38, zone: "Focused"     },
  { time: "13:00", score: 41, zone: "Focused"     },
  { time: "13:30", score: 47, zone: "Focused"     },
  { time: "14:00", score: 64, zone: "Mild Stress" },
  { time: "14:30", score: 73, zone: "High Stress" },
  { time: "15:00", score: 62, zone: "Mild Stress" },
  { time: "15:30", score: 49, zone: "Focused"     },
  { time: "16:00", score: 37, zone: "Focused"     },
  { time: "16:30", score: 30, zone: "Calm"        },
  { time: "17:00", score: 24, zone: "Calm"        },
];

const STRESS_WEEK: StressCurveRow[] = [
  { time: "Mon", score: 52, zone: "Mild Stress" },
  { time: "Tue", score: 41, zone: "Focused"     },
  { time: "Wed", score: 68, zone: "High Stress" },
  { time: "Thu", score: 45, zone: "Focused"     },
  { time: "Fri", score: 28, zone: "Calm"        },
  { time: "Sat", score: 22, zone: "Calm"        },
  { time: "Sun", score: 18, zone: "Calm"        },
];

const STRESS_MONTH: StressCurveRow[] = [
  { time: "Wk 1", score: 48, zone: "Focused"     },
  { time: "Wk 2", score: 55, zone: "Mild Stress" },
  { time: "Wk 3", score: 62, zone: "Mild Stress" },
  { time: "Wk 4", score: 38, zone: "Focused"     },
];

// ─── Emotional distribution data ──────────────────────────────────────────────

const EMOTION_TODAY: EmotionRow[] = [
  { name: "Flow State",   value: 30, color: "#3b82f6" },
  { name: "Calm",         value: 35, color: "#22c55e" },
  { name: "High Stress",  value: 22, color: "#ef4444" },
  { name: "Burnout Risk", value: 13, color: "#f59e0b" },
];
const EMOTION_WEEK: EmotionRow[] = [
  { name: "Flow State",   value: 28, color: "#3b82f6" },
  { name: "Calm",         value: 30, color: "#22c55e" },
  { name: "High Stress",  value: 25, color: "#ef4444" },
  { name: "Burnout Risk", value: 17, color: "#f59e0b" },
];
const EMOTION_MONTH: EmotionRow[] = [
  { name: "Flow State",   value: 32, color: "#3b82f6" },
  { name: "Calm",         value: 33, color: "#22c55e" },
  { name: "High Stress",  value: 20, color: "#ef4444" },
  { name: "Burnout Risk", value: 15, color: "#f59e0b" },
];

// ─── Biometric correlation data ───────────────────────────────────────────────

const BIOMETRIC_TODAY: BiometricRow[] = [
  { time: "9:00",  wpm: 78, errorRate: 2.1 },
  { time: "10:00", wpm: 85, errorRate: 1.8 },
  { time: "11:00", wpm: 58, errorRate: 4.9 },
  { time: "11:30", wpm: 52, errorRate: 6.2 },
  { time: "12:00", wpm: 67, errorRate: 3.4 },
  { time: "13:00", wpm: 80, errorRate: 2.0 },
  { time: "14:00", wpm: 55, errorRate: 5.7 },
  { time: "14:30", wpm: 48, errorRate: 7.1 },
  { time: "15:00", wpm: 65, errorRate: 3.8 },
  { time: "16:00", wpm: 76, errorRate: 2.3 },
  { time: "17:00", wpm: 73, errorRate: 2.6 },
];
const BIOMETRIC_WEEK: BiometricRow[] = [
  { time: "Mon", wpm: 68, errorRate: 3.5 },
  { time: "Tue", wpm: 75, errorRate: 2.8 },
  { time: "Wed", wpm: 55, errorRate: 5.9 },
  { time: "Thu", wpm: 72, errorRate: 2.9 },
  { time: "Fri", wpm: 80, errorRate: 2.0 },
  { time: "Sat", wpm: 82, errorRate: 1.8 },
  { time: "Sun", wpm: 78, errorRate: 2.2 },
];
const BIOMETRIC_MONTH: BiometricRow[] = [
  { time: "Wk 1", wpm: 72, errorRate: 3.1 },
  { time: "Wk 2", wpm: 68, errorRate: 3.8 },
  { time: "Wk 3", wpm: 61, errorRate: 5.2 },
  { time: "Wk 4", wpm: 75, errorRate: 2.7 },
];

// ─── Data getters ─────────────────────────────────────────────────────────────

function pickQuick(filter: DateFilter): QuickOption {
  if (typeof filter === "string") return filter;
  const days = differenceInCalendarDays(filter.end, filter.start) + 1;
  if (days <= 7)  return "This Week";
  if (days <= 31) return "This Month";
  return "This Year";
}

export function getStressCurveData(f: DateFilter): StressCurveRow[] {
  const q = pickQuick(f);
  if (q === "Today")      return STRESS_TODAY;
  if (q === "This Week")  return STRESS_WEEK;
  return STRESS_MONTH;
}
export function getEmotionData(f: DateFilter): EmotionRow[] {
  const q = pickQuick(f);
  if (q === "Today")      return EMOTION_TODAY;
  if (q === "This Week")  return EMOTION_WEEK;
  return EMOTION_MONTH;
}
export function getBiometricData(f: DateFilter): BiometricRow[] {
  const q = pickQuick(f);
  if (q === "Today")      return BIOMETRIC_TODAY;
  if (q === "This Week")  return BIOMETRIC_WEEK;
  return BIOMETRIC_MONTH;
}

// ─── KPI per period ───────────────────────────────────────────────────────────

export type KpiPeriod = { avgStress: string; focusHrs: string };

export const KPI_PERIODS: Record<string, KpiPeriod> = {
  "Today":      { avgStress: "34", focusHrs: "3.2"  },
  "This Week":  { avgStress: "38", focusHrs: "18.5" },
  "This Month": { avgStress: "41", focusHrs: "74"   },
  "This Year":  { avgStress: "36", focusHrs: "820"  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const initialNotifications = [
  { id: "n1", title: "Stress Alert Detected",      message: "Elevated typing patterns detected. Consider a 5-min break.",  time: "2 min ago",  read: false, type: "warning" as const },
  { id: "n2", title: "Weekly Report Ready",        message: "Your stress analysis for this week is now available.",        time: "1 hour ago", read: false, type: "info"    as const },
  { id: "n3", title: "Wellness Goal Achieved",     message: "3 consecutive low-stress days! Keep it up! 🎉",              time: "3 hours ago",read: false, type: "success" as const },
  { id: "n4", title: "New Article Available",      message: "5 Mindfulness Techniques for the Modern Workplace",          time: "Yesterday",  read: true,  type: "info"    as const },
  { id: "n5", title: "Baseline Recalibration Due", message: "30 days since your last baseline stress assessment.",        time: "2 days ago", read: true,  type: "warning" as const },
];

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articles = [
  {
    id: "a1",
    title: "5 Science-Backed Techniques to Manage Workplace Stress",
    author: "Dr. Sarah Mitchell",
    authorRole: "Clinical Psychologist",
    readTime: "6 min read",
    category: "Stress Management",
    image: "https://images.unsplash.com/photo-1758874384683-0accd9fb26ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "Evidence-based strategies that top executives use to maintain peak performance under pressure.",
    content: `Workplace stress is one of the leading causes of burnout, affecting nearly 77% of professionals at some point in their careers.

**1. The 4-7-8 Breathing Technique**

Developed by Dr. Andrew Weil, this breathing pattern acts as a natural tranquilizer. Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 cycles.

**2. Cognitive Reframing**

Change how you interpret stressful events. Instead of "This deadline is impossible," try "This deadline is challenging, but manageable." Studies show this reduces perceived stress by up to 40%.

**3. The Pomodoro Method**

Work in focused 25-minute intervals followed by 5-minute breaks. This prevents cognitive fatigue throughout the workday.

**4. Mindful Micro-Breaks**

Even 60 seconds of intentional mindfulness between meetings can reset your nervous system. Focus on:

• 5 things you can see
• 4 things you can touch
• 3 things you can hear`,
  },
  {
    id: "a2",
    title: "How AI Is Revolutionizing Mental Health Monitoring at Work",
    author: "James Park",
    authorRole: "AI & Wellness Researcher",
    readTime: "8 min read",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "From keystroke dynamics to sentiment analysis, multimodal AI systems are creating a new paradigm for proactive employee wellbeing.",
    content: `The intersection of artificial intelligence and mental health represents one of the most promising frontiers in modern wellness technology.

**Multimodal Stress Detection**

Traditional stress monitoring relied on self-reporting, which is inherently subjective. AI-driven systems analyze multiple data streams simultaneously — typing patterns, response latencies, communication sentiment.

**Keystroke Dynamics: The Science**

Every person has a unique typing rhythm. Under stress, dwell times increase, error rates rise, and backspace usage spikes. AI models trained on thousands of profiles detect these deviations with 94% accuracy.

**Privacy-First Architecture**

All processing happens on-device or in encrypted environments. Data is never sold to third parties, and users maintain full control.`,
  },
  {
    id: "a3",
    title: "The Deep Work Method: Achieving Flow State in Open Offices",
    author: "Dr. Priya Sharma",
    authorRole: "Organizational Psychologist",
    readTime: "5 min read",
    category: "Productivity",
    image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "Cal Newport's 'Deep Work' principles adapted for modern open-plan workspaces. Reclaim your focus even in noisy environments.",
    content: `Cal Newport argues that the ability to focus without distraction on cognitively demanding tasks is becoming increasingly rare and valuable.

**Understanding Flow State**

Csikszentmihalyi's research defines flow as complete absorption in a challenging task, characterized by effortless concentration and intrinsic satisfaction.

**The 4 Disciplines of Deep Work**

• Time Blocking: Schedule 2–4 hour deep work blocks
• Attention Management: Write down pending tasks before each session
• Environmental Design: Use noise-canceling headphones and a specific playlist
• Digital Minimalism: Close all communication apps during deep work`,
  },
  {
    id: "a4",
    title: "Nutrition for the Stressed Brain: What to Eat During Crunch Time",
    author: "Maya Rodriguez",
    authorRole: "Registered Dietitian & Neuroscientist",
    readTime: "7 min read",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "Your brain consumes 20% of your body's energy. During high-stress periods, nutritional needs shift dramatically.",
    content: `When you're in the middle of a high-pressure sprint, reaching for coffee and processed snacks feels logical. But these choices amplify the stress response.

**The Cortisol-Nutrition Connection**

Chronic stress elevates cortisol, depleting key nutrients including magnesium, B vitamins, and zinc.

**Top Stress-Fighting Foods**

• Complex Carbohydrates: Oats, brown rice, and sweet potatoes
• Omega-3 Fatty Acids: Salmon, walnuts, and flaxseed reduce neuroinflammation
• Magnesium-Rich Foods: Dark chocolate, spinach, and almonds
• Adaptogens: Ashwagandha shows significant cortisol-lowering effects`,
  },
  {
    id: "a5",
    title: "Sleep Optimization: The Underrated Performance Multiplier",
    author: "Dr. Thomas Chen",
    authorRole: "Sleep Medicine Specialist",
    readTime: "9 min read",
    category: "Recovery",
    image: "https://images.unsplash.com/photo-1552858725-2758b5fb1286?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "Matthew Walker calls sleep 'the greatest legal performance-enhancing drug.' Optimize your sleep architecture for peak performance.",
    content: `Sleep is not a luxury — it's a biological necessity. Yet 35% of professionals get less than 7 hours per night.

**Sleep Deprivation and Stress: A Vicious Cycle**

Insufficient sleep elevates cortisol and reduces prefrontal cortex activity while amplifying amygdala reactivity by up to 60%.

**The 10-3-2-1-0 Protocol**

• 10 hours before bed: No more caffeine
• 3 hours before bed: No more food or alcohol
• 2 hours before bed: No more work
• 1 hour before bed: No more screens
• 0: The number of times you'll hit snooze`,
  },
  {
    id: "a6",
    title: "Building a Resilient Team: Manager's Guide to Stress Prevention",
    author: "Christine Walker",
    authorRole: "Executive Coach & Leadership Consultant",
    readTime: "10 min read",
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1681949103006-70066fb25dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    excerpt: "Psychological safety, workload transparency, and team rituals that prevent burnout before it starts.",
    content: `Team resilience is not built in a crisis — it's built in the ordinary moments of daily work.

**The Psychological Safety Foundation**

Amy Edmondson's research shows that team psychological safety is the single most important predictor of team effectiveness and stress resilience.

**Workload Transparency**

Invisible workload is a primary driver of team stress. Implement visible WIP limits using Kanban boards.

**The Weekly Rhythm**

Establish predictable meeting cadences and "maker time" blocks. Unpredictable schedules are chronically stressful.`,
  },
];

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const initialChatMessages = [
  {
    id: "m1",
    role: "assistant" as const,
    content:
      "Hello Alex! I'm Subl AI, your personal wellness assistant. I've analyzed your stress patterns from today's session — your overall score is **Normal** at 34/100. Great work maintaining balance today! 🌿\n\nHow can I help you? Ask me to analyze your focus, plan your routine, or guide you through a relaxation exercise.",
    timestamp: new Date(Date.now() - 300000),
  },
];

export const promptChips = [
  { id: "p1", label: "Analyze My Focus Today", icon: "BarChart2" },
  { id: "p2", label: "Plan My Routine",         icon: "Calendar"  },
  { id: "p3", label: "Help Me Relax",           icon: "Wind"      },
  { id: "p4", label: "Breathing Exercise",      icon: "Activity"  },
  { id: "p5", label: "Weekly Summary",          icon: "FileText"  },
  { id: "p6", label: "Focus Tips",              icon: "Target"    },
];

export const aiResponses: Record<string, string> = {
  "Analyze My Focus Today":
    "I've analyzed your focus data for today, Alex:\n\n**Peak Focus Window: 9:00–10:30 AM** ✅\nTyping speed was 85 WPM with only 1.8% error rate — you were in the zone.\n\n**Stress Spikes Detected:**\n• 11:00 AM — 68/100 (likely the 3-person standup)\n• 14:30 PM — 73/100 (post-lunch cognitive dip)\n\n**Recommendation:**\nSchedule deep work before 10:30 AM tomorrow.\n\n**Focus Score Today: 7.2/10** — Above your weekly average!",

  "Plan My Routine":
    "Based on your stress patterns, here's your optimized daily routine:\n\n**Morning (7:00 – 9:00 AM)**\n• 7:00 AM — 10-min mindfulness meditation\n• 7:30 AM — Light exercise\n• 8:30 AM — High-protein breakfast\n\n**Peak Work Block (9:00 – 11:30 AM)**\nYour stress data shows lowest levels in the morning — schedule deep work here.\n\n**Afternoon Reset (12:30 PM)**\n• 20-min walk away from screens\n• Avoid caffeine after 2:00 PM\n\n**Wind-Down (9:00 PM)**\n• Screen-free hour before sleep",

  "Help Me Relax":
    "Let's do a **4-7-8 Breathing Exercise** together:\n\n🌬️ **Inhale (4 counts)**\nClose your mouth and inhale through your nose.\n\n⏸️ **Hold (7 counts)**\nHold your breath. Feel your body settle.\n\n💨 **Exhale (8 counts)**\nExhale completely through your mouth with a whoosh.\n\nRepeat 4 cycles. Most people feel calmer after just 2 cycles.\n\n---\nAlternatives:\n• **5-5-5 Grounding** — 5 things you see, hear, touch\n• **Progressive Muscle Relaxation** — tense and release muscle groups",

  "Breathing Exercise":
    "Starting **Box Breathing** — used by Navy SEALs under extreme pressure:\n\n**Instructions:**\n1. **Inhale** through your nose for **4 seconds**\n2. **Hold** your breath for **4 seconds**\n3. **Exhale** slowly for **4 seconds**\n4. **Hold** again for **4 seconds**\n5. Repeat 4–6 cycles\n\n---\n🔬 **Why it works:** Box breathing activates the parasympathetic nervous system, counteracting the cortisol response. Practice 3x daily for measurable baseline improvement within 2 weeks.",

  "Weekly Summary":
    "**📅 Weekly Stress Report — May 19–25, 2026**\n\n**Overall Grade: B+ (Good)**\nAverage stress score: **38/100** ↓ 8 pts from last week 🎉\n\n**Day-by-Day:**\n• Monday: 52 ⚠️ Elevated\n• Tuesday: 41 ✅ Normal\n• Wednesday: 68 🔴 High Stress\n• Thursday: 45 ✅ Normal\n• Friday: 28 ✅ Low\n• Weekend: 20 ✅ Excellent\n\n**Achievements:**\n• 3 consecutive days below stress threshold\n• Typing fluency: +14 WPM average\n• Recovery time: 45 → 31 min",

  "Focus Tips":
    "Based on your typing dynamics:\n\n🎯 **Peak Window:** 9:00 – 11:30 AM\nLowest stress, highest typing fluency. Schedule deep work here.\n\n🔇 **Environment Tips:**\n• Use 40Hz binaural beats for focused work\n• Single window open — notifications reduce performance by 10%\n• Room temperature 70°F (21°C)\n\n⏱️ **Time Protocol:**\n• 52-17 Method: 52 min work + 17 min break\n• 2-minute rule: do anything under 2 min immediately",
};

// ─── Assessment ───────────────────────────────────────────────────────────────

export const assessmentQuestions = [
  { id: "q1", text: "How often have you felt unable to control important things in your work life this week?", category: "Control"   },
  { id: "q2", text: "How frequently have you felt nervous, anxious, or on edge during your workday?",         category: "Anxiety"   },
  { id: "q3", text: "How often have you found difficulty concentrating on tasks?",                            category: "Focus"     },
  { id: "q4", text: "How frequently have you experienced physical symptoms (headache, tight shoulders)?",    category: "Physical"  },
  { id: "q5", text: "How often have you felt difficulties were piling up so high you could not cope?",       category: "Overwhelm" },
];

export const typingTestParagraph =
  "The capacity for clear thinking diminishes as stress accumulates throughout the day. Effective professionals learn to recognize their personal stress signatures — the subtle shifts in behavior and cognition that precede burnout. By monitoring these patterns with intelligent tools, we can intervene early and maintain the mental clarity needed for peak performance.";
