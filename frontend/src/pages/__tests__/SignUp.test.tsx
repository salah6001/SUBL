import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import SignUp from '../SignUp';
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

function renderSignUp() {
  return render(<MemoryRouter><SignUp /></MemoryRouter>);
}

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const vals = {
    name: 'John Doe',
    phone: '123456',
    email: 'john@test.com',
    password: 'password123',
    confirmPassword: 'password123',
    ...overrides,
  };
  await userEvent.type(screen.getByPlaceholderText('Write your name'), vals.name);
  await userEvent.type(screen.getByPlaceholderText('Write your phone number'), vals.phone);
  await userEvent.type(screen.getByPlaceholderText('Write your email'), vals.email);
  await userEvent.type(screen.getByPlaceholderText('Write your password'), vals.password);
  await userEvent.type(screen.getByPlaceholderText('Write your confirmed password'), vals.confirmPassword);
}

describe('SignUp', () => {
  it('SU-01: all 5 fields render', () => {
    renderSignUp();
    expect(screen.getByPlaceholderText('Write your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your confirmed password')).toBeInTheDocument();
  });

  it('SU-02: submit disabled without privacy checkbox', async () => {
    renderSignUp();
    await fillForm();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });

  it('SU-03: submit disabled when required fields empty', () => {
    renderSignUp();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });

  it('SU-04: mismatched passwords shows toast error', async () => {
    renderSignUp();
    await fillForm({ confirmPassword: 'different' });
    fireEvent.click(screen.getByLabelText(/privacy/i));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Passwords do not match'));
  });

  it('SU-05: valid form calls authApi.signup with correct payload', async () => {
    let payload: unknown;
    server.use(
      http.post('http://localhost/auth/register', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ token: 'tok', user: { id: '1', name: 'John Doe', email: 'john@test.com', phone: '123456', avatar: '' } });
      })
    );
    renderSignUp();
    await fillForm();
    fireEvent.click(screen.getByLabelText(/privacy/i));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(payload).toMatchObject({ name: 'John Doe', email: 'john@test.com', phone: '123456', password: 'password123' }));
  });

  it('SU-06: confirmPassword not sent to API', async () => {
    let payload: Record<string, unknown> = {};
    server.use(
      http.post('http://localhost/auth/register', async ({ request }) => {
        payload = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ token: 'tok', user: { id: '1', name: 'J', email: 'j@j.com', phone: '', avatar: '' } });
      })
    );
    renderSignUp();
    await fillForm();
    fireEvent.click(screen.getByLabelText(/privacy/i));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(payload).not.toHaveProperty('confirmPassword'));
  });

  it('SU-07: successful signup navigates to /assessment', async () => {
    renderSignUp();
    await fillForm();
    fireEvent.click(screen.getByLabelText(/privacy/i));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/assessment'));
  });

  it('SU-08: failed signup shows error toast', async () => {
    server.use(
      http.post('http://localhost/auth/register', () =>
        HttpResponse.json({ message: 'Email already exists' }, { status: 409 })
      )
    );
    renderSignUp();
    await fillForm();
    fireEvent.click(screen.getByLabelText(/privacy/i));
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Email already exists'));
  });

  it('SU-09: eye icon toggles password field visibility', async () => {
    renderSignUp();
    const pwInput = screen.getByPlaceholderText('Write your password');
    expect(pwInput).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Show password'));
    expect(pwInput).toHaveAttribute('type', 'text');
  });

  it('SU-10: eye icon toggles confirm-password field visibility', async () => {
    renderSignUp();
    const confirmInput = screen.getByPlaceholderText('Write your confirmed password');
    expect(confirmInput).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Show confirm password'));
    expect(confirmInput).toHaveAttribute('type', 'text');
  });
});
