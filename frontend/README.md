# Subl — Frontend

Keyboard-dynamics stress detection web app.
Subl passively analyzes typing patterns and keyboard interactions to detect early signs of work stress, then surfaces wellness insights and recommendations.

## Quick Start (Demo Mode — no backend needed)

```bash
# 1. Requires Node.js 20 or 22
node --version   # must print v20.x.x or v22.x.x

# 2. Install dependencies
npm install

# 3. Create your local env file (gitignored)
cp .env.example .env.local
# Then open .env.local and fill in VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

Full setup instructions, feature tour, and backend connection guide: **`specs/local-setup.md`**

## Connecting a Backend

The complete API contract is in **`specs/backend-spec.md`** — every endpoint, field, type, and error format. Implementing that spec is all that is needed to make the project full-stack.

## Project Structure

```
src/
  api/          HTTP client + one file per resource (auth, user, articles, …)
  components/   Shared UI components (Sidebar, AppLayout, ErrorBoundary, …)
  components/ui/  Shadcn/Radix primitive components (40+)
  hooks/        Zustand global state (useAppState)
  lib/          Utilities (demo bypass, article placeholders, …)
  pages/        One file per route
  test/         Vitest setup + MSW mock server
  types/        Shared TypeScript interfaces
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build | Vite 7 |
| Routing | React Router v7 |
| State | Zustand 5 with localStorage persistence |
| Styling | Tailwind CSS v3 + custom `subl-*` color palette |
| Components | Shadcn UI / Radix |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library + MSW |
| Font | `@fontsource/lato` (self-hosted, no Google Fonts) |

## Portability

This project has **no hardcoded filesystem paths**. Every import uses the `@/` alias (resolves to `./src`) or a relative path. The only external references are URLs stored in `.env` files. You can move or rename this folder freely — nothing breaks.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npx vitest` | Run the test suite (162 tests) |
