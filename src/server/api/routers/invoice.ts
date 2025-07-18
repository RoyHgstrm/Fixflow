import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { type UserRole } from '@/lib/types';

// Function to generate invoice number
const generateInvoiceNumber = (companyId: string) => {
  const prefix = companyId.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${prefix}-${timestamp}`;
};

// Define specific types for invoice-related operations
type InvoiceCreateInput = {
  workOrderId: string;
  customerId: string;
  amount: number;
  tax: number;
  discount?: number;
  notes?: string;
};

type InvoiceUpdateInput = Partial<InvoiceCreateInput> & {
  id: string;
};

export const invoiceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        workOrderId: z.string(),
        customerId: z.string(),
        amount: z.number().positive('Amount must be positive'),
        tax: z.number().min(0, 'Tax cannot be negative'),
        discount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user role
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create invoices',
        });
      }

      try {
        // Validate work order belongs to the same company
        const workOrder = await ctx.db.workOrder.findUnique({
          where: { 
            id: input.workOrderId,
            companyId: ctx.session.user.companyId 
          },
        });

        if (!workOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Work order not found in your company',
          });
        }

        const invoice = await ctx.db.invoice.create({
          data: {
            ...input,
            companyId: ctx.session.user.companyId!, // Non-null assertion
            createdById: ctx.session.user.id, // Non-null assertion
            number: generateInvoiceNumber(ctx.session.user.companyId!),
            status: 'DRAFT',
            total: input.amount + input.tax - (input.discount ?? 0),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        return invoice;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invoice',
          cause: error,
        });
      }
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Validate user role
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view invoices',
        });
      }

      try {
        const invoices = await ctx.db.invoice.findMany({
          where: {
            companyId: ctx.session.user.companyId,
            ...(input.status && { status: input.status }),
            ...(input.search && {
              OR: [
                { number: { contains: input.search, mode: 'insensitive' } },
                { workOrder: { customer: { name: { contains: input.search, mode: 'insensitive' } } } },
              ],
            }),
          },
          include: {
            workOrder: {
              select: {
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          take: input.limit,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return invoices.map(invoice => ({
          ...invoice,
          customerName: invoice.workOrder?.customer?.name ?? 'Unknown',
        }));
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve invoices',
          cause: error,
        });
      }
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      // Validate user role
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view invoice statistics',
        });
      }

      try {
        const invoiceStats = await ctx.db.invoice.groupBy({
          by: ['status'],
          where: {
            companyId: ctx.session.user.companyId,
            ...(input?.status && { status: input.status }),
          },
          _count: {
            id: true,
          },
          _sum: {
            total: true,
          },
        });

        const totalInvoices = await ctx.db.invoice.count({
          where: {
            companyId: ctx.session.user.companyId,
            ...(input?.status && { status: input.status }),
          },
        });

        return {
          stats: invoiceStats.map(stat => ({
            status: stat.status,
            count: stat._count.id,
            totalAmount: stat._sum.total ?? 0,
          })),
          total: totalInvoices,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve invoice statistics',
          cause: error,
        });
      }
    }),
}); 