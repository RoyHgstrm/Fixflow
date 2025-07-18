import { createServerClient } from '@supabase/ssr';
import { Database } from '../database.types';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
});

export const getServerSession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  return await supabase.auth.getSession();
});

export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  return await supabase.auth.getUser();
}); 