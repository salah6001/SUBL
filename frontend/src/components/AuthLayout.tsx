import { SublLogo } from './SublLogo';
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
            <button onClick={onBack} className="mr-2 p-2 hover:bg-subl-grey-100 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <SublLogo className="w-8 h-8" />
          <span className="text-xl font-bold text-subl-blue-500">Subl</span>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {children}
        </div>
      </div>

      {/* Right panel - illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f36] relative flex-col items-center justify-center p-12">
        <img
          src="/auth-illustration.jpg"
          alt="Wellness illustration"
          className="w-full max-w-md object-contain mb-8 rounded-lg"
        />
        <div className="text-center max-w-sm">
          <h3 className="text-white text-xl font-semibold mb-3">Understand Your Work Stress</h3>
          <p className="text-subl-grey-400 text-sm leading-relaxed">
            Subl quietly analyzes your keyboard interactions and typing dynamics to detect early signs of stress while you work.
          </p>
        </div>
      </div>
    </div>
  );
}
