"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  type CustomSession, 
  type UserRole, 
  USER_ROLES, 
  SubscriptionStatus 
} from '@/lib/types';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { getTrialDaysRemaining, isTrialEndingSoon } from '@/lib/utils';

type SessionContextType = {
  session: CustomSession | null;
  setSession: (session: CustomSession | null) => void;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  isTrial: boolean;
  trialDaysRemaining: number;
  isTrialEndingSoon: boolean;
  companyId: string | null;
  companyName: string | null;
  companyPlanType: string | null;
  companySubscriptionStatus: SubscriptionStatus | null;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  setSession: () => {},
  signOut: async () => {},
  isLoading: true,
  isAuthenticated: false,
  userRole: null,
  isTrial: false,
  trialDaysRemaining: 0,
  isTrialEndingSoon: false,
  companyId: null,
  companyName: null,
  companyPlanType: null,
  companySubscriptionStatus: null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CustomSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login');
  };

  useEffect(() => {
    const supabase = createClientSupabaseClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setSession(session as CustomSession);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const companySubscriptionStatus = session?.user?.company?.subscription?.status;
  const trialEndDate = session?.user?.company?.subscription?.trial_end;

  const isTrial = companySubscriptionStatus === SubscriptionStatus.TRIAL;
  const trialDaysRemaining = trialEndDate ? getTrialDaysRemaining(new Date(trialEndDate)) : 0;
  const isTrialEndingSoonFlag = trialEndDate ? isTrialEndingSoon(new Date(trialEndDate)) : false;

  const contextValue: SessionContextType = {
    session,
    setSession,
    signOut,
    isLoading,
    isAuthenticated: !!session,
    userRole: session?.user?.role ?? null,
    isTrial,
    trialDaysRemaining,
    isTrialEndingSoon: isTrialEndingSoonFlag,
    companyId: session?.user?.companyId ?? null,
    companyName: session?.user?.company?.name ?? null,
    companyPlanType: session?.user?.company?.planType ?? null,
    companySubscriptionStatus: companySubscriptionStatus ?? null,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export function getRoleLabel(role?: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    [USER_ROLES.SOLO]: 'Solo Operator',
    [USER_ROLES.TEAM]: 'Team Member',
    [USER_ROLES.BUSINESS]: 'Business User',
    [USER_ROLES.ENTERPRISE]: 'Enterprise User',
    [USER_ROLES.FIELD_WORKER]: 'Field Worker',
    [USER_ROLES.CLIENT]: 'Client',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.OWNER]: 'Company Owner',
    [USER_ROLES.MANAGER]: 'Manager',
    [USER_ROLES.EMPLOYEE]: 'Employee',
    [USER_ROLES.TECHNICIAN]: 'Technician',
  };

  return role ? roleLabels[role] : 'Unknown Role';
}

export function getSessionRoleLabel(role?: UserRole): string {
  return getRoleLabel(role);
} 