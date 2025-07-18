"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { UserRole, PlanType } from '../types';
import { useAuthStateListener, signOut as supabaseSignOutClient } from '../supabase/client';

// Extended user type to include additional properties
export type ExtendedUser = User & {
  role?: UserRole;
  company?: { 
    name: string; 
    id?: string; 
    planType?: PlanType; 
  };
  name?: string;
  image?: string;
};

// Custom session type to include role and optional extends
export type CustomSession = {
  user: ExtendedUser;
  role?: UserRole;
  expires?: string; // Make expires optional here
  // These properties are part of Supabase's Session but are optional in CustomSession
  // as they may not be available when deriving from a User object.
  access_token?: string; 
  refresh_token?: string; 
  expires_in?: number; 
  token_type?: string; 
};

// Context type definition
type SessionContextType = {
  session: CustomSession | null;
  setSession: (session: CustomSession | null) => void;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const SessionContext = createContext<SessionContextType>({
  session: null,
  setSession: () => { },
  signOut: async () => { }
});

// Helper function to get role label
const getRoleLabel = (role: UserRole) => {
  switch (role.toUpperCase()) {
    case UserRole.OWNER: return 'Owner';
    case UserRole.MANAGER: return 'Manager';
    case UserRole.EMPLOYEE: return 'Employee';
    case UserRole.ADMIN: return 'Administrator';
    case UserRole.TECHNICIAN: return 'Technician';
    case UserRole.CLIENT: return 'Client';
    default: return 'User';
  }
};

// Session Provider Component
export function SessionProvider({
  children,
  initialSession
}: {
  children: ReactNode;
  initialSession?: CustomSession | null
}) {
  const [session, setSession] = useState<CustomSession | null>(
    initialSession ? {
      user: {
        ...initialSession.user,
        role: initialSession.user.user_metadata?.role as UserRole,
        company: initialSession.user.user_metadata?.company_name ? { 
          name: initialSession.user.user_metadata.company_name,
          id: initialSession.user.user_metadata.company_id,
          planType: initialSession.user.user_metadata.plan_type as PlanType
        } : undefined,
      },
      role: initialSession.user.user_metadata?.role as UserRole,
      expires: initialSession.expires
        ? initialSession.expires // expires is already an ISO string
        : new Date(Date.now() + 60 * 60 * 1000).toISOString(), 
      // Explicitly add session properties here if initialSession is a full Session object
      access_token: initialSession.access_token,
      refresh_token: initialSession.refresh_token,
      expires_in: initialSession.expires_in,
      token_type: initialSession.token_type,
    } : null
  );

  // Authentication state management
  useEffect(() => {
    const unsubscribe = useAuthStateListener((newSession) => {
      if (newSession !== null) {
        setSession({
          user: {
            ...newSession.user,
            role: newSession.role,
            company: newSession.user.user_metadata?.company_name ? { 
              name: newSession.user.user_metadata.company_name,
              id: newSession.user.user_metadata.company_id,
              planType: newSession.user.user_metadata.plan_type as PlanType
            } : undefined
          },
          role: newSession.role,
          expires: newSession.user.aud ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined, // Provide a default or adjust based on your logic
        });
      } else {
        setSession(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign out function
  const signOut = async () => {
    await supabaseSignOutClient();
    setSession(null);
    window.location.href = '/login';
  };

  return (
    <SessionContext.Provider value={{ session, setSession, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session context
export function useSession() {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

// Utility function to get role label (can be used outside of React components)
export function getSessionRoleLabel(role?: UserRole): string {
  return role ? getRoleLabel(role) : 'User';
} 