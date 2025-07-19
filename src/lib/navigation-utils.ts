import { type IconNode, Home, Users, Briefcase, DollarSign, MapPin, Calendar, FileText, Settings, Shield, Wrench, Package, Truck, LayoutDashboard, GanttChart, ListChecks, Landmark, ScrollText, UserRoundCog, BarChart3, Clock } from 'lucide-react';
import { type UserRole, USER_ROLES, UserExperience } from '@/lib/types';

export const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  dashboard: LayoutDashboard,
  users: Users,
  customers: Briefcase,
  invoices: DollarSign,
  schedule: Calendar,
  workOrders: ListChecks,
  settings: Settings,
  reports: BarChart3,
  team: Users,
  billing: DollarSign,
  admin: UserRoundCog,
  security: Shield,
  maintenance: Wrench,
  logistics: Truck,
  assets: Package,
  finance: Landmark,
  documents: ScrollText,
  clock: Clock,
  solo: MapPin, // Placeholder for solo operator
  client: Users, // Placeholder for client
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

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
  case USER_ROLES.OWNER: return 'Owner';
  case USER_ROLES.MANAGER: return 'Manager';
  case USER_ROLES.EMPLOYEE: return 'Employee';
  case USER_ROLES.ADMIN: return 'Administrator';
  case USER_ROLES.TECHNICIAN: return 'Technician';
  case USER_ROLES.CLIENT: return 'Client';
  case USER_ROLES.SOLO: return 'Solo Operator';
  case USER_ROLES.FIELD_WORKER: return 'Field Worker';
  default: return 'User';
  }
};

const getUserExperience = (role: UserRole) => {
  switch (role) {
  case USER_ROLES.OWNER:
  case USER_ROLES.MANAGER:
  case USER_ROLES.ADMIN:
    return UserExperience.TEAM_MANAGER;
  case USER_ROLES.EMPLOYEE:
  case USER_ROLES.TECHNICIAN:
  case USER_ROLES.FIELD_WORKER:
    return UserExperience.FIELD_WORKER;
  case USER_ROLES.SOLO:
    return UserExperience.SOLO_OPERATOR;
  case USER_ROLES.CLIENT:
  default:
    return UserExperience.CLIENT;
  }
};

export const getNavConfig = (
  userRole: UserRole,
  company?: { planType?: string }
): NavConfig => {
  const userExperience = getUserExperience(userRole);

  const baseLinks: NavLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', description: 'Overview of your company' },
  ];

  const teamManagerLinks: NavLink[] = [
    { name: 'Customers', href: '/dashboard/customers', icon: 'customers', description: 'Manage your customers' },
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: 'workOrders', description: 'Manage work orders and tasks' },
    { name: 'Team', href: '/dashboard/team', icon: 'team', description: 'Manage your team members' },
    { name: 'Invoices', href: '/dashboard/invoices', icon: 'invoices', description: 'Track and manage invoices' },
    { name: 'Reports', href: '/dashboard/reports', icon: 'reports', description: 'View company reports and analytics' },
    { name: 'Billing', href: '/dashboard/billing', icon: 'billing', description: 'Manage your subscription and billing' },
  ];

  const fieldWorkerLinks: NavLink[] = [
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: 'workOrders', description: 'View and manage your assigned work orders' },
    { name: 'Customers', href: '/dashboard/customers', icon: 'customers', description: 'View customer details and locations' },
  ];

  const soloOperatorLinks: NavLink[] = [
    { name: 'Customers', href: '/dashboard/customers', icon: 'customers', description: 'Manage your customers' },
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: 'workOrders', description: 'Manage work orders and tasks' },
    { name: 'Invoices', href: '/dashboard/invoices', icon: 'invoices', description: 'Track and manage invoices' },
    { name: 'Reports', href: '/dashboard/reports', icon: 'reports', description: 'View company reports and analytics' },
    { name: 'Billing', href: '/dashboard/billing', icon: 'billing', description: 'Manage your subscription and billing' },
  ];

  let links: NavLink[] = [];
  let title = '';
  let description = '';
  let icon: keyof typeof iconMap = 'dashboard';
  let color = 'text-primary';
  let bgColor = 'bg-primary/20';

  if (userExperience === UserExperience.TEAM_MANAGER) {
    links = [...baseLinks, ...teamManagerLinks];
    title = 'Team Manager';
    description = 'Overview of your team and operations';
    icon = 'team';
    color = 'text-blue-500';
    bgColor = 'bg-blue-500/20';
  } else if (userExperience === UserExperience.FIELD_WORKER) {
    links = [...baseLinks, ...fieldWorkerLinks];
    title = 'Field Worker';
    description = 'Overview of your assigned tasks';
    icon = 'workOrders';
    color = 'text-green-500';
    bgColor = 'bg-green-500/20';
  } else if (userExperience === UserExperience.SOLO_OPERATOR) {
    links = [...baseLinks, ...soloOperatorLinks];
    title = 'Solo Operator';
    description = 'Overview of your business operations';
    icon = 'solo';
    color = 'text-purple-500';
    bgColor = 'bg-purple-500/20';
  } else if (userExperience === UserExperience.CLIENT) {
    links = [
      { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', description: 'Overview of your services' },
      { name: 'Work Orders', href: '/dashboard/work-orders', icon: 'workOrders', description: 'View your work orders' },
      { name: 'Invoices', href: '/dashboard/invoices', icon: 'invoices', description: 'View your invoices' },
    ];
    title = 'Client Portal';
    description = 'Manage your services and account';
    icon = 'client';
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500/20';
  }

  return {
    title,
    description,
    icon,
    color,
    bgColor,
    links,
  };
};
