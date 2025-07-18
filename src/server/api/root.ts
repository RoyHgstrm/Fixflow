import { createTRPCRouter } from "@/server/api/trpc";
import { postRouter } from "./routers/post";
import { customerRouter } from "./routers/customer";
import { workOrderRouter } from "./routers/workOrder";
import { invoiceRouter } from "./routers/invoice";
import { teamRouter } from "./routers/team";
import { reportsRouter } from "./routers/reports";
import { userRouter } from "./routers/user";
import { companyRouter } from "./routers/company";
import { billingRouter } from "./routers/billing";
import { authRouter } from "./routers/auth";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  customer: customerRouter,
  workOrder: workOrderRouter,
  invoice: invoiceRouter,
  team: teamRouter,
  reports: reportsRouter,
  user: userRouter,
  company: companyRouter,
  billing: billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
