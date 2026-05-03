import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import ForgotPassword from '../ForgotPassword';
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
  mockToast.success.mockClear();
  useAppState.setState({ resetEmail: null } as never);
});

function renderFP() {
  return render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
}

describe('ForgotPassword', () => {
  it('FP-01: email input renders', () => {
    renderFP();
    expect(screen.getByPlaceholderText('Write your email')).toBeInTheDocument();
  });

  it('FP-02: submit disabled when email empty', () => {
    renderFP();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });

  it('FP-03: submit calls authApi.forgotPassword with email', async () => {
    let payload: unknown;
    server.use(
      http.post('http://localhost/auth/forgot-password', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: 'Code sent' });
      })
    );
    renderFP();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'test@test.com');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(payload).toEqual({ email: 'test@test.com' }));
  });

  it('FP-04: setResetEmail called with entered email', async () => {
    renderFP();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'test@test.com');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(useAppState.getState().resetEmail).toBe('test@test.com'));
  });

  it('FP-05: successful submit navigates to /verify-code', async () => {
    renderFP();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'test@test.com');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/verify-code'));
  });

  it('FP-06: failed submit shows error toast', async () => {
    server.use(
      http.post('http://localhost/auth/forgot-password', () =>
        HttpResponse.json({ message: 'Email not found' }, { status: 404 })
      )
    );
    renderFP();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'bad@test.com');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Email not found'));
  });
});
