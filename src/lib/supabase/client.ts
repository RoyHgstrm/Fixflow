import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../database.types';
import { UserRole } from '../types';

export const createClientSupabaseClient = () => 
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const useAuthStateListener = (
  onAuthStateChange: (session: { user: any; role?: UserRole } | null) => void
) => {
  const supabase = createClientSupabaseClient();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      let userRole: UserRole | undefined = undefined;

      if (session?.user?.id) {
        // Fetch user role from your database if needed, or from session metadata
        userRole = session.user.user_metadata?.role as UserRole;
      }
      onAuthStateChange(session ? { user: session.user, role: userRole } : null);
    }
  );

  return () => subscription.unsubscribe();
};

export const signOut = async () => {
  const supabase = createClientSupabaseClient();
  await supabase.auth.signOut();
}; 