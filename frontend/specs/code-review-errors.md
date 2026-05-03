# Code Review — Error & Issue Specification

> Revised: 2026-05-02 — all issues resolved after two kiro-cli fix passes
> Scope: `app/` — all source files, config, and build setup

---

## All Issues Resolved ✅

Every issue identified in this review has been fixed. The table below is the complete record.

---

## Fixed Issues

| ID | File | Summary |
|---|---|---|
| CRIT-01 | `vite.config.ts:10` | `inspectAttr()` now conditionally loaded only when `NODE_ENV === 'development'`; moved to devDependencies ✅ |
| CRIT-02 | `api/client.ts:3-4` | `VITE_API_URL` validated at startup with `throw` ✅ |
| CRIT-03 | `Sidebar.tsx:59` | Logout button now calls `logout()` then `navigate('/login')` ✅ |
| BUG-01 | `App.tsx:51` | `/assessment` wrapped in `<ProtectedRoute>` ✅ |
| BUG-02 | `App.tsx:52-55` | `AssessmentGuard` added for all post-auth routes ✅ |
| BUG-03 | `VerifyCode.tsx:11` | OTP array now has 6 slots ✅ |
| BUG-04 | `VerifyCode.tsx:35`, `NewPassword.tsx:23` | Code stored via `setResetCode`, forwarded to `resetPassword` ✅ |
| BUG-05 | `SignUp.tsx:153` | `!formData.confirmPassword` added to disabled guard ✅ |
| BUG-06 | `SignUp.tsx:39` | `completeOnboarding()` called on successful signup ✅ |
| BUG-07 | `Dashboard.tsx:15-24` | `deriveGaugeData(score)` replaces hardcoded array ✅ |
| BUG-08 | `SubiAI.tsx:28,53,66,72` | `useRef` counter replaces `Date.now()` IDs ✅ |
| BUG-09 | `Settings.tsx:22-30` | `useEffect` syncs `formData` when `currentUser` changes ✅ |
| BUG-10 | `StressAssessment.tsx:119` | "Previous" button removed from step 1 ✅ |
| BUG-11 | `StressAssessment.tsx:30-34` | `localScore` guarded with `null` when no answers ✅ |
| BP-01 | `vite.config.ts` | `base: './'` removed; Vite now defaults to `'/'` ✅ |
| BP-02 | `package.json:2` | `"name": "subl-app"` ✅ |
| BP-03 | `package.json` | `react-router-dom` removed (React Router v7 uses `react-router` only) ✅ |
| BP-04 | `package.json` | `next-themes` removed (was never used) ✅ |
| BP-05 | `api/client.ts:7` | Token now read via `useAppState.getState().token` ✅ |
| BP-06 | `api/client.ts:29` | `AbortSignal.timeout(10_000)` added ✅ |
| BP-07 | `useAppState.ts:3,9` | Imports and uses `User` type from `@/types` ✅ |
| BP-08 | `useAppState.ts:5,14` | `EmotionalState` union type defined and applied ✅ |
| BP-09 | `ErrorBoundary.tsx:13-15` | `componentDidCatch` implemented with `console.error` ✅ |
| BP-10 | `src/pages/Home.tsx`, `src/App.css` | Both scaffold files deleted ✅ |
| BP-11 | `App.tsx:56` | `path="*"` fallback route added ✅ |
| BP-12 | `VerifyCode.tsx:20` | Boundary uses `code.length - 1` ✅ |
| BP-14 | `Dashboard.tsx:12` | `DEFAULT_STRESS_SCORE = 50` constant ✅ |
| BP-15 | `App.tsx`, `ArticleDetail.tsx` | `/articles/:id` route added; `ArticleDetail` page created with `useParams` ✅ |
| BP-16 | `src/index.css:1`, `main.tsx` | Google Fonts `@import` removed; `@fontsource/lato` self-hosted ✅ |
| BP-17 | All form pages | `useForm + zodResolver + zod` applied across Login, SignUp, ForgotPassword, NewPassword, Settings ✅ |
| BP-18 | All form pages | `id`/`htmlFor` pairs added ✅ |
| BP-19 | Sidebar, SubiAI, AppLayout | `aria-label` added to all icon-only buttons ✅ |
| UX-01 | `NewPassword.tsx:75-77` | Inline mismatch error shown ✅ |
| UX-02 | `Login.tsx` | "Remember me" checkbox removed entirely ✅ |
| UX-03 | `Dashboard.tsx:32,52-56` | `fetchError` state + yellow warning banner ✅ |
| UX-04 | `Articles.tsx:20,82-91` | Error state + retry button ✅ |
| UX-05 | `Articles.tsx:92-96` | Empty state message ✅ |
| UX-06 | `SubiAI.tsx:30-31` | Time-aware greeting (morning / afternoon / evening) ✅ |
| UX-07 | `Settings.tsx:160-181` | "Change password" navigates; "Contact Us" is `<a href="mailto:">` ✅ |
| UX-08 | `Settings.tsx:83-101` | Name input field added ✅ |
| UX-09 | `Settings.tsx:63-65` | Local SVG initial avatar, no external URL ✅ |
| UX-10 | `ForgotPassword.tsx:33` | Heading corrected to "Forgot Password" ✅ |
| UX-11 | `AppLayout.tsx:25-32` | Search input `disabled` + `opacity-60` + `cursor-not-allowed` ✅ |
| UX-12 | `AppLayout.tsx:34-39` | Bell button `disabled`, red badge removed ✅ |
