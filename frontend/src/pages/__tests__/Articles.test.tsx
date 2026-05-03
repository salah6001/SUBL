import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import Articles from '../Articles';
import ArticleDetail from '../ArticleDetail';
import { useAppState } from '@/hooks/useAppState';

vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

beforeEach(() => {
  useAppState.setState({
    token: 'tok', isAuthenticated: true, hasCompletedOnboarding: true,
    hasCompletedAssessment: true, currentUser: { id: '1', name: 'John', email: 'j@j.com', phone: '', avatar: '' },
  } as never);
});

function renderArticles() {
  return render(
    <MemoryRouter initialEntries={['/articles']}>
      <Routes>
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Articles', () => {
  it('AR-01: skeleton cards shown while loading', () => {
    server.use(
      http.get('http://localhost/articles', async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json([]);
      })
    );
    const { container } = renderArticles();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('AR-02: article cards rendered after fetch', async () => {
    renderArticles();
    await waitFor(() => expect(screen.getByText('Test Article')).toBeInTheDocument());
  });

  it('AR-03: clicking a card shows article detail', async () => {
    renderArticles();
    await waitFor(() => screen.getByText('Test Article'));
    fireEvent.click(screen.getByText('Test Article'));
    await waitFor(() => expect(screen.getByText('Full content here')).toBeInTheDocument());
  });

  it('AR-04: Back to Articles returns to list view', async () => {
    renderArticles();
    await waitFor(() => screen.getByText('Test Article'));
    fireEvent.click(screen.getByText('Test Article'));
    await waitFor(() => screen.getByText('Back to Articles'));
    fireEvent.click(screen.getByText('Back to Articles'));
    await waitFor(() => expect(screen.getByText('Test Article')).toBeInTheDocument());
  });

  it('AR-05: changing sort dropdown re-fetches', async () => {
    const calls: string[] = [];
    server.use(
      http.get('http://localhost/articles', ({ request }) => {
        calls.push(request.url);
        return HttpResponse.json([]);
      })
    );
    renderArticles();
    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'newest' } });
    await waitFor(() => expect(calls.some((u) => u.includes('sort=newest'))).toBe(true));
  });

  it('AR-06: error message shown when fetch fails', async () => {
    server.use(
      http.get('http://localhost/articles', () => HttpResponse.json({}, { status: 500 }))
    );
    renderArticles();
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });

  it('AR-07: empty state shown when API returns []', async () => {
    server.use(
      http.get('http://localhost/articles', () => HttpResponse.json([]))
    );
    renderArticles();
    await waitFor(() => expect(screen.getByText(/no articles found/i)).toBeInTheDocument());
  });

  it('AR-08: article image has correct alt in detail view', async () => {
    renderArticles();
    await waitFor(() => screen.getByText('Test Article'));
    fireEvent.click(screen.getByText('Test Article'));
    await waitFor(() => expect(screen.getByAltText('Test Article')).toBeInTheDocument());
  });
});
