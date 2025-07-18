import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { WorkOrderType, InvoiceStatus } from "@/lib/types";
import { WorkOrderStatus, WorkOrderPriority } from "./types"; // Assuming types.ts is in the same directory or adjust path
import { CheckCircle, Clock, User, AlertCircle, FileText, Timer, Calendar, Phone, Target, DollarSign, XCircle } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generic status color function
export const getStatusColor = (status: WorkOrderStatus | InvoiceStatus) => {
  switch (status) {
  case WorkOrderStatus.COMPLETED: return "bg-green-500/10 text-green-500 border-green-500/20";
  case WorkOrderStatus.IN_PROGRESS: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  case WorkOrderStatus.ASSIGNED: return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  case WorkOrderStatus.PENDING: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  case WorkOrderStatus.CANCELLED: return "bg-red-500/10 text-red-500 border-red-500/20";
  case InvoiceStatus.PAID: return "bg-green-500/10 text-green-500 border-green-500/20";
  case InvoiceStatus.PENDING: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  case InvoiceStatus.OVERDUE: return "bg-red-500/10 text-red-500 border-red-500/20";
  case InvoiceStatus.DRAFT: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  case InvoiceStatus.CANCELLED: return "bg-red-500/10 text-red-500 border-red-500/20";
  default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export const getPriorityColor = (priority: WorkOrderPriority) => {
  switch (priority) {
  case WorkOrderPriority.URGENT: return "text-red-600";
  case WorkOrderPriority.HIGH: return "text-red-500";
  case WorkOrderPriority.MEDIUM: return "text-yellow-500";
  case WorkOrderPriority.LOW: return "text-green-500";
  default: return "text-gray-500";
  }
};

// Generic status icon function
export const getStatusIcon = (status: WorkOrderStatus | InvoiceStatus) => {
  switch (status) {
  case WorkOrderStatus.COMPLETED: return CheckCircle;
  case WorkOrderStatus.IN_PROGRESS: return Clock;
  case WorkOrderStatus.ASSIGNED: return User;
  case WorkOrderStatus.PENDING: return AlertCircle;
  case WorkOrderStatus.CANCELLED: return AlertCircle;
  case InvoiceStatus.PAID: return CheckCircle;
  case InvoiceStatus.PENDING: return Clock;
  case InvoiceStatus.OVERDUE: return AlertCircle;
  case InvoiceStatus.DRAFT: return FileText;
  case InvoiceStatus.CANCELLED: return XCircle;
  default: return FileText;
  }
};

export function getWorkOrderTypeIcon(type: WorkOrderType, className: string) {
  switch (type) {
  case WorkOrderType.INSTALLATION:
    return <Timer className={className} />;
  case WorkOrderType.MAINTENANCE:
    return <Calendar className={className} />;
  case WorkOrderType.REPAIR:
    return <AlertCircle className={className} />;
  case WorkOrderType.TROUBLESHOOTING:
    return <Phone className={className} />;
  case WorkOrderType.INSPECTION:
    return <Target className={className} />;
  case WorkOrderType.OTHER:
    return <FileText className={className} />;
  default:
    return <FileText className={className} />;
  }
}

export function getTrialDaysRemaining(trialEndDate: Date): number {
  const today = new Date();
  const endDate = new Date(trialEndDate);
  const timeDiff = endDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff > 0 ? daysDiff : 0;
}

export function isTrialEndingSoon(trialEndDate: Date, daysThreshold: number = 5): boolean {
  const daysRemaining = getTrialDaysRemaining(trialEndDate);
  return daysRemaining > 0 && daysRemaining <= daysThreshold;
}

export function formatTrialEndDate(trialEndDate: Date): string {
  return new Date(trialEndDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}