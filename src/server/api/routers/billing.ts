import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PlanType } from '@/lib/types';

export const billingRouter = createTRPCRouter({
  getPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        // In a real implementation, this would fetch from a payment provider
        // For now, we'll return a mock implementation
        return [
          {
            id: '1',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          }
        ];
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve payment methods',
        });
      }
    }),

  getInvoices: protectedProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        // Fetch invoices for the company
        const invoices = await ctx.db.invoice.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to last 10 invoices
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            createdAt: true,
            workOrder: {
              select: {
                title: true,
              },
            },
          },
        });

        return invoices.map(invoice => ({
          id: invoice.id,
          planName: invoice.workOrder?.title ?? 'Subscription',
          amount: invoice.total,
          status: invoice.status,
          date: invoice.createdAt,
        }));
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve invoices',
        });
      }
    }),

  upgradePlan: protectedProcedure
    .input(z.object({
      planType: z.enum(['SOLO', 'TEAM', 'BUSINESS', 'ENTERPRISE']),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;
      const userRole = ctx.session.user.role;

      // Only allow certain roles to upgrade plan
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to upgrade the plan',
        });
      }

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        // Update company plan
        const updatedCompany = await ctx.db.company.update({
          where: { id: companyId },
          data: {
            planType: input.planType as PlanType,
            subscriptionStatus: 'ACTIVE',
            trialEndDate: null, // Exit trial when upgrading
          },
        });

        return {
          success: true,
          message: `Successfully upgraded to ${input.planType} plan`,
          company: updatedCompany,
        };
      } catch (error) {
        console.error('Failed to upgrade plan:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upgrade plan',
        });
      }
    }),
}); 