'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/lib/providers/session-provider';
import { nanoid } from 'nanoid';
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  Loader2,
  Download,
  Eye,
  Send,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';
import type { WorkOrderWithRelations, InvoiceStatus } from '@/lib/types';
import { toast } from 'sonner';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { InvoicePdfDocument } from './InvoicePdfDocument';

interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workOrder: WorkOrderWithRelations;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({ isOpen, onClose, workOrder, onSuccess }) => {
  const { data: session } = useSession();
  const [invoiceData, setInvoiceData] = useState({
    number: nanoid(10),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    tax: 0.24, // Finnish VAT
    discount: 0,
    total: workOrder.amount || 0,
    status: 'pending' as InvoiceStatus,
    notes: '',
  });

  const createInvoice = api.invoice.create.useMutation({
    onSuccess: () => {
      toast.success('Invoice created successfully!');
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to create invoice', {
        description: error.message,
      });
    },
  });

  const handleCreateInvoice = async () => {
    if (!session?.user?.id || !workOrder.customerId || !workOrder.id) {
      toast.error('Missing required data for invoice creation.');
      return;
    }

    await createInvoice.mutateAsync({
      ...invoiceData,
      workOrderId: workOrder.id,
      customerId: workOrder.customerId,
      userId: session.user.id,
      total: workOrder.amount || 0, // Ensure total is based on workOrder amount
    });
  };

  const companyData = {
    name: 'FixFlow Oy',
    address: 'Esimerkkikatu 1',
    city: 'Helsinki',
    zipCode: '00100',
    email: 'info@fixflow.fi',
    phone: '+358 40 123 4567',
    website: 'www.fixflow.fi',
  };

  const customerData = workOrder.customer;

  if (!customerData) {
    return null; // Or a loading/error state
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Invoice for Work Order: {workOrder.title}</DialogTitle>
          <DialogDescription>
            Review the details and generate the invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceNumber" className="text-right">
              Invoice No.
            </Label>
            <Input id="invoiceNumber" value={invoiceData.number} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="issueDate" className="text-right">
              Issue Date
            </Label>
            <Input
              id="issueDate"
              type="date"
              value={invoiceData.issueDate}
              onChange={(e) => { setInvoiceData({ ...invoiceData, issueDate: e.target.value }); }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => { setInvoiceData({ ...invoiceData, dueDate: e.target.value }); }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tax" className="text-right">
              Tax (%)
            </Label>
            <Input
              id="tax"
              type="number"
              step="0.01"
              value={invoiceData.tax * 100}
              onChange={(e) => { setInvoiceData({ ...invoiceData, tax: parseFloat(e.target.value) / 100 }); }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discount" className="text-right">
              Discount (%)
            </Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              value={invoiceData.discount * 100}
              onChange={(e) => { setInvoiceData({ ...invoiceData, discount: parseFloat(e.target.value) / 100 }); }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Input
              id="notes"
              value={invoiceData.notes}
              onChange={(e) => { setInvoiceData({ ...invoiceData, notes: e.target.value }); }}
              className="col-span-3"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Invoice Preview</h3>
          <div className="border rounded-lg overflow-hidden">
            <PDFViewer style={{ width: '100%', height: '600px' }}>
              <InvoicePdfContent
                invoiceData={invoiceData}
                companyData={companyData}
                customerData={customerData}
                workOrderData={workOrder}
              />
            </PDFViewer>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateInvoice} disabled={createInvoice.isLoading}>
            {createInvoice.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};