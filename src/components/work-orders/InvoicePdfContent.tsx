import React from 'react';
import type { WorkOrderWithRelations } from '@/lib/types';

export interface CompanyData {
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface CustomerData {
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
}

export interface WorkOrderData {
  title: string;
  description?: string;
  location?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  amount?: number;
}

export interface InvoiceData {
  number: string;
  issueDate: string;
  dueDate: string;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
}

interface InvoicePdfContentProps {
  invoiceData: InvoiceData;
  companyData: CompanyData;
  customerData: CustomerData;
  workOrderData: WorkOrderData;
  pdfStyles: any; // Pass styles as prop
}

export const InvoicePdfContent: React.FC<InvoicePdfContentProps> = ({ invoiceData, companyData, customerData, workOrderData, pdfStyles }) => {
  const subtotal = workOrderData.amount ?? 0;
  const taxAmount = subtotal * (invoiceData.tax ?? 0);
  const discountAmount = subtotal * (invoiceData.discount ?? 0);

  return (
    <>
      <div style={pdfStyles.header}>
        <div style={pdfStyles.companyName}>{companyData?.name || 'FixFlow'}</div>
        <div style={pdfStyles.companyDetails}>
          {companyData?.address}, {companyData?.city}, {companyData?.zipCode}
        </div>
        <div style={pdfStyles.companyDetails}>Email: {companyData?.email || 'info@fixflow.fi'} | Phone: {companyData?.phone || '+358 40 123 4567'}</div>
        {companyData?.website && <div style={pdfStyles.companyDetails}>Website: {companyData.website}</div>}
      </div>

      <div style={pdfStyles.invoiceDetails}>
        <div >
          <div style={pdfStyles.invoiceTitle}>INVOICE</div>
          <div>Invoice No: {invoiceData.number}</div>
          <div>Issue Date: {invoiceData.issueDate}</div>
          <div>Due Date: {invoiceData.dueDate}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={pdfStyles.invoiceTitle}>BILL TO:</div>
          <div>{customerData.name}</div>
          {customerData.address && <div>{customerData.address}</div>}
          {(customerData.city || customerData.zipCode) && <div>{customerData.city} {customerData.zipCode}</div>}
          {customerData.email && <div>Email: {customerData.email}</div>}
          {customerData.phone && <div>Phone: {customerData.phone}</div>}
        </div>
      </div>

      <div style={pdfStyles.section}>
        <div style={pdfStyles.sectionTitle}>Work Order Details</div>
        <div style={pdfStyles.detailRow}>
          <div style={pdfStyles.detailLabel}>Work Order:</div>
          <div style={pdfStyles.detailValue}>{workOrderData.title}</div>
        </div>
        <div style={pdfStyles.detailRow}>
          <div style={pdfStyles.detailLabel}>Description:</div>
          <div style={pdfStyles.detailValue}>{workOrderData.description || 'N/A'}</div>
        </div>
        <div style={pdfStyles.detailRow}>
          <div style={pdfStyles.detailLabel}>Location:</div>
          <div style={pdfStyles.detailValue}>{workOrderData.location || 'N/A'}</div>
        </div>
        <div style={pdfStyles.detailRow}>
          <div style={pdfStyles.detailLabel}>Scheduled:</div>
          <div style={pdfStyles.detailValue}>{workOrderData.scheduledDate || 'N/A'}</div>
        </div>
        <div style={pdfStyles.detailRow}>
          <div style={pdfStyles.detailLabel}>Completed:</div>
          <div style={pdfStyles.detailValue}>{workOrderData.completedDate || 'N/A'}</div>
        </div>
      </div>

      <div style={pdfStyles.table}>
        <div style={pdfStyles.tableRow}>
          <div style={pdfStyles.tableColHeader}>Item Description</div>
          <div style={pdfStyles.tableColHeader}>Hours/Qty</div>
          <div style={pdfStyles.tableColHeader}>Rate/Unit (€)</div>
          <div style={pdfStyles.tableColHeader}>Amount (€)</div>
        </div>
        <div style={pdfStyles.tableRow}>
          <div style={pdfStyles.tableCol}>{workOrderData.title}</div>
          <div style={pdfStyles.tableCol}>{workOrderData.estimatedHours || '-'}</div>
          <div style={pdfStyles.tableCol}>{subtotal && workOrderData.estimatedHours ? (subtotal / workOrderData.estimatedHours).toFixed(2) : '-'}</div>
          <div style={pdfStyles.tableCol}>{subtotal ? subtotal.toFixed(2) : '0.00'}</div>
        </div>
      </div>

      <div style={pdfStyles.totalSection}>
        <div style={pdfStyles.totalLabel}>Subtotal:</div>
        <div style={pdfStyles.totalValue}>€{subtotal.toFixed(2)}</div>
      </div>
      <div style={pdfStyles.totalSection}>
        <div style={pdfStyles.totalLabel}>Tax ({(invoiceData.tax * 100).toFixed(0)}%):</div>
        <div style={pdfStyles.totalValue}>€{taxAmount.toFixed(2)}</div>
      </div>
      <div style={pdfStyles.totalSection}>
        <div style={pdfStyles.totalLabel}>Discount ({(invoiceData.discount * 100).toFixed(0)}%):</div>
        <div style={pdfStyles.totalValue}>€{discountAmount.toFixed(2)}</div>
      </div>
      <div style={pdfStyles.totalSection}>
        <div style={pdfStyles.totalLabel}>TOTAL DUE:</div>
        <div style={pdfStyles.totalValue}>€{invoiceData.total.toFixed(2)}</div>
      </div>

      {invoiceData.notes && (
        <div style={pdfStyles.notes}>
          <div style={pdfStyles.notes}>Notes: {invoiceData.notes}</div>
        </div>
      )}

      <div style={pdfStyles.footer}>
        Thank you for your business! This is a computer-generated invoice, no signature is required.
      </div>
    </>
  );
};