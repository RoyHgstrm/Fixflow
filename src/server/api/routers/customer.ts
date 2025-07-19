import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { type UserRole } from '@/lib/types';

// Define specific types for customer-related operations
type CustomerCreateInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
};

type CustomerUpdateInput = Partial<CustomerCreateInput> & {
  id: string;
};

export const customerRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
        address: z.string().optional(),
        companyName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user role
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create customers',
        });
      }

      try {
        const customer = await ctx.db.customer.create({
          data: {
            ...input,
            companyId: ctx.session.user.companyId!, // Non-null assertion
            createdById: ctx.session.user.id, // Non-null assertion
          },
        });

        return customer;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer',
          cause: error,
        });
      }
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        const where: any = { companyId };

        // Optional date filtering
        if (input?.from && input?.to) {
          where.createdAt = {
            gte: input.from,
            lte: input.to,
          };
        }

        // Total customers
        const totalCustomers = await ctx.db.customer.count({ where });

        // Customers by type
        const customerTypes = await ctx.db.customer.groupBy({
          by: ['type'],
          where: { companyId },
          _count: true,
        });

        // Prepare type-specific counts
        const typeStats = customerTypes.reduce((acc: Record<string, number>, type: { type: string; _count: number }) => {
          acc[type.type.toLowerCase()] = type._count;
          return acc;
        }, {} as Record<string, number>);

        // Calculate growth for the current period (new customers within the period)
        const newCustomersInPeriod = await ctx.db.customer.count({ where });

        // For growth, we typically compare to a previous period. 
        // Let's define a simple previous period as the same duration immediately preceding the current period.
        const now = new Date();
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

        const getCustomersCountForPeriod = async (startDate: Date, endDate: Date) => {
          return await ctx.db.customer.count({
            where: {
              companyId,
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          });
        };

        const newCustomersLastMonth = await getCustomersCountForPeriod(oneMonthAgo, new Date());
        const newCustomersLastQuarter = await getCustomersCountForPeriod(threeMonthsAgo, new Date());
        const newCustomersLastYear = await getCustomersCountForPeriod(oneYearAgo, new Date());

        return {
          totalCustomers,
          residential: typeStats.residential || 0,
          commercial: typeStats.commercial || 0,
          industrial: typeStats.industrial || 0,
          growth: {
            total: {
              isPositive: newCustomersInPeriod >= 0, // Always true if counting new customers
              value: newCustomersInPeriod,
              period: input?.from && input?.to ? 'custom' : 'current',
            },
            residential: {
              isPositive: (typeStats.residential || 0) > 0,
              newCustomers: typeStats.residential || 0,
              period: 'quarter',
            },
            commercial: {
              isPositive: (typeStats.commercial || 0) > 0,
              newCustomers: typeStats.commercial || 0,
              period: 'month',
            },
            industrial: {
              isPositive: (typeStats.industrial || 0) > 0,
              newCustomers: typeStats.industrial || 0,
              period: 'year',
            },
          },
        };
      } catch (error) {
        console.error('Failed to fetch customer stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer statistics',
        });
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      try {
        // Build where clause
        const where: any = { companyId };

        // Add search filter if provided
        if (search) {
          where.AND = [
            { companyId },
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            },
          ];
          // Remove the direct companyId from the top-level where if AND is used
          delete where.companyId;
        }

        // Handle cursor-based pagination
        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : undefined;

        // Fetch customers
        console.log('Customer list - companyId:', companyId);
        console.log('Customer list - where clause:', where);
        const customers = await ctx.db.customer.findMany({
          ...cursorOptions,
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: { 
                workOrders: true,
                invoices: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1,
        });
        console.log('Customers fetched from DB:', customers);

        // Return paginated results
        const hasNextPage = customers.length > limit;
        const nextCursor = hasNextPage ? customers[customers.length - 1]?.id : undefined;

        return {
          items: customers.slice(0, limit).map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            type: customer.type ?? 'RESIDENTIAL', // Default type
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt ?? new Date(), // Default to current date
            createdBy: customer.createdBy ?? { 
              id: '', 
              name: 'Unknown', 
              email: '' 
            },
            createdById: customer.createdBy?.id ?? '',
            workOrders: [], // Empty array as we didn't fetch related work orders
            invoices: [], // Empty array as we didn't fetch related invoices
            _count: {
              workOrders: customer._count.workOrders,
              invoices: customer._count.invoices ?? 0,
            },
            notes: null, // Optional field
            severity: null, // Optional field
          })),
          nextCursor,
          hasMore: hasNextPage,
        };
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customers',
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No company associated with user',
        });
      }

      const customer = await ctx.db.customer.findUnique({
        where: { 
          id: input.id,
          companyId: companyId 
        },
        include: {
          workOrders: {
            select: {
              id: true,
              status: true,
              scheduledDate: true,
              type: true,
              amount: true, // Added missing amount field
            },
            orderBy: { scheduledDate: 'desc' },
            take: 5, // Limit to last 5 work orders
          },
          invoices: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Limit to last 5 invoices
          },
        },
      });

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found',
        });
      }

      return customer;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: z.string().email('Invalid email address').optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update customers',
        });
      }

      try {
        const updatedCustomer = await ctx.db.customer.update({
          where: {
            id: input.id,
            companyId: ctx.session.user.companyId!, // Ensure customer belongs to company
          },
          data: input,
        });

        return updatedCustomer;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
          cause: error,
        });
      }
    }),
}); 