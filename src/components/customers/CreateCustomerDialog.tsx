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
import type { CustomerType } from '@/lib/types';
import { api } from "@/trpc/react";

// Form validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']),
  notes: z.string().optional(),
});

type CreateCustomerForm = {
  name: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
};

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

  const form = useForm<CreateCustomerForm>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'RESIDENTIAL' as const,
      notes: '',
    },
  });

  const createCustomerMutation = api.customer.create.useMutation({
    onSuccess: () => {
      form.reset();
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create customer:', error);
    },
  });

  const onSubmit = async (data: CreateCustomerForm) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipCode: data.zipCode || undefined,
        notes: data.notes || undefined,
      };
      
      await createCustomerMutation.mutateAsync(cleanData);
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
    case 'RESIDENTIAL':
      return Home;
    case 'COMMERCIAL':
      return Building2;
    case 'INDUSTRIAL':
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
                    <SelectItem value="RESIDENTIAL">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Residential
                      </div>
                    </SelectItem>
                    <SelectItem value="COMMERCIAL">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Commercial
                      </div>
                    </SelectItem>
                    <SelectItem value="INDUSTRIAL">
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