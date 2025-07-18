import { UserRole } from "./types";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  Settings, 
  Calendar, 
  Shield, 
  Wrench, 
  User, 
  BarChart3 
} from 'lucide-react';

export const iconMap = {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Settings,
  Calendar,
  Shield,
  Wrench,
  User,
  BarChart3
};

export type NavLink = {
  name: string;
  href: string;
  icon: keyof typeof iconMap;
  description: string;
};

export type NavConfig = {
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  color: string;
  bgColor: string;
  links: NavLink[];
};

// Helper function to get role label
export const getRoleLabel = (role: UserRole) => {
  switch (role.toUpperCase()) {
    case UserRole.OWNER:
      return 'Owner';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.EMPLOYEE:
      return 'Employee';
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.TECHNICIAN:
      return 'Technician';
    case UserRole.CLIENT:
      return 'Client';
    default:
      return 'User';
  }
};

// Helper function to determine user experience type
const getUserExperience = (role: string) => {
  switch (role.toUpperCase()) {
    case 'OWNER':
      return 'TEAM_MANAGER'; // Owners get full access
    case 'MANAGER':
      return 'TEAM_MANAGER';
    case 'EMPLOYEE':
    case 'TECHNICIAN':
      return 'FIELD_WORKER';
    case 'ADMIN':
      return 'TEAM_MANAGER'; // Legacy mapping
    case 'CLIENT':
      return 'SOLO_OPERATOR';
    default:
      return 'SOLO_OPERATOR';
  }
};

// Role-based navigation configuration
export const getNavConfig = (userRole: string, company?: { planType?: string }): NavConfig => {
  const experience = getUserExperience(userRole);
  const planType = company?.planType || 'SOLO';
  const isSoloPlan = planType === 'SOLO';

  const baseConfig = {
    SOLO_OPERATOR: {
      title: 'My Business',
      description: 'Your personal dashboard',
      icon: 'User' as keyof typeof iconMap,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      links: [
        {
          name: 'Today',
          href: '/dashboard',
          icon: 'LayoutDashboard' as keyof typeof iconMap,
          description: 'Your tasks today'
        },
        {
          name: 'Schedule',
          href: '/dashboard/schedule',
          icon: 'Calendar' as keyof typeof iconMap,
          description: 'Your upcoming jobs'
        },
        {
          name: 'Customers',
          href: '/dashboard/customers',
          icon: 'Users' as keyof typeof iconMap,
          description: 'Your customers'
        },
        {
          name: 'Income',
          href: '/dashboard/invoices',
          icon: 'DollarSign' as keyof typeof iconMap,
          description: 'Track your earnings'
        },
        {
          name: 'Billing',
          href: '/dashboard/billing',
          icon: 'DollarSign' as keyof typeof iconMap,
          description: 'Manage your subscription'
        }
      ]
    },
    FIELD_WORKER: {
      title: 'My Work',
      description: 'Your daily tasks and schedule',
      icon: 'Wrench' as keyof typeof iconMap,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      links: [
        {
          name: 'Today',
          href: '/dashboard',
          icon: 'LayoutDashboard' as keyof typeof iconMap,
          description: 'Your jobs today'
        },
        {
          name: 'My Jobs',
          href: '/dashboard/work-orders',
          icon: 'FileText' as keyof typeof iconMap,
          description: 'All assigned tasks'
        },
        {
          name: 'Schedule',
          href: '/dashboard/schedule',
          icon: 'Calendar' as keyof typeof iconMap,
          description: 'Your work schedule'
        }
      ]
    },
    TEAM_MANAGER: {
      title: isSoloPlan ? 'My Business' : 'Team Dashboard',
      description: isSoloPlan ? 'Your personal dashboard' : 'Manage your team and operations',
      icon: (isSoloPlan ? 'User' : 'Shield') as keyof typeof iconMap,
      color: isSoloPlan ? 'text-primary' : 'text-blue-500',
      bgColor: isSoloPlan ? 'bg-primary/10' : 'bg-blue-500/10',
      links: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: 'LayoutDashboard' as keyof typeof iconMap,
          description: isSoloPlan ? 'Your overview' : 'Team overview'
        },
        {
          name: 'Work Orders',
          href: '/dashboard/work-orders',
          icon: 'FileText' as keyof typeof iconMap,
          description: 'All work orders'
        },
        {
          name: 'Schedule',
          href: '/dashboard/schedule',
          icon: 'Calendar' as keyof typeof iconMap,
          description: isSoloPlan ? 'Your scheduling' : 'Team scheduling'
        },
        {
          name: 'Customers',
          href: '/dashboard/customers',
          icon: 'Users' as keyof typeof iconMap,
          description: 'Customer management'
        },
        {
          name: 'Team',
          href: '/dashboard/team',
          icon: 'Users' as keyof typeof iconMap,
          description: 'Team management'
        },
        {
          name: 'Invoices',
          href: '/dashboard/invoices',
          icon: 'DollarSign' as keyof typeof iconMap,
          description: 'Billing & invoices'
        },
        {
          name: 'Billing',
          href: '/dashboard/billing',
          icon: 'DollarSign' as keyof typeof iconMap,
          description: 'Manage subscription'
        },
        {
          name: 'Reports',
          href: '/dashboard/reports',
          icon: 'BarChart3' as keyof typeof iconMap,
          description: 'Business insights'
        },
        {
          name: 'Settings',
          href: '/dashboard/settings',
          icon: 'Settings' as keyof typeof iconMap,
          description: 'System settings'
        }
      ]
    }
  };

  return baseConfig[experience] || baseConfig.SOLO_OPERATOR;
};
