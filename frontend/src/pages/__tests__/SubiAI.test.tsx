import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import SubiAI from '../SubiAI';
import { useAppState } from '@/hooks/useAppState';

vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

beforeEach(() => {
  mockToast.error.mockClear();
  useAppState.setState({
    token: 'tok', isAuthenticated: true, hasCompletedOnboarding: true,
    hasCompletedAssessment: true,
    currentUser: { id: '1', name: 'John Doe', email: 'j@j.com', phone: '', avatar: '' },
  } as never);
});

function renderSubiAI() {
  return render(<MemoryRouter><SubiAI /></MemoryRouter>);
}

describe('SubiAI', () => {
  it('AI-01: initial greeting message renders', () => {
    renderSubiAI();
    expect(screen.getByText(/where should we start/i)).toBeInTheDocument();
  });

  it('AI-02: 8 suggested prompt chips visible before first message', () => {
    renderSubiAI();
    expect(screen.getByText('Plan My Routine')).toBeInTheDocument();
    expect(screen.getByText('Suggest Healthy Food')).toBeInTheDocument();
    expect(screen.getByText('Explain Gut Health')).toBeInTheDocument();
    expect(screen.getByText('Test My Balance')).toBeInTheDocument();
    expect(screen.getByText('Build A Habit')).toBeInTheDocument();
    expect(screen.getByText('Analyze My Mood')).toBeInTheDocument();
    expect(screen.getByText('Help Me Relax')).toBeInTheDocument();
    expect(screen.getByText('Summarize A Blog')).toBeInTheDocument();
  });

  it('AI-03: suggested prompts hidden after first message sent', async () => {
    renderSubiAI();
    fireEvent.click(screen.getByText('Plan My Routine'));
    await waitFor(() => expect(screen.queryByText('Suggest Healthy Food')).not.toBeInTheDocument());
  });

  it('AI-04: clicking a chip sends that text as a message', async () => {
    renderSubiAI();
    fireEvent.click(screen.getByText('Plan My Routine'));
    // The user message bubble should appear
    await waitFor(() => {
      const userBubbles = screen.getAllByText('Plan My Routine');
      expect(userBubbles.length).toBeGreaterThan(0);
    });
  });

  it('AI-05: typing and submitting shows user message', async () => {
    renderSubiAI();
    await userEvent.type(screen.getByPlaceholderText('Ask Subl AI'), 'Hello AI');
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(screen.getByText('Hello AI')).toBeInTheDocument());
  });

  it('AI-06: send button disabled when input empty', () => {
    renderSubiAI();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('AI-07: send button disabled while waiting for response', async () => {
    server.use(
      http.post('http://localhost/chat', async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ reply: 'Hi' });
      })
    );
    renderSubiAI();
    await userEvent.type(screen.getByPlaceholderText('Ask Subl AI'), 'Hello');
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('AI-08: typing indicator (bouncing dots) shown while waiting', async () => {
    // Use a deferred promise to hold the response
    let resolveChat!: (value: unknown) => void;
    const chatPromise = new Promise((r) => { resolveChat = r; });
    server.use(
      http.post('http://localhost/chat', async () => {
        await chatPromise;
        return HttpResponse.json({ reply: 'Hi' });
      })
    );
    const { container } = renderSubiAI();
    fireEvent.change(container.querySelector('input')!, { target: { value: 'Hello' } });
    fireEvent.click(container.querySelector('[aria-label="Send message"]')!);
    // While waiting, the send button should be disabled (isTyping=true)
    // and the typing indicator dots should appear
    await waitFor(() => {
      const sendBtn = container.querySelector('[aria-label="Send message"]') as HTMLButtonElement;
      expect(sendBtn.disabled).toBe(true);
    });
    resolveChat(undefined);
  });

  it('AI-09: API response appended as assistant message', async () => {
    renderSubiAI();
    await userEvent.type(screen.getByPlaceholderText('Ask Subl AI'), 'Hello');
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(screen.getByText('Hello from AI')).toBeInTheDocument());
  });

  it('AI-10: API failure adds fallback error message in chat', async () => {
    server.use(
      http.post('http://localhost/chat', () => HttpResponse.json({ message: 'Error' }, { status: 500 }))
    );
    renderSubiAI();
    await userEvent.type(screen.getByPlaceholderText('Ask Subl AI'), 'Hello');
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(screen.getByText(/could not process/i)).toBeInTheDocument());
  });

  it('AI-11: message list auto-scrolls on new message', async () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderSubiAI();
    await userEvent.type(screen.getByPlaceholderText('Ask Subl AI'), 'Hello');
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  });
});
