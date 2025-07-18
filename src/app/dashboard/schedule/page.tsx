'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  User,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';
import type {
  WorkOrderStatus,
  WorkOrderPriority} from '@/lib/types';
import { 
  UserRole,
  type WorkOrderResponse
} from '@/lib/types';
import CreateWorkOrderDialog from '@/components/work-orders/CreateWorkOrderDialog';
import { type Variants, type Variant } from "framer-motion";
import { useRouter } from 'next/navigation';

// Filter work orders by status
const filterWorkOrdersByStatus = (workOrders: WorkOrderResponse[], status: WorkOrderStatus) => {
  return workOrders.filter((wo: WorkOrderResponse) => wo.status === status);
};

// Sort work orders by date
const sortWorkOrdersByDate = (workOrders: WorkOrderResponse[]) => {
  return workOrders.sort((a: WorkOrderResponse, b: WorkOrderResponse) => {
    const dateA = new Date(a.scheduledDate || a.createdAt);
    const dateB = new Date(b.scheduledDate || b.createdAt);
    return dateA.getTime() - dateB.getTime();
  });
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

const statusColors = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  ASSIGNED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  IN_PROGRESS: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  COMPLETED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const priorityColors = {
  LOW: 'bg-gray-500/10 text-gray-600',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-orange-500/10 text-orange-600',
  URGENT: 'bg-red-500/10 text-red-600',
};

export default function SchedulePage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const router = useRouter();

  const userRole = (session?.user as any)?.role || UserRole.EMPLOYEE;
  const canCreateWorkOrders = [UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN].includes(userRole);

  // Get work orders for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: workOrders, isLoading, refetch } = api.workOrder.list.useQuery({
    limit: 100,
    status: statusFilter !== 'all' ? statusFilter as WorkOrderStatus : undefined,
    search: searchQuery || undefined,
  });

  // Filter work orders by scheduled date within the current month
  const monthWorkOrders = workOrders?.items?.filter((wo: WorkOrderResponse) => {
    if (!wo.scheduledDate) return false;
    const scheduledDate = new Date(wo.scheduledDate);
    return scheduledDate >= startOfMonth && scheduledDate <= endOfMonth;
  }) || [];

  // Get work orders for a specific date
  const getWorkOrdersForDate = (date: Date) => {
    return monthWorkOrders.filter((wo: WorkOrderResponse) => {
      if (!wo.scheduledDate) return false;
      const scheduledDate = new Date(wo.scheduledDate);
      return scheduledDate.toDateString() === date.toDateString();
    });
  };

  // Get work orders for a specific status
  const getWorkOrdersByStatus = (status: WorkOrderStatus) => {
    return monthWorkOrders.filter((wo: WorkOrderResponse) => wo.status === status);
  };

  // Sort work orders by date
  const sortWorkOrdersByDate = (workOrders: WorkOrderResponse[]) => {
    return workOrders.sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.createdAt);
      const dateB = new Date(b.scheduledDate || b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Schedule</h1>
          <p className="text-muted-foreground mt-2">
            Manage your work order schedule and calendar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('calendar'); }}
              className="h-8"
            >
              <Grid className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setViewMode('list'); }}
              className="h-8"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>

          {canCreateWorkOrders && (
            <Button 
              onClick={() => { setShowCreateDialog(true); }}
              className="gradient-primary shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Work Order
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search work orders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <Card className="glass border border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { navigateMonth('prev'); }}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentDate(new Date()); }}
                  className="h-8"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { navigateMonth('next'); }}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Week headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth().map((date, index) => {
                const dayWorkOrders = getWorkOrdersForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    className={`min-h-24 p-2 border rounded-lg transition-all duration-200 hover:border-primary/50 ${
                      isCurrentMonth ? 'bg-background border-border/50' : 'bg-muted/20 border-muted'
                    } ${isToday ? 'ring-2 ring-primary/20 border-primary/50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    } ${isToday ? 'text-primary font-bold' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayWorkOrders.slice(0, 3).map((wo: WorkOrderResponse) => (
                        <div
                          key={wo.id}
                          className={`text-xs p-1 rounded truncate ${statusColors[wo.status]} cursor-pointer hover:opacity-80`}
                          onClick={() => { router.push(`/dashboard/work-orders/${wo.id}`); }}
                        >
                          {wo.title}
                        </div>
                      ))}
                      {dayWorkOrders.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayWorkOrders.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5 text-primary" />
              Scheduled Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled work orders found
                </div>
              ) : (
                monthWorkOrders
                  .sort((a: WorkOrderResponse, b: WorkOrderResponse) => new Date(a.scheduledDate || '').getTime() - new Date(b.scheduledDate || '').getTime())
                  .map((workOrder: WorkOrderResponse, index: number) => (
                    <motion.div
                      key={workOrder.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 bg-background/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{workOrder.title}</h3>
                            <Badge variant="outline" className={statusColors[workOrder.status]}>
                              {workOrder.status}
                            </Badge>
                            <Badge variant="outline" className={priorityColors[workOrder.priority]}>
                              {workOrder.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" />
                              {workOrder.scheduledDate ? formatDate(new Date(workOrder.scheduledDate)) : 'No date set'}
                            </div>
                            {workOrder.scheduledDate && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {formatTime(new Date(workOrder.scheduledDate))}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {workOrder.customer?.name || 'No customer'}
                            </div>
                            {workOrder.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {workOrder.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {workOrder.assignedTo && (
                          <div className="text-sm text-muted-foreground">
                            Assigned to: {workOrder.assignedTo.name}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Work Order Dialog */}
      <CreateWorkOrderDialog
        isOpen={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
} 