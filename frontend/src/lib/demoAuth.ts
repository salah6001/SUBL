import type { AuthResponse, AssessmentResult } from '@/types';
import { useAppState } from '@/hooks/useAppState';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;

/**
 * TEMPORARY — remove this file and all its imports once the backend is live.
 * Controlled entirely by VITE_DEMO_EMAIL + VITE_DEMO_PASSWORD in .env.local.
 * Returns null / false when env vars are absent — completely inert without them.
 */

export function tryDemoLogin(email: string, password: string): AuthResponse | null {
  if (!DEMO_EMAIL || !DEMO_PASSWORD) return null;
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return null;

  return {
    token: 'demo-bypass-token',
    user: {
      id: 'demo-1',
      name: 'Demo User',
      email: DEMO_EMAIL,
      phone: '',
      avatar: '',
    },
  };
}

export function isDemoSession(): boolean {
  return useAppState.getState().token === 'demo-bypass-token';
}

export function getDemoAssessmentResult(): AssessmentResult {
  return {
    score: 38,
    label: 'Normal',
    emotional_state: 'Calm',
    response_time: 'Normal',
    typing_pattern: 'Consistent',
    break_frequency: 'Adequate',
    recommendations: [
      {
        title: 'Keep It Up',
        description: 'Your stress levels are in a healthy range. Maintain your current routine.',
      },
      {
        title: 'Take Short Breaks',
        description: 'Step away from the keyboard for 5 minutes every hour to stay sharp.',
      },
      {
        title: 'Stay Hydrated',
        description: 'Drink water regularly throughout your work session.',
      },
    ],
  };
}
