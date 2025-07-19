'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, User, MapPin, Building2, Home, Factory, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerType } from '@/lib/types';
import { trpc } from "@/trpc/react";
import { useToast } from '@/components/ui/use-toast';

// Form validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(CustomerType),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

type CreateCustomerForm = z.infer<typeof createCustomerSchema>;

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateCustomerDialog({
  isOpen,
  onClose,
  onSuccess
}: CreateCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateCustomerForm>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      type: CustomerType.RESIDENTIAL,
    },
  });

  const createCustomerMutation = trpc.customer.create.useMutation({
    onSuccess: (newCustomer) => {
      toast({
        title: "Success!",
        description: `Customer "${newCustomer.name}" created successfully!`,
        type: "success",
      });
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive",
        type: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CreateCustomerForm) => {
    setIsSubmitting(true);
    let newLatitude = data.latitude;
    let newLongitude = data.longitude;

    const fullAddress = [
      data.address,
      data.city,
      data.state,
      data.zipCode
    ].filter(Boolean).join(', ');

    if (fullAddress) {
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullAddress }),
        });

        if (response.ok) {
          const geoData = await response.json();
          if (geoData.coordinates) {
            newLatitude = geoData.coordinates.lat;
            newLongitude = geoData.coordinates.lon;
          } else {
            toast({
              title: "Geocoding Warning",
              description: "Could not geocode the address. Customer created without coordinates.",
              type: "warning",
            });
          }
        } else {
          const errorData = await response.json();
          toast({
            title: "Geocoding Error",
            description: `Geocoding failed: ${errorData.error || response.statusText}. Customer created without coordinates.`,
            type: "destructive",
          });
        }
      } catch (error) {
        console.error("Geocoding API call failed:", error);
        toast({
          title: "Geocoding Error",
          description: "Failed to connect to geocoding service. Customer created without coordinates.",
          type: "destructive",
        });
      }
    }

    createCustomerMutation.mutate({
      name: data.name,
      type: data.type,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      notes: data.notes,
      latitude: newLatitude,
      longitude: newLongitude,
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getTypeIcon = (type: CustomerType) => {
    switch (type) {
      case CustomerType.RESIDENTIAL:
        return Home;
      case CustomerType.COMMERCIAL:
        return Building2;
      case CustomerType.INDUSTRIAL:
        return Factory;
      default:
        return User;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gradient flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer record with their contact information and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter customer name"
                  className="glass"
                  disabled={isSubmitting}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Customer Type
                </Label>
                <Select
                  value={form.watch('type')}
                  onValueChange={(value) => { form.setValue('type', value as CustomerType); }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="glass">
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                  <SelectContent className="glass backdrop-blur-xl">
                    <SelectItem value={CustomerType.RESIDENTIAL}>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Residential
                      </div>
                    </SelectItem>
                    <SelectItem value={CustomerType.COMMERCIAL}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Commercial
                      </div>
                    </SelectItem>
                    <SelectItem value={CustomerType.INDUSTRIAL}>
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        Industrial
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="customer@example.com"
                    className="glass pl-10"
                    disabled={isSubmitting}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="+358 123-4567"
                    className="glass pl-10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address Information
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address
                </Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="123 Main Street"
                  className="glass"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="Helsinki"
                    className="glass"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State/Region
                  </Label>
                  <Input
                    id="state"
                    {...form.register('state')}
                    placeholder="Uusimaa"
                    className="glass"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="zipCode"
                    {...form.register('zipCode')}
                    placeholder="00100"
                    className="glass"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any additional information about this customer..."
              className="w-full min-h-[80px] px-3 py-2 text-sm glass rounded-md border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="glass hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gradient-primary shadow-glow"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Create Customer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 