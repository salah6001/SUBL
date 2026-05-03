import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import Login from '../Login';
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
    token: null, currentUser: null, isAuthenticated: false,
    hasCompletedOnboarding: false, hasCompletedAssessment: false,
    assessmentScore: null, emotionalState: 'Normal', resetEmail: null, resetCode: null,
  } as never);
});

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login', () => {
  it('LG-01: email and password inputs render', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Write your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your password')).toBeInTheDocument();
  });

  it('LG-02: submit disabled when fields empty', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });

  it('LG-03: submit enabled when both fields filled', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('Write your password'), 'pass');
    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
  });

  it('LG-04: eye icon toggles password type', async () => {
    renderLogin();
    const input = screen.getByPlaceholderText('Write your password');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Show password'));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('LG-05: successful login calls authApi.login', async () => {
    let called = false;
    server.use(
      http.post('http://localhost/auth/login', () => {
        called = true;
        return HttpResponse.json({ token: 'tok', user: { id: '1', name: 'John', email: 'j@j.com', phone: '', avatar: '' } });
      })
    );
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'j@j.com');
    await userEvent.type(screen.getByPlaceholderText('Write your password'), 'pass');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(called).toBe(true));
  });

  it('LG-06: successful login calls setAuth and navigates to /dashboard', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'j@j.com');
    await userEvent.type(screen.getByPlaceholderText('Write your password'), 'pass');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
    expect(useAppState.getState().isAuthenticated).toBe(true);
  });

  it('LG-07: failed login shows error toast', async () => {
    server.use(
      http.post('http://localhost/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      )
    );
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'j@j.com');
    await userEvent.type(screen.getByPlaceholderText('Write your password'), 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials'));
  });

  it('LG-08: Forgot password? navigates to /forgot-password', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('LG-09: Create your account navigates to /signup', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Create your account'));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('LG-10: loading state shows Logging in…', async () => {
    server.use(
      http.post('http://localhost/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ token: 'tok', user: { id: '1', name: 'J', email: 'j@j.com', phone: '', avatar: '' } });
      })
    );
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Write your email'), 'j@j.com');
    await userEvent.type(screen.getByPlaceholderText('Write your password'), 'pass');
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Logging in…')).toBeInTheDocument();
  });
});
