# Enabling Browser Push Notifications

Subl can send you **browser push notifications** — small pop‑ups from your
operating system (Windows / macOS / Linux) — even when the Subl tab is in the
background or closed. This is how you receive wellness nudges, break reminders,
and stress alerts without having to keep the dashboard open.

This guide is written for everyday users first, with a technical section at the
end for developers.

---

## 1. Before you start

Browser push only works when **all** of the following are true:

| Requirement | Why |
|-------------|-----|
| You open the **User dashboard** at `http://localhost:3002` (or your real `https://` domain) | Push requires a *secure context*: `https`, or `localhost` during development. It will **not** work over a plain `http://` IP address such as `http://192.168.x.x`. |
| You use a supported browser: **Chrome, Edge, Firefox, Opera, Brave** | These support the Web Push standard. |
| **Apple Safari** users are on macOS 13+ / iOS 16.4+ and have **added the site to the Home Screen / Dock** | Safari only allows push for installed web apps. |
| You are **logged in** | The subscription is tied to your account so notifications reach the right person. |

> **Tip:** Notifications are off by default. Nothing is sent until you turn them
> on, and you can turn them off again at any time.

---

## 2. Turn on notifications (the easy way)

1. Open the **User dashboard** and **log in**.
2. Go to **Settings** → **Notifications**.
3. Find the **Browser push notifications** toggle and switch it **on**.
4. Your browser will show a small prompt asking to **Allow notifications**.
   Click **Allow**.
5. Done. You'll now receive Subl notifications as desktop pop‑ups.

If you clicked **Allow** and the toggle turned on, everything is working. To
test it, ask an admin to fire a test notification, or simply start a stress
session from the desktop agent — the *"session started"* and any alert
notifications will appear as pop‑ups.

---

## 3. If you don't see the permission prompt

The browser only asks **once**. If you previously clicked *Block* (or dismissed
it), the prompt won't appear again until you reset the permission:

### Google Chrome / Microsoft Edge / Brave
1. Click the **padlock 🔒 (or "Site information")** icon to the left of the
   address bar.
2. Find **Notifications** and set it to **Allow** (or **Reset permission**).
3. Reload the page and toggle the setting on again.

You can also go to:
`chrome://settings/content/notifications` (Chrome) or
`edge://settings/content/notifications` (Edge) and make sure
`http://localhost:3002` is **not** in the *Block* list.

### Mozilla Firefox
1. Click the **padlock 🔒** icon in the address bar.
2. Click **Connection secure → More information → Permissions**, or click the
   small **⊘ / permissions** icon next to the padlock.
3. Set **Send Notifications** to **Allow**.
4. Reload and toggle on again.

Or visit `about:preferences#privacy` → **Permissions** → **Notifications →
Settings…** and remove any *Block* entry for the Subl site.

### Safari (macOS)
1. Safari menu → **Settings… → Websites → Notifications**.
2. Set the Subl site to **Allow**.
3. Remember: on Safari you must first **add Subl to the Dock / Home Screen**
   (Share → *Add to Dock* / *Add to Home Screen*).

---

## 4. Turning notifications off

- **Inside Subl:** Settings → Notifications → switch **Browser push
  notifications** off. This removes your subscription so the server stops
  sending to this browser.
- **From the browser:** use the padlock 🔒 menu (see above) and set
  Notifications to **Block**.

Turning the toggle off on one browser does **not** affect other browsers or
devices where you enabled it — each one subscribes separately.

---

## 5. Frequently asked questions

**Do I have to keep the Subl tab open?**
No. Once enabled, your operating system delivers the notification through a
background *service worker*, even if the tab is closed. (The browser itself
needs to be running.)

**Will this work on my phone?**
Yes on Android (Chrome/Firefox). On iPhone/iPad, you must add Subl to the Home
Screen first (Safari requirement).

**Why did it work at the office but not at home?**
Most likely the home address used `http://` with an IP instead of `https://` or
`localhost`. Push is blocked on insecure origins.

**Is my data exposed?**
No. The notification payload only contains the message text (e.g. "Time for a
break"). Subscriptions are encrypted end‑to‑end using the Web Push (VAPID)
standard.

---

## 6. Technical reference (for developers)

The full flow is already implemented in this repo. Key pieces:

**Frontend (user dashboard)**
- `frontend/user-dashboard/public/sw.js` — the service worker that listens for
  `push` events and calls `showNotification`, and handles `notificationclick`.
- `frontend/user-dashboard/src/app/lib/push.ts` — `enablePush()` /
  `disablePush()`. `enablePush()`:
  1. checks `isPushSupported()` (serviceWorker + PushManager + Notification),
  2. calls `Notification.requestPermission()`,
  3. fetches the VAPID public key,
  4. registers `/sw.js` and `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`,
  5. POSTs the subscription to the backend.
- `frontend/user-dashboard/src/app/api/push.ts` — the two API calls.
- The toggle lives in `components/Settings.tsx`.

**Backend (API)**
- `GET /notifications/vapid-public-key` → returns the public VAPID key
  (`Endpoints/Notifications/GetVapidKey.cs`).
- `POST /notifications/push-tokens` → stores the browser subscription JSON
  (`token`, `platform: "Web"`, `deviceName`).
- Delivery: `Infrastructure/Notifications/Channels/PushNotificationChannel.cs`
  uses the `WebPush` NuGet client with `VapidDetails(Subject, PublicKey,
  PrivateKey)`. On a `410 Gone` response the subscription is deactivated lazily.

**VAPID keys**
Configured under the `WebPush` section. Development keys are committed in
`api/src/Web.Api/appsettings.Development.json`:

```jsonc
"WebPush": {
  "Subject": "mailto:admin@subl.local",
  "PublicKey": "BNLGpqmbppbDg6eCwhbIzd5fFUrYUyLHXX8pDx9j3wVV7e_BZJa-AfvKn5eiauC5bz80LzNfCnLSMCLNLZXXh8M",
  "PrivateKey": "2_ygRZB4uqYX76qIdp1ltRvK0qlr7ssOZOKCXaFjIWM"
}
```

> ⚠️ **Production:** generate a *new* VAPID key pair and supply it via
> environment variables (`WebPush__Subject`, `WebPush__PublicKey`,
> `WebPush__PrivateKey`) — never reuse the committed development keys. You can
> generate a pair with `npx web-push generate-vapid-keys`.

**Why localhost works without HTTPS**
Browsers treat `http://localhost` as a secure context for development, so the
service worker and PushManager are available without a TLS certificate. Any
other host must be served over `https://`.
