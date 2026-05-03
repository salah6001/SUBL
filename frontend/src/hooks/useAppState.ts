import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

export type EmotionalState = 'Normal' | 'Calm' | 'Medium' | 'High' | 'Angry' | 'Sad';

interface AppState {
  token: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedAssessment: boolean;
  assessmentScore: number | null;
  emotionalState: EmotionalState;
  resetEmail: string | null;
  resetCode: string | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: Partial<User> & Pick<User, 'name' | 'email' | 'phone' | 'avatar'>) => void;
  logout: () => void;
  completeOnboarding: () => void;
  completeAssessment: (score: number, emotionalState?: string) => void;
  setEmotionalState: (state: EmotionalState) => void;
  setResetEmail: (email: string) => void;
  setResetCode: (code: string) => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasCompletedAssessment: false,
      assessmentScore: null,
      emotionalState: 'Normal',
      resetEmail: null,
      resetCode: null,
      setAuth: (token, user) => set({ token, currentUser: user, isAuthenticated: true }),
      setUser: (user) =>
        set((s) => ({
          currentUser: { id: s.currentUser?.id ?? '', ...user },
          isAuthenticated: true,
        })),
      logout: () =>
        set({
          token: null,
          currentUser: null,
          isAuthenticated: false,
          hasCompletedAssessment: false,
          assessmentScore: null,
          resetCode: null,
        }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      completeAssessment: (score, emotionalState) =>
        set({ hasCompletedAssessment: true, assessmentScore: score, ...(emotionalState ? { emotionalState: emotionalState as EmotionalState } : {}) }),
      setEmotionalState: (state) => set({ emotionalState: state }),
      setResetEmail: (email) => set({ resetEmail: email }),
      setResetCode: (code) => set({ resetCode: code }),
    }),
    { name: 'subl-app-storage' }
  )
);
