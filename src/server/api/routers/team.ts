import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { z as zod } from 'zod';

// Define UserRoleEnum explicitly
const UserRoleEnum = zod.enum(['OWNER', 'MANAGER', 'EMPLOYEE', 'ADMIN', 'TECHNICIAN', 'CLIENT']);

// Comprehensive input validation schemas
const TeamInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: UserRoleEnum,
});

const TeamUpdateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: UserRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

// Helper function for role-based access control
const checkTeamManagementPermission = (userRole: UserRole): boolean => {
  const allowedRoles: UserRole[] = ['OWNER', 'MANAGER', 'ADMIN'];
  return allowedRoles.includes(userRole);
};

export const teamRouter = createTRPCRouter({
  invite: protectedProcedure
    .input(TeamInviteSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      // Strict role-based access control
      if (!checkTeamManagementPermission(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to invite team members',
        });
      }

      try {
        // Check if user is already in the company
        const existingUser = await ctx.db.user.findUnique({
          where: { 
            email: input.email,
            companyId: user.companyId 
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already in the company',
          });
        }

        // Create team invitation with comprehensive validation
        const invitation = await ctx.db.companyInvitation.create({
          data: {
            email: input.email,
            role: input.role,
            companyId: user.companyId,
            invitedById: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: 'PENDING',
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            expiresAt: true,
          },
        });

        return invitation;
      } catch (error) {
        console.error('Team invitation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invite team member',
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),

  updateMember: protectedProcedure
    .input(TeamUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user;

      // Strict role-based access control
      if (!checkTeamManagementPermission(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update team members',
        });
      }

      try {
        // Validate user belongs to the same company
        const targetUser = await ctx.db.user.findUnique({
          where: { 
            id: input.userId,
            companyId: user.companyId 
          },
        });

        if (!targetUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found in your company',
          });
        }

        // Prevent role downgrade for higher-level roles
        if (input.role && !checkTeamManagementPermission(user.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot change team member roles',
          });
        }

        const updatedUser = await ctx.db.user.update({
          where: { id: input.userId },
          data: {
            role: input.role,
            isActive: input.isActive,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

        return updatedUser;
      } catch (error) {
        console.error('Team member update error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update team member',
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        role: UserRoleEnum.optional(),
        status: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user;

      // Strict role-based access control
      if (!checkTeamManagementPermission(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view team members',
        });
      }

      try {
        const teamMembers = await ctx.db.user.findMany({
          where: {
            companyId: user.companyId,
            ...(input.role && { role: input.role }),
            ...(input.status !== undefined && { isActive: input.status }),
            ...(input.search && {
              OR: [
                { name: { contains: input.search, mode: 'insensitive' } },
                { email: { contains: input.search, mode: 'insensitive' } },
              ],
            }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
          take: input.limit,
        });

        return teamMembers;
      } catch (error) {
        console.error('Team members retrieval error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve team members',
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        role: UserRoleEnum.optional(),
        status: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user;

      // Strict role-based access control
      if (!checkTeamManagementPermission(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view team statistics',
        });
      }

      try {
        const teamStats = await ctx.db.user.groupBy({
          by: ['role', 'isActive'],
          where: {
            companyId: user.companyId,
            ...(input?.role && { role: input.role }),
            ...(input?.status !== undefined && { isActive: input.status }),
          },
          _count: {
            id: true,
          },
        });

        const totalTeamMembers = await ctx.db.user.count({
          where: {
            companyId: user.companyId,
            ...(input?.role && { role: input.role }),
            ...(input?.status !== undefined && { isActive: input.status }),
          },
        });

        return {
          stats: teamStats.map(stat => ({
            role: stat.role,
            isActive: stat.isActive,
            count: stat._count.id,
          })),
          total: totalTeamMembers,
        };
      } catch (error) {
        console.error('Team statistics retrieval error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve team statistics',
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
}); 