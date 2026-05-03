export function SublLogo({ className = "w-8 h-8", color = "#3578FF" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Brain outline */}
      <path
        d="M24 6C15.163 6 8 13.163 8 22C8 30.837 15.163 38 24 38C32.837 38 40 30.837 40 22C40 13.163 32.837 6 24 6Z"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      {/* Brain left hemisphere details */}
      <path
        d="M24 6V38"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 12C14 14 13 17 13 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 12C34 14 35 17 35 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 26C15 29 17 31 20 32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M34 26C33 29 31 31 28 32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Waveform lines crossing through */}
      <path
        d="M4 24C4 24 8 16 12 20C16 24 16 28 20 24C24 20 24 28 28 24C32 20 32 24 36 20C40 16 44 24 44 24"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Circuit nodes */}
      <circle cx="12" cy="20" r="2" fill={color} />
      <circle cx="20" cy="24" r="2" fill={color} />
      <circle cx="28" cy="24" r="2" fill={color} />
      <circle cx="36" cy="20" r="2" fill={color} />
    </svg>
  );
}
