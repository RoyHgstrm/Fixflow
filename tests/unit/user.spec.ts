
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../../src/lib/supabase';
import { createUser } from '../../src/server/api/routers/user';

describe('User Service', () => {
  it('should create a user', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null });

    const user = await createUser({ email, password });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email, password });
    expect(user).toEqual({ id: '123' });
  });
});
