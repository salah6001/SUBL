// Where the desktop-agent builds are published. Overridable at build time so
// it can point at a specific release instead of "latest".
const RELEASES_URL =
  (import.meta.env.VITE_AGENT_RELEASES_URL as string | undefined) ??
  "https://github.com/abdulrahman-wael/subl/releases/latest";

export type AgentOs = "Windows" | "macOS" | "Linux" | "Other";

/** Best-effort OS detection so we can label the download button. */
export function detectOs(): AgentOs {
  const ua =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform || navigator.userAgent;
  if (/win/i.test(ua)) return "Windows";
  if (/mac|iphone|ipad|ios/i.test(ua)) return "macOS";
  if (/linux|android|x11/i.test(ua)) return "Linux";
  return "Other";
}

/** The release page to open and a friendly per-OS label. */
export function agentDownload(): { os: AgentOs; url: string } {
  return { os: detectOs(), url: RELEASES_URL };
}
