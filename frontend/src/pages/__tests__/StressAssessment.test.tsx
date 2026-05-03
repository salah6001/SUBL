import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import StressAssessment from '../StressAssessment';
import { useAppState } from '@/hooks/useAppState';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

beforeEach(() => {
  mockNavigate.mockClear();
  mockToast.error.mockClear();
  useAppState.setState({
    token: 'tok', isAuthenticated: true, hasCompletedOnboarding: true,
    hasCompletedAssessment: false, assessmentScore: null, emotionalState: 'Normal',
  } as never);
});

function renderSA() {
  return render(<MemoryRouter><StressAssessment /></MemoryRouter>);
}

function answerAllQuestions() {
  const buttons = screen.getAllByRole('button').filter((b) => ['1','2','3','4','5'].includes(b.textContent ?? ''));
  for (let q = 0; q < 5; q++) {
    fireEvent.click(buttons[q * 5]);
  }
}

describe('StressAssessment', () => {
  it('SA-01: 5 questions × 5 answer buttons = 25 total', () => {
    renderSA();
    const answerBtns = screen.getAllByRole('button').filter((b) => ['1','2','3','4','5'].includes(b.textContent ?? ''));
    expect(answerBtns).toHaveLength(25);
  });

  it('SA-02: Next disabled until all questions answered', () => {
    renderSA();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });

  it('SA-03: answering all questions enables Next', () => {
    renderSA();
    answerAllQuestions();
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled();
  });

  it('SA-04: progress bar is 50% on step 1', () => {
    const { container } = renderSA();
    const bar = container.querySelector('.bg-subl-blue-500.rounded-full') as HTMLElement;
    expect(bar?.style.width).toBe('50%');
  });

  it('SA-05: clicking Next shows step 2 (textarea)', () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('SA-06: progress bar is 100% on step 2', () => {
    const { container } = renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    const bar = container.querySelector('.bg-subl-blue-500.rounded-full') as HTMLElement;
    expect(bar?.style.width).toBe('100%');
  });

  it('SA-07: Previous on step 2 returns to step 1', () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getAllByRole('button').filter((b) => ['1','2','3','4','5'].includes(b.textContent ?? ''))).toHaveLength(25);
  });

  it('SA-08: submit on step 2 calls assessmentApi.submit', async () => {
    let called = false;
    server.use(
      http.post('http://localhost/assessment/submit', () => {
        called = true;
        return HttpResponse.json({ score: 45, label: 'Normal', emotional_state: 'Calm', response_time: 'Normal', typing_pattern: 'Consistent', break_frequency: 'Adequate', recommendations: [] });
      })
    );
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(called).toBe(true));
  });

  it('SA-09: successful submit shows step 3 with score', async () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(screen.getByText(/stress score/i)).toBeInTheDocument());
  });

  it('SA-10: completeAssessment store action called on success', async () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(useAppState.getState().hasCompletedAssessment).toBe(true));
  });

  it('SA-11: failed submit shows error toast', async () => {
    server.use(
      http.post('http://localhost/assessment/submit', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      )
    );
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Server error'));
  });

  it('SA-12: Retake Assessment resets to step 1 with cleared answers', async () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => screen.getByText(/stress score/i));
    fireEvent.click(screen.getByRole('button', { name: /retake/i }));
    expect(screen.getAllByRole('button').filter((b) => ['1','2','3','4','5'].includes(b.textContent ?? ''))).toHaveLength(25);
  });

  it('SA-13: Go to Dashboard navigates to /dashboard', async () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => screen.getByText(/stress score/i));
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('SA-14: recommendations hidden when empty', async () => {
    server.use(
      http.post('http://localhost/assessment/submit', () =>
        HttpResponse.json({ score: 45, label: 'Normal', emotional_state: 'Calm', response_time: 'Normal', typing_pattern: 'Consistent', break_frequency: 'Adequate', recommendations: [] })
      )
    );
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => screen.getByText(/stress score/i));
    expect(screen.queryByText(/personalized recommendations/i)).not.toBeInTheDocument();
  });

  it('SA-15: recommendations shown when API returns them', async () => {
    renderSA();
    answerAllQuestions();
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(screen.getByText('Take breaks')).toBeInTheDocument());
  });
});
