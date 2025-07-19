'use client';

import { useState } from 'react';
import { 
  type WorkOrderType,
  type WorkOrderResponse, 
  type WorkOrderStats,
  type PaginatedResponse,
  UserRole,
  getUserExperience,
  UserExperience,
  WorkOrderStatus,
  type CustomerBase,
} from '@/lib/types';
import { api } from '@/trpc/react';
import { usePageTitle } from '@/lib/hooks/use-page-title';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Target, DollarSign, CheckCircle, TrendingUp, Calendar, FileText, Users, Loader2, RefreshCw } from 'lucide-react';
import { type inferProcedureOutput } from '@trpc/server';
import { type AppRouter } from '@/server/api/root';
import { Badge } from '@/components/ui/badge';
import { CustomSession } from '@/lib/providers/session-provider';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  },
};

/**
 * Returns time-appropriate greeting based on local time
 * Handles edge cases and midnight/noon properly
 */
/**
 * Returns time-appropriate greeting based on local time
 * Handles all 24 hours with precise time slot boundaries
 */
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  
  // Ordered time periods covering all 24 hours without overlaps
  const timeSlots = [
    { condition: (h: number) => h >= 5 && h <= 11, period: 'Morning' },    // 5:00 AM - 11:59 AM
    { condition: (h: number) => h >= 12 && h <= 16, period: 'Afternoon' }, // 12:00 PM - 4:59 PM
    { condition: (h: number) => h >= 17 && h <= 20, period: 'Evening' },   // 5:00 PM - 8:59 PM
    { condition: (h: number) => h >= 21 || h <= 4, period: 'Night' }       // 9:00 PM - 4:59 AM
  ];

  // Find the first matching time slot (using explicit type annotation)
  return timeSlots.find(slot => slot.condition(hour))?.period ?? 'Day';
};

function getTodaysIncome(recentWorkOrders?: PaginatedResponse<WorkOrderResponse>) {
  const today = new Date();
  const todaysCompleted = recentWorkOrders?.items?.filter((job) => {
    const jobDate = new Date(job.scheduledDate ?? job.createdAt);
    return jobDate.toDateString() === today.toDateString();
  }) ?? [];

  return todaysCompleted.reduce((sum, order) => sum + (order.amount ?? 0), 0).toFixed(2);
}

function getStatusColor(status: WorkOrderStatus) {
  switch (status) {
  case 'COMPLETED':
    return 'bg-green-100 text-green-800';
  case 'IN_PROGRESS':
    return 'bg-blue-100 text-blue-800';
  case 'PENDING':
    return 'bg-yellow-100 text-yellow-800';
  case 'CANCELLED':
    return 'bg-red-100 text-red-800';
  default:
    return 'bg-gray-100 text-gray-800';
  }
}

// Solo Operator Dashboard - Simple task list + income tracker
function SoloOperatorDashboard(props: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  customerStats?: any;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  isLoading: boolean;
  onRefetch: () => void;
}) {
  const { session, workOrderStats, recentWorkOrders, isLoading, onRefetch } = props;

  // Filter today's jobs
  const todaysJobs = recentWorkOrders?.items?.filter((job) => {
    const today = new Date();
    const jobDate = new Date(job.scheduledDate ?? job.createdAt);
    return jobDate.toDateString() === today.toDateString();
  }) ?? [];

  // Calculate today's income
  const todaysIncome = todaysJobs
    .filter((job) => job.status === 'COMPLETED')
    .reduce((sum: number, job) => sum + (job.amount ?? 0), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Welcome Header - Personal */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient mb-2">
              Good {getTimeOfDay()}, {session?.user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {todaysJobs.length === 0 
                ? "No tasks scheduled for today. Time to grow your business!" 
                : `You have ${todaysJobs.length} ${todaysJobs.length === 1 ? 'task' : 'tasks'} today`}
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Work Orders */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrderStats?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {workOrderStats?.totalValue !== undefined && workOrderStats.totalValue !== null ? `€${workOrderStats.totalValue.toLocaleString('fi-FI')}` : '€0'} total value
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Work Orders */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{workOrderStats?.completed ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Income */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{workOrderStats?.totalValue?.toFixed(2) ?? '0.00'}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Income */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{todaysIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Today's Jobs */}
      {todaysJobs.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Today's Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add a list or grid of today's jobs */}
              <div className="space-y-2">
                {todaysJobs.map((job) => (
                  <div key={job.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.customer?.name}</div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      job.status === 'COMPLETED' ? 'text-green-500' : 
                        job.status === 'IN_PROGRESS' ? 'text-blue-500' : 
                          'text-muted-foreground'
                    }`}>
                      {job.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// Field Worker Dashboard - Clock in/out + today's jobs
function FieldWorkerDashboard(props: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  isLoading: boolean;
  onRefetch: () => void;
}) {
  const { session, workOrderStats, recentWorkOrders, isLoading, onRefetch } = props;
  const [isClockedIn, setIsClockedIn] = useState(false);

  const todaysAssignedJobs = recentWorkOrders?.items?.filter((job) => {
    const today = new Date();
    const jobDate = new Date(job.scheduledDate ?? job.createdAt);
    return jobDate.toDateString() === today.toDateString() && job.assignedTo?.id === session?.user?.id; // Added null check
  }) ?? [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl mx-auto"
    >
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 border border-blue-500/20">
        <h1 className="text-2xl font-bold text-gradient mb-2">
          Field Worker Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Dashboard content for field workers is coming soon!
        </p>
      </motion.div>
    </motion.div>
  );
}

// Team Manager Dashboard - Overview of team performance + company metrics
function TeamManagerDashboard(props: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  customerStats?: any;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  isLoading: boolean;
  onRefetch: () => void;
}) {
  const { session, workOrderStats, customerStats, recentWorkOrders, isLoading, onRefetch } = props;

  const todaysJobs = recentWorkOrders?.items?.filter((job) => {
    const today = new Date();
    const jobDate = new Date(job.scheduledDate ?? job.createdAt);
    return jobDate.toDateString() === today.toDateString();
  }) ?? [];

  const handleRefetchManager = () => {
    onRefetch();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header - Team Manager */}
      <motion.div variants={cardVariants} className="glass rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-purple-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient mb-2">
              Good {getTimeOfDay()}, {session?.user?.name?.split(' ')[0] || 'Team Manager'}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Team performance overview and key metrics
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Work Orders */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrderStats?.total ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Work Orders */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{workOrderStats?.completed ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Customers */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerStats?.total ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {customerStats?.growth?.total?.isPositive === true ? '+' : ''}
                {customerStats?.growth?.total?.value ?? 0}% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Income */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{workOrderStats?.totalValue?.toFixed(2) ?? '0.00'}</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Work Orders and Team Performance */}
      <motion.div 
        variants={containerVariants} 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Work Orders */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Work Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentWorkOrders?.items?.length ? (
                <div className="space-y-3">
                  {recentWorkOrders.items.slice(0, 5).map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{order.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.scheduledDate ?? order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} border-none`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent work orders
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p>Average Work Order Completion Time</p>
                  <p className="font-bold">2.5 days</p>
                </div>
                <div className="flex items-center justify-between">
                  <p>New Customers This Month</p>
                  <p className="font-bold">{customerStats?.newCustomers ?? 0}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p>Active Work Orders</p>
                  <p className="font-bold">{workOrderStats?.inProgress ?? 0}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p>Total Team Productivity</p>
                  <p className="font-bold">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={cardVariants} className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={handleRefetchManager}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Data
        </Button>
        <Button 
          className="gradient-primary shadow-glow"
          onClick={() => {/* Navigate to detailed reports */}}
        >
          View Detailed Reports
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Modify the dashboard rendering logic to ensure consistent hook usage
export default function DashboardClientPage({ session }: { session: CustomSession }) {
  const userRole = session?.user?.role ?? UserRole.CLIENT; // Default to CLIENT for safety
  const userExperience = getUserExperience(userRole);

  // Set dynamic page title
  usePageTitle(userRole);

  // Fetch real data from database with default values
  const workOrderStatsQuery = api.workOrder.getStats.useQuery();
  const customerStatsQuery = api.customer.getStats.useQuery();
  const recentWorkOrdersQuery = api.workOrder.list.useQuery({ limit: 5 });

  // Default values for stats
  const workOrderStats = workOrderStatsQuery.data ?? {
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalValue: 0
  };

  const customerStats = customerStatsQuery.data ?? {
    totalCustomers: 0,
    newCustomers: 0,
    customersWithActiveWorkOrders: 0,
    averageWorkOrdersPerCustomer: 0
  };

  const recentWorkOrders = recentWorkOrdersQuery.data;

  // Debug logging
  console.log('User Role:', userRole);
  console.log('User Experience:', userExperience);
  console.log('Work Order Stats Loading:', workOrderStatsQuery.isLoading);
  console.log('Customer Stats Loading:', customerStatsQuery.isLoading);
  console.log('Recent Work Orders Loading:', recentWorkOrdersQuery.isLoading);

  const handleRefetch = () => {
    void recentWorkOrdersQuery.refetch();
    void workOrderStatsQuery.refetch();
    void customerStatsQuery.refetch();
  };

  const isLoading = workOrderStatsQuery.isLoading || 
                    customerStatsQuery.isLoading || 
                    recentWorkOrdersQuery.isLoading;

  // Consistent loading state rendering
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  // Consistent error handling
  const hasError = workOrderStatsQuery.error || 
                   customerStatsQuery.error || 
                   recentWorkOrdersQuery.error;

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-red-500">
        <p className="text-lg">Error loading dashboard data.</p>
        <p className="text-sm text-muted-foreground">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  // Render different dashboards with consistent props
  const dashboardProps = {
    session,
    workOrderStats,
    customerStats,
    recentWorkOrders,
    isLoading,
    onRefetch: handleRefetch,
  };

  switch (userExperience) {
  case UserExperience.FIELD_WORKER:
    return <FieldWorkerDashboard {...dashboardProps} />;
  case UserExperience.TEAM_MANAGER:
    return <TeamManagerDashboard {...dashboardProps} />;
  case UserExperience.SOLO_OPERATOR:
  default:
    return <SoloOperatorDashboard {...dashboardProps} />;
  }
}
