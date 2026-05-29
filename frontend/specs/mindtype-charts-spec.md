# MindType AI — React Frontend: Charts & Demo Data Specification

> Version: 3.0 · Date: 2026-05-11
> Frontend: TypeScript + React 18 + Vite at `frontend/src/`
> Chart library: **Recharts** (already installed)
> Audience: Any developer or AI model wiring up charts and demo data in this SPA

---

## ⚠️ Important: This Is the TypeScript Frontend

This spec covers `frontend/src/` — the React SPA. It does **not** cover the Python/Streamlit
app in `data & ai by ElDeep/mindtype-ai/`. Those are separate projects. Do not confuse them.

---

## 1. How Demo Mode Works

The frontend ships with a zero-backend demo mode controlled by two env vars in `.env.local`:

```
VITE_DEMO_EMAIL=admin@subl.app
VITE_DEMO_PASSWORD=subl2026
```

### Existing demo wiring (already done)

| Location | What it does |
|---|---|
| `src/lib/demoAuth.ts → tryDemoLogin()` | Returns fake token `"demo-bypass-token"` + demo user |
| `src/pages/Login.tsx` | Calls `tryDemoLogin()` before real API |
| `src/lib/demoAuth.ts → getDemoAssessmentResult()` | Returns hardcoded assessment result |
| `src/pages/StressAssessment.tsx` | Calls `getDemoAssessmentResult()` when `isDemoSession()` |

### Missing demo wiring (must be added)

These pages call the real backend even in demo mode:

| Page | API call that fails | Fix |
|---|---|---|
| `src/pages/Dashboard.tsx` | `dashboardApi.getStats(range)` | Add demo check |
| `src/pages/Articles.tsx` | `articlesApi.list(sort)` | Add demo check |
| `src/pages/ArticleDetail.tsx` | `articlesApi.get(id)` | Add demo check |
| `src/pages/SubiAI.tsx` | `chatApi.send(data)` | Add demo check |
| `src/pages/Settings.tsx` | `userApi.updateProfile(data)` | Add demo check |

### Pattern to follow for every fix

```ts
// BEFORE
const data = await someApi.call(args);

// AFTER
const data = isDemoSession()
  ? getDemoXxx(args)
  : await someApi.call(args);
```

---

## 2. Data Shapes → Chart Mapping

### 2.1 Dashboard Page (`GET /dashboard/stats`)

**Response type: `DashboardStats`** (see `src/types/index.ts`)

```ts
interface DashboardStats {
  emotional_state: string;        // "Calm" | "Anxious" | "Overwhelmed" | "Normal"
  stress_score: number;           // 0–100 integer
  stress_label: 'Normal' | 'Medium' | 'High';
  session_data: { name: string; value: number; color: string }[];
  typing_data: { name: string; speed: number }[];
}
```

| Chart | Component | Fed by | Notes |
|---|---|---|---|
| Session Duration | `<BarChart>` | `session_data` | Each bar = one time slot; `value` = stress score 0-100; `color` = per-bar hex |
| Real Time Statistics | `<PieChart>` half-donut | `stress_score` | Three segments derived: high/medium/low proportions |
| Typing Speed | `<AreaChart>` | `typing_data` | `speed` = WPM |

**Color coding for `session_data`:**
```ts
const barColor = (value: number) =>
  value >= 55 ? '#e76f51'   // high stress — red
  : value >= 35 ? '#f4a261' // medium — amber
  : '#74c69d';              // low — green
```

### 2.2 Assessment Page (`POST /assessment/submit`)

**Response type: `AssessmentResult`** — already handled in demo mode.

### 2.3 Articles Page (`GET /articles`)

**Response type: `Article[]`** (see `src/types/index.ts`)

```ts
interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;        // empty string is fine — placeholder shown
  tag: string;          // "Research" | "Wellness" | "Productivity" | "Health"
  read_time: string;    // "4 min read"
  author: { name: string; avatar: string; date: string };
  content: string;      // plain text, newlines for paragraphs
}
```

### 2.4 Chat Page (`POST /chat`)

**Response type: `ChatResponse`**
```ts
interface ChatResponse { reply: string }
```
The demo reply should be contextual (2–3 sentences), stress/wellness themed.

---

## 3. Demo Data Story

The demo tells a 4-act stress narrative that makes all charts meaningful.

### The 4-act arc

| Act | Theme | Stress Score | Emotional State | Typing Speed |
|---|---|---|---|---|
| 1 (Mon–Tue) | Calm baseline | 18–22 | Calm | 72–78 WPM |
| 2 (Wed–Thu) | Acknowledged stress | 59–67 | Anxious | 45–52 WPM |
| 3 (Thu–Fri) | Hidden stress | 71–75 | Overwhelmed | 38–42 WPM |
| 4 (Sat) | Recovery | 35–41 | Normal | 61–65 WPM |

This arc should be reflected in `session_data` and `typing_data` for `range=week`.

### Demo data per range

**`range=today`** — Single high-stress session, Act 3 flavor. Stress 71, Overwhelmed.

**`range=week`** — 7 points (Mon–Sun), full 4-act arc as above.

**`range=month`** — 4 weekly aggregates showing the arc compressed: [20, 63, 73, 38].

### Gauge colors (Real Time Statistics)
`stress_score` in the demo data drives the half-donut. For Act 3 (score=71):
- Red segment (High): `Math.round(71 * 0.4) = 28`
- Amber (Medium): `Math.round(71 * 0.35) = 25`
- Green (Low): `100 - 28 - 25 = 47`

---

## 4. Demo Data Implementation

All demo data should live in `src/lib/demoAuth.ts` alongside `tryDemoLogin`.

### 4.1 `getDemoDashboardStats(range: string): DashboardStats`

```ts
export function getDemoDashboardStats(range: string): DashboardStats {
  const barColor = (v: number) => v >= 55 ? '#e76f51' : v >= 35 ? '#f4a261' : '#74c69d';

  if (range === 'today') {
    return {
      emotional_state: 'Overwhelmed',
      stress_score: 71,
      stress_label: 'High',
      session_data: [{ name: 'Now', value: 71, color: barColor(71) }],
      typing_data: [{ name: 'Now', speed: 40 }],
    };
  }

  if (range === 'month') {
    const weekly = [
      { name: 'Wk 1', value: 20 }, { name: 'Wk 2', value: 63 },
      { name: 'Wk 3', value: 73 }, { name: 'Wk 4', value: 38 },
    ];
    return {
      emotional_state: 'Normal',
      stress_score: 38,
      stress_label: 'Normal',
      session_data: weekly.map(w => ({ ...w, color: barColor(w.value) })),
      typing_data: [
        { name: 'Wk 1', speed: 75 }, { name: 'Wk 2', speed: 48 },
        { name: 'Wk 3', speed: 40 }, { name: 'Wk 4', speed: 62 },
      ],
    };
  }

  // week (default)
  const week = [
    { name: 'Mon', stress: 18, speed: 78 },
    { name: 'Tue', stress: 22, speed: 72 },
    { name: 'Wed', stress: 59, speed: 52 },
    { name: 'Thu', stress: 67, speed: 45 },
    { name: 'Fri', stress: 74, speed: 38 },
    { name: 'Sat', stress: 71, speed: 40 },
    { name: 'Sun', stress: 35, speed: 63 },
  ];
  return {
    emotional_state: 'Overwhelmed',
    stress_score: 71,
    stress_label: 'High',
    session_data: week.map(d => ({ name: d.name, value: d.stress, color: barColor(d.stress) })),
    typing_data: week.map(d => ({ name: d.name, speed: d.speed })),
  };
}
```

### 4.2 `getDemoArticles(): Article[]`

6 articles, IDs 1–6. Stress/wellness/productivity themed. Use image paths from `/public/article-1.jpg` through `/article-6.jpg` (already present). Content 3–4 short paragraphs.

Topics: keyboard dynamics & stress, mindfulness while typing, the hidden stress pattern, digital wellness, typing ergonomics, cognitive load & keystrokes.

```ts
export function getDemoArticles(): Article[] {
  return [
    {
      id: 1,
      title: 'How Your Typing Rhythm Reveals Your Mental State',
      excerpt: 'Research shows that subtle changes in how you type — speed, pauses, error rate — can signal stress before you consciously feel it.',
      image: '/article-1.jpg',
      tag: 'Research',
      read_time: '4 min read',
      author: { name: 'Dr. Sarah Chen', avatar: '', date: 'Apr 28, 2026' },
      content: 'When psychologists first started looking at keystroke dynamics...\n\nThe key insight is that motor control degrades under stress...\n\nThis is exactly the signal MindType monitors in real time.',
    },
    // ... 5 more articles
  ];
}

export function getDemoArticle(id: number): Article {
  const all = getDemoArticles();
  return all.find(a => a.id === id) ?? all[0];
}
```

### 4.3 `getDemoChatReply(message: string): ChatResponse`

```ts
export function getDemoChatReply(_message: string): ChatResponse {
  const replies = [
    "Based on your recent typing patterns, I'd suggest a 5-minute breathing break. Your keystrokes show elevated variability — a common early sign of stress.\n\nTry box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.",
    "Great question! Stress management starts with awareness. Your data shows your best focus hours are early morning when typing speed and consistency are highest. Protect that window.",
    "Your typing rhythm is your stress fingerprint. When cv_flight rises above 1.5, that's when I'd recommend stepping away from demanding tasks.",
  ];
  return { reply: replies[Math.floor(Math.random() * replies.length)] };
}
```

### 4.4 `getDemoProfileUpdate(data): User`

For Settings — just merge the update data into the current user and return it:
```ts
export function getDemoProfileUpdate(data: UpdateProfileRequest): User {
  const current = useAppState.getState().currentUser!;
  return { ...current, ...data };
}
```

---

## 5. Wiring Demo Checks into Pages

### Dashboard.tsx

```ts
// In the useEffect:
dashboardApi.getStats(timeRange)
// becomes:
isDemoSession()
  ? Promise.resolve(getDemoDashboardStats(timeRange))
  : dashboardApi.getStats(timeRange)
```

### Articles.tsx

```ts
articlesApi.list(sortBy || undefined)
// becomes:
isDemoSession()
  ? Promise.resolve(getDemoArticles())
  : articlesApi.list(sortBy || undefined)
```

### ArticleDetail.tsx

```ts
articlesApi.get(Number(id))
// becomes:
isDemoSession()
  ? Promise.resolve(getDemoArticle(Number(id)))
  : articlesApi.get(Number(id))
```

### SubiAI.tsx

```ts
await chatApi.send({ message: input.trim() })
// becomes:
isDemoSession()
  ? getDemoChatReply(input.trim())
  : await chatApi.send({ message: input.trim() })
```

### Settings.tsx

```ts
await userApi.updateProfile(data)
// becomes:
isDemoSession()
  ? getDemoProfileUpdate(data)
  : await userApi.updateProfile(data)
```

---

## 6. Success Criteria

After all changes, a fresh browser session with demo credentials should:

- [ ] Login with `admin@subl.app` / `subl2026` → lands on Dashboard
- [ ] Dashboard shows 7-bar chart (Mon–Sun) with the stress arc (green → red → amber)
- [ ] Dashboard gauge shows `High` / `71%`
- [ ] Toggle range to `month` → 4 weekly bars appear
- [ ] Articles page shows 6 article cards, no error state
- [ ] Click any article → full article loads
- [ ] Chat page → send a message → AI reply appears within ~200ms
- [ ] Settings → edit name → save works, profile updates without error
- [ ] Assessment → submit → results page with score and recommendations

---

## 7. What This Spec Does NOT Cover

- The Python/Streamlit frontend in `data & ai by ElDeep/mindtype-ai/` — separate project
- Real backend wiring — that's documented in `specs/backend-spec.md`
- Chart library migration (Recharts is correct, do not switch to Plotly)
