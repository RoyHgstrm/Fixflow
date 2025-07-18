import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PlanType, SubscriptionStatus } from '@/lib/types';

export const companyRouter = createTRPCRouter({
  getSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        const company = await ctx.db.company.findUnique({
          where: { id: companyId },
          select: {
            id: true,
            name: true,
            planType: true,
            subscriptionStatus: true,
            trialStartDate: true,
            trialEndDate: true,
            isActive: true,
          },
        });

        if (!company) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Company not found',
          });
        }

        return {
          ...company,
          planType: company.planType as PlanType,
          subscriptionStatus: company.subscriptionStatus as SubscriptionStatus,
        };
      } catch (error) {
        console.error('Failed to fetch company subscription:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve company subscription details',
        });
      }
    }),
}); 