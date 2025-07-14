import { z } from "zod";
import { InvoiceStatus, UserRole } from "~/lib/types";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Input schemas
const invoiceCreateSchema = z.object({
  number: z.string().min(1, "Invoice number is required"),
  amount: z.number().positive("Amount must be positive"),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  customerId: z.string().min(1, "Customer is required"),
  workOrderId: z.string().optional(),
  dueDate: z.date(),
  notes: z.string().optional(),
});

const invoiceUpdateSchema = z.object({
  id: z.string(),
  number: z.string().optional(),
  amount: z.number().positive().optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  status: z.enum(["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  dueDate: z.date().optional(),
  paidDate: z.date().optional(),
  notes: z.string().optional(),
});

const invoiceFilterSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export const invoiceRouter = createTRPCRouter({
  // Get all invoices with filtering and pagination
  getAll: protectedProcedure
    .input(invoiceFilterSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, customerId, search } = input;
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role and filters
        const where: any = {};

        // Role-based filtering
        if (userRole === UserRole.CLIENT) {
          // Clients can only see invoices for customers they created
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          // Technicians can see invoices for work orders assigned to them
          where.workOrder = {
            assignedToId: userId
          };
        }
        // Admins can see all invoices

        // Apply additional filters
        if (status) {
          where.status = status;
        }
        if (customerId) {
          where.customerId = customerId;
        }
        if (search) {
          where.OR = [
            { number: { contains: search, mode: 'insensitive' } },
            { customer: { name: { contains: search, mode: 'insensitive' } } },
            { notes: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Handle cursor-based pagination
        const cursorOptions = cursor ? { cursor: { id: cursor }, skip: 1 } : {};

        const invoices = await (ctx.db as any).invoice.findMany({
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
            workOrder: {
              select: {
                id: true,
                title: true,
                status: true,
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
          orderBy: { createdAt: 'desc' },
          take: limit + 1, // Take one extra to check if there are more
          ...cursorOptions,
        });

        let nextCursor: string | undefined = undefined;
        if (invoices.length > limit) {
          const nextItem = invoices.pop();
          nextCursor = nextItem!.id;
        }

        return {
          invoices,
          nextCursor,
        };
      } catch (error) {
        console.error('Error fetching invoices:', error);
        // Return empty result if database fails
        return {
          invoices: [],
          nextCursor: undefined,
        };
      }
    }),

  // Get invoice statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        // Build where clause based on role
        const where: any = {};
        
        if (userRole === UserRole.CLIENT) {
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          where.workOrder = {
            assignedToId: userId
          };
        }

        const [total, draft, pending, paid, overdue, cancelled] = await Promise.all([
          (ctx.db as any).invoice.count({ where }),
          (ctx.db as any).invoice.count({ where: { ...where, status: 'DRAFT' } }),
          (ctx.db as any).invoice.count({ where: { ...where, status: 'PENDING' } }),
          (ctx.db as any).invoice.count({ where: { ...where, status: 'PAID' } }),
          (ctx.db as any).invoice.count({ where: { ...where, status: 'OVERDUE' } }),
          (ctx.db as any).invoice.count({ where: { ...where, status: 'CANCELLED' } }),
        ]);

        const totalAmountResult = await (ctx.db as any).invoice.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        });

        const paidAmountResult = await (ctx.db as any).invoice.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { total: true },
        });

        const pendingAmountResult = await (ctx.db as any).invoice.aggregate({
          where: { ...where, status: { in: ['PENDING', 'OVERDUE'] } },
          _sum: { total: true },
        });

        return {
          total,
          draft,
          pending,
          paid,
          overdue,
          cancelled,
          totalAmount: totalAmountResult._sum.total || 0,
          paidAmount: paidAmountResult._sum.total || 0,
          pendingAmount: pendingAmountResult._sum.total || 0,
        };
      } catch (error) {
        console.error('Error fetching invoice stats:', error);
        // Return default stats if database fails
        return {
          total: 0,
          draft: 0,
          pending: 0,
          paid: 0,
          overdue: 0,
          cancelled: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }
    }),

  // Get a single invoice by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        const where: any = { id: input.id };

        // Role-based access control
        if (userRole === UserRole.CLIENT) {
          where.customer = { createdById: userId };
        } else if (userRole === UserRole.TECHNICIAN) {
          where.workOrder = {
            assignedToId: userId
          };
        }

        const invoice = await (ctx.db as any).invoice.findFirst({
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
            workOrder: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                scheduledDate: true,
                completedDate: true,
                location: true,
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

        if (!invoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          });
        }

        return invoice;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching invoice:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch invoice',
        });
      }
    }),

  // Create a new invoice
  create: protectedProcedure
    .input(invoiceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can create invoices
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can create invoices',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice || !(ctx.db as any).customer) {
          throw new Error('Database models not available');
        }

        // Verify customer exists
        const customer = await (ctx.db as any).customer.findUnique({
          where: { id: input.customerId },
        });

        if (!customer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customer not found',
          });
        }

        // Verify work order exists if provided
        if (input.workOrderId) {
          const workOrder = await (ctx.db as any).workOrder.findUnique({
            where: { id: input.workOrderId },
          });

          if (!workOrder) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Work order not found',
            });
          }
        }

        // Check if invoice number already exists
        const existingInvoice = await (ctx.db as any).invoice.findFirst({
          where: { number: input.number },
        });

        if (existingInvoice) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Invoice number already exists',
          });
        }

        // Calculate total
        const subtotal = input.amount;
        const taxAmount = input.tax;
        const discountAmount = input.discount;
        const total = subtotal + taxAmount - discountAmount;

        const invoice = await (ctx.db as any).invoice.create({
          data: {
            ...input,
            total,
            status: InvoiceStatus.DRAFT,
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
            workOrder: {
              select: {
                id: true,
                title: true,
                status: true,
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

        return invoice;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating invoice:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invoice',
        });
      }
    }),

  // Update an existing invoice
  update: protectedProcedure
    .input(invoiceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can update invoices
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can update invoices',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        // Check if invoice exists
        const existingInvoice = await (ctx.db as any).invoice.findUnique({
          where: { id: input.id },
        });

        if (!existingInvoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          });
        }

        // Check if invoice number is being changed and if it already exists
        if (input.number && input.number !== existingInvoice.number) {
          const invoiceWithNumber = await (ctx.db as any).invoice.findFirst({
            where: { 
              number: input.number,
              id: { not: input.id }
            },
          });

          if (invoiceWithNumber) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Invoice number already exists',
            });
          }
        }

        const updateData: any = { ...input };
        delete updateData.id; // Remove id from update data

        // Recalculate total if amount, tax, or discount changed
        if (updateData.amount || updateData.tax || updateData.discount) {
          const amount = updateData.amount ?? existingInvoice.amount;
          const tax = updateData.tax ?? existingInvoice.tax;
          const discount = updateData.discount ?? existingInvoice.discount;
          updateData.total = amount + tax - discount;
        }

        // If status is being set to PAID, set paidDate
        if (updateData.status === InvoiceStatus.PAID && !updateData.paidDate) {
          updateData.paidDate = new Date();
        }

        const invoice = await (ctx.db as any).invoice.update({
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
            workOrder: {
              select: {
                id: true,
                title: true,
                status: true,
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

        return invoice;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating invoice:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update invoice',
        });
      }
    }),

  // Delete an invoice
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can delete invoices
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can delete invoices',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        const invoice = await (ctx.db as any).invoice.findUnique({
          where: { id: input.id },
        });

        if (!invoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          });
        }

        // Don't allow deletion of paid invoices
        if (invoice.status === InvoiceStatus.PAID) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Cannot delete paid invoices',
          });
        }

        await (ctx.db as any).invoice.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error deleting invoice:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete invoice',
        });
      }
    }),

  // Mark invoice as paid
  markAsPaid: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      paidDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session.user as any).role || UserRole.ADMIN;

      // Only admins can mark invoices as paid
      if (userRole !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can mark invoices as paid',
        });
      }

      try {
        // Check if database models are available
        if (!ctx.db || !(ctx.db as any).invoice) {
          throw new Error('Database models not available');
        }

        const invoice = await (ctx.db as any).invoice.findUnique({
          where: { id: input.id },
        });

        if (!invoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          });
        }

        if (invoice.status === InvoiceStatus.PAID) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Invoice is already paid',
          });
        }

        const updatedInvoice = await (ctx.db as any).invoice.update({
          where: { id: input.id },
          data: {
            status: InvoiceStatus.PAID,
            paidDate: input.paidDate || new Date(),
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return updatedInvoice;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error marking invoice as paid:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark invoice as paid',
        });
      }
    }),
}); 