// Prisma enums - define locally to avoid import issues during development
export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT'
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum CustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL'
}

// Type definitions for API responses
export interface WorkOrderWithRelations {
  id: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  estimatedHours?: number;
  amount?: number;
  scheduledDate?: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CustomerWithRelations {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  avatar?: string;
  type: CustomerType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  workOrders?: WorkOrderWithRelations[];
  invoices?: InvoiceWithRelations[];
}

export interface InvoiceWithRelations {
  id: string;
  number: string;
  amount: number;
  status: InvoiceStatus;
  dueDate?: Date;
  issuedAt: Date;
  paidAt?: Date;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  workOrder?: {
    id: string;
    title: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  workOrders: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    totalValue: number;
  };
  customers: {
    total: number;
    residential: number;
    commercial: number;
    industrial: number;
  };
  invoices: {
    total: number;
    draft: number;
    pending: number;
    paid: number;
    overdue: number;
    totalAmount: number;
  };
} 