import { SublLogoFull } from './SublLogo';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function AuthLayout({ children, showBack, onBack }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left panel - form */}
      <div className="flex flex-col w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 py-8">
        <div className="flex items-center gap-2 mb-8">
          {showBack && (
            <button onClick={onBack} className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <SublLogoFull className="h-10 w-auto" />
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {children}
        </div>
      </div>

      {/* Right panel - illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f36] relative flex-col items-center justify-center p-12">
        <svg
          viewBox="0 0 440 320"
          className="w-full max-w-md mb-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Keystroke stress analytics illustration"
        >
          <defs>
            <linearGradient id="al-key" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3578FF" />
              <stop offset="1" stopColor="#1B47B5" />
            </linearGradient>
            <linearGradient id="al-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7BA6FF" />
              <stop offset="1" stopColor="#3578FF" />
            </linearGradient>
            <radialGradient id="al-glow" cx="50%" cy="38%" r="60%">
              <stop offset="0" stopColor="#3578FF" stopOpacity="0.35" />
              <stop offset="1" stopColor="#3578FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ambient glow */}
          <ellipse cx="220" cy="130" rx="200" ry="140" fill="url(#al-glow)" />

          {/* dashboard card */}
          <rect x="60" y="36" width="320" height="170" rx="18" fill="#0F1428" stroke="#2A3354" strokeWidth="1.5" />
          <circle cx="84" cy="60" r="4" fill="#3578FF" />
          <rect x="98" y="56" width="70" height="8" rx="4" fill="#2A3354" />
          <rect x="300" y="54" width="56" height="12" rx="6" fill="#16306E" />

          {/* grid */}
          <g stroke="#1E2745" strokeWidth="1">
            <line x1="84" y1="96" x2="356" y2="96" />
            <line x1="84" y1="128" x2="356" y2="128" />
            <line x1="84" y1="160" x2="356" y2="160" />
          </g>

          {/* stress curve - jagged then calming */}
          <path
            d="M84 158 L108 116 L126 146 L146 92 L168 136 L190 106 L214 146 L240 128 L268 134 L300 130 L330 132 L356 131"
            fill="none" stroke="url(#al-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M84 158 L108 116 L126 146 L146 92 L168 136 L190 106 L214 146 L240 128 L268 134 L300 130 L330 132 L356 131 L356 184 L84 184 Z"
            fill="#3578FF" fillOpacity="0.08"
          />
          <circle cx="146" cy="92" r="5" fill="#ffffff" />
          <circle cx="146" cy="92" r="9" fill="#ffffff" fillOpacity="0.15" />

          {/* keyboard row */}
          <rect x="84" y="244" width="44" height="44" rx="10" fill="url(#al-key)" />
          <rect x="138" y="244" width="44" height="44" rx="10" fill="#16213F" stroke="#2A3354" />
          <rect x="192" y="244" width="100" height="44" rx="10" fill="#16213F" stroke="#2A3354" />
          <rect x="302" y="244" width="44" height="44" rx="10" fill="#16213F" stroke="#2A3354" />
          <path
            d="M96 266 l6 0 l3 -7 l5 14 l3 -7 l6 0"
            stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <div className="text-center max-w-sm">
          <h3 className="text-white text-xl font-semibold mb-3">Understand Your Work Stress</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Subl quietly analyzes your keyboard interactions and typing dynamics to detect early signs of stress while you work.
          </p>
        </div>
      </div>
    </div>
  );
}
