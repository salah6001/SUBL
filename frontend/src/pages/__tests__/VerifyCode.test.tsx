import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import VerifyCode from '../VerifyCode';
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
  useAppState.setState({ resetEmail: 'test@test.com', resetCode: null } as never);
});

function renderVC() {
  return render(<MemoryRouter><VerifyCode /></MemoryRouter>);
}

describe('VerifyCode', () => {
  it('VC-01: renders 6 OTP inputs', () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('VC-02: only digits accepted — letters ignored', async () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('');
  });

  it('VC-03: typing in one box auto-focuses the next', async () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    inputs[0].focus();
    fireEvent.change(inputs[0], { target: { value: '1' } });
    await waitFor(() => expect(document.activeElement).toBe(inputs[1]));
  });

  it('VC-04: Backspace on empty box focuses previous', () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    inputs[1].focus();
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('VC-05: submit disabled when any box empty', () => {
    renderVC();
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });

  it('VC-06: submit enabled when all boxes filled', async () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    for (const input of inputs) {
      fireEvent.change(input, { target: { value: '1' } });
    }
    expect(screen.getByRole('button', { name: /verify/i })).not.toBeDisabled();
  });

  it('VC-07: submit calls authApi.verifyCode with joined code', async () => {
    let payload: unknown;
    server.use(
      http.post('http://localhost/auth/verify-code', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: 'Verified' });
      })
    );
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    ['1','2','3','4','5','6'].forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(payload).toEqual({ email: 'test@test.com', code: '123456' }));
  });

  it('VC-08: error toast when resetEmail is null', async () => {
    useAppState.setState({ resetEmail: null } as never);
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    ['1','2','3','4','5','6'].forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
  });

  it('VC-09: successful verify navigates to /new-password', async () => {
    renderVC();
    const inputs = screen.getAllByRole('textbox');
    ['1','2','3','4','5','6'].forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }));
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/new-password'));
  });

  it('VC-10: Resend calls authApi.forgotPassword again', async () => {
    let called = false;
    server.use(
      http.post('http://localhost/auth/forgot-password', () => {
        called = true;
        return HttpResponse.json({ message: 'Code sent' });
      })
    );
    renderVC();
    fireEvent.click(screen.getByText('Resend'));
    await waitFor(() => expect(called).toBe(true));
  });

  it('VC-11: Resend shows success toast', async () => {
    renderVC();
    fireEvent.click(screen.getByText('Resend'));
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Code resent'));
  });
});
