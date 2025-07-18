'use client';

import React from 'react';
import { 
  Document as PDFDocument, 
  Page as PDFPage, 
  Text as PDFText, 
  View as PDFView, 
  StyleSheet 
} from '@react-pdf/renderer';

// Define strict types for invoice data
interface InvoiceData {
  number: string;
  issueDate: string;
  dueDate: string;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
}

interface CompanyData {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phone: string;
  website?: string;
}

interface CustomerData {
  name: string;
  address: string;
  city: string;
  zipCode: string;
  email: string;
  phone: string;
}

interface WorkOrderData {
  title: string;
  description?: string;
  location?: string;
  scheduledDate?: string;
  amount: number;
}

interface InvoicePDFProps {
  invoiceData: InvoiceData;
  companyData: CompanyData;
  customerData: CustomerData;
  workOrderData: WorkOrderData;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
  },
});

export default function InvoicePDF({ 
  invoiceData, 
  companyData, 
  customerData, 
  workOrderData 
}: InvoicePDFProps) {
  // Safely calculate amounts with nullish coalescing
  const subtotal = workOrderData.amount ?? 0;
  const taxAmount = subtotal * (invoiceData.tax ?? 0);
  const discountAmount = subtotal * (invoiceData.discount ?? 0);
  const total = subtotal + taxAmount - discountAmount;

  return (
    <PDFDocument>
      <PDFPage size="A4" style={styles.page}>
        <PDFView>
          <PDFText>{companyData.name ?? 'Company Name'}</PDFText>
          <PDFText>{companyData.address ?? 'Address'}</PDFText>
          <PDFText>{customerData.name ?? 'Customer Name'}</PDFText>
          <PDFText>Invoice Number: {invoiceData.number ?? 'N/A'}</PDFText>
          <PDFText>Total: {total.toFixed(2)} €</PDFText>
        </PDFView>
      </PDFPage>
    </PDFDocument>
  );
}
