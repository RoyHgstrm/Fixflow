import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
  // Get current session information
  getSession: protectedProcedure
    .query(async ({ ctx }) => {
      // Return the current session details
      return {
        user: {
          id: ctx.session.user.id,
          name: ctx.session.user.name,
          email: ctx.session.user.email,
          image: ctx.session.user.image,
          role: ctx.session.user.role,
          companyId: ctx.session.user.companyId,
        },
      };
    }),

  // Check if a user is authenticated
  isAuthenticated: publicProcedure
    .query(({ ctx }) => {
      return { authenticated: !!ctx.session?.user };
    }),

  // Validate user permissions
  checkPermissions: protectedProcedure
    .input(z.object({
      requiredRoles: z.array(z.enum(['OWNER', 'MANAGER', 'ADMIN', 'EMPLOYEE', 'TECHNICIAN', 'CLIENT'])).optional(),
    }))
    .query(({ ctx, input }) => {
      const userRole = ctx.session.user.role;

      // If no roles specified, just confirm authentication
      if (!input.requiredRoles || input.requiredRoles.length === 0) {
        return { hasPermission: true };
      }

      // Check if user's role is in the required roles
      const hasPermission = input.requiredRoles.includes(userRole);

      if (!hasPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        });
      }

      return { hasPermission: true };
    }),
}); 