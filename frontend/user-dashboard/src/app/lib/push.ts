import { pushApi } from "../api/push";

// Browser Web Push helpers. Push requires a secure context (https, or
// localhost in dev) plus Notification + service-worker + PushManager support.

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

/**
 * Requests permission, subscribes via the PushManager and registers the
 * subscription with the backend. Returns true on success.
 */
export async function enablePush(): Promise<boolean> {
  if (!isPushSupported()) throw new Error("Push not supported in this browser");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");

  const { publicKey } = await pushApi.getVapidKey();
  if (!publicKey) throw new Error("Push is not configured on the server");

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await pushApi.registerToken(JSON.stringify(subscription), navigator.userAgent.slice(0, 80));
  return true;
}

/** Removes the browser push subscription (backend deactivates lazily on 410). */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
}
