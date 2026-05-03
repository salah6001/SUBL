import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthLayout } from '../AuthLayout';

describe('AuthLayout', () => {
  it('AL-01: renders children', () => {
    render(<AuthLayout><div>Child content</div></AuthLayout>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('AL-02: back button absent when showBack not set', () => {
    render(<AuthLayout><div>x</div></AuthLayout>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('AL-03: back button present when showBack={true}', () => {
    render(<AuthLayout showBack onBack={vi.fn()}><div>x</div></AuthLayout>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('AL-04: onBack called when back button clicked', () => {
    const onBack = vi.fn();
    render(<AuthLayout showBack onBack={onBack}><div>x</div></AuthLayout>);
    fireEvent.click(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('AL-05: brand name "Subl" visible', () => {
    render(<AuthLayout><div>x</div></AuthLayout>);
    expect(screen.getByText('Subl')).toBeInTheDocument();
  });

  it('AL-06: right illustration panel has hidden lg:flex classes', () => {
    const { container } = render(<AuthLayout><div>x</div></AuthLayout>);
    const panel = container.querySelector('.hidden.lg\\:flex');
    expect(panel).toBeInTheDocument();
  });
});
