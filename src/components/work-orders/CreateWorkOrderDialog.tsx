'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  FileText 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import CreateCustomerDialog from '@/components/customers/CreateCustomerDialog';
import { trpc } from "@/trpc/react";
import { 
  WorkOrderType, 
  WorkOrderPriority, 
  CustomerWithRelations 
} from '@/lib/types';

const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  assignedToId: z.string().optional(),
  priority: z.nativeEnum(WorkOrderPriority).default(WorkOrderPriority.MEDIUM),
  type: z.nativeEnum(WorkOrderType).default(WorkOrderType.MAINTENANCE),
  estimatedHours: z.string().optional(),
  amount: z.string().optional(),
  scheduledDate: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export default function CreateWorkOrderDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultCustomerId 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCustomerId?: string;
}) {
  const { toast } = useToast();
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);

  // Fetch customers for dropdown
  const { data: customersData, refetch: refetchCustomers } = trpc.customer.list.useQuery({
    limit: 100,
  });

  // Fetch users for assignment dropdown
  const { data: usersData } = trpc.user.list.useQuery({
    limit: 100,
  });

  const form = useForm<z.infer<typeof createWorkOrderSchema>>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      customerId: defaultCustomerId,
      priority: WorkOrderPriority.MEDIUM,
      type: WorkOrderType.MAINTENANCE,
    },
  });

  // Create work order mutation
  const createWorkOrder = trpc.workOrder.create.useMutation({
    onSuccess: (newWorkOrder) => {
      toast({
        title: "Success!",
        description: `Work Order "${newWorkOrder.title}" created successfully!`,
        type: "success",
      });
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create work order: ${error.message}`,
        type: "destructive",
      });
      console.error('Failed to create work order:', error);
    },
  });

  const onSubmit = async (data: z.infer<typeof createWorkOrderSchema>) => {
    createWorkOrder.mutate({
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      assignedToId: data.assignedToId,
      priority: data.priority,
      type: data.type,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      amount: data.amount ? Number(data.amount) : undefined,
      location: data.location,
      notes: data.notes,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gradient flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Create Work Order
            </DialogTitle>
            <DialogDescription>
              Create a new work order for a customer with detailed information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="Enter work order title"
                    className="glass"
                  />
                  {form.formState.errors.title && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Work Order Type</Label>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select work order type" />
                        </SelectTrigger>
                        <SelectContent className="glass backdrop-blur-xl">
                          {Object.values(WorkOrderType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Enter work order description"
                  className="w-full min-h-[80px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            {/* Customer and Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Customer & Assignment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Controller
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent className="glass backdrop-blur-xl">
                          {customersData?.items.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          <Button 
                            type="button"
                            variant="ghost" 
                            className="w-full mt-2"
                            onClick={() => setShowCreateCustomerDialog(true)}
                          >
                            + Create New Customer
                          </Button>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.customerId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.customerId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Controller
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent className="glass backdrop-blur-xl">
                          {usersData?.items.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="glass backdrop-blur-xl">
                          {Object.values(WorkOrderPriority).map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="estimatedHours"
                      type="number"
                      step="0.5"
                      {...form.register('estimatedHours')}
                      placeholder="Hours"
                      className="glass pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...form.register('amount')}
                      placeholder="Cost"
                      className="glass pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    {...form.register('scheduledDate')}
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      {...form.register('location')}
                      placeholder="Work location"
                      className="glass pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Any additional information about this work order..."
                  className="w-full min-h-[80px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="glass hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWorkOrder.status === 'pending'}
                className="gradient-primary shadow-glow"
              >
                {createWorkOrder.status === 'pending' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Create Work Order'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showCreateCustomerDialog && (
        <CreateCustomerDialog 
          isOpen={showCreateCustomerDialog}
          onClose={() => setShowCreateCustomerDialog(false)}
          onSuccess={() => {
            refetchCustomers();
            setShowCreateCustomerDialog(false);
          }}
        />
      )}
    </>
  );
} 