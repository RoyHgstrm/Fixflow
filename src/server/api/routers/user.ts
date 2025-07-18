import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserRole, PlanType } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabase";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

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
  emailNotifications: z.boolean().optional(),
  workOrderUpdates: z.boolean().optional(),
  teamUpdates: z.boolean().optional(),
  systemUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const userRouter = createTRPCRouter({
  // Get current user's profile and company information
  getSettingsData: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      try {
        const user = await ctx.db.user.findUnique({
          where: { id: userId },
          include: {
            company: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Mock notification settings for now, as they are not in DB schema
        const notificationSettings = {
          emailNotifications: true,
          workOrderUpdates: true,
          teamUpdates: true,
          systemUpdates: false,
          marketingEmails: false,
        };

        return {
          profile: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            jobTitle: user.jobTitle,
            image: user.image,
            role: user.role,
          },
          company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            email: user.company.email,
            phone: user.company.phone,
            address: user.company.address,
            city: user.company.city,
            state: user.company.state,
            zipCode: user.company.zipCode,
            website: user.company.website,
            industry: user.company.industry,
            planType: user.company.planType,
            subscriptionStatus: user.company.subscriptionStatus,
          } : null,
          notificationSettings,
        };
      } catch (error) {
        console.error("Error fetching user settings data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch settings data",
        });
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateUserProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const updatedUser = await ctx.db.user.update({
          where: { id: userId },
          data: input,
        });

        // Optionally update session if needed
        // await ctx.session.update({ user: { ...ctx.session.user, name: updatedUser.name, email: updatedUser.email } });

        return updatedUser;
      } catch (error) {
        console.error("Error updating user profile:", error);
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
        const updatedCompany = await ctx.db.company.update({
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

  // Update notification settings (mocked for now as no DB table)
  updateNotifications: protectedProcedure
    .input(updateNotificationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      // In a real application, you would save these to a user_settings table or similar
      console.log("Updating notification settings (mocked):");
      console.log(input);

      return { success: true, message: "Notification settings updated successfully (mocked)" };
    }),

  // Change user password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Fetch current user from Supabase Auth to verify current password (if needed by your Supabase setup)
        // Supabase's update method usually handles current password verification internally.
        // If your Supabase setup requires explicit current password validation, you might fetch user by ID
        // and then compare password hashes, or use a specific Supabase function for that.

        // Directly attempt to update password via Supabase Admin API
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: input.newPassword,
        });

        if (error) {
          console.error("Supabase password update error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to change password",
          });
        }

        return { success: true, message: "Password changed successfully" };
      } catch (error) {
        console.error("Error changing password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password",
        });
      }
    }),
}); 