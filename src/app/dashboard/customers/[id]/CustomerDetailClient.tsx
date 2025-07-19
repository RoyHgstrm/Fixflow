"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from '@/trpc/react';
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
import { CustomerType, WorkOrderStatus } from "@prisma/client";
import { type CustomerWithRelations, type WorkOrderWithRelations, type InvoiceWithRelations, type CustomSession } from "@/lib/types";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { getStatusColor, getStatusIcon } from "@/lib/utils"; // Import utils for work order status
import { CustomerMap } from "@/components/ui/customer-map"; // Corrected Import CustomerMap
import CreateWorkOrderDialog from "@/components/work-orders/CreateWorkOrderDialog"; // Corrected Import CreateWorkOrderDialog
import { Badge } from "@/components/ui/badge"; // Import Badge
import Link from "next/link"; // Import Link

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
  latitude?: number | null;
  longitude?: number | null;
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

export function CustomerDetailClient({ customerId, session }: CustomerDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<EditedCustomerType | null>(null);
  const [isSaving, setIsSaving] = useState(false); // New state for saving status
  const [showCreateWorkOrderDialog, setShowCreateWorkOrderDialog] = useState(false); // New state for dialog
  const { toast } = useToast(); // Initialize useToast here

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
  } = trpc.customer.getById.useQuery(
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
        latitude: customer.latitude ?? undefined,
        longitude: customer.longitude ?? undefined,
      });
    }
  }, [customer]);

  // Define the update mutation inside the component
  const updateCustomerMutation = trpc.customer.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Customer Updated",
        description: "Customer details have been successfully updated.",
        type: "success",
      });
      setIsEditing(false);
      await refetch(); // Refetch to get latest data
    },
    onError: (err: { message: string }) => {
      toast({
        title: "Update Failed",
        description: `Failed to update customer: ${(err as any).message || "Unknown error"}`,
        type: "destructive",
      });
      console.error("Failed to update customer:", err);
    },
  });

  // Modify status icon rendering to ensure ReactNode compatibility
  const renderStatusIcon = (workOrder: WorkOrderWithRelations) => {
    const Icon = getStatusIcon(workOrder.status);
    const colorClass = getStatusColor(workOrder.status);
    return React.createElement(Icon, { className: 'w-4 h-4 text-muted-foreground' });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editedCustomer) return;

    let newLatitude = editedCustomer.latitude;
    let newLongitude = editedCustomer.longitude;

    const fullAddress = [
      editedCustomer.address,
      editedCustomer.city,
      editedCustomer.state,
      editedCustomer.zipCode
    ].filter(Boolean).join(', ');

    const currentFullAddress = [
      customer?.address,
      customer?.city,
      customer?.state,
      customer?.zipCode
    ].filter(Boolean).join(', ');

    if (fullAddress && fullAddress !== currentFullAddress) {
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullAddress }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.coordinates) {
            newLatitude = data.coordinates.lat;
            newLongitude = data.coordinates.lon;
          } else {
            toast({
              title: "Geocoding Warning",
              description: "Could not geocode the address. Coordinates not updated.",
              type: "default", // Change 'warning' to 'default'
            });
          }
        } else {
          const errorData = await response.json();
          toast({
            title: "Geocoding Error",
            description: `Geocoding failed: ${errorData.error || response.statusText}.`,
            type: "destructive",
          });
        }
      } catch (error) {
        console.error("Geocoding API call failed:", error);
        toast({
          title: "Geocoding Error",
          description: "Failed to connect to geocoding service.",
          type: "destructive",
        });
      }
    }

    setIsSaving(true); // Start saving
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
        latitude: newLatitude,
        longitude: newLongitude,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setIsSaving(false); // End saving
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
        latitude: customer.latitude ?? undefined,
        longitude: customer.longitude ?? undefined,
      });
    }
    setIsEditing(false);
    toast({
      title: "Edit Cancelled",
      description: "Changes were discarded.",
      type: "default",
    });
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-4 md:p-8"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading customer details...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-96 text-destructive">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg">Error: {(error as Error).message}</p>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      ) : customerData ? (
        <>
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-4xl font-bold text-foreground">
                {customerData.name}
              </h1>
              <Badge
                className="bg-primary/10 text-primary border-primary/20 capitalize"
              >
                {customerData.type.toLowerCase()}
              </Badge>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="glass">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Customer
              </Button>
            )}
          </motion.div>

          <Separator className="my-6" />

          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-8">
            {/* Basic Information */}
            <motion.div variants={itemVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 px-0 pb-0">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedCustomer?.name ?? ''}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer!, name: e.target.value })}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Customer Type</Label>
                    <Select
                      value={editedCustomer?.type}
                      onValueChange={(value) => setEditedCustomer({ ...editedCustomer!, type: value as CustomerType })}
                      disabled={!isEditing || isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="glass backdrop-blur-xl">
                        <SelectItem value={CustomerType.RESIDENTIAL}>Residential</SelectItem>
                        <SelectItem value={CustomerType.COMMERCIAL}>Commercial</SelectItem>
                        <SelectItem value={CustomerType.INDUSTRIAL}>Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div variants={itemVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 px-0 pb-0">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedCustomer?.email ?? ''}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer!, email: e.target.value })}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editedCustomer?.phone ?? ''}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer!, phone: e.target.value })}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Address Information */}
            <motion.div variants={itemVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-0 pb-0">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={editedCustomer?.address ?? ''}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer!, address: e.target.value })}
                      disabled={!isEditing || isSaving}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editedCustomer?.city ?? ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer!, city: e.target.value })}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Region</Label>
                      <Input
                        id="state"
                        value={editedCustomer?.state ?? ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer!, state: e.target.value })}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={editedCustomer?.zipCode ?? ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer!, zipCode: e.target.value })}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                  </div>
                  {customerData.latitude && customerData.longitude && (
                    <div className="mt-4">
                      <CustomerMap
                        customers={[
                          {
                            id: customerData.id,
                            name: customerData.name,
                            latitude: customerData.latitude ?? undefined,
                            longitude: customerData.longitude ?? undefined,
                            type: 'customer' as const,
                          }
                        ]}
                        height="300px"
                        showStats={false}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            <motion.div variants={itemVariants}>
              <Card className="glass border border-border/50 p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <textarea
                    id="notes"
                    value={editedCustomer?.notes ?? ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer!, notes: e.target.value })}
                    disabled={!isEditing || isSaving}
                    className="w-full min-h-[100px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions / Save & Cancel */}
            {isEditing && (
              <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="glass hover:bg-muted/50"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="gradient-primary shadow-glow">
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </motion.div>
            )}
          </form>

          <Separator className="my-6" />

          {/* Work Orders Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass border border-border/50 p-6">
              <CardHeader className="flex-row items-center justify-between pb-4 px-0 pt-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Work Orders
                </CardTitle>
                <Button variant="ghost" size="sm" className="glass" onClick={() => setShowCreateWorkOrderDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Work Order
                </Button>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {customerData.workOrders && customerData.workOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customerData.workOrders.map((workOrder) => (
                      <motion.div key={workOrder.id} variants={cardVariants} whileHover={{ y: -5 }} className="glass rounded-lg border border-border/50 p-4 space-y-2">
                        <Link href={`/dashboard/work-orders/${workOrder.id}`} className="block">
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {workOrder.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2">{workOrder.description || 'No description'}</p>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {renderStatusIcon(workOrder)}
                            <span className={`text-sm font-medium ${getStatusColor(workOrder.status)}`}>
                              {workOrder.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(workOrder.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {workOrder.assignedTo && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Assigned To: <span className="font-medium text-foreground">{workOrder.assignedTo.name}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No work orders found for this customer.</p>
                    <Button variant="link" onClick={() => setShowCreateWorkOrderDialog(true)}>
                      Create the first one?
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Invoices Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass border border-border/50 p-6">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {customerData.invoices && customerData.invoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customerData.invoices.map((invoice) => (
                      <motion.div key={invoice.id} variants={cardVariants} whileHover={{ y: -5 }} className="glass rounded-lg border border-border/50 p-4 space-y-2">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            Invoice #{invoice.number}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">Amount: €{invoice.amount.toFixed(2)}</p>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`${getStatusColor(invoice.status)} capitalize`}
                          >
                            {invoice.status.toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(invoice.dueDate!).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No invoices found for this customer.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <CreateWorkOrderDialog
            isOpen={showCreateWorkOrderDialog}
            onClose={() => setShowCreateWorkOrderDialog(false)}
            onSuccess={() => {
              refetch();
              setShowCreateWorkOrderDialog(false);
            }}
            defaultCustomerId={customerData.id}
          />
        </>
      ) : null}
    </motion.div>
  );
}