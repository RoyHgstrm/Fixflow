'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlanType, 
  SubscriptionStatus, 
  CompanyWithSubscription, 
  PaymentMethod, 
  Invoice 
} from '@/lib/types';
import { PLAN_CONFIGS } from '@/lib/constants';
import { getTrialDaysRemaining, isTrialEndingSoon, formatTrialEndDate } from '@/lib/utils';
import { User, Users, Building2, Crown } from 'lucide-react';

export default function BillingPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Fetch company subscription data
  const { data: companyData, isLoading: companyLoading } = api.company.getSubscription.useQuery();
  
  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = api.billing.getPaymentMethods.useQuery();
  
  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading } = api.billing.getInvoices.useQuery();

  // Loading state
  if (companyLoading || paymentMethodsLoading || invoicesLoading) {
    return <div>Loading billing information...</div>;
  }

  const company = companyData ?? {
    planType: PlanType.SOLO,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    trialStartDate: new Date(),
    trialEndDate: new Date(),
    isActive: true,
  };

  const currentPlan = PLAN_CONFIGS[company.planType];
  const daysRemaining = getTrialDaysRemaining(company.trialEndDate);
  const isOnTrial = company.subscriptionStatus === SubscriptionStatus.TRIAL;
  const trialEndingSoon = isTrialEndingSoon(company.trialEndDate);

  const handleUpgradePlan = async (planType: PlanType) => {
    setSelectedPlan(planType);
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    setIsUpgrading(true);
    
    try {
      // Upgrade plan
      await api.billing.upgradePlan.mutate({ planType: selectedPlan! });
      
      setShowPaymentForm(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getPlanIcon = (planType: PlanType) => {
    switch (planType) {
    case PlanType.SOLO:
      return User;
    case PlanType.TEAM:
      return Users;
    case PlanType.BUSINESS:
      return Building2;
    case PlanType.ENTERPRISE:
      return Crown;
    default:
      return User;
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p>Current Plan: {currentPlan.name}</p>
            {isOnTrial && (
              <p>Trial Days Remaining: {daysRemaining}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods?.length ? (
            paymentMethods.map((method: PaymentMethod) => (
              <div key={method.id}>
                {method.type} ending in {method.last4}
              </div>
            ))
          ) : (
            <p>No payment methods added</p>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesData?.length ? (
            invoicesData.map((invoice: Invoice) => (
              <div key={invoice.id}>
                Invoice for {invoice.planName} - €{invoice.amount} ({invoice.status})
              </div>
            ))
          ) : (
            <p>No invoices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 