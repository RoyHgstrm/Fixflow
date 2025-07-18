import { useSession } from '@/lib/providers/session-provider';
import { getTrialDaysRemaining, SubscriptionStatus } from '@/lib/types';

export function useTrialStatus() {
  const { session } = useSession();
  const company = session?.user?.company;

  if (!company || !company.subscription) {
    return {
      company: null,
      status: SubscriptionStatus.INACTIVE,
      daysRemaining: null,
      trialEndDate: null,
    };
  }

  const { subscription } = company;
  const status = subscription.status;
  const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end) : null;

  const daysRemaining = getTrialDaysRemaining(trialEndDate);

  return {
    company,
    status,
    daysRemaining,
    trialEndDate,
  };
}