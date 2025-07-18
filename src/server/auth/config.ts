import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UserRole } from '@/lib/types';
import { Session } from '@supabase/supabase-js';
import { z } from 'zod';

// Zod schema for user validation
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  companyId: z.string().optional().nullable(),
});

export async function validateUserSession(
  session: Session | null, 
  getCookies?: () => any
) {
  if (!session?.user?.id) return { isValid: false, userRole: null };

  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, companyId')
      .eq('id', session.user.id)
      .single();

    if (error || !userData) return null;

    return {
      ...session.user,
      role: userData.role as UserRole,
      companyId: userData.companyId,
    };
  } catch (err) {
    console.error('Session validation error:', err);
    return null;
  }
}

export async function getUserRoleFromDatabase(
  userId: string, 
  getCookies?: () => any
): Promise<UserRole | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data.role as UserRole;
  } catch (err) {
    console.error('Role retrieval error:', err);
    return null;
  }
}

export function isAuthorized(
  session: Session | null, 
  requiredRoles: UserRole[] = []
): boolean {
  if (!session) return false;

  const userRole = session.user?.user_metadata?.role as UserRole;
  return requiredRoles.length === 0 || requiredRoles.includes(userRole);
}
