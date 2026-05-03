import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn()', () => {
  it('U-01: single class', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('U-02: multiple classes joined', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('U-03: falsy values omitted', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('U-04: conflicting Tailwind classes — last wins', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('U-05: object and array syntax', () => {
    expect(cn({ foo: true, bar: false }, ['baz'])).toBe('foo baz');
  });
});
