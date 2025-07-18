'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, AlertTriangle, Clock } from 'lucide-react';
import { Button } from './button';
import { useTrialStatus } from '@/lib/hooks/use-trial-status';
import type { CompanyWithSubscription } from '@/lib/types';
import { SubscriptionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface TrialBannerProps {
  company?: {
    name?: string;
    id?: string;
  };
}

export function TrialBanner({ company: initialCompany }: TrialBannerProps = {}) {
  const { company, daysRemaining, trialEndDate, status } = useTrialStatus();

  const companyName = company?.name ?? initialCompany?.name;

  if (status !== SubscriptionStatus.TRIALING) {
    return null;
  }

  const bannerVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', duration: 0.5, bounce: 0.4 }
    },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } }
  };

  const getBannerContent = () => {
    if (daysRemaining !== null && daysRemaining <= 3) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-yellow-300" />,
        title: `Trial Ending Soon!`,
        message: `Your trial for ${companyName} ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
        buttonText: 'Upgrade Now',
        gradient: 'from-yellow-500 to-orange-600',
      };
    }

    return {
      icon: <Star className="h-6 w-6 text-yellow-300" />,
      title: `${companyName ? `${companyName}'s` : 'Your'} Free Trial`,
      message: daysRemaining ? `${daysRemaining} days left to unlock full potential.` : 'Your trial has ended.',
      buttonText: 'Upgrade Plan',
      gradient: 'from-blue-500 to-purple-600',
    };
  };

  const content = getBannerContent();

  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
    >
      <div
        className={cn(
          'text-white p-4 rounded-lg shadow-lg space-y-3',
          'bg-gradient-to-r',
          content.gradient
        )}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {content.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold">{content.title}</h3>
            <p className="text-xs text-white/80 mt-1">{content.message}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          {content.buttonText}
        </Button>
      </div>
    </motion.div>
  );
} 