import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import PasswordSuccess from '../PasswordSuccess';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => mockNavigate.mockClear());

describe('PasswordSuccess', () => {
  it('PS-01: "Successfully" heading renders', () => {
    render(<MemoryRouter><PasswordSuccess /></MemoryRouter>);
    expect(screen.getByText('Successfully')).toBeInTheDocument();
  });

  it('PS-02: Log In button navigates to /login', () => {
    render(<MemoryRouter><PasswordSuccess /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('PS-03: CheckCircle icon renders', () => {
    const { container } = render(<MemoryRouter><PasswordSuccess /></MemoryRouter>);
    // lucide-react renders SVG elements
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
