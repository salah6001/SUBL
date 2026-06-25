import type { ReactNode } from "react";

/** Parse the "vector:N" sentinel into an index 0..4, or null. */
export function avatarVectorIndex(url?: string | null): number | null {
  const m = /^vector:([0-4])$/.exec(url ?? "");
  return m ? Number(m[1]) : null;
}

/** 5 bundled, on-theme avatar vectors (full-bleed SVGs filling a circle). */
const VECTORS: ReactNode[] = [
  // 0 — blue, classic silhouette
  (<svg viewBox="0 0 40 40" className="w-full h-full"><defs><linearGradient id="av0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#4f46e5" /></linearGradient></defs><rect width="40" height="40" fill="url(#av0)" /><circle cx="20" cy="15" r="6.5" fill="#fff" fillOpacity="0.95" /><path d="M8 34c0-7 5.4-11 12-11s12 4 12 11" fill="#fff" fillOpacity="0.95" /></svg>),
  // 1 — violet, geometric triangle
  (<svg viewBox="0 0 40 40" className="w-full h-full"><defs><linearGradient id="av1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a855f7" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs><rect width="40" height="40" fill="url(#av1)" /><path d="M20 9l11 19H9z" fill="#fff" fillOpacity="0.92" /><circle cx="20" cy="22" r="3.2" fill="#7c3aed" /></svg>),
  // 2 — emerald, leaf/wave
  (<svg viewBox="0 0 40 40" className="w-full h-full"><defs><linearGradient id="av2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#10b981" /><stop offset="1" stopColor="#0d9488" /></linearGradient></defs><rect width="40" height="40" fill="url(#av2)" /><path d="M12 26c0-8 6-14 16-14 0 10-6 16-16 16z" fill="#fff" fillOpacity="0.92" /><path d="M14 28c5-6 9-9 13-10" stroke="#0d9488" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>),
  // 3 — amber, sun/rings
  (<svg viewBox="0 0 40 40" className="w-full h-full"><defs><linearGradient id="av3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f59e0b" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs><rect width="40" height="40" fill="url(#av3)" /><circle cx="20" cy="20" r="7" fill="#fff" fillOpacity="0.95" /><g stroke="#fff" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round"><line x1="20" y1="5" x2="20" y2="9" /><line x1="20" y1="31" x2="20" y2="35" /><line x1="5" y1="20" x2="9" y2="20" /><line x1="31" y1="20" x2="35" y2="20" /></g></svg>),
  // 4 — rose, abstract blob
  (<svg viewBox="0 0 40 40" className="w-full h-full"><defs><linearGradient id="av4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f43f5e" /><stop offset="1" stopColor="#db2777" /></linearGradient></defs><rect width="40" height="40" fill="url(#av4)" /><path d="M14 12c6-3 14 0 14 8s-6 10-12 8-9-13-2-16z" fill="#fff" fillOpacity="0.92" /></svg>),
];

export const AVATAR_VECTOR_COUNT = VECTORS.length;

interface Props {
  avatarUrl?: string | null;
  initials: string;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/** Renders a vector avatar, a hosted image, or an initials fallback. */
export function UserAvatar({ avatarUrl, initials, size = 32, className = "" }: Props) {
  const dim = { width: size, height: size };
  const idx = avatarVectorIndex(avatarUrl);

  if (idx != null) {
    return (
      <div style={dim} className={`rounded-full overflow-hidden shrink-0 ${className}`}>
        {VECTORS[idx]}
      </div>
    );
  }

  if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
    return <img src={avatarUrl} alt="" style={dim} className={`rounded-full object-cover shrink-0 ${className}`} />;
  }

  return (
    <div
      style={dim}
      className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 ${className}`}
    >
      <span style={{ fontSize: Math.round(size * 0.4) }}>{initials}</span>
    </div>
  );
}

/** The list of selectable avatar "vector:N" values, for the picker. */
export const AVATAR_VECTOR_VALUES = Array.from({ length: AVATAR_VECTOR_COUNT }, (_, i) => `vector:${i}`);
