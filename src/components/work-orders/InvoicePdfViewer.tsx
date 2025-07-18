import React from 'react';
import dynamic from 'next/dynamic';
import type { PDFViewer as PDFViewerType } from '@react-pdf/renderer';
import InvoiceDocumentComponent from './InvoiceDocumentComponent';
import type { InvoiceData, CompanyData, CustomerData, WorkOrderData } from './InvoiceDocumentComponent';

interface PDFViewerProps {
  children: React.ReactNode;
  width?: string;
  height?: string;
}

const DynamicPDFViewer = dynamic<PDFViewerProps>(
  () => import('@react-pdf/renderer').then((mod) => {
    const PDFViewer = mod.PDFViewer as React.ComponentType<PDFViewerProps>;
    return PDFViewer;
  }),
  { ssr: false }
);

interface InvoicePdfViewerProps {
  invoiceData: InvoiceData;
  companyData: CompanyData;
  customerData: CustomerData;
  workOrderData: WorkOrderData;
}

export default function InvoicePdfViewer({ 
  invoiceData, 
  companyData, 
  customerData, 
  workOrderData 
}: InvoicePdfViewerProps) {
  return (
    <DynamicPDFViewer width="100%" height="100%">
      <InvoiceDocumentComponent 
        invoiceData={invoiceData}
        companyData={companyData}
        customerData={customerData}
        workOrderData={workOrderData}
      />
    </DynamicPDFViewer>
  );
} 