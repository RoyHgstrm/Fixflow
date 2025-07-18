'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/lib/providers/session-provider';
import { 
  PlusCircle,
  X,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from "@/trpc/react";
import CreateCustomerDialog from '@/components/customers/CreateCustomerDialog';
import { type WorkOrderPriority } from '@prisma/client';
import { type CustomerWithRelations, ExtendedUser } from '@/lib/types';

interface CreateWorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCustomerId?: string;
}

export default function CreateWorkOrderDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultCustomerId 
}: CreateWorkOrderDialogProps) {
  const { session } = useSession();
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: defaultCustomerId ?? '',
    assignedToId: '',
    priority: 'MEDIUM', // Changed to string literal
    estimatedHours: '',
    amount: '',
    scheduledDate: '',
    location: '',
    notes: '',
  });

  const userRole = (session?.user as ExtendedUser)?.role ?? 'ADMIN';

  // Fetch customers for dropdown
  const { data: customersData, refetch: refetchCustomers } = api.customer.list.useQuery({
    limit: 100,
  });

  // TODO: Implement user API for assignment
  const usersData = null;

  // Create work order mutation
  const createWorkOrder = api.workOrder.create.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to create work order:', error);
    },
  });

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      customerId: '',
      assignedToId: '',
      priority: 'MEDIUM',
      estimatedHours: '',
      amount: '',
      scheduledDate: '',
      location: '',
      notes: '',
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      description: formData.description || undefined,
      customerId: formData.customerId,
      priority: formData.priority as WorkOrderPriority,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      assignedToId: formData.assignedToId || undefined,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
    };

    createWorkOrder.mutate(submitData);
  };

  const handleCustomerCreated = async () => {
    await refetchCustomers();
  };

  const customers: CustomerWithRelations[] = customersData?.items ?? [];
  const users: any[] = []; // TODO: Implement when user API is available

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="create-work-order-dialog" className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl h-[90vh] mx-4 flex flex-col"
          >
            <Card className="glass border-primary/20 h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Create Work Order
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pr-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => { setFormData({ ...formData, title: e.target.value }); }}
                      placeholder="Enter work order title"
                      className="glass"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => { setFormData({ ...formData, description: e.target.value }); }}
                      placeholder="Describe the work to be done"
                      className="glass w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md border border-input bg-background"
                      rows={3}
                    />
                  </div>

                  {/* Customer */}
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select 
                          value={formData.customerId} 
                          onValueChange={(value) => { setFormData({ ...formData, customerId: value }); }}
                        >
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {customer.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => { setShowCreateCustomerDialog(true); }}
                        className="glass"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Priority and Assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority}
                        onValueChange={(value: string) => { setFormData({ ...formData, priority: value as WorkOrderPriority }); }}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {userRole === 'ADMIN' && users.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assign To</Label>
                        <Select value={formData.assignedToId} onValueChange={(value) => { setFormData({ ...formData, assignedToId: value }); }}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Location and Scheduled Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => { setFormData({ ...formData, location: e.target.value }); }}
                        placeholder="Work location"
                        className="glass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">Scheduled Date</Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => { setFormData({ ...formData, scheduledDate: e.target.value }); }}
                        className="glass"
                      />
                    </div>
                  </div>

                  {/* Estimated Hours and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        value={formData.estimatedHours}
                        onChange={(e) => { setFormData({ ...formData, estimatedHours: e.target.value }); }}
                        placeholder="0"
                        className="glass"
                        min="0"
                        step="0.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => { setFormData({ ...formData, amount: e.target.value }); }}
                        placeholder="0.00"
                        className="glass"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => { setFormData({ ...formData, notes: e.target.value }); }}
                      placeholder="Additional notes or instructions"
                      className="glass w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md border border-input bg-background"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={createWorkOrder.isPending}
                      className="glass hover:bg-muted/50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createWorkOrder.isPending}
                      className="gradient-primary shadow-glow"
                    >
                      {createWorkOrder.isPending ? (
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        isOpen={showCreateCustomerDialog}
        onClose={() => { setShowCreateCustomerDialog(false); }}
        onSuccess={handleCustomerCreated}
      />
    </AnimatePresence>
  );
} 