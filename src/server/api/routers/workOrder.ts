/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable complexity */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { WorkOrderStatus as PrismaWorkOrderStatus } from '@prisma/client';
import {
  WorkOrderPriority,
  WorkOrderStatus,
  CustomerType,
  WorkOrderType, // Import WorkOrderType as value
  type WorkOrderBase,
  type WorkOrderWithRelations,
  type WorkOrderQueryFilters,
  type WorkOrderCreateData,
  type WorkOrderResponse,
  type WorkOrderStats,
  type PaginatedResponse,
  type UserRole,
  USER_ROLES,
  type ExtendedUser,
} from "@/lib/types";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

const checkUserAccess = (userRole: UserRole, allowedRoles: UserRole[]) => {
  return allowedRoles.includes(userRole);
};

const listWorkOrdersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  status: z.nativeEnum(WorkOrderStatus).optional().nullable(),
  priority: z.nativeEnum(WorkOrderPriority).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  customerId: z.string().min(1, 'Customer is required'),
  assignedToId: z.string().optional().nullable(),
  priority: z.nativeEnum(WorkOrderPriority).default(WorkOrderPriority.MEDIUM),
  estimatedHours: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  scheduledDate: z.date().optional().nullable(),
  type: z.nativeEnum(WorkOrderType).default(WorkOrderType.MAINTENANCE), // Use WorkOrderType enum
});

const updateWorkOrderSchema = z.object({
  id: z.string().min(1, 'Work order ID is required'),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(WorkOrderStatus).optional().nullable(),
  priority: z.nativeEnum(WorkOrderPriority).optional().nullable(),
  assignedToId: z.string().optional().nullable(), // Ensure nullable and optional
  estimatedHours: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  scheduledDate: z.date().optional().nullable(),
  completedDate: z.date().optional().nullable(),
  type: z.nativeEnum(WorkOrderType).optional().nullable(), // Use WorkOrderType enum
});

export const workOrderRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listWorkOrdersSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, priority, assignedToId, customerId, search } = input;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role || USER_ROLES.EMPLOYEE;

      try {
        const where: any = {
          companyId: ctx.session.user.companyId, 
        };

        if (status) {
          where.status = status;
        }
        if (priority) {
          where.priority = priority;
        }
        if (assignedToId) {
          where.assignedToId = assignedToId;
        }
        if (customerId) {
          where.customerId = customerId;
        }
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        if (userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) {
          where.assignedToId = userId;
        } else if (userRole === USER_ROLES.SOLO) {
          where.createdById = userId;
        } else if (userRole === USER_ROLES.CLIENT) {
          where.customerId = userId;
        }

        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : undefined;

        const workOrders = await ctx.prisma.workOrder.findMany({
          ...cursorOptions,
          where: where,
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
            type: true,
            customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
        });

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
      const { user } = ctx.session;
      const userRole = user.role || USER_ROLES.EMPLOYEE;

      try {
        const where: any = {
          companyId: user.companyId,
        };

        if (userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) {
          where.assignedToId = user.id;
        } else if (userRole === USER_ROLES.SOLO) {
          where.createdById = user.id;
        } else if (userRole === USER_ROLES.CLIENT) {
          where.customerId = user.id;
        }

        const stats = await ctx.prisma.workOrder.groupBy({
          by: ['status'],
          where: where,
          _count: true,
        });

        const totalValue = await ctx.prisma.workOrder.aggregate({
          where: {
            ...where,
            status: PrismaWorkOrderStatus.COMPLETED,
            amount: { not: null },
          },
          _sum: { amount: true },
        });

        const workOrderStats: WorkOrderStats = {
          total: stats.reduce((sum: number, stat: { _count: number }) => sum + stat._count, 0),
          pending: stats.find((s: { status: PrismaWorkOrderStatus; _count: number }) => s.status === PrismaWorkOrderStatus.PENDING)?._count || 0,
          assigned: stats.find((s: { status: PrismaWorkOrderStatus; _count: number }) => s.status === PrismaWorkOrderStatus.ASSIGNED)?._count || 0,
          inProgress: stats.find((s: { status: PrismaWorkOrderStatus; _count: number }) => s.status === PrismaWorkOrderStatus.IN_PROGRESS)?._count || 0,
          completed: stats.find((s: { status: PrismaWorkOrderStatus; _count: number }) => s.status === PrismaWorkOrderStatus.COMPLETED)?._count || 0,
          cancelled: stats.find((s: { status: PrismaWorkOrderStatus; _count: number }) => s.status === PrismaWorkOrderStatus.CANCELLED)?._count || 0,
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
      const { user } = ctx.session;
      const userRole = user.role || USER_ROLES.EMPLOYEE;

      try {
        const where: any = {
          id: input.id,
          companyId: user.companyId, 
        };

        if (userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) {
          where.assignedToId = user.id;
        } else if (userRole === USER_ROLES.SOLO) {
          where.createdById = user.id;
        } else if (userRole === USER_ROLES.CLIENT) {
          where.customerId = user.id;
        }

        const workOrder = await ctx.prisma.workOrder.findFirst({
          where: where,
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
            type: true,
            customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
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
    .input(createWorkOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session?.user?.role || USER_ROLES.EMPLOYEE;

      if (!checkUserAccess(userRole, [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SOLO])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create work orders',
        });
      }

      try {
        const newWorkOrder = await ctx.prisma.workOrder.create({
          data: {
            ...input,
            companyId: ctx.session.user.companyId || null,
            createdById: ctx.session.user.id,
            status: PrismaWorkOrderStatus.PENDING,
            type: input.type || WorkOrderType.MAINTENANCE, // Use WorkOrderType enum
          },
        });

        return newWorkOrder;
      } catch (error) {
        console.error('Failed to create work order:', error);
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
      const { user } = ctx.session;
      const userRole = user.role || USER_ROLES.EMPLOYEE;

      try {
        const existingWorkOrder = await ctx.prisma.workOrder.findUnique({
          where: {
            id: input.id,
            companyId: user.companyId, 
          },
          select: { companyId: true, createdById: true, assignedToId: true, completedDate: true },
        });

        if (!existingWorkOrder || existingWorkOrder.companyId !== user.companyId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this work order',
          });
        }

        const canUpdate = (userRole === USER_ROLES.OWNER ||
          userRole === USER_ROLES.MANAGER ||
          userRole === USER_ROLES.ADMIN ||
          userRole === USER_ROLES.SOLO ||
          (userRole === USER_ROLES.FIELD_WORKER && existingWorkOrder.assignedToId === user.id) ||
          (userRole === USER_ROLES.TECHNICIAN && existingWorkOrder.assignedToId === user.id));

        if (!canUpdate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this work order',
          });
        }

        if (userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) {
          const allowedUpdates = ['status', 'notes', 'description', 'amount', 'estimatedHours', 'completedDate'];
          const disallowedFields = Object.keys(input).filter(key => !allowedUpdates.includes(key) && key !== 'id');
          if (disallowedFields.length > 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Field workers/technicians can only update status, notes, description, amount, estimated hours, and completed date. Attempted to update: ${disallowedFields.join(', ')}`,
            });
          }
        }

        const updatedWorkOrder = await ctx.prisma.workOrder.update({
          where: { id: input.id },
          data: {
            ...input,
            ...(input.status === WorkOrderStatus.COMPLETED && !existingWorkOrder.completedDate && { completedDate: new Date() }),
            ...(input.status !== WorkOrderStatus.COMPLETED && existingWorkOrder.completedDate && { completedDate: null }),
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
      const { user } = ctx.session;
      const userRole = user.role || USER_ROLES.EMPLOYEE;

      if (!checkUserAccess(userRole, [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SOLO])) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete work orders',
        });
      }

      try {
        const existingWorkOrder = await ctx.prisma.workOrder.findUnique({
          where: {
            id: input.id,
            companyId: user.companyId, 
          },
          select: { companyId: true },
        });

        if (!existingWorkOrder || existingWorkOrder.companyId !== user.companyId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to delete this work order',
          });
        }

        await ctx.prisma.workOrder.delete({ where: { id: input.id } });
        return { id: input.id };
      } catch (error) {
        console.error('Failed to delete work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete work order',
        });
      }
    }),
});

export default workOrderRouter; 