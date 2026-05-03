import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from '../Sidebar';
import { useAppState } from '@/hooks/useAppState';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  mockNavigate.mockClear();
  useAppState.setState({
    token: null, currentUser: null, isAuthenticated: false,
    hasCompletedOnboarding: false, hasCompletedAssessment: false,
    assessmentScore: null, emotionalState: 'Normal', resetEmail: null, resetCode: null,
  } as never);
});

function renderSidebar(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  it('SB-01: all 4 nav items render', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Subl AI')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('SB-02: active item has bg-subl-blue-50 at /dashboard', () => {
    renderSidebar('/dashboard');
    const dashBtn = screen.getByText('Dashboard').closest('button')!;
    expect(dashBtn.className).toContain('bg-subl-blue-50');
  });

  it('SB-03: inactive items do not have bg-subl-blue-50', () => {
    renderSidebar('/dashboard');
    const articlesBtn = screen.getByText('Articles').closest('button')!;
    expect(articlesBtn.className).not.toContain('bg-subl-blue-50');
  });

  it('SB-04: clicking Articles navigates to /articles', () => {
    renderSidebar('/dashboard');
    fireEvent.click(screen.getByText('Articles'));
    expect(mockNavigate).toHaveBeenCalledWith('/articles');
  });

  it('SB-05: logout calls logout() from store', () => {
    const logoutSpy = vi.fn();
    useAppState.setState({ logout: logoutSpy } as never);
    renderSidebar();
    fireEvent.click(screen.getByText('Log out'));
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('SB-06: logout navigates to /login', () => {
    renderSidebar();
    fireEvent.click(screen.getByText('Log out'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
