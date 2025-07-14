import { z } from "zod";
import { WorkOrderStatus, WorkOrderPriority, UserRole } from "~/lib/types";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Input schemas
const workOrderCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  assignedToId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  estimatedHours: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  scheduledDate: z.date().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const workOrderUpdateSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  scheduledDate: z.date().optional(),
  completedDate: z.date().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const workOrderFilterSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

export const workOrderRouter = createTRPCRouter({
  // Get all work orders with filtering and pagination
  getAll: protectedProcedure
    .input(workOrderFilterSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, search, assignedToId, customerId } = input;
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role and filters
        const where: any = {};

        // Role-based filtering
        if (userRole === UserRole.CLIENT) {
          // Clients can only see work orders for customers they created
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          // Technicians can only see work orders assigned to them
          where.assignedToId = userId;
        }
        // Admins can see all work orders

        // Apply additional filters
        if (status) {
          where.status = status;
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
            { location: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        // Handle cursor-based pagination
        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : {};

        const workOrders = await (ctx.db as any).workOrder.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                type: true,
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
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit + 1, // Take one extra to check if there are more
          ...cursorOptions,
        });

        let nextCursor: string | undefined = undefined;
        if (workOrders.length > limit) {
          const nextItem = workOrders.pop();
          nextCursor = nextItem!.id;
        }

        return {
          workOrders,
          nextCursor,
        };
      } catch (error) {
        console.error('Error fetching work orders:', error);
        // Return empty result if database fails
        return {
          workOrders: [],
          nextCursor: undefined,
        };
      }
    }),

  // Get work order statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role
        const where: any = {};
        
        if (userRole === UserRole.CLIENT) {
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          where.assignedToId = userId;
        }

        const [total, pending, assigned, inProgress, completed, cancelled] = await Promise.all([
          (ctx.db as any).workOrder.count({ where }),
          (ctx.db as any).workOrder.count({ where: { ...where, status: 'PENDING' } }),
          (ctx.db as any).workOrder.count({ where: { ...where, status: 'ASSIGNED' } }),
          (ctx.db as any).workOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
          (ctx.db as any).workOrder.count({ where: { ...where, status: 'COMPLETED' } }),
          (ctx.db as any).workOrder.count({ where: { ...where, status: 'CANCELLED' } }),
        ]);

        const totalValueResult = await (ctx.db as any).workOrder.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { amount: true },
        });

        return {
          total,
          pending,
          assigned,
          inProgress,
          completed,
          cancelled,
          totalValue: totalValueResult._sum.amount || 0,
        };
      } catch (error) {
        console.error('Error fetching work order stats:', error);
        // Return default stats if database fails
        return {
          total: 0,
          pending: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          totalValue: 0,
        };
      }
    }),

  // Get a single work order by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder) {
          throw new Error('Database models not available');
        }

        const where: any = { id: input.id };

        // Role-based access control
        if (userRole === UserRole.CLIENT) {
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          where.assignedToId = userId;
        }

        const workOrder = await (ctx.db as any).workOrder.findFirst({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                type: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            invoices: {
              select: {
                id: true,
                number: true,
                status: true,
                amount: true,
                total: true,
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
        console.error('Error fetching work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch work order',
        });
      }
    }),

  // Create a new work order
  create: protectedProcedure
    .input(workOrderCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins and technicians can create work orders
      if (userRole === UserRole.CLIENT) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Clients cannot create work orders directly',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Verify customer exists and user has access
        const customer = await (ctx.db as any).customer.findFirst({
          where: {
            id: input.customerId,
            ...(userRole === UserRole.CLIENT ? { createdById: userId } : {}),
          },
        });

        if (!customer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found',
          });
        }

        // Verify assigned user exists if provided
        if (input.assignedToId) {
          const assignedUser = await (ctx.db as any).user.findFirst({
            where: {
              id: input.assignedToId,
              isActive: true,
            },
          });

          if (!assignedUser) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Assigned user not found',
            });
          }
        }

        const workOrder = await (ctx.db as any).workOrder.create({
          data: {
            ...input,
            status: input.assignedToId ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.PENDING,
            createdById: userId,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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

        return workOrder;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create work order',
        });
      }
    }),

  // Update an existing work order
  update: protectedProcedure
    .input(workOrderUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder) {
          throw new Error('Database models not available');
        }

        // Check if work order exists and user has access
        const existingWorkOrder = await (ctx.db as any).workOrder.findFirst({
          where: {
            id: input.id,
            ...(userRole === UserRole.CLIENT ? { customer: { createdById: userId } } : {}),
            ...(userRole === UserRole.TECHNICIAN ? { assignedToId: userId } : {}),
          },
        });

        if (!existingWorkOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Work order not found',
          });
        }

        // Technicians can only update status and completion-related fields
        const updateData: any = {};
        if (userRole === UserRole.TECHNICIAN) {
          if (input.status) updateData.status = input.status;
          if (input.notes) updateData.notes = input.notes;
          if (input.completedDate) updateData.completedDate = input.completedDate;
        } else {
          // Admins can update all fields
          Object.assign(updateData, input);
          delete updateData.id; // Remove id from update data
        }

        // If status is being set to COMPLETED, set completedDate
        if (updateData.status === WorkOrderStatus.COMPLETED && !updateData.completedDate) {
          updateData.completedDate = new Date();
        }

        const workOrder = await (ctx.db as any).workOrder.update({
          where: { id: input.id },
          data: updateData,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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

        return workOrder;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update work order',
        });
      }
    }),

  // Delete a work order
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can delete work orders
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can delete work orders',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).workOrder) {
          throw new Error('Database models not available');
        }

        const workOrder = await (ctx.db as any).workOrder.findUnique({
          where: { id: input.id },
        });

        if (!workOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Work order not found',
          });
        }

        await (ctx.db as any).workOrder.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error deleting work order:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete work order',
        });
      }
    }),
}); 