'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  BarChart2, 
  Calendar 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomSession } from '@/lib/providers/session-provider';
import { 
  WorkOrderStats, 
  PaginatedResponse, 
  WorkOrderResponse, 
  ReportsStats, 
  CustomerStats 
} from '@/lib/types';
import { getTimeOfDay } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export default function TeamManagerDashboard({
  session,
  workOrderStats,
  customerStats,
  recentWorkOrders,
  teamStats,
  onRefetch,
  isLoading,
}: {
  session: CustomSession;
  workOrderStats?: WorkOrderStats;
  customerStats?: CustomerStats;
  recentWorkOrders?: PaginatedResponse<WorkOrderResponse>;
  teamStats?: ReportsStats;
  onRefetch: () => void;
  isLoading: boolean;
}) {
  const timeOfDay = getTimeOfDay();
  const userName = session.user.name || 'Team Manager';

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

      {/* Key Performance Metrics */}
      <motion.div 
        variants={cardVariants} 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Work Order Stats */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
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

        {/* Customer Stats */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerStats?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {customerStats?.residential || 0} residential
            </p>
          </CardContent>
        </Card>

        {/* Revenue Stats */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{teamStats?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamStats?.totalRevenue ? 
                (teamStats.totalRevenue / 1000).toFixed(1) + 'k' : 
                '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Work order completion
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Work Orders and Quick Actions */}
      <motion.div 
        variants={cardVariants} 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Recent Work Orders */}
        <Card className="glass lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Work Orders</CardTitle>
            <Link href="/dashboard/work-orders">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {workOrder.status}
                      </span>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
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

        {/* Quick Actions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/work-orders" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" /> Schedule Work Orders
              </Button>
            </Link>
            <Link href="/dashboard/customers" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" /> Manage Customers
              </Button>
            </Link>
            <Link href="/dashboard/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart2 className="mr-2 h-4 w-4" /> View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
} 