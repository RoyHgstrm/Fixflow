
import { vi } from 'vitest';

vi.mock('./src/lib/supabase.ts', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));
