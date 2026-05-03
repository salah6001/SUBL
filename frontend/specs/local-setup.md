# Subl Frontend — Local Setup & Demo Mode Guide

> Audience: any developer setting up this project for the first time
> Reading time: ~5 minutes

---

## What Is Subl?

Subl is a keyboard-dynamics stress detection app. It runs in the background while you work and uses your **typing patterns** — rhythm, speed, error rate, inter-key timing — to detect early signs of stress. It then surfaces wellness insights, a stress score, and personalized recommendations.

**There is no mouse tracking. Subl only observes keyboard interactions.**

### Core features

| Feature | Description |
|---|---|
| Onboarding | 3-slide intro explaining the app's purpose and privacy model |
| Sign Up / Log In | Email + password auth with full form validation |
| Forgot Password | 6-digit OTP email flow to reset the password |
| Stress Assessment | 5-question self-report + a typing baseline paragraph. The backend analyzes both and returns a stress score (0–100) with label (Normal / Medium / High), behavioral metrics, and personalized recommendations. |
| Dashboard | Live stress score gauge, emotional state label, session stress chart (bar), typing speed chart (area). Supports Today / Week / Month range toggle. |
| Articles | Grid of wellness articles fetched from the backend. Sortable by Newest or Popular. Each article opens a full detail page at its own URL (`/articles/:id`). |
| Subl AI | In-app chat interface connected to a backend LLM. Focused on stress management, wellness, and productivity advice. |
| Settings | Edit profile (name, email, phone), toggle notifications, change password, contact support. |

---

## Part 1 — Prerequisites

You need **Node.js version 20 or 22**. Earlier versions will not work (Vite 7 requires Node 20.19+).

### Check your current Node version

```bash
node --version
```

If it prints `v20.x.x` or `v22.x.x`, you're ready. If it prints `v18.x.x` or lower, install a newer version:

**Option A — nvm (recommended, no sudo needed):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# Close and reopen your terminal, then:
nvm install 20
nvm use 20
```

**Option B — system package manager (requires sudo):**
```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Part 2 — Install the Project

```bash
# Clone or copy the project, then:
cd path/to/frontend

npm install
```

This installs all dependencies (~1–2 minutes on first run). No global installs needed.

---

## Part 3 — Configure Environment Variables

The project uses two `.env` files:

| File | Committed? | Purpose |
|---|---|---|
| `.env` | Yes | Shared defaults (API base URL) |
| `.env.local` | No (gitignored) | Your local secrets and overrides |

### Step 1 — Copy the example

```bash
cp .env.example .env.local
```

### Step 2 — Open `.env.local` and fill it in

```env
# Required: where your backend API lives
# In demo mode (no backend), this value is ignored for bypassed routes
VITE_API_URL=http://localhost:8000/api

# Temporary demo bypass — pick any email and password you want
# Remove both lines when the backend is connected (see backend-spec.md § 10)
VITE_DEMO_EMAIL=admin@subl.app
VITE_DEMO_PASSWORD=subl2026
```

`VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` define the one account that can log in without a real backend. You choose the values — write down what you set.

---

## Part 4 — Run the App

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Part 5 — Walk Through Demo Mode

The demo bypass intercepts two API calls and returns fake data so you can navigate the entire app:

### 1. Onboarding (first launch only)

If this is a fresh session, you will see 3 onboarding slides. Click **Next** through them, then click **Get Started** to land on Sign Up.

### 2. Create an account

Fill in any name, email, phone, and password — the Sign Up form posts to the real backend. In demo mode the backend is not running, so **use Log In instead** (the form will fall back to demo mode automatically).

### 3. Log In with demo credentials

```
Email:    admin@subl.app       ← whatever you set in VITE_DEMO_EMAIL
Password: subl2026             ← whatever you set in VITE_DEMO_PASSWORD
```

Click **Log In**. The demo bypass returns a fake auth token and user object. No network call is made.

### 4. Complete the Assessment

You land on the Stress Assessment. Answer the 5 questions (any values), then click **Next**.

On step 2, type any text in the box, then click **Next**.

The demo bypass intercepts the submit call and returns a pre-built result:
- Score: **38 / 100**
- Label: **Normal**
- Emotional state: **Calm**
- 3 recommendations

Click **Go to Dashboard**.

### 5. Explore the app

All pages are now accessible. What works without a backend:

| Page | Demo behavior |
|---|---|
| **Dashboard** | Loads, attempts to fetch stats, shows a yellow "Showing cached results" warning — UI is fully visible |
| **Articles** | Loads, attempts to fetch articles, shows "Failed to load articles" with a Retry button |
| **Subl AI** | Chat UI renders. Sending a message fails silently with an error toast. |
| **Settings** | Profile form shows demo user data. Saving will fail gracefully with an error toast. |

These pages degrade gracefully — they do not crash.

---

## Part 6 — Going Full Stack

Implementing `specs/backend-spec.md` is all that is needed to make this project full-stack. That document specifies every API endpoint, request/response shape, authentication scheme, error format, and CORS configuration.

### Summary of what the backend must provide

13 REST endpoints over HTTPS:

```
POST   /auth/login              → { token, user }
POST   /auth/register           → { token, user }
POST   /auth/forgot-password    → { message }
POST   /auth/verify-code        → { message }
POST   /auth/reset-password     → { message }

GET    /user/profile            → User object        [auth required]
PUT    /user/profile            → User object        [auth required]
PATCH  /user/notifications      → { message }        [auth required]

POST   /assessment/submit       → AssessmentResult   [auth required]
GET    /dashboard/stats         → DashboardStats     [auth required]
GET    /articles                → Article[]          [auth required]
GET    /articles/:id            → Article            [auth required]
POST   /chat                    → { reply }          [auth required]
```

Authentication: Bearer token in the `Authorization` header.
Error format: always `{ "message": "..." }`.

### Connecting the backend

1. Set `VITE_API_URL` in `.env.local` to your backend's base URL:
   ```
   VITE_API_URL=https://api.subl.app
   ```
2. Follow the 5 removal steps in `specs/backend-spec.md § 10` to delete the demo bypass.
3. Restart the dev server — the app now uses the real API for all routes.

---

## Part 7 — Other Useful Commands

```bash
# Type-check and build for production
npm run build
# Output goes to dist/ — serve that directory with any static host

# Preview the production build locally
npm run preview

# Run the full test suite (162 tests, ~10 seconds)
npx vitest run

# Lint the codebase
npm run lint
```

---

## Part 8 — Project File Map

```
frontend/
├── .env                    Shared defaults (committed)
├── .env.example            Template for new developers
├── .env.local              Your local secrets (gitignored — create from .env.example)
├── index.html              HTML entry point
├── vite.config.ts          Build config, path alias, Vitest config
├── tailwind.config.js      Custom color palette (subl-blue, subl-grey, …)
├── specs/
│   ├── local-setup.md      ← this file
│   ├── backend-spec.md     Full backend API contract
│   └── code-review-errors.md  History of all code issues and fixes
└── src/
    ├── main.tsx            App entry — mounts React, imports fonts
    ├── App.tsx             Route definitions + auth guards
    ├── index.css           Tailwind base + CSS variables
    ├── api/
    │   ├── client.ts       fetch wrapper — adds Bearer token, 10s timeout, error handling
    │   ├── auth.ts         /auth/* endpoints
    │   ├── user.ts         /user/* endpoints
    │   ├── assessment.ts   /assessment/submit
    │   ├── dashboard.ts    /dashboard/stats
    │   ├── articles.ts     /articles and /articles/:id
    │   └── chat.ts         /chat
    ├── hooks/
    │   └── useAppState.ts  Global Zustand store — token, user, assessment state
    ├── lib/
    │   ├── demoAuth.ts     TEMPORARY demo bypass — delete when backend is live
    │   ├── articlePlaceholder.ts  Keyboard-themed SVG fallbacks for article images
    │   └── utils.ts        Tailwind class merging utility
    ├── types/
    │   └── index.ts        All shared TypeScript interfaces
    ├── pages/
    │   ├── Onboarding.tsx
    │   ├── Login.tsx
    │   ├── SignUp.tsx
    │   ├── ForgotPassword.tsx  → VerifyCode.tsx → NewPassword.tsx → PasswordSuccess.tsx
    │   ├── StressAssessment.tsx
    │   ├── Dashboard.tsx
    │   ├── Articles.tsx
    │   ├── ArticleDetail.tsx
    │   ├── SubiAI.tsx
    │   └── Settings.tsx
    ├── components/
    │   ├── AuthLayout.tsx     Split-screen layout for auth pages
    │   ├── AppLayout.tsx      Main app shell (header + sidebar slot)
    │   ├── Sidebar.tsx        Navigation sidebar
    │   ├── ErrorBoundary.tsx  Top-level React error boundary
    │   ├── SublLogo.tsx       SVG logo component
    │   └── ui/               40+ Shadcn/Radix primitive components
    └── test/
        ├── setup.ts           Vitest + Testing Library setup
        └── mocks/
            ├── server.ts      MSW server instance
            └── handlers.ts    Mock API responses for tests
```

---

## Troubleshooting

**`crypto.hash is not a function`**
Your Node.js version is too old. Install Node 20 or 22 (see Part 1).

**`VITE_API_URL is not defined`**
You forgot to create `.env.local`. Run `cp .env.example .env.local` and fill it in.

**Login fails even with demo credentials**
Check that `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` in `.env.local` exactly match what you type in the login form (case-sensitive). Restart the dev server after editing `.env.local`.

**Port 3000 already in use**
Another process is using that port. Either stop it, or add `server: { port: 3001 }` to `vite.config.ts`.

**`next-themes` import error on startup**
This should already be fixed. If it reappears, check `src/components/ui/sonner.tsx` — the `useTheme` import from `next-themes` should not be there.
