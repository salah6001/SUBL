import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import Dashboard from '../Dashboard';
import { useAppState } from '@/hooks/useAppState';

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));

vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

beforeEach(() => {
  useAppState.setState({
    token: 'tok', isAuthenticated: true, hasCompletedOnboarding: true,
    hasCompletedAssessment: true, assessmentScore: 60, emotionalState: 'Normal',
    currentUser: { id: '1', name: 'John Doe', email: 'j@j.com', phone: '', avatar: '' },
  } as never);
});

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

describe('Dashboard', () => {
  it('DB-01: greeting shows user first name', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/good morning, john/i)).toBeInTheDocument());
  });

  it('DB-02: fetches stats on mount with default range today', async () => {
    let url = '';
    server.use(
      http.get('http://localhost/dashboard/stats', ({ request }) => {
        url = request.url;
        return HttpResponse.json({ emotional_state: 'Normal', stress_score: 40, stress_label: 'Normal', session_data: [], typing_data: [] });
      })
    );
    renderDashboard();
    await waitFor(() => expect(url).toContain('range=today'));
  });

  it('DB-03: emotional state from API response shown', async () => {
    server.use(
      http.get('http://localhost/dashboard/stats', () =>
        HttpResponse.json({ emotional_state: 'Calm', stress_score: 30, stress_label: 'Normal', session_data: [], typing_data: [] })
      )
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Calm')).toBeInTheDocument());
  });

  it('DB-04: changing time range dropdown re-fetches', async () => {
    const calls: string[] = [];
    server.use(
      http.get('http://localhost/dashboard/stats', ({ request }) => {
        calls.push(new URL(request.url).searchParams.get('range') ?? '');
        return HttpResponse.json({ emotional_state: 'Normal', stress_score: 40, stress_label: 'Normal', session_data: [], typing_data: [] });
      })
    );
    renderDashboard();
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'week' } });
    await waitFor(() => expect(calls).toContain('week'));
  });

  it('DB-05: falls back to assessmentScore when stats unavailable', async () => {
    server.use(
      http.get('http://localhost/dashboard/stats', () => HttpResponse.json({}, { status: 500 }))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('60%')).toBeInTheDocument());
  });

  it('DB-06: falls back to 50 when no score at all', async () => {
    useAppState.setState({ assessmentScore: null } as never);
    server.use(
      http.get('http://localhost/dashboard/stats', () => HttpResponse.json({}, { status: 500 }))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());
  });

  it('DB-07: bar chart container renders', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
  });

  it('DB-08: area chart container renders', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('area-chart')).toBeInTheDocument());
  });
});
