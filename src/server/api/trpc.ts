/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { type UserRole, USER_ROLES, CustomSession, PlanType, SubscriptionStatus } from "@/lib/types";

interface CreateContextOptions {
  headers: Headers;
}

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  let userSession: CustomSession | null = null;

  if (session?.user?.id) {
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
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
            trialEndDate: true,
          },
        },
      },
    });

    if (userProfile) {
      userSession = {
        user: {
          id: userProfile.id,
          email: userProfile.email || undefined,
          name: userProfile.name || undefined,
          role: userProfile.role,
          companyId: userProfile.companyId,
          company: userProfile.company ? {
            id: userProfile.company.id,
            name: userProfile.company.name,
            planType: userProfile.company.planType,
            subscription: {
              status: userProfile.company.subscriptionStatus,
              trial_end: userProfile.company.trialEndDate?.toISOString() || null,
            },
          } : undefined,
        },
        role: userProfile.role,
        expires: session.expires_at?.toString() || undefined,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      };
    }
  }

  return {
    session: userSession,
    prisma, 
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user || !ctx.session.user.role) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  const userRole: UserRole = ctx.session.user.role;

  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: ctx.session.user,
        userRole: userRole,
      },
    },
  });
});
