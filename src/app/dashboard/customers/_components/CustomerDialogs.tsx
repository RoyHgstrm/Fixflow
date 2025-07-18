'use client';

import React from 'react';
import CreateCustomerDialog from '@/components/customers/CreateCustomerDialog';
import CreateWorkOrderDialog from '@/components/work-orders/CreateWorkOrderDialog';

interface CustomerDialogsProps {
  showCreateCustomerDialog: boolean;
  showCreateWorkOrderDialog: boolean;
  selectedCustomerId?: string;
  onCreateCustomerDialogClose: () => void;
  onCreateWorkOrderDialogClose: () => void;
  onRefresh: () => Promise<void>;
}

export function CustomerDialogs({
  showCreateCustomerDialog,
  showCreateWorkOrderDialog,
  selectedCustomerId,
  onCreateCustomerDialogClose,
  onCreateWorkOrderDialogClose,
  onRefresh,
}: CustomerDialogsProps) {
  return (
    <>
      {showCreateCustomerDialog && (
        <CreateCustomerDialog
          open={showCreateCustomerDialog}
          onOpenChange={(open) => {
            if (!open) onCreateCustomerDialogClose();
          }}
          onSuccess={async () => {
            await onRefresh();
            onCreateCustomerDialogClose();
          }}
        />
      )}
      {showCreateWorkOrderDialog && selectedCustomerId && (
        <CreateWorkOrderDialog
          open={showCreateWorkOrderDialog}
          customerId={selectedCustomerId}
          onOpenChange={(open) => {
            if (!open) onCreateWorkOrderDialogClose();
          }}
          onSuccess={async () => {
            await onRefresh();
            onCreateWorkOrderDialogClose();
          }}
        />
      )}
    </>
  );
}
