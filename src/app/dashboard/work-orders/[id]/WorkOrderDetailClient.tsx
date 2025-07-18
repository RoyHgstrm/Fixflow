'use client';

import { useSession } from "@/lib/providers/session-provider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Save,
  Loader2,
  Receipt
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkOrderStatus, UserRole, type UserWithRole } from "@/lib/types";
import { toast } from "sonner";
import { getWorkOrderTypeIcon, getStatusColor, getPriorityColor, getStatusIcon } from "@/lib/utils";
import type { WorkOrderWithRelations , WorkOrderPriority, WorkOrderType} from "@/lib/types"; // Corrected to type-only import
import { CreateInvoiceDialog } from '@/components/work-orders/CreateInvoiceDialog'; // Import the new dialog
import { PrimaryActionButton } from '@/components/ui/action-button';
import { CustomSession } from "@/lib/types";

// Status configuration for display
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: AlertCircle,
    color: 'text-yellow-500',
  },
  ASSIGNED: {
    label: 'Assigned',
    variant: 'default' as const,
    icon: User,
    color: 'text-blue-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default' as const,
    icon: PlayCircle,
    color: 'text-orange-500',
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-500',
  },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', variant: 'secondary' as const, color: 'text-gray-500' },
  MEDIUM: { label: 'Medium', variant: 'default' as const, color: 'text-blue-500' },
  HIGH: { label: 'High', variant: 'default' as const, color: 'text-orange-500' },
  URGENT: { label: 'Urgent', variant: 'destructive' as const, color: 'text-red-500' },
};

// Animation variants
const itemVariants = {
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

interface WorkOrderDetailClientProps {
  params: { id: string };
  session: CustomSession;
}

interface EditedWorkOrderType {
  title: string;
  description?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  estimatedHours?: number | string | null;
  amount?: number | string | null;
  scheduledDate?: string | null;
  location?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  type: WorkOrderType;
}

export function WorkOrderDetailClient({ params, session }: WorkOrderDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkOrder, setEditedWorkOrder] = useState<EditedWorkOrderType | null>(null);
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false); // State for invoice dialog

  // Get user role safely
  const userRole = session?.user?.role || 'ADMIN';

  // Dynamically load users from session's company
  const users: UserWithRole[] = session?.user?.company?.users || [];
  
  // Set dynamic page title
  usePageTitle(userRole);

  // Fetch work order data
  const {
    data: workOrderData,
    isLoading,
    error,
    refetch
  } = api.workOrder.getById.useQuery(
    { id: params.id },
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const workOrder = workOrderData as WorkOrderWithRelations | undefined; // Explicitly cast here

  useEffect(() => {
    if (workOrder) {
      setEditedWorkOrder({
        title: workOrder.title,
        description: workOrder.description ?? null,
        status: workOrder.status,
        priority: workOrder.priority,
        estimatedHours: workOrder.estimatedHours ?? null,
        amount: workOrder.amount ?? null,
        scheduledDate: workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().split('T')[0] : null,
        location: workOrder.location ?? null,
        notes: workOrder.notes ?? null,
        assignedToId: workOrder.assignedToId ?? null,
        type: workOrder.type, // Ensure type is included
      });
    }
  }, [workOrder]);

  // Update mutation
  const updateWorkOrderMutation = api.workOrder.update.useMutation({
    onSuccess: async () => {
      toast.success("Work order updated successfully!");
      setIsEditing(false);
      await refetch(); // Refetch to get latest data
    },
    onError: (err) => {
      toast.error(`Failed to update work order: ${err.message}`);
    },
  });

  // Mark complete mutation
  const markCompleteMutation = api.workOrder.update.useMutation({
    onSuccess: async () => {
      toast.success("Work order marked as complete!");
      await refetch();
    },
    onError: (err) => {
      toast.error(`Failed to mark work order as complete: ${err.message}`);
    },
  });

  const handleSaveEdit = () => {
    if (!editedWorkOrder || !workOrder) return;
    updateWorkOrderMutation.mutate({
      id: params.id,
      title: editedWorkOrder.title,
      description: editedWorkOrder.description === '' ? null : editedWorkOrder.description,
      status: editedWorkOrder.status,
      priority: editedWorkOrder.priority,
      estimatedHours: editedWorkOrder.estimatedHours === '' || editedWorkOrder.estimatedHours === null ? null : Number(editedWorkOrder.estimatedHours),
      amount: editedWorkOrder.amount === '' || editedWorkOrder.amount === null ? null : Number(editedWorkOrder.amount),
      scheduledDate: editedWorkOrder.scheduledDate ? new Date(editedWorkOrder.scheduledDate) : null,
      location: editedWorkOrder.location === '' ? null : editedWorkOrder.location,
      notes: editedWorkOrder.notes === '' ? null : editedWorkOrder.notes,
      assignedToId: editedWorkOrder.assignedToId === '' ? null : editedWorkOrder.assignedToId,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset editedWorkOrder to current workOrder state
    if (workOrder) {
      setEditedWorkOrder({
        title: workOrder.title,
        description: workOrder.description ?? null,
        status: workOrder.status,
        priority: workOrder.priority,
        estimatedHours: workOrder.estimatedHours ?? null,
        amount: workOrder.amount ?? null,
        scheduledDate: workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().split('T')[0] : null,
        location: workOrder.location ?? null,
        notes: workOrder.notes ?? null,
        assignedToId: workOrder.assignedToId ?? null,
        type: workOrder.type,
      });
    }
  };

  const handleMarkComplete = () => {
    if (!workOrder) return;
    markCompleteMutation.mutate({
      id: params.id,
      status: WorkOrderStatus.COMPLETED,
      completedDate: new Date(),
    });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !workOrder) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Work Order Not Found</h1>
          <p className="text-muted-foreground">
            {error?.message || 'The work order you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => { router.push('/dashboard/work-orders'); }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Work Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[workOrder.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[workOrder.priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig.icon;
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'OWNER';

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { router.push('/dashboard/work-orders'); }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workOrder.title}</h1>
              <p className="text-muted-foreground">Work Order #{workOrder.id.slice(-8)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
              {statusConfig.label}
            </Badge>
            <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
            
            {canEdit && !isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { setIsEditing(true); }}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    id="description"
                    value={editedWorkOrder?.description || ''}
                    onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, description: e.target.value }) : null); }}
                    className="w-full min-h-[100px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Detailed description of the work order"
                  />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">
                    {workOrder.description || 'No description provided.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="location"
                      value={editedWorkOrder?.location || ''}
                      onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, location: e.target.value }) : null); }}
                      className="glass"
                      placeholder="Work Order Location"
                    />
                  </div>
                ) : workOrder.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{workOrder.location}</span>
                  </div>
                )}
                
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="text-sm font-medium">Scheduled Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={editedWorkOrder?.scheduledDate || ''}
                      onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, scheduledDate: e.target.value }) : null); }}
                      className="glass text-lg w-full"
                    />
                  </div>
                ) : workOrder.scheduledDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      Scheduled: {new Date(workOrder.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours" className="text-sm font-medium">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      value={editedWorkOrder?.estimatedHours || ''}
                      onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, estimatedHours: e.target.value }) : null); }}
                      className="glass text-lg w-full"
                      placeholder="e.g., 8"
                    />
                  </div>
                ) : workOrder.estimatedHours && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      Estimated: {workOrder.estimatedHours} hours
                    </span>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">Amount (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editedWorkOrder?.amount || ''}
                      onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, amount: e.target.value }) : null); }}
                      className="glass text-lg w-full"
                      placeholder="e.g., 250.00"
                    />
                  </div>
                ) : workOrder.amount && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-2xl font-bold">€{workOrder.amount.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    id="notes"
                    value={editedWorkOrder?.notes || ''}
                    onChange={(e) => { setEditedWorkOrder((prev: EditedWorkOrderType | null) => prev ? ({ ...prev, notes: e.target.value }) : null); }}
                    className="w-full min-h-[100px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Any additional notes for the work order"
                  />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">{workOrder.notes || 'No notes provided.'}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Customer Information */}
            {workOrder.customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{workOrder.customer?.name}</p>
                  </div>
                  
                  {workOrder.customer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${workOrder.customer.email}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {workOrder.customer.email}
                      </a>
                    </div>
                  )}
                  
                  {workOrder.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${workOrder.customer.phone}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {workOrder.customer.phone}
                      </a>
                    </div>
                  )}

                  {workOrder.customer?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-foreground">{workOrder.customer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assignment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned to</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="assignedToId" className="text-sm font-medium">Assigned to</Label>
                      <Select
                        value={editedWorkOrder?.assignedToId || 'unassigned'}
                        onValueChange={(value: string) => { setEditedWorkOrder(prev => prev ? ({ ...prev, assignedToId: value === 'unassigned' ? undefined : value }) : null); }}
                      >
                        <SelectTrigger className="glass w-full">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent className="glass backdrop-blur-xl">
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {/* TODO: Dynamically load users from API */}
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="font-medium text-foreground">
                      {workOrder.assignedTo?.name || 'Unassigned'}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="font-medium text-foreground">
                    {workOrder.createdBy?.name || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">
                    {new Date(workOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {workOrder.status === 'COMPLETED' && workOrder.completedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-sm text-foreground">
                      {new Date(workOrder.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions / Edit and Mark Complete Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateWorkOrderMutation.isPending}
                className="glass hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateWorkOrderMutation.isPending || !editedWorkOrder}
                className="gradient-primary shadow-glow"
              >
                {updateWorkOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {(userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'TECHNICIAN') && (
                <Button
                  onClick={() => { setIsEditing(true); }}
                  className="gradient-primary shadow-glow"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Work Order
                </Button>
              )}
              {(userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'TECHNICIAN') &&
                workOrder.status !== 'COMPLETED' && (
                <Button
                  onClick={handleMarkComplete}
                  disabled={markCompleteMutation.isPending}
                  className="gradient-secondary shadow-glow"
                >
                  {markCompleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                </Button>
              )}
              {(canEdit || userRole === UserRole.TECHNICIAN) && // Allow technicians to create invoices too
                workOrder.status === WorkOrderStatus.COMPLETED && // Only show if work order is completed
                !workOrder.invoices?.length && ( // Only if no invoice exists yet for this work order
                <PrimaryActionButton
                  icon={Receipt}
                  onClick={() => { setShowCreateInvoiceDialog(true); }}
                  mobileLabel="Invoice"
                >
                    Create Invoice
                </PrimaryActionButton>
              )}
            </>
          )}
        </div>
      </div>
      {workOrder && (
        <CreateInvoiceDialog
          isOpen={showCreateInvoiceDialog}
          onClose={() => { setShowCreateInvoiceDialog(false); }}
          onSuccess={refetch}
          workOrder={workOrder}
        />
      )}
    </ErrorBoundary>
  );
} 