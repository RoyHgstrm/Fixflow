import { Suspense } from 'react';
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import DashboardClientPage from "./DashboardClientPage";
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Loader2 } from 'lucide-react';

// Enable Partial Prerendering
export const experimental_ppr = true;

// Optimize loading state
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/login");
  }

  return (
    <ErrorBoundary fallback="An unexpected error occurred while loading the dashboard">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardClientPage session={session} />
      </Suspense>
    </ErrorBoundary>
  );
}
