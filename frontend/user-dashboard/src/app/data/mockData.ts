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

// ─── KPI per period ───────────────────────────────────────────────────────────

export type KpiPeriod = { avgStress: string };

export const KPI_PERIODS: Record<string, KpiPeriod> = {
  "Today":      { avgStress: "34" },
  "This Week":  { avgStress: "38" },
  "This Month": { avgStress: "41" },
  "This Year":  { avgStress: "36" },
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
];

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const initialChatMessages = [
  {
    id: "m1",
    role: "assistant" as const,
    content:
      "Hi, I'm **SUBL** — your stress-management assistant. I can explain your stress insights, share quick practical tips, and help you navigate the app.\n\nNote: stress estimates are based on your typing behavior and aren't fully accurate.\n\nHow can I help? Pick a quick action below, or just ask me anything.",
    timestamp: new Date(Date.now() - 300000),
  },
];

// Quick actions — must match the labels handled by the chatbot (chat.py build_prompt)
export const promptChips = [
  { id: "p1", label: "Help Me Relax",       icon: "Wind"      },
  { id: "p2", label: "Quick Stress Tips",   icon: "Activity"  },
  { id: "p3", label: "Why Am I Stressed",   icon: "BarChart2" },
  { id: "p4", label: "How To Focus Better", icon: "Target"    },
  { id: "p5", label: "Explain My Results",  icon: "FileText"  },
];

// Offline fallback replies — used only if the chatbot service is unreachable.
// Keys mirror the quick actions above.
export const aiResponses: Record<string, string> = {
  "Help Me Relax":
    "Let's reset in a minute:\n\n• **Breathe 4-7-8** — inhale 4s, hold 7s, exhale 8s. Repeat 4 times.\n• **Drop your shoulders** and unclench your jaw.\n• **Look away** from the screen at something far for 20 seconds.\n\nTry one now — most people feel calmer after a couple of cycles.",

  "Quick Stress Tips":
    "A few quick, practical tips:\n\n• Take a short break — even 5 minutes away from the screen helps.\n• Drink some water; mild dehydration adds to stress.\n• Do one task at a time instead of switching.\n• Take 3 slow breaths before your next thing.",

  "Why Am I Stressed":
    "Stress often builds up from a few everyday things:\n\n• A heavy or unclear workload\n• Too many interruptions or context-switching\n• Tight deadlines or time pressure\n• Not enough breaks or rest\n\nNoticing the trigger is the first step. Which of these feels closest right now?",

  "How To Focus Better":
    "To focus better, reduce distractions and work in short blocks:\n\n• Close non-essential tabs and silence notifications.\n• Work in focused 25-minute blocks with short breaks.\n• Keep one clear task in front of you at a time.\n• Put your phone out of reach while you work.",

  "Explain My Results":
    "Your stress score is an estimate from your typing behavior — lower is calmer, higher means more signs of stress. It's a rough signal, not a diagnosis.\n\n• **Low** — you're in a comfortable range.\n• **Moderate** — a good moment for a short break.\n• **High** — consider stepping away and trying a relaxation tip.\n\nWant me to suggest something based on how you're feeling?",
};

// ─── Assessment ───────────────────────────────────────────────────────────────

export const assessmentQuestions = [
  { id: "q1", text: "How stressed do you feel right now?",       category: "Stress"     },
  { id: "q2", text: "How difficult is it to concentrate?",       category: "Focus"      },
  { id: "q3", text: "Do you feel mentally overwhelmed?",         category: "Overwhelm"  },
  { id: "q4", text: "How anxious do you feel?",                  category: "Anxiety"    },
  { id: "q5", text: "Do you feel pressure from current tasks?",  category: "Control"    },
];


