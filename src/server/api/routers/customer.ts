import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  type CustomerWithRelations,
  type PaginatedResponse,
  USER_ROLES, // Import USER_ROLES from here
  UserRole // Import UserRole type from here
} from "@/lib/types";
import { CustomerType } from '@prisma/client'; // Import CustomerType from Prisma
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

const listCustomersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
  type: z.nativeEnum(CustomerType).optional().nullable(),
  search: z.string().optional().nullable(),
});

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  type: z.nativeEnum(CustomerType).default(CustomerType.RESIDENTIAL),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

const updateCustomerSchema = z.object({
  id: z.string().min(1, "Customer ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  type: z.nativeEnum(CustomerType).optional(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const customerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listCustomersSchema)
    .query(async ({ ctx, input }) => {
      const { limit = 50, cursor, type, search } = input;
      const { user } = ctx.session;

      if (!user || !user.companyId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const where: Record<string, unknown> = { 
        companyId: user.companyId 
      };

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const customers = await ctx.prisma.customer.findMany({
        where,
        take: limit + 1,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { workOrders: true, invoices: true }
          }
        }
      });

      let nextCursor: string | undefined;
      if (customers.length > limit) {
        const lastCustomer = customers.pop();
        nextCursor = lastCustomer?.id;
      }

      return {
        items: customers,
        nextCursor,
        hasMore: !!nextCursor
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const userRole = user.role || USER_ROLES.EMPLOYEE;
      const companyId = user.companyId;

      if (!companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User does not belong to a company" });
      }

      try {
        const where: any = {
          id: input.id,
          companyId: companyId,
        };

        if (userRole === USER_ROLES.SOLO) {
          where.createdById = user.id;
        } else if (userRole === USER_ROLES.CLIENT) {
          where.id = user.id;
        }

        const customer = await ctx.prisma.customer.findUnique({
          where,
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
            notes: true,
            latitude: true,
            longitude: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            companyId: true,
            createdBy: { select: { id: true, name: true, email: true } },
            workOrders: { include: { assignedTo: true, customer: true, createdBy: true } },
            invoices: { include: { customer: true, workOrder: true } },
          },
        });

        if (!customer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }

        if ((userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) &&
            !customer.workOrders?.some(wo => wo.assignedToId === user.id)) {
        }

        return customer;
      } catch (error) {
        console.error("Failed to fetch customer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customer",
        });
      }
    }),

  create: protectedProcedure
    .input(createCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      if (!user || !user.companyId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.customer.create({
        data: {
          ...input,
          companyId: user.companyId,
          createdById: user.id,
        }
      });
    }),

  update: protectedProcedure
    .input(updateCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session?.user?.role || USER_ROLES.EMPLOYEE;
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User does not belong to a company" });
      }

      const allowedRoles: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SOLO, USER_ROLES.TEAM];
      if (!allowedRoles.includes(userRole as UserRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to update customers" });
      }

      try {
        const existingCustomer = await ctx.prisma.customer.findUnique({
          where: {
            id: input.id,
            companyId: companyId,
          },
        });

        if (!existingCustomer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }

        const updatedCustomer = await ctx.prisma.customer.update({
          where: { id: input.id },
          data: input,
        });

        return updatedCustomer;
      } catch (error) {
        console.error("Failed to update customer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update customer",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userRole = ctx.session?.user?.role || USER_ROLES.EMPLOYEE;
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User does not belong to a company" });
      }

      const allowedRoles: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.SOLO, USER_ROLES.TEAM];
      if (!allowedRoles.includes(userRole as UserRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to delete customers" });
      }

      try {
        const existingCustomer = await ctx.prisma.customer.findUnique({
          where: {
            id: input.id,
            companyId: companyId,
          },
        });

        if (!existingCustomer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }

        await ctx.prisma.customer.delete({ where: { id: input.id } });
        return { id: input.id };
      } catch (error) {
        console.error("Failed to delete customer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete customer",
        });
      }
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx.session;

      if (!user || !user.companyId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const customerStats = await ctx.prisma.customer.groupBy({
        by: ['type'],
        where: { companyId: user.companyId },
        _count: {
          id: true
        }
      });

      const totalCustomers = customerStats.reduce((sum, stat) => sum + stat._count.id, 0);

      const stats = {
        totalCustomers,
        residential: customerStats.find(stat => stat.type === CustomerType.RESIDENTIAL)?._count.id || 0,
        commercial: customerStats.find(stat => stat.type === CustomerType.COMMERCIAL)?._count.id || 0,
        industrial: customerStats.find(stat => stat.type === CustomerType.INDUSTRIAL)?._count.id || 0,
      };

      return stats;
    }),
});

export default customerRouter; 