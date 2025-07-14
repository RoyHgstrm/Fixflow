'use client';

import { motion } from 'framer-motion';
import { type Session } from 'next-auth';
import { LayoutDashboard, TrendingUp, Clock, CheckCircle, Users, DollarSign, FileText, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, type RouterOutputs } from '~/trpc/react';
import { type WorkOrderWithRelations, type CustomerWithRelations, type InvoiceWithRelations } from '~/lib/types';

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

export default function DashboardClientPage({ session }: { session: Session }) {
  // Fetch real data from database
  const { data: workOrderStats, isLoading: workOrderStatsLoading, error: workOrderStatsError } = api.workOrder.getStats.useQuery();
  const { data: customerStats, isLoading: customerStatsLoading, error: customerStatsError } = api.customer.getStats.useQuery();
  const { data: recentWorkOrders, isLoading: recentWorkOrdersLoading } = api.workOrder.getAll.useQuery({
    limit: 5,
  });

  // Calculate dashboard statistics
  const statsData: {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    isLoading: boolean;
  }[] = [
    {
      title: 'Active Jobs',
      value: ((workOrderStats?.pending ?? 0) + (workOrderStats?.inProgress ?? 0)).toString(),
      change: (workOrderStats?.inProgress ?? 0) > 0 ? `${workOrderStats?.inProgress ?? 0} in progress` : 'Loading...', 
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      isLoading: workOrderStatsLoading,
    },
    {
      title: 'Completed Today',
      value: (workOrderStats?.completed ?? 0).toString(),
      change: (workOrderStats?.completed ?? 0) > 0 ? 'Recently completed' : 'No completed jobs',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      isLoading: workOrderStatsLoading,
    },
    {
      title: 'Total Customers',
      value: (customerStats?.total ?? 0).toString(),
      change: `${customerStats?.commercial ?? 0} commercial`,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      isLoading: customerStatsLoading,
    },
    {
      title: 'Revenue Total',
      value: `$${(workOrderStats?.totalValue ?? 0).toLocaleString()}`,
      change: (workOrderStats?.totalValue ?? 0) > 0 ? 'Total project value' : 'No revenue recorded',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      isLoading: workOrderStatsLoading,
    },
  ];

  // Get recent activities from work orders
  const recentActivities: (
    RouterOutputs["workOrder"]["getAll"]["workOrders"][number] & { time: string; customer: string; } 
  )[] = (recentWorkOrders?.workOrders ?? []).slice(0, 3).map((workOrder: RouterOutputs["workOrder"]["getAll"]["workOrders"][number]) => ({
    id: workOrder.id,
    title: workOrder.title,
    time: getRelativeTime(workOrder.updatedAt),
    status: workOrder.status,
    customer: workOrder.customer?.name ?? 'Unknown Customer',
    priority: workOrder.priority,
  }));

  // Helper function to get relative time
  function getRelativeTime(date: string | Date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  // Loading state
  if (workOrderStatsLoading || customerStatsLoading || recentWorkOrdersLoading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Header */}
        <motion.div variants={cardVariants} className="glass rounded-xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="w-16 h-16 bg-muted animate-pulse rounded-xl" />
          </div>
        </motion.div>

        {/* Stats Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index: number) => (
            <Card key={index} className="glass">
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (workOrderStatsError || customerStatsError) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              {workOrderStatsError?.message ?? customerStatsError?.message ?? 'Failed to load dashboard data. Please try again.'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="gradient-primary"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={cardVariants} className="glass rounded-xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Welcome back, {session.user.name ?? session.user.email}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:block"
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index: number) => (
          <motion.div key={stat.title} variants={cardVariants} custom={index}>
            <Card className={`glass hover:shadow-glow transition-all duration-300 border ${stat.borderColor} group cursor-pointer`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    {stat.isLoading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    <p className={`text-xs ${stat.color} flex items-center mt-1`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.isLoading ? (
                        <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        stat.change
                      )}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:shadow-glow transition-all duration-300`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card className="glass border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity: RouterOutputs["workOrder"]["getAll"]["workOrders"][number] & { time: string; customer: string }, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {activity.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{activity.time}</span>
                          <span>•</span>
                          <span>{activity.customer}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'COMPLETED'
                              ? 'bg-green-500/10 text-green-500'
                              : activity.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/10 text-blue-500'
                              : activity.status === 'ASSIGNED'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-yellow-500/10 text-yellow-500'
                          }`}
                        >
                          {activity.status.replace('_', ' ')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={cardVariants}>
          <Card className="glass border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-3 gradient-primary shadow-glow hover:shadow-glow-lg transition-all duration-300 group">
                <FileText className="w-4 h-4" />
                Create Work Order
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 glass hover:bg-primary/5 transition-all duration-300">
                <Users className="w-4 h-4" />
                Add Customer
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 glass hover:bg-primary/5 transition-all duration-300">
                <DollarSign className="w-4 h-4" />
                Generate Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 glass hover:bg-primary/5 transition-all duration-300">
                <Calendar className="w-4 h-4" />
                Schedule Job
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Info Card (for reference) */}
        <motion.div variants={cardVariants}>
          <Card className="glass border border-border/50">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{session.user.id}</span>
                </div>
                {session.user.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono text-xs">{session.user.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="text-primary font-medium">
                    {((session.user as Session["user"] & { role?: string })?.role ?? 'ADMIN').replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
