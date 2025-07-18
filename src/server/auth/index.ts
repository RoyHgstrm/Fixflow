import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';
import { cookies } from 'next/headers';
import { CustomSession, ExtendedUser } from '@/lib/providers/session-provider';

export async function getCurrentUser(): Promise<User | null> {
  console.log('Auth Log: getCurrentUser called');
  try {
    const supabase = await createServerSupabaseClient();
    console.log('Auth Log: getCurrentUser - Supabase client created');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth Log: getCurrentUser - Error fetching user:', error);
      return null;
    }
    console.log('Auth Log: getCurrentUser - User fetched:', user ? user.id : 'No user');
    return user;
  } catch (error) {
    console.error('Auth Log: Error fetching current user (catch block):', error);
    return null;
  }
}

export async function auth(): Promise<CustomSession | null> {
  console.log('Auth Log: auth function called');
  try {
    const supabase = await createServerSupabaseClient();
    console.log('Auth Log: auth - Supabase client created');

    const { data: { user }, error } = await supabase.auth.getUser(); // Changed from getSession() to getUser()
    if (error) {
      console.error('Auth Log: auth - Error fetching user:', error);
      return null;
    }
    console.log('Auth Log: auth - User fetched:', user ? 'Exists' : 'Does not exist');

    if (!user) {
      console.log('Auth Log: auth - No user found, returning null.');
      return null;
    }

    // Construct a compatible session object
    const customSession: CustomSession = {
      user: {
        ...user,
        role: user.user_metadata?.role as UserRole,
        company: user.user_metadata?.company_name ? { name: user.user_metadata.company_name } : undefined,
      } as ExtendedUser,
      role: user.user_metadata?.role as UserRole,
      // Expires is not directly available from getUser(), so we might need to adjust this.
      // For now, setting a default or leaving it undefined if not critical.
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Example: 1 hour from now
      access_token: undefined, // Set to undefined as not available from getUser()
      refresh_token: undefined, // Set to undefined as not available from getUser()
      expires_in: undefined, // Set to undefined as not available from getUser()
      token_type: undefined, // Set to undefined as not available from getUser()
    };
    console.log('Auth Log: auth - Constructed custom session for user:', customSession.user.id, 'Role:', customSession.user.role);
    return customSession;
  } catch (error) {
    console.error('Auth Log: Error fetching session (catch block):', error);
    return null;
  }
}

export async function signOut() {
  console.log('Auth Log: signOut called');
  try {
    const supabase = await createServerSupabaseClient();
    console.log('Auth Log: signOut - Supabase client created');
    await supabase.auth.signOut();
    console.log('Auth Log: signOut - User signed out successfully');
  } catch (error) {
    console.error('Auth Log: Error signing out (catch block):', error);
  }
}

export async function checkUserRole(requiredRole: UserRole): Promise<boolean> {
  console.log(`Auth Log: checkUserRole called for required role: ${requiredRole}`);
  try {
    const session = await auth();
    console.log('Auth Log: checkUserRole - Session obtained:', session ? 'Exists' : 'Does not exist');
    const hasRole = session?.user?.role === requiredRole;
    console.log(`Auth Log: checkUserRole - User has required role (${requiredRole}): ${hasRole}`);
    return hasRole;
  } catch (error) {
    console.error('Auth Log: Error checking user role (catch block):', error);
    return false;
  }
}

export async function getUserCompany() {
  console.log('Auth Log: getUserCompany called');
  try {
    const user = await getCurrentUser();
    console.log('Auth Log: getUserCompany - User obtained:', user ? user.id : 'No user');
    const companyName = user?.user_metadata?.company_name ?? null;
    console.log('Auth Log: getUserCompany - Company name:', companyName);
    return companyName;
  } catch (error) {
    console.error('Auth Log: Error fetching user company (catch block):', error);
    return null;
  }
}

// Removed authOptions as it is no longer used
