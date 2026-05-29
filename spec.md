# Frontend ↔ Backend Integration Spec

**Audience:** This document is for a model tasked with wiring the existing React/TypeScript frontend to the existing .NET backend.
**Rule:** Only modify the frontend. The backend is already running and must not be touched.
**Goal:** Replace every demo/mock path with real API calls, fix all shape mismatches, and make the app fully functional end-to-end.

---

## 1. Environment Setup

### Step 1 — Create `frontend/.env.local`

The frontend reads `VITE_API_URL` from the environment. The backend runs on port 5000. Create this file:

```
VITE_API_URL=http://localhost:5000
```

Remove or blank out the demo bypass variables:
```
VITE_DEMO_EMAIL=
VITE_DEMO_PASSWORD=
```

> The `demoAuth.ts` file is already designed to be inert when these env vars are absent — no code deletion needed yet.

---

## 2. Complete Endpoint Map — Frontend vs. Backend

This table shows every API call the frontend makes, what the backend actually exposes, and whether they match.

| Frontend Call | Frontend URL | Backend URL | Status |
|---|---|---|---|
| Login | `POST /auth/login` | `POST /users/login` | ❌ URL + response shape |
| Register | `POST /auth/register` | `POST /users/register` | ❌ URL + request + response shape |
| Forgot Password | `POST /auth/forgot-password` | `POST /users/forgot-password` | ❌ URL only |
| Verify OTP Code | `POST /auth/verify-code` | *(none — backend uses token links)* | ❌ Endpoint missing |
| Reset Password | `POST /auth/reset-password` | `POST /users/reset-password` | ❌ URL + field names |
| Get Profile | `GET /user/profile` | `GET /users/me` + `GET /users/me/profile` | ❌ URL + shape + two calls needed |
| Update Profile | `PUT /user/profile` | `PUT /users/me` + `PUT /users/me/profile` | ❌ URL + shape + two calls needed |
| Update Notifications | `PATCH /user/notifications` | *(no equivalent)* | ❌ Endpoint missing |
| Dashboard Stats | `GET /dashboard/stats?range=...` | `GET /stress/current` + `GET /stress/trends` | ❌ Endpoint missing, must be composed |
| Assessment Submit | `POST /assessment/submit` | *(none)* | ❌ Feature missing in backend |
| Articles List | `GET /articles` | *(none)* | ❌ Feature missing in backend |
| Article Detail | `GET /articles/:id` | *(none)* | ❌ Feature missing in backend |
| Chat | `POST /chat` | *(none)* | ❌ Feature missing in backend |

---

## 3. Clash Details and Frontend Fixes Required

### 3.1 — URL Prefix (`/auth` → `/users`, `/user` → `/users`)

**Problem:** Every frontend auth call uses `/auth/...` and profile calls use `/user/...`. Backend uses `/users/...`.

**Fix:** In `frontend/src/api/auth.ts`, change all paths:
```diff
- api.post<AuthResponse>('/auth/login', data)
+ api.post<AuthResponse>('/users/login', data)

- api.post<AuthResponse>('/auth/register', data)
+ api.post<AuthResponse>('/users/register', data)

- api.post<{ message: string }>('/auth/forgot-password', data)
+ api.post<{ message: string }>('/users/forgot-password', data)

- api.post<{ message: string }>('/auth/verify-code', data)
+ // See section 3.4 below

- api.post<{ message: string }>('/auth/reset-password', data)
+ api.post<{ message: string }>('/users/reset-password', data)
```

In `frontend/src/api/user.ts`:
```diff
- api.get<User>('/user/profile')
+ // See section 3.6 below

- api.put<User>('/user/profile', data)
+ // See section 3.7 below
```

---

### 3.2 — Login: Response Shape Mismatch

**Problem:** Frontend expects:
```ts
{ token: string; user: User }
```
where `User = { id, name, email, phone, avatar }`.

Backend actually returns:
```ts
{
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  tokenType: "Bearer";
  expiresIn: number;
}
```
No `user` object is included in the login response.

**Fix (frontend):**
1. After a successful login (`POST /users/login`), store `accessToken` as the bearer token.
2. Immediately make a second call `GET /users/me` to fetch the user.
3. Compose the result into the existing `AuthResponse` shape expected by `setAuth()`.
4. Also store the `refreshToken` in Zustand state for future token refresh (add field to `AppState`).

Update `frontend/src/types/index.ts` — the `AuthResponse` type no longer matches; it should be split:
```ts
// Raw backend login response
export interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}
```

Update `frontend/src/hooks/useAppState.ts` — add `refreshToken` to state:
```ts
refreshToken: string | null;
```

Update `frontend/src/pages/Login.tsx` — the `onSubmit` must chain `login()` → `getMe()` → `setAuth()`.

---

### 3.3 — Register: Request Shape + Response Shape Mismatch

**Problem:**

Frontend sends:
```json
{ "name": "John Doe", "email": "...", "phone": "...", "password": "..." }
```

Backend expects:
```json
{ "email": "...", "firstName": "John", "lastName": "Doe", "password": "..." }
```

Backend returns: just a `Guid` (user ID), **not** a `{ token, user }`.

Also, the backend sends a **confirmation email** after registration. The user must confirm their email before they can log in. The frontend currently skips this entirely.

**Fix (frontend):**
1. In `frontend/src/api/auth.ts`, update `SignUpRequest` type:
```ts
export interface SignUpRequest { email: string; firstName: string; lastName: string; password: string }
```
2. In `frontend/src/pages/SignUp.tsx`:
   - Split the `name` field into `firstName` + `lastName` (add two separate input fields, or split on first space as a minimum).
   - Remove the `phone` field from the form (backend doesn't accept it on register; it goes in profile later).
   - After successful register, **do NOT call `setAuth()`**. Instead navigate to a new page `/confirm-email` that tells the user to check their email.
   - Remove `completeOnboarding()` call from the register flow.
3. Create `frontend/src/pages/ConfirmEmail.tsx` — a simple static page saying "Check your email and click the link to activate your account."
4. Add the route `/confirm-email` in `frontend/src/App.tsx`.

---

### 3.4 — Verify Code: Endpoint Does Not Exist on Backend

**Problem:** Frontend posts to `POST /auth/verify-code` with a 6-digit OTP. The backend does **not** have this endpoint.

The backend's password reset flow works like this:
1. `POST /users/forgot-password` → backend sends an email with a **reset token/link**
2. The user clicks the link → token goes directly into the reset password form
3. `POST /users/reset-password` with `{ email, token, newPassword }`

There is no in-app OTP code step.

**Fix (frontend):**
- The `VerifyCode.tsx` page and the `/verify-code` route need to be replaced with a different UX.
- **Recommended approach:** After `forgot-password` succeeds, show a page that says "We've sent a password reset link to your email. Click the link in the email to reset your password." Remove the 6-digit code input entirely.
- The `verifyCode` function in `authApi` can be removed.
- The `setResetCode` / `resetCode` state in `useAppState` becomes irrelevant for this flow — remove or ignore.
- The `NewPassword.tsx` page should accept a `?token=...` query parameter from the URL (which the backend email link will include) rather than reading `resetCode` from Zustand state.

**Files to change:** `frontend/src/api/auth.ts`, `frontend/src/pages/VerifyCode.tsx` (replace with info page), `frontend/src/pages/NewPassword.tsx` (read token from URL params), `frontend/src/App.tsx` (update route).

---

### 3.5 — Reset Password: Field Name Mismatch

**Problem:**

Frontend sends:
```json
{ "email": "...", "code": "abc123", "password": "newpass" }
```

Backend expects:
```json
{ "email": "...", "token": "abc123", "newPassword": "newpass" }
```

Two field names differ: `code` → `token`, `password` → `newPassword`.

**Fix (frontend):**
- Update `ResetPasswordRequest` type in `frontend/src/types/index.ts`:
```ts
export interface ResetPasswordRequest { email: string; token: string; newPassword: string }
```
- Update `frontend/src/api/auth.ts` to send the correct field names.
- Update `frontend/src/pages/NewPassword.tsx` to read the token from the URL query param (`?token=...`) instead of `resetCode` state.

---

### 3.6 — Get User Profile: URL + Shape Mismatch + Two Calls Needed

**Problem:**

Frontend calls `GET /user/profile` expecting:
```ts
{ id, name, email, phone, avatar }
```

Backend exposes two separate endpoints:
- `GET /users/me` → `{ id, email, firstName, lastName, accountType, status, createdAt, lastLoginAt }`
- `GET /users/me/profile` → `{ id, userId, phoneNumber, avatarUrl, bio, skills, department, displayJobTitle, hireDate }`

Key field differences:
- `name` → `firstName + " " + lastName`
- `phone` → `phoneNumber` (in profile endpoint)
- `avatar` → `avatarUrl` (in profile endpoint)

**Fix (frontend):**
- In `frontend/src/api/user.ts`, replace `getProfile()` with a function that calls both endpoints and merges them:
```ts
getProfile: async (): Promise<User> => {
  const [me, profile] = await Promise.all([
    api.get<BackendUserResponse>('/users/me'),
    api.get<BackendUserProfileResponse>('/users/me/profile'),
  ]);
  return {
    id: me.id,
    name: `${me.firstName} ${me.lastName}`.trim(),
    email: me.email,
    phone: profile.phoneNumber ?? '',
    avatar: profile.avatarUrl ?? '',
  };
}
```
- Add `BackendUserResponse` and `BackendUserProfileResponse` types to `frontend/src/types/index.ts`.

---

### 3.7 — Update Profile: URL + Shape + Response Mismatch

**Problem:**

Frontend does `PUT /user/profile` with `{ name?, email?, phone? }` and expects the updated `User` object back.

Backend exposes:
- `PUT /users/me` with `{ firstName, lastName }` → returns `{ message: string }` (not the user)
- `PUT /users/me/profile` with `{ phoneNumber?, avatarUrl?, bio?, skills? }` → returns `{ message: string }`

**Fix (frontend):**
In `frontend/src/api/user.ts`, replace `updateProfile()`:
```ts
updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
  // Split name into first/last
  const parts = (data.name ?? '').trim().split(' ');
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');

  // Fire both in parallel if both have data
  const calls: Promise<unknown>[] = [];
  if (firstName || lastName) calls.push(api.put('/users/me', { firstName, lastName }));
  if (data.phone !== undefined) calls.push(api.put('/users/me/profile', { phoneNumber: data.phone }));
  await Promise.all(calls);

  // Fetch fresh merged profile to return
  return userApi.getProfile();
}
```
In `frontend/src/pages/Settings.tsx`, `setUser(updated)` still works because `getProfile()` returns the correct `User` shape.

---

### 3.8 — Notifications: No Matching Backend Endpoint

**Problem:** Frontend calls `PATCH /user/notifications`. Backend has no equivalent endpoint (it has push token management and notification preferences but not a simple boolean toggle at this path).

**Fix (frontend — pragmatic):**
In `frontend/src/pages/Settings.tsx`, make the notification toggle **local-only** for now:
```ts
const handleNotificationsToggle = () => {
  setNotifications((prev) => !prev); // local state only, no API call
};
```
This avoids a 404 error without breaking the UI. A comment like `// TODO: wire to PUT /notifications/preferences when endpoint is confirmed` is appropriate.

---

### 3.9 — Dashboard Stats: No Matching Endpoint

**Problem:** Frontend calls `GET /dashboard/stats?range=today|week|month` and expects:
```ts
{ emotional_state, stress_score, stress_label, session_data[], typing_data[] }
```

Backend has:
- `GET /stress/current` → `{ hasData, score, level, at, sessionId }`
- `GET /stress/trends?from=...&to=...&granularity=Minute|Hour|Day|Week` → `StressTrendPoint[]` each with `{ bucketStart, averageScore, peakScore, readingsCount }`

**Fix (frontend):**
Replace `frontend/src/api/dashboard.ts` with a composed function:

```ts
export const dashboardApi = {
  getStats: async (range: 'today' | 'week' | 'month' = 'today'): Promise<DashboardStats> => {
    // Compute date range
    const now = new Date();
    const from = new Date(now);
    let granularity = 'Hour';
    if (range === 'today') { from.setHours(0,0,0,0); granularity = 'Hour'; }
    else if (range === 'week') { from.setDate(now.getDate() - 6); granularity = 'Day'; }
    else { from.setDate(1); granularity = 'Day'; }

    const [current, trends] = await Promise.all([
      api.get<BackendCurrentStress>('/stress/current'),
      api.get<BackendTrendPoint[]>(
        `/stress/trends?from=${from.toISOString()}&to=${now.toISOString()}&granularity=${granularity}`
      ),
    ]);

    // Map backend shape → frontend DashboardStats shape
    const score = current.score ?? 0;
    const level = current.level ?? 'Normal';

    const session_data = trends.map((t) => ({
      name: formatBucketLabel(t.bucketStart, granularity),
      value: Math.round(t.averageScore),
      color: stressColor(t.averageScore),
    }));

    // typing_data: backend doesn't have typing speed — use readingsCount as proxy
    const typing_data = trends.map((t) => ({
      name: formatBucketLabel(t.bucketStart, granularity),
      speed: t.readingsCount, // placeholder until backend exposes WPM
    }));

    return {
      emotional_state: levelToEmotional(level),
      stress_score: Math.round(score),
      stress_label: level as 'Normal' | 'Medium' | 'High',
      session_data,
      typing_data,
    };
  }
};
```
Add helper functions `stressColor`, `formatBucketLabel`, `levelToEmotional` alongside.
Add types `BackendCurrentStress` and `BackendTrendPoint` to `frontend/src/types/index.ts`.

> **Important note:** The `typing_data` chart on the dashboard shows "Typing Speed (WPM)" which the backend has no data for — it only has stress scores. Until the desktop agent starts submitting typing metrics and the backend exposes WPM, this chart should either be hidden or relabeled "Stress Readings Count".

---

### 3.10 — Assessment: No Backend Endpoint

**Problem:** `POST /assessment/submit` does not exist in the backend. The backend's stress detection is passive — it receives keyboard features from the desktop agent automatically. There is no manual assessment API.

**Options (pick one):**
**Option A (Recommended — local-only assessment):** Keep the assessment as a pure frontend experience. The score is computed locally from the 5 questions, stored in Zustand, and never sent to the backend. Remove the `assessmentApi.submit()` call entirely.

In `frontend/src/pages/StressAssessment.tsx`:
```ts
const handleSubmit = async () => {
  const score = Math.round(
    (Object.values(answers).reduce((a, b) => a + b, 0) / (questions.length * 5)) * 100
  );
  const label = score <= 40 ? 'Normal' : score <= 60 ? 'Medium' : 'High';
  const result: AssessmentResult = {
    score,
    label,
    emotional_state: label === 'Normal' ? 'Calm' : label === 'Medium' ? 'Tense' : 'Overwhelmed',
    response_time: 'Normal',
    typing_pattern: 'Consistent',
    break_frequency: 'Adequate',
    recommendations: getRecommendations(label),
  };
  completeAssessment(result.score, result.emotional_state);
  setResult(result);
  setStep(3);
};
```
This removes the network call, keeps the UX identical, and unblocks the user from reaching the dashboard.

**Option B:** Build the assessment endpoint in the backend. (Out of scope if backend is frozen.)

---

### 3.11 — Articles: No Backend Endpoint

**Problem:** `GET /articles` and `GET /articles/:id` do not exist in the backend.

**Fix (frontend):** The demo data in `demoAuth.ts` already has rich article content. Extract this data into a standalone static file `frontend/src/lib/articleData.ts` and make the API module fall back to it transparently:

In `frontend/src/api/articles.ts`:
```ts
import { staticArticles } from '@/lib/articleData';

export const articlesApi = {
  list: async (sort?: string): Promise<Article[]> => {
    try {
      return await api.get<Article[]>(`/articles${sort ? `?sort=${sort}` : ''}`);
    } catch {
      return staticArticles; // graceful fallback
    }
  },
  get: async (id: number): Promise<Article> => {
    try {
      return await api.get<Article>(`/articles/${id}`);
    } catch {
      return staticArticles.find((a) => a.id === id) ?? staticArticles[0];
    }
  },
};
```
This is the cleanest approach: it will use the real backend when the endpoint is eventually added, and falls back silently in the meantime.

---

### 3.12 — Chat: No Backend Endpoint

**Problem:** `POST /chat` does not exist.

**Fix (frontend):** Same pattern as articles — wrap the real call with a fallback:

In `frontend/src/api/chat.ts`:
```ts
import { staticChatReplies } from '@/lib/chatData';

export const chatApi = {
  send: async (data: ChatRequest): Promise<ChatResponse> => {
    try {
      return await api.post<ChatResponse>('/chat', data);
    } catch {
      return { reply: staticChatReplies[Math.floor(Math.random() * staticChatReplies.length)] };
    }
  }
};
```
Extract the `DEMO_REPLIES` array from `demoAuth.ts` into `frontend/src/lib/chatData.ts`.

---

### 3.13 — Token Management: Single Token vs Access + Refresh

**Problem:** The backend returns both `accessToken` and `refreshToken`. The frontend only stores one `token` string.

**Fix (frontend):**
1. In `frontend/src/hooks/useAppState.ts`, add:
   ```ts
   refreshToken: string | null;
   ```
   And update `setAuth` to accept both:
   ```ts
   setAuth: (accessToken: string, refreshToken: string, user: User) => void;
   ```
2. In `frontend/src/api/client.ts`, the `getToken()` function already reads from state — it should read `state.token` which will store the `accessToken`.
3. Optionally add a `refresh()` call in `client.ts` that fires `POST /users/refresh` when a request returns 401 and a refresh token is available. This is a nice-to-have for a later pass.

---

### 3.14 — Email Confirmation Flow

**Problem:** After registration, the backend sends a confirmation email. The user cannot log in until they confirm. The frontend currently calls `setAuth()` immediately after register — this will fail because the login will be rejected.

**Fix (frontend):**
- After `POST /users/register` succeeds, navigate to `/confirm-email` (static page).
- Do NOT call `setAuth()` or `completeOnboarding()` at this point.
- The user confirms email via the link in their inbox, which the backend handles server-side.
- Then they come back to the app and log in normally via the login page.

---

## 4. Summary Checklist for the Implementing Model

Work through these in order — each step unblocks the next:

### Phase 1 — Make the app boot without errors
- [ ] Create `frontend/.env.local` with `VITE_API_URL=http://localhost:5000`
- [ ] Clear demo env vars (`VITE_DEMO_EMAIL=`, `VITE_DEMO_PASSWORD=`)

### Phase 2 — Fix Auth (Login must work first)
- [ ] Fix login URL: `/auth/login` → `/users/login`
- [ ] Fix login response: chain `POST /users/login` → `GET /users/me` → build `AuthResponse`
- [ ] Update `useAppState` to store `refreshToken`
- [ ] Update `BackendLoginResponse` type

### Phase 3 — Fix Register
- [ ] Fix register URL: `/auth/register` → `/users/register`
- [ ] Split `name` field into `firstName` + `lastName` in `SignUpRequest` and `SignUp.tsx`
- [ ] Remove `phone` from register form (add it to settings/profile later)
- [ ] After register, navigate to `/confirm-email` instead of calling `setAuth()`
- [ ] Create `ConfirmEmail.tsx` page and add route

### Phase 4 — Fix Password Reset Flow
- [ ] Fix forgot-password URL: `/auth/forgot-password` → `/users/forgot-password`
- [ ] Replace `VerifyCode.tsx` with a "check your email" info page
- [ ] Update `NewPassword.tsx` to read token from URL query param (`?token=...`)
- [ ] Fix reset-password URL: `/auth/reset-password` → `/users/reset-password`
- [ ] Fix reset-password field names: `code` → `token`, `password` → `newPassword`

### Phase 5 — Fix User Profile
- [ ] Replace `GET /user/profile` with dual call: `GET /users/me` + `GET /users/me/profile`
- [ ] Merge responses into frontend `User` shape
- [ ] Replace `PUT /user/profile` with dual call: `PUT /users/me` + `PUT /users/me/profile`
- [ ] Make notifications toggle local-only (remove PATCH call)

### Phase 6 — Fix Dashboard
- [ ] Replace `GET /dashboard/stats` with composed call using `GET /stress/current` + `GET /stress/trends`
- [ ] Map backend stress shapes to frontend `DashboardStats` shape
- [ ] Add helper functions for label/color/formatting
- [ ] Note or hide the typing speed chart until backend exposes WPM data

### Phase 7 — Fix Assessment
- [ ] Remove `assessmentApi.submit()` network call
- [ ] Compute score locally from answers in `StressAssessment.tsx`
- [ ] Keep the results UI exactly as-is (it's self-contained)

### Phase 8 — Fix Articles and Chat
- [ ] Extract article data from `demoAuth.ts` into `frontend/src/lib/articleData.ts`
- [ ] Extract chat replies into `frontend/src/lib/chatData.ts`
- [ ] Update `articlesApi` and `chatApi` to use try/fallback pattern
- [ ] Once clean, remove `demoAuth.ts` imports from pages (except the fallback modules)

---

## 5. Files to Change (complete list)

| File | What Changes |
|---|---|
| `frontend/.env.local` | Set `VITE_API_URL=http://localhost:5000`, clear demo vars |
| `frontend/src/types/index.ts` | Add `BackendLoginResponse`, `BackendUserResponse`, `BackendUserProfileResponse`, `BackendCurrentStress`, `BackendTrendPoint`; update `SignUpRequest` |
| `frontend/src/hooks/useAppState.ts` | Add `refreshToken` field; update `setAuth` signature |
| `frontend/src/api/auth.ts` | Fix all URLs; update request/response types; remove `verifyCode` |
| `frontend/src/api/user.ts` | Replace `getProfile` and `updateProfile` with dual-call implementations; make notifications local-only |
| `frontend/src/api/dashboard.ts` | Full rewrite to compose `stress/current` + `stress/trends` |
| `frontend/src/api/assessment.ts` | Remove (or gut to a no-op) |
| `frontend/src/api/articles.ts` | Add try/fallback pattern |
| `frontend/src/api/chat.ts` | Add try/fallback pattern |
| `frontend/src/pages/Login.tsx` | Chain login → getMe; store refreshToken |
| `frontend/src/pages/SignUp.tsx` | Split name; remove phone; navigate to `/confirm-email` |
| `frontend/src/pages/VerifyCode.tsx` | Replace with "check your email" info page |
| `frontend/src/pages/NewPassword.tsx` | Read token from URL `?token=...` |
| `frontend/src/pages/StressAssessment.tsx` | Remove API call; compute score locally |
| `frontend/src/pages/Settings.tsx` | Make notifications toggle local-only |
| `frontend/src/pages/Dashboard.tsx` | No change needed (uses `dashboardApi.getStats` which will be fixed in the API layer) |
| `frontend/src/App.tsx` | Add `/confirm-email` route |
| `frontend/src/lib/demoAuth.ts` | Marked for eventual deletion; extract data to `articleData.ts` and `chatData.ts` first |
| `frontend/src/lib/articleData.ts` | **NEW** — static article content extracted from `demoAuth.ts` |
| `frontend/src/lib/chatData.ts` | **NEW** — static chat replies extracted from `demoAuth.ts` |
| `frontend/src/pages/ConfirmEmail.tsx` | **NEW** — post-register email confirmation info page |

---

## 6. Backend Endpoints Reference (what actually exists)

Copy this when making API calls — these are the real URLs:

```
Auth / Users:
  POST   /users/login               { email, password } → TokenResponse
  POST   /users/register            { email, firstName, lastName, password } → Guid
  POST   /users/confirm-email       { email, token } → { message }
  POST   /users/forgot-password     { email } → { message }
  POST   /users/reset-password      { email, token, newPassword } → { message }
  POST   /users/refresh             { refreshToken } → TokenResponse
  GET    /users/me                  → UserResponse
  PUT    /users/me                  { firstName, lastName } → { message }
  GET    /users/me/profile          → UserProfileResponse
  PUT    /users/me/profile          { phoneNumber?, avatarUrl?, bio?, skills? } → { message }

Stress:
  GET    /stress/current            → { hasData, score, level, at, sessionId }
  GET    /stress/trends             ?from=ISO&to=ISO&granularity=Hour|Day|Week → StressTrendPoint[]
  GET    /stress/readings           ?page&pageSize&from&to&sessionId → PagedResult<StressReadingResponse>

Sessions:
  POST   /stress-sessions/start     → { sessionId, ... }
  GET    /stress-sessions/active    → active session or 404
  POST   /stress-sessions/{id}/metrics  { meanDwell, medianFlight, cvFlight, meanDelFreq, meanTotTime, nKeys, ... }
  POST   /stress-sessions/{id}/end  → { ... }

Health:
  GET    /health                    → { status: "Healthy", entries: { npgsql: ... } }
```

---

## 7. Professional Notes

### What's missing from the backend (for future work, not this task)
- **Articles endpoint** — completely absent. The frontend has rich article content in `demoAuth.ts`; this should eventually become a real CMS table.
- **Chat/AI endpoint** — no `/chat` endpoint exists. If "SubiAI" is a core feature, the backend needs an LLM integration (Claude API or similar).
- **Assessment endpoint** — the backend's stress model runs passively via the desktop agent, not via a manual survey. The two approaches need to be reconciled. Consider storing the initial survey answers in the backend for baseline context.
- **WPM/Typing speed data** — the dashboard has a "Typing Speed" chart but the backend only exposes stress scores, not WPM. The desktop agent computes keyboard features internally; the backend should surface WPM as part of `StressTrendPoint` or a separate endpoint.
- **Notifications toggle** — the backend has a full notifications preference system but the frontend only needs a simple boolean; wire this properly once the simpler items are done.

### Authentication architecture consideration
The backend uses a proper access + refresh token system (short-lived access tokens, long-lived refresh tokens). The frontend currently ignores refresh tokens entirely. After the initial wiring is done, add a 401 interceptor in `frontend/src/api/client.ts` that automatically calls `POST /users/refresh` and retries the original request — otherwise users will get logged out silently after the access token expires.

### Email confirmation UX
The backend requires email confirmation before login. This is a friction point for new users. Consider: after registration, auto-redirect to `/confirm-email` page, and when the user lands back on `/login`, show a banner "Email confirmed! You can now log in." (This requires reading a `?confirmed=true` query param from the email link redirect.)
