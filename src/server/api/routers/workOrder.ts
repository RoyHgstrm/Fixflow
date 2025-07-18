import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type {
  WorkOrderPriority} from "@/lib/types";
import {
  type WorkOrderBase,
  type WorkOrderWithRelations,
  type WorkOrderQueryFilters,
  type WorkOrderCreateData,
  type WorkOrderResponse,
  type WorkOrderStats,
  type PaginatedResponse,
  UserRole,
  type ExtendedUser,
  WorkOrderStatus
} from "@/lib/types";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

// Helper function to check user access
const checkUserAccess = (userRole: UserRole, allowedRoles: UserRole[]) => {
  return allowedRoles.includes(userRole);
};

// Input schemas
const listWorkOrdersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
});

const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  assignedToId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().optional(),
  amount: z.number().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  scheduledDate: z.date().optional(),
});

const updateWorkOrderSchema = z.object({
  id: z.string().min(1, 'Work order ID is required'),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  scheduledDate: z.date().optional().nullable(),
  completedDate: z.date().optional().nullable(), // Add this line
});

// Define specific types for work order-related operations
type WorkOrderCreateInput = {
  title: string;
  customerId: string;
  priority?: WorkOrderPriority;
  description?: string;
  amount?: number;
  notes?: string;
  estimatedHours?: number;
  scheduledDate?: Date;
  location?: string;
  assignedToId?: string;
};

type WorkOrderUpdateInput = Partial<WorkOrderCreateInput> & {
  id: string;
};

export const workOrderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listWorkOrdersSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, priority, assignedToId, customerId, search } = input;
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.EMPLOYEE;

      try {
        // Build where clause
        const where: any = {
          companyId: ctx.session.user.companyId, // Add companyId filter
        };

        // Filter by status
        if (status) {
          where.status = status;
        }

        // Filter by priority
        if (priority) {
          where.priority = priority;
        }

        // Filter by assigned user
        if (assignedToId) {
          where.assignedToId = assignedToId;
        }

        // Filter by customer
        if (customerId) {
          where.customerId = customerId;
        }

        // Search in title and description
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Role-based filtering
        if (userRole === UserRole.EMPLOYEE || userRole === UserRole.TECHNICIAN) {
          where.assignedToId = userId;
        }

        // Handle cursor-based pagination
        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : undefined;

        // Fetch work orders
        const workOrders = await ctx.db.workOrder.findMany({
          ...cursorOptions,
          where,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            amount: true,
            scheduledDate: true,
            completedDate: true,
            location: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            companyId: true,
            customerId: true,
            assignedToId: true,
            createdById: true,
            type: true, // Ensure type is selected
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1,
        });

        // Return paginated results
        const hasNextPage = workOrders.length > limit;
        const nextCursor = hasNextPage ? workOrders[workOrders.length - 1]?.id : undefined;

        return {
          items: workOrders.slice(0, limit) as WorkOrderResponse[],
          nextCursor,
          hasMore: hasNextPage,
        };
      } catch (error) {
        console.error('Failed to fetch work orders:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch work orders',
        });
      }
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.EMPLOYEE;

      try {
        // Build where clause
        const where: any = {
          companyId: ctx.session.user.companyId, // Add companyId filter
        };

        // Role-based filtering
        if (userRole === UserRole.EMPLOYEE || userRole === UserRole.TECHNICIAN) {
          where.assignedToId = userId;
        }

        // Get work order counts by status
        const stats = await ctx.db.workOrder.groupBy({
          by: ['status'],
          where,
          _count: true,
        });

        // Calculate total value from completed work orders
        const totalValue = await ctx.db.workOrder.aggregate({
          where: {
            ...where,
            status: 'COMPLETED',
            amount: { not: null },
          },
          _sum: {
            amount: true,
          },
        });

        // Format stats
        const workOrderStats: WorkOrderStats = {
          total: stats.reduce((sum: number, stat: { _count: number }) => sum + stat._count, 0),
          pending: stats.find((s: { status: WorkOrderStatus; _count: number }) => s.status === 'PENDING')?._count || 0,
          assigned: stats.find((s: { status: WorkOrderStatus; _count: number }) => s.status === 'ASSIGNED')?._count || 0,
          inProgress: stats.find((s: { status: WorkOrderStatus; _count: number }) => s.status === 'IN_PROGRESS')?._count || 0,
          completed: stats.find((s: { status: WorkOrderStatus; _count: number }) => s.status === 'COMPLETED')?._count || 0,
          cancelled: stats.find((s: { status: WorkOrderStatus; _count: number }) => s.status === 'CANCELLED')?._count || 0,
          totalValue: totalValue._sum.amount || 0,
        };

        return workOrderStats;
      } catch (error) {
        console.error('Failed to fetch work order stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch work order statistics',
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.EMPLOYEE;

      try {
        // Build where clause
        const where: any = {
          id: input.id,
          companyId: ctx.session.user.companyId, // Add companyId filter
        };

        // Role-based filtering
        if (userRole === UserRole.EMPLOYEE || userRole === UserRole.TECHNICIAN) {
          where.assignedToId = userId;
        }

        // Fetch work order
        const workOrder = await ctx.db.workOrder.findFirst({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            amount: true,
            scheduledDate: true,
            completedDate: true,
            location: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            companyId: true,
            customerId: true,
            assignedToId: true,
            createdById: true,
            type: true, // Ensure type is selected
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!workOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Work order not found',
          });
        }

        return workOrder;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Failed to fetch work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch work order',
        });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2, 'Title must be at least 2 characters'),
        customerId: z.string(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        description: z.string().optional(),
        amount: z.number().optional(),
        notes: z.string().optional(),
        estimatedHours: z.number().optional(),
        scheduledDate: z.date().optional(),
        location: z.string().optional(),
        assignedToId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user role
      const userRole = ctx.session?.user?.role ?? 'EMPLOYEE';
      if (!['OWNER', 'MANAGER', 'ADMIN'].includes(userRole)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create work orders',
        });
      }

      try {
        const workOrder = await ctx.db.workOrder.create({
          data: {
            ...input,
            companyId: ctx.session.user.companyId!, // Non-null assertion
            createdById: ctx.session.user.id, // Non-null assertion
            status: 'PENDING' as WorkOrderStatus,
          },
        });

        return workOrder;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create work order',
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(updateWorkOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.EMPLOYEE;

      try {
        // Get existing work order
        const workOrder = await ctx.db.workOrder.findUnique({
          where: {
            id: input.id,
            companyId: ctx.session.user.companyId, // Add companyId filter
          },
        });

        if (!workOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Work order not found',
          });
        }

        // Check permissions
        const canUpdate = userRole === UserRole.OWNER ||
          userRole === UserRole.MANAGER ||
          userRole === UserRole.ADMIN ||
          workOrder.assignedToId === userId;

        if (!canUpdate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this work order',
          });
        }

        // Update work order
        const updatedWorkOrder = await ctx.db.workOrder.update({
          where: { id: input.id },
          data: {
            ...input,
            id: undefined,
            // Ensure completedDate is only set if status is completed
            ...(input.status === WorkOrderStatus.COMPLETED && !workOrder.completedDate && { completedDate: new Date() }),
            ...(input.status !== WorkOrderStatus.COMPLETED && workOrder.completedDate && { completedDate: null }),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedWorkOrder;
      } catch (error) {
        console.error('Failed to update work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update work order',
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session.user as any).role || UserRole.EMPLOYEE;

      // Only admins can delete work orders
      if (!checkUserAccess(userRole, [UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete work orders',
        });
      }

      try {
        await ctx.db.workOrder.delete({
          where: {
            id: input.id,
            companyId: ctx.session.user.companyId, // Add companyId filter
          },
        });

        return { success: true };
      } catch (error) {
        console.error('Failed to delete work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete work order',
        });
      }
    }),
}); 