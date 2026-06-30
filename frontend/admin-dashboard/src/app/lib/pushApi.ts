import { api } from "./apiClient";

export const pushApi = {
  /** VAPID public key the browser needs to create a push subscription. */
  getVapidKey: () =>
    api.get<{ publicKey: string | null }>("notifications/vapid-public-key"),

  /** Persist a browser push subscription (stored as JSON in the token field). */
  registerToken: (subscriptionJson: string, deviceName?: string) =>
    api.post<{ id: string }>("notifications/push-tokens", {
      token: subscriptionJson,
      platform: "Web",
      deviceName: deviceName ?? "Admin Browser",
    }),
};
