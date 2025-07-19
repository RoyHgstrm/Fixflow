import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  WorkOrderStatus, 
  InvoiceStatus, 
  WorkOrderPriority 
} from "@/lib/types"
import { Wrench, Cog, Hammer, Stethoscope, Clipboard, FileText } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusColor = (status: WorkOrderStatus | InvoiceStatus) => {
  switch (status) {
    case 'PENDING':
    case 'DRAFT':
      return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'text-blue-500 bg-blue-50 border-blue-200';
    case 'COMPLETED':
    case 'PAID':
      return 'text-green-500 bg-green-50 border-green-200';
    case 'CANCELLED':
    case 'OVERDUE':
      return 'text-red-500 bg-red-50 border-red-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

export const getPriorityColor = (priority: WorkOrderPriority) => {
  switch (priority) {
    case 'LOW':
      return 'text-green-500 bg-green-50 border-green-200';
    case 'MEDIUM':
      return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'HIGH':
      return 'text-orange-500 bg-orange-50 border-orange-200';
    case 'URGENT':
      return 'text-red-500 bg-red-50 border-red-200';
    default:
      return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

export const getStatusIcon = (status: WorkOrderStatus | InvoiceStatus) => {
  switch (status) {
    case 'PENDING':
    case 'DRAFT':
      return 'clock';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return 'play';
    case 'COMPLETED':
    case 'PAID':
      return 'check-circle';
    case 'CANCELLED':
    case 'OVERDUE':
      return 'x-circle';
    default:
      return 'help-circle';
  }
};

export function getWorkOrderTypeIcon(type: string, className: string) {
  switch (type) {
    case 'INSTALLATION':
      return <Wrench className={className} />;
    case 'MAINTENANCE':
      return <Cog className={className} />;
    case 'REPAIR':
      return <Hammer className={className} />;
    case 'TROUBLESHOOTING':
      return <Stethoscope className={className} />;
    case 'INSPECTION':
      return <Clipboard className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

export function getTrialDaysRemaining(trialEndDate: Date): number {
  const today = new Date();
  const endDate = new Date(trialEndDate);
  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function isTrialEndingSoon(trialEndDate: Date, daysThreshold: number = 5): boolean {
  return getTrialDaysRemaining(trialEndDate) <= daysThreshold;
}

export function formatTrialEndDate(trialEndDate: Date): string {
  return trialEndDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}