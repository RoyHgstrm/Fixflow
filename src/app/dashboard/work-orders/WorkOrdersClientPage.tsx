'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/lib/providers/session-provider';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit3,
  Eye,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Wrench,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PrimaryActionButton, SecondaryActionButton, ActionButtonGroup } from '@/components/ui/action-button';
import { trpc } from '@/trpc/react';
import { usePageTitle } from "@/lib/hooks/use-page-title";
import CreateWorkOrderDialog from '@/components/work-orders/CreateWorkOrderDialog';
import { type WorkOrderWithRelations, type WorkOrderResponse, type WorkOrderStatus, USER_ROLES } from '@/lib/types';
import { getStatusColor, getPriorityColor, getStatusIcon } from "@/lib/utils";

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

const workOrderStatuses = ['All', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function WorkOrdersClientPage() {
  const { session } = useSession();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const userRole = session?.user?.role ?? USER_ROLES.EMPLOYEE;
  
  usePageTitle(userRole);

  const { data: workOrdersData, isLoading: workOrdersLoading, error: workOrdersError } = trpc.workOrder.list.useQuery({
    status: selectedStatus === 'All' ? undefined : selectedStatus as WorkOrderStatus,
    search: searchQuery ?? undefined,
    limit: 50,
  });

  const { data: stats, isLoading: statsLoading } = trpc.workOrder.getStats.useQuery();

  const workOrders = workOrdersData?.items ?? [];

  const totalValue = workOrders
    .filter((order: WorkOrderResponse) => order.status === 'COMPLETED')
    .reduce((sum: number, order: WorkOrderResponse) => sum + (order.amount ?? 0), 0);

  const handleWorkOrderCreated = () => {
    window.location.reload();
  };

  const getHeaderContent = () => {
    switch (userRole) {
    case USER_ROLES.ADMIN:
      return {
        title: 'Work Orders Management',
        description: 'Manage and track all work orders across your organization',
        icon: Shield,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
    case USER_ROLES.TECHNICIAN:
      return {
        title: 'My Work Orders',
        description: 'View and update your assigned work orders',
        icon: Wrench,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10'
      };
    case USER_ROLES.CLIENT:
      return {
        title: 'Service Requests',
        description: 'Track your service requests and work orders',
        icon: User,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      };
    default:
      return {
        title: 'Work Orders',
        description: 'Manage work orders and service requests',
        icon: FileText,
        color: 'text-primary',
        bgColor: 'bg-primary/10'
      };
    }
  };

  const headerContent = getHeaderContent();
  const HeaderIcon = headerContent.icon;

  if (workOrdersLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading work orders...</span>
        </div>
      </div>
    );
  }

  if (workOrdersError) {
    return (
      <div className="space-y-6">
        <Card className="glass border-destructive/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Work Orders</h3>
            <p className="text-muted-foreground mb-4">
              {workOrdersError.message || 'Failed to load work orders. Please try again.'}
            </p>
            <Button 
              onClick={() => { window.location.reload(); }} 
              className="gradient-primary"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants} className="glass rounded-xl p-6 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${headerContent.bgColor} rounded-xl flex items-center justify-center`}>
              <HeaderIcon className={`w-6 h-6 ${headerContent.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">{headerContent.title}</h1>
              <p className="text-muted-foreground">{headerContent.description}</p>
            </div>
          </div>
          
          {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TECHNICIAN || userRole === USER_ROLES.OWNER) && (
            <PrimaryActionButton 
              icon={PlusCircle}
              mobileLabel={userRole === USER_ROLES.ADMIN ? 'Create' : 'Request'}
              onClick={() => { setShowCreateDialog(true); }}
            >
              {userRole === USER_ROLES.ADMIN ? 'Create Work Order' : 'Request Work Order'}
            </PrimaryActionButton>
          )}
          
          {userRole === USER_ROLES.CLIENT && (
            <PrimaryActionButton 
              icon={PlusCircle}
              mobileLabel="Request"
              onClick={() => { setShowCreateDialog(true); }}
            >
              Request New Work Order
            </PrimaryActionButton>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-primary/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-yellow-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-blue-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                  <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-green-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass hover:shadow-glow transition-all duration-300 border border-emerald-500/20 group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">€{(stats?.totalValue || 0).toLocaleString("de-DE")}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} className="glass rounded-xl p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search work orders..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="pl-10 pr-4 py-2 glass rounded-lg border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {workOrderStatuses.map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedStatus(status); }}
                  className={selectedStatus === status ? 
                    "gradient-primary shadow-glow" : 
                    "glass hover:bg-primary/5"
                  }
                >
                  {status === 'All' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" className="glass hover:bg-primary/5">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="space-y-4">
        {workOrders.length === 0 ? (
          <Card className="glass border border-border/50">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Work Orders Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedStatus !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first work order.'
                }
              </p>
              {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TECHNICIAN) && (
                <Button className="gradient-primary shadow-glow">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Work Order
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          workOrders.map((order: WorkOrderResponse, index: number) => {
            const StatusIcon = getStatusIcon(order.status) as React.ElementType;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card className="glass hover:shadow-glow transition-all duration-300 border border-border/50 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="w-5 h-5 text-muted-foreground" />
                              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {order.title}
                              </h3>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                              {order.priority} Priority
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{order.customer.name}</span>
                          </div>
                          {order.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{order.location}</span>
                            </div>
                          )}
                          {order.scheduledDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(order.scheduledDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {order.amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span>€{order.amount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {userRole === USER_ROLES.ADMIN && order.assignedTo && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Wrench className="w-4 h-4" />
                            <span>Assigned to: {order.assignedTo.name}</span>
                          </div>
                        )}

                        {order.description && (
                          <p className="text-sm text-muted-foreground">{order.description}</p>
                        )}
                      </div>

                      <ActionButtonGroup spacing="tight">
                        <SecondaryActionButton 
                          icon={Eye}
                          mobileLabel="View"
                          onClick={() => { router.push(`/dashboard/work-orders/${order.id}`); }}
                        >
                          View
                        </SecondaryActionButton>
                        
                        {(userRole === USER_ROLES.ADMIN || (userRole === USER_ROLES.TECHNICIAN && order.status !== 'COMPLETED')) && (
                          <SecondaryActionButton 
                            icon={Edit3}
                            mobileLabel="Edit"
                            onClick={() => { router.push(`/dashboard/work-orders/${order.id}`); }}
                          >
                            Edit
                          </SecondaryActionButton>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => { router.push(`/dashboard/work-orders/${order.id}`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {(userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TECHNICIAN) && (
                              <>
                                <DropdownMenuItem onClick={() => { router.push(`/dashboard/work-orders/${order.id}`); }}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Order
                                </DropdownMenuItem>
                                {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                  <DropdownMenuItem>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {userRole === USER_ROLES.ADMIN && (
                              <DropdownMenuItem className="text-destructive">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ActionButtonGroup>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <CreateWorkOrderDialog
        isOpen={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); }}
        onSuccess={handleWorkOrderCreated}
      />
    </motion.div>
  );
} 