
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageTitle } from '@/lib/hooks/use-page-title';
import { trpc } from '@/trpc/react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { subDays, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CalendarCheck, Clock, DollarSign, Briefcase, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkOrderType, CustomerType, WorkOrderPriority, InvoiceStatus, ReportsStats } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
};

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

export default function ReportsClientPage() {
  usePageTitle('Reports');
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [workOrderTypeFilter, setWorkOrderTypeFilter] = useState<WorkOrderType | 'all'>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType | 'all'>('all');
  
  const { data: stats, isLoading, refetch } = trpc.reports.getStats.useQuery<ReportsStats>({
    from: dateRange.from,
    to: dateRange.to,
    workOrderType: workOrderTypeFilter === 'all' ? undefined : workOrderTypeFilter,
    customerType: customerTypeFilter === 'all' ? undefined : customerTypeFilter,
  });

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '€0.00';
    return `€${value.toFixed(2)}`;
  };

  const formatDays = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(1)} days`;
  };

  const pieChartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 md:p-8"
    >
      <motion.h1 variants={cardVariants} className="text-4xl font-bold text-foreground mb-6">Advanced Reports</motion.h1>

      <motion.div variants={cardVariants} className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <DateRangePicker
          range={dateRange}
          onRangeChange={(newRange) => {
            setDateRange(newRange);
            // refetch(); // Refetch data when date range changes
          }}
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select
            value={workOrderTypeFilter}
            onValueChange={(value: WorkOrderType | 'all') => setWorkOrderTypeFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Work Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Work Order Types</SelectItem>
              {Object.values(WorkOrderType).map((type) => (
                <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={customerTypeFilter}
            onValueChange={(value: CustomerType | 'all') => setCustomerTypeFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Customer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customer Types</SelectItem>
              {Object.values(CustomerType).map((type) => (
                <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading reports...</div>
      ) : ( 
        <>
          <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Metric Cards */}
            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="flex-row items-center justify-between pb-2 px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-2xl font-bold text-gradient">{formatCurrency(stats?.totalRevenue)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="flex-row items-center justify-between pb-2 px-0 pt-0">
                  <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-2xl font-bold">+{stats?.newCustomers}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="flex-row items-center justify-between pb-2 px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Completed Work Orders</CardTitle>
                  <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-2xl font-bold">{stats?.completedWorkOrders}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="flex-row items-center justify-between pb-2 px-0 pt-0">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-2xl font-bold">{formatDays(stats?.averageCompletionTime)}</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={containerVariants} className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Over Time Chart */}
            <motion.div variants={chartVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0">
                  <CardTitle>Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={stats?.revenueOverTime?.map((d: { date: Date | null; revenue: number | null }) => ({
                        ...d,
                        date: d.date ? format(new Date(d.date), 'MMM dd') : 'N/A'
                      }))}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3b3b3b" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number) => [`€${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Work Orders by Status Chart */}
            <motion.div variants={chartVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0">
                  <CardTitle>Work Orders by Status</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: stats?.completedWorkOrders ?? 0 },
                          { name: 'Pending', value: stats?.pendingWorkOrders ?? 0 },
                          { name: 'In Progress', value: stats?.inProgressWorkOrders ?? 0 },
                          { name: 'Assigned', value: stats?.assignedWorkOrders ?? 0 },
                          { name: 'Cancelled', value: stats?.cancelledWorkOrders ?? 0 },
                        ].filter(entry => entry.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {[
                          { name: 'Completed', value: stats?.completedWorkOrders ?? 0 },
                          { name: 'Pending', value: stats?.pendingWorkOrders ?? 0 },
                          { name: 'In Progress', value: stats?.inProgressWorkOrders ?? 0 },
                          { name: 'Assigned', value: stats?.assignedWorkOrders ?? 0 },
                          { name: 'Cancelled', value: stats?.cancelledWorkOrders ?? 0 },
                        ].filter(entry => entry.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number, name: string) => [`${value} work orders`, name]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Work Orders by Type Chart (Bar Chart) */}
            <motion.div variants={chartVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0">
                  <CardTitle>Work Orders by Type</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.workOrdersByType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3b3b3b" />
                      <XAxis dataKey="type" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number, name: string) => [`${value} work orders`, name]}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Customer Breakdown by Type (Pie Chart) */}
            <motion.div variants={chartVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0">
                  <CardTitle>Customer Breakdown by Type</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Residential', value: stats?.residentialCustomers ?? 0 },
                          { name: 'Commercial', value: stats?.commercialCustomers ?? 0 },
                          { name: 'Industrial', value: stats?.industrialCustomers ?? 0 },
                        ].filter(entry => entry.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#ffc658"
                        dataKey="value"
                        nameKey="name"
                      >
                        {[
                          { name: 'Residential', value: stats?.residentialCustomers ?? 0 },
                          { name: 'Commercial', value: stats?.commercialCustomers ?? 0 },
                          { name: 'Industrial', value: stats?.industrialCustomers ?? 0 },
                        ].filter(entry => entry.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number, name: string) => [`${value} customers`, name]}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div variants={containerVariants} className="grid gap-6 lg:grid-cols-1">
            {/* Top Customers by Revenue */}
            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0 flex-row items-center justify-between">
                  <CardTitle>Top Customers by Revenue</CardTitle>
                  <Link href="/dashboard/customers" className="text-sm text-primary flex items-center gap-1 group">
                    View All Customers <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {stats?.topCustomersByRevenue && stats.topCustomersByRevenue.length > 0 ? (
                    <div className="space-y-4">
                      {stats.topCustomersByRevenue.map((customer: ReportsStats['topCustomersByRevenue'][number], index: number) => (
                        <div key={customer.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/20 text-primary">{customer.name?.[0] ?? ''}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(customer.totalRevenue)}</p>
                            <p className="text-xs text-muted-foreground">{customer.workOrderCount} work orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p>No customer revenue data available for this period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Work Orders by Priority */}
            <motion.div variants={cardVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="pb-4 px-0 pt-0">
                  <CardTitle>Work Orders by Priority</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.workOrdersByPriority}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3b3b3b" />
                      <XAxis dataKey="priority" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                        labelStyle={{ color: '#e5e7eb' }}
                        itemStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number, name: string) => [`${value} work orders`, name]}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
