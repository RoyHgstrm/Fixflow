import { createBrowserClient } from '@supabase/ssr';
import { type UserRole } from '@/lib/types';

export const createClientSupabaseClient = () => 
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export const useAuthStateListener = (
  onAuthStateChange: (session: { user: any; role?: UserRole } | null) => void
) => {
  const supabase = createClientSupabaseClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_OUT') {
        onAuthStateChange(null);
      } else if (session?.user) {
        onAuthStateChange({ 
          user: session.user, 
          role: session.user.user_metadata?.role 
        });
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
};

export const signOut = async () => {
  const supabase = createClientSupabaseClient();

  try {
    // Revoke all refresh tokens for the user
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError || !user) {
      console.error('Failed to get current user:', getUserError);
      throw getUserError;
    }

    // Call a custom Postgres function to delete all user sessions
    const { error: rpcError } = await supabase.rpc('delete_user_sessions', { 
      user_id: user.id 
    });

    if (rpcError) {
      console.error('Failed to delete user sessions:', rpcError);
    }

    // Sign out from Supabase
    const { error: signOutError } = await supabase.auth.signOut({
      scope: 'global' // Sign out from all devices
    });

    if (signOutError) {
      console.error('Supabase sign out error:', signOutError);
      throw signOutError;
    }

    // Clear local storage and cookies
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Logout failed' 
    };
  }
}; 