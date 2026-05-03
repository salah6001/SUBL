import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import Settings from '../Settings';
import { useAppState } from '@/hooks/useAppState';

vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

const mockUser = { id: '1', name: 'John Doe', email: 'john@test.com', phone: '123456', avatar: '' };

beforeEach(() => {
  mockNavigate.mockClear();
  mockToast.error.mockClear();
  mockToast.success.mockClear();
  useAppState.setState({
    token: 'tok', isAuthenticated: true, hasCompletedOnboarding: true,
    hasCompletedAssessment: true, currentUser: mockUser,
  } as never);
});

function renderSettings() {
  return render(<MemoryRouter><Settings /></MemoryRouter>);
}

describe('Settings', () => {
  it('ST-01: current user name and email displayed', () => {
    renderSettings();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('ST-02: fields read-only by default', () => {
    renderSettings();
    const emailInput = screen.getByDisplayValue('john@test.com');
    expect(emailInput).toHaveAttribute('readonly');
  });

  it('ST-03: Edit makes fields editable', () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    const emailInput = screen.getByDisplayValue('john@test.com');
    expect(emailInput).not.toHaveAttribute('readonly');
  });

  it('ST-04: Save calls userApi.updateProfile with form values', async () => {
    let payload: unknown;
    server.use(
      http.put('http://localhost/user/profile', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json(mockUser);
      })
    );
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(payload).toMatchObject({ name: 'John Doe', email: 'john@test.com' }));
  });

  it('ST-05: successful save shows success toast', async () => {
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Profile updated'));
  });

  it('ST-06: failed save shows error toast', async () => {
    server.use(
      http.put('http://localhost/user/profile', () =>
        HttpResponse.json({ message: 'Update failed' }, { status: 500 })
      )
    );
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Update failed'));
  });

  it('ST-07: notifications toggle starts as true (on-state)', () => {
    renderSettings();
    const toggle = screen.getByLabelText(/disable notifications/i);
    expect(toggle.className).toContain('bg-subl-blue-500');
  });

  it('ST-08: clicking toggle calls userApi.updateNotifications with new value', async () => {
    let payload: unknown;
    server.use(
      http.patch('http://localhost/user/notifications', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: 'Updated' });
      })
    );
    renderSettings();
    fireEvent.click(screen.getByLabelText(/disable notifications/i));
    await waitFor(() => expect(payload).toEqual({ notifications: false }));
  });

  it('ST-09: notifications API failure reverts toggle', async () => {
    server.use(
      http.patch('http://localhost/user/notifications', () =>
        HttpResponse.json({ message: 'Error' }, { status: 500 })
      )
    );
    renderSettings();
    fireEvent.click(screen.getByLabelText(/disable notifications/i));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
    // Toggle should revert back to enabled
    expect(screen.getByLabelText(/disable notifications/i)).toBeInTheDocument();
  });
});
