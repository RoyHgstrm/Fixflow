import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Session, User } from '@supabase/supabase-js';
import { type UserRole, USER_ROLES, CustomSession, ExtendedUser } from '@/lib/types';
import { cookies } from 'next/headers';

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

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth Log: auth - Error fetching session:', error);
      return null;
    }
    console.log('Auth Log: auth - Session obtained:', session ? 'Exists' : 'Does not exist');

    if (!session) {
      console.log('Auth Log: auth - No session found, returning null.');
      return null;
    }

    // Check if the user object in session has the required data
    if (!session.user || !session.user.id || !session.user.user_metadata?.role) {
      console.warn('Auth Log: Incomplete user data in session, re-fetching profile.');
      const { data: { user: freshUser }, error: freshUserError } = await supabase.auth.getUser();
      if (freshUserError || !freshUser) {
        console.error('Auth Log: Failed to re-fetch user profile:', freshUserError);
        return null;
      }
      // Update session user with fresh data
      session.user = freshUser;
    }

    // Construct a compatible session object
    const customSession: CustomSession = {
      user: {
        ...session.user,
        role: session.user.user_metadata?.role as UserRole,
        companyId: session.user.user_metadata?.company_id as string | undefined,
        company: session.user.user_metadata?.company_name ? { name: session.user.user_metadata.company_name } : undefined,
      } as ExtendedUser,
      role: session.user.user_metadata?.role as UserRole,
      expires: session.expires_at?.toString() ?? undefined,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type,
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
    const hasRole = (session?.user?.role as UserRole) === requiredRole;
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
