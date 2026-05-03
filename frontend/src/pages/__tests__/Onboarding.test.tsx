import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Onboarding from '../Onboarding';
import { useAppState } from '@/hooks/useAppState';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockClear();
  useAppState.setState({ hasCompletedOnboarding: false } as never);
});

function renderOnboarding() {
  return render(<MemoryRouter><Onboarding /></MemoryRouter>);
}

describe('Onboarding', () => {
  it('ON-01: first slide content renders on mount', () => {
    renderOnboarding();
    expect(screen.getByText('Understand Your Work Stress')).toBeInTheDocument();
  });

  it('ON-02: "Next" label on slide 1 (not "Get Started")', () => {
    renderOnboarding();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument();
  });

  it('ON-03: clicking Next advances to slide 2', () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByText('Your Data Stays Private')).toBeInTheDocument();
  });

  it('ON-04: on last slide, button shows "Get Started"', () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('ON-05: Get Started calls completeOnboarding and navigates to /signup', () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(useAppState.getState().hasCompletedOnboarding).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('ON-06: Skip calls completeOnboarding and navigates to /signup', () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(useAppState.getState().hasCompletedOnboarding).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('ON-07: progress dots reflect current slide index', () => {
    const { container } = renderOnboarding();
    // First dot should be wide (active), others narrow
    const dots = container.querySelectorAll('.flex.gap-2 span');
    expect(dots[0].className).toContain('w-6');
    expect(dots[1].className).toContain('w-2');
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    const dotsAfter = container.querySelectorAll('.flex.gap-2 span');
    expect(dotsAfter[1].className).toContain('w-6');
  });
});
