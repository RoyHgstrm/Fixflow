import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db';
import { z } from 'zod';

export const reportsRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(z.object({
      from: z.date(),
      to: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const companyId = session.user.companyId;

      if (!companyId) {
        return null;
      }

      const { from, to } = input;

      const totalRevenue = await db.invoice.aggregate({
        where: { companyId, status: 'PAID', paidDate: { gte: from, lte: to } },
        _sum: { total: true },
      });

      const newCustomers = await db.customer.count({
        where: { companyId, createdAt: { gte: from, lte: to } },
      });

      const completedWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'COMPLETED', completedDate: { gte: from, lte: to } },
      });

      const pendingWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'PENDING' },
      });

      const revenueOverTime = await db.invoice.groupBy({
        by: ['paidDate'],
        where: { companyId, status: 'PAID', paidDate: { gte: from, lte: to } },
        _sum: { total: true },
        orderBy: { paidDate: 'asc' },
      });

      return {
        totalRevenue: totalRevenue._sum.total ?? 0,
        newCustomers,
        completedWorkOrders,
        pendingWorkOrders,
        revenueOverTime: revenueOverTime.map(r => ({ date: r.paidDate, revenue: r._sum.total })),
      };
    }),
});