"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Home,
  Factory,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { CustomerType, WorkOrderStatus, type CustomerWithRelations, type WorkOrderWithRelations, type InvoiceWithRelations } from "@/lib/types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getStatusColor, getStatusIcon } from "@/lib/utils"; // Import utils for work order status
import { CustomSession } from "@/lib/providers/session-provider";
import * as React from "react"; // Changed to import all as React

interface CustomerDetailClientProps {
  customerId: string;
  session: CustomSession;
}

interface EditedCustomerType {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  type: CustomerType;
  notes?: string;
}

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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export function CustomerDetailClient({ customerId, session }: CustomerDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<EditedCustomerType | null>(null);

  // Safely extract user role
  const userRole = session?.user?.role ?? 'CLIENT';
  const canEdit = ['ADMIN', 'OWNER', 'MANAGER'].includes(userRole);

  // Set dynamic page title
  usePageTitle(userRole);

  // Fetch customer data
  const {
    data: customerData,
    isLoading,
    error,
    refetch,
  } = api.customer.getById.useQuery(
    { id: customerId },
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const customer = customerData as CustomerWithRelations | undefined;

  useEffect(() => {
    if (customer) {
      setEditedCustomer({
        name: customer.name,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
        address: customer.address ?? undefined,
        city: customer.city ?? undefined,
        state: customer.state ?? undefined,
        zipCode: customer.zipCode ?? undefined,
        type: customer.type,
        notes: customer.notes ?? undefined,
      });
    }
  }, [customer]);

  // Define the update mutation inside the component
  const updateCustomerMutation = api.customer.update.useMutation({
    onSuccess: async () => {
      toast.success("Customer updated successfully!");
      setIsEditing(false);
      await refetch(); // Refetch to get latest data
    },
    onError: (err: { message: string }) => {
      toast.error(`Failed to update customer: ${err.message}`);
    },
  });

  // Modify status icon rendering to ensure ReactNode compatibility
  const renderStatusIcon = (status: WorkOrderStatus) => {
    const Icon = getStatusIcon(status);
    return React.createElement(Icon, { className: 'w-4 h-4 text-muted-foreground' });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editedCustomer) return;

    try {
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        name: editedCustomer.name,
        email: editedCustomer.email,
        phone: editedCustomer.phone,
        address: editedCustomer.address,
        city: editedCustomer.city,
        state: editedCustomer.state,
        zipCode: editedCustomer.zipCode,
        type: editedCustomer.type,
        notes: editedCustomer.notes,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setEditedCustomer({
        name: customer.name,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
        address: customer.address ?? undefined,
        city: customer.city ?? undefined,
        state: customer.state ?? undefined,
        zipCode: customer.zipCode ?? undefined,
        type: customer.type,
        notes: customer.notes ?? undefined,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center text-foreground">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Loading customer data...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center text-destructive">
        <AlertTriangle className="w-8 h-8 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Error Loading Customer</h1>
        <p>{error?.message || "Customer not found or access denied."}</p>
        <Button onClick={() => { router.push("/dashboard/customers"); }} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  // Modify CustomerTypeIcon to handle potential undefined case
  const CustomerTypeIcon =
    customer?.type === CustomerType.RESIDENTIAL
      ? Home
      : customer?.type === CustomerType.COMMERCIAL
        ? Building2
        : Factory;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="container mx-auto px-4 py-6 max-w-6xl"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { router.push("/dashboard/customers"); }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground">Customer ID: {customer.id.slice(-8)}</p>
          </div>
        </div>

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
      </motion.div>

      {/* Customer Details */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Basic Information Card */}
        <Card className="glass border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editedCustomer?.name || ''}
                    onChange={(e) => {
                      setEditedCustomer(prev => prev ? { ...prev, name: e.target.value } : null);
                    }}
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editedCustomer?.email || ''}
                    onChange={(e) => {
                      setEditedCustomer(prev => prev ? { ...prev, email: e.target.value } : null);
                    }}
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={editedCustomer?.phone || ''}
                    onChange={(e) => {
                      setEditedCustomer(prev => prev ? { ...prev, phone: e.target.value } : null);
                    }}
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Type</Label>
                  <Select
                    value={editedCustomer?.type}
                    onValueChange={(value: CustomerType) => {
                      setEditedCustomer(prev => prev ? { ...prev, type: value } : null);
                    }}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CustomerType.RESIDENTIAL}>Residential</SelectItem>
                      <SelectItem value={CustomerType.COMMERCIAL}>Commercial</SelectItem>
                      <SelectItem value={CustomerType.INDUSTRIAL}>Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.name}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CustomerTypeIcon className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.type}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information Card */}
        <Card className="glass border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={editedCustomer?.address || ''}
                    onChange={(e) => {
                      setEditedCustomer(prev => prev ? { ...prev, address: e.target.value } : null);
                    }}
                    className="glass"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={editedCustomer?.city || ''}
                      onChange={(e) => {
                        setEditedCustomer(prev => prev ? { ...prev, city: e.target.value } : null);
                      }}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={editedCustomer?.state || ''}
                      onChange={(e) => {
                        setEditedCustomer(prev => prev ? { ...prev, state: e.target.value } : null);
                      }}
                      className="glass"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    value={editedCustomer?.zipCode || ''}
                    onChange={(e) => {
                      setEditedCustomer(prev => prev ? { ...prev, zipCode: e.target.value } : null);
                    }}
                    className="glass"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {(customer.city || customer.state || customer.zipCode) && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {customer.city && `${customer.city}, `}
                      {customer.state && `${customer.state} `}
                      {customer.zipCode}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="glass border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <textarea
                  value={editedCustomer?.notes || ''}
                  onChange={(e) => {
                    setEditedCustomer(prev => prev ? { ...prev, notes: e.target.value } : null);
                  }}
                  className="glass w-full min-h-[100px] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md border border-input bg-background"
                />
              </div>
            ) : (
              <div className="text-muted-foreground">
                {customer.notes || 'No additional notes'}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Actions */}
      {isEditing && (
        <motion.div
          variants={itemVariants}
          className="flex justify-end gap-4 mt-6"
        >
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            disabled={updateCustomerMutation.isPending}
            className="glass hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={updateCustomerMutation.isPending}
            className="gradient-primary shadow-glow"
          >
            {updateCustomerMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </motion.div>
      )}

      {/* Work Orders Section */}
      <motion.div
        variants={itemVariants}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Work Orders</h2>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => { /* TODO: Implement create work order */ }}
            >
              <PlusCircle className="h-4 w-4" />
              Create Work Order
            </Button>
          )}
        </div>

        {customer.workOrders && customer.workOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.workOrders.map((workOrder) => (
              <Card key={workOrder.id} className="glass border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Modify status icon rendering to ensure ReactNode compatibility */}
                      {/* In the render method, replace the icon rendering */}
                      {renderStatusIcon(workOrder.status)}
                      <span className={`text-sm font-medium ${getStatusColor(workOrder.status)}`}>
                        {workOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{workOrder.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>€{workOrder.amount?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { router.push(`/dashboard/work-orders/${workOrder.id}`); }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p>No work orders for this customer</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}