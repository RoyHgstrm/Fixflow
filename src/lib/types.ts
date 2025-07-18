import { 
  UserRole, 
  WorkOrderStatus, 
  WorkOrderPriority, 
  InvoiceStatus, 
  CustomerType,
  PlanType,
  InvitationStatus
} from '@prisma/client';
import { type Session } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

export { 
  UserRole, 
  WorkOrderStatus, 
  WorkOrderPriority, 
  InvoiceStatus, 
  CustomerType,
  PlanType,
  InvitationStatus
};

// Explicitly define WorkOrderType enum as it may not be correctly exported or recognized
export enum WorkOrderType {
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  TROUBLESHOOTING = 'TROUBLESHOOTING',
  INSPECTION = 'INSPECTION',
  OTHER = 'OTHER',
}

// Plan configuration
export interface PlanFeatures {
  name: string;
  price: number;
  maxUsers: number;
  features: string[];
  isPopular?: boolean;
  description: string;
}

export const PLAN_CONFIGS: Record<PlanType, PlanFeatures> = {
  [PlanType.SOLO]: {
    name: 'Solo',
    price: 49,
    maxUsers: 1,
    description: 'Perfect for solo operators and one-person businesses',
    features: [
      'Unlimited work orders',
      'Customer management',
      'Basic scheduling',
      'Invoice generation',
      'Mobile app access',
      'Email support'
    ]
  },
  [PlanType.TEAM]: {
    name: 'Team',
    price: 129,
    maxUsers: 10,
    description: 'Ideal for small teams and growing businesses',
    isPopular: true,
    features: [
      'Everything in Solo',
      'Up to 10 team members',
      'Team scheduling & assignments',
      'Advanced reporting',
      'Priority support',
      'Team performance tracking'
    ]
  },
  [PlanType.BUSINESS]: {
    name: 'Business',
    price: 299,
    maxUsers: 50,
    description: 'For established businesses with larger teams',
    features: [
      'Everything in Team',
      'Up to 50 team members',
      'Advanced analytics',
      'Custom workflow automation',
      'API access',
      'Dedicated support'
    ]
  },
  [PlanType.ENTERPRISE]: {
    name: 'Enterprise',
    price: 0,
    maxUsers: -1,
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Business',
      'Unlimited team members',
      'Custom integrations',
      'On-premise deployment',
      '24/7 phone support',
      'Dedicated account manager'
    ]
  }
};

// Helper function to get remaining trial days
export function getTrialDaysRemaining(trialEndDate: Date | string): number {
  const now = new Date();
  const endDate = trialEndDate instanceof Date ? trialEndDate : new Date(trialEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper function to check if trial is ending soon (<= 3 days)
export function isTrialEndingSoon(trialEndDate: Date | string): boolean {
  return getTrialDaysRemaining(trialEndDate) <= 3;
}

// Type definitions for API responses with new company structure
export interface CompanyWithSubscription {
  id: string;
  name: string;
  email?: string;
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  trialStartDate: Date | string;
  trialEndDate: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  users?: UserWithRole[];
  _count?: {
    users: number;
    customers: number;
    workOrders: number;
  };
}

export interface UserWithRole {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  jobTitle?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  joinedCompanyAt?: Date;
  company?: CompanyWithSubscription;
}

export interface CompanyInvitationWithDetails {
  id: string;
  email: string;
  role: UserRole; // Corrected: Should be UserRole
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  invitedAt: Date;
  acceptedAt?: Date;
  company: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
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

// User experience types for dashboard customization
export enum UserExperience {
  SOLO_OPERATOR = 'SOLO_OPERATOR',
  FIELD_WORKER = 'FIELD_WORKER',
  TEAM_MANAGER = 'TEAM_MANAGER'
}

// Helper function to determine user experience type
export function getUserExperience(role: UserRole): UserExperience {
  switch (role) {
  case UserRole.OWNER:
  case UserRole.MANAGER:
  case UserRole.ADMIN:
    return UserExperience.TEAM_MANAGER;
  case UserRole.EMPLOYEE:
  case UserRole.TECHNICIAN:
    return UserExperience.FIELD_WORKER;
  case UserRole.CLIENT:
  default:
    return UserExperience.SOLO_OPERATOR;
  }
}

// Enhanced trial management utility functions
export function isTrialExpired(trialEndDate: Date | string): boolean {
  const now = new Date();
  const endDate = trialEndDate instanceof Date ? trialEndDate : new Date(trialEndDate);
  return now > endDate;
}

export function formatTrialEndDate(trialEndDate: Date | string): string {
  const date = trialEndDate instanceof Date ? trialEndDate : new Date(trialEndDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Result type for error handling
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helper functions for Result type
export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E>(error: E): Result<never, E> => ({ success: false, error });

// API Error types
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

// Enhanced session type with proper typing
export interface ExtendedUser extends User {
  role?: UserRole;
  companyId?: string | null; // Add companyId here
  company?: { 
    name: string; 
    id?: string; 
    planType?: PlanType; 
    users?: UserWithRole[]; // Add optional users array
  }; 
  name?: string | null; // Allow null as it might not always be set
  image?: string; // Add image field
}

export interface CustomSession {
  user: ExtendedUser;
  role?: UserRole;
  expires?: string; // Make expires optional here
  access_token?: string; 
  refresh_token?: string; 
  expires_in?: number; 
  token_type?: string; 
}

// Work Order types
export interface WorkOrderBase {
  id: string;
  title: string;
  description?: string | null; // Allow null
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType; // Explicitly add type field
  customerId: string;
  assignedToId?: string | null; // Allow null
  createdById: string;
  estimatedHours?: number | null; // Allow null
  amount?: number | null; // Allow null
  location?: string | null; // Allow null
  notes?: string | null; // Allow null
  scheduledDate?: Date | null; // Allow null
  completedDate?: Date | null; // Explicitly add completedDate field
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderWithRelations extends WorkOrderBase {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string | null; // Add address field
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
  invoices?: InvoiceWithRelations[]; // Add this line
}

// Customer types
export interface CustomerBase {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  type: CustomerType;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatedByBase {
  name: string | null;
}

export interface CreatedByExtended extends CreatedByBase {
  id?: string;
  email?: string;
}

export interface CustomerWithRelations extends CustomerBase {
  createdBy: CreatedByBase;
  workOrders?: WorkOrderWithRelations[];
  _count?: {
    workOrders: number;
    invoices?: number;
  };
  invoices?: InvoiceWithRelations[];
}

// Invoice types
export interface InvoiceData {
  id: string;
  number: string;
  customerId: string;
  workOrderId?: string | null;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: Date | null;
  paidDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceWithRelations extends InvoiceData {
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  workOrder?: {
    id: string;
    title: string;
  };
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface WorkOrderResponse extends WorkOrderBase {
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null; // Allow null for assignedTo
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WorkOrderStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalValue?: number;
}

// Navigation and UI types
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  bgColor?: string;
  color?: string;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

// Form types
export interface WorkOrderCreateData {
  title: string;
  description?: string;
  customerId: string;
  assignedToId?: string;
  priority: WorkOrderPriority;
  estimatedHours?: number;
  amount?: number;
  location?: string;
  notes?: string;
  scheduledDate?: Date;
}

export interface CustomerCreateData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: CustomerType;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

// Search and Filter types
export interface BaseFilters {
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface WorkOrderQueryFilters extends BaseFilters {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  assignedToId?: string;
  customerId?: string;
  createdById?: string;
}

export interface CustomerQueryFilters extends BaseFilters {
  type?: CustomerType;
  createdById?: string;
}

export interface InvoiceQueryFilters extends BaseFilters {
  status?: InvoiceStatus;
  customerId?: string;
  workOrderId?: string;
}

// Analytics and Stats types
export interface WorkOrderAnalytics {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  averageCompletionTime?: number;
  totalRevenue?: number;
}

export interface CustomerAnalytics {
  total: number;
  active: number;
  residential: number;
  commercial: number;
  totalRevenue?: number;
  averageJobValue?: number;
}

export interface InvoiceAnalytics {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

// Component prop types
export interface StatusBadgeProps {
  status: WorkOrderStatus | InvoiceStatus;
  variant?: 'default' | 'outline';
}

export interface PriorityBadgeProps {
  priority: WorkOrderPriority;
  variant?: 'default' | 'outline';
}

// Error types for better error handling
export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  fields: FieldError[];
  general?: string;
}

// Map types
export interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'customer' | 'work_order';
  address?: string;
  status?: WorkOrderStatus;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Utility type helpers
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Type aliases that avoid conflicts with existing declarations
export type SafeWorkOrderWithRelations = WorkOrderWithRelations;
export type SafeCustomerWithRelations = CustomerWithRelations;
export type SafeInvoiceWithRelations = InvoiceWithRelations; 

export type PaymentMethod = {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
};

export type Invoice = {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  downloadUrl?: string;
}; 

export type CustomerStats = {
  totalCustomers: number;
  residential: number;
  commercial: number;
  industrial: number;
  growth: {
    total: {
      isPositive: boolean;
      value: number;
      period: string;
    };
    residential: {
      isPositive: boolean;
      newCustomers: number;
      period: string;
    };
    commercial: {
      isPositive: boolean;
      newCustomers: number;
      period: string;
    };
    industrial: {
      isPositive: boolean;
      newCustomers: number;
      period: string;
    };
  };
};

// Add a utility type for Next.js page props
export type NextPageProps<T extends { id: string }> = {
  params: T & { then?: never };
  searchParams?: { [key: string]: string | string[] | undefined };
}; 

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
} 