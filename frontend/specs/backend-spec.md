# Subl — Backend API Specification

> Version: 1.0 · Date: 2026-05-03
> Audience: any backend developer or AI model implementing this API from scratch
> Frontend: React 18 + Vite SPA running at `http://localhost:3000` (dev) or a production domain

---

## How to Read This Document

- Every section is self-contained. You do not need to read it top to bottom.
- **Bold** = required field. *Italic* = optional field.
- All JSON keys are exactly as shown — no renaming, no camelCase vs snake_case confusion.
- "Protected" means the request must have a valid `Authorization: Bearer <token>` header. If the token is missing or invalid, return `401`.
- "Public" means no token is required.

---

## 1. Global Rules

### 1.1 Base URL
The frontend reads the base URL from the environment variable `VITE_API_URL`.
Example: `https://api.subl.app` or `http://localhost:8000`.

All paths in this document are relative to that base. Example: `POST /auth/login` means `POST https://api.subl.app/auth/login`.

### 1.2 Content Type
- All request bodies: `Content-Type: application/json`
- All responses: `Content-Type: application/json`
- No form data, no multipart — everything is JSON.

### 1.3 CORS
The backend must allow cross-origin requests from the frontend domain.
Minimum required headers in every response:

```
Access-Control-Allow-Origin: *          ← or the specific frontend domain
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

Handle `OPTIONS` preflight requests by returning `200 OK` with the headers above.

### 1.4 Authentication
The frontend uses Bearer tokens. After login or signup, the backend returns a `token` string. The frontend stores it in memory (Zustand) and sends it on every subsequent request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- You may use JWT or any opaque token format — the frontend treats it as a black box.
- If using JWT, a 7-day expiry is a reasonable default.
- If the token is missing or invalid on a protected route, return `401`.

### 1.5 Error Format
**Every error response**, regardless of status code, must follow this shape:

```json
{
  "message": "A human-readable description of what went wrong"
}
```

The frontend reads `body.message` and displays it directly to the user in a toast notification. Keep messages short and user-friendly.

Common status codes:
| Code | When to use |
|---|---|
| `400` | Invalid or missing request fields |
| `401` | Token missing, expired, or invalid |
| `403` | Authenticated but not allowed |
| `404` | Resource not found |
| `409` | Conflict (e.g., email already registered) |
| `422` | Business rule violation (e.g., wrong OTP code) |
| `500` | Unexpected server error |

### 1.6 Request Timeout
The frontend aborts requests after **10 seconds**. If your backend operation takes longer (e.g., AI inference), stream a response or return a job ID. Do not let requests hang.

---

## 2. Auth Endpoints (Public)

These endpoints do NOT require a token.

---

### 2.1 `POST /auth/login`

Log in an existing user.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | yes | Standard email format |
| `password` | string | yes | Plaintext — hash on your side |

**Success response — `200 OK`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid-or-integer-as-string",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "avatar": "https://cdn.example.com/avatars/abc.jpg"
  }
}
```

`avatar` may be an empty string `""` — the frontend will show a generated initial-based avatar as fallback.

**Error cases:**
- `401` — wrong email or password → `{ "message": "Invalid email or password" }`
- `400` — missing fields → `{ "message": "Email and password are required" }`

---

### 2.2 `POST /auth/register`

Create a new user account.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "secret123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Full name |
| `email` | string | yes | Must be unique |
| `phone` | string | yes | Any format the user types |
| `password` | string | yes | Min 8 chars enforced by frontend, validate on backend too |

**Success response — `200 OK`:**

Same shape as login:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890",
    "avatar": ""
  }
}
```

**Error cases:**
- `409` — email already taken → `{ "message": "An account with this email already exists" }`
- `400` — missing/invalid fields → `{ "message": "All fields are required" }`

---

### 2.3 `POST /auth/forgot-password`

Start the password reset flow. Send a 6-digit OTP to the user's email.

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Success response — `200 OK`:**
```json
{
  "message": "A reset code has been sent to your email"
}
```

**Important:** Even if the email is not registered, return `200 OK` with the same message. Never confirm whether an email exists — this prevents user enumeration attacks.

**Error cases:**
- `400` — email field missing

---

### 2.4 `POST /auth/verify-code`

Verify the 6-digit OTP the user received by email.

**Request body:**
```json
{
  "email": "user@example.com",
  "code": "483920"
}
```

| Field | Type | Notes |
|---|---|---|
| `email` | string | Same email from step 2.3 |
| `code` | string | Exactly 6 digits, always sent as a string |

**Success response — `200 OK`:**
```json
{
  "message": "Code verified"
}
```

**Error cases:**
- `422` — wrong code → `{ "message": "Invalid or expired code" }`
- `400` — missing fields

OTP should expire after **15 minutes**. Each code is single-use — invalidate it after successful verification.

---

### 2.5 `POST /auth/reset-password`

Set a new password. Only works after the code was verified in step 2.4.

**Request body:**
```json
{
  "email": "user@example.com",
  "code": "483920",
  "password": "newSecret456"
}
```

| Field | Type | Notes |
|---|---|---|
| `email` | string | |
| `code` | string | Re-validate the code here |
| `password` | string | The new plaintext password to hash and store |

**Success response — `200 OK`:**
```json
{
  "message": "Password has been reset successfully"
}
```

**Error cases:**
- `422` — code invalid or already used → `{ "message": "Invalid or expired code" }`
- `400` — missing fields

---

## 3. User Endpoints (Protected)

All require `Authorization: Bearer <token>`.

---

### 3.1 `GET /user/profile`

Get the currently logged-in user's profile.

**Request:** No body.

**Success response — `200 OK`:**
```json
{
  "id": "abc123",
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "avatar": ""
}
```

---

### 3.2 `PUT /user/profile`

Update profile fields. Only the fields sent should be updated.

**Request body (all fields optional, but at least one should be present):**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com",
  "phone": "+9876543210"
}
```

**Success response — `200 OK`:**

Return the full updated user object:
```json
{
  "id": "abc123",
  "name": "John Updated",
  "email": "newemail@example.com",
  "phone": "+9876543210",
  "avatar": ""
}
```

**Error cases:**
- `409` — new email already taken by another user

---

### 3.3 `PATCH /user/notifications`

Toggle push/email notifications for this user.

**Request body:**
```json
{
  "notifications": true
}
```

| Field | Type | Notes |
|---|---|---|
| `notifications` | boolean | `true` = enabled, `false` = disabled |

**Success response — `200 OK`:**
```json
{
  "message": "Notification preferences updated"
}
```

---

## 4. Assessment Endpoint (Protected)

### 4.1 `POST /assessment/submit`

The user completes a 2-step assessment:
1. 5 questions each answered on a scale of 1–5
2. A typed paragraph (keyboard baseline)

The frontend sends both together in one request.

**Request body:**
```json
{
  "answers": {
    "1": 3,
    "2": 2,
    "3": 4,
    "4": 1,
    "5": 5
  },
  "baseline_text": "Managing stress through mindfulness is about shifting your focus..."
}
```

| Field | Type | Notes |
|---|---|---|
| `answers` | object | Keys are question IDs as strings `"1"` through `"5"`. Values are integers 1–5. |
| `baseline_text` | string | The text the user typed. Used to analyze typing speed, error rate, rhythm. May be empty string if user skipped. |

**What the backend must compute:**

The frontend displays these exact fields — your backend must calculate all of them:

| Field | Description |
|---|---|
| `score` | Integer 0–100. Overall stress score. Higher = more stressed. |
| `label` | `"Normal"`, `"Medium"`, or `"High"`. Derived from score: 0–40 = Normal, 41–70 = Medium, 71–100 = High. |
| `emotional_state` | Short string describing state. Examples: `"Calm"`, `"Normal"`, `"Anxious"`, `"Overwhelmed"`. |
| `response_time` | Short string. Examples: `"Normal"`, `"Slow"`, `"Fast"`. Based on how long user spent on each answer. |
| `typing_pattern` | Short string. Examples: `"Consistent"`, `"Erratic"`, `"Hesitant"`. Based on `baseline_text` analysis. |
| `break_frequency` | Short string. Examples: `"Adequate"`, `"Low"`, `"High"`. Based on pauses in typing. |
| `recommendations` | Array of `{ title, description }` objects. 2–4 personalized tips based on score and answers. |

**Success response — `200 OK`:**
```json
{
  "score": 62,
  "label": "Medium",
  "emotional_state": "Anxious",
  "response_time": "Slow",
  "typing_pattern": "Erratic",
  "break_frequency": "Low",
  "recommendations": [
    {
      "title": "Take Regular Breaks",
      "description": "Step away from the keyboard every 45 minutes, even for 5 minutes."
    },
    {
      "title": "Mindful Breathing",
      "description": "Try 4-7-8 breathing to reduce acute stress before important tasks."
    }
  ]
}
```

**Minimum viable implementation if you don't have AI:**

You can compute the score from answers alone:
```
raw = sum of all 5 answers (range 5–25)
score = round((raw - 5) / 20 * 100)
label = "Normal" if score <= 40, "Medium" if score <= 70, else "High"
```
Then return hardcoded placeholder strings for `response_time`, `typing_pattern`, `break_frequency`.

---

## 5. Dashboard Endpoint (Protected)

### 5.1 `GET /dashboard/stats?range=today|week|month`

Return aggregated stress data for the currently logged-in user.

**Query parameter:**

| Param | Values | Default | Notes |
|---|---|---|---|
| `range` | `"today"`, `"week"`, `"month"` | `"today"` | The frontend always sends this param. |

**Success response — `200 OK`:**
```json
{
  "emotional_state": "Calm",
  "stress_score": 38,
  "stress_label": "Normal",
  "session_data": [
    { "name": "Mon", "value": 30, "color": "#3578FF" },
    { "name": "Tue", "value": 55, "color": "#3578FF" },
    { "name": "Wed", "value": 42, "color": "#3578FF" },
    { "name": "Thu", "value": 70, "color": "#3578FF" },
    { "name": "Fri", "value": 38, "color": "#3578FF" }
  ],
  "typing_data": [
    { "name": "Mon", "speed": 60 },
    { "name": "Tue", "speed": 45 },
    { "name": "Wed", "speed": 72 },
    { "name": "Thu", "speed": 38 },
    { "name": "Fri", "speed": 65 }
  ]
}
```

**Field details:**

| Field | Type | Notes |
|---|---|---|
| `emotional_state` | string | Current state. Examples: `"Calm"`, `"Normal"`, `"High"`, `"Anxious"` |
| `stress_score` | integer 0–100 | The user's current stress level |
| `stress_label` | `"Normal"` \| `"Medium"` \| `"High"` | Derived from score |
| `session_data` | array | One object per day/session. `name` = label shown on chart X-axis. `value` = stress score 0–100. `color` always `"#3578FF"`. |
| `typing_data` | array | One object per day/session. `name` = label. `speed` = typing speed in WPM (words per minute), integer. |

**For `range=today`:** Return a single data point or a few time-of-day points.
**For `range=week`:** Return 7 data points (Mon–Sun).
**For `range=month`:** Return ~30 data points or weekly aggregates.

**Minimum viable implementation:**

If you don't have historical data yet, return static arrays with placeholder values — the chart will still render and the app will function.

---

## 6. Articles Endpoints (Protected)

### 6.1 `GET /articles?sort=newest|popular`

List all published articles.

**Query parameter:**

| Param | Values | Notes |
|---|---|---|
| `sort` | `"newest"`, `"popular"` | Optional. If omitted, return any order. |

**Success response — `200 OK`:**

An array of article objects (can be empty array `[]`):
```json
[
  {
    "id": 1,
    "title": "How Keyboard Dynamics Reveal Your Mental State",
    "excerpt": "Research shows that the way you type — speed, rhythm, error rate — can be a reliable indicator of stress.",
    "image": "https://cdn.example.com/articles/keyboard-stress.jpg",
    "tag": "Research",
    "read_time": "4 min read",
    "author": {
      "name": "Dr. Sarah Chen",
      "avatar": "https://cdn.example.com/authors/sarah.jpg",
      "date": "Apr 28, 2026"
    },
    "content": "Full article text here. Can include multiple paragraphs separated by newlines."
  }
]
```

**Field details:**

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Unique article ID |
| `title` | string | Article headline |
| `excerpt` | string | Short summary, 1–2 sentences. Shown in the card before opening. |
| `image` | string | Full URL to the article cover image. May be empty — frontend will show a keyboard-themed generated placeholder instead. |
| `tag` | string | Category label. Examples: `"Research"`, `"Wellness"`, `"Productivity"`, `"Health"` |
| `read_time` | string | Human-readable estimate. Example: `"4 min read"` |
| `author.name` | string | Author's display name |
| `author.avatar` | string | URL to author's photo. May be empty. |
| `author.date` | string | Publication date. Human-readable. Example: `"Apr 28, 2026"` |
| `content` | string | Full article body. Plain text, newlines for paragraphs. |

**Note on images:** Do not include images of women. Use keyboard, workspace, abstract, or technology photography.

---

### 6.2 `GET /articles/:id`

Get a single article by its ID.

**URL parameter:** `:id` is an integer.

**Success response — `200 OK`:**

Same shape as a single object from the list above:
```json
{
  "id": 1,
  "title": "...",
  "excerpt": "...",
  "image": "...",
  "tag": "Research",
  "read_time": "4 min read",
  "author": { "name": "...", "avatar": "...", "date": "..." },
  "content": "..."
}
```

**Error cases:**
- `404` — article not found → `{ "message": "Article not found" }`

---

## 7. Chat Endpoint (Protected)

### 7.1 `POST /chat`

Send a user message to the AI assistant and get a reply.

**Request body:**
```json
{
  "message": "How can I manage work stress better?"
}
```

**Success response — `200 OK`:**
```json
{
  "reply": "Great question! Here are a few evidence-based strategies that can help you manage work stress..."
}
```

| Field | Type | Notes |
|---|---|---|
| `message` | string | The user's chat message |
| `reply` | string | The AI's response. Plain text. May include newlines. |

**Implementation options:**
- Connect to OpenAI, Anthropic Claude, or any LLM.
- Add a system prompt that focuses responses on stress management, wellness, productivity, and keyboard-behavior topics.
- If you don't have an LLM yet, return a hardcoded reply like `"I'm still being set up. Check back soon!"`.

**Important:** This endpoint must respond within 10 seconds (the frontend timeout). If your LLM takes longer, consider streaming (SSE or chunked transfer). The current frontend does not support streaming — it waits for the full response. If needed, the frontend can be updated to support streaming later.

---

## 8. Full Endpoint Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Log in |
| `POST` | `/auth/register` | Public | Sign up |
| `POST` | `/auth/forgot-password` | Public | Request OTP |
| `POST` | `/auth/verify-code` | Public | Verify OTP |
| `POST` | `/auth/reset-password` | Public | Set new password |
| `GET` | `/user/profile` | Protected | Get current user |
| `PUT` | `/user/profile` | Protected | Update profile |
| `PATCH` | `/user/notifications` | Protected | Toggle notifications |
| `POST` | `/assessment/submit` | Protected | Submit stress assessment |
| `GET` | `/dashboard/stats` | Protected | Get stress statistics |
| `GET` | `/articles` | Protected | List articles |
| `GET` | `/articles/:id` | Protected | Get one article |
| `POST` | `/chat` | Protected | AI chat |

**Total: 13 endpoints.**

---

## 9. Suggested Database Schema

This is a recommendation, not a requirement. Use any database you prefer.

### `users`
```
id            UUID or auto-increment INTEGER   Primary key
name          VARCHAR(255)                     Required
email         VARCHAR(255)                     Required, unique
phone         VARCHAR(50)
password_hash VARCHAR(255)                     bcrypt or argon2 hash
avatar        TEXT                             URL, nullable
notifications BOOLEAN                          Default true
created_at    TIMESTAMP
```

### `otp_codes`
```
id         UUID
email      VARCHAR(255)
code       CHAR(6)
used       BOOLEAN      Default false
expires_at TIMESTAMP    15 minutes from creation
created_at TIMESTAMP
```

### `assessment_results`
```
id               UUID
user_id          FK → users.id
score            INTEGER (0–100)
label            VARCHAR(10)
emotional_state  VARCHAR(50)
response_time    VARCHAR(50)
typing_pattern   VARCHAR(50)
break_frequency  VARCHAR(50)
recommendations  JSON
raw_answers      JSON    { "1": 3, "2": 2, ... }
baseline_text    TEXT
created_at       TIMESTAMP
```

### `articles`
```
id         INTEGER     Auto-increment, Primary key
title      TEXT
excerpt    TEXT
content    TEXT
image      TEXT        URL to cover image
tag        VARCHAR(50)
read_time  VARCHAR(20) e.g. "4 min read"
author_name   VARCHAR(255)
author_avatar TEXT       URL
author_date   VARCHAR(50) e.g. "Apr 28, 2026"
published  BOOLEAN     Default true
sort_order INTEGER     For ordering
created_at TIMESTAMP
```

---

## 10. Temporary Demo Bypass (Remove When Backend Is Live)

A single-user login bypass is active in the frontend to allow testing the app before the backend exists.

### How it works

Two environment variables in `.env.local` (gitignored, never committed) define the demo credentials:

```
VITE_DEMO_EMAIL=admin@subl.app
VITE_DEMO_PASSWORD=subl2026
```

When the user submits the login form, `src/lib/demoAuth.ts` checks if the credentials match those env vars. If they do, it returns a fake `AuthResponse` and skips the real API call entirely. If the env vars are absent or the credentials don't match, the real API is called normally.

The bypass is completely inert if the env vars are not set — no code path reaches the API mock in production.

### What to remove when the backend is connected

**Step 1** — Delete the module:
```bash
rm src/lib/demoAuth.ts
```

**Step 2** — Remove the added lines from `src/pages/Login.tsx`:
```ts
// DELETE this import:
import { tryDemoLogin } from '@/lib/demoAuth';

// REVERT this line back to:
//   const { token, user } = await authApi.login(data);
const { token, user } = tryDemoLogin(data.email, data.password) ?? await authApi.login(data);
```

**Step 3a** — Remove the added lines from `src/pages/StressAssessment.tsx`:
```ts
// DELETE this import:
import { isDemoSession, getDemoAssessmentResult } from '@/lib/demoAuth';

// REVERT this block back to a single line:
//   const data = await assessmentApi.submit({ answers, baseline_text: baseline });
const data = isDemoSession()
  ? getDemoAssessmentResult()
  : await assessmentApi.submit({ answers, baseline_text: baseline });
```

**Step 4** — Remove the credentials from `.env.local`:
```
# Delete these two lines:
VITE_DEMO_EMAIL=admin@subl.app
VITE_DEMO_PASSWORD=subl2026
```

**Step 5** — Remove the commented-out keys from `.env.example`:
```
# Delete these three lines:
# Temporary demo bypass — remove both lines once the backend is connected
# VITE_DEMO_EMAIL=
# VITE_DEMO_PASSWORD=
```

That's everything. No other files are affected.

---

## 11. Getting Started Checklist

Copy this and check off each item:

- [ ] Server is running and reachable at the URL you set in `VITE_API_URL`
- [ ] CORS is configured to allow requests from the frontend origin
- [ ] All error responses return `{ "message": "..." }` — not `{ "error": ... }` or any other shape
- [ ] `POST /auth/login` returns `{ token, user }` on success
- [ ] `POST /auth/register` returns `{ token, user }` on success
- [ ] All protected routes return `401` when token is missing
- [ ] `POST /assessment/submit` returns all required fields: `score`, `label`, `emotional_state`, `response_time`, `typing_pattern`, `break_frequency`, `recommendations`
- [ ] `GET /dashboard/stats` returns `session_data` and `typing_data` as arrays (even if only one item)
- [ ] `GET /articles` returns an array (even if empty `[]`)
- [ ] `POST /chat` responds within 10 seconds
- [ ] Article images do not include women

---

## 11. Test the Connection

Once your server is running, you can test the connection manually from the terminal:

```bash
# 1. Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"123","password":"password123"}'

# 2. Log in (copy the token from the response)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# 3. Test a protected route (replace TOKEN with the real token)
curl http://localhost:8000/dashboard/stats?range=today \
  -H "Authorization: Bearer TOKEN"
```

If all three commands return valid JSON, the frontend will work.
