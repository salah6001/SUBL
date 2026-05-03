import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import NewPassword from '../NewPassword';
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
  useAppState.setState({ resetEmail: 'test@test.com', resetCode: '123456' } as never);
});

function renderNP() {
  return render(<MemoryRouter><NewPassword /></MemoryRouter>);
}

describe('NewPassword', () => {
  it('NP-01: two password inputs render', () => {
    renderNP();
    expect(screen.getByPlaceholderText('Write your new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your confirmed new password')).toBeInTheDocument();
  });

  it('NP-02: submit disabled when password empty', () => {
    renderNP();
    expect(screen.getByRole('button', { name: /create password/i })).toBeDisabled();
  });

  it('NP-03: submit disabled when passwords don\'t match', async () => {
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'pass1234');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'pass5678');
    expect(screen.getByRole('button', { name: /create password/i })).toBeDisabled();
  });

  it('NP-04: submit enabled when passwords match', async () => {
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'pass1234');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'pass1234');
    expect(screen.getByRole('button', { name: /create password/i })).not.toBeDisabled();
  });

  it('NP-05: error toast when resetEmail is null', async () => {
    useAppState.setState({ resetEmail: null } as never);
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'pass1234');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'pass1234');
    fireEvent.click(screen.getByRole('button', { name: /create password/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  });

  it('NP-06: calls authApi.resetPassword with correct payload', async () => {
    let payload: unknown;
    server.use(
      http.post('http://localhost/auth/reset-password', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: 'Password reset' });
      })
    );
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'newpass1');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'newpass1');
    fireEvent.click(screen.getByRole('button', { name: /create password/i }));
    await waitFor(() => expect(payload).toMatchObject({ email: 'test@test.com', code: '123456', password: 'newpass1' }));
  });

  it('NP-07: navigates to /password-success on success', async () => {
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'newpass1');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'newpass1');
    fireEvent.click(screen.getByRole('button', { name: /create password/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/password-success'));
  });

  it('NP-08: failed reset shows error toast', async () => {
    server.use(
      http.post('http://localhost/auth/reset-password', () =>
        HttpResponse.json({ message: 'Invalid code' }, { status: 400 })
      )
    );
    renderNP();
    await userEvent.type(screen.getByPlaceholderText('Write your new password'), 'newpass1');
    await userEvent.type(screen.getByPlaceholderText('Write your confirmed new password'), 'newpass1');
    fireEvent.click(screen.getByRole('button', { name: /create password/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Invalid code'));
  });
});
