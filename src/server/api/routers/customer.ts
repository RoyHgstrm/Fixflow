import { z } from "zod";
import { CustomerType, UserRole } from "~/lib/types";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Input schemas
const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]).default("RESIDENTIAL"),
  notes: z.string().optional(),
});

const customerUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const customerFilterSchema = z.object({
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"]).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export const customerRouter = createTRPCRouter({
  // Get all customers with filtering and pagination
  getAll: protectedProcedure
    .input(customerFilterSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, type, search } = input;
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role and filters
        const where: any = {};

        // Role-based filtering
        if (userRole === UserRole.CLIENT) {
          // Clients can only see customers they created
          where.createdById = userId;
        } else if (userRole === UserRole.TECHNICIAN) {
          // Technicians can see customers for work orders assigned to them
          where.workOrders = {
            some: {
              assignedToId: userId
            }
          };
        }
        // Admins can see all customers

        // Apply additional filters
        if (type) {
          where.type = type;
        }
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Handle cursor-based pagination
        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : {};

        const customers = await (ctx.db as any).customer.findMany({
          where,
          include: {
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
          orderBy: { createdAt: 'desc' },
          take: limit + 1, // Take one extra to check if there are more
          ...cursorOptions,
        });

        let nextCursor: string | undefined = undefined;
        if (customers.length > limit) {
          const nextItem = customers.pop();
          nextCursor = nextItem!.id;
        }

        return {
          customers,
          nextCursor,
        };
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Return empty result if database fails
        return {
          customers: [],
          nextCursor: undefined,
        };
      }
    }),

  // Get customer statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role
        const where: any = {};
        
        if (userRole === UserRole.CLIENT) {
          where.createdById = userId;
        } else if (userRole === UserRole.TECHNICIAN) {
          where.workOrders = {
            some: {
              assignedToId: userId
            }
          };
        }

        const [total, residential, commercial, industrial] = await Promise.all([
          (ctx.db as any).customer.count({ where }),
          (ctx.db as any).customer.count({ where: { ...where, type: 'RESIDENTIAL' } }),
          (ctx.db as any).customer.count({ where: { ...where, type: 'COMMERCIAL' } }),
          (ctx.db as any).customer.count({ where: { ...where, type: 'INDUSTRIAL' } }),
        ]);

        return {
          total,
          residential,
          commercial,
          industrial,
        };
      } catch (error) {
        console.error('Error fetching customer stats:', error);
        // Return default stats if database fails
        return {
          total: 0,
          residential: 0,
          commercial: 0,
          industrial: 0,
        };
      }
    }),

  // Get a single customer by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        const where: any = { id: input.id };

        // Role-based access control
        if (userRole === UserRole.CLIENT) {
          where.createdById = userId;
        } else if (userRole === UserRole.TECHNICIAN) {
          where.workOrders = {
            some: {
              assignedToId: userId
            }
          };
        }

        const customer = await (ctx.db as any).customer.findFirst({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            workOrders: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                amount: true,
                scheduledDate: true,
                completedDate: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 10, // Get latest 10 work orders
            },
            invoices: {
              select: {
                id: true,
                number: true,
                status: true,
                amount: true,
                total: true,
                dueDate: true,
                paidDate: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 10, // Get latest 10 invoices
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
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching customer:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer',
        });
      }
    }),

  // Create a new customer
  create: protectedProcedure
    .input(customerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins and technicians can create customers
      if (userRole === UserRole.CLIENT) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Clients cannot create customers',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Check if customer with same email already exists
        if (input.email) {
          const existingCustomer = await (ctx.db as any).customer.findFirst({
            where: { email: input.email },
          });

          if (existingCustomer) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Customer with this email already exists',
            });
          }
        }

        const customer = await (ctx.db as any).customer.create({
          data: {
            ...input,
            createdById: userId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return customer;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating customer:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer',
        });
      }
    }),

  // Update an existing customer
  update: protectedProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Check if customer exists and user has access
        const existingCustomer = await (ctx.db as any).customer.findFirst({
          where: {
            id: input.id,
            ...(userRole === UserRole.CLIENT ? { createdById: userId } : {}),
          },
        });

        if (!existingCustomer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found',
          });
        }

        // Technicians can only update notes
        const updateData: any = {};
        if (userRole === UserRole.TECHNICIAN) {
          if (input.notes) updateData.notes = input.notes;
        } else {
          // Admins and clients can update all fields
          Object.assign(updateData, input);
          delete updateData.id; // Remove id from update data
        }

        // Check if email is being changed and if it already exists
        if (updateData.email && updateData.email !== existingCustomer.email) {
          const customerWithEmail = await (ctx.db as any).customer.findFirst({
            where: { 
              email: updateData.email,
              id: { not: input.id }
            },
          });

          if (customerWithEmail) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Customer with this email already exists',
            });
          }
        }

        const customer = await (ctx.db as any).customer.update({
          where: { id: input.id },
          data: updateData,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return customer;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating customer:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update customer',
        });
      }
    }),

  // Delete a customer
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can delete customers
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can delete customers',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        const customer = await (ctx.db as any).customer.findUnique({
          where: { id: input.id },
          include: {
            _count: {
              select: {
                workOrders: true,
                invoices: true,
              },
            },
          },
        });

        if (!customer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found',
          });
        }

        // Check if customer has associated work orders or invoices
        if (customer._count.workOrders > 0 || customer._count.invoices > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete customer with existing work orders or invoices',
          });
        }

        await (ctx.db as any).customer.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error deleting customer:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete customer',
        });
      }
    }),
}); 