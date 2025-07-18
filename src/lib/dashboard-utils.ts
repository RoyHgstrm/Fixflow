import { User, Shield, Wrench, LayoutDashboard, Calendar, FileText, DollarSign, Settings, BarChart3, Users } from 'lucide-react';

// Helper function to get role label
export const getRoleLabel = (role: string) => {
  switch (role.toUpperCase()) {
  case 'OWNER':
    return 'Owner';
  case 'MANAGER':
    return 'Manager';
  case 'EMPLOYEE':
    return 'Employee';
  case 'ADMIN':
    return 'Administrator';
  case 'TECHNICIAN':
    return 'Technician';
  case 'CLIENT':
    return 'Client';
  default:
    return 'User';
  }
};

// Role-based navigation configuration
export const getNavConfig = (userRole: string, company?: any) => {
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

  const experience = getUserExperience(userRole);
  const planType = company?.planType || 'SOLO';
  const isSoloPlan = planType === 'SOLO';

  const baseConfig = {
    SOLO_OPERATOR: {
      title: 'My Business',
      description: 'Your personal dashboard',
      icon: User,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      // Bare minimum - just schedule and tasks
      links: [
        { 
          name: 'Today', 
          href: '/dashboard', 
          icon: LayoutDashboard, 
          description: 'Your tasks today',
          primary: true 
        },
        { 
          name: 'Schedule', 
          href: '/dashboard/schedule', 
          icon: Calendar, 
          description: 'Your upcoming jobs',
          primary: true 
        },
        { 
          name: 'Customers', 
          href: '/dashboard/customers', 
          icon: Users, 
          description: 'Your customers',
          primary: false 
        },
        { 
          name: 'Income', 
          href: '/dashboard/invoices', 
          icon: DollarSign, 
          description: 'Track your earnings',
          primary: false 
        },
        { 
          name: 'Billing', 
          href: '/dashboard/billing', 
          icon: DollarSign, 
          description: 'Manage your subscription',
          primary: false 
        }
      ]
    },
    FIELD_WORKER: {
      title: 'My Work',
      description: 'Your daily tasks and schedule',
      icon: Wrench,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      // Just today's jobs - simple and focused
      links: [
        { 
          name: 'Today', 
          href: '/dashboard', 
          icon: LayoutDashboard, 
          description: 'Your jobs today',
          primary: true 
        },
        { 
          name: 'My Jobs', 
          href: '/dashboard/work-orders', 
          icon: FileText, 
          description: 'All assigned tasks',
          primary: true 
        },
        { 
          name: 'Schedule', 
          href: '/dashboard/schedule', 
          icon: Calendar, 
          description: 'Your work schedule',
          primary: false 
        }
      ]
    },
    TEAM_MANAGER: {
      title: isSoloPlan ? 'My Business' : 'Team Dashboard',
      description: isSoloPlan ? 'Your personal dashboard' : 'Manage your team and operations',
      icon: isSoloPlan ? User : Shield,
      color: isSoloPlan ? 'text-primary' : 'text-blue-500',
      bgColor: isSoloPlan ? 'bg-primary/10' : 'bg-blue-500/10',
      // Full control panel, filtered by plan
      links: [
        { 
          name: 'Dashboard', 
          href: '/dashboard', 
          icon: LayoutDashboard, 
          description: isSoloPlan ? 'Your overview' : 'Team overview',
          primary: true 
        },
        { 
          name: 'Work Orders', 
          href: '/dashboard/work-orders', 
          icon: FileText, 
          description: 'All work orders',
          primary: true 
        },
        { 
          name: 'Schedule', 
          href: '/dashboard/schedule', 
          icon: Calendar, 
          description: isSoloPlan ? 'Your scheduling' : 'Team scheduling',
          primary: true 
        },
        { 
          name: 'Customers', 
          href: '/dashboard/customers', 
          icon: Users, 
          description: 'Customer management',
          primary: true 
        },
        // Only show Team link for non-SOLO plans
        ...(isSoloPlan ? [] : [{ 
          name: 'Team', 
          href: '/dashboard/team', 
          icon: Users, 
          description: 'Team management',
          primary: true 
        }]),
        { 
          name: 'Invoices', 
          href: '/dashboard/invoices', 
          icon: DollarSign, 
          description: 'Billing & invoices',
          primary: false 
        },
        { 
          name: 'Billing', 
          href: '/dashboard/billing', 
          icon: DollarSign, 
          description: 'Manage subscription',
          primary: false 
        },
        { 
          name: 'Reports', 
          href: '/dashboard/reports', 
          icon: BarChart3, 
          description: 'Business insights',
          primary: false 
        },
        { 
          name: 'Settings', 
          href: '/dashboard/settings', 
          icon: Settings, 
          description: 'System settings',
          primary: userRole === 'OWNER', // Make primary if user is owner
        }
      ]
    }
  };

  return baseConfig[experience] || baseConfig.SOLO_OPERATOR;
};

export const sidebarVariants = {
  open: { 
    width: '280px',
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  },
  closed: { 
    width: '80px',
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 }
  }
};

export const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  },
};

export const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.6, -0.05, 0.01, 0.99] as const,
    },
  }),
};