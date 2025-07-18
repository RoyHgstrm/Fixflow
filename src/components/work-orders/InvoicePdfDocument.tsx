import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoicePdfContent, CompanyData, CustomerData, InvoiceData, WorkOrderData } from './InvoicePdfContent';

// Register fonts (optional, but recommended for consistent look)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' }); // Assuming you have fonts folder or public

// Create styles for the PDF
const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
    fontSize: 10,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6', // Primary brand color
  },
  companyDetails: {
    fontSize: 8,
    color: '#666',
    marginTop: 5,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#444',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#777',
  },
  detailValue: {
    flex: 1,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#ccc',
    borderBottomWidth: 1,
    padding: 5,
    fontWeight: 'bold',
    backgroundColor: '#e6e6e6',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#eee',
    borderWidth: 1,
    padding: 5,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalLabel: {
    width: 100,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 10,
  },
  totalValue: {
    width: 100,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    color: '#777',
    borderTop: '1px solid #eee',
    paddingTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

interface InvoicePdfDocumentProps {
  invoiceData: InvoiceData;
  companyData: CompanyData;
  customerData: CustomerData;
  workOrderData: WorkOrderData;
}

export default function InvoicePdfDocument({ invoiceData, companyData, customerData, workOrderData }: InvoicePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <InvoicePdfContent
          invoiceData={invoiceData}
          companyData={companyData}
          customerData={customerData}
          workOrderData={workOrderData}
          pdfStyles={pdfStyles}
        />
      </Page>
    </Document>
  );
}
