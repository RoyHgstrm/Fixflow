'use client';

import { useEffect, useState, Suspense } from 'react';
import { CustomSession, type UserRole, USER_ROLES, WorkOrderStats, CustomerStats, ReportsStats, PaginatedResponse, WorkOrderResponse, CustomerWithRelations } from '@/lib/types';
import { fetchDashboardData } from '@/app/dashboard/dashboard-server-actions';
import { Loader2 } from 'lucide-react';
import SoloOperatorDashboard from '@/app/dashboard/SoloOperatorDashboard';
import FieldWorkerDashboard from '@/app/dashboard/FieldWorkerDashboard';
import TeamManagerDashboard from '@/app/dashboard/TeamManagerDashboard';


export default function DashboardClientPage({ session }: { session: CustomSession }) {
  const [dashboardData, setDashboardData] = useState<{
    workOrders?: PaginatedResponse<WorkOrderResponse> | null;
    customers?: PaginatedResponse<CustomerWithRelations> | null;
    stats?: ReportsStats | null;
    customerStats?: CustomerStats | null; // Add customerStats
    workOrderStats?: WorkOrderStats | null; // Add workOrderStats
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userRole: UserRole = (session?.user?.role || USER_ROLES.CLIENT) as UserRole;

  const fetchAndSetDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardData(session.user.id, userRole);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetDashboardData();
  }, [session.user.id, userRole]);

  const dashboardProps = {
    session,
    workOrderStats: dashboardData?.workOrderStats || null,
    recentWorkOrders: dashboardData?.workOrders || null,
    customerStats: dashboardData?.customerStats || null,
    teamStats: dashboardData?.stats || null,
    onRefetch: fetchAndSetDashboardData,
    isLoading,
  };

  let DashboardComponent: React.ComponentType<any> = SoloOperatorDashboard;

  switch (userRole) {
  case USER_ROLES.OWNER:
  case USER_ROLES.MANAGER:
  case USER_ROLES.ADMIN:
    DashboardComponent = TeamManagerDashboard;
    break;
  case USER_ROLES.TECHNICIAN:
  case USER_ROLES.EMPLOYEE:
  case USER_ROLES.FIELD_WORKER:
    DashboardComponent = FieldWorkerDashboard;
    break;
  case USER_ROLES.SOLO:
    DashboardComponent = SoloOperatorDashboard;
    break;
  case USER_ROLES.CLIENT:
  default:
    // Default to SoloOperatorDashboard or a generic client dashboard
    DashboardComponent = SoloOperatorDashboard;
    break;
  }

  return (
    <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-primary" />}>
      <DashboardComponent {...dashboardProps} />
    </Suspense>
  );
}
