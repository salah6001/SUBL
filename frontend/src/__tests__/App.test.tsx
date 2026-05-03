import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../App';
import { useAppState } from '@/hooks/useAppState';

// Mock all page components to avoid rendering complexity
vi.mock('../pages/Onboarding', () => ({ default: () => <div>Onboarding Page</div> }));
vi.mock('../pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('../pages/SignUp', () => ({ default: () => <div>SignUp Page</div> }));
vi.mock('../pages/ForgotPassword', () => ({ default: () => <div>ForgotPassword Page</div> }));
vi.mock('../pages/VerifyCode', () => ({ default: () => <div>VerifyCode Page</div> }));
vi.mock('../pages/NewPassword', () => ({ default: () => <div>NewPassword Page</div> }));
vi.mock('../pages/PasswordSuccess', () => ({ default: () => <div>PasswordSuccess Page</div> }));
vi.mock('../pages/StressAssessment', () => ({ default: () => <div>StressAssessment Page</div> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('../pages/Articles', () => ({ default: () => <div>Articles Page</div> }));
vi.mock('../pages/ArticleDetail', () => ({ default: () => <div>ArticleDetail Page</div> }));
vi.mock('../pages/SubiAI', () => ({ default: () => <div>SubiAI Page</div> }));
vi.mock('../pages/Settings', () => ({ default: () => <div>Settings Page</div> }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

function setState(state: Record<string, unknown>) {
  useAppState.setState({
    token: null, currentUser: null, isAuthenticated: false,
    hasCompletedOnboarding: false, hasCompletedAssessment: false,
    assessmentScore: null, emotionalState: 'Normal', resetEmail: null, resetCode: null,
    ...state,
  } as never);
}

beforeEach(() => setState({}));

describe('App routing', () => {
  it('RT-01: fresh visitor → /onboarding', () => {
    setState({});
    renderApp('/');
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });

  it('RT-02: onboarding done, not authenticated → /login', () => {
    setState({ hasCompletedOnboarding: true });
    renderApp('/');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('RT-03: authenticated, assessment not done → /assessment', () => {
    setState({ hasCompletedOnboarding: true, isAuthenticated: true, token: 'tok' });
    renderApp('/');
    expect(screen.getByText('StressAssessment Page')).toBeInTheDocument();
  });

  it('RT-04: fully onboarded → /dashboard', () => {
    setState({ hasCompletedOnboarding: true, isAuthenticated: true, token: 'tok', hasCompletedAssessment: true });
    renderApp('/');
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('RT-05: direct access to /dashboard when not authenticated → /login', () => {
    setState({});
    renderApp('/dashboard');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('RT-06: direct access to /articles when not authenticated → /login', () => {
    setState({});
    renderApp('/articles');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('RT-07: direct access to /subi-ai when not authenticated → /login', () => {
    setState({});
    renderApp('/subi-ai');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('RT-08: direct access to /settings when not authenticated → /login', () => {
    setState({});
    renderApp('/settings');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
