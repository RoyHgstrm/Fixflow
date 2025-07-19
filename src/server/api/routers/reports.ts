import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db';
import { z } from 'zod';
import { WorkOrderType, CustomerType, WorkOrderPriority, InvoiceStatus } from '@/lib/types';

export const reportsRouter = createTRPCRouter({
  getStats: protectedProcedure
    .input(z.object({
      from: z.date(),
      to: z.date(),
      workOrderType: z.nativeEnum(WorkOrderType).optional(),
      customerType: z.nativeEnum(CustomerType).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const companyId = session.user.companyId;

      if (!companyId) {
        return null;
      }

      const { from, to, workOrderType, customerType } = input;

      // Helper for date filtering
      const dateFilter = { gte: from, lte: to };

      // 1. Total Revenue
      const totalRevenueResult = await db.invoice.aggregate({
        where: { 
          companyId, 
          status: InvoiceStatus.PAID, 
          paidDate: dateFilter, 
          workOrder: workOrderType ? { type: workOrderType } : undefined,
          customer: customerType ? { type: customerType } : undefined,
        },
        _sum: { total: true },
      });
      const totalRevenue = totalRevenueResult._sum.total ?? 0;

      // 2. New Customers
      const newCustomers = await db.customer.count({
        where: { companyId, createdAt: dateFilter, type: customerType || undefined },
      });

      // 3. Work Order Stats
      const completedWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'COMPLETED', completedDate: dateFilter, type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
      });

      const pendingWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'PENDING', type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
      });
      
      const inProgressWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'IN_PROGRESS', type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
      });

      const assignedWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'ASSIGNED', type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
      });

      const cancelledWorkOrders = await db.workOrder.count({
        where: { companyId, status: 'CANCELLED', type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
      });

      // 4. Average Completion Time (simple calculation for now)
      const workOrdersForAvgTime = await db.workOrder.findMany({
        where: { companyId, status: 'COMPLETED', completedDate: dateFilter, type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
        select: { createdAt: true, completedDate: true },
      });

      const totalCompletionTimeMillis = workOrdersForAvgTime.reduce((sum: number, wo: { createdAt: Date | null; completedDate: Date | null }) => {
        if (wo.createdAt && wo.completedDate) {
          return sum + (wo.completedDate.getTime() - wo.createdAt.getTime());
        }
        return sum;
      }, 0);

      const averageCompletionTime = workOrdersForAvgTime.length > 0 
        ? totalCompletionTimeMillis / workOrdersForAvgTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // 5. Revenue Over Time
      const revenueOverTime = await db.invoice.groupBy({
        by: ['paidDate'],
        where: { companyId, status: InvoiceStatus.PAID, paidDate: dateFilter, workOrder: workOrderType ? { type: workOrderType } : undefined, customer: customerType ? { type: customerType } : undefined },
        _sum: { total: true },
        orderBy: { paidDate: 'asc' },
      });

      // 6. Work Orders by Type
      const workOrdersByType = await db.workOrder.groupBy({
        by: ['type'],
        where: { companyId, createdAt: dateFilter, type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
        _count: { id: true },
      });

      // 7. Customer Breakdown by Type
      const customerBreakdown = await db.customer.groupBy({
        by: ['type'],
        where: { companyId, createdAt: dateFilter, type: customerType || undefined },
        _count: { id: true },
      });

      const residentialCustomers = customerBreakdown.find((c: { type: CustomerType; _count: { id: number } }) => c.type === CustomerType.RESIDENTIAL)?._count.id ?? 0;
      const commercialCustomers = customerBreakdown.find((c: { type: CustomerType; _count: { id: number } }) => c.type === CustomerType.COMMERCIAL)?._count.id ?? 0;
      const industrialCustomers = customerBreakdown.find((c: { type: CustomerType; _count: { id: number } }) => c.type === CustomerType.INDUSTRIAL)?._count.id ?? 0;

      // 8. Top Customers by Revenue
      const topCustomersByRevenue = await db.customer.findMany({
        where: {
          companyId,
          invoices: {
            some: {
              status: InvoiceStatus.PAID,
              paidDate: dateFilter,
              workOrder: workOrderType ? { type: workOrderType } : undefined,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: { workOrders: true },
          },
          invoices: {
            where: { status: InvoiceStatus.PAID, paidDate: dateFilter, workOrder: workOrderType ? { type: workOrderType } : undefined },
            select: { total: true },
          },
        },
        orderBy: { createdAt: 'desc' }, // Or by total revenue if aggregate in findMany was supported
        take: 5,
      });

      const topCustomersFormatted = topCustomersByRevenue.map((customer: {
        id: string;
        name: string | null;
        email: string | null;
        _count: { workOrders: number };
        invoices: { total: number | null }[];
      }) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalRevenue: customer.invoices.reduce((sum: number, inv: { total: number | null }) => sum + (inv.total ?? 0), 0),
        workOrderCount: customer._count.workOrders,
      }));

      // 9. Work Orders by Priority
      const workOrdersByPriority = await db.workOrder.groupBy({
        by: ['priority'],
        where: { companyId, createdAt: dateFilter, type: workOrderType || undefined, customer: customerType ? { type: customerType } : undefined },
        _count: { id: true },
      });

      return {
        totalRevenue,
        newCustomers,
        completedWorkOrders,
        pendingWorkOrders,
        inProgressWorkOrders,
        assignedWorkOrders,
        cancelledWorkOrders,
        averageCompletionTime,
        revenueOverTime: revenueOverTime.map((r: { paidDate: Date | null; _sum: { total: number | null } }) => ({ date: r.paidDate, revenue: r._sum.total })),
        workOrdersByType: workOrdersByType.map((w: { type: WorkOrderType; _count: { id: number } }) => ({ type: w.type, count: w._count.id })),
        residentialCustomers,
        commercialCustomers,
        industrialCustomers,
        topCustomersByRevenue: topCustomersFormatted,
        workOrdersByPriority: workOrdersByPriority.map((w: { priority: WorkOrderPriority; _count: { id: number } }) => ({ priority: w.priority, count: w._count.id })),
      };
    }),
});