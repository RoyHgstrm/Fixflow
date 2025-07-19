import { createServerSupabaseClient } from '@/lib/supabase/server';
import { type UserRole, USER_ROLES } from '@/lib/types';
import { Session } from '@supabase/supabase-js';
import { z } from 'zod';

// Zod schema for user validation
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  companyId: z.string().optional().nullable(),
});

// This config is primarily for NextAuth.js if you were to use it. 
// With a custom Supabase session, this might be simplified or removed.
export async function validateUserSession(
  session: Session | null, 
  getCookies?: () => any
) {
  // For Supabase, session validation is often handled by Supabase client itself.
  // This function might be adapted to fetch fresh user data or check specific permissions.
  if (!session) {
    return { isValid: false, user: null, role: null, companyId: null };
  }

  // In a real application, you might verify the session token with Supabase
  // or fetch the user's latest profile from your database.

  const userRole = session.user.user_metadata?.role as UserRole ?? null;
  const companyId = session.user.user_metadata?.company_id as string ?? null;

  return {
    isValid: true,
    user: session.user,
    role: userRole,
    companyId: companyId,
  };
}

export async function getUserRoleFromDatabase(
  userId: string, 
  getCookies?: () => any
): Promise<UserRole | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();

    if (error) {
      console.error('Error fetching user role from DB:', error);
      return null;
    }

    return data.role as UserRole;
  } catch (error) {
    console.error('Unexpected error fetching user role from DB:', error);
    return null;
  }
}

export function isAuthorized(
  session: Session | null, 
  requiredRoles: UserRole[] = []
): boolean {
  if (!session?.user?.role) {
    return false; // No role, not authorized
  }

  const userRole: UserRole = session.user.role as UserRole;

  // If no specific roles are required, any authenticated user is authorized
  if (requiredRoles.length === 0) {
    return true;
  }

  // Check if the user's role is included in the required roles
  if (requiredRoles.includes(userRole)) {
    return true;
  }

  // Handle hierarchical roles. For example, an OWNER can do anything a MANAGER can.
  // This logic depends on your specific role hierarchy.
  if (userRole === USER_ROLES.OWNER) {
    return true; // Owner can do everything
  }

  if (userRole === USER_ROLES.ADMIN) {
    // Admins might have full access or specific elevated privileges.
    // For now, let's assume they have broad access similar to OWNER for simplicity in this check.
    return true;
  }

  // Example of specific role-based access:
  if (userRole === USER_ROLES.MANAGER && (
    requiredRoles.includes(USER_ROLES.EMPLOYEE) || 
    requiredRoles.includes(USER_ROLES.TECHNICIAN)
  )) {
    return true; // Manager can act as Employee/Technician if needed
  }

  return false;
}
