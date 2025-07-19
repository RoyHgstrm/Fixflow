import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type UserRole, USER_ROLES, type UserWithRole } from "@/lib/types";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

const checkUserAccess = (userRole: UserRole, allowedRoles: UserRole[]) => {
  return allowedRoles.includes(userRole);
};

// Input schemas
const updateUserProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  image: z.string().url().optional().nullable(),
});

const updateCompanyInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url().optional().nullable(),
  industry: z.string().optional(),
});

const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  workOrderUpdates: z.boolean(),
  teamUpdates: z.boolean(),
  systemUpdates: z.boolean(),
  marketingEmails: z.boolean(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const userRouter = createTRPCRouter({
  // Get current user details
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userProfile = await ctx.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        company: { 
          select: { 
            id: true, 
            name: true, 
            planType: true, 
            subscriptionStatus: true, 
            trialEndDate: true 
          } 
        },
      },
    });

    if (!userProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User profile not found" });
    }

    return userProfile;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        jobTitle: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const updatedUser = await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            name: input.name,
            email: input.email,
            jobTitle: input.jobTitle,
          },
        });

        return updatedUser;
      } catch (error) {
        console.error("Failed to update user profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
    }),

  // Update company information
  updateCompany: protectedProcedure
    .input(updateCompanyInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role;
      const companyId = ctx.session.user.companyId;

      if (!companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not associated with user",
        });
      }

      // Only OWNER and MANAGER can update company info
      if (![UserRole.OWNER, UserRole.MANAGER].includes(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update company information",
        });
      }

      try {
        const updatedCompany = await ctx.prisma.company.update({
          where: { id: companyId },
          data: input,
        });

        return updatedCompany;
      } catch (error) {
        console.error("Error updating company information:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update company information",
        });
      }
    }),

  // Update notification settings
  updateNotifications: protectedProcedure
    .input(updateNotificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const existingSettings = await ctx.prisma.userNotificationSettings.findUnique({
          where: { userId: userId },
        });

        let updatedSettings;
        if (existingSettings) {
          updatedSettings = await ctx.prisma.userNotificationSettings.update({
            where: { userId: userId },
            data: input,
          });
        } else {
          updatedSettings = await ctx.prisma.userNotificationSettings.create({
            data: { userId: userId, ...input },
          });
        }

        return updatedSettings;
      } catch (error) {
        console.error("Error updating notification settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update notification settings",
        });
      }
    }),

  // Change user password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const { data, error } = await ctx.prisma.user.update({
          where: { id: userId },
          data: { password: input.newPassword },
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to change password in Supabase Auth",
          });
        }

        return { success: true, message: "Password changed successfully" };
      } catch (error) {
        console.error("Error changing password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message || "Failed to change password",
        });
      }
    }),

  // Change user role (admin/owner only)
  changeUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        newRole: z.nativeEnum(USER_ROLES), // Use USER_ROLES for validation
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserRole = ctx.session.user.role || USER_ROLES.EMPLOYEE;
      const currentCompanyId = ctx.session.user.companyId;

      // Only OWNER or ADMIN can change user roles
      if (!checkUserAccess(currentUserRole, [USER_ROLES.OWNER, USER_ROLES.ADMIN])) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
      }

      try {
        const userToUpdate = await ctx.prisma.user.findUnique({
          where: { id: input.userId, companyId: currentCompanyId },
        });

        if (!userToUpdate) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found in this company" });
        }

        // Prevent changing own role or owner's role by non-owner admin
        if (userToUpdate.id === ctx.session.user.id && currentUserRole !== USER_ROLES.OWNER) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change your own role" });
        }
        if (userToUpdate.role === USER_ROLES.OWNER && currentUserRole !== USER_ROLES.OWNER) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can change another owner's role" });
        }

        const updatedUser = await ctx.prisma.user.update({
          where: { id: input.userId },
          data: { role: input.newRole },
        });

        return updatedUser;
      } catch (error) {
        console.error("Failed to change user role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change user role",
        });
      }
    }),
});

export default userRouter; 