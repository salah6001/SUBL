# Unit Test Specification

> Revised: 2026-05-02 — corrected after kiro-cli pass
> Scope: `app/src/` — all pages, components, hooks, API layer, and utilities

---

## Test Stack

| Package | Role |
|---|---|
| `vitest` | Test runner (Vite-native) |
| `@testing-library/react` | Component rendering & querying |
| `@testing-library/user-event` | Realistic user interactions |
| `@testing-library/jest-dom` | DOM matchers (`toBeInTheDocument`, `toBeDisabled`, etc.) |
| `msw` | Mock Service Worker — intercepts `fetch` at the network level |
| `@vitest/coverage-v8` | Coverage reporting |

### Setup

```bash
cd app
npm install -D vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom msw @vitest/coverage-v8
```

Add to `vite.config.ts`:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## ⚠️ Critical Test Setup Corrections

These are assumptions in the test spec that **do not match the current implementation**. Tests written against the old assumptions will pass or fail for the wrong reason. Fix before running or extending the test suite.

---

### Correction 1 — API client token test (affects C-06, C-07)

**Wrong assumption:** Token setup via localStorage mock.

The test spec originally described setting up `localStorage` to simulate a logged-in user. After fixing **BP-05**, `getToken()` in `api/client.ts` now reads directly from the Zustand store:

```ts
// Current implementation (api/client.ts:7)
function getToken(): string | null {
  return useAppState.getState().token;
}
```

**Wrong test setup (do not use):**
```ts
localStorage.setItem('subl-app-storage', JSON.stringify({ state: { token: 'test-token' } }));
```

**Correct test setup:**
```ts
import { useAppState } from '@/hooks/useAppState';

beforeEach(() => {
  useAppState.setState({ token: 'test-token', isAuthenticated: true });
});
afterEach(() => {
  useAppState.setState({ token: null, isAuthenticated: false });
});
```

---

### Correction 2 — SubiAI initial greeting (affects AI-01)

**Wrong assumption:** The greeting is always "Good morning".

After fixing **UX-06**, `SubiAI.tsx` computes the greeting from the real clock:

```ts
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
```

A test that asserts `getByText(/Good morning/i)` will **fail when run in the afternoon or evening**.

**Correct approach — option A (freeze time):**
```ts
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T09:00:00')); // 9 AM → "Good morning"
});
afterEach(() => {
  vi.useRealTimers();
});

it('renders initial greeting', () => {
  render(<SubiAI />, { wrapper: Providers });
  expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
});
```

**Correct approach — option B (assert on time-independent content):**
```ts
it('renders initial greeting', () => {
  render(<SubiAI />, { wrapper: Providers });
  // The second line of the greeting is always time-independent
  expect(screen.getByText(/Where should we start\?/i)).toBeInTheDocument();
});
```

---

### Correction 3 — Settings "Contact Us" element type (affects Settings tests)

**Wrong assumption:** "Contact Us" is a `<button>`.

After fixing **UX-07**, "Contact Us" was changed to an `<a>` element:

```tsx
// Current implementation (Settings.tsx:172)
<a href="mailto:support@subl.app" className="...">
  Contact Us
</a>
```

**Wrong query (do not use):**
```ts
getByRole('button', { name: /contact us/i })
```

**Correct query:**
```ts
getByRole('link', { name: /contact us/i })
// and verify it has the correct href:
expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', 'mailto:support@subl.app');
```

---

### Correction 4 — Login "Remember me" checkbox removed (affects Login tests)

**Wrong assumption:** A "Remember me" checkbox exists in the Login form.

After fixing **UX-02**, the checkbox was **deleted entirely** from `Login.tsx`. Any test that queries for it will fail with "Unable to find role checkbox".

**Action:** Remove any test that targets `getByRole('checkbox', { name: /remember me/i })` in the Login suite. There are now only two inputs: `login-email` and `login-password`.

---

### Correction 5 — StressAssessment step 1 has no "Previous" button (affects SA tests)

**Wrong assumption:** Step 1 has a "Previous" button.

After fixing **BUG-10**, the "Previous" button on step 1 was removed. `StressAssessment.tsx` step 1 now only has a "Next" button.

**Action:** Do not write a test for a "Previous" button on step 1. Step 2's "Previous" button (returning to step 1) still exists and is correct to test (SA-07).

---

## Test File Convention

Colocation: `src/<module>/__tests__/<module>.test.tsx`

---

## 1. `src/lib/utils.ts`

**File:** `src/lib/__tests__/utils.test.ts`

| # | Description | Assert |
|---|---|---|
| U-01 | `cn()` with a single class | Returns that class |
| U-02 | `cn()` with multiple classes | All joined by space |
| U-03 | `cn()` with falsy values (`false`, `undefined`, `null`) | Omitted |
| U-04 | Conflicting Tailwind classes (`p-4 p-8`) | Last wins via `twMerge` |
| U-05 | Object and array syntax | Correct output |

---

## 2. `src/hooks/use-mobile.ts`

**File:** `src/hooks/__tests__/use-mobile.test.ts`

| # | Description | Assert |
|---|---|---|
| M-01 | `innerWidth` = 1024 | Returns `false` |
| M-02 | `innerWidth` = 375 | Returns `true` |
| M-03 | `matchMedia` change fires (shrinks below 768) | Updates from `false` to `true` |
| M-04 | Unmount | `removeEventListener` called |

---

## 3. `src/api/client.ts`

**File:** `src/api/__tests__/client.test.ts`

> ⚠️ Set up token via `useAppState.setState({ token: '...' })`, NOT via localStorage (see Correction 1).

Set `import.meta.env.VITE_API_URL = 'http://test'` in the Vitest setup file.

| # | Description | Assert |
|---|---|---|
| C-01 | `api.get()` | GET to correct URL |
| C-02 | `api.post()` | Body as JSON |
| C-03 | `api.put()` | Method is `PUT` |
| C-04 | `api.patch()` | Method is `PATCH` |
| C-05 | `api.delete()` | Method is `DELETE` |
| C-06 | Token in Zustand store | `Authorization: Bearer <token>` header present |
| C-07 | No token in store | `Authorization` header absent |
| C-08 | Non-ok (400) response | Throws `ApiError` with `status === 400` |
| C-09 | Non-ok with JSON body | `err.message` equals body's `message` field |
| C-10 | Non-ok with non-JSON body | `err.message` falls back to `statusText` |
| C-11 | Successful response | Returns parsed JSON |
| C-12 | Request times out | `AbortError` thrown after 10 seconds (use `vi.useFakeTimers()`) |

---

## 4. `src/hooks/useAppState.ts`

**File:** `src/hooks/__tests__/useAppState.test.ts`

Call `useAppState.setState(useAppState.getInitialState())` before each test to reset state. Clear localStorage with `localStorage.clear()`.

| # | Description | Assert |
|---|---|---|
| S-01 | Initial state | `isAuthenticated: false`, `token: null`, `currentUser: null`, `emotionalState: 'Normal'`, `resetCode: null` |
| S-02 | `setAuth(token, user)` | Sets `token`, `currentUser`, `isAuthenticated: true` |
| S-03 | `setUser(partial)` | Merges into `currentUser`, preserves existing `id` |
| S-04 | `logout()` | Clears `token`, `currentUser`, `resetCode`, sets `isAuthenticated: false`, resets `assessmentScore` |
| S-05 | `logout()` preserves `hasCompletedOnboarding` | `hasCompletedOnboarding` unchanged |
| S-06 | `completeOnboarding()` | `hasCompletedOnboarding: true` |
| S-07 | `completeAssessment(score)` | `hasCompletedAssessment: true`, `assessmentScore: score` |
| S-08 | `completeAssessment(score, emotionalState)` | Also updates `emotionalState` |
| S-09 | `setEmotionalState(state)` | Updates `emotionalState` |
| S-10 | `setResetEmail(email)` | Updates `resetEmail` |
| S-11 | `setResetCode(code)` | Updates `resetCode` |
| S-12 | Persist to `'subl-app-storage'` | localStorage item exists with correct data |
| S-13 | Rehydration | Fresh store reflects previously persisted values |

---

## 5. `src/components/ErrorBoundary.tsx`

**File:** `src/components/__tests__/ErrorBoundary.test.tsx`

```ts
// Helper to suppress expected console errors in tests
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());
```

| # | Description | Assert |
|---|---|---|
| EB-01 | Children render normally | Child content visible |
| EB-02 | Child throws → fallback shown | "Something went wrong" heading visible |
| EB-03 | "Refresh" calls `window.location.reload` | `reload` mock invoked on click |
| EB-04 | `componentDidCatch` logs error | `console.error` called with the thrown error |

---

## 6. `src/components/AuthLayout.tsx`

**File:** `src/components/__tests__/AuthLayout.test.tsx`

| # | Description | Assert |
|---|---|---|
| AL-01 | Renders children | Child content visible |
| AL-02 | No back button when `showBack` not set | Button not in DOM |
| AL-03 | Back button present when `showBack={true}` | Button in DOM |
| AL-04 | `onBack` called on click | Mock receives one call |
| AL-05 | Brand name "Subl" visible | `getByText('Subl')` found |

---

## 7. `src/components/Sidebar.tsx`

**File:** `src/components/__tests__/Sidebar.test.tsx`

Wrap in `MemoryRouter` initialized to the tested path.

| # | Description | Assert |
|---|---|---|
| SB-01 | All 4 nav items render | Dashboard, Articles, Subi AI, Settings visible |
| SB-02 | Active item has `bg-subl-blue-50` at `/dashboard` | Active class present |
| SB-03 | Inactive items lack active class | Other links do not have `bg-subl-blue-50` |
| SB-04 | Nav click calls `navigate` with correct path | `navigate('/articles')` on click |
| SB-05 | Logout calls store `logout()` | `useAppState` `logout` action invoked |
| SB-06 | Logout navigates to `/login` | `navigate('/login')` called |

---

## 8. `src/pages/Login.tsx`

**File:** `src/pages/__tests__/Login.test.tsx`

> ⚠️ No "Remember me" checkbox — it was removed. Do not test for it (see Correction 4).

| # | Description | Assert |
|---|---|---|
| LG-01 | Email (`login-email`) and password (`login-password`) inputs render | Both present |
| LG-02 | Submit disabled when both fields empty | `disabled` attribute present |
| LG-03 | Submit enabled when both filled | `disabled` absent |
| LG-04 | Eye icon toggles password input type | Toggles `password` ↔ `text` |
| LG-05 | Submit calls `authApi.login` with `{ email, password }` | API called once |
| LG-06 | Success → calls `setAuth` and navigates to `/dashboard` | Store action called; navigation triggered |
| LG-07 | Failure → error toast shown | Toast with API error message |
| LG-08 | "Forgot password?" navigates to `/forgot-password` | Navigation triggered |
| LG-09 | "Create your account" navigates to `/signup` | Navigation triggered |
| LG-10 | Loading state shows "Logging in…" | Button text changes during call |

---

## 9. `src/pages/SignUp.tsx`

**File:** `src/pages/__tests__/SignUp.test.tsx`

| # | Description | Assert |
|---|---|---|
| SU-01 | All 5 fields render (Name, Phone, Email, Password, Confirm) | All inputs present |
| SU-02 | Submit disabled without privacy checkbox | `disabled` attribute |
| SU-03 | Submit disabled when required fields empty | `disabled` attribute |
| SU-04 | Submit disabled when `confirmPassword` empty (even with other fields filled) | `disabled` attribute |
| SU-05 | Mismatched passwords → toast error | `toast.error('Passwords do not match')` |
| SU-06 | Valid form calls `authApi.signup` with `{ name, email, phone, password }` | `confirmPassword` NOT in payload |
| SU-07 | Success → `completeOnboarding()` called | Store action invoked |
| SU-08 | Success → navigates to `/assessment` | Navigation triggered |
| SU-09 | Failure → error toast | API error shown |
| SU-10 | Eye icons toggle password and confirm field types | Both inputs toggle independently |

---

## 10. `src/pages/ForgotPassword.tsx`

**File:** `src/pages/__tests__/ForgotPassword.test.tsx`

| # | Description | Assert |
|---|---|---|
| FP-01 | Email input (`forgot-email`) renders | Input present |
| FP-02 | Submit disabled when email empty | `disabled` |
| FP-03 | Submit calls `authApi.forgotPassword` with `{ email }` | API called |
| FP-04 | `setResetEmail` called with entered email | Store `resetEmail` updated |
| FP-05 | Success → navigates to `/verify-code` | Navigation triggered |
| FP-06 | Failure → error toast | Error message shown |

---

## 11. `src/pages/VerifyCode.tsx`

**File:** `src/pages/__tests__/VerifyCode.test.tsx`

| # | Description | Assert |
|---|---|---|
| VC-01 | Renders exactly 6 OTP inputs | `screen.getAllByRole('textbox').length === 6` |
| VC-02 | Non-digit input ignored | State unchanged after letter input |
| VC-03 | Digit entry auto-focuses next input | Next input receives focus |
| VC-04 | Backspace on empty box focuses previous | Previous input receives focus |
| VC-05 | Submit disabled when any box empty | `disabled` |
| VC-06 | Submit enabled when all 6 boxes filled | `disabled` absent |
| VC-07 | Submit calls `authApi.verifyCode` with `{ email, code: '123456' }` | 6-char code passed |
| VC-08 | Submit calls `setResetCode` with the joined code | Store `resetCode` updated |
| VC-09 | Missing `resetEmail` → error toast before API call | Toast shown; API NOT called |
| VC-10 | Success → navigates to `/new-password` | Navigation triggered |
| VC-11 | "Resend" calls `authApi.forgotPassword` with stored email | API called |
| VC-12 | "Resend" shows success toast | Toast shown |

---

## 12. `src/pages/NewPassword.tsx`

**File:** `src/pages/__tests__/NewPassword.test.tsx`

| # | Description | Assert |
|---|---|---|
| NP-01 | Two password inputs render (`new-password`, `confirm-password`) | Both present |
| NP-02 | Submit disabled when password empty | `disabled` |
| NP-03 | Submit disabled when passwords don't match | `disabled` |
| NP-04 | Mismatch error message shown when confirm typed but different | `"Passwords do not match"` visible |
| NP-05 | Mismatch error hidden when passwords match | Error message not in DOM |
| NP-06 | Submit enabled when passwords match and non-empty | `disabled` absent |
| NP-07 | Missing `resetEmail` → error toast before API call | Toast shown; API NOT called |
| NP-08 | Calls `authApi.resetPassword` with `{ email: resetEmail, code: resetCode, password }` | Correct payload |
| NP-09 | Success → navigates to `/password-success` | Navigation triggered |
| NP-10 | Failure → error toast | Error message shown |

---

## 13. `src/pages/PasswordSuccess.tsx`

| # | Description | Assert |
|---|---|---|
| PS-01 | "Successfully" heading renders | Text present |
| PS-02 | "Log In" navigates to `/login` | Navigation triggered |
| PS-03 | CheckCircle icon renders | Icon present |

---

## 14. `src/pages/Onboarding.tsx`

| # | Description | Assert |
|---|---|---|
| ON-01 | Slide 1 content renders on mount | Slide 1 title visible |
| ON-02 | Button shows "Next" on slide 1 | Button text is "Next" |
| ON-03 | "Next" advances to slide 2 | Slide 2 title visible |
| ON-04 | Last slide shows "Get Started" | Button text changes |
| ON-05 | "Get Started" calls `completeOnboarding()` and navigates to `/signup` | Both triggered |
| ON-06 | "Skip" calls `completeOnboarding()` and navigates to `/signup` | Both triggered |
| ON-07 | Dots reflect current slide index | Active dot at correct position |

---

## 15. `src/pages/StressAssessment.tsx`

**File:** `src/pages/__tests__/StressAssessment.test.tsx`

> ⚠️ Step 1 has NO "Previous" button. Do not test for one (see Correction 5).

| # | Description | Assert |
|---|---|---|
| SA-01 | 5 questions × 5 buttons each = 25 answer buttons | 25 buttons |
| SA-02 | "Next" disabled initially | `disabled` |
| SA-03 | All 5 answered → "Next" enabled | `disabled` absent |
| SA-04 | Progress bar is `50%` on step 1 | `style.width === '50%'` |
| SA-05 | "Next" shows step 2 | Textarea visible |
| SA-06 | Progress bar is `100%` on step 2 | `style.width === '100%'` |
| SA-07 | Step 2 "Previous" returns to step 1 | Questions visible again |
| SA-08 | Submitting step 2 calls `assessmentApi.submit` with `{ answers, baseline_text }` | API called |
| SA-09 | Success → step 3 shows `result.score` and `result.label` | Score and label visible |
| SA-10 | Success → `completeAssessment(result.score, result.emotional_state)` called | Store action invoked |
| SA-11 | Failure → error toast; step stays at 2 | Toast shown; step 2 still visible |
| SA-12 | "Retake Assessment" resets to step 1, clears answers | Step 1 visible, no buttons selected |
| SA-13 | "Go to Dashboard" navigates to `/dashboard` | Navigation triggered |
| SA-14 | Empty recommendations → section not rendered | Section absent from DOM |
| SA-15 | Non-empty recommendations → titles visible | Recommendation titles in DOM |

---

## 16. `src/pages/Dashboard.tsx`

**File:** `src/pages/__tests__/Dashboard.test.tsx`

| # | Description | Assert |
|---|---|---|
| DB-01 | Greeting shows user's first name | e.g. "Good morning, John 👋" (hardcoded greeting in Dashboard) |
| DB-02 | Fetches stats on mount with range `'today'` | API called once |
| DB-03 | Emotional state from API response shown | `data.emotional_state` text visible |
| DB-04 | Changing range dropdown re-fetches | API called with `'week'` |
| DB-05 | Fetch error → yellow warning banner shown | "Could not refresh data" visible |
| DB-06 | Falls back to `assessmentScore` when stats null | Stored score shown |
| DB-07 | Falls back to `50` when neither source has data | `50%` visible |
| DB-08 | Gauge data derived from score (not hardcoded) | `deriveGaugeData` produces different segments for different scores |

---

## 17. `src/pages/Articles.tsx`

**File:** `src/pages/__tests__/Articles.test.tsx`

| # | Description | Assert |
|---|---|---|
| AR-01 | Skeleton cards shown while loading | Skeleton elements in DOM |
| AR-02 | Article cards rendered after fetch | Article titles visible |
| AR-03 | Clicking a card shows article detail | Full content visible |
| AR-04 | "Back to Articles" returns to list | List visible again |
| AR-05 | Sort dropdown change → API called with `sort=newest` | API called with correct param |
| AR-06 | Fetch error → "Failed to load articles." + "Retry" button | Error state visible |
| AR-07 | Clicking "Retry" triggers a new fetch | `retryCount` increments; API called again |
| AR-08 | Empty response → "No articles found." | Empty state visible |
| AR-09 | Article detail image has correct `alt` text | `img[alt="<title>"]` found |

---

## 18. `src/pages/SubiAI.tsx`

**File:** `src/pages/__tests__/SubiAI.test.tsx`

> ⚠️ The greeting is time-dependent. Freeze time or assert on time-independent text (see Correction 2).

| # | Description | Assert |
|---|---|---|
| AI-01 | Initial greeting renders — use `vi.setSystemTime(09:00)` or check `"Where should we start?"` | Time-independent content visible |
| AI-02 | 8 suggested prompt chips visible before first message | All 8 chips in DOM |
| AI-03 | Suggested prompts hidden after first message | Chips removed |
| AI-04 | Chip click sends that text as user message | User bubble with chip text appears |
| AI-05 | Submit shows user message and clears input | User bubble appears; input empty |
| AI-06 | Send button disabled when input empty | `disabled` |
| AI-07 | Send button disabled while `isTyping` | `disabled` during API call |
| AI-08 | Typing indicator (3 bouncing dots) shown while waiting | Indicator in DOM |
| AI-09 | API response appended as assistant message | Reply visible |
| AI-10 | API failure → fallback error message in chat | Fallback text visible |
| AI-11 | New message triggers `scrollIntoView` | `scrollIntoView` mock called |
| AI-12 | Each message has a unique `id` (no `Date.now()` collision risk) | All `key` props unique across fast sequential sends |

---

## 19. `src/pages/Settings.tsx`

**File:** `src/pages/__tests__/Settings.test.tsx`

> ⚠️ "Contact Us" is an `<a>` link, not a button. Query with `getByRole('link', ...)` (see Correction 3).

| # | Description | Assert |
|---|---|---|
| ST-01 | User name and email displayed | Values from store visible |
| ST-02 | All three fields (Name, Email, Phone) are `readOnly` by default | `readOnly` attribute on all three |
| ST-03 | "Edit" removes `readOnly` from all three fields | `readOnly` absent |
| ST-04 | "Save" calls `userApi.updateProfile` with `{ name, email, phone }` | API called once with correct data |
| ST-05 | Save success → `setUser` called + success toast | Store updated; toast shown |
| ST-06 | Save failure → error toast | Error message shown |
| ST-07 | Notifications toggle starts as `true` (on state) | Toggle styled as "on" |
| ST-08 | Toggle click → calls `userApi.updateNotifications({ notifications: false })` | API called |
| ST-09 | Notifications API failure → toggle reverted | Toggle returns to `true` |
| ST-10 | "Change password" button navigates to `/forgot-password` | Navigation triggered |
| ST-11 | "Contact Us" is an `<a>` with `href="mailto:support@subl.app"` | `getByRole('link', { name: /contact us/i })` has correct `href` |
| ST-12 | `currentUser` loads after mount → form syncs via `useEffect` | Fields updated when store hydrates |

---

## 20. `src/App.tsx` — Routing Integration

**File:** `src/__tests__/App.test.tsx`

Seed Zustand state with `useAppState.setState(...)` before rendering.

| # | Initial state | Navigates to `/` | Expected |
|---|---|---|---|
| RT-01 | `{}` (all false) | Yes | Redirects to `/onboarding` |
| RT-02 | `{ hasCompletedOnboarding: true }` | Yes | Redirects to `/login` |
| RT-03 | `{ hasCompletedOnboarding: true, isAuthenticated: true }` | Yes | Redirects to `/assessment` |
| RT-04 | all `true` | Yes | Redirects to `/dashboard` |
| RT-05 | `{}` | Direct `/dashboard` | Redirects to `/login` |
| RT-06 | `{}` | Direct `/articles` | Redirects to `/login` |
| RT-07 | `{}` | Direct `/subi-ai` | Redirects to `/login` |
| RT-08 | `{}` | Direct `/settings` | Redirects to `/login` |
| RT-09 | `{ isAuthenticated: true }` only | Direct `/assessment` | Renders assessment |
| RT-10 | `{ isAuthenticated: true, hasCompletedAssessment: true }` | Direct `/dashboard` | Renders dashboard |
| RT-11 | Any state | `/unknown-route` | Redirects to `/` |

---

## Coverage Targets

| Area | Target |
|---|---|
| `src/lib/` | 100% |
| `src/api/` | 90%+ |
| `src/hooks/` | 90%+ |
| `src/components/` | 85%+ |
| `src/pages/` | 80%+ |
| Overall | ≥ 80% |

Run: `npx vitest run --coverage`
