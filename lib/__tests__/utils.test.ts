
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
});
