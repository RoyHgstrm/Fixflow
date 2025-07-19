'use client';

import { motion } from 'framer-motion';
import { Target, DollarSign, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomSession } from '@/lib/providers/session-provider';
import { WorkOrderStats, PaginatedResponse, WorkOrderResponse } from '@/lib/types';
import { getTimeOfDay } from '@/lib/utils';

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

export default function SoloOperatorDashboard({
  session,
  workOrderStats,
  recentWorkOrders,
  onRefetch,
}: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  onRefetch: () => void;
  isLoading: boolean;
}) {
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
              Good {getTimeOfDay()}, {session?.user?.name || session?.user?.email || 'there'}!
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