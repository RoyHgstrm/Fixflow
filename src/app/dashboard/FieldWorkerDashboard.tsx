'use client';

import { motion } from 'framer-motion';
import { Target, Wrench, CheckCircle, TrendingUp, FileText } from 'lucide-react';
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

export default function FieldWorkerDashboard({
  session,
  workOrderStats,
  recentWorkOrders,
  onRefetch,
  isLoading,
}: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  onRefetch: () => void;
  isLoading: boolean;
}) {
  const timeOfDay = getTimeOfDay();
  const userName = session.user.name || 'Technician';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-8"
    >
      <motion.h1 
        variants={cardVariants} 
        className="text-4xl font-bold text-foreground"
      >
        {timeOfDay}, {userName}
      </motion.h1>

      <motion.div 
        variants={cardVariants} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Work Order Stats Cards */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrderStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {workOrderStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Jobs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrderStats?.assigned || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to start
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrderStats?.inProgress || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrderStats?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs finished
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Work Orders */}
      <motion.div variants={cardVariants}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkOrders?.items?.length ? (
              <ul className="space-y-2">
                {recentWorkOrders.items.map((workOrder) => (
                  <li 
                    key={workOrder.id} 
                    className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium">{workOrder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {workOrder.customer?.name || 'No Customer'}
                      </p>
                    </div>
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent work orders
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 