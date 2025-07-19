import { createTRPCRouter } from "./trpc";
import { customerRouter } from "./routers/customer";
import { userRouter } from "./routers/user";
import { workOrderRouter } from "./routers/workOrder";
import { companyRouter } from "./routers/company";
import { billingRouter } from "./routers/billing";
import { reportsRouter } from "./routers/reports";

export const appRouter = createTRPCRouter({
  customer: customerRouter,
  user: userRouter,
  workOrder: workOrderRouter,
  company: companyRouter,
  billing: billingRouter,
  reports: reportsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
